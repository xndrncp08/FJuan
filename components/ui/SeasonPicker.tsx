"use client";

/**
 * components/ui/SeasonPicker.tsx
 *
 * Recent seasons as a segmented control; everything older through a native
 * <select> (which gets the platform wheel picker on phones).
 */

import { ChevronDown } from "@/components/ui/icons";
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
    <div className={cn("flex items-center gap-2", className)}>
      <Segmented
        aria-label="Season"
        segments={recent.map((y) => ({ value: y, label: y }))}
        value={isOlder ? ("" as string) : value}
        onChange={onChange}
      />
      {older.length > 0 && (
        <label
          className={cn(
            "pressable relative inline-flex h-12 shrink-0 items-center border focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tint pl-3 pr-8 sm:pl-4 sm:pr-9 text-[0.8125rem] font-bold uppercase tracking-[0.12em]",
            isOlder ? "border-accent bg-accent text-paper" : "border-hairline bg-fill-1 text-label-3 hover:text-paper",
          )}
        >
          <span>{isOlder ? value : <><span className="sm:hidden">More</span><span className="hidden sm:inline">Earlier</span></>}</span>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 sm:right-3" aria-hidden />
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
