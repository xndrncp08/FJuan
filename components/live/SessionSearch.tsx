/**
 * components/live/SessionSearch.tsx
 *
 * Pick a session: year, then a race weekend, then which session of that
 * weekend. Race cards show only the sessions that actually exist.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Session } from "./types";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";

const SESSION_TYPES = ["Race", "Qualifying", "Sprint", "Practice 1", "Practice 2", "Practice 3"] as const;
const SHORT: Record<string, string> = {
  Race: "Race",
  Qualifying: "Quali",
  Sprint: "Sprint",
  "Practice 1": "FP1",
  "Practice 2": "FP2",
  "Practice 3": "FP3",
};

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => String(THIS_YEAR - i));

interface RaceGroup {
  circuit: string;
  country: string;
  round: number;
  dateStart: string;
  sessions: Record<string, Session>;
}

export default function SessionSearch({ onSelect }: { onSelect: (session: Session) => void }) {
  const [year, setYear] = useState(String(THIS_YEAR));
  const [all, setAll] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("Race");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setAll([]);
    setQuery("");
    fetch(`https://api.openf1.org/v1/sessions?year=${year}`)
      .then((r) => r.json())
      .then((data: Session[]) => {
        if (!cancelled) setAll(Array.isArray(data) ? data.filter((s) => (SESSION_TYPES as readonly string[]).includes(s.session_name)) : []);
      })
      .catch(() => !cancelled && setError("Couldn’t load sessions from OpenF1."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [year]);

  const races = useMemo<RaceGroup[]>(() => {
    const map = new Map<string, RaceGroup>();
    [...all]
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .forEach((s) => {
        if (!map.has(s.circuit_short_name)) {
          map.set(s.circuit_short_name, {
            circuit: s.circuit_short_name,
            country: s.country_name,
            round: map.size + 1,
            dateStart: s.date_start,
            sessions: {},
          });
        }
        map.get(s.circuit_short_name)!.sessions[s.session_name] = s;
      });
    // Weekends already underway, most recent first; upcoming ones after, soonest first.
    const now = Date.now();
    const list = Array.from(map.values());
    const started = list.filter((r) => new Date(r.dateStart).getTime() <= now).reverse();
    const upcoming = list.filter((r) => new Date(r.dateStart).getTime() > now);
    return [...started, ...upcoming];
  }, [all]);

  const hasStarted = (s?: Session) => !!s && new Date(s.date_start).getTime() <= Date.now();

  const q = query.trim().toLowerCase();
  const shown = q ? races.filter((r) => r.circuit.toLowerCase().includes(q) || r.country.toLowerCase().includes(q)) : races;

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented aria-label="Year" value={year} onChange={setYear} segments={YEARS.map((y) => ({ value: y, label: y }))} />
        <label className="relative flex h-10 items-center sm:w-72">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-label-3" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Circuit or country"
            aria-label="Filter by circuit or country"
            className="h-10 w-full bg-fill-1 pl-9 pr-4 text-subhead text-paper outline-none transition-colors placeholder:text-label-4 focus:bg-fill-2 focus-visible:outline-2 focus-visible:outline-tint"
          />
        </label>
      </div>

      <div className="mt-3">
        <Segmented
          aria-label="Session type"
          size="sm"
          value={type}
          onChange={setType}
          segments={SESSION_TYPES.map((t) => ({ value: t, label: SHORT[t] }))}
        />
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-label="Loading sessions">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-md" />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Sessions unavailable" description={error} />
        ) : shown.length === 0 ? (
          <EmptyState title={q ? `Nothing matches “${query}”` : `No sessions for ${year} yet`} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((race) => {
              const session = hasStarted(race.sessions[type]) ? race.sessions[type] : undefined;
              const available = SESSION_TYPES.filter((t) => hasStarted(race.sessions[t]));
              const upcoming = available.length === 0;
              return (
                <li key={race.circuit}>
                  <div className={cn("rounded-md bg-fill-1 p-4 transition-colors", session && "hover:bg-fill-2")}>
                    <button
                      type="button"
                      disabled={!session}
                      onClick={() => session && onSelect(session)}
                      className="pressable block w-full rounded-xs text-left disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-callout font-semibold", upcoming ? "text-label-3" : "text-paper")}>{race.circuit}</span>
                        {upcoming && <span className="shrink-0 label-caps text-[0.75rem] text-label-3">Upcoming</span>}
                      </span>
                      <span className="block truncate text-footnote text-label-3">
                        {race.country} ·{" "}
                        {new Date(race.dateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {available.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setType(t);
                            onSelect(race.sessions[t]);
                          }}
                          className={cn(
                            "pressable h-7 px-2.5 text-caption font-semibold",
                            t === type ? "bg-accent text-paper" : "bg-fill-2 text-label-2 hover:bg-fill-3 hover:text-paper",
                          )}
                        >
                          {SHORT[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
