"use client";

/**
 * components/ui/SeasonPicker.tsx
 *
 * Recent seasons as a segmented control; everything older through a native
 * <select> (which gets the platform wheel picker on phones).
 */

import { ChevronDown } from "lucide-react";
import { Segmented } from "./Segmented";
import { cn } from "@/lib/utils/cn";

export function SeasonPicker({
  value,
  onChange,
  firstYear = 1950,
  lastYear = new Date().getFullYear(),
  quick = 4,
  className,
}: {
  value: string;
  onChange: (season: string) => void;
  firstYear?: number;
  lastYear?: number;
  quick?: number;
  className?: string;
}) {
  const recent = Array.from({ length: quick }, (_, i) => String(lastYear - i));
  const older = Array.from({ length: Math.max(0, lastYear - quick - firstYear + 1) }, (_, i) => String(lastYear - quick - i));
  const isOlder = !recent.includes(value);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Segmented
        aria-label="Season"
        segments={recent.map((y) => ({ value: y, label: y }))}
        value={isOlder ? ("" as string) : value}
        onChange={onChange}
      />
      {older.length > 0 && (
        <label
          className={cn(
            "pressable relative inline-flex h-10 items-center border pl-4 pr-9 text-[0.8125rem] font-bold uppercase tracking-[0.12em]",
            isOlder ? "border-accent bg-accent text-paper" : "border-hairline bg-fill-1 text-label-3 hover:text-paper",
          )}
        >
          <span>{isOlder ? value : "Earlier"}</span>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4" aria-hidden />
          <select
            aria-label="Earlier season"
            value={isOlder ? value : ""}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="" disabled>
              Choose a season
            </option>
            {older.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
