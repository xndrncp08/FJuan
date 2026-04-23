/**
 * DriversPage — Championship Standings page with season selector.
 *
 * Features:
 *   - Season selector: "Current" button + recent year buttons + full year dropdown
 *   - Top 3: large podium cards with gold/silver/bronze accents
 *   - Full standings: compact list rows (position | driver | team | pts | wins)
 *   - Clicking any driver navigates to /drivers/[driverId]
 *
 * Data: live standings from Jolpica API via useDriverStandings hook (SWR);
 *       historical seasons fetched on demand via fetchSeasonStandings.
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDriverStandings } from "@/lib/hooks/useDrivers";

const currentYear = new Date().getFullYear();

/* Full season list for the dropdown — descending from current year to 1950 */
const SEASONS = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

/* Podium colour accents for positions 1–3 */
const PODIUM_COLORS = [
  { bar: "#C9A84C", badge: "rgba(201,168,76,0.15)",  badgeBorder: "rgba(201,168,76,0.3)",  text: "#C9A84C" },
  { bar: "#9BA5B2", badge: "rgba(155,165,178,0.12)", badgeBorder: "rgba(155,165,178,0.25)", text: "#9BA5B2" },
  { bar: "#A0674A", badge: "rgba(160,103,74,0.15)",  badgeBorder: "rgba(160,103,74,0.3)",  text: "#A0674A" },
];

/* Quick-access year buttons shown next to the "Current" button */
const QUICK_YEARS = [2025, 2024, 2023, 2022, 2021];

/* ─────────────────────────────────────────────────────────────────────────── */

