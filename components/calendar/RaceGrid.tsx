"use client";

/**
 * RaceGrid – Displays all races in a responsive grid
 * 
 * Features:
 * - Each race card shows round, name, location, weekend dates, qualifying date
 * - Next race card shows live countdown
 * - Past races link to results page
 * - Responsive grid: auto-fill with min 280px on mobile, 300px on desktop
 */

import Link from "next/link";
import { useState, useEffect } from "react";

interface RaceGridProps {
  races: any[];
  season: string;
  currentYear: number;
}

// Live countdown hook (used only for next race card)
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;
    const target = targetDate.getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);

  return timeLeft;
}

// Individual race card component
function RaceCard({
  race,
  season,
  isNext,
  isPast,
}: {
  race: any;
  season: string;
  isNext: boolean;
  isPast: boolean;
}) {
  const raceDate = new Date(race.date);
  const fp1Date = race.FirstPractice?.date ? new Date(race.FirstPractice.date) : null;
  const qualiDate = race.Qualifying?.date ? new Date(race.Qualifying.date) : null;

  // Weekend label: "Mar 28–30" or "Mar 28 – Apr 1"
  const weekendStart = fp1Date || raceDate;
  const sameMonth = weekendStart.getMonth() === raceDate.getMonth();
  const weekendLabel = sameMonth
    ? `${weekendStart.getDate()}–${raceDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`
    : `${weekendStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} – ${raceDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`;

  const countdown = useCountdown(isNext ? raceDate : null);

  // Shared card content
  const cardContent = (
    <div className="relative overflow-hidden h-full border-r border-b border-white/10 bg-[#111] hover:bg-[#151515] transition-colors">
      {/* Top accent bar – red for next race, subtle for others */}
      <div
        className="h-0.5"
        style={{
          background: isNext
            ? "#E10600"
            : isPast
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.1)",
        }}
      />

      {/* Round number watermark */}
      <div className="absolute top-4 right-5 font-display text-6xl md:text-7xl text-white/5 leading-none select-none pointer-events-none">
        {race.round}
      </div>

      <div className="p-5 md:p-6 relative">
        {/* Round badge */}
        <div
          className="inline-flex items-center mb-4 px-2 py-1"
          style={{
            background: isNext ? "rgba(225,6,0,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              isNext ? "rgba(225,6,0,0.25)" : "rgba(255,255,255,0.07)"
            }`,
          }}
        >
          <span
            className="text-[0.6rem] font-bold tracking-[0.15em] uppercase"
            style={{ color: isNext ? "#E10600" : "rgba(255,255,255,0.3)" }}
          >
            {isNext && "▶ NEXT · "}Round {race.round}
          </span>
        </div>

        {/* Race name and location */}
        <h3 className="font-display text-base md:text-lg text-white uppercase leading-tight mb-1">
          {race.raceName}
        </h3>
        <p className="text-white/40 text-sm mb-5">
          {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
        </p>

        <div className="h-px bg-white/10 mb-5" />

        {/* Weekend dates */}
        <div className="mb-4">
          <div className="text-white/30 text-[0.6rem] uppercase tracking-wider mb-1">
            Race Weekend
          </div>
          <div className="font-condensed font-bold text-white/85 text-base uppercase tracking-wide">
            {weekendLabel}
          </div>
          <div className="font-mono text-[0.65rem] text-white/30 mt-1">
            Race:{" "}
            {raceDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          {qualiDate && (
            <div className="font-mono text-[0.65rem] text-white/20 mt-0.5">
              Qualifying:{" "}
              {qualiDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Countdown for next race */}
        {isNext && (
          <div className="grid grid-cols-4 gap-px bg-white/10 mt-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hrs", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Sec", value: countdown.seconds },
            ].map((t) => (
              <div key={t.label} className="bg-[#0a0a0a] py-2 text-center">
                <div className="font-display text-xl md:text-2xl text-[#E10600] leading-tight">
                  {String(t.value).padStart(2, "0")}
                </div>
                <div className="text-[0.55rem] text-white/40 uppercase tracking-wider font-semibold">
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past race CTA */}
        {isPast && (
          <div className="flex justify-end mt-4">
            <span className="text-[#E10600] text-[0.65rem] font-bold uppercase tracking-wider">
              Results →
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Past races are clickable links to results page
  return isPast ? (
    <Link
      href={`/races/${season}/${race.round}`}
      className="block h-full no-underline"
    >
      {cardContent}
    </Link>
  ) : (
    <div className="h-full">{cardContent}</div>
  );
}

export default function RaceGrid({ races, season, currentYear }: RaceGridProps) {
  const now = new Date();
  const isCurrentSeason = season === currentYear.toString();

  // Find index of next upcoming race (only for current season)
  const nextRaceIndex = isCurrentSeason
    ? races.findIndex((r) => new Date(r.date) > now)
    : -1;

  if (races.length === 0) {
    return (
      <div className="text-center py-20 border border-white/10 bg-[#111]">
        <p className="font-condensed font-bold text-lg uppercase tracking-wider text-white/30">
          No races scheduled for {season}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 border-r-0 border-b-0">
        {races.map((race: any, index: number) => {
          const raceDate = new Date(race.date);
          const isPast = raceDate < now || !isCurrentSeason;
          const isNext = index === nextRaceIndex;
          return (
            <RaceCard
              key={race.round}
              race={race}
              season={season}
              isNext={isNext}
              isPast={isPast}
            />
          );
        })}
      </div>
    </div>
  );
}