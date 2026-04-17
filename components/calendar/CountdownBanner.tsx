"use client";

import { useState, useEffect } from "react";

interface Props {
  race: any;
}

// Counts down to a target date, updating every second
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = targetDate.getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
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
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />
      <div className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Race name, location, and date */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="label-overline block mb-1">Next Race</span>
              <p className="text-white text-sm font-bold uppercase tracking-wide leading-none">
                {race.raceName}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country} · Round {race.round}
              </p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <p className="text-white/35 text-xs">
              {raceDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>

          {/* Countdown blocks */}
          <div className="flex items-center gap-px">
            {units.map((u, i) => (
              <div key={u.label} className="flex items-center">
                <div className="bg-black/30 border border-white/10 px-3 py-2 text-center min-w-[56px]">
                  <p className="text-[1.4rem] font-semibold text-[#E10600] leading-none tabular-nums m-0">
                    {String(u.value).padStart(2, "0")}
                  </p>
                  <p className="text-[0.52rem] text-white/25 tracking-[0.12em] uppercase mt-1 font-semibold m-0">
                    {u.label}
                  </p>
                </div>
                {i < units.length - 1 && (
                  <span className="text-white/15 text-[1rem] px-1 font-['Russo_One',sans-serif]">
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}