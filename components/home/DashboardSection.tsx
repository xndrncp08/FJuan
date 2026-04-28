/**
 * components/home/DashboardSection.tsx
 *
 * Mobile-responsive "Pit Wall" dashboard.
 *
 * Responsive strategy (all rules in the single <style> block at render root):
 *
 *   > 768px  (desktop)  : 2-col bento — standings left (span 2 rows) · race/prediction right
 *   641–768px (tablet)  : same 2-col but right column narrows to minmax(240px,28%)
 *   ≤ 640px  (mobile)   : single column stack — standings · race · prediction
 *
 * Sub-component responsive notes:
 *   - StandingsPanel  : driver rows use clamp() fonts; bar always visible
 *   - NextRacePanel   : countdown digits use clamp(); circuit chips stack on xs
 *   - PredictionPanel : recharts bar collapses to 60px on mobile; rows tighten
 *   - PanelLabel      : font clamp so it never overflows
 *   - Touch targets   : all interactive/link rows ≥ 44px
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface DashboardSectionProps {
  standings:  any[];
  nextRace:   any;
  prediction: any;
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const TEAM_COLORS: Record<string, string> = {
  "Red Bull":      "#3671C6",
  "Ferrari":       "#E8002D",
  "Mercedes":      "#27F4D2",
  "McLaren":       "#FF8000",
  "Aston Martin":  "#229971",
  "Alpine":        "#FF87BC",
  "Williams":      "#64C4FF",
  "RB":            "#6692FF",
  "Kick Sauber":   "#52E252",
  "Haas F1 Team":  "#B6BABD",
};

const CONSTRUCTOR_COLORS: Record<string, string> = {
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

/* ── Countdown hook ──────────────────────────────────────────────────────── */
function useCountdown(target: Date | null) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 });
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target?.getTime()]);
  return t;
}

/* ── Section label ───────────────────────────────────────────────────────── */
function PanelLabel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "0.65rem 1.25rem",
      borderBottom: "1px solid rgba(255,255,255,0.055)",
      background: "rgba(0,0,0,0.35)",
      /* Prevent label text overflowing on xs screens */
      overflow: "hidden",
    }}>
      {accent && (
        <div style={{ width: "6px", height: "6px", background: "#E10600", flexShrink: 0 }} />
      )}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        /* clamp so it never overflows a narrow panel */
        fontSize: "clamp(0.42rem, 1.4vw, 0.52rem)",
        fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {children}
      </span>
    </div>
  );
}

