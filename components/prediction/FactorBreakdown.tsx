/**
 * components/prediction/FactorBreakdown.tsx
 *
 * One row per model factor: the driver's 0–100 score as a bar, with a tick
 * at the field average so "above/below the field" reads at a glance.
 * Replaces a radar + a delta bar chart with something you can read on a phone.
 */

import type { DriverPrediction } from "@/lib/types/prediction";
import { cn } from "@/lib/utils/cn";
import { FACTORS, isFactorActive } from "./factors";

export function FactorBreakdown({
  driver,
  field,
  color,
  isWet,
  isSprint,
}: {
  driver: DriverPrediction;
  field: DriverPrediction[];
  color: string;
  isWet: boolean;
  isSprint: boolean;
}) {
  return (
    <ul className="space-y-3">
      {FACTORS.map((f) => {
        const value = driver.factors[f.key] ?? 0;
        const avg = field.length ? field.reduce((s, d) => s + (d.factors[f.key] ?? 0), 0) / field.length : 50;
        const active = isFactorActive(f.context, isWet, isSprint);
        const delta = Math.round(value - avg);
        return (
          <li key={f.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-footnote">
              <span className="text-label-2">
                {f.label}
                <span className="ml-1.5 text-caption text-label-3">{f.weight}%</span>
                {!active && <span className="ml-1.5 text-caption text-label-3">· not in play</span>}
              </span>
              <span className="tabular flex items-baseline gap-2">
                {active && delta !== 0 && (
                  <span className={cn("text-caption", delta > 0 ? "text-success" : "text-label-3")}>
                    {delta > 0 ? "+" : "−"}
                    {Math.abs(delta)} vs field
                  </span>
                )}
                <span className="font-semibold text-paper">{Math.round(value)}</span>
              </span>
            </div>
            <div className={cn("relative h-2 bg-fill-1", !active && "opacity-40")} aria-hidden>
              <div className="h-full" style={{ width: `${Math.max(2, value)}%`, background: color }} />
              <span className="absolute -top-0.5 h-3 w-0.5 bg-paper/70" style={{ left: `calc(${avg}% - 1px)` }} title="Field average" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
