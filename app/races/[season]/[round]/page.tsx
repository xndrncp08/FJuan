/**
 * app/races/[season]/[round]/page.tsx — One race weekend's results.
 * Opened from a list, the same view appears in a floating window instead
 * (app/@modal/(.)races/[season]/[round]).
 */

import RaceDetail from "@/components/races/RaceDetail";

export default async function RaceDetailPage({ params }: { params: Promise<{ season: string; round: string }> }) {
  const { season, round } = await params;
  return <RaceDetail season={season} round={round} variant="page" />;
}
