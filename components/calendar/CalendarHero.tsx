import Link from "next/link";

interface CalendarHeroProps {
  season: string;
}

export default function CalendarHero({ season }: CalendarHeroProps) {
  return (
    <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
      <div style={{ height: "2px", background: "#E10600" }} />

      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", paddingRight: "2rem", pointerEvents: "none", overflow: "hidden" }}>
        <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(6rem, 18vw, 16rem)", color: "rgba(255,255,255,0.02)", lineHeight: 1 }}>F1</span>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
          ← Home
        </Link>
        <div style={{ marginBottom: "0.5rem" }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600" }}>
            Formula 1 · Race Schedule
          </span>
        </div>
        <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)", color: "white", lineHeight: 0.92, letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}>
          {season} <span style={{ color: "#E10600" }}>CALENDAR</span>
        </h1>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, fontSize: "1rem", color: "rgba(255,255,255,0.38)", maxWidth: "420px" }}>
          Complete Formula 1 season schedule with results and countdown.
        </p>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(to bottom, transparent, #060606)", pointerEvents: "none" }} />
    </section>
  );
}