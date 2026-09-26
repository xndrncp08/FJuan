/**
 * components/compare/HeadToHead.tsx
 *
 * The verdict first: both drivers' headline numbers side by side, and how
 * many of the compared categories each one leads.
 */

import Link from "next/link";
import { Trophy } from "lucide-react";
import type { DriverStats } from "@/lib/types/driver";
import { TeamMark } from "@/components/ui/TeamMark";
import { A_COLOR, B_COLOR } from "./constants";

export function HeadToHead({
  a,
  b,
  teamA,
  teamB,
  leadsA,
  leadsB,
}: {
  a: DriverStats;
  b: DriverStats;
  teamA: string;
  teamB: string;
  leadsA: number;
  leadsB: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <Side stats={a} team={teamA} color={A_COLOR} align="left" />
        <div className="flex flex-col items-center justify-center border-x border-hairline px-3 py-5 sm:px-8">
          <span className="label-caps text-[0.75rem] text-label-3">Leads</span>
          <span className="tabular mt-1 whitespace-nowrap text-title-2 font-bold">
            <span style={{ color: A_COLOR }}>{leadsA}</span>
            <span className="mx-1.5 text-label-4">–</span>
            <span style={{ color: B_COLOR }}>{leadsB}</span>
          </span>
        </div>
        <Side stats={b} team={teamB} color={B_COLOR} align="right" />
      </div>
    </div>
  );
}

function Side({ stats, team, color, align }: { stats: DriverStats; team: string; color: string; align: "left" | "right" }) {
  const right = align === "right";
  return (
    <Link
      href={`/drivers/${stats.driver.driverId}`}
      className={`row-interactive relative min-w-0 p-4 sm:p-6 ${right ? "text-right" : ""}`}
    >
      <span aria-hidden className={`absolute top-0 h-1 w-full ${right ? "right-0" : "left-0"}`} style={{ background: color }} />
      <div className={`flex items-center gap-2 text-footnote text-label-3 ${right ? "justify-end" : ""}`}>
        <TeamMark team={team} size="sm" />
        <span className="truncate">{team}</span>
      </div>
      <div className="mt-2 truncate text-callout text-label-2">{stats.driver.givenName}</div>
      <div className="truncate text-title-2 text-paper">{stats.driver.familyName}</div>
      <div className={`mt-4 flex flex-wrap gap-x-5 gap-y-2 ${right ? "justify-end" : ""}`}>
        <Mini label="Titles" value={stats.totalChampionships} icon={stats.totalChampionships > 0} />
        <Mini label="Wins" value={stats.totalWins} />
        <Mini label="Seasons" value={stats.seasonResults?.length || stats.careerSpan.yearsActive} />
      </div>
    </Link>
  );
}

function Mini({ label, value, icon }: { label: string; value: number; icon?: boolean }) {
  return (
    <div>
      <div className="tabular flex items-center gap-1 text-headline text-paper">
        {icon && <Trophy className="h-3.5 w-3.5 text-gold" aria-hidden />}
        {value}
      </div>
      <div className="text-caption text-label-3">{label}</div>
    </div>
  );
}
