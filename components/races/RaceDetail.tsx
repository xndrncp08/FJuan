/**
 * components/races/RaceDetail.tsx — One race weekend's results.
 *
 * Header, podium at a glance with fastest lap and pole, then the full race
 * and qualifying classifications, then previous/next round navigation.
 * Rendered as the /races/[season]/[round] page, or in a floating window
 * when opened from a list (app/@modal).
 */

import Link from "next/link";
import { ChevronLeft, ChevronRight, Flag, Timer, Trophy } from "lucide-react";
import { getQualifyingResults, getRaceResults, getRaceSchedule } from "@/lib/api/jolpica";
import { Section } from "@/components/ui/Section";
import { DetailFrame, type DetailVariant } from "@/components/ui/DetailFrame";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { TeamMark } from "@/components/ui/TeamMark";
import { shortTeamName } from "@/lib/theme/teams";
import ResultsTables from "./ResultsTables";
import { cn } from "@/lib/utils/cn";

const MEDAL_TEXT = ["text-gold", "text-silver", "text-bronze"];

export default async function RaceDetail({ season, round, variant }: { season: string; round: string; variant: DetailVariant }) {
  const [raceRes, qualiRes, scheduleRes] = await Promise.allSettled([
    getRaceResults(season, round),
    getQualifyingResults(season, round),
    getRaceSchedule(season),
  ]);
  const race = raceRes.status === "fulfilled" ? raceRes.value : null;
  const qualifying = qualiRes.status === "fulfilled" ? qualiRes.value : null;
  const schedule: any[] = scheduleRes.status === "fulfilled" ? scheduleRes.value ?? [] : [];

  const idx = schedule.findIndex((r) => r.round === round);
  const info = race || schedule[idx];
  const prev = idx > 0 ? schedule[idx - 1] : null;
  const next = idx >= 0 && idx < schedule.length - 1 ? schedule[idx + 1] : null;

  if (!info) {
    return (
      <Section>
        <Card>
          <EmptyState
            icon={<Flag />}
            title="Race not found"
            description={`There’s no round ${round} in the ${season} season.`}
            action={<ButtonLink href="/calendar" variant="filled">Calendar</ButtonLink>}
          />
        </Card>
      </Section>
    );
  }

  const results: any[] = race?.Results ?? [];
  const quali: any[] = qualifying?.QualifyingResults ?? [];
  const fastest = results.find((r) => r.FastestLap?.rank === "1");
  const pole = quali[0];
  const date = info.date
    ? new Date(`${info.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <DetailFrame
      variant={variant}
      back={{ href: "/calendar", label: "Calendar" }}
      watermark={`R${round}`}
      eyebrow={`${season} · Round ${round}`}
      title={info.raceName}
      meta={
        <>
          <Link href={`/tracks/${info.Circuit?.circuitId}`} className="hover:text-tint">
            {info.Circuit?.circuitName}
          </Link>
          <span className="text-label-3">
            {" "}
            · {info.Circuit?.Location?.locality}, {info.Circuit?.Location?.country}
            {date && ` · ${date}`}
          </span>
        </>
      }
    >
        {!results.length && !quali.length ? (
          <Card>
            <EmptyState icon={<Flag />} title="No results yet" description="Results appear here once the session has been classified." />
          </Card>
        ) : (
          <div className="space-y-8">
            {results.length >= 3 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {results.slice(0, 3).map((r, i) => (
                  <Link key={r.position} href={`/drivers/${r.Driver?.driverId}`} className="card card-interactive block p-5">
                    <div className={cn("flex items-center gap-1.5 text-footnote font-semibold", MEDAL_TEXT[i])}>
                      {i === 0 && <Trophy className="h-3.5 w-3.5" aria-hidden />}
                      {i === 0 ? "Winner" : `P${i + 1}`}
                    </div>
                    <div className="mt-3 truncate text-title-3 text-paper">{r.Driver?.familyName}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-footnote text-label-3">
                      <TeamMark team={r.Constructor?.constructorId} size="sm" />
                      {shortTeamName(r.Constructor?.name, r.Constructor?.constructorId)}
                    </div>
                    <div className="tabular mt-4 text-subhead text-label-2">{r.Time?.time ?? r.status}</div>
                  </Link>
                ))}
                <Card padding="sm" className="flex flex-col justify-center gap-4 p-5">
                  {fastest && (
                    <div>
                      <div className="flex items-center gap-1.5 text-footnote font-semibold text-purple">
                        <Timer className="h-3.5 w-3.5" aria-hidden />
                        Fastest lap
                      </div>
                      <div className="mt-1 text-callout text-paper">
                        <span className="font-semibold">{fastest.Driver?.familyName}</span>
                        <span className="tabular ml-2 text-label-2">{fastest.FastestLap?.Time?.time}</span>
                      </div>
                    </div>
                  )}
                  {pole && (
                    <div>
                      <div className="text-footnote font-semibold text-label-3">Pole position</div>
                      <div className="mt-1 text-callout text-paper">
                        <span className="font-semibold">{pole.Driver?.familyName}</span>
                        <span className="tabular ml-2 text-label-2">{pole.Q3 || pole.Q2 || pole.Q1}</span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            <ResultsTables results={results} qualifying={quali} />
          </div>
        )}

        <nav aria-label="Other rounds" className="mt-10 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/races/${season}/${prev.round}`} className="card card-interactive flex items-center gap-3 p-4">
              <ChevronLeft className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
              <div className="min-w-0">
                <div className="text-caption text-label-3">Round {prev.round}</div>
                <div className="truncate text-callout font-semibold text-paper">{prev.raceName}</div>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/races/${season}/${next.round}`} className="card card-interactive flex items-center justify-end gap-3 p-4 text-right">
              <div className="min-w-0">
                <div className="text-caption text-label-3">Round {next.round}</div>
                <div className="truncate text-callout font-semibold text-paper">{next.raceName}</div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
            </Link>
          )}
        </nav>
    </DetailFrame>
  );
}
