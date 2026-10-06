/**
 * lib/api/carModel.ts
 *
 * Turns a team's two official side renders (Formula1.com) into the data a
 * 3D car is built from — there is no public 3D model of the real cars, so
 * the shape comes from the renders themselves:
 *
 *   - The right-side render's silhouette is traced into vertical columns of
 *     opaque runs (in metres). The client lofts these into a body.
 *   - The wheels are found by fitting circles to the car's lower outline,
 *     removed from the silhouette (they're outboard, so whatever they hide
 *     is filled from the columns either side) and rebuilt as real wheels.
 *   - Both renders are calibrated (axle positions, ground line, pixels per
 *     metre) so the client can project each side's real livery onto the
 *     matching side of the 3D body.
 *
 * Scale comes from the regulation 3.4 m wheelbase.
 */

import sharp from "sharp";
import { f1CarImageUrl } from "@/lib/api/teamLogos";
import { teamColor } from "@/lib/theme/teams";

const WHEELBASE_M = 3.4;
const ANALYSIS_WIDTH = 1600;
const TEXTURE_WIDTH = 2000;
const ALPHA = 100;
const COLUMN_STEP = 5; // px between profile columns

interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface ImageFrame {
  /** Texture URL (CORS-enabled CDN). */
  url: string;
  /** Normalised calibration: px values are fractions of width/height. */
  w: number;
  h: number;
  /** Axle midpoint x (px) and pixels per metre. */
  midX: number;
  ppm: number;
  /** Ground line endpoints under each wheel (px), so rake is removed. */
  groundRear: [number, number];
  groundFront: [number, number];
  /** +1 if the nose points right in this image, −1 if left. */
  facing: 1 | -1;
}

export interface CarProfile {
  team: string;
  season: number;
  color: string;
  wheels: { rearX: number; frontX: number; radius: number };
  /** x (m, 0 = axle midpoint, + = nose) and opaque runs [bottom, top] (m above ground). */
  columns: { x: number; runs: [number, number][] }[];
  extent: { xMin: number; xMax: number; top: number };
  images: { right: ImageFrame; left: ImageFrame };
}

async function loadAlpha(url: string) {
  const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`render ${res.status}`);
  const { data, info } = await sharp(Buffer.from(await res.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  return { W, H, alpha: (x: number, y: number) => data[(y * W + x) * 4 + 3] };
}

/** Least-squares (Kåsa) circle through points. */
function fitCircle(pts: [number, number][]): Circle {
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
  for (const [x, y] of pts) {
    const z = x * x + y * y;
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z;
  }
  const n = pts.length;
  const A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]];
  const b = [-sxz, -syz, -sz];
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const d0 = det(A);
  const col = (i: number) => A.map((row, k) => row.map((v, j) => (j === i ? b[k] : v)));
  const D = det(col(0)) / d0;
  const E = det(col(1)) / d0;
  const F = det(col(2)) / d0;
  const cx = -D / 2;
  const cy = -E / 2;
  return { cx, cy, r: Math.sqrt(cx * cx + cy * cy - F) };
}

/** The two wheels: lowest points of the outline in each half, circle-fitted. */
function findWheels(W: number, H: number, alpha: (x: number, y: number) => number): [Circle, Circle] {
  const bottom = Array.from({ length: W }, (_, x) => {
    for (let y = H - 1; y >= 0; y--) if (alpha(x, y) > ALPHA) return y;
    return -1;
  });
  const fit = (lo: number, hi: number) => {
    let bx = lo;
    for (let x = lo; x < hi; x++) if (bottom[x] > bottom[bx]) bx = x;
    const pts: [number, number][] = [];
    for (let x = Math.max(0, bx - 70); x <= Math.min(W - 1, bx + 70); x++) if (bottom[x] > bottom[bx] - 40) pts.push([x, bottom[x]]);
    return fitCircle(pts);
  };
  const a = fit(0, Math.floor(W / 2));
  const b = fit(Math.floor(W / 2), W);
  return [a, b];
}

function frame(url: string, W: number, H: number, rear: Circle, front: Circle): ImageFrame {
  const ppm = Math.abs(front.cx - rear.cx) / WHEELBASE_M;
  return {
    url,
    w: W,
    h: H,
    midX: (front.cx + rear.cx) / 2,
    ppm,
    groundRear: [rear.cx, rear.cy + rear.r],
    groundFront: [front.cx, front.cy + front.r],
    facing: front.cx > rear.cx ? 1 : -1,
  };
}

