/**
 * components/three/realCar/geometry.ts
 *
 * Lofts a CarProfile (silhouette columns traced from the official side
 * render) into a 3D body. Each opaque run in a column becomes a closed
 * cross-section ring; matching runs in neighbouring columns are stitched
 * together, and runs that start or end are capped.
 *
 * The side view fixes the shape's outline; the width at each point comes
 * from F1 proportions (floor ~1.6 m, sidepods ~1.45 m, cockpit ~0.8 m,
 * nose tapering to ~0.2 m, front wing 1.9 m, rear wing 1.0 m), rounded
 * top and bottom with a superellipse so it reads as bodywork, not a slab.
 *
 * Every vertex also gets texture coordinates into BOTH renders (right side
 * and left side), so the shader can paint each side with its real livery.
 */

import * as THREE from "three";
import type { CarProfile, ImageFrame } from "@/lib/api/carModel";

const LEVELS = 14; // heights per ring side
const ROUND = 4; // superellipse exponent for the cross-section's top/bottom

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ramp = (x: number, x0: number, x1: number, a: number, b: number) => lerp(a, b, clamp01((x - x0) / (x1 - x0)));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Half-width (m) of the bodywork at length x, height y, for a run spanning [bottom, top]. */
function halfWidth(p: CarProfile, x: number, y: number, bottom: number, top: number) {
  const { rearX, frontX, radius: r } = p.wheels;
  const { xMax } = p.extent;
  const runH = top - bottom;

  // Thin elements high up: halo, mirrors, rear-wing flaps.
  if (runH < 0.08 && y > 0.65) return x < rearX ? 0.5 : 0.36;

  // Rear overhang below the wing: crash structure and diffuser.
  if (x < rearX - r * 0.55) return 0.3;

  // Front overhang above the wing: the nose, narrowing to the tip.
  if (x > frontX + r * 0.45) return lerp(0.24, 0.1, clamp01((x - frontX) / Math.max(0.1, xMax - frontX)));

  // Between the axles.
  const s = (x - rearX) / (frontX - rearX);
  const floor = ramp(s, 0.05, 0.2, 0.5, 0.79) * (s > 0.8 ? ramp(s, 0.8, 0.95, 1, 0.65) : 1);
  const sidepod =
    s < 0.12 ? 0.3 : s < 0.42 ? ramp(s, 0.12, 0.42, 0.3, 0.71) : s < 0.62 ? 0.72 : s < 0.74 ? ramp(s, 0.62, 0.74, 0.72, 0.42) : ramp(s, 0.74, 1, 0.42, 0.26);
  const upper = s < 0.25 ? 0.23 : s < 0.55 ? ramp(s, 0.25, 0.55, 0.23, 0.32) : s < 0.8 ? 0.41 : ramp(s, 0.8, 1, 0.41, 0.24);
  // Blend between the floor, sidepod and upper bands.
  let w = lerp(floor, sidepod, smooth(0.06, 0.12, y));
  w = lerp(w, upper, smooth(0.56, 0.66, y));

  // Stay inboard of the tyres.
  if (Math.abs(x - rearX) < r * 1.05 || Math.abs(x - frontX) < r * 1.05) w = Math.min(w, 0.52);
  return w;
}

/** Model point → texture UV in one render. */
function uvIn(f: ImageFrame, x: number, y: number): [number, number] {
  const px = f.midX + f.facing * x * f.ppm;
  const [x0, y0] = f.groundRear;
  const [x1, y1] = f.groundFront;
  const ground = y0 + ((y1 - y0) * (px - x0)) / (x1 - x0);
  const py = ground - y * f.ppm;
  return [px / f.w, 1 - py / f.h];
}

export function carUV(p: CarProfile, x: number, y: number) {
  return { right: uvIn(p.images.right, x, y), left: uvIn(p.images.left, x, y) };
}

type PartKind = "body" | "frontWing" | "rearWing";
interface Part {
  kind: PartKind;
  bottom: number;
  top: number;
}

/**
 * Split each silhouette run into parts. The side view only shows a wing's
 * endplate outline, so wings get their own cross-section (thin full-width
 * plane plus endplates) instead of being lofted as solid blocks.
 */
