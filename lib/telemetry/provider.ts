/**
 * lib/telemetry/provider.ts
 *
 * One entry point for telemetry, trying sources in order:
 *
 *   OpenF1     live/recent car telemetry, positions, laps, stints, weather
 *   Jolpica    historical classifications, standings, qualifying grids
 *   Synthetic  offline generator — always succeeds, so the 3D views and the
 *              delta suite stay interactive off-season or when an API is down
 *
 * Every result says which source produced it (`source`) and, after a
 * fallback, why (`fallbackReason`), so the UI can label it honestly.
 */

import { getRaceResults } from "@/lib/api/jolpica";
import { getSessionTelemetry, OpenF1Error } from "./openf1";
import { syntheticSession } from "./synthetic";
import type { RaceClassification, SessionTelemetry } from "./types";

export type SourcePreference = "auto" | "openf1" | "synthetic";

export interface TelemetryQuery {
  sessionKey?: number;
  driverNumber?: number;
  lap?: number;
  /** Seed for the synthetic circuit when falling back. */
  circuit?: string;
  source?: SourcePreference;
}

function describe(err: unknown): string {
  if (err instanceof OpenF1Error) {
    if (err.status === 429) return "OpenF1 rate limit reached";
    if (err.status === 401 || err.status === 403) return "OpenF1 restricts this session during live running";
    return err.message;
  }
  if (err instanceof Error && err.name === "TimeoutError") return "OpenF1 timed out";
  return "OpenF1 unavailable";
}

export async function getTelemetry(q: TelemetryQuery = {}): Promise<SessionTelemetry> {
  if (q.source === "synthetic") {
    return syntheticSession({ circuit: q.circuit, driverNumber: q.driverNumber, lap: q.lap });
  }
  try {
    return await getSessionTelemetry({ sessionKey: q.sessionKey, driverNumber: q.driverNumber, lap: q.lap });
  } catch (err) {
    if (q.source === "openf1") throw err;
    return syntheticSession({ circuit: q.circuit, driverNumber: q.driverNumber, lap: q.lap, reason: describe(err) });
  }
}

/** Official classification from Jolpica (the Ergast successor). */
export async function getClassification(season: string, round: string): Promise<RaceClassification | null> {
  const race = await getRaceResults(season, round);
  if (!race?.Results?.length) return null;
  return {
    source: "jolpica",
    season: race.season,
    round: race.round,
    raceName: race.raceName,
    circuitId: race.Circuit?.circuitId ?? "",
    circuitName: race.Circuit?.circuitName ?? "",
    date: race.date,
    rows: race.Results.map((r: any) => ({
      position: /^\d+$/.test(r.positionText) ? parseInt(r.position) : null,
      driverId: r.Driver.driverId,
      code: r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase(),
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      constructorId: r.Constructor.constructorId,
      constructorName: r.Constructor.name,
      grid: parseInt(r.grid) || null,
      status: r.status,
      points: parseFloat(r.points) || 0,
    })),
  };
}
