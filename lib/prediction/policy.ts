import { canonicalDriverId } from "./ratings";
import type { PredictionHorizon, PredictionSnapshot } from "@/lib/types/prediction";

export class PredictionUnavailableError extends Error {}
export const HORIZONS: PredictionHorizon[] = ["pre-qualifying", "post-qualifying"];
export function parseHorizon(value: string | null): PredictionHorizon | undefined {
  if (value === null) return undefined;
  if (!HORIZONS.includes(value as PredictionHorizon)) throw new Error("Invalid prediction horizon.");
  return value as PredictionHorizon;
}
export function timestamp(value: string): number {
  const n = typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  if (!Number.isFinite(n)) throw new Error("A timestamp with an explicit time zone is required.");
  return n;
}
export function horizonAt(race: PredictionSnapshot["race"], at: number): PredictionHorizon {
  if (at >= timestamp(race.raceStart)) throw new PredictionUnavailableError("Race started: a saved pre-race snapshot is required.");
  if (at < timestamp(race.qualifyingStart)) return "pre-qualifying";
  if (at >= timestamp(race.qualifyingEnd)) return "post-qualifying";
  throw new PredictionUnavailableError("Qualifying is in progress. Use a saved pre-qualifying snapshot or return after qualifying.");
}

/** Validate persisted and upstream inputs at the boundary, before any scoring. */
export function validateSnapshot(s: PredictionSnapshot): void {
  if (!/^\d{4}$/.test(s.race?.season) || !/^[1-9]\d?$/.test(s.race?.round) || !/^\d{4}-\d{2}-\d{2}$/.test(s.race?.raceDate)) throw new Error("Invalid race identity.");
  if (s.schemaVersion !== 1) throw new Error("Unsupported prediction snapshot version.");
  const cutoff = timestamp(s.cutoff);
  if (timestamp(s.capturedAt) !== cutoff) throw new Error("Snapshot cutoff must equal its capture time.");
  if (timestamp(s.race.qualifyingStart) >= timestamp(s.race.qualifyingEnd) || timestamp(s.race.qualifyingEnd) >= timestamp(s.race.raceStart)) throw new Error("Invalid session boundaries.");
  if (!HORIZONS.includes(s.horizon) || horizonAt(s.race, cutoff) !== s.horizon) throw new Error("Snapshot is outside its prediction horizon.");
  if (!Array.isArray(s.entries?.value) || !s.entries.value.length) throw new PredictionUnavailableError("No race-specific entry information is available.");
  if (!["entry-list", "practice", "qualifying"].includes(s.entryBasis)) throw new Error("Unknown entry source.");
  if (s.horizon === "pre-qualifying" && (s.qualifying || s.startingGrid || s.entryBasis === "qualifying")) throw new Error("Pre-qualifying snapshots cannot contain qualifying or starting-grid data.");
  const keys = ["entries", "form", "qualifyingHistory", "circuitHistory", "standings", "qualifying", "sprint", "startingGrid", "penalties", "weather", "ratings"] as const;
  for (const key of keys) {
    const obs = s[key];
    if (obs && (typeof obs.source !== "string" || !obs.source || timestamp(obs.availableAt) > cutoff)) throw new Error(`${key} was not available at the cutoff.`);
  }
  const ids = new Set<string>();
  for (const e of s.entries.value) {
    if (typeof e.driverId !== "string" || !e.driverId || [e.driverCode, e.givenName, e.familyName, e.constructorId, e.constructorName, e.number].some(v => typeof v !== "string") || ids.has(canonicalDriverId(e.driverId)) || !["entered", "withdrawn"].includes(e.status)) throw new Error("Invalid or duplicate race entry.");
    ids.add(canonicalDriverId(e.driverId));
  }
  const positions = (rows: { driverId: string; position: number }[]) => {
    const seen = new Set<string>();
    for (const r of rows) {
      if (typeof r.driverId !== "string" || !r.driverId || seen.has(canonicalDriverId(r.driverId)) || !Number.isFinite(r.position) || r.position <= 0) throw new Error("Invalid position input.");
      seen.add(canonicalDriverId(r.driverId));
    }
  };
  for (const obs of [s.form, s.qualifyingHistory, s.circuitHistory]) {
    for (const race of obs?.value ?? []) {
      if (timestamp(race.endedAt) > timestamp(obs!.availableAt) || timestamp(race.endedAt) >= cutoff || (Number(race.season) > Number(s.race.season)) || (race.season === s.race.season && Number(race.round) >= Number(s.race.round))) throw new Error("Historical feature contains a target or future race.");
      positions(race.rows);
    }
  }
  if (s.standings) {
    const p = s.standings.value;
    if (timestamp(p.endedAt) > timestamp(s.standings.availableAt) || timestamp(p.endedAt) >= cutoff || Number(p.season) > Number(s.race.season) || (p.season === s.race.season && Number(p.round) >= Number(s.race.round))) throw new Error("Standings must precede the target race.");
    positions(p.rows);
    if (p.rows.some(r => r.wins !== undefined && (!Number.isFinite(r.wins) || r.wins < 0))) throw new Error("Invalid standings wins.");
  }
  for (const obs of [s.qualifying, s.sprint]) {
    if (obs && (timestamp(obs.value.endedAt) > cutoff || timestamp(obs.value.endedAt) > timestamp(obs.availableAt))) throw new Error("Session had not ended at the cutoff.");
    if (obs) positions(obs.value.rows);
  }
  if (s.qualifying && timestamp(s.qualifying.value.endedAt) !== timestamp(s.race.qualifyingEnd)) throw new Error("Qualifying session boundary mismatch.");
  if (s.startingGrid) positions(s.startingGrid.value);
  for (const p of s.penalties?.value ?? []) {
    if (!ids.has(canonicalDriverId(p.driverId)) || timestamp(p.announcedAt) > cutoff || timestamp(p.announcedAt) > timestamp(s.penalties!.availableAt) || !Number.isFinite(p.severity) || p.severity < 0 || p.severity > 10) throw new Error("Invalid or future grid penalty.");
  }
  if (s.weather) {
    const w = s.weather.value;
    if (w.raceDate !== s.race.raceDate || !Number.isFinite(w.rainProbability) || w.rainProbability < 0 || w.rainProbability > 100 || [w.temperatureC, w.windSpeedKph].some(v => v !== null && !Number.isFinite(v))) throw new Error("Invalid forecast snapshot.");
  }
  if (s.ratings) {
    const values = [...Object.values(s.ratings.value.wet), ...Object.values(s.ratings.value.tyre).flatMap(Object.values)];
    if (values.some(v => !Number.isFinite(v) || v < 0 || v > 10)) throw new Error("Invalid rating.");
  }
}
