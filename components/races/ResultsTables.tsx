"use client";

/**
 * Race and qualifying classifications behind one segmented control.
 * On phones each row keeps position, driver (team underneath), and the
 * headline number; secondary columns appear from sm up.
 */

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, Timer } from "lucide-react";
import { SearchField } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { InsightNote } from "@/components/ui/InsightNote";
import { Segmented } from "@/components/ui/Segmented";
import { PositionBadge } from "@/components/ui/Badge";
import { TeamMark } from "@/components/ui/TeamMark";
import { shortTeamName } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

type View = "race" | "qualifying";

export default function ResultsTables({ results, qualifying }: { results: any[]; qualifying: any[] }) {
  const [view, setView] = useState<View>(results.length ? "race" : "qualifying");

  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<"summary" | "full">("summary");
  const match = (r: any) => `${r.Driver?.givenName} ${r.Driver?.familyName} ${r.Driver?.code ?? ""} ${r.Constructor?.name}`.toLowerCase().includes(query.trim().toLowerCase());
  const raceRows = results.filter(match);
  const qualiRows = qualifying.filter(match);

  return (
    <div>
      {results.length > 0 && qualifying.length > 0 && (
        <Segmented
          aria-label="Session"
          className="mb-5"
          value={view}
          onChange={setView}
          segments={[
            { value: "race", label: "Race" },
            { value: "qualifying", label: "Qualifying" },
          ]}
        />
      )}
      <div className="mb-5 grid items-end gap-4 sm:grid-cols-[1fr_auto]">
        <SearchField label="Filter the classification" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Driver or team" />
        <Segmented aria-label="Classification detail" value={detail} onChange={setDetail} segments={[{ value: "summary", label: "Summary" }, { value: "full", label: "All columns" }]} />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-footnote text-label-3">{view === "race" ? raceRows.length : qualiRows.length} drivers · {view === "race" ? "Race classification" : "Qualifying classification"}</p>{query && <Button size="sm" variant="plain" onClick={() => setQuery("")}>Clear filter</Button>}</div>
      {detail === "full" && <p className="mb-3 text-caption text-label-3">Scroll horizontally to explore every column.</p>}
      <div className="card table-scroll" tabIndex={0} role="region" aria-label={`${view === "race" ? "Race" : "Qualifying"} results`}>
        {view === "race" ? <RaceTable results={raceRows} full={detail === "full"} /> : <QualiTable rows={qualiRows} full={detail === "full"} />}
        {!(view === "race" ? raceRows.length : qualiRows.length) && <EmptyState title="No matching drivers" action={<Button onClick={() => setQuery("")}>Clear filter</Button>} />}
      </div>
      <div className="mt-5"><InsightNote title="Reading the classification">Race time shows the winner’s elapsed time, then gaps or retirement status. Grid is starting position; arrows show places gained or lost. Qualifying has three elimination stages, Q1–Q3; a dash means no time was recorded in that stage. A purple label identifies the fastest race lap.</InsightNote></div>
    </div>
  );
}

function DriverCell({ r }: { r: any }) {
  return (
    <Link href={`/drivers/${r.Driver?.driverId}`} className="group flex min-h-11 min-w-0 flex-col justify-center">
      <div className="truncate text-callout text-paper group-hover:text-tint">
        <span className="hidden text-label-2 sm:inline">{r.Driver?.givenName} </span>
        <span className="font-semibold">{r.Driver?.familyName}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 truncate text-footnote text-label-3 md:hidden">
        <TeamMark team={r.Constructor?.constructorId} size="sm" />
        {shortTeamName(r.Constructor?.name, r.Constructor?.constructorId)}
      </div>
    </Link>
  );
}

function TeamCell({ r }: { r: any }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-subhead text-label-2">
      <TeamMark team={r.Constructor?.constructorId} size="sm" />
      <span className="truncate">{shortTeamName(r.Constructor?.name, r.Constructor?.constructorId)}</span>
    </span>
  );
}

