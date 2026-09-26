/**
 * components/home/NextRaceSection.tsx
 *
 * The home page opens on the thing people come for: the next race.
 * Race name as the headline, a live countdown, and the weekend's sessions
 * in the viewer's local time. One soft ember glow; no looping decoration.
 */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type Session = { date: string; time?: string };

const SESSION_LABELS: [key: string, label: string][] = [
  ["FirstPractice", "Practice 1"],
  ["SecondPractice", "Practice 2"],
  ["ThirdPractice", "Practice 3"],
  ["SprintQualifying", "Sprint Qualifying"],
  ["SprintShootout", "Sprint Shootout"],
  ["Sprint", "Sprint"],
  ["Qualifying", "Qualifying"],
];

function toDate(s: Session | undefined): Date | null {
  if (!s?.date) return null;
  return new Date(`${s.date}T${s.time ?? "12:00:00Z"}`);
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function splitDuration(ms: number) {
  const clamp = Math.max(0, ms);
  return {
    days: Math.floor(clamp / 86_400_000),
    hours: Math.floor((clamp % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamp % 3_600_000) / 60_000),
    seconds: Math.floor((clamp % 60_000) / 1000),
  };
}

export default function NextRaceSection({ nextRace }: { nextRace: any }) {
  const now = useNow();

  const raceStart = useMemo(() => toDate(nextRace ?? undefined), [nextRace]);
  const sessions = useMemo(() => {
    if (!nextRace) return [];
    const list = SESSION_LABELS.map(([key, label]) => ({ label, at: toDate(nextRace[key]) })).filter(
      (s): s is { label: string; at: Date } => !!s.at,
    );
    if (raceStart) list.push({ label: "Race", at: raceStart });
    return list.sort((a, b) => a.at.getTime() - b.at.getTime());
  }, [nextRace, raceStart]);

  if (!nextRace || !raceStart) {
    return (
      <section className="relative overflow-hidden">
        <Glow />
        <div className="container-page relative py-20 sm:py-28">
          <p className="eyebrow mb-3">Off-season</p>
          <h1 className="text-display text-paper">The season is over.</h1>
          <p className="mt-4 max-w-prose text-body text-label-2">
            Look back at every round, or dig into driver and team history while the cars are in the garage.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/calendar" variant="filled" size="lg">
              Season results
            </ButtonLink>
            <ButtonLink href="/drivers" size="lg">
              Drivers
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  const remaining = now === null ? null : splitDuration(raceStart.getTime() - now);
  const isRaceWeekend = now !== null && sessions[0] && now >= sessions[0].at.getTime() - 86_400_000;
  const location = [nextRace.Circuit?.Location?.locality, nextRace.Circuit?.Location?.country].filter(Boolean).join(", ");

  return (
    <section className="relative overflow-hidden">
      <Glow />
      <div className="container-page relative grid items-center gap-10 pb-12 pt-10 sm:pb-16 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="animate-fade-up">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {isRaceWeekend ? <Badge tone="live">Race weekend</Badge> : <Badge tone="accent">Up next</Badge>}
            <Badge>Round {nextRace.round}</Badge>
          </div>

          <h1 className="text-display text-paper">{nextRace.raceName}</h1>

          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-callout text-label-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-label-3" aria-hidden />
              {nextRace.Circuit?.circuitName}
              {location && <span className="text-label-3">· {location}</span>}
            </span>
          </p>

          <div className="mt-8" aria-label="Time until lights out">
            <p className="mb-3 text-footnote font-medium text-label-3">Lights out in</p>
            <div className="flex gap-2.5 sm:gap-3" aria-hidden={remaining === null}>
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div
                  key={unit}
                  className="flex min-w-0 flex-1 flex-col items-center rounded-md bg-fill-1 px-2 py-3 shadow-[inset_0_0_0_1px_var(--hairline)] sm:max-w-[104px] sm:py-4"
                >
                  <span className="tabular text-[clamp(1.75rem,6vw,2.75rem)] font-bold leading-none tracking-[-0.04em] text-paper">
                    {remaining ? String(remaining[unit]).padStart(2, "0") : "--"}
                  </span>
                  <span className="mt-1.5 text-caption capitalize text-label-3">{unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/predict" variant="filled" size="lg">
              <Sparkles className="h-4 w-4" aria-hidden />
              See the prediction
            </ButtonLink>
            <ButtonLink href={`/tracks/${nextRace.Circuit?.circuitId}`} size="lg">
              About the circuit
            </ButtonLink>
          </div>
        </div>

        {/* Weekend schedule, in the viewer's local time. */}
        <Card padding="none" className="animate-fade-up overflow-hidden [animation-delay:80ms]">
          <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-headline text-paper">
              <CalendarDays className="h-[18px] w-[18px] text-tint" aria-hidden />
              Weekend schedule
            </h2>
            <span className="text-caption text-label-3">Your local time</span>
          </div>
          <ol className="px-2 pb-2">
            {sessions.map((s) => {
              const done = now !== null && s.at.getTime() < now;
              const isRace = s.label === "Race";
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-4 rounded-md px-3 py-3 sm:px-4 ${isRace ? "bg-fill-1" : ""}`}
                >
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-caption font-semibold uppercase text-label-3">
                      {now === null ? "" : s.at.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div className="tabular text-title-3 text-paper">
                      {now === null ? "" : s.at.getDate()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-callout font-semibold ${done ? "text-label-3 line-through decoration-label-4" : "text-paper"}`}>
                      {s.label}
                    </div>
                    <div className="tabular text-footnote text-label-3">
                      {now === null ? " " : s.at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  {isRace && <Badge tone="accent">Race</Badge>}
                  {done && !isRace && <span className="text-caption text-label-3">Done</span>}
                </li>
              );
            })}
          </ol>
          <Link
            href="/calendar"
            className="row-interactive flex items-center justify-between border-t border-hairline px-5 py-3.5 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint sm:px-6"
          >
            Full calendar
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>
    </section>
  );
}

function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] max-w-[160%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(var(--accent)/0.28),transparent)]" />
      <div className="absolute -right-40 top-40 h-[420px] w-[420px] bg-[radial-gradient(closest-side,rgb(var(--ember)/0.12),transparent)]" />
    </div>
  );
}
