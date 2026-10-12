/**
 * lib/telemetry/analysis.ts
 *
 * Derived channels and lap-vs-lap comparison from raw TelemetrySamples:
 *
 *   gLong   longitudinal acceleration (g), from dv/dt
 *   gLat    lateral acceleration (g), v² × path curvature, signed (+ = left)
 *   corners speed minima with entry/apex/exit speeds, braking point, gear
 *   delta   time gap between two laps at the same fraction of lap distance
 *   mini    who was quicker through each of N equal-distance mini-sectors
 *
 * Laps are aligned by distance fraction (each lap's own length), so two
 * drivers' slightly different racing lines still line up corner for corner.
 * Pure functions, no imports beyond types: lib/telemetry/analysis.check.mjs
 * runs them under plain Node.
 */

import type { TelemetrySample } from "./types";

const G = 9.81;

/** Centred moving average; the window shrinks at the ends. */
export function smooth(values: number[], radius: number): number[] {
  const out = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let n = 0;
    for (let k = Math.max(0, i - radius); k <= Math.min(values.length - 1, i + radius); k++) {
      sum += values[k];
      n++;
    }
    out[i] = sum / n;
  }
  return out;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface Channels {
  gLong: number[];
  gLat: number[];
}

/** Longitudinal and lateral g per sample. GPS and speed are smoothed first; values clamp to ±6 g. */
export function deriveChannels(samples: TelemetrySample[]): Channels {
  const n = samples.length;
  const v = smooth(samples.map((s) => s.speed / 3.6), 2);
  const x = smooth(samples.map((s) => s.x), 3);
  const y = smooth(samples.map((s) => s.y), 3);
  const gLong = new Array<number>(n).fill(0);
  const gLat = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dt = samples[i + 1].t - samples[i - 1].t;
    if (dt > 0) gLong[i] = clamp((v[i + 1] - v[i - 1]) / dt / G, -6, 6);
    // Signed curvature from three consecutive points (Menger curvature).
    const ax = x[i] - x[i - 1], ay = y[i] - y[i - 1];
    const bx = x[i + 1] - x[i], by = y[i + 1] - y[i];
    const cross = ax * by - ay * bx;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by), lc = Math.hypot(x[i + 1] - x[i - 1], y[i + 1] - y[i - 1]);
    const k = la && lb && lc ? (2 * cross) / (la * lb * lc) : 0;
    gLat[i] = clamp((v[i] * v[i] * k) / G, -6, 6);
  }
  if (n > 1) {
    gLong[0] = gLong[1];
    gLong[n - 1] = gLong[n - 2];
    gLat[0] = gLat[1];
    gLat[n - 1] = gLat[n - 2];
  }
  return { gLong: smooth(gLong, 1), gLat: smooth(gLat, 2) };
}

export interface Corner {
  /** 1-based, in lap order. */
  number: number;
  apexIndex: number;
  apexDistance: number;
  /** Fraction of lap distance at the apex. */
  apexFrac: number;
  apexSpeed: number;
  entrySpeed: number;
  exitSpeed: number;
  gear: number;
  /** Distance where braking (or the lift) for this corner began. */
  brakeDistance: number;
  brakeIndex: number;
  direction: "L" | "R";
}

/**
 * Corners are local speed minima that sit at least `minDrop` km/h below the
 * fastest point since the previous corner, and at least `minGap` metres apart.
 */
export function findCorners(samples: TelemetrySample[], gLat?: number[], minDrop = 18, minGap = 120): Corner[] {
  const n = samples.length;
  if (n < 5) return [];
  const speed = smooth(samples.map((s) => s.speed), 1);
  const total = samples[n - 1].distance || 1;
  const corners: Corner[] = [];
  let peak = 0; // index of the fastest point since the last corner
  for (let i = 1; i < n - 1; i++) {
    if (speed[i] > speed[peak]) peak = i;
    const isMin = speed[i] <= speed[i - 1] && speed[i] < speed[i + 1];
    if (!isMin || speed[peak] - speed[i] < minDrop) continue;
    // Exit: fastest point before speed starts falling again (or the next 300 m).
    let exit = i;
    while (exit < n - 1 && speed[exit + 1] >= speed[exit] && samples[exit].distance - samples[i].distance < 300) exit++;
    // Braking point: first brake (or lift below 50 %) after the peak.
    let brake = peak;
    for (let k = peak; k <= i; k++) {
      if (samples[k].brake > 0 || samples[k].throttle < 50) {
        brake = k;
        break;
      }
    }
    const prev = corners[corners.length - 1];
    if (prev && samples[i].distance - prev.apexDistance < minGap) {
      // Too close to the last one: keep whichever is slower.
      if (speed[i] < prev.apexSpeed) corners.pop();
      else continue;
    }
    corners.push({
      number: 0,
      apexIndex: i,
      apexDistance: samples[i].distance,
      apexFrac: samples[i].distance / total,
      apexSpeed: speed[i],
      entrySpeed: speed[peak],
      exitSpeed: speed[exit],
      gear: samples[i].gear,
      brakeDistance: samples[brake].distance,
      brakeIndex: brake,
      direction: (gLat?.[i] ?? 0) >= 0 ? "L" : "R",
    });
    peak = i;
  }
  corners.forEach((c, k) => (c.number = k + 1));
  return corners;
}

