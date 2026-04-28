/**
 * components/compare/PointsProgressionChart.tsx
 *
 * AreaChart — cumulative career points progression by season.
 * Shows career arc — peak years, dominance periods, decline.
 */
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DriverStats } from "@/lib/types/driver";
import { D1_COLOR } from "./constants";

interface Props {
  d1: DriverStats;
  d2: DriverStats;
}

function CustomTooltip({ active, payload, label, d1Name, d2Name }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,8,8,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0.75rem 1rem",
      minWidth: "160px",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.5rem",
        color: "rgba(255,255,255,0.3)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "0.5rem",
      }}>
        Season {label}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1.5rem",
          marginBottom: "3px",
          alignItems: "baseline",
        }}>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 600,
            color: p.stroke,
          }}>
            {i === 0 ? d1Name : d2Name}
          </span>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.8rem",
            color: p.stroke,
          }}>
            {p.value?.toLocaleString()} pts
          </span>
        </div>
      ))}
    </div>
  );
}

export function PointsProgressionChart({ d1, d2 }: Props) {
  const allSeasons = new Set<string>();
  (d1.seasonResults ?? []).forEach((r: any) => allSeasons.add(String(r.season ?? r.year)));
  (d2.seasonResults ?? []).forEach((r: any) => allSeasons.add(String(r.season ?? r.year)));

  const seasons = Array.from(allSeasons).sort();

  const d1BySeason: Record<string, number> = {};
  const d2BySeason: Record<string, number> = {};
  (d1.seasonResults ?? []).forEach((r: any) => {
    d1BySeason[String(r.season ?? r.year)] = r.points ?? 0;
  });
  (d2.seasonResults ?? []).forEach((r: any) => {
    d2BySeason[String(r.season ?? r.year)] = r.points ?? 0;
  });

  // Cumulative
  let cum1 = 0, cum2 = 0;
  const data = seasons.map((s) => {
    cum1 += d1BySeason[s] ?? 0;
    cum2 += d2BySeason[s] ?? 0;
    return { season: s, d1: cum1, d2: cum2 };
  });

  const d1Name = d1.driver.familyName;
  const d2Name = d2.driver.familyName;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
      >
        <defs>
          <linearGradient id="d1Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={D1_COLOR} stopOpacity={0.25} />
            <stop offset="95%" stopColor={D1_COLOR} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="d2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="rgba(255,255,255,0.6)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="rgba(255,255,255,0.6)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="rgba(255,255,255,0.04)"
        />
        <XAxis
          dataKey="season"
          tick={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            fill: "rgba(255,255,255,0.2)",
          }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 8,
            fill: "rgba(255,255,255,0.15)",
          }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
        />
        <Tooltip
          content={(props) => <CustomTooltip {...props} d1Name={d1Name} d2Name={d2Name} />}
          cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="d1"
          stroke={D1_COLOR}
          strokeWidth={1.5}
          fill="url(#d1Grad)"
          dot={false}
          activeDot={{ r: 4, fill: D1_COLOR, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="d2"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={1.5}
          fill="url(#d2Grad)"
          dot={false}
          activeDot={{ r: 4, fill: "rgba(255,255,255,0.7)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}