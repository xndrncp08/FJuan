// Calendar page hero — displays the F1 race schedule header for a given season.
// Shows season year, number of races, and countries. Accepts `season` as a prop
// so the hero updates live when the user switches years in the SeasonSelector.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface CalendarHeroProps {
  season: string;
}

export default function CalendarHero({ season }: CalendarHeroProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "#060606",
      minHeight: "clamp(300px, 38vw, 460px)",
      display: "flex",
      alignItems: "center",
    }}>

      {/* Dot-grid texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Speed lines — varied durations so they desync naturally */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[
          { top: "18%", width: "35%", delay: "0s",   dur: "3.2s", opacity: 0.07 },
          { top: "32%", width: "55%", delay: "0.5s", dur: "3.8s", opacity: 0.05 },
          { top: "48%", width: "25%", delay: "1.1s", dur: "2.9s", opacity: 0.09 },
          { top: "61%", width: "45%", delay: "0.3s", dur: "3.5s", opacity: 0.06 },
          { top: "74%", width: "30%", delay: "1.6s", dur: "4.0s", opacity: 0.04 },
          { top: "85%", width: "62%", delay: "0.8s", dur: "3.4s", opacity: 0.05 },
          { top: "24%", width: "20%", delay: "1.8s", dur: "2.6s", opacity: 0.03 },
          { top: "55%", width: "40%", delay: "2.2s", dur: "3.1s", opacity: 0.04 },
        ].map((line, i) => (
          <div key={i} style={{
            position: "absolute",
            top: line.top, left: "-120%",
            width: line.width, height: "1px",
            background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${line.opacity * 3}) 30%, rgba(255,255,255,${line.opacity}) 70%, transparent 100%)`,
            animation: `calSpeedLine ${line.dur} linear ${line.delay} infinite`,
          }} />
        ))}
      </div>

      {/* Diagonal slash geometry */}
      <div style={{
        position: "absolute",
        top: "-20%", right: "-5%",
        width: "45%", height: "140%",
        background: "linear-gradient(105deg, transparent 45%, rgba(225,6,0,0.04) 45%, rgba(225,6,0,0.09) 55%, transparent 55%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        top: "-20%", right: "8%",
        width: "45%", height: "140%",
        background: "linear-gradient(105deg, transparent 47%, rgba(225,6,0,0.03) 47%, rgba(225,6,0,0.055) 50%, transparent 50%)",
        pointerEvents: "none",
      }} />

      {/* Radial glow — top right */}
      <div style={{
        position: "absolute",
        top: "-30%", right: "-10%",
        width: "70%", height: "130%",
        background: "radial-gradient(ellipse at top right, rgba(225,6,0,0.13) 0%, rgba(225,6,0,0.04) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Ghost watermark */}
      <div style={{
        position: "absolute",
        right: "-2%", bottom: "-15%",
        fontFamily: "'Russo One', sans-serif",
        fontSize: "clamp(8rem, 18vw, 18rem)",
        color: "transparent",
        WebkitTextStroke: "1px rgba(255,255,255,0.04)",
        letterSpacing: "-0.04em",
        lineHeight: 1,
        pointerEvents: "none",
        userSelect: "none",
        animation: mounted ? "calGhostDrift 1.4s cubic-bezier(0.16,1,0.3,1) both" : "none",
      }}>
        F1
      </div>

      {/* Scan lines + broadcast sweep */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }} />
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: "80px",
          background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 50%, transparent 100%)",
          animation: "calScanSweep 4s linear 1.5s infinite",
        }} />
      </div>

      {/* Hero content */}
      <div style={{
        position: "relative", zIndex: 2,
        maxWidth: "1280px", margin: "0 auto", width: "100%",
        padding: "clamp(2.5rem,5vw,4.5rem) clamp(1.25rem,4vw,1.5rem)",
      }}>

        {/* Back link */}
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem",
          fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)", textDecoration: "none",
          marginBottom: "1.5rem",
          animation: mounted ? "calSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both" : "none",
        }}>
          ← Home
        </Link>

        {/* Pulse dot + overline */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "1.25rem",
          animation: mounted ? "calSlideUp 0.6s 0.05s cubic-bezier(0.16,1,0.3,1) both" : "none",
        }}>
          <div style={{ position: "relative", width: "6px", height: "6px" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#E10600",
              animation: "calPulseCore 2s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: "-3px", borderRadius: "50%",
              background: "rgba(225,6,0,0.3)",
              animation: "calPulseRing 2s ease-in-out infinite",
            }} />
          </div>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem",
            fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#E10600",
          }}>
            Formula 1 · {season} Season
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
          lineHeight: 0.92, textTransform: "uppercase",
          color: "white", letterSpacing: "-0.025em",
          margin: "0 0 0.5rem",
          animation: mounted ? "calSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both" : "none",
        }}>
          Race <span style={{ color: "#E10600" }}>Calendar</span>
        </h1>

        {/* Description */}
        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
          color: "rgba(255,255,255,0.3)",
          margin: "0 0 2.5rem",
          fontWeight: 500, letterSpacing: "0.04em",
          maxWidth: "420px",
          animation: mounted ? "calSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both" : "none",
        }}>
          Complete Formula 1 season schedule with results, circuit details, and live countdown.
        </p>

        {/* Stats strip */}
        <div style={{
          display: "inline-flex", flexWrap: "wrap",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          animation: mounted ? "calSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both" : "none",
        }}>
          {[
            { value: season, label: "Season"   },
            { value: "24",   label: "Races"    },
            { value: "20",   label: "Countries" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "1rem clamp(1.25rem, 3vw, 2rem) 0",
              paddingLeft: i === 0 ? 0 : undefined,
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
              paddingRight: i < 2 ? "clamp(1.25rem, 3vw, 2rem)" : 0,
              animation: mounted ? `calStatReveal 0.5s ${0.35 + i * 0.07}s cubic-bezier(0.16,1,0.3,1) both` : "none",
            }}>
              <div style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                color: "white", lineHeight: 1,
              }}>{s.value}</div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem", fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)", marginTop: "4px",
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom edge line — wipes in from left */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "2px",
        background: "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 40%, transparent 70%)",
        zIndex: 3,
        animation: mounted ? "calEdgeWipe 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both" : "none",
      }} />

      {/* Left vertical accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: "3px", height: "60%",
        background: "linear-gradient(180deg, #E10600 0%, transparent 100%)",
        zIndex: 3,
        animation: mounted ? "calAccentGrow 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both" : "none",
      }} />

      {/* Keyframes */}
      <style>{`
        @keyframes calSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes calGhostDrift {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes calSpeedLine {
          0%   { transform: translateX(-120%); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(130vw); opacity: 0; }
        }
        @keyframes calScanSweep {
          from { transform: translateY(-100%); }
          to   { transform: translateY(2000%); }
        }
        @keyframes calPulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.6; }
        }
        @keyframes calPulseRing {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes calEdgeWipe {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes calAccentGrow {
          from { transform: scaleY(0); transform-origin: top; }
          to   { transform: scaleY(1); transform-origin: top; }
        }
        @keyframes calStatReveal {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
}