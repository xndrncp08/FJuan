/**
 * lib/telemetry/openf1.ts
 *
 * OpenF1 source: car telemetry (speed, RPM, throttle, brake, gear, DRS),
 * GPS position (x, y, z), laps, stints and track temperature for one
 * driver in one session, merged into the shared SessionTelemetry shape.
 *
 * OpenF1 coordinates are decimetres; they're converted to metres and
 * centred so the 3D views can treat every source the same way.
 */

import { teamColor } from "@/lib/theme/teams";
import type { Compound, DriverInfo, LapSummary, LapTrace, SessionInfo, SessionTelemetry, Stint, TelemetrySample } from "./types";

const BASE = "https://api.openf1.org/v1";

export class OpenF1Error extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

// OpenF1's free tier allows a few requests per second. Requests go out one
// at a time with a small gap, and a 429 gets one retry after a pause.
const MIN_GAP_MS = 380;
let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;

function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequest + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

async function get<T>(path: string, params: Record<string, string | number | undefined>, revalidate: number): Promise<T> {
  // OpenF1 filters use operators in the key (date>=…), so build the query by hand.
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  const url = `${BASE}${path}?${qs}`;
  const once = () => throttled(() => fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(12000) }));
  let res = await once();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await once();
  }
  if (!res.ok) throw new OpenF1Error(`OpenF1 ${path} responded ${res.status}`, res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new OpenF1Error(`OpenF1 ${path} returned no rows`);
  return data as T;
}

interface RawSession {
  session_key: number;
  session_name: string;
  circuit_short_name: string;
  country_name: string;
  year: number;
  date_start: string;
}
interface RawDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string | null;
}
interface RawLap {
  lap_number: number;
  date_start: string | null;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
}
interface RawStint {
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
}
interface RawCar {
  date: string;
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  n_gear: number;
  drs: number | null;
}
interface RawLocation {
  date: string;
  x: number;
  y: number;
  z: number;
}
interface RawWeather {
  date: string;
  track_temperature: number;
}

const COMPOUNDS = new Set(["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"]);
const toCompound = (c: string | null | undefined): Compound | null => (c && COMPOUNDS.has(c.toUpperCase()) ? (c.toUpperCase() as Compound) : null);

/** OpenF1 timestamps carry "+00:00"; filters want bare UTC ISO. */
const iso = (ms: number) => new Date(ms).toISOString().replace("Z", "");

/** DRS codes 10, 12 and 14 mean the flap is open. */
const drsOpen = (code: number | null) => code !== null && code >= 10;

/**
 * Pair each car sample with the nearest location sample in time, then
 * accumulate distance along the path.
 */
function mergeTrace(car: RawCar[], loc: RawLocation[], start: number): TelemetrySample[] {
  if (!car.length || !loc.length) return [];
  const locT = loc.map((l) => Date.parse(l.date));
  let j = 0;
  const out: TelemetrySample[] = [];
  let dist = 0;
  for (const c of car) {
    const t = Date.parse(c.date);
    while (j < locT.length - 1 && Math.abs(locT[j + 1] - t) <= Math.abs(locT[j] - t)) j++;
    const l = loc[j];
    const x = l.x / 10;
    const y = l.y / 10;
    const z = l.z / 10;
    const prev = out[out.length - 1];
    if (prev) dist += Math.hypot(x - prev.x, y - prev.y);
    out.push({
      t: (t - start) / 1000,
      distance: dist,
      x,
      y,
      z,
      speed: c.speed,
      throttle: Math.min(100, Math.max(0, c.throttle)),
      brake: c.brake > 0 ? 100 : 0,
      gear: c.n_gear,
      rpm: c.rpm,
      drs: drsOpen(c.drs),
    });
  }
  return out;
}

function trackTempSeries(weather: RawWeather[], sessionStart: number): [number, number][] {
  return weather
    .filter((w) => typeof w.track_temperature === "number")
    .map((w) => [Math.round((Date.parse(w.date) - sessionStart) / 6000) / 10, w.track_temperature] as [number, number])
    .filter(([m]) => m >= -30);
}

export async function resolveSessionKey(sessionKey?: number | "latest"): Promise<RawSession> {
  const rows = await get<RawSession[]>("/sessions", sessionKey && sessionKey !== "latest" ? { session_key: sessionKey } : { session_key: "latest" }, 600);
  if (!rows.length) throw new OpenF1Error("No such session");
  return rows[0];
}

/** Most recent race session that has finished (for the delta suite and the 3D default). */
export async function latestRaceSession(year?: number): Promise<RawSession> {
  const y = year ?? new Date().getFullYear();
  const rows = await get<(RawSession & { date_end: string })[]>("/sessions", { session_name: "Race", year: y }, 3600);
  const done = rows.filter((s) => Date.parse(s.date_end) < Date.now());
  if (done.length) return done[done.length - 1];
  if (!year) return latestRaceSession(y - 1);
  throw new OpenF1Error("No completed race sessions");
}

