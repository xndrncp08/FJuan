"use client";

import { useState } from "react";
import { LapData, formatLapTime } from "./types";
import { SelectField } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

function best(laps: LapData[], key: keyof LapData) {
  const v = laps.map((l) => l[key] as number | null).filter((x): x is number => !!x && x > 0);
  return v.length ? Math.min(...v) : null;
}
export default function LapTimesPanel({ laps, fastestLap }: { laps: LapData[]; fastestLap: number }) {
  const [order, setOrder] = useState("recent");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(60);
  const eligible = laps.filter((l) => filter === "all" || (!l.is_pit_out_lap && (l.lap_duration ?? 0) > 0));
  const timedDuration = (lap: LapData) => !lap.is_pit_out_lap && (lap.lap_duration ?? 0) > 0 ? lap.lap_duration! : Infinity;
  const sorted = [...eligible].sort((a, b) => order === "fastest" ? timedDuration(a) - timedDuration(b) : b.lap_number - a.lap_number);
  const rows = sorted.slice(0, limit);
  const keys = ["duration_sector_1", "duration_sector_2", "duration_sector_3"] as const;
  const pbs = keys.map((k) => best(laps.filter((l) => !l.is_pit_out_lap), k));

  return <div>
    <div className="mb-4 grid grid-cols-2 gap-3"><SelectField label="Lap order" value={order} onChange={(e) => setOrder(e.target.value)}><option value="recent">Newest first</option><option value="fastest">Fastest first</option></SelectField><SelectField label="Lap type" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All laps</option><option value="racing">Timed racing laps</option></SelectField></div>
    <p className="mb-3 text-caption text-label-3">{rows.length} of {eligible.length} laps · Trap speed in km/h. Scroll across for sectors.</p>
    <div className="table-scroll -mx-5 max-h-[480px] sm:-mx-6" tabIndex={0} role="region" aria-label="Lap timing table">
      <table className="w-full min-w-[570px] text-left">
        <caption className="sr-only">Lap times, sector times and speed trap. Best sector values are labeled.</caption>
        <thead className="sticky top-0 z-10 bg-surface-1"><tr className="border-b border-hairline label-caps text-caption text-label-3"><th scope="col" className="py-3 pl-5 pr-2 font-semibold">Lap</th>{keys.map((_, i) => <th key={i} scope="col" className="px-2 py-3 text-right font-semibold">S{i + 1}</th>)}<th scope="col" className="px-2 py-3 text-right font-semibold">Lap time</th><th scope="col" className="py-3 pl-2 pr-5 text-right font-semibold">Trap</th></tr></thead>
        <tbody>{rows.map((lap) => {
          const fastest = !lap.is_pit_out_lap && lap.lap_duration !== null && Math.abs(lap.lap_duration - fastestLap) < 0.001;
          return <tr key={lap.lap_number} className={cn("border-b border-hairline last:border-0", fastest && "bg-purple/10")}>
            <th scope="row" className="py-3 pl-5 pr-2 font-mono text-footnote font-normal text-label-3">{lap.lap_number}</th>
            {keys.map((k, i) => {
              const value = lap[k] as number | null;
              const pb = value && pbs[i] && Math.abs(value - pbs[i]!) <= 0.001;
              return <td key={k} className={cn("px-2 py-3 text-right font-mono text-footnote", pb ? "text-success" : "text-label-2")}>{formatLapTime(value)}{pb && <span className="block font-sans text-caption">Best</span>}</td>;
            })}
            <td className={cn("px-2 py-3 text-right font-mono text-footnote", fastest ? "font-semibold text-purple" : "text-paper")}>{lap.is_pit_out_lap ? <span className="text-warning">Pit out</span> : formatLapTime(lap.lap_duration)}{fastest && <span className="block font-sans text-caption">Fastest lap</span>}</td>
            <td className="py-3 pl-2 pr-5 text-right font-mono text-footnote text-label-3">{lap.st_speed ?? "—"}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {limit < eligible.length && <Button className="mt-4" onClick={() => setLimit((n) => n + 60)}>Show more laps</Button>}
  </div>;
}
