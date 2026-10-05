/**
 * lib/prediction/laptime.ts
 *
 * Race-pace model: predicts every lap of a stint plan from first principles,
 * so it can be scored against what actually happened.
 *
 *   lap time = base pace
 *            + fuel load            (kg on board × s/kg)
 *            + compound offset      (soft → hard pace gap)
 *            + thermal degradation  (per-lap wear, scaled by how far the
 *                                    track temperature sits outside the
 *                                    compound's working window, plus a
 *                                    cliff once the tyre is past its life)
 *            + thermal pace offset  (tyre out of its window is slower even
 *                                    when new)
 *            + warm-up              (out-lap / first flying lap on cold tyres)
 *            − track evolution      (rubbering-in, capped)
 *
 * Sector micro-deltas: the lap is split into sectors using the reference
 * lap's sector shares, and degradation is weighted toward sectors with more
 * braking (traction and braking zones punish worn tyres hardest).
 *
 * The base pace is the only free parameter. `calibrate()` fits it on a
 * short window of early green-flag laps and everything after that window
 * is a genuine out-of-sample prediction — that's what the delta suite
 * scores.
 *
 * This is the classification engine's sibling: engine.ts predicts who
 * finishes where; this predicts how fast each lap is.
 */

import type { Compound, LapSummary, Stint, TelemetrySample } from "@/lib/telemetry/types";

export interface CompoundModel {
  /** Pace gap to a new soft at the reference temperature, seconds. */
  offset: number;
  /** Linear wear, seconds lost per lap of tyre age. */
  deg: number;
  /** Tyre age where the cliff starts. */
  cliffLap: number;
  /** Quadratic coefficient past the cliff, s/lap². */
  cliffRate: number;
  /** Track temperature working window, °C. */
  window: [number, number];
  /** Extra time on the out-lap/first lap of the stint, seconds. */
  warmup: number;
}

export const COMPOUNDS: Record<Compound, CompoundModel> = {
  SOFT: { offset: 0, deg: 0.085, cliffLap: 16, cliffRate: 0.035, window: [24, 42], warmup: 0.7 },
  MEDIUM: { offset: 0.45, deg: 0.055, cliffLap: 27, cliffRate: 0.024, window: [30, 50], warmup: 1.0 },
  HARD: { offset: 0.85, deg: 0.035, cliffLap: 40, cliffRate: 0.018, window: [36, 58], warmup: 1.4 },
  INTERMEDIATE: { offset: 5.5, deg: 0.06, cliffLap: 22, cliffRate: 0.04, window: [12, 32], warmup: 1.2 },
  WET: { offset: 9.5, deg: 0.05, cliffLap: 28, cliffRate: 0.03, window: [8, 28], warmup: 1.2 },
};

export interface LapModelConfig {
  /** Clean lap on a new soft, zero fuel, reference temperature. Fitted by calibrate(). */
  basePace: number;
  totalLaps: number;
  fuelStartKg: number;
  fuelSecPerKg: number;
  /** Seconds gained per lap from rubbering-in, and the cap. */
  evolutionPerLap: number;
  evolutionCap: number;
  /** Seconds lost per °C outside the compound window (pace, not wear). */
  thermalPacePerDeg: number;
  /** Extra wear multiplier per °C above / below the window. */
  overheatWearPerDeg: number;
  grainingWearPerDeg: number;
  /** Multiplier on all tyre wear, fitted per driver/race by calibrate(). */
  degScale: number;
  /** Time lost to a pit stop (pit lane + stationary), seconds. */
  pitLoss: number;
  /** Fraction of the lap in each sector, from a reference lap. */
  sectorShares: [number, number, number];
  /** Relative braking density per sector — weights where wear shows up. */
  sectorBrakeWeights: [number, number, number];
}

export const DEFAULT_CONFIG: Omit<LapModelConfig, "basePace" | "totalLaps"> = {
  fuelStartKg: 100,
  fuelSecPerKg: 0.032,
  evolutionPerLap: 0.012,
  evolutionCap: 0.6,
  thermalPacePerDeg: 0.018,
  overheatWearPerDeg: 0.05,
  grainingWearPerDeg: 0.03,
  degScale: 1,
  pitLoss: 22,
  sectorShares: [0.32, 0.36, 0.32],
  sectorBrakeWeights: [1, 1, 1],
};

