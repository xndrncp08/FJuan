import type { DriverPrediction, FactorKey, PastResult, PredictionSnapshot, RacePrediction } from "@/lib/types/prediction";
import { normalise, modelDistribution } from "./math";
import { canonicalDriverId } from "./ratings";
import { validateSnapshot } from "./policy";
import { insightFacts } from "./insights";

/** Existing weights, unchanged. Neutral inputs retain their weight. */
export const WEIGHTS: Record<FactorKey, number> = {
  currentForm: 0.35, qualifyingStrength: 0.15, championshipPosition: 0.15,
  circuitHistory: 0.10, weatherAdaptability: 0.10, sprintForm: 0.07,
  tyreFit: 0.05, gridPenalty: 0.03,
};
export const FACTOR_KEYS = Object.keys(WEIGHTS) as FactorKey[];

function recentForm(races: PastResult[] | undefined): Map<string, number> {
  const ordered = [...races ?? []].sort((a, b) => Date.parse(a.endedAt) - Date.parse(b.endedAt)).slice(-5);
  const weights = [0.1, 0.15, 0.2, 0.25, 0.3].slice(5 - ordered.length);
  const sums = new Map<string, [number, number]>();
  ordered.forEach((race, i) => race.rows.forEach(row => {
    const id = canonicalDriverId(row.driverId);
    const [sum, weight] = sums.get(id) ?? [0, 0];
    sums.set(id, [sum + Math.max(0, race.rows.length + 1 - row.position) * weights[i], weight + weights[i]]);
  }));
  return new Map([...sums].map(([id, [sum, weight]]) => [id, sum / weight]));
}

