"use client";

/**
 * components/live/RaceTrace.tsx
 *
 * A race told by position and gap: running position (step line, P1 at the
 * top) and the gap to the leader, both on a lap axis. OpenF1 timestamps
 * are mapped to fractional laps using each lap's start time, so pit stops
 * and safety cars line up with the pace chart above.
 */

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { EMBER, INFO } from "@/lib/theme/palette";
import type { IntervalPoint, LapData, PositionPoint } from "./types";

/** Fractional lap number for a timestamp, from the laps' start times. */
function lapClock(laps: LapData[]) {
  const starts = laps
    .filter((l) => l.date_start)
    .map((l) => ({ lap: l.lap_number, t: Date.parse(l.date_start as string), dur: l.lap_duration ?? 0 }))
    .sort((a, b) => a.t - b.t);
  return (iso: string) => {
    const t = Date.parse(iso);
    if (!starts.length) return null;
    if (t < starts[0].t) return starts[0].lap - 1 + Math.max(0, 1 - (starts[0].t - t) / 90_000);
    let k = starts.length - 1;
    while (k > 0 && starts[k].t > t) k--;
    const s = starts[k];
    const next = starts[k + 1]?.t ?? s.t + (s.dur || 90) * 1000;
    return s.lap + Math.min(1, (t - s.t) / Math.max(1, next - s.t));
  };
}

export default function RaceTrace({ laps, positions, intervals }: { laps: LapData[]; positions: PositionPoint[]; intervals: IntervalPoint[] }) {
  const clock = useMemo(() => lapClock(laps), [laps]);
  const pos = useMemo(
    () => positions.map((p) => ({ lap: clock(p.date), position: p.position })).filter((p): p is { lap: number; position: number } => p.lap !== null).sort((a, b) => a.lap - b.lap),
    [positions, clock],
  );
  const gaps = useMemo(
    () =>
      intervals
        .map((p) => ({ lap: clock(p.date), gap: typeof p.gap_to_leader === "number" ? p.gap_to_leader : null, interval: typeof p.interval === "number" ? p.interval : null }))
        .filter((p): p is { lap: number; gap: number | null; interval: number | null } => p.lap !== null && (p.gap !== null || p.interval !== null))
        .sort((a, b) => a.lap - b.lap),
    [intervals, clock],
  );
  const maxLap = Math.max(...laps.map((l) => l.lap_number), 1);
  // OpenF1 only logs position changes: carry the last one to the flag.
  const posLine = pos.length ? [...pos, { lap: maxLap, position: pos[pos.length - 1].position }] : pos;
  const ledThroughout = gaps.length > 0 && gaps.every((g) => (g.gap ?? 0) < 0.001);
  if (!pos.length && !gaps.length) return <p className="py-6 text-center text-subhead text-label-3">No position or interval data for this session.</p>;

  const start = pos[0]?.position;
  const finish = pos[pos.length - 1]?.position;
  const best = pos.length ? Math.min(...pos.map((p) => p.position)) : null;
  const maxPos = Math.max(...pos.map((p) => p.position), 10);

  return (
    <div className="space-y-5">
      {pos.length > 0 && (
        <dl className="flex flex-wrap gap-x-8 gap-y-3 font-mono tabular-nums">
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Start</dt><dd className="mt-1 text-[1.25rem] text-paper">P{start}</dd></div>
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Finish</dt><dd className="mt-1 text-[1.25rem] text-paper">P{finish}</dd></div>
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Net</dt><dd className={`mt-1 text-[1.25rem] ${start - finish > 0 ? "text-success" : start - finish < 0 ? "text-tint" : "text-paper"}`}>{start - finish > 0 ? "+" : ""}{start - finish}</dd></div>
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Best running</dt><dd className="mt-1 text-[1.25rem] text-paper">P{best}</dd></div>
        </dl>
      )}
      {pos.length > 0 && (
        <figure>
          <figcaption className="label-caps mb-2 text-[0.6875rem] text-label-3">Running position</figcaption>
          <div className="h-[150px]" role="img" aria-label={`Position from P${start} to P${finish}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={posLine} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="lap" type="number" domain={[0, maxLap]} {...AXIS} tickFormatter={(v) => String(Math.round(v))} />
                <YAxis {...AXIS} reversed domain={[1, maxPos]} allowDecimals={false} width={32} tickFormatter={(v) => `P${v}`} />
                <Tooltip cursor={CURSOR_LINE} content={<ChartTooltip title={(l) => `Lap ${Number(l).toFixed(1)}`} format={(p) => [{ label: "Position", value: `P${p[0].value}`, color: EMBER }]} />} />
                <Line type="stepAfter" dataKey="position" stroke={EMBER} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      )}
      {ledThroughout && <p className="status-line">Led at every timing point OpenF1 recorded, so there is no gap to the leader to plot.</p>}
      {gaps.length > 0 && !ledThroughout && (
        <figure>
          <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 text-[0.6875rem]">
            <span className="label-caps text-label-3">Gaps · seconds</span>
            <span className="flex items-center gap-1.5 text-label-2"><span className="h-0.5 w-3" style={{ background: EMBER }} />To leader</span>
            <span className="flex items-center gap-1.5 text-label-2"><span className="h-0.5 w-3" style={{ background: INFO }} />To car ahead</span>
          </figcaption>
          <div className="h-[170px]" role="img" aria-label="Gap to the leader and to the car ahead by lap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gaps} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="lap" type="number" domain={[0, maxLap]} {...AXIS} tickFormatter={(v) => String(Math.round(v))} />
                <YAxis {...AXIS} width={40} />
                <Tooltip cursor={CURSOR_LINE} content={<ChartTooltip title={(l) => `Lap ${Number(l).toFixed(1)}`} format={(p) => p.filter((x) => x.value != null).map((x) => ({ label: x.dataKey === "gap" ? "To leader" : "To car ahead", value: `${Number(x.value).toFixed(3)}s`, color: x.dataKey === "gap" ? EMBER : INFO }))} />} />
                <Line type="monotone" dataKey="gap" stroke={EMBER} strokeWidth={1.75} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="interval" stroke={INFO} strokeWidth={1.25} dot={false} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      )}
    </div>
  );
}
