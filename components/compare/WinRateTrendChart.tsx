/**
 * components/compare/WinRateTrendChart.tsx
 *
 * LineChart — win rate (or podium rate) per season for both drivers.
 * Great for showing peak performance years and consistency.
 */
"use client";

import {
  LineChart,
  Line,
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
  metric: "winRate" | "podiumRate";
}

function CustomTooltip({ active, payload, label, d1Name, d2Name }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,8,8,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0.65rem 0.9rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.5rem",
        color: "rgba(255,255,255,0.3)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "0.4rem",
      }}>
        {label}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "2px",
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
            fontSize: "0.72rem",
            color: p.stroke,
          }}>
            {p.value?.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function WinRateTrendChart({ d1, d2, metric }: Props) {
  const allSeasons = new Set<string>();
  (d1.seasonResults ?? []).forEach((r: any) => allSeasons.add(String(r.season ?? r.year)));
  (d2.seasonResults ?? []).forEach((r: any) => allSeasons.add(String(r.season ?? r.year)));
  const seasons = Array.from(allSeasons).sort();

  const d1Map: Record<string, any> = {};
  const d2Map: Record<string, any> = {};
  (d1.seasonResults ?? []).forEach((r: any) => { d1Map[String(r.season ?? r.year)] = r; });
  (d2.seasonResults ?? []).forEach((r: any) => { d2Map[String(r.season ?? r.year)] = r; });

  const getRate = (row: any, m: string) => {
    if (!row || !row.races) return null;
    const races = row.races ?? 1;
    if (m === "winRate") return row.wins ? (row.wins / races) * 100 : 0;
    if (m === "podiumRate") return row.podiums ? (row.podiums / races) * 100 : 0;
    return 0;
  };

  const data = seasons.map((s) => ({
    season: s,
    d1: getRate(d1Map[s], metric),
    d2: getRate(d2Map[s], metric),
  })).filter((d) => d.d1 !== null || d.d2 !== null);

  const d1Name = d1.driver.familyName;
  const d2Name = d2.driver.familyName;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
      >
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="season"
          tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fill: "rgba(255,255,255,0.2)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontFamily: "'Russo One', sans-serif", fontSize: 8, fill: "rgba(255,255,255,0.15)" }}
          axisLine={false}
          tickLine={false}
          width={30}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
        />
        <ReferenceLine y={50} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
        <Tooltip
          content={(props) => <CustomTooltip {...props} d1Name={d1Name} d2Name={d2Name} />}
          cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="d1"
          stroke={D1_COLOR}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: D1_COLOR, strokeWidth: 0 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="d2"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: "rgba(255,255,255,0.7)", strokeWidth: 0 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}