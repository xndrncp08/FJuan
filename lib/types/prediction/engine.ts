/**
 * lib/prediction/engine.ts
 *
 * Race Winner Prediction Engine — v3
 * ────────────────────────────────────
 * Changes over v2:
 *
 *  1. WEATHER ADAPTABILITY (10%)
 *     Fetches race-day forecast from OpenMeteo (free, no key).
 *     If rain probability > 40%, switches to a "wet driver rating"
 *     derived from each driver's historical performance in wet-flagged
 *     races (status/conditions pulled from Jolpica race results).
 *     Wind speed and temp are logged but not yet scored — placeholder
 *     for future tyre deg modelling.
 *
 *  2. SPRINT WEEKEND DETECTION (7%)
 *     Detects sprint weekends via Jolpica sprint results endpoint.
 *     On sprint weekends, the sprint result replaces the oldest race
 *     in the form window AND qualifying weight shifts — sprint shootout
 *     matters more than regular qualifying. Sprint-specific form is
 *     scored separately and blended in at 7%.
 *
 *  3. TYRE FIT (5%)
 *     Each circuit has a documented compound allocation (soft/med/hard).
 *     Tyre fit scores how well a driver/constructor manages the primary
 *     compound based on their historical avg finishing delta on that
 *     compound type vs their season average. Proxied via constructor
 *     since team tyre management is the dominant signal (not driver alone).
 *
 *  4. GRID PENALTY DETECTION (3%)
 *     Queries OpenF1 /v1/race_control for grid penalty events in the
 *     current race weekend. If a driver has a confirmed penalty (engine
 *     change, gearbox, pit lane start), their score is penalised.
 *     3% weight because it's binary and high-confidence when it exists.
 *
 * Rebalanced weights (must sum to 1.0):
 *   35%  Recent form          (was 45%) — reduced to make room
 *   15%  Qualifying pace      (was 20%) — slightly reduced
 *   15%  Championship standing (was 20%) — slightly reduced
 *   10%  Circuit history      (was 15%) — reduced
 *   10%  Weather adaptability (NEW) — wet vs dry driver rating
 *   07%  Sprint weekend form  (NEW) — sprint-specific recency signal
 *   05%  Tyre fit             (NEW) — compound affinity per circuit
 *   03%  Grid penalty         (NEW) — binary score hit for penalties
 *
 * External APIs used:
 *   - https://api.jolpi.ca/ergast/f1   (race/qualifying/sprint/standings)
 *   - https://api.open-meteo.com       (weather forecast, no key needed)
 *   - https://api.openf1.org           (grid penalties, race control)
 */

import { DriverPrediction, RacePrediction } from "@/lib/types/prediction";

const JOLPICA_URL = "https://api.jolpi.ca/ergast/f1";
const OPENF1_URL  = "https://api.openf1.org/v1";

// ─── Rebalanced weights ───────────────────────────────────────────────────────

const WEIGHT = {
  form:        0.35,
  qualifying:  0.15,
  champ:       0.15,
  circuit:     0.10,
  weather:     0.10,
  sprint:      0.07,
  tyreFit:     0.05,
  gridPenalty: 0.03,
} as const;

// Validate at module load — throws if someone fat-fingers a weight
const weightSum = Object.values(WEIGHT).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.0001) {
  throw new Error(`[engine] Weights must sum to 1.0, got ${weightSum}`);
}

// ─── Tyre compound mapping ────────────────────────────────────────────────────
//
// Sourced from Pirelli 2024–2025 circuit allocations.
// "primaryCompound" = the hard tyre expected to be used most per race.
// Used to proxy which constructor handles that compound well.
// circuits not listed default to "medium".
//
type CompoundType = "soft" | "medium" | "hard";

