import { getF1News } from "@/lib/api/news-fetcher";
import { getCurrentStandings } from "@/lib/api/fetchers";
import { getNextRace } from "@/lib/api/jolpica";
import HeroSection from "@/components/home/HeroSection";
import NextRaceSection from "@/components/home/NextRaceSection";
import NewsSection from "@/components/home/NewsSection";
import TopDriversSection from "@/components/drivers/TopDrivers";
import FeaturesGrid from "@/components/home/FeaturesGrid";

export default async function Home() {
  const [standings, nextRace, news] = await Promise.all([
    getCurrentStandings(),
    getNextRace(),
    getF1News(),
  ]);

  const topDrivers = standings.slice(0, 3);

  return (
    <main className="min-h-screen" style={{ background: "#060606" }}>
      <HeroSection />
      <NextRaceSection nextRace={nextRace} />
      <TopDriversSection topDrivers={topDrivers} />
      <NewsSection news={news} />
      <FeaturesGrid />
    </main>
  );
}
