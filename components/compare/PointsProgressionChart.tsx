"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DriverStats } from "@/lib/types/driver";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { A_COLOR, B_COLOR, alignSeasons } from "./constants";

/** Cumulative career points by season — the shape of each career. */
export function PointsProgressionChart({ a, b }: { a: DriverStats; b: DriverStats }) {
  const data: { season: string; a: number; b: number }[] = [];
  for (const { season, a: ra, b: rb } of alignSeasons(a, b)) {
    const previous = data.at(-1);
    data.push({ season, a: (previous?.a ?? 0) + (ra?.points ?? 0), b: (previous?.b ?? 0) + (rb?.points ?? 0) });
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
        <defs>
          {(["a", "b"] as const).map((k) => (
            <linearGradient key={k} id={`cmp-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k === "a" ? A_COLOR : B_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={k === "a" ? A_COLOR : B_COLOR} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="season" {...AXIS} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...AXIS} width={44} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} />
        <Tooltip cursor={CURSOR_LINE} content={<ChartTooltip title={(l) => `After ${l}`} />} />
        <Area isAnimationActive={false} type="monotone" dataKey="a" name={a.driver.familyName} stroke={A_COLOR} strokeWidth={2} fill="url(#cmp-a)" activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area isAnimationActive={false} type="monotone" dataKey="b" strokeDasharray="5 3" name={b.driver.familyName} stroke={B_COLOR} strokeWidth={2} fill="url(#cmp-b)" activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
