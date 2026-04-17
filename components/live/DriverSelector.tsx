"use client";

import { Driver, teamColor } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  drivers: Driver[];
  selected: number | null;
  onSelect: (n: number) => void;
}

export default function DriverSelector({ drivers, selected, onSelect }: Props) {
  return (
    <Panel>
      <div className="p-4 md:p-6">
        <SectionLabel>Select Driver</SectionLabel>
        {/* Flex wrap with smaller gap on mobile */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {drivers.map((d) => {
            const isSelected = selected === d.driver_number;
            const color = teamColor(d.team_colour);
            return (
              <button
                key={d.driver_number}
                onClick={() => onSelect(d.driver_number)}
                className="flex items-center gap-2 px-3 py-2 transition-all"
                style={{
                  background: isSelected ? `${color}22` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {/* Team color stripe */}
                <div className="w-0.5 h-4" style={{ background: color }} />
                <div className="text-left">
                  <div className="font-sans font-bold text-sm text-white tracking-wide">
                    {d.name_acronym}
                  </div>
                  <div className="font-mono text-[0.6rem] text-white/40">
                    #{d.driver_number}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}