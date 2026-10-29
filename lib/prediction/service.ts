import { cache } from "react";
import type { PredictionHorizon } from "@/lib/types/prediction";
import { nextScheduledRace, raceStartTime } from "@/lib/utils/raceCalendar";
import { capturePredictionInputs } from "./data";
import { scorePrediction } from "./engine";
import { findSnapshot, saveSnapshot } from "./snapshots";
import { PredictionUnavailableError } from "./policy";

export async function getPredictionRace(season = String(new Date().getUTCFullYear()), round?: string): Promise<any | null> {
  if (!/^\d{4}$/.test(season) || (round !== undefined && !/^[1-9]\d?$/.test(round))) throw new Error("Invalid season or round.");
  const url = `https://api.jolpi.ca/ergast/f1/${season}${round ? `/${round}` : ""}.json?limit=100`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new PredictionUnavailableError("Race calendar unavailable.");
  const races = (await res.json())?.MRData?.RaceTable?.Races ?? [];
  return round ? races[0] ?? null : nextScheduledRace<any>(races);
}
export async function generateRacePrediction(race: any, options: { horizon?: PredictionHorizon; cutoff?: string } = {}) {
  const requestedAt = Date.now();
  const archived = options.cutoff || requestedAt >= raceStartTime(race);
  let snapshot;
  let captured = false;
  if (archived) snapshot = await findSnapshot(String(race.season), String(race.round), options.horizon, options.cutoff ?? new Date(requestedAt).toISOString());
  else {
    try { snapshot = await capturePredictionInputs(race, { horizon: options.horizon }); captured = true; }
    catch (error) {
      if (!(error instanceof PredictionUnavailableError)) throw error;
      snapshot = await findSnapshot(String(race.season), String(race.round), options.horizon, new Date(requestedAt).toISOString());
      if (!snapshot) throw error;
    }
  }
  if (!snapshot) throw new PredictionUnavailableError("No saved pre-race snapshot for this horizon. Today's data cannot reconstruct what was known then.");
  if (captured && process.env.PREDICTION_SNAPSHOT_DIR) await saveSnapshot(snapshot, process.env.PREDICTION_SNAPSHOT_DIR);
  return scorePrediction(snapshot);
}

/** Share one immutable capture across the page, home preview, and assistant in a server render. */
export const getNextRacePrediction = cache(async () => {
  const race = await getPredictionRace();
  return race ? generateRacePrediction(race) : null;
});
