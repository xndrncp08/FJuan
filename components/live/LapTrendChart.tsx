"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LapData, formatLapTime } from "./types";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { Segmented } from "@/components/ui/Segmented";
import { EMBER, PURPLE, SURFACE_1 } from "@/lib/theme/palette";

function fmtY(v: number) {
  if (!v) return "";
  const m = Math.floor(v / 60);
  const s = (v % 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}:${s}` : `${s}s`;
}

/** Explicit pace scale and lap window; pit-out laps remain gaps. */
export default function LapTrendChart({ laps, fastestLap }: { laps: LapData[]; fastestLap: number }) {
  const [scale, setScale] = useState<"pace" | "full">("pace");
  const [fromLap, setFromLap] = useState<number | null>(null);
  const [toLap, setToLap] = useState<number | null>(null);
  const all = [...laps].sort((a, b) => a.lap_number - b.lap_number).map((l) => ({
    lap: l.lap_number,
    time: l.is_pit_out_lap || !l.lap_duration || l.lap_duration <= 0 ? null : l.lap_duration,
  }));
  const first = all[0]?.lap ?? 1;
  const last = all[all.length - 1]?.lap ?? first;
  const from = Math.max(first, Math.min(fromLap ?? first, last));
  const to = Math.max(from, Math.min(toLap ?? last, last));
  const data = all.filter((l) => l.lap >= from && l.lap <= to);
  const times = data.map((d) => d.time).filter((t): t is number => t !== null);
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const lo = sorted[0] ?? 0;
  const maximum = sorted[sorted.length - 1] ?? 0;
  const hi = scale === "pace" ? Math.min(maximum, median * 1.07) : maximum;
  const pad = (hi - lo) * 0.1 || 1;
  const clipped = times.filter((t) => t > hi + pad).length;

  if (!all.some((l) => l.time !== null)) return <p className="py-10 text-center text-subhead text-label-3">No lap times to plot.</p>;

  return (
    <div>
      <div className="chart-toolbar mb-5">
        <dl className="flex flex-wrap gap-x-7 gap-y-3">
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Window best</dt><dd className="mt-1 font-mono text-[1rem] text-purple">{lo ? formatLapTime(lo) : "—"}</dd></div>
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Median pace</dt><dd className="mt-1 font-mono text-[1rem] text-paper">{median ? formatLapTime(median) : "—"}</dd></div>
          <div><dt className="label-caps text-[0.6875rem] text-label-3">Timed laps</dt><dd className="mt-1 font-mono text-[1rem] text-paper">{times.length}</dd></div>
        </dl>
        <Segmented aria-label="Lap chart scale" size="sm" value={scale} onChange={setScale} segments={[{ value: "pace", label: "Racing pace" }, { value: "full", label: "Full session" }]} />
      </div>
      <div className="h-[240px] sm:h-[280px]" role="group" aria-label={`Lap times from lap ${from} to ${to}, in minutes and seconds`}>
        {times.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="lap" {...AXIS} interval="preserveStartEnd" minTickGap={16} />
              <YAxis {...AXIS} domain={[lo - pad, hi + pad]} allowDataOverflow tickFormatter={fmtY} width={56} />
              <Tooltip cursor={CURSOR_LINE} content={<ChartTooltip title={(l) => `Lap ${l}`} format={(p) => [{ label: "Lap time", value: formatLapTime(p[0].value), color: EMBER }]} />} />
              {fastestLap >= lo - pad && fastestLap <= hi + pad && <ReferenceLine y={fastestLap} stroke={PURPLE} strokeDasharray="4 4" label={{ value: "Session best", position: "insideTopLeft", fill: PURPLE, fontSize: 11 }} />}
              <Line type="linear" dataKey="time" name="Lap time" stroke={EMBER} strokeWidth={2} connectNulls={false} isAnimationActive={false}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload.time) return <g key={`d-${payload.lap}`} />;
                  const best = Math.abs(payload.time - fastestLap) < 0.001;
                  return <circle key={`d-${payload.lap}`} cx={cx} cy={cy} r={best ? 4.5 : 2} fill={best ? PURPLE : SURFACE_1} stroke={best ? PURPLE : EMBER} strokeWidth={1.5} />;
                }} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="flex h-full items-center justify-center text-label-3">No timed laps in this window. Expand the range.</p>}
      </div>
      <div className="mt-4 grid gap-4 border-t border-hairline pt-4 sm:grid-cols-2">
        <label className="text-footnote text-label-2">From lap <span className="float-right font-mono text-paper">{from}</span>
          <input className="mt-1 block h-8 w-full cursor-pointer" type="range" min={first} max={last} value={from} onChange={(e) => { const next = Number(e.target.value); setFromLap(next); if (next > to) setToLap(next); }} aria-label="First lap in chart" />
        </label>
        <label className="text-footnote text-label-2">To lap <span className="float-right font-mono text-paper">{to}</span>
          <input className="mt-1 block h-8 w-full cursor-pointer" type="range" min={first} max={last} value={to} onChange={(e) => { const next = Number(e.target.value); setToLap(next); if (next < from) setFromLap(next); }} aria-label="Last lap in chart" />
        </label>
      </div>
      <p className="mt-2 text-caption text-label-3">{clipped ? `${clipped} slower ${clipped === 1 ? "lap is" : "laps are"} outside the racing-pace scale. Choose Full session to see all times. ` : ""}Pit-out laps appear as gaps. Use the lap range to inspect a stint.</p>
    </div>
  );
}
