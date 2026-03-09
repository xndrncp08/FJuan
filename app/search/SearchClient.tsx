"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<{ drivers: any[]; circuits: any[] }>({ drivers: [], circuits: [] });
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults({ drivers: [], circuits: [] }); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/drivers.json?limit=1000`);
      const data = await res.json();
      const allDrivers: any[] = data?.MRData?.DriverTable?.Drivers || [];
      const lower = q.toLowerCase();
      const matchedDrivers = allDrivers.filter((d: any) =>
        `${d.givenName} ${d.familyName}`.toLowerCase().includes(lower) ||
        d.nationality?.toLowerCase().includes(lower) ||
        d.code?.toLowerCase().includes(lower)
      ).slice(0, 10);
      setResults({ drivers: matchedDrivers, circuits: [] });
    } catch {
      setResults({ drivers: [], circuits: [] });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  const totalResults = results.drivers.length + results.circuits.length;

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <div style={{ height: "2px", background: "#E10600" }} />

      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600" }}>FJUAN Search</span>
          </div>
          <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "white", lineHeight: 0.92, margin: "0 0 2rem" }}>SEARCH</h1>

          <div style={{ position: "relative", maxWidth: "600px" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search drivers, teams, circuits..."
              autoFocus
              style={{
                width: "100%",
                background: "#111",
                border: "1px solid rgba(255,255,255,0.12)",
                borderLeft: "3px solid #E10600",
                padding: "1rem 3rem 1rem 1.25rem",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "white",
                outline: "none",
                letterSpacing: "0.04em",
                boxSizing: "border-box",
              }}
            />
            {isLoading && (
              <div style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", border: "2px solid #E10600", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {query.length >= 2 && !isLoading && (
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
              {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </span>
          </div>
        )}

        {results.drivers.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "1rem" }}>Drivers</span>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              {results.drivers.map((driver: any) => (
                <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", minWidth: "2rem" }}>#{driver.permanentNumber || "—"}</div>
                      <div>
                        <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.95rem", color: "white" }}>{driver.givenName} {driver.familyName}</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{driver.nationality}</div>
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#E10600" }}>View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {query.length >= 2 && !isLoading && totalResults === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>No results found for &ldquo;{query}&rdquo;</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
