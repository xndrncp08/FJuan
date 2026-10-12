/**
 * components/telemetry/model.ts
 *
 * One lap as the cockpit's instruments see it: raw samples plus derived
 * channels and the driver it belongs to. "A" is the selected lap, "B" the
 * optional reference lap; they use fixed slot colours (ember vs blue, as on
 * the compare page) so team-mates stay distinguishable.
 */

import type { Channels, Corner } from "@/lib/telemetry/analysis";
import type { TelemetrySample } from "@/lib/telemetry/types";
import { EMBER, INFO } from "@/lib/theme/palette";
import { indexAtTime } from "./playhead";

export const SLOT_A = EMBER;
export const SLOT_B = INFO;

export interface LapView {
  samples: TelemetrySample[];
  ch: Channels;
  corners: Corner[];
  code: string;
  name: string;
  /** Team colour (used when there is no comparison). */
  color: string;
  lapNumber: number;
  lapTime: number;
  sectors: [number, number, number];
}

export const lapLength = (l: LapView) => l.samples[l.samples.length - 1].distance || 1;

/** Fractional sample index and distance fraction at time t into the lap. */
export function cursorAt(l: LapView, t: number) {
  const i = indexAtTime(l.samples, t);
  const lo = Math.floor(i);
  const hi = Math.min(l.samples.length - 1, lo + 1);
  const d = l.samples[lo].distance + (l.samples[hi].distance - l.samples[lo].distance) * (i - lo);
  return { index: i, frac: d / lapLength(l) };
}

/** Channel value at a fractional index (linear). */
export function channelAt(values: number[], index: number) {
  const lo = Math.max(0, Math.min(values.length - 1, Math.floor(index)));
  const hi = Math.min(values.length - 1, lo + 1);
  return values[lo] + (values[hi] - values[lo]) * (index - lo);
}

export const fmtDelta = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d).toFixed(3)}`;