export interface LapBreakdown {
  base: number;
  fuel: number;
  compound: number;
  degradation: number;
  thermal: number;
  warmup: number;
  evolution: number;
}

export interface LapPrediction {
  lapNumber: number;
  lapTime: number;
  sectors: [number, number, number];
  compound: Compound;
  tyreAge: number;
  trackTemp: number;
  breakdown: LapBreakdown;
}

function outsideWindow(temp: number, [lo, hi]: [number, number]) {
  return { over: Math.max(0, temp - hi), under: Math.max(0, lo - temp) };
}

/** Seconds lost to tyre wear at this age and temperature. */
export function degradation(
  compound: Compound,
  tyreAge: number,
  trackTemp: number,
  cfg: Pick<LapModelConfig, "overheatWearPerDeg" | "grainingWearPerDeg"> & { degScale?: number },
) {
  const m = COMPOUNDS[compound];
  const { over, under } = outsideWindow(trackTemp, m.window);
  const thermalWear = 1 + over * cfg.overheatWearPerDeg + under * cfg.grainingWearPerDeg;
  const linear = m.deg * tyreAge * thermalWear;
  const pastCliff = Math.max(0, tyreAge - m.cliffLap);
  return (cfg.degScale ?? 1) * (linear + m.cliffRate * pastCliff * pastCliff * thermalWear);
}

export function predictLap(
  cfg: LapModelConfig,
  input: { lapNumber: number; compound: Compound; tyreAge: number; trackTemp: number; isOutLap?: boolean; stintLap?: number },
): LapPrediction {
  const m = COMPOUNDS[input.compound];
  const burnPerLap = cfg.fuelStartKg / Math.max(1, cfg.totalLaps);
  const fuelKg = Math.max(0, cfg.fuelStartKg - burnPerLap * (input.lapNumber - 1));
  const { over, under } = outsideWindow(input.trackTemp, m.window);

  const breakdown: LapBreakdown = {
    base: cfg.basePace,
    fuel: fuelKg * cfg.fuelSecPerKg,
    compound: m.offset,
    degradation: degradation(input.compound, input.tyreAge, input.trackTemp, cfg),
    thermal: (over + under) * cfg.thermalPacePerDeg,
    warmup: input.isOutLap || input.stintLap === 0 ? m.warmup : input.stintLap === 1 ? m.warmup * 0.25 : 0,
    evolution: -Math.min(cfg.evolutionCap, cfg.evolutionPerLap * (input.lapNumber - 1)),
  };
  const lapTime = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Sector split: the clean part of the lap follows the reference shares;
  // wear and thermal loss lean toward braking-heavy sectors.
  const wear = breakdown.degradation + breakdown.thermal;
  const clean = lapTime - wear;
  const wTotal = cfg.sectorShares.reduce((s, share, i) => s + share * cfg.sectorBrakeWeights[i], 0) || 1;
  const sectors = cfg.sectorShares.map((share, i) => clean * share + (wear * share * cfg.sectorBrakeWeights[i]) / wTotal) as [number, number, number];

  return { lapNumber: input.lapNumber, lapTime, sectors, compound: input.compound, tyreAge: input.tyreAge, trackTemp: input.trackTemp, breakdown };
}

/** Track temperature at a given lap, interpolated from a [lap, °C] series. */
export function tempAtLap(series: [number, number][], lap: number, fallback = 35): number {
  if (!series.length) return fallback;
  if (lap <= series[0][0]) return series[0][1];
  for (let i = 1; i < series.length; i++) {
    const [l1, t1] = series[i];
    if (lap <= l1) {
      const [l0, t0] = series[i - 1];
      return t0 + ((t1 - t0) * (lap - l0)) / Math.max(1e-6, l1 - l0);
    }
  }
  return series[series.length - 1][1];
}

