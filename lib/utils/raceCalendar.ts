export interface ScheduledRace { date: string; time?: string }
export function raceStartTime(race: ScheduledRace): number {
  return Date.parse(`${race.date}T${race.time ?? "23:59:59Z"}`);
}
/** Display calendars keep a race current until three hours after its start. */
export function raceEndTime(race: ScheduledRace): number {
  return raceStartTime(race) + 3 * 60 * 60 * 1000;
}
export function nextScheduledRace<T extends ScheduledRace>(races: T[], now = Date.now()): T | null {
  return [...races].filter(r => raceEndTime(r) >= now).sort((a, b) => raceStartTime(a) - raceStartTime(b))[0] ?? null;
}
