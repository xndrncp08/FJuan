"use client";

/**
 * Head-to-head comparison. The chosen pair lives in the URL (?a=&b=) so a
 * comparison can be shared or linked to from a driver profile.
 */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, UserX } from "lucide-react";
import { useDrivers, useDriverStats, useDriverStandings } from "@/lib/hooks/useDrivers";
import type { DriverStats } from "@/lib/types/driver";
import { A_COLOR, B_COLOR, ChartsSection, DriverPicker, HeadToHead, StatsBattle } from "@/components/compare";
import { battleRows, leader } from "@/components/compare/StatsBattle";
import { PageHeader, Section } from "@/components/ui/Section";
import { IconButton } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";

const DEFAULT_A = "max_verstappen";
const DEFAULT_B = "hamilton";

function currentTeam(stats: DriverStats, standings: any[]): string {
  const s = standings?.find((x: any) => x?.Driver?.driverId === stats.driver.driverId);
  return s?.Constructors?.[0]?.name ?? stats.seasonResults?.[0]?.team ?? stats.currentTeam?.name ?? "—";
}

export default function CompareClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const aId = params.get("a") || DEFAULT_A;
  const bId = params.get("b") || (aId === DEFAULT_B ? DEFAULT_A : DEFAULT_B);

  const setPair = useCallback(
    (a: string, b: string) => router.replace(`${pathname}?a=${a}&b=${b}`, { scroll: false }),
    [router, pathname],
  );

  const { data: drivers } = useDrivers();
  const { data: standings } = useDriverStandings();
  const { data: a, isLoading: aLoading } = useDriverStats(aId);
  // Load B after A: each driver is a burst of paginated Jolpica calls, and
  // firing both at once trips the API's per-second limit.
  const { data: b, isLoading: bLoading } = useDriverStats(bId, !aLoading);

  // Make sure the selected drivers are pickable even if they're not on this season's grid.
  const options = [...(drivers ?? [])];
  for (const s of [a, b]) {
    if (s && !options.some((d) => d.driverId === s.driver.driverId)) options.unshift(s.driver);
  }

  const rows = a && b ? battleRows(a, b) : [];
  const leadsA = rows.filter((r) => leader(r) === -1).length;
  const leadsB = rows.filter((r) => leader(r) === 1).length;

  return (
    <>
      <PageHeader
        eyebrow="Head to head"
        title="Driver Comparison"
        watermark="VS"
        description="Pick any two drivers to see their careers side by side — totals, rates, and how each season stacked up."
      >
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <DriverPicker label="Driver A" value={aId} onChange={(id) => setPair(id, bId)} drivers={options} color={A_COLOR} />
          <IconButton aria-label="Swap drivers" onClick={() => setPair(bId, aId)} className="mx-auto rotate-90 sm:rotate-0">
            <ArrowLeftRight className="h-4 w-4" />
          </IconButton>
          <DriverPicker label="Driver B" value={bId} onChange={(id) => setPair(aId, id)} drivers={options} color={B_COLOR} />
        </div>
      </PageHeader>

      <Section className="pt-0 sm:pt-0">
        {aLoading || bLoading ? (
          <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading comparison">
            <Skeleton className="h-44 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : a && b ? (
          <div className="space-y-5">
            <HeadToHead a={a} b={b} teamA={currentTeam(a, standings ?? [])} teamB={currentTeam(b, standings ?? [])} leadsA={leadsA} leadsB={leadsB} />
            <ChartsSection a={a} b={b} />
            <div>
              <h2 className="mb-4 text-title-3 text-paper">Career numbers</h2>
              <StatsBattle rows={rows} />
            </div>
          </div>
        ) : (
          <div className="card">
            <EmptyState icon={<UserX />} title="Couldn’t load these drivers" description="The stats service didn’t respond. Try another pair, or refresh in a moment." />
          </div>
        )}
      </Section>
    </>
  );
}
