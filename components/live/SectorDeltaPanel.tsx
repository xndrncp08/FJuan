/**
 * components/live/SectorDeltaPanel.tsx
 *
 * The last eight laps' sector times against the driver's best in each
 * sector. Green = matched or beat the best, amber = within 0.3s.
 */
"use client";

import { LapData, formatLapTime } from "./types";
import { cn } from "@/lib/utils/cn";

function best(laps: LapData[], key: keyof LapData) {
  const v = laps.map((l) => l[key] as number | null).filter((x): x is number => !!x && x > 0);
  return v.length ? Math.min(...v) : null;
}

function tone(d: number | null) {
  if (d === null) return "text-label-4";
  if (d <= 0.001) return "text-success";
  if (d < 0.3) return "text-warning";
  return "text-label-2";
}

export default function SectorDeltaPanel({ laps }: { laps: LapData[] }) {
  const valid = laps.filter((l) => !l.is_pit_out_lap && l.lap_duration);
  const keys = ["duration_sector_1", "duration_sector_2", "duration_sector_3"] as const;
  const pbs = keys.map((k) => best(valid, k));
  const rows = [...valid].reverse().slice(0, 8);

  if (!rows.length) return <p className="py-6 text-center text-subhead text-label-3">No sector data for this session.</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="label-caps text-[0.75rem] text-label-3">
          <th scope="col" className="pb-2 font-semibold">Lap</th>
          {keys.map((_, i) => (
            <th key={i} scope="col" className="pb-2 text-right font-semibold">
              S{i + 1}
            </th>
          ))}
        </tr>
        <tr className="border-b border-hairline">
          <th scope="row" className="pb-2.5 text-caption font-semibold text-purple">Best</th>
          {pbs.map((pb, i) => (
            <td key={i} className="font-mono tabular pb-2.5 text-right text-footnote font-semibold text-purple">
              {formatLapTime(pb)}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((lap) => (
          <tr key={lap.lap_number} className="border-b border-hairline last:border-0">
            <th scope="row" className="font-mono tabular py-2 text-footnote font-medium text-label-3">
              {lap.lap_number}
            </th>
            {keys.map((k, i) => {
              const v = lap[k] as number | null;
              const d = v && pbs[i] ? v - pbs[i]! : null;
              return (
                <td key={k} className={cn("font-mono tabular py-2 text-right text-footnote", tone(d))}>
                  {d === null ? "—" : d <= 0.001 ? "Best" : `+${d.toFixed(3)}`}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
