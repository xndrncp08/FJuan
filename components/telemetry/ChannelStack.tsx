"use client";

/**
 * components/telemetry/ChannelStack.tsx
 *
 * A data-logger channel stack (the MoTeC / ATLAS layout): every channel on
 * one shared distance axis, stacked, with sector lines and corner numbers
 * running through all of them and a single cursor. Drag or tap anywhere to
 * scrub the lap; arrow keys step it when the stack has focus.
 *
 * Traces are SVG paths built once per lap (non-scaling strokes on a
 * stretched viewBox), so playback only moves the cursor and the readouts.
 */

import { memo, useMemo, useRef } from "react";
import { HEAT } from "@/components/ui/chart";
import { deltaOnTrace, deltaTrace, timeAtDistance, type Channels } from "@/lib/telemetry/analysis";
import type { TelemetrySample } from "@/lib/telemetry/types";
import { sampleAt, usePlayhead, type Playhead } from "./playhead";
import { SLOT_A, SLOT_B, channelAt, cursorAt, fmtDelta, lapLength, type LapView } from "./model";

const W = 1000;

interface Row {
  key: string;
  label: string;
  unit: string;
  h: number;
  min: number;
  max: number;
  step?: boolean;
  /** Raw sample channel, or a derived one from LapView.ch. */
  pick?: (s: TelemetrySample) => number;
  ch?: keyof Channels;
  fmt: (v: number) => string;
  /** Single-colour override (pedals); otherwise slot colours. */
  color?: string;
}

function rows(a: LapView, b?: LapView): Row[] {
  const maxSpeed = Math.max(...a.samples.map((s) => s.speed), ...(b?.samples.map((s) => s.speed) ?? [])) + 10;
  const maxRpm = Math.max(...a.samples.map((s) => s.rpm), ...(b?.samples.map((s) => s.rpm) ?? []));
  return [
    { key: "speed", label: "Speed", unit: "km/h", h: 110, min: 0, max: Math.ceil(maxSpeed / 50) * 50, pick: (s) => s.speed, fmt: (v) => String(Math.round(v)) },
    { key: "throttle", label: "Throttle", unit: "%", h: 44, min: 0, max: 100, pick: (s) => s.throttle, fmt: (v) => String(Math.round(v)), color: b ? undefined : HEAT.throttle },
    { key: "brake", label: "Brake", unit: "", h: 26, min: 0, max: 100, step: true, pick: (s) => s.brake, fmt: (v) => (v > 0 ? "ON" : "—"), color: b ? undefined : HEAT.brake },
    { key: "gear", label: "Gear", unit: "", h: 44, min: 0, max: 8, step: true, pick: (s) => s.gear, fmt: (v) => String(Math.round(v)) },
    { key: "rpm", label: "RPM", unit: "", h: 44, min: Math.floor((maxRpm * 0.45) / 1000) * 1000, max: Math.ceil(maxRpm / 1000) * 1000, pick: (s) => s.rpm, fmt: (v) => (v / 1000).toFixed(1) + "k" },
    { key: "glong", label: "g long", unit: "g", h: 44, min: -6, max: 3, ch: "gLong", fmt: (v) => v.toFixed(1) },
    { key: "glat", label: "g lat", unit: "g", h: 44, min: -5, max: 5, ch: "gLat", fmt: (v) => v.toFixed(1) },
  ];
}

function tracePath(l: LapView, row: Row) {
  const total = lapLength(l);
  const y = (v: number) => (1 - (Math.max(row.min, Math.min(row.max, v)) - row.min) / (row.max - row.min || 1)) * row.h;
  let d = "";
  l.samples.forEach((smp: TelemetrySample, i) => {
    const x = ((smp.distance / total) * W).toFixed(1);
    const v = y(row.ch ? l.ch[row.ch][i] : row.pick!(smp)).toFixed(1);
    if (i === 0) d = `M${x} ${v}`;
    else if (row.step) d += `H${x}V${v}`;
    else d += `L${x} ${v}`;
  });
  return d;
}

