"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DriverStats } from "@/lib/types/driver";
import { ChartTooltip } from "@/components/ui/chart";
import { A_COLOR, B_COLOR } from "./constants";

// Each axis is scaled between the two drivers, so the shape shows who is
// stronger where rather than absolute values (those are in the tooltip).
function scale(v: number, lo: number, hi: number) {
  if (hi === lo) return 50;
  return Math.round(((v - lo) / (hi - lo)) * 100);
}

export function PerformanceRadarChart({ a, b }: { a: DriverStats; b: DriverStats }) {
  const metrics = [
    { subject: "Win rate", a: a.winRate, b: b.winRate, unit: "%" },
    { subject: "Podium rate", a: a.podiumRate, b: b.podiumRate, unit: "%" },
    { subject: "Pts / race", a: a.pointsPerRace, b: b.pointsPerRace, unit: "" },
    { subject: "Pole rate", a: (a.totalPoles / Math.max(1, a.totalRaces)) * 100, b: (b.totalPoles / Math.max(1, b.totalRaces)) * 100, unit: "%" },
    { subject: "Avg finish", a: a.avgFinishPosition ? 25 - a.avgFinishPosition : 0, b: b.avgFinishPosition ? 25 - b.avgFinishPosition : 0, unit: "", raw: [a.avgFinishPosition, b.avgFinishPosition] },
    { subject: "Reliability", a: 100 - (a.retirementRate ?? 0), b: 100 - (b.retirementRate ?? 0), unit: "%" },
  ];

  const data = metrics.map((m) => {
    const lo = Math.min(m.a, m.b) * 0.8;
    const hi = Math.max(m.a, m.b) * 1.1;
    return {
      subject: m.subject,
      a: scale(m.a, lo, hi),
      b: scale(m.b, lo, hi),
      aRaw: m.raw ? m.raw[0] : m.a,
      bRaw: m.raw ? m.raw[1] : m.b,
      unit: m.unit,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} margin={{ top: 12, right: 36, bottom: 12, left: 36 }} outerRadius="72%">
        <PolarGrid stroke="rgba(245,233,228,0.1)" gridType="polygon" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(245,233,228,0.72)", fontSize: 12 }} />
        <Tooltip
          content={
            <ChartTooltip
              title={(_, p) => p[0]?.payload?.subject}
              format={(p) => {
                const row = p[0].payload;
                return [
                  { label: a.driver.familyName, value: `${Number(row.aRaw).toFixed(1)}${row.unit}`, color: A_COLOR },
                  { label: b.driver.familyName, value: `${Number(row.bRaw).toFixed(1)}${row.unit}`, color: B_COLOR },
                ];
              }}
            />
          }
        />
        <Radar name={a.driver.familyName} dataKey="a" stroke={A_COLOR} strokeWidth={2} fill={A_COLOR} fillOpacity={0.18} />
        <Radar name={b.driver.familyName} dataKey="b" stroke={B_COLOR} strokeWidth={2} fill={B_COLOR} fillOpacity={0.14} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
