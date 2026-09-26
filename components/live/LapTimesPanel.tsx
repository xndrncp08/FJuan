/**
 * components/live/LapTimesPanel.tsx
 *
 * Every lap, newest first, with sector times colored against the driver's
 * best in each sector. The fastest lap is marked purple (F1 convention).
 */

import { LapData, formatLapTime } from "./types";
import { cn } from "@/lib/utils/cn";

function best(laps: LapData[], key: keyof LapData) {
  const v = laps.map((l) => l[key] as number | null).filter((x): x is number => !!x && x > 0);
  return v.length ? Math.min(...v) : null;
}

function sectorTone(v: number | null, pb: number | null) {
  if (!v || !pb) return "text-label-4";
  const d = v - pb;
  if (d <= 0.001) return "text-success";
  if (d < 0.3) return "text-warning";
  return "text-label-2";
}

export default function LapTimesPanel({ laps, fastestLap }: { laps: LapData[]; fastestLap: number }) {
  const rows = [...laps].reverse().slice(0, 60);
  const keys = ["duration_sector_1", "duration_sector_2", "duration_sector_3"] as const;
  const pbs = keys.map((k) => best(laps, k));

  return (
    <div className="-mx-5 max-h-[560px] overflow-y-auto sm:-mx-6">
      <table className="w-full text-left">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-hairline label-caps text-[0.75rem] text-label-3">
            <th scope="col" className="py-2.5 pl-5 pr-2 font-semibold sm:pl-6">Lap</th>
            {keys.map((_, i) => (
              <th key={i} scope="col" className="hidden px-2 py-2.5 text-right font-semibold sm:table-cell">
                S{i + 1}
              </th>
            ))}
            <th scope="col" className="px-2 py-2.5 text-right font-semibold">Time</th>
            <th scope="col" className="py-2.5 pl-2 pr-5 text-right font-semibold sm:pr-6">Trap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lap) => {
            const fastest = lap.lap_duration !== null && Math.abs(lap.lap_duration - fastestLap) < 0.001;
            return (
              <tr key={lap.lap_number} className={cn("border-b border-hairline last:border-0", fastest && "bg-purple/10")}>
                <td className="font-mono tabular py-2 pl-5 pr-2 text-footnote text-label-3 sm:pl-6">{lap.lap_number}</td>
                {keys.map((k, i) => (
                  <td key={k} className={cn("font-mono tabular hidden px-2 py-2 text-right text-footnote sm:table-cell", sectorTone(lap[k] as number | null, pbs[i]))}>
                    {formatLapTime(lap[k] as number | null)}
                  </td>
                ))}
                <td className={cn("font-mono tabular px-2 py-2 text-right text-subhead", fastest ? "font-bold text-purple" : "text-paper")}>
                  {lap.is_pit_out_lap ? <span className="text-caption font-semibold text-warning">Pit out</span> : formatLapTime(lap.lap_duration)}
                </td>
                <td className="font-mono tabular py-2 pl-2 pr-5 text-right text-footnote text-label-3 sm:pr-6">{lap.st_speed ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