function partsOf(p: CarProfile, x: number, runs: [number, number][]): Part[] {
  const { rearX, frontX, radius: r } = p.wheels;
  const parts: Part[] = [];
  for (const [bottom, top] of runs) {
    if (x > frontX + r * 0.45 && bottom < 0.14) {
      parts.push({ kind: "frontWing", bottom, top: Math.min(top, bottom + 0.17) });
      if (top > bottom + 0.22) parts.push({ kind: "body", bottom: bottom + 0.12, top });
    } else if (x < rearX - r * 0.55 && top > 0.6) {
      parts.push({ kind: "rearWing", bottom: Math.max(bottom, 0.56), top });
      if (bottom < 0.6) parts.push({ kind: "body", bottom, top: Math.min(top, 0.66) });
    } else {
      parts.push({ kind: "body", bottom, top });
    }
  }
  return parts;
}

/**
 * N points around a closed polyline, keeping every corner and spreading
 * the rest by edge length. Points are (z, y) pairs.
 */
function polylineRing(corners: [number, number][], n: number): [number, number][] {
  const edges = corners.map((c, i) => {
    const d = corners[(i + 1) % corners.length];
    return { a: c, b: d, len: Math.hypot(d[0] - c[0], d[1] - c[1]) };
  });
  const total = edges.reduce((s, e) => s + e.len, 0) || 1;
  const extra = n - corners.length;
  const counts = edges.map((e) => Math.floor((e.len / total) * extra));
  let left = extra - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % counts.length, left--) counts[i]++;
  const out: [number, number][] = [];
  edges.forEach((e, i) => {
    out.push(e.a);
    for (let k = 1; k <= counts[i]; k++) {
      const t = k / (counts[i] + 1);
      out.push([e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t]);
    }
  });
  return out;
}

