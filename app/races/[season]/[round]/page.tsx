/**
 * RaceDetailPage – Displays race results and qualifying for a specific F1 race.
 *
 * Features:
 * - Race header with name, location, date, round watermark
 * - Race results table (position, driver, team, grid, laps, points)
 * - Qualifying results table (position, driver, team, Q1, Q2, Q3)
 * - Responsive tables with horizontal scroll on mobile
 * - Team colour accents
 * - Links to driver profiles
 * - Back navigation to calendar
 */

import Link from "next/link";
import { getRaceResults, getQualifyingResults, getRaceSchedule } from "@/lib/api/jolpica";

// Team colour mapping for constructor accents
const TEAM_COLORS: Record<string, string> = {
  mercedes: "#00D2BE",
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  alpine: "#FF87BC",
  aston_martin: "#229971",
  williams: "#64C4FF",
  haas: "#B6BABD",
  sauber: "#52E252",
  rb: "#6692FF",
};

function getTeamColor(teamName: string): string {
  const lower = teamName.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#E10600";
}

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ season: string; round: string }>;
}) {
  const { season, round } = await params;

  // Fetch all required data in parallel
  const [raceResults, qualifyingResults, scheduleResult] = await Promise.allSettled([
    getRaceResults(season, round),
    getQualifyingResults(season, round),
    getRaceSchedule(season),
  ]);

  const race = raceResults.status === "fulfilled" ? raceResults.value : null;
  const qualifying = qualifyingResults.status === "fulfilled" ? qualifyingResults.value : null;
  const schedule = scheduleResult.status === "fulfilled" ? scheduleResult.value : [];
  const scheduleRace = schedule?.find((r: any) => r.round === round);
  const raceInfo = race || scheduleRace;

  // Early return if no race info found
  if (!raceInfo) {
    return (
      <main className="min-h-screen bg-[#060606] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/30 text-sm tracking-wider">Race not found</p>
          <Link
            href="/calendar"
            className="text-[#E10600] text-xs font-semibold tracking-[0.15em] uppercase hover:underline"
          >
            ← Calendar
          </Link>
        </div>
      </main>
    );
  }

  const hasResults = race?.Results && race.Results.length > 0;
  const hasQualifying = qualifying?.QualifyingResults && qualifying.QualifyingResults.length > 0;
  const raceDate = raceInfo.date ? new Date(raceInfo.date) : null;

  return (
    <main className="min-h-screen bg-[#060606]">
      {/* Top red line */}
      <div className="h-[2px] bg-[#E10600]" />

      {/* Hero section */}
      <section className="relative border-b border-white/10 overflow-hidden">
        {/* Round watermark */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 md:pr-8 pointer-events-none select-none">
          <span className="font-display text-[clamp(4rem,15vw,14rem)] text-white/5 leading-none">
            R{round}
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 text-white/40 text-xs uppercase tracking-[0.15em] mb-6 hover:text-white/70 transition"
          >
            ← Calendar
          </Link>

          {/* Season & round label */}
          <div className="mb-2">
            <span className="text-[#E10600] text-[0.7rem] md:text-xs font-semibold tracking-[0.28em] uppercase">
              {season} · Round {round}
            </span>
          </div>

          {/* Race name */}
          <h1 className="font-display text-[clamp(1.8rem,6vw,4rem)] text-white leading-[0.95] tracking-[-0.02em] mb-3">
            {raceInfo.raceName?.toUpperCase()}
          </h1>

          {/* Location and date */}
          <p className="text-white/40 text-sm md:text-base tracking-wide">
            {raceInfo.Circuit?.Location?.locality}, {raceInfo.Circuit?.Location?.country}
            {raceDate &&
              ` · ${raceDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`}
          </p>
        </div>
      </section>

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* No results placeholder */}
        {!hasResults && !hasQualifying && (
          <div className="py-16 text-center border border-white/10 bg-[#0a0a0a]">
            <div className="font-display text-sm uppercase tracking-wider text-white/20 mb-2">
              No Results Yet
            </div>
            <p className="text-white/20 text-sm">
              Results will appear here after the race weekend.
            </p>
          </div>
        )}

        {/* Race Results Section */}
        {hasResults && (
          <div className="mb-12">
            <span className="label-overline block mb-4">Race Results</span>

            {/* Horizontal scroll container for mobile */}
            <div className="overflow-x-auto border border-white/10">
              <div className="min-w-[640px]">
                {/* Table header */}
                <div className="grid grid-cols-[3rem_1fr_8rem_4rem_4rem_5rem] bg-[#0d0d0d] border-b border-white/10 px-4 py-3">
                  {["Pos", "Driver", "Team", "Grid", "Laps", "Pts"].map((h) => (
                    <div
                      key={h}
                      className="text-white/30 text-[0.65rem] uppercase tracking-wider font-semibold"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Table rows */}
                {race.Results.map((result: any) => {
                  const pos = parseInt(result.position);
                  const isWin = pos === 1;
                  const isPodium = pos <= 3;
                  const teamColor = getTeamColor(result.Constructor?.name || "");
                  return (
                    <div
                      key={result.position}
                      className="grid grid-cols-[3rem_1fr_8rem_4rem_4rem_5rem] items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Position */}
                      <div
                        className="font-display text-base"
                        style={{
                          color: isWin ? "#FFD700" : isPodium ? "#FF8C00" : "white",
                        }}
                      >
                        {result.position}
                      </div>

                      {/* Driver info with link */}
                      <div>
                        <Link
                          href={`/drivers/${result.Driver?.driverId}`}
                          className="no-underline hover:opacity-80 transition"
                        >
                          <div className="font-display text-sm text-white leading-tight">
                            {result.Driver?.givenName} {result.Driver?.familyName}
                          </div>
                          <div className="font-mono text-[0.6rem] text-white/40">
                            {result.status}
                          </div>
                        </Link>
                      </div>

                      {/* Team with colour stripe */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-0.5 h-3 flex-shrink-0"
                          style={{ background: teamColor }}
                        />
                        <span className="text-white/50 text-xs">
                          {result.Constructor?.name}
                        </span>
                      </div>

                      {/* Grid, Laps, Points */}
                      <div className="font-mono text-sm text-white/50">
                        {result.grid}
                      </div>
                      <div className="font-mono text-sm text-white/50">
                        {result.laps}
                      </div>
                      <div
                        className="font-display text-sm"
                        style={{
                          color:
                            parseFloat(result.points) > 0
                              ? "#E10600"
                              : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {result.points}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Qualifying Section */}
        {hasQualifying && (
          <div>
            <span className="label-overline block mb-4">Qualifying</span>

            <div className="overflow-x-auto border border-white/10">
              <div className="min-w-[640px]">
                {/* Header */}
                <div className="grid grid-cols-[3rem_1fr_7rem_5.5rem_5.5rem_5.5rem] bg-[#0d0d0d] border-b border-white/10 px-4 py-3">
                  {["Pos", "Driver", "Team", "Q1", "Q2", "Q3"].map((h) => (
                    <div
                      key={h}
                      className="text-white/30 text-[0.65rem] uppercase tracking-wider font-semibold"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {qualifying.QualifyingResults.map((result: any) => {
                  const teamColor = getTeamColor(result.Constructor?.name || "");
                  const isPole = result.position === "1";
                  return (
                    <div
                      key={result.position}
                      className="grid grid-cols-[3rem_1fr_7rem_5.5rem_5.5rem_5.5rem] items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Position */}
                      <div
                        className="font-display text-base"
                        style={{ color: isPole ? "#FFD700" : "white" }}
                      >
                        {result.position}
                      </div>

                      {/* Driver */}
                      <div>
                        <Link
                          href={`/drivers/${result.Driver?.driverId}`}
                          className="no-underline hover:opacity-80 transition"
                        >
                          <div className="font-display text-sm text-white">
                            {result.Driver?.givenName} {result.Driver?.familyName}
                          </div>
                        </Link>
                      </div>

                      {/* Team */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-0.5 h-3 flex-shrink-0"
                          style={{ background: teamColor }}
                        />
                        <span className="text-white/50 text-xs">
                          {result.Constructor?.name}
                        </span>
                      </div>

                      {/* Q1, Q2, Q3 times */}
                      {["Q1", "Q2", "Q3"].map((q) => (
                        <div
                          key={q}
                          className="font-mono text-sm"
                          style={{
                            color: result[q]
                              ? "rgba(255,255,255,0.6)"
                              : "rgba(255,255,255,0.15)",
                          }}
                        >
                          {result[q] || "—"}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom back link */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <Link
            href="/calendar"
            className="text-white/40 text-xs uppercase tracking-[0.15em] hover:text-white/70 transition"
          >
            ← Back to Calendar
          </Link>
        </div>
      </div>
    </main>
  );
}