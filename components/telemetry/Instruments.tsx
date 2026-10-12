"use client";

/**
 * components/telemetry/Instruments.tsx
 *
 * The cockpit's live instruments, all driven by the shared playhead:
 *   WheelHud   steering-wheel display — 15 shift lights, rev arc, gear,
 *              speed, brake/throttle columns, DRS and drive state, live gap
 *   GgDiagram  friction circle: lateral vs longitudinal g, with the whole
 *              lap as a faint envelope and the last second as a trail
 *   LapCard    A vs B lap and sector times, final gap, mini-sector bar
 */

import { useMemo } from "react";
import { HEAT } from "@/components/ui/chart";
import { deltaOnTrace, deltaTrace, miniSectors } from "@/lib/telemetry/analysis";
import { formatLapSeconds } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { sampleAt, usePlayhead, type Playhead } from "./playhead";
import { driveState } from "./TrackScene";
import { SLOT_A, SLOT_B, channelAt, cursorAt, fmtDelta, type LapView } from "./model";

const STATE_LABEL = { brake: "Braking", throttle: "Full throttle", coast: "Coasting" } as const;
const LEDS = 15;
const LED_COLORS = ["#1FA350", "#1FA350", "#1FA350", "#1FA350", "#1FA350", "#E8322E", "#E8322E", "#E8322E", "#E8322E", "#E8322E", "#B48CFF", "#B48CFF", "#B48CFF", "#B48CFF", "#B48CFF"];

// Rev arc: 240° sweep, opening at the bottom.
const ARC_START = 150;
const ARC_SWEEP = 240;
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