/** Time into the lap at a given distance, by linear interpolation. */
export function timeAtDistance(samples: TelemetrySample[], d: number): number {
  const n = samples.length;
  if (d <= samples[0].distance) return samples[0].t;
  if (d >= samples[n - 1].distance) return samples[n - 1].t;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  const span = samples[hi].distance - samples[lo].distance || 1;
  return samples[lo].t + ((d - samples[lo].distance) / span) * (samples[hi].t - samples[lo].t);
}

/** Interpolated channel value at a given distance. */
export function valueAtDistance(samples: TelemetrySample[], d: number, pick: (s: TelemetrySample) => number): number {
  const n = samples.length;
  let lo = 0;
  let hi = n - 1;
  if (d <= samples[0].distance) return pick(samples[0]);
  if (d >= samples[hi].distance) return pick(samples[hi]);
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  const f = (d - samples[lo].distance) / (samples[hi].distance - samples[lo].distance || 1);
  return pick(samples[lo]) + (pick(samples[hi]) - pick(samples[lo])) * f;
}

const lapLength = (s: TelemetrySample[]) => s[s.length - 1].distance || 1;

/**
 * Gap of lap A to lap B (seconds) at `steps` points along the lap.
 * Positive = A is behind (slower to reach that point).
 */
export function deltaTrace(a: TelemetrySample[], b: TelemetrySample[], steps = 400, radius = 4): { frac: number; delta: number }[] {
  const la = lapLength(a);
  const lb = lapLength(b);
  const raw = Array.from({ length: steps + 1 }, (_, i) => timeAtDistance(a, (i / steps) * la) - timeAtDistance(b, (i / steps) * lb));
  // Two racing lines measured by ~4 Hz GPS disagree by a few metres point to point;
  // smoothing removes that jitter without moving where time is gained or lost.
  const smoothed = smooth(raw, radius);
  // Keep the true endpoints: zero at the line, the real lap-time gap at the flag.
  smoothed[0] = raw[0];
  smoothed[steps] = raw[steps];
  return smoothed.map((delta, i) => ({ frac: i / steps, delta }));
}

/** Gap at a distance fraction, read off a deltaTrace by linear interpolation. */
export function deltaOnTrace(trace: { frac: number; delta: number }[], frac: number): number {
  const x = Math.max(0, Math.min(1, frac)) * (trace.length - 1);
  const i = Math.floor(x);
  const j = Math.min(trace.length - 1, i + 1);
  return trace[i].delta + (trace[j].delta - trace[i].delta) * (x - i);
}

/** Gap at one distance fraction (same sign convention as deltaTrace). */
export function deltaAt(a: TelemetrySample[], b: TelemetrySample[], frac: number): number {
  return timeAtDistance(a, frac * lapLength(a)) - timeAtDistance(b, frac * lapLength(b));
}

/** Per mini-sector: time taken by A and B, and who was quicker (-1 = A, 1 = B, 0 = level). */
export function miniSectors(a: TelemetrySample[], b: TelemetrySample[], count = 24): { from: number; to: number; a: number; b: number; winner: -1 | 0 | 1 }[] {
  const la = lapLength(a);
  const lb = lapLength(b);
  return Array.from({ length: count }, (_, i) => {
    const from = i / count;
    const to = (i + 1) / count;
    const ta = timeAtDistance(a, to * la) - timeAtDistance(a, from * la);
    const tb = timeAtDistance(b, to * lb) - timeAtDistance(b, from * lb);
    const winner = Math.abs(ta - tb) < 0.005 ? 0 : ta < tb ? -1 : 1;
    return { from, to, a: ta, b: tb, winner };
  });
}
