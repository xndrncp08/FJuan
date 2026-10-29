import { getNextRacePrediction } from "@/lib/prediction/service";
import { PredictionUnavailableError } from "@/lib/prediction/policy";
import PredictionClient from "@/components/prediction/PredictionClient";
import type { RacePrediction } from "@/lib/types/prediction";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Race prediction",
  description: "Race prediction and relative model estimates based on form, standings, circuit history, and qualifying pace.",
};
export default async function PredictPage() {
  let prediction: RacePrediction | null = null;
  let error: string | null = null;
  try {
    prediction = await getNextRacePrediction();
    if (!prediction) error = "No upcoming race found on the calendar.";
  } catch (e) {
    error = e instanceof PredictionUnavailableError ? e.message : "Could not generate prediction. Please try again later.";
  }
  return <PredictionClient initialPrediction={prediction} initialError={error} />;
}
