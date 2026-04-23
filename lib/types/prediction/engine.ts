/**
 * lib/prediction/engine.ts
 *
 * Race Winner Prediction Engine
 * ─────────────────────────────
 * Predicts the finishing order for a given upcoming race using the
 * 5 rounds immediately preceding it as the data window.
 *
 * Why "5 rounds before the target round" instead of "last 5 calendar dates"?
 *   - Date-based filtering breaks when the season hasn't started yet or
 *     when there's a long gap between races.
 *   - Anchoring to round numbers is deterministic and reproducible: if the
 *     next race is round 7, the model always uses rounds 2–6 exactly.
 *
 * Factor weights (must sum to 1.0):
 *   50%  Recent form         — finishing positions across the 5 prior races,
 *                              recency-weighted so the latest race counts most
 *   25%  Championship points — standings after the last completed round
 *   15%  Circuit history     — all-time podium finishes at this circuit
 *   10%  Qualifying pace     — qualifying positions across those same 5 races
 *
 * All sub-scores are min-max normalised to 0–100 before weighting.
 */

import { DriverPrediction, RacePrediction } from "@/lib/types/prediction";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: 600 }, // cache for 10 minutes server-side
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Determine the N rounds before a given target round ──────────────────────

/**
 * Returns the round numbers of the (up to) `windowSize` races that were
 * completed immediately before `targetRound`.
 *
 * Examples:
 *   targetRound=7, windowSize=5  →  [2, 3, 4, 5, 6]
 *   targetRound=3, windowSize=5  →  [1, 2]      (only 2 prior rounds exist)
 *   targetRound=1, windowSize=5  →  []           (season opener, no prior data)
 */
function getPriorRounds(targetRound: number, windowSize: number = 5): number[] {
  const prior: number[] = [];
  for (let r = targetRound - 1; r >= 1 && prior.length < windowSize; r--) {
    prior.unshift(r); // keep ascending order: [oldest … most recent]
  }
  return prior;
}

// ─── Recent race form from the prior N rounds ─────────────────────────────────

/**
 * Fetches race results for each of the prior rounds and computes a
 * recency-weighted form score per driver.
 *
 * Position score: (21 - finishPosition), so P1=20, P20=1, DNF=0.
 * Each race is multiplied by a recency weight (most recent race counts most):
 *   For a 5-race window: weights = [0.10, 0.15, 0.20, 0.25, 0.30]
 *   If fewer rounds are available, we use the tail of that array.
 *
 * Returns driverId → weighted form score.
 */
async function getRecentForm(
  season: string,
  priorRounds: number[]
): Promise<Map<string, number>> {
  // Full recency weight table for a 5-race window (oldest → newest)
  const RECENCY_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.30];
  // Slice from the end so shorter windows still use the highest weights
  const weights = RECENCY_WEIGHTS.slice(RECENCY_WEIGHTS.length - priorRounds.length);

  const formMap = new Map<string, number>();

  // Fetch all prior rounds simultaneously
  const roundData = await Promise.all(
    priorRounds.map((round) => get<any>(`/${season}/${round}/results.json`))
  );

  roundData.forEach((data, idx) => {
    const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
    const weight = weights[idx];

    results.forEach((r: any) => {
      const id       = r.Driver.driverId;
      const pos      = parseInt(r.position);
      // Convert finish position → score; NaN (DNF/DNS) → 0
      const posScore = isNaN(pos) ? 0 : Math.max(0, 21 - pos);
      formMap.set(id, (formMap.get(id) ?? 0) + posScore * weight);
    });
  });

  return formMap;
}

// ─── Qualifying form from the same prior rounds ───────────────────────────────

/**
 * Same recency-weighted scheme as getRecentForm but uses qualifying positions
 * instead of race finishing positions.
 *
 * Returns driverId → weighted qualifying score.
 */