export function buildBody(p: CarProfile) {
  const positions: number[] = [];
  const uvR: number[] = [];
  const uvL: number[] = [];
  const index: number[] = [];
  const RING = LEVELS * 2;

  const addVertex = (x: number, y: number, z: number) => {
    positions.push(x, y, z);
    const uv = carUV(p, x, y);
    uvR.push(...uv.right);
    uvL.push(...uv.left);
    return positions.length / 3 - 1;
  };

  /**
   * Cross-section points (z, y), counter-clockwise seen from the nose:
   * up the right side, across, down the left — same order for every kind,
   * so neighbouring rings stitch with outward-facing normals.
   */
  const section = (x: number, part: Part): [number, number][] => {
    const { bottom, top, kind } = part;
    if (kind === "frontWing") {
      // U: thin plane along the bottom, endplates at ±0.95 m.
      const W = 0.95;
      const t = 0.025;
      const plate = Math.min(0.04, (top - bottom) * 0.4);
      return polylineRing(
        [
          [W, bottom],
          [W, top],
          [W - t, top],
          [W - t, bottom + plate],
          [-W + t, bottom + plate],
          [-W + t, top],
          [-W, top],
          [-W, bottom],
        ],
        RING,
      );
    }
    if (kind === "rearWing") {
      // ∩: wing plane along the top, endplates at ±0.5 m.
      const W = 0.5;
      const t = 0.025;
      const plane = Math.min(0.09, (top - bottom) * 0.35);
      return polylineRing(
        [
          [W, bottom],
          [W, top],
          [-W, top],
          [-W, bottom],
          [-W + t, bottom],
          [-W + t, top - plane],
          [W - t, top - plane],
          [W - t, bottom],
        ],
        RING,
      );
    }
    // Bodywork: superellipse-rounded, width from F1 proportions per height.
    const mid = (bottom + top) / 2;
    const hh = Math.max(0.005, (top - bottom) / 2);
    const levels = Array.from({ length: LEVELS }, (_, k) => mid - hh * Math.cos((Math.PI * k) / (LEVELS - 1)));
    const widths = levels.map((y) => {
      const n = Math.min(1, Math.abs((y - mid) / hh));
      return halfWidth(p, x, y, bottom, top) * Math.pow(1 - Math.pow(n, ROUND), 1 / ROUND);
    });
    const right = levels.map((y, k) => [widths[k], y] as [number, number]);
    const leftSide = [...levels].reverse().map((y, k) => [-widths[LEVELS - 1 - k], y] as [number, number]);
    return [...right, ...leftSide];
  };

  const ring = (x: number, part: Part) => {
    const first = positions.length / 3;
    for (const [z, y] of section(x, part)) addVertex(x, y, z);
    return first;
  };

  /** Close a ring with a proper (concave-safe) triangulation. */
  const cap = (first: number, facing: -1 | 1) => {
    const contour = Array.from({ length: RING }, (_, m) => new THREE.Vector2(positions[(first + m) * 3 + 2], positions[(first + m) * 3 + 1]));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [a, b, c] of tris) {
      // A triangle counter-clockwise in (z, y) faces −x; make each one face
      // outward whatever winding the triangulator returned.
      const [pa, pb, pc] = [contour[a], contour[b], contour[c]];
      const area = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x);
      const facesBack = area > 0;
      if (facesBack === (facing < 0)) index.push(first + a, first + b, first + c);
      else index.push(first + a, first + c, first + b);
    }
  };

  let prev: { part: Part; first: number; used: boolean }[] = [];
  for (const col of p.columns) {
    const cur = partsOf(p, col.x, col.runs).map((part) => ({ part, first: ring(col.x, part), used: false }));
    const overlaps = (a: Part, b: Part) => a.kind === b.kind && a.bottom < b.top && b.bottom < a.top;
    for (const c of cur) {
      const matches = prev.filter((q) => overlaps(q.part, c.part));
      const back = matches.length === 1 ? cur.filter((o) => overlaps(o.part, matches[0].part)) : [];
      if (matches.length === 1 && back.length === 1) {
        const a0 = matches[0].first;
        const b0 = c.first;
        for (let m = 0; m < RING; m++) {
          const n = (m + 1) % RING;
          index.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
        }
        matches[0].used = true;
      } else {
        cap(c.first, -1);
      }
    }
    for (const q of prev) if (!q.used) cap(q.first, 1);
    prev = cur;
  }
  for (const q of prev) cap(q.first, 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uvR", new THREE.Float32BufferAttribute(uvR, 2));
  g.setAttribute("uvL", new THREE.Float32BufferAttribute(uvL, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/**
 * Body material: clear-coated paint whose colour is the real livery —
 * right render on the right side, left render on the left, blended over
 * the top — with the team colour where a render has no paint.
 */
export function liveryMaterial(right: THREE.Texture, left: THREE.Texture, base: THREE.Color) {
  const m = new THREE.MeshPhysicalMaterial({ roughness: 0.36, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12 });
  const uniforms = { mapR: { value: right }, mapL: { value: left }, uBase: { value: base } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <uv_pars_vertex>",
        "#include <uv_pars_vertex>\nattribute vec2 uvR;\nattribute vec2 uvL;\nvarying vec2 vUvR;\nvarying vec2 vUvL;\nvarying float vSide;",
      )
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvUvR = uvR;\nvUvL = uvL;\nvSide = normal.z;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <map_pars_fragment>",
        "#include <map_pars_fragment>\nuniform sampler2D mapR;\nuniform sampler2D mapL;\nuniform vec3 uBase;\nvarying vec2 vUvR;\nvarying vec2 vUvL;\nvarying float vSide;",
      )
      .replace(
        "#include <map_fragment>",
        [
          "vec4 sR = texture2D(mapR, vUvR);",
          "vec4 sL = texture2D(mapL, vUvL);",
          "vec4 sP = mix(sL, sR, smoothstep(-0.35, 0.35, vSide));",
          "diffuseColor.rgb *= mix(uBase, sP.rgb, sP.a);",
        ].join("\n"),
      );
  };
  m.customProgramCacheKey = () => "fjuan-livery";
  return { material: m, uniforms };
}

/** Outer wheel face: a disc whose UVs sample the wheel in the render. */
export function wheelFace(p: CarProfile, wheelX: number, side: "right" | "left", segments = 48) {
  const r = p.wheels.radius;
  const g = new THREE.CircleGeometry(r * 1.01, segments);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const f = side === "right" ? p.images.right : p.images.left;
  for (let i = 0; i < pos.count; i++) {
    // Disc lies in XY; on the left side the disc is viewed from −z, so x mirrors.
    const lx = pos.getX(i) * (side === "right" ? 1 : -1);
    const ly = pos.getY(i);
    const [u, v] = uvIn(f, wheelX + lx, r + ly);
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return g;
}
