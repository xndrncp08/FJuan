"use client";

/**
 * Calendar Page – Main entry point for F1 race schedule
 * 
 * Features:
 * - Hero section with season title
 * - Countdown banner for next race (current season only)
 * - Season selector dropdown (years from 1950 to current)
 * - Race grid with cards for each race
 * - Fully responsive: works on mobile, tablet, desktop
 */

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

  // Fetch races when season changes
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
    <main className="min-h-screen bg-[#060606]">
      {/* Hero section – full width with centered content */}
      <CalendarHero season={season} />

      {/* Countdown banner – only for current season, same width as SeasonSelector */}
      {!isLoading && nextRace && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
          <CountdownBanner race={nextRace} />
        </div>
      )}

      {/* Season selector + race grid – centered container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <SeasonSelector season={season} onSeasonChange={setSeason} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
            <p className="font-mono text-[0.7rem] text-white/30 mt-4 tracking-wider">
              LOADING SCHEDULE...
            </p>
          </div>
        ) : (
          <RaceGrid races={races} season={season} currentYear={currentYear} />
        )}
      </div>
    </main>
  );
}