export async function getSessionTelemetry(opts: { sessionKey?: number; driverNumber?: number; lap?: number }): Promise<SessionTelemetry> {
  const session = opts.sessionKey ? await resolveSessionKey(opts.sessionKey) : await latestRaceSession();
  const key = session.session_key;
  const sessionStart = Date.parse(session.date_start);

  const rawDrivers = await get<RawDriver[]>("/drivers", { session_key: key }, 3600);
  if (!rawDrivers.length) throw new OpenF1Error("Session has no drivers");
  const drivers: DriverInfo[] = rawDrivers
    .map((d) => ({
      number: d.driver_number,
      code: d.name_acronym,
      name: d.full_name,
      team: d.team_name,
      color: d.team_colour ? `#${d.team_colour}` : teamColor(d.team_name),
    }))
    .sort((a, b) => a.number - b.number);
  const driver = drivers.find((d) => d.number === opts.driverNumber) ?? drivers[0];

  const [rawLaps, rawStints, weather] = await Promise.all([
    get<RawLap[]>("/laps", { session_key: key, driver_number: driver.number }, 600),
    get<RawStint[]>("/stints", { session_key: key, driver_number: driver.number }, 600),
    get<RawWeather[]>("/weather", { session_key: key }, 600).catch(() => [] as RawWeather[]),
  ]);
  if (!rawLaps.length) throw new OpenF1Error("Driver has no laps in this session");

  const stints: Stint[] = rawStints
    .filter((s) => toCompound(s.compound))
    .map((s) => ({ stint: s.stint_number, compound: toCompound(s.compound)!, lapStart: s.lap_start, lapEnd: s.lap_end, tyreAgeAtStart: s.tyre_age_at_start ?? 0 }));

  const trackTemps = trackTempSeries(weather.filter((w) => w.track_temperature > 5), sessionStart);
  // OpenF1 occasionally reports 0 °C for a missed reading; drop those.
  const validWeather = weather.filter((w) => w.track_temperature > 5);
  const tempAt = (ms: number | null) => {
    if (ms === null || !validWeather.length) return null;
    let best = validWeather[0];
    for (const w of validWeather) if (Math.abs(Date.parse(w.date) - ms) < Math.abs(Date.parse(best.date) - ms)) best = w;
    return best.track_temperature;
  };

  const laps: LapSummary[] = rawLaps
    .sort((a, b) => a.lap_number - b.lap_number)
    .map((l) => {
      const stint = stints.find((s) => l.lap_number >= s.lapStart && l.lap_number <= s.lapEnd);
      return {
        lapNumber: l.lap_number,
        lapTime: l.lap_duration,
        sectors: [l.duration_sector_1, l.duration_sector_2, l.duration_sector_3],
        compound: stint?.compound ?? null,
        tyreAge: stint ? stint.tyreAgeAtStart + (l.lap_number - stint.lapStart) : 0,
        isPitOutLap: l.is_pit_out_lap,
        trackTemp: tempAt(l.date_start ? Date.parse(l.date_start) : null),
      };
    });

  // Pick the requested lap, else the fastest timed lap.
  const timed = rawLaps.filter((l) => l.lap_duration && l.date_start);
  if (!timed.length) throw new OpenF1Error("No timed laps to trace");
  const fastest = timed.reduce((a, b) => ((b.lap_duration as number) < (a.lap_duration as number) ? b : a));
  const target = timed.find((l) => l.lap_number === opts.lap) ?? fastest;
  const start = Date.parse(target.date_start as string);
  const end = start + (target.lap_duration as number) * 1000;

  const window = { session_key: key, driver_number: driver.number, "date>": iso(start - 200), "date<": iso(end + 200) };
  const [car, loc] = await Promise.all([get<RawCar[]>("/car_data", window, 86400), get<RawLocation[]>("/location", window, 86400)]);
  const samples = mergeTrace(car, loc, start);
  if (samples.length < 40) throw new OpenF1Error("Telemetry for this lap is too sparse to draw");

  // Centre the circuit on the origin.
  const cx = (Math.min(...samples.map((s) => s.x)) + Math.max(...samples.map((s) => s.x))) / 2;
  const cy = (Math.min(...samples.map((s) => s.y)) + Math.max(...samples.map((s) => s.y))) / 2;
  const cz = Math.min(...samples.map((s) => s.z));
  for (const s of samples) {
    s.x -= cx;
    s.y -= cy;
    s.z -= cz;
  }

  const total = samples[samples.length - 1].distance || 1;
  const s1 = target.duration_sector_1 ?? (target.lap_duration as number) / 3;
  const s2 = target.duration_sector_2 ?? (target.lap_duration as number) / 3;
  const s3 = target.duration_sector_3 ?? (target.lap_duration as number) - s1 - s2;
  const distAt = (t: number) => (samples.find((s) => s.t >= t) ?? samples[samples.length - 1]).distance / total;

  const lap: LapTrace = {
    lapNumber: target.lap_number,
    lapTime: target.lap_duration as number,
    sectors: [s1, s2, s3],
    sectorSplits: [distAt(s1), distAt(s1 + s2)],
    samples,
  };

  const info: SessionInfo = {
    sessionKey: key,
    name: session.session_name,
    circuit: session.circuit_short_name,
    country: session.country_name,
    year: session.year,
    date: session.date_start,
  };

  return { source: "openf1", session: info, driver, drivers, lap, laps, stints, trackTemps, trackLength: total };
}
