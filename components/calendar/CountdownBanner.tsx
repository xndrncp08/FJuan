"use client";

/**
 * CountdownBanner – Displays live countdown to next race
 * 
 * Features:
 * - Real-time countdown updating every second
 * - Shows race name, location, date, and round
 * - Responsive: stacks on mobile, row on desktop
 * - Matching styling with SeasonSelector panel
 */

import { useState, useEffect } from "react";

interface Props {
  race: any;
}

// Countdown hook – updates every second
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

export default function CountdownBanner({ race }: Props) {
  const raceDate = race?.date ? new Date(race.date) : null;
  const countdown = useCountdown(raceDate);

  if (!race || !raceDate) return null;

  const units = [
    { label: "DAYS", value: countdown.days },
    { label: "HOURS", value: countdown.hours },
    { label: "MINUTES", value: countdown.minutes },
    { label: "SECONDS", value: countdown.seconds },
  ];

  return (
    <div className="relative overflow-hidden bg-[#111] border border-white/10">
      {/* Top red accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

      <div className="p-5 md:p-6">
        {/* Flex container: column on mobile, row on desktop */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Race info */}
          <div className="space-y-2">
            <span className="label-overline block">Next Race</span>
            <h3 className="font-display text-white text-base md:text-lg uppercase tracking-wide">
              {race.raceName}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/40 text-xs">
              <span>
                {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
              </span>
              <span className="hidden md:inline">•</span>
              <span>Round {race.round}</span>
              <span className="hidden md:inline">•</span>
              <span>
                {raceDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Countdown blocks – responsive grid */}
          <div className="grid grid-cols-4 gap-1 min-w-[240px]">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="bg-black/30 border border-white/10 text-center py-2 px-1"
              >
                <div className="font-display text-xl md:text-2xl text-[#E10600] leading-tight tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="text-[0.55rem] md:text-[0.6rem] text-white/30 uppercase tracking-wider font-semibold">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}