/**
 * app/live/page.tsx
 *
 * Session telemetry on one screen: a control deck (weekend rail, session,
 * driver rail) and the dashboard right under it. It opens on the latest
 * session with the winner selected, so there is data before any tap.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InsightNote } from "@/components/ui/InsightNote";
import { Activity } from "@/components/ui/icons";
import { Driver, IntervalPoint, LapData, PitStop, PositionPoint, Session, Stint, displayName, safeArray, teamColor } from "@/components/live/types";
import SessionPicker from "@/components/live/SessionPicker";
import DriverSelector from "@/components/live/DriverSelector";
import StatsSummary from "@/components/live/StatsSummary";
import TyrePanel from "@/components/live/TyrePanel";
import LapTimesPanel from "@/components/live/LapTimesPanel";
import PaceChart from "@/components/live/PaceChart";
import SpeedTraps from "@/components/live/SpeedTraps";
import RaceTrace from "@/components/live/RaceTrace";
import SectorDeltaPanel from "@/components/live/SectorDeltaPanel";
import { PageHeader, Section } from "@/components/ui/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";

const OPENF1 = "https://api.openf1.org/v1";
async function getSessionArray<T>(url: string, signal: AbortSignal, retries = 2): Promise<T[]> {
  const response = await fetch(url, { signal });
  // OpenF1 allows a few requests per second; opening a session fires several at once.
  if (response.status === 429 && retries > 0) {
    await new Promise((r) => setTimeout(r, 1200 * (3 - retries)));
    return getSessionArray<T>(url, signal, retries - 1);
  }
  if (!response.ok) throw new Error("OpenF1 data unavailable");
  return safeArray<T>(await response.json());
}

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const choose = useCallback((s: Session) => { setSession(s); setPicked(null); }, []);

  const driversQuery = useQuery({
    queryKey: ["session-drivers", session?.session_key], enabled: !!session, staleTime: 300_000,
    queryFn: async ({ signal }) => {
      const [data, result] = await Promise.all([
        getSessionArray<Driver>(`${OPENF1}/drivers?session_key=${session!.session_key}`, signal),
        // Finishing order is a nicety; the rail falls back to car numbers without it.
        getSessionArray<{ driver_number: number; position: number | null }>(`${OPENF1}/session_result?session_key=${session!.session_key}`, signal).catch(() => []),
      ]);
      const positions = new Map(result.filter((r) => r.position).map((r) => [r.driver_number, r.position!]));
      const rank = (d: Driver) => positions.get(d.driver_number) ?? 100 + d.driver_number;
      const drivers = Array.from(new Map(data.map((d) => [d.driver_number, d])).values()).sort((a, b) => rank(a) - rank(b));
      return { drivers, positions };
    },
  });
  const drivers = driversQuery.data?.drivers ?? [];
  // Until someone picks, follow the session's leader (or first listed car).
  const selected = picked ?? drivers[0]?.driver_number ?? null;

  const dataQuery = useQuery({
    queryKey: ["session-data", session?.session_key, selected], enabled: !!session && selected !== null, staleTime: 300_000,
    queryFn: async ({ signal }) => {
      const q = `session_key=${session!.session_key}&driver_number=${selected}`;
      const names = ["Lap times", "Tyre stints", "Pit stops", "Positions", "Intervals"];
      // Position and gap traces only exist for races and sprints.
      const racing = isRace(session!);
      const none = Promise.resolve([]);
      const responses = await Promise.allSettled([
        getSessionArray<LapData>(`${OPENF1}/laps?${q}`, signal),
        getSessionArray<Stint>(`${OPENF1}/stints?${q}`, signal),
        getSessionArray<PitStop>(`${OPENF1}/pit?${q}`, signal),
        racing ? getSessionArray<PositionPoint>(`${OPENF1}/position?${q}`, signal) : none,
        racing ? getSessionArray<IntervalPoint>(`${OPENF1}/intervals?${q}`, signal) : none,
      ]);
      if (responses.every((r) => r.status === "rejected")) throw new Error("Session data service unavailable");
      const value = <T,>(r: PromiseSettledResult<T[]>) => (r.status === "fulfilled" ? r.value : []);
      const [l, s, p, pos, gaps] = responses;
      return {
        laps: value(l as PromiseSettledResult<LapData[]>), stints: value(s as PromiseSettledResult<Stint[]>), pits: value(p as PromiseSettledResult<PitStop[]>),
        positions: value(pos as PromiseSettledResult<PositionPoint[]>), intervals: value(gaps as PromiseSettledResult<IntervalPoint[]>),
        unavailable: responses.flatMap((r, i) => r.status === "rejected" ? [names[i]] : []),
      };
    },
  });
  const laps = useMemo(() => dataQuery.data?.laps ?? [], [dataQuery.data]);
  const stints = dataQuery.data?.stints ?? [];
  const pits = dataQuery.data?.pits ?? [];
  const loading = !session || driversQuery.isPending || (selected !== null && dataQuery.isPending);
  const driver = drivers.find((d) => d.driver_number === selected) ?? null;
  const valid = laps.filter((l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap);
  const fastestLap = valid.length ? Math.min(...valid.map((l) => l.lap_duration!)) : 0;

  return (
    <>
      <PageHeader eyebrow="Telemetry" title="Live Telemetry" watermark="LIVE" description="Any session since 2023: pace and tyre degradation, race trace, sectors and speed traps, from OpenF1." />

      <Section className="pt-0 sm:pt-0">
        <div className="space-y-5">
          <div className="card space-y-5 p-4 sm:p-6">
            <SessionPicker session={session} onSelect={choose} />
            {session && (
              <div className="space-y-3 border-t border-hairline pt-5">
                <p className="label-caps text-caption text-label-3">Driver{driversQuery.data?.positions.size ? " · finishing order" : ""}</p>
                {drivers.length ? (
                  <DriverSelector drivers={drivers} selected={selected} onSelect={setPicked} positions={driversQuery.data?.positions} />
                ) : driversQuery.isError ? (
                  <div className="status-line flex flex-wrap items-center justify-between gap-3" role="alert"><span>OpenF1 didn’t send the drivers for this session.</span><Button size="sm" onClick={() => void driversQuery.refetch()}>Retry</Button></div>
                ) : !driversQuery.isPending ? (
                  <p className="status-line">No drivers listed for this session yet.</p>
                ) : (
                  <div className="flex gap-2 overflow-hidden">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[60px] w-[6.5rem] shrink-0" />)}</div>
                )}
              </div>
            )}
          </div>

          {session && driver && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-8 w-1 shrink-0" style={{ background: teamColor(driver.team_colour) }} aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-headline text-paper">{displayName(driver.full_name)}</p>
                  <p className="truncate text-footnote text-label-3">{session.circuit_short_name} · {session.session_name} · {new Date(session.date_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              <ButtonLink href={`/telemetry?session=${session.session_key}&driver=${driver.driver_number}`} size="sm" variant="plain">Open in Telemetry Lab</ButtonLink>
            </div>
          )}

          {dataQuery.data?.unavailable.length ? <div className="status-line" role="status"><p>{dataQuery.data.unavailable.join(", ")} could not be loaded. Available data is shown below.</p><Button size="sm" variant="plain" onClick={() => void dataQuery.refetch()} disabled={dataQuery.isFetching}>Retry missing data</Button></div> : null}

          {dataQuery.isError && selected !== null ? <Card><EmptyState icon={<Activity />} title="Session data unavailable" description="OpenF1 didn’t respond. Your session and driver are kept." action={<Button onClick={() => void dataQuery.refetch()}>Retry</Button>} /></Card>
          : loading ? (
            <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading telemetry">
              <Skeleton className="h-28" />
              <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
              </div>
            </div>
          ) : laps.length > 0 ? (
            <div key={`${session?.session_key}-${selected}`} className="page-enter">
              <Dashboard laps={laps} stints={stints} pits={pits} positions={dataQuery.data?.positions ?? []} intervals={dataQuery.data?.intervals ?? []} fastestLap={fastestLap} driver={driver} racing={!!session && isRace(session)} />
            </div>
          ) : selected !== null ? (
            <Card><EmptyState icon={<Activity />} title="No laps recorded" description="OpenF1 has no lap data for this driver in this session." /></Card>
          ) : null}
        </div>
      </Section>
    </>
  );
}

const isRace = (s: Session) => s.session_name === "Race" || s.session_name === "Sprint";

function Dashboard({
  laps,
  stints,
  pits,
  positions,
  intervals,
  fastestLap,
  driver,
  racing,
}: {
  laps: LapData[];
  stints: Stint[];
  pits: PitStop[];
  positions: PositionPoint[];
  intervals: IntervalPoint[];
  fastestLap: number;
  driver: Driver | null;
  racing: boolean;
}) {
  return (
    <div className="space-y-5">
      <StatsSummary laps={laps} driver={driver} />
      <Card>
        <CardHeader
          title="Pace & strategy"
          subtitle={`${driver ? `${driver.name_acronym} · ` : ""}lap times, tyres and degradation`}
          accessory={driver && <span className="h-3 w-3 rounded-full" style={{ background: teamColor(driver.team_colour) }} aria-hidden />}
        />
        <PaceChart laps={laps} stints={stints} isRace={racing} />
      </Card>

      {racing && (
        <Card>
          <CardHeader title="Race trace" subtitle="Running position and gaps, by lap" />
          <RaceTrace laps={laps} positions={positions} intervals={intervals} />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Speed traps" subtitle="Best and median per timing line" />
            <SpeedTraps laps={laps} />
          </Card>
          <Card>
            <CardHeader title="Tyres" subtitle="Stints and pit stops" />
            <TyrePanel stints={stints} pits={pits} totalLaps={laps.length} />
          </Card>
          <Card>
            <CardHeader title="Sectors" subtitle="Last eight laps against the best in each sector" />
            <SectorDeltaPanel laps={laps} />
          </Card>
          <InsightNote title="How these numbers work">Clean laps exclude pit-out laps, in-laps and anything slower than 107% of the median (safety cars, traffic). Degradation is a straight-line fit through a stint’s clean laps; in races the fuel-corrected view adds back an estimated 0.055 s per lap of fuel burn. The ideal lap sums the best time in each sector.</InsightNote>
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
