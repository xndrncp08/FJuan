/**
 * components/live/DriverSelector.tsx
 *
 * Drivers in the chosen session as chips marked with the team color
 * OpenF1 reports, in finishing order when the result is known. A swipeable
 * rail on phones, a wrapping grid on wide screens. Behaves as a radio group.
 */
"use client";

import { Driver, teamColor } from "./types";
import { cn } from "@/lib/utils/cn";

export default function DriverSelector({
  drivers,
  selected,
  onSelect,
  positions,
}: {
  drivers: Driver[];
  selected: number | null;
  onSelect: (n: number) => void;
  positions?: Map<number, number>;
}) {
  return (
    <div role="radiogroup" aria-label="Driver" className="scroller fade-edges-x -mx-4 gap-2 px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(104px,1fr))] lg:px-0 lg:[mask-image:none]">
      {drivers.map((d, index) => {
        const active = selected === d.driver_number;
        const color = teamColor(d.team_colour);
        return (
          <button
            key={d.driver_number}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${positions?.get(d.driver_number) ? `P${positions.get(d.driver_number)} · ` : ""}${d.full_name} · ${d.team_name} · Car ${d.driver_number}`}
            tabIndex={active || (selected === null && index === 0) ? 0 : -1}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              const next = e.key === "Home" ? 0 : e.key === "End" ? drivers.length - 1 : (index + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1) + drivers.length) % drivers.length;
              onSelect(drivers[next].driver_number);
              (e.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
            }}
            onClick={() => onSelect(d.driver_number)}
            className={cn(
              "pressable relative w-[6.5rem] shrink-0 overflow-hidden p-3 text-left lg:w-auto",
              active ? "bg-surface-3" : "bg-fill-1 hover:bg-fill-2",
            )}
            style={active ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined}
          >
            <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
            <span className="flex items-baseline justify-between gap-2 pl-1.5">
              <span className="text-callout font-bold tracking-wide text-paper">{d.name_acronym}</span>
              <span className="font-mono tabular text-caption text-label-3">{positions?.get(d.driver_number) ? `P${positions.get(d.driver_number)}` : d.driver_number}</span>
            </span>
            <span className="mt-0.5 block truncate pl-1.5 text-caption text-label-3">{d.team_name}</span>
          </button>
        );
      })}
    </div>
  );
}
