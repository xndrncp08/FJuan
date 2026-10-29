import type { Entry, Observation, PastResult, Penalty, Position, PredictionHorizon, PredictionSnapshot, RaceContext } from "@/lib/types/prediction";
import { raceEndTime, raceStartTime } from "@/lib/utils/raceCalendar";
import { horizonAt, PredictionUnavailableError, timestamp, validateSnapshot } from "./policy";
import { canonicalDriverId, RATINGS, sessionDriverId } from "./ratings";

const JOLPICA = "https://api.jolpi.ca/ergast/f1";
const OPENF1 = "https://api.openf1.org/v1";
export function circuitCoordinates(race: any): [number, number] | null {
  const lat = race.Circuit?.Location?.lat;
  const lon = race.Circuit?.Location?.long;
  if (lat === undefined || lon === undefined || lat === null || lon === null || lat === "" || lon === "") return null;
  const a = Number(lat), b = Number(lon);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [a, b] : null;
}
export function raceContext(race: any): RaceContext {
  if (!race?.time || !race.Qualifying?.date || !race.Qualifying?.time) throw new PredictionUnavailableError("Exact race and qualifying times are required for a prediction cutoff.");
  const start = raceStartTime(race);
  const qualifyingStart = raceStartTime(race.Qualifying);
  const coords = circuitCoordinates(race);
  return { season: String(race.season), round: String(race.round), raceName: race.raceName, circuitId: race.Circuit.circuitId, circuitName: race.Circuit.circuitName, raceDate: race.date,
    raceStart: new Date(start).toISOString(), qualifyingStart: new Date(qualifyingStart).toISOString(),
    // shortcut: conservative two-hour qualifying boundary without session timing, use actual OpenF1 end when available.
    qualifyingEnd: new Date(qualifyingStart + 2 * 3_600_000).toISOString(), latitude: coords?.[0] ?? null, longitude: coords?.[1] ?? null, isSprint: !!race.Sprint };
}

/** Only explicit grid decisions count. Investigations and generic engine messages are not penalties. */
export function gridPenaltySeverity(message: string): number | null {
  const text = message.toLowerCase().replace(/[-–]/g, " ");
  if (/investigat|noted|no further action|sprint|possible|potential|request/.test(text)) return null;
  if (/grid.*(?:withdrawn|rescinded|cancelled)|(?:withdrawn|rescinded|cancelled).*grid/.test(text)) return 0;
  if (/start.*(?:pit lane|back of (?:the )?grid)/.test(text)) return 10;
  const places = text.match(/(\d+)\s+place(?:s)?\s+(?:grid\s+penalty|penalty.*grid)/);
  return places ? Math.min(9, Math.ceil(Number(places[1]) / 2)) : null;
}
export function penaltiesBefore(messages: any[], entries: Entry[], cutoff: number): Penalty[] {
  const byNumber = new Map(entries.map(e => [e.number, e.driverId]));
  const penalties = new Map<string, Penalty>();
  for (const m of [...messages].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
    let at: number;
    try { at = timestamp(m.date); } catch { continue; }
    if (at > cutoff) continue;
    const number = String(m.driver_number ?? m.message?.match(/CAR\s+(\d+)\b/i)?.[1] ?? "");
    const id = byNumber.get(number);
    const severity = gridPenaltySeverity(m.message ?? "");
    if (!id || severity === null) continue;
    penalties.set(id, { driverId: id, severity: severity === 0 ? 0 : Math.max(severity, penalties.get(id)?.severity ?? 0), announcedAt: new Date(at).toISOString() });
  }
  return [...penalties.values()];
}

function positions(rows: any[]): Position[] {
  return rows.filter(r => r.Driver?.driverId && Number.isFinite(Number(r.position)) && Number(r.position) > 0).map(r => ({ driverId: canonicalDriverId(r.Driver.driverId), position: Number(r.position), ...(r.wins !== undefined ? { wins: Number(r.wins) } : {}) }));
}
function past(race: any, key = "Results"): PastResult {
  return { season: String(race.season), round: String(race.round), endedAt: new Date(raceEndTime(race)).toISOString(), rows: positions(race[key] ?? []) };
}

