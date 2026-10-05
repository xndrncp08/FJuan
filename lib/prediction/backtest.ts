/**
 * lib/prediction/backtest.ts
 *
 * Scores the classification engine against a finished race: the engine
 * only sees rounds before the target (getPriorRounds), so running it for
 * a completed round is an honest out-of-sample test.
 */

import { getLastRace } from "@/lib/api/jolpica";
import { getClassification } from "@/lib/telemetry/provider";
import type { RaceClassification } from "@/lib/telemetry/types";
import { generateRacePrediction } from "./engine";

export interface BacktestRow {
  driverId: string;
  code: string;
  name: string;
  constructorId: string;
  predicted: number;
  actual: number | null;
  /** predicted − actual places (negative = finished worse than predicted). */
  delta: number | null;
  score: number;
}

export interface Backtest {
  season: string;
  round: string;
  raceName: string;
  date: string;
  source: RaceClassification["source"];
  rows: BacktestRow[];
  stats: {
    positionMae: number;
    winnerCorrect: boolean;
    podiumHits: number;
    top10Hits: number;
    /** Spearman rank correlation between predicted and actual finishing order. */
    spearman: number;
    classified: number;
  };
}

function spearman(pairs: [number, number][]) {
  const n = pairs.length;
  if (n < 3) return 0;
  const d2 = pairs.reduce((s, [a, b]) => s + (a - b) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

export async function backtestRace(season?: string, round?: string): Promise<Backtest | null> {
  let target = season && round ? { season, round } : null;
  if (!target) {
    const last = await getLastRace();
    if (!last) return null;
    target = { season: last.season, round: last.round };
  }
  const actual = await getClassification(target.season, target.round);
  if (!actual) return null;

  const prediction = await generateRacePrediction(
    actual.season,
    actual.round,
    actual.raceName,
    actual.circuitId,
    actual.circuitName,
    actual.date,
    30,
    { insights: false },
  );
  const ranking = prediction.ranking ?? [...prediction.predictions, ...prediction.likelyFinishers];
  const finish = new Map(actual.rows.map((r) => [r.driverId, r]));

  // Re-rank predictions among drivers who actually started, so a reserve
  // driver in the model doesn't shift everyone by one place.
  const started = ranking.filter((p) => finish.has(p.driverId));
  const rows: BacktestRow[] = started.map((p, i) => {
    const a = finish.get(p.driverId)!;
    return {
      driverId: p.driverId,
      code: p.driverCode,
      name: `${p.givenName} ${p.familyName}`,
      constructorId: a.constructorId || p.constructorId,
      predicted: i + 1,
      actual: a.position,
      delta: a.position !== null ? i + 1 - a.position : null,
      score: p.score,
    };
  });

  const classified = rows.filter((r) => r.actual !== null);
  const top = (k: number, key: "predicted" | "actual") => new Set(rows.filter((r) => r[key] !== null && (r[key] as number) <= k).map((r) => r.driverId));
  const hits = (k: number) => [...top(k, "predicted")].filter((id) => top(k, "actual").has(id)).length;

  return {
    season: actual.season,
    round: actual.round,
    raceName: actual.raceName,
    date: actual.date,
    source: actual.source,
    rows,
    stats: {
      positionMae: classified.length ? classified.reduce((s, r) => s + Math.abs(r.delta as number), 0) / classified.length : 0,
      winnerCorrect: rows[0]?.actual === 1,
      podiumHits: hits(3),
      top10Hits: hits(10),
      spearman: spearman(classified.map((r) => [r.predicted, r.actual as number])),
      classified: classified.length,
    },
  };
}
