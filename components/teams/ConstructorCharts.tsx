/**
 * components/teams/ConstructorCharts.tsx
 *
 * Client component — Recharts visualisations for the Teams standings page.
 *
 * Chart 1: Horizontal bar chart — season points per constructor (coloured by team)
 * Chart 2: Championship titles comparison — custom bar chart with team colours
 * Chart 3: Points share donut (PieChart)
 *
 * Tab-switched. Matches the dark/red FJUAN design language exactly.
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
  PieChart,
  Pie,
  Sector,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

interface Team {
  constructorId: string;
  name: string;
  points: number;
  wins: number;
  championships: number;
  color: string;
  base: string;
  founded: number;
  position: number;
}

interface Props {
  teams: Team[];
}

type Tab = "points" | "titles" | "share";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "points", label: "Season", sub: "Points" },
  { id: "titles", label: "WCC", sub: "Titles" },
  { id: "share", label: "Points", sub: "Share" },
];

/* ── Shared tooltip ─────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
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
        {label || d.name}
      </div>
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "1.1rem",
          color: d.payload?.color ?? "#E10600",
          lineHeight: 1,
        }}
      >
        {typeof d.value === "number" ? d.value.toLocaleString() : d.value}
      </div>
    </div>
  );
}

/* ── Active donut sector ────────────────────────────────────────────────── */
function ActiveDonutShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function ConstructorCharts({ teams }: Props) {
  const [tab, setTab] = useState<Tab>("points");
  const [activeIdx, setActive] = useState<number | null>(null);

  // Sorted by points for bar chart
  const byPoints = [...teams].sort((a, b) => b.points - a.points);

  // Shortened name for x-axis ticks
  const shortName = (name: string) => {
    const map: Record<string, string> = {
      "Oracle Red Bull Racing": "Red Bull",
      "Scuderia Ferrari": "Ferrari",
      "Mercedes-AMG Petronas": "Mercedes",
      "McLaren F1 Team": "McLaren",
      "BWT Alpine F1 Team": "Alpine",
      "Aston Martin Aramco F1 Team": "Aston M.",
      "Williams Racing": "Williams",
      "MoneyGram Haas F1 Team": "Haas",
      "Visa Cash App RB F1 Team": "RB",
      "Stake F1 Team Kick Sauber": "Sauber",
    };
    return map[name] ?? name.split(" ")[0];
  };

  const pointsData = byPoints.map((t) => ({
    name: shortName(t.name),
    value: t.points,
    color: t.color,
    full: t.name,
  }));
  const titlesData = [...teams]
    .sort((a, b) => b.championships - a.championships)
    .filter((t) => t.championships > 0)
    .map((t) => ({
      name: shortName(t.name),
      value: t.championships,
      color: t.color,
      full: t.name,
    }));
  const shareData = byPoints.map((t) => ({
    name: shortName(t.name),
    value: t.points,
    color: t.color,
  }));

  const totalPts = teams.reduce((s, t) => s + t.points, 0);
  const activeShare = activeIdx !== null ? shareData[activeIdx] : null;

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
        {/* Section header */}
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
              style={{ width: "16px", height: "2px", background: "#E10600" }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              Analytics
            </span>
          </div>

          {/* Tab bar */}
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
                    background: isActive ? "#E10600" : "transparent",
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

        {/* ── Chart panel ──────────────────────────────────────────────── */}
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.07)",
            borderTop: "2px solid #E10600",
            padding: "1.5rem",
          }}
        >
          {/* POINTS chart */}
          {tab === "points" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.44rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  2026 Season Points · All Constructors
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={pointsData}
                  margin={{ top: 4, right: 8, bottom: 24, left: 0 }}
                  barCategoryGap="28%"
                >
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.15)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="value" radius={0} maxBarSize={36}>
                    {pointsData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Team colour legend */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem 1.25rem",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {byPoints.map((t) => (
                  <div
                    key={t.constructorId}
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
                        background: t.color,
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
                      {shortName(t.name)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TITLES chart */}
          {tab === "titles" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.44rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  World Constructor Championships · All Time
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={titlesData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, bottom: 0, left: 4 }}
                  barCategoryGap="25%"
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: 8,
                      fill: "rgba(255,255,255,0.15)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: 10,
                      fill: "rgba(255,255,255,0.5)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={0}
                    maxBarSize={22}
                    label={{
                      position: "right",
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {titlesData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* SHARE donut */}
          {tab === "share" && (
            <div
              style={{
                display: "flex",
                gap: "2rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Donut */}
              <div
                style={{
                  position: "relative",
                  width: 220,
                  height: 220,
                  flexShrink: 0,
                }}
              >
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={shareData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={1}
                      activeIndex={activeIdx ?? undefined}
                      activeShape={<ActiveDonutShape />}
                      onMouseEnter={(_, i) => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      strokeWidth={0}
                    >
                      {shareData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          fillOpacity={
                            activeIdx === null || activeIdx === i ? 0.85 : 0.2
                          }
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
                  {activeShare ? (
                    <>
                      <div
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "1.3rem",
                          color: activeShare.color,
                          lineHeight: 1,
                        }}
                      >
                        {totalPts > 0
                          ? ((activeShare.value / totalPts) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.42rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.3)",
                          marginTop: "3px",
                          textAlign: "center",
                          maxWidth: "70px",
                        }}
                      >
                        {activeShare.name}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "1rem",
                          color: "rgba(255,255,255,0.4)",
                          lineHeight: 1,
                        }}
                      >
                        {totalPts.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.38rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.18)",
                          marginTop: "3px",
                        }}
                      >
                        Total Pts
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Legend table */}
              <div style={{ flex: 1, minWidth: "220px" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.44rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Points Share · 2026 Season
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  {shareData.map((d, i) => {
                    const pct = totalPts > 0 ? (d.value / totalPts) * 100 : 0;
                    const isActive = activeIdx === i;
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setActive(i)}
                        onMouseLeave={() => setActive(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "5px 0",
                          opacity: activeIdx === null || isActive ? 1 : 0.35,
                          transition: "opacity 0.15s ease",
                          cursor: "default",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            background: d.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.45)",
                            flex: 1,
                          }}
                        >
                          {d.name}
                        </span>
                        {/* mini bar */}
                        <div
                          style={{
                            width: "60px",
                            height: "2px",
                            background: "rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: d.color,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "'Russo One', sans-serif",
                            fontSize: "0.7rem",
                            color: d.color,
                            minWidth: "34px",
                            textAlign: "right",
                          }}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
