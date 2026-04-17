"use client";

import { useState, useEffect } from "react";
import { Session } from "./types";
import { Panel, SectionLabel, Spinner } from "./ui";

interface Props {
  onSelect: (session: Session) => void;
}

const SESSION_TYPES = ["Race", "Qualifying", "Sprint", "Practice 1", "Practice 2", "Practice 3"];
const YEARS = Array.from({ length: 6 }, (_, i) => String(2026 - i)); // 2026 down to 2021

export default function SessionSearch({ onSelect }: Props) {
  const [year, setYear] = useState("2026");
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("Race");
  const [loadingYear, setLoadingYear] = useState(false);
  const [error, setError] = useState("");

  // Load all sessions for the selected year when year changes
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
        // Only keep sessions that match our predefined types (Race, Quali, etc.)
        const filtered = Array.isArray(data)
          ? data.filter((s) => SESSION_TYPES.includes(s.session_name))
          : [];
        setAllSessions(filtered);

        // Build unique list of race locations in chronological order
        const seen = new Set<string>();
        const raceList: string[] = [];
        [...filtered]
          .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
          .forEach((s) => {
            const key = s.circuit_short_name;
            if (!seen.has(key)) {
              seen.add(key);
              raceList.push(key);
            }
          });
        setRaces(raceList);
        if (raceList.length > 0) setSelectedRace(raceList[raceList.length - 1]); // default to latest race
      } catch {
        setError("Failed to load sessions. Check your connection.");
      }
      setLoadingYear(false);
    };
    load();
  }, [year]);

  // Find sessions matching the selected race and session type
  const matchedSessions = allSessions.filter(
    (s) => s.circuit_short_name === selectedRace && s.session_name === sessionType
  );

  const handleGo = () => {
    if (matchedSessions.length > 0) onSelect(matchedSessions[0]);
  };

  return (
    <Panel>
      <div className="p-4 md:p-6">
        <SectionLabel>Find a Session</SectionLabel>

        {loadingYear ? (
          <Spinner />
        ) : (
          <>
            {/* Responsive form group: stack on mobile, row on small screens and up */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Year dropdown */}
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full sm:flex-1 bg-[#111] border border-white/10 px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-f1-red"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} Season
                  </option>
                ))}
              </select>

              {/* Race dropdown (circuit) */}
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                disabled={races.length === 0}
                className="w-full sm:flex-[2] bg-[#111] border border-white/10 px-3 py-2 text-white font-sans text-sm disabled:opacity-50 focus:outline-none focus:border-f1-red"
              >
                {races.length === 0 ? (
                  <option>No races found</option>
                ) : (
                  races.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))
                )}
              </select>

              {/* Session type dropdown */}
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full sm:flex-1 bg-[#111] border border-white/10 px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-f1-red"
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Load button – full width on mobile, auto width on desktop */}
              <button
                onClick={handleGo}
                disabled={matchedSessions.length === 0}
                className="w-full sm:w-auto bg-f1-red disabled:bg-white/10 text-white font-bold uppercase tracking-wide px-6 py-2 text-sm transition hover:bg-red-700 disabled:hover:bg-white/10"
              >
                Load Session
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-f1-red text-sm mt-2 font-sans">{error}</div>
            )}

            {/* Info when no matching session exists */}
            {!loadingYear && selectedRace && matchedSessions.length === 0 && !error && (
              <div className="text-white/40 text-xs mt-2">
                No {sessionType} session found for {selectedRace} in {year}.
              </div>
            )}

            {/* Session date hint */}
            {matchedSessions.length > 0 && (
              <div className="text-white/40 text-[0.65rem] mt-2 font-mono">
                {matchedSessions[0].country_name} ·{" "}
                {new Date(matchedSessions[0].date_start).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}