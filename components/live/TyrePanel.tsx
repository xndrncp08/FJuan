/**
 * components/live/TyrePanel.tsx
 *
 * Tyre strategy: a proportional stint bar in real compound colors (these
 * are FIA-standard and stay as-is), then each stint with its pit stop.
 */

import { PitStop, Stint, TYRE_COLORS, safeArray } from "./types";

export default function TyrePanel({ stints, pits, totalLaps }: { stints: Stint[]; pits: PitStop[]; totalLaps: number }) {
  const list = safeArray<Stint>(stints);
  const stops = safeArray<PitStop>(pits);
  if (!list.length) return <p className="py-6 text-center text-subhead text-label-3">No stint data for this session.</p>;

  return (
    <div>
      <div className="flex h-7 gap-1 overflow-hidden rounded-sm" role="img" aria-label="Tyre stints">
        {list.map((s) => {
          const laps = (s.lap_end || totalLaps) - s.lap_start + 1;
          const color = TYRE_COLORS[s.compound] || TYRE_COLORS.UNKNOWN;
          const dark = s.compound === "MEDIUM" || s.compound === "HARD";
          return (
            <div
              key={s.stint_number}
              className="flex min-w-[20px] items-center justify-center text-caption font-bold"
              style={{ flexGrow: Math.max(1, laps), flexBasis: 0, background: color, color: dark ? "#140605" : "#F5E9E4" }}
              title={`${s.compound} · laps ${s.lap_start}–${s.lap_end || "?"}`}
            >
              {s.compound?.[0]}
            </div>
          );
        })}
      </div>

      <ul className="mt-4 divide-y divide-hairline">
        {list.map((s) => {
          const color = TYRE_COLORS[s.compound] || TYRE_COLORS.UNKNOWN;
          const stop = stops.find((p) => p.lap_number === s.lap_start);
          return (
            <li key={s.stint_number} className="flex items-center gap-3 py-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="text-subhead font-medium capitalize text-paper">
                  {s.compound?.toLowerCase()} <span className="text-label-3">· stint {s.stint_number}</span>
                </div>
                <div className="font-mono tabular text-caption text-label-3">
                  Laps {s.lap_start}–{s.lap_end || "?"} · {s.tyre_age_at_start} laps old at start
                </div>
              </div>
              {stop && <span className="font-mono tabular text-footnote font-semibold text-label-2">{stop.pit_duration?.toFixed(1)}s stop</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
