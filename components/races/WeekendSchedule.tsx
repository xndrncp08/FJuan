"use client";

import { useState, useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { Card } from "@/components/ui/Card";

const subscribe = () => () => {};
const getZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getServerZone = () => "UTC";

export function WeekendSchedule({ race }: { race: any }) {
  const [mode, setMode] = useState<"local" | "utc">("local");
  const local = useSyncExternalStore(subscribe, getZone, getServerZone);
  const zone = mode === "utc" ? "UTC" : local;
  const sessions = [
    { label: "Practice 1", session: race.FirstPractice },
    { label: "Practice 2", session: race.SecondPractice },
    { label: "Practice 3", session: race.ThirdPractice },
    { label: "Sprint qualifying", session: race.SprintQualifying ?? race.SprintShootout },
    { label: "Sprint", session: race.Sprint },
    { label: "Qualifying", session: race.Qualifying },
    { label: "Race", session: { date: race.date, time: race.time } },
  ].filter((s) => s.session?.date).sort((a, b) => `${a.session.date}T${a.session.time ?? "00:00:00Z"}`.localeCompare(`${b.session.date}T${b.session.time ?? "00:00:00Z"}`));

  return <Card padding="none">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-5 sm:p-6"><div><h2 className="text-title-3 text-paper">Weekend schedule</h2><p className="mt-1 text-footnote text-label-3">Times in {zone.replaceAll("_", " ")}</p></div><Segmented aria-label="Schedule time zone" value={mode} onChange={setMode} segments={[{ value: "local", label: "Your time" }, { value: "utc", label: "UTC" }]} /></div>
    <ol className="divide-y divide-hairline">{sessions.map(({ label, session }) => {
      const date = new Date(`${session.date}T${session.time ?? "00:00:00Z"}`);
      return <li key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-6"><span className={label === "Race" ? "text-headline text-tint" : "text-callout text-paper"}>{label}</span><time dateTime={`${session.date}${session.time ? `T${session.time}` : ""}`} className="text-right"><span className="block text-footnote text-label-2">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: session.time ? zone : "UTC" })}</span><span className="block font-mono text-footnote text-paper">{session.time ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: zone }) : "Time TBC"}</span></time></li>;
    })}</ol>
  </Card>;
}
