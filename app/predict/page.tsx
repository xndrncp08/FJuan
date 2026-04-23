/**
 * app/predict/page.tsx
 *
 * The /predict route — a server component that pre-fetches the prediction
 * for the next race and passes it down to the client prediction UI.
 *
 * Server-side fetch means the page is SEO-friendly and avoids a loading
 * spinner on first paint (data is ready when HTML arrives).
 */

import { generateRacePrediction } from "@/lib/types/prediction/engine";
import PredictionClient from "@/components/prediction/PredictionClient";
import { RacePrediction } from "@/lib/types/prediction";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

/** Finds the next upcoming race for the current season */
async function getNextRaceForPrediction(): Promise<{
  season: string;
  round: string;
  raceName: string;
  circuitId: string;
  circuitName: string;
  raceDate: string;
} | null> {
  try {
    const currentYear = new Date().getFullYear();
    const season = currentYear.toString();

    const res = await fetch(`${BASE_URL}/${season}.json?limit=100`, {
      next: { revalidate: 600 },
    });
    const data = await res.json();
    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
    const today = new Date();

    const next =
      races.find((r) => new Date(r.date) >= today) ??
      races[races.length - 1];

    if (!next) return null;

    return {
      season,
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
  title: "Race Prediction | FJUAN",
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
        10
      );
    } else {
      error = "No upcoming race found on the calendar.";
    }
  } catch (e) {
    error = "Could not generate prediction. Please try again later.";
    console.error("[/predict] Server-side prediction failed:", e);
  }

  return (
    <main className="min-h-screen" style={{ background: "#060606" }}>
      <PredictionClient initialPrediction={prediction} initialError={error} />
    </main>
  );
}