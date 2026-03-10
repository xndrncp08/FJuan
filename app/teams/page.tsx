import Link from "next/link";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";

export default async function TeamsPage() {
  let standings: any[] = [];
  try {
    standings = await getConstructorStandings("current");
  } catch {}

  const teams = standings.length > 0
    ? standings.map((s: any) => {
        const local = constructorsData.find(c =>
          c.id === s.Constructor.constructorId ||
          s.Constructor.name.toLowerCase().includes(c.id.replace("_", " "))
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
    : constructorsData.map((c, i) => ({
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

  const currentTeams = teams.filter(t => standings.length > 0 ? true : [
    "ferrari","mercedes","red_bull","mclaren","alpine","aston_martin","williams","haas","rb","sauber"
  ].includes(t.constructorId));

  return (
    <main style={{ background: "#060606", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ height: "2px", background: "#E10600" }} />

        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", paddingRight: "2rem", pointerEvents: "none", userSelect: "none", overflow: "hidden" }}>
          <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(8rem, 20vw, 18rem)", color: "rgba(255,255,255,0.02)", lineHeight: 1, letterSpacing: "-0.04em" }}>F1</span>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Home</Link>

          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600" }}>Formula 1 · 2026 Season</span>
          </div>

          <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)", color: "white", lineHeight: 0.92, letterSpacing: "-0.02em", margin: "0 0 1.25rem" }}>
            CONSTRUCTOR<br /><span style={{ color: "rgba(255,255,255,0.15)" }}>STANDINGS</span>
          </h1>

          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.4)", maxWidth: "420px", margin: "0 0 2.5rem" }}>
            All ten Formula 1 constructors — points, wins, and championship history.
          </p>

          <div style={{ display: "inline-grid", gridTemplateColumns: "repeat(3, auto)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { value: "10", label: "Teams" },
              { value: standings.length > 0 ? standings.reduce((s: number, t: any) => s + (parseInt(t.wins) || 0), 0).toString() : "—", label: "Wins" },
              { value: "10", label: "Nations" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "1rem 2rem 0", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "2rem", color: "white", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: "0.2rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Top 3 */}
        {currentTeams.length >= 3 && (
          <div style={{ marginBottom: "2rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Podium</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
              {currentTeams.slice(0, 3).map((team) => (
                <div key={team.constructorId} style={{ background: "#0a0a0a", padding: "1.5rem", position: "relative", overflow: "hidden" }}>
                  <div style={{ height: "3px", background: team.color, marginBottom: "1.25rem" }} />
                  <div style={{ position: "absolute", right: "1rem", top: "1rem", fontFamily: "'Russo One', sans-serif", fontSize: "5rem", color: "rgba(255,255,255,0.025)", lineHeight: 1 }}>
                    {team.position > 0 ? `P${team.position}` : "—"}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "0.25rem" }}>{team.nationality}</div>
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.15rem", color: "white", lineHeight: 1.1, marginBottom: "1rem" }}>{team.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
                    {[
                      { label: "PTS", value: team.points },
                      { label: "Wins", value: team.wins },
                      { label: "Titles", value: team.championships },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "#0d0d0d", padding: "0.75rem", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.2rem", color: i === 2 && team.championships > 0 ? "#E10600" : "white", lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: "0.2rem" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full list */}
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Full Standings</span>
        <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "3rem 1fr 5rem 5rem 6rem 5rem", padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d" }}>
            {["Pos", "Constructor", "Pts", "Wins", "Base", "Titles"].map((h) => (
              <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{h}</div>
            ))}
          </div>
          {currentTeams.map((team) => (
            <div key={team.constructorId} style={{ display: "grid", gridTemplateColumns: "3rem 1fr 5rem 5rem 6rem 5rem", padding: "0.9rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.1rem", color: "white" }}>{team.position || "—"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "3px", height: "20px", background: team.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.9rem", color: "white", lineHeight: 1.1 }}>{team.name}</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{team.nationality}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: "#E10600" }}>{team.points}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>{team.wins}</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>{team.base || "—"}</div>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.95rem", color: team.championships > 0 ? "#E10600" : "rgba(255,255,255,0.3)" }}>{team.championships}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Home</Link>
        </div>
      </div>
    </main>
  );
}