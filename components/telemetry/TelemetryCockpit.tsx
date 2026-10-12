/**
 * components/telemetry/TelemetryCockpit.tsx
 *
 * The 3D telemetry workstation. One lap (A) against an optional reference
 * lap (B, by default the next driver in the classification, on their own
 * fastest lap):
 *
 *   viewport   3D circuit with heat / speed / mini-sector colouring, the car
 *              and a ghost of the reference, four camera rigs
 *   overlays   steering-wheel HUD, lap & sector card with live gap, g-g
 *   timeline   play / pause / rate, heat strip by distance
 *   channels   speed, gap, pedals, gear, RPM, g long / lat on one axis
 *   corners    per-corner braking points and speeds, A vs B
 *
 * Everything reads one playhead (seconds into the lap), so the 3D scene and
 * the instruments never re-render React per frame beyond their readouts.
 * Data comes from /api/telemetry, which falls back to the synthetic engine
 * when OpenF1 can't serve the request — always labelled as such.
 *
 * Keys (when the cockpit has focus): Space play/pause, ←/→ step (Shift ×10),
 * C camera, M colour, R restart.
 */

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Pause, Play, RotateCcw } from "@/components/ui/icons";
import { HEAT } from "@/components/ui/chart";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/States";
import { formatLapSeconds } from "@/lib/utils/format";
import { deriveChannels, findCorners, miniSectors } from "@/lib/telemetry/analysis";
import type { SessionTelemetry, TelemetrySample } from "@/lib/telemetry/types";
import { cn } from "@/lib/utils/cn";
import { createPlayhead, indexAtTime, sampleAt, usePlayhead, type Playhead } from "./playhead";
import { SourceBadge } from "./SourceBadge";
import { driveState, type CameraMode, type HeatMode } from "./TrackScene";
import { GgDiagram, LapCard, WheelHud } from "./Instruments";
import { ChannelStack } from "./ChannelStack";
import { CornerTable } from "./CornerTable";
import { SLOT_A, SLOT_B, type LapView } from "./model";

const CanvasShell = dynamic(() => import("@/components/three/CanvasShell"), { ssr: false });
const TrackScene = dynamic(() => import("./TrackScene"), { ssr: false });

const RATES = [0.5, 1, 2, 4] as const;
const CAMERAS: { value: CameraMode; label: string }[] = [
  { value: "orbit", label: "Orbit" },
  { value: "chase", label: "Chase" },
  { value: "top", label: "Top" },
  { value: "heli", label: "Heli" },
];
const STATE_LABEL = { brake: "Braking", throttle: "Full throttle", coast: "Coasting" } as const;

async function fetchTelemetry(params: Record<string, string | number | undefined>): Promise<SessionTelemetry> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
  const res = await fetch(`/api/telemetry?${qs}`);
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Telemetry unavailable");
  return res.json();
}

function toLapView(d: SessionTelemetry): LapView {
  const samples = d.lap.samples;
  const ch = deriveChannels(samples);
  return {
    samples,
    ch,
    corners: findCorners(samples, ch.gLat),
    code: d.driver.code,
    name: d.driver.name,
    color: d.driver.color,
    lapNumber: d.lap.lapNumber,
    lapTime: d.lap.lapTime,
    sectors: d.lap.sectors,
  };
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
  const total = samples[samples.length - 1].distance || 1;
  const distFrac = sampleAt(samples, indexAtTime(samples, t)).distance / total;
  const gradient = useMemo(() => heatGradient(samples), [samples]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPlayingChange(!playing)} aria-label={playing ? "Pause lap playback" : "Play lap"} className="pressable neon flex h-11 w-11 items-center justify-center bg-accent text-paper">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => playhead.set(0)} aria-label="Back to lap start" className="pressable flex h-11 w-11 items-center justify-center border border-[var(--glass-edge)] text-label-2 hover:text-paper">
          <RotateCcw className="h-4 w-4" />
        </button>
        <Segmented size="sm" aria-label="Playback speed" value={String(rate)} onChange={(v) => onRateChange(Number(v) as (typeof RATES)[number])} segments={RATES.map((r) => ({ value: String(r), label: `${r}×` }))} />
      </div>
      <div className="relative min-w-0 flex-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-tint">
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
      <span className="shrink-0 font-mono text-[0.75rem] tabular-nums text-label-2">
        {formatLapSeconds(t)} <span className="text-label-3">/ {formatLapSeconds(lapTime)}</span>
      </span>
    </div>
  );
}

