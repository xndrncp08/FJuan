"use client";

/**
 * components/calendar/RaceGrid.tsx
 *
 * A season as a list grouped by month, like a calendar app's agenda view.
 * Completed rounds link to results; upcoming rounds link to the circuit.
 * The next race is highlighted in place rather than pulled out of order.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarX, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";

const RACE_DURATION_MS = 3 * 60 * 60 * 1000;

function raceStart(race: any) {
  return new Date(`${race.date}T${race.time ?? "12:00:00Z"}`);
}

// Whole calendar days between now and the start, in the viewer's time zone.
function relativeDays(start: Date, now: number) {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const n = new Date(now);
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const days = Math.round((startDay - today) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  return `In ${Math.round(days / 7)} weeks`;
}

export default function RaceGrid({ races, season }: { races: any[]; season: string }) {
  // Time-dependent UI is resolved after mount so server and client agree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  if (races.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<CalendarX />} title={`No races for ${season}`} description="The schedule for this season hasn’t been published yet." />
      </div>
    );
  }

  const isDone = (r: any) => now !== null && raceStart(r).getTime() + RACE_DURATION_MS < now;
  const nextIndex = now === null ? -1 : races.findIndex((r) => !isDone(r));

  const months: { key: string; label: string; races: any[] }[] = [];
  for (const r of races) {
    const d = new Date(`${r.date}T00:00:00Z`);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const label = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
    if (months[months.length - 1]?.key !== key) months.push({ key, label, races: [] });
    months[months.length - 1].races.push(r);
  }

  return (
    <div className="space-y-8">
      {months.map((m) => (
        <section key={m.key} aria-labelledby={`m-${m.key}`}>
          <h2 id={`m-${m.key}`} className="mb-3 text-title-3 text-paper">
            {m.label}
          </h2>
          <ol className="card overflow-hidden">
            {m.races.map((r) => {
              const idx = races.indexOf(r);
              const done = isDone(r);
              const next = idx === nextIndex;
              const d = new Date(`${r.date}T00:00:00Z`);
              const href = done ? `/races/${season}/${r.round}` : `/tracks/${r.Circuit?.circuitId}`;
              const sprint = !!r.Sprint;

              return (
                <li key={r.round} className="border-b border-hairline last:border-0">
                  <Link
                    href={href}
                    className={cn(
                      "row-interactive grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-5",
                      next && "bg-accent/10",
                    )}
                  >
                    <div className={cn("flex flex-col items-center rounded-sm py-1.5", next ? "bg-accent text-paper" : "bg-fill-1")}>
                      <span className={cn("text-caption font-semibold uppercase", next ? "text-paper" : "text-label-3")}>
                        {d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                      </span>
                      <span className={cn("tabular text-title-3 font-bold leading-tight", next ? "text-paper" : done ? "text-label-2" : "text-paper")}>
                        {d.getUTCDate()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("truncate text-callout font-semibold", done ? "text-label-2" : "text-paper")}>{r.raceName}</span>
                        {sprint && <Badge className="hidden sm:inline-flex">Sprint</Badge>}
                      </div>
                      <div className="mt-0.5 truncate text-footnote text-label-3">
                        Round {r.round} · {r.Circuit?.Location?.locality}, {r.Circuit?.Location?.country}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {next && now !== null ? (
                        <Badge tone="live">{relativeDays(raceStart(r), now)}</Badge>
                      ) : done ? (
                        <span className="hidden text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint sm:inline">Results</span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 text-label-4" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Season progress for the page header: "14 of 24 rounds complete". */
export function SeasonProgress({ races }: { races: any[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  if (!races.length || now === null) return <div className="h-[42px]" aria-hidden />;

  const done = races.filter((r) => raceStart(r).getTime() + RACE_DURATION_MS < now).length;
  const pct = (done / races.length) * 100;

  return (
    <div className="max-w-md">
      <div className="mb-2 flex justify-between text-footnote">
        <span className="text-label-2">
          <span className="tabular font-semibold text-paper">{done}</span> of <span className="tabular">{races.length}</span> rounds complete
        </span>
        <span className="tabular text-label-3">{Math.round(pct)}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden bg-fill-2"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={races.length}
        aria-label="Season progress"
      >
        <div className="h-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
