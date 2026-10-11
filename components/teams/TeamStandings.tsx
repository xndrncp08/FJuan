"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import ConstructorCharts from "@/components/teams/ConstructorCharts";
import { PageHeader, Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { SearchField, SelectField } from "@/components/ui/Fields";
import { PositionBadge } from "@/components/ui/Badge";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { shortTeamName } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

export interface StandingTeam {
  constructorId: string; name: string; nationality: string; position: number; points: number; wins: number; championships: number; color: string; base: string; founded: number;
}
const MEDAL_TEXT = ["text-gold", "text-silver", "text-bronze"];
const MEDAL_BG = ["bg-gold/15", "bg-silver/15", "bg-bronze/15"];

export default function TeamStandings({ teams, season, available }: { teams: StandingTeam[]; season: string; available: boolean }) {
  const [query, setQuery] = useState("");
  const [nationality, setNationality] = useState("");
  const [order, setOrder] = useState("championship");
  const countries = [...new Set(teams.map((t) => t.nationality).filter(Boolean))].sort();
  const shown = teams.filter((t) => `${t.name} ${t.base}`.toLowerCase().includes(query.trim().toLowerCase()) && (!nationality || t.nationality === nationality)).sort((a, b) => order === "titles" ? b.championships - a.championships : order === "name" ? a.name.localeCompare(b.name) : a.position - b.position);
  const reset = () => { setQuery(""); setNationality(""); setOrder("championship"); };
  const leader = teams[0]?.points || 1;
  const totalPoints = teams.reduce((s, t) => s + t.points, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${season} season`}
        title={available ? "Constructor Standings" : "Team Directory"}
        watermark="CTORS"
        description={available ? "The constructors’ championship — points, wins, and every team’s title history." : "Explore the season’s teams, their drivers and the cars they race."}
      />

      <Section className="pt-0 sm:pt-0">
        <div className="space-y-5">
          {available && teams.length >= 3 && (
            <div className="leader-grid">
              {teams.slice(0, 3).map((t, i) => (
                <Link key={t.constructorId} href={`/teams/${t.constructorId}`} className="card card-interactive leader-panel relative block overflow-hidden p-5 sm:p-7">
                  <span className="leader-number" aria-hidden>{String(t.position || i + 1).padStart(2, "0")}</span>
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
                  <div className="relative mt-8">
                    <TeamLogo team={t.constructorId} season={Number(season)} color={t.color} size="lg" className="mb-4" />
                    <div className="truncate text-title-3 text-paper">{shortTeamName(t.name, t.constructorId)}</div>
                    <div className="mt-1 truncate text-footnote text-label-3">
                      {[t.base.split(",")[0], t.founded ? `Since ${t.founded}` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="mt-6 flex items-end justify-between border-t border-hairline pt-4">
                    <div>
                      <div className="tabular text-stat-lg text-paper">{t.points}</div>
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

          {!available && <p className="status-line" role="status">Championship standings are unavailable. Team profiles remain available; no ranking or points are inferred.</p>}
          <div className="filter-toolbar">
            <SearchField label="Find a team" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Team name or base" />
            <SelectField label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)}><option value="">All nationalities</option>{countries.map((c) => <option key={c}>{c}</option>)}</SelectField>
            <SelectField label="Order" value={order} onChange={(e) => setOrder(e.target.value)}><option value="championship">Championship</option><option value="titles">Most titles</option><option value="name">Team name</option></SelectField>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-footnote text-label-3">{shown.length} of {teams.length} teams</p>{(query || nationality || order !== "championship") && <Button size="sm" variant="plain" onClick={reset}>Clear filters</Button>}</div>
          <Card padding="none" className="overflow-hidden">
            <div className="classification-heading">
              <h2 className="text-headline">Constructor classification</h2>
              <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-label-3">{teams.length} teams / {season}</span>
            </div>
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
              {shown.map((t) => (
                <li key={t.constructorId} className="border-b border-hairline last:border-0">
                  <Link
                    href={`/teams/${t.constructorId}`}
                    className="row-interactive grid grid-cols-[2.5rem_minmax(0,1fr)_auto_1rem] items-center gap-3 px-4 py-3 md:grid-cols-[2.5rem_minmax(0,1.6fr)_4rem_4rem_minmax(0,1fr)_5rem_1rem] md:gap-4 md:px-5"
                  >
                    <PositionBadge position={available ? t.position : "—"} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TeamLogo team={t.constructorId} season={Number(season)} color={t.color} size="sm" />
                        <span className="truncate text-callout font-semibold text-paper">{shortTeamName(t.name, t.constructorId)}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden bg-fill-1" aria-hidden>
                        <div className="h-full" style={{ width: `${Math.max(1, (t.points / leader) * 100)}%`, background: t.color }} />
                      </div>
                    </div>
                    <span className={cn("tabular hidden text-right text-subhead md:block", t.wins ? "text-paper" : "text-label-4")}>{available ? t.wins : "—"}</span>
                    <span className="tabular hidden text-right text-subhead text-label-2 md:block">
                      {totalPoints ? ((t.points / totalPoints) * 100).toFixed(1) : "—"}{available && "%"}
                    </span>
                    <span className="hidden truncate text-subhead text-label-3 md:block">{t.base.split(",")[0] || "—"}</span>
                    <span className="tabular text-right text-callout font-semibold text-paper">{available ? t.points : "—"}</span>
                    <ChevronRight className="h-4 w-4 text-label-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
            {!shown.length && <EmptyState title="No teams match" description="Broaden your filters to return to the full grid." action={<Button onClick={reset}>Clear filters</Button>} />}
          </Card>

          {available && <ConstructorCharts teams={teams} season={season} />}
        </div>
      </Section>
    </>
  );
}
