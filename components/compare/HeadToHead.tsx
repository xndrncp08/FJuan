"use client";

/**
 * components/compare/HeadToHead.tsx
 *
 * The face-off: both drivers' portraits squared up across a VS, with how
 * many of the compared categories each one leads. Tapping a side's
 * "Change" opens the picker for that slot; the centre button swaps them.
 */

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Trophy } from "@/components/ui/icons";
import type { DriverStats } from "@/lib/types/driver";
import type { DriverPhoto } from "@/lib/api/driverPhotos";
import { TeamMark } from "@/components/ui/TeamMark";
import { cn } from "@/lib/utils/cn";
import { A_COLOR, B_COLOR } from "./constants";

export type Slot = "a" | "b";

export function HeadToHead({
  a,
  b,
  teamA,
  teamB,
  leadsA,
  leadsB,
  editing,
  onEdit,
  onSwap,
}: {
  a: DriverStats;
  b: DriverStats;
  teamA: string;
  teamB: string;
  leadsA: number;
  leadsB: number;
  editing: Slot | null;
  onEdit: (slot: Slot) => void;
  onSwap: () => void;
}) {
  return (
    <div className="card relative overflow-hidden">
      <div aria-hidden className="tex-dots pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2" style={{ background: `radial-gradient(80% 70% at 20% 100%, ${A_COLOR}2e, transparent 70%)` }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/2" style={{ background: `radial-gradient(80% 70% at 80% 100%, ${B_COLOR}2e, transparent 70%)` }} />

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch">
        <Side key={a.driver.driverId} stats={a} team={teamA} color={A_COLOR} slot="a" editing={editing === "a"} onEdit={onEdit} />
        <div className="flex flex-col items-center justify-center gap-3 px-1 py-6 sm:px-6">
          <span key={`${a.driver.driverId}-${b.driver.driverId}`} className="vs-pop font-display text-[clamp(1.75rem,6vw,3.5rem)] leading-none text-paper/90">VS</span>
          <span className="tabular whitespace-nowrap text-headline font-bold" aria-label={`Categories led: ${a.driver.familyName} ${leadsA}, ${b.driver.familyName} ${leadsB}`}>
            <span style={{ color: A_COLOR }}>{leadsA}</span>
            <span className="mx-1 text-label-4">–</span>
            <span style={{ color: B_COLOR }}>{leadsB}</span>
          </span>
          <button type="button" onClick={onSwap} aria-label="Swap drivers" className="pressable flex h-11 w-11 items-center justify-center border border-separator bg-canvas/60 text-label-2 hover:border-accent/60 hover:text-paper">
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>
        <Side key={b.driver.driverId} stats={b} team={teamB} color={B_COLOR} slot="b" editing={editing === "b"} onEdit={onEdit} />
      </div>
    </div>
  );
}

function usePhoto(stats: DriverStats) {
  const d = stats.driver;
  return useQuery({
    queryKey: ["driver-photo", d.driverId],
    staleTime: Infinity,
    queryFn: async () => {
      const q = new URLSearchParams({ family: d.familyName, ...(d.code && { code: d.code }), ...(d.permanentNumber && { number: d.permanentNumber }), ...(d.url && { url: d.url }) });
      const res = await fetch(`/api/driver-photo?${q}`);
      return res.ok ? ((await res.json()) as DriverPhoto | null) : null;
    },
  }).data;
}

function Side({ stats, team, color, slot, editing, onEdit }: { stats: DriverStats; team: string; color: string; slot: Slot; editing: boolean; onEdit: (slot: Slot) => void }) {
  const right = slot === "b";
  const photo = usePhoto(stats);
  const [broken, setBroken] = useState(false);
  const d = stats.driver;

  return (
    <div className={cn("relative flex min-w-0 flex-col p-3 pt-0 sm:p-6 sm:pt-0", right ? "slide-in-r items-end text-right" : "slide-in-l items-start")}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="relative mt-4 h-28 w-full max-w-[12rem] sm:h-48">
        {photo && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.src}
            alt={`${d.givenName} ${d.familyName}`}
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className={cn("h-full w-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]", photo.source === "Formula1.com" ? "object-contain object-bottom" : "object-cover object-top")}
          />
        ) : (
          <span aria-hidden className={cn("tabular absolute bottom-0 font-display text-[5rem] leading-[0.8] sm:text-[8rem]", right ? "right-0" : "left-0")} style={{ color, opacity: 0.85 }}>
            {d.permanentNumber || d.code || "?"}
          </span>
        )}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(${right ? "270deg" : "90deg"}, ${color}, transparent)` }} />
      </div>

      <Link href={`/drivers/${d.driverId}`} className="group mt-3 block min-w-0 max-w-full">
        <span className="block truncate text-footnote text-label-2">{d.givenName}</span>
        <span className="block break-words font-display text-[clamp(1.05rem,4vw,2rem)] uppercase leading-none tracking-tight text-paper group-hover:text-tint">{d.familyName}</span>
      </Link>
      <div className={cn("mt-2 flex max-w-full items-center gap-1.5 text-caption text-label-3", right && "flex-row-reverse")}>
        <TeamMark team={team} size="sm" />
        <span className="truncate">{team}</span>
      </div>
      <div className={cn("mt-3 flex flex-wrap gap-x-4 gap-y-1", right && "justify-end")}>
        <Mini label="Titles" value={stats.totalChampionships} trophy={stats.totalChampionships > 0} />
        <Mini label="Wins" value={stats.totalWins} />
      </div>
      <button
        type="button"
        onClick={() => onEdit(slot)}
        aria-expanded={editing}
        aria-controls="compare-picker"
        className={cn("pressable mt-4 inline-flex h-11 items-center gap-2 border px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", editing ? "border-tint text-paper" : "border-separator text-label-2 hover:border-paper/30 hover:text-paper")}
      >
        <span className="h-2 w-2" style={{ background: color }} aria-hidden />
        Change<span className="sr-only"> driver {slot.toUpperCase()}</span>
      </button>
    </div>
  );
}

function Mini({ label, value, trophy }: { label: string; value: number; trophy?: boolean }) {
  return (
    <div>
      <div className="tabular flex items-center gap-1 text-headline text-paper">
        {trophy && <Trophy className="h-3.5 w-3.5 text-gold" />}
        {value}
      </div>
      <div className="text-caption text-label-3">{label}</div>
    </div>
  );
}
