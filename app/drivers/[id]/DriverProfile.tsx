/**
 * app/drivers/[id]/DriverProfile.tsx
 *
 * A driver's career on one page: headline numbers first, then the full
 * career grid and biography side by side, then season-by-season history.
 * Team color tints the header glow and marks — the rest stays neutral.
 */

import Link from "next/link";
import { ArrowLeftRight, ChevronRight, UserX } from "lucide-react";
import { getDriverStats } from "@/lib/api/fetchers";
import { getDriverPhoto } from "@/lib/api/driverPhotos";
import { DriverPortrait } from "@/components/ui/DriverPortrait";
import { getNationalityFlag, formatPercentage } from "@/lib/utils/format";
import { teamColor as lookupTeamColor } from "@/lib/theme/teams";
import { Section, HeaderBackdrop } from "@/components/ui/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { TeamMark } from "@/components/ui/TeamMark";
import { cn } from "@/lib/utils/cn";

export default async function DriverProfile({ driverId }: { driverId: string }) {
  const stats = await getDriverStats(driverId);

  if (!stats) {
    return (
      <Section>
        <Card>
          <EmptyState
            icon={<UserX />}
            title="Driver not found"
            description="We couldn’t find a driver with that ID. They may be listed under a different name."
            action={<ButtonLink href="/drivers" variant="filled">All drivers</ButtonLink>}
          />
        </Card>
      </Section>
    );
  }

  const { driver, seasonResults } = stats;
  const flag = getNationalityFlag(driver.nationality);
  const team = stats.currentTeam;
  const color = lookupTeamColor(team?.constructorId ?? team?.name);
  const number = driver.permanentNumber || driver.code;
  const photo = await getDriverPhoto(driver);

  const headline = [
    { label: stats.totalChampionships === 1 ? "Championship" : "Championships", value: stats.totalChampionships, gold: stats.totalChampionships > 0 },
    { label: "Wins", value: stats.totalWins },
    { label: "Podiums", value: stats.totalPodiums },
    { label: "Poles", value: stats.totalPoles },
  ];

  const career = [
    { label: "Races", value: stats.totalRaces },
    { label: "Points", value: stats.totalPoints },
    { label: "Fastest laps", value: stats.totalFastestLaps },
    { label: "Win rate", value: formatPercentage(stats.winRate) },
    { label: "Podium rate", value: formatPercentage(stats.podiumRate) },
    { label: "Points per race", value: stats.pointsPerRace },
    { label: "Average finish", value: stats.avgFinishPosition },
    { label: "Retirements", value: stats.dnfCount },
  ];

  const profile = [
    {
      label: "Born",
      value: driver.dateOfBirth
        ? new Date(`${driver.dateOfBirth}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
        : "—",
    },
    { label: "Nationality", value: `${flag} ${driver.nationality}` },
    { label: "Team", value: team?.name ?? "—" },
    // Count the seasons actually raced; careerSpan.yearsActive is last − first, one short.
    { label: "Seasons", value: seasonResults?.length || stats.careerSpan.yearsActive },
    { label: "First race", value: stats.careerSpan.firstRace || "—" },
    { label: "Best finish", value: stats.bestFinish ? `P${stats.bestFinish}` : "—" },
  ];

  const maxPts = Math.max(...(seasonResults?.map((s) => s.points) || []), 1);
  const hasFinals = seasonResults?.some((s) => s.position > 0) ?? false;

  return (
    <>
      {/* Header */}
      <header className="relative mb-8 overflow-hidden border-b border-hairline sm:mb-10">
        <HeaderBackdrop tint={color} watermark={String(number ?? "")} />
        <div className="container-page relative pb-8 pt-8 sm:pb-12 sm:pt-12">
          <Link
            href="/drivers"
            className="pressable -ml-1 mb-6 inline-flex h-9 items-center gap-1.5 px-1 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-label-3 hover:text-paper"
          >
            <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
            Drivers
          </Link>

          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-subhead text-label-2">
                <span>
                  {flag} {driver.nationality}
                </span>
                {team && (
                  <span className="inline-flex items-center gap-2">
                    <TeamMark color={color} size="sm" />
                    {team.name}
                  </span>
                )}
              </p>
              <h1 className="text-title-1 text-paper sm:text-display">
                <span className="font-semibold text-label-2">{driver.givenName}</span>{" "}
                <span className="whitespace-nowrap">{driver.familyName}</span>
              </h1>
            </div>
            <DriverPortrait photo={photo} name={`${driver.givenName} ${driver.familyName}`} number={number} color={color} />
          </div>

          <Card className="mt-8">
            <StatGrid min={120}>
              {headline.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} size="lg" accent={s.gold ? "rgb(var(--gold))" : undefined} />
              ))}
            </StatGrid>
          </Card>
        </div>
      </header>

      <Section className="pt-2 sm:pt-4">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-5">
          <Card>
            <CardHeader title="Career" subtitle="All-time figures across every season" />
            <StatGrid min={130}>
              {career.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} size="sm" />
              ))}
            </StatGrid>
          </Card>

          <Card>
            <CardHeader title="Profile" />
            <dl className="divide-y divide-hairline">
              {profile.map((p) => (
                <div key={p.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-subhead text-label-3">{p.label}</dt>
                  <dd className="truncate text-right text-subhead font-medium text-paper">{p.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Section>

      {seasonResults && seasonResults.length > 0 && (
        <Section className="pt-0 sm:pt-0">
          <h2 className="mb-4 text-title-3 text-paper">Season by season</h2>
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hairline label-caps text-[0.75rem] text-label-3">
                  <th scope="col" className="py-3 pl-4 pr-2 font-semibold sm:pl-6">Year</th>
                  <th scope="col" className="px-2 py-3 font-semibold">Team</th>
                  <th scope="col" className="hidden px-2 py-3 font-semibold md:table-cell">Points</th>
                  <th scope="col" className="px-2 py-3 text-right font-semibold md:hidden">Pts</th>
                  <th scope="col" className={cn("px-2 py-3 text-right font-semibold", !hasFinals && "pr-4 sm:pr-2")}>Wins</th>
                  <th scope="col" className="hidden px-2 py-3 text-right font-semibold sm:table-cell">Podiums</th>
                  <th scope="col" className={cn("hidden px-2 py-3 text-right font-semibold sm:table-cell", !hasFinals && "pr-4 sm:pr-6")}>Races</th>
                  {hasFinals && <th scope="col" className="py-3 pl-2 pr-4 text-right font-semibold sm:pr-6">Final</th>}
                </tr>
              </thead>
              <tbody>
                {seasonResults.slice(0, 30).map((s) => (
                  <tr key={s.season} className="border-b border-hairline last:border-0">
                    <td className="tabular py-3 pl-4 pr-2 text-subhead font-semibold text-paper sm:pl-6">{s.season}</td>
                    <td className="max-w-[9rem] px-2 py-3 sm:max-w-none">
                      <span className="flex items-center gap-2 text-subhead text-label-2">
                        <TeamMark team={s.team} size="sm" />
                        <span className="truncate">{s.team}</span>
                      </span>
                    </td>
                    <td className="hidden w-48 px-2 py-3 md:table-cell">
                      <div className="flex items-center gap-3">
                        <span className="tabular w-10 text-subhead text-paper">{s.points}</span>
                        <div className="h-1 flex-1 overflow-hidden bg-fill-1" aria-hidden>
                          <div className="h-full bg-label-3" style={{ width: `${(s.points / maxPts) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="tabular px-2 py-3 text-right text-subhead text-paper md:hidden">{s.points}</td>
                    <td className={cn("tabular px-2 py-3 text-right text-subhead", s.wins ? "font-semibold text-paper" : "text-label-4", !hasFinals && "pr-4 sm:pr-2")}>{s.wins}</td>
                    <td className={cn("tabular hidden px-2 py-3 text-right text-subhead sm:table-cell", s.podiums ? "text-label-2" : "text-label-4")}>{s.podiums}</td>
                    <td className={cn("tabular hidden px-2 py-3 text-right text-subhead text-label-3 sm:table-cell", !hasFinals && "pr-4 sm:pr-6")}>{s.races}</td>
                    {hasFinals && <td className="py-3 pl-2 pr-4 text-right sm:pr-6">
                      <span
                        className={cn(
                          "tabular inline-flex h-6 min-w-[2.5rem] items-center justify-center px-2 text-caption font-semibold",
                          s.position === 1 ? "bg-gold/15 text-gold" : "bg-fill-1 text-label-2",
                        )}
                      >
                        {s.position ? `P${s.position}` : "—"}
                      </span>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`/compare?a=${driver.driverId}`} variant="filled">
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
              Compare with another driver
            </ButtonLink>
            <ButtonLink href="/drivers">All drivers</ButtonLink>
          </div>
        </Section>
      )}
    </>
  );
}