/** Predict every lap of a stint plan. */
export function predictRace(cfg: LapModelConfig, stints: Stint[], tempsByLap: [number, number][]): LapPrediction[] {
  const out: LapPrediction[] = [];
  for (const s of stints) {
    for (let lap = s.lapStart; lap <= s.lapEnd; lap++) {
      const stintLap = lap - s.lapStart;
      out.push(
        predictLap(cfg, {
          lapNumber: lap,
          compound: s.compound,
          tyreAge: s.tyreAgeAtStart + stintLap,
          trackTemp: tempAtLap(tempsByLap, lap),
          stintLap: s.stint === 1 ? -1 : stintLap, // lap 1 is a standing start, not an out-lap
        }),
      );
    }
  }
  return out;
}

/**
 * Fit the model's two free parameters — base pace and a wear multiplier —
 * by least squares on the first `fraction` of clean laps (at least
 * `minLaps`). Everything after that window is out of sample. Returns the
 * fitted config plus the laps used, so callers can exclude them from
 * scoring.
 *
 * The wear multiplier absorbs what the generic compound table can't know
 * (this year's tyres, this track's abrasiveness, this driver's management).
 * It's only fitted when the window spans enough tyre ageing to identify it.
 */
export function calibrate(
  partial: Omit<LapModelConfig, "basePace" | "degScale"> & { degScale?: number },
  laps: LapSummary[],
  tempsByLap: [number, number][],
  fraction = 0.4,
  minLaps = 5,
): { cfg: LapModelConfig; trainingLaps: number[] } {
  const probe: LapModelConfig = { ...partial, basePace: 0, degScale: 0 };
  const clean = cleanLaps(laps);
  const window = clean.slice(0, Math.max(minLaps, Math.floor(clean.length * fraction)));
  if (!window.length) return { cfg: { ...probe, basePace: 90, degScale: 1 }, trainingLaps: [] };

  // y = actual − (everything except base and wear) = base + s · wear
  const rows = window.map((l) => {
    const compound = l.compound ?? "MEDIUM";
    const temp = l.trackTemp ?? tempAtLap(tempsByLap, l.lapNumber);
    const rest = predictLap(probe, { lapNumber: l.lapNumber, compound, tyreAge: l.tyreAge, trackTemp: temp, stintLap: l.tyreAge }).lapTime;
    return { y: (l.lapTime as number) - rest, wear: degradation(compound, l.tyreAge, temp, { ...partial, degScale: 1 }) };
  });
  const n = rows.length;
  const mw = rows.reduce((a, r) => a + r.wear, 0) / n;
  const my = rows.reduce((a, r) => a + r.y, 0) / n;
  const varW = rows.reduce((a, r) => a + (r.wear - mw) ** 2, 0) / n;

  let degScale = 1;
  if (varW > 0.01) {
    const cov = rows.reduce((a, r) => a + (r.wear - mw) * (r.y - my), 0) / n;
    degScale = Math.min(2.5, Math.max(0, cov / varW));
  }
  // Base pace: median residual after wear, robust to a stray slow lap.
  const resid = rows.map((r) => r.y - degScale * r.wear).sort((a, b) => a - b);
  const basePace = resid[Math.floor(n / 2)];
  return { cfg: { ...probe, basePace, degScale }, trainingLaps: window.map((l) => l.lapNumber) };
}

/**
 * Laps that represent real pace: timed, not lap 1, not in/out laps, and
 * within 107% of the driver's median (drops safety car and traffic laps).
 */
export function cleanLaps(laps: LapSummary[]): LapSummary[] {
  const timed = laps.filter((l) => l.lapTime && l.lapNumber > 1 && !l.isPitOutLap);
  if (!timed.length) return [];
  const sorted = timed.map((l) => l.lapTime as number).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // In-laps: the lap before a pit-out lap.
  const pitOut = new Set(laps.filter((l) => l.isPitOutLap).map((l) => l.lapNumber));
  return timed.filter((l) => (l.lapTime as number) < median * 1.07 && !pitOut.has(l.lapNumber + 1));
}

export interface PitWindow {
  /** Lap the model would stop on. */
  optimalLap: number;
  /** Laps within 1.5 s of the optimum race time. */
  window: [number, number];
  firstCompound: Compound;
  secondCompound: Compound;
  /** Race time at the optimum, seconds. */
  raceTime: number;
}

