"use client";

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
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);

  return timeLeft;
}

export default function CountdownBanner({ race }: Props) {
  const raceDate = race?.date ? new Date(race.date) : null;
  const countdown = useCountdown(raceDate);

  if (!race || !raceDate) return null;

  const units = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "#0a0a0a",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle red glow left edge */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
        background: "#E10600",
      }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>

        {/* Left: race info */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#E10600" }}>
              Next Race
            </span>
          </div>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "white", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 }}>
              {race.raceName}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
              {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country} · Round {race.round}
            </div>
          </div>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>
            {raceDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>

        {/* Right: countdown blocks */}
        <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          {units.map((u, i) => (
            <div key={u.label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", padding: "0.5rem 0.85rem", textAlign: "center", minWidth: "56px" }}>
                <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.4rem", color: "#E10600", lineHeight: 1 }}>
                  {String(u.value).padStart(2, "0")}
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
                  {u.label}
                </div>
              </div>
              {i < units.length - 1 && (
                <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.15)", padding: "0 4px" }}>:</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}