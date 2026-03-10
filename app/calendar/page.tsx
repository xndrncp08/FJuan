"use client";

import { useState, useEffect } from "react";
import { getRaceSchedule } from "@/lib/api/jolpica";
import CalendarHero from "@/components/calendar/CalendarHero";
import SeasonSelector from "@/components/calendar/SeasonSelector";
import RaceGrid from "@/components/calendar/RaceGrid";
import CountdownBanner from "@/components/calendar/CountdownBanner";

export default function CalendarPage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear.toString());
  const [races, setRaces] = useState<any[]>([]);
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

  const now = new Date();
  const isCurrentSeason = season === currentYear.toString();
  const nextRace = isCurrentSeason
    ? races.find((r) => new Date(r.date) > now)
    : null;

  return (
    <main className="min-h-screen" style={{ background: "#060606" }}>
      <CalendarHero season={season} />
      {!isLoading && nextRace && <CountdownBanner race={nextRace} />}
      <div>
        <SeasonSelector season={season} onSeasonChange={setSeason} />
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem 0" }}>
            <div style={{ width: "32px", height: "32px", border: "2px solid #E10600", borderTopColor: "transparent", borderRadius: "50%", animation: "spin-ring 0.8s linear infinite", marginBottom: "1rem" }} />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>LOADING SCHEDULE...</p>
          </div>
        ) : (
          <RaceGrid races={races} season={season} currentYear={currentYear} />
        )}
      </div>
    </main>
  );
}