import { getDriverIndex } from "@/lib/api/driverIndex";
import { Suspense } from "react";
import circuitsData from "@/lib/data/circuits.json";
import constructorsData from "@/lib/data/constructors.json";
import SearchClient, { type SearchIndex } from "./SearchClient";

export const metadata = { title: "Search" };

export default async function SearchPage() {
  const drivers = await getDriverIndex();

  const index: SearchIndex = {
    drivers: drivers.map((d) => ({
      id: d.driverId,
      name: `${d.givenName} ${d.familyName}`,
      nationality: d.nationality ?? "",
      code: d.code ?? "",
      number: d.permanentNumber ?? "",
      born: d.dateOfBirth?.slice(0, 4) ?? "",
    })),
    teams: constructorsData.map((c) => ({ id: c.id, name: c.name, nationality: c.nationality, color: c.color, titles: c.championships })),
    circuits: circuitsData.map((c) => ({ id: c.id, name: c.name, location: c.location })),
  };

  return (
    <Suspense>
      <SearchClient index={index} />
    </Suspense>
  );
}