function RaceTable({ results, full }: { results: any[]; full: boolean }) {
  return (
    <table className={cn("w-full text-left", full && "min-w-[760px]")}>
      <caption className="sr-only">Complete session classification</caption>
      <thead>
        <tr className="border-b border-hairline label-caps text-[0.75rem] text-label-3">
          <th scope="col" className="w-14 py-3 pl-4 pr-2 font-semibold sm:pl-5">Pos</th>
          <th scope="col" className="px-2 py-3 font-semibold">Driver</th>
          <th scope="col" className={cn("w-[24%] px-2 py-3 font-semibold", !full && "hidden md:table-cell")}>Team</th>
          <th scope="col" className={cn("w-20 px-2 py-3 text-right font-semibold", !full && "hidden sm:table-cell")}>Grid</th>
          <th scope="col" className="w-28 px-2 py-3 text-right font-semibold">Time</th>
          {full && <><th scope="col" className="px-2 py-3 text-right font-semibold">Laps</th><th scope="col" className="px-2 py-3 font-semibold">Status</th></>}
          <th scope="col" className="w-14 py-3 pl-2 pr-4 text-right font-semibold sm:pr-5">Pts</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => {
          const pos = parseInt(r.position);
          const grid = parseInt(r.grid);
          const gained = grid > 0 && Number.isFinite(pos) ? grid - pos : 0;
          const finished = !!r.Time?.time || /^\+\d+ Laps?$|^Finished$|^Lapped$/i.test(r.status ?? "");
          const fastest = r.FastestLap?.rank === "1";
          return (
            <tr key={r.position} className="row-interactive border-b border-hairline last:border-0">
              <td className="py-3 pl-4 pr-2 sm:pl-5">
                <PositionBadge position={r.positionText === "R" ? "—" : r.position} />
              </td>
              <td className="max-w-0 px-2 py-3">
                <DriverCell r={r} />
              </td>
              <td className={cn("max-w-0 px-2 py-3", !full && "hidden md:table-cell")}>
                <TeamCell r={r} />
              </td>
              <td className={cn("px-2 py-3 text-right", !full && "hidden sm:table-cell")}>
                <span className="font-mono tabular inline-flex items-center gap-1 text-subhead text-label-2">
                  {grid > 0 ? grid : "Pit"}
                  {gained !== 0 && (
                    <span className={cn("inline-flex items-center text-caption font-semibold", gained > 0 ? "text-success" : "text-label-3")}>
                      {gained > 0 ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}
                      {Math.abs(gained)}
                      <span className="sr-only">{gained > 0 ? "places gained" : "places lost"}</span>
                    </span>
                  )}
                </span>
              </td>
              <td className="px-2 py-3 text-right">
                <div className={cn("font-mono tabular text-footnote break-words", finished ? "text-paper" : "text-label-3")}>
                  {r.Time?.time ?? r.status}
                </div>
                {fastest && (
                  <div className="mt-0.5 inline-flex items-center gap-1 text-caption font-semibold text-purple">
                    <Timer className="h-3 w-3" aria-hidden />
                    Fastest lap
                  </div>
                )}
              </td>
              {full && <><td className="px-2 py-3 text-right font-mono text-footnote text-label-2">{r.laps}</td><td className="px-2 py-3 text-footnote text-label-2">{r.status}</td></>}
              <td className={cn("font-mono tabular py-3 pl-2 pr-4 text-right text-subhead font-semibold sm:pr-5", Number(r.points) > 0 ? "text-paper" : "text-label-4")}>
                {r.points}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function QualiTable({ rows, full }: { rows: any[]; full: boolean }) {
  return (
    <table className={cn("w-full text-left", full && "min-w-[760px]")}>
      <caption className="sr-only">Complete session classification</caption>
      <thead>
        <tr className="border-b border-hairline label-caps text-[0.75rem] text-label-3">
          <th scope="col" className="w-14 py-3 pl-4 pr-2 font-semibold sm:pl-5">Pos</th>
          <th scope="col" className="px-2 py-3 font-semibold">Driver</th>
          <th scope="col" className={cn("w-[24%] px-2 py-3 font-semibold", !full && "hidden md:table-cell")}>Team</th>
          <th scope="col" className={cn("w-24 px-2 py-3 text-right font-semibold", !full && "hidden sm:table-cell")}>Q1</th>
          <th scope="col" className={cn("w-24 px-2 py-3 text-right font-semibold", !full && "hidden sm:table-cell")}>Q2</th>
          <th scope="col" className="w-24 py-3 pl-2 pr-4 text-right font-semibold sm:pr-5">
            <span className={full ? "hidden" : "sm:hidden"}>Best</span>
            <span className={full ? "inline" : "hidden sm:inline"}>Q3</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const best = r.Q3 || r.Q2 || r.Q1 || "—";
          return (
            <tr key={r.position} className="row-interactive border-b border-hairline last:border-0">
              <td className="py-3 pl-4 pr-2 sm:pl-5">
                <PositionBadge position={r.position} />
              </td>
              <td className="max-w-0 px-2 py-3">
                <DriverCell r={r} />
              </td>
              <td className={cn("max-w-0 px-2 py-3", !full && "hidden md:table-cell")}>
                <TeamCell r={r} />
              </td>
              {(["Q1", "Q2"] as const).map((q) => (
                <td key={q} className={cn("font-mono tabular px-2 py-3 text-right text-subhead", !full && "hidden sm:table-cell", r[q] ? "text-label-2" : "text-label-4")}>
                  {r[q] || "—"}
                </td>
              ))}
              <td className="font-mono tabular py-3 pl-2 pr-4 text-right text-subhead font-semibold text-paper sm:pr-5">
                <span className={full ? "hidden" : "sm:hidden"}>{best}</span>
                <span className={cn(full ? "inline" : "hidden sm:inline", !r.Q3 && "font-normal text-label-4")}>{r.Q3 || "—"}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
