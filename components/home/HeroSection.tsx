import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{ minHeight: "92vh", background: "#080808" }}
    >
      {/* Red radial glow top */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(225,6,0,0.18) 0%, transparent 65%)",
      }} />

      {/* Speed lines + slash accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[22, 44, 63, 80].map((top, i) => (
          <div key={i} style={{
            position: "absolute", top: `${top}%`, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07) 65%, transparent 100%)",
          }} />
        ))}
        <div style={{ position: "absolute", top: "-20%", right: "5%", width: "3px", height: "140%", background: "linear-gradient(180deg, transparent 0%, rgba(225,6,0,0.5) 30%, rgba(225,6,0,0.3) 70%, transparent 100%)", transform: "skewX(-8deg)" }} />
        <div style={{ position: "absolute", top: "-20%", right: "7%", width: "1px", height: "100%", background: "linear-gradient(180deg, transparent 0%, rgba(225,6,0,0.15) 40%, transparent 100%)", transform: "skewX(-8deg)" }} />
        <div style={{ position: "absolute", top: "-20%", right: "3.5%", width: "1px", height: "80%", background: "linear-gradient(180deg, transparent 0%, rgba(225,6,0,0.1) 50%, transparent 100%)", transform: "skewX(-8deg)" }} />
      </div>

      {/* Big F1 watermark */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none" style={{ paddingRight: "4vw" }}>
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(10rem, 22vw, 22rem)",
          color: "rgba(255,255,255,0.025)",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}>F1</span>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-24">
        {/* Overline */}
        <div className="flex items-center gap-4 mb-8 animate-slide-up">
          <div style={{ width: "32px", height: "2px", background: "#E10600" }} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600, fontSize: "0.72rem",
            letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600",
          }}>2026 Season · Formula 1 Analytics</span>
        </div>

        {/* WORDMARK */}
        <h1 className="animate-slide-up" style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(5rem, 13vw, 11rem)",
          lineHeight: 0.92,
          letterSpacing: "-0.02em",
          color: "white",
          margin: "0 0 0.2em",
          animationDelay: "0.08s",
        }}>
          FJ<span style={{ color: "#E10600" }}>U</span>AN
        </h1>

        {/* Sub-brand */}
        <div className="flex items-center gap-4 mt-5 mb-7 animate-slide-up" style={{ animationDelay: "0.16s" }}>
          <div style={{ width: "40px", height: "1px", background: "rgba(225,6,0,0.4)" }} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 500, fontSize: "0.82rem",
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}>Race Data · Live Telemetry · Driver Stats</span>
        </div>

        {/* Description */}
        <p className="animate-slide-up" style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 400, fontSize: "1.05rem",
          lineHeight: 1.75, color: "rgba(255,255,255,0.42)",
          maxWidth: "440px", marginBottom: "2.5rem",
          animationDelay: "0.22s",
        }}>
          Real-time analytics, live telemetry, and comprehensive race statistics
          for the ultimate Formula 1 experience.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 animate-slide-up" style={{ marginBottom: "3.5rem", animationDelay: "0.3s" }}>
          <Link href="/drivers"><button className="btn-primary">Driver Standings</button></Link>
          <Link href="/tracks"><button className="btn-ghost">Circuits</button></Link>
          <Link href="/live">
            <button className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span className="live-dot" />Live
            </button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="animate-slide-up" style={{ display: "inline-grid", gridTemplateColumns: "repeat(3, auto)", animationDelay: "0.38s" }}>
          {[
            { value: "20+", label: "Drivers" },
            { value: "24", label: "Races" },
            { value: "10", label: "Teams" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "1rem 2rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              borderRight: i === 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "2rem", color: "white", lineHeight: 1 }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: "120px",
        background: "linear-gradient(to bottom, transparent, #080808)",
      }} />
    </section>
  );
}