/** Live capture only. A past cutoff must be served from a saved snapshot, never from live APIs. */
export async function capturePredictionInputs(rawRace: any, options: { horizon?: PredictionHorizon; fetcher?: typeof fetch; now?: () => number } = {}): Promise<PredictionSnapshot> {
  const now = options.now ?? Date.now;
  const fetcher = options.fetcher ?? fetch;
  const race = raceContext(rawRace);
  if (now() >= timestamp(race.raceStart)) throw new PredictionUnavailableError("Historical prediction inputs require a saved pre-race snapshot.");
  const warnings: string[] = [];
  // Observation time travels with exact response bytes. No shared Next/CDN cache can cross a cutoff.
  async function get(url: string): Promise<Observation<any> | null> {
    try {
      const res = await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
      if (!res.ok) return null;
      const value = await res.json();
      return { source: url, availableAt: new Date(now()).toISOString(), value };
    } catch { return null; }
  }
  const mapObservation = <T>(obs: Observation<any> | null, value: T): Observation<T> | null => obs ? { ...obs, value } : null;
  const sessionsObs = await get(`${OPENF1}/sessions?year=${race.season}`);
  const sessions: any[] = Array.isArray(sessionsObs?.value) ? sessionsObs.value : [];
  const raceSession = sessions.filter(s => s.session_name === "Race" && !s.is_cancelled).sort((a, b) => Math.abs(Date.parse(a.date_start) - timestamp(race.raceStart)) - Math.abs(Date.parse(b.date_start) - timestamp(race.raceStart)))[0];
  const meeting = raceSession && Math.abs(Date.parse(raceSession.date_start) - timestamp(race.raceStart)) < 2 * 86_400_000 ? raceSession.meeting_key : null;
  const weekend = sessions.filter(s => s.meeting_key === meeting && !s.is_cancelled);
  const qSession = weekend.find(s => s.session_name === "Qualifying");
  if (qSession?.date_start && qSession?.date_end) {
    race.qualifyingStart = new Date(qSession.date_start).toISOString();
    race.qualifyingEnd = new Date(qSession.date_end).toISOString();
  }
  const horizon = horizonAt(race, now());
  if (options.horizon && options.horizon !== horizon) throw new PredictionUnavailableError("That prediction horizon has not started or has already closed; use its saved snapshot.");
  const completed = weekend.filter(s => Date.parse(s.date_end) <= now());
  const rosterSession = horizon === "post-qualifying" && qSession ? qSession : completed.filter(s => /^Practice/.test(s.session_name)).sort((a, b) => Date.parse(b.date_end) - Date.parse(a.date_end))[0];
  const [driverObs, qualifyingObs] = await Promise.all([
    rosterSession ? get(`${OPENF1}/drivers?session_key=${rosterSession.session_key}`) : Promise.resolve(null),
    horizon === "post-qualifying" ? get(`${JOLPICA}/${race.season}/${race.round}/qualifying.json?limit=100`) : Promise.resolve(null),
  ]);
  const sessionDrivers: any[] = Array.isArray(driverObs?.value) ? driverObs.value : [];
  const qRows: any[] = qualifyingObs?.value?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
  if (horizon === "post-qualifying" && !qRows.length) throw new PredictionUnavailableError("Published qualifying results are not available yet. A post-qualifying capture requires a completed result, not a scheduled session end.");
  const constructorIds: Record<string, string> = { "Red Bull Racing": "red_bull", "Ferrari": "ferrari", "Mercedes": "mercedes", "McLaren": "mclaren", "Aston Martin": "aston_martin", "Alpine": "alpine", "Williams": "williams", "Haas F1 Team": "haas", "Racing Bulls": "rb", "RB": "rb", "Kick Sauber": "sauber", "Audi": "audi", "Cadillac": "cadillac" };
  let entries: Entry[];
  let entryBasis: PredictionSnapshot["entryBasis"];
  let entryObservation: Observation<any> | null;
  if (qRows.length) {
    entryBasis = "qualifying"; entryObservation = driverObs && qualifyingObs ? { ...qualifyingObs, availableAt: new Date(Math.max(timestamp(qualifyingObs.availableAt), timestamp(driverObs.availableAt))).toISOString(), source: `${qualifyingObs.source}; session numbers: ${driverObs.source}` } : qualifyingObs;
    entries = qRows.map(row => {
      const d = row.Driver;
      const id = canonicalDriverId(d.driverId);
      const sessionDriver = sessionDrivers.find(s => sessionDriverId(s.full_name ?? "", String(s.driver_number)) === id || (s.full_name ?? "").toLowerCase() === `${d.givenName} ${d.familyName}`.toLowerCase());
      return { driverId: id, driverCode: d.code ?? d.familyName.slice(0, 3).toUpperCase(), givenName: d.givenName, familyName: d.familyName, constructorId: row.Constructor?.constructorId ?? "", constructorName: row.Constructor?.name ?? "Unknown", number: String(sessionDriver?.driver_number ?? ""), status: "entered" };
    });
  } else {
    entryBasis = rosterSession?.session_name === "Qualifying" ? "qualifying" : "practice"; entryObservation = driverObs;
    entries = sessionDrivers.filter(d => d.driver_number && d.full_name).map(d => ({
      driverId: sessionDriverId(d.full_name, String(d.driver_number)), driverCode: d.name_acronym ?? String(d.driver_number),
      givenName: d.first_name ?? "", familyName: d.last_name ?? d.full_name, constructorId: constructorIds[d.team_name] ?? "", constructorName: d.team_name ?? "Unknown", number: String(d.driver_number), status: "entered",
    }));
  }
  if (!entries.length || !entryObservation) throw new PredictionUnavailableError("Race-specific participants are unavailable. A season-wide driver list is not an entry list; return once weekend data is published.");
  if (entryBasis === "qualifying") warnings.push("Field uses qualifying participants; non-qualifiers admitted to the race and late withdrawals require an updated entry snapshot.");

  let scheduleObs = await get(`${JOLPICA}/${race.season}.json?limit=100`);
  let priorSchedule: any[] = (scheduleObs?.value?.MRData?.RaceTable?.Races ?? []).filter((r: any) => Number(r.round) < Number(race.round) && raceEndTime(r) < now());
  if (Number(race.round) === 1) {
    scheduleObs = await get(`${JOLPICA}/${Number(race.season) - 1}.json?limit=100`);
    priorSchedule = (scheduleObs?.value?.MRData?.RaceTable?.Races ?? []).filter((r: any) => raceEndTime(r) < now());
    warnings.push("Season opener: recent form and standings use the previous season where available; debutants receive neutral fallbacks.");
  }
  const prior = priorSchedule.sort((a, b) => raceStartTime(a) - raceStartTime(b)).slice(-5);
  const formResults: PastResult[] = [], qualResults: PastResult[] = [];
  let formTime: Observation<any> | null = null, qualTime: Observation<any> | null = null;
  for (const r of prior) {
    const [result, qualifying] = await Promise.all([get(`${JOLPICA}/${r.season}/${r.round}/results.json?limit=100`), get(`${JOLPICA}/${r.season}/${r.round}/qualifying.json?limit=100`)]);
    const raceResult = result?.value?.MRData?.RaceTable?.Races?.[0];
    const q = qualifying?.value?.MRData?.RaceTable?.Races?.[0];
    if (raceResult?.Results?.length) { formResults.push(past(raceResult)); formTime = result; }
    if (q?.QualifyingResults?.length) { qualResults.push(past(q, "QualifyingResults")); qualTime = qualifying; }
  }
  if (formResults.length < prior.length) warnings.push(`Recent results available for ${formResults.length}/${prior.length} prior races.`);
  if (qualResults.length < prior.length) warnings.push(`Prior qualifying available for ${qualResults.length}/${prior.length} races.`);
  const last = prior.at(-1);
  const standingsObs = last ? await get(`${JOLPICA}/${last.season}/${last.round}/driverStandings.json?limit=100`) : null;
  const standingsRows = standingsObs?.value?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;

  const circuitRaces = new Map<string, PastResult>();
  let circuitObs: Observation<any> | null = null, circuitComplete = true;
  for (const position of [1, 2, 3]) {
    for (let offset = 0; ; offset += 100) {
      const obs = await get(`${JOLPICA}/circuits/${race.circuitId}/results/${position}.json?limit=100&offset=${offset}`);
      const data = obs?.value?.MRData;
      if (!data?.RaceTable?.Races || !Number.isFinite(Number(data.total))) { circuitComplete = false; break; }
      circuitObs = obs;
      for (const r of data.RaceTable.Races) {
        if (Number(r.season) <= Number(race.season) - 10 || Number(r.season) > Number(race.season) || (String(r.season) === race.season && Number(r.round) >= Number(race.round)) || raceEndTime(r) >= now()) continue;
        const key = `${r.season}/${r.round}`;
        const p = past(r);
        const previous = circuitRaces.get(key);
        if (previous) previous.rows.push(...p.rows); else circuitRaces.set(key, p);
      }
      if (offset + 100 >= Number(data.total)) break;
      if (offset >= 9900 || !data.RaceTable.Races.length) { circuitComplete = false; break; }
    }
  }
  if (!circuitComplete) warnings.push("Circuit history is incomplete and was neutralized.");
  const sprintSession = completed.find(s => s.session_name === "Sprint");
  const [sprintObs, gridObs, penaltyObs] = await Promise.all([
    sprintSession ? get(`${JOLPICA}/${race.season}/${race.round}/sprint.json?limit=100`) : Promise.resolve(null),
    horizon === "post-qualifying" && meeting ? get(`${OPENF1}/starting_grid?session_key=${raceSession.session_key}`) : Promise.resolve(null),
    meeting ? get(`${OPENF1}/race_control?meeting_key=${meeting}`) : Promise.resolve(null),
  ]);
  if (Array.isArray(penaltyObs?.value)) {
    for (const message of penaltyObs.value) {
      if (Date.parse(message.date) <= timestamp(penaltyObs.availableAt) && /withdrawn from (?:the )?(?:race|grand prix)/i.test(message.message ?? "")) {
        const number = String(message.driver_number ?? message.message.match(/CAR\s+(\d+)\b/i)?.[1] ?? "");
        const entry = entries.find(e => e.number === number);
        if (entry) { entry.status = "withdrawn"; entryObservation = { ...entryObservation, availableAt: penaltyObs.availableAt, source: `${entryObservation.source}; withdrawals: ${penaltyObs.source}` }; }
      }
    }
  }
  const sprintRows = sprintObs?.value?.MRData?.RaceTable?.Races?.[0]?.SprintResults ?? [];
  const numbers = new Map(entries.map(e => [e.number, e.driverId]));
  const gridRows: Position[] = (Array.isArray(gridObs?.value) ? gridObs.value : []).filter(r => numbers.has(String(r.driver_number)) && Number(r.position) > 0).map(r => ({ driverId: numbers.get(String(r.driver_number))!, position: Number(r.position) }));
  let weather: PredictionSnapshot["weather"] = null;
  if (race.latitude !== null && race.longitude !== null) {
    const date = race.raceStart.slice(0, 10);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({ latitude: String(race.latitude), longitude: String(race.longitude), hourly: "precipitation_probability,temperature_2m,wind_speed_10m", timezone: "UTC", start_date: date, end_date: date }).toString();
    const obs = await get(url.toString());
    const hourly = obs?.value?.hourly;
    const i = hourly?.time?.indexOf(`${race.raceStart.slice(0, 13)}:00`) ?? -1;
    const rain = hourly?.precipitation_probability?.[i];
    if (i >= 0 && typeof rain === "number" && Number.isFinite(rain) && rain >= 0 && rain <= 100) {
      const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n) ? n : null;
      weather = mapObservation(obs, { rainProbability: rain, temperatureC: finite(hourly.temperature_2m?.[i]), windSpeedKph: finite(hourly.wind_speed_10m?.[i]), raceDate: race.raceDate });
    }
  }
  const capturedAt = new Date(now()).toISOString();
  const snapshot: PredictionSnapshot = {
    schemaVersion: 1, race, cutoff: capturedAt, capturedAt, horizon,
    entries: { ...entryObservation, value: entries }, entryBasis,
    form: formResults.length ? mapObservation(formTime, formResults) : null,
    qualifyingHistory: qualResults.length ? mapObservation(qualTime, qualResults) : null,
    circuitHistory: circuitComplete ? mapObservation(circuitObs, [...circuitRaces.values()]) : null,
    standings: standingsRows?.length && last ? mapObservation(standingsObs, { season: String(last.season), round: String(last.round), endedAt: new Date(raceEndTime(last)).toISOString(), rows: positions(standingsRows) }) : null,
    qualifying: qRows.length ? mapObservation(qualifyingObs, { endedAt: race.qualifyingEnd, rows: positions(qRows) }) : null,
    sprint: sprintRows.length && sprintSession ? mapObservation(sprintObs, { endedAt: new Date(sprintSession.date_end).toISOString(), rows: positions(sprintRows) }) : null,
    startingGrid: gridRows.length ? mapObservation(gridObs, gridRows) : null,
    penalties: entries.every(e => e.number) && Array.isArray(penaltyObs?.value) ? mapObservation(penaltyObs, penaltiesBefore(penaltyObs!.value, entries, timestamp(penaltyObs!.availableAt))) : null,
    weather, ratings: timestamp(RATINGS.availableAt) <= timestamp(capturedAt) ? RATINGS : null, warnings,
  };
  // A fetch that crosses qualifying or lights out cannot produce a snapshot for the earlier horizon.
  validateSnapshot(snapshot);
  return snapshot;
}