async function getRecentQualifyingForm(
  season: string,
  priorRounds: number[]
): Promise<Map<string, number>> {
  const RECENCY_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.30];
  const weights = RECENCY_WEIGHTS.slice(RECENCY_WEIGHTS.length - priorRounds.length);

  const qMap = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) => get<any>(`/${season}/${round}/qualifying.json`))
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

// ─── Championship standings after the last completed round ────────────────────

/**
 * Fetches driver standings as they stood AFTER `afterRound`.
 *
 * Using the round-specific endpoint (/{season}/{round}/driverStandings.json)
 * rather than the season-level endpoint gives us a snapshot that exactly
 * matches the state of the championship going into the target race — no
 * points from later races bleed in.
 *
 * Returns driverId → { position, points, wins }.
 */
async function getStandingsAfterRound(
  season: string,
  afterRound: number
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

// ─── Circuit history ──────────────────────────────────────────────────────────

/**
 * Counts podium finishes (P1–P3) for every driver at this specific circuit
 * across all historical seasons. Returns driverId → podium count.
 *
 * This is paginated because some circuits (e.g. Monza) have 70+ years of data.
 */
async function getCircuitHistoryMap(
  circuitId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  let offset = 0;
  const limit = 100;
  let total = Infinity;

  while (offset < total) {
    const data = await get<any>(
      `/circuits/${circuitId}/results.json?limit=${limit}&offset=${offset}`
    );
    if (!data) break;

    total = parseInt(data.MRData?.total ?? "0");
    const races: any[] = data.MRData?.RaceTable?.Races ?? [];

    races.forEach((race) => {
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
 * If all values are equal (zero range), everyone gets 50 — avoids division by 0.
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

// ─── Insight sentence ─────────────────────────────────────────────────────────

function generateInsight(
  factors: DriverPrediction["factors"],
  driverCode: string,
  circuitName: string,
  priorRoundCount: number
): string {
  // Pick the factor with the highest normalised sub-score
  const [topFactor] = Object.entries(factors).sort(([, a], [, b]) => b - a);

  const insightMap: Record<string, string> = {
    currentForm:          `${driverCode} has been in top form across the last ${priorRoundCount} races.`,
    championshipPosition: `${driverCode}'s championship position reflects consistent season pace.`,
    circuitHistory:       `${driverCode} has a strong historical record at ${circuitName}.`,
    qualifyingStrength:   `${driverCode}'s recent qualifying pace is a key advantage going in.`,
  };

  return insightMap[topFactor[0]] ?? `${driverCode} is a strong contender at ${circuitName}.`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * generateRacePrediction
 *
 * Generates a scored, ranked prediction for the given race.
 * The data window is always the 5 rounds immediately before `round`.
 *
 * Edge cases handled:
 *   - Fewer than 5 prior rounds (early season): uses however many exist,
 *     adjusts recency weights to match.
 *   - Round 1 (season opener): no prior races — falls back to the most
 *     recent available standings only; form scores will all be 0.
 */
export async function generateRacePrediction(
  season: string,
  round: string,
  raceName: string,
  circuitId: string,
  circuitName: string,
  raceDate: string,
  topN: number = 10
): Promise<RacePrediction> {

  const targetRound = parseInt(round);
  // e.g. round 7 → priorRounds = [2, 3, 4, 5, 6]
  const priorRounds = getPriorRounds(targetRound);
  // The most recent completed round — used for standings snapshot
  const lastRound   = priorRounds[priorRounds.length - 1] ?? 0;

  // ── 1. Active drivers this season ─────────────────────────────────────────
  const driversData = await get<any>(`/${season}/drivers.json?limit=100`);
  const drivers: any[]  = driversData?.MRData?.DriverTable?.Drivers ?? [];
  const driverIds        = drivers.map((d) => d.driverId);

  // ── 2. Fetch all inputs in parallel ───────────────────────────────────────
  const [formMap, qualifyingMap, circuitMap] = await Promise.all([
    // Form and qualifying only make sense if there are prior rounds
    priorRounds.length > 0
      ? getRecentForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),

    priorRounds.length > 0
      ? getRecentQualifyingForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),

    getCircuitHistoryMap(circuitId),
  ]);

  // Standings: snapshot after last completed round, or current season if opener
  const standingsMap = lastRound > 0
    ? await getStandingsAfterRound(season, lastRound)
    : await (async () => {
        const data = await get<any>(`/${season}/driverStandings.json`);
        const list: any[] =
          data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
        const m = new Map<string, { position: number; points: number; wins: number }>();
        list.forEach((s) => m.set(s.Driver.driverId, {
          position: parseInt(s.position),
          points:   parseFloat(s.points),
          wins:     parseInt(s.wins),
        }));
        return m;
      })();

  // Constructor info for card display — extracted from the same standings response
  const standingsRaw = await get<any>(
    lastRound > 0
      ? `/${season}/${lastRound}/driverStandings.json`
      : `/${season}/driverStandings.json`
  );
  const standingsList: any[] =
    standingsRaw?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  const constructorMap = new Map<string, { name: string; id: string }>();
  standingsList.forEach((s) => {
    const ctor = s.Constructors?.[0];
    if (ctor) {
      constructorMap.set(s.Driver.driverId, { name: ctor.name, id: ctor.constructorId });
    }
  });

  // ── 3. Normalise each factor across all active drivers ────────────────────

  const normForm = normalise(
    driverIds.map((id) => [id, formMap.get(id) ?? 0])
  );

  const normQual = normalise(
    driverIds.map((id) => [id, qualifyingMap.get(id) ?? 0])
  );

  // Invert championship position: P1 in standings → highest score
  const numDrivers = Math.max(drivers.length, 20);
  const normChamp  = normalise(
    driverIds.map((id) => {
      const pos = standingsMap.get(id)?.position ?? numDrivers;
      return [id, numDrivers + 1 - pos]; // higher standing → higher score
    })
  );

  const normCircuit = normalise(
    driverIds.map((id) => [id, circuitMap.get(id) ?? 0])
  );

  // ── 4. Weighted final score ────────────────────────────────────────────────
  const WEIGHT = {
    form:       0.50,
    champ:      0.25,
    circuit:    0.15,
    qualifying: 0.10,
  };

  const predictions: DriverPrediction[] = drivers
    // Keep drivers that have either standings data or recent form data
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
        factors.currentForm          * WEIGHT.form      +
        factors.championshipPosition * WEIGHT.champ     +
        factors.circuitHistory       * WEIGHT.circuit   +
        factors.qualifyingStrength   * WEIGHT.qualifying;

      const ctor = constructorMap.get(id);

      return {
        driverId:          id,
        driverCode:        d.code ?? id.slice(0, 3).toUpperCase(),
        givenName:         d.givenName,
        familyName:        d.familyName,
        constructorName:   ctor?.name ?? "Unknown",
        constructorId:     ctor?.id   ?? "",
        score:             Math.round(score * 10) / 10,
        podiumProbability: 0, // filled in below after sorting
        factors,
        insight: generateInsight(factors, d.code ?? id, circuitName, priorRounds.length),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // ── 5. Softmax probabilities over the top-N scores ────────────────────────
const sorted = [...predictions].sort((a, b) => b.score - a.score).slice(0, 10);

  const tau       = 12;
  const expScores = sorted.map((p) => Math.exp(p.score / tau));
  const sumExp    = expScores.reduce((a, b) => a + b, 0);
  sorted.forEach((p, i) => {
    p.podiumProbability = Math.round((expScores[i] / sumExp) * 100);
  });

  const podium         = sorted.slice(0, 3);
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
    generatedAt: new Date().toISOString(),
    modelSummary:
      `50% recent form · 25% championship · 15% circuit history · 10% qualifying pace — ${windowLabel}`,
  };
}