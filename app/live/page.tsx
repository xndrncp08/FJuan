/**
 * app/live/page.tsx
 *
 * Session telemetry in three steps: pick a session, pick a driver, read
 * the dashboard. Each finished step collapses to a one-line summary so
 * the data stays near the top of the page.
 */
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InsightNote } from "@/components/ui/InsightNote";
import { Activity, ChevronDown } from "lucide-react";
import { CarTelemetry, Driver, LapData, PitStop, Session, Stint, displayName, safeArray, teamColor } from "@/components/live/types";
import SessionSearch from "@/components/live/SessionSearch";
import DriverSelector from "@/components/live/DriverSelector";
import StatsSummary from "@/components/live/StatsSummary";
import TelemetryPanel from "@/components/live/TelemetryPanel";
import TyrePanel from "@/components/live/TyrePanel";
import LapTimesPanel from "@/components/live/LapTimesPanel";
import LapTrendChart from "@/components/live/LapTrendChart";
import SectorDeltaPanel from "@/components/live/SectorDeltaPanel";
import { PageHeader, Section } from "@/components/ui/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";

const OPENF1 = "https://api.openf1.org/v1";
async function getSessionArray<T>(url: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("OpenF1 data unavailable");
  return safeArray<T>(await response.json());
}

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [driversOpen, setDriversOpen] = useState(true);
  const driversQuery = useQuery({
    queryKey: ["session-drivers", session?.session_key], enabled: !!session, staleTime: 300_000,
    queryFn: async ({ signal }) => {
      const data = await getSessionArray<Driver>(`${OPENF1}/drivers?session_key=${session!.session_key}`, signal);
      return Array.from(new Map(data.map((d) => [d.driver_number, d])).values()).sort((a, b) => a.driver_number - b.driver_number);
    },
  });
  const drivers = driversQuery.data ?? [];
  const dataQuery = useQuery({
    queryKey: ["session-data", session?.session_key, selected], enabled: !!session && selected !== null, staleTime: 300_000,
    queryFn: async ({ signal }) => {
      const q = `session_key=${session!.session_key}&driver_number=${selected}`;
      const names = ["Lap times", "Tyre stints", "Pit stops", "Car samples"];
      const responses = await Promise.allSettled([
        getSessionArray<LapData>(`${OPENF1}/laps?${q}`, signal),
        getSessionArray<Stint>(`${OPENF1}/stints?${q}`, signal),
        getSessionArray<PitStop>(`${OPENF1}/pit?${q}`, signal),
        getSessionArray<CarTelemetry>(`${OPENF1}/car_data?${q}&speed>=100`, signal),
      ]);
      if (responses.every((r) => r.status === "rejected")) throw new Error("Session data service unavailable");
      const [l, s, p, c] = responses;
      const samples = c.status === "fulfilled" ? c.value : [];
      return {
        laps: l.status === "fulfilled" ? l.value : [], stints: s.status === "fulfilled" ? s.value : [], pits: p.status === "fulfilled" ? p.value : [],
        car: samples.length ? samples[samples.length - 1] : null,
        unavailable: responses.flatMap((r, i) => r.status === "rejected" ? [names[i]] : []),
      };
    },
  });
  const laps = useMemo(() => dataQuery.data?.laps ?? [], [dataQuery.data]);
  const stints = dataQuery.data?.stints ?? [];
  const pits = dataQuery.data?.pits ?? [];
  const car = dataQuery.data?.car ?? null;
  const loading = selected !== null && dataQuery.isPending;
  const resetDriverData = () => setSelected(null);
  const choose = (s: Session) => { setSession(s); setSelected(null); setDriversOpen(true); };
  const driver = drivers.find((d) => d.driver_number === selected) ?? null;
  const valid = laps.filter((l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap);
  const fastestLap = valid.length ? Math.min(...valid.map((l) => l.lap_duration!)) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Telemetry"
        title="Live Telemetry"
        watermark="LIVE"
        description="Lap times, sectors, tyres, and car data for any session since 2023 — straight from OpenF1."
      />

      <Section className="pt-0 sm:pt-0">
        <div className="space-y-5">
          <ol className="workflow-rail" aria-label="Telemetry setup">
            {[{ label: "Session", complete: !!session }, { label: "Driver", complete: !!driver }, { label: "Explore", complete: !!selected && laps.length > 0 }].map((step, index) => (
              <li key={step.label} className={step.complete ? "text-paper" : "text-label-3"}>
                <span className={step.complete ? "text-tint" : "text-label-3"}>{String(index + 1).padStart(2, "0")}</span>
                {step.label}<span className="sr-only">{step.complete ? ", ready" : ", pending"}</span>
              </li>
            ))}
          </ol>
          {/* Step 1 — session */}
          {session ? (
            <StepSummary
              step="Session"
              title={`${session.circuit_short_name} · ${session.session_name}`}
              detail={`${session.country_name} · ${new Date(session.date_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
              onChange={() => {
                setSession(null);
                resetDriverData();
              }}
            />
          ) : (
            <SessionSearch onSelect={choose} />
          )}

          {/* Step 2 — driver */}
          {session && driver && !driversOpen ? <StepSummary step="Driver" title={displayName(driver.full_name)} detail={`${driver.team_name} · #${driver.driver_number}`} onChange={() => setDriversOpen(true)} /> : session && (
            <Card>
              <CardHeader
                title={driver ? displayName(driver.full_name) : "Choose a driver"}
                subtitle={driversQuery.isPending ? "Loading drivers…" : `${drivers.length} drivers in this session`}
              />
              {drivers.length ? (
                <DriverSelector drivers={drivers} selected={selected} onSelect={(number, keepOpen) => { setSelected(number); if (!keepOpen) { setDriversOpen(false); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[aria-label="Change Driver"]')?.focus()); } }} />
              ) : driversQuery.isError ? <EmptyState title="Drivers unavailable" description="OpenF1 didn’t respond. Choose another session or retry this one." action={<Button onClick={() => void driversQuery.refetch()}>Retry drivers</Button>} /> : !driversQuery.isPending ? <EmptyState title="No drivers listed" description="This session has no driver data yet. Try another session." /> : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Skeleton key={i} className="h-[60px] rounded-md" />
                  ))}
                </div>
              )}
            </Card>
          )}

          {dataQuery.data?.unavailable.length ? <div className="status-line" role="status"><p>{dataQuery.data.unavailable.join(", ")} could not be loaded. Available data is shown below.</p><Button size="sm" variant="plain" onClick={() => void dataQuery.refetch()} disabled={dataQuery.isFetching}>Retry missing data</Button></div> : null}
          {session && driver && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-footnote text-label-3">OpenF1 session archive · Recorded lap and car samples</p><ButtonLink href={`/telemetry?session=${session.session_key}`} size="sm" variant="plain">Explore this session in 3D</ButtonLink></div>}
          {/* Step 3 — dashboard */}
          {loading ? (
            <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading telemetry">
              <Skeleton className="h-28 rounded-lg" />
              <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
              </div>
            </div>
          ) : dataQuery.isError && selected !== null ? <Card><EmptyState icon={<Activity />} title="Session data unavailable" description="Your session and driver are saved. Retry the request to continue." action={<Button onClick={() => void dataQuery.refetch()}>Retry session data</Button>} /></Card> : selected && laps.length > 0 ? (
            <Dashboard laps={laps} stints={stints} pits={pits} car={car} fastestLap={fastestLap} driver={driver} />
          ) : selected ? (
            <Card>
              <EmptyState icon={<Activity />} title="No laps recorded" description="OpenF1 has no lap data for this driver in this session." />
            </Card>
          ) : null}
        </div>
      </Section>
    </>
  );
}

