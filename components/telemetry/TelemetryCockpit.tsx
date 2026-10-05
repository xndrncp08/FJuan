/**
 * components/telemetry/TelemetryCockpit.tsx
 *
 * The 3D track telemetry view: circuit ribbon with a braking/throttle
 * heatmap, a car marker scrubbing along it in sync with a lap timeline,
 * a glass HUD (speed, gear, RPM, pedals, DRS), and speed and pedal traces
 * over distance. Data comes from /api/telemetry, which falls back to the
 * synthetic engine when OpenF1 can't serve the request.
 */

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Crosshair, Pause, Play, RotateCcw } from "lucide-react";
import { AXIS, ChartTooltip, CURSOR_LINE, GRID, HEAT } from "@/components/ui/chart";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, Spinner } from "@/components/ui/States";
import { formatLapSeconds } from "@/lib/utils/format";
import type { SessionTelemetry, TelemetrySample } from "@/lib/telemetry/types";
import { cn } from "@/lib/utils/cn";
import { createPlayhead, indexAtTime, sampleAt, usePlayhead, type Playhead } from "./playhead";
import { SourceBadge } from "./SourceBadge";
import { driveState, type HeatMode } from "./TrackScene";

const CanvasShell = dynamic(() => import("@/components/three/CanvasShell"), { ssr: false });
const TrackScene = dynamic(() => import("./TrackScene"), { ssr: false });

const RATES = [1, 2, 4] as const;
const STATE_LABEL = { brake: "Braking", throttle: "Full throttle", coast: "Coasting" } as const;

async function fetchTelemetry(params: Record<string, string | number | undefined>): Promise<SessionTelemetry> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
  const res = await fetch(`/api/telemetry?${qs}`);
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Telemetry unavailable");
  return res.json();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[0.6875rem] uppercase text-label-3">
        <span>{label}</span>
        <span className="tabular text-paper">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-fill-2" aria-hidden>
        <div className="h-full transition-[width] duration-75" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  );
}

