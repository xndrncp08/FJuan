/**
 * components/live/SessionPicker.tsx
 *
 * Year, weekend, session — as two swipeable rails instead of a wall of
 * cards. Opens on the most recent session that has happened, so the page
 * always has something to show.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "@/components/ui/icons";
import { Session, safeArray } from "./types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";

const SESSION_TYPES = ["Practice 1", "Practice 2", "Practice 3", "Sprint Qualifying", "Sprint", "Qualifying", "Race"] as const;
const SHORT: Record<string, string> = {
  Race: "Race",
  Qualifying: "Quali",
  Sprint: "Sprint",
  "Sprint Qualifying": "Sprint Quali",
  "Practice 1": "FP1",
  "Practice 2": "FP2",
  "Practice 3": "FP3",
};

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: Math.max(1, THIS_YEAR - 2023 + 1) }, (_, i) => String(THIS_YEAR - i));

interface Weekend {
  key: string;
  circuit: string;
  country: string;
  start: number;
  sessions: Session[];
}

const started = (s: Session) => new Date(s.date_start).getTime() <= Date.now();

export default function SessionPicker({ session, onSelect }: { session: Session | null; onSelect: (s: Session) => void }) {
  const [year, setYear] = useState(String(THIS_YEAR));
  const query = useQuery({
    queryKey: ["openf1-sessions", year],
    staleTime: 600_000,
    queryFn: async ({ signal }) => {
      const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`, { signal });
      if (!res.ok) throw new Error("Sessions unavailable");
      return safeArray<Session>(await res.json()).filter((s) => (SESSION_TYPES as readonly string[]).includes(s.session_name));
    },
  });

  // Weekends in calendar order; a weekend is its circuit within the year.
  const weekends = useMemo<Weekend[]>(() => {
    const map = new Map<string, Weekend>();
    for (const s of [...(query.data ?? [])].sort((a, b) => +new Date(a.date_start) - +new Date(b.date_start))) {
      const w = map.get(s.circuit_short_name) ?? { key: s.circuit_short_name, circuit: s.circuit_short_name, country: s.country_name, start: +new Date(s.date_start), sessions: [] };
      w.sessions.push(s);
      map.set(s.circuit_short_name, w);
    }
    return [...map.values()];
  }, [query.data]);

  const active = weekends.find((w) => w.sessions.some((s) => s.session_key === session?.session_key));

  // Open on the latest session that has started (prefer the race of that weekend).
  useEffect(() => {
    if (!weekends.length || active) return;
    const live = [...weekends].reverse().find((w) => w.sessions.some(started));
    if (!live) return;
    const done = live.sessions.filter(started);
    onSelect(done.find((s) => s.session_name === "Race") ?? done[done.length - 1]);
  }, [weekends, active, onSelect]);

  const rail = useRef<HTMLOListElement>(null);
  useEffect(() => {
    rail.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active?.key]);

  const pickWeekend = (w: Weekend) => {
    const done = w.sessions.filter(started);
    const same = done.find((s) => s.session_name === session?.session_name);
    onSelect(same ?? done.find((s) => s.session_name === "Race") ?? done[done.length - 1]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label-caps text-caption text-label-3">Weekend</p>
        <label className="pressable relative inline-flex h-11 items-center border border-separator bg-fill-1 pl-3 pr-8 text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-paper focus-within:outline focus-within:outline-2 focus-within:outline-tint">
          {year}
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-label-3" />
          <select aria-label="Season" value={year} onChange={(e) => setYear(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {query.isPending ? (
        <div className="flex gap-2 overflow-hidden" role="status" aria-label="Loading sessions">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[4.25rem] w-36 shrink-0" />)}
        </div>
      ) : query.isError ? (
        <div className="status-line flex flex-wrap items-center justify-between gap-3" role="alert">
          <span>OpenF1 didn’t send the {year} sessions.</span>
          <Button size="sm" onClick={() => void query.refetch()}>Retry</Button>
        </div>
      ) : !weekends.length ? (
        <p className="status-line">No sessions recorded for {year} yet.</p>
      ) : (
        <ol ref={rail} className="scroller fade-edges-x -mx-4 gap-2 px-4 pb-1 sm:-mx-6 sm:px-6" aria-label={`${year} race weekends`}>
          {weekends.map((w, i) => {
            const open = w.sessions.some(started);
            const on = w === active;
            return (
              <li key={w.key} className="shrink-0">
                <button
                  type="button"
                  disabled={!open}
                  aria-current={on || undefined}
                  onClick={() => pickWeekend(w)}
                  className={cn(
                    "pressable relative flex h-[4.25rem] w-36 flex-col justify-center overflow-hidden border px-3 text-left",
                    on ? "border-accent bg-accent/15" : "border-separator bg-fill-1 hover:border-paper/30",
                    !open && "opacity-45",
                  )}
                >
                  {on && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent" />}
                  <span className="font-mono text-[0.6875rem] text-label-3">R{String(i + 1).padStart(2, "0")} · {new Date(w.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className="truncate text-callout font-bold text-paper">{w.circuit}</span>
                  <span className="truncate text-caption text-label-3">{open ? w.country : "Upcoming"}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {active && (
        <div role="radiogroup" aria-label="Session" className="flex flex-wrap gap-1.5">
          {active.sessions.map((s) => {
            const on = s.session_key === session?.session_key;
            const open = started(s);
            return (
              <button
                key={s.session_key}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!open}
                onClick={() => onSelect(s)}
                className={cn(
                  "pressable h-11 min-w-[3.5rem] px-3 text-[0.8125rem] font-bold uppercase tracking-[0.1em] disabled:opacity-40",
                  on ? "bg-accent text-paper" : "bg-fill-2 text-label-2 hover:bg-fill-3 hover:text-paper",
                )}
              >
                {SHORT[s.session_name] ?? s.session_name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
