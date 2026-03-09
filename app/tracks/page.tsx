import Link from "next/link";
import { getCircuits } from "@/lib/api/jolpica";
import circuitsData from '@/lib/data/circuits.json';

export default async function TracksPage() {
  // Get live circuit list from Jolpica (gives us canonical circuitId order for the season)
  let apiCircuits: any[] = []; 
  try {
    apiCircuits = await getCircuits("current");
  } catch {
    // fall back to JSON order silently
  }

  // Merge: use Jolpica order if available, enrich with local JSON stats
  const circuits = (apiCircuits.length > 0 ? apiCircuits : circuitsData).map((api: any) => {
    const local = circuitsData.find(c => c.id === api.circuitId || c.id === api.id);
    return local ?? null;
  }).filter(Boolean) as typeof circuitsData;

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ height: "2px", background: "#E10600" }} />

        {/* Watermark */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          display: "flex", alignItems: "center", paddingRight: "2rem",
          pointerEvents: "none", userSelect: "none", overflow: "hidden",
        }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(8rem, 20vw, 18rem)",
            color: "rgba(255,255,255,0.02)",
            lineHeight: 1, letterSpacing: "-0.04em",
          }}>F1</span>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem",
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", textDecoration: "none",
          }}>← Home</Link>

          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: "0.72rem", letterSpacing: "0.28em",
              textTransform: "uppercase", color: "#E10600",
            }}>Formula 1 · 2026 Season</span>
          </div>

          <h1 style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(3rem, 8vw, 6rem)",
            color: "white", lineHeight: 0.92,
            letterSpacing: "-0.02em", margin: "0 0 1.25rem",
          }}>
            RACE<br /><span style={{ color: "rgba(255,255,255,0.15)" }}>CIRCUITS</span>
          </h1>

          <p style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
            fontSize: "1rem", lineHeight: 1.7,
            color: "rgba(255,255,255,0.4)", maxWidth: "420px", margin: "0 0 2.5rem",
          }}>
            Every circuit on the Formula 1 calendar — track layouts, lap records, and history.
          </p>

          {/* Stats strip */}
          <div style={{ display: "inline-grid", gridTemplateColumns: "repeat(3, auto)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { value: circuits.length, label: "Circuits" },
              { value: "24", label: "Races" },
              { value: "21", label: "Countries" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "1rem 2rem 0",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "2rem", color: "white", lineHeight: 1 }}>{s.value}</div>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                  fontSize: "0.68rem", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: "0.2rem",
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1px", background: "rgba(255,255,255,0.05)",
        }}>
          {circuits.map((circuit) => (
            <Link key={circuit.id} href={`/tracks/${circuit.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#0a0a0a", padding: "1.5rem",
                height: "100%", display: "flex", flexDirection: "column",
              }}>
                {/* Red accent line */}
                <div style={{ height: "2px", width: "32px", background: "#E10600", marginBottom: "1.25rem" }} />

                {/* Track image */}
                <div style={{
                  background: "#060606", border: "1px solid rgba(255,255,255,0.04)",
                  height: "120px", display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: "1.25rem", overflow: "hidden",
                }}>
                  <img
                    src={circuit.layoutUrl}
                    alt={circuit.name}
                    style={{ height: "100%", width: "100%", objectFit: "contain", padding: "0.5rem", opacity: 0.85 }}
                    loading="lazy"
                  />
                </div>

                {/* Location */}
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                  fontSize: "0.68rem", letterSpacing: "0.16em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
                  marginBottom: "0.3rem",
                }}>{circuit.location}</div>

                {/* Name */}
                <div style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "1rem", color: "white",
                  lineHeight: 1.2, marginBottom: "1rem", flex: 1,
                }}>{circuit.name}</div>

                {/* Stats row */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                  borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem", gap: "0.5rem",
                }}>
                  {[
                    { label: "Length", value: circuit.length },
                    { label: "Laps", value: circuit.laps },
                    { label: "Since", value: circuit.firstGP },
                  ].map((s) => (
                    <div key={s.label}>
                      <div style={{
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                        fontSize: "0.62rem", letterSpacing: "0.12em",
                        textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                        marginBottom: "0.15rem",
                      }}>{s.label}</div>
                      <div style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.85rem", color: "white",
                      }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Lap record */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: "0.75rem", paddingTop: "0.75rem",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                      fontSize: "0.62rem", letterSpacing: "0.12em",
                      textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                      marginBottom: "0.1rem",
                    }}>Lap Record</div>
                    <div style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.9rem", color: "#E10600",
                    }}>{circuit.lapRecord}</div>
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    fontSize: "0.72rem", letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                  }}>View →</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}