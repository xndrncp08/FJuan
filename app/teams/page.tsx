import TeamStandings from "@/components/teams/TeamStandings";
import { getConstructorStandings } from "@/lib/api/jolpica";
import constructorsData from "@/lib/data/constructors.json";
import { getLiveTeamColours, resolveTeamColour } from "@/lib/api/teamLogos";
import { getSeasonCars } from "@/lib/api/cars";
import { shortTeamName, teamColor } from "@/lib/theme/teams";

export const metadata = { title: "Teams" };

const CURRENT_IDS = ["ferrari", "mercedes", "red_bull", "mclaren", "alpine", "aston_martin", "williams", "haas", "rb", "sauber"];


export default async function TeamsPage() {
  const season = String(new Date().getFullYear());
  let standings: any[] = [];
  const [standingsResult, liveColours, cars] = await Promise.all([
    getConstructorStandings("current").catch(() => []),
    getLiveTeamColours(),
    getSeasonCars().catch(() => []),
  ]);
  standings = standingsResult ?? [];

  const teams =
    standings.length > 0
      ? standings.map((s: any) => {
          const local = constructorsData.find(
            (c) => c.id === s.Constructor.constructorId || s.Constructor.name.toLowerCase().includes(c.id.replace("_", " ")),
          );
          return {
            constructorId: s.Constructor.constructorId,
            name: s.Constructor.name,
            nationality: s.Constructor.nationality,
            position: parseInt(s.position) || 0,
            points: parseFloat(s.points) || 0,
            wins: parseInt(s.wins) || 0,
            championships: local?.championships ?? 0,
            color: liveColours.length
              ? resolveTeamColour(s.Constructor.constructorId, liveColours)
              : local?.color ?? teamColor(s.Constructor.constructorId),
            base: local?.base ?? "",
            founded: local?.founded ?? 0,
          };
        })
      : cars.length ? cars.map((car) => {
          const local = constructorsData.find((c) => c.id === car.constructorId);
          return { constructorId: car.constructorId, name: local?.name ?? shortTeamName(null, car.constructorId), nationality: local?.nationality ?? "", position: 0, points: 0, wins: 0, championships: local?.championships ?? 0, color: local?.color ?? teamColor(car.constructorId), base: local?.base ?? "", founded: local?.founded ?? 0 };
        }) : constructorsData
          .filter((c) => CURRENT_IDS.includes(c.id))
          .map((c) => ({
            constructorId: c.id,
            name: c.name,
            nationality: c.nationality,
            position: 0,
            points: 0,
            wins: 0,
            championships: c.championships,
            color: c.color,
            base: c.base,
            founded: c.founded,
          }));

  return <TeamStandings teams={teams} season={season} available={standings.length > 0} />;
}
