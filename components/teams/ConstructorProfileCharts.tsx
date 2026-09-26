/**
 * components/teams/ConstructorProfileCharts.tsx
 *
 * A team's season in three views: points per race, the cumulative points
 * curve, and best finish per race. X-axis ticks are round numbers so they
 * never collide on a phone; the tooltip carries the full race name.
 */
"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { AXIS, ChartTooltip, CURSOR_BAR, CURSOR_LINE, GRID } from "@/components/ui/chart";
import { MEDAL } from "@/lib/theme/palette";

interface RacePoint {
  round: number;
  name: string;
  short: string;
  points: number;
  cumPoints: number;
  bestPos: number | null;
  results: { driverCode: string; position: number | null; points: number; status: string }[];
}

type View = "race" | "total" | "finish";

export default function ConstructorProfileCharts({
  raceSeries,
  teamColor,
  season,
}: {
  raceSeries: RacePoint[];
  teamColor: string;
  season: string;
}) {
  const [view, setView] = useState<View>("race");
  if (!raceSeries.length) return null;

  const data = raceSeries.map((r) => ({ ...r, tick: `R${r.round}` }));
  const gradId = `team-grad-${teamColor.replace("#", "")}`;
  const title = (_: any, payload: any[]) => `Round ${payload[0]?.payload?.round} · ${payload[0]?.payload?.name}`;

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-headline text-paper">{season} season</h2>
          <p className="mt-0.5 text-footnote text-label-3">
            {view === "race" ? "Points scored each round" : view === "total" ? "Championship points over the season" : "Best finish each round — higher is better"}
          </p>
        </div>
        <Segmented
          aria-label="Chart"
          size="sm"
          value={view}
          onChange={setView}
          segments={[
            { value: "race", label: "Per race" },
            { value: "total", label: "Total" },
            { value: "finish", label: "Finishes" },
          ]}
        />
      </div>

      <div className="h-[240px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === "race" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap="24%">
              <CartesianGrid {...GRID} />
              <XAxis dataKey="tick" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
              <YAxis {...AXIS} width={40} allowDecimals={false} />
              <Tooltip
                cursor={CURSOR_BAR}
                content={<ChartTooltip title={title} format={(p) => [{ label: "Points", value: p[0].value, color: teamColor }]} />}
              />
              <Bar dataKey="points" radius={[6, 6, 2, 2]} maxBarSize={28}>
                {data.map((r) => (
                  <Cell key={r.round} fill={teamColor} fillOpacity={r.points > 0 ? 0.9 : 0.2} />
                ))}
              </Bar>
            </BarChart>
          ) : view === "total" ? (
            <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={teamColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={teamColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="tick" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
              <YAxis {...AXIS} width={44} allowDecimals={false} />
              <Tooltip
                cursor={CURSOR_LINE}
                content={<ChartTooltip title={title} format={(p) => [{ label: "Total", value: p[0].value, color: teamColor }]} />}
              />
              <Area type="monotone" dataKey="cumPoints" stroke={teamColor} strokeWidth={2} fill={`url(#${gradId})`} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          ) : (
            <LineChart data={data.filter((r) => r.bestPos !== null)} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="tick" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
              <YAxis {...AXIS} reversed domain={[1, 20]} ticks={[1, 3, 10, 20]} width={40} tickFormatter={(v) => `P${v}`} />
              <ReferenceLine y={3} stroke={MEDAL.gold} strokeOpacity={0.35} strokeDasharray="4 4" />
              <ReferenceLine y={10} stroke="rgba(245,233,228,0.15)" strokeDasharray="4 4" />
              <Tooltip
                cursor={CURSOR_LINE}
                content={<ChartTooltip title={title} format={(p) => [{ label: "Best finish", value: `P${p[0].value}`, color: teamColor }]} />}
              />
              <Line
                type="monotone"
                dataKey="bestPos"
                stroke={teamColor}
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const win = payload.bestPos === 1;
                  const podium = payload.bestPos <= 3;
                  return (
                    <circle
                      key={`dot-${payload.round}`}
                      cx={cx}
                      cy={cy}
                      r={win ? 5 : podium ? 4 : 3}
                      fill={win ? MEDAL.gold : podium ? teamColor : "#1F0E0B"}
                      stroke={teamColor}
                      strokeWidth={podium ? 0 : 1.5}
                    />
                  );
                }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {view === "finish" && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-footnote text-label-3">
          <Legend color={MEDAL.gold} label="Win" />
          <Legend color={teamColor} label="Podium" />
          <Legend color="transparent" ring={teamColor} label="Other finish" />
        </div>
      )}

      {view === "race" && (
        <StatGrid min={110} className="mt-6 border-t border-hairline pt-5">
          <Stat size="sm" label="Rounds scoring" value={raceSeries.filter((r) => r.points > 0).length} />
          <Stat size="sm" label="Best round" value={`${Math.max(...raceSeries.map((r) => r.points))} pts`} />
          <Stat size="sm" label="Rounds without points" value={raceSeries.filter((r) => r.points === 0).length} />
        </StatGrid>
      )}
    </Card>
  );
}

function Legend({ color, ring, label }: { color: string; ring?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: ring ? `inset 0 0 0 1.5px ${ring}` : undefined }} />
      {label}
    </span>
  );
}
