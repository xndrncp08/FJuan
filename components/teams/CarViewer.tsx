/**
 * components/teams/CarViewer.tsx
 *
 * One car on the CarStage with a toggle between its two official side
 * profiles (liveries aren't symmetric, so these are two real renders).
 */

"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { CarStage, type StageCar } from "./CarStage";

export function CarViewer({ car }: { car: StageCar }) {
  const [side, setSide] = useState<"left" | "right">("right");
  const both = !!car.left && !!car.right;
  return (
    <div className="glass relative overflow-hidden">
      <CarStage car={car} side={side} direction={0} className="aspect-[16/8] min-h-[220px] sm:aspect-[16/7]" />
      {/* Below the car on phones, overlaid on the floor from sm up. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-edge)] p-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:border-0 sm:p-4">
        <span className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-label-3">Render · Formula1.com</span>
        {both && (
          <Segmented
            size="sm"
            aria-label="Side"
            value={side}
            onChange={setSide}
            segments={[
              { value: "left", label: "Left side" },
              { value: "right", label: "Right side" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
