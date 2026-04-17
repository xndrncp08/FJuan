import { Driver, LapData, formatLapTime, teamColor } from "./types";

interface Props {
  laps: LapData[];
  driver: Driver | null;
}

export default function StatsSummary({ laps, driver }: Props) {
  // Filter valid laps (exclude pit out laps and invalid durations)
  const validLaps = laps.filter(
    (l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap
  );
  const fastest =
    validLaps.length > 0 ? Math.min(...validLaps.map((l) => l.lap_duration!)) : null;
  const avg =
    validLaps.length > 0
      ? validLaps.reduce((s, l) => s + l.lap_duration!, 0) / validLaps.length
      : null;
  const topTrap = laps.reduce((max, l) => Math.max(max, l.st_speed || 0), 0);
  const color = driver ? teamColor(driver.team_colour) : "#E10600";

  const stats = [
    { label: "Total Laps", value: String(laps.length) },
    { label: "Fastest Lap", value: formatLapTime(fastest) },
    { label: "Avg Lap", value: formatLapTime(avg) },
    { label: "Top Trap Speed", value: topTrap > 0 ? `${topTrap} km/h` : "—" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 mb-6 md:mb-8">
      {stats.map((s: { label: string; value: string }) => (
        <div
          key={s.label}
          className="bg-[#0e0e0e] p-4 md:p-5"
          style={{ borderTop: `2px solid ${color}` }}
        >
          <div className="text-white/30 text-[0.65rem] uppercase tracking-wider mb-1">
            {s.label}
          </div>
          <div className="font-display text-xl md:text-2xl text-white leading-tight">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}