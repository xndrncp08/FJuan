import { getF1News } from "@/lib/api/news-fetcher";
import { getCurrentStandings } from "@/lib/api/fetchers";
import { getNextRace, getLastRace } from "@/lib/api/jolpica";
import { generateRacePrediction } from "@/lib/types/prediction/engine";
import HeroSection from "@/components/home/HeroSection";
import DashboardSection from "@/components/home/DashboardSection";
import LastRaceSection from "@/components/home/LastRaceSection";
import NewsSection from "@/components/home/NewsSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [standings, nextRace, lastRace, news] = await Promise.all([
    getCurrentStandings(),
    getNextRace(),
    getLastRace(),
    getF1News(),
  ]);

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
        3,
      );
    } catch {
      // prediction failing shouldn't break the homepage
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>
      <HeroSection />
      <DashboardSection
        standings={standings ?? []}
        nextRace={nextRace}
        prediction={predictionPreview}
      />
      <LastRaceSection lastRace={lastRace} />
      <NewsSection news={news} />
    </main>
  );
}
