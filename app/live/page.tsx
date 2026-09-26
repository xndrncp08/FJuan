/**
 * app/live/page.tsx
 *
 * Session telemetry in three steps: pick a session, pick a driver, read
 * the dashboard. Each finished step collapses to a one-line summary so
 * the data stays near the top of the page.
 */
"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";

const OPENF1 = "https://api.openf1.org/v1";

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [pits, setPits] = useState<PitStop[]>([]);
  const [car, setCar] = useState<CarTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  const resetDriverData = () => {
    setSelected(null);
    setLaps([]);
    setStints([]);
    setPits([]);
    setCar(null);
  };

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetch(`${OPENF1}/drivers?session_key=${session.session_key}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const unique = Array.from(new Map(safeArray<Driver>(data).map((d) => [d.driver_number, d])).values()).sort(
          (a, b) => a.driver_number - b.driver_number,
        );
        setDrivers(unique);
      })
      .catch(() => !cancelled && setDrivers([]));
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !selected) return;
    let cancelled = false;
    const key = session.session_key;
    const q = `session_key=${key}&driver_number=${selected}`;
    setLoading(true);
    Promise.allSettled([
      fetch(`${OPENF1}/laps?${q}`).then((r) => r.json()),
      fetch(`${OPENF1}/stints?${q}`).then((r) => r.json()),
      fetch(`${OPENF1}/pit?${q}`).then((r) => r.json()),
      fetch(`${OPENF1}/car_data?${q}&speed>=100`).then((r) => r.json()),
    ]).then(([l, s, p, c]) => {
      if (cancelled) return;
      setLaps(l.status === "fulfilled" ? safeArray<LapData>(l.value) : []);
      setStints(s.status === "fulfilled" ? safeArray<Stint>(s.value) : []);
      setPits(p.status === "fulfilled" ? safeArray<PitStop>(p.value) : []);
      const carData = c.status === "fulfilled" ? safeArray<CarTelemetry>(c.value) : [];
      setCar(carData.length ? carData[carData.length - 1] : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, selected]);

  const choose = (s: Session) => {
    setSession(s);
    setDrivers([]);
    resetDriverData();
  };

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
          {/* Step 1 — session */}
          {session ? (
            <StepSummary
              step="Session"
              title={`${session.circuit_short_name} · ${session.session_name}`}
              detail={`${session.country_name} · ${new Date(session.date_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
              onChange={() => {
                setSession(null);
                setDrivers([]);
                resetDriverData();
              }}
            />
          ) : (
            <SessionSearch onSelect={choose} />
          )}

          {/* Step 2 — driver */}
          {session && (
            <Card>
              <CardHeader
                title={driver ? displayName(driver.full_name) : "Choose a driver"}
                subtitle={driver ? `${driver.team_name} · #${driver.driver_number}` : drivers.length ? `${drivers.length} drivers in this session` : "Loading drivers…"}
              />
              {drivers.length ? (
                <DriverSelector drivers={drivers} selected={selected} onSelect={setSelected} />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Skeleton key={i} className="h-[60px] rounded-md" />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Step 3 — dashboard */}
          {loading ? (
            <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading telemetry">
              <Skeleton className="h-28 rounded-lg" />
              <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
              </div>
            </div>
          ) : selected && laps.length > 0 ? (
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
      <Button size="sm" onClick={onChange}>
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

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
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
        <Card className="self-start">
          <CardHeader
            title="Lap times"
            subtitle="Newest first"
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

      <Card>
        <CardHeader
          title="Pace over the session"
          subtitle={driver ? `${driver.name_acronym} lap times` : "Lap times"}
          accessory={driver && <span className="h-3 w-3 rounded-full" style={{ background: teamColor(driver.team_colour) }} aria-hidden />}
        />
        <LapTrendChart laps={laps} fastestLap={fastestLap} />
      </Card>
    </div>
  );
}