/** Ground y (px) under image x, interpolated between the wheels. */
function groundAt(f: ImageFrame, px: number) {
  const [x0, y0] = f.groundRear;
  const [x1, y1] = f.groundFront;
  return y0 + ((y1 - y0) * (px - x0)) / (x1 - x0);
}

export async function getCarProfile(team: string, season: number): Promise<CarProfile | null> {
  const rightUrl = f1CarImageUrl(team, season, "right", ANALYSIS_WIDTH);
  const leftUrl = f1CarImageUrl(team, season, "left", ANALYSIS_WIDTH);
  if (!rightUrl || !leftUrl) return null;

  const [R, L] = await Promise.all([loadAlpha(rightUrl), loadAlpha(leftUrl)]);
  const [rA, rB] = findWheels(R.W, R.H, R.alpha);
  const [lA, lB] = findWheels(L.W, L.H, L.alpha);
  // Right render: nose right → the right-hand wheel is the front.
  const right = frame(f1CarImageUrl(team, season, "right", TEXTURE_WIDTH)!, R.W, R.H, rA, rB);
  // Left render: nose left → the left-hand wheel is the front.
  const left = frame(f1CarImageUrl(team, season, "left", TEXTURE_WIDTH)!, L.W, L.H, lB, lA);
  const radius = ((rA.r + rB.r) / 2) / right.ppm;

  // Trace the right render's silhouette, wheels removed.
  const wheelsPx: Circle[] = [rA, rB];
  const insideWheel = (x: number, y: number) => wheelsPx.some((c) => (x - c.cx) ** 2 + (y - c.cy) ** 2 < (c.r * 1.04) ** 2);
  const toX = (px: number) => (px - right.midX) / right.ppm;
  const toY = (px: number, py: number) => (groundAt(right, px) - py) / right.ppm;

  const raw: { x: number; px: number; runs: [number, number][] }[] = [];
  for (let px = 0; px < R.W; px += COLUMN_STEP) {
    const runs: [number, number][] = [];
    let start = -1;
    let gap = 0;
    for (let py = 0; py <= R.H; py++) {
      const solid = py < R.H && R.alpha(px, py) > ALPHA && !insideWheel(px, py);
      if (solid) {
        if (start < 0) start = py;
        gap = 0;
      } else if (start >= 0) {
        gap++;
        // Bridge hairline gaps (anti-aliasing, thin livery cut-outs).
        if (gap > 3 || py === R.H) {
          const end = py - gap;
          if (end - start >= 2) runs.push([toY(px, end), toY(px, start)]);
          start = -1;
          gap = 0;
        }
      }
    }
    if (runs.length) raw.push({ x: toX(px), px, runs: runs.sort((a, b) => a[0] - b[0]) });
  }

  // Fill what the wheels hid (nose, floor, suspension behind them) by
  // carrying the runs from just outside each wheel across it.
  for (const c of wheelsPx) {
    const lo = c.cx - c.r * 1.04;
    const hi = c.cx + c.r * 1.04;
    const before = [...raw].reverse().find((col) => col.px < lo);
    const after = raw.find((col) => col.px > hi);
    if (!before || !after) continue;
    for (const col of raw) {
      if (col.px < lo || col.px > hi) continue;
      const t = (col.px - before.px) / (after.px - before.px);
      const pairs = before.runs.length === after.runs.length ? before.runs.map((r, i) => [r, after.runs[i]] as const) : (before.runs.length > after.runs.length ? before.runs : after.runs).map((r) => [r, r] as const);
      const carried = pairs.map(([a, b]) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as [number, number]);
      // Merge with anything the column already has (e.g. a wing endplate in front of the tyre).
      const merged = [...col.runs, ...carried].sort((p, q) => p[0] - q[0]);
      col.runs = merged.reduce<[number, number][]>((acc, r) => {
        const last = acc[acc.length - 1];
        if (last && r[0] <= last[1] + 0.01) last[1] = Math.max(last[1], r[1]);
        else acc.push([r[0], r[1]]);
        return acc;
      }, []);
    }
  }

  const round = (v: number) => Math.round(v * 1000) / 1000;
  const columns = raw.map((c) => ({ x: round(c.x), runs: c.runs.map(([b, t]) => [round(Math.max(0, b)), round(t)] as [number, number]) }));
  return {
    team,
    season,
    color: teamColor(team),
    wheels: { rearX: round(toX(rA.cx)), frontX: round(toX(rB.cx)), radius: round(radius) },
    columns,
    extent: {
      xMin: columns[0]?.x ?? -2.5,
      xMax: columns[columns.length - 1]?.x ?? 2.5,
      top: Math.max(...columns.flatMap((c) => c.runs.map((r) => r[1]))),
    },
    images: { right, left },
  };
}