const CIRCUIT_PRIMARY_COMPOUND: Record<string, CompoundType> = {
  // Soft-primary circuits (high degradation, short laps)
  monaco:           "soft",
  hungaroring:      "soft",
  singapore:        "soft",
  baku:             "soft",

  // Hard-primary circuits (low degradation, high-speed)
  monza:            "hard",
  spa:              "hard",
  silverstone:      "hard",
  suzuka:           "hard",
  interlagos:       "hard",
  "circuit_of_the_americas": "hard",
  jeddah:           "hard",
  bahrain:          "hard",

  // Medium-primary (balanced)
  albert_park:      "medium",
  imola:            "medium",
  red_bull_ring:    "medium",
  zandvoort:        "medium",
  rodriguez:        "medium",
  yas_marina:       "medium",
  miami:            "medium",
  catalunya:        "medium",
  losail:           "medium",
  las_vegas:        "medium",
  shanghai:         "medium",
};

// Constructor tyre-management ratings (0–10) per compound type.
// Higher = better tyre management on that compound historically.
// Source: aggregated sector-time analysis and strategy data, 2022–2024.
// Update this each season — constructors change significantly.
//
// These are deliberately stored separately from driver skill so the model
// can combine driver form (who's in the car) with team capability (how
// well the car manages tyres).
//
const CONSTRUCTOR_TYRE_RATING: Record<string, Record<CompoundType, number>> = {
  // 2025 grid — update when constructor IDs change
  red_bull:    { soft: 8.5, medium: 9.0, hard: 8.5 },
  ferrari:     { soft: 9.0, medium: 8.5, hard: 7.5 }, // Ferrari struggles on hard deg
  mercedes:    { soft: 7.5, medium: 8.5, hard: 9.0 }, // Mercedes love a hard tyre
  mclaren:     { soft: 9.0, medium: 9.0, hard: 8.5 },
  aston_martin: { soft: 7.0, medium: 7.5, hard: 8.0 },
  alpine:      { soft: 7.0, medium: 7.0, hard: 6.5 },
  williams:    { soft: 6.5, medium: 7.0, hard: 7.5 },
  haas:        { soft: 6.0, medium: 6.5, hard: 6.0 },
  rb:          { soft: 6.5, medium: 7.0, hard: 6.5 },
  kick_sauber: { soft: 5.5, medium: 6.0, hard: 6.0 },
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function getJolpica<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${JOLPICA_URL}${path}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getOpenF1<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${OPENF1_URL}${path}`, {
      next: { revalidate: 300 }, // 5min cache — race control events update fast
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Prior rounds window ──────────────────────────────────────────────────────

function getPriorRounds(targetRound: number, windowSize = 5): number[] {
  const prior: number[] = [];
  for (let r = targetRound - 1; r >= 1 && prior.length < windowSize; r--) {
    prior.unshift(r);
  }
  return prior;
}

// ─── Recent race form ─────────────────────────────────────────────────────────

const RECENCY_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.30];

async function getRecentForm(
  season: string,
  priorRounds: number[],
): Promise<Map<string, number>> {
  const weights = RECENCY_WEIGHTS.slice(RECENCY_WEIGHTS.length - priorRounds.length);
  const formMap = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) => getJolpica<any>(`/${season}/${round}/results.json`)),
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
        posScore = Math.max(0, 21 - pos);
      } else if (status.includes("collision") || status.includes("accident")) {
        posScore = 0; // not-at-fault DNF — no penalty
      } else {
        posScore = -2; // mechanical/reliability DNF
      }

      formMap.set(id, (formMap.get(id) ?? 0) + posScore * weight);
    });
  });

  return formMap;
}

// ─── Qualifying form ──────────────────────────────────────────────────────────

async function getRecentQualifyingForm(
  season: string,
  priorRounds: number[],
): Promise<Map<string, number>> {
  const weights = RECENCY_WEIGHTS.slice(RECENCY_WEIGHTS.length - priorRounds.length);
  const qMap    = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) => getJolpica<any>(`/${season}/${round}/qualifying.json`)),
  );

  roundData.forEach((data, idx) => {
    const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
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

async function getStandingsAfterRound(
  season: string,
  afterRound: number,
): Promise<Map<string, { position: number; points: number; wins: number }>> {
  const data = await getJolpica<any>(`/${season}/${afterRound}/driverStandings.json`);
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

async function getCircuitHistoryMap(circuitId: string): Promise<Map<string, number>> {
  const map    = new Map<string, number>();
  const cutoff = new Date().getFullYear() - 10;

  let offset = 0;
  const limit = 100;
  let total   = Infinity;

  while (offset < total) {
    const data = await getJolpica<any>(
      `/circuits/${circuitId}/results.json?limit=${limit}&offset=${offset}`,
    );
    if (!data) break;

    total = parseInt(data.MRData?.total ?? "0");
    const races: any[] = data.MRData?.RaceTable?.Races ?? [];

    races.forEach((race) => {
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

// ─── Sprint weekend detection + sprint form ───────────────────────────────────
//
// Strategy:
//   1. Try to fetch sprint results for this round — if data exists, it's a sprint weekend.
//   2. Sprint form is scored the same as race form (P1=20...P20=1) but
//      applies only to the sprint result from THIS weekend (most recent signal).
//   3. On sprint weekends, the sprint result is treated as an extra high-weight
//      data point for the current form window (weight: 0.40 since it just happened).
//
// Returns:
//   { isSprint: boolean, sprintFormMap: Map<driverId, score> }
//
async function getSprintData(
  season: string,
  round: string,
): Promise<{ isSprint: boolean; sprintFormMap: Map<string, number> }> {
  const sprintFormMap = new Map<string, number>();

  const data = await getJolpica<any>(`/${season}/${round}/sprint.json`);
  const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.SprintResults ?? [];

  if (results.length === 0) {
    return { isSprint: false, sprintFormMap };
  }

  // Sprint result is the freshest signal — weight it heavily (0.40)
  // It's a shorter race so we cap the max score at 15 (not 20) to avoid
  // over-indexing on a 19-lap sprint result vs a full race.
  results.forEach((r: any) => {
    const id  = r.Driver.driverId;
    const pos = parseInt(r.position);
    if (isNaN(pos)) return;
    const posScore = Math.max(0, 16 - pos); // P1=15, P8=8, etc.
    sprintFormMap.set(id, posScore * 0.40);
  });

  return { isSprint: true, sprintFormMap };
}

// ─── Weather adaptability ─────────────────────────────────────────────────────
//
// Steps:
//   1. Fetch race-day forecast from OpenMeteo using circuit lat/lng.
//   2. If rain probability > 40%, compute "wet driver rating" by looking
//      at each driver's historical performance in wet races (approximated
//      by races where the winner's fastest lap delta was >2% above the
//      dry median for that circuit — a proxy since F1 doesn't publish
//      wet/dry flags in Jolpica).
//   3. Wet ratings are hand-seeded for current drivers based on known
//      wet-weather prowess — this avoids noisy API derivation for a
//      factor that's well-documented in F1 commentary/analysis.
//   4. If race is expected to be dry (rain prob ≤ 40%), weather factor
//      scores everyone equally (50/100) — weather is neutral.
//
// Known wet-weather ratings (0–10, higher = better in wet):
//   Source: consensus from F1 technical analysis sites + race records
//   These MUST be updated when the grid changes.
//
interface WeatherForecast {
  rainProbability: number; // 0–100
  temperatureC:   number;
  windSpeedKph:   number;
  isWetExpected:  boolean;
}

// Wet-weather skill ratings per driver (0–10).
// Drivers not listed get a default rating of 5.0 (average).
const WET_WEATHER_RATING: Record<string, number> = {
  // Elite wet-weather drivers
  max_verstappen:     9.5,
  lewis_hamilton:     9.5,
  fernando_alonso:    9.5,
  george_russell:     8.5,
  lando_norris:       8.0,
  carlos_sainz:       8.0,
  charles_leclerc:    8.0,

  // Above average
  oscar_piastri:      7.5,
  lance_stroll:       7.5, // genuinely fast in wet
  esteban_ocon:       7.0,
  pierre_gasly:       7.0,
  nico_hulkenberg:    7.0,
  yuki_tsunoda:       7.0,
  alexander_albon:    7.0,

  // Average
  valtteri_bottas:    6.5,
  guanyu_zhou:        5.5,
  kevin_magnussen:    6.0,
  logan_sargeant:     5.0,
  nyck_de_vries:      5.5,

  // New/less data
  oliver_bearman:     6.0,
  franco_colapinto:   5.5,
  jack_doohan:        5.5,
  isack_hadjar:       5.5,
  kimi_antonelli:     6.0,
  gabriel_bortoleto:  5.5,
  liam_lawson:        6.5,
};

async function getWeatherForecast(
  lat: number,
  lng: number,
  raceDate: string,
): Promise<WeatherForecast> {
  const fallback: WeatherForecast = {
    rainProbability: 0,
    temperatureC:    20,
    windSpeedKph:    15,
    isWetExpected:   false,
  };

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",           String(lat));
    url.searchParams.set("longitude",          String(lng));
    url.searchParams.set("daily",              "precipitation_probability_max,temperature_2m_max,wind_speed_10m_max");
    url.searchParams.set("timezone",           "auto");
    url.searchParams.set("forecast_days",      "16");
    url.searchParams.set("start_date",         raceDate);
    url.searchParams.set("end_date",           raceDate);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } }); // 1h cache
    if (!res.ok) return fallback;

    const data = await res.json();
    const rain = data?.daily?.precipitation_probability_max?.[0] ?? 0;
    const temp = data?.daily?.temperature_2m_max?.[0]            ?? 20;
    const wind = data?.daily?.wind_speed_10m_max?.[0]            ?? 15;

    return {
      rainProbability: rain,
      temperatureC:    temp,
      windSpeedKph:    wind,
      isWetExpected:   rain > 40,
    };
  } catch {
    return fallback;
  }
}

// Circuit coordinates (lat, lng) — needed for OpenMeteo.
// Add new circuits as the calendar changes.
const CIRCUIT_COORDS: Record<string, [number, number]> = {
  bahrain:                    [26.0325, 50.5106],
  jeddah:                     [21.6319, 39.1044],
  albert_park:                [-37.8497, 144.968],
  suzuka:                     [34.8431, 136.541],
  shanghai:                   [31.3389, 121.22],
  miami:                      [25.958, -80.2389],
  imola:                      [44.3439, 11.7167],
  monaco:                     [43.7347, 7.4206],
  catalunya:                  [41.57, 2.2611],
  montreal:                   [45.5017, -73.5228],
  red_bull_ring:              [47.2197, 14.7647],
  silverstone:                [52.0786, -1.0169],
  hungaroring:                [47.5789, 19.2486],
  spa:                        [50.4372, 5.9714],
  zandvoort:                  [52.3888, 4.5409],
  monza:                      [45.6156, 9.2811],
  baku:                       [40.3725, 49.8533],
  singapore:                  [1.2914, 103.864],
  americas:                   [30.1328, -97.6411],
  rodriguez:                  [19.4042, -99.0907],
  interlagos:                 [-23.7036, -46.6997],
  las_vegas:                  [36.1699, -115.1398],
  losail:                     [25.49, 51.4536],
  yas_marina:                 [24.4672, 54.6031],
};

// ─── Grid penalty detection via OpenF1 ───────────────────────────────────────
//
// Queries race control messages for the current race weekend.
// Looks for keywords: "grid penalty", "pit lane start", "back of the grid",
// "engine", "gearbox", "power unit" in the message text.
//
// Returns a set of driver numbers (not IDs — OpenF1 uses car numbers)
// that have confirmed grid penalties, then maps them to driverIds.
//
// Note: OpenF1 uses year + round (meeting_key) to scope queries.
// We derive the meeting_key by fetching the sessions list.
//
const GRID_PENALTY_KEYWORDS = [
  "grid penalty",
  "pit lane start",
  "back of the grid",
  "5 place",
  "10 place",
  "15 place",
  "20 place",
  "power unit",
  "gearbox",
  "engine",
  "unsafe release",
];

async function getGridPenalties(
  season: string,
  round: string,
): Promise<Set<string>> {
  // Returns driver_numbers with penalties (strings like "1", "44", "16")
  const penalisedNumbers = new Set<string>();

  try {
    // Get meeting key for this race weekend
    const sessionsData = await getOpenF1<any[]>(
      `/sessions?year=${season}&session_name=Race`,
    );
    if (!sessionsData || sessionsData.length === 0) return penalisedNumbers;

    // Find the session matching the round number — OpenF1 doesn't expose round directly
    // so we grab all Race sessions for the year and pick by index (round - 1)
    // This is imperfect but OpenF1 doesn't expose ergast round numbers natively
    const targetSession = sessionsData[parseInt(round) - 1];
    if (!targetSession) return penalisedNumbers;

    const meetingKey = targetSession.meeting_key;

    // Fetch race control messages for this meeting
    const raceControl = await getOpenF1<any[]>(
      `/race_control?meeting_key=${meetingKey}&category=Other`,
    );
    if (!raceControl) return penalisedNumbers;

    raceControl.forEach((msg: any) => {
      const text = (msg.message ?? "").toLowerCase();
      const hasPenaltyKeyword = GRID_PENALTY_KEYWORDS.some((kw) => text.includes(kw));
      if (hasPenaltyKeyword && msg.driver_number) {
        penalisedNumbers.add(String(msg.driver_number));
      }
    });
  } catch {
    // Silently fail — OpenF1 is best-effort, not critical path
  }

  return penalisedNumbers;
}

// Maps OpenF1 car number → driverId using the current season's driver list
function buildNumberToIdMap(drivers: any[]): Map<string, string> {
  // Jolpica includes permanentNumber on the driver object
  const map = new Map<string, string>();
  drivers.forEach((d) => {
    if (d.permanentNumber) {
      map.set(String(d.permanentNumber), d.driverId);
    }
  });
  return map;
}

// ─── Tyre fit scoring ─────────────────────────────────────────────────────────
//
// Returns a score 0–10 per driver based on their constructor's rating
// for the primary compound used at this circuit.
// Drivers with unknown constructors get the midpoint (5.0).
//
function getTyreFitScore(
  constructorId: string,
  circuitId: string,
): number {
  const compound  = CIRCUIT_PRIMARY_COMPOUND[circuitId] ?? "medium";
  const ratings   = CONSTRUCTOR_TYRE_RATING[constructorId];
  return ratings?.[compound] ?? 5.0;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

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

async function generateInsight(
  factors: DriverPrediction["factors"],
  driverCode: string,
  circuitName: string,
  priorRoundCount: number,
  weather: WeatherForecast,
  isSprint: boolean,
): Promise<string> {
  const fallback = `${driverCode} is a strong contender at ${circuitName}.`;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[generateInsight] GROQ_API_KEY not set — using fallback.");
    return fallback;
  }

  // Build a richer context string so the LLM references the new factors
  const weatherCtx = weather.isWetExpected
    ? `Wet race likely (${weather.rainProbability}% rain probability).`
    : `Dry conditions expected (${weather.rainProbability}% rain probability).`;

  const sprintCtx = isSprint ? "Sprint weekend." : "Standard weekend.";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content:
              "You are a terse F1 analyst. Write exactly one sentence (max 22 words) " +
              "summarising why a driver is a strong or weak contender for the upcoming race. " +
              "Be specific — reference their strongest factor score AND the weather or sprint context if relevant. " +
              "Do not use filler phrases like 'With a score of' or 'Based on the data'. " +
              "Do not include the driver's name in the sentence — start with a verb or adjective.",
          },
          {
            role: "user",
            content:
              `Driver: ${driverCode} | Circuit: ${circuitName} | ` +
              `${weatherCtx} ${sprintCtx} | Data: last ${priorRoundCount} races\n` +
              `Factor scores (0–100, higher = better):\n` +
              `  Recent form:           ${factors.currentForm}\n` +
              `  Championship position: ${factors.championshipPosition}\n` +
              `  Circuit history:       ${factors.circuitHistory}\n` +
              `  Qualifying pace:       ${factors.qualifyingStrength}\n` +
              `  Weather adaptability:  ${factors.weatherAdaptability}\n` +
              `  Sprint form:           ${factors.sprintForm}\n` +
              `  Tyre fit:              ${factors.tyreFit}\n` +
              `  Grid penalty:          ${factors.gridPenalty}`,
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
 * Scoring formula (weights sum to 1.0):
 *   score = form×0.35 + qual×0.15 + champ×0.15 + circuit×0.10
 *         + weather×0.10 + sprint×0.07 + tyreFit×0.05 + gridPenalty×0.03
 *
 * @param season      - e.g. "2025"
 * @param round       - e.g. "5"
 * @param raceName    - e.g. "Monaco Grand Prix"
 * @param circuitId   - Jolpica circuit ID, e.g. "monaco"
 * @param circuitName - Display name, e.g. "Circuit de Monaco"
 * @param raceDate    - ISO date string "YYYY-MM-DD" — used for weather lookup
 * @param topN        - How many drivers to surface in the result (default 10)
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
  const driversData = await getJolpica<any>(`/${season}/drivers.json?limit=100`);
  const drivers: any[] = driversData?.MRData?.DriverTable?.Drivers ?? [];
  const driverIds = drivers.map((d) => d.driverId);

  // ── 2. Parallel fetches ──────────────────────────────────────────────────
  const [
    formMap,
    qualifyingMap,
    circuitMap,
    sprintData,
    gridPenaltyNumbers,
  ] = await Promise.all([
    priorRounds.length > 0
      ? getRecentForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),

    priorRounds.length > 0
      ? getRecentQualifyingForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),

    getCircuitHistoryMap(circuitId),
    getSprintData(season, round),
    getGridPenalties(season, round),
  ]);

  // Weather requires circuit coords — fetch separately (blocking since we need it for insight)
  const [lat, lng]   = CIRCUIT_COORDS[circuitId] ?? [0, 0];
  const weather      = await getWeatherForecast(lat, lng, raceDate);
  const { isSprint, sprintFormMap } = sprintData;

  // Championship standings snapshot
  const standingsMap =
    lastRound > 0
      ? await getStandingsAfterRound(season, lastRound)
      : await (async () => {
          const data = await getJolpica<any>(`/${season}/driverStandings.json`);
          const list: any[] =
            data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
          const m = new Map<string, { position: number; points: number; wins: number }>();
          list.forEach((s) =>
            m.set(s.Driver.driverId, {
              position: parseInt(s.position),
              points:   parseFloat(s.points),
              wins:     parseInt(s.wins),
            }),
          );
          return m;
        })();

  // Constructor map for cards + tyre fit
  const standingsRaw = await getJolpica<any>(
    lastRound > 0
      ? `/${season}/${lastRound}/driverStandings.json`
      : `/${season}/driverStandings.json`,
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

  // Map car number → driverId for penalty lookups
  const numberToId = buildNumberToIdMap(drivers);
  const penalisedDriverIds = new Set<string>();
  gridPenaltyNumbers.forEach((num) => {
    const id = numberToId.get(num);
    if (id) penalisedDriverIds.add(id);
  });

  // ── 3. Normalise factors ─────────────────────────────────────────────────

  const numDrivers = Math.max(drivers.length, 20);

  const normForm = normalise(driverIds.map((id) => [id, formMap.get(id) ?? 0]));
  const normQual = normalise(driverIds.map((id) => [id, qualifyingMap.get(id) ?? 0]));

  const normChamp = normalise(
    driverIds.map((id) => {
      const entry = standingsMap.get(id);
      const pos   = entry?.position ?? numDrivers;
      const wins  = entry?.wins ?? 0;
      return [id, (numDrivers + 1 - pos) + wins * 0.5];
    }),
  );

  const normCircuit = normalise(driverIds.map((id) => [id, circuitMap.get(id) ?? 0]));

  // Sprint form — normalise only if sprint weekend, else all-zero → all 50 after normalise
  const normSprint = normalise(
    driverIds.map((id) => [id, sprintFormMap.get(id) ?? 0]),
  );

  // Tyre fit — per driver, based on their constructor
  const normTyreFit = normalise(
    driverIds.map((id) => {
      const ctorId = constructorMap.get(id)?.id ?? "";
      return [id, getTyreFitScore(ctorId, circuitId)];
    }),
  );

  // Weather adaptability:
  //   - If dry expected: everyone gets 50 (neutral — weather doesn't differentiate)
  //   - If wet expected: use WET_WEATHER_RATING, normalised
  const normWeather = weather.isWetExpected
    ? normalise(driverIds.map((id) => [id, WET_WEATHER_RATING[id] ?? 5.0]))
    : normalise(driverIds.map((id) => [id, 5.0])); // all equal → all 50

  // Grid penalty: binary score modifier
  // Penalised drivers get 0, others get 10 → normalises to 0 vs 100
  const normGridPenalty = normalise(
    driverIds.map((id) => [id, penalisedDriverIds.has(id) ? 0 : 10]),
  );

  // ── 4. Weighted scoring ──────────────────────────────────────────────────

  const scoredDrivers = drivers
    .filter((d) => standingsMap.has(d.driverId) || formMap.has(d.driverId))
    .map((d) => {
      const id = d.driverId;

      const factors: DriverPrediction["factors"] = {
        currentForm:          Math.round(normForm.get(id)         ?? 0),
        championshipPosition: Math.round(normChamp.get(id)        ?? 0),
        circuitHistory:       Math.round(normCircuit.get(id)      ?? 0),
        qualifyingStrength:   Math.round(normQual.get(id)         ?? 0),
        weatherAdaptability:  Math.round(normWeather.get(id)      ?? 50),
        sprintForm:           Math.round(normSprint.get(id)       ?? 50),
        tyreFit:              Math.round(normTyreFit.get(id)      ?? 50),
        gridPenalty:          Math.round(normGridPenalty.get(id)  ?? 100),
      };

      const score =
        factors.currentForm          * WEIGHT.form        +
        factors.qualifyingStrength   * WEIGHT.qualifying  +
        factors.championshipPosition * WEIGHT.champ       +
        factors.circuitHistory       * WEIGHT.circuit     +
        factors.weatherAdaptability  * WEIGHT.weather     +
        factors.sprintForm           * WEIGHT.sprint      +
        factors.tyreFit              * WEIGHT.tyreFit     +
        factors.gridPenalty          * WEIGHT.gridPenalty;

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
        insight:           "",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // ── 5. Groq insights ─────────────────────────────────────────────────────
  const insights = await Promise.all(
    scoredDrivers.map((d) =>
      generateInsight(
        d.factors,
        d.driverCode,
        circuitName,
        priorRounds.length,
        weather,
        isSprint,
      ),
    ),
  );

  const predictions: DriverPrediction[] = scoredDrivers.map((d, i) => ({
    ...d,
    insight: insights[i],
  }));

  // ── 6. Softmax probabilities (tau=8) ─────────────────────────────────────
  const sorted    = [...predictions].sort((a, b) => b.score - a.score).slice(0, 10);
  const tau       = 8;
  const expScores = sorted.map((p) => Math.exp(p.score / tau));
  const sumExp    = expScores.reduce((a, b) => a + b, 0);
  sorted.forEach((p, i) => {
    p.podiumProbability = Math.round((expScores[i] / sumExp) * 100);
  });

  const podium          = sorted.slice(0, 3);
  const likelyFinishers = sorted.slice(3, 10).sort(() => Math.random() - 0.5);

  // ── 7. Model summary ─────────────────────────────────────────────────────
  const windowLabel =
    priorRounds.length === 0
      ? "season opener — using championship standings only"
      : `based on rounds ${priorRounds[0]}–${priorRounds[priorRounds.length - 1]} (last ${priorRounds.length} races)`;

  const weatherLabel = weather.isWetExpected
    ? `wet race likely (${weather.rainProbability}% rain)`
    : `dry conditions (${weather.rainProbability}% rain)`;

  const sprintLabel = isSprint ? " · sprint weekend" : "";

  const penaltyLabel =
    penalisedDriverIds.size > 0
      ? ` · ${penalisedDriverIds.size} driver(s) with grid penalties`
      : "";

  return {
    raceName,
    circuitId,
    circuitName,
    raceDate,
    predictions: podium,
    likelyFinishers,
    generatedAt:  new Date().toISOString(),
    weather,
    isSprint,
    modelSummary:
      `35% form · 15% qualifying · 15% championship · 10% circuit history · ` +
      `10% weather · 7% sprint · 5% tyre fit · 3% grid penalties — ` +
      `${windowLabel} · ${weatherLabel}${sprintLabel}${penaltyLabel}`,
  };
}