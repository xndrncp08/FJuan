import RaceDetail from "@/components/races/RaceDetail";

export default async function RaceWindow({ params }: { params: Promise<{ season: string; round: string }> }) {
  const { season, round } = await params;
  return <RaceDetail season={season} round={round} variant="window" />;
}
