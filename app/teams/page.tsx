/**
 * TeamsPage — Constructor Standings page.
 *
 * Data:  fetched from Jolpica API at build-time, enriched with local constructors.json
 *        (which holds team colours, base city, founding year, championships).
 *
 * Layout (responsive):
 *   1. Hero section (title, season overline, key stats strip)
 *   2. Top 3 podium cards (stack vertically on mobile, row on desktop)
 *   3. Full standings table (horizontal scroll on mobile, fixed layout on desktop)
 *   4. Back link
 *
 * Mobile adaptations:
 *   - Table becomes horizontally scrollable (overflow-x-auto)
 *   - Podium cards stack in column on mobile, row on md+
 *   - Stats strip wraps properly
 *   - Padding and font sizes scale down
 */

import Link from "next/link";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";

/* IDs of the 10 current F1 constructors — used as a fallback filter */
const CURRENT_CONSTRUCTOR_IDS = [
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

export default async function TeamsPage() {
  /* Fetch live standings; fall back to empty array on error */
  let standings: any[] = [];
  try {
    standings = await getConstructorStandings("current");
  } catch {
    /* standings remains [] */
  }

  /* Merge API standings with local enrichment data */
  const teams =
    standings.length > 0
      ? standings.map((s: any) => {
          /* Find matching local record by id or partial name match */
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
      : /* Fallback: static data from JSON when API is unavailable */
        constructorsData.map((c, i) => ({
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

  /* Filter to current-grid constructors only */
  const currentTeams = teams.filter((t) =>
    standings.length > 0
      ? true
      : CURRENT_CONSTRUCTOR_IDS.includes(t.constructorId),
  );

  /* Pre-compute total wins for the stats strip */
  const totalWins =
    standings.length > 0
      ? standings.reduce(
          (sum: number, t: any) => sum + (parseInt(t.wins) || 0),
          0,
        )
      : null;

  return (
    <main className="min-h-screen bg-[#060606]">
      {/* ── Hero Section (responsive) ──────────────────────────────────── */}
      <section className="relative border-b border-white/10 overflow-hidden">
        {/* Red top line */}
        <div className="h-[2px] bg-[#E10600]" />

        {/* Giant F1 watermark - hidden on very small screens if needed, but scaled via clamp */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 md:pr-8 pointer-events-none select-none">
          <span className="font-display text-[clamp(6rem,15vw,18rem)] text-white/5 leading-none tracking-[-0.04em]">
            F1
          </span>
        </div>

        {/* Hero content container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {/* Back link */}
          <Link href="/" className="nav-back inline-flex mb-6 md:mb-8">
            ← Home
          </Link>

          {/* Season label */}
          <div className="label-overline mb-2">Formula 1 · 2026 Season</div>

          {/* Page title - responsive clamp */}
          <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] text-white leading-[0.92] tracking-[-0.02em] mb-4">
            CONSTRUCTOR
            <br />
            <span className="text-white/15">STANDINGS</span>
          </h1>

          <p className="text-white/40 text-sm md:text-base max-w-md mb-8">
            All ten Formula 1 constructors — points, wins, and championship
            history.
          </p>

          {/* Key stats strip - wraps on mobile */}
          <div className="inline-flex flex-wrap border-t border-white/10">
            {[
              { value: "10", label: "Teams" },
              {
                value: totalWins !== null ? String(totalWins) : "—",
                label: "Wins",
              },
              { value: "10", label: "Nations" },
            ].map((s, i) => (
              <div
                key={i}
                className="px-6 md:px-8 pt-4 first:pl-0 last:pr-0"
                style={{
                  borderRight:
                    i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div className="stat-value text-2xl md:text-3xl">{s.value}</div>
                <div className="stat-label text-[0.65rem] md:text-[0.7rem]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content container ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* ── Top 3 Podium Cards ──────────────────────────────────────── */}
        {currentTeams.length >= 3 && (
          <div className="mb-8 md:mb-12">
            <span className="label-overline block mb-4">Podium</span>
            {/* Responsive grid: column on mobile, 3 columns on medium screens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
              {currentTeams.slice(0, 3).map((team) => (
                <div
                  key={team.constructorId}
                  className="bg-[#0a0a0a] p-5 md:p-6 relative overflow-hidden"
                >
                  {/* Team-colour top bar */}
                  <div
                    className="h-0.5 mb-5"
                    style={{ background: team.color }}
                  />

                  {/* Position watermark */}
                  <div className="absolute right-4 top-4 font-display text-6xl md:text-7xl text-white/5 leading-none">
                    {team.position > 0 ? `P${team.position}` : "—"}
                  </div>

                  <div className="stat-label mb-1">{team.nationality}</div>
                  <div className="font-display text-lg md:text-xl text-white leading-tight mb-4">
                    {team.name}
                  </div>

                  {/* Stats grid inside card */}
                  <div className="grid grid-cols-3 gap-px bg-white/5">
                    {[
                      { label: "PTS", value: team.points, accent: false },
                      { label: "Wins", value: team.wins, accent: false },
                      {
                        label: "Titles",
                        value: team.championships,
                        accent: team.championships > 0,
                      },
                    ].map((s, i) => (
                      <div key={i} className="bg-[#0d0d0d] p-3 text-center">
                        <div
                          className="font-display text-xl md:text-2xl leading-tight"
                          style={{ color: s.accent ? "#E10600" : "white" }}
                        >
                          {s.value}
                        </div>
                        <div className="stat-label text-[0.6rem] md:text-[0.65rem]">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Full Standings Table (Horizontally Scrollable on Mobile) ── */}
        <span className="label-overline block mb-4">Full Standings</span>

        {/* Outer container for horizontal scroll on small screens */}
        <div className="overflow-x-auto border border-white/10">
          {/* Table header - min-width ensures scroll works */}
          <div className="min-w-[640px] md:min-w-0">
            {/* Header row */}
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem_5rem] bg-[#0d0d0d] border-b border-white/10 px-4 py-3">
              {["Pos", "Constructor", "Pts", "Wins", "Base", "Titles"].map(
                (h) => (
                  <div
                    key={h}
                    className="stat-label text-[0.65rem] md:text-[0.7rem] m-0"
                  >
                    {h}
                  </div>
                ),
              )}
            </div>

            {/* Data rows */}
            {currentTeams.map((team) => (
              <div
                key={team.constructorId}
                className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem_5rem] items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                {/* Position */}
                <div className="font-display text-base md:text-lg text-white">
                  {team.position || "—"}
                </div>

                {/* Constructor name + colour stripe */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-0.5 h-5 flex-shrink-0"
                    style={{ background: team.color }}
                  />
                  <div>
                    <div className="font-display text-sm md:text-base text-white leading-tight">
                      {team.name}
                    </div>
                    <div className="stat-label text-[0.6rem] md:text-[0.65rem] m-0">
                      {team.nationality}
                    </div>
                  </div>
                </div>

                {/* Points - red accent */}
                <div className="font-display text-base md:text-lg text-[#E10600]">
                  {team.points}
                </div>

                {/* Wins */}
                <div className="data-readout text-sm md:text-base text-white/60">
                  {team.wins}
                </div>

                {/* Base city */}
                <div className="data-readout text-xs md:text-sm text-white/40">
                  {team.base || "—"}
                </div>

                {/* Championships - red if >0 */}
                <div
                  className="font-display text-base md:text-lg"
                  style={{
                    color:
                      team.championships > 0
                        ? "#E10600"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {team.championships}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back link at bottom */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <Link href="/" className="nav-back">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
