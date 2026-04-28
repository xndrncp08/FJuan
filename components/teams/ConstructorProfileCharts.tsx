/**
 * components/teams/ConstructorProfileCharts.tsx
 *
 * Client component — Recharts charts for the constructor profile page.
 *
 * Tab 1 · Race Points — BarChart, points scored each race, coloured by team
 * Tab 2 · Points Arc — AreaChart, cumulative points over the season
 * Tab 3 · Positions — ScatterChart-style LineChart showing best finish per race
 *
 * Matches FJUAN dark/monospacer design language.
 */
"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  ComposedChart,
} from "recharts";

interface RacePoint {
  round: number;
  name: string;
  short: string;
  points: number;
  cumPoints: number;
  bestPos: number | null;
  results: {
    driverCode: string;
    position: number | null;
    points: number;
    status: string;
  }[];
}

interface Props {
  raceSeries: RacePoint[];
  teamColor: string;
  teamName: string;
}

type Tab = "race" | "arc" | "positions";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "race", label: "Race", sub: "Points" },
  { id: "arc", label: "Points", sub: "Arc" },
  { id: "positions", label: "Finish", sub: "Positions" },
];

/* ── Shared tooltip ─────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, teamColor }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: "rgba(6,6,6,0.97)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "0.65rem 0.9rem",
        minWidth: "130px",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.44rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "1.1rem",
            color: p.stroke ?? p.fill ?? teamColor,
            lineHeight: 1,
            marginBottom: i < payload.length - 1 ? "4px" : 0,
          }}
        >
          {typeof p.value === "number"
            ? p.name === "bestPos"
              ? `P${p.value}`
              : p.value
            : p.value}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.5rem",
              color: "rgba(255,255,255,0.2)",
              marginLeft: "6px",
            }}
          >
            {p.name === "bestPos"
              ? "best finish"
              : p.name === "cumPoints"
                ? "cumulative pts"
                : "pts"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ConstructorProfileCharts({
  raceSeries,
  teamColor,
  teamName,
}: Props) {
  const [tab, setTab] = useState<Tab>("race");

  if (!raceSeries.length) return null;

  const maxPts = Math.max(...raceSeries.map((r) => r.points), 1);

  return (
    <section
      style={{
        background: "#070707",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(1.5rem,4vw,2.5rem) clamp(1.25rem,4vw,1.5rem)",
        }}
      >
        {/* Header + tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{ width: "16px", height: "2px", background: teamColor }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: teamColor,
              }}
            >
              Season Performance
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "0.45rem 0.9rem",
                    background: isActive ? teamColor : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.38rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: isActive
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,255,255,0.2)",
                      marginBottom: "1px",
                    }}
                  >
                    {t.sub}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: isActive ? "white" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {t.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart panel */}
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.07)",
            borderTop: `2px solid ${teamColor}`,
            padding: "1.5rem 1.5rem 1rem",
          }}
        >
          {/* ── Race points bar chart ── */}
          {tab === "race" && (
            <>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.44rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "1rem",
                }}
              >
                Points scored per race · 2026 season
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={raceSeries}
                  margin={{ top: 4, right: 8, bottom: 20, left: -8 }}
                  barCategoryGap="22%"
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="short"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.22)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={
                      raceSeries.length > 12
                        ? Math.floor(raceSeries.length / 8)
                        : 0
                    }
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
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
                    content={(props) => (
                      <ChartTooltip {...props} teamColor={teamColor} />
                    )}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="points" radius={0} maxBarSize={28}>
                    {raceSeries.map((r, i) => (
                      <Cell
                        key={i}
                        fill={r.bestPos === 1 ? teamColor : teamColor}
                        fillOpacity={r.points > 0 ? 0.85 : 0.15}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Race mini summary strip */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {[
                  {
                    label: "Races scored",
                    value: raceSeries.filter((r) => r.points > 0).length,
                  },
                  {
                    label: "Best haul",
                    value: `${Math.max(...raceSeries.map((r) => r.points))} pts`,
                  },
                  {
                    label: "Zero-point Rnd",
                    value: raceSeries.filter((r) => r.points === 0).length,
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.4rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.18)",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.88rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Cumulative points arc ── */}
          {tab === "arc" && (
            <>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.44rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "1rem",
                }}
              >
                Cumulative championship points · 2026 season
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={raceSeries}
                  margin={{ top: 8, right: 8, bottom: 20, left: -8 }}
                >
                  <defs>
                    <linearGradient
                      id={`teamGrad-${teamColor.replace("#", "")}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={teamColor}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={teamColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="short"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.22)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={
                      raceSeries.length > 12
                        ? Math.floor(raceSeries.length / 8)
                        : 0
                    }
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.15)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltip {...props} teamColor={teamColor} />
                    )}
                    cursor={{
                      stroke: "rgba(255,255,255,0.06)",
                      strokeWidth: 1,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumPoints"
                    stroke={teamColor}
                    strokeWidth={1.5}
                    fill={`url(#teamGrad-${teamColor.replace("#", "")})`}
                    dot={false}
                    activeDot={{ r: 4, fill: teamColor, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {/* ── Finish positions line chart ── */}
          {tab === "positions" && (
            <>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.44rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "1rem",
                }}
              >
                Best finish position per race · lower is better
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={raceSeries.filter((r) => r.bestPos !== null)}
                  margin={{ top: 8, right: 8, bottom: 20, left: -8 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="short"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.22)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={
                      raceSeries.length > 12
                        ? Math.floor(raceSeries.length / 8)
                        : 0
                    }
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    reversed
                    domain={[1, 20]}
                    ticks={[1, 3, 5, 10, 15, 20]}
                    tick={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.15)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={20}
                    tickFormatter={(v) => `P${v}`}
                  />
                  {/* Podium zone reference */}
                  <ReferenceLine
                    y={3}
                    stroke="rgba(255,215,0,0.2)"
                    strokeDasharray="4 3"
                    label={{
                      value: "Podium",
                      position: "insideTopRight",
                      fontSize: 7,
                      fill: "rgba(255,215,0,0.35)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <ReferenceLine
                    y={10}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltip {...props} teamColor={teamColor} />
                    )}
                    cursor={{
                      stroke: "rgba(255,255,255,0.06)",
                      strokeWidth: 1,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bestPos"
                    stroke={teamColor}
                    strokeWidth={1.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isWin = payload.bestPos === 1;
                      const isPodium = payload.bestPos <= 3;
                      return (
                        <circle
                          key={`dot-${payload.round}`}
                          cx={cx}
                          cy={cy}
                          r={isWin ? 5 : isPodium ? 3.5 : 2.5}
                          fill={
                            isWin ? "#FFD700" : isPodium ? teamColor : "#0a0a0a"
                          }
                          stroke={teamColor}
                          strokeWidth={isWin || isPodium ? 0 : 1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 5, fill: teamColor, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {[
                  { dot: "#FFD700", label: "Win (P1)" },
                  { dot: teamColor, label: "Podium (P1–3)" },
                  {
                    dot: "#0a0a0a",
                    label: "Points (P4–10)",
                    border: teamColor,
                  },
                ].map(({ dot, label, border }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: dot,
                        border: border ? `1.5px solid ${border}` : undefined,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.44rem",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
