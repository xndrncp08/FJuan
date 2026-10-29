import type { DriverPrediction, PredictionSnapshot } from "@/lib/types/prediction";
import { canonicalDriverId } from "./ratings";
import { modelDistribution, normalise, ranks, spearman } from "./math";

export interface Outcome { driverId: string; position: number | null; status: "finished" | "dnf" | "dns" | "dsq" }
export interface RankingEntry { driverId: string; score: number; modelEstimate: number }
export interface RankingMetrics {
  positionMae: number | null;
  spearman: number | null;
  winnerCorrect: boolean | null;
  podiumHits: number | null;
  top10Hits: number | null;
  classified: number;
  completeField: boolean;
  missingDrivers: string[];
  missingOutcomes: string[];
  brier: number | null;
  logLoss: number | null;
  zeroProbabilityWinner: boolean;
}
export function parseOutcomes(rows: any[]): Outcome[] {
  return rows.map(r => {
    const text = String(r.positionText ?? "");
    const status = String(r.status ?? "");
    const kind = /disqualif/i.test(status) || text === "D" ? "dsq" : /did not start|did not qualify|withdraw|not started|excluded/i.test(status) || ["W", "F", "N"].includes(text) ? "dns" : /^finished$|^\+\d+ lap/i.test(status) || (!status && /^\d+$/.test(text)) ? "finished" : "dnf";
    const position = Number(r.position);
    return { driverId: canonicalDriverId(r.Driver.driverId), position: Number.isFinite(position) && position > 0 ? position : null, status: kind };
  });
}
export function outcomePositions(outcomes: Outcome[]): Map<string, number> {
  const last = Math.max(0, ...outcomes.filter(o => o.status !== "dns" && o.status !== "dsq").map(o => o.position ?? 0));
  return new Map(outcomes.filter(o => o.status !== "dns" && (o.position !== null || o.status === "dsq")).map(o => [o.driverId, o.status === "dsq" ? last + 1 : o.position!]));
}
/** Expected top-k membership under random ordering within exact score ties. */
function topMembership(ranking: RankingEntry[], k: number): Map<string, number> {
  const order = [...ranking].sort((a, b) => b.score - a.score);
  const result = new Map<string, number>();
  for (let i = 0; i < order.length;) {
    let j = i + 1;
    while (j < order.length && order[j].score === order[i].score) j++;
    const share = Math.min(j - i, Math.max(0, k - i)) / (j - i);
    for (let p = i; p < j; p++) result.set(order[p].driverId, share);
    i = j;
  }
  return result;
}
export function rankingMetrics(ranking: RankingEntry[], outcomes: Outcome[]): RankingMetrics {
  if (new Set(ranking.map(r => r.driverId)).size !== ranking.length || new Set(outcomes.map(o => o.driverId)).size !== outcomes.length) throw new Error("Duplicate evaluation driver.");
  if (ranking.some(r => !Number.isFinite(r.score) || !Number.isFinite(r.modelEstimate) || r.modelEstimate < 0) || (ranking.length && Math.abs(ranking.reduce((n, r) => n + r.modelEstimate, 0) - 1) > 1e-9)) throw new Error("Invalid full-field estimate distribution.");
  if (outcomes.some(o => !["finished", "dnf", "dns", "dsq"].includes(o.status) || (o.position !== null && (!Number.isFinite(o.position) || o.position <= 0)))) throw new Error("Invalid evaluation outcome.");
  const actual = outcomePositions(outcomes);
  const missingDrivers = outcomes.filter(o => o.status !== "dns" && !ranking.some(r => r.driverId === o.driverId)).map(o => o.driverId);
  const missingOutcomes = ranking.filter(r => !outcomes.some(o => o.driverId === r.driverId) || outcomes.some(o => o.driverId === r.driverId && o.status !== "dns" && o.status !== "dsq" && o.position === null)).map(r => r.driverId);
  const aligned = ranking.filter(r => actual.has(r.driverId));
  const complete = missingDrivers.length === 0 && missingOutcomes.length === 0 && ranking.length > 0;
  const winner = outcomes.find(o => o.position === 1 && o.status !== "dns" && o.status !== "dsq");
  const assessed = complete && !!winner;
  const predictedRanks = ranks(aligned.map(r => -r.score));
  const actualRanks = ranks(aligned.map(r => actual.get(r.driverId)!));
  const hits = (k: number) => {
    const membership = topMembership(ranking, k);
    return outcomes.filter(o => o.position !== null && o.position <= k && o.status !== "dsq" && o.status !== "dns").reduce((n, o) => n + (membership.get(o.driverId) ?? 0), 0);
  };
  const winnerEstimate = ranking.find(r => r.driverId === winner?.driverId)?.modelEstimate;
  return {
    completeField: complete, missingDrivers, missingOutcomes, classified: aligned.length,
    positionMae: assessed && aligned.length ? predictedRanks.reduce((n, p, i) => n + Math.abs(p - actualRanks[i]), 0) / aligned.length : null,
    spearman: assessed ? spearman(aligned.map(r => [-r.score, actual.get(r.driverId)!])) : null,
    // Tied leaders do not count as an unambiguous winner call.
    winnerCorrect: assessed ? topMembership(ranking, 1).get(winner!.driverId) === 1 : null,
    podiumHits: assessed ? hits(3) : null, top10Hits: assessed ? hits(10) : null,
    brier: assessed ? ranking.reduce((n, r) => n + (r.modelEstimate - (r.driverId === winner!.driverId ? 1 : 0)) ** 2, 0) : null,
    logLoss: assessed && winnerEstimate && winnerEstimate > 0 ? -Math.log(winnerEstimate) : null,
    zeroProbabilityWinner: assessed && winnerEstimate === 0,
  };
}
export function baselineRankings(s: PredictionSnapshot, prediction: DriverPrediction[]): Record<string, RankingEntry[] | null> {
  const recentForm = prediction.some(d => d.missingFactors.includes("currentForm")) ? null : prediction.map(d => ({driverId: d.driverId, score: d.factors.currentForm}));
  const championship = s.standings && prediction.every(d => s.standings!.value.rows.some(r => canonicalDriverId(r.driverId) === d.driverId))
    ? prediction.map(d => ({driverId: d.driverId, score: -s.standings!.value.rows.find(r => canonicalDriverId(r.driverId) === d.driverId)!.position})) : null;
  const grid = s.horizon === "post-qualifying" && s.startingGrid && prediction.every(d => s.startingGrid!.value.some(g => canonicalDriverId(g.driverId) === d.driverId))
    ? prediction.map(d => ({driverId: d.driverId, score: -s.startingGrid!.value.find(g => canonicalDriverId(g.driverId) === d.driverId)!.position})) : null;
  const qualifying = s.horizon === "post-qualifying" && s.qualifying && prediction.every(d => s.qualifying!.value.rows.some(g => canonicalDriverId(g.driverId) === d.driverId))
    ? prediction.map(d => ({driverId: d.driverId, score: -s.qualifying!.value.rows.find(g => canonicalDriverId(g.driverId) === d.driverId)!.position})) : null;
  return Object.fromEntries(Object.entries({ championship, recentForm, qualifying, startingGrid: grid }).map(([key, values]) => {
    if (!values) return [key, null];
    const norm = normalise(values.map(v => [v.driverId, v.score]));
    const distribution = modelDistribution(values.map(v => norm.get(v.driverId)!));
    return [key, values.map((v, i) => ({...v, modelEstimate: distribution[i]}))];
  }));
}
