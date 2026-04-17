/**
 * NextRaceSection — homepage section displaying the upcoming race with a live countdown.
 *
 * Layout: two-column panel.
 *   Left:  Race name, location, circuit info, and a "Full Calendar" link.
 *   Right: Live countdown (days / hours / min / sec).
 *
 * Countdown updates every second via useCountdown hook.
 * When the season is concluded, the left panel shows a graceful fallback.
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface NextRaceSectionProps {
  nextRace: any; /* Jolpica race object or null if season concluded */
}

/* ─── Countdown hook ─────────────────────────────────────────────────────── */

/** Returns { days, hours, minutes, seconds } until the target date, updated every 1s. */
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff %  3_600_000) /    60_000),
        seconds: Math.floor((diff %     60_000) /     1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);

  return timeLeft;
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function NextRaceSection({ nextRace }: NextRaceSectionProps) {
  /* Race time: assume 15:00 UTC if only a date string is available */
  const raceDate = nextRace ? new Date(nextRace.date + "T15:00:00Z") : null;
  const countdown = useCountdown(raceDate);

  const units = [
    { value: countdown.days,    label: "Days" },
    { value: countdown.hours,   label: "Hours" },
    { value: countdown.minutes, label: "Min" },
    { value: countdown.seconds, label: "Sec" },
  ];

  return (
    <section style={{
      borderTop:    "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position:     "relative",
      overflow:     "hidden",
      background:   "#070707",
    }}>

      {/* Subtle diagonal radial glow on the right */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-40%", right: "-10%", width: "60%", height: "180%",
          background: "radial-gradient(ellipse at center, rgba(225,6,0,0.04) 0%, transparent 65%)",
          transform: "skewX(-12deg)",
        }} />
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>

        {/* Section label strip */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "0.75rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="live-dot" />
            <span className="data-readout" style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Next Event
            </span>
          </div>
          <span className="data-readout" style={{ fontSize: "0.55rem" }}>
            Round {nextRace?.round} of 24
          </span>
        </div>

        {/* Two-column layout: race info | countdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0 }}>

          {/* ── Left: Race info ────────────────────────────────────────── */}
          <div style={{ padding: "2.5rem 1.5rem", borderRight: "1px solid rgba(255,255,255,0.05)" }}>

            {/* Race name */}
            <h2 style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2.2rem, 5vw, 4.5rem)",
              lineHeight: 0.92, letterSpacing: "-0.02em",
              textTransform: "uppercase", color: "white",
              margin: "0 0 0.4rem",
            }}>
              {nextRace?.raceName || "Season Concluded"}
            </h2>

            {/* Location */}
            <p style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
              fontSize: "0.9rem", color: "rgba(255,255,255,0.32)",
              letterSpacing: "0.08em", margin: "0 0 2rem",
            }}>
              {nextRace?.Circuit?.Location?.locality}, {nextRace?.Circuit?.Location?.country}
            </p>

            {/* Info cells: Circuit name + Race date */}
            <div style={{ display: "flex", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
              {[
                {
                  label: "Circuit",
                  value: nextRace?.Circuit?.circuitName || "TBD",
                },
                {
                  label: "Race Date",
                  value: raceDate
                    ? raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "TBD",
                },
              ].map((item) => (
                <div key={item.label} style={{ background: "#070707", padding: "0.85rem 1.25rem", flex: 1 }}>
                  <div className="stat-label" style={{ marginBottom: "0.3rem" }}>{item.label}</div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    fontSize: "0.95rem", color: "rgba(255,255,255,0.75)",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Full Calendar link */}
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                href="/calendar"
                className="nav-back"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E10600"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"}
              >
                Full Calendar
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Right: Countdown ───────────────────────────────────────── */}
          {nextRace && (
            <div style={{
              padding: "2.5rem 1.5rem",
              display: "flex", flexDirection: "column", justifyContent: "center",
              minWidth: "clamp(200px, 30vw, 320px)",
            }}>
              <div className="data-readout" style={{ fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                Race Countdown
              </div>

              {/* 4-unit countdown grid */}
              <div
                className="countdown-grid"
                style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1px", background: "rgba(255,255,255,0.06)",
                }}
              >
                {units.map((u) => (
                  <div key={u.label} style={{
                    background: "#0a0a0a", padding: "1rem 0.5rem",
                    textAlign: "center", position: "relative",
                  }}>
                    {/* 2px red top accent on each unit cell */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#E10600" }} />

                    {/* Numeric value — padded to 2 digits, tabular nums */}
                    <div style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                      color: "white", lineHeight: 1, letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {String(u.value).padStart(2, "0")}
                    </div>

                    {/* Unit label */}
                    <div className="data-readout" style={{ fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "4px" }}>
                      {u.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
