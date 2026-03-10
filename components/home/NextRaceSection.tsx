"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface NextRaceSectionProps {
  nextRace: any;
}

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    
    const target = targetDate.getTime(); // capture the value, not the object
    
    const tick = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]); // depend on the number, not the Date object

  return timeLeft;
}

export default function NextRaceSection({ nextRace }: NextRaceSectionProps) {
  const raceDate = nextRace ? new Date(nextRace.date + "T15:00:00Z") : null;
  const countdown = useCountdown(raceDate);

  const formattedDate = raceDate
    ? raceDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "TBD";

  const countdownBlocks = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Min" },
    { value: countdown.seconds, label: "Sec" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="surface relative overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Red top stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

        {/* Faint glow */}
        <div className="absolute top-0 right-0 w-96 h-full pointer-events-none" style={{
          background: "radial-gradient(ellipse at top right, rgba(225,6,0,0.06) 0%, transparent 60%)"
        }} />

        <div className="p-8 lg:p-12 relative">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">

            {/* Left: race info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="label-overline">Next Event</span>
                <div className="h-px w-8 bg-[#E10600]/40" />
                {nextRace && <span className="data-readout">Round {nextRace.round}</span>}
              </div>

              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 0.95,
                textTransform: "uppercase", letterSpacing: "-0.01em",
                color: "white", marginBottom: "0.6rem",
              }}>
                {nextRace?.raceName || "Season Concluded"}
              </h2>

              <p className="text-white/45 text-sm font-medium mb-8 tracking-wide">
                {nextRace?.Circuit?.Location?.locality}, {nextRace?.Circuit?.Location?.country}
              </p>

              {/* Circuit strip */}
              <div className="inline-flex items-center gap-4 px-4 py-3" style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)"
              }}>
                <span className="stat-label" style={{ marginTop: 0 }}>Circuit</span>
                <span className="text-white/80 text-sm font-medium" style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.04em"
                }}>
                  {nextRace?.Circuit?.circuitName || "TBD"}
                </span>
              </div>

              {/* Date strip */}
              <div className="flex items-center gap-3 mt-5" style={{
                padding: "0.75rem 1rem",
                background: "rgba(225,6,0,0.04)",
                border: "1px solid rgba(225,6,0,0.15)",
                display: "inline-flex",
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "#E10600", flexShrink: 0 }}>
                  <rect x="1" y="2" width="11" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.06em", color: "rgba(255,255,255,0.7)" }}>
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Right: countdown + cta */}
            <div className="flex flex-col gap-4 min-w-[220px]">
              {nextRace && (
                <div className="p-5" style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div className="stat-label mb-4">Race Countdown</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(255,255,255,0.07)" }}>
                    {countdownBlocks.map((block) => (
                      <div key={block.label} style={{ background: "#111", padding: "0.85rem 0.5rem", textAlign: "center" }}>
                        <div style={{
                          fontFamily: "'Russo One', sans-serif", fontSize: "1.6rem",
                          color: "white", lineHeight: 1, letterSpacing: "-0.01em",
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {String(block.value).padStart(2, "0")}
                        </div>
                        <div className="stat-label" style={{ fontSize: "0.58rem", letterSpacing: "0.12em" }}>{block.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/calendar">
                <button className="btn-ghost w-full justify-center" style={{ display: "flex" }}>
                  Full Calendar
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "8px" }}>
                    <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
