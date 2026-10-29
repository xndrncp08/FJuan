/** Missing features are neutral and never set the normalization bounds. */
export function normalise(entries: [string, number | null][]): Map<string, number> {
  const values = entries.map(([, v]) => v).filter((v): v is number => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
  const percentile = (p: number) => {
    const index = p * (values.length - 1);
    const low = Math.floor(index);
    return values[low] + (values[Math.ceil(index)] - values[low]) * (index - low);
  };
  let low = values.length ? percentile(0.05) : 0;
  let high = values.length ? percentile(0.95) : 0;
  // Sparse signals must not disappear when both clipped bounds coincide.
  if (low === high && values.length) { low = values[0]; high = values[values.length - 1]; }
  return new Map(entries.map(([id, value]) => [id, value === null || !Number.isFinite(value) || high === low ? 50 : 100 * (Math.min(high, Math.max(low, value)) - low) / (high - low)]));
}

export function modelDistribution(scores: number[], temperature = 8): number[] {
  if (!scores.length) return [];
  if (!Number.isFinite(temperature) || temperature <= 0 || scores.some(s => !Number.isFinite(s))) throw new Error("Distribution inputs must be finite; temperature must be positive.");
  const max = Math.max(...scores);
  const weights = scores.map(s => Math.exp((s - max) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / total);
}

/** Average ranks for ties; accepts arbitrary numeric values, not just consecutive places. */
export function ranks(values: number[]): number[] {
  const sorted = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value);
  const result: number[] = [];
  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].value === sorted[i].value) j++;
    for (let k = i; k < j; k++) result[sorted[k].i] = (i + 1 + j) / 2;
    i = j;
  }
  return result;
}

export function spearman(pairs: [number, number][]): number | null {
  if (pairs.length < 3 || pairs.some(p => p.some(v => !Number.isFinite(v)))) return null;
  const x = ranks(pairs.map(p => p[0]));
  const y = ranks(pairs.map(p => p[1]));
  const mean = (pairs.length + 1) / 2;
  const covariance = x.reduce((sum, v, i) => sum + (v - mean) * (y[i] - mean), 0);
  const variance = (v: number[]) => v.reduce((sum, a) => sum + (a - mean) ** 2, 0);
  const denominator = Math.sqrt(variance(x) * variance(y));
  return denominator === 0 ? null : covariance / denominator;
}
