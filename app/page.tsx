import { getF1News } from "@/lib/api/news-fetcher";
import { getCurrentStandings } from "@/lib/api/fetchers";
import { getNextRace, getLastRace } from "@/lib/api/jolpica";
import { generateRacePrediction } from "@/lib/types/prediction/engine";
import HeroSection from "@/components/home/HeroSection";
import NextRaceSection from "@/components/home/NextRaceSection";
import NewsSection from "@/components/home/NewsSection";
import LastRaceSection from "@/components/home/LastRaceSection";
import PredictionPreview from "@/components/home/PredictionPreview";
import FeaturesGrid from "@/components/home/FeaturesGrid";

export default async function Home() {
  const [standings, nextRace, lastRace, news] = await Promise.all([
    getCurrentStandings(),
    getNextRace(),
    getLastRace(),
    getF1News(),
  ]);

  // Prediction preview — generate for next race if available
  let predictionPreview = null;
  if (nextRace) {
    try {
      predictionPreview = await generateRacePrediction(
        new Date().getFullYear().toString(),
        nextRace.round,
        nextRace.raceName,
        nextRace.Circuit.circuitId,
        nextRace.Circuit.circuitName,
        nextRace.date,
        3 // only need top 3 for preview
      );
    } catch {
      // prediction failing shouldn't break the homepage
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "#060606" }}>
      <HeroSection />
      <NextRaceSection nextRace={nextRace} />
      <LastRaceSection lastRace={lastRace} />
      <PredictionPreview prediction={predictionPreview} nextRace={nextRace} />
      <NewsSection news={news} />
    </main>
  );
}