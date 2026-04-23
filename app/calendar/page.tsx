"use client";

import { useState, useEffect } from "react";
import { getRaceSchedule } from "@/lib/api/jolpica";
import CalendarHero from "@/components/calendar/CalendarHero";
import SeasonSelector from "@/components/calendar/SeasonSelector";
import RaceGrid from "@/components/calendar/RaceGrid";

export default function CalendarPage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason]   = useState(currentYear.toString());
  const [races, setRaces]     = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRaces() {
      setIsLoading(true);
      try {
        const data = await getRaceSchedule(season);
        setRaces(data || []);
      } catch {
        setRaces([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRaces();
  }, [season]);

  return (
    <main className="min-h-screen" style={{ background: "#060606" }}>
      <CalendarHero season={season} />
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem clamp(1.25rem,4vw,1.5rem)" }}>
        <SeasonSelector season={season} onSeasonChange={setSeason} />
        {isLoading ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "8rem 2rem", gap: "1rem",
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: "2px solid rgba(225,6,0,0.2)",
              borderTop: "2px solid #E10600",
              animation: "spin 0.8s linear infinite",
            }} />
            <span className="data-readout" style={{ fontSize: "0.55rem" }}>
              Loading schedule...
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <RaceGrid races={races} season={season} currentYear={currentYear} />
        )}
      </div>
    </main>
  );
}