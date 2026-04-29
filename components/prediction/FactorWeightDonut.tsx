/**
 * components/prediction/FactorWeightDonut.tsx
 *
 * v3 — 8-slice donut with updated weights:
 *   35% Form · 15% Qualifying · 15% Championship · 10% Circuit ·
 *   10% Weather · 7% Sprint · 5% Tyre Fit · 3% Grid Penalty
 */
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

const FACTORS = [
  { label: "Recent Form", weight: 35, color: "#E10600" },
  { label: "Qualifying", weight: 15, color: "#FF8000" },
  { label: "Championship", weight: 15, color: "#27F4D2" },
  { label: "Circuit Hist.", weight: 10, color: "#FFD700" },
  { label: "Weather", weight: 10, color: "#64C4FF" },
  { label: "Sprint Form", weight: 7, color: "#FF87BC" },
  { label: "Tyre Fit", weight: 5, color: "#B6BABD" },
  { label: "Grid Penalty", weight: 3, color: "#52E252" },
];

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

export default function FactorWeightDonut() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? FACTORS[activeIdx] : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Chart */}
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={FACTORS}
              dataKey="weight"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={62}
              paddingAngle={1.5}
              activeIndex={activeIdx ?? undefined}
              activeShape={<ActiveShape />}
              onMouseEnter={(_, idx) => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              strokeWidth={0}
            >
              {FACTORS.map((f, i) => (
                <Cell
                  key={f.label}
                  fill={f.color}
                  fillOpacity={activeIdx === null || activeIdx === i ? 1 : 0.25}
                  style={{
                    cursor: "default",
                    transition: "fill-opacity 0.15s ease",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: active ? "1.15rem" : "0.85rem",
              color: active ? active.color : "rgba(255,255,255,0.5)",
              lineHeight: 1,
              transition: "font-size 0.15s ease, color 0.15s ease",
            }}
          >
            {active ? `${active.weight}%` : "v3"}
          </span>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.44rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginTop: "3px",
              textAlign: "center",
              maxWidth: "56px",
              lineHeight: 1.3,
            }}
          >
            {active ? active.label : "MODEL"}
          </span>
        </div>
      </div>

      {/* Legend — two columns for 8 items */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 1rem",
          width: "100%",
        }}
      >
        {FACTORS.map((f, i) => (
          <div
            key={f.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              opacity: activeIdx === null || activeIdx === i ? 1 : 0.25,
              transition: "opacity 0.15s ease",
              cursor: "default",
            }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                background: f.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {f.label}
            </span>
            <span
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.6rem",
                color: f.color,
                flexShrink: 0,
              }}
            >
              {f.weight}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
