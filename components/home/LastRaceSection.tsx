/**
 * components/home/LastRaceSection.tsx
 *
 * Displays the podium finishers from the most recently completed race.
 * Replaces the championship standings preview on the homepage —
 * "who just won" is more immediately interesting than season totals.
 *
 * Layout:
 *   Section header (race name + round)
 *   Three podium cards — P1 large centre, P2 left, P3 right
 *   "Full Results" link
 */

"use client";

import Link from "next/link";

interface LastRaceSectionProps {
  lastRace: any; // Jolpica race result object or null
}

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_LABELS = ["Winner", "2nd Place", "3rd Place"];

const TEAM_COLORS: Record<string, string> = {
  red_bull:     "#3671C6",
  ferrari:      "#E8002D",
  mercedes:     "#27F4D2",
  mclaren:      "#FF8000",
  aston_martin: "#229971",
  alpine:       "#FF87BC",
  williams:     "#64C4FF",
  rb:           "#6692FF",
  kick_sauber:  "#52E252",
  haas:         "#B6BABD",
};

export default function LastRaceSection({ lastRace }: LastRaceSectionProps) {
  if (!lastRace || !lastRace.Results) return null;

  const podium = lastRace.Results.slice(0, 3);
  const raceDate = new Date(lastRace.date + "T00:00:00");
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        background: "#070707",
      }}
    >
      {/* Ambient red glow top-left */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 50% 60% at 0% 0%, rgba(225,6,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>

        {/* ── Section header strip ──────────────────────────────────────── */}
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "0.75rem 1.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="label-overline">Last Race</span>
          </div>
          <span className="data-readout" style={{ fontSize: "0.55rem" }}>
            Round {lastRace.round} · {formattedDate}
          </span>
        </div>

        {/* ── Race name ─────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "2rem 1.5rem 0",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            flexWrap: "wrap", gap: "1rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 3.5rem)",
                lineHeight: 0.92, letterSpacing: "-0.02em",
                textTransform: "uppercase", color: "white", margin: 0,
              }}
            >
              {lastRace.raceName}
            </h2>
            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
                fontSize: "0.85rem", color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.08em", margin: "0.4rem 0 0",
              }}
            >
              {lastRace.Circuit?.Location?.locality}, {lastRace.Circuit?.Location?.country}
            </p>
          </div>

          <Link
            href={`/calendar`}
            style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)", textDecoration: "none",
              display: "flex", alignItems: "center", gap: "6px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E10600"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"}
          >
            Full Results
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* ── Podium cards ──────────────────────────────────────────────── */}
        {/*
         * Desktop: P2 left | P1 centre (taller) | P3 right
         * Mobile:  P1, P2, P3 stacked
         * Achieved with CSS order on a single-column-on-mobile grid.
         */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "1px",
            background: "rgba(255,255,255,0.05)",
            margin: "2rem 1.5rem",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* P2 — order 1 (left on desktop) */}
          {podium[1] && (
            <PodiumCard result={podium[1]} rank={2} style={{ order: 1 }} />
          )}
          {/* P1 — order 0 (centre on desktop, first on mobile) */}
          {podium[0] && (
            <PodiumCard result={podium[0]} rank={1} isWinner style={{ order: 0 }} />
          )}
          {/* P3 — order 2 (right on desktop) */}
          {podium[2] && (
            <PodiumCard result={podium[2]} rank={3} style={{ order: 2 }} />
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Individual podium card ──────────────────────────────────────────────── */

function PodiumCard({
  result,
  rank,
  isWinner = false,
  style: outerStyle,
}: {
  result: any;
  rank: number;
  isWinner?: boolean;
  style?: React.CSSProperties;
}) {
  const rankColor = RANK_COLORS[rank - 1];
  const teamColor = TEAM_COLORS[result.Constructor?.constructorId] ?? "#E10600";
  const driver    = result.Driver;
  const time      = result.Time?.time ?? result.status ?? "—";

  return (
    <div
      style={{
        position: "relative",
        padding: isWinner ? "2rem 1.5rem" : "1.5rem",
        background: isWinner ? "rgba(255,215,0,0.02)" : "rgba(255,255,255,0.01)",
        borderTop: `3px solid ${rankColor}`,
        marginTop: isWinner ? 0 : "1.5rem",
        ...outerStyle,
      }}
    >
      {/* Top glow */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "80px",
          background: `linear-gradient(180deg, ${rankColor}10 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Rank + label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <span
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: isWinner ? "2.5rem" : "1.8rem",
            color: rankColor, lineHeight: 1,
          }}
        >
          P{rank}
        </span>
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase",
            color: rankColor, opacity: 0.7,
          }}
        >
          {RANK_LABELS[rank - 1]}
        </span>
      </div>

      {/* Driver name */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: isWinner ? "1.4rem" : "1.1rem",
            textTransform: "uppercase", color: "white",
            letterSpacing: "-0.01em", lineHeight: 1.1,
          }}
        >
          {driver.givenName}{" "}
          <span style={{ color: rankColor }}>{driver.familyName}</span>
        </div>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
            color: teamColor, marginTop: "3px", opacity: 0.85,
          }}
        >
          {result.Constructor?.name}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex", gap: "1px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {[
          { label: "Time",   value: time },
          { label: "Points", value: result.points },
          { label: "Laps",   value: result.laps },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1, padding: "0.6rem 0.5rem", background: "#070707",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.85rem", color: "white", lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div className="data-readout" style={{ fontSize: "0.48rem", marginTop: "3px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}