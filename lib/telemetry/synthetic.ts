/**
 * lib/telemetry/synthetic.ts
 *
 * Offline telemetry engine. Generates a plausible circuit, a physics-based
 * lap (speed from curvature, acceleration and braking limits), and a full
 * race of lap times from the lap-time model plus noise — deterministic per
 * seed, so the same circuit always looks the same.
 *
 * Used whenever OpenF1 is unreachable, rate-limited, or has no session to
 * show (off-season, testing), so the 3D views are always interactive.
 */

import { teamColor } from "@/lib/theme/teams";
import { DEFAULT_CONFIG, predictRace, sectorProfile, type LapModelConfig } from "@/lib/prediction/laptime";
import type { DriverInfo, LapSummary, LapTrace, SessionTelemetry, Stint, TelemetrySample } from "./types";

// ─── Seeded randomness ───────────────────────────────────────────────────────

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box–Muller. */
function gauss(rand: () => number) {
  const u = Math.max(1e-9, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// ─── Circuit geometry ────────────────────────────────────────────────────────

export interface CircuitPoint {
  x: number;
  y: number;
  z: number;
}

const SAMPLE_SPACING = 6; // metres between resampled points

/**
 * Closed, non-self-intersecting circuit: a star-shaped polygon (vertices
 * sorted by angle, so edges can't cross) whose corners are rounded with
 * fillets from 15 m hairpins to 140 m sweepers, scaled to a realistic
 * length, with gentle elevation change.
 */
export function generateCircuit(seed: number, targetLength = 5000): CircuitPoint[] {
  const rand = rng(seed);
  const n = 10 + Math.floor(rand() * 7);
  const aspect = 0.6 + rand() * 0.35;
  const R = targetLength / (2 * Math.PI * 0.85);
  const verts = Array.from({ length: n }, (_, i) => {
    const th = ((i + (rand() - 0.5) * 0.6) / n) * Math.PI * 2;
    const r = R * (0.5 + rand() * 0.5);
    return { x: r * Math.cos(th), y: r * Math.sin(th) * aspect };
  });

  const path: { x: number; y: number }[] = [];
  const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n];
    const v = verts[i];
    const next = verts[(i + 1) % n];
    const d1 = { x: (v.x - prev.x) / edge(prev, v), y: (v.y - prev.y) / edge(prev, v) };
    const d2 = { x: (next.x - v.x) / edge(v, next), y: (next.y - v.y) / edge(v, next) };
    const turn = Math.acos(Math.max(-1, Math.min(1, d1.x * d2.x + d1.y * d2.y)));
    if (turn < 0.05) {
      path.push(v);
      continue;
    }
    // Slow corners are more likely after long straights (heavy braking zones).
    let radius = 15 + Math.pow(rand(), 1.6) * 125;
    let tangent = radius * Math.tan(turn / 2);
    const maxTangent = 0.45 * Math.min(edge(prev, v), edge(v, next));
    if (tangent > maxTangent) {
      tangent = maxTangent;
      radius = tangent / Math.tan(turn / 2);
    }
    const p1 = { x: v.x - d1.x * tangent, y: v.y - d1.y * tangent };
    const cross = d1.x * d2.y - d1.y * d2.x;
    const side = cross > 0 ? 1 : -1;
    const centre = { x: p1.x - d1.y * radius * side, y: p1.y + d1.x * radius * side };
    const a0 = Math.atan2(p1.y - centre.y, p1.x - centre.x);
    const steps = Math.max(2, Math.ceil((radius * turn) / 3));
    for (let k = 0; k <= steps; k++) {
      const a = a0 + side * turn * (k / steps);
      path.push({ x: centre.x + radius * Math.cos(a), y: centre.y + radius * Math.sin(a) });
    }
  }

  // Resample at even spacing so curvature and timing are uniform.
  const closed = [...path, path[0]];
  let length = 0;
  for (let i = 1; i < closed.length; i++) length += edge(closed[i - 1], closed[i]);
  const scale = targetLength / length;
  const count = Math.round(targetLength / SAMPLE_SPACING);
  const step = length / count;
  const hills = [1, 2, 3].map((k) => ({ k, b: rand() * (12 / k), phase: rand() * Math.PI * 2 }));
  const out: CircuitPoint[] = [];
  let seg = 1;
  let segStart = 0;
  for (let j = 0; j < count; j++) {
    const target = j * step;
    while (seg < closed.length - 1 && segStart + edge(closed[seg - 1], closed[seg]) < target) {
      segStart += edge(closed[seg - 1], closed[seg]);
      seg++;
    }
    const a = closed[seg - 1];
    const b = closed[seg];
    const f = Math.min(1, (target - segStart) / Math.max(1e-6, edge(a, b)));
    const th = (j / count) * Math.PI * 2;
    out.push({
      x: (a.x + (b.x - a.x) * f) * scale,
      y: (a.y + (b.y - a.y) * f) * scale,
      z: hills.reduce((s, h) => s + h.b * Math.sin(h.k * th + h.phase), 0),
    });
  }
  return out;
}

