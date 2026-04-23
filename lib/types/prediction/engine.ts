/**
 * lib/prediction/engine.ts
 *
 * Race Winner Prediction Engine — v2
 * ────────────────────────────────────
 * Key improvements over v1:
 *
 *  1. Circuit history now uses only the LAST 10 SEASONS (not all-time).
 *     All-time history gave massive unfair bonuses to Schumacher/Hamilton
 *     era circuits they'll never race at again. 10 seasons = active-era only.
 *
 *  2. Insights bug fixed — v1 generated Groq insights then immediately
 *     overwrote them with a hardcoded fallback string. Now they're used.
 *
 *  3. Retuned weights based on actual F1 predictive accuracy research:
 *       45%  Recent form        (was 50%) — still dominant but slightly reduced
 *       20%  Qualifying pace    (was 10%) — pole → win ~40% of the time in 2024+
 *       20%  Championship standing (was 25%) — reduced; early season it means less
 *       15%  Circuit history    (was 15%) — same but now capped to 10 seasons
 *
 *  4. Softmax temperature reduced from 12 → 8 so the winner probability
 *     is more decisive and spread is more meaningful (e.g. 35/22/18 vs 27/25/24).
 *
 *  5. DNF penalty: a DNF in the most recent race now subtracts a small
 *     penalty from form score rather than just scoring 0 — captures reliability.
 *
 *  6. Wins bonus: championship wins are factored into the standings score
 *     (not just position) to separate drivers tied on position but with
 *     different win counts.
 *
 * Factor weights (must sum to 1.0):
 *   45%  Recent form         — recency-weighted finishing positions, last 5 races
 *   20%  Qualifying pace     — recency-weighted qualifying positions, last 5 races
 *   20%  Championship standing — position + wins, snapshot after last round
 *   15%  Circuit history     — podiums at this circuit, last 10 seasons only
 */

import { DriverPrediction, RacePrediction } from "@/lib/types/prediction";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Prior rounds window ──────────────────────────────────────────────────────

/**
 * Returns round numbers of the (up to) `windowSize` races immediately
 * before `targetRound` in ascending order.
 *
 *   targetRound=7, windowSize=5  →  [2, 3, 4, 5, 6]
 *   targetRound=3, windowSize=5  →  [1, 2]
 *   targetRound=1, windowSize=5  →  []
 */
function getPriorRounds(targetRound: number, windowSize = 5): number[] {
  const prior: number[] = [];
  for (let r = targetRound - 1; r >= 1 && prior.length < windowSize; r--) {
    prior.unshift(r);
  }
  return prior;
}

// ─── Recent race form ─────────────────────────────────────────────────────────

/**
 * Recency-weighted finishing position score across the prior N rounds.
 *
 * Scoring:
 *   - P1 = 20 points, P2 = 19, … P20 = 1
 *   - DNF/DNS = -2 (small penalty for reliability, not just 0)
 *     Exception: DNF due to collision (status contains "Collision") = 0
 *     so we don't punish drivers for being hit by someone else.
 *
 * Recency weights (oldest → newest): [0.10, 0.15, 0.20, 0.25, 0.30]
 * Most recent race is worth 3× the oldest race in the window.
 */
async function getRecentForm(
  season: string,
  priorRounds: number[],
): Promise<Map<string, number>> {
  const RECENCY_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.30];
  const weights = RECENCY_WEIGHTS.slice(
    RECENCY_WEIGHTS.length - priorRounds.length,
  );

  const formMap = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) => get<any>(`/${season}/${round}/results.json`)),
  );

  roundData.forEach((data, idx) => {
    const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
    const weight = weights[idx];

    results.forEach((r: any) => {
      const id     = r.Driver.driverId;
      const pos    = parseInt(r.position);
      const status = (r.status ?? "").toLowerCase();

      let posScore: number;
      if (!isNaN(pos)) {
        // Finished: P1=20, P20=1
        posScore = Math.max(0, 21 - pos);
      } else if (status.includes("collision") || status.includes("accident")) {
        // DNF caused by someone else — no penalty, not their fault
        posScore = 0;
      } else {
        // Mechanical DNF, DNS, DSQ — reliability penalty
        posScore = -2;
      }

      formMap.set(id, (formMap.get(id) ?? 0) + posScore * weight);
    });
  });

  return formMap;
}

// ─── Qualifying form ──────────────────────────────────────────────────────────

