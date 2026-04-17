/**
 * TeamsPage — Constructor Standings page.
 *
 * Data:  fetched from Jolpica API at build-time, enriched with local constructors.json
 *        (which holds team colours, base city, founding year, championships).
 *
 * Layout:
 *   1. Hero section (page title, season overline, key stats strip)
 *   2. Top 3 podium cards (coloured top bars matching team colours)
 *   3. Full standings table (position | constructor | pts | wins | base | titles)
 *   4. Back link
 */
import Link from "next/link";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";

/* IDs of the 10 current F1 constructors — used as a fallback filter */
const CURRENT_CONSTRUCTOR_IDS = [
  "ferrari", "mercedes", "red_bull", "mclaren", "alpine",
  "aston_martin", "williams", "haas", "rb", "sauber",
];

export default async function TeamsPage() {
  /* Fetch live standings; fall back to empty array on error */
  let standings: any[] = [];
  try {
    standings = await getConstructorStandings("current");
  } catch { /* standings remains [] */ }

  /* Merge API standings with local enrichment data */
  const teams = standings.length > 0
    ? standings.map((s: any) => {
        /* Find matching local record by id or partial name match */
        const local = constructorsData.find(c =>
          c.id === s.Constructor.constructorId ||
          s.Constructor.name.toLowerCase().includes(c.id.replace("_", " "))
        );
        return {
          constructorId:  s.Constructor.constructorId,
          name:           s.Constructor.name,
          nationality:    s.Constructor.nationality,
          position:       parseInt(s.position)  || 0,
          points:         parseFloat(s.points)  || 0,
          wins:           parseInt(s.wins)       || 0,
          championships:  local?.championships   ?? 0,
          color:          local?.color           ?? "#E10600",
          base:           local?.base            ?? "",
          founded:        local?.founded         ?? 0,
        };
      })
    /* Fallback: static data from JSON when API is unavailable */
    : constructorsData.map((c, i) => ({
        constructorId:  c.id,
        name:           c.name,
        nationality:    c.nationality,
        position:       i + 1,
        points:         0,
        wins:           0,
        championships:  c.championships,
        color:          c.color,
        base:           c.base,
        founded:        c.founded,
      }));

  /* Filter to current-grid constructors only */
  const currentTeams = teams.filter(t =>
    standings.length > 0 ? true : CURRENT_CONSTRUCTOR_IDS.includes(t.constructorId)
  );

  /* Pre-compute total wins for the stats strip */
  const totalWins = standings.length > 0
    ? standings.reduce((sum: number, t: any) => sum + (parseInt(t.wins) || 0), 0)
    : null;

  return (
    <main style={{ background: "#060606", minHeight: "100vh" }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ height: "2px", background: "#E10600" }} />

        {/* Giant watermark */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          display: "flex", alignItems: "center", paddingRight: "2rem",
          pointerEvents: "none", userSelect: "none", overflow: "hidden",
        }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(8rem, 20vw, 18rem)",
            color: "rgba(255,255,255,0.02)", lineHeight: 1, letterSpacing: "-0.04em",
          }}>F1</span>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          {/* Back navigation */}
          <Link href="/" className="nav-back" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            ← Home
          </Link>

          {/* Season overline */}
          <div className="label-overline" style={{ marginBottom: "0.5rem" }}>
            Formula 1 · 2026 Season
          </div>

          {/* Page title */}
          <h1 style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(3rem, 8vw, 6rem)", color: "white",
            lineHeight: 0.92, letterSpacing: "-0.02em", margin: "0 0 1.25rem",
          }}>
            CONSTRUCTOR<br />
            <span style={{ color: "rgba(255,255,255,0.15)" }}>STANDINGS</span>
          </h1>

          <p style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
            fontSize: "1rem", lineHeight: 1.7,
            color: "rgba(255,255,255,0.4)", maxWidth: "420px", margin: "0 0 2.5rem",
          }}>
            All ten Formula 1 constructors — points, wins, and championship history.
          </p>

          {/* Key stats strip */}
          <div style={{ display: "inline-grid", gridTemplateColumns: "repeat(3, auto)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { value: "10",                              label: "Teams" },
              { value: totalWins !== null ? String(totalWins) : "—", label: "Wins" },
              { value: "10",                              label: "Nations" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "1rem 2rem 0", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div className="stat-value" style={{ fontSize: "2rem" }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* ── Top 3 podium cards ──────────────────────────────────────── */}
        {currentTeams.length >= 3 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <span className="label-overline" style={{ display: "block", marginBottom: "1rem" }}>Podium</span>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px", background: "rgba(255,255,255,0.05)",
            }}>
              {currentTeams.slice(0, 3).map((team) => (
                <div
                  key={team.constructorId}
                  style={{ background: "#0a0a0a", padding: "1.5rem", position: "relative", overflow: "hidden" }}
                >
                  {/* Team-colour top bar */}
                  <div style={{ height: "3px", background: team.color, marginBottom: "1.25rem" }} />

                  {/* Position watermark */}
                  <div style={{
                    position: "absolute", right: "1rem", top: "1rem",
                    fontFamily: "'Russo One', sans-serif", fontSize: "5rem",
                    color: "rgba(255,255,255,0.025)", lineHeight: 1,
                  }}>
                    {team.position > 0 ? `P${team.position}` : "—"}
                  </div>

                  <div className="stat-label" style={{ marginBottom: "0.25rem" }}>{team.nationality}</div>
                  <div style={{
                    fontFamily: "'Russo One', sans-serif", fontSize: "1.15rem",
                    color: "white", lineHeight: 1.1, marginBottom: "1rem",
                  }}>
                    {team.name}
                  </div>

                  {/* PTS / Wins / Titles stat cells */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
                    {[
                      { label: "PTS",   value: team.points,        accent: false },
                      { label: "Wins",  value: team.wins,          accent: false },
                      { label: "Titles",value: team.championships,  accent: team.championships > 0 },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "#0d0d0d", padding: "0.75rem", textAlign: "center" }}>
                        <div style={{
                          fontFamily: "'Russo One', sans-serif", fontSize: "1.2rem",
                          color: s.accent ? "#E10600" : "white", lineHeight: 1,
                        }}>
                          {s.value}
                        </div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Full standings table ────────────────────────────────────── */}
        <span className="label-overline" style={{ display: "block", marginBottom: "1rem" }}>Full Standings</span>
        <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "3rem 1fr 5rem 5rem 6rem 5rem",
            padding: "0.6rem 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "#0d0d0d",
          }}>
            {["Pos", "Constructor", "Pts", "Wins", "Base", "Titles"].map((h) => (
              <div key={h} className="stat-label" style={{ margin: 0 }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {currentTeams.map((team) => (
            <div
              key={team.constructorId}
              className="data-row"
              style={{
                display: "grid",
                gridTemplateColumns: "3rem 1fr 5rem 5rem 6rem 5rem",
                padding: "0.9rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
              }}
            >
              {/* Position */}
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.1rem", color: "white" }}>
                {team.position || "—"}
              </div>

              {/* Constructor name + team-colour stripe */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "3px", height: "20px", background: team.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.9rem", color: "white", lineHeight: 1.1 }}>
                    {team.name}
                  </div>
                  <div className="stat-label" style={{ margin: 0 }}>{team.nationality}</div>
                </div>
              </div>

              {/* Points — red accent */}
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: "#E10600" }}>
                {team.points}
              </div>

              {/* Wins */}
              <div className="data-readout" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                {team.wins}
              </div>

              {/* Base city */}
              <div className="data-readout" style={{ color: "rgba(255,255,255,0.35)" }}>
                {team.base || "—"}
              </div>

              {/* Championships — red if > 0 */}
              <div style={{
                fontFamily: "'Russo One', sans-serif", fontSize: "0.95rem",
                color: team.championships > 0 ? "#E10600" : "rgba(255,255,255,0.3)",
              }}>
                {team.championships}
              </div>
            </div>
          ))}
        </div>

        {/* Back link */}
        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/" className="nav-back">← Home</Link>
        </div>
      </div>
    </main>
  );
}
