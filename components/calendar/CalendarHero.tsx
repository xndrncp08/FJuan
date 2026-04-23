/**
 * CalendarHero – Hero section for the calendar page.
 *
 * Visual layers:
 *   1. Noise grain overlay
 *   2. Top red bloom
 *   3. Fine grid
 *   4. Speed lines (right edge)
 *   5. Giant "F1" watermark
 *   6. Content: back link, overline, title, description
 */

import Link from "next/link";

interface CalendarHeroProps {
  season: string;
}

export default function CalendarHero({ season }: CalendarHeroProps) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#060606",
      }}
    >
      {/* 2px red top bar */}
      <div style={{ height: "2px", background: "#E10600" }} />

      {/* Noise grain */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        zIndex: 0, opacity: 0.35, mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px",
      }} />

      {/* Top red bloom */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(225,6,0,0.14) 0%, transparent 65%)",
      }} />

      {/* Fine grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      {/* Speed lines */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {[
          { right: "4%",   opacity: 0.45, width: "3px" },
          { right: "6.5%", opacity: 0.10, width: "1px" },
          { right: "2.5%", opacity: 0.07, width: "1px" },
          { right: "9%",   opacity: 0.05, width: "1px" },
        ].map((line, i) => (
          <div key={i} style={{
            position: "absolute", top: "-20%", bottom: "-20%",
            right: line.right, width: line.width,
            background: `linear-gradient(180deg, transparent 0%, rgba(225,6,0,${line.opacity}) 30%, rgba(225,6,0,${line.opacity * 0.6}) 70%, transparent 100%)`,
            transform: "skewX(-8deg)",
          }} />
        ))}
      </div>

      {/* F1 watermark */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        display: "flex", alignItems: "center",
        paddingRight: "2vw", zIndex: 0,
        pointerEvents: "none", userSelect: "none", overflow: "hidden",
      }}>
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(8rem, 20vw, 20rem)",
          color: "rgba(255,255,255,0.018)", lineHeight: 1, letterSpacing: "-0.04em",
        }}>F1</span>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: "clamp(2rem,5vw,4rem) clamp(1.25rem,4vw,1.5rem)",
        position: "relative", zIndex: 1,
      }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", textDecoration: "none",
            marginBottom: "1.5rem",
            transition: "color 0.15s ease",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Home
        </Link>

        {/* Overline */}
        <div style={{ marginBottom: "0.75rem" }}>
          <span className="label-overline">Formula 1 · Race Schedule</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(3rem, 9vw, 7rem)",
          lineHeight: 0.9, letterSpacing: "-0.02em",
          textTransform: "uppercase", color: "white",
          margin: "0 0 1rem",
        }}>
          {season}{" "}
          <span style={{ color: "#E10600" }}>Calendar</span>
        </h1>

        {/* Description */}
        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
          fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
          lineHeight: 1.7, color: "rgba(255,255,255,0.3)",
          maxWidth: "420px", margin: 0,
        }}>
          Complete Formula 1 season schedule with results, circuit details, and live countdown.
        </p>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "80px", pointerEvents: "none", zIndex: 1,
        background: "linear-gradient(to bottom, transparent, #060606)",
      }} />
    </section>
  );
}