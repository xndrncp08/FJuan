// app/teams/[constructorId]/page.tsx — Constructor Profile
//
// Server component — deep-dive page for a single constructor.
// Fetches standings, race results, and driver standings in parallel.
//
// Visual DNA matches the Circuits page hero:
//   dot-grid texture · horizontal speed lines · diagonal slash
//   radial team-colour glow · ghost team name watermark · scan sweep
//   pulse dot overline · wipe-in bottom edge · left accent bar
//   staggered slide-up reveals on all content blocks
//
// Responsive strategy:
//   - Stats strip scrolls horizontally on mobile (overflow-x: auto, no scrollbar)
//   - Driver cards: auto-fit minmax(240px) → 1 col on phone, 2 on tablet+
//   - Race results table hides "Drivers" column on mobile (≤640px)
//   - Breadcrumb flex-wraps gracefully on small screens

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
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
  AwaitedReactNode,
  Key,
} from "react";

interface Props {
  params: Promise<{ constructorId: string }>;
}

export default async function ConstructorProfilePage({ params }: Props) {
  const { constructorId } = await params;

  // 404 immediately if the ID isn't in our local enrichment data
  const local = constructorsData.find((c) => c.id === constructorId);
  if (!local) notFound();

  const currentYear = new Date().getFullYear().toString();

  // ── Parallel data fetching — all three calls fire simultaneously ───────────
  const [standings, raceResults, driverStandings] = await Promise.all([
    getConstructorStandings("current").catch(() => []),
    getConstructorResults(constructorId, currentYear).catch(() => []),
    getDriverStandings("current").catch(() => []),
  ]);

  // ── Merge API standings with local enrichment data ─────────────────────────
  const standingEntry = standings.find(
    (s: any) => s.Constructor?.constructorId === constructorId,
  );

  const team = {
    constructorId,
    name: standingEntry?.Constructor?.name ?? local.name,
    nationality: standingEntry?.Constructor?.nationality ?? local.nationality,
    position: standingEntry ? parseInt(standingEntry.position) : null,
    points: standingEntry ? parseFloat(standingEntry.points) : 0,
    wins: standingEntry ? parseInt(standingEntry.wins) : 0,
    championships: local.championships,
    color: local.color,
    base: local.base,
    founded: local.founded,
  };

  // Filter driver standings to only those racing for this constructor
  const teamDrivers = driverStandings.filter((d: any) =>
    d.Constructors?.some((c: any) => c.constructorId === constructorId),
  );

  // ── Build race series — one entry per completed race ──────────────────────
  const raceSeries = (raceResults ?? []).map((race: any) => {
    // Sum points across both drivers for this race
    const pts = (race.Results ?? []).reduce(
      (s: number, r: any) => s + parseFloat(r.points ?? 0),
      0,
    );
    const positions = (race.Results ?? []).map(
      (r: any) => parseInt(r.position) || 20,
    );
    const bestPos = positions.length ? Math.min(...positions) : null;

    return {
      round: parseInt(race.round),
      name:
        race.raceName?.replace(" Grand Prix", "").replace(" GP", "") ??
        `R${race.round}`,
      short: race.raceName?.split(" ")[0] ?? `R${race.round}`,
      points: pts,
      bestPos,
      results: (race.Results ?? []).map((r: any) => ({
        driverId: r.Driver?.driverId,
        driverCode:
          r.Driver?.code ?? r.Driver?.familyName?.slice(0, 3).toUpperCase(),
        position: parseInt(r.position) || null,
        points: parseFloat(r.points ?? 0),
        status: r.status,
      })),
    };
  });

  // Add running cumulative total used by the arc chart
  let cumPts = 0;
  const raceSeriesWithCum = raceSeries.map((r: { points: number }) => {
    cumPts += r.points;
    return { ...r, cumPoints: cumPts };
  });

  // ── Derived stats ─────────────────────────────────────────────────────────
  const completedRaces = raceSeries.filter(
    (r: { bestPos: number | null }) => r.bestPos !== null,
  ).length;
  const avgPoints =
    completedRaces > 0 ? (team.points / completedRaces).toFixed(1) : "—";
  const podiums = raceSeries.reduce(
    (
      s: number,
      r: {
        results: {
          filter: (arg0: (res: any) => boolean) => { length: number };
        };
      },
    ) => {
      return (
        s +
        r.results.filter((res: any) => res.position && res.position <= 3).length
      );
    },
    0,
  );

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>
      {/* ── Responsive stylesheet ─────────────────────────────────────────────
          Race results table column hiding lives here — can't use inline styles
          for media queries.                                                  */}
      <style>{`
        @keyframes profileSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes profileGhostDrift {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes profileSpeedLine {
          0%   { transform: translateX(-120%); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(130vw); opacity: 0; }
        }
        @keyframes profileScanSweep {
          from { transform: translateY(-100%); }
          to   { transform: translateY(2000%); }
        }
        @keyframes profilePulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.6; }
        }
        @keyframes profilePulseRing {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes profileEdgeWipe {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes profileAccentGrow {
          from { transform: scaleY(0); transform-origin: top; }
          to   { transform: scaleY(1); transform-origin: top; }
        }
        @keyframes profileStatReveal {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Hide stats scrollbar visually but keep it functional */
        .stats-scroll::-webkit-scrollbar { display: none; }

        /* Race results table: hide Drivers column on mobile — too cramped */
        @media (max-width: 640px) {
          .race-col-hide-mobile { display: none !important; }
          .race-grid { grid-template-columns: 2.5rem 1fr 4rem 4rem !important; }
        }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────────
          Same visual layer stack as the Circuits page hero, with the team
          colour substituted in place of the generic red where appropriate.  */}
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
        {/* Layer 1: dot-grid */}
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

        {/* Layer 2: speed lines — desync via varied durations */}
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
          ].map((line, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: line.top,
                left: "-120%",
                width: line.width,
                height: "1px",
                background: `linear-gradient(90deg, transparent 0%, ${team.color}${Math.round(
                  line.opacity * 3 * 255,
                )
                  .toString(16)
                  .padStart(
                    2,
                    "0",
                  )} 30%, rgba(255,255,255,${line.opacity}) 70%, transparent 100%)`,
                animation: `profileSpeedLine ${line.dur} linear ${line.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Layer 3: diagonal slash */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-5%",
            width: "45%",
            height: "140%",
            background: `linear-gradient(105deg, transparent 45%, ${team.color}08 45%, ${team.color}12 55%, transparent 55%)`,
            pointerEvents: "none",
          }}
        />

        {/* Layer 4: team-colour radial glow — replaces the generic red bloom */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "70%",
            height: "130%",
            background: `radial-gradient(ellipse at top right, ${team.color}20 0%, ${team.color}08 40%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Layer 5: ghost team name watermark — last word of the team name */}
        <div
          style={{
            position: "absolute",
            right: "-2%",
            bottom: "-15%",
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(6rem, 16vw, 16rem)",
            color: "transparent",
            WebkitTextStroke: `1px ${team.color}18`,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            animation: "profileGhostDrift 1.4s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {team.name.split(" ").pop()}
        </div>

        {/* Layer 6: scan lines + broadcast sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "80px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 50%, transparent 100%)",
              animation: "profileScanSweep 4s linear 1.5s infinite",
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
          {/* Breadcrumb — flex-wraps on small screens */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
              animation: "profileSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <Link
              href="/"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
            <span
              style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.6rem" }}
            >
              ·
            </span>
            <Link
              href="/teams"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                textDecoration: "none",
              }}
            >
              Constructors
            </Link>
            <span
              style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.6rem" }}
            >
              ·
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: team.color,
              }}
            >
              {team.name.split(" ")[0]}
            </span>
          </div>

          {/* Pulse dot + overline — team colour instead of red */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
              animation:
                "profileSlideUp 0.6s 0.05s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div style={{ position: "relative", width: "6px", height: "6px" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: team.color,
                  animation: "profilePulseCore 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  background: `${team.color}4d`,
                  animation: "profilePulseRing 2s ease-in-out infinite",
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
                color: team.color,
              }}
            >
              {team.nationality} · Est. {team.founded}
            </span>
          </div>

          {/* Team name */}
          <h1
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2rem, 7vw, 5.5rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.025em",
              textTransform: "uppercase",
              color: "white",
              margin: "0 0 0.5rem",
              animation:
                "profileSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {team.name}
          </h1>

          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 500,
              fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
              color: "rgba(255,255,255,0.3)",
              margin: "0 0 1.5rem",
              letterSpacing: "0.04em",
              maxWidth: "420px",
              animation:
                "profileSlideUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {team.base}
          </p>

          {/* Championship dot-matrix — one square per title, capped at 24 */}
          {team.championships > 0 && (
            <div
              style={{
                marginBottom: "1.5rem",
                animation:
                  "profileSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.44rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "6px",
                }}
              >
                {team.championships} World Constructor Championship
                {team.championships !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {Array.from({ length: Math.min(team.championships, 24) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "10px",
                        height: "10px",
                        background: team.color,
                        opacity: 0.55 + (i / team.championships) * 0.45,
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          )}

          {/* Stats strip — scrolls horizontally on mobile so separators stay intact */}
          <div
            className="stats-scroll"
            style={{
              display: "flex",
              overflowX: "auto",
              scrollbarWidth: "none",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              animation:
                "profileSlideUp 0.6s 0.25s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {[
              {
                value: String(team.championships),
                label: "WCC Titles",
                accent: true,
              },
              {
                value: String(team.points),
                label: "2026 Points",
                accent: false,
              },
              { value: String(team.wins), label: "2026 Wins", accent: false },
              { value: String(podiums), label: "Podiums", accent: false },
              { value: avgPoints, label: "Pts / Race", accent: false },
            ].map((s, i, arr) => (
              <div
                key={i}
                style={{
                  minWidth: "80px",
                  flexShrink: 0,
                  padding: "1rem clamp(1.25rem, 3vw, 2rem) 0",
                  paddingLeft: i === 0 ? 0 : undefined,
                  borderRight:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                  paddingRight:
                    i < arr.length - 1 ? "clamp(1.25rem, 3vw, 2rem)" : 0,
                  animation: `profileStatReveal 0.5s ${0.3 + i * 0.06}s cubic-bezier(0.16,1,0.3,1) both`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.2rem, 3vw, 2rem)",
                    color: s.accent ? team.color : "white",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.value || "—"}
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

        {/* Bottom edge line — wipes in from left */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, ${team.color} 0%, ${team.color}66 40%, transparent 70%)`,
            zIndex: 3,
            animation:
              "profileEdgeWipe 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />

        {/* Left vertical accent bar — team colour, grows downward */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "3px",
            height: "60%",
            background: `linear-gradient(180deg, ${team.color} 0%, transparent 100%)`,
            zIndex: 3,
            animation:
              "profileAccentGrow 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />
      </section>

      {/* ── Performance charts ────────────────────────────────────────────────
          Delegated to ConstructorProfileCharts (Recharts client component). */}
      <ConstructorProfileCharts
        raceSeries={raceSeriesWithCum}
        teamColor={team.color}
        teamName={team.name}
      />

      {/* ── Current drivers ───────────────────────────────────────────────────
          auto-fit minmax(240px) → 1 col on phone, 2 cols on tablet+         */}
      {teamDrivers.length > 0 && (
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 clamp(1rem,4vw,1.5rem)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              margin: "2.5rem 0 1rem",
            }}
          >
            <div
              style={{ width: "16px", height: "2px", background: team.color }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: team.color,
              }}
            >
              Current Drivers
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2px",
            }}
          >
            {teamDrivers.map((d: any) => {
              const pts = parseFloat(d.points) || 0;
              const pos = parseInt(d.position) || 0;
              const wins = parseInt(d.wins) || 0;

              return (
                <Link
                  key={d.Driver?.driverId}
                  href={`/drivers/${d.Driver?.driverId}`}
                  style={{ textDecoration: "none" }}
                >
                  <HoverCard
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderTop: `2px solid ${team.color}`,
                      padding: "1.25rem 1.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.44rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.2)",
                        marginBottom: "3px",
                      }}
                    >
                      {d.Driver?.nationality}
                    </div>

                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "1.4rem",
                        textTransform: "uppercase",
                        color: "white",
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                        marginBottom: "0.85rem",
                      }}
                    >
                      {d.Driver?.givenName?.charAt(0)}.{" "}
                      <span style={{ color: team.color }}>
                        {d.Driver?.familyName}
                      </span>
                    </div>

                    {/* 3-cell stat mini-grid */}
                    <div
                      style={{
                        display: "flex",
                        gap: "1px",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      {[
                        { l: "Position", v: pos > 0 ? `P${pos}` : "—" },
                        { l: "Points", v: pts },
                        { l: "Wins", v: wins },
                      ].map(({ l, v }) => (
                        <div
                          key={l}
                          style={{
                            flex: 1,
                            background: "#080808",
                            padding: "0.5rem 0.75rem",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.38rem",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.18)",
                              marginBottom: "2px",
                            }}
                          >
                            {l}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Russo One', sans-serif",
                              fontSize: "0.88rem",
                              color: "white",
                            }}
                          >
                            {v}
                          </div>
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

      {/* ── Race results table ────────────────────────────────────────────────
          "Drivers" column is hidden on mobile via .race-col-hide-mobile.
          Win rows get the team colour as a left border + faint background.  */}
      {raceSeries.length > 0 && (
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 clamp(1rem,4vw,1.5rem) 3rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              margin: "2.5rem 0 1rem",
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
                fontSize: "0.52rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              2026 Race Results
            </span>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
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
              {["Rnd", "Grand Prix", "Best Pos", "Points"].map((h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.44rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  {h}
                </div>
              ))}
              <div
                className="race-col-hide-mobile"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.44rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                Drivers
              </div>
            </div>

            {/* Data rows */}
            {raceSeries.map(
              (
                race: {
                  points: number;
                  bestPos: number;
                  round:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<any, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<AwaitedReactNode>
                    | null
                    | undefined;
                  name:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<any, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<AwaitedReactNode>
                    | null
                    | undefined;
                  results: any[];
                },
                i: Key | null | undefined,
              ) => {
                const hasPts = race.points > 0;
                const isWin = race.bestPos === 1;

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
                      // Win rows get team-colour left border + faint tinted background
                      borderLeft: isWin
                        ? `2px solid ${team.color}`
                        : hasPts
                          ? "2px solid rgba(255,255,255,0.08)"
                          : "2px solid transparent",
                      background: isWin ? `${team.color}08` : "transparent",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.2)",
                      }}
                    >
                      R{race.round}
                    </span>

                    <span
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.82rem",
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                        color: isWin ? "white" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {race.name}
                    </span>

                    {/* Position — gold for win, silver for podium */}
                    <span
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.88rem",
                        color:
                          race.bestPos === 1
                            ? "#FFD700"
                            : race.bestPos && race.bestPos <= 3
                              ? "#C0C0C0"
                              : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {race.bestPos ? `P${race.bestPos}` : "—"}
                    </span>

                    <span
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.88rem",
                        color: hasPts ? team.color : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {race.points > 0 ? `+${race.points}` : "0"}
                    </span>

                    {/* Driver codes — hidden on mobile */}
                    <div
                      className="race-col-hide-mobile"
                      style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                    >
                      {race.results.map((r: any, j: number) => (
                        <span
                          key={j}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.44rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.3)",
                            padding: "1px 4px",
                            background: "rgba(255,255,255,0.05)",
                          }}
                        >
                          {r.driverCode}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Back link */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(1rem,4vw,1.5rem) 3rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "1.5rem",
        }}
      >
        <Link
          href="/teams"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.52rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          ← All Constructors
        </Link>
      </div>
    </main>
  );
}
