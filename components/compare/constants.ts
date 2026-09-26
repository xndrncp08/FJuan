import { EMBER, INFO } from "@/lib/theme/palette";
import type { DriverStats } from "@/lib/types/driver";

// Fixed per-slot colors (not team colors): two teammates stay distinguishable,
// and orange vs. blue survives the common forms of color blindness.
export const A_COLOR = EMBER;
export const B_COLOR = INFO;

/** Seasons either driver raced, ascending, with each driver's row for that year. */
export function alignSeasons(a: DriverStats, b: DriverStats) {
  const byYear = (d: DriverStats) => new Map((d.seasonResults ?? []).map((r: any) => [String(r.season ?? r.year), r]));
  const am = byYear(a);
  const bm = byYear(b);
  const years = Array.from(new Set([...am.keys(), ...bm.keys()])).sort();
  return years.map((season) => ({ season, a: am.get(season) as any, b: bm.get(season) as any }));
}
