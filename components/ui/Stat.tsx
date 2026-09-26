/**
 * components/ui/Stat.tsx
 *
 * A number with a label under it. Numbers are tabular so rows of stats
 * align. `StatGrid` lays out stats in a card with hairline dividers.
 */

import { cn } from "@/lib/utils/cn";

export function Stat({
  label,
  value,
  hint,
  size = "md",
  accent,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "tabular truncate text-paper",
          size === "lg" ? "text-stat-lg" : size === "md" ? "text-stat" : "font-display text-[1.375rem] leading-none",
        )}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="label-caps mt-1.5 truncate text-[0.75rem] text-label-3">{label}</div>
      {hint && <div className="mt-0.5 truncate text-caption text-label-3">{hint}</div>}
    </div>
  );
}

/**
 * Stats in an auto-fitting grid. `min` is the smallest a cell may shrink to
 * before wrapping, so it never overflows on a phone.
 */
export function StatGrid({
  children,
  min = 140,
  className,
}: {
  children: React.ReactNode;
  min?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-x-6 gap-y-5", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {children}
    </div>
  );
}