/** Unsigned curvature (1/m) at each point from the circumscribed circle of its neighbours. */
function curvature(points: CircuitPoint[]): number[] {
  const n = points.length;
  const k = points.map((_, i) => {
    const a = points[(i - 3 + n) % n];
    const b = points[i];
    const c = points[(i + 3) % n];
    const ab = Math.hypot(b.x - a.x, b.y - a.y);
    const bc = Math.hypot(c.x - b.x, c.y - b.y);
    const ca = Math.hypot(a.x - c.x, a.y - c.y);
    const cross = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    return ab * bc * ca > 0 ? (2 * cross) / (ab * bc * ca) : 0;
  });
  // Light smoothing so the speed trace doesn't jitter.
  return k.map((_, i) => (k[(i - 2 + n) % n] + k[(i - 1 + n) % n] + k[i] + k[(i + 1) % n] + k[(i + 2) % n]) / 5);
}

// ─── Physics lap ─────────────────────────────────────────────────────────────

const V_MAX = 92; // m/s ≈ 331 km/h
// Lateral grip = mechanical (μg) + aero (k·v²): v² = μg·r / (1 − k·r).
const MU_G = 21; // m/s²
const AERO_K = 0.0036; // 1/m
const A_BRAKE = 46; // m/s²
const GEAR_TOPS = [0, 95, 130, 165, 200, 235, 270, 305, 999]; // km/h, gear n tops out at GEAR_TOPS[n]

function accel(v: number) {
  return 14 * Math.max(0, 1 - (v / (V_MAX + 3)) ** 2);
}

/**
 * Speed profile from curvature with a forward (traction) and backward
 * (braking) pass, run twice around the loop so the start/finish closes.
 */
