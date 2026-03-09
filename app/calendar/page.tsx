"use client";

import { useState, useEffect } from "react";
import { getRaceSchedule } from "@/lib/api/jolpica";
import CalendarHero from "@/components/calendar/CalendarHero";
import SeasonSelector from "@/components/calendar/SeasonSelector";
import RaceGrid from "@/components/calendar/RaceGrid";

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

  return (
    <main className="min-h-screen" style={{ background: "#080808" }}>
      <CalendarHero season={season} />
      <div className="py-10">
        <SeasonSelector season={season} onSeasonChange={setSeason} />
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="data-readout">Loading races...</p>
          </div>
        ) : (
          <RaceGrid races={races} season={season} currentYear={currentYear} />
        )}
      </div>
    </main>
  );
}
