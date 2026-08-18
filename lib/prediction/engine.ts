/**
 * lib/prediction/engine.ts
 *
 * Race Winner Prediction Engine — v4
 *
 * Changes over v3 (accuracy fixes, not just new factors):
 *
 *   1. Recency weights are now renormalized per window size. v3 sliced
 *      RECENCY_WEIGHTS (which only sums to 1.0 across the full 5-race
 *      window) without renormalizing, so early-season predictions
 *      (round 2, round 3...) silently under-weighted the entire form
 *      signal by as much as ~45%. See getWindowWeights().
 *
 *   2. Grid penalty detection now matches OpenF1 sessions to the Jolpica
 *      race by closest date instead of by array index. v3 assumed
 *      `sessions[round - 1]` lined up with the Jolpica round number,
 *      which isn't guaranteed — sprint weekends add extra sessions that
 *      can shift the index, silently pulling penalty data from the
 *      wrong race weekend.
 *
 *   3. Grid penalties are now a graduated severity score instead of a
 *      binary "has a penalty or doesn't" — a pit-lane start and a
 *      5-place penalty are very different outcomes and shouldn't score
 *      the same.
 *
 *   4. Circuit history now applies exponential recency decay (a podium
 *      from 9 years ago counts far less than one from last season) and
 *      a small bonus for finishing higher on the podium.
 *
 *   5. Normalization is now percentile-clipped (5th/95th) rather than
 *      raw min-max, so one statistical outlier can't compress everyone
 *      else's score toward zero.
 *
 *   6. Removed a duplicate standings fetch — v3 called the same Jolpica
 *      standings endpoint twice (once for points/position, again for
 *      constructor names). Merged into a single snapshot fetch.
 *
 *   7. Insight generation retains concurrency limiting and 429
 *      retry-with-backoff (added while briefly trying Kimi/Moonshot,
 *      kept on revert back to Groq) — firing all ~10 insight requests at
 *      once in a plain Promise.all is fragile against any provider's
 *      rate limit, so this stays as cheap insurance regardless of who's
 *      generating the text.
 *
 * Weights (must sum to 1.0 — validated at module load):
 *   35%  Recent form
 *   15%  Qualifying pace
 *   15%  Championship standing
 *   10%  Circuit history
 *   10%  Weather adaptability
 *   07%  Sprint weekend form
 *   05%  Tyre fit
 *   03%  Grid penalty
 *
 * External APIs used:
 *   - https://api.jolpi.ca/ergast/f1   (race/qualifying/sprint/standings)
 *   - https://api.open-meteo.com       (weather forecast, no key needed)
 *   - https://api.openf1.org           (grid penalties, race control)
 *   - https://api.groq.com             (AI insight text, Llama 3.3 70B — requires GROQ_API_KEY)
 */

import { DriverPrediction, RacePrediction } from "@/lib/types/prediction";

const JOLPICA_URL = "https://api.jolpi.ca/ergast/f1";
const OPENF1_URL = "https://api.openf1.org/v1";

const WEIGHT = {
  form: 0.35,
  qualifying: 0.15,
  champ: 0.15,
  circuit: 0.1,
  weather: 0.1,
  sprint: 0.07,
  tyreFit: 0.05,
  gridPenalty: 0.03,
} as const;

// Fail loudly at startup rather than silently producing scores that don't
// sum the way the model summary claims they do.
const weightSum = Object.values(WEIGHT).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.0001) {
  throw new Error(`[engine] Weights must sum to 1.0, got ${weightSum}`);
}

// Pirelli's documented primary-compound allocation per circuit. Used as a
// proxy for "which compound will decide this race" — circuits not listed
// default to medium, since that's the most common allocation.
type CompoundType = "soft" | "medium" | "hard";

const CIRCUIT_PRIMARY_COMPOUND: Record<string, CompoundType> = {
  monaco: "soft",
  hungaroring: "soft",
  singapore: "soft",
  baku: "soft",
  monza: "hard",
  spa: "hard",
  silverstone: "hard",
  suzuka: "hard",
  interlagos: "hard",
  circuit_of_the_americas: "hard",
  jeddah: "hard",
  bahrain: "hard",
  albert_park: "medium",
  imola: "medium",
  red_bull_ring: "medium",
  zandvoort: "medium",
  rodriguez: "medium",
  yas_marina: "medium",
  miami: "medium",
  catalunya: "medium",
  losail: "medium",
  las_vegas: "medium",
  shanghai: "medium",
};

