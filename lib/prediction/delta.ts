/**
 * lib/prediction/delta.ts
 *
 * Prediction vs. actual for one driver's race: calibrates the race-pace
 * model on a few early green-flag laps, predicts every lap, sector, apex
 * speed and the pit window, then scores all of it against what happened.
 * Only laps after the calibration window count toward the error stats.
 */

import type { Compound, DriverInfo, SessionInfo, SessionTelemetry, Stint, TelemetrySource } from "@/lib/telemetry/types";
import {
  calibrate,
  cleanLaps,
  DEFAULT_CONFIG,
  errorStats,
  findCorners,
  optimalPitWindow,
  predictApexSpeeds,
  predictRace,
  sectorProfile,
  type LapBreakdown,
  type PitWindow,
} from "./laptime";

export interface DeltaLap {
  lap: number;
  actual: number | null;
  predicted: number;
  /** predicted − actual, seconds (negative = model too optimistic). */
  delta: number | null;
  sectorsActual: [number | null, number | null, number | null];
  sectorsPredicted: [number, number, number];
  compound: Compound;
  tyreAge: number;
  trackTemp: number;
  /** Used to fit base pace — excluded from scoring. */
  training: boolean;
  /** Representative pace (not lap 1, in/out, SC or traffic outliers). */
  clean: boolean;
  breakdown: LapBreakdown;
}

export interface DeltaCorner {
  n: number;
  distance: number;
  radius: number;
  actual: number;
  predicted: number;
}

type Stats = ReturnType<typeof errorStats>;

export interface DeltaReport {
  source: TelemetrySource;
  fallbackReason?: string;
  session: SessionInfo;
  driver: DriverInfo;
  drivers: DriverInfo[];
  laps: DeltaLap[];
  stats: { lap: Stats; sectors: [Stats, Stats, Stats]; corners: Stats };
  sectorMeans: { sector: number; predicted: number; actual: number }[];
  corners: DeltaCorner[];
  pit: {
    stints: Stint[];
    actualStops: number[];
    /** The stop the one-stop model is compared against (between the two longest consecutive stints). */
    compared: { stop: number; first: Compound; second: Compound } | null;
    model: PitWindow | null;
    /** Why there's no model window, when there isn't one. */
    note?: string;
  };
  model: {
    basePace: number;
    trainingLaps: number[];
    totalLaps: number;
    trackTemp: { min: number; max: number };
    fuelSecPerKg: number;
    evolutionPerLap: number;
    degScale: number;
    sectorBrakeWeights: [number, number, number];
  };
}

/** [lap, °C] series: per-lap readings where present, else the session series mapped by mean lap time. */
function tempsByLap(t: SessionTelemetry): [number, number][] {
  const direct = t.laps.filter((l) => l.trackTemp !== null).map((l) => [l.lapNumber, l.trackTemp as number] as [number, number]);
  if (direct.length >= 3) return direct;
  const times = t.laps.map((l) => l.lapTime).filter((x): x is number => !!x);
  const mean = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 90;
  return t.trackTemps.map(([m, c]) => [Math.max(1, (m * 60) / mean), c] as [number, number]);
}

/** OpenF1 sometimes omits stints; assume one medium stint rather than predicting nothing. */
function stintsOrDefault(t: SessionTelemetry): Stint[] {
  if (t.stints.length) return t.stints;
  const last = t.laps[t.laps.length - 1]?.lapNumber ?? 1;
  return [{ stint: 1, compound: "MEDIUM", lapStart: 1, lapEnd: last, tyreAgeAtStart: 0 }];
}