/** Pure scoring: no wall clock, network, outcome lookup, or randomness. */
export function scorePrediction(snapshot: PredictionSnapshot, topN = 10): RacePrediction {
  validateSnapshot(snapshot);
  if (!Number.isInteger(topN) || topN < 3) throw new Error("Display count must be at least three.");
  const s = snapshot;
  const entries = s.entries.value.filter(e => e.status === "entered").map(e => ({ ...e, driverId: canonicalDriverId(e.driverId) }));
  if (!entries.length || new Set(entries.map(e => e.driverId)).size !== entries.length) throw new Error("No unique eligible field is available.");
  const form = recentForm(s.form?.value);
  const previousQualifying = recentForm(s.qualifyingHistory?.value);
  const qualifying = s.qualifying ? new Map(s.qualifying.value.rows.map(r => [canonicalDriverId(r.driverId), s.qualifying!.value.rows.length + 1 - r.position])) : previousQualifying;
  const standings = new Map(s.standings?.value.rows.map(r => [canonicalDriverId(r.driverId), s.standings!.value.rows.length + 1 - r.position + (r.wins ?? 0) * 0.5]));
  const circuit = new Map<string, number>();
  const cutoffYear = new Date(s.cutoff).getUTCFullYear();
  for (const race of s.circuitHistory?.value ?? []) {
    const year = Number(race.season);
    if (year <= cutoffYear - 10) continue;
    for (const row of race.rows) {
      if (row.position > 3) continue;
      const id = canonicalDriverId(row.driverId);
      const bonus = row.position === 1 ? 1.2 : row.position === 2 ? 1.05 : 1;
      circuit.set(id, (circuit.get(id) ?? 0) + Math.pow(0.5, (cutoffYear - year) / 4) * bonus);
    }
  }
  const sprint = new Map(s.sprint?.value.rows.map(r => [canonicalDriverId(r.driverId), Math.max(0, 16 - r.position) * 0.4]));
  const penalties = new Map<string, number>();
  for (const p of s.penalties?.value ?? []) {
    const id = canonicalDriverId(p.driverId);
    penalties.set(id, Math.max(penalties.get(id) ?? 0, p.severity));
  }
  const wet = s.weather ? s.weather.value.rainProbability > 40 : null;
  const ratings = s.ratings?.value;
  const raw = new Map<string, Record<FactorKey, number | null>>();
  for (const e of entries) {
    const compound = ratings?.compound[s.race.circuitId];
    raw.set(e.driverId, {
      currentForm: form.get(e.driverId) ?? null,
      qualifyingStrength: qualifying.get(e.driverId) ?? null,
      championshipPosition: standings.get(e.driverId) ?? null,
      circuitHistory: s.circuitHistory ? circuit.get(e.driverId) ?? 0 : null,
      weatherAdaptability: wet === false ? 50 : wet ? (ratings?.wet[e.driverId] ?? null) : null,
      sprintForm: s.race.isSprint ? sprint.get(e.driverId) ?? null : 50,
      tyreFit: compound ? ratings?.tyre[e.constructorId]?.[compound] ?? null : null,
      // Qualifying uses raw session order, never starting-grid order. The grid is a separate evaluation baseline.
      gridPenalty: s.penalties ? 100 - 10 * (penalties.get(e.driverId) ?? 0) : null,
    });
  }
  const scaled = new Map(FACTOR_KEYS.map(key => [key,
    // Fixed-domain ratings and penalty severity must survive field composition changes.
    ["gridPenalty", "weatherAdaptability", "tyreFit"].includes(key)
      ? new Map(entries.map(e => {
          const v = raw.get(e.driverId)![key];
          return [e.driverId, v === null ? 50 : key === "gridPenalty" || (key === "weatherAdaptability" && wet === false) ? v : v * 10];
        }))
      : normalise(entries.map(e => [e.driverId, raw.get(e.driverId)![key]])),
  ]));
  const ranking: DriverPrediction[] = entries.map(e => {
    const factors = Object.fromEntries(FACTOR_KEYS.map(key => [key, scaled.get(key)!.get(e.driverId)!])) as Record<FactorKey, number>;
    const driver: DriverPrediction = {
      driverId: e.driverId, driverCode: e.driverCode, givenName: e.givenName, familyName: e.familyName,
      constructorId: e.constructorId, constructorName: e.constructorName,
      score: FACTOR_KEYS.reduce((sum, key) => sum + factors[key] * WEIGHTS[key], 0),
      inactiveFactors: [...(wet === false ? ["weatherAdaptability" as const] : []), ...(!s.race.isSprint ? ["sprintForm" as const] : [])],
      modelEstimate: 0, factors, missingFactors: FACTOR_KEYS.filter(key => raw.get(e.driverId)![key] === null),
      penaltySeverity: s.penalties ? penalties.get(e.driverId) ?? 0 : null,
      insight: "",
    };
    driver.insight = insightFacts(driver).slice(0, 2).join(" ");
    return driver;
  }).sort((a, b) => b.score - a.score || a.driverId.localeCompare(b.driverId));
  const distribution = modelDistribution(ranking.map(d => d.score));
  ranking.forEach((d, i) => { d.modelEstimate = distribution[i]; });
  const warnings = [...s.warnings];
  if (s.horizon === "post-qualifying" && !s.qualifying) warnings.push("This weekend’s qualifying result is unavailable; qualifying uses prior form where available.");
  if (!s.weather) warnings.push("Weather forecast unavailable at the cutoff; weather is neutral.");
  if (!s.penalties) warnings.push("Grid-penalty information unavailable; no clean-grid claim is made.");
  if (s.entryBasis === "practice") warnings.push("Provisional field from practice participants; later substitutions or withdrawals may change it.");
  if (s.entryBasis === "previous-race") warnings.push("Provisional field from the most recent available previous race; substitutions or withdrawals may change it. The field updates when weekend participants are published.");
  if (ranking.some(d => d.missingFactors.length)) warnings.push("Missing features use 50/100 neutral fallbacks; estimates have not been calibrated against race outcomes.");
  return {
    raceName: s.race.raceName, circuitId: s.race.circuitId, circuitName: s.race.circuitName, raceDate: s.race.raceDate,
    season: s.race.season, round: s.race.round, generatedAt: s.capturedAt, cutoff: s.cutoff, horizon: s.horizon,
    predictions: ranking.slice(0, 3), likelyFinishers: ranking.slice(3, topN), ranking,
    weather: { available: !!s.weather, rainProbability: s.weather?.value.rainProbability ?? null, temperatureC: s.weather?.value.temperatureC ?? null, windSpeedKph: s.weather?.value.windSpeedKph ?? null, isWetExpected: wet },
    isSprint: s.race.isSprint, sprintAvailable: !!s.sprint, entryBasis: s.entryBasis,
    coverage: Object.fromEntries(FACTOR_KEYS.map(key => [key, ranking.filter(d => !d.missingFactors.includes(key)).length / ranking.length])) as Record<FactorKey, number>,
    warnings: [...new Set(warnings)],
    modelSummary: "35% form · 15% qualifying · 15% championship · 10% circuit history · 10% weather · 7% sprint · 5% tyre fit · 3% grid penalties. Relative model estimates across the full eligible field; not calibrated win probabilities.",
  };
}