/* ── Ghost sparkline background ─────────────────────────────────────────── */
function StandingsSparkline({ standings }: { standings: any[] }) {
  const data = standings.slice(0, 10).map((s: any) => ({
    pts: parseInt(s.points) || 0,
  }));
  if (!data.length) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.07, zIndex: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#E10600" stopOpacity={1} />
              <stop offset="100%" stopColor="#E10600" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="pts"
            stroke="#E10600" strokeWidth={2}
            fill="url(#ghostGrad)" dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Standings panel ─────────────────────────────────────────────────────── */
function StandingsPanel({ standings }: { standings: any[] }) {
  const top10 = standings.slice(0, 10);
  const max   = parseInt(top10[0]?.points) || 1;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
      <PanelLabel accent>Driver Standings · 2026</PanelLabel>

      <StandingsSparkline standings={standings} />

      <div style={{
        position: "relative", zIndex: 1, flex: 1,
        overflowY: "auto", scrollbarWidth: "none",
      }}>
        {top10.map((s: any, i: number) => {
          const pts       = parseInt(s.points) || 0;
          const pct       = (pts / max) * 100;
          const teamColor = TEAM_COLORS[s.Constructors?.[0]?.name] ?? "#E10600";
          const isPodium  = i < 3;
          const posColor  = isPodium ? RANK_COLORS[i] : "rgba(255,255,255,0.25)";

          return (
            <div
              key={s.Driver?.driverId}
              style={{
                display: "grid",
                gridTemplateColumns: "2.2rem 1fr auto",
                alignItems: "center",
                gap: "0.75rem",
                /* clamp padding so rows feel comfortable but don't waste space */
                padding: "clamp(0.55rem, 2vw, 0.7rem) clamp(0.75rem, 3vw, 1.25rem)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                borderLeft: isPodium ? `2px solid ${posColor}` : "2px solid transparent",
                background: isPodium ? "rgba(255,255,255,0.015)" : "transparent",
                transition: "background 0.15s ease",
                cursor: "default",
                /* Touch target */
                minHeight: "44px",
              }}
              onMouseEnter={e =>
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLElement).style.background =
                  isPodium ? "rgba(255,255,255,0.015)" : "transparent"
              }
            >
              {/* Position */}
              <span style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: isPodium
                  ? "clamp(0.8rem, 2.5vw, 1rem)"
                  : "clamp(0.65rem, 2vw, 0.8rem)",
                color: posColor, lineHeight: 1, textAlign: "center",
              }}>
                P{i + 1}
              </span>

              {/* Name + team + bar */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  display: "flex", alignItems: "baseline",
                  gap: "0.4rem", marginBottom: "3px",
                  overflow: "hidden",
                }}>
                  <span style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: isPodium
                      ? "clamp(0.7rem, 2.2vw, 0.88rem)"
                      : "clamp(0.62rem, 1.9vw, 0.78rem)",
                    textTransform: "uppercase", color: "white",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {s.Driver?.givenName?.charAt(0)}.{" "}
                    <span style={{ color: isPodium ? posColor : "rgba(255,255,255,0.8)" }}>
                      {s.Driver?.familyName}
                    </span>
                  </span>
                  {/* Hide constructor name on very small screens via class */}
                  <span className="standings-constructor-name" style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(0.38rem, 1.2vw, 0.44rem)",
                    color: teamColor, letterSpacing: "0.06em",
                    textTransform: "uppercase", flexShrink: 0,
                  }}>
                    {s.Constructors?.[0]?.name}
                  </span>
                </div>
                {/* Points bar */}
                <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: isPodium ? posColor : teamColor,
                    opacity: isPodium ? 0.9 : 0.55,
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
              </div>

              {/* Points */}
              <span style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: isPodium
                  ? "clamp(0.8rem, 2.5vw, 1rem)"
                  : "clamp(0.65rem, 2vw, 0.82rem)",
                color: isPodium ? posColor : "rgba(255,255,255,0.5)",
                lineHeight: 1, letterSpacing: "-0.01em", textAlign: "right",
                flexShrink: 0,
              }}>
                {pts}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div style={{
        padding: "0.75rem 1.25rem",
        borderTop: "1px solid rgba(255,255,255,0.055)",
        background: "rgba(0,0,0,0.25)",
      }}>
        <Link href="/drivers" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(0.44rem, 1.4vw, 0.52rem)",
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          transition: "color 0.15s",
          minHeight: "44px",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E10600"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"}
        >
          Full Standings
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ── Next race panel ─────────────────────────────────────────────────────── */
function NextRacePanel({ nextRace }: { nextRace: any }) {
  const raceDate = nextRace ? new Date(nextRace.date + "T15:00:00Z") : null;
  const cd = useCountdown(raceDate);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PanelLabel>
        <span style={{ color: "#27F4D2", marginRight: "4px" }}>▶</span>
        Next Event · Round {nextRace?.round ?? "—"}
      </PanelLabel>

      <div style={{ padding: "clamp(0.85rem, 3vw, 1.25rem)", flex: 1 }}>
        {/* Race name */}
        <h2 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.1rem, 3.5vw, 1.9rem)",
          lineHeight: 0.92, letterSpacing: "-0.02em",
          textTransform: "uppercase", color: "white",
          margin: "0 0 0.3rem",
        }}>
          {nextRace?.raceName ?? "Season Concluded"}
        </h2>
        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
          fontSize: "clamp(0.65rem, 2vw, 0.78rem)",
          color: "rgba(255,255,255,0.28)",
          letterSpacing: "0.06em", margin: "0 0 1rem",
        }}>
          {nextRace?.Circuit?.Location?.locality},{" "}
          {nextRace?.Circuit?.Location?.country}
        </p>

        {/* Circuit + date chips — stack on xs via .race-chips class */}
        <div
          className="race-chips"
          style={{
            display: "flex", gap: "1px",
            marginBottom: "1rem",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {[
            { l: "Circuit",   v: nextRace?.Circuit?.circuitName ?? "TBD" },
            {
              l: "Race Date",
              v: raceDate
                ? raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "TBD",
            },
          ].map(({ l, v }) => (
            <div key={l} style={{ flex: 1, background: "#0a0a0a", padding: "0.6rem 0.85rem", minWidth: 0 }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(0.38rem, 1.2vw, 0.42rem)",
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "2px",
              }}>{l}</div>
              <div style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(0.62rem, 2vw, 0.75rem)",
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase", letterSpacing: "0.03em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Countdown grid */}
        {nextRace && (
          <>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(0.4rem, 1.3vw, 0.46rem)",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", marginBottom: "0.6rem",
            }}>
              Race Countdown
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "1px",
              background: "rgba(255,255,255,0.05)",
            }}>
              {[
                { v: cd.d, l: "Days" },
                { v: cd.h, l: "Hrs"  },
                { v: cd.m, l: "Min"  },
                { v: cd.s, l: "Sec"  },
              ].map(({ v, l }, i) => (
                <div key={l} style={{
                  background: "#0a0a0a",
                  padding: "clamp(0.5rem, 2vw, 0.7rem) 0.25rem",
                  textAlign: "center", position: "relative",
                }}>
                  {i === 0 && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height: "2px", background: "#E10600",
                    }} />
                  )}
                  <div style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(0.9rem, 3vw, 1.5rem)",
                    color: "white", lineHeight: 1,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {String(v).padStart(2, "0")}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(0.36rem, 1.1vw, 0.44rem)",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)", marginTop: "3px",
                  }}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{
        padding: "0.6rem 1.25rem",
        borderTop: "1px solid rgba(255,255,255,0.055)",
        background: "rgba(0,0,0,0.25)",
      }}>
        <Link href="/calendar" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(0.44rem, 1.4vw, 0.52rem)",
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          transition: "color 0.15s",
          minHeight: "44px",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E10600"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"}
        >
          Full Calendar
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ── Prediction panel ────────────────────────────────────────────────────── */
function PredictionPanel({ prediction, nextRace }: { prediction: any; nextRace: any }) {
  if (!prediction?.predictions?.length) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PanelLabel>
        <span style={{ color: "#E10600" }}>◆</span> Prediction Model
      </PanelLabel>
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "2rem",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(0.44rem, 1.4vw, 0.52rem)",
          color: "rgba(255,255,255,0.15)", letterSpacing: "0.12em",
        }}>
          NO PREDICTION AVAILABLE
        </span>
      </div>
    </div>
  );

  const top3 = prediction.predictions.slice(0, 3);

  const barData = top3.map((d: any, i: number) => ({
    name: d.familyName,
    prob: d.podiumProbability,
    color: RANK_COLORS[i],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PanelLabel>
        <span style={{ color: "#E10600", marginRight: "2px" }}>◆</span>
        Prediction · {prediction.raceName ?? nextRace?.raceName ?? "Next Race"}
      </PanelLabel>

      <div style={{ padding: "clamp(0.85rem, 3vw, 1.25rem)", flex: 1 }}>
        {/* Probability bar chart — shorter on mobile */}
        <div className="prediction-chart" style={{ height: "80px", marginBottom: "1rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              barCategoryGap="30%"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Bar dataKey="prob" radius={0}>
                {barData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Podium rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {top3.map((d: any, i: number) => {
            const rankColor = RANK_COLORS[i];
            const teamColor = CONSTRUCTOR_COLORS[d.constructorId] ?? "#E10600";
            return (
              <div key={d.driverId} style={{
                display: "flex", alignItems: "center",
                gap: "clamp(0.5rem, 2vw, 0.85rem)",
                padding: "clamp(0.5rem, 2vw, 0.65rem) clamp(0.6rem, 2.5vw, 0.85rem)",
                background: i === 0 ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.015)",
                borderLeft: `2px solid ${rankColor}`,
                minHeight: "44px",
              }}>
                <span style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: i === 0
                    ? "clamp(0.9rem, 3vw, 1.2rem)"
                    : "clamp(0.72rem, 2.2vw, 0.9rem)",
                  color: rankColor, lineHeight: 1,
                  minWidth: "1.8rem", flexShrink: 0,
                }}>
                  P{i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: i === 0
                      ? "clamp(0.7rem, 2.2vw, 0.88rem)"
                      : "clamp(0.62rem, 1.9vw, 0.78rem)",
                    textTransform: "uppercase", color: "white",
                    letterSpacing: "-0.01em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {d.givenName?.charAt(0)}.{" "}
                    <span style={{ color: rankColor }}>{d.familyName}</span>
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(0.36rem, 1.2vw, 0.44rem)",
                    color: teamColor, letterSpacing: "0.06em",
                    textTransform: "uppercase", marginTop: "1px",
                  }}>
                    {d.constructorName}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(0.75rem, 2.5vw, 0.95rem)",
                    color: rankColor, lineHeight: 1,
                  }}>
                    {d.podiumProbability}%
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(0.34rem, 1vw, 0.4rem)",
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.08em", marginTop: "1px",
                  }}>
                    prob.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: "0.6rem 1.25rem",
        borderTop: "1px solid rgba(255,255,255,0.055)",
        background: "rgba(0,0,0,0.25)",
      }}>
        <Link href="/predict" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(0.44rem, 1.4vw, 0.52rem)",
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)", textDecoration: "none",
          transition: "color 0.15s",
          minHeight: "44px",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E10600"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"}
        >
          Full Prediction
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function DashboardSection({ standings, nextRace, prediction }: DashboardSectionProps) {
  return (
    <section style={{ position: "relative", background: "#060606" }}>

      {/*
        ── All responsive rules live here ────────────────────────────────────
        Using a single <style> block keeps every breakpoint easy to audit.
      */}
      <style>{`
        /* ── Mobile: ≤ 640px ───────────────────────────────────────────── */
        @media (max-width: 640px) {

          /* Stack bento into single column */
          .dashboard-bento {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }

          /* Each cell takes up a single column */
          .bento-standings {
            grid-column: 1 !important;
            grid-row: auto !important;
            /* Cap height so standings scrolls rather than dominates */
            min-height: 0 !important;
            max-height: 420px;
          }
          .bento-race,
          .bento-prediction {
            grid-column: 1 !important;
            grid-row: auto !important;
          }

          /* Shrink the prediction chart height on mobile */
          .prediction-chart { height: 56px !important; }

          /* Hide constructor team name in standings rows (saves space) */
          .standings-constructor-name { display: none !important; }

          /* Race chips: stack vertically */
          .race-chips {
            flex-direction: column !important;
            background: transparent !important;
            gap: 1px !important;
          }
        }

        /* ── Tablet: 641–768px ─────────────────────────────────────────── */
        @media (min-width: 641px) and (max-width: 768px) {
          .dashboard-bento {
            grid-template-columns: 1fr minmax(220px, 28%) !important;
          }
          .prediction-chart { height: 64px !important; }
        }

        /* ── Scrollbar hide (Webkit) ───────────────────────────────────── */
        .standings-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Shared background atmosphere ─────────────────────────────── */}
      <div style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.4) 30%, rgba(225,6,0,0.4) 70%, transparent 100%)",
      }} />

      {/* Noise grain */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        opacity: 0.25, mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
        backgroundSize: "160px",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Corner blooms */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(225,6,0,0.06) 0%, transparent 60%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: 0, right: 0, left: "50%", height: "40%",
        background: "radial-gradient(ellipse 60% 60% at 100% 100%, rgba(225,6,0,0.05) 0%, transparent 60%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Dashboard grid ───────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: "1280px", margin: "0 auto",
        padding: "clamp(1.25rem, 4vw, 2.5rem) clamp(0.75rem, 4vw, 1.5rem)",
      }}>

        {/* Section title */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "clamp(1rem, 3vw, 1.5rem)",
          flexWrap: "wrap", gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "20px", height: "2px", background: "#E10600" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(0.48rem, 1.5vw, 0.56rem)",
              fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase",
              color: "#E10600",
            }}>
              Pit Wall
            </span>
            <div style={{ width: "20px", height: "2px", background: "rgba(225,6,0,0.3)" }} />
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(0.4rem, 1.3vw, 0.48rem)",
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.15)",
          }}>
            Live Dashboard · 2026 Season
          </span>
        </div>

        {/*
          Bento grid.
          Desktop:  2 columns, standings spans 2 rows on the left.
          Tablet:   same, narrower right column.
          Mobile:   single column via .dashboard-bento media query override.

          We set the grid-template via inline style (desktop default) and let
          the CSS class override it on smaller screens.
        */}
        <div
          className="dashboard-bento"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr clamp(260px, 30%, 380px)",
            gridTemplateRows: "auto auto",
            gap: "2px",
            background: "rgba(255,255,255,0.04)",
          }}
        >

          {/* ── Cell 1: Standings — left, spans 2 rows ── */}
          <div
            className="bento-standings"
            style={{
              gridColumn: "1",
              gridRow: "1 / 3",
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "2px solid #E10600",
              position: "relative", overflow: "hidden",
              minHeight: "520px",
            }}
          >
            {standings?.length ? (
              <StandingsPanel standings={standings} />
            ) : (
              <div style={{
                padding: "2rem", display: "flex",
                alignItems: "center", justifyContent: "center", height: "100%",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(0.44rem, 1.4vw, 0.52rem)",
                  color: "rgba(255,255,255,0.15)", letterSpacing: "0.12em",
                }}>
                  STANDINGS UNAVAILABLE
                </span>
              </div>
            )}
          </div>

          {/* ── Cell 2: Next Race — top right ── */}
          <div
            className="bento-race"
            style={{
              gridColumn: "2", gridRow: "1",
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "2px solid rgba(39,244,210,0.6)",
              overflow: "hidden",
            }}
          >
            <NextRacePanel nextRace={nextRace} />
          </div>

          {/* ── Cell 3: Prediction — bottom right ── */}
          <div
            className="bento-prediction"
            style={{
              gridColumn: "2", gridRow: "2",
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "2px solid rgba(255,215,0,0.5)",
              overflow: "hidden",
            }}
          >
            <PredictionPanel prediction={prediction} nextRace={nextRace} />
          </div>
        </div>

        {/* Bottom rule */}
        <div style={{
          height: "1px", marginTop: "2px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
        }} />
      </div>
    </section>
  );
}