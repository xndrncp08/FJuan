import Link from "next/link";
import { D1_COLOR } from "./constants";

export function CompareHero() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "#060606",
    }}>
      <div style={{ height: "2px", background: D1_COLOR }} />

      {/* Noise */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        opacity: 0.3, mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize: "128px",
      }} />

      {/* Red bloom */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(225,6,0,0.12) 0%, transparent 65%)",
      }} />

      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      {/* VS watermark */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        display: "flex", alignItems: "center", paddingRight: "2vw",
        zIndex: 0, pointerEvents: "none", userSelect: "none",
      }}>
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(6rem, 20vw, 18rem)",
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.02)",
          lineHeight: 1, letterSpacing: "-0.04em",
        }}>VS</span>
      </div>

      <div style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: "clamp(2rem,5vw,4rem) clamp(1.25rem,4vw,1.5rem)",
        position: "relative", zIndex: 1,
      }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
          fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)", textDecoration: "none",
          marginBottom: "1.5rem",
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Home
        </Link>

        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: "0.75rem", letterSpacing: "0.18em",
            textTransform: "uppercase", color: D1_COLOR,
          }}>
            Head to Head · Driver Stats
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(2.8rem, 9vw, 7rem)",
          lineHeight: 0.9, letterSpacing: "-0.02em",
          textTransform: "uppercase", color: "white",
          margin: "0 0 1rem",
        }}>
          Driver{" "}
          <span style={{ color: D1_COLOR }}>Comparison</span>
        </h1>

        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
          fontSize: "clamp(0.85rem, 2vw, 1rem)",
          color: "rgba(255,255,255,0.3)", margin: 0,
        }}>
          Career statistics &amp; performance metrics, head to head.
        </p>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "60px", pointerEvents: "none", zIndex: 1,
        background: "linear-gradient(to bottom, transparent, #060606)",
      }} />
    </section>
  );
}