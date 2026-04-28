/**
 * components/prediction/DriverVsFieldChart.tsx
 *
 * Recharts BarChart — compares a driver's factor scores vs the field average.
 * Uses a ReferenceLine at 0 and signed deltas so positive = above average.
 */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DriverPrediction } from "@/lib/types/prediction";

const FACTOR_KEYS: (keyof DriverPrediction["factors"])[] = [
  "currentForm",
  "qualifyingStrength",
  "championshipPosition",
  "circuitHistory",
];

const FACTOR_LABELS  = ["Form", "Quali", "Champ.", "Circuit"];
const FACTOR_COLORS  = ["#E10600", "#FF8000", "#27F4D2", "#FFD700"];

interface Props {
  driver:     DriverPrediction;
  allDrivers: DriverPrediction[];
  accentColor?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "rgba(10,10,10,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "0.5rem 0.75rem",
      }}
    >
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>
        {d.fullLabel}
      </div>
      <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.9rem", color: d.delta >= 0 ? d.color : "rgba(255,255,255,0.3)" }}>
        {d.delta >= 0 ? "+" : ""}{d.delta.toFixed(1)} vs avg
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.55rem", color: "rgba(255,255,255,0.2)", marginTop: "2px" }}>
        driver {d.driverVal} · field avg {d.avgVal.toFixed(0)}
      </div>
    </div>
  );
}

export default function DriverVsFieldChart({ driver, allDrivers }: Props) {
  const fullLabels = ["Recent Form", "Qualifying", "Championship", "Circuit Hist."];

  const data = FACTOR_KEYS.map((k, i) => {
    const avg      = allDrivers.length
      ? allDrivers.reduce((s, d) => s + d.factors[k], 0) / allDrivers.length
      : 50;
    const driverVal = driver.factors[k];
    const delta     = Math.round((driverVal - avg) * 10) / 10;
    return {
      label:     FACTOR_LABELS[i],
      fullLabel: fullLabels[i],
      delta,
      driverVal,
      avgVal:    avg,
      color:     FACTOR_COLORS[i],
    };
  });

  const absMax = Math.max(10, ...data.map((d) => Math.abs(d.delta)));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
        barCategoryGap="35%"
      >
        <XAxis
          dataKey="label"
          tick={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 9,
            fontWeight: 600,
            fill: "rgba(255,255,255,0.3)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[-absMax - 5, absMax + 5]}
          tick={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 8,
            fill: "rgba(255,255,255,0.18)",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
          width={28}
        />
        <ReferenceLine
          y={0}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="delta" radius={0}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.delta >= 0 ? entry.color : "rgba(255,255,255,0.15)"}
              fillOpacity={entry.delta >= 0 ? 0.85 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}