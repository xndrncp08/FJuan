/**
 * components/home/HeroSection.tsx
 *
 * Full-viewport homepage hero — completely redesigned.
 *
 * Visual layers (back to front):
 *   1.  Noise grain overlay
 *   2.  Animated scan-line sweep (top to bottom, looping)
 *   3.  Mouse-tracking radial glow
 *   4.  Top radial red bloom
 *   5.  Fine 48px grid with parallax drift on mouse
 *   6.  Diagonal speed lines (right edge, staggered)
 *   7.  Giant "F1" watermark — parallax on mouse
 *   8.  Animated corner brackets (top-left, bottom-right)
 *   9.  LIVE ticker bar
 *   10. Main content: overline, FJUAN title, subtitle, CTAs, stats
 *   11. Scroll hint with pulsing line
 *
 * Interactions:
 *   - mousemove  → radial glow + parallax on grid + F1 watermark
 *   - glitch     → every 6s, 120ms skew + ghost layer on title
 *   - scan line  → continuous top-to-bottom sweep, CSS animation
 *   - brackets   → CSS draw-in animation on mount
 *   - stats      → count-up animation on mount
 */
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

/* ── Ticker items ─────────────────────────────────────────────────────────── */
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

/* ── Stats ────────────────────────────────────────────────────────────────── */
const STATS = [
  { value: 20,  suffix: "",  label: "Drivers",  sub: "on the grid"  },
  { value: 24,  suffix: "",  label: "Races",    sub: "this season"  },
  { value: 76,  suffix: "",  label: "Years",    sub: "of F1 data"   },
];