export function buildDeltaReport(t: SessionTelemetry): DeltaReport {
  const temps = tempsByLap(t);
  const stints = stintsOrDefault(t);
  const totalLaps = Math.max(t.laps.length, stints[stints.length - 1].lapEnd);
  const profile = sectorProfile(t.lap.samples, t.lap.sectorSplits, t.lap.sectors);
  const { cfg, trainingLaps } = calibrate({ ...DEFAULT_CONFIG, ...profile, totalLaps }, t.laps, temps);
  const predicted = predictRace(cfg, stints, temps);
  const byLap = new Map(predicted.map((p) => [p.lapNumber, p]));
  const clean = new Set(cleanLaps(t.laps).map((l) => l.lapNumber));
  const training = new Set(trainingLaps);

  const laps: DeltaLap[] = t.laps
    .filter((l) => byLap.has(l.lapNumber))
    .map((l) => {
      const p = byLap.get(l.lapNumber)!;
      return {
        lap: l.lapNumber,
        actual: l.lapTime,
        predicted: p.lapTime,
        delta: l.lapTime ? p.lapTime - l.lapTime : null,
        sectorsActual: l.sectors,
        sectorsPredicted: p.sectors,
        compound: p.compound,
        tyreAge: p.tyreAge,
        trackTemp: p.trackTemp,
        training: training.has(l.lapNumber),
        clean: clean.has(l.lapNumber),
        breakdown: p.breakdown,
      };
    });

  const scored = laps.filter((l) => l.clean && !l.training && l.actual);
  const lapStats = errorStats(scored.map((l) => ({ predicted: l.predicted, actual: l.actual as number })));
  const sectorStats = [0, 1, 2].map((i) =>
    errorStats(scored.filter((l) => l.sectorsActual[i]).map((l) => ({ predicted: l.sectorsPredicted[i], actual: l.sectorsActual[i] as number }))),
  ) as [Stats, Stats, Stats];
  const sectorMeans = [0, 1, 2].map((i) => {
    const rows = scored.filter((l) => l.sectorsActual[i]);
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    return { sector: i + 1, predicted: mean(rows.map((l) => l.sectorsPredicted[i])), actual: mean(rows.map((l) => l.sectorsActual[i] as number)) };
  });

  // Apex speeds: geometry → physics, against the traced lap's measured minima.
  const found = findCorners(t.lap.samples);
  const corners: DeltaCorner[] = predictApexSpeeds(t.lap.samples, found).map((c, i) => ({
    n: i + 1,
    distance: c.distance,
    radius: c.radius,
    actual: c.speed,
    predicted: c.predicted,
  }));
  const cornerStats = errorStats(corners.map((c) => ({ predicted: c.predicted, actual: c.actual })));

  const actualStops = stints.slice(1).map((s) => s.lapStart - 1);
  // Multi-stop races (or early stops for damage/weather) don't fit a one-stop
  // model, so compare against the stop between the two longest consecutive
  // stints — the strategic stop.
  let compared: DeltaReport["pit"]["compared"] = null;
  if (stints.length >= 2) {
    let best = 0;
    for (let i = 1; i < stints.length - 1; i++) {
      const len = (k: number) => stints[k].lapEnd - stints[k].lapStart + stints[k + 1].lapEnd - stints[k + 1].lapStart;
      if (len(i) > len(best)) best = i;
    }
    compared = { stop: stints[best + 1].lapStart - 1, first: stints[best].compound, second: stints[best + 1].compound };
  }
  // With (almost) no fitted wear every stop lap costs the same, so a
  // "window" would just be the whole race. Say so instead.
  const wearTooLow = cfg.degScale < 0.15;
  const model = compared && totalLaps > 20 && !wearTooLow ? optimalPitWindow(cfg, compared.first, compared.second, temps) : null;
  const note = !compared
    ? "The driver ran a single stint."
    : totalLaps <= 20
      ? "Race too short for a strategy model."
      : wearTooLow
        ? `Fitted tyre wear is ≈0 (×${cfg.degScale.toFixed(2)}): the model sees no pace to gain from stopping, so it has no preferred lap.`
        : undefined;

  const tempValues = laps.map((l) => l.trackTemp);
  return {
    source: t.source,
    fallbackReason: t.fallbackReason,
    session: t.session,
    driver: t.driver,
    drivers: t.drivers,
    laps,
    stats: { lap: lapStats, sectors: sectorStats, corners: cornerStats },
    sectorMeans,
    corners,
    pit: { stints, actualStops, compared, model, note },
    model: {
      basePace: cfg.basePace,
      trainingLaps,
      totalLaps,
      trackTemp: { min: Math.min(...tempValues), max: Math.max(...tempValues) },
      fuelSecPerKg: cfg.fuelSecPerKg,
      evolutionPerLap: cfg.evolutionPerLap,
      degScale: cfg.degScale,
      sectorBrakeWeights: cfg.sectorBrakeWeights,
    },
  };
}

