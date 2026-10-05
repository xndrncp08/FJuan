/**
 * components/telemetry/SourceBadge.tsx
 *
 * Says where the numbers on screen came from, and why, after a fallback.
 * Synthetic data is always labelled as such.
 */

import { Cpu, Database, Radio } from "lucide-react";
import type { TelemetrySource } from "@/lib/telemetry/types";
import { cn } from "@/lib/utils/cn";

const META: Record<TelemetrySource, { label: string; icon: typeof Radio; tone: string }> = {
  openf1: { label: "OpenF1", icon: Radio, tone: "border-success/40 text-success" },
  jolpica: { label: "Jolpica", icon: Database, tone: "border-info/40 text-info" },
  synthetic: { label: "Synthetic", icon: Cpu, tone: "border-warning/40 text-warning" },
};

export function SourceBadge({ source, detail, reason, className }: { source: TelemetrySource; detail?: string; reason?: string; className?: string }) {
  const m = META[source];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex max-w-full items-center gap-2 border bg-fill-1 px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-[0.12em]", m.tone, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="shrink-0">{m.label}</span>
      {detail && <span className="truncate font-semibold normal-case tracking-normal text-label-2">· {detail}</span>}
      {reason && <span className="truncate font-semibold normal-case tracking-normal text-label-3">({reason})</span>}
    </span>
  );
}
