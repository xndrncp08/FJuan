/**
 * components/ui/Badge.tsx
 *
 * Small capsule labels for status and metadata.
 */

import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "accent" | "live" | "success" | "warning" | "info" | "gold" | "silver" | "bronze";

const TONES: Record<Tone, string> = {
  neutral: "border-separator bg-fill-1 text-label-2",
  accent: "border-accent/50 bg-accent/15 text-tint",
  live: "border-accent bg-accent text-paper",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-info/40 bg-info/10 text-info",
  gold: "border-gold/40 bg-gold/10 text-gold",
  silver: "border-silver/40 bg-silver/10 text-silver",
  bronze: "border-bronze/40 bg-bronze/10 text-bronze",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap border px-2 text-[0.75rem] font-bold uppercase tracking-[0.12em]",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {tone === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper" aria-hidden />}
      {children}
    </span>
  );
}

/** Position number in a rounded square: medal-tinted for P1–P3. */
export function PositionBadge({ position, className }: { position: number | string; className?: string }) {
  const p = Number(position);
  const tone =
    p === 1
      ? "border-gold/50 bg-gold/10 text-gold"
      : p === 2
        ? "border-silver/50 bg-silver/10 text-silver"
        : p === 3
          ? "border-bronze/50 bg-bronze/10 text-bronze"
          : "border-hairline bg-fill-1 text-paper";
  return (
    <span
      className={cn(
        "inline-flex h-8 w-9 shrink-0 items-center justify-center border font-display text-[0.9375rem]",
        tone,
        className,
      )}
    >
      {Number.isFinite(p) ? p : position}
    </span>
  );
}
