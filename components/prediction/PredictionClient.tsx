/**
 * components/prediction/PredictionClient.tsx
 *
 * The prediction page: race header with conditions, the model's pick,
 * P2 and P3, the full top-10 forecast, and how the model works.
 * Factor detail for P2/P3 sits behind a native disclosure.
 */
"use client";

import dynamic from "next/dynamic";

import Link from "next/link";
import { PageIndex } from "@/components/ui/PageIndex";
import { InsightNote } from "@/components/ui/InsightNote";
import { useState } from "react";
import { Activity, ChevronDown, CloudRain, RefreshCw, Sparkles, Thermometer, TriangleAlert, Wind, Zap } from "@/components/ui/icons";
import type { DriverPrediction, RacePrediction } from "@/lib/types/prediction";
import { usePrediction } from "@/lib/hooks/usePrediction";
import { teamColor } from "@/lib/theme/teams";
import { Section, HeaderBackdrop } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TeamMark } from "@/components/ui/TeamMark";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";
import { FactorBreakdown } from "./FactorBreakdown";
import { FACTORS, isFactorActive } from "./factors";

const MEDAL_TEXT = ["text-gold", "text-silver", "text-bronze"];

export default function PredictionClient({
  initialPrediction,
  initialError,
}: {
  initialPrediction: RacePrediction | null;
  initialError: string | null;
}) {
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const { prediction: live, isFetching: isLoading, error: liveError, refetch } = usePrediction({ enabled: refreshEnabled });

  const prediction = live ?? initialPrediction;
  const error = liveError ?? initialError;

  const refresh = () => {
    if (!refreshEnabled) {
      setRefreshEnabled(true);
    } else {
      refetch();
    }
  };

  if (!prediction) {
    return (
      <Section>
        {isLoading ? (
          <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading prediction">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<Sparkles />}
              title="No prediction right now"
              description={error ?? "The model couldn’t run. This usually clears up in a minute."}
              action={
                <Button variant="filled" onClick={refresh}>
                  Try again
                </Button>
              }
            />
          </Card>
        )}
      </Section>
    );
  }

  const [p1, p2, p3] = prediction.predictions;
  const field = prediction.ranking;
  const isSprint = prediction.sprintAvailable;
  const isWet = prediction.weather?.isWetExpected ?? false;
  const w = prediction.weather;
  const date = new Date(`${prediction.raceDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <header className="relative mb-8 overflow-hidden border-b border-hairline sm:mb-10">
        <HeaderBackdrop watermark={prediction.circuitName.split(" ")[0]} />
        <div className="container-page relative pb-8 pt-10 sm:pb-10 sm:pt-16">
          <p className="eyebrow mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Race prediction
          </p>
          <h1 className="profile-title text-paper">{prediction.raceName}</h1>
          <p className="mt-3 text-callout text-label-2">
            {prediction.circuitName} <span className="text-label-3">· {date}</span>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {prediction.isSprint && (
              <Badge tone="warning">
                <Zap className="h-3 w-3" aria-hidden />
                Sprint weekend
              </Badge>
            )}
            {w.available && (
              <>
                <Badge tone={isWet ? "info" : "neutral"}>
                  <CloudRain className="h-3 w-3" aria-hidden />
                  {w.rainProbability}% rain{isWet ? " · wet race likely" : ""}
                </Badge>
                <Badge>
                  <Thermometer className="h-3 w-3" aria-hidden />
                  {w.temperatureC === null ? "Temperature unavailable" : `${Math.round(w.temperatureC)}°C`}
                </Badge>
                <Badge>
                  <Wind className="h-3 w-3" aria-hidden />
                  {w.windSpeedKph === null ? "Wind unavailable" : `${Math.round(w.windSpeedKph)} km/h`}
                </Badge>
              </>
            )}
            {!w.available && <Badge tone="warning">Weather unavailable</Badge>}
            <Badge>{prediction.horizon === "pre-qualifying" ? "Pre-qualifying" : "Post-qualifying · pre-race"}</Badge>
            <ButtonLink href="/predict/history" size="sm" variant="plain" className="ml-auto">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Past calls
            </ButtonLink>
            <Button size="sm" variant="plain" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} aria-hidden />
              {isLoading ? "Updating" : "Refresh"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container-page mb-6 space-y-2">
        <p className="text-footnote text-label-3">Inputs captured at {new Date(prediction.cutoff).toLocaleString("en-GB", { timeZone: "UTC" })} UTC · {field.length} eligible drivers.</p>
        {prediction.warnings.map(note => <p key={note} className="text-footnote text-label-3">{note}</p>)}
      </div>
      <div className="container-page mb-6"><PageIndex items={[{ href: "#forecast-picks", label: "Leading contenders" }, { href: "#forecast-field", label: "Full forecast" }, { href: "#forecast-method", label: "How it works" }]} /></div>
      <Section id="forecast-picks" className="pt-0 sm:pt-0">
        <div className="space-y-5">
          {p1 && p2 && p3 && <ProjectedPodium top={[p1, p2, p3]} />}
          {p1 && <PickCard driver={p1} field={field} isWet={isWet} isSprint={isSprint} />}

          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {[p2, p3].filter(Boolean).map((d, i) => (
              <PodiumCard key={d.driverId} driver={d} place={i + 1} field={field} isWet={isWet} isSprint={isSprint} />
            ))}
          </div>
          <InsightNote title="How to read this forecast">Scores combine eight weighted factors on a 0–100 scale. Relative model estimates sum to 100% across the entire eligible field before display rounding. They are not calibrated win or podium probabilities.</InsightNote>
        </div>
      </Section>

      <Section id="forecast-field" className="pt-0 sm:pt-0">
        <h2 className="mb-1 text-title-3 text-paper">Full forecast</h2>
        <p className="mb-4 text-footnote text-label-3">Model estimates across the entire eligible field. Scores are out of 100; equal scores indicate a tie.</p>
        <Forecast drivers={field} />
      </Section>

      <Section id="forecast-method" className="pt-0 sm:pt-0">
        <Methodology isWet={isWet} isSprint={isSprint} />
      </Section>
    </>
  );
}

function DriverName({ d, size = "md" }: { d: DriverPrediction; size?: "md" | "lg" }) {
  return (
    <>
      <div className={cn("text-label-2", size === "lg" ? "text-body" : "text-callout")}>{d.givenName}</div>
      <div className={cn("text-paper", size === "lg" ? "text-title-1" : "text-title-2")}>{d.familyName}</div>
      <div className="mt-2 flex items-center gap-2 text-footnote text-label-3">
        <TeamMark team={d.constructorId} size="sm" />
        {d.constructorName}
        {(d.penaltySeverity ?? 0) > 0 && (
          <Badge tone="warning" className="ml-1">
            <TriangleAlert className="h-3 w-3" aria-hidden />
            Grid penalty
          </Badge>
        )}
      </div>
    </>
  );
}

function PickCard({ driver: d, field, isWet, isSprint }: { driver: DriverPrediction; field: DriverPrediction[]; isWet: boolean; isSprint: boolean }) {
  const color = teamColor(d.constructorId);
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_1.1fr]">
        <div className="relative p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: `radial-gradient(ellipse 80% 70% at 0% 0%, ${color}26, transparent 70%)` }}
          />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-footnote font-semibold text-gold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {field.filter(candidate => candidate.score === d.score).length > 1 ? "Joint model leader" : "The model’s pick"}
            </p>
            <div className="mt-5">
              <DriverName d={d} size="lg" />
            </div>
            <div className="mt-8 flex items-end gap-8">
              <div>
                <div className="tabular text-[clamp(3rem,8vw,4.5rem)] font-bold leading-none tracking-[-0.045em] text-paper">
                  {(d.modelEstimate * 100).toFixed(1)}
                  <span className="text-title-2 text-label-2">%</span>
                </div>
                <div className="mt-1.5 text-footnote text-label-3">Model estimate</div>
              </div>
              <div>
                <div className="tabular text-stat text-paper">{d.score.toFixed(1)}</div>
                <div className="mt-1.5 text-footnote text-label-3">Model score</div>
              </div>
            </div>
            {d.insight && <p className="mt-6 max-w-prose text-callout text-label-2">{d.insight}</p>}
          </div>
        </div>
        <div className="border-t border-hairline p-6 sm:p-8 lg:border-l lg:border-t-0">
          <h2 className="mb-1 text-headline text-paper">Why {d.familyName}</h2>
          <p className="mb-5 text-footnote text-label-3">Score per factor. The tick marks the field average.</p>
          <FactorBreakdown driver={d} field={field} color={color} isWet={isWet} isSprint={isSprint} />
        </div>
      </div>
    </Card>
  );
}

function PodiumCard({
  driver: d,
  place,
  field,
  isWet,
  isSprint,
}: {
  driver: DriverPrediction;
  place: number;
  field: DriverPrediction[];
  isWet: boolean;
  isSprint: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn("text-footnote font-semibold", MEDAL_TEXT[place])}>P{place + 1}</p>
          <div className="mt-3">
            <DriverName d={d} />
          </div>
        </div>
        <div className="text-right">
          <div className="tabular text-stat text-paper">{(d.modelEstimate * 100).toFixed(1)}%</div>
          <div className="text-caption text-label-3">Model estimate</div><div className="mt-1 text-caption text-label-3">Score {d.score.toFixed(1)}</div>
        </div>
      </div>
      {d.insight && <p className="mt-5 text-subhead text-label-2">{d.insight}</p>}
      <details className="group mt-5 border-t border-hairline pt-4">
        <summary className="pressable -mx-2 flex h-9 cursor-pointer list-none items-center justify-between px-2 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint hover:bg-fill-1 [&::-webkit-details-marker]:hidden">
          Factor breakdown
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" aria-hidden />
        </summary>
        <div className="pt-4">
          <FactorBreakdown driver={d} field={field} color={teamColor(d.constructorId)} isWet={isWet} isSprint={isSprint} />
        </div>
      </details>
    </Card>
  );
}

function Forecast({ drivers }: { drivers: DriverPrediction[] }) {
  const top = Math.max(Number.EPSILON, ...drivers.map((d) => d.modelEstimate));
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="hidden grid-cols-[2rem_minmax(0,14rem)_1fr_3.5rem_3.5rem] gap-4 border-b border-hairline px-5 py-3 text-caption font-semibold uppercase tracking-widest text-label-3 sm:grid"><span>Rank</span><span>Driver</span><span>Model estimate</span><span className="text-right">Score</span><span className="text-right">%</span></div>
      <ol>
        {drivers.map((d, i) => (
          <li
            key={d.driverId}
            className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-3 border-b border-hairline px-4 py-3 last:border-0 sm:grid-cols-[2rem_minmax(0,14rem)_1fr_3.5rem_3.5rem] sm:gap-4 sm:px-5"
          >
            <span className={cn("tabular text-subhead font-semibold", i < 3 ? MEDAL_TEXT[i] : "text-label-3")}>{i + 1}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-callout">
                <TeamMark team={d.constructorId} size="sm" />
                {d.driverId.startsWith("openf1:") ? <span className="inline-flex min-h-11 items-center font-semibold text-paper">{d.familyName}</span> : <Link href={`/drivers/${d.driverId}`} className="inline-flex min-h-11 items-center font-semibold text-paper hover:text-tint">{d.familyName}</Link>}
                {(d.penaltySeverity ?? 0) > 0 && <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="Grid penalty" />}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden bg-fill-1 sm:hidden" aria-hidden>
                <div className="h-full bg-ember" style={{ width: `${(d.modelEstimate / top) * 100}%`, opacity: Math.max(0.35, 1 - i * 0.035) }} />
              </div>
            </div>
            <div className="hidden h-2 overflow-hidden bg-fill-1 sm:block" aria-hidden>
              <div className="h-full bg-ember" style={{ width: `${(d.modelEstimate / top) * 100}%`, opacity: Math.max(0.35, 1 - i * 0.035) }} />
            </div>
            <span className="tabular hidden text-right text-subhead text-label-3 sm:block">{d.score.toFixed(1)}</span>
            <span className="tabular text-right text-subhead font-semibold text-paper">{(d.modelEstimate * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Methodology({ isWet, isSprint }: { isWet: boolean; isSprint: boolean }) {
  const palette = ["#E6501B", "#F2A541", "#6CC4FF", "#B48CFF", "#34D27B", "#FF87BC", "#C9CDD3", "#8A7A76"];
  return (
    <Card padding="lg">
      <h2 className="text-title-3 text-paper">How the model works</h2>
      <p className="mt-2 max-w-prose text-subhead text-label-2">
        Eight factors scored 0–100, combined with unchanged weights. Missing inputs receive a neutral 50. Relative estimates use a softmax across the entire eligible field; fixed-domain ratings and penalties retain their scale.
      </p>

      <div className="mt-6 flex h-3 overflow-hidden" role="img" aria-label="Factor weights">
        {FACTORS.map((f, i) => (
          <div
            key={f.key}
            className="h-full border-r-2 border-surface last:border-r-0"
            style={{ width: `${f.weight}%`, background: palette[i], opacity: isFactorActive(f.context, isWet, isSprint) ? 1 : 0.35 }}
          />
        ))}
      </div>

      <ul className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
        {FACTORS.map((f, i) => {
          const active = isFactorActive(f.context, isWet, isSprint);
          return (
            <li key={f.key} className="flex gap-4">
              <span className="tabular w-10 shrink-0 text-headline" style={{ color: palette[i] }}>
                {f.weight}%
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-callout font-semibold text-paper">
                  {f.label}
                  {f.context && <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Not in play"}</Badge>}
                </h3>
                <p className="mt-1 text-subhead text-label-3">{f.description}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 border-t border-hairline pt-5 text-footnote text-label-3">
        Data from the Jolpica F1 API, Open-Meteo forecasts, and OpenF1 race control messages. These estimates have not been calibrated against held-out race outcomes.
      </p>
    </Card>
  );
}

const Podium3D = dynamic(() => import("./Podium3D"), { ssr: false, loading: () => <div className="h-full" /> });

/** The top three on a 3D podium, with names and odds as text under each step. */
function ProjectedPodium({ top }: { top: DriverPrediction[] }) {
  const order = [top[1], top[0], top[2]];
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="tex-grid relative h-56 sm:h-72">
        <Podium3D steps={top.map((d) => ({ code: d.driverCode, color: teamColor(d.constructorId) }))} />
        <p className="eyebrow absolute left-5 top-4">Projected podium</p>
      </div>
      <ol className="grid grid-cols-3 border-t border-hairline">
        {order.map((d) => {
          const place = top.indexOf(d) + 1;
          return (
            <li key={d.driverId} className={cn("stagger-in px-2 py-3 text-center sm:py-4", place === 1 && "bg-fill-1")} style={{ ["--i" as string]: place }}>
              <span className={cn("block font-mono text-caption", MEDAL_TEXT[place - 1])}>P{place}</span>
              <span className="block font-display text-[1.25rem] uppercase leading-tight text-paper">{d.driverCode}</span>
              <span className="tabular block text-footnote text-label-3">{(d.modelEstimate * 100).toFixed(1)}% estimate</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
