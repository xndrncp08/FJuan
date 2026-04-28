/**
 * components/compare/PerformanceRadarChart.tsx
 *
 * RadarChart — plots normalised career metrics for both drivers on the same axes.
 * Metrics: Win Rate, Podium Rate, Points/Race, Pole Rate, Avg Finish (inverted).
 */
"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DriverStats } from "@/lib/types/driver";
import { D1_COLOR } from "./constants";

interface Props {
  d1: DriverStats;
  d2: DriverStats;
}

function normalize(val: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(((val - min) / (max - min)) * 100);
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,8,8,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0.6rem 0.85rem",
    }}>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.7rem",
          color: p.stroke,
          marginBottom: "2px",
        }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export function PerformanceRadarChart({ d1, d2 }: Props) {
  // Normalise each metric relative to each other
  const metrics = [
    {
      subject: "Win Rate",
      d1raw: d1.winRate,
      d2raw: d2.winRate,
    },
    {
      subject: "Podium %",
      d1raw: d1.podiumRate,
      d2raw: d2.podiumRate,
    },
    {
      subject: "Pts/Race",
      d1raw: d1.pointsPerRace,
      d2raw: d2.pointsPerRace,
    },
    {
      subject: "Pole Rate",
      d1raw: d1.totalPoles / Math.max(1, d1.totalRaces) * 100,
      d2raw: d2.totalPoles / Math.max(1, d2.totalRaces) * 100,
    },
    {
      subject: "Avg Finish",
      // lower is better — invert
      d1raw: d1.avgFinishPosition ? 25 - d1.avgFinishPosition : 0,
      d2raw: d2.avgFinishPosition ? 25 - d2.avgFinishPosition : 0,
    },
    {
      subject: "Reliability",
      // lower DNF rate = better
      d1raw: 100 - (d1.retirementRate ?? 0),
      d2raw: 100 - (d2.retirementRate ?? 0),
    },
  ];

  const data = metrics.map((m) => {
    const min = Math.min(m.d1raw, m.d2raw);
    const max = Math.max(m.d1raw, m.d2raw);
    return {
      subject: m.subject,
      d1: normalize(m.d1raw, min * 0.8, max * 1.1),
      d2: normalize(m.d2raw, min * 0.8, max * 1.1),
      d1raw: m.d1raw,
      d2raw: m.d2raw,
    };
  });

  const d1Name = d1.driver.familyName;
  const d2Name = d2.driver.familyName;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid
          stroke="rgba(255,255,255,0.06)"
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            fill: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name={d1Name}
          dataKey="d1"
          stroke={D1_COLOR}
          strokeWidth={1.5}
          fill={D1_COLOR}
          fillOpacity={0.15}
          dot={{ r: 3, fill: D1_COLOR, strokeWidth: 0 }}
        />
        <Radar
          name={d2Name}
          dataKey="d2"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.5}
          fill="rgba(255,255,255,0.5)"
          fillOpacity={0.08}
          dot={{ r: 3, fill: "rgba(255,255,255,0.6)", strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}