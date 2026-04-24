"use client";

import { useState, useEffect, useMemo } from "react";
import { Session } from "./types";

const SESSION_TYPES = ["Race", "Qualifying", "Sprint", "Practice 1", "Practice 2", "Practice 3"];
const YEARS = Array.from({ length: 6 }, (_, i) => String(2026 - i));

interface Props {
  onSelect: (session: Session) => void;
}

interface RaceGroup {
  circuit:     string;
  country:     string;
  round:       number;
  dateStart:   string;
  sessions:    Record<string, Session>; // session_name → Session
}

export default function SessionSearch({ onSelect }: Props) {
  const [year,          setYear         ] = useState("2026");
  const [allSessions,   setAllSessions  ] = useState<Session[]>([]);
  const [loading,       setLoading      ] = useState(false);
  const [error,         setError        ] = useState("");
  const [query,         setQuery        ] = useState("");
  const [sessionType,   setSessionType  ] = useState("Race");
  const [selectedRace,  setSelectedRace ] = useState<string | null>(null);

  // Fetch all sessions for the year
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      setAllSessions([]);
      setSelectedRace(null);
      setQuery("");
      try {
        const res  = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
        const data: Session[] = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((s) => SESSION_TYPES.includes(s.session_name))
          : [];
        setAllSessions(filtered);
      } catch {
        setError("Failed to load sessions.");
      }
      setLoading(false);
    };
    load();
  }, [year]);

  // Group sessions by race (circuit + date weekend)
  const raceGroups = useMemo<RaceGroup[]>(() => {
    const map = new Map<string, RaceGroup>();
    [...allSessions]
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .forEach((s) => {
        const key = s.circuit_short_name;
        if (!map.has(key)) {
          map.set(key, {
            circuit:   s.circuit_short_name,
            country:   s.country_name,
            round:     map.size + 1,
            dateStart: s.date_start,
            sessions:  {},
          });
        }
        map.get(key)!.sessions[s.session_name] = s;
      });
    return Array.from(map.values());
  }, [allSessions]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return raceGroups;
    const q = query.toLowerCase();
    return raceGroups.filter(
      (r) => r.circuit.toLowerCase().includes(q) || r.country.toLowerCase().includes(q)
    );
  }, [raceGroups, query]);

  const handleRaceClick = (race: RaceGroup) => {
    setSelectedRace(race.circuit);
    // If the chosen session type exists for this race, fire immediately
    const session = race.sessions[sessionType];
    if (session) {
      onSelect(session);
    }
    // If not, still highlight the race so user can pick another type
  };

  const handleSessionTypeClick = (type: string, race: RaceGroup) => {
    setSessionType(type);
    const session = race.sessions[type];
    if (session) onSelect(session);
  };

  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  const fmtDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.07)", borderTop: "2px solid #E10600" }}>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: "2px", flexWrap: "wrap",
      }}>
        {/* Year tabs */}
        <div style={{ display: "flex", gap: "2px", marginRight: "0.75rem" }}>
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "0.4rem 0.75rem",
                border: "none",
                background: year === y ? "#E10600" : "rgba(255,255,255,0.04)",
                color: year === y ? "white" : "rgba(255,255,255,0.3)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (year !== y) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { if (year !== y) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ flex: 1, minWidth: "160px", position: "relative" }}>
          <svg
            width="12" height="12" viewBox="0 0 16 16" fill="none"
            style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", pointerEvents: "none" }}
          >
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search circuit or country..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "0.4rem 0.75rem 0.4rem 2rem",
              color: "rgba(255,255,255,0.75)",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(225,6,0,0.4)"; }}
            onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
        </div>

        {/* Session type filter */}
        <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
          {SESSION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSessionType(t)}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "0.4rem 0.65rem",
                border: sessionType === t ? "1px solid rgba(225,6,0,0.5)" : "1px solid rgba(255,255,255,0.07)",
                background: sessionType === t ? "rgba(225,6,0,0.1)" : "transparent",
                color: sessionType === t ? "#E10600" : "rgba(255,255,255,0.25)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (sessionType !== t) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={(e) => { if (sessionType !== t) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Race grid ────────────────────────────────────────────────────── */}
      <div style={{ padding: "1rem 1.25rem" }}>
        {loading && (
          <div style={{
            padding: "2.5rem 0", textAlign: "center",
            fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem",
            fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
          }}>
            Loading {year} calendar...
          </div>
        )}

        {error && (
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "#E10600", padding: "1rem 0" }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && query && (
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", padding: "1rem 0" }}>
            No races match "{query}"
          </div>
        )}

        {!loading && !error && (
          <div
            className="race-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "2px",
            }}
          >
            {filtered.map((race) => {
              const isSelected   = selectedRace === race.circuit;
              const past         = isPast(race.dateStart);
              const hasSession   = !!race.sessions[sessionType];
              const availTypes   = SESSION_TYPES.filter((t) => !!race.sessions[t]);

              return (
                <div
                  key={race.circuit}
                  style={{
                    position: "relative",
                    background: isSelected ? "rgba(225,6,0,0.07)" : past ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.03)",
                    borderTop:    `2px solid ${isSelected ? "#E10600" : past ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"}`,
                    borderRight:  "1px solid rgba(255,255,255,0.07)",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    borderLeft:   "1px solid rgba(255,255,255,0.07)",
                    cursor: hasSession ? "pointer" : "default",
                    transition: "background 0.15s, border-top-color 0.15s",
                    opacity: hasSession ? 1 : 0.45,
                  }}
                  onClick={() => hasSession && handleRaceClick(race)}
                  onMouseEnter={(e) => {
                    if (!hasSession) return;
                    const el = e.currentTarget as HTMLDivElement;
                    if (!isSelected) {
                      el.style.background    = "rgba(225,6,0,0.05)";
                      el.style.borderTopColor = "rgba(225,6,0,0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasSession) return;
                    const el = e.currentTarget as HTMLDivElement;
                    if (!isSelected) {
                      el.style.background    = past ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.03)";
                      el.style.borderTopColor = past ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)";
                    }
                  }}
                >
                  <div style={{ padding: "0.85rem 1rem" }}>
                    {/* Round number */}
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.45rem", fontWeight: 700,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      color: isSelected ? "#E10600" : "rgba(255,255,255,0.2)",
                      marginBottom: "0.3rem",
                    }}>
                      Round {race.round}
                    </div>

                    {/* Circuit name */}
                    <div style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.85rem", textTransform: "uppercase",
                      letterSpacing: "0.01em", lineHeight: 1.1,
                      color: isSelected ? "white" : past ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)",
                      marginBottom: "0.2rem",
                    }}>
                      {race.circuit}
                    </div>

                    {/* Country + date */}
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.55rem", fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                      marginBottom: "0.65rem",
                    }}>
                      {race.country} · {fmtDate(race.dateStart)}
                    </div>

                    {/* Available session type chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                      {availTypes.map((t) => {
                        const isActiveType = t === sessionType;
                        const short = t === "Practice 1" ? "FP1"
                          : t === "Practice 2" ? "FP2"
                          : t === "Practice 3" ? "FP3"
                          : t === "Qualifying" ? "QUALI"
                          : t === "Sprint" ? "SPR"
                          : t.toUpperCase();
                        return (
                          <button
                            key={t}
                            onClick={(e) => { e.stopPropagation(); handleSessionTypeClick(t, race); }}
                            style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: "0.42rem", fontWeight: 700,
                              letterSpacing: "0.1em", textTransform: "uppercase",
                              padding: "2px 6px",
                              border: isActiveType && isSelected
                                ? "1px solid #E10600"
                                : "1px solid rgba(255,255,255,0.1)",
                              background: isActiveType && isSelected ? "#E10600" : "transparent",
                              color: isActiveType && isSelected ? "white" : "rgba(255,255,255,0.3)",
                              cursor: "pointer",
                              transition: "all 0.12s",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLButtonElement;
                              if (!(isActiveType && isSelected)) {
                                el.style.borderColor = "rgba(225,6,0,0.5)";
                                el.style.color = "#E10600";
                              }
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLButtonElement;
                              if (!(isActiveType && isSelected)) {
                                el.style.borderColor = "rgba(255,255,255,0.1)";
                                el.style.color = "rgba(255,255,255,0.3)";
                              }
                            }}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Past race dim overlay indicator */}
                  {past && !isSelected && (
                    <div style={{
                      position: "absolute", top: "0.5rem", right: "0.5rem",
                      fontFamily: "'Rajdhani', sans-serif", fontSize: "0.4rem",
                      fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.15)",
                    }}>
                      DONE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .race-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 380px) {
          .race-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}