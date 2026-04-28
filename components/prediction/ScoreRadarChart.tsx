/**
 * components/prediction/ScoreRadarChart.tsx
 *
 * Recharts RadarChart — plots the 4 prediction factors for a single driver.
 */
"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { DriverPrediction } from "@/lib/types/prediction";

interface Props {
  driver:       DriverPrediction;
  accentColor?: string;
  height?:      number;
}

export default function ScoreRadarChart({
  driver,
  accentColor = "#E10600",
  height = 220,
}: Props) {
  const data = [
    { subject: "Form",       value: driver.factors.currentForm },
    { subject: "Qualifying", value: driver.factors.qualifyingStrength },
    { subject: "Champ.",     value: driver.factors.championshipPosition },
    { subject: "Circuit",    value: driver.factors.circuitHistory },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 12, right: 24, bottom: 12, left: 24 }}>
        <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            fill: "rgba(255,255,255,0.35)",
          }}
        />
        <Radar
          dataKey="value"
          stroke={accentColor}
          strokeWidth={1.5}
          fill={accentColor}
          fillOpacity={0.13}
          dot={{ r: 3, fill: accentColor, strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}