"use client";

import { useEffect, useState } from "react";
import { getRaceSchedule } from "@/lib/api/jolpica";
import RaceGrid, { SeasonProgress } from "@/components/calendar/RaceGrid";
import { PageHeader, Section } from "@/components/ui/Section";
import { SeasonPicker } from "@/components/ui/SeasonPicker";
import { Skeleton } from "@/components/ui/States";

export default function CalendarPage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear.toString());
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRaceSchedule(season)
      .then((data) => !cancelled && setRaces(data || []))
      .catch(() => !cancelled && setRaces([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [season]);

  const countries = new Set(races.map((r) => r.Circuit?.Location?.country)).size;

  return (
    <>
      <PageHeader
        eyebrow={`${season} season`}
        title="Race Calendar"
        watermark={season}
        description={
          loading || !races.length
            ? "Every race weekend, with results for the ones already run."
            : `${races.length} races in ${countries} countries. Tap a finished round for results, or an upcoming one for the circuit.`
        }
      >
        <div className="space-y-6">
          <SeasonPicker value={season} onChange={setSeason} />
          {season === String(currentYear) && <SeasonProgress races={loading ? [] : races} />}
        </div>
      </PageHeader>

      <Section className="pt-0 sm:pt-0">
        {loading ? (
          <div className="space-y-8" role="status" aria-busy="true" aria-label="Loading schedule">
            {[0, 1].map((i) => (
              <div key={i}>
                <Skeleton className="mb-3 h-6 w-28" />
                <div className="card space-y-3 p-4">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-14" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RaceGrid races={races} season={season} />
        )}
      </Section>
    </>
  );
}
