/**
 * app/drivers/page.tsx
 *
 * Drivers' championship for any season since 1950. The top three get cards;
 * everyone else is a compact, fully tappable row. Rows collapse to
 * position / name / points on phones.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { useSeasonChoice } from "@/lib/hooks/useSeasonChoice";
import { SearchField, SelectField } from "@/components/ui/Fields";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useDriverStandings } from "@/lib/hooks/useDrivers";
import { PageHeader, Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PositionBadge } from "@/components/ui/Badge";
import { TeamMark } from "@/components/ui/TeamMark";
import { SeasonPicker } from "@/components/ui/SeasonPicker";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { teamColor } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

const currentYear = new Date().getFullYear();

const MEDAL_TEXT = ["text-gold", "text-silver", "text-bronze"];
const MEDAL_BG = ["bg-gold/15", "bg-silver/15", "bg-bronze/15"];

async function fetchSeasonStandings(season: string) {
  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`, { cache: "force-cache" });
    if (!res.ok) throw new Error("Standings service unavailable");
    const data = await res.json();
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch {
    throw new Error("Standings service unavailable");
  }
}

export default function DriversPage() {
  const [season, setSeason] = useSeasonChoice();
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [scoring, setScoring] = useState("all");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: current, isLoading, isError, refetch } = useDriverStandings();
  const isCurrent = season === String(currentYear);

  useEffect(() => {
    let cancelled = false;
    if (isCurrent) {
      setRows(current || []);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    fetchSeasonStandings(season).then((data) => {
      if (cancelled) return;
      setRows(data);
    }).catch(() => { if (!cancelled) { setRows([]); setFailed(true); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, [season, current, isCurrent, attempt]);

  const teams = [...new Map(rows.flatMap((r) => (r.Constructors ?? []).map((c: any) => [c.constructorId, c.name] as const))).entries()];
  const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const shown = rows.filter((s) => normalize(`${s.Driver.givenName} ${s.Driver.familyName} ${s.Driver.code ?? ""}`).includes(normalize(query.trim())) && (!team || s.Constructors?.some((c: any) => c.constructorId === team)) && (scoring === "all" || (scoring === "points" ? Number(s.points) > 0 : Number(s.wins) > 0)));
  const resetFilters = () => { setQuery(""); setTeam(""); setScoring("all"); };
  const busy = (isCurrent && isLoading) || loading;
  const leader = Math.max(...rows.map((d) => parseFloat(d.points) || 0), 1);

  return (
    <>
      <PageHeader
        eyebrow={`${season} season`}
        title="Driver Standings"
        watermark="F1"
        description="The drivers’ championship, from this weekend back to 1950. Tap anyone for their full career."
      >
        <div className="flex flex-wrap items-center justify-between gap-4"><SeasonPicker value={season} onChange={(value) => { setSeason(value); resetFilters(); }} /><ButtonLink href="/teams" variant="plain" size="sm">Constructor standings</ButtonLink></div>
      </PageHeader>

      <Section className="pt-0 sm:pt-0">
        {busy ? (
          <LoadingState />
        ) : (isCurrent ? isError : failed) ? (<Card><EmptyState title="Standings unavailable" description="The data service didn’t respond. Your season is saved; try again." action={<Button onClick={() => isCurrent ? void refetch() : setAttempt((n) => n + 1)}>Retry standings</Button>} /></Card>) : rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users />}
              title={`No standings for ${season}`}
              description="Standings appear once the first race of the season has been run."
            />
          </Card>
        ) : (
          <div className="space-y-5">
            {rows.length >= 3 && (
              <div className="leader-grid">
                {rows.slice(0, 3).map((s, i) => (
                  <LeaderCard key={s.Driver.driverId} standing={s} place={i} leader={leader} />
                ))}
              </div>
            )}

            <div className="filter-toolbar">
              <SearchField label="Find a driver" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or driver code" />
              <SelectField label="Team" value={team} onChange={(e) => setTeam(e.target.value)}><option value="">All teams</option>{teams.map(([id, name]) => <option key={String(id)} value={String(id)}>{String(name)}</option>)}</SelectField>
              <SelectField label="Results" value={scoring} onChange={(e) => setScoring(e.target.value)}><option value="all">All drivers</option><option value="points">Points scorers</option><option value="wins">Race winners</option></SelectField>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-footnote text-label-3">{shown.length} of {rows.length} drivers · Championship order</p>{(query || team || scoring !== "all") && <Button size="sm" variant="plain" onClick={resetFilters}>Clear filters</Button>}</div>
            <Card padding="none" className="overflow-hidden">
              <div className="classification-heading">
                <h2 className="text-headline">The classification</h2>
                <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-label-3">{rows.length} drivers / {season}</span>
              </div>
              <div className="hidden grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(0,1fr)_3.5rem_6rem_1rem] gap-4 border-b border-hairline px-5 py-3 label-caps text-[0.75rem] text-label-3 sm:grid">
                <span>Pos</span>
                <span>Driver</span>
                <span>Team</span>
                <span className="text-right">Wins</span>
                <span className="text-right">Points</span>
                <span />
              </div>
              <ol>
                {shown.map((s) => (
                  <StandingRow key={s.Driver.driverId} standing={s} leader={leader} />
                ))}
              </ol>
              {!shown.length && <EmptyState title="No drivers match" description="Try another name or broaden the team and results filters." action={<Button onClick={resetFilters}>Clear filters</Button>} />}
            </Card>
          </div>
        )}
      </Section>
    </>
  );
}

function LeaderCard({ standing, place, leader }: { standing: any; place: number; leader: number }) {
  const d = standing.Driver;
  const team = standing.Constructors?.[0];
  const pts = parseFloat(standing.points) || 0;

  return (
    <Link href={`/drivers/${d.driverId}`} className="card card-interactive leader-panel group block p-5 sm:p-7">
      <span className="leader-number" aria-hidden>{d.permanentNumber ?? standing.position}</span>
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: teamColor(team?.constructorId ?? team?.name) }} aria-hidden />
      <div className="relative flex items-center justify-between">
        <span className={cn("inline-flex h-8 items-center px-3 text-subhead font-bold", MEDAL_TEXT[place], MEDAL_BG[place])}>
          P{standing.position}
        </span>
        <ChevronRight className="h-4 w-4 text-label-3 group-hover:text-tint" aria-hidden />
      </div>
      <div className="relative mt-10">
        <div className="text-callout text-label-2">{d.givenName}</div>
        <div className="truncate text-title-2 leading-tight text-paper">{d.familyName}</div>
        <div className="mt-2 flex items-center gap-2 text-footnote text-label-3">
          <TeamMark team={team?.constructorId ?? team?.name} size="sm" />
          {team?.name ?? "—"}
        </div>
      </div>
      <div className="relative mt-8 flex items-end justify-between gap-4 border-t border-hairline pt-4">
        <div>
          <div className="tabular text-stat-lg text-paper">{standing.points}</div>
          <div className="label-caps mt-1 text-caption text-label-3">Championship points</div>
        </div>
        <div className="text-right">
          <div className="tabular font-mono text-[1.125rem] font-semibold text-paper">{standing.wins}</div>
          <div className="text-caption text-label-3">Wins</div>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden bg-fill-1" aria-hidden>
        <div className="h-full" style={{ width: `${(pts / leader) * 100}%`, background: teamColor(team?.constructorId ?? team?.name) }} />
      </div>
    </Link>
  );
}

function StandingRow({ standing, leader }: { standing: any; leader: number }) {
  const d = standing.Driver;
  const team = standing.Constructors?.[0];
  const pts = parseFloat(standing.points) || 0;
  const wins = parseInt(standing.wins) || 0;

  return (
    <li className="border-b border-hairline last:border-0">
      <Link
        href={`/drivers/${d.driverId}`}
        className="row-interactive grid grid-cols-[2.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3 px-4 py-3 sm:grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(0,1fr)_3.5rem_6rem_1rem] sm:gap-4 sm:px-5"
      >
        <PositionBadge position={standing.position} />
        <div className="min-w-0">
          <div className="truncate text-callout text-paper">
            <span className="text-label-2">{d.givenName} </span>
            <span className="font-semibold">{d.familyName}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-footnote text-label-3 sm:hidden">
            <TeamMark team={team?.constructorId ?? team?.name} size="sm" />
            {team?.name}
          </div>
        </div>
        <div className="hidden min-w-0 items-center gap-2 text-subhead text-label-2 sm:flex">
          <TeamMark team={team?.constructorId ?? team?.name} size="sm" />
          <span className="truncate">{team?.name}</span>
        </div>
        <div className={cn("tabular hidden text-right text-subhead sm:block", wins ? "text-paper" : "text-label-4")}>{wins}</div>
        <div className="text-right">
          <div className="tabular text-callout font-semibold text-paper">{standing.points}</div>
          <div className="ml-auto mt-1 hidden h-1 w-full overflow-hidden bg-fill-1 sm:block" aria-hidden>
            <div className="h-full bg-label-3" style={{ width: `${(pts / leader) * 100}%` }} />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-label-4" aria-hidden />
      </Link>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading standings">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[248px] rounded-lg" />
        ))}
      </div>
      <div className="card space-y-3 p-5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
