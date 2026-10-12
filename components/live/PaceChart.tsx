"use client";

/**
 * components/live/PaceChart.tsx
 *
 * Lap times through the session with the strategy laid over them: each
 * stint shaded in its compound colour, every lap dotted in the tyre it was
 * set on, and a dashed degradation line fitted through each stint's clean
 * laps. In races the times can be fuel-corrected, which takes the ~0.055 s
 * a lap of fuel burn out so the slope is mostly tyre.
 */

import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { Segmented } from "@/components/ui/Segmented";
import { PURPLE, SURFACE_1 } from "@/lib/theme/palette";
import { FUEL_S_PER_LAP, fuelCorrect, idealLap, stintPace, type PaceLap, type StintRange } from "@/lib/telemetry/pace";
import { LapData, Stint, TYRE_COLORS, formatLapTime } from "./types";

function fmtY(v: number) {
  if (!v) return "";
  const m = Math.floor(v / 60);
  const s = (v % 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}:${s}` : `${s}s`;
}

/** Lap ticks at round numbers: every 5 laps for short runs, every 10 for races. */
function lapTicks(first: number, last: number) {
  const step = last - first > 30 ? 10 : 5;
  const out = [first];
  for (let l = Math.ceil((first + 1) / step) * step; l < last; l += step) out.push(l);
  if (last > first) out.push(last);
  return out;
}

export function toPaceLaps(laps: LapData[]): PaceLap[] {
  return [...laps]
    .sort((a, b) => a.lap_number - b.lap_number)
    .map((l) => ({ lap: l.lap_number, time: l.lap_duration && l.lap_duration > 0 ? l.lap_duration : null, pitOut: l.is_pit_out_lap, sectors: [l.duration_sector_1, l.duration_sector_2, l.duration_sector_3] }));
}

export function toStintRanges(stints: Stint[], lastLap: number): StintRange[] {
  return [...stints]
    .sort((a, b) => a.stint_number - b.stint_number)
    .map((s) => ({ stint: s.stint_number, compound: s.compound || "UNKNOWN", lapStart: s.lap_start, lapEnd: s.lap_end || lastLap, tyreAgeAtStart: s.tyre_age_at_start ?? 0 }));
}

export default function PaceChart({ laps, stints, isRace }: { laps: LapData[]; stints: Stint[]; isRace: boolean }) {
  const [scale, setScale] = useState<"pace" | "full">("pace");
  const [fuel, setFuel] = useState(isRace);
  const corrected = fuel && isRace;

  const pace = useMemo(() => toPaceLaps(laps), [laps]);
  const lastLap = pace[pace.length - 1]?.lap ?? 1;
  const ranges = useMemo(() => toStintRanges(stints, lastLap), [stints, lastLap]);
  const stintStats = useMemo(() => stintPace(pace, ranges, corrected), [pace, ranges, corrected]);

  const compoundAt = (lap: number) => ranges.find((r) => lap >= r.lapStart && lap <= r.lapEnd)?.compound ?? "UNKNOWN";
  const data = pace.map((l) => {
    const time = l.time === null || l.pitOut ? null : corrected ? fuelCorrect(l.time, l.lap) : l.time;
    const row: Record<string, number | string | null> = { lap: l.lap, time, compound: compoundAt(l.lap) };
    stintStats.forEach((s, i) => {
      row[`fit${i}`] = s.fit && s.deg !== null && l.lap >= s.lapStart && l.lap <= s.lapEnd ? s.fit.slope * l.lap + s.fit.intercept : null;
    });
    return row;
  });

  const times = data.map((d) => d.time).filter((t): t is number => typeof t === "number");
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const lo = sorted[0] ?? 0;
  const hi = scale === "pace" ? Math.min(sorted[sorted.length - 1] ?? 0, median * 1.07) : sorted[sorted.length - 1] ?? 0;
  const pad = (hi - lo) * 0.1 || 1;
  const best = pace.filter((l) => l.time && !l.pitOut).reduce((m, l) => Math.min(m, l.time as number), Infinity);
  const bestY = corrected ? fuelCorrect(best, pace.find((l) => l.time === best)?.lap ?? 1) : best;
  const ideal = idealLap(pace);
  const clean = sorted.filter((t) => t <= median * 1.07);
  const mean = clean.reduce((a, b) => a + b, 0) / (clean.length || 1);
  const sigma = clean.length > 1 ? Math.sqrt(clean.reduce((a, t) => a + (t - mean) ** 2, 0) / (clean.length - 1)) : null;

  if (!times.length) return <p className="py-10 text-center text-subhead text-label-3">No lap times to plot.</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <dl className="grid grid-cols-2 gap-x-7 gap-y-3 sm:flex sm:flex-wrap">
          <Metric label="Best lap" value={formatLapTime(best)} className="text-purple" />
          <Metric label="Ideal lap" value={ideal ? formatLapTime(ideal) : "—"} hint={ideal && isFinite(best) ? `${(best - ideal).toFixed(3)}s left on table` : "Best S1 + S2 + S3"} />
          <Metric label="Median pace" value={formatLapTime(median)} hint={corrected ? "fuel-corrected" : undefined} />
          <Metric label={<>Spread <span className="normal-case">σ</span></>} value={sigma !== null ? `${sigma.toFixed(3)}s` : "—"} hint="clean laps" />
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          {isRace && (
            <button type="button" aria-pressed={fuel} onClick={() => setFuel((f) => !f)} className={`pressable flex h-11 items-center border px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em] ${fuel ? "border-accent bg-accent/15 text-paper" : "border-separator text-label-3 hover:text-paper"}`}>
              Fuel-corrected
            </button>
          )}
          <Segmented aria-label="Lap chart scale" size="sm" value={scale} onChange={setScale} segments={[{ value: "pace", label: "Racing pace" }, { value: "full", label: "All laps" }]} />
        </div>
      </div>

      <div className="h-[260px] sm:h-[320px]" role="img" aria-label={`Lap times by lap with tyre stints${corrected ? ", fuel-corrected" : ""}. Stint figures are in the table below.`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID} />
            {ranges.map((r) => (
              <ReferenceArea key={r.stint} x1={r.lapStart - 0.5} x2={r.lapEnd + 0.5} fill={TYRE_COLORS[r.compound] ?? TYRE_COLORS.UNKNOWN} fillOpacity={0.035} ifOverflow="hidden" label={{ value: r.compound[0], position: "insideTop", fill: TYRE_COLORS[r.compound] ?? "#888", fontSize: 11, fontWeight: 700 }} />
            ))}
            <XAxis dataKey="lap" type="number" domain={[pace[0]?.lap - 0.5, lastLap + 0.5]} ticks={lapTicks(pace[0]?.lap ?? 1, lastLap)} {...AXIS} />
            <YAxis {...AXIS} domain={[lo - pad, hi + pad]} allowDataOverflow tickFormatter={fmtY} width={56} />
            <Tooltip
              cursor={CURSOR_LINE}
              content={
                <ChartTooltip
                  title={(l) => `Lap ${l}`}
                  format={(p) => {
                    const row = p[0]?.payload;
                    return row?.time ? [{ label: `${String(row.compound).toLowerCase()}${corrected ? " · corrected" : ""}`, value: formatLapTime(row.time), color: TYRE_COLORS[row.compound] }] : [];
                  }}
                />
              }
            />
            {isFinite(bestY) && <ReferenceLine y={bestY} stroke={PURPLE} strokeDasharray="4 4" />}
            <Line
              type="linear"
              dataKey="time"
              stroke="none"
              connectNulls={false}
              isAnimationActive={false}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload.time || cy == null) return <g key={`d-${payload.lap}`} />;
                const isBest = Math.abs(payload.time - bestY) < 0.001;
                const c = TYRE_COLORS[payload.compound] ?? TYRE_COLORS.UNKNOWN;
                return <circle key={`d-${payload.lap}`} cx={cx} cy={cy} r={isBest ? 5 : 3} fill={isBest ? PURPLE : c} stroke={isBest ? "#fff" : SURFACE_1} strokeWidth={1.2} />;
              }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            {stintStats.map((s, i) => (
              <Line key={i} dataKey={`fit${i}`} stroke={TYRE_COLORS[s.compound] ?? "#888"} strokeDasharray="5 4" strokeWidth={1.5} dot={false} activeDot={false} isAnimationActive={false} connectNulls />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-caption text-label-3">
        Dots are coloured by compound; dashed lines are each stint’s fitted degradation. Pit-out laps are left out.
        {corrected ? ` Fuel correction adds back ${FUEL_S_PER_LAP.toFixed(3)} s per lap of fuel burned (an estimate).` : ""}
      </p>
      <StintTable stints={stintStats} corrected={corrected} />
    </div>
  );
}

function Metric({ label, value, hint, className }: { label: React.ReactNode; value: string; hint?: string; className?: string }) {
  return (
    <div>
      <dt className="label-caps text-[0.6875rem] text-label-3">{label}</dt>
      <dd className={`mt-1 font-mono text-[1rem] tabular-nums ${className ?? "text-paper"}`}>{value}</dd>
      {hint && <dd className="text-[0.6875rem] text-label-3">{hint}</dd>}
    </div>
  );
}

function StintTable({ stints, corrected }: { stints: ReturnType<typeof stintPace>; corrected: boolean }) {
  if (!stints.length) return null;
  const maxDeg = Math.max(0.05, ...stints.map((s) => Math.abs(s.deg ?? 0)));
  return (
    <div className="table-scroll mt-5 border-t border-hairline pt-4" tabIndex={0} role="region" aria-label="Stint analysis">
      <table className="w-full min-w-[620px] text-left font-mono text-[0.75rem] tabular-nums">
        <caption className="sr-only">Pace and degradation per stint{corrected ? ", fuel-corrected" : ""}</caption>
        <thead>
          <tr className="border-b border-hairline text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">
            <th scope="col" className="py-2 pr-2 font-normal">Stint</th>
            <th scope="col" className="py-2 pr-2 font-normal">Laps</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Age in</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Best</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Mean</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal normal-case">σ</th>
            <th scope="col" className="py-2 font-normal">Deg / lap</th>
          </tr>
        </thead>
        <tbody>
          {stints.map((s) => {
            const c = TYRE_COLORS[s.compound] ?? TYRE_COLORS.UNKNOWN;
            return (
              <tr key={s.stint} className="border-b border-hairline last:border-0">
                <th scope="row" className="py-2 pr-2 font-normal">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 text-[0.625rem] font-bold" style={{ borderColor: c, color: c }}>{s.compound[0]}</span>
                    <span className="text-paper">{s.stint}</span>
                  </span>
                </th>
                <td className="py-2 pr-2 text-label-2">
                  {s.lapStart}–{s.lapEnd} <span className="text-label-3">({s.laps}, {s.clean} clean)</span>
                </td>
                <td className="py-2 pr-2 text-right text-label-2">{s.tyreAgeAtStart}</td>
                <td className="py-2 pr-2 text-right text-paper">{s.best ? formatLapTime(s.best) : "—"}</td>
                <td className="py-2 pr-2 text-right text-label-2">{s.mean ? formatLapTime(s.mean) : "—"}</td>
                <td className="py-2 pr-2 text-right text-label-2">{s.sigma !== null ? s.sigma.toFixed(3) : "—"}</td>
                <td className="py-2">
                  {s.deg === null ? (
                    <span className="text-label-4">too few laps</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className={`w-14 text-right font-bold ${s.deg > 0 ? "text-paper" : "text-success"}`}>
                        {s.deg >= 0 ? "+" : "−"}
                        {Math.abs(s.deg).toFixed(3)}
                      </span>
                      <span className="relative h-1.5 w-24 bg-fill-2" aria-hidden>
                        <span className="absolute inset-y-0 left-1/2 w-px bg-paper/30" />
                        <span className="absolute inset-y-0" style={{ background: c, left: s.deg >= 0 ? "50%" : `${50 - (Math.abs(s.deg) / maxDeg) * 50}%`, width: `${(Math.abs(s.deg) / maxDeg) * 50}%` }} />
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-caption text-label-3">Deg is the fitted slope through each stint’s clean laps (within 107% of median, pit laps excluded): seconds lost per lap of tyre age.</p>
    </div>
  );
}
