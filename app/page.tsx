import { Suspense } from "react";
import { RouteLoading } from "@/components/ui/RouteLoading";
import { getF1News } from "@/lib/api/news-fetcher";
import { getCurrentStandings } from "@/lib/api/fetchers";
import { getConstructorStandings, getNextRace, getLastRace } from "@/lib/api/jolpica";
import { getSeasonCars } from "@/lib/api/cars";
import { generateRacePrediction } from "@/lib/prediction/engine";
import HeroSection from "@/components/home/HeroSection";
import { getHeroHud } from "@/lib/api/heroHud";
import CarShowcase from "@/components/home/CarShowcase";
import NextRaceSection from "@/components/home/NextRaceSection";
import DashboardSection from "@/components/home/DashboardSection";
import LastRaceSection from "@/components/home/LastRaceSection";
import NewsSection from "@/components/home/NewsSection";

export const dynamic = "force-dynamic";

export default function Home() {
  return <>
    {/* Not awaited: the hero paints immediately and its data strip streams in. */}
    <HeroSection hud={getHeroHud()} />
    <Suspense fallback={<RouteLoading label="Loading the paddock" />}><HomeData /></Suspense>
  </>;
}

async function HomeData() {
  const [standings, nextRace, lastRace, news, seasonCars, ctorStandings] = await Promise.all([
    getCurrentStandings(),
    getNextRace(),
    getLastRace(),
    getF1News(),
    getSeasonCars().catch(() => []),
    getConstructorStandings("current").catch(() => [] as any[]),
  ]);

  // The grid in championship order; teams without a standing go last.
  const rank = new Map((ctorStandings as any[]).map((s) => [s.Constructor?.constructorId, Number(s.position)]));
  const cars = [...seasonCars]
    .sort((a, b) => (rank.get(a.constructorId) ?? 99) - (rank.get(b.constructorId) ?? 99))
    .map((c) => ({ constructorId: c.constructorId, chassis: c.chassis, entrant: c.entrant, powerUnit: c.powerUnit }));
  const carSeason = seasonCars[0]?.season ?? new Date().getFullYear();

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
    <>
      <CarShowcase cars={cars} season={carSeason} />
      <NextRaceSection nextRace={nextRace} />
      <DashboardSection
        standings={standings ?? []}
        nextRace={nextRace}
        prediction={predictionPreview}
      />
      <LastRaceSection lastRace={lastRace} />
      <NewsSection news={news} />
    </>
  );
}