/** Fetches driver standings for a historical season from Jolpica. */
async function fetchSeasonStandings(season: string) {
  try {
    const res  = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`, { cache: "force-cache" });
    const data = await res.json();
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function DriversPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [seasonDrivers,  setSeasonDrivers]  = useState<any[]>([]);
  const [seasonLoading,  setSeasonLoading]  = useState(false);
  const [displaySeason,  setDisplaySeason]  = useState(currentYear.toString());

  /* Live current-season standings via SWR */
  const { data: drivers, isLoading } = useDriverStandings();

  /* Load standings whenever selectedSeason changes */
  useEffect(() => {
    const load = async () => {
      if (selectedSeason === "current") {
        setSeasonDrivers(drivers || []);
        setDisplaySeason(currentYear.toString());
        setSeasonLoading(false);
      } else {
        setSeasonLoading(true);
        const data = await fetchSeasonStandings(selectedSeason);
        setSeasonDrivers(data);
        setDisplaySeason(selectedSeason);
        setSeasonLoading(false);
      }
    };
    load();
  }, [selectedSeason, drivers]);

  const isDataLoading = (selectedSeason === "current" && isLoading) || seasonLoading;

  return (
    <main className="min-h-screen" style={{ background: "#080808" }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden hero-bg py-20 lg:py-28">
        <div className="relative max-w-7xl mx-auto px-6">
          <Link href="/" className="nav-back" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Home
          </Link>

          <span className="label-overline block mb-4">Championship</span>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            fontSize: "clamp(3.5rem,10vw,7rem)", lineHeight: 0.92,
            textTransform: "uppercase", color: "white",
          }}>
            Driver <span style={{ color: "#E10600" }}>Standings</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.40)", marginTop: "1rem", fontSize: "1rem" }}>
            {displaySeason} Championship Positions
          </p>
        </div>

        {/* Fade to background */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #080808)" }} />
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Season selector panel ──────────────────────────────────── */}
        <div className="mb-10 relative overflow-hidden surface">
          {/* Red accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />
          <div className="p-6">
            <span className="label-overline block mb-4">Select Season</span>
            <div className="flex flex-wrap gap-2 items-center">

              {/* "Current" button */}
              <button
                onClick={() => setSelectedSeason("current")}
                className={selectedSeason === "current" ? "btn-primary" : "btn-ghost"}
                style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
              >
                Current
              </button>

              {/* Quick year buttons */}
              {QUICK_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedSeason(year.toString())}
                  className={selectedSeason === year.toString() ? "btn-primary" : "btn-ghost"}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                >
                  {year}
                </button>
              ))}

              {/* Full year dropdown for older seasons */}
              <select
                value={selectedSeason === "current" || QUICK_YEARS.includes(Number(selectedSeason)) ? "" : selectedSeason}
                onChange={(e) => e.target.value && setSelectedSeason(e.target.value)}
                className="px-4 py-2 text-white/60 focus:outline-none focus:ring-0 text-sm cursor-pointer"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 0,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600, letterSpacing: "0.06em",
                }}
              >
                <option value="">More years...</option>
                {SEASONS.map((year) => (
                  <option key={year} value={year.toString()} style={{ background: "#141414" }}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Loading state ────────────────────────────────────────────── */}
        {isDataLoading ? (
          <div className="loading-state">
            <div style={{
              width: "28px", height: "28px",
              border: "2px solid rgba(255,255,255,0.08)",
              borderTopColor: "#E10600",
              borderRadius: "50%",
              animation: "spin-ring 0.75s linear infinite",
            }} />
            <p className="data-readout">Loading standings...</p>
          </div>

        /* ── Empty state ─────────────────────────────────────────────── */
        ) : seasonDrivers.length === 0 ? (
          <div className="py-20 text-center surface">
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: "1.1rem", textTransform: "uppercase",
              letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)",
            }}>
              No data available for {displaySeason}
            </p>
          </div>

        /* ── Standings content ────────────────────────────────────────── */
        ) : (
          <>
            {/* Top 3 Podium cards */}
            {seasonDrivers.length >= 3 && (
              <div className="mb-10">
                <span className="label-overline block mb-6">Podium</span>
                <div
                  className="grid md:grid-cols-3"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", borderRight: "none" }}
                >
                  {seasonDrivers.slice(0, 3).map((standing, index) => {
                    const driver = standing.Driver;
                    const team   = standing.Constructors[0]?.name || "Unknown";
                    const col    = PODIUM_COLORS[index];
                    return (
                      <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} className="block group">
                        <div
                          className="relative overflow-hidden h-full"
                          style={{ borderRight: "1px solid rgba(255,255,255,0.07)", background: "#111" }}
                        >
                          {/* Podium-colour top bar */}
                          <div className="h-[3px]" style={{ background: col.bar }} />

                          {/* Hover wash in podium colour */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{ background: col.badge }}
                          />

                          {/* Driver number watermark */}
                          <div
                            className="absolute top-4 right-5 pointer-events-none select-none"
                            style={{
                              fontFamily: "'Barlow Condensed'", fontWeight: 900,
                              fontSize: "6rem", lineHeight: 1,
                              color: `${col.bar}0d`,
                            }}
                          >
                            {driver.permanentNumber || index + 1}
                          </div>

                          <div className="p-7 relative">
                            {/* Position badge */}
                            <div
                              className="inline-flex items-center mb-5 px-2 py-1"
                              style={{ background: col.badge, border: `1px solid ${col.badgeBorder}` }}
                            >
                              <span style={{
                                fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: "0.625rem",
                                letterSpacing: "0.15em", textTransform: "uppercase", color: col.text,
                              }}>
                                P{standing.position}
                              </span>
                            </div>

                            {/* Driver name */}
                            <div style={{
                              fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: "1.05rem",
                              textTransform: "uppercase", color: "rgba(255,255,255,0.4)", lineHeight: 1,
                            }}>
                              {driver.givenName}
                            </div>
                            <div style={{
                              fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: "2.2rem",
                              textTransform: "uppercase", color: "white", lineHeight: 1,
                            }}>
                              {driver.familyName}
                            </div>

                            <div className="data-readout mt-2 mb-5">{team}</div>

                            {/* PTS / Wins stats */}
                            <div className="grid grid-cols-2" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                              {[
                                { val: standing.points, lab: "PTS"  },
                                { val: standing.wins,   lab: "Wins" },
                              ].map((s, i) => (
                                <div
                                  key={i}
                                  className="py-3 text-center"
                                  style={{ borderRight: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                                >
                                  <div style={{
                                    fontFamily: "'Barlow Condensed'", fontWeight: 900,
                                    fontSize: "1.5rem", color: col.text, lineHeight: 1,
                                  }}>
                                    {s.val}
                                  </div>
                                  <div className="stat-label">{s.lab}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full standings list (positions 4+) */}
            <div>
              <span className="label-overline block mb-6">
                {seasonDrivers.length > 3 ? "Full Standings" : "Standings"}
              </span>

              <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none" }}>
                {(seasonDrivers.length > 3 ? seasonDrivers.slice(3) : seasonDrivers).map((standing) => {
                  const driver = standing.Driver;
                  const team   = standing.Constructors[0]?.name || "Unknown";
                  return (
                    <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} className="block group">
                      <div
                        className="data-row flex items-center gap-5 px-6 py-4"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {/* Position number */}
                        <div className="w-12 text-center">
                          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: "1.5rem", color: "white", lineHeight: 1 }}>
                            {standing.position}
                          </div>
                        </div>

                        {/* Vertical divider */}
                        <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.07)" }} />

                        {/* Driver info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span style={{
                              fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: "1.15rem",
                              textTransform: "uppercase", color: "white",
                            }}>
                              {driver.givenName} {driver.familyName}
                            </span>
                            <span className="data-readout">#{driver.permanentNumber || "—"}</span>
                          </div>
                          <div className="data-readout">{team}</div>
                        </div>

                        {/* Points + Wins stats */}
                        <div className="flex gap-8 text-right">
                          <div>
                            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: "1.4rem", color: "#E10600", lineHeight: 1 }}>
                              {standing.points}
                            </div>
                            <div className="stat-label">PTS</div>
                          </div>
                          <div className="hidden sm:block">
                            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: "1.4rem", color: "white", lineHeight: 1 }}>
                              {standing.wins}
                            </div>
                            <div className="stat-label">Wins</div>
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="text-white/15 group-hover:text-white/40 transition-colors hidden sm:block">
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
