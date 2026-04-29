/**
 * components/prediction/ScoreRadarChart.tsx
 */
"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { DriverPrediction } from "@/lib/types/prediction";

interface Props {
  driver: DriverPrediction;
  accentColor?: string;
  height?: number;
  isSprint?: boolean;
  isWet?: boolean;
}

export default function ScoreRadarChart({
  driver,
  accentColor = "#E10600",
  height = 240,
  isSprint = false,
  isWet = false,
}: Props) {
  const data = useMemo(
    () => [
      { subject: "Form", value: driver.factors.currentForm, baseline: 50 },
      {
        subject: "Quali",
        value: driver.factors.qualifyingStrength,
        baseline: 50,
      },
      {
        subject: "Champ.",
        value: driver.factors.championshipPosition,
        baseline: 50,
      },
      {
        subject: "Circuit",
        value: driver.factors.circuitHistory,
        baseline: 50,
      },
      { subject: "Tyre", value: driver.factors.tyreFit, baseline: 50 },
      { subject: "Grid", value: driver.factors.gridPenalty, baseline: 50 },
      { subject: "Sprint", value: driver.factors.sprintForm, baseline: 50 },
      {
        subject: "Weather",
        value: driver.factors.weatherAdaptability,
        baseline: 50,
      },
    ],
    [driver],
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart
        data={data}
        margin={{ top: 16, right: 28, bottom: 16, left: 28 }}
      >
        <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="subject"
          tick={({ payload, x, y, cx, cy, ...rest }: any) => {
            const isSprintAxis = payload.value === "Sprint";
            const isWeatherAxis = payload.value === "Weather";
            const isDimmed =
              (isSprintAxis && !isSprint) || (isWeatherAxis && !isWet);

            return (
              <text
                {...rest}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "9px",
                  fontWeight: 600,
                  fill: isDimmed
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(255,255,255,0.4)",
                  letterSpacing: "0.04em",
                }}
              >
                {payload.value}
              </text>
            );
          }}
        />

        {/* Baseline ring at 50 */}
        <Radar
          dataKey="baseline"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          strokeDasharray="3 3"
          fill="transparent"
          dot={false}
        />

        {/* Driver radar */}
        <Radar
          dataKey="value"
          stroke={accentColor}
          strokeWidth={1.5}
          fill={accentColor}
          fillOpacity={0.13}
          dot={{ r: 2.5, fill: accentColor, strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
