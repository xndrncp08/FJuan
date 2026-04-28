/**
 * components/compare/ChartsSection.tsx
 *
 * Master chart panel for the compare page.
 * Tabs: Performance Profile | Season History | Points Arc | Consistency
 *
 * Each tab surfaces a different set of Recharts visualisations with
 * F1-themed styling that matches the existing dark/red design language.
 */
"use client";

import { useState } from "react";
import { DriverStats } from "@/lib/types/driver";
import { D1_COLOR, D2_COLOR, TEAM_COLORS } from "./constants";
import { SeasonPerformanceChart } from "./SeasonPerformanceChart";
import { PerformanceRadarChart } from "./PerformanceRadarChart";
import { PointsProgressionChart } from "./PointsProgressionChart";
import { WinRateTrendChart } from "./WinRateTrendChart";

interface Props {
  d1: DriverStats;
  d2: DriverStats;
  team1: string;
  team2: string;
}

type Tab = "profile" | "seasons" | "points" | "consistency";

const TABS: { id: Tab; label: string; sublabel: string }[] = [
  { id: "profile",     label: "Performance",  sublabel: "Profile"   },
  { id: "seasons",     label: "Season",       sublabel: "History"   },
  { id: "points",      label: "Points",       sublabel: "Career Arc" },
  { id: "consistency", label: "Win Rate",     sublabel: "Trend"     },
];

type SeasonMetric = "wins" | "podiums" | "poles" | "points";
const SEASON_METRICS: { id: SeasonMetric; label: string }[] = [
  { id: "wins",    label: "Wins"    },
  { id: "podiums", label: "Podiums" },
  { id: "poles",   label: "Poles"   },
  { id: "points",  label: "Points"  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.44rem",
      fontWeight: 500,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.2)",
      marginBottom: "1.25rem",
    }}>
      {children}
    </div>
  );
}

function DriverLegend({ d1, d2, team1, team2 }: { d1: DriverStats; d2: DriverStats; team1: string; team2: string }) {
  const t1Color = TEAM_COLORS[team1] ?? D1_COLOR;
  const t2Color = TEAM_COLORS[team2] ?? D2_COLOR;
  return (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ width: "20px", height: "2px", background: D1_COLOR }} />
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.65rem",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.04em",
        }}>
          {d1.driver.familyName}
        </span>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: t1Color }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ width: "20px", height: "2px", background: "rgba(255,255,255,0.45)" }} />
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.65rem",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.04em",
        }}>
          {d2.driver.familyName}
        </span>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: t2Color }} />
      </div>
    </div>
  );
}

