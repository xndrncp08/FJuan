/**
 * components/prediction/FactorWeightDonut.tsx
 *
 * Recharts PieChart donut — shows the 4 factor weights (45/20/20/15).
 * Active sector expands on hover; centre label updates.
 */
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

const FACTORS = [
  { label: "Recent Form",     weight: 45, color: "#E10600" },
  { label: "Qualifying Pace", weight: 20, color: "#FF8000" },
  { label: "Championship",    weight: 20, color: "#27F4D2" },
  { label: "Circuit Hist.",   weight: 15, color: "#FFD700" },
];

function ActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill,
  } = props;
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
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
              innerRadius={46}
              outerRadius={64}
              paddingAngle={2}
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
                  fillOpacity={activeIdx === null || activeIdx === i ? 1 : 0.3}
                  style={{ cursor: "default", transition: "fill-opacity 0.15s ease" }}
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
              fontSize: active ? "1.2rem" : "1rem",
              color: active ? active.color : "rgba(255,255,255,0.6)",
              lineHeight: 1,
              transition: "font-size 0.15s ease, color 0.15s ease",
            }}
          >
            {active ? `${active.weight}%` : "v2"}
          </span>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.48rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginTop: "3px",
              textAlign: "center",
              maxWidth: "60px",
              lineHeight: 1.3,
            }}
          >
            {active ? active.label : "MODEL"}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
        {FACTORS.map((f, i) => (
          <div
            key={f.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: activeIdx === null || activeIdx === i ? 1 : 0.3,
              transition: "opacity 0.15s ease",
              cursor: "default",
            }}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div style={{ width: "8px", height: "8px", background: f.color, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                flex: 1,
              }}
            >
              {f.label}
            </span>
            <span
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.62rem",
                color: f.color,
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