/**
 * components/prediction/ProbabilityDistributionChart.tsx
 *
 * Recharts horizontal BarChart — win probability for every scored driver.
 * Bars are coloured by team, podium positions are gold/silver/bronze.
 */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DriverPrediction } from "@/lib/types/prediction";

const TEAM_COLORS: Record<string, string> = {
  red_bull:     "#3671C6",
  ferrari:      "#E8002D",
  mercedes:     "#27F4D2",
  mclaren:      "#FF8000",
  aston_martin: "#229971",
  alpine:       "#FF87BC",
  williams:     "#64C4FF",
  rb:           "#6692FF",
  kick_sauber:  "#52E252",
  haas:         "#B6BABD",
};

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

interface Props {
  podium:    DriverPrediction[];
  finishers: DriverPrediction[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "rgba(10,10,10,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "0.6rem 0.9rem",
      }}
    >
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.78rem",
          color: "white",
          textTransform: "uppercase",
          marginBottom: "2px",
        }}
      >
        {d.name}
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>
        {d.team}
      </div>
      <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.1rem", color: d.color, marginTop: "4px" }}>
        {d.probability}%
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
        win probability · score {d.score}
      </div>
    </div>
  );
}

export default function ProbabilityDistributionChart({ podium, finishers }: Props) {
  const ranked = [
    ...podium.map((d, i) => ({ ...d, rank: i + 1 })),
    ...[...finishers]
      .sort((a, b) => b.podiumProbability - a.podiumProbability)
      .map((d, i) => ({ ...d, rank: i + 4 })),
  ];

  const chartData = ranked.map((d) => ({
    name:        d.familyName,
    probability: d.podiumProbability,
    score:       d.score.toFixed(1),
    team:        d.constructorName,
    color:
      d.rank <= 3
        ? RANK_COLORS[d.rank - 1]
        : (TEAM_COLORS[d.constructorId] ?? "#E10600"),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
        barCategoryGap="30%"
      >
        <XAxis
          type="number"
          domain={[0, "dataMax + 2"]}
          tick={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 9,
            fill: "rgba(255,255,255,0.2)",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={64}
          tick={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 10,
            fill: "rgba(255,255,255,0.55)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="probability" radius={0} label={{ position: "right", formatter: (v: number) => `${v}%`, fontFamily: "'Russo One', sans-serif", fontSize: 9, fill: "rgba(255,255,255,0.3)" }}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.color}
              fillOpacity={i < 3 ? 0.9 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}