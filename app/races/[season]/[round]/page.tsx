import Link from "next/link";
import { getRaceResults, getQualifyingResults, getRaceSchedule } from "@/lib/api/jolpica";

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ season: string; round: string }>;
}) {
  const { season, round } = await params;

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

  if (!raceInfo) return (
    <main style={{ background: "#060606", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", color: "rgba(255,255,255,0.3)", fontSize: "1rem", letterSpacing: "0.1em" }}>Race not found</p>
        <Link href="/calendar" style={{ color: "#E10600", textDecoration: "none", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>← Calendar</Link>
      </div>
    </main>
  );

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

  const hasResults = race?.Results && race.Results.length > 0;
  const hasQualifying = qualifying?.QualifyingResults && qualifying.QualifyingResults.length > 0;
  const raceDate = raceInfo.date ? new Date(raceInfo.date) : null;

  return (
    <main style={{ background: "#060606", minHeight: "100vh" }}>
      <div style={{ height: "2px", background: "#E10600" }} />

      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", paddingRight: "2rem", pointerEvents: "none", overflow: "hidden" }}>
          <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(6rem, 16vw, 14rem)", color: "rgba(255,255,255,0.02)", lineHeight: 1 }}>R{round}</span>
        </div>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) 1.5rem" }}>
          <Link href="/calendar" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Calendar</Link>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600" }}>{season} · Round {round}</span>
          </div>
          <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(1.8rem, 5vw, 4rem)", color: "white", lineHeight: 0.95, letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}>
            {raceInfo.raceName?.toUpperCase()}
          </h1>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
            {raceInfo.Circuit?.Location?.locality}, {raceInfo.Circuit?.Location?.country}
            {raceDate && ` · ${raceDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) 1.5rem" }}>

        {!hasResults && !hasQualifying && (
          <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>No Results Yet</div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.2)" }}>Results will appear here after the race weekend.</p>
          </div>
        )}

        {/* Race Results */}
        {hasResults && (
          <div style={{ marginBottom: "3rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Race Results</span>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
              <div style={{ minWidth: "480px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "3rem 1fr 8rem 4rem 4rem 5rem", padding: "0.6rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d" }}>
                  {["Pos", "Driver", "Team", "Grid", "Laps", "Pts"].map((h) => (
                    <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{h}</div>
                  ))}
                </div>
                {race.Results.map((result: any) => {
                  const pos = parseInt(result.position);
                  const isWin = pos === 1;
                  const isPodium = pos <= 3;
                  const teamColor = getTeamColor(result.Constructor?.name || "");
                  return (
                    <div key={result.position} style={{ display: "grid", gridTemplateColumns: "3rem 1fr 8rem 4rem 4rem 5rem", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                      <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: isWin ? "#FFD700" : isPodium ? "#FF8C00" : "white" }}>{result.position}</div>
                      <div>
                        <Link href={`/drivers/${result.Driver?.driverId}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.82rem", color: "white", lineHeight: 1.1 }}>{result.Driver?.givenName} {result.Driver?.familyName}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>{result.status}</div>
                        </Link>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{ width: "2px", height: "12px", background: teamColor, flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>{result.Constructor?.name}</span>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{result.grid}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{result.laps}</div>
                      <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.85rem", color: parseFloat(result.points) > 0 ? "#E10600" : "rgba(255,255,255,0.25)" }}>{result.points}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Qualifying Results */}
        {hasQualifying && (
          <div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Qualifying</span>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
              <div style={{ minWidth: "480px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "3rem 1fr 7rem 5.5rem 5.5rem 5.5rem", padding: "0.6rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d" }}>
                  {["Pos", "Driver", "Team", "Q1", "Q2", "Q3"].map((h) => (
                    <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{h}</div>
                  ))}
                </div>
                {qualifying.QualifyingResults.map((result: any) => {
                  const teamColor = getTeamColor(result.Constructor?.name || "");
                  const isPole = result.position === "1";
                  return (
                    <div key={result.position} style={{ display: "grid", gridTemplateColumns: "3rem 1fr 7rem 5.5rem 5.5rem 5.5rem", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                      <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: isPole ? "#FFD700" : "white" }}>{result.position}</div>
                      <div>
                        <Link href={`/drivers/${result.Driver?.driverId}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.82rem", color: "white" }}>{result.Driver?.givenName} {result.Driver?.familyName}</div>
                        </Link>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{ width: "2px", height: "12px", background: teamColor, flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>{result.Constructor?.name}</span>
                      </div>
                      {["Q1", "Q2", "Q3"].map((q) => (
                        <div key={q} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: result[q] ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)" }}>{result[q] || "—"}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
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