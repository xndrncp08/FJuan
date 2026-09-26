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
    const data = await res.json();
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch {
    return [];
  }
}

export default function DriversPage() {
  const [season, setSeason] = useState(String(currentYear));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: current, isLoading } = useDriverStandings();
  const isCurrent = season === String(currentYear);

  useEffect(() => {
    let cancelled = false;
    if (isCurrent) {
      setRows(current || []);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSeasonStandings(season).then((data) => {
      if (cancelled) return;
      setRows(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [season, current, isCurrent]);

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
        <SeasonPicker value={season} onChange={setSeason} />
      </PageHeader>

      <Section className="pt-0 sm:pt-0">
        {busy ? (
          <LoadingState />
        ) : rows.length === 0 ? (
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
              <div className="grid gap-4 md:grid-cols-3">
                {rows.slice(0, 3).map((s, i) => (
                  <LeaderCard key={s.Driver.driverId} standing={s} place={i} leader={leader} />
                ))}
              </div>
            )}

            <Card padding="none" className="overflow-hidden">
              <div className="hidden grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(0,1fr)_3.5rem_6rem_1rem] gap-4 border-b border-hairline px-5 py-3 label-caps text-[0.75rem] text-label-3 sm:grid">
                <span>Pos</span>
                <span>Driver</span>
                <span>Team</span>
                <span className="text-right">Wins</span>
                <span className="text-right">Points</span>
                <span />
              </div>
              <ol>
                {rows.slice(rows.length >= 3 ? 3 : 0).map((s) => (
                  <StandingRow key={s.Driver.driverId} standing={s} leader={leader} />
                ))}
              </ol>
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
    <Link href={`/drivers/${d.driverId}`} className="card card-interactive block p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex h-8 items-center px-3 text-subhead font-bold", MEDAL_TEXT[place], MEDAL_BG[place])}>
          P{standing.position}
        </span>
        {d.permanentNumber && <span className="tabular text-title-3 font-bold text-label-3">#{d.permanentNumber}</span>}
      </div>
      <div className="mt-6">
        <div className="text-callout text-label-2">{d.givenName}</div>
        <div className="truncate text-title-2 text-paper">{d.familyName}</div>
        <div className="mt-2 flex items-center gap-2 text-footnote text-label-3">
          <TeamMark team={team?.constructorId ?? team?.name} size="sm" />
          {team?.name ?? "—"}
        </div>
      </div>
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-hairline pt-4">
        <div>
          <div className="tabular text-stat text-paper">{standing.points}</div>
          <div className="text-caption text-label-3">Points</div>
        </div>
        <div className="text-right">
          <div className="tabular text-title-3 font-semibold text-paper">{standing.wins}</div>
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