/* ── Count-up hook ────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration: number = 1200, delay: number = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return val;
}

/* ── Stat cell ────────────────────────────────────────────────────────────── */
function StatCell({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const val = useCountUp(stat.value, 1400, 600 + index * 120);
  return (
    <div
      style={{
        padding: "1.25rem 2rem",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRight: index === STATS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
        position: "relative",
      }}
    >
      {/* Red 2px top accent on first cell only */}
      {index === 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#E10600" }} />
      )}
      <div className="stat-value" style={{ fontSize: "2.4rem", letterSpacing: "-0.02em" }}>
        {val}{stat.suffix}
      </div>
      <div className="stat-label">{stat.label}</div>
      <div className="data-readout" style={{ fontSize: "0.55rem", marginTop: "2px" }}>{stat.sub}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function HeroSection() {
  const [mounted,      setMounted]      = useState(false);
  const [mousePos,     setMousePos]     = useState({ x: 0.5, y: 0.3 });
  const [glitchActive, setGlitchActive] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    /* Glitch every 6 seconds — 120ms burst */
    const glitchTimer = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 120);
    }, 6000);

    return () => clearInterval(glitchTimer);
  }, []);

  /* Mouse tracking for parallax + glow */
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

  /* Parallax offsets — subtle drift */
  const gridOffsetX  = (mousePos.x - 0.5) * 12;
  const gridOffsetY  = (mousePos.y - 0.5) * 12;
  const f1OffsetX    = (mousePos.x - 0.5) * -24;
  const f1OffsetY    = (mousePos.y - 0.5) * -12;

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden"
      style={{ minHeight: "100vh", background: "#060606", display: "flex", flexDirection: "column" }}
    >

      {/* ── Layer 1: Noise grain ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 0, opacity: 0.4, mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px",
      }} />

      {/* ── Layer 2: Scan-line sweep ──────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1, overflow: "hidden" }}
      >
        <div style={{
          position: "absolute", left: 0, right: 0,
          height: "120px",
          background: "linear-gradient(180deg, transparent 0%, rgba(225,6,0,0.04) 40%, rgba(225,6,0,0.07) 50%, rgba(225,6,0,0.04) 60%, transparent 100%)",
          animation: "scanline 8s linear infinite",
        }} />
      </div>

      {/* ── Layer 3: Mouse glow ───────────────────────────────────────── */}
      <div className="absolute pointer-events-none" style={{
        inset: 0, zIndex: 1,
        background: `radial-gradient(800px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(225,6,0,0.10) 0%, transparent 55%)`,
        transition: "background 0.15s ease",
      }} />

      {/* ── Layer 4: Top red bloom ────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(225,6,0,0.22) 0%, transparent 65%)",
        zIndex: 1,
      }} />

      {/* ── Layer 5: Grid with parallax ──────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
        transition: "background-position 0.3s ease",
        zIndex: 1,
      }} />

      {/* ── Layer 6: Speed lines ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {[
          { right: "4%",    opacity: 0.55, width: "3px",  delay: "0s"    },
          { right: "6.5%",  opacity: 0.12, width: "1px",  delay: "0.3s"  },
          { right: "2.5%",  opacity: 0.09, width: "1px",  delay: "0.6s"  },
          { right: "9%",    opacity: 0.06, width: "1px",  delay: "0.9s"  },
          { right: "11.5%", opacity: 0.04, width: "1px",  delay: "1.2s"  },
        ].map((line, i) => (
          <div key={i} style={{
            position: "absolute", top: "-20%", bottom: "-20%",
            right: line.right, width: line.width,
            background: `linear-gradient(180deg, transparent 0%, rgba(225,6,0,${line.opacity}) 25%, rgba(225,6,0,${line.opacity * 0.7}) 75%, transparent 100%)`,
            transform: "skewX(-8deg)",
            animation: `speedline 4s ease-in-out ${line.delay} infinite alternate`,
          }} />
        ))}
      </div>

      {/* ── Layer 7: F1 watermark with parallax ──────────────────────── */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none overflow-hidden"
        style={{
          paddingRight: "2vw", zIndex: 1,
          transform: `translate(${f1OffsetX}px, ${f1OffsetY}px)`,
          transition: "transform 0.4s ease",
        }}
      >
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(10rem, 26vw, 26rem)",
          color: "rgba(255,255,255,0.018)", lineHeight: 1, letterSpacing: "-0.04em",
        }}>F1</span>
      </div>

      {/* ── Layer 8: Animated corner brackets ────────────────────────── */}
      {mounted && (
        <>
          {/* Top-left */}
          <div style={{ position: "absolute", top: "48px", left: "24px", zIndex: 2, pointerEvents: "none" }}>
            <div style={{
              width: "32px", height: "2px", background: "#E10600",
              animation: "bracketH 0.6s ease forwards",
              transformOrigin: "left",
            }} />
            <div style={{
              width: "2px", height: "32px", background: "#E10600",
              animation: "bracketV 0.6s 0.1s ease forwards",
              transformOrigin: "top",
            }} />
          </div>
          {/* Bottom-right */}
          <div style={{ position: "absolute", bottom: "48px", right: "24px", zIndex: 2, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{
              width: "32px", height: "2px", background: "rgba(225,6,0,0.4)",
              animation: "bracketH 0.6s 0.2s ease forwards",
              transformOrigin: "right",
            }} />
            <div style={{
              width: "2px", height: "32px", background: "rgba(225,6,0,0.4)",
              animation: "bracketV 0.6s 0.3s ease forwards",
              transformOrigin: "bottom",
            }} />
          </div>
        </>
      )}

      {/* ── Layer 9: LIVE ticker ──────────────────────────────────────── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.5)",
        overflow: "hidden", position: "relative", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", height: "30px" }}>
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center",
            padding: "0 16px", height: "100%", background: "#E10600",
            gap: "6px",
          }}>
            {/* Pulsing dot inside LIVE badge */}
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "white", animation: "livePulse 1.2s ease-in-out infinite",
            }} />
            <span className="data-readout" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", color: "white" }}>
              LIVE
            </span>
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-track">
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

      {/* ── Layer 10: Main content ────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center" style={{ zIndex: 5 }}>
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16">

          {/* Overline */}
          <div className="flex items-center gap-3 mb-10 animate-slide-up">
            <div style={{ width: "2px", height: "28px", background: "#E10600" }} />
            <span className="data-readout" style={{ fontSize: "0.6rem", letterSpacing: "0.26em", textTransform: "uppercase" }}>
              2026 Season · Formula 1 Analytics
            </span>
          </div>

          {/* FJUAN title + glitch */}
          <div className="animate-slide-up" style={{ animationDelay: "0.06s", position: "relative", marginBottom: "0.05em" }}>
            <h1 style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(5.5rem, 16vw, 14rem)",
              lineHeight: 0.88, letterSpacing: "-0.025em",
              color: "white", margin: 0,
              transform: glitchActive ? "skewX(-1.5deg) translateX(2px)" : "none",
              transition: glitchActive ? "none" : "transform 0.1s ease",
            }}>
              FJ<span style={{ color: "#E10600", position: "relative" }}>U</span>AN
            </h1>
            {/* Ghost glitch layer */}
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

          {/* CTAs */}
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

          {/* Stats strip with count-up */}
          <div className="animate-slide-up" style={{ animationDelay: "0.34s", display: "flex", gap: "0" }}>
            {STATS.map((stat, i) => (
              <StatCell key={i} stat={stat} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll hint ───────────────────────────────────────────────── */}
      <div className="relative flex justify-center pb-8 animate-fade-in" style={{ animationDelay: "1s", zIndex: 5 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "1px", height: "40px",
            background: "linear-gradient(to bottom, transparent, rgba(225,6,0,0.5))",
            animation: "scrollPulse 2s ease-in-out infinite",
          }} />
          <span className="data-readout" style={{ fontSize: "0.5rem", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Scroll
          </span>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: "160px",
        background: "linear-gradient(to bottom, transparent, #060606)",
        zIndex: 3,
      }} />

      {/* ── Keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes scanline {
          0%   { top: -120px; }
          100% { top: 100%; }
        }
        @keyframes speedline {
          0%   { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes bracketH {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes bracketV {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50%      { opacity: 1;   transform: scaleY(1.2); }
        }
      `}</style>
    </section>
  );
}