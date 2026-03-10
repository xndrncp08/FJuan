"use client";

import { useState, useEffect } from "react";
import { Session } from "./types";
import { Panel, SectionLabel, Spinner } from "./ui";

interface Props {
  onSelect: (session: Session) => void;
}

const SESSION_TYPES = ["Race", "Qualifying", "Sprint", "Practice 1", "Practice 2", "Practice 3"];
const YEARS = Array.from({ length: 6 }, (_, i) => String(2026 - i));

export default function SessionSearch({ onSelect }: Props) {
  const [year, setYear] = useState("2026");
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("Race");
  const [loadingYear, setLoadingYear] = useState(false);
  const [error, setError] = useState("");

  // Load all sessions for the selected year
  useEffect(() => {
    const load = async () => {
      setLoadingYear(true);
      setError("");
      setAllSessions([]);
      setRaces([]);
      setSelectedRace("");
      try {
        const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
        const data: Session[] = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((s) => SESSION_TYPES.includes(s.session_name))
          : [];
        setAllSessions(filtered);

        // Extract unique race locations in chronological order
        const seen = new Set<string>();
        const raceList: string[] = [];
        [...filtered]
          .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
          .forEach((s) => {
            const key = s.circuit_short_name;
            if (!seen.has(key)) { seen.add(key); raceList.push(key); }
          });
        setRaces(raceList);
        if (raceList.length > 0) setSelectedRace(raceList[raceList.length - 1]); // default to latest
      } catch {
        setError("Failed to load sessions. Check your connection.");
      }
      setLoadingYear(false);
    };
    load();
  }, [year]);

  // Derived: sessions matching current race + type selection
  const matchedSessions = allSessions.filter(
    (s) => s.circuit_short_name === selectedRace && s.session_name === sessionType
  );

  const handleGo = () => {
    if (matchedSessions.length > 0) onSelect(matchedSessions[0]);
  };

  const selectStyle: React.CSSProperties = {
    background: "#111",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0.7rem 1rem",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "white",
    outline: "none",
    cursor: "pointer",
    flex: 1,
    minWidth: "140px",
  };

  return (
    <Panel>
      <div style={{ padding: "1.5rem" }}>
        <SectionLabel>Find a Session</SectionLabel>

        {loadingYear ? (
          <Spinner />
        ) : (
          <>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {/* Year */}
              <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
                {YEARS.map((y) => <option key={y} value={y}>{y} Season</option>)}
              </select>

              {/* Race */}
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                disabled={races.length === 0}
                style={{ ...selectStyle, flex: 2 }}
              >
                {races.length === 0
                  ? <option>No races found</option>
                  : races.map((r) => <option key={r} value={r}>{r}</option>)
                }
              </select>

              {/* Session type */}
              <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} style={selectStyle}>
                {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <button
                onClick={handleGo}
                disabled={matchedSessions.length === 0}
                style={{
                  background: matchedSessions.length > 0 ? "#E10600" : "rgba(255,255,255,0.06)",
                  border: "none",
                  padding: "0.7rem 1.5rem",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: matchedSessions.length > 0 ? "white" : "rgba(255,255,255,0.2)",
                  cursor: matchedSessions.length > 0 ? "pointer" : "not-allowed",
                  flexShrink: 0,
                }}
              >
                Load Session
              </button>
            </div>

            {error && (
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", color: "#E10600", marginTop: "0.5rem" }}>
                {error}
              </div>
            )}

            {!loadingYear && selectedRace && matchedSessions.length === 0 && !error && (
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.25)", marginTop: "0.25rem" }}>
                No {sessionType} session found for {selectedRace} in {year}.
              </div>
            )}

            {matchedSessions.length > 0 && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>
                {matchedSessions[0].country_name} · {new Date(matchedSessions[0].date_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
