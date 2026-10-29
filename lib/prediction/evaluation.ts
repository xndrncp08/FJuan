import type { PredictionHorizon, PredictionSnapshot } from "@/lib/types/prediction";
import { evaluateSnapshot } from "./backtest";
import { scorePrediction, FACTOR_KEYS, WEIGHTS } from "./engine";
import { baselineRankings, type Outcome, type RankingMetrics, type RankingEntry } from "./metrics";

export interface EvaluationManifest {
  schemaVersion: 1;
  trainThrough: string;
  validationThrough: string;
  races: { season: string; round: string; date: string; snapshots: Partial<Record<PredictionHorizon, string>>; outcome?: string }[];
}
const mean = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
export function calibration(rows: { estimate: number; won: number }[]) {
  const bins = Array.from({ length: 10 }, (_, i) => {
    const values = rows.filter(r => Math.min(9, Math.floor(r.estimate * 10)) === i);
    return { lower: i / 10, upper: (i + 1) / 10, n: values.length, estimate: mean(values.map(v => v.estimate)), frequency: mean(values.map(v => v.won)) };
  });
  return { n: rows.length, ece: rows.length ? bins.reduce((n, b) => n + b.n * Math.abs((b.estimate ?? 0) - (b.frequency ?? 0)), 0) / rows.length : null, bins };
}
export async function evaluateManifest(manifest: EvaluationManifest, load: (file: string) => Promise<any>, includeHoldout = false) {
  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s));
  if (manifest.schemaVersion !== 1 || !validDate(manifest.trainThrough) || !validDate(manifest.validationThrough) || manifest.trainThrough >= manifest.validationThrough) throw new Error("Explicit chronological training and validation boundaries are required.");
  if (new Set(manifest.races.map(r => `${r.season}/${r.round}`)).size !== manifest.races.length || manifest.races.some(r => !validDate(r.date))) throw new Error("Invalid or duplicate evaluation race.");
  const records: { split: string; horizon: PredictionHorizon; race: string; name: string; metrics: RankingMetrics; coverage: Record<string, number>; cutoff: string; minutesBeforeRace: number }[] = [];
  const probabilities: Record<string, { estimate: number; won: number }[]> = {};
  const exclusions: { race: string; horizon: PredictionHorizon; split: string; reason: string }[] = [];
  let reservedHoldout = 0;
  for (const race of [...manifest.races].sort((a, b) => a.date.localeCompare(b.date))) {
    const split = race.date <= manifest.trainThrough ? "train" : race.date <= manifest.validationThrough ? "validation" : "holdout";
    if (split === "holdout" && !includeHoldout) { reservedHoldout++; continue; }
    for (const horizon of ["pre-qualifying", "post-qualifying"] as const) {
      const key = `${race.season}/${race.round}`;
      const skip = (reason: string) => exclusions.push({ race: key, horizon, split, reason });
      const file = race.snapshots[horizon];
      if (!file) { skip("No pre-race snapshot for this horizon"); continue; }
      if (!race.outcome) { skip("No final outcome file"); continue; }
      try {
        const snapshot = await load(file) as PredictionSnapshot;
        if (snapshot.race.season !== race.season || snapshot.race.round !== race.round || snapshot.race.raceDate !== race.date || snapshot.horizon !== horizon) throw new Error("Snapshot does not match the manifest race/horizon");
        const prediction = scorePrediction(snapshot);
        const result = await load(race.outcome) as { season: string; round: string; date: string; rows: Outcome[] };
        if (result.season !== race.season || result.round !== race.round || result.date !== race.date || !Array.isArray(result.rows)) throw new Error("Outcome does not match the manifest race");
        const review = evaluateSnapshot(snapshot, result.rows);
        if (!review.stats.completeField || review.stats.brier === null) { skip(`Incomplete field or outcome: missing drivers [${review.stats.missingDrivers.join(", ")}]; missing outcomes [${review.stats.missingOutcomes.join(", ")}]`); continue; }
        const rankings: Record<string, RankingEntry[] | null> = { correctedBaseline: prediction.ranking, ...baselineRankings(snapshot, prediction.ranking) };
        const stats = { correctedBaseline: review.stats, ...review.baselines };
        for (const [name, metrics] of Object.entries(stats)) {
          if (!metrics) { skip(`${name} baseline lacks full-field inputs at this horizon`); continue; }
          records.push({ race: key, split, horizon, name, metrics, coverage: review.coverage, cutoff: snapshot.cutoff, minutesBeforeRace: (Date.parse(snapshot.race.raceStart) - Date.parse(snapshot.cutoff)) / 60000 });
          const group = `${split}/${horizon}/${name}`;
          probabilities[group] ??= [];
          probabilities[group].push(...rankings[name]!.map(d => ({ estimate: d.modelEstimate, won: result.rows.some(o => o.driverId === d.driverId && o.position === 1 && o.status !== "dns" && o.status !== "dsq") ? 1 : 0 })));
        }
      } catch (err) { skip((err as Error).message); }
    }
  }
  const groups = [...new Set(records.map(r => `${r.split}/${r.horizon}/${r.name}`))].map(key => {
    const rows = records.filter(r => `${r.split}/${r.horizon}/${r.name}` === key);
    const metric = (name: keyof RankingMetrics) => rows.map(r => r.metrics[name]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    return { group: key, n: rows.length, races: rows.map(r => ({ race: r.race, cutoff: r.cutoff, minutesBeforeRace: r.minutesBeforeRace })), winnerAccuracy: mean(rows.map(r => r.metrics.winnerCorrect ? 1 : 0)),
      ...Object.fromEntries(["positionMae", "spearman", "podiumHits", "top10Hits", "brier", "logLoss"].map(m => { const values = metric(m as keyof RankingMetrics); return [m, { n: values.length, mean: mean(values), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null }]; })),
      infiniteLogLosses: rows.filter(r => r.metrics.zeroProbabilityWinner).length,
      coverage: Object.fromEntries(FACTOR_KEYS.map(f => [f, mean(rows.map(r => r.coverage[f]))])),
      calibration: calibration(probabilities[key] ?? []),
    };
  });
  const comparisons = [...new Set(records.filter(r => r.name !== "correctedBaseline").map(r => `${r.split}/${r.horizon}/${r.name}`))].map(group => {
    const baseline = records.filter(r => `${r.split}/${r.horizon}/${r.name}` === group);
    const paired = baseline.flatMap(b => {
      const model = records.find(r => r.name === "correctedBaseline" && r.race === b.race && r.split === b.split && r.horizon === b.horizon);
      return model ? [{ model, baseline: b }] : [];
    });
    return { group, n: paired.length, races: paired.map(p => p.model.race), differences: Object.fromEntries(["positionMae", "spearman", "podiumHits", "brier", "logLoss"].map(key => {
      const values = paired.flatMap(p => {
        const a = p.model.metrics[key as keyof RankingMetrics], b = p.baseline.metrics[key as keyof RankingMetrics];
        return typeof a === "number" && typeof b === "number" && Number.isFinite(a) && Number.isFinite(b) ? [a - b] : [];
      });
      return [key, { n: values.length, modelMinusBaseline: mean(values) }];
    })) };
  });
  return {
    model: "corrected-v1", weights: WEIGHTS, tuned: false,
    policy: "Timestamped inputs only; horizons evaluated separately. No outcome data used to score predictions. Compare methods only on their shared race sets.",
    splits: { trainThrough: manifest.trainThrough, validationThrough: manifest.validationThrough, holdoutEvaluated: includeHoldout, reservedHoldout },
    racesInManifest: manifest.races.length, groups, comparisons, exclusions,
    limitations: ["No predictive improvement is established by regression tests or synthetic data.", "Weights and softmax temperature remain fixed. Relative estimates are not calibrated win probabilities.", "Calibration bins pool driver outcomes; observations within a race are dependent. Small samples and favorable individual races do not establish improvement.", "Historical weather without a captured forecast is neutral. Realized weather and present-day forecasts are never substituted.", "No training or weight tuning was performed. Holdout files remain unread unless explicitly included after the model is frozen."],
  };
}