function StepSummary({ step, title, detail, onChange }: { step: string; title: string; detail: string; onChange: () => void }) {
  return (
    <div className="card flex items-center gap-4 p-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="label-caps text-[0.75rem] text-label-3">{step}</p>
        <p className="truncate text-headline text-paper">{title}</p>
        <p className="truncate text-footnote text-label-3">{detail}</p>
      </div>
      <Button size="sm" aria-label={`Change ${step}`} onClick={onChange}>
        Change
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  );
}

function Dashboard({
  laps,
  stints,
  pits,
  car,
  fastestLap,
  driver,
}: {
  laps: LapData[];
  stints: Stint[];
  pits: PitStop[];
  car: CarTelemetry | null;
  fastestLap: number;
  driver: Driver | null;
}) {
  return (
    <div className="space-y-5">
      <StatsSummary laps={laps} driver={driver} />
      <InsightNote title="Reading session analytics">Racing laps exclude pit-out laps. Average pace includes slow laps caused by traffic and safety cars. Consistency is the share of timed racing laps within one second of this driver’s fastest lap. Car values are the most recent recorded sample, rather than a continuous live feed.</InsightNote>
      <Card>
        <CardHeader
          title="Pace over the session"
          subtitle={driver ? `${driver.name_acronym} lap times` : "Lap times"}
          accessory={driver && <span className="h-3 w-3 rounded-full" style={{ background: teamColor(driver.team_colour) }} aria-hidden />}
        />
        <LapTrendChart laps={laps} fastestLap={fastestLap} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Car" subtitle="Most recent sample" />
            <TelemetryPanel car={car} />
          </Card>
          <Card>
            <CardHeader title="Tyres" subtitle="Stints and pit stops" />
            <TyrePanel stints={stints} pits={pits} totalLaps={laps.length} />
          </Card>
          <Card>
            <CardHeader title="Sectors" subtitle="Last eight laps against the best in each sector" />
            <SectorDeltaPanel laps={laps} />
          </Card>
        </div>
        <Card className="min-w-0 self-start">
          <CardHeader
            title="Lap times"
            subtitle="Timing, sectors and trap speed"
            accessory={
              <span className="flex items-center gap-3 text-caption text-label-3">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple" /> Fastest
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success" /> Sector best
                </span>
              </span>
            }
          />
          <LapTimesPanel laps={laps} fastestLap={fastestLap} />
        </Card>
      </div>


    </div>
  );
}
