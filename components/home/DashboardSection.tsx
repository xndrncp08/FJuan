/**
 * components/home/DashboardSection.tsx
 *
 * The championship at a glance: driver standings beside the model's podium
 * picks for the next race. Rows are real links into driver profiles.
 */

import Link from "next/link";
import { ChevronRight, CloudRain, Sparkles, Thermometer, Wind } from "lucide-react";
import { Section, SectionHeader, SeeAll } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PositionBadge } from "@/components/ui/Badge";
import { teamColor } from "@/lib/theme/teams";

interface DashboardSectionProps {
  standings: any[];
  nextRace: any;
  prediction: any;
}

export default function DashboardSection({ standings, nextRace, prediction }: DashboardSectionProps) {
  return (
    <Section>
      <SectionHeader eyebrow="Championship" title="Where things stand" />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-5">
        <StandingsCard standings={standings} />
        <PredictionCard prediction={prediction} nextRace={nextRace} />
      </div>
    </Section>
  );
}

function StandingsCard({ standings }: { standings: any[] }) {
  const rows = standings.slice(0, 10);
  const leader = Number(rows[0]?.points) || 0;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-6">
        <h3 className="text-headline text-paper">Drivers’ standings</h3>
        <SeeAll href="/drivers" label="All drivers" />
      </div>

      {rows.length === 0 ? (
        <p className="px-6 pb-8 pt-4 text-subhead text-label-3">Standings will appear after the first race.</p>
      ) : (
        <ol className="px-2 pb-2">
          {rows.map((s: any, i: number) => {
            const pts = Number(s.points) || 0;
            const gap = leader - pts;
            const team = s.Constructors?.[0];
            return (
              <li key={s.Driver?.driverId ?? i}>
                <Link
                  href={`/drivers/${s.Driver?.driverId}`}
                  className="row-interactive grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-3 py-2.5 sm:gap-4 sm:px-4"
                >
                  <PositionBadge position={s.position ?? i + 1} />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-callout text-paper">
                        <span className="hidden text-label-2 sm:inline">{s.Driver?.givenName} </span>
                        <span className="font-semibold">{s.Driver?.familyName}</span>
                      </span>
                      <span className="hidden shrink-0 text-footnote text-label-3 sm:inline">{team?.name}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden bg-fill-1" aria-hidden>
                      <div
                        className="h-full"
                        style={{
                          width: `${leader ? Math.max(3, (pts / leader) * 100) : 0}%`,
                          background: teamColor(team?.constructorId ?? team?.name),
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-callout font-semibold text-paper">{pts}</div>
                    <div className="tabular text-caption text-label-3">{i === 0 ? "Leader" : `−${gap}`}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function PredictionCard({ prediction, nextRace }: { prediction: any; nextRace: any }) {
  const picks: any[] = prediction?.predictions?.slice(0, 5) ?? [];
  const top = Math.max(1, ...picks.map((p) => Number(p.podiumProbability) || 0));

  return (
    <Card padding="none" className="flex flex-col self-start overflow-hidden">
      <div className="px-5 pb-1 pt-5 sm:px-6">
        <div className="flex items-center gap-2 label-caps text-[0.75rem] text-tint">
          <Sparkles className="h-4 w-4" aria-hidden />
          Prediction
        </div>
        <h3 className="mt-1 text-headline text-paper">
          Podium chances{prediction?.raceName || nextRace?.raceName ? ` · ${prediction?.raceName ?? nextRace?.raceName}` : ""}
        </h3>
      </div>

      {picks.length === 0 ? (
        <p className="flex-1 px-6 py-8 text-subhead text-label-3">
          The model hasn’t produced picks for the next race yet. Check back closer to the weekend.
        </p>
      ) : (
        <ol className="space-y-4 px-5 py-4 sm:px-6">
          {picks.map((p, i) => {
            const prob = Number(p.podiumProbability) || 0;
            return (
              <li key={p.driverId ?? i}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-callout">
                    <span className="tabular mr-2 text-label-3">{i + 1}</span>
                    <span className="font-semibold text-paper">{p.familyName}</span>
                    <span className="ml-2 text-footnote text-label-3">{p.constructorName}</span>
                  </span>
                  <span className="tabular text-callout font-semibold text-paper">{prob}%</span>
                </div>
                <div className="h-2 overflow-hidden bg-fill-1" aria-hidden>
                  <div
                    className="h-full"
                    style={{
                      width: `${(prob / top) * 100}%`,
                      background: i === 0 ? "rgb(var(--ember))" : `rgb(var(--ember) / ${0.75 - i * 0.1})`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {picks[0]?.insight && (
        <div className="mx-5 mb-4 rounded-md bg-fill-1 p-4 sm:mx-6">
          <p className="label-caps text-[0.75rem] text-label-3">Why {picks[0].familyName}</p>
          <p className="mt-1 text-subhead text-label-2">{picks[0].insight}</p>
        </div>
      )}

      {prediction?.weather && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 pb-5 text-footnote text-label-3 sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <CloudRain className="h-4 w-4" aria-hidden />
            <span className="tabular">{prediction.weather.rainProbability}%</span> rain
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Thermometer className="h-4 w-4" aria-hidden />
            <span className="tabular">{Math.round(prediction.weather.temperatureC)}°C</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wind className="h-4 w-4" aria-hidden />
            <span className="tabular">{Math.round(prediction.weather.windSpeedKph)} km/h</span>
          </span>
        </div>
      )}

      <Link
        href="/predict"
        className="row-interactive flex items-center justify-between border-t border-hairline px-5 py-3.5 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint sm:px-6"
      >
        How the model decides
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </Card>
  );
}
