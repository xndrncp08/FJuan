"use client";

/**
 * components/ui/Segmented.tsx
 *
 * Tab strip in the FJUAN style (bordered, uppercase) with an iOS-style
 * sliding selection: the red "thumb" is a shared-layout element, so it glides
 * between segments and can be retargeted mid-flight.
 * Scrolls horizontally when segments don't fit.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface Segment<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}) {
  const id = useId();
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("no-scrollbar inline-flex max-w-full overflow-x-auto border border-hairline bg-fill-1 p-0.5", className)}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "pressable relative shrink-0 whitespace-nowrap font-bold uppercase tracking-[0.12em]",
              size === "sm" ? "h-8 px-3 text-[0.75rem]" : "h-9 px-4 text-[0.8125rem]",
              active ? "text-paper" : "text-label-3 hover:text-paper",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 bg-accent shadow-[0_0_16px_rgb(var(--accent)/0.35)]"
                transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.35 }}
              />
            )}
            <span className="relative">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
