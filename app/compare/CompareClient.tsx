"use client";

/**
 * Head-to-head comparison. The chosen pair lives in the URL (?a=&b=) so a
 * comparison can be shared or linked to from a driver profile.
 */

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserX } from "@/components/ui/icons";
import { useDrivers, useDriverStats, useDriverStandings } from "@/lib/hooks/useDrivers";
import type { Driver, DriverStats } from "@/lib/types/driver";
import { A_COLOR, B_COLOR, ChartsSection, DriverPicker, HeadToHead, StatsBattle } from "@/components/compare";
import { battleRows, leader } from "@/components/compare/StatsBattle";
import type { Slot } from "@/components/compare/HeadToHead";
import { PageHeader, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { InsightNote } from "@/components/ui/InsightNote";
import { EmptyState, Skeleton } from "@/components/ui/States";

const DEFAULT_A = "max_verstappen";
const DEFAULT_B = "hamilton";

function currentTeam(stats: DriverStats, standings: any[]): string {
  const s = standings?.find((x: any) => x?.Driver?.driverId === stats.driver.driverId);
  return s?.Constructors?.[0]?.name ?? stats.seasonResults?.[0]?.team ?? stats.currentTeam?.name ?? "—";
}

export default function CompareClient({ historicalDrivers }: { historicalDrivers: Driver[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const aId = params.get("a") || DEFAULT_A;
  const bId = params.get("b") || (aId === DEFAULT_B ? DEFAULT_A : DEFAULT_B);

  const [editing, setEditing] = useState<Slot | null>(null);
  // Bring the picker (and its results list) up into view on phones.
  useEffect(() => {
    if (editing) document.getElementById("compare-picker")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [editing]);
  const setPair = useCallback(
    (a: string, b: string) => { setEditing(null); router.replace(`${pathname}?${new URLSearchParams({ a, b })}`, { scroll: false }); },
    [router, pathname],
  );

  const { data: drivers } = useDrivers();
  const { data: standings } = useDriverStandings();
  const { data: a, isLoading: aLoading, refetch: reloadA } = useDriverStats(aId);
  // Load B after A: each driver is a burst of paginated Jolpica calls, and
  // firing both at once trips the API's per-second limit.
  const { data: b, isLoading: bLoading, refetch: reloadB } = useDriverStats(bId, !aLoading);

  // Make sure the selected drivers are pickable even if they're not on this season's grid.
  const options = [...new Map([...(drivers ?? []), ...historicalDrivers].map((d) => [d.driverId, d])).values()];
  for (const s of [a, b]) {
    if (s && !options.some((d) => d.driverId === s.driver.driverId)) options.unshift(s.driver);
  }

  const rows = a && b ? battleRows(a, b) : [];
  const leadsA = rows.filter((r) => leader(r) === -1).length;
  const leadsB = rows.filter((r) => leader(r) === 1).length;

  return (
    <>
      <PageHeader eyebrow="Head to head" title="Driver Comparison" watermark="VS" description="Any two drivers in F1 history, side by side." />

      <Section className="pt-0 sm:pt-0">
        <div className="space-y-5">
          {a && b ? (
            <HeadToHead a={a} b={b} teamA={currentTeam(a, standings ?? [])} teamB={currentTeam(b, standings ?? [])} leadsA={leadsA} leadsB={leadsB} editing={editing} onEdit={(s) => setEditing((e) => (e === s ? null : s))} onSwap={() => setPair(bId, aId)} />
          ) : aLoading || bLoading ? (
            <Skeleton className="h-[22rem]" />
          ) : null}

          {(editing || (!aLoading && !bLoading && !(a && b))) && (
            <div id="compare-picker" className="grid gap-3 sm:grid-cols-2">
              {(editing !== "b") && <DriverPicker label="Driver A" value={aId} onChange={(id) => setPair(id, bId)} drivers={options} color={A_COLOR} autoFocus={editing === "a"} />}
              {(editing !== "a") && <DriverPicker label="Driver B" value={bId} onChange={(id) => setPair(aId, id)} drivers={options} color={B_COLOR} autoFocus={editing === "b"} />}
            </div>
          )}

          {aLoading || bLoading ? (
            <div role="status" aria-busy="true" aria-label="Loading comparison">
              <Skeleton className="h-96" />
            </div>
          ) : a && b ? (
            <>
              <section aria-labelledby="tape">
                <h2 id="tape" className="mb-3 mt-4 text-title-3 text-paper">Tale of the tape</h2>
                <StatsBattle rows={rows} />
              </section>
              <ChartsSection a={a} b={b} />
              <InsightNote title="Comparing across eras">Totals cover each full career; rates adjust for different numbers of races. Points systems changed over the years, so raw points favour recent drivers.</InsightNote>
            </>
          ) : (
            <div className="card">
              <EmptyState icon={<UserX />} title="Couldn’t load these drivers" description="The stats service didn’t respond. Your picks are saved." action={<Button variant="filled" onClick={() => { void reloadA(); void reloadB(); }}>Reload comparison</Button>} />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
