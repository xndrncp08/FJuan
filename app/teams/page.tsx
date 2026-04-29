// app/teams/page.tsx — Constructor Standings
//
// Server component: fetches live standings from Jolpica and merges with
// local constructors.json for colors, base, founded, and championship history.
// Falls back to static constructors.json if the API call fails.
//
// Visual DNA matches the Circuits page hero:
//   dot-grid texture · horizontal speed lines · diagonal slash geometry
//   radial red glow · ghost watermark · scan sweep · pulse dot overline
//   wipe-in bottom edge · left accent bar · staggered slide-up reveals
//
// Responsive strategy:
//   - Hero stats: flex-wrap into 2-col on mobile (<480px) via .stats-strip
//   - Podium bento: 3-col → 1-col via auto-fit minmax grid
//   - Standings table: 7 cols desktop, 3 cols mobile (secondary cols hidden)
//   - All touch targets ≥ 44px

import Link from "next/link";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";
import ConstructorCharts from "@/components/teams/ConstructorCharts";
import HoverCard from "@/components/ui/HoverCard";
import ClickRow from "@/components/ui/ClickRow";

const CURRENT_IDS = [
  "ferrari",
  "mercedes",
  "red_bull",
  "mclaren",
  "alpine",
  "aston_martin",
  "williams",
  "haas",
  "rb",
  "sauber",
];

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default async function TeamsPage() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  let standings: any[] = [];
  try {
    standings = await getConstructorStandings("current");
  } catch {}

  // ── Data normalisation — merge API standings with local enrichment ─────────
  const teams =
    standings.length > 0
      ? standings.map((s: any) => {
          const local = constructorsData.find(
            (c) =>
              c.id === s.Constructor.constructorId ||
              s.Constructor.name.toLowerCase().includes(c.id.replace("_", " ")),
          );
          return {
            constructorId: s.Constructor.constructorId,
            name: s.Constructor.name,
            nationality: s.Constructor.nationality,
            position: parseInt(s.position) || 0,
            points: parseFloat(s.points) || 0,
            wins: parseInt(s.wins) || 0,
            championships: local?.championships ?? 0,
            color: local?.color ?? "#E10600",
            base: local?.base ?? "",
            founded: local?.founded ?? 0,
          };
        })
      : constructorsData
          .filter((c) => CURRENT_IDS.includes(c.id))
          .map((c, i) => ({
            constructorId: c.id,
            name: c.name,
            nationality: c.nationality,
            position: i + 1,
            points: 0,
            wins: 0,
            championships: c.championships,
            color: c.color,
            base: c.base,
            founded: c.founded,
          }));

  const currentTeams =
    standings.length > 0
      ? teams
      : teams.filter((t) => CURRENT_IDS.includes(t.constructorId));

  const totalPoints = currentTeams.reduce((s, t) => s + t.points, 0);
  const totalWins = currentTeams.reduce((s, t) => s + t.wins, 0);
  const maxPoints = currentTeams[0]?.points || 1;

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>
      {/* ── Global responsive stylesheet ──────────────────────────────────────
          All breakpoint rules live here so they're easy to audit in one place.
          Inline styles can't express media queries, so this <style> block is
          the single source of truth for responsive layout changes.        */}
      <style>{`
        @keyframes teamsSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes teamsGhostDrift {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        /* Speed lines sweep left-to-right across the hero */
        @keyframes teamsSpeedLine {
          0%   { transform: translateX(-120%); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(130vw); opacity: 0; }
        }
        /* Broadcast scan line drifts top-to-bottom */
        @keyframes teamsScanSweep {
          from { transform: translateY(-100%); }
          to   { transform: translateY(2000%); }
        }
        /* Pulsing red dot in the overline */
        @keyframes teamsPulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.6; }
        }
        @keyframes teamsPulseRing {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0; }
        }
        /* Bottom edge line wipes in from left */
        @keyframes teamsEdgeWipe {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        /* Left accent bar grows downward */
        @keyframes teamsAccentGrow {
          from { transform: scaleY(0); transform-origin: top; }
          to   { transform: scaleY(1); transform-origin: top; }
        }
        /* Stat numbers pop in with a subtle scale */
        @keyframes teamsStatReveal {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Smooth points bar fill on mount */
        .pts-bar { transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }

        /* ── Mobile ≤640px ─────────────────────────────────────────────────── */
        @media (max-width: 640px) {
          /* Hide secondary standings columns */
          .col-hide-mobile { display: none !important; }
          /* Collapse table to 3 visible columns */
          .standings-row { grid-template-columns: 2.5rem 1fr 4.5rem !important; }
          /* Tighter row padding — still meets 44px touch target */
          .standings-data-row { padding: 0.75rem 0.875rem !important; min-height: 44px; }
          .standings-header-row { padding: 0.5rem 0.875rem !important; }
          /* Stats strip: wrap into 2-col grid */
          .stats-strip {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0 !important;
          }
          .stats-strip > div {
            margin-right: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            padding: 0.875rem 0.75rem !important;
            min-width: 0 !important;
          }
          .stats-strip > div:last-child { grid-column: 1 / -1; border-bottom: none !important; }
        }
        /* ── Tablet 641–1024px ─────────────────────────────────────────────── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .standings-row { grid-template-columns: 3rem 1fr 6rem 4rem 4rem 5rem 4rem !important; }
        }
        /* ── Very small phones: podium goes single column ──────────────────── */
        @media (max-width: 480px) {
          .podium-grid { grid-template-columns: 1fr !important; }
        }
        /* Touch feedback on data rows */
        .standings-data-row:active { background: rgba(255,255,255,0.04); }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────────
          Same visual layers as the Circuits page hero.                      */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "#060606",
          minHeight: "clamp(300px, 38vw, 460px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Layer 1: dot-grid texture — same 28px repeat as circuits */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Layer 2: horizontal speed lines — varied durations so they desync */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {[
            {
              top: "18%",
              width: "35%",
              delay: "0s",
              dur: "3.2s",
              opacity: 0.07,
            },
            {
              top: "32%",
              width: "55%",
              delay: "0.5s",
              dur: "3.8s",
              opacity: 0.05,
            },
            {
              top: "48%",
              width: "25%",
              delay: "1.1s",
              dur: "2.9s",
              opacity: 0.09,
            },
            {
              top: "61%",
              width: "45%",
              delay: "0.3s",
              dur: "3.5s",
              opacity: 0.06,
            },
            {
              top: "74%",
              width: "30%",
              delay: "1.6s",
              dur: "4.0s",
              opacity: 0.04,
            },
            {
              top: "85%",
              width: "62%",
              delay: "0.8s",
              dur: "3.4s",
              opacity: 0.05,
            },
          ].map((line, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: line.top,
                left: "-120%",
                width: line.width,
                height: "1px",
                background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${line.opacity * 3}) 30%, rgba(255,255,255,${line.opacity}) 70%, transparent 100%)`,
                animation: `teamsSpeedLine ${line.dur} linear ${line.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Layer 3: double diagonal slash geometry — right side */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-5%",
            width: "45%",
            height: "140%",
            background:
              "linear-gradient(105deg, transparent 45%, rgba(225,6,0,0.04) 45%, rgba(225,6,0,0.09) 55%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "8%",
            width: "45%",
            height: "140%",
            background:
              "linear-gradient(105deg, transparent 47%, rgba(225,6,0,0.03) 47%, rgba(225,6,0,0.055) 50%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        {/* Layer 4: radial red glow — top right */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "70%",
            height: "130%",
            background:
              "radial-gradient(ellipse at top right, rgba(225,6,0,0.13) 0%, rgba(225,6,0,0.04) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Layer 5: ghost "CTORS" watermark — drifts in from right on mount */}
        <div
          style={{
            position: "absolute",
            right: "-2%",
            bottom: "-15%",
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(8rem, 18vw, 18rem)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.04)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            animation: "teamsGhostDrift 1.4s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          CTORS
        </div>

        {/* Layer 6: scan lines + moving broadcast sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* Static CRT-style horizontal scan texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
            }}
          />
          {/* Moving sweep — loops every 4s after a 1.5s delay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "80px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 50%, transparent 100%)",
              animation: "teamsScanSweep 4s linear 1.5s infinite",
            }}
          />
        </div>

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
            padding: "clamp(2.5rem,5vw,4.5rem) clamp(1.25rem,4vw,1.5rem)",
          }}
        >
          {/* Back link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              textDecoration: "none",
              marginBottom: "1.5rem",
              animation: "teamsSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            ← Home
          </Link>

          {/* Pulse dot + overline — mirrors circuits page exactly */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
              animation:
                "teamsSlideUp 0.6s 0.05s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div style={{ position: "relative", width: "6px", height: "6px" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#E10600",
                  animation: "teamsPulseCore 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  background: "rgba(225,6,0,0.3)",
                  animation: "teamsPulseRing 2s ease-in-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              Formula 1 · 2026 Season
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
              lineHeight: 0.92,
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.025em",
              margin: "0 0 0.5rem",
              animation:
                "teamsSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            Constructor <span style={{ color: "#E10600" }}>Standings</span>
          </h1>

          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
              color: "rgba(255,255,255,0.3)",
              margin: "0 0 2.5rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              maxWidth: "420px",
              animation:
                "teamsSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            World Constructor Championship standings — points, wins, and team
            history.
          </p>

          {/* Stats strip — staggered reveal, 2-col on mobile via .stats-strip */}
          <div
            className="stats-strip"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              animation:
                "teamsSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {[
              { value: "10", label: "Constructors" },
              { value: String(totalWins), label: "Race Wins" },
              { value: String(totalPoints), label: "Points Total" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  minWidth: "120px",
                  padding: "1rem clamp(1.25rem, 3vw, 2rem) 0",
                  paddingLeft: i === 0 ? 0 : undefined,
                  borderRight:
                    i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  paddingRight: i < 2 ? "clamp(1.25rem, 3vw, 2rem)" : 0,
                  animation: `teamsStatReveal 0.5s ${0.35 + i * 0.07}s cubic-bezier(0.16,1,0.3,1) both`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.4rem, 3vw, 2rem)",
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginTop: "4px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom edge line — wipes in from left, same as circuits page */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 40%, transparent 70%)",
            zIndex: 3,
            animation:
              "teamsEdgeWipe 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />

        {/* Left vertical accent bar — grows downward */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "3px",
            height: "60%",
            background: "linear-gradient(180deg, #E10600 0%, transparent 100%)",
            zIndex: 3,
            animation:
              "teamsAccentGrow 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />
      </section>

      {/* ── Charts section ────────────────────────────────────────────────────
          Delegated to ConstructorCharts client component (Recharts).        */}
      <ConstructorCharts teams={currentTeams} />

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(0.75rem, 4vw, 1.5rem)",
        }}
      >
        {/* ── Podium bento ──────────────────────────────────────────────────
            auto-fit minmax naturally gives:
              <480px  → 1 col  (overridden by .podium-grid media query above)
              480-760 → 2 cols
              >760px  → 3 cols                                               */}
        {currentTeams.length >= 3 && (
          <div style={{ marginBottom: "2px" }}>
            {/* Section label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "1rem",
                marginTop: "clamp(1rem, 3vw, 2rem)",
              }}
            >
              <div
                style={{ width: "16px", height: "2px", background: "#E10600" }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(0.5rem, 1.5vw, 0.52rem)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#E10600",
                }}
              >
                Podium
              </span>
            </div>

            <div
              className="podium-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "2px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {currentTeams.slice(0, 3).map((team, i) => (
                <Link
                  key={team.constructorId}
                  href={`/teams/${team.constructorId}`}
                  style={{ textDecoration: "none" }}
                >
                  <HoverCard
                    style={{
                      borderTop: `2px solid ${team.color}`,
                      padding: "clamp(1rem, 3vw, 1.5rem)",
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      height: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Ghost P1/P2/P3 watermark behind the card content */}
                    <div
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "1rem",
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(3rem, 10vw, 6rem)",
                        color: "transparent",
                        WebkitTextStroke: `1px ${team.color}18`,
                        lineHeight: 1,
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    >
                      P{i + 1}
                    </div>

                    {/* Position badge */}
                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                        color: PODIUM_COLORS[i],
                        lineHeight: 1,
                        marginBottom: "0.5rem",
                      }}
                    >
                      P{i + 1}
                    </div>

                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(0.95rem, 2.5vw, 1.35rem)",
                        textTransform: "uppercase",
                        color: "white",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.05,
                        marginBottom: "0.3rem",
                      }}
                    >
                      {team.name}
                    </div>

                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(0.48rem, 1.4vw, 0.52rem)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: team.color,
                        marginBottom: "1.25rem",
                      }}
                    >
                      {team.nationality} · Est. {team.founded}
                    </div>

                    {/* Championship dot-matrix — one dot per title, capped at 20 */}
                    {team.championships > 0 && (
                      <div style={{ marginBottom: "1.25rem" }}>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "clamp(0.38rem, 1.2vw, 0.42rem)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.18)",
                            marginBottom: "5px",
                          }}
                        >
                          {team.championships} WCC Title
                          {team.championships !== 1 ? "s" : ""}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "3px",
                          }}
                        >
                          {Array.from({
                            length: Math.min(team.championships, 20),
                          }).map((_, j) => (
                            <div
                              key={j}
                              style={{
                                width: "8px",
                                height: "8px",
                                background: team.color,
                                opacity:
                                  0.7 +
                                  (j / Math.max(team.championships, 1)) * 0.3,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3-cell mini stats grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: "1px",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      {[
                        { label: "Points", value: team.points },
                        { label: "Wins", value: team.wins },
                        { label: "Base", value: team.base.split(",")[0] },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{
                            background: "#080808",
                            padding: "0.6rem 0.75rem",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "clamp(0.38rem, 1.2vw, 0.42rem)",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.18)",
                              marginBottom: "3px",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Russo One', sans-serif",
                              fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                              color: "white",
                              lineHeight: 1,
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: "0.85rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(0.42rem, 1.3vw, 0.48rem)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: team.color,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        opacity: 0.7,
                      }}
                    >
                      View Profile
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M1 6h10M6 1l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </HoverCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Full standings table ───────────────────────────────────────────
            Desktop (>640px): 7 cols — Pos / Constructor / Points / Wins / Pts% / Base / Titles
            Mobile  (≤640px): 3 cols — Pos / Constructor+bar / Points
            Secondary columns carry .col-hide-mobile so the media query
            above can toggle them without JS.                                */}
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              margin: "clamp(1.5rem, 4vw, 2rem) 0 1rem",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "2px",
                background: "rgba(255,255,255,0.2)",
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(0.5rem, 1.5vw, 0.52rem)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              Full Standings
            </span>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <div
              className="standings-row standings-header-row"
              style={{
                display: "grid",
                gridTemplateColumns: "3rem 1fr 7rem 4rem 4rem 5rem 4rem",
                padding: "0.65rem 1.25rem",
                background: "#080808",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {[
                { label: "Pos", hide: false },
                { label: "Constructor", hide: false },
                { label: "Points", hide: false },
                { label: "Wins", hide: true },
                { label: "Pts%", hide: true },
                { label: "Base", hide: true },
                { label: "Titles", hide: true },
              ].map(({ label, hide }) => (
                <div
                  key={label}
                  className={hide ? "col-hide-mobile" : undefined}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(0.42rem, 1.3vw, 0.48rem)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Data rows — one per constructor */}
            {currentTeams.map((team, i) => {
              const pct =
                totalPoints > 0
                  ? ((team.points / totalPoints) * 100).toFixed(1)
                  : "0.0";
              const isPodium = i < 3;
              const posColor = isPodium
                ? PODIUM_COLORS[i]
                : "rgba(255,255,255,0.25)";

              return (
                <div
                  key={team.constructorId}
                  className="standings-row standings-data-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3rem 1fr 7rem 4rem 4rem 5rem 4rem",
                    alignItems: "center",
                    padding: "0.85rem 1.25rem",
                    minHeight: "44px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    // Podium rows get a coloured left accent; others are transparent
                    borderLeft: isPodium
                      ? `2px solid ${posColor}`
                      : "2px solid transparent",
                  }}
                >
                  <ClickRow
                    href={`/teams/${team.constructorId}`}
                    style={{ display: "contents" }}
                  >
                    {/* Position number — larger for podium */}
                    <span
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: isPodium
                          ? "clamp(0.85rem, 2.5vw, 1rem)"
                          : "clamp(0.72rem, 2vw, 0.82rem)",
                        color: posColor,
                        lineHeight: 1,
                      }}
                    >
                      {team.position || i + 1}
                    </span>

                    {/* Constructor name + relative points bar */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          marginBottom: "4px",
                          overflow: "hidden",
                        }}
                      >
                        {/* Team colour swatch */}
                        <div
                          style={{
                            width: "3px",
                            height: "14px",
                            background: team.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'Russo One', sans-serif",
                            fontSize: isPodium
                              ? "clamp(0.72rem, 2.2vw, 0.88rem)"
                              : "clamp(0.65rem, 2vw, 0.78rem)",
                            textTransform: "uppercase",
                            color: "white",
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {team.name}
                        </span>
                      </div>
                      {/* Relative points bar — width proportional to leader */}
                      <div
                        style={{
                          height: "2px",
                          background: "rgba(255,255,255,0.05)",
                          marginLeft: "9px",
                        }}
                      >
                        <div
                          className="pts-bar"
                          style={{
                            height: "100%",
                            width: `${(team.points / maxPoints) * 100}%`,
                            background: team.color,
                            opacity: 0.65,
                          }}
                        />
                      </div>
                    </div>

                    {/* Points */}
                    <span
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: isPodium
                          ? "clamp(0.88rem, 2.5vw, 1rem)"
                          : "clamp(0.75rem, 2.2vw, 0.85rem)",
                        color: isPodium ? "#E10600" : "rgba(255,255,255,0.7)",
                        lineHeight: 1,
                      }}
                    >
                      {team.points}
                    </span>

                    {/* Desktop-only: Wins */}
                    <span
                      className="col-hide-mobile"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(0.6rem, 1.8vw, 0.72rem)",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {team.wins}
                    </span>

                    {/* Desktop-only: Pts% share */}
                    <span
                      className="col-hide-mobile"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(0.55rem, 1.6vw, 0.65rem)",
                        color: "rgba(255,255,255,0.28)",
                      }}
                    >
                      {pct}%
                    </span>

                    {/* Desktop-only: Base city */}
                    <span
                      className="col-hide-mobile"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(0.5rem, 1.5vw, 0.6rem)",
                        color: "rgba(255,255,255,0.22)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {team.base.split(",")[0]}
                    </span>

                    {/* Desktop-only: Championship titles — red if they have any */}
                    <span
                      className="col-hide-mobile"
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "clamp(0.75rem, 2vw, 0.88rem)",
                        color:
                          team.championships > 0
                            ? "#E10600"
                            : "rgba(255,255,255,0.18)",
                      }}
                    >
                      {team.championships || "—"}
                    </span>
                  </ClickRow>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back link */}
        <div
          style={{
            paddingBottom: "3rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "1.5rem",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(0.5rem, 1.5vw, 0.52rem)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              minHeight: "44px",
            }}
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
