/**
 * lib/api/heroHud.ts
 *
 * The handful of live numbers the home hero shows: next race (with the
 * circuit's coordinates), championship leader and gap, last winner, and
 * season progress. Same cached Jolpica calls the rest of the home page
 * makes, so this adds no extra requests on a warm cache.
 */

import { getCurrentDriverStandings, getLastRace, getRaceCalendar } from "./jolpica";

export interface HeroHud {
  season: string;
  roundsDone: number;
  roundsTotal: number;
  drivers: number;
  next: { round: string; name: string; locality: string; country: string; start: string; lat: number; long: number } | null;
  leader: { code: string; name: string; points: number; gap: number | null } | null;
  last: { round: string; name: string; winnerCode: string; winnerName: string } | null;
}

export async function getHeroHud(): Promise<HeroHud | null> {
  try {
    const [calendar, standings, last] = await Promise.all([
      getRaceCalendar("current").catch(() => []),
      getCurrentDriverStandings().catch(() => []),
      getLastRace().catch(() => null),
    ]);
    if (!calendar?.length) return null;
    const next = calendar.find((r: any) => !r.isPast);
    const [p1, p2] = standings ?? [];
    const winner = last?.Results?.[0]?.Driver;
    return {
      season: calendar[0].season,
      roundsDone: calendar.filter((r: any) => r.isPast).length,
      roundsTotal: calendar.length,
      drivers: standings?.length ?? 0,
      next: next
        ? {
            round: next.round,
            name: next.raceName,
            locality: next.Circuit?.Location?.locality ?? "",
            country: next.Circuit?.Location?.country ?? "",
            start: `${next.date}T${next.time ?? "12:00:00Z"}`,
            lat: Number(next.Circuit?.Location?.lat ?? 0),
            long: Number(next.Circuit?.Location?.long ?? 0),
          }
        : null,
      leader: p1
        ? {
            code: p1.Driver?.code ?? p1.Driver?.familyName?.slice(0, 3).toUpperCase(),
            name: `${p1.Driver?.givenName} ${p1.Driver?.familyName}`,
            points: Number(p1.points),
            gap: p2 ? Number(p1.points) - Number(p2.points) : null,
          }
        : null,
      last: last && winner
        ? { round: last.round, name: last.raceName, winnerCode: winner.code ?? winner.familyName, winnerName: `${winner.givenName} ${winner.familyName}` }
        : null,
    };
  } catch {
    return null;
  }
}