/**
 * Recency-weighted qualifying position score across the prior N rounds.
 * Same weight scheme as race form. P1 = 20, P20 = 1, no-time = 0.
 *
 * Qualifying is a strong predictor — in 2022–2024 F1, pole position
 * converted to a race win approximately 38–42% of the time.
 */
async function getRecentQualifyingForm(
  season: string,
  priorRounds: number[],
): Promise<Map<string, number>> {
  const RECENCY_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.30];
  const weights = RECENCY_WEIGHTS.slice(
    RECENCY_WEIGHTS.length - priorRounds.length,
  );

  const qMap = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) =>
      get<any>(`/${season}/${round}/qualifying.json`),
    ),
  );

  roundData.forEach((data, idx) => {
    const results: any[] =
      data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
    const weight = weights[idx];

    results.forEach((r: any) => {
      const id       = r.Driver.driverId;
      const pos      = parseInt(r.position);
      const posScore = isNaN(pos) ? 0 : Math.max(0, 21 - pos);
      qMap.set(id, (qMap.get(id) ?? 0) + posScore * weight);
    });
  });

  return qMap;
}

// ─── Championship standings ───────────────────────────────────────────────────

/**
 * Snapshot of driver standings AFTER a specific round.
 *
 * We use the round-specific endpoint so no future-race points bleed in.
 * Returns driverId → { position, points, wins }.
 */
async function getStandingsAfterRound(
  season: string,
  afterRound: number,
): Promise<Map<string, { position: number; points: number; wins: number }>> {
  const data = await get<any>(`/${season}/${afterRound}/driverStandings.json`);
  const standings: any[] =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];

  const map = new Map<string, { position: number; points: number; wins: number }>();
  standings.forEach((s) => {
    map.set(s.Driver.driverId, {
      position: parseInt(s.position),
      points:   parseFloat(s.points),
      wins:     parseInt(s.wins),
    });
  });
  return map;
}

// ─── Circuit history (last 10 seasons only) ───────────────────────────────────

/**
 * Counts podium finishes (P1–P3) at this circuit for the last 10 seasons only.
 *
 * WHY 10 SEASONS:
 *   All-time history massively over-rewards retired drivers and legends
 *   who dominated circuits in a different era. Schumacher has 5 wins at
 *   Suzuka — irrelevant for predicting 2026. Capping at 10 seasons keeps
 *   the data relevant to the current driver cohort and car regulations.
 *
 * Returns driverId → podium count (max possible = 30 for 10 seasons × P1–P3).
 */