/** Mini stat card used inside the chart panels */
function MiniStat({ label, value, color = "white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      flex: 1,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      padding: "0.75rem 1rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.42rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.2)",
        marginBottom: "4px",
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Russo One', sans-serif",
        fontSize: "clamp(0.9rem,2vw,1.2rem)",
        color,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

export function ChartsSection({ d1, d2, team1, team2 }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [seasonMetric, setSeasonMetric] = useState<SeasonMetric>("wins");

  const t1Color = TEAM_COLORS[team1] ?? D1_COLOR;
  const t2Color = TEAM_COLORS[team2] ?? D2_COLOR;

  // Derived insight stats for profile tab
  const d1WinPct  = d1.winRate?.toFixed(1) ?? "—";
  const d2WinPct  = d2.winRate?.toFixed(1) ?? "—";
  const d1PodPct  = d1.podiumRate?.toFixed(1) ?? "—";
  const d2PodPct  = d2.podiumRate?.toFixed(1) ?? "—";
  const d1PtsRace = d1.pointsPerRace?.toFixed(1) ?? "—";
  const d2PtsRace = d2.pointsPerRace?.toFixed(1) ?? "—";

  return (
    <div style={{
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: "3px solid rgba(255,255,255,0.08)",
      marginTop: "2px",
      animation: "compareSlideUp 0.65s 0.15s cubic-bezier(0.16,1,0.3,1) both",
    }}>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#060606",
        overflowX: "auto",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: "0 0 auto",
                padding: "1rem clamp(0.85rem,2.5vw,1.5rem)",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? `2px solid ${D1_COLOR}` : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.42rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isActive ? D1_COLOR : "rgba(255,255,255,0.2)",
                marginBottom: "2px",
                transition: "color 0.2s ease",
              }}>
                {tab.sublabel}
              </div>
              <div style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: isActive ? "white" : "rgba(255,255,255,0.35)",
                transition: "color 0.2s ease",
              }}>
                {tab.label}
              </div>
            </button>
          );
        })}

        {/* Right side: legend */}
        <div style={{
          marginLeft: "auto",
          padding: "0 clamp(0.75rem,2vw,1.5rem)",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}>
          <DriverLegend d1={d1} d2={d2} team1={team1} team2={team2} />
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div style={{ padding: "clamp(1.25rem,3vw,2rem)" }}>

        {/* ── PROFILE TAB ─── Radar + mini stats grid */}
        {activeTab === "profile" && (
          <div>
            <SectionLabel>Career Performance Profile · Normalised relative metrics</SectionLabel>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px",
              marginBottom: "1.5rem",
            }}>
              {/* Radar chart */}
              <div style={{
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "1rem",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.42rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.15)",
                  marginBottom: "0.5rem",
                }}>
                  Performance Radar
                </div>
                <PerformanceRadarChart d1={d1} d2={d2} />
              </div>

              {/* Stats grid */}
              <div style={{
                display: "grid",
                gridTemplateRows: "repeat(3, 1fr)",
                gap: "2px",
              }}>
                {/* Win rate row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2px",
                }}>
                  <MiniStat label="Win Rate" value={`${d1WinPct}%`} color={D1_COLOR} />
                  <MiniStat label="Win Rate" value={`${d2WinPct}%`} color="rgba(255,255,255,0.6)" />
                </div>
                {/* Podium rate row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2px",
                }}>
                  <MiniStat label="Podium Rate" value={`${d1PodPct}%`} color={t1Color} />
                  <MiniStat label="Podium Rate" value={`${d2PodPct}%`} color={t2Color} />
                </div>
                {/* Points/race row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2px",
                }}>
                  <MiniStat label="Points / Race" value={d1PtsRace} color={D1_COLOR} />
                  <MiniStat label="Points / Race" value={d2PtsRace} color="rgba(255,255,255,0.6)" />
                </div>
              </div>
            </div>

            {/* Championship comparison bar */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              padding: "1rem 1.25rem",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.42rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.15)",
                marginBottom: "0.85rem",
              }}>
                Championship Titles · Career Total
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "clamp(1.5rem,4vw,2.5rem)",
                  color: D1_COLOR,
                  lineHeight: 1,
                  minWidth: "2rem",
                  textAlign: "right",
                }}>
                  {d1.totalChampionships}
                </span>
                <div style={{ flex: 1 }}>
                  {/* Title dots */}
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px" }}>
                    {Array.from({ length: Math.max(d1.totalChampionships, d2.totalChampionships, 1) }).map((_, i) => {
                      const d1Has = i < d1.totalChampionships;
                      const d2Has = i < d2.totalChampionships;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{
                            width: "12px", height: "12px",
                            background: d1Has ? D1_COLOR : "rgba(255,255,255,0.06)",
                            border: `1px solid ${d1Has ? D1_COLOR : "rgba(255,255,255,0.08)"}`,
                            transition: "all 0.3s ease",
                          }} />
                          <div style={{
                            width: "12px", height: "12px",
                            background: d2Has ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${d2Has ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.08)"}`,
                            transition: "all 0.3s ease",
                          }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.42rem",
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.08em",
                  }}>
                    ■ {d1.driver.familyName} &nbsp; □ {d2.driver.familyName}
                  </div>
                </div>
                <span style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "clamp(1.5rem,4vw,2.5rem)",
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1,
                  minWidth: "2rem",
                }}>
                  {d2.totalChampionships}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── SEASONS TAB ─── grouped bar chart + metric picker */}
        {activeTab === "seasons" && (
          <div>
            {/* Metric picker */}
            <div style={{
              display: "flex",
              gap: "2px",
              marginBottom: "1.5rem",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.42rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                paddingRight: "0.75rem",
              }}>
                Metric:
              </div>
              {SEASON_METRICS.map((m) => {
                const isActive = seasonMetric === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSeasonMetric(m.id)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      background: isActive ? D1_COLOR : "transparent",
                      border: `1px solid ${isActive ? D1_COLOR : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: isActive ? "white" : "rgba(255,255,255,0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <SectionLabel>
              {SEASON_METRICS.find(m => m.id === seasonMetric)?.label} by season · {d1.driver.familyName} vs {d2.driver.familyName}
            </SectionLabel>

            <SeasonPerformanceChart d1={d1} d2={d2} metric={seasonMetric} />

            {/* Season bests row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "2px",
              marginTop: "1.5rem",
            }}>
              {[
                { label: "Best Season Wins",    v1: Math.max(0, ...(d1.seasonResults ?? []).map((r: any) => r.wins ?? 0)),    v2: Math.max(0, ...(d2.seasonResults ?? []).map((r: any) => r.wins ?? 0)) },
                { label: "Best Season Podiums", v1: Math.max(0, ...(d1.seasonResults ?? []).map((r: any) => r.podiums ?? 0)), v2: Math.max(0, ...(d2.seasonResults ?? []).map((r: any) => r.podiums ?? 0)) },
                { label: "Best Season Poles",   v1: Math.max(0, ...(d1.seasonResults ?? []).map((r: any) => r.poles ?? 0)),   v2: Math.max(0, ...(d2.seasonResults ?? []).map((r: any) => r.poles ?? 0)) },
                { label: "Best Season Points",  v1: Math.max(0, ...(d1.seasonResults ?? []).map((r: any) => r.points ?? 0)),  v2: Math.max(0, ...(d2.seasonResults ?? []).map((r: any) => r.points ?? 0)) },
              ].map(({ label, v1, v2 }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: "0.75rem 1rem",
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.4rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.18)",
                    marginBottom: "0.5rem",
                  }}>
                    {label}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
                    <span style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.2rem",
                      color: v1 >= v2 ? D1_COLOR : "rgba(255,255,255,0.25)",
                      lineHeight: 1,
                    }}>
                      {v1}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.5rem",
                      color: "rgba(255,255,255,0.12)",
                    }}>vs</span>
                    <span style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.2rem",
                      color: v2 >= v1 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)",
                      lineHeight: 1,
                    }}>
                      {v2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── POINTS ARC TAB ─── cumulative career points */}
        {activeTab === "points" && (
          <div>
            <SectionLabel>Cumulative career points · All seasons</SectionLabel>

            <PointsProgressionChart d1={d1} d2={d2} />

            {/* Summary strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "2px",
              marginTop: "1.5rem",
            }}>
              {[
                { label: "Career Points",   v1: Math.round(d1.totalPoints),       v2: Math.round(d2.totalPoints) },
                { label: "Points / Race",   v1: d1.pointsPerRace?.toFixed(1),     v2: d2.pointsPerRace?.toFixed(1) },
                { label: "Total Races",     v1: d1.totalRaces,                    v2: d2.totalRaces },
                { label: "Active Years",    v1: d1.careerSpan?.yearsActive,       v2: d2.careerSpan?.yearsActive },
              ].map(({ label, v1, v2 }) => {
                const n1 = parseFloat(String(v1));
                const n2 = parseFloat(String(v2));
                const d1Leads = n1 >= n2;
                return (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    padding: "0.75rem 1rem",
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.4rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                      marginBottom: "0.5rem",
                    }}>
                      {label}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                      <span style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(0.85rem,2vw,1.15rem)",
                        color: d1Leads ? D1_COLOR : "rgba(255,255,255,0.25)",
                        lineHeight: 1,
                      }}>
                        {v1 ?? "—"}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.45rem", color: "rgba(255,255,255,0.12)" }}>·</span>
                      <span style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(0.85rem,2vw,1.15rem)",
                        color: !d1Leads ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)",
                        lineHeight: 1,
                      }}>
                        {v2 ?? "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CONSISTENCY TAB ─── win rate & podium rate trend lines */}
        {activeTab === "consistency" && (
          <div>
            {/* Win rate trend */}
            <div style={{ marginBottom: "2rem" }}>
              <SectionLabel>Win rate by season · %</SectionLabel>
              <WinRateTrendChart d1={d1} d2={d2} metric="winRate" />
            </div>

            {/* Podium rate trend */}
            <div style={{ marginBottom: "2rem" }}>
              <SectionLabel>Podium rate by season · %</SectionLabel>
              <WinRateTrendChart d1={d1} d2={d2} metric="podiumRate" />
            </div>

            {/* Reliability / DNF stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px",
            }}>
              {[
                {
                  label: "DNFs",
                  v1: d1.dnfCount ?? "—",
                  v2: d2.dnfCount ?? "—",
                  lowerBetter: true,
                  note: "Total non-finishes",
                },
                {
                  label: "Retirement Rate",
                  v1: d1.retirementRate != null ? `${d1.retirementRate.toFixed(1)}%` : "—",
                  v2: d2.retirementRate != null ? `${d2.retirementRate.toFixed(1)}%` : "—",
                  lowerBetter: true,
                  note: "DNFs as % of races",
                },
              ].map(({ label, v1, v2, lowerBetter, note }) => {
                const n1 = parseFloat(String(v1));
                const n2 = parseFloat(String(v2));
                const d1Better = lowerBetter ? n1 <= n2 : n1 >= n2;
                return (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    padding: "1rem 1.25rem",
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.4rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                      marginBottom: "0.35rem",
                    }}>
                      {label}
                    </div>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "baseline", marginBottom: "0.35rem" }}>
                      <span style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(1rem,3vw,1.6rem)",
                        color: d1Better ? D1_COLOR : "rgba(255,255,255,0.25)",
                        lineHeight: 1,
                      }}>
                        {v1}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: "rgba(255,255,255,0.12)" }}>vs</span>
                      <span style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(1rem,3vw,1.6rem)",
                        color: !d1Better ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)",
                        lineHeight: 1,
                      }}>
                        {v2}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.38rem",
                      color: "rgba(255,255,255,0.15)",
                      letterSpacing: "0.06em",
                    }}>
                      {note} · {lowerBetter ? "lower is better" : "higher is better"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}