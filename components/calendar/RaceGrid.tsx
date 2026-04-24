"use client";

/**
 * RaceGrid – Season race timeline.
 *
 * Layout: single continuous vertical timeline — no columns, no tables.
 *
 *   ┌─ NEXT RACE ──────────────────────────────────────────────────────┐
 *   │  Cinematic feature card with live countdown                      │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 *   Then every other race flows as a timeline entry:
 *
 *   [month]  ●──── Past race row  ────────────── Results →
 *   [month]  ●──── Past race row  ────────────── Results →
 *            ●  ← NEXT RACE (already shown above, skipped here)
 *   [month]  ○──── Future race row (dimmer, no link)
 *   [month]  ○──── Future race row
 *
 *   Month labels appear as sticky section dividers when the month changes.
 *   No grid, no two-column split — just one clean vertical flow.
 */

import Link from "next/link";
import { useState, useEffect } from "react";

interface RaceGridProps {
  races: any[];
  season: string;
  currentYear: number;
}

/* ── Countdown hook ──────────────────────────────────────────────────────── */
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const target = targetDate.getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);
  return timeLeft;
}

/* ── Next race cinematic card ────────────────────────────────────────────── */
function NextRaceCard({ race, season }: { race: any; season: string }) {
  const raceDate  = new Date(race.date + "T15:00:00Z");
  const qualiDate = race.Qualifying?.date    ? new Date(race.Qualifying.date)    : null;
  const fp1Date   = race.FirstPractice?.date ? new Date(race.FirstPractice.date) : null;
  const countdown = useCountdown(raceDate);

  const units = [
    { label: "Days",    value: countdown.days    },
    { label: "Hours",   value: countdown.hours   },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#0a0a0a",
      border: "1px solid rgba(225,6,0,0.15)",
      borderTop: "3px solid #E10600",
      marginBottom: "3rem",
      animation: "raceSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      {/* Red top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "140px",
        background: "linear-gradient(180deg, rgba(225,6,0,0.08) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Ghost round number */}
      <div style={{
        position: "absolute", right: "-1%", top: "50%",
        transform: "translateY(-50%)",
        fontFamily: "'Russo One', sans-serif",
        fontSize: "clamp(6rem, 20vw, 14rem)",
        color: "transparent",
        WebkitTextStroke: "1px rgba(255,255,255,0.025)",
        lineHeight: 1, pointerEvents: "none", userSelect: "none",
      }}>
        {race.round}
      </div>

      {/* Content */}
      <div style={{ position: "relative", padding: "2rem clamp(1.25rem, 4vw, 2.5rem)" }}>

        {/* Next badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.25rem 0.6rem", marginBottom: "1.25rem",
          background: "rgba(225,6,0,0.1)",
          border: "1px solid rgba(225,6,0,0.25)",
        }}>
          <div style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: "#E10600",
            animation: "livePulse 1.2s ease-in-out infinite",
          }} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: "0.6rem", letterSpacing: "0.18em",
            textTransform: "uppercase", color: "#E10600",
          }}>
            Next · Round {race.round}
          </span>
        </div>

        {/* Race name */}
        <h2 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.8rem, 6vw, 3.5rem)",
          lineHeight: 0.92, letterSpacing: "-0.02em",
          textTransform: "uppercase", color: "white",
          margin: "0 0 0.5rem",
        }}>
          {race.raceName}
        </h2>

        {/* Location */}
        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
          fontSize: "0.85rem", color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.06em", margin: "0 0 1.75rem",
        }}>
          {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
        </p>

        {/* Two rows: info cells + countdown stacked on mobile */}
        <div style={{
          display: "flex", flexDirection: "column", gap: "1rem",
        }}>
          {/* Info cells */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "1px",
            background: "rgba(255,255,255,0.05)",
          }}>
            {[
              { label: "Circuit",    value: race.Circuit?.circuitName },
              { label: "Race Date",  value: raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              fp1Date   && { label: "Practice",   value: fp1Date.toLocaleDateString("en-US",  { weekday: "short", month: "short", day: "numeric" }) },
              qualiDate && { label: "Qualifying",  value: qualiDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} style={{
                background: "#0a0a0a", padding: "0.7rem 1rem",
                flex: "1 1 auto", minWidth: "120px",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.46rem", fontWeight: 500,
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: "3px",
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                  fontSize: "0.78rem", color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.46rem", fontWeight: 500,
              color: "rgba(255,255,255,0.18)",
              letterSpacing: "0.16em", textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}>
              Race Countdown
            </div>
            <div style={{
              display: "flex", gap: "1px",
              background: "rgba(255,255,255,0.06)",
              maxWidth: "320px",
            }}>
              {units.map((u) => (
                <div key={u.label} style={{
                  flex: 1, background: "#060606",
                  padding: "0.85rem 0.5rem",
                  textAlign: "center", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: "2px", background: "#E10600",
                  }} />
                  <div style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.1rem, 3vw, 1.7rem)",
                    color: "white", lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.02em",
                  }}>
                    {String(u.value).padStart(2, "0")}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.42rem", fontWeight: 500,
                    color: "rgba(255,255,255,0.18)",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    marginTop: "3px",
                  }}>
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Timeline entry ──────────────────────────────────────────────────────── */
interface TimelineEntryProps {
  race: any;
  season: string;
  isPast: boolean;
  index: number;
}

function TimelineEntry({ race, season, isPast, index }: TimelineEntryProps) {
  const [hovered, setHovered] = useState(false);
  const raceDate  = new Date(race.date + "T00:00:00");
  const qualiDate = race.Qualifying?.date ? new Date(race.Qualifying.date) : null;

  const day   = raceDate.getDate();
  const month = raceDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  const content = (
    <div
      onMouseEnter={() => isPast ? setHovered(true) : undefined}
      onMouseLeave={() => isPast ? setHovered(false) : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "3rem 1px 1fr",
        gap: "0 1.25rem",
        alignItems: "stretch",
        minHeight: "68px",
        animation: `raceSlideUp 0.45s ${Math.min(index * 0.035, 0.5)}s cubic-bezier(0.16,1,0.3,1) both`,
        cursor: isPast ? "pointer" : "default",
      }}
    >
      {/* Date */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "flex-end", justifyContent: "center",
        paddingTop: "0.85rem", paddingBottom: "0.85rem",
      }}>
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
          color: isPast
            ? (hovered ? "#E10600" : "rgba(255,255,255,0.18)")
            : "rgba(255,255,255,0.08)",
          lineHeight: 1,
          transition: "color 0.15s ease",
        }}>
          {String(day).padStart(2, "0")}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.42rem", fontWeight: 500,
          color: isPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
          letterSpacing: "0.08em",
        }}>
          {month}
        </span>
      </div>

      {/* Spine */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: "1px", flex: 1,
          background: isPast
            ? (hovered
                ? "linear-gradient(180deg, transparent 0%, #E10600 15%, #E10600 85%, transparent 100%)"
                : "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 15%, rgba(255,255,255,0.1) 85%, transparent 100%)")
            : "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.05) 15%, rgba(255,255,255,0.05) 85%, transparent 100%)",
          transition: "background 0.2s ease",
        }} />
        {/* Node */}
        <div style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)",
          width: isPast ? (hovered ? "8px" : "6px") : "4px",
          height: isPast ? (hovered ? "8px" : "6px") : "4px",
          borderRadius: "50%",
          background: isPast
            ? (hovered ? "#E10600" : "rgba(255,255,255,0.25)")
            : "rgba(255,255,255,0.08)",
          boxShadow: (isPast && hovered) ? "0 0 10px rgba(225,6,0,0.6)" : "none",
          border: (isPast && hovered) ? "1px solid rgba(225,6,0,0.5)" : "1px solid transparent",
          transition: "all 0.15s ease",
        }} />
      </div>

      {/* Race info */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "1rem",
        padding: "0.85rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ minWidth: 0 }}>
          {/* Round + location */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            marginBottom: "3px", flexWrap: "wrap",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.44rem", fontWeight: 500,
              color: isPast ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)",
              letterSpacing: "0.08em",
            }}>
              R{race.round}
            </span>
            <div style={{ width: "1px", height: "8px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
              fontSize: "0.62rem",
              color: isPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
            </span>
          </div>

          {/* Race name */}
          <div style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(0.78rem, 2vw, 0.95rem)",
            textTransform: "uppercase", letterSpacing: "-0.01em",
            color: isPast
              ? (hovered ? "white" : "rgba(255,255,255,0.55)")
              : "rgba(255,255,255,0.22)",
            transition: "color 0.15s ease",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {race.raceName}
          </div>

          {/* Quali chip — future races only */}
          {!isPast && qualiDate && (
            <div style={{
              marginTop: "0.4rem",
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              padding: "0.15rem 0.4rem",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.4rem", fontWeight: 500,
                color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em",
              }}>
                QUALI
              </span>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                fontSize: "0.6rem", color: "rgba(255,255,255,0.22)",
              }}>
                {qualiDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          )}
        </div>

        {/* Results CTA — past only */}
        {isPast && (
          <div style={{
            display: "flex", alignItems: "center", gap: "4px", flexShrink: 0,
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: "0.58rem", letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: hovered ? "#E10600" : "rgba(255,255,255,0.12)",
            transition: "color 0.15s ease",
          }}>
            Results
            <svg width="7" height="7" viewBox="0 0 12 12" fill="none" style={{
              transform: hovered ? "translateX(3px)" : "none",
              transition: "transform 0.15s ease",
            }}>
              <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (isPast) {
    return (
      <Link href={`/races/${season}/${race.round}`} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }

  return content;
}

/* ── Month divider ───────────────────────────────────────────────────────── */
function MonthDivider({ month, year }: { month: string; year: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "1.5rem 0 0.5rem",
    }}>
      <div style={{ width: "16px", height: "2px", background: "#E10600", flexShrink: 0 }} />
      <span style={{
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
        fontSize: "0.58rem", letterSpacing: "0.22em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
      }}>
        {month} {year}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function RaceGrid({ races, season, currentYear }: RaceGridProps) {
  const now             = new Date();
  const isCurrentSeason = parseInt(season) === currentYear;
  const nextRaceIndex   = isCurrentSeason
    ? races.findIndex((r) => new Date(r.date + "T15:00:00Z") >= now)
    : -1;

  if (races.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "5rem 2rem",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ width: "32px", height: "2px", background: "#E10600", margin: "0 auto 1rem" }} />
        <p style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "1rem", textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em",
        }}>
          No races scheduled for {season}
        </p>
      </div>
    );
  }

  const nextRace = nextRaceIndex >= 0 ? races[nextRaceIndex] : null;

  // All races except the next one go into the timeline
  const timelineRaces = races.filter((_, i) => i !== nextRaceIndex);

  // Group by month for dividers
  let lastMonth = "";

  return (
    <div style={{ marginTop: "1rem" }}>

      {/* Next race feature card */}
      {nextRace && <NextRaceCard race={nextRace} season={season} />}

      {/* Single vertical timeline */}
      <div>
        {timelineRaces.map((race, i) => {
          const raceDate  = new Date(race.date + "T00:00:00");
          const monthKey  = raceDate.toLocaleDateString("en-US", { month: "long" });
          const showDivider = monthKey !== lastMonth;
          lastMonth = monthKey;

          const isPast = isCurrentSeason
            ? nextRaceIndex < 0 || races.indexOf(race) < nextRaceIndex
            : true;

          return (
            <div key={race.round}>
              {showDivider && <MonthDivider month={monthKey} year={season} />}
              <TimelineEntry
                race={race}
                season={season}
                isPast={isPast}
                index={i}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes raceSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}