export function WheelHud({ lap, refLap, playhead, compact = false }: { lap: LapView; refLap?: LapView; playhead: Playhead; compact?: boolean }) {
  const t = usePlayhead(playhead);
  const { index, frac } = cursorAt(lap, t);
  const s = sampleAt(lap.samples, index);
  const maxRpm = useMemo(() => Math.max(...lap.samples.map((x) => x.rpm)) || 12000, [lap.samples]);
  const scaleMax = Math.ceil(maxRpm / 1000) * 1000;
  const lit = Math.max(0, Math.min(LEDS, Math.round(((s.rpm - maxRpm * 0.84) / (maxRpm * 0.16)) * LEDS)));
  const state = driveState(s);
  const trace = useMemo(() => (refLap ? deltaTrace(lap.samples, refLap.samples, 300) : null), [lap, refLap]);
  const gap = trace ? deltaOnTrace(trace, frac) : null;
  const corner = lap.corners.find((c) => c.brakeIndex <= index && index <= c.apexIndex + 6);

  const cx = 100;
  const cy = 92;
  const r = 70;
  const rpmFrac = Math.min(1, s.rpm / scaleMax);

  return (
    <div className={cn("glass-strong pointer-events-none select-none p-3", compact ? "mx-auto w-full max-w-[340px]" : "w-[272px]")} aria-hidden>
      {/* Shift lights */}
      <div className="flex justify-between gap-[3px] px-1">
        {LED_COLORS.map((c, i) => (
          <span key={i} className="h-2 flex-1 rounded-full transition-[background-color,box-shadow] duration-75" style={i < lit ? { background: c, boxShadow: `0 0 8px ${c}` } : { background: "rgb(var(--paper) / 0.08)" }} />
        ))}
      </div>

      <div className="relative mt-1">
        <svg viewBox="0 0 200 150" className="w-full">
          <path d={arcPath(cx, cy, r, ARC_START, ARC_START + ARC_SWEEP)} fill="none" stroke="rgb(var(--paper) / 0.08)" strokeWidth={9} />
          <path d={arcPath(cx, cy, r, ARC_START, ARC_START + ARC_SWEEP * Math.max(0.001, rpmFrac))} fill="none" stroke={rpmFrac > 0.92 ? "#B48CFF" : rpmFrac > 0.8 ? HEAT.brake : "#FF7A52"} strokeWidth={9} />
          {Array.from({ length: scaleMax / 1000 + 1 }, (_, k) => {
            const deg = ARC_START + (ARC_SWEEP * k * 1000) / scaleMax;
            const [x1, y1] = polar(cx, cy, r - 9, deg);
            const [x2, y2] = polar(cx, cy, r - (k % 2 ? 13 : 16), deg);
            const [tx, ty] = polar(cx, cy, r - 25, deg);
            return (
              <g key={k}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--paper) / 0.35)" strokeWidth={1} />
                {k % 2 === 0 && <text x={tx} y={ty + 3} textAnchor="middle" className="fill-[var(--label-3)] font-mono text-[8px]">{k}</text>}
              </g>
            );
          })}
          <text x={cx} y={cy + 8} textAnchor="middle" className="fill-[rgb(var(--paper))] font-display text-[48px]">{s.gear || "N"}</text>
          <text x={cx} y={cy + 34} textAnchor="middle" className="fill-[rgb(var(--paper))] font-mono text-[17px] font-bold">{Math.round(s.speed)}</text>
          <text x={cx} y={cy + 45} textAnchor="middle" className="fill-[var(--label-3)] font-mono text-[7px] tracking-[0.2em]">KM/H · {Math.round(s.rpm).toLocaleString()} RPM</text>
        </svg>
        {/* Pedal columns either side of the arc */}
        {([["BRK", s.brake, HEAT.brake, "left-0"], ["THR", s.throttle, HEAT.throttle, "right-0"]] as const).map(([label, v, c, side]) => (
          <div key={label} className={cn("absolute bottom-3 top-3 flex w-3 flex-col items-center", side)}>
            <div className="relative w-full flex-1 bg-[rgb(var(--paper)/0.08)]">
              <div className="absolute inset-x-0 bottom-0 transition-[height] duration-75" style={{ height: `${v}%`, background: c, boxShadow: `0 0 8px ${c}` }} />
            </div>
            <span className="mt-1 font-mono text-[8px] text-label-3">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 border border-[var(--glass-edge)] px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-paper">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: HEAT[state] }} />
          {STATE_LABEL[state]}
        </span>
        {corner && <span className="font-mono text-[0.6875rem] font-bold text-tint">T{corner.number}</span>}
        <span className={cn("border px-1.5 py-0.5 font-mono text-[0.625rem] font-bold", s.drs ? "border-success/60 bg-success/15 text-success" : "border-[var(--glass-edge)] text-label-4")}>DRS</span>
      </div>

      <div className="mt-2 grid grid-cols-3 border-t border-[var(--glass-edge)] pt-2 font-mono text-[0.6875rem] tabular-nums">
        <span className="text-label-2">{formatLapSeconds(t)}</span>
        <span className="text-center text-label-3">{(s.distance / 1000).toFixed(3)} km</span>
        {gap !== null ? (
          <span className="text-right font-bold" style={{ color: gap <= 0 ? SLOT_A : SLOT_B }}>{fmtDelta(gap)}</span>
        ) : (
          <span className="text-right text-label-3">{Math.round(frac * 100)}%</span>
        )}
      </div>
    </div>
  );
}

const GG_MAX = 5;

export function GgDiagram({ lap, playhead, color }: { lap: LapView; playhead: Playhead; color: string }) {
  const t = usePlayhead(playhead);
  const { index } = cursorAt(lap, t);
  const size = 150;
  const c = size / 2;
  const k = (c - 8) / GG_MAX;
  const pt = (lat: number, lon: number) => [c - lat * k, c - lon * k]; // left turns plot left; braking plots down
  const envelope = useMemo(() => lap.ch.gLat.map((g, i) => pt(g, lap.ch.gLong[i])), [lap]); // eslint-disable-line react-hooks/exhaustive-deps
  const from = Math.max(0, Math.floor(index) - 12);
  const trail = envelope.slice(from, Math.floor(index) + 1);
  const [x, y] = pt(channelAt(lap.ch.gLat, index), channelAt(lap.ch.gLong, index));
  const total = Math.hypot(channelAt(lap.ch.gLat, index), channelAt(lap.ch.gLong, index));

  return (
    <figure className="glass-strong pointer-events-none select-none p-3" aria-hidden>
      <figcaption className="mb-1 flex items-baseline justify-between font-mono text-[0.625rem] uppercase tracking-[0.16em] text-label-3">
        <span>g-g · friction circle</span>
        <span className="tabular-nums text-paper">{total.toFixed(1)} g</span>
      </figcaption>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[180px]">
        {[1, 2, 3, 4, 5].map((g) => (
          <circle key={g} cx={c} cy={c} r={g * k} fill="none" stroke={`rgb(var(--paper) / ${g % 2 ? 0.07 : 0.14})`} />
        ))}
        <line x1={c} y1={6} x2={c} y2={size - 6} stroke="rgb(var(--paper) / 0.14)" />
        <line x1={6} y1={c} x2={size - 6} y2={c} stroke="rgb(var(--paper) / 0.14)" />
        <text x={c + 3} y={12} className="fill-[var(--label-3)] font-mono text-[7px]">ACC</text>
        <text x={c + 3} y={size - 5} className="fill-[var(--label-3)] font-mono text-[7px]">BRK</text>
        <text x={6} y={c - 3} className="fill-[var(--label-3)] font-mono text-[7px]">L</text>
        <text x={size - 10} y={c - 3} className="fill-[var(--label-3)] font-mono text-[7px]">R</text>
        <text x={c + 2 * k + 2} y={c - 2} className="fill-[var(--label-4)] font-mono text-[6px]">2g</text>
        <text x={c + 4 * k + 2} y={c - 2} className="fill-[var(--label-4)] font-mono text-[6px]">4g</text>
        {envelope.map(([ex, ey], i) => (
          <circle key={i} cx={ex} cy={ey} r={0.9} fill={color} opacity={0.18} />
        ))}
        {trail.length > 1 && <polyline points={trail.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.8} />}
        <circle cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth={1.2} />
      </svg>
    </figure>
  );
}

export function LapCard({ lap, refLap, playhead }: { lap: LapView; refLap?: LapView; playhead: Playhead }) {
  const t = usePlayhead(playhead);
  const { frac } = cursorAt(lap, t);
  const mini = useMemo(() => (refLap ? miniSectors(lap.samples, refLap.samples, 24) : []), [lap, refLap]);
  const trace = useMemo(() => (refLap ? deltaTrace(lap.samples, refLap.samples, 300) : null), [lap, refLap]);
  const live = trace ? deltaOnTrace(trace, frac) : null;
  const rows = refLap ? [{ l: lap, c: SLOT_A }, { l: refLap, c: SLOT_B }] : [{ l: lap, c: lap.color }];

  return (
    <div className="glass-strong pointer-events-none select-none p-3" aria-hidden>
      <table className="w-full font-mono text-[0.6875rem] tabular-nums">
        <thead>
          <tr className="text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">
            <th className="pb-1 text-left font-normal">Lap</th>
            <th className="pb-1 text-right font-normal">S1</th>
            <th className="pb-1 text-right font-normal">S2</th>
            <th className="pb-1 text-right font-normal">S3</th>
            <th className="pb-1 text-right font-normal">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ l, c }, r) => {
            const other = rows[1 - r]?.l;
            return (
              <tr key={r}>
                <td className="py-0.5 pr-2 text-left font-bold text-paper">
                  <span className="mr-1.5 inline-block h-2 w-2 align-middle" style={{ background: c }} />
                  {l.code} <span className="font-normal text-label-3">L{l.lapNumber}</span>
                </td>
                {l.sectors.map((sec, i) => {
                  const better = other && sec < other.sectors[i];
                  return <td key={i} className={cn("py-0.5 pl-1.5 text-right", better ? "text-success" : "text-label-2")}>{sec.toFixed(3)}</td>;
                })}
                <td className="py-0.5 pl-2 text-right font-bold text-paper">{formatLapSeconds(l.lapTime)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {refLap && live !== null && (
        <>
          <div className="mt-2 flex items-end justify-between border-t border-[var(--glass-edge)] pt-2">
            <div>
              <div className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-label-3">Live gap {lap.code} → {refLap.code}</div>
              <div className="font-display text-[1.75rem] leading-none tabular-nums" style={{ color: live <= 0 ? SLOT_A : SLOT_B }}>{fmtDelta(live)}</div>
            </div>
            <div className="text-right font-mono text-[0.625rem] text-label-3">
              Final
              <div className="text-[0.8125rem] font-bold text-paper">{fmtDelta(lap.lapTime - refLap.lapTime)}</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="mb-1 flex justify-between font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">
              <span>Mini-sectors</span>
              <span>
                <span style={{ color: SLOT_A }}>{mini.filter((m) => m.winner === -1).length}</span>
                <span className="mx-1">–</span>
                <span style={{ color: SLOT_B }}>{mini.filter((m) => m.winner === 1).length}</span>
              </span>
            </div>
            <div className="relative flex h-2.5 gap-px">
              {mini.map((m, i) => (
                <span key={i} className="flex-1" style={{ background: m.winner === -1 ? SLOT_A : m.winner === 1 ? SLOT_B : "rgb(var(--paper) / 0.2)" }} />
              ))}
              <span className="absolute -bottom-1 -top-1 w-0.5 bg-paper" style={{ left: `${frac * 100}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
