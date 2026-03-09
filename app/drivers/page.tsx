"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDriverStandings } from "@/lib/hooks/useDrivers";

const currentYear = new Date().getFullYear();
const SEASONS = Array.from(
  { length: currentYear - 1950 + 1 },
  (_, i) => currentYear - i,
);

const podiumColors = [
  {
    bar: "#C9A84C",
    badge: "rgba(201,168,76,0.15)",
    badgeBorder: "rgba(201,168,76,0.3)",
    text: "#C9A84C",
  },
  {
    bar: "#9BA5B2",
    badge: "rgba(155,165,178,0.12)",
    badgeBorder: "rgba(155,165,178,0.25)",
    text: "#9BA5B2",
  },
  {
    bar: "#A0674A",
    badge: "rgba(160,103,74,0.15)",
    badgeBorder: "rgba(160,103,74,0.3)",
    text: "#A0674A",
  },
];

export default function DriversPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const { data: drivers, isLoading } = useDriverStandings();
  const [seasonDrivers, setSeasonDrivers] = useState<any[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [displaySeason, setDisplaySeason] = useState(currentYear.toString());

  const fetchSeasonStandings = async (season: string) => {
    try {
      const res = await fetch(
        `https://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`,
        { cache: "force-cache" },
      );
      const data = await res.json();
      return (
        data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || []
      );
    } catch {
      return [];
    }
  };

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

  const isDataLoading =
    (selectedSeason === "current" && isLoading) || seasonLoading;
  const quickYears = [2024, 2023, 2022, 2021, 2020];

  return (
    <main className="min-h-screen" style={{ background: "#080808" }}>
      {/* Hero */}
      <section className="relative overflow-hidden hero-bg py-20 lg:py-28">
        <div className="relative max-w-7xl mx-auto px-6">
          <Link href="/">
            <button className="btn-ghost mb-8 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M11 6H1M6 11L1 6l5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Home
            </button>
          </Link>
          <span className="label-overline block mb-4">Championship</span>
          <h1
            className="text-white leading-none"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3.5rem,10vw,7rem)",
              lineHeight: 0.92,
              textTransform: "uppercase",
            }}
          >
            Driver <span style={{ color: "#E10600" }}>Standings</span>
          </h1>
          <p className="text-white/40 mt-4 text-base">
            {displaySeason} Championship Positions
          </p>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #080808)",
          }}
        />
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Season selector */}
        <div
          className="mb-10 relative overflow-hidden"
          style={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />
          <div className="p-6">
            <span className="label-overline block mb-4">Select Season</span>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setSelectedSeason("current")}
                className={
                  selectedSeason === "current" ? "btn-primary" : "btn-ghost"
                }
                style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
              >
                Current
              </button>
              {quickYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedSeason(year.toString())}
                  className={
                    selectedSeason === year.toString()
                      ? "btn-primary"
                      : "btn-ghost"
                  }
                  style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                >
                  {year}
                </button>
              ))}
              <select
                value={
                  selectedSeason === "current" ||
                  quickYears.includes(Number(selectedSeason))
                    ? ""
                    : selectedSeason
                }
                onChange={(e) =>
                  e.target.value && setSelectedSeason(e.target.value)
                }
                className="px-4 py-2 text-white/60 focus:outline-none focus:ring-0 text-sm cursor-pointer"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 0,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                }}
              >
                <option value="">More years...</option>
                {SEASONS.map((year) => (
                  <option
                    key={year}
                    value={year.toString()}
                    style={{ background: "#141414" }}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="data-readout">Loading standings...</p>
          </div>
        ) : seasonDrivers.length === 0 ? (
          <div
            className="py-20 text-center"
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#111",
            }}
          >
            <p
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              No data available for {displaySeason}
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {seasonDrivers.length >= 3 && (
              <div className="mb-10">
                <span className="label-overline block mb-6">Podium</span>
                <div
                  className="grid md:grid-cols-3 gap-0"
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRight: "none",
                  }}
                >
                  {seasonDrivers.slice(0, 3).map((standing, index) => {
                    const driver = standing.Driver;
                    const team = standing.Constructors[0]?.name || "Unknown";
                    const col = podiumColors[index];
                    return (
                      <Link
                        key={driver.driverId}
                        href={`/drivers/${driver.driverId}`}
                        className="block group"
                      >
                        <div
                          className="relative overflow-hidden h-full transition-colors duration-200"
                          style={{
                            borderRight: "1px solid rgba(255,255,255,0.07)",
                            background: "#111",
                          }}
                        >
                          <div
                            className="h-[3px]"
                            style={{ background: col.bar }}
                          />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{ background: `${col.badge}` }}
                          />
                          <div
                            className="absolute top-4 right-5 font-display font-black pointer-events-none select-none leading-none"
                            style={{
                              fontFamily: "'Barlow Condensed'",
                              fontWeight: 900,
                              fontSize: "6rem",
                              color: `${col.bar}0d`,
                              lineHeight: 1,
                            }}
                          >
                            {driver.permanentNumber || index + 1}
                          </div>
                          <div className="p-7 relative">
                            <div
                              className="inline-flex items-center mb-5 px-2 py-1"
                              style={{
                                background: col.badge,
                                border: `1px solid ${col.badgeBorder}`,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Barlow Condensed'",
                                  fontWeight: 700,
                                  fontSize: "0.625rem",
                                  letterSpacing: "0.15em",
                                  textTransform: "uppercase",
                                  color: col.text,
                                }}
                              >
                                P{standing.position}
                              </span>
                            </div>
                            <div
                              style={{
                                fontFamily: "'Barlow Condensed'",
                                fontWeight: 600,
                                fontSize: "1.05rem",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.4)",
                                lineHeight: 1,
                              }}
                            >
                              {driver.givenName}
                            </div>
                            <div
                              style={{
                                fontFamily: "'Barlow Condensed'",
                                fontWeight: 900,
                                fontSize: "2.2rem",
                                textTransform: "uppercase",
                                color: "white",
                                lineHeight: 1,
                              }}
                            >
                              {driver.familyName}
                            </div>
                            <div className="data-readout mt-2 mb-5">{team}</div>
                            <div
                              className="grid grid-cols-2 gap-0"
                              style={{
                                border: "1px solid rgba(255,255,255,0.07)",
                              }}
                            >
                              {[
                                { val: standing.points, lab: "PTS" },
                                { val: standing.wins, lab: "Wins" },
                              ].map((s, i) => (
                                <div
                                  key={i}
                                  className="py-3 text-center"
                                  style={{
                                    borderRight:
                                      i === 0
                                        ? "1px solid rgba(255,255,255,0.07)"
                                        : "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontFamily: "'Barlow Condensed'",
                                      fontWeight: 900,
                                      fontSize: "1.5rem",
                                      color: col.text,
                                      lineHeight: 1,
                                    }}
                                  >
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

            {/* Full standings list */}
            <div>
              <span className="label-overline block mb-6">
                {seasonDrivers.length > 3 ? "Full Standings" : "Standings"}
              </span>
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderBottom: "none",
                }}
              >
                {(seasonDrivers.length > 3
                  ? seasonDrivers.slice(3)
                  : seasonDrivers
                ).map((standing) => {
                  const driver = standing.Driver;
                  const team = standing.Constructors[0]?.name || "Unknown";
                  return (
                    <Link
                      key={driver.driverId}
                      href={`/drivers/${driver.driverId}`}
                      className="block group"
                    >
                      <div
                        className="flex items-center gap-5 px-6 py-4 border-b transition-colors duration-150 group-hover:bg-white/[0.02]"
                        style={{
                          borderColor: "rgba(255,255,255,0.07)",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {/* Position */}
                        <div className="w-12 text-center">
                          <div
                            style={{
                              fontFamily: "'Barlow Condensed'",
                              fontWeight: 900,
                              fontSize: "1.5rem",
                              color: "white",
                              lineHeight: 1,
                            }}
                          >
                            {standing.position}
                          </div>
                        </div>

                        <div
                          className="w-px h-8"
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        />

                        {/* Driver info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span
                              style={{
                                fontFamily: "'Barlow Condensed'",
                                fontWeight: 800,
                                fontSize: "1.15rem",
                                textTransform: "uppercase",
                                color: "white",
                              }}
                            >
                              {driver.givenName} {driver.familyName}
                            </span>
                            <span className="data-readout">
                              #{driver.permanentNumber || "—"}
                            </span>
                          </div>
                          <div className="data-readout">{team}</div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 text-right">
                          <div>
                            <div
                              style={{
                                fontFamily: "'Barlow Condensed'",
                                fontWeight: 900,
                                fontSize: "1.4rem",
                                color: "#E10600",
                                lineHeight: 1,
                              }}
                            >
                              {standing.points}
                            </div>
                            <div className="stat-label">PTS</div>
                          </div>
                          <div className="hidden sm:block">
                            <div
                              style={{
                                fontFamily: "'Barlow Condensed'",
                                fontWeight: 900,
                                fontSize: "1.4rem",
                                color: "white",
                                lineHeight: 1,
                              }}
                            >
                              {standing.wins}
                            </div>
                            <div className="stat-label">Wins</div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-white/15 group-hover:text-white/40 transition-colors hidden sm:block">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M1 6h10M6 1l5 5-5 5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
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
