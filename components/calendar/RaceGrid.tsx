"use client";

/**
 * RaceGrid – Full season race grid.
 *
 * Layout:
 *   - Next race: full-width featured card with large countdown
 *   - Past races: compact horizontal rows (no wasted space)
 *   - Future races: standard cards
 *
 * The next race always stands out visually above the rest.
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

/* ── Next race featured card ─────────────────────────────────────────────── */
function NextRaceCard({ race, season }: { race: any; season: string }) {
  const raceDate   = new Date(race.date + "T15:00:00Z");
  const qualiDate  = race.Qualifying?.date ? new Date(race.Qualifying.date) : null;
  const fp1Date    = race.FirstPractice?.date ? new Date(race.FirstPractice.date) : null;
  const countdown  = useCountdown(raceDate);

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
      border: "1px solid rgba(255,255,255,0.08)",
      borderTop: "3px solid #E10600",
      marginBottom: "1px",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 50% 100% at 100% 50%, rgba(225,6,0,0.06) 0%, transparent 65%)",
      }} />

      {/* Round watermark */}
      <div style={{
        position: "absolute", top: 0, right: "1.5rem", bottom: 0,
        display: "flex", alignItems: "center",
        fontFamily: "'Russo One', sans-serif",
        fontSize: "clamp(6rem, 15vw, 14rem)",
        color: "rgba(255,255,255,0.015)", lineHeight: 1,
        pointerEvents: "none", userSelect: "none",
      }}>
        {race.round}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 0,
        position: "relative",
      }}>
        {/* Left: race info */}
        <div style={{ padding: "2rem 1.5rem", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Next badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.25rem 0.6rem", marginBottom: "1rem",
            background: "rgba(225,6,0,0.1)",
            border: "1px solid rgba(225,6,0,0.25)",
          }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#E10600", animation: "livePulse 1.2s ease-in-out infinite",
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
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            lineHeight: 0.92, letterSpacing: "-0.02em",
            textTransform: "uppercase", color: "white",
            margin: "0 0 0.5rem",
          }}>
            {race.raceName}
          </h2>

          {/* Location */}
          <p style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.9rem", color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.06em", margin: "0 0 1.5rem",
          }}>
            {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
          </p>

          {/* Info cells */}
          <div style={{
            display: "flex", gap: "1px",
            background: "rgba(255,255,255,0.05)",
            flexWrap: "wrap",
          }}>
            {[
              { label: "Circuit",      value: race.Circuit?.circuitName },
              { label: "Race",         value: raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              fp1Date && { label: "Practice",  value: fp1Date.toLocaleDateString("en-US",  { weekday: "short", month: "short", day: "numeric" }) },
              qualiDate && { label: "Qualifying", value: qualiDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} style={{
                background: "#0a0a0a", padding: "0.7rem 1rem", flex: "1 1 auto",
              }}>
                <div className="data-readout" style={{ fontSize: "0.48rem", marginBottom: "3px" }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                  fontSize: "0.8rem", color: "rgba(255,255,255,0.7)",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: countdown */}
        <div style={{
          padding: "2rem 1.5rem",
          display: "flex", flexDirection: "column",
          justifyContent: "center", gap: "0.75rem",
          minWidth: "clamp(140px, 20vw, 200px)",
        }}>
          <span className="data-readout" style={{ fontSize: "0.5rem", letterSpacing: "0.2em" }}>
            Race Countdown
          </span>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "1px", background: "rgba(255,255,255,0.06)",
          }}>
            {units.map((u) => (
              <div key={u.label} style={{
                background: "#060606", padding: "0.9rem 0.5rem",
                textAlign: "center", position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: "2px", background: "#E10600",
                }} />
                <div style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
                  color: "white", lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {String(u.value).padStart(2, "0")}
                </div>
                <div className="data-readout" style={{ fontSize: "0.48rem", marginTop: "3px" }}>
                  {u.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

/* ── Past race row ────────────────────────────────────────────────────────── */
function PastRaceRow({ race, season }: { race: any; season: string }) {
  const [hovered, setHovered] = useState(false);
  const raceDate = new Date(race.date + "T00:00:00");

  return (
    <Link href={`/races/${season}/${race.round}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: "1rem",
          padding: "0.85rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
          borderLeft: hovered ? "2px solid rgba(225,6,0,0.4)" : "2px solid transparent",
          transition: "all 0.15s ease",
        }}
      >
        {/* Round */}
        <span className="data-readout" style={{ fontSize: "0.55rem", minWidth: "2rem", flexShrink: 0 }}>
          R{race.round}
        </span>

        {/* Race name + location */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.85rem", textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)", letterSpacing: "-0.01em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {race.raceName}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.7rem", color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.04em",
          }}>
            {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
          </div>
        </div>

        {/* Date */}
        <div style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
          fontSize: "0.7rem", color: "rgba(255,255,255,0.25)",
          flexShrink: 0, textAlign: "right",
        }}>
          {raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>

        {/* Results arrow */}
        <div style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: "0.65rem", letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: hovered ? "#E10600" : "rgba(255,255,255,0.15)",
          flexShrink: 0, transition: "color 0.15s ease",
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          Results
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{
            transform: hovered ? "translateX(3px)" : "none",
            transition: "transform 0.15s ease",
          }}>
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ── Future race card ─────────────────────────────────────────────────────── */
function FutureRaceCard({ race }: { race: any }) {
  const raceDate  = new Date(race.date + "T00:00:00");
  const qualiDate = race.Qualifying?.date ? new Date(race.Qualifying.date) : null;

  return (
    <div style={{
      padding: "1.25rem",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      borderLeft: "2px solid transparent",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {/* Round */}
        <span className="data-readout" style={{ fontSize: "0.55rem", minWidth: "2rem", flexShrink: 0, paddingTop: "2px" }}>
          R{race.round}
        </span>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.9rem", textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)", letterSpacing: "-0.01em",
            marginBottom: "2px",
          }}>
            {race.raceName}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.7rem", color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.04em", marginBottom: "0.5rem",
          }}>
            {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: "0.65rem", color: "rgba(255,255,255,0.3)",
            }}>
              Race: {raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {qualiDate && (
              <span style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                fontSize: "0.65rem", color: "rgba(255,255,255,0.18)",
              }}>
                Quali: {qualiDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>
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

  const pastRaces   = races.filter((_, i) => i < nextRaceIndex || (!isCurrentSeason));
  const nextRace    = nextRaceIndex >= 0 ? races[nextRaceIndex] : null;
  const futureRaces = nextRaceIndex >= 0 ? races.slice(nextRaceIndex + 1) : [];

  return (
    <div style={{ marginTop: "1rem" }}>

      {/* Next race — full-width featured */}
      {nextRace && <NextRaceCard race={nextRace} season={season} />}

      {/* Past + future in a two-column layout on desktop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: futureRaces.length > 0 && pastRaces.length > 0
          ? "1fr 1fr" : "1fr",
        gap: "1px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginTop: "1px",
      }}>

        {/* Past races — compact rows */}
        {pastRaces.length > 0 && (
          <div style={{ background: "#060606" }}>
            <div style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span className="label-overline">Completed</span>
              <span className="data-readout" style={{ fontSize: "0.5rem" }}>
                {pastRaces.length} races
              </span>
            </div>
            {[...pastRaces].reverse().map((race) => (
              <PastRaceRow key={race.round} race={race} season={season} />
            ))}
          </div>
        )}

        {/* Future races */}
        {futureRaces.length > 0 && (
          <div style={{ background: "#060606" }}>
            <div style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span className="label-overline">Upcoming</span>
              <span className="data-readout" style={{ fontSize: "0.5rem" }}>
                {futureRaces.length} races
              </span>
            </div>
            {futureRaces.map((race) => (
              <FutureRaceCard key={race.round} race={race} />
            ))}
          </div>
        )}

        {/* Historical season — all races as past rows */}
        {!isCurrentSeason && (
          <div style={{ background: "#060606", gridColumn: "1 / -1" }}>
            <div style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span className="label-overline">{season} Season</span>
              <span className="data-readout" style={{ fontSize: "0.5rem" }}>
                {races.length} races
              </span>
            </div>
            {[...races].reverse().map((race) => (
              <PastRaceRow key={race.round} race={race} season={season} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}