/**
 * app/teams/[constructorId]/page.tsx — Constructor Profile
 *
 * Server component — deep-dive page for a single constructor.
 *
 * Mobile responsive strategy:
 *   - Stats strip scrolls horizontally on mobile (overflow-x: auto)
 *   - Driver cards stack to 1 column on mobile via auto-fit grid
 *   - Race results table hides "Drivers" column on mobile
 *   - Breadcrumb truncates gracefully on small screens
 *
 * Client interactivity delegated to:
 *   - ConstructorProfileCharts  (components/teams/ConstructorProfileCharts.tsx)
 *   - HoverCard                 (components/ui/HoverCard.tsx)
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getConstructorStandings,
  getConstructorResults,
  getDriverStandings,
} from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";
import ConstructorProfileCharts from "@/components/teams/ConstructorProfileCharts";
import HoverCard from "@/components/ui/HoverCard";
import {
  ReactElement, JSXElementConstructor, ReactNode,
  ReactPortal, AwaitedReactNode, Key,
} from "react";

interface Props {
  params: Promise<{ constructorId: string }>;
}

export default async function ConstructorProfilePage({ params }: Props) {
  const { constructorId } = await params;

  // 404 if the constructor ID isn't in our local enrichment data
  const local = constructorsData.find(c => c.id === constructorId);
  if (!local) notFound();

  const currentYear = new Date().getFullYear().toString();

  // ── Parallel data fetching ─────────────────────────────────────────────────
  const [standings, raceResults, driverStandings] = await Promise.all([
    getConstructorStandings("current").catch(() => []),
    getConstructorResults(constructorId, currentYear).catch(() => []),
    getDriverStandings("current").catch(() => []),
  ]);

  // ── Merge standings with local enrichment ─────────────────────────────────
  const standingEntry = standings.find(
    (s: any) => s.Constructor?.constructorId === constructorId
  );

  const team = {
    constructorId,
    name:          standingEntry?.Constructor?.name        ?? local.name,
    nationality:   standingEntry?.Constructor?.nationality ?? local.nationality,
    position:      standingEntry ? parseInt(standingEntry.position) : null,
    points:        standingEntry ? parseFloat(standingEntry.points) : 0,
    wins:          standingEntry ? parseInt(standingEntry.wins)     : 0,
    championships: local.championships,
    color:         local.color,
    base:          local.base,
    founded:       local.founded,
  };

  // Drivers who list this constructor in their Constructors array
  const teamDrivers = driverStandings.filter((d: any) =>
    d.Constructors?.some((c: any) => c.constructorId === constructorId)
  );

  // ── Build race series ─────────────────────────────────────────────────────
  const raceSeries = (raceResults ?? []).map((race: any) => {
    const pts = (race.Results ?? []).reduce(
      (s: number, r: any) => s + parseFloat(r.points ?? 0), 0
    );
    const positions = (race.Results ?? []).map((r: any) => parseInt(r.position) || 20);
    const bestPos = positions.length ? Math.min(...positions) : null;

    return {
      round:   parseInt(race.round),
      name:    race.raceName?.replace(" Grand Prix", "").replace(" GP", "") ?? `R${race.round}`,
      short:   race.raceName?.split(" ")[0] ?? `R${race.round}`,
      points:  pts,
      bestPos,
      results: (race.Results ?? []).map((r: any) => ({
        driverId:   r.Driver?.driverId,
        driverCode: r.Driver?.code ?? r.Driver?.familyName?.slice(0, 3).toUpperCase(),
        position:   parseInt(r.position) || null,
        points:     parseFloat(r.points ?? 0),
        status:     r.status,
      })),
    };
  });

  // Add running cumulative total for the arc chart
  let cumPts = 0;
  const raceSeriesWithCum = raceSeries.map((r: { points: number }) => {
    cumPts += r.points;
    return { ...r, cumPoints: cumPts };
  });

  // ── Derived stats ─────────────────────────────────────────────────────────
  const completedRaces = raceSeries.filter((r: { bestPos: number | null }) => r.bestPos !== null).length;
  const avgPoints = completedRaces > 0 ? (team.points / completedRaces).toFixed(1) : "—";
  const podiums = raceSeries.reduce((s: number, r: { results: { filter: (arg0: (res: any) => boolean) => { length: number } } }) => {
    return s + r.results.filter((res: any) => res.position && res.position <= 3).length;
  }, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#060606",
      }}>
        <div style={{ height: "3px", background: team.color }} />

        {/* Noise */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          pointerEvents: "none", opacity: 0.3, mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }} />

        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Team colour bloom */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 70% at 0% 50%, ${team.color}12 0%, transparent 55%)`,
        }} />

        {/* Team name watermark */}
        <div style={{
          position: "absolute", right: "-2%", top: 0, bottom: 0,
          display: "flex", alignItems: "center",
          zIndex: 0, pointerEvents: "none", userSelect: "none",
        }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(3rem, 16vw, 18rem)",
            color: "transparent",
            WebkitTextStroke: `1px ${team.color}18`,
            lineHeight: 1, letterSpacing: "-0.04em",
          }}>{team.name.split(" ").pop()}</span>
        </div>

        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(1.5rem,5vw,3.5rem) clamp(1rem,4vw,1.5rem)",
          position: "relative", zIndex: 1,
        }}>
          {/* Breadcrumb — flex-wrap so it wraps gracefully on tiny screens */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            flexWrap: "wrap", marginBottom: "1.5rem",
          }}>
            <Link href="/" style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)", textDecoration: "none",
            }}>Home</Link>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.6rem" }}>·</span>
            <Link href="/teams" style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)", textDecoration: "none",
            }}>Constructors</Link>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.6rem" }}>·</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.14em", textTransform: "uppercase", color: team.color,
            }}>{team.name.split(" ")[0]}</span>
          </div>

          {/* Badges — wrap on mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <div style={{
              padding: "0.2rem 0.6rem",
              background: `${team.color}18`, border: `1px solid ${team.color}44`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
              letterSpacing: "0.12em", textTransform: "uppercase", color: team.color,
            }}>{team.nationality}</div>
            {team.position && (
              <div style={{
                padding: "0.2rem 0.6rem",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
                letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
              }}>P{team.position} in championship</div>
            )}
          </div>

          {/* Team name — tighter clamp minimum for small phones */}
          <h1 style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.8rem, 7vw, 6rem)",
            lineHeight: 0.9, letterSpacing: "-0.02em",
            textTransform: "uppercase", color: "white", margin: "0 0 0.5rem",
          }}>{team.name}</h1>

          <p style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.9rem", color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.06em", margin: "0 0 1.5rem",
          }}>{team.base} · Est. {team.founded}</p>

          {/* Championship dot-matrix */}
          {team.championships > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)", marginBottom: "6px",
              }}>
                {team.championships} World Constructor Championship{team.championships !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {Array.from({ length: Math.min(team.championships, 24) }).map((_, i) => (
                  <div key={i} style={{
                    width: "10px", height: "10px", background: team.color,
                    opacity: 0.55 + (i / team.championships) * 0.45,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/*
            Stats strip — on mobile this scrolls horizontally rather than
            wrapping (wrapping would break the separator lines).
            Each item has a min-width so it stays legible when scrolling.
          */}
          <div style={{
            display: "flex",
            overflowX: "auto",
            // Hide the scrollbar visually but keep it functional
            scrollbarWidth: "none",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {[
              { value: String(team.championships), label: "WCC Titles",  accent: true  },
              { value: String(team.points),        label: "2026 Points", accent: false },
              { value: String(team.wins),          label: "2026 Wins",   accent: false },
              { value: String(podiums),            label: "Podiums",     accent: false },
              { value: avgPoints,                  label: "Pts / Race",  accent: false },
            ].map((s, i, arr) => (
              <div key={i} style={{
                // min-width prevents items shrinking below readable size on mobile
                minWidth: "80px", flexShrink: 0,
                padding: "1rem 1.5rem 1rem 0", marginRight: "1.5rem",
                borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                paddingRight: i < arr.length - 1 ? "1.5rem" : 0,
              }}>
                <div style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "clamp(1.2rem, 3vw, 2rem)",
                  color: s.accent ? team.color : "white",
                  lineHeight: 1, letterSpacing: "-0.02em",
                }}>{s.value || "—"}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)", marginTop: "3px",
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Profile charts ────────────────────────────────────────────────── */}
      <ConstructorProfileCharts
        raceSeries={raceSeriesWithCum}
        teamColor={team.color}
        teamName={team.name}
      />

      {/* ── Current drivers ───────────────────────────────────────────────── */}
      {teamDrivers.length > 0 && (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1rem,4vw,1.5rem)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "2.5rem 0 1rem" }}>
            <div style={{ width: "16px", height: "2px", background: team.color }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.2em", textTransform: "uppercase", color: team.color,
            }}>Current Drivers</span>
          </div>

          {/*
            Driver cards — auto-fit grid:
              mobile  → 1 column (minmax 240px can't fit 2 on a phone)
              tablet+ → 2 columns
          */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "2px",
          }}>
            {teamDrivers.map((d: any) => {
              const pts  = parseFloat(d.points) || 0;
              const pos  = parseInt(d.position) || 0;
              const wins = parseInt(d.wins) || 0;

              return (
                <Link key={d.Driver?.driverId} href={`/drivers/${d.Driver?.driverId}`} style={{ textDecoration: "none" }}>
                  <HoverCard style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderTop: `2px solid ${team.color}`,
                    padding: "1.25rem 1.5rem", cursor: "pointer",
                  }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.2)", marginBottom: "3px",
                    }}>{d.Driver?.nationality}</div>

                    <div style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "1.4rem", textTransform: "uppercase",
                      color: "white", letterSpacing: "-0.01em", lineHeight: 1,
                      marginBottom: "0.85rem",
                    }}>
                      {d.Driver?.givenName?.charAt(0)}.{" "}
                      <span style={{ color: team.color }}>{d.Driver?.familyName}</span>
                    </div>

                    <div style={{ display: "flex", gap: "1px", background: "rgba(255,255,255,0.04)" }}>
                      {[
                        { l: "Position", v: pos > 0 ? `P${pos}` : "—" },
                        { l: "Points",   v: pts  },
                        { l: "Wins",     v: wins },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ flex: 1, background: "#080808", padding: "0.5rem 0.75rem" }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.38rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "2px" }}>{l}</div>
                          <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", color: "white" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </HoverCard>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Race results table ────────────────────────────────────────────── */}
      {raceSeries.length > 0 && (
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1rem,4vw,1.5rem) 3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "2.5rem 0 1rem" }}>
            <div style={{ width: "16px", height: "2px", background: "rgba(255,255,255,0.2)" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
            }}>2026 Race Results</span>
          </div>

          {/* Hide the Drivers pill column on mobile — too cramped */}
          <style>{`
            @media (max-width: 640px) {
              .race-col-hide-mobile { display: none !important; }
              .race-grid { grid-template-columns: 2.5rem 1fr 4rem 4rem !important; }
            }
          `}</style>

          <div style={{ border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>

            {/* Header */}
            <div
              className="race-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "3rem 1fr 5rem 5rem 5rem",
                padding: "0.65rem 1.25rem",
                background: "#080808",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {["Rnd", "Grand Prix", "Best Pos", "Points"].map(h => (
                <div key={h} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                }}>{h}</div>
              ))}
              <div className="race-col-hide-mobile" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
              }}>Drivers</div>
            </div>

            {raceSeries.map((race: {
              points: number; bestPos: number;
              round: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined;
              name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined;
              results: any[];
            }, i: Key | null | undefined) => {
              const hasPts = race.points > 0;
              const isWin  = race.bestPos === 1;

              return (
                <div
                  key={i}
                  className="race-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3rem 1fr 5rem 5rem 5rem",
                    alignItems: "center",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    borderLeft: isWin
                      ? `2px solid ${team.color}`
                      : hasPts
                      ? "2px solid rgba(255,255,255,0.08)"
                      : "2px solid transparent",
                    background: isWin ? `${team.color}08` : "transparent",
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>R{race.round}</span>

                  <span style={{
                    fontFamily: "'Russo One', sans-serif", fontSize: "0.82rem",
                    textTransform: "uppercase",
                    color: isWin ? "white" : "rgba(255,255,255,0.7)",
                    letterSpacing: "-0.01em",
                  }}>{race.name}</span>

                  <span style={{
                    fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem",
                    color: race.bestPos === 1 ? "#FFD700" : race.bestPos && race.bestPos <= 3 ? "#C0C0C0" : "rgba(255,255,255,0.45)",
                  }}>{race.bestPos ? `P${race.bestPos}` : "—"}</span>

                  <span style={{
                    fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem",
                    color: hasPts ? team.color : "rgba(255,255,255,0.2)",
                  }}>{race.points > 0 ? `+${race.points}` : "0"}</span>

                  {/* Driver codes hidden on mobile */}
                  <div className="race-col-hide-mobile" style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {race.results.map((r: any, j: number) => (
                      <span key={j} style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                        padding: "1px 4px", background: "rgba(255,255,255,0.05)",
                      }}>{r.driverCode}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: "0 clamp(1rem,4vw,1.5rem) 3rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "1.5rem",
      }}>
        <Link href="/teams" style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
        }}>← All Constructors</Link>
      </div>
    </main>
  );
}