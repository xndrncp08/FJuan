/**
 * HeroSection — full-viewport homepage hero.
 *
 * Visual layers (back to front):
 *   1. Noise texture overlay (subtle grain for depth)
 *   2. Mouse-tracking radial glow (follows cursor)
 *   3. Top radial gradient (red bloom from top center)
 *   4. Fine 48px grid
 *   5. Diagonal speed lines (right edge)
 *   6. Giant "F1" watermark text
 *   7. Ticker bar (LIVE label + scrolling news items)
 *   8. Main content: overline, FJUAN title with glitch, subtitle, CTAs, stats strip
 *   9. Scroll hint (line + "Scroll" label)
 *
 * Interactions:
 *   - mousemove → updates radial glow position
 *   - glitch timer (every 6s) → brief skew + ghost layer on the title
 */
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

/* News ticker items shown in the LIVE bar at the top of the hero */
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

/* Hero stat strip: three key numbers */
const STATS = [
  { value: "20", label: "Drivers",  sub: "on the grid"   },
  { value: "24", label: "Races",    sub: "this season"   },
  { value: "76", label: "Years",    sub: "of F1 data"    },
];

/* ─────────────────────────────────────────────────────────────────────────── */

export default function HeroSection() {
  const [mounted,      setMounted]      = useState(false);
  const [mousePos,     setMousePos]     = useState({ x: 0.5, y: 0.3 });
  const [glitchActive, setGlitchActive] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    /* Trigger a brief glitch effect on the FJUAN title every 6 seconds */
    const glitchTimer = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 120);
    }, 6000);

    return () => clearInterval(glitchTimer);
  }, []);

  /* Track mouse position relative to the hero container for the radial glow */
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top)  / rect.height,
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

      {/* ── Layer 1: Noise texture overlay ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 0, opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px", mixBlendMode: "overlay",
      }} />

      {/* ── Layer 2: Mouse-tracking radial glow ─────────────────────── */}
      <div className="absolute pointer-events-none" style={{
        inset: 0, zIndex: 0,
        background: `radial-gradient(700px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(225,6,0,0.09) 0%, transparent 55%)`,
        transition: "background 0.2s ease",
      }} />

      {/* ── Layer 3: Top radial red bloom ────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(225,6,0,0.18) 0%, transparent 65%)",
        zIndex: 0,
      }} />

      {/* ── Layer 4: Fine 48px grid ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)`,
        backgroundSize: "48px 48px", zIndex: 0,
      }} />

      {/* ── Layer 5: Diagonal speed lines (right edge) ───────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[
          { right: "4%",   opacity: 0.55, width: "3px" },
          { right: "6.5%", opacity: 0.12, width: "1px" },
          { right: "2.5%", opacity: 0.09, width: "1px" },
          { right: "9%",   opacity: 0.06, width: "1px" },
        ].map((line, i) => (
          <div key={i} style={{
            position: "absolute", top: "-20%", bottom: "-20%",
            right: line.right, width: line.width,
            background: `linear-gradient(180deg, transparent 0%, rgba(225,6,0,${line.opacity}) 25%, rgba(225,6,0,${line.opacity * 0.7}) 75%, transparent 100%)`,
            transform: "skewX(-8deg)",
          }} />
        ))}
      </div>

      {/* ── Layer 6: Giant "F1" watermark ────────────────────────────── */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none overflow-hidden"
        style={{ paddingRight: "2vw", zIndex: 0 }}>
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(10rem, 26vw, 26rem)",
          color: "rgba(255,255,255,0.018)", lineHeight: 1, letterSpacing: "-0.04em",
        }}>F1</span>
      </div>

      {/* ── Layer 7: LIVE ticker bar ─────────────────────────────────── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.4)",
        overflow: "hidden", position: "relative", zIndex: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", height: "30px" }}>
          {/* LIVE badge */}
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center",
            padding: "0 16px", height: "100%", background: "#E10600",
          }}>
            <span className="data-readout" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", color: "white" }}>
              LIVE
            </span>
          </div>
          {/* Scrolling ticker */}
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-track">
              {/* Doubled for seamless loop */}
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="data-readout" style={{
                  fontSize: "0.58rem", letterSpacing: "0.14em",
                  padding: "0 3rem", whiteSpace: "nowrap",
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Layer 8: Main content ─────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center hero-content" style={{ zIndex: 1 }}>
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16">

          {/* Overline */}
          <div className="flex items-center gap-3 mb-10 animate-slide-up">
            <div style={{ width: "2px", height: "28px", background: "#E10600" }} />
            <span className="data-readout" style={{ fontSize: "0.6rem", letterSpacing: "0.26em", textTransform: "uppercase" }}>
              2026 Season · Formula 1 Analytics
            </span>
          </div>

          {/* Title — "FJUAN" with red U, glitch animation every 6s */}
          <div className="animate-slide-up" style={{ animationDelay: "0.06s", position: "relative", marginBottom: "0.05em" }}>
            <h1 style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(5.5rem, 16vw, 14rem)",
              lineHeight: 0.88, letterSpacing: "-0.025em",
              color: "white", margin: 0,
              /* Glitch: brief skew + slight right shift */
              transform: glitchActive ? "skewX(-1.5deg) translateX(2px)" : "none",
              transition: glitchActive ? "none" : "transform 0.1s ease",
            }}>
              FJ<span style={{ color: "#E10600", position: "relative" }}>U</span>AN
            </h1>

            {/* Ghost layer — visible only during glitch, offset to create chromatic effect */}
            {glitchActive && (
              <h1 aria-hidden style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(5.5rem, 16vw, 14rem)",
                lineHeight: 0.88, letterSpacing: "-0.025em",
                color: "#E10600", margin: 0,
                position: "absolute", top: 0, left: "3px",
                opacity: 0.3, clipPath: "inset(30% 0 50% 0)",
              }}>
                FJUAN
              </h1>
            )}
          </div>

          {/* Subtitle bar */}
          <div className="animate-slide-up" style={{
            animationDelay: "0.12s", display: "flex", alignItems: "center",
            gap: "1.5rem", margin: "1.5rem 0 2rem",
          }}>
            <div style={{ height: "1px", width: "48px", background: "rgba(225,6,0,0.5)" }} />
            <span className="data-readout" style={{ fontSize: "0.6rem", letterSpacing: "0.24em", textTransform: "uppercase" }}>
              Race Data · Live Telemetry · Driver Stats
            </span>
          </div>

          {/* Description */}
          <p className="animate-slide-up" style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, fontSize: "1.05rem",
            lineHeight: 1.85, color: "rgba(255,255,255,0.32)",
            maxWidth: "380px", marginBottom: "2.5rem", animationDelay: "0.18s",
          }}>
            Real-time analytics, live telemetry, and comprehensive race statistics for the ultimate Formula 1 experience.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 animate-slide-up" style={{ marginBottom: "4.5rem", animationDelay: "0.26s" }}>
            <Link href="/drivers">
              <button className="btn-primary">
                Driver Standings
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </Link>
            <Link href="/live">
              <button className="btn-ghost">
                <span className="live-dot" />
                Race Data
              </button>
            </Link>
            <Link href="/calendar">
              <button className="btn-ghost" style={{ borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
                Calendar
              </button>
            </Link>
          </div>

          {/* Stats strip — 3 bordered cells */}
          <div className="animate-slide-up" style={{ animationDelay: "0.34s", display: "flex", gap: "0" }}>
            {STATS.map((stat, i) => (
              <div key={i} style={{
                padding: "1.25rem 2rem",
                border: "1px solid rgba(255,255,255,0.08)",
                /* Merge borders: omit right on all but last */
                borderRight: i === STATS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                position: "relative",
              }}>
                {/* Red 2px top accent on the first stat cell only */}
                {i === 0 && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#E10600" }} />
                )}
                <div className="stat-value" style={{ fontSize: "2.4rem", letterSpacing: "-0.02em" }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="data-readout" style={{ fontSize: "0.55rem", marginTop: "2px" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll hint ───────────────────────────────────────────────── */}
      <div className="relative flex justify-center pb-8 animate-fade-in" style={{ animationDelay: "1s", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, transparent, rgba(225,6,0,0.4))" }} />
          <span className="data-readout" style={{ fontSize: "0.5rem", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Scroll
          </span>
        </div>
      </div>

      {/* Bottom fade to background */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: "160px",
        background: "linear-gradient(to bottom, transparent, #060606)",
        zIndex: 0,
      }} />
    </section>
  );
}
