"use client";

import { useState, useEffect } from "react";
import SeasonSelector from "@/components/calendar/SeasonSelector";
import RaceGrid from "@/components/calendar/RaceGrid";

interface CalendarClientProps {
  initialRaces: any[];
  initialSeason: string;
}

export default function CalendarClient({ initialRaces, initialSeason }: CalendarClientProps) {
  const currentYear = new Date().getFullYear();
  const activeF1Season = currentYear > 2025 ? 2025 : currentYear;

  const [season, setSeason] = useState(initialSeason);
  const [races, setRaces] = useState<any[]>(initialRaces);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (season === initialSeason && races.length > 0) return;

    async function fetchRaces() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/calendar?season=${season}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
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
    <div className="py-10">
      <SeasonSelector season={season} onSeasonChange={setSeason} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="data-readout">Loading races...</p>
        </div>
      ) : (
        <RaceGrid races={races} season={season} currentYear={activeF1Season} />
      )}
    </div>
  );
}
