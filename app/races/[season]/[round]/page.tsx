import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaceResults, getQualifyingResults } from "@/lib/api/jolpica";

export default async function RaceDetailPage({
  params,
}: {
  params: { season: string; round: string };
}) {
  const [raceResults, qualifyingResults] = await Promise.allSettled([
    getRaceResults(params.season, params.round),
    getQualifyingResults(params.season, params.round),
  ]);

  const race = raceResults.status === "fulfilled" ? raceResults.value : null;
  const qualifying = qualifyingResults.status === "fulfilled" ? qualifyingResults.value : null;

  if (!race) notFound();

  const TEAM_COLORS: Record<string, string> = {
    mercedes: "#00D2BE", ferrari: "#E8002D", red_bull: "#3671C6",
    mclaren: "#FF8000", alpine: "#FF87BC", aston_martin: "#229971",
    williams: "#64C4FF", haas: "#B6BABD", sauber: "#52E252", rb: "#6692FF",
  };

  function getTeamColor(teamName: string): string {
    const lower = teamName.toLowerCase();
    for (const [key, color] of Object.entries(TEAM_COLORS)) {
      if (lower.includes(key)) return color;
    }
    return "#E10600";
  }

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <div style={{ height: "2px", background: "#E10600" }} />

      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", paddingRight: "2rem", pointerEvents: "none", overflow: "hidden" }}>
          <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(6rem, 16vw, 14rem)", color: "rgba(255,255,255,0.02)", lineHeight: 1 }}>R{params.round}</span>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <Link href="/calendar" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Calendar</Link>

          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600" }}>{params.season} · Round {params.round}</span>
          </div>

          <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)", color: "white", lineHeight: 0.95, letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}>
            {race.raceName?.toUpperCase()}
          </h1>

          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
            {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country} · {new Date(race.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Race Results */}
        {race.Results && race.Results.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Race Results</span>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "3rem 1fr 8rem 5rem 5rem 6rem", padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d" }}>
                {["Pos", "Driver", "Team", "Grid", "Laps", "Points"].map((h) => (
                  <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{h}</div>
                ))}
              </div>
              {race.Results.map((result: any) => {
                const pos = parseInt(result.position);
                const isWin = pos === 1;
                const isPodium = pos <= 3;
                const teamColor = getTeamColor(result.Constructor?.name || "");
                return (
                  <div key={result.position} style={{ display: "grid", gridTemplateColumns: "3rem 1fr 8rem 5rem 5rem 6rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: isWin ? "#FFD700" : isPodium ? "#FF8C00" : "white" }}>{result.position}</div>
                    <div>
                      <Link href={`/drivers/${result.Driver?.driverId}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", color: "white", lineHeight: 1.1 }}>{result.Driver?.givenName} {result.Driver?.familyName}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{result.status}</div>
                      </Link>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "2px", height: "14px", background: teamColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{result.Constructor?.name}</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{result.grid}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{result.laps}</div>
                    <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.9rem", color: parseFloat(result.points) > 0 ? "#E10600" : "rgba(255,255,255,0.25)" }}>{result.points}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Qualifying Results */}
        {qualifying?.QualifyingResults && qualifying.QualifyingResults.length > 0 && (
          <div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Qualifying</span>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "3rem 1fr 8rem 6rem 6rem 6rem", padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d" }}>
                {["Pos", "Driver", "Team", "Q1", "Q2", "Q3"].map((h) => (
                  <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{h}</div>
                ))}
              </div>
              {qualifying.QualifyingResults.map((result: any) => {
                const teamColor = getTeamColor(result.Constructor?.name || "");
                const isPole = result.position === "1";
                return (
                  <div key={result.position} style={{ display: "grid", gridTemplateColumns: "3rem 1fr 8rem 6rem 6rem 6rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: isPole ? "#FFD700" : "white" }}>{result.position}</div>
                    <div>
                      <Link href={`/drivers/${result.Driver?.driverId}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", color: "white" }}>{result.Driver?.givenName} {result.Driver?.familyName}</div>
                      </Link>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "2px", height: "14px", background: teamColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{result.Constructor?.name}</span>
                    </div>
                    {["Q1", "Q2", "Q3"].map((q) => (
                      <div key={q} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: result[q] ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)" }}>{result[q] || "—"}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/calendar" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Back to Calendar</Link>
        </div>
      </div>
    </main>
  );
}