/** One-stop pit window for a given compound pair. */
export function optimalPitWindow(cfg: LapModelConfig, first: Compound, second: Compound, tempsByLap: [number, number][]): PitWindow {
  const N = cfg.totalLaps;
  const costs: { lap: number; time: number }[] = [];
  for (let stop = 8; stop <= N - 8; stop++) {
    const laps = predictRace(
      cfg,
      [
        { stint: 1, compound: first, lapStart: 1, lapEnd: stop, tyreAgeAtStart: 0 },
        { stint: 2, compound: second, lapStart: stop + 1, lapEnd: N, tyreAgeAtStart: 0 },
      ],
      tempsByLap,
    );
    costs.push({ lap: stop, time: laps.reduce((s, l) => s + l.lapTime, 0) + cfg.pitLoss });
  }
  const best = costs.reduce((a, b) => (b.time < a.time ? b : a), costs[0] ?? { lap: Math.round(N / 2), time: 0 });
  const near = costs.filter((c) => c.time - best.time <= 1.5).map((c) => c.lap);
  return {
    optimalLap: best.lap,
    window: [Math.min(...near, best.lap), Math.max(...near, best.lap)],
    firstCompound: first,
    secondCompound: second,
    raceTime: best.time,
  };
}

/** Sector shares and braking weights from a reference lap's telemetry. */
export function sectorProfile(samples: TelemetrySample[], splits: [number, number], sectors?: [number, number, number]) {
  const length = samples[samples.length - 1]?.distance || 1;
  const brakeShare: [number, number, number] = [0, 0, 0];
  const count: [number, number, number] = [0, 0, 0];
  for (const s of samples) {
    const f = s.distance / length;
    const i = f < splits[0] ? 0 : f < splits[1] ? 1 : 2;
    count[i]++;
    if (s.brake > 0) brakeShare[i]++;
  }
  const density = brakeShare.map((b, i) => (count[i] ? b / count[i] : 0));
  const mean = density.reduce((a, b) => a + b, 0) / 3 || 1;
  const sectorBrakeWeights = density.map((d) => 0.6 + 0.4 * (d / mean)) as [number, number, number];
  const total = sectors ? sectors[0] + sectors[1] + sectors[2] : 0;
  const sectorShares = (total > 0 ? sectors!.map((s) => s / total) : [splits[0], splits[1] - splits[0], 1 - splits[1]]) as [number, number, number];
  return { sectorShares, sectorBrakeWeights };
}

export interface Corner {
  index: number;
  distance: number;
  /** Apex speed on the reference lap, km/h. */
  speed: number;
}

/** Apexes: local speed minima under 250 km/h, at least 180 m apart. */
export function findCorners(samples: TelemetrySample[]): Corner[] {
  const corners: Corner[] = [];
  const W = 4;
  for (let i = W; i < samples.length - W; i++) {
    const v = samples[i].speed;
    if (v >= 250) continue;
    let isMin = true;
    for (let k = i - W; k <= i + W; k++) if (samples[k].speed < v) isMin = false;
    if (!isMin) continue;
    const last = corners[corners.length - 1];
    if (last && samples[i].distance - last.distance < 180) {
      if (v < last.speed) corners[corners.length - 1] = { index: i, distance: samples[i].distance, speed: v };
      continue;
    }
    corners.push({ index: i, distance: samples[i].distance, speed: v });
  }
  return corners;
}

/**
 * Relative grip for a tyre state. Lateral grip scales apex speed by √grip,
 * so a tyre that's lost 1% of grip carries ~0.5% less speed through a corner.
 */
export function gripFactor(cfg: LapModelConfig, compound: Compound, tyreAge: number, trackTemp: number) {
  const m = COMPOUNDS[compound];
  const { over, under } = outsideWindow(trackTemp, m.window);
  const lossSeconds = m.offset + degradation(compound, tyreAge, trackTemp, cfg) + (over + under) * cfg.thermalPacePerDeg;
  // Roughly 60% of a lap is spent in grip-limited corners.
  return Math.max(0.5, 1 - lossSeconds / (cfg.basePace * 0.6));
}

