/**
 * app/predict/page.tsx
 *
 * The /predict route — a server component that pre-fetches the prediction
 * for the next race and passes it down to the client prediction UI.
 *
 * Server-side fetch means the page is SEO-friendly and avoids a loading
 * spinner on first paint (data is ready when HTML arrives).
 */

import { generateRacePrediction } from "@/lib/prediction/engine";
import PredictionClient from "@/components/prediction/PredictionClient";
import { RacePrediction } from "@/lib/types/prediction";
import { getNextRace } from "@/lib/api/jolpica";

/** Next race on the calendar (shared "is it past yet" logic lives in jolpica.ts). */
async function getNextRaceForPrediction() {
  try {
    const next = await getNextRace();
    if (!next) return null;
    return {
      season: next.season ?? new Date().getFullYear().toString(),
      round: next.round,
      raceName: next.raceName,
      circuitId: next.Circuit.circuitId,
      circuitName: next.Circuit.circuitName,
      raceDate: next.date,
    };
  } catch {
    return null;
  }
}

// Next.js page metadata
export const metadata = {
  title: "Race prediction",
  description:
    "AI-powered race winner prediction for the next Formula 1 Grand Prix, based on form, standings, circuit history, and qualifying pace.",
};

export default async function PredictPage() {
  // Attempt server-side prediction generation
  let prediction: RacePrediction | null = null;
  let error: string | null = null;

  try {
    const nextRace = await getNextRaceForPrediction();
    if (nextRace) {
      prediction = await generateRacePrediction(
        nextRace.season,
        nextRace.round,
        nextRace.raceName,
        nextRace.circuitId,
        nextRace.circuitName,
        nextRace.raceDate,
        10,
      );
    } else {
      error = "No upcoming race found on the calendar.";
    }
  } catch (e) {
    error = "Could not generate prediction. Please try again later.";
    console.error("[/predict] Server-side prediction failed:", e);
  }

  return (
    <PredictionClient initialPrediction={prediction} initialError={error} />
  );
}
