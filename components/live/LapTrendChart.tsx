/**
 * components/live/LapTrendChart.tsx
 *
 * Lap time across the session with the personal best as a reference line.
 * Pit-out laps are gaps rather than spikes.
 */
"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LapData, formatLapTime } from "./types";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { EMBER, PURPLE, SURFACE_1 } from "@/lib/theme/palette";

function fmtY(v: number) {
  if (!v) return "";
  const m = Math.floor(v / 60);
  const s = (v % 60).toFixed(1).padStart(4, "0");
  return m > 0 ? `${m}:${s}` : `${s}s`;
}

export default function LapTrendChart({ laps, fastestLap }: { laps: LapData[]; fastestLap: number }) {
  const data = laps.map((l) => ({
    lap: l.lap_number,
    time: l.is_pit_out_lap || !l.lap_duration ? null : l.lap_duration,
  }));
  const times = data.map((d) => d.time).filter((t): t is number => t !== null);
  if (!times.length) return <p className="py-10 text-center text-subhead text-label-3">No lap times to plot.</p>;

  // Scale to racing pace, not to outliers: an in-lap or safety-car lap can be
  // 50% slower and would otherwise flatten everything else into one line.
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const lo = sorted[0];
  const hi = Math.min(sorted[sorted.length - 1], median * 1.07);
  const pad = (hi - lo) * 0.1 || 1;

  return (
    <div className="h-[240px] sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="lap" {...AXIS} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...AXIS} domain={[lo - pad, hi + pad]} allowDataOverflow tickFormatter={fmtY} width={56} />
          <Tooltip
            cursor={CURSOR_LINE}
            content={
              <ChartTooltip
                title={(l) => `Lap ${l}`}
                format={(p) => [{ label: "Lap time", value: p[0].value ? formatLapTime(p[0].value) : "Pit out", color: EMBER }]}
              />
            }
          />
          {fastestLap > 0 && (
            <ReferenceLine
              y={fastestLap}
              stroke={PURPLE}
              strokeDasharray="4 4"
              label={{ value: "Best", position: "insideTopLeft", fill: PURPLE, fontSize: 11 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="time"
            stroke={EMBER}
            strokeWidth={2}
            connectNulls={false}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload.time) return <g key={`d-${payload.lap}`} />;
              const best = Math.abs(payload.time - fastestLap) < 0.001;
              return (
                <circle
                  key={`d-${payload.lap}`}
                  cx={cx}
                  cy={cy}
                  r={best ? 4.5 : 2}
                  fill={best ? PURPLE : SURFACE_1}
                  stroke={best ? PURPLE : EMBER}
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
