/**
 * components/telemetry/playhead.ts
 *
 * Lap playback position (seconds into the lap) as a tiny external store.
 * The 3D scene reads it every frame without re-rendering; HUD readouts and
 * the timeline subscribe through usePlayhead().
 */

import { useSyncExternalStore } from "react";
import type { TelemetrySample } from "@/lib/telemetry/types";

export interface Playhead {
  get: () => number;
  set: (t: number) => void;
  subscribe: (fn: () => void) => () => void;
}

export function createPlayhead(initial = 0): Playhead {
  let t = initial;
  const subs = new Set<() => void>();
  return {
    get: () => t,
    set: (next) => {
      if (next === t) return;
      t = next;
      subs.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function usePlayhead(p: Playhead) {
  return useSyncExternalStore(p.subscribe, p.get, p.get);
}

/** Fractional sample index for a time, by binary search on sample t. */
export function indexAtTime(samples: TelemetrySample[], t: number) {
  let lo = 0;
  let hi = samples.length - 1;
  if (t <= samples[0].t) return 0;
  if (t >= samples[hi].t) return hi;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const span = samples[hi].t - samples[lo].t || 1;
  return lo + (t - samples[lo].t) / span;
}

/** Interpolated sample at a fractional index. Discrete channels snap. */
export function sampleAt(samples: TelemetrySample[], cursor: number): TelemetrySample {
  const i = Math.max(0, Math.min(samples.length - 1, Math.floor(cursor)));
  const j = Math.min(samples.length - 1, i + 1);
  const f = cursor - i;
  const a = samples[i];
  const b = samples[j];
  const mix = (x: number, y: number) => x + (y - x) * f;
  return {
    t: mix(a.t, b.t),
    distance: mix(a.distance, b.distance),
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
    z: mix(a.z, b.z),
    speed: mix(a.speed, b.speed),
    throttle: mix(a.throttle, b.throttle),
    brake: f < 0.5 ? a.brake : b.brake,
    gear: f < 0.5 ? a.gear : b.gear,
    rpm: mix(a.rpm, b.rpm),
    drs: f < 0.5 ? a.drs : b.drs,
  };
}
