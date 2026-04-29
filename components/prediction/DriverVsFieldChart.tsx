/**
 * components/prediction/DriverVsFieldChart.tsx
 *
 * v3 — 8 factor delta bars vs field average.
 * Context factors (Weather, Sprint) are rendered with reduced opacity
 * when they're neutral (dry race / non-sprint weekend).
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
  "weatherAdaptability",
  "sprintForm",
  "tyreFit",
  "gridPenalty",
];

const FACTOR_SHORT = [
  "Form",
  "Quali",
  "Champ",
  "Circuit",
  "Weather",
  "Sprint",
  "Tyre",
  "Grid",
];
const FACTOR_FULL = [
  "Recent Form",
  "Qualifying",
  "Championship",
  "Circuit History",
  "Weather Adapt.",
  "Sprint Form",
  "Tyre Fit",
  "Grid Status",
];
const FACTOR_COLORS = [
  "#E10600",
  "#FF8000",
  "#27F4D2",
  "#FFD700",
  "#64C4FF",
  "#FF8000",
  "#B6BABD",
  "#52E252",
];

interface Props {
  driver: DriverPrediction;
  allDrivers: DriverPrediction[];
  accentColor?: string;
  isSprint?: boolean;
  isWet?: boolean;
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
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          marginBottom: "2px",
        }}
      >
        {d.fullLabel}
      </div>
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.9rem",
          color: d.delta >= 0 ? d.color : "rgba(255,255,255,0.3)",
        }}
      >
        {d.delta >= 0 ? "+" : ""}
        {d.delta.toFixed(1)} vs avg
      </div>
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.55rem",
          color: "rgba(255,255,255,0.2)",
          marginTop: "2px",
        }}
      >
        driver {d.driverVal} · field avg {d.avgVal.toFixed(0)}
      </div>
      {d.isNeutral && (
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.5rem",
            color: "rgba(255,255,255,0.15)",
            marginTop: "3px",
            fontStyle: "italic",
          }}
        >
          Neutral — factor not active this weekend
        </div>
      )}
    </div>
  );
}

export default function DriverVsFieldChart({
  driver,
  allDrivers,
  isSprint = false,
  isWet = false,
}: Props) {
  const data = FACTOR_KEYS.map((k, i) => {
    const avg = allDrivers.length
      ? allDrivers.reduce((s, d) => s + d.factors[k], 0) / allDrivers.length
      : 50;
    const driverVal = driver.factors[k];
    const delta = Math.round((driverVal - avg) * 10) / 10;

    // Mark context factors as neutral when not active
    const isNeutral =
      (k === "weatherAdaptability" && !isWet) ||
      (k === "sprintForm" && !isSprint);

    return {
      label: FACTOR_SHORT[i],
      fullLabel: FACTOR_FULL[i],
      delta,
      driverVal,
      avgVal: avg,
      color: FACTOR_COLORS[i],
      isNeutral,
    };
  });

  const absMax = Math.max(10, ...data.map((d) => Math.abs(d.delta)));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
        barCategoryGap="28%"
      >
        <XAxis
          dataKey="label"
          tick={({ x, y, payload }: any) => {
            const entry = data.find((d) => d.label === payload.value);
            return (
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "8px",
                  fontWeight: 600,
                  fill: entry?.isNeutral
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.3)",
                  letterSpacing: "0.04em",
                }}
              >
                {payload.value}
              </text>
            );
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
          width={26}
        />
        <ReferenceLine
          y={0}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="delta" radius={0}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.delta >= 0 ? entry.color : "rgba(255,255,255,0.12)"}
              fillOpacity={entry.isNeutral ? 0.25 : entry.delta >= 0 ? 0.85 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
