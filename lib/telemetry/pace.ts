/**
 * lib/telemetry/pace.ts
 *
 * Session pace maths on lap-time lists (no car data needed):
 *
 *   cleanLaps    timed laps minus pit-out laps and slow outliers (safety
 *                car, traffic, in-laps): anything over 107 % of the median
 *   fuelCorrect  adds back the time a car gains each lap as fuel burns, so
 *                what's left is mostly tyre degradation
 *   fitLine      least-squares slope/intercept
 *   stintPace    per stint: best, mean, spread (σ), and degradation in s/lap
 *   idealLap     sum of the best sector times
 *
 * Pure functions; lib/telemetry/analysis.check.mjs covers them.
 */

export interface PaceLap {
  lap: number;
  time: number | null;
  pitOut: boolean;
  sectors?: (number | null)[];
}

export interface StintRange {
  stint: number;
  compound: string;
  lapStart: number;
  lapEnd: number;
  tyreAgeAtStart: number;
}

// shortcut: one fixed fuel effect for every car and circuit (≈1.7 kg/lap × 0.032 s/kg);
// upgrade to per-circuit fuel loads if they ever become available.
export const FUEL_S_PER_LAP = 0.055;

const median = (v: number[]) => {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function cleanLaps<T extends PaceLap>(laps: T[], cutoff = 1.07): (T & { time: number })[] {
  const timed = laps.filter((l): l is T & { time: number } => !l.pitOut && l.time !== null && l.time > 0);
  const m = median(timed.map((l) => l.time));
  return timed.filter((l) => l.time <= m * cutoff);
}

/** Lap time with the fuel-burn gain added back, as if every lap ran on lap-1 fuel. */
export const fuelCorrect = (time: number, lap: number, perLap = FUEL_S_PER_LAP) => time + perLap * (lap - 1);

export function fitLine(points: [number, number][]): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 3) return null;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const [x, y] of points) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
  }
  if (!sxx) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

export interface StintPace extends StintRange {
  laps: number;
  clean: number;
  best: number | null;
  mean: number | null;
  sigma: number | null;
  /** Seconds per lap of tyre age (fuel-corrected when `fuel` is on); null when too few clean laps. */
  deg: number | null;
  /** Fitted line over the stint, in lap-number space, for drawing. */
  fit: { slope: number; intercept: number } | null;
}

export function stintPace(laps: PaceLap[], stints: StintRange[], fuel: boolean): StintPace[] {
  return stints.map((s) => {
    const inStint = laps.filter((l) => l.lap >= s.lapStart && l.lap <= s.lapEnd);
    // The lap into the pits is slow by design; drop it unless it's the final lap.
    const usable = inStint.filter((l) => l.lap !== s.lapEnd || s === stints[stints.length - 1]);
    const clean = cleanLaps(usable);
    const times = clean.map((l) => (fuel ? fuelCorrect(l.time, l.lap) : l.time));
    const mean = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const sigma = mean !== null && times.length > 1 ? Math.sqrt(times.reduce((a, t) => a + (t - mean) ** 2, 0) / (times.length - 1)) : null;
    const fit = fitLine(clean.map((l, i) => [l.lap, times[i]]));
    return {
      ...s,
      laps: inStint.length,
      clean: clean.length,
      best: clean.length ? Math.min(...clean.map((l) => l.time)) : null,
      mean,
      sigma,
      deg: fit && clean.length >= 4 ? fit.slope : null,
      fit,
    };
  });
}

/** Sum of the best time in each sector; null if any sector was never timed. */
export function idealLap(laps: PaceLap[]): number | null {
  const valid = laps.filter((l) => !l.pitOut && l.sectors?.length);
  const bests = [0, 1, 2].map((i) => {
    const v = valid.map((l) => l.sectors?.[i]).filter((x): x is number => typeof x === "number" && x > 0);
    return v.length ? Math.min(...v) : null;
  });
  return bests.every((b) => b !== null) ? (bests as number[]).reduce((a, b) => a + b, 0) : null;
}