function Hud({ samples, playhead, lapTime }: { samples: TelemetrySample[]; playhead: Playhead; lapTime: number }) {
  const t = usePlayhead(playhead);
  const s = sampleAt(samples, indexAtTime(samples, t));
  const state = driveState(s);
  const color = HEAT[state];
  return (
    <div className="glass-strong pointer-events-none w-[min(240px,calc(100vw-56px))] p-4" aria-live="off">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-[3rem] leading-none tabular-nums text-paper">{Math.round(s.speed)}</div>
          <div className="label-caps mt-1 text-[0.6875rem] text-label-3">km/h</div>
        </div>
        <div className="text-right">
          <div className="font-display text-[2.25rem] leading-none text-tint">{s.gear || "N"}</div>
          <div className="label-caps mt-1 text-[0.6875rem] text-label-3">Gear</div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <Bar label="RPM" value={s.rpm} max={13000} color="#FF7A52" />
        <Bar label="Throttle %" value={s.throttle} max={100} color={HEAT.throttle} />
        <Bar label="Brake %" value={s.brake} max={100} color={HEAT.brake} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em]" style={{ borderColor: `${color}80`, color: "rgb(var(--paper))" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
          {STATE_LABEL[state]}
        </span>
        <span className={cn("border px-2 py-0.5 font-mono text-[0.6875rem] font-bold", s.drs ? "border-success/60 text-success" : "border-hairline text-label-4")}>DRS</span>
      </div>
      <div className="mt-3 flex justify-between border-t border-hairline pt-3 font-mono text-[0.75rem] tabular-nums text-label-2">
        <span>{formatLapSeconds(t)}</span>
        <span className="text-label-3">/ {formatLapSeconds(lapTime)}</span>
        <span>{(s.distance / 1000).toFixed(2)} km</span>
      </div>
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function heatGradient(samples: TelemetrySample[]) {
  const total = samples[samples.length - 1].distance || 1;
  const stops: string[] = [];
  let prev = "";
  for (const s of samples) {
    const c = HEAT[driveState(s)];
    const at = ((s.distance / total) * 100).toFixed(2);
    if (c !== prev) {
      if (prev) stops.push(`${prev} ${at}%`);
      stops.push(`${c} ${at}%`);
      prev = c;
    }
  }
  stops.push(`${prev} 100%`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function Timeline({ samples, playhead, lapTime, playing, onPlayingChange, rate, onRateChange }: {
  samples: TelemetrySample[];
  playhead: Playhead;
  lapTime: number;
  playing: boolean;
  onPlayingChange: (v: boolean) => void;
  rate: (typeof RATES)[number];
  onRateChange: (r: (typeof RATES)[number]) => void;
}) {
  const t = usePlayhead(playhead);
  // The strip is by distance, the slider by time — map time to distance for the thumb.
  const total = samples[samples.length - 1].distance || 1;
  const distFrac = sampleAt(samples, indexAtTime(samples, t)).distance / total;
  const gradient = useMemo(() => heatGradient(samples), [samples]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPlayingChange(!playing)}
          aria-label={playing ? "Pause lap playback" : "Play lap"}
          className="pressable neon flex h-11 w-11 items-center justify-center bg-accent text-paper"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => playhead.set(0)}
          aria-label="Back to lap start"
          className="pressable flex h-11 w-11 items-center justify-center border border-[var(--glass-edge)] text-label-2 hover:text-paper"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <Segmented size="sm" aria-label="Playback speed" value={String(rate)} onChange={(v) => onRateChange(Number(v) as (typeof RATES)[number])} segments={RATES.map((r) => ({ value: String(r), label: `${r}×` }))} />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 opacity-90" style={{ background: gradient }} aria-hidden />
        <div className="pointer-events-none absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 bg-paper shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ left: `${distFrac * 100}%` }} aria-hidden />
        <input
          type="range"
          min={0}
          max={lapTime}
          step={0.01}
          value={t}
          onChange={(e) => {
            onPlayingChange(false);
            playhead.set(Number(e.target.value));
          }}
          aria-label="Lap timeline"
          aria-valuetext={`${formatLapSeconds(t)} of ${formatLapSeconds(lapTime)}`}
          className="relative h-11 w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>
    </div>
  );
}

// ─── Traces ──────────────────────────────────────────────────────────────────

const MARGIN = { top: 8, right: 12, bottom: 0, left: 0 };
const Y_AXIS_W = 40;

/** Vertical playhead drawn over a memoized chart, so playback doesn't re-render Recharts. */
function CursorOverlay({ samples, playhead }: { samples: TelemetrySample[]; playhead: Playhead }) {
  const t = usePlayhead(playhead);
  const total = samples[samples.length - 1].distance || 1;
  const frac = sampleAt(samples, indexAtTime(samples, t)).distance / total;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-[30px] top-2 w-px bg-paper/70"
      style={{ left: `calc(${MARGIN.left + Y_AXIS_W}px + (100% - ${MARGIN.left + Y_AXIS_W + MARGIN.right}px) * ${frac})` }}
    />
  );
}

const Traces = memo(function Traces({ samples, playhead }: { samples: TelemetrySample[]; playhead: Playhead }) {
  const data = useMemo(
    () => samples.map((s) => ({ km: Math.round(s.distance) / 1000, speed: Math.round(s.speed), throttle: Math.round(s.throttle), brake: s.brake })),
    [samples],
  );
  const km = (v: number) => `${v.toFixed(1)}`;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <figure className="min-w-0">
        <figcaption className="label-caps mb-2 text-[0.75rem] text-label-3">Speed · km/h by distance (km)</figcaption>
        <div className="relative h-[180px]">
          <CursorOverlay samples={samples} playhead={playhead} />
          <ResponsiveContainer>
            <AreaChart data={data} margin={MARGIN}>
              <defs>
                <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC5C30" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#EC5C30" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="km" type="number" domain={["dataMin", "dataMax"]} tickFormatter={km} {...AXIS} />
              <YAxis width={Y_AXIS_W} domain={[0, "dataMax + 20"]} {...AXIS} />
              <Tooltip cursor={CURSOR_LINE} content={<ChartTooltip title={(l) => `${Number(l).toFixed(2)} km`} format={(p) => [{ label: "Speed", value: `${p[0].value} km/h`, color: "#EC5C30" }]} />} />
              <Area type="monotone" dataKey="speed" stroke="#EC5C30" strokeWidth={2} fill="url(#speedFill)" isAnimationActive={false} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure className="min-w-0">
        <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem]">
          <span className="label-caps text-label-3">Pedals · %</span>
          <span className="flex items-center gap-1.5 text-label-2"><span className="h-0.5 w-3" style={{ background: HEAT.throttle }} />Throttle</span>
          <span className="flex items-center gap-1.5 text-label-2"><span className="h-2 w-3" style={{ background: `${HEAT.brake}99` }} />Brake</span>
        </figcaption>
        <div className="relative h-[180px]">
          <CursorOverlay samples={samples} playhead={playhead} />
          <ResponsiveContainer>
            <LineChart data={data} margin={MARGIN}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="km" type="number" domain={["dataMin", "dataMax"]} tickFormatter={km} {...AXIS} />
              <YAxis width={Y_AXIS_W} domain={[0, 100]} ticks={[0, 50, 100]} {...AXIS} />
              <Tooltip cursor={CURSOR_LINE} content={<ChartTooltip title={(l) => `${Number(l).toFixed(2)} km`} format={(p) => p.map((x) => ({ label: x.dataKey === "brake" ? "Brake" : "Throttle", value: `${x.value}%`, color: x.dataKey === "brake" ? HEAT.brake : HEAT.throttle }))} />} />
              <Line type="stepAfter" dataKey="brake" stroke={HEAT.brake} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="throttle" stroke={HEAT.throttle} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
});

