"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const TICKER_ITEMS = [
  "2026 F1 SEASON UNDERWAY",
  "LIVE TELEMETRY AVAILABLE DURING SESSIONS",
  "DRIVER STANDINGS UPDATED IN REAL TIME",
  "24 RACES · 10 TEAMS · 20 DRIVERS",
  "COMPARE ANY TWO DRIVERS HEAD TO HEAD",
  "FULL RACE CALENDAR WITH COUNTDOWN TIMERS",
  "HISTORICAL DATA BACK TO 1950",
  "POWERED BY JOLPICA & OPENF1 APIS",
];

const STATS = [
  { value: "20+", label: "Drivers" },
  { value: "24", label: "Races" },
  { value: "10", label: "Teams" },
];

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.3 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    const el = heroRef.current;
    el?.addEventListener("mousemove", handleMouse);
    return () => el?.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden"
      style={{ minHeight: "100vh", background: "#060606", display: "flex", flexDirection: "column" }}
    >
      {/* Interactive mouse glow */}
      <div className="absolute pointer-events-none" style={{
        inset: 0, zIndex: 0,
        background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(225,6,0,0.07) 0%, transparent 60%)`,
        transition: "background 0.15s ease",
      }} />

      {/* Top radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(225,6,0,0.15) 0%, transparent 65%)",
        zIndex: 0,
      }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        zIndex: 0,
      }} />

      {/* Diagonal speed accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[{ right: "5%", opacity: 0.5, width: "3px" }, { right: "7.5%", opacity: 0.15, width: "1px" }, { right: "3.5%", opacity: 0.1, width: "1px" }].map((line, i) => (
          <div key={i} style={{
            position: "absolute", top: "-20%", bottom: "-20%", right: line.right, width: line.width,
            background: `linear-gradient(180deg, transparent 0%, rgba(225,6,0,${line.opacity}) 30%, rgba(225,6,0,${line.opacity * 0.6}) 70%, transparent 100%)`,
            transform: "skewX(-8deg)",
          }} />
        ))}
      </div>

      {/* Watermark */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none overflow-hidden" style={{ paddingRight: "3vw", zIndex: 0 }}>
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(8rem, 20vw, 20rem)",
          color: "rgba(255,255,255,0.022)",
          lineHeight: 1, letterSpacing: "-0.04em",
        }}>F1</span>
      </div>

      {/* Ticker */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(225,6,0,0.04)", overflow: "hidden", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", height: "28px", overflow: "hidden" }}>
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
            padding: "0 14px", height: "100%", background: "#E10600",
            borderRight: "1px solid rgba(255,255,255,0.15)",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", color: "white" }}>LIVE</span>
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", fontWeight: 500,
                  letterSpacing: "0.12em", color: "rgba(255,255,255,0.38)",
                  padding: "0 2.5rem", whiteSpace: "nowrap",
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex items-center" style={{ zIndex: 1 }}>
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="flex items-center gap-4 mb-8 animate-slide-up">
            <div style={{ width: "32px", height: "2px", background: "#E10600" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              2026 Season · Formula 1 Analytics
            </span>
          </div>

          <h1 className="animate-slide-up" style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(5rem, 14vw, 12rem)",
            lineHeight: 0.9, letterSpacing: "-0.02em",
            color: "white", margin: "0 0 0.15em",
            animationDelay: "0.06s",
          }}>
            FJ<span style={{ color: "#E10600" }}>U</span>AN
          </h1>

          <div className="flex items-center gap-4 mt-6 mb-8 animate-slide-up" style={{ animationDelay: "0.14s" }}>
            <div style={{ width: "40px", height: "1px", background: "rgba(225,6,0,0.4)" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: "0.8rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Race Data · Live Telemetry · Driver Stats
            </span>
          </div>

          <p className="animate-slide-up" style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, fontSize: "1.05rem",
            lineHeight: 1.8, color: "rgba(255,255,255,0.38)",
            maxWidth: "400px", marginBottom: "2.5rem", animationDelay: "0.2s",
          }}>
            Real-time analytics, live telemetry, and comprehensive race statistics for the ultimate Formula 1 experience.
          </p>

          <div className="flex flex-wrap gap-3 animate-slide-up" style={{ marginBottom: "4rem", animationDelay: "0.28s" }}>
            <Link href="/drivers">
              <button className="btn-primary" style={{ gap: "10px", display: "inline-flex", alignItems: "center" }}>
                Driver Standings
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </Link>
            <Link href="/tracks"><button className="btn-ghost">Circuits</button></Link>
            <Link href="/live">
              <button className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span className="live-dot" />Live
              </button>
            </Link>
          </div>

          <div className="animate-slide-up" style={{ display: "inline-grid", gridTemplateColumns: "repeat(3, auto)", animationDelay: "0.36s" }}>
            {STATS.map((stat, i) => (
              <div key={i} style={{
                padding: "1.1rem 2.2rem",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                borderRight: i === STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}>
                <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "2.2rem", color: "white", lineHeight: 1 }}>{stat.value}</div>
                <div className="stat-label" style={{ marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative flex justify-center pb-8 animate-fade-in" style={{ animationDelay: "0.9s", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", color: "rgba(255,255,255,0.15)" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: "140px",
        background: "linear-gradient(to bottom, transparent, #060606)",
        zIndex: 0,
      }} />
    </section>
  );
}