const Traces = memo(function Traces({ a, b, list, delta, deltaH, deltaMax }: { a: LapView; b?: LapView; list: Row[]; delta: { frac: number; delta: number }[] | null; deltaH: number; deltaMax: number }) {
  return (
    <>
      {delta && (
        <svg viewBox={`0 0 ${W} ${deltaH}`} preserveAspectRatio="none" className="block w-full" style={{ height: deltaH }} aria-hidden>
          <line x1={0} x2={W} y1={deltaH / 2} y2={deltaH / 2} stroke="rgb(var(--paper) / 0.25)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <path
            d={`M0 ${deltaH / 2} ` + delta.map((p) => `L${(p.frac * W).toFixed(1)} ${(deltaH / 2 + (p.delta / deltaMax) * (deltaH / 2 - 4)).toFixed(1)}`).join(" ") + ` L${W} ${deltaH / 2} Z`}
            fill="rgb(var(--paper) / 0.06)"
          />
          <path d={delta.map((p, i) => `${i ? "L" : "M"}${(p.frac * W).toFixed(1)} ${(deltaH / 2 + (p.delta / deltaMax) * (deltaH / 2 - 4)).toFixed(1)}`).join(" ")} fill="none" stroke="rgb(var(--paper))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {list.map((row) => (
        <svg key={row.key} viewBox={`0 0 ${W} ${row.h}`} preserveAspectRatio="none" className="block w-full border-t border-hairline" style={{ height: row.h }} aria-hidden>
          {row.min < 0 && <line x1={0} x2={W} y1={(row.max / (row.max - row.min)) * row.h} y2={(row.max / (row.max - row.min)) * row.h} stroke="rgb(var(--paper) / 0.15)" vectorEffect="non-scaling-stroke" />}
          {b && <path d={tracePath(b, row)} fill="none" stroke={SLOT_B} strokeWidth={1.25} vectorEffect="non-scaling-stroke" opacity={0.9} />}
          <path d={tracePath(a, row)} fill="none" stroke={row.color ?? (b ? SLOT_A : "#EC5C30")} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </>
  );
});

function Readouts({ a, b, list, playhead, delta, deltaH }: { a: LapView; b?: LapView; list: Row[]; playhead: Playhead; delta: { frac: number; delta: number }[] | null; deltaH: number }) {
  const t = usePlayhead(playhead);
  const ca = cursorAt(a, t);
  // B read at the same point on track, not the same time, so the readouts compare like for like.
  const ib = b ? channelIndexAtFrac(b, ca.frac) : 0;
  const ia = ca.index;
  const value = (l: LapView, row: Row, i: number) => (row.ch ? channelAt(l.ch[row.ch], i) : row.pick!(sampleAt(l.samples, i)));
  const gap = delta ? deltaOnTrace(delta, ca.frac) : 0;
  return (
    <>
      {delta && (
        <Readout h={deltaH} label="Δ gap" unit="s">
          <span style={{ color: gap <= 0 ? SLOT_A : SLOT_B }}>{fmtDelta(gap)}</span>
        </Readout>
      )}
      {list.map((row) => (
        <Readout key={row.key} h={row.h} label={row.label} unit={row.unit} border>
          <span style={{ color: row.color ?? (b ? SLOT_A : undefined) }}>{row.fmt(value(a, row, ia))}</span>
          {b && <span className="ml-1.5" style={{ color: SLOT_B }}>{row.fmt(value(b, row, ib))}</span>}
        </Readout>
      ))}
      <div className="sr-only" aria-live="off">{`Cursor at ${(ca.frac * 100).toFixed(0)} percent of the lap`}</div>
    </>
  );
}

function channelIndexAtFrac(l: LapView, frac: number) {
  const d = frac * lapLength(l);
  const s = l.samples;
  let lo = 0;
  let hi = s.length - 1;
  if (d <= s[0].distance) return 0;
  if (d >= s[hi].distance) return hi;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  return lo + (d - s[lo].distance) / (s[hi].distance - s[lo].distance || 1);
}

function Readout({ h, label, unit, border, children }: { h: number; label: string; unit: string; border?: boolean; children: React.ReactNode }) {
  return (
    <div className={border ? "flex flex-col justify-center border-t border-hairline px-2" : "flex flex-col justify-center px-2"} style={{ height: h }}>
      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">
        {label}
        {unit && <span className="ml-1 normal-case tracking-normal text-label-4">{unit}</span>}
      </span>
      <span className="font-mono text-[0.75rem] font-bold tabular-nums text-paper">{children}</span>
    </div>
  );
}

function Cursor({ a, playhead }: { a: LapView; playhead: Playhead }) {
  const t = usePlayhead(playhead);
  const { frac } = cursorAt(a, t);
  return <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-paper shadow-[0_0_6px_rgba(255,255,255,0.6)]" style={{ left: `${frac * 100}%` }} />;
}

export function ChannelStack({ a, b, playhead, sectorSplits, onScrub }: { a: LapView; b?: LapView; playhead: Playhead; sectorSplits: [number, number]; onScrub: () => void }) {
  const list = useMemo(() => rows(a, b), [a, b]);
  const delta = useMemo(() => (b ? deltaTrace(a.samples, b.samples, 300) : null), [a, b]);
  const deltaMax = useMemo(() => Math.max(0.1, ...(delta?.map((p) => Math.abs(p.delta)) ?? [0])) * 1.1, [delta]);
  const deltaH = 72;
  const plot = useRef<HTMLDivElement>(null);
  const lapTime = a.samples[a.samples.length - 1].t;

  const scrubTo = (clientX: number) => {
    const r = plot.current?.getBoundingClientRect();
    if (!r) return;
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onScrub();
    playhead.set(timeAtDistance(a.samples, frac * lapLength(a)));
  };

  return (
    <div
      className="grid grid-cols-[4.75rem_minmax(0,1fr)] border border-hairline bg-[rgb(var(--canvas)/0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-tint sm:grid-cols-[6.5rem_minmax(0,1fr)]"
      role="slider"
      tabIndex={0}
      aria-label="Telemetry channels: drag to scrub the lap"
      aria-valuemin={0}
      aria-valuemax={Math.round(lapTime * 10) / 10}
      aria-valuenow={Math.round(playhead.get() * 10) / 10}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 5 : 0.5;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          onScrub();
          playhead.set(Math.max(0, Math.min(lapTime, playhead.get() + (e.key === "ArrowRight" ? step : -step))));
        }
      }}
    >
      {/* Corner number lane */}
      <div className="flex h-6 items-center border-b border-hairline px-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">Corner</div>
      <div className="relative h-6 border-b border-hairline">
        {a.corners.map((c) => (
          <span key={c.number} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[0.5625rem] font-bold text-label-2" style={{ left: `${c.apexFrac * 100}%` }}>
            {c.number}
          </span>
        ))}
      </div>

      <div className="border-r border-hairline">
        <Readouts a={a} b={b} list={list} playhead={playhead} delta={delta} deltaH={deltaH} />
      </div>
      <div
        ref={plot}
        className="relative cursor-crosshair touch-pan-y select-none"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          scrubTo(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && scrubTo(e.clientX)}
      >
        <Traces a={a} b={b} list={list} delta={delta} deltaH={deltaH} deltaMax={deltaMax} />
        {[0, ...sectorSplits].map((f, i) => (
          <span key={i} aria-hidden className="pointer-events-none absolute inset-y-0 border-l border-dashed border-tint/40" style={{ left: `${f * 100}%` }}>
            <span className="absolute left-1 top-0.5 font-mono text-[0.5625rem] text-tint/80">S{i + 1}</span>
          </span>
        ))}
        {a.corners.map((c) => (
          <span key={c.number} aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-paper/[0.05]" style={{ left: `${c.apexFrac * 100}%` }} />
        ))}
        <Cursor a={a} playhead={playhead} />
      </div>

      <div className="border-t border-hairline px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">Dist</div>
      <div className="flex justify-between border-t border-hairline px-1 py-1 font-mono text-[0.5625rem] tabular-nums text-label-3">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span key={f}>{((f * lapLength(a)) / 1000).toFixed(1)} km</span>
        ))}
      </div>
    </div>
  );
}
