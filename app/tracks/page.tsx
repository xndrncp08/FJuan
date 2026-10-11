/**
 * app/tracks/page.tsx — Circuits on this season's calendar.
 *
 * Server component: calendar order comes from Jolpica, everything else
 * (layout map, length, lap record) from lib/data/circuits.json.
 */

import { getCircuits } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";
import CircuitDirectory from "@/components/tracks/CircuitDirectory";

export const metadata = { title: "Circuits" };

type Circuit = (typeof circuitsData)[number];

export default async function TracksPage() {
  let apiCircuits: any[] = [];
  try {
    apiCircuits = await getCircuits("current");
  } catch {
    // fall back to local order
  }

  const circuits = (apiCircuits.length > 0 ? apiCircuits : circuitsData)
    .map((c: any) => circuitsData.find((l) => l.id === c.circuitId || l.id === c.id) ?? null)
    .filter(Boolean) as Circuit[];

  return <CircuitDirectory circuits={circuits} />;
}
