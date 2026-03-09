import Link from "next/link";
import { notFound } from "next/navigation";
import { getCircuit } from "@/lib/api/jolpica";
import circuitsData from '@/lib/data/circuits.json';

export default async function TrackDetailPage({ params }: { params: { circuitId: string } }) {
  // Rich stats from local JSON
  const localData = circuitsData.find(c => c.id === params.circuitId);
  if (!localData) notFound();

  // Live circuit identity from Jolpica (name, location, url)
  let apiCircuit: any = null;
  try {
    apiCircuit = await getCircuit(params.circuitId);
  } catch {
    // fall back to local data silently
  }

  const name = localData.name;
  const location = localData.location;
  const country = localData.country;

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ height: "2px", background: "#E10600" }} />

        {/* Country watermark */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          display: "flex", alignItems: "center", paddingRight: "2rem",
          pointerEvents: "none", userSelect: "none", overflow: "hidden",
        }}>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(5rem, 14vw, 12rem)",
            color: "rgba(255,255,255,0.025)",
            lineHeight: 1, letterSpacing: "-0.03em",
          }}>{country.toUpperCase()}</span>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <Link href="/tracks" style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem",
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", textDecoration: "none",
          }}>
            ← All Circuits
          </Link>

          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: "0.72rem", letterSpacing: "0.28em",
              textTransform: "uppercase", color: "#E10600",
            }}>{location} · Since {localData.firstGP}</span>
          </div>

          <h1 style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(2rem, 5vw, 4rem)",
            color: "white", lineHeight: 0.95,
            letterSpacing: "-0.02em", margin: "0 0 1.25rem",
          }}>{name.toUpperCase()}</h1>

          <p style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
            fontSize: "1rem", lineHeight: 1.75,
            color: "rgba(255,255,255,0.42)", maxWidth: "520px",
          }}>{localData.description}</p>
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Stats bar */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: "rgba(255,255,255,0.05)", marginBottom: "1px",
        }}>
          {[
            { label: "Length", value: localData.length },
            { label: "Race Laps", value: String(localData.laps) },
            { label: "Distance", value: localData.distance },
            { label: "First GP", value: String(localData.firstGP) },
          ].map((s, i) => (
            <div key={s.label} style={{
              background: "#0a0a0a", padding: "1.25rem 1.5rem",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                fontSize: "0.65rem", letterSpacing: "0.16em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                marginBottom: "0.3rem",
              }}>{s.label}</div>
              <div style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "1.4rem", color: "white", lineHeight: 1,
              }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Lap record bar */}
        <div style={{
          background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.05)",
          borderTop: "none", padding: "0.875rem 1.5rem",
          display: "flex", gap: "2rem", alignItems: "center", marginBottom: "2rem",
        }}>
          <div>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: "0.65rem", letterSpacing: "0.14em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              marginRight: "0.75rem",
            }}>Lap Record</span>
            <span style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "1rem", color: "#E10600",
            }}>{localData.lapRecord}</span>
          </div>
          <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.08)" }} />
          <div style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.82rem", color: "rgba(255,255,255,0.4)",
          }}>{localData.lapRecordHolder} · {localData.lapRecordYear}</div>
        </div>

        {/* Layout + info grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "1px", background: "rgba(255,255,255,0.05)",
        }}>

          {/* Track layout */}
          <div style={{ background: "#0a0a0a", padding: "2rem" }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: "0.68rem", letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              marginBottom: "1.5rem",
            }}>Track Layout</div>
            <div style={{
              background: "#060606", border: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: "260px", padding: "1.5rem",
            }}>
              <img
                src={localData.layoutUrl}
                alt={`${name} layout`}
                style={{ maxHeight: "220px", width: "auto", objectFit: "contain", opacity: 0.9 }}
              />
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem", color: "rgba(255,255,255,0.18)",
              marginTop: "1rem", textAlign: "center", letterSpacing: "0.05em",
            }}>{localData.laps} laps · {localData.distance}</div>
          </div>

          {/* Circuit info */}
          <div style={{ background: "#0a0a0a", padding: "2rem" }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: "0.68rem", letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              marginBottom: "1.5rem",
            }}>Circuit Info</div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Country", value: country },
                { label: "Location", value: location },
                { label: "Circuit Length", value: localData.length },
                { label: "Race Laps", value: String(localData.laps) },
                { label: "Race Distance", value: localData.distance },
                { label: "First Grand Prix", value: String(localData.firstGP) },
                ...(apiCircuit?.url ? [{ label: "Wikipedia", value: "View Article →", href: apiCircuit.url }] : []),
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                    fontSize: "0.75rem", letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
                  }}>{row.label}</span>
                  {"href" in row ? (
                    <a href={row.href} target="_blank" rel="noopener noreferrer" style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.85rem", color: "#E10600", textDecoration: "none",
                    }}>{row.value}</a>
                  ) : (
                    <span style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.85rem", color: "white",
                    }}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Back */}
        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/tracks" style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            fontSize: "0.75rem", letterSpacing: "0.15em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
          }}>← Back to All Circuits</Link>
        </div>
      </div>
    </main>
  );
}