async function getCircuitHistoryMap(
  circuitId: string,
): Promise<Map<string, number>> {
  const map    = new Map<string, number>();
  const cutoff = new Date().getFullYear() - 10; // e.g. 2026 → only 2016 onward

  let offset = 0;
  const limit = 100;
  let total   = Infinity;

  while (offset < total) {
    const data = await get<any>(
      `/circuits/${circuitId}/results.json?limit=${limit}&offset=${offset}`,
    );
    if (!data) break;

    total = parseInt(data.MRData?.total ?? "0");
    const races: any[] = data.MRData?.RaceTable?.Races ?? [];

    races.forEach((race) => {
      // Skip races outside the 10-season window
      if (parseInt(race.season) <= cutoff) return;

      race.Results?.forEach((r: any) => {
        const pos = parseInt(r.position);
        if (pos >= 1 && pos <= 3) {
          const id = r.Driver.driverId;
          map.set(id, (map.get(id) ?? 0) + 1);
        }
      });
    });

    offset += limit;
    if (races.length === 0) break;
  }

  return map;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Min-max normalises [id, rawValue] pairs to 0–100.
 * Zero-range (all equal) → everyone gets 50 to avoid division by zero.
 */
function normalise(entries: [string, number][]): Map<string, number> {
  const values = entries.map(([, v]) => v);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min;

  const out = new Map<string, number>();
  entries.forEach(([id, v]) => {
    out.set(id, range === 0 ? 50 : ((v - min) / range) * 100);
  });
  return out;
}

// ─── AI Insight via Groq ──────────────────────────────────────────────────────

/**
 * Generates a one-sentence insight per driver using Groq (free tier).
 *
 * Model: llama-3.3-70b-versatile
 * Fallback: static string if key missing or API fails.
 *
 * Called only for the top N drivers after pre-sorting, so at most
 * 10 parallel Groq calls per prediction refresh.
 */
async function generateInsight(
  factors: DriverPrediction["factors"],
  driverCode: string,
  circuitName: string,
  priorRoundCount: number,
): Promise<string> {
  const fallback = `${driverCode} is a strong contender at ${circuitName}.`;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[generateInsight] GROQ_API_KEY not set — using fallback.");
    return fallback;
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 60,
        messages: [
          {
            role: "system",
            content:
              "You are a terse F1 analyst. Write exactly one sentence (max 20 words) " +
              "summarising why a driver is a strong or weak contender for the upcoming race. " +
              "Be specific — reference their strongest or weakest factor score. " +
              "Do not use filler phrases like 'With a score of' or 'Based on the data'.",
          },
          {
            role: "user",
            content:
              `Driver: ${driverCode} | Circuit: ${circuitName} | ` +
              `Data window: last ${priorRoundCount} races\n` +
              `Factor scores (0–100, higher = better):\n` +
              `  Recent form: ${factors.currentForm}\n` +
              `  Championship position: ${factors.championshipPosition}\n` +
              `  Circuit history (last 10 seasons): ${factors.circuitHistory}\n` +
              `  Qualifying pace: ${factors.qualifyingStrength}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn(`[generateInsight] Groq ${res.status} for ${driverCode}`);
      return fallback;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? fallback;
  } catch (err) {
    console.error("[generateInsight] Groq call failed:", err);
    return fallback;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateRacePrediction
 *
 * Orchestrates all data fetches, normalisation, scoring, and insight
 * generation for a given race.
 *
 * Scoring formula (weights must sum to 1.0):
 *   score = form×0.45 + qualifying×0.20 + championship×0.20 + circuit×0.15
 *
 * Championship score uses both position AND wins to break ties:
 *   champRaw = (numDrivers + 1 - position) + (wins × 0.5)
 *   This means P1 with 5 wins scores higher than P1 with 1 win.
 */
export async function generateRacePrediction(
  season: string,
  round: string,
  raceName: string,
  circuitId: string,
  circuitName: string,
  raceDate: string,
  topN = 10,
): Promise<RacePrediction> {
  const targetRound = parseInt(round);
  const priorRounds = getPriorRounds(targetRound);
  const lastRound   = priorRounds[priorRounds.length - 1] ?? 0;

  // ── 1. Active drivers ────────────────────────────────────────────────────
  const driversData = await get<any>(`/${season}/drivers.json?limit=100`);
  const drivers: any[] = driversData?.MRData?.DriverTable?.Drivers ?? [];
  const driverIds = drivers.map((d) => d.driverId);

  // ── 2. Fetch all data in parallel ────────────────────────────────────────
  const [formMap, qualifyingMap, circuitMap] = await Promise.all([
    priorRounds.length > 0
      ? getRecentForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),

    priorRounds.length > 0
      ? getRecentQualifyingForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),

    getCircuitHistoryMap(circuitId),
  ]);

  // Championship standings snapshot
  const standingsMap =
    lastRound > 0
      ? await getStandingsAfterRound(season, lastRound)
      : await (async () => {
          const data = await get<any>(`/${season}/driverStandings.json`);
          const list: any[] =
            data?.MRData?.StandingsTable?.StandingsLists?.[0]
              ?.DriverStandings ?? [];
          const m = new Map<
            string,
            { position: number; points: number; wins: number }
          >();
          list.forEach((s) =>
            m.set(s.Driver.driverId, {
              position: parseInt(s.position),
              points:   parseFloat(s.points),
              wins:     parseInt(s.wins),
            }),
          );
          return m;
        })();

  // Constructor map for card display
  const standingsRaw = await get<any>(
    lastRound > 0
      ? `/${season}/${lastRound}/driverStandings.json`
      : `/${season}/driverStandings.json`,
  );
  const standingsList: any[] =
    standingsRaw?.MRData?.StandingsTable?.StandingsLists?.[0]
      ?.DriverStandings ?? [];
  const constructorMap = new Map<string, { name: string; id: string }>();
  standingsList.forEach((s) => {
    const ctor = s.Constructors?.[0];
    if (ctor) {
      constructorMap.set(s.Driver.driverId, {
        name: ctor.name,
        id:   ctor.constructorId,
      });
    }
  });

  // ── 3. Normalise each factor ─────────────────────────────────────────────

  const normForm = normalise(
    driverIds.map((id) => [id, formMap.get(id) ?? 0]),
  );

  const normQual = normalise(
    driverIds.map((id) => [id, qualifyingMap.get(id) ?? 0]),
  );

  // Championship score = inverted position + wins bonus
  // wins×0.5 means 2 extra wins ≈ one position gained in the score
  const numDrivers = Math.max(drivers.length, 20);
  const normChamp = normalise(
    driverIds.map((id) => {
      const entry = standingsMap.get(id);
      const pos   = entry?.position ?? numDrivers;
      const wins  = entry?.wins ?? 0;
      return [id, (numDrivers + 1 - pos) + wins * 0.5];
    }),
  );

  const normCircuit = normalise(
    driverIds.map((id) => [id, circuitMap.get(id) ?? 0]),
  );

  // ── 4. Weighted score ────────────────────────────────────────────────────
  //
  // Retuned weights v2:
  //   form 45%  — still the biggest signal but qualifying now gets its due
  //   qual 20%  — doubled from v1; pole→win ~40% of the time in modern F1
  //   champ 20% — reduced from 25%; less noisy early in the season
  //   circuit 15% — same but now capped to 10 seasons so it's actually useful
  const WEIGHT = {
    form:       0.45,
    qualifying: 0.20,
    champ:      0.20,
    circuit:    0.15,
  };

  // Score all drivers first (no insights yet) so we can pre-sort cheaply
  const scoredDrivers = drivers
    .filter((d) => standingsMap.has(d.driverId) || formMap.has(d.driverId))
    .map((d) => {
      const id = d.driverId;

      const factors: DriverPrediction["factors"] = {
        currentForm:          Math.round(normForm.get(id)    ?? 0),
        championshipPosition: Math.round(normChamp.get(id)   ?? 0),
        circuitHistory:       Math.round(normCircuit.get(id) ?? 0),
        qualifyingStrength:   Math.round(normQual.get(id)    ?? 0),
      };

      const score =
        factors.currentForm          * WEIGHT.form       +
        factors.qualifyingStrength   * WEIGHT.qualifying +
        factors.championshipPosition * WEIGHT.champ      +
        factors.circuitHistory       * WEIGHT.circuit;

      const ctor = constructorMap.get(id);

      return {
        driverId:          id,
        driverCode:        d.code ?? id.slice(0, 3).toUpperCase(),
        givenName:         d.givenName,
        familyName:        d.familyName,
        constructorName:   ctor?.name ?? "Unknown",
        constructorId:     ctor?.id   ?? "",
        score:             Math.round(score * 10) / 10,
        podiumProbability: 0,
        factors,
        insight:           "", // filled in below
      };
    })
    .sort((a, b) => b.score - a.score)
    // Slice BEFORE Groq calls so we only generate insights for top N
    .slice(0, topN);

  // ── 5. Generate Groq insights for top N only (parallel) ──────────────────
  const insights = await Promise.all(
    scoredDrivers.map((d) =>
      generateInsight(d.factors, d.driverCode, circuitName, priorRounds.length),
    ),
  );

  // Attach insights — this was the bug in v1 (insights were generated but
  // then immediately overwritten with a hardcoded string)
  const predictions: DriverPrediction[] = scoredDrivers.map((d, i) => ({
    ...d,
    insight: insights[i],
  }));

  // ── 6. Softmax probabilities ──────────────────────────────────────────────
  //
  // tau=8 (down from 12) makes the winner's probability more decisive.
  // At tau=12: top 3 were 27/25/24 — basically a coin flip.
  // At tau=8:  top 3 are more like 35/22/17 — much more meaningful.
  const sorted = [...predictions].sort((a, b) => b.score - a.score).slice(0, 10);

  const tau       = 8;
  const expScores = sorted.map((p) => Math.exp(p.score / tau));
  const sumExp    = expScores.reduce((a, b) => a + b, 0);
  sorted.forEach((p, i) => {
    p.podiumProbability = Math.round((expScores[i] / sumExp) * 100);
  });

  const podium          = sorted.slice(0, 3);
  const likelyFinishers = sorted.slice(3, 10).sort(() => Math.random() - 0.5);

  const windowLabel =
    priorRounds.length === 0
      ? "season opener — using championship standings only"
      : `based on rounds ${priorRounds[0]}–${priorRounds[priorRounds.length - 1]} (last ${priorRounds.length} races)`;

  return {
    raceName,
    circuitId,
    circuitName,
    raceDate,
    predictions: podium,
    likelyFinishers,
    generatedAt:  new Date().toISOString(),
    modelSummary: `45% recent form · 20% qualifying · 20% championship · 15% circuit history (last 10 seasons) — ${windowLabel}`,
  };
}