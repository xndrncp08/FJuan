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
import { SeasonHistory } from "@/components/drivers/SeasonHistory";
import { PageIndex } from "@/components/ui/PageIndex";
import { InsightNote } from "@/components/ui/InsightNote";

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
    { label: "Win rate", value: formatPercentage(stats.winRate), hint: "Wins ÷ race starts" },
    { label: "Podium rate", value: formatPercentage(stats.podiumRate), hint: "Top-three finishes ÷ race starts" },
    { label: "Points per race", value: stats.pointsPerRace, hint: "Career points ÷ race starts" },
    { label: "Average finish", value: stats.avgFinishPosition, hint: "Mean classified position" },
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


  return (
    <>
      {/* Header */}
      <header className="relative mb-8 overflow-hidden border-b border-hairline sm:mb-10">
        <HeaderBackdrop tint={color} watermark={String(number ?? "")} />
        <div className="container-page relative pb-8 pt-8 sm:pb-12 sm:pt-12">
          <Link
            href="/drivers"
            className="pressable -ml-1 mb-6 inline-flex h-11 items-center gap-1.5 px-1 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-label-3 hover:text-paper"
          >
            <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
            Drivers
          </Link>

          <div className="profile-header">
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
              <h1 className="profile-title text-paper">
                <span className="block font-semibold text-label-2">{driver.givenName}</span>{" "}
                <span>{driver.familyName}</span>
              </h1>
            </div>
            <DriverPortrait photo={photo} name={`${driver.givenName} ${driver.familyName}`} number={number} color={color} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4"><ButtonLink href={`/compare?a=${driver.driverId}`} variant="filled"><ArrowLeftRight className="h-4 w-4" aria-hidden />Compare this driver</ButtonLink><span className="font-mono text-caption text-label-3">CAREER / {seasonResults.at(-1)?.season ?? "—"}–{seasonResults[0]?.season ?? "—"}</span></div>
          <Card className="mt-8">
            <StatGrid min={120}>
              {headline.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} size="lg" accent={s.gold ? "rgb(var(--gold))" : undefined} />
              ))}
            </StatGrid>
          </Card>
        </div>
      </header>

      <div className="container-page"><PageIndex items={[{ href: "#career", label: "Career numbers" }, { href: "#profile", label: "Driver profile" }, ...(seasonResults.length ? [{ href: "#seasons", label: "Season record" }] : [])]} /></div>
      <Section className="pt-6 sm:pt-8" id="career">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-5">
          <Card>
            <CardHeader title="Career" subtitle="All-time figures across every season" />
            <StatGrid min={130}>
              {career.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} hint={s.hint} size="sm" />
              ))}
            </StatGrid>
          </Card>

          <Card id="profile">
            <CardHeader title="Profile" />
            <dl className="divide-y divide-hairline">
              {profile.map((p) => (
                <div key={p.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-subhead text-label-3">{p.label}</dt>
                  <dd className="text-right text-subhead font-medium text-paper">{p.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Section>

      {seasonResults && seasonResults.length > 0 && (
        <Section id="seasons" className="pt-0 sm:pt-0">
          <SeasonHistory seasons={seasonResults} color={color} driverName={`${driver.givenName} ${driver.familyName}`} />
          <div className="mt-5"><InsightNote title="Understanding career numbers">Race starts, wins and points come from the historical race classifications. A retirement can still have a classified position. Compare rates as well as totals, especially when drivers raced in different eras.</InsightNote></div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`/compare?a=${driver.driverId}`} variant="filled"><ArrowLeftRight className="h-4 w-4" aria-hidden />Compare with another driver</ButtonLink>
            {team && <ButtonLink href={`/teams/${team.constructorId}`}>Team profile</ButtonLink>}
            <ButtonLink href="/drivers">All drivers</ButtonLink>
          </div>
        </Section>
      )}
    </>
  );
}
