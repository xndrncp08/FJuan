import { Suspense } from "react";
import circuitsData from "@/lib/data/circuits.json";
import constructorsData from "@/lib/data/constructors.json";
import SearchClient, { type SearchIndex } from "./SearchClient";

export const metadata = { title: "Search" };

const BASE = "https://api.jolpi.ca/ergast/f1";
const PAGE = 100; // Jolpica caps `limit` at 100, so the full list takes several pages.

/**
 * Every driver in F1 history, built once a day on the server. Pages are
 * fetched one at a time to stay under Jolpica's burst limit.
 */
async function allDrivers() {
  const out: any[] = [];
  try {
    for (let offset = 0; offset < 2000; offset += PAGE) {
      const res = await fetch(`${BASE}/drivers.json?limit=${PAGE}&offset=${offset}`, { next: { revalidate: 86_400 } });
      if (!res.ok) break;
      const data = await res.json();
      const page = data?.MRData?.DriverTable?.Drivers ?? [];
      out.push(...page);
      if (out.length >= Number(data?.MRData?.total ?? 0) || page.length < PAGE) break;
    }
  } catch {
    // Partial index is better than none.
  }
  return out;
}

export default async function SearchPage() {
  const drivers = await allDrivers();

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