// ─── Cockpit ─────────────────────────────────────────────────────────────────

export default function TelemetryCockpit({ initialSession }: { initialSession?: number }) {
  const [driver, setDriver] = useState<number | undefined>();
  const [lap, setLap] = useState<number | undefined>();
  const [synthetic, setSynthetic] = useState(false);
  const [mode, setMode] = useState<HeatMode>("inputs");
  const [follow, setFollow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const playhead = useMemo(() => createPlayhead(0), []);

  const query = useQuery({
    queryKey: ["telemetry", initialSession, driver, lap, synthetic],
    queryFn: () => fetchTelemetry({ session_key: initialSession, driver, lap, source: synthetic ? "synthetic" : "auto" }),
    placeholderData: (prev) => prev,
    staleTime: 60 * 60 * 1000,
  });
  const data = query.data;
  const samples = data?.lap.samples;
  const lapTime = samples?.length ? samples[samples.length - 1].t : 0;

  // New lap → stop and go back to the start line.
  const [shownSamples, setShownSamples] = useState(samples);
  if (shownSamples !== samples) {
    setShownSamples(samples);
    setPlaying(false);
  }
  useEffect(() => playhead.set(0), [samples, playhead]);

  // Playback loop.
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing || !lapTime) return;
    let raf = 0;
    const tick = (now: number) => {
      // Clamp so a backgrounded tab resumes smoothly instead of jumping.
      const dt = last.current === null ? 0 : Math.min(0.1, (now - last.current) / 1000);
      last.current = now;
      const next = playhead.get() + dt * rate;
      playhead.set(next >= lapTime ? next - lapTime : next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing, lapTime, rate, playhead]);

  const getCursor = useMemo(() => () => (samples?.length ? indexAtTime(samples, playhead.get()) : 0), [samples, playhead]);

  if (query.isError && !data) {
    return <EmptyState title="Telemetry unavailable" description="Neither OpenF1 nor the offline engine could produce a lap. Try again in a moment." />;
  }

  const timedLaps = data?.laps.filter((l) => l.lapTime) ?? [];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {data ? (
            <SourceBadge
              source={data.source}
              detail={`${data.session.circuit} ${data.session.year} · ${data.session.name}`}
              reason={data.fallbackReason}
            />
          ) : (
            <span className="flex items-center gap-2 text-footnote text-label-3">
              <Spinner /> Fetching lap telemetry
            </span>
          )}
          {query.isFetching && data && <Spinner className="h-4 w-4" label="Updating" />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 border border-[var(--glass-edge)] bg-fill-1 pl-3 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-label-3">
            Lap
            <select
              value={data?.lap.lapNumber ?? ""}
              onChange={(e) => setLap(Number(e.target.value))}
              disabled={!data}
              className="h-full bg-transparent pr-2 font-mono text-[0.8125rem] normal-case tracking-normal text-paper outline-none"
            >
              {timedLaps.map((l) => (
                <option key={l.lapNumber} value={l.lapNumber} className="bg-surface-2">
                  L{l.lapNumber} · {formatLapSeconds(l.lapTime as number)}
                  {l.compound ? ` · ${l.compound[0]}` : ""}
                </option>
              ))}
            </select>
          </label>
          <Segmented size="sm" aria-label="Track coloring" value={mode} onChange={setMode} segments={[{ value: "inputs", label: "Inputs" }, { value: "speed", label: "Speed" }]} />
          <button
            type="button"
            aria-pressed={follow}
            onClick={() => setFollow((v) => !v)}
            className={cn("pressable flex h-9 items-center gap-2 border px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", follow ? "neon border-accent bg-accent/20 text-paper" : "border-[var(--glass-edge)] text-label-2 hover:text-paper")}
          >
            <Crosshair className="h-4 w-4" aria-hidden />
            Follow
          </button>
          <button
            type="button"
            aria-pressed={synthetic}
            onClick={() => {
              setSynthetic((v) => !v);
              setLap(undefined);
            }}
            className={cn("pressable flex h-9 items-center border px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", synthetic ? "border-warning/60 bg-warning/10 text-warning" : "border-[var(--glass-edge)] text-label-2 hover:text-paper")}
          >
            Offline engine
          </button>
        </div>
      </div>

      {/* Drivers */}
      {data && (
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Driver">
          {data.drivers.map((d) => {
            const active = d.number === data.driver.number;
            return (
              <button
                key={d.number}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setDriver(d.number);
                  setLap(undefined);
                }}
                className={cn("pressable flex h-10 shrink-0 items-center gap-2 border px-3 font-mono text-[0.8125rem] font-bold", active ? "bg-fill-2 text-paper" : "border-[var(--glass-edge)] text-label-3 hover:text-paper")}
                style={active ? { borderColor: d.color, boxShadow: `0 0 16px -4px ${d.color}` } : undefined}
                title={`${d.name} · ${d.team}`}
              >
                <span className="h-4 w-1" style={{ background: d.color }} aria-hidden />
                {d.code}
                <span className="font-normal text-label-4">{d.number}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3D view */}
      <div className="glass relative overflow-hidden">
        <div className="h-[min(68vh,620px)] min-h-[380px]">
          {samples?.length ? (
            <CanvasShell label={`3D circuit map of ${data!.session.circuit} with ${mode === "inputs" ? "braking and throttle" : "speed"} coloring and the car position for lap ${data!.lap.lapNumber}`} camera={{ position: [0, 9.5, 9.5], fov: 42 }}>
              <TrackScene samples={samples} sectorSplits={data!.lap.sectorSplits} getCursor={getCursor} mode={mode} follow={follow} color={data!.driver.color} />
            </CanvasShell>
          ) : (
            <div className="flex h-full items-center justify-center gap-3 text-footnote text-label-3">
              <Spinner /> Building circuit
            </div>
          )}
        </div>
        {samples?.length ? (
          <>
            <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
              <Hud samples={samples} playhead={playhead} lapTime={lapTime} />
            </div>
            <div className="glass-strong pointer-events-none absolute right-3 top-3 hidden px-3 py-2 sm:block sm:right-4 sm:top-4">
              <div className="label-caps text-[0.6875rem] text-label-3">{data!.driver.name}</div>
              <div className="mt-0.5 font-display text-[1.25rem] leading-none text-paper">
                L{data!.lap.lapNumber} · {formatLapSeconds(data!.lap.lapTime)}
              </div>
              <div className="mt-2 flex gap-3 font-mono text-[0.75rem] tabular-nums text-label-2">
                {data!.lap.sectors.map((s, i) => (
                  <span key={i}>
                    <span className="text-label-3">S{i + 1}</span> {s.toFixed(3)}
                  </span>
                ))}
              </div>
            </div>
            {mode === "inputs" && (
              <ul className="glass-strong absolute bottom-3 right-3 flex gap-3 px-3 py-2 text-[0.75rem] font-semibold text-label-2 sm:bottom-4 sm:right-4" aria-label="Track color legend">
                {(["brake", "throttle", "coast"] as const).map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className={cn("w-3", k === "brake" ? "h-2.5" : "h-1.5")} style={{ background: HEAT[k] }} aria-hidden />
                    {STATE_LABEL[k]}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>

      {samples?.length ? (
        <div className="glass space-y-5 p-4 sm:p-5">
          <Timeline samples={samples} playhead={playhead} lapTime={lapTime} playing={playing} onPlayingChange={setPlaying} rate={rate} onRateChange={setRate} />
          <Traces samples={samples} playhead={playhead} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <p className="text-footnote text-label-3">
              {data!.source === "synthetic"
                ? "Generated by the offline engine: physics lap on a seeded circuit. Real sessions load automatically when OpenF1 is reachable."
                : `Lap ${data!.lap.lapNumber} of ${data!.laps.length}, ${samples.length} merged car and GPS samples. Elevation exaggerated for readability.`}
            </p>
            <Link href="/predict/delta" className="pressable inline-flex h-10 items-center gap-2 border border-accent/60 px-4 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-paper hover:bg-accent/15">
              Model vs actual
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
