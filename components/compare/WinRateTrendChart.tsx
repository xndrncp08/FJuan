"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DriverStats } from "@/lib/types/driver";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { A_COLOR, B_COLOR, alignSeasons } from "./constants";

/** Win or podium rate per season; gaps where a driver didn't race. */
export function WinRateTrendChart({ a, b, metric }: { a: DriverStats; b: DriverStats; metric: "wins" | "podiums" }) {
  const rate = (r: any) => (r?.races ? ((r[metric] ?? 0) / r.races) * 100 : null);
  const data = alignSeasons(a, b).map(({ season, a: ra, b: rb }) => ({ season, a: rate(ra), b: rate(rb) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="season" {...AXIS} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...AXIS} width={44} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          cursor={CURSOR_LINE}
          content={
            <ChartTooltip
              title={(l) => `${l} season`}
              format={(p) => p.map((x) => ({ label: x.name, value: x.value == null ? "—" : `${x.value.toFixed(0)}%`, color: x.color }))}
            />
          }
        />
        <Line type="monotone" dataKey="a" name={a.driver.familyName} stroke={A_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="b" name={b.driver.familyName} stroke={B_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
