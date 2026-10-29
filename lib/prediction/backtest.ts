import { getLastRace, getRaceResults } from "@/lib/api/jolpica";
import type { PredictionHorizon, PredictionSnapshot } from "@/lib/types/prediction";
import { scorePrediction } from "./engine";
import { findSnapshot } from "./snapshots";
import { baselineRankings, outcomePositions, parseOutcomes, rankingMetrics, type Outcome, type RankingMetrics } from "./metrics";
import { PredictionUnavailableError } from "./policy";

export interface BacktestRow {
  driverId: string; code: string; name: string; constructorId: string;
  predicted: number; actual: number | null; delta: number | null; score: number;
  status: Outcome["status"] | "missing";
}
export interface Backtest {
  season: string; round: string; raceName: string; date: string; source: "jolpica";
  horizon: PredictionHorizon; cutoff: string; rows: BacktestRow[];
  stats: RankingMetrics;
  baselines: Record<string, RankingMetrics | null>;
  coverage: ReturnType<typeof scorePrediction>["coverage"];
  warnings: string[];
}
export function evaluateSnapshot(snapshot: PredictionSnapshot, outcomes: Outcome[]): Backtest {
  const prediction = scorePrediction(snapshot);
  const actual = outcomePositions(outcomes);
  const rows = prediction.ranking.map((d, i) => ({
    driverId: d.driverId, code: d.driverCode, name: `${d.givenName} ${d.familyName}`, constructorId: d.constructorId,
    predicted: i + 1, actual: actual.get(d.driverId) ?? null, delta: actual.has(d.driverId) ? i + 1 - actual.get(d.driverId)! : null,
    score: d.score, status: outcomes.find(o => o.driverId === d.driverId)?.status ?? "missing" as const,
  }));
  return {
    season: snapshot.race.season, round: snapshot.race.round, raceName: snapshot.race.raceName, date: snapshot.race.raceDate, source: "jolpica",
    horizon: snapshot.horizon, cutoff: snapshot.cutoff, rows, stats: rankingMetrics(prediction.ranking, outcomes),
    baselines: Object.fromEntries(Object.entries(baselineRankings(snapshot, prediction.ranking)).map(([name, ranking]) => [name, ranking ? rankingMetrics(ranking, outcomes) : null])),
    coverage: prediction.coverage, warnings: prediction.warnings,
  };
}
export async function backtestRace(season?: string, round?: string, horizon: PredictionHorizon = "post-qualifying"): Promise<Backtest | null> {
  let target = season && round ? { season, round } : null;
  if (!target) {
    const last = await getLastRace();
    if (!last) return null;
    target = { season: last.season, round: last.round };
  }
  const snapshot = await findSnapshot(target.season, target.round, horizon);
  if (!snapshot) throw new PredictionUnavailableError(`No saved ${horizon} snapshot for this race. It is excluded from evaluation; present-day historical responses cannot replace pre-race inputs.`);
  const actual = await getRaceResults(target.season, target.round);
  if (!actual?.Results?.length) return null;
  return evaluateSnapshot(snapshot, parseOutcomes(actual.Results));
}
