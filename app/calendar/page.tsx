"use client";

import { useQuery } from "@tanstack/react-query";
import { getRaceSchedule } from "@/lib/api/jolpica";
import RaceGrid from "@/components/calendar/RaceGrid";
import { PageHeader, Section } from "@/components/ui/Section";
import { useSeasonChoice } from "@/lib/hooks/useSeasonChoice";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { SeasonPicker } from "@/components/ui/SeasonPicker";
import { Skeleton } from "@/components/ui/States";

export default function CalendarPage() {
  const [season, setSeason] = useSeasonChoice();
  const { data: races = [], isPending: loading, isError: error, refetch } = useQuery<any[]>({
    queryKey: ["calendar", season],
    queryFn: () => getRaceSchedule(season),
  });

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
            : `${races.length} races, ${countries} countries. Tap any round for its schedule or results.`
        }
      >
        <SeasonPicker value={season} onChange={setSeason} />
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
        ) : error ? <div className="card"><EmptyState title="Calendar unavailable" description="The schedule service didn’t respond. Your selected season is saved." action={<Button onClick={() => void refetch()}>Retry schedule</Button>} /></div> : (
          <RaceGrid races={races} season={season} />
        )}
      </Section>
    </>
  );
}
