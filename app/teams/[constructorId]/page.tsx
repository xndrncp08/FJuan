// app/teams/[constructorId]/page.tsx — Constructor profile
//
// Server component. Fetches standings, this season's race results, and
// driver standings in parallel, then lays the team out as: header with
// headline numbers, season chart, drivers, round-by-round results.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Trophy } from "lucide-react";
import { getConstructorStandings, getConstructorResults, getDriverStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";
import ConstructorProfileCharts from "@/components/teams/ConstructorProfileCharts";
import { Section, HeaderBackdrop } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface RaceRow {
  round: number;
  name: string;
  short: string;
  points: number;
  bestPos: number | null;
  results: { driverId: string; driverCode: string; position: number | null; points: number; status: string }[];
}

export default async function ConstructorProfilePage({ params }: { params: Promise<{ constructorId: string }> }) {
  const { constructorId } = await params;

  const local = constructorsData.find((c) => c.id === constructorId);
  if (!local) notFound();

  const season = new Date().getFullYear().toString();

  const [standings, raceResults, driverStandings] = await Promise.all([
    getConstructorStandings("current").catch(() => []),
    getConstructorResults(constructorId, season).catch(() => []),
    getDriverStandings("current").catch(() => []),
  ]);

  const entry = standings.find((s: any) => s.Constructor?.constructorId === constructorId);
  const team = {
    name: entry?.Constructor?.name ?? local.name,
    nationality: entry?.Constructor?.nationality ?? local.nationality,
    position: entry ? parseInt(entry.position) : null,
    points: entry ? parseFloat(entry.points) : 0,
    wins: entry ? parseInt(entry.wins) : 0,
    championships: local.championships,
    color: local.color,
    base: local.base,
    founded: local.founded,
  };

  const drivers = driverStandings.filter((d: any) => d.Constructors?.some((c: any) => c.constructorId === constructorId));

  const races: RaceRow[] = (raceResults ?? []).map((race: any) => {
    const results = (race.Results ?? []).map((r: any) => ({
      driverId: r.Driver?.driverId,
      driverCode: r.Driver?.code ?? r.Driver?.familyName?.slice(0, 3).toUpperCase(),
      position: parseInt(r.position) || null,
      points: parseFloat(r.points ?? 0),
      status: r.status,
    }));
    const positions = results.map((r: any) => r.position ?? 20);
    return {
      round: parseInt(race.round),
      name: race.raceName?.replace(" Grand Prix", "") ?? `Round ${race.round}`,
      short: race.raceName?.split(" ")[0] ?? `R${race.round}`,
      points: results.reduce((s: number, r: any) => s + r.points, 0),
      bestPos: positions.length ? Math.min(...positions) : null,
      results,
    };
  });

  let running = 0;
  const series = races.map((r) => ({ ...r, cumPoints: (running += r.points) }));

  const completed = races.filter((r) => r.bestPos !== null).length;
  const podiums = races.reduce((s, r) => s + r.results.filter((x) => x.position && x.position <= 3).length, 0);

  return (
    <>
      <header className="relative mb-8 overflow-hidden border-b border-hairline sm:mb-10">
        <HeaderBackdrop tint={team.color} watermark={team.name.split(" ").pop()} />
        <div className="container-page relative pb-8 pt-8 sm:pb-12 sm:pt-12">
          <Link
            href="/teams"
            className="pressable -ml-1 mb-6 inline-flex h-9 items-center gap-1.5 px-1 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-label-3 hover:text-paper"
          >
            <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
            Teams
          </Link>

          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-subhead text-label-2">
            <span className="h-3 w-3 rounded-full" style={{ background: team.color }} aria-hidden />
            <span>{team.nationality}</span>
            {team.founded > 0 && <span className="text-label-3">· Since {team.founded}</span>}
            {team.base && <span className="text-label-3">· {team.base}</span>}
          </p>
          <h1 className="text-title-1 text-paper sm:text-display">{team.name}</h1>

          {team.championships > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 bg-gold/10 px-3 py-1.5 text-subhead font-semibold text-gold">
              <Trophy className="h-4 w-4" aria-hidden />
              {team.championships} constructors’ {team.championships === 1 ? "title" : "titles"}
            </p>
          )}

          <div className="card mt-8 p-5 sm:p-6">
            <StatGrid min={110}>
              <Stat size="lg" label={`${season} position`} value={team.position ? `P${team.position}` : "—"} />
              <Stat size="lg" label="Points" value={team.points} />
              <Stat size="lg" label="Wins" value={team.wins} />
              <Stat size="lg" label="Podiums" value={podiums} />
              <Stat size="lg" label="Points per race" value={completed ? (team.points / completed).toFixed(1) : "—"} />
            </StatGrid>
          </div>
        </div>
      </header>

      <Section className="pt-2 sm:pt-4">
        <div className="space-y-5">
          <ConstructorProfileCharts raceSeries={series} teamColor={team.color} season={season} />

          {drivers.length > 0 && (
            <div>
              <h2 className="mb-4 text-title-3 text-paper">Drivers</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {drivers.map((d: any) => (
                  <Link key={d.Driver?.driverId} href={`/drivers/${d.Driver?.driverId}`} className="card card-interactive flex items-center gap-4 p-5">
                    <span
                      className="tabular flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-title-3 font-bold"
                      style={{ background: `${team.color}22`, color: team.color }}
                    >
                      {d.Driver?.permanentNumber ?? d.Driver?.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-callout text-paper">
                        <span className="text-label-2">{d.Driver?.givenName} </span>
                        <span className="font-semibold">{d.Driver?.familyName}</span>
                      </div>
                      <div className="tabular mt-0.5 text-footnote text-label-3">
                        P{d.position} · {d.points} pts · {d.wins} {d.wins === "1" ? "win" : "wins"}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-label-4" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {races.length > 0 && (
            <div>
              <h2 className="mb-4 text-title-3 text-paper">Round by round</h2>
              <Card padding="none" className="overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hairline label-caps text-[0.75rem] text-label-3">
                      <th scope="col" className="py-3 pl-4 pr-2 font-semibold sm:pl-6">Rnd</th>
                      <th scope="col" className="px-2 py-3 font-semibold">Grand Prix</th>
                      <th scope="col" className="hidden px-2 py-3 font-semibold sm:table-cell">Finishes</th>
                      <th scope="col" className="px-2 py-3 text-right font-semibold">Best</th>
                      <th scope="col" className="py-3 pl-2 pr-4 text-right font-semibold sm:pr-6">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {races.map((r) => (
                      <tr key={r.round} className="border-b border-hairline last:border-0">
                        <td className="tabular py-3 pl-4 pr-2 text-subhead text-label-3 sm:pl-6">{r.round}</td>
                        <td className="px-2 py-3 text-subhead font-medium text-paper">{r.name}</td>
                        <td className="hidden px-2 py-3 sm:table-cell">
                          <div className="flex flex-wrap gap-1.5">
                            {r.results.map((x) => (
                              <span key={x.driverId} className="tabular inline-flex h-6 items-center gap-1 bg-fill-1 px-2 text-caption text-label-2">
                                <span className="font-semibold text-paper">{x.driverCode}</span>
                                {x.position ? `P${x.position}` : "DNF"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <span
                            className={cn(
                              "tabular text-subhead font-semibold",
                              r.bestPos === 1 ? "text-gold" : r.bestPos === 2 ? "text-silver" : r.bestPos === 3 ? "text-bronze" : "text-label-2",
                            )}
                          >
                            {r.bestPos ? `P${r.bestPos}` : "—"}
                          </span>
                        </td>
                        <td className={cn("tabular py-3 pl-2 pr-4 text-right text-subhead font-semibold sm:pr-6", r.points > 0 ? "text-paper" : "text-label-4")}>
                          {r.points > 0 ? `+${r.points}` : "0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          <div className="pt-4">
            <ButtonLink href="/teams">All teams</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
