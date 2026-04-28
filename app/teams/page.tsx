/**
 * app/teams/page.tsx — Constructor Standings · "Pit Wall" redesign
 *
 * Server component — fetches live standings from Jolpica API and merges
 * with local constructors.json enrichment data (colors, base, founded, championships).
 * Falls back to constructors.json static data if the API call fails.
 *
 * Mobile responsive strategy:
 *   - Hero stats strip wraps to 2-col grid on mobile
 *   - Podium bento collapses from 3-col to 1-col on mobile
 *   - Standings table hides Pts%, Base, Titles columns on mobile
 *     and uses a simpler 3-column grid (pos / name+bar / points)
 *
 * Client interactivity delegated to:
 *   - ConstructorCharts  (components/teams/ConstructorCharts.tsx)
 *   - HoverCard          (components/ui/HoverCard.tsx)
 *   - ClickRow           (components/ui/ClickRow.tsx)
 */

import Link from "next/link";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";
import ConstructorCharts from "@/components/teams/ConstructorCharts";
import HoverCard from "@/components/ui/HoverCard";
import ClickRow from "@/components/ui/ClickRow";

const CURRENT_IDS = [
  "ferrari", "mercedes", "red_bull", "mclaren", "alpine",
  "aston_martin", "williams", "haas", "rb", "sauber",
];

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default async function TeamsPage() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  let standings: any[] = [];
  try { standings = await getConstructorStandings("current"); } catch {}

  // ── Data normalisation ─────────────────────────────────────────────────────
  const teams = standings.length > 0
    ? standings.map((s: any) => {
        const local = constructorsData.find(
          (c) => c.id === s.Constructor.constructorId ||
            s.Constructor.name.toLowerCase().includes(c.id.replace("_", " "))
        );
        return {
          constructorId: s.Constructor.constructorId,
          name:          s.Constructor.name,
          nationality:   s.Constructor.nationality,
          position:      parseInt(s.position) || 0,
          points:        parseFloat(s.points) || 0,
          wins:          parseInt(s.wins) || 0,
          championships: local?.championships ?? 0,
          color:         local?.color ?? "#E10600",
          base:          local?.base ?? "",
          founded:       local?.founded ?? 0,
        };
      })
    : constructorsData
        .filter((c) => CURRENT_IDS.includes(c.id))
        .map((c, i) => ({
          constructorId: c.id,
          name: c.name, nationality: c.nationality,
          position: i + 1, points: 0, wins: 0,
          championships: c.championships,
          color: c.color, base: c.base, founded: c.founded,
        }));

  const currentTeams = standings.length > 0
    ? teams
    : teams.filter((t) => CURRENT_IDS.includes(t.constructorId));

  const totalPoints = currentTeams.reduce((s, t) => s + t.points, 0);
  const totalWins   = currentTeams.reduce((s, t) => s + t.wins, 0);
  const maxPoints   = currentTeams[0]?.points || 1;

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#060606",
      }}>
        <div style={{ height: "2px", background: "#E10600" }} />

        {/* Noise texture */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          pointerEvents: "none", opacity: 0.3, mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }} />

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Red bloom */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 60% at 0% 50%, rgba(225,6,0,0.09) 0%, transparent 60%)",
        }} />

        {/* Watermark — hidden on very small screens via clamp down to 0 width overflow */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          display: "flex", alignItems: "center", paddingRight: "2vw",
          zIndex: 0, pointerEvents: "none", userSelect: "none",
        }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(4rem, 18vw, 20rem)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.025)",
            lineHeight: 1, letterSpacing: "-0.04em",
          }}>CTORS</span>
        </div>

        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(1.5rem,5vw,3.5rem) clamp(1rem,4vw,1.5rem)",
          position: "relative", zIndex: 1,
        }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)", textDecoration: "none",
            marginBottom: "1.5rem",
          }}>← Home</Link>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem",
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#E10600", marginBottom: "0.6rem",
          }}>Formula 1 · 2026 Season</div>

          <h1 style={{
            fontFamily: "'Russo One', sans-serif",
            // Tighter minimum so it doesn't overflow on small phones
            fontSize: "clamp(2rem, 8vw, 7rem)",
            lineHeight: 0.9, letterSpacing: "-0.02em",
            textTransform: "uppercase", color: "white", margin: "0 0 1.5rem",
          }}>
            Constructor<br />
            <span style={{ color: "rgba(255,255,255,0.12)" }}>Standings</span>
          </h1>

          {/*
            Stats strip — on mobile this wraps into a 2-column grid.
            We can't use a media query in inline styles so we use a
            flex-wrap approach with min-width on each item.
          */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {[
              { value: "10",                label: "Constructors",  sub: "on the grid"    },
              { value: String(totalWins),   label: "Race Wins",     sub: "this season"    },
              { value: String(totalPoints), label: "Points Scored", sub: "combined total" },
            ].map((s, i) => (
              <div key={i} style={{
                // min-width forces wrap into 2-up on narrow screens
                minWidth: "120px",
                padding: "1rem 1.75rem 1rem 0",
                marginRight: "1.75rem",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <div style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "clamp(1.3rem, 4vw, 2.4rem)",
                  color: i === 0 ? "#E10600" : "white",
                  lineHeight: 1, letterSpacing: "-0.02em",
                }}>{s.value}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginTop: "3px",
                }}>{s.label}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.42rem",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.12)", marginTop: "1px",
                }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Charts ── */}
      <ConstructorCharts teams={currentTeams} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1rem,4vw,1.5rem)" }}>

        {/* ── Podium bento ──────────────────────────────────────────────────
            Uses CSS grid with auto-fit so it naturally goes:
              mobile  → 1 column
              tablet  → 2 columns
              desktop → 3 columns
        ── */}
        {currentTeams.length >= 3 && (
          <div style={{ marginBottom: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <div style={{ width: "16px", height: "2px", background: "#E10600" }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
                letterSpacing: "0.2em", textTransform: "uppercase", color: "#E10600",
              }}>Podium</span>
            </div>

            <div style={{
              display: "grid",
              // auto-fit with 240px minimum: wraps to 1-col on mobile, 3-col on desktop
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2px",
              background: "rgba(255,255,255,0.04)",
            }}>
              {currentTeams.slice(0, 3).map((team, i) => (
                <Link key={team.constructorId} href={`/teams/${team.constructorId}`} style={{ textDecoration: "none" }}>
                  <HoverCard style={{
                    borderTop: `2px solid ${team.color}`,
                    padding: "1.5rem",
                    position: "relative", overflow: "hidden", cursor: "pointer",
                  }}>
                    {/* Ghost position watermark */}
                    <div style={{
                      position: "absolute", right: "1rem", top: "1rem",
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "clamp(3rem, 8vw, 6rem)",
                      color: "transparent",
                      WebkitTextStroke: `1px ${team.color}18`,
                      lineHeight: 1, userSelect: "none",
                    }}>P{i + 1}</div>

                    {/* Position badge */}
                    <div style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.4rem", color: PODIUM_COLORS[i],
                      lineHeight: 1, marginBottom: "0.5rem",
                    }}>P{i + 1}</div>

                    {/* Team name */}
                    <div style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
                      textTransform: "uppercase", color: "white",
                      letterSpacing: "-0.01em", lineHeight: 1.05, marginBottom: "0.3rem",
                    }}>{team.name}</div>

                    {/* Nationality + year */}
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: team.color, marginBottom: "1.25rem",
                    }}>{team.nationality} · Est. {team.founded}</div>

                    {/* Championship dot-matrix — capped at 20 dots */}
                    {team.championships > 0 && (
                      <div style={{ marginBottom: "1.25rem" }}>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem",
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: "rgba(255,255,255,0.18)", marginBottom: "5px",
                        }}>{team.championships} WCC Title{team.championships !== 1 ? "s" : ""}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                          {Array.from({ length: Math.min(team.championships, 20) }).map((_, j) => (
                            <div key={j} style={{
                              width: "8px", height: "8px", background: team.color,
                              opacity: 0.7 + (j / Math.max(team.championships, 1)) * 0.3,
                            }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3-cell mini stats */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                      gap: "1px", background: "rgba(255,255,255,0.05)",
                    }}>
                      {[
                        { label: "Points", value: team.points },
                        { label: "Wins",   value: team.wins   },
                        { label: "Base",   value: team.base.split(",")[0] },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: "#080808", padding: "0.6rem 0.75rem" }}>
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            color: "rgba(255,255,255,0.18)", marginBottom: "3px",
                          }}>{label}</div>
                          <div style={{
                            fontFamily: "'Russo One', sans-serif",
                            fontSize: "0.9rem", color: "white", lineHeight: 1,
                          }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* View profile hint */}
                    <div style={{
                      marginTop: "0.85rem",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      color: team.color, display: "flex", alignItems: "center",
                      gap: "4px", opacity: 0.7,
                    }}>
                      View Profile
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </HoverCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Full standings table ───────────────────────────────────────────
            Desktop: 7 columns — Pos / Constructor / Points / Wins / Pts% / Base / Titles
            Mobile:  3 columns — Pos / Constructor+bar / Points
            Column visibility is handled by passing mobileStyle to ClickRow and
            wrapping secondary cells in a <span> with a className we hide via a
            <style> tag injected below.
        ── */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "2rem 0 1rem" }}>
            <div style={{ width: "16px", height: "2px", background: "rgba(255,255,255,0.2)" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
            }}>Full Standings</span>
          </div>

          {/*
            Inline <style> to hide/show columns based on breakpoint.
            We can't use Tailwind or CSS modules here since the whole file uses
            inline styles — this is the cleanest escape hatch for a single rule.
          */}
          <style>{`
            @media (max-width: 640px) {
              .col-hide-mobile { display: none !important; }
              .standings-grid  { grid-template-columns: 2.5rem 1fr 5rem !important; }
            }
          `}</style>

          <div style={{ border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>

            {/* Header row — secondary columns get col-hide-mobile */}
            <div
              className="standings-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "3rem 1fr 7rem 4rem 4rem 5rem 4rem",
                padding: "0.65rem 1.25rem",
                background: "#080808",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Pos</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Constructor</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Points</div>
              <div className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Wins</div>
              <div className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Pts%</div>
              <div className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Base</div>
              <div className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Titles</div>
            </div>

            {currentTeams.map((team, i) => {
              const pct = totalPoints > 0
                ? ((team.points / totalPoints) * 100).toFixed(1)
                : "0.0";
              const isPodium = i < 3;
              const posColor = isPodium ? PODIUM_COLORS[i] : "rgba(255,255,255,0.25)";

              return (
                <ClickRow
                  key={team.constructorId}
                  href={`/teams/${team.constructorId}`}
                  // Base style is the 7-column desktop layout
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3rem 1fr 7rem 4rem 4rem 5rem 4rem",
                    alignItems: "center",
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    borderLeft: isPodium ? `2px solid ${posColor}` : "2px solid transparent",
                  }}
                >
                  {/* Position */}
                  <span style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: isPodium ? "1rem" : "0.82rem",
                    color: posColor, lineHeight: 1,
                  }}>{team.position || i + 1}</span>

                  {/* Name + points bar */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "4px" }}>
                      <div style={{ width: "3px", height: "14px", background: team.color, flexShrink: 0 }} />
                      <span style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: isPodium ? "0.88rem" : "0.78rem",
                        textTransform: "uppercase", color: "white", letterSpacing: "-0.01em",
                      }}>{team.name}</span>
                    </div>
                    <div style={{ height: "2px", background: "rgba(255,255,255,0.05)", marginLeft: "9px" }}>
                      <div style={{
                        height: "100%", width: `${(team.points / maxPoints) * 100}%`,
                        background: team.color, opacity: 0.65,
                        transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                      }} />
                    </div>
                  </div>

                  {/* Points */}
                  <span style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: isPodium ? "1rem" : "0.85rem",
                    color: isPodium ? "#E10600" : "rgba(255,255,255,0.7)", lineHeight: 1,
                  }}>{team.points}</span>

                  {/* Hidden on mobile ↓ */}
                  <span className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{team.wins}</span>
                  <span className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.28)" }}>{pct}%</span>
                  <span className="col-hide-mobile" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.22)" }}>{team.base.split(",")[0]}</span>
                  <span className="col-hide-mobile" style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", color: team.championships > 0 ? "#E10600" : "rgba(255,255,255,0.18)" }}>{team.championships || "—"}</span>
                </ClickRow>
              );
            })}
          </div>
        </div>

        {/* Footer back link */}
        <div style={{
          paddingBottom: "3rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "1.5rem",
        }}>
          <Link href="/" style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
            letterSpacing: "0.16em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
          }}>← Home</Link>
        </div>
      </div>
    </main>
  );
}