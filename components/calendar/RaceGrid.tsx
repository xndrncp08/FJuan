"use client";

/**
 * components/calendar/RaceGrid.tsx
 *
 * A season in three blocks, top to bottom:
 *   1. the next race, large, with a countdown and the circuit map
 *   2. a strip of every round (done / next / to come) that doubles as the
 *      season progress bar
 *   3. two plain lists: races still to come, and results (newest first)
 * Past seasons skip straight to the results list in round order.
 */

import Link from "next/link";
import { useNow } from "@/lib/hooks/useNow";
import { CalendarX, ChevronRight, Flag, MapPin } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import circuits from "@/lib/data/circuits.json";
import { cn } from "@/lib/utils/cn";

const RACE_DURATION_MS = 3 * 60 * 60 * 1000;
const LAYOUTS = new Map(circuits.map((c) => [c.id, c.layoutUrl]));

const raceStart = (race: any) => new Date(`${race.date}T${race.time ?? "12:00:00Z"}`);
const dayOf = (race: any) => new Date(`${race.date}T00:00:00Z`);
const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...opts });


export default function RaceGrid({ races, season }: { races: any[]; season: string }) {
  const now = useNow(30_000);

  if (races.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<CalendarX />} title={`No races for ${season}`} description="The schedule for this season hasn’t been published yet." />
      </div>
    );
  }
  if (now === null) return <div className="min-h-[60vh]" aria-busy="true" />;

  const isDone = (r: any) => raceStart(r).getTime() + RACE_DURATION_MS < now;
  const done = races.filter(isDone);
  const ahead = races.filter((r) => !isDone(r));
  const next = ahead[0];
  const live = ahead.length < races.length && ahead.length > 0;
  const results = live ? [...done].reverse() : done;

  return (
    <div className="space-y-10 sm:space-y-14">
      {next && <NextRace race={next} season={season} now={now} />}
      <RoundStrip races={races} season={season} doneCount={done.length} nextRound={next?.round} />

      {ahead.length > 1 && (
        <RaceList title="Still to come" count={ahead.length - 1} races={ahead.slice(1)} season={season} />
      )}
      {results.length > 0 && (
        <RaceList title={live ? "Results" : `${season} results`} count={results.length} races={results} season={season} done note={live ? "Most recent first" : undefined} />
      )}
    </div>
  );
}

function NextRace({ race, season, now }: { race: any; season: string; now: number }) {
  const start = raceStart(race);
  const ms = Math.max(0, start.getTime() - now);
  const parts = [
    { v: Math.floor(ms / 86_400_000), l: "Days" },
    { v: Math.floor((ms % 86_400_000) / 3_600_000), l: "Hrs" },
    { v: Math.floor((ms % 3_600_000) / 60_000), l: "Min" },
  ];
  const underway = ms === 0;
  const fp1 = race.FirstPractice?.date ? new Date(`${race.FirstPractice.date}T00:00:00Z`) : null;
  const layout = LAYOUTS.get(race.Circuit?.circuitId);

  return (
    <Link
      href={`/races/${season}/${race.round}`}
      id={`round-${race.round}`}
      className="card card-interactive card-accent group relative grid overflow-hidden md:grid-cols-[1.1fr_1fr]"
    >
      <div className="relative z-10 flex flex-col p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="live">{underway ? "Race weekend" : "Next race"}</Badge>
          <span className="label-caps text-caption text-label-3">Round {race.round}</span>
          {race.Sprint && <Badge tone="accent">Sprint</Badge>}
        </div>
        <h2 className="mt-4 font-display text-[clamp(1.75rem,6vw,3rem)] uppercase leading-[0.95] tracking-tight text-paper">{race.raceName}</h2>
        <p className="mt-3 flex items-center gap-1.5 text-callout text-label-2">
          <MapPin className="h-4 w-4 shrink-0 text-tint" />
          <span className="truncate">{race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}</span>
        </p>
        <p className="mt-1 text-footnote text-label-3">
          {fp1 ? `${fmt(fp1, { month: "short", day: "numeric" })} – ` : ""}{fmt(dayOf(race), { month: "short", day: "numeric", year: "numeric" })}
        </p>

        <div className="mt-6 flex items-end gap-2 sm:gap-3" aria-label={underway ? "Race underway" : `Starts in ${parts.map((p) => `${p.v} ${p.l}`).join(" ")}`} role="timer">
          {parts.map((p) => (
            <div key={p.l} className="min-w-[4.25rem] border border-separator bg-fill-1 px-3 py-2 text-center" aria-hidden>
              <div className="tabular font-display text-[1.75rem] leading-none text-paper">{String(p.v).padStart(2, "0")}</div>
              <div className="label-caps mt-1 text-[0.6875rem] text-label-3">{p.l}</div>
            </div>
          ))}
        </div>

        <span className="mt-6 inline-flex min-h-11 items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint">
          Weekend schedule <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>

      <div className="tex-grid relative min-h-[11rem] border-t border-separator md:border-l md:border-t-0">
        {layout ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={layout} alt={`${race.Circuit?.circuitName} layout`} className="circuit-map absolute inset-0 h-full w-full object-contain p-6 opacity-90 group-hover:scale-[1.04]" />
        ) : (
          <Flag className="absolute inset-0 m-auto h-16 w-16 text-label-4" />
        )}
        <span aria-hidden className="calendar-scan pointer-events-none absolute inset-y-0 w-1/3" />
      </div>
    </Link>
  );
}

