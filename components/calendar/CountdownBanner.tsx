"use client";

/**
 * CountdownBanner – Live countdown to the next race.
 * Sits between the hero and the season selector.
 */

import { useState, useEffect } from "react";

interface Props {
  race: any;
}

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

export default function CountdownBanner({ race }: Props) {
  const raceDate = race?.date ? new Date(race.date + "T15:00:00Z") : null;
  const countdown = useCountdown(raceDate);
  if (!race || !raceDate) return null;

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
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: "3px solid #E10600",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 100% at 100% 50%, rgba(225,6,0,0.05) 0%, transparent 70%)",
      }} />

      <div style={{
        display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between",
        gap: "1.5rem", padding: "1.5rem",
        position: "relative",
      }}>
        {/* Race info */}
        <div>
          <span className="label-overline" style={{ display: "block", marginBottom: "0.4rem" }}>
            Next Race
          </span>
          <div style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
            textTransform: "uppercase", color: "white",
            letterSpacing: "-0.01em", lineHeight: 1,
            marginBottom: "0.4rem",
          }}>
            {race.raceName}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.8rem", color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.06em",
          }}>
            {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
            {" · "}Round {race.round}
            {" · "}{raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Countdown units */}
        <div style={{
          display: "flex", gap: "1px",
          background: "rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          {units.map((u) => (
            <div key={u.label} style={{
              background: "#060606", padding: "0.9rem 1.1rem",
              textAlign: "center", minWidth: "60px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: "2px", background: "#E10600",
              }} />
              <div style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                color: "white", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
              }}>
                {String(u.value).padStart(2, "0")}
              </div>
              <div className="data-readout" style={{ fontSize: "0.5rem", marginTop: "4px" }}>
                {u.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}