export function simulateLap(points: CircuitPoint[], lapNumber = 1, paceScale = 1): LapTrace {
  const n = points.length;
  const k = curvature(points);
  const ds = points.map((p, i) => {
    const q = points[(i + 1) % n];
    return Math.hypot(q.x - p.x, q.y - p.y);
  });
  const vLim = k.map((ki) => {
    const r = 1 / Math.max(ki, 1e-5);
    const denom = 1 - AERO_K * r;
    return (denom <= 0 ? V_MAX : Math.min(V_MAX, Math.sqrt((MU_G * r) / denom))) * paceScale;
  });

  const v = [...vLim];
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < n; j++) {
      const i = j % n;
      const next = (i + 1) % n;
      v[next] = Math.min(v[next], Math.sqrt(v[i] ** 2 + 2 * accel(v[i]) * ds[i]));
    }
  }
  const forward = [...v];
  for (let pass = 0; pass < 2; pass++) {
    for (let j = n - 1; j >= 0; j--) {
      const next = (j + 1) % n;
      v[j] = Math.min(v[j], Math.sqrt(v[next] ** 2 + 2 * A_BRAKE * ds[j]));
    }
  }

  // Inputs: braking where the backward pass cut speed; a short lift-and-coast
  // ahead of each braking zone; full throttle while accelerating; partial
  // throttle when sitting on the corner limit.
  const braking = v.map((vi, i) => vi < forward[i] - 0.4);
  const coasting = braking.map((b, i) => !b && braking[(i + 6) % n] && v[i] > 60);

  const samples: TelemetrySample[] = [];
  let t = 0;
  let dist = 0;
  for (let i = 0; i < n; i++) {
    const kmh = v[i] * 3.6;
    const gear = Math.max(1, GEAR_TOPS.findIndex((top) => kmh <= top));
    const lo = GEAR_TOPS[gear - 1];
    const hi = Math.min(GEAR_TOPS[gear], 340);
    const atLimit = Math.abs(v[i] - vLim[i]) < 0.6;
    const throttle = braking[i] || coasting[i] ? 0 : atLimit && vLim[i] < V_MAX * paceScale ? 55 + 30 * (v[i] / V_MAX) : 100;
    samples.push({
      t,
      distance: dist,
      x: points[i].x,
      y: points[i].y,
      z: points[i].z,
      speed: Math.round(kmh),
      throttle: Math.round(throttle),
      brake: braking[i] ? 100 : 0,
      gear,
      rpm: Math.round(10200 + 2300 * Math.min(1, Math.max(0, (kmh - lo) / Math.max(1, hi - lo)))),
      drs: kmh > 285 && throttle === 100,
    });
    const vNext = v[(i + 1) % n];
    t += ds[i] / Math.max(1, (v[i] + vNext) / 2);
    dist += ds[i];
  }

  const splits: [number, number] = [0.33, 0.67];
  const sectorTime = (from: number, to: number) => {
    const a = samples.find((s) => s.distance >= from * dist) ?? samples[0];
    const b = to >= 1 ? { t } : samples.find((s) => s.distance >= to * dist) ?? { t };
    return b.t - a.t;
  };
  return {
    lapNumber,
    lapTime: t,
    sectors: [sectorTime(0, splits[0]), sectorTime(splits[0], splits[1]), sectorTime(splits[1], 1)],
    sectorSplits: splits,
    samples,
  };
}

// ─── Synthetic race ──────────────────────────────────────────────────────────

const GRID: Omit<DriverInfo, "color">[] = [
  { number: 1, code: "NOR", name: "Lando Norris", team: "mclaren" },
  { number: 81, code: "PIA", name: "Oscar Piastri", team: "mclaren" },
  { number: 3, code: "VER", name: "Max Verstappen", team: "red_bull" },
  { number: 6, code: "HAD", name: "Isack Hadjar", team: "red_bull" },
  { number: 16, code: "LEC", name: "Charles Leclerc", team: "ferrari" },
  { number: 44, code: "HAM", name: "Lewis Hamilton", team: "ferrari" },
  { number: 63, code: "RUS", name: "George Russell", team: "mercedes" },
  { number: 12, code: "ANT", name: "Kimi Antonelli", team: "mercedes" },
  { number: 14, code: "ALO", name: "Fernando Alonso", team: "aston_martin" },
  { number: 18, code: "STR", name: "Lance Stroll", team: "aston_martin" },
  { number: 23, code: "ALB", name: "Alex Albon", team: "williams" },
  { number: 55, code: "SAI", name: "Carlos Sainz", team: "williams" },
  { number: 10, code: "GAS", name: "Pierre Gasly", team: "alpine" },
  { number: 43, code: "COL", name: "Franco Colapinto", team: "alpine" },
  { number: 30, code: "LAW", name: "Liam Lawson", team: "rb" },
  { number: 41, code: "LIN", name: "Arvid Lindblad", team: "rb" },
  { number: 27, code: "HUL", name: "Nico Hulkenberg", team: "audi" },
  { number: 5, code: "BOR", name: "Gabriel Bortoleto", team: "audi" },
  { number: 31, code: "OCO", name: "Esteban Ocon", team: "haas" },
  { number: 87, code: "BEA", name: "Oliver Bearman", team: "haas" },
  { number: 11, code: "PER", name: "Sergio Perez", team: "cadillac" },
  { number: 77, code: "VAL", name: "Valtteri Bottas", team: "cadillac" },
];

export const SYNTHETIC_DRIVERS: DriverInfo[] = GRID.map((d) => ({ ...d, color: teamColor(d.team) }));

