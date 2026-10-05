/**
 * components/prediction/delta/MetricDial.tsx
 *
 * Radial gauge for one headline metric. The arc fills to `fill` (0–1) with
 * a spring; the number is always printed, so the arc is a cue and never the
 * only carrier of the value.
 */

"use client";

import { motion, useReducedMotion } from "framer-motion";

const R = 44;
const SWEEP = 270; // degrees of arc
const CIRC = 2 * Math.PI * R;
const ARC = (CIRC * SWEEP) / 360;

export function MetricDial({
  label,
  value,
  unit,
  fill,
  hint,
  color = "rgb(var(--tint))",
}: {
  label: string;
  value: string;
  unit?: string;
  /** 0–1: how "good" the metric is, drives the arc. */
  fill: number;
  hint?: string;
  color?: string;
}) {
  const reduce = useReducedMotion();
  const f = Math.max(0, Math.min(1, fill));
  return (
    <figure className="glass flex h-full flex-col items-center justify-center px-3 pb-4 pt-5 text-center">
      <div className="relative h-[112px] w-[112px]">
        <svg viewBox="0 0 112 112" className="h-full w-full -rotate-[225deg]" aria-hidden>
          <circle cx="56" cy="56" r={R} fill="none" stroke="var(--fill-3)" strokeWidth="7" strokeDasharray={`${ARC} ${CIRC}`} strokeLinecap="round" />
          <motion.circle
            cx="56"
            cy="56"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRC}`}
            initial={{ strokeDashoffset: reduce ? ARC * (1 - f) : ARC }}
            animate={{ strokeDashoffset: ARC * (1 - f) }}
            transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 1.1 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[1.6rem] leading-none tabular-nums text-paper">{value}</span>
          {unit && <span className="mt-1 font-mono text-[0.6875rem] text-label-3">{unit}</span>}
        </div>
      </div>
      <figcaption className="mt-1">
        <div className="label-caps text-[0.75rem] text-label-2">{label}</div>
        {hint && <div className="mt-0.5 text-caption text-label-3">{hint}</div>}
      </figcaption>
    </figure>
  );
}
