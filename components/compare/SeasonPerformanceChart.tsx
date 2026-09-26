"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DriverStats } from "@/lib/types/driver";
import { AXIS, ChartTooltip, CURSOR_BAR, GRID } from "@/components/ui/chart";
import { A_COLOR, B_COLOR, alignSeasons } from "./constants";

export type SeasonMetric = "wins" | "podiums" | "poles" | "points";

/** Grouped bars: one metric per season, both drivers. */
export function SeasonPerformanceChart({ a, b, metric }: { a: DriverStats; b: DriverStats; metric: SeasonMetric }) {
  const data = alignSeasons(a, b).map(({ season, a: ra, b: rb }) => ({
    season,
    a: ra?.[metric] ?? 0,
    b: rb?.[metric] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap="22%" barGap={2}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="season" {...AXIS} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...AXIS} allowDecimals={false} width={40} />
        <Tooltip cursor={CURSOR_BAR} content={<ChartTooltip title={(l) => `${l} season`} />} />
        <Bar dataKey="a" name={a.driver.familyName} fill={A_COLOR} radius={[4, 4, 1, 1]} maxBarSize={16} />
        <Bar dataKey="b" name={b.driver.familyName} fill={B_COLOR} radius={[4, 4, 1, 1]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