export function syntheticSession(opts: { circuit?: string; driverNumber?: number; lap?: number; reason?: string } = {}): SessionTelemetry {
  const circuit = opts.circuit ?? "FJUAN Test Circuit";
  const seed = hashSeed(circuit);
  const rand = rng(seed ^ 0x9e3779b9);
  const length = 4300 + rand() * 1500;
  const points = generateCircuit(seed, length);
  const driver = SYNTHETIC_DRIVERS.find((d) => d.number === opts.driverNumber) ?? SYNTHETIC_DRIVERS[0];
  const driverIndex = SYNTHETIC_DRIVERS.indexOf(driver);

  const reference = simulateLap(points, 1, 1 - driverIndex * 0.0012);
  const totalLaps = Math.round(305000 / length);
  const pitLap = Math.round(totalLaps * (0.38 + rand() * 0.2));
  const stints: Stint[] = [
    { stint: 1, compound: "MEDIUM", lapStart: 1, lapEnd: pitLap, tyreAgeAtStart: 0 },
    { stint: 2, compound: "HARD", lapStart: pitLap + 1, lapEnd: totalLaps, tyreAgeAtStart: 0 },
  ];

  // Track temperature: warms early in the race, then cools as the sun drops.
  const t0 = 34 + rand() * 12;
  const trackTemps: [number, number][] = Array.from({ length: 13 }, (_, i) => {
    const minutes = i * 10;
    return [minutes, Math.round((t0 + 3.5 * Math.sin((minutes / 120) * Math.PI) - minutes * 0.025) * 10) / 10];
  });
  const minutesPerLap = (reference.lapTime + 6) / 60;
  const tempsByLap = trackTemps.map(([m, c]) => [m / minutesPerLap, c] as [number, number]);

  const profile = sectorProfile(reference.samples, reference.sectorSplits, reference.sectors);
  const cfg: LapModelConfig = { ...DEFAULT_CONFIG, ...profile, basePace: reference.lapTime + 1.2, totalLaps };

  // "Actual" laps = model + effects it doesn't know about: noise, a hotter
  // second stint than forecast, traffic, and a slow pit out-lap.
  const modelled = predictRace(cfg, stints, tempsByLap);
  const laps: LapSummary[] = modelled.map((p) => {
    const traffic = rand() < 0.12 ? 0.4 + rand() * 0.9 : 0;
    const unmodelledHeat = p.compound === "HARD" ? 0.004 * p.tyreAge : 0;
    const noise = gauss(rand) * 0.18;
    const isPitOutLap = p.lapNumber === pitLap + 1;
    const lapTime = p.lapNumber === 1 ? p.lapTime + 4.5 : p.lapTime + noise + traffic + unmodelledHeat + (isPitOutLap ? cfg.pitLoss - 2 : 0);
    const scale = lapTime / p.lapTime;
    return {
      lapNumber: p.lapNumber,
      lapTime: Math.round(lapTime * 1000) / 1000,
      sectors: p.sectors.map((s) => Math.round(s * scale * 1000) / 1000) as [number, number, number],
      compound: p.compound,
      tyreAge: p.tyreAge,
      isPitOutLap,
      trackTemp: p.trackTemp,
    };
  });

  const lapNumber = Math.min(Math.max(1, opts.lap ?? bestLapNumber(laps)), totalLaps);
  const lapState = laps[lapNumber - 1];
  const lapTrace = simulateLap(points, lapNumber, 1 - driverIndex * 0.0012 - Math.max(0, (lapState.lapTime ?? reference.lapTime) - reference.lapTime) / reference.lapTime / 2);

  return {
    source: "synthetic",
    fallbackReason: opts.reason,
    session: { sessionKey: null, name: "Race (synthetic)", circuit, country: "Simulation", year: new Date().getFullYear(), date: new Date().toISOString() },
    driver,
    drivers: SYNTHETIC_DRIVERS,
    lap: { ...lapTrace, lapTime: lapState.lapTime ?? lapTrace.lapTime, sectors: (lapState.sectors as [number, number, number]) ?? lapTrace.sectors },
    laps,
    stints,
    trackTemps,
    trackLength: reference.samples[reference.samples.length - 1].distance,
  };
}

function bestLapNumber(laps: LapSummary[]) {
  let best = laps[1] ?? laps[0];
  for (const l of laps) if (l.lapNumber > 1 && !l.isPitOutLap && l.lapTime && best.lapTime && l.lapTime < best.lapTime) best = l;
  return best.lapNumber;
}