// ─── Cockpit ─────────────────────────────────────────────────────────────────

function Picker({ label, value, onChange, disabled, children }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className="relative flex h-11 min-w-0 items-center gap-2 border border-[var(--glass-edge)] bg-fill-1 pl-3 pr-8 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-label-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tint">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="h-full min-w-0 appearance-none bg-transparent font-mono text-[0.8125rem] normal-case tracking-normal text-paper outline-none">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4" />
    </label>
  );
}

export default function TelemetryCockpit({ initialSession, initialDriver }: { initialSession?: number; initialDriver?: number }) {
  const [driver, setDriver] = useState<number | undefined>(initialDriver);
  const [lap, setLap] = useState<number | undefined>();
  // undefined = automatic reference, null = no comparison.
  const [refChoice, setRefChoice] = useState<number | null | undefined>();
  const [synthetic, setSynthetic] = useState(false);
  const [mode, setMode] = useState<HeatMode>("inputs");
  const [camera, setCamera] = useState<CameraMode>("orbit");
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const playhead = useMemo(() => createPlayhead(0), []);
  const root = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["telemetry", initialSession, driver, lap, synthetic],
    queryFn: () => fetchTelemetry({ session_key: initialSession, driver, lap, source: synthetic ? "synthetic" : "auto" }),
    placeholderData: (prev) => prev,
    staleTime: 60 * 60 * 1000,
  });
  const data = query.data;

  // Reference: the chosen driver, else the next one in classification order.
  const refDriver = !data || refChoice === null ? null : refChoice ?? data.drivers.find((d) => d.number !== data.driver.number)?.number ?? null;
  const refQuery = useQuery({
    queryKey: ["telemetry", data?.session.sessionKey ?? initialSession, refDriver, undefined, synthetic],
    enabled: !!data && refDriver !== null && refDriver !== data.driver.number,
    queryFn: () => fetchTelemetry({ session_key: data!.session.sessionKey ?? undefined, driver: refDriver!, source: synthetic ? "synthetic" : "auto" }),
    staleTime: 60 * 60 * 1000,
  });
  // A real lap is never compared against a simulated one.
  const refData = refQuery.data && data && refQuery.data.source === data.source && refQuery.data.driver.number !== data.driver.number ? refQuery.data : undefined;
  const refMismatch = !!refQuery.data && !!data && refQuery.data.source !== data.source;

  const A = useMemo(() => (data ? toLapView(data) : null), [data]);
  const B = useMemo(() => (refData && refDriver !== null ? toLapView(refData) : undefined), [refData, refDriver]);
  const lapTime = A ? Math.max(A.samples[A.samples.length - 1].t, B ? B.samples[B.samples.length - 1].t : 0) : 0;
  const colorMode: HeatMode = mode === "delta" && !B ? "inputs" : mode;

  // New lap → stop and go back to the start line.
  const [shownLap, setShownLap] = useState(A);
  if (shownLap !== A) {
    setShownLap(A);
    setPlaying(false);
  }
  useEffect(() => playhead.set(0), [A, playhead]);

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

  const getCursor = useMemo(() => () => (A ? indexAtTime(A.samples, playhead.get()) : 0), [A, playhead]);
  const comparison = useMemo(
    () =>
      A && B
        ? { samples: B.samples, getCursor: () => indexAtTime(B.samples, playhead.get()), mini: miniSectors(A.samples, B.samples, 24).map((m) => m.winner), colorA: SLOT_A, colorB: SLOT_B }
        : undefined,
    [A, B, playhead],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) || el.getAttribute("role") === "slider") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === " " && el.tagName !== "BUTTON") {
      e.preventDefault();
      setPlaying((p) => !p);
    } else if (k === "arrowright" || k === "arrowleft") {
      e.preventDefault();
      setPlaying(false);
      const step = e.shiftKey ? 5 : 0.5;
      playhead.set(Math.max(0, Math.min(lapTime, playhead.get() + (k === "arrowright" ? step : -step))));
    } else if (k === "c") setCamera((c) => CAMERAS[(CAMERAS.findIndex((x) => x.value === c) + 1) % CAMERAS.length].value);
    else if (k === "m") setMode((m) => (m === "inputs" ? "speed" : m === "speed" && B ? "delta" : "inputs"));
    else if (k === "r") playhead.set(0);
  };

  if (query.isError && !data) {
    return <EmptyState title="Telemetry unavailable" description="The lap could not be loaded. Your selection is saved; try again." action={<Button onClick={() => void query.refetch()}>Retry telemetry</Button>} />;
  }

  const timedLaps = data?.laps.filter((l) => l.lapTime) ?? [];
  const fastest = timedLaps.length ? Math.min(...timedLaps.map((l) => l.lapTime as number)) : 0;

  return (
    <div
      ref={root}
      tabIndex={-1}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        // Clicking the scene or a panel gives the cockpit keyboard focus for the shortcuts.
        if (!(e.target as HTMLElement).closest("button, a, input, select, [tabindex='0']")) root.current?.focus({ preventScroll: true });
      }}
      className="space-y-4 outline-none"
    >
      {/* Session bar */}
      <div className="card space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {data ? (
              <SourceBadge source={data.source} detail={`${data.session.circuit} ${data.session.year} · ${data.session.name}`} reason={data.fallbackReason} />
            ) : (
              <span className="flex items-center gap-2 text-footnote text-label-3">
                <Spinner /> Fetching lap telemetry
              </span>
            )}
            {(query.isFetching || refQuery.isFetching) && data && <Spinner className="h-4 w-4" label="Updating" />}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Picker label="Lap" value={String(data?.lap.lapNumber ?? "")} onChange={(v) => setLap(Number(v))} disabled={!data}>
              {timedLaps.map((l) => (
                <option key={l.lapNumber} value={l.lapNumber} className="bg-surface-2">
                  L{l.lapNumber} · {formatLapSeconds(l.lapTime as number)}
                  {l.compound ? ` · ${l.compound[0]}` : ""}
                  {l.lapTime === fastest ? " · best" : ""}
                </option>
              ))}
            </Picker>
            <Picker label="vs" value={refDriver === null ? "none" : String(refDriver)} onChange={(v) => setRefChoice(v === "none" ? null : Number(v))} disabled={!data}>
              <option value="none" className="bg-surface-2">No comparison</option>
              {data?.drivers
                .filter((d) => d.number !== data.driver.number)
                .map((d) => (
                  <option key={d.number} value={d.number} className="bg-surface-2">
                    {d.position ? `P${d.position} ` : ""}
                    {d.code} · best lap
                  </option>
                ))}
            </Picker>
            <button
              type="button"
              aria-pressed={synthetic}
              onClick={() => {
                setSynthetic((v) => !v);
                setLap(undefined);
              }}
              className={cn("pressable col-span-2 flex h-11 items-center justify-center border px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", synthetic ? "border-warning/60 bg-warning/10 text-warning" : "border-[var(--glass-edge)] text-label-2 hover:text-paper")}
            >
              Simulated data
            </button>
          </div>
        </div>

        {data && (
          <div
            className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
            role="radiogroup"
            aria-label="Driver"
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              e.stopPropagation();
              const current = data.drivers.findIndex((d) => d.number === data.driver.number);
              const index = e.key === "Home" ? 0 : e.key === "End" ? data.drivers.length - 1 : (current + (e.key === "ArrowRight" ? 1 : -1) + data.drivers.length) % data.drivers.length;
              setDriver(data.drivers[index].number);
              setLap(undefined);
              e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[index]?.focus();
            }}
          >
            {data.drivers.map((d) => {
              const active = d.number === data.driver.number;
              const isRef = d.number === refDriver;
              return (
                <button
                  key={d.number}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  aria-label={`${d.position ? `P${d.position} · ` : ""}${d.name} · ${d.team} · Car ${d.number}${isRef ? " · reference" : ""}`}
                  onClick={() => {
                    setDriver(d.number);
                    setLap(undefined);
                    if (d.number === refDriver) setRefChoice(undefined);
                  }}
                  className={cn("pressable flex h-11 shrink-0 items-center gap-2 border px-3 font-mono text-[0.8125rem] font-bold", active ? "bg-fill-2 text-paper" : "border-[var(--glass-edge)] text-label-3 hover:text-paper")}
                  style={active ? { borderColor: B ? SLOT_A : d.color, boxShadow: `0 0 16px -4px ${B ? SLOT_A : d.color}` } : isRef && B ? { borderColor: `${SLOT_B}99` } : undefined}
                  title={`${d.name} · ${d.team}`}
                >
                  <span className="h-4 w-1" style={{ background: d.color }} aria-hidden />
                  {d.position && <span className="font-normal text-label-4">P{d.position}</span>}
                  {d.code}
                  {isRef && B && <span className="text-[0.625rem]" style={{ color: SLOT_B }}>REF</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {data?.source === "synthetic" && <p className="status-line" role="status">This lap is simulated by the offline engine{data.fallbackReason ? `: ${data.fallbackReason}` : "."} It illustrates the model rather than recorded car telemetry.</p>}
      {refMismatch && <p className="status-line" role="status">The reference lap could only be simulated right now, so it isn’t compared against recorded data. Try again shortly.</p>}
      {query.isError && data && <p className="status-line" role="status">The new selection couldn’t load. The last loaded lap remains on screen. <Button size="sm" variant="plain" onClick={() => void query.refetch()}>Retry selection</Button></p>}

      {/* Viewport */}
      <div className="glass relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-edge)] px-2 py-2 sm:px-3">
          <Segmented
            size="sm"
            aria-label="Track colouring"
            value={colorMode}
            onChange={setMode}
            segments={[{ value: "inputs", label: "Inputs" }, { value: "speed", label: "Speed" }, ...(B ? [{ value: "delta" as const, label: "Mini-sectors" }] : [])]}
          />
          <Segmented size="sm" aria-label="Camera" value={camera} onChange={setCamera} segments={CAMERAS} />
          <p className="hidden font-mono text-[0.625rem] uppercase tracking-[0.14em] text-label-3 xl:block" aria-hidden>
            <kbd>Space</kbd> play · <kbd>←→</kbd> step · <kbd>C</kbd> camera · <kbd>M</kbd> colour · <kbd>R</kbd> restart
          </p>
        </div>

        <div className="relative h-[min(58vh,520px)] min-h-[320px] sm:h-[min(72vh,680px)]">
          {A ? (
            <CanvasShell
              label={`3D circuit map of ${data!.session.circuit}, lap ${A.lapNumber} by ${A.name}${B ? ` against ${B.name}` : ""}, coloured by ${colorMode === "inputs" ? "braking and throttle" : colorMode === "speed" ? "speed" : "mini-sector winner"}`}
              camera={{ position: [0, 9.5, 9.5], fov: 42 }}
            >
              <TrackScene samples={A.samples} sectorSplits={data!.lap.sectorSplits} getCursor={getCursor} mode={colorMode} camera={camera} color={A.color} corners={A.corners} comparison={comparison} />
            </CanvasShell>
          ) : (
            <div className="flex h-full items-center justify-center gap-3 text-footnote text-label-3">
              <Spinner /> Building circuit
            </div>
          )}
          {A && (
            <>
              <div className="pointer-events-none absolute left-3 top-3 hidden lg:block">
                <WheelHud lap={A} refLap={B} playhead={playhead} />
              </div>
              <div className="pointer-events-none absolute right-3 top-3 hidden w-[310px] lg:block">
                <LapCard lap={A} refLap={B} playhead={playhead} />
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 hidden w-[210px] lg:block">
                <GgDiagram lap={A} playhead={playhead} color={B ? SLOT_A : "#FF7A52"} />
              </div>
              <Legend mode={colorMode} a={A} b={B} />
            </>
          )}
        </div>

        {/* Below the scene on smaller screens, so nothing covers the track. */}
        {A && (
          <div className="grid gap-px border-t border-[var(--glass-edge)] bg-[var(--glass-edge)] sm:grid-cols-2 lg:hidden [&>*]:bg-[rgb(var(--canvas)/0.9)]">
            <WheelHud lap={A} refLap={B} playhead={playhead} compact />
            <div className="grid gap-px bg-[var(--glass-edge)] [&>*]:bg-[rgb(var(--canvas)/0.9)]">
              <LapCard lap={A} refLap={B} playhead={playhead} />
              <GgDiagram lap={A} playhead={playhead} color={B ? SLOT_A : "#FF7A52"} />
            </div>
          </div>
        )}
      </div>

      {A && (
        <>
          <div className="card space-y-4 p-3 sm:p-5">
            <Timeline samples={A.samples} playhead={playhead} lapTime={lapTime} playing={playing} onPlayingChange={setPlaying} rate={rate} onRateChange={setRate} />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-title-3 text-paper">Channels</h2>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-label-3">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: B ? SLOT_A : "#EC5C30" }} />{A.code} L{A.lapNumber}</span>
                {B && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: SLOT_B }} />{B.code} L{B.lapNumber}</span>}
                <span>Drag to scrub · aligned by distance</span>
              </p>
            </div>
            <ChannelStack a={A} b={B} playhead={playhead} sectorSplits={data!.lap.sectorSplits} onScrub={() => setPlaying(false)} />
            {B && <p className="text-caption text-label-3">Δ gap is {A.code}’s time minus {B.code}’s at the same point on track: below the line, {A.code} is ahead.</p>}
          </div>

          <div className="card p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-title-3 text-paper">Corner analysis</h2>
              <p className="font-mono text-[0.6875rem] text-label-3">{A.corners.length} corners detected from the speed trace</p>
            </div>
            <CornerTable a={A} b={B} playhead={playhead} onJump={() => setPlaying(false)} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-footnote text-label-3">
              {data!.source === "synthetic"
                ? "Generated by the offline engine: physics lap on a seeded circuit. Real sessions load automatically when OpenF1 is reachable."
                : `${A.samples.length} merged car and GPS samples (~3.7 Hz). g-forces are derived from speed and path curvature after smoothing, so treat peaks as estimates. Elevation is exaggerated for readability.`}
            </p>
            <Link href="/predict/delta" className="pressable inline-flex h-11 items-center gap-2 border border-accent/60 px-4 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-paper hover:bg-accent/15">
              Model vs actual
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function Legend({ mode, a, b }: { mode: HeatMode; a: LapView; b?: LapView }) {
  return (
    <div className="glass-strong pointer-events-none absolute bottom-3 right-3 px-3 py-2 text-[0.6875rem] font-semibold text-label-2" aria-hidden>
      {mode === "inputs" && (
        <ul className="flex flex-wrap gap-3">
          {(["brake", "throttle", "coast"] as const).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className={cn("w-3", k === "brake" ? "h-2.5" : "h-1.5")} style={{ background: HEAT[k] }} />
              {STATE_LABEL[k]}
            </li>
          ))}
        </ul>
      )}
      {mode === "speed" && (
        <div className="flex items-center gap-2 font-mono">
          {Math.round(Math.min(...a.samples.map((s) => s.speed)))}
          <span className="h-1.5 w-24" style={{ background: "linear-gradient(90deg, #3a0c06, #FFB08A)" }} />
          {Math.round(Math.max(...a.samples.map((s) => s.speed)))} km/h
        </div>
      )}
      {mode === "delta" && b && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-3" style={{ background: SLOT_A }} />{a.code} quicker</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-3" style={{ background: SLOT_B }} />{b.code} quicker</span>
        </div>
      )}
    </div>
  );
}