/**
 * Constructor tyre-management ratings (0–10) per compound type, from
 * aggregated sector-time and strategy analysis. Stored separately from
 * driver skill so the model can combine "who's driving" with "how well
 * does their car look after its tyres" as two independent signals.
 *
 * Update every season — constructor tyre management shifts significantly
 * between regulation cycles.
 */
const CONSTRUCTOR_TYRE_RATING: Record<string, Record<CompoundType, number>> = {
  red_bull: { soft: 8.5, medium: 9.0, hard: 8.5 },
  ferrari: { soft: 9.0, medium: 8.5, hard: 7.5 },
  mercedes: { soft: 7.5, medium: 8.5, hard: 9.0 },
  mclaren: { soft: 9.0, medium: 9.0, hard: 8.5 },
  aston_martin: { soft: 7.0, medium: 7.5, hard: 8.0 },
  alpine: { soft: 7.0, medium: 7.0, hard: 6.5 },
  williams: { soft: 6.5, medium: 7.0, hard: 7.5 },
  haas: { soft: 6.0, medium: 6.5, hard: 6.0 },
  rb: { soft: 6.5, medium: 7.0, hard: 6.5 },
  kick_sauber: { soft: 5.5, medium: 6.0, hard: 6.0 },
};

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
    // Shorter cache than Jolpica — race control events (penalties) can
    // land at any point during a weekend and we want them reasonably fresh.
    const res = await fetch(`${OPENF1_URL}${path}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Returns up to `windowSize` round numbers before `targetRound`, oldest first. */
function getPriorRounds(targetRound: number, windowSize = 5): number[] {
  const prior: number[] = [];
  for (let r = targetRound - 1; r >= 1 && prior.length < windowSize; r--) {
    prior.unshift(r);
  }
  return prior;
}

// Full-window recency weights, most-recent-race last. Only sums to 1.0
// when all 5 slots are used — see getWindowWeights() for why that matters.
const RECENCY_WEIGHTS = [0.1, 0.15, 0.2, 0.25, 0.3];

/**
 * Returns recency weights for a window smaller than the full 5 races,
 * renormalized to sum to 1.0.
 *
 * Without this, a 2-race window (common early in a season) would use the
 * raw tail slice [0.25, 0.30] — which sums to 0.55, not 1.0 — meaning the
 * entire form signal would be worth 45% less than it should be, and by
 * extension so would the whole prediction. Renormalizing preserves the
 * *relative* recency weighting (most recent race still matters most)
 * while making sure the window always contributes its full intended share.
 */
function getWindowWeights(windowSize: number): number[] {
  if (windowSize <= 0) return [];
  const raw = RECENCY_WEIGHTS.slice(RECENCY_WEIGHTS.length - windowSize);
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

async function getRecentForm(
  season: string,
  priorRounds: number[],
): Promise<Map<string, number>> {
  const weights = getWindowWeights(priorRounds.length);
  const formMap = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) =>
      getJolpica<any>(`/${season}/${round}/results.json`),
    ),
  );

  roundData.forEach((data, idx) => {
    const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
    const weight = weights[idx];

    results.forEach((r: any) => {
      const id = r.Driver.driverId;
      const pos = parseInt(r.position);
      const status = (r.status ?? "").toLowerCase();

      let posScore: number;
      if (!isNaN(pos)) {
        posScore = Math.max(0, 21 - pos);
      } else if (status.includes("collision") || status.includes("accident")) {
        // Not-at-fault DNF (or at least not clearly the driver's error) —
        // no penalty, since it's not a reliable signal of driver skill.
        posScore = 0;
      } else {
        // Mechanical/reliability DNF. Small penalty — it's the driver's
        // race result even if not their fault, and correlates with car
        // reliability which is itself weakly predictive of next race.
        posScore = -2;
      }

      formMap.set(id, (formMap.get(id) ?? 0) + posScore * weight);
    });
  });

  return formMap;
}

async function getRecentQualifyingForm(
  season: string,
  priorRounds: number[],
): Promise<Map<string, number>> {
  const weights = getWindowWeights(priorRounds.length);
  const qMap = new Map<string, number>();

  const roundData = await Promise.all(
    priorRounds.map((round) =>
      getJolpica<any>(`/${season}/${round}/qualifying.json`),
    ),
  );

  roundData.forEach((data, idx) => {
    const results: any[] =
      data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
    const weight = weights[idx];

    results.forEach((r: any) => {
      const id = r.Driver.driverId;
      const pos = parseInt(r.position);
      const posScore = isNaN(pos) ? 0 : Math.max(0, 21 - pos);
      qMap.set(id, (qMap.get(id) ?? 0) + posScore * weight);
    });
  });

  return qMap;
}

interface StandingsSnapshot {
  driver: Map<string, { position: number; points: number; wins: number }>;
  constructor: Map<string, { name: string; id: string }>;
}

/**
 * Fetches driver standings once and derives both the points/position map
 * and the constructor map from that single response. v3 fetched the same
 * endpoint twice — once per map — which was both wasteful and a small
 * consistency risk (the two calls could theoretically resolve against
 * slightly different cached snapshots).
 */
async function getStandingsSnapshot(
  season: string,
  afterRound: number,
): Promise<StandingsSnapshot> {
  const path =
    afterRound > 0
      ? `/${season}/${afterRound}/driverStandings.json`
      : `/${season}/driverStandings.json`;

  const data = await getJolpica<any>(path);
  const list: any[] =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];

  const driver = new Map<
    string,
    { position: number; points: number; wins: number }
  >();
  const constructor = new Map<string, { name: string; id: string }>();

  list.forEach((s) => {
    driver.set(s.Driver.driverId, {
      position: parseInt(s.position),
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    });
    const ctor = s.Constructors?.[0];
    if (ctor)
      constructor.set(s.Driver.driverId, {
        name: ctor.name,
        id: ctor.constructorId,
      });
  });

  return { driver, constructor };
}

// A podium from 9 years ago shouldn't count the same as one from last
// season — a driver's car, teammates, and form all change. Halving the
// weight every HALF_LIFE_YEARS keeps recent circuit history dominant
// while still letting long-term specialists (e.g. a Monaco veteran) show up.
const CIRCUIT_HISTORY_HALF_LIFE_YEARS = 4;

/**
 * Builds a recency-decayed, position-weighted circuit history score per
 * driver: every historical podium at this circuit contributes
 * `recencyWeight * positionBonus`, where recencyWeight decays
 * exponentially with age and positionBonus rewards finishing closer to P1.
 */
async function getCircuitHistoryMap(
  circuitId: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - 10; // ignore anything older than 10 years — different cars, different era

  let offset = 0;
  const limit = 100;
  let total = Infinity;

  while (offset < total) {
    const data = await getJolpica<any>(
      `/circuits/${circuitId}/results.json?limit=${limit}&offset=${offset}`,
    );
    if (!data) break;

    total = parseInt(data.MRData?.total ?? "0");
    const races: any[] = data.MRData?.RaceTable?.Races ?? [];

    races.forEach((race) => {
      const season = parseInt(race.season);
      if (season <= cutoffYear) return;

      const ageYears = currentYear - season;
      const recencyWeight = Math.pow(
        0.5,
        ageYears / CIRCUIT_HISTORY_HALF_LIFE_YEARS,
      );

      race.Results?.forEach((r: any) => {
        const pos = parseInt(r.position);
        if (pos < 1 || pos > 3) return;
        // A win is a stronger circuit-fit signal than a P3 that could have
        // gone either way — small, deliberately modest bonus so this
        // doesn't overwhelm the recency decay above.
        const positionBonus = pos === 1 ? 1.2 : pos === 2 ? 1.05 : 1.0;
        const id = r.Driver.driverId;
        map.set(id, (map.get(id) ?? 0) + recencyWeight * positionBonus);
      });
    });

    offset += limit;
    if (races.length === 0) break;
  }

  return map;
}

/**
 * Detects sprint weekends and scores same-weekend sprint results as a
 * separate, high-recency signal.
 *
 * Sprint results are capped at a max score of 15 (vs. 20 for a full race)
 * since a 19-lap sprint is a noisier sample than a full grand prix, and
 * weighted at 0.40 because — unlike the multi-race form window — it's a
 * single data point from the race weekend actually being predicted.
 */
async function getSprintData(
  season: string,
  round: string,
): Promise<{ isSprint: boolean; sprintFormMap: Map<string, number> }> {
  const sprintFormMap = new Map<string, number>();

  const data = await getJolpica<any>(`/${season}/${round}/sprint.json`);
  const results: any[] =
    data?.MRData?.RaceTable?.Races?.[0]?.SprintResults ?? [];

  if (results.length === 0) return { isSprint: false, sprintFormMap };

  results.forEach((r: any) => {
    const id = r.Driver.driverId;
    const pos = parseInt(r.position);
    if (isNaN(pos)) return;
    const posScore = Math.max(0, 16 - pos);
    sprintFormMap.set(id, posScore * 0.4);
  });

  return { isSprint: true, sprintFormMap };
}

interface WeatherForecast {
  rainProbability: number;
  temperatureC: number;
  windSpeedKph: number;
  isWetExpected: boolean;
}

/**
 * Hand-seeded wet-weather skill ratings (0–10), sourced from F1 technical
 * analysis consensus rather than derived from race data.
 *
 * Known limitation: Jolpica doesn't publish wet/dry flags on race results,
 * so there's no clean way to derive this from the API directly (a
 * lap-time-delta proxy was considered — comparing a race's winning pace
 * against the circuit's dry median — but that signal is noisy enough
 * with strategy/safety-car variance that hand-seeded ratings from
 * documented wet-weather performance are currently more reliable).
 * Revisit if a wet/dry-flagged dataset becomes available.
 *
 * Drivers not listed default to 5.0 (average) below.
 */
const WET_WEATHER_RATING: Record<string, number> = {
  max_verstappen: 9.5,
  lewis_hamilton: 9.5,
  fernando_alonso: 9.5,
  george_russell: 8.5,
  lando_norris: 8.0,
  carlos_sainz: 8.0,
  charles_leclerc: 8.0,
  oscar_piastri: 7.5,
  lance_stroll: 7.5,
  esteban_ocon: 7.0,
  pierre_gasly: 7.0,
  nico_hulkenberg: 7.0,
  yuki_tsunoda: 7.0,
  alexander_albon: 7.0,
  valtteri_bottas: 6.5,
  guanyu_zhou: 5.5,
  kevin_magnussen: 6.0,
  logan_sargeant: 5.0,
  nyck_de_vries: 5.5,
  oliver_bearman: 6.0,
  franco_colapinto: 5.5,
  jack_doohan: 5.5,
  isack_hadjar: 5.5,
  kimi_antonelli: 6.0,
  gabriel_bortoleto: 5.5,
  liam_lawson: 6.5,
};

async function getWeatherForecast(
  lat: number,
  lng: number,
  raceDate: string,
): Promise<WeatherForecast> {
  const fallback: WeatherForecast = {
    rainProbability: 0,
    temperatureC: 20,
    windSpeedKph: 15,
    isWetExpected: false,
  };

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set(
      "daily",
      "precipitation_probability_max,temperature_2m_max,wind_speed_10m_max",
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("start_date", raceDate);
    url.searchParams.set("end_date", raceDate);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return fallback;

    const data = await res.json();
    const rain = data?.daily?.precipitation_probability_max?.[0] ?? 0;
    const temp = data?.daily?.temperature_2m_max?.[0] ?? 20;
    const wind = data?.daily?.wind_speed_10m_max?.[0] ?? 15;

    return {
      rainProbability: rain,
      temperatureC: temp,
      windSpeedKph: wind,
      isWetExpected: rain > 40,
    };
  } catch {
    return fallback;
  }
}

// Circuit coordinates for the weather lookup. Add new circuits as the
// calendar changes — a missing entry silently falls back to (0, 0), which
// getWeatherForecast will treat as a normal (if wrong) location rather
// than erroring, so double-check new additions land here.
const CIRCUIT_COORDS: Record<string, [number, number]> = {
  bahrain: [26.0325, 50.5106],
  jeddah: [21.6319, 39.1044],
  albert_park: [-37.8497, 144.968],
  suzuka: [34.8431, 136.541],
  shanghai: [31.3389, 121.22],
  miami: [25.958, -80.2389],
  imola: [44.3439, 11.7167],
  monaco: [43.7347, 7.4206],
  catalunya: [41.57, 2.2611],
  montreal: [45.5017, -73.5228],
  red_bull_ring: [47.2197, 14.7647],
  silverstone: [52.0786, -1.0169],
  hungaroring: [47.5789, 19.2486],
  spa: [50.4372, 5.9714],
  zandvoort: [52.3888, 4.5409],
  monza: [45.6156, 9.2811],
  baku: [40.3725, 49.8533],
  singapore: [1.2914, 103.864],
  americas: [30.1328, -97.6411],
  rodriguez: [19.4042, -99.0907],
  interlagos: [-23.7036, -46.6997],
  las_vegas: [36.1699, -115.1398],
  losail: [25.49, 51.4536],
  yas_marina: [24.4672, 54.6031],
};

/**
 * Severity scale (0–10, higher = worse for the driver), ordered roughly
 * by how many track positions the penalty typically costs. Generic
 * mechanical-change language without a stated place count still usually
 * carries *some* penalty, so it scores lightly rather than being ignored.
 */
function gridPenaltySeverity(message: string): number {
  if (
    message.includes("back of the grid") ||
    message.includes("pit lane start")
  )
    return 10;
  if (message.includes("20 place")) return 9;
  if (message.includes("15 place")) return 7;
  if (message.includes("10 place")) return 5;
  if (message.includes("5 place")) return 3;
  if (
    message.includes("power unit") ||
    message.includes("gearbox") ||
    message.includes("engine") ||
    message.includes("unsafe release")
  )
    return 2;
  return 0;
}

/**
 * Returns a map of OpenF1 car number -> penalty severity (0–10) for the
 * race weekend closest to `raceDate`.
 *
 * OpenF1 doesn't expose Jolpica's round numbers, and its session list
 * isn't guaranteed to be in round order (sprint weekends add extra
 * sessions that can shift a naive index). Matching by the session whose
 * date_start is nearest to the actual Jolpica race date is robust
 * regardless of ordering. If the nearest match is still more than two
 * days away, that's treated as "no match" — better to report no penalty
 * data than to silently attribute penalties from the wrong weekend.
 */
async function getGridPenalties(
  season: string,
  raceDate: string,
): Promise<Map<string, number>> {
  const severityByNumber = new Map<string, number>();

  try {
    const sessionsData = await getOpenF1<any[]>(
      `/sessions?year=${season}&session_name=Race`,
    );
    if (!sessionsData || sessionsData.length === 0) return severityByNumber;

    const target = new Date(raceDate).getTime();
    let closest = sessionsData[0];
    let closestDelta = Math.abs(
      new Date(closest.date_start).getTime() - target,
    );
    for (const s of sessionsData) {
      const delta = Math.abs(new Date(s.date_start).getTime() - target);
      if (delta < closestDelta) {
        closest = s;
        closestDelta = delta;
      }
    }

    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    if (closestDelta > TWO_DAYS_MS) return severityByNumber;

    const raceControl = await getOpenF1<any[]>(
      `/race_control?meeting_key=${closest.meeting_key}&category=Other`,
    );
    if (!raceControl) return severityByNumber;

    raceControl.forEach((msg: any) => {
      if (!msg.driver_number) return;
      const severity = gridPenaltySeverity((msg.message ?? "").toLowerCase());
      if (severity <= 0) return;
      const num = String(msg.driver_number);
      // A driver can appear in multiple race-control messages for the same
      // penalty (initial report + confirmation) — keep the worst severity
      // seen rather than summing duplicates.
      severityByNumber.set(
        num,
        Math.max(severityByNumber.get(num) ?? 0, severity),
      );
    });
  } catch {
    // OpenF1 is best-effort — a failed fetch just means "no penalty data
    // available", not a fatal error for the whole prediction.
  }

  return severityByNumber;
}

/** Maps OpenF1 car number -> driverId using Jolpica's permanentNumber field. */
function buildNumberToIdMap(drivers: any[]): Map<string, string> {
  const map = new Map<string, string>();
  drivers.forEach((d) => {
    if (d.permanentNumber) map.set(String(d.permanentNumber), d.driverId);
  });
  return map;
}

/**
 * Tyre fit score (0–10) for a driver, proxied through their constructor's
 * rating for this circuit's primary compound. Team tyre management is the
 * dominant signal here — not something an individual driver controls much
 * — so this is deliberately looked up by constructor rather than driver.
 */
function getTyreFitScore(constructorId: string, circuitId: string): number {
  const compound = CIRCUIT_PRIMARY_COMPOUND[circuitId] ?? "medium";
  const ratings = CONSTRUCTOR_TYRE_RATING[constructorId];
  return ratings?.[compound] ?? 5.0;
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = (p / 100) * (sortedValues.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedValues[lo];
  const frac = idx - lo;
  return sortedValues[lo] + (sortedValues[hi] - sortedValues[lo]) * frac;
}

/**
 * Normalizes a factor's raw scores to a 0–100 scale, clipped at the
 * 5th/95th percentile before scaling.
 *
 * Plain min-max normalization (v3's approach) is fragile: a single
 * statistical outlier — one driver with an unusually large circuit-history
 * count, say — stretches the min-max range so far that everyone else's
 * score gets compressed toward zero, effectively erasing the distinction
 * between the 2nd-best and worst driver on that factor. Clipping the
 * extremes before scaling keeps the bulk of the field meaningfully spread
 * out while still letting a genuine outlier score near 100.
 */
function normalise(entries: [string, number][]): Map<string, number> {
  const sortedValues = entries.map(([, v]) => v).sort((a, b) => a - b);
  const lo = percentile(sortedValues, 5);
  const hi = percentile(sortedValues, 95);
  const range = hi - lo;

  const out = new Map<string, number>();
  entries.forEach(([id, v]) => {
    if (range === 0) {
      out.set(id, 50); // every driver scored identically on this factor — neutral
      return;
    }
    const clipped = Math.min(hi, Math.max(lo, v));
    out.set(id, ((clipped - lo) / range) * 100);
  });
  return out;
}

// Groq's free tier is generally more generous than Moonshot's unfunded
// tier, but concurrency limiting + retry is cheap insurance either way —
// keeping it means a temporary rate-limit blip degrades to "a couple of
// drivers get fallback text" instead of "every driver gets fallback text."
// Raise this if you have a paid Groq tier and want faster generation.
const INSIGHT_CONCURRENCY_LIMIT = 4;

/** Runs `fn` over `items` with at most `limit` calls in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * fetch() wrapper that retries on HTTP 429 with exponential backoff,
 * honoring a Retry-After header when the provider sends one. Every other
 * status (including other 4xx/5xx) is returned immediately — only rate
 * limiting is worth waiting out here.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastRes: Response;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastRes = await fetch(url, init);
    if (lastRes.status !== 429) return lastRes;
    if (attempt === maxRetries) return lastRes;

    const retryAfterHeader = lastRes.headers.get("retry-after");
    const waitMs = retryAfterHeader
      ? parseInt(retryAfterHeader, 10) * 1000
      : 1000 * Math.pow(2, attempt); // 1s, then 2s
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return lastRes!;
}

/**
 * Asks Groq (GPT-OSS 120B) for a one-sentence explanation of a driver's
 * prediction, grounded in their actual factor scores so it can't drift
 * into generic hype. Falls back to a plain template if the API key is
 * missing or the request fails — insight text is a nice-to-have, never a
 * blocker for the prediction itself.
 */
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

  const weatherCtx = weather.isWetExpected
    ? `Wet race likely (${weather.rainProbability}% rain probability).`
    : `Dry conditions expected (${weather.rainProbability}% rain probability).`;
  const sprintCtx = isSprint ? "Sprint weekend." : "Standard weekend.";
  // Only mention penalties when one actually applies (gridPenalty factor
  // below 90 means *some* severity was detected) — otherwise this line
  // would show up as noise on every single driver.
  const penaltyCtx = factors.gridPenalty < 90 ? "Grid penalty applied." : "";

  try {
    const res = await fetchWithRetry(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          max_completion_tokens: 80,
          temperature: 1,
          top_p: 1,
          // Single-sentence, ≤22-word output doesn't need heavy reasoning —
          // "low" keeps this cheap since it runs up to
          // INSIGHT_CONCURRENCY_LIMIT times concurrently per prediction,
          // out of the same 8,000 TPM free-tier pool as the chat route.
          reasoning_effort: "low",
          messages: [
            {
              role: "system",
              content:
                "You are a terse F1 analyst. Write exactly one sentence (max 22 words) " +
                "summarising why a driver is a strong or weak contender for the upcoming race. " +
                "Be specific — reference their strongest factor score AND the weather, sprint, " +
                "or penalty context if relevant. Do not use filler phrases like 'With a score of' " +
                "or 'Based on the data'. Do not include the driver's name in the sentence — " +
                "start with a verb or adjective.",
            },
            {
              role: "user",
              content:
                `Driver: ${driverCode} | Circuit: ${circuitName} | ` +
                `${weatherCtx} ${sprintCtx} ${penaltyCtx} | Data: last ${priorRoundCount} races\n` +
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
      },
    );

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

/**
 * Orchestrates every data fetch, normalization, weighted scoring, and
 * insight generation for a single race, and returns the top-N ranked
 * predictions plus a softmax-derived podium probability for the top 3.
 *
 * Scoring formula (weights sum to 1.0):
 *   score = form×0.35 + qual×0.15 + champ×0.15 + circuit×0.10
 *         + weather×0.10 + sprint×0.07 + tyreFit×0.05 + gridPenalty×0.03
 *
 * @param season      e.g. "2025"
 * @param round       e.g. "5"
 * @param raceName    e.g. "Monaco Grand Prix"
 * @param circuitId   Jolpica circuit ID, e.g. "monaco"
 * @param circuitName Display name, e.g. "Circuit de Monaco"
 * @param raceDate    ISO date "YYYY-MM-DD" — used for weather + penalty-session lookup
 * @param topN        How many drivers to surface in the result (default 10)
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
  const lastRound = priorRounds[priorRounds.length - 1] ?? 0;

  const driversData = await getJolpica<any>(
    `/${season}/drivers.json?limit=100`,
  );
  const drivers: any[] = driversData?.MRData?.DriverTable?.Drivers ?? [];
  const driverIds = drivers.map((d) => d.driverId);

  // Independent fetches, run in parallel — none of these depend on each
  // other's results.
  const [
    formMap,
    qualifyingMap,
    circuitMap,
    sprintData,
    standingsSnapshot,
    gridPenaltySeverityByNumber,
  ] = await Promise.all([
    priorRounds.length > 0
      ? getRecentForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),
    priorRounds.length > 0
      ? getRecentQualifyingForm(season, priorRounds)
      : Promise.resolve(new Map<string, number>()),
    getCircuitHistoryMap(circuitId),
    getSprintData(season, round),
    getStandingsSnapshot(season, lastRound),
    getGridPenalties(season, raceDate),
  ]);

  const { isSprint, sprintFormMap } = sprintData;
  const { driver: standingsMap, constructor: constructorMap } =
    standingsSnapshot;

  // Weather depends on circuit coordinates but not on anything above, and
  // its result feeds directly into the insight prompt — fetched separately
  // so it's clearly available before scoring/insight generation below.
  const [lat, lng] = CIRCUIT_COORDS[circuitId] ?? [0, 0];
  const weather = await getWeatherForecast(lat, lng, raceDate);

  // Convert OpenF1 car numbers to Jolpica driverIds now that we have the
  // driver list needed to build that mapping.
  const numberToId = buildNumberToIdMap(drivers);
  const gridPenaltySeverityByDriverId = new Map<string, number>();
  gridPenaltySeverityByNumber.forEach((severity, num) => {
    const id = numberToId.get(num);
    if (id) gridPenaltySeverityByDriverId.set(id, severity);
  });

  const numDrivers = Math.max(drivers.length, 20);

  const normForm = normalise(driverIds.map((id) => [id, formMap.get(id) ?? 0]));
  const normQual = normalise(
    driverIds.map((id) => [id, qualifyingMap.get(id) ?? 0]),
  );

  const normChamp = normalise(
    driverIds.map((id) => {
      const entry = standingsMap.get(id);
      const pos = entry?.position ?? numDrivers; // driver absent from standings -> treat as last
      const wins = entry?.wins ?? 0;
      return [id, numDrivers + 1 - pos + wins * 0.5];
    }),
  );

  const normCircuit = normalise(
    driverIds.map((id) => [id, circuitMap.get(id) ?? 0]),
  );

  // On non-sprint weekends every entry is 0, so normalise() correctly
  // gives everyone a neutral 50 (range === 0 branch) rather than an
  // arbitrary spread — this factor only differentiates drivers when a
  // sprint actually happened this weekend.
  const normSprint = normalise(
    driverIds.map((id) => [id, sprintFormMap.get(id) ?? 0]),
  );

  const normTyreFit = normalise(
    driverIds.map((id) => {
      const ctorId = constructorMap.get(id)?.id ?? "";
      return [id, getTyreFitScore(ctorId, circuitId)];
    }),
  );

  // Dry race: weather doesn't differentiate drivers, so everyone gets an
  // identical input (all equal -> normalise() gives everyone 50, neutral).
  // Wet race: use the hand-seeded WET_WEATHER_RATING table.
  const normWeather = weather.isWetExpected
    ? normalise(driverIds.map((id) => [id, WET_WEATHER_RATING[id] ?? 5.0]))
    : normalise(driverIds.map((id) => [id, 5.0]));

  // Invert severity so "no penalty" scores highest and "back of the grid"
  // scores lowest, then let normalise() spread that 0-10 range to 0-100.
  const normGridPenalty = normalise(
    driverIds.map((id) => {
      const severity = gridPenaltySeverityByDriverId.get(id) ?? 0;
      return [id, 10 - severity];
    }),
  );

  const scoredDrivers = drivers
    // Only score drivers who actually have recent results or a standings
    // entry — excludes reserve/test drivers who aren't racing this weekend.
    .filter((d) => standingsMap.has(d.driverId) || formMap.has(d.driverId))
    .map((d) => {
      const id = d.driverId;

      const factors: DriverPrediction["factors"] = {
        currentForm: Math.round(normForm.get(id) ?? 0),
        championshipPosition: Math.round(normChamp.get(id) ?? 0),
        circuitHistory: Math.round(normCircuit.get(id) ?? 0),
        qualifyingStrength: Math.round(normQual.get(id) ?? 0),
        weatherAdaptability: Math.round(normWeather.get(id) ?? 50),
        sprintForm: Math.round(normSprint.get(id) ?? 50),
        tyreFit: Math.round(normTyreFit.get(id) ?? 50),
        gridPenalty: Math.round(normGridPenalty.get(id) ?? 100),
      };

      const score =
        factors.currentForm * WEIGHT.form +
        factors.qualifyingStrength * WEIGHT.qualifying +
        factors.championshipPosition * WEIGHT.champ +
        factors.circuitHistory * WEIGHT.circuit +
        factors.weatherAdaptability * WEIGHT.weather +
        factors.sprintForm * WEIGHT.sprint +
        factors.tyreFit * WEIGHT.tyreFit +
        factors.gridPenalty * WEIGHT.gridPenalty;

      const ctor = constructorMap.get(id);

      return {
        driverId: id,
        driverCode: d.code ?? id.slice(0, 3).toUpperCase(),
        givenName: d.givenName,
        familyName: d.familyName,
        constructorName: ctor?.name ?? "Unknown",
        constructorId: ctor?.id ?? "",
        score: Math.round(score * 10) / 10,
        podiumProbability: 0, // filled in by the softmax step below
        factors,
        insight: "",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  // Concurrency-limited with retry, instead of a plain Promise.all, to
  // stay under Moonshot's per-account rate limit — see
  // INSIGHT_CONCURRENCY_LIMIT above for why this matters.
  const insights = await mapWithConcurrency(
    scoredDrivers,
    INSIGHT_CONCURRENCY_LIMIT,
    (d) =>
      generateInsight(
        d.factors,
        d.driverCode,
        circuitName,
        priorRounds.length,
        weather,
        isSprint,
      ),
  );

  const predictions: DriverPrediction[] = scoredDrivers.map((d, i) => ({
    ...d,
    insight: insights[i],
  }));

  // Softmax over the top 10 scores converts raw scores into probabilities
  // that sum to 100%. tau=8 controls how "spread out" the probabilities
  // are — lower tau makes the leader dominate more, higher tau flattens
  // the field toward equal odds.
  const sorted = [...predictions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  const tau = 8;
  const expScores = sorted.map((p) => Math.exp(p.score / tau));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  sorted.forEach((p, i) => {
    p.podiumProbability = Math.round((expScores[i] / sumExp) * 100);
  });

  const podium = sorted.slice(0, 3);
  const likelyFinishers = sorted.slice(3, 10).sort(() => Math.random() - 0.5);

  const windowLabel =
    priorRounds.length === 0
      ? "season opener — using championship standings only"
      : `based on rounds ${priorRounds[0]}–${priorRounds[priorRounds.length - 1]} (last ${priorRounds.length} races)`;

  const weatherLabel = weather.isWetExpected
    ? `wet race likely (${weather.rainProbability}% rain)`
    : `dry conditions (${weather.rainProbability}% rain)`;

  const sprintLabel = isSprint ? " · sprint weekend" : "";

  const penaltyCount = gridPenaltySeverityByDriverId.size;
  const penaltyLabel =
    penaltyCount > 0 ? ` · ${penaltyCount} driver(s) with grid penalties` : "";

  return {
    raceName,
    circuitId,
    circuitName,
    raceDate,
    predictions: podium,
    likelyFinishers,
    generatedAt: new Date().toISOString(),
    weather,
    isSprint,
    modelSummary:
      `35% form · 15% qualifying · 15% championship · 10% circuit history · ` +
      `10% weather · 7% sprint · 5% tyre fit · 3% grid penalties — ` +
      `${windowLabel} · ${weatherLabel}${sprintLabel}${penaltyLabel}`,
  };
}
