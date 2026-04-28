/**
 * components/compare/SeasonPerformanceChart.tsx
 *
 * Grouped BarChart — wins, podiums, poles per season for both drivers.
 * Seasons are aligned; missing seasons show 0.
 */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DriverStats } from "@/lib/types/driver";
import { D1_COLOR, D2_COLOR } from "./constants";

interface Props {
  d1: DriverStats;
  d2: DriverStats;
  metric: "wins" | "podiums" | "poles" | "points";
}

const METRIC_LABELS = {
  wins: "Wins",
  podiums: "Podiums",
  poles: "Pole Positions",
  points: "Points",
};

function CustomTooltip({ active, payload, label, d1Name, d2Name }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,8,8,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0.75rem 1rem",
      minWidth: "140px",
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
        }}>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            color: p.fill,
          }}>
            {i === 0 ? d1Name : d2Name}
          </span>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.75rem",
            color: p.fill,
          }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SeasonPerformanceChart({ d1, d2, metric }: Props) {
  // Build per-season data from seasonResults
  const allSeasons = new Set<string>();
  (d1.seasonResults ?? []).forEach((r: any) => allSeasons.add(String(r.season ?? r.year)));
  (d2.seasonResults ?? []).forEach((r: any) => allSeasons.add(String(r.season ?? r.year)));

  const seasons = Array.from(allSeasons).sort();

  const d1BySeason: Record<string, any> = {};
  const d2BySeason: Record<string, any> = {};
  (d1.seasonResults ?? []).forEach((r: any) => { d1BySeason[String(r.season ?? r.year)] = r; });
  (d2.seasonResults ?? []).forEach((r: any) => { d2BySeason[String(r.season ?? r.year)] = r; });

  const getVal = (row: any, m: string) => {
    if (!row) return 0;
    if (m === "wins")    return row.wins    ?? 0;
    if (m === "podiums") return row.podiums ?? 0;
    if (m === "poles")   return row.poles   ?? 0;
    if (m === "points")  return row.points  ?? 0;
    return 0;
  };

  const data = seasons.map((s) => ({
    season: s,
    d1: getVal(d1BySeason[s], metric),
    d2: getVal(d2BySeason[s], metric),
  }));

  const d1Name = d1.driver.familyName;
  const d2Name = d2.driver.familyName;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
        barCategoryGap="25%"
        barGap={2}
      >
        <CartesianGrid
          vertical={false}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="0"
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
          allowDecimals={false}
          tick={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 8,
            fill: "rgba(255,255,255,0.15)",
          }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip
          content={(props) => <CustomTooltip {...props} d1Name={d1Name} d2Name={d2Name} />}
          cursor={{ fill: "rgba(255,255,255,0.02)" }}
        />
        <Bar dataKey="d1" name={d1Name} fill={D1_COLOR} fillOpacity={0.85} radius={0} maxBarSize={18} />
        <Bar dataKey="d2" name={d2Name} fill="rgba(255,255,255,0.45)" radius={0} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}