/** Every round as a segment; filled = done, lit = next. Each one links to its round. */
function RoundStrip({ races, season, doneCount, nextRound }: { races: any[]; season: string; doneCount: number; nextRound?: string }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between text-footnote">
        <span className="text-label-2">
          <span className="tabular font-semibold text-paper">{doneCount}</span> of <span className="tabular">{races.length}</span> rounds complete
        </span>
        <span className="tabular text-label-3">{Math.round((doneCount / races.length) * 100)}%</span>
      </div>
      <ol className="flex gap-[3px]" aria-label="Rounds">
        {races.map((r, i) => {
          const done = i < doneCount;
          const next = r.round === nextRound;
          return (
            <li key={r.round} className="min-w-0 flex-1">
              <Link
                href={`/races/${season}/${r.round}`}
                title={`Round ${r.round} · ${r.raceName}`}
                aria-label={`Round ${r.round}, ${r.raceName}${done ? ", results" : next ? ", next race" : ""}`}
                className="group flex h-11 items-end"
              >
                <span
                  className={cn(
                    "block w-full transition-[height,background-color] duration-200 group-hover:h-6 group-focus-visible:h-6",
                    done ? "h-3 bg-accent" : next ? "h-5 bg-tint animate-pulse" : "h-3 bg-fill-3",
                    !next && "strip-seg",
                  )}
                  style={{ animationDelay: `${i * 20}ms` }}
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RaceList({ title, count, races, season, done, note }: { title: string; count: number; races: any[]; season: string; done?: boolean; note?: string }) {
  return (
    <section aria-labelledby={`list-${title}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-t border-separator pt-5">
        <h2 id={`list-${title}`} className="text-title-3 text-paper">
          {title} <span className="tabular text-label-3">{count}</span>
        </h2>
        {note && <span className="text-footnote text-label-3">{note}</span>}
      </div>
      <ol className={cn("grid gap-2", done && "sm:grid-cols-2")}>
        {races.map((r, i) => {
          const d = dayOf(r);
          return (
            <li key={r.round} id={`round-${r.round}`} className="stagger-in" style={{ ["--i" as string]: Math.min(i, 12) }}>
              <Link
                href={`/races/${season}/${r.round}`}
                className="card card-interactive group grid min-h-[4.25rem] grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-4"
              >
                <span className={cn("flex flex-col items-center py-1", done ? "text-label-3" : "text-paper")}>
                  <span className="label-caps text-[0.6875rem]">{fmt(d, { month: "short" })}</span>
                  <span className="tabular font-display text-[1.375rem] leading-none">{d.getUTCDate()}</span>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-callout font-semibold text-paper">{r.raceName.replace(/ Grand Prix$/, " GP")}</span>
                    {r.Sprint && <span className="label-caps shrink-0 text-[0.625rem] text-tint">Sprint</span>}
                  </span>
                  <span className="block truncate text-footnote text-label-3">
                    R{r.round} · {r.Circuit?.Location?.locality}, {r.Circuit?.Location?.country}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-label-3 group-hover:text-tint">
                  {done && <span className="label-caps hidden text-[0.6875rem] sm:inline">Results</span>}
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
