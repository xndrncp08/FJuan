/**
 * components/live/StatsSummary.tsx
 *
 * Headline numbers for the selected driver's session.
 */

import { Driver, LapData, formatLapTime } from "./types";
import { Stat, StatGrid } from "@/components/ui/Stat";

export default function StatsSummary({ laps }: { laps: LapData[]; driver: Driver | null }) {
  const valid = laps.filter((l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap);
  const fastest = valid.length ? Math.min(...valid.map((l) => l.lap_duration!)) : null;
  const avg = valid.length ? valid.reduce((s, l) => s + l.lap_duration!, 0) / valid.length : null;
  const topTrap = laps.reduce((m, l) => Math.max(m, l.st_speed || 0), 0);
  const pitLaps = laps.filter((l) => l.is_pit_out_lap).length;
  const consistency = fastest && valid.length ? Math.round((valid.filter((l) => l.lap_duration! - fastest < 1).length / valid.length) * 100) : null;

  return (
    <div className="card p-5 sm:p-6">
      <StatGrid min={130}>
        <Stat label="Laps" value={laps.length} hint={pitLaps ? `${pitLaps} pit ${pitLaps === 1 ? "stop" : "stops"}` : undefined} />
        <Stat label="Fastest lap" value={formatLapTime(fastest)} accent="rgb(var(--purple))" />
        <Stat label="Average lap" value={formatLapTime(avg)} hint={fastest && avg ? `+${(avg - fastest).toFixed(3)}s to best` : undefined} />
        <Stat label="Consistency" value={consistency !== null ? `${consistency}%` : "—"} hint="Laps within 1s of best" />
        <Stat label="Top speed" value={topTrap > 0 ? topTrap : "—"} hint={topTrap > 0 ? "km/h at the speed trap" : undefined} />
      </StatGrid>
    </div>
  );
}