/** Predicted apex speeds for a target tyre state, scaled from a reference lap's apexes. */
export function predictCornerSpeeds(cfg: LapModelConfig, corners: Corner[], ref: { compound: Compound; tyreAge: number; trackTemp: number }, target: { compound: Compound; tyreAge: number; trackTemp: number }) {
  const g0 = gripFactor(cfg, ref.compound, ref.tyreAge, ref.trackTemp);
  const g1 = gripFactor(cfg, target.compound, target.tyreAge, target.trackTemp);
  const scale = Math.sqrt(g1 / g0);
  return corners.map((c) => ({ ...c, predicted: c.speed * scale }));
}

// ─── Cornering physics ───────────────────────────────────────────────────────

/** Top speed cap, m/s (≈ 331 km/h). */
export const V_MAX = 92;
/** Mechanical lateral grip μ·g, m/s². */
export const MU_G = 21;
/** Aero grip coefficient: downforce adds k·v² of lateral grip. 1/m. */
export const AERO_K = 0.0036;

/**
 * Maximum cornering speed (m/s) for a radius in metres:
 * v² = μg·r + k·v²·r  →  v² = μg·r / (1 − k·r). Above r = 1/k the corner
 * is flat out.
 */
export function cornerSpeedLimit(radius: number, grip = 1): number {
  const denom = 1 - AERO_K * grip * radius;
  if (denom <= 0) return V_MAX;
  return Math.min(V_MAX, Math.sqrt((MU_G * grip * radius) / denom));
}

/** Path resampled at even spacing by distance, for curvature estimates. */
function resample(samples: TelemetrySample[], spacing: number) {
  const out: { d: number; x: number; y: number }[] = [];
  const total = samples[samples.length - 1].distance;
  let j = 0;
  for (let d = 0; d <= total; d += spacing) {
    while (j < samples.length - 2 && samples[j + 1].distance < d) j++;
    const a = samples[j];
    const b = samples[j + 1];
    const f = (d - a.distance) / Math.max(1e-6, b.distance - a.distance);
    out.push({ d, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  }
  return out;
}

/**
 * Predicted apex speed (km/h) for each corner from track geometry alone:
 * the tightest radius within ±20 m of the apex (circumcircle over a ±25 m
 * chord, which smooths GPS noise), through cornerSpeedLimit().
 */
export function predictApexSpeeds(samples: TelemetrySample[], corners: Corner[], grip = 1) {
  const SP = 4;
  const path = resample(samples, SP);
  const half = Math.round(25 / SP);
  const radius = path.map((p, i) => {
    const a = path[Math.max(0, i - half)];
    const c = path[Math.min(path.length - 1, i + half)];
    const ab = Math.hypot(p.x - a.x, p.y - a.y);
    const bc = Math.hypot(c.x - p.x, c.y - p.y);
    const ca = Math.hypot(a.x - c.x, a.y - c.y);
    const cross = Math.abs((p.x - a.x) * (c.y - a.y) - (p.y - a.y) * (c.x - a.x));
    return cross > 1e-6 ? (ab * bc * ca) / (2 * cross) : Infinity;
  });
  return corners.map((c) => {
    let r = Infinity;
    for (let i = 0; i < path.length; i++) if (Math.abs(path[i].d - c.distance) <= 20) r = Math.min(r, radius[i]);
    const predicted = cornerSpeedLimit(r, grip) * 3.6;
    return { ...c, radius: r, predicted };
  });
}

/** Mean absolute error and related accuracy stats for paired values. */
export function errorStats(pairs: { predicted: number; actual: number }[]) {
  if (!pairs.length) return { mae: 0, rmse: 0, bias: 0, accuracy: 0, n: 0 };
  let abs = 0;
  let sq = 0;
  let bias = 0;
  let pct = 0;
  for (const { predicted, actual } of pairs) {
    const e = predicted - actual;
    abs += Math.abs(e);
    sq += e * e;
    bias += e;
    pct += Math.abs(e) / Math.max(1e-6, Math.abs(actual));
  }
  const n = pairs.length;
  return { mae: abs / n, rmse: Math.sqrt(sq / n), bias: bias / n, accuracy: Math.max(0, 100 * (1 - pct / n)), n };
}
