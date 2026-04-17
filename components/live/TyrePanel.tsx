import { Stint, PitStop, TYRE_COLORS, safeArray } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  stints: Stint[];
  pits: PitStop[];
  totalLaps: number;
}

export default function TyrePanel({ stints, pits, totalLaps }: Props) {
  const safeStints = safeArray<Stint>(stints);
  const safePits = safeArray<PitStop>(pits);

  return (
    <Panel>
      <div className="p-4 md:p-6">
        <SectionLabel>Tyre Strategy</SectionLabel>

        {safeStints.length === 0 ? (
          <div className="text-white/30 text-sm">No stint data available</div>
        ) : (
          <>
            {/* Visual stint bar – horizontal with percentage widths */}
            <div className="flex h-8 mb-5 bg-white/5 border border-white/10 overflow-hidden">
              {safeStints.map((stint) => {
                const laps = (stint.lap_end || totalLaps) - stint.lap_start + 1;
                const pct = totalLaps > 0 ? (laps / totalLaps) * 100 : 0;
                const color = TYRE_COLORS[stint.compound] || TYRE_COLORS.UNKNOWN;
                return (
                  <div
                    key={stint.stint_number}
                    title={`${stint.compound} · Laps ${stint.lap_start}–${stint.lap_end || "?"}`}
                    className="flex items-center justify-center min-w-[24px] border-r border-black/40"
                    style={{ width: `${pct}%`, background: color }}
                  >
                    <span
                      className="font-mono text-[0.55rem] font-bold"
                      style={{ color: stint.compound === "MEDIUM" || stint.compound === "HARD" ? "#000" : "#fff" }}
                    >
                      {stint.compound[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stint list – each stint as a card, responsive layout */}
            <div className="flex flex-col gap-px bg-white/5">
              {safeStints.map((stint) => {
                const color = TYRE_COLORS[stint.compound] || TYRE_COLORS.UNKNOWN;
                const pit = safePits.find((p) => p.lap_number === stint.lap_start);
                return (
                  <div key={stint.stint_number} className="bg-[#111] p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                      <div>
                        <div className="font-bold text-white text-sm uppercase tracking-wide">
                          Stint {stint.stint_number} · {stint.compound}
                        </div>
                        <div className="font-mono text-[0.6rem] text-white/40 mt-1">
                          Laps {stint.lap_start}–{stint.lap_end || "?"} · Age at start: {stint.tyre_age_at_start} laps
                        </div>
                      </div>
                    </div>
                    {pit && (
                      <div className="text-f1-red text-xs font-mono sm:ml-auto">
                        {pit.pit_duration?.toFixed(1)}s pit
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}