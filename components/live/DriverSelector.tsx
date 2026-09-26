/**
 * components/live/DriverSelector.tsx
 *
 * Drivers in the chosen session as a grid of chips, each marked with the
 * team color OpenF1 reports. Behaves as a radio group.
 */
"use client";

import { Driver, teamColor } from "./types";
import { cn } from "@/lib/utils/cn";

export default function DriverSelector({
  drivers,
  selected,
  onSelect,
}: {
  drivers: Driver[];
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Driver" className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
      {drivers.map((d) => {
        const active = selected === d.driver_number;
        const color = teamColor(d.team_colour);
        return (
          <button
            key={d.driver_number}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(d.driver_number)}
            className={cn(
              "pressable relative overflow-hidden rounded-md p-3 text-left",
              active ? "bg-surface-3" : "bg-fill-1 hover:bg-fill-2",
            )}
            style={active ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined}
          >
            <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
            <span className="flex items-baseline justify-between gap-2 pl-1.5">
              <span className="text-callout font-bold tracking-wide text-paper">{d.name_acronym}</span>
              <span className="font-mono tabular text-caption text-label-3">{d.driver_number}</span>
            </span>
            <span className="mt-0.5 block truncate pl-1.5 text-caption text-label-3">{d.team_name}</span>
          </button>
        );
      })}
    </div>
  );
}
