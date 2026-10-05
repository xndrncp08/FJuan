// app/teams/page.tsx — Constructors' standings
//
// Server component: fetches live standings from Jolpica and merges with
// local constructors.json for colors, base, founded, and title history.
// Falls back to the static list if the API call fails.

import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";
import ConstructorCharts from "@/components/teams/ConstructorCharts";
import { PageHeader, Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PositionBadge } from "@/components/ui/Badge";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getLiveTeamColours, resolveTeamColour } from "@/lib/api/teamLogos";
import { shortTeamName, teamColor } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Teams" };

const CURRENT_IDS = ["ferrari", "mercedes", "red_bull", "mclaren", "alpine", "aston_martin", "williams", "haas", "rb", "sauber"];

const MEDAL_TEXT = ["text-gold", "text-silver", "text-bronze"];
const MEDAL_BG = ["bg-gold/15", "bg-silver/15", "bg-bronze/15"];

export default async function TeamsPage() {
  const season = String(new Date().getFullYear());
  let standings: any[] = [];
  const [standingsResult, liveColours] = await Promise.all([
    getConstructorStandings("current").catch(() => []),
    getLiveTeamColours(),
  ]);
  standings = standingsResult ?? [];

  const teams =
    standings.length > 0
      ? standings.map((s: any) => {
          const local = constructorsData.find(
            (c) => c.id === s.Constructor.constructorId || s.Constructor.name.toLowerCase().includes(c.id.replace("_", " ")),
          );
          return {
            constructorId: s.Constructor.constructorId,
            name: s.Constructor.name,
            nationality: s.Constructor.nationality,
            position: parseInt(s.position) || 0,
            points: parseFloat(s.points) || 0,
            wins: parseInt(s.wins) || 0,
            championships: local?.championships ?? 0,
            color: liveColours.length
              ? resolveTeamColour(s.Constructor.constructorId, liveColours)
              : local?.color ?? teamColor(s.Constructor.constructorId),
            base: local?.base ?? "",
            founded: local?.founded ?? 0,
          };
        })
      : constructorsData
          .filter((c) => CURRENT_IDS.includes(c.id))
          .map((c, i) => ({
            constructorId: c.id,
            name: c.name,
            nationality: c.nationality,
            position: i + 1,
            points: 0,
            wins: 0,
            championships: c.championships,
            color: c.color,
            base: c.base,
            founded: c.founded,
          }));

  const leader = teams[0]?.points || 1;
  const totalPoints = teams.reduce((s, t) => s + t.points, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${season} season`}
        title="Constructor Standings"
        watermark="CTORS"
        description="The constructors’ championship — points, wins, and every team’s title history."
      />

      <Section className="pt-0 sm:pt-0">
        <div className="space-y-5">
          {teams.length >= 3 && (
            <div className="grid gap-4 md:grid-cols-3">
              {teams.slice(0, 3).map((t, i) => (
                <Link key={t.constructorId} href={`/teams/${t.constructorId}`} className="card card-interactive relative block overflow-hidden p-5 sm:p-6">
                  <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: t.color }} />
                  <div className="flex items-center justify-between">
                    <span className={cn("inline-flex h-8 items-center px-3 text-subhead font-bold", MEDAL_TEXT[i], MEDAL_BG[i])}>
                      P{t.position || i + 1}
                    </span>
                    {t.championships > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-footnote text-label-3">
                        <Trophy className="h-3.5 w-3.5 text-gold" aria-hidden />
                        <span className="tabular">{t.championships}</span> {t.championships === 1 ? "title" : "titles"}
                      </span>
                    )}
                  </div>
                  <div className="mt-6">
                    <TeamLogo team={t.constructorId} season={Number(season)} color={t.color} size="lg" className="mb-4" />
                    <div className="truncate text-title-3 text-paper">{shortTeamName(t.name, t.constructorId)}</div>
                    <div className="mt-1 truncate text-footnote text-label-3">
                      {[t.base.split(",")[0], t.founded ? `Since ${t.founded}` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="mt-6 flex items-end justify-between border-t border-hairline pt-4">
                    <div>
                      <div className="tabular text-stat text-paper">{t.points}</div>
                      <div className="text-caption text-label-3">Points</div>
                    </div>
                    <div className="text-right">
                      <div className="tabular text-title-3 font-semibold text-paper">{t.wins}</div>
                      <div className="text-caption text-label-3">Wins</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Card padding="none" className="overflow-hidden">
            <div className="hidden grid-cols-[2.5rem_minmax(0,1.6fr)_4rem_4rem_minmax(0,1fr)_5rem_1rem] gap-4 border-b border-hairline px-5 py-3 label-caps text-[0.75rem] text-label-3 md:grid">
              <span>Pos</span>
              <span>Team</span>
              <span className="text-right">Wins</span>
              <span className="text-right">Share</span>
              <span>Base</span>
              <span className="text-right">Points</span>
              <span />
            </div>
            <ol>
              {teams.map((t, i) => (
                <li key={t.constructorId} className="border-b border-hairline last:border-0">
                  <Link
                    href={`/teams/${t.constructorId}`}
                    className="row-interactive grid grid-cols-[2.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3 px-4 py-3 md:grid-cols-[2.5rem_minmax(0,1.6fr)_4rem_4rem_minmax(0,1fr)_5rem_1rem] md:gap-4 md:px-5"
                  >
                    <PositionBadge position={t.position || i + 1} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TeamLogo team={t.constructorId} season={Number(season)} color={t.color} size="sm" />
                        <span className="truncate text-callout font-semibold text-paper">{shortTeamName(t.name, t.constructorId)}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden bg-fill-1" aria-hidden>
                        <div className="h-full" style={{ width: `${Math.max(1, (t.points / leader) * 100)}%`, background: t.color }} />
                      </div>
                    </div>
                    <span className={cn("tabular hidden text-right text-subhead md:block", t.wins ? "text-paper" : "text-label-4")}>{t.wins}</span>
                    <span className="tabular hidden text-right text-subhead text-label-2 md:block">
                      {totalPoints ? ((t.points / totalPoints) * 100).toFixed(1) : "0.0"}%
                    </span>
                    <span className="hidden truncate text-subhead text-label-3 md:block">{t.base.split(",")[0] || "—"}</span>
                    <span className="tabular text-right text-callout font-semibold text-paper">{t.points}</span>
                    <ChevronRight className="h-4 w-4 text-label-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <ConstructorCharts teams={teams} season={season} />
        </div>
      </Section>
    </>
  );
}
