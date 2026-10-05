/**
 * components/prediction/delta/DeltaDashboard.tsx
 *
 * Prediction vs. actual: how the race-pace model (lib/prediction/laptime)
 * and the classification engine (lib/prediction/engine) did against what
 * really happened.
 *
 *   Dials       accuracy, lap MAE, sector MAE, apex-speed MAE, podium hits
 *   Live delta  Δ for the hovered lap (defaults to the latest scored lap)
 *   Lap times   overlay or split view, calibration window and pit window shaded
 *   Lap deltas  predicted − actual per lap
 *   Sectors     mean predicted vs actual per sector, micro-deltas
 *   Corners     predicted (geometry → physics) vs measured apex speed
 *   Strategy    actual stints vs the model's one-stop window
 *   Result      predicted finishing order vs the official classification
 */

"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, Check, Minus, TrendingDown, TrendingUp, X } from "lucide-react";
import { AXIS, ChartTooltip, CURSOR_BAR, CURSOR_LINE, GRID, SERIES } from "@/components/ui/chart";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, Skeleton, Spinner } from "@/components/ui/States";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { SourceBadge } from "@/components/telemetry/SourceBadge";
import type { DeltaReport } from "@/lib/prediction/delta";
import type { Backtest } from "@/lib/prediction/backtest";
import type { Compound } from "@/lib/telemetry/types";
import { formatDelta, formatLapSeconds } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { MetricDial } from "./MetricDial";

const COMPOUND_COLOR: Record<Compound, string> = {
  SOFT: "#E8322E",
  MEDIUM: "#FFC53D",
  HARD: "#F5E9E4",
  INTERMEDIATE: "#1FA350",
  WET: "#3896DE",
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "Request failed");
  return body as T;
}

function Panel({ title, subtitle, accessory, children, className }: { title: string; subtitle?: React.ReactNode; accessory?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("glass p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-title-3 text-paper">{title}</h2>
          {subtitle && <p className="mt-0.5 text-footnote text-label-3">{subtitle}</p>}
        </div>
        {accessory}
      </div>
      {children}
    </section>
  );
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean; swatch?: "line" | "box" }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-label-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.swatch === "box" ? (
            <span className="h-2.5 w-2.5" style={{ background: i.color }} aria-hidden />
          ) : (
            <svg width="16" height="4" aria-hidden>
              <line x1="0" y1="2" x2="16" y2="2" stroke={i.color} strokeWidth="2" strokeDasharray={i.dashed ? "4 3" : undefined} />
            </svg>
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

// ─── Live delta ──────────────────────────────────────────────────────────────

function LiveDelta({ report, lap }: { report: DeltaReport; lap: number | null }) {
  const reduce = useReducedMotion();
  const row = report.laps.find((l) => l.lap === lap) ?? null;
  const d = row?.delta ?? null;
  const optimistic = d !== null && d < 0;
  return (
    <div className="glass relative flex h-full flex-col justify-between overflow-hidden p-5" aria-live="polite">
      <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(120% 90% at 100% 0%, ${optimistic ? SERIES.actual : SERIES.predicted}22, transparent 60%)` }} />
      <div className="relative">
        <div className="label-caps text-[0.75rem] text-label-3">Live delta · lap {row?.lap ?? "—"}</div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${row?.lap}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="mt-2 font-display text-[clamp(2.2rem,5vw,3.1rem)] leading-none tabular-nums text-paper"
          >
            {d === null ? "—" : formatDelta(d)}
          </motion.div>
        </AnimatePresence>
        {d !== null && (
          <p className="mt-2 flex items-center gap-1.5 text-subhead text-label-2">
            {optimistic ? <TrendingDown className="h-4 w-4 text-tint" aria-hidden /> : <TrendingUp className="h-4 w-4 text-info" aria-hidden />}
            Model {Math.abs(d).toFixed(3)}s {optimistic ? "faster than reality" : "slower than reality"}
          </p>
        )}
      </div>
      {row && (
        <dl className="relative mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-4 font-mono text-[0.8125rem]">
          <div>
            <dt className="text-label-3">Predicted</dt>
            <dd className="tabular text-paper">{formatLapSeconds(row.predicted)}</dd>
          </div>
          <div>
            <dt className="text-label-3">Actual</dt>
            <dd className="tabular text-paper">{row.actual ? formatLapSeconds(row.actual) : "—"}</dd>
          </div>
          <div>
            <dt className="text-label-3">Tyre</dt>
            <dd className="flex items-center gap-1.5 text-paper">
              <span className="h-2 w-2 rounded-full" style={{ background: COMPOUND_COLOR[row.compound] }} aria-hidden />
              {row.compound[0]}
              {row.compound.slice(1).toLowerCase()} · {row.tyreAge} laps
            </dd>
          </div>
          <div>
            <dt className="text-label-3">Track</dt>
            <dd className="tabular text-paper">{row.trackTemp.toFixed(1)} °C</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

// ─── Lap time charts ─────────────────────────────────────────────────────────

type LapPoint = { lap: number; actual: number | null; predicted: number; delta: number | null };

const LapTimesChart = memo(function LapTimesChart({
  report,
  view,
  onHover,
}: {
  report: DeltaReport;
  view: "overlay" | "split";
  onHover: (lap: number | null) => void;
}) {
  const data: LapPoint[] = useMemo(
    () => report.laps.map((l) => ({ lap: l.lap, actual: l.clean ? l.actual : null, predicted: Math.round(l.predicted * 1000) / 1000, delta: l.delta })),
    [report],
  );
  const domain = useMemo(() => {
    const vals = data.flatMap((d) => [d.actual, d.predicted]).filter((v): v is number => v !== null);
    return [Math.floor(Math.min(...vals) - 0.4), Math.ceil(Math.max(...vals) + 0.4)] as [number, number];
  }, [data]);
  const train = report.model.trainingLaps;
  const win = report.pit.model?.window;
  const excluded = report.laps.filter((l) => !l.clean).length;

  const tooltip = (
    <Tooltip
      cursor={CURSOR_LINE}
      content={
        <ChartTooltip
          title={(l) => `Lap ${l}`}
          format={(p) => {
            const row = p[0]?.payload as LapPoint;
            return [
              { label: "Predicted", value: formatLapSeconds(row.predicted), color: SERIES.predicted },
              { label: "Actual", value: row.actual ? formatLapSeconds(row.actual) : "excluded", color: SERIES.actual },
              ...(row.delta !== null && row.actual ? [{ label: "Delta", value: formatDelta(row.delta) }] : []),
            ];
          }}
        />
      }
    />
  );
  const shading = [
    train.length ? <ReferenceArea key="train" x1={train[0]} x2={train[train.length - 1]} fill="rgb(255 255 255 / 0.05)" stroke="none" label={{ value: "Calibration", position: "insideTopLeft", fill: "rgba(245,233,228,0.54)", fontSize: 11 }} /> : null,
    win ? <ReferenceArea key="win" x1={win[0]} x2={win[1]} fill="rgb(56 150 222 / 0.12)" stroke="none" label={{ value: "Model pit window", position: "insideTopRight", fill: "rgba(245,233,228,0.54)", fontSize: 11 }} /> : null,
    ...report.pit.actualStops.map((s) => <ReferenceLine key={`stop-${s}`} x={s + 0.5} stroke="rgba(245,233,228,0.35)" strokeDasharray="2 3" />),
  ];
  const handlers = {
    onMouseMove: (s: { activeLabel?: string | number }) => s.activeLabel !== undefined && onHover(Number(s.activeLabel)),
    onMouseLeave: () => onHover(null),
  };

  const gradient = (
    <defs>
      <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SERIES.actual} stopOpacity={0.45} />
        <stop offset="100%" stopColor={SERIES.actual} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SERIES.predicted} stopOpacity={0.4} />
        <stop offset="100%" stopColor={SERIES.predicted} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  );
  const yAxis = <YAxis domain={domain} width={56} tickFormatter={(v) => formatLapSeconds(v, 1)} allowDataOverflow {...AXIS} />;
  const xAxis = <XAxis dataKey="lap" type="number" domain={["dataMin", "dataMax"]} allowDecimals={false} {...AXIS} />;

  return (
    <div>
      {view === "overlay" ? (
        <div className="h-[300px]">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 0 }} {...handlers}>
              {gradient}
              <CartesianGrid {...GRID} />
              {xAxis}
              {yAxis}
              {shading}
              {tooltip}
              <Area type="monotone" dataKey="actual" stroke={SERIES.actual} strokeWidth={2} fill="url(#actualFill)" connectNulls={false} isAnimationActive={false} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="predicted" stroke={SERIES.predicted} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(["predicted", "actual"] as const).map((key) => (
            <figure key={key} className="min-w-0">
              <figcaption className="label-caps mb-1 text-[0.75rem]" style={{ color: key === "actual" ? SERIES.actual : SERIES.predicted }}>
                {key === "actual" ? "Actual" : "Predicted"}
              </figcaption>
              <div className="h-[260px]">
                <ResponsiveContainer>
                  <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 0 }} syncId="delta-split" {...handlers}>
                    {gradient}
                    <CartesianGrid {...GRID} />
                    {xAxis}
                    {yAxis}
                    {shading}
                    {tooltip}
                    <Area
                      type="monotone"
                      dataKey={key}
                      stroke={key === "actual" ? SERIES.actual : SERIES.predicted}
                      strokeDasharray={key === "predicted" ? "6 4" : undefined}
                      strokeWidth={2}
                      fill={key === "actual" ? "url(#actualFill)" : "url(#predFill)"}
                      isAnimationActive={false}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </figure>
          ))}
        </div>
      )}
      <p className="mt-3 text-caption text-label-3">
        Shaded: laps used to calibrate the model (not scored), and the model&apos;s one-stop pit window. Dotted lines: actual stops.
        {excluded > 0 && ` ${excluded} laps (lap 1, in/out laps, safety car, traffic) are left out of the actual line.`}
      </p>
    </div>
  );
});

const LapDeltaBars = memo(function LapDeltaBars({ report, onHover }: { report: DeltaReport; onHover: (lap: number | null) => void }) {
  const data = report.laps.filter((l) => l.clean && !l.training && l.delta !== null).map((l) => ({ lap: l.lap, delta: Math.round((l.delta as number) * 1000) / 1000 }));
  const max = Math.max(0.5, ...data.map((d) => Math.abs(d.delta)));
  return (
    <div className="h-[200px]">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          onMouseMove={(s: { activeLabel?: string | number }) => s.activeLabel !== undefined && onHover(Number(s.activeLabel))}
          onMouseLeave={() => onHover(null)}
        >
          <CartesianGrid {...GRID} />
          <XAxis dataKey="lap" {...AXIS} />
          <YAxis width={56} domain={[-max, max]} tickFormatter={(v) => `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}`} {...AXIS} />
          <ReferenceLine y={0} stroke="rgba(245,233,228,0.3)" />
          <Tooltip cursor={CURSOR_BAR} content={<ChartTooltip title={(l) => `Lap ${l}`} format={(p) => [{ label: "Predicted − actual", value: formatDelta(p[0].value) }]} />} />
          <Bar dataKey="delta" radius={[3, 3, 3, 3]} isAnimationActive={false} maxBarSize={14}>
            {data.map((d) => (
              <Cell key={d.lap} fill={d.delta < 0 ? SERIES.actual : SERIES.predicted} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// ─── Sectors, corners, strategy ──────────────────────────────────────────────

/** Per-lap micro-deltas for one sector: bars up = model slower, down = model faster. */
function SectorStrip({ report, sector }: { report: DeltaReport; sector: number }) {
  const rows = report.laps.filter((l) => l.clean && !l.training && l.sectorsActual[sector]);
  const deltas = rows.map((l) => l.sectorsPredicted[sector] - (l.sectorsActual[sector] as number));
  const max = Math.max(0.05, ...deltas.map(Math.abs));
  const W = 4;
  const H = 36;
  if (!deltas.length) return null;
  return (
    <svg viewBox={`0 0 ${deltas.length * (W + 2)} ${H}`} preserveAspectRatio="none" className="mt-3 h-9 w-full" role="img" aria-label={`Sector ${sector + 1} per-lap delta, largest ${max.toFixed(3)} seconds`}>
      <line x1="0" x2={deltas.length * (W + 2)} y1={H / 2} y2={H / 2} stroke="rgba(245,233,228,0.25)" strokeWidth="0.5" />
      {deltas.map((d, i) => {
        const h = Math.max(0.6, (Math.abs(d) / max) * (H / 2 - 1));
        return <rect key={i} x={i * (W + 2)} y={d > 0 ? H / 2 - h : H / 2} width={W} height={h} rx="1" fill={d < 0 ? SERIES.actual : SERIES.predicted} />;
      })}
    </svg>
  );
}

function Sectors({ report }: { report: DeltaReport }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {report.sectorMeans.map((s, i) => {
        const delta = s.predicted - s.actual;
        const stats = report.stats.sectors[i];
        return (
          <div key={s.sector} className="border border-hairline bg-fill-1 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-[1.25rem] text-paper">S{s.sector}</span>
              <span className="font-mono text-[0.8125rem] tabular-nums text-paper">{formatDelta(delta)}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 font-mono text-[0.75rem]">
              <div>
                <dt style={{ color: SERIES.predicted }}>Predicted</dt>
                <dd className="tabular text-paper">{s.predicted.toFixed(3)}s</dd>
              </div>
              <div>
                <dt style={{ color: SERIES.actual }}>Actual</dt>
                <dd className="tabular text-paper">{s.actual.toFixed(3)}s</dd>
              </div>
            </dl>
            <SectorStrip report={report} sector={i} />
            <p className="mt-3 text-caption text-label-3">
              Per-lap micro-deltas · MAE {stats.mae.toFixed(3)}s over {stats.n} laps · wear weight ×{report.model.sectorBrakeWeights[i].toFixed(2)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const CornerChart = memo(function CornerChart({ report }: { report: DeltaReport }) {
  const data = report.corners.map((c) => ({ name: `T${c.n}`, predicted: Math.round(c.predicted), actual: Math.round(c.actual), radius: Math.round(c.radius) }));
  if (!data.length) return <p className="text-footnote text-label-3">No distinct corners found on the traced lap.</p>;
  return (
    <div className="h-[240px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="name" {...AXIS} />
          <YAxis width={44} {...AXIS} />
          <Tooltip
            cursor={CURSOR_BAR}
            content={
              <ChartTooltip
                format={(p) => [
                  { label: "Predicted", value: `${p[0].payload.predicted} km/h`, color: SERIES.predicted },
                  { label: "Actual", value: `${p[0].payload.actual} km/h`, color: SERIES.actual },
                  { label: "Radius", value: `${p[0].payload.radius} m` },
                ]}
              />
            }
          />
          <Bar dataKey="predicted" fill={SERIES.predicted} radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          <Bar dataKey="actual" fill={SERIES.actual} radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

function Strategy({ report }: { report: DeltaReport }) {
  const total = report.model.totalLaps;
  const pct = (lap: number) => `${((lap - 1) / total) * 100}%`;
  const m = report.pit.model;
  const compared = report.pit.compared;
  return (
    <div className="space-y-4">
      <div>
        <div className="label-caps mb-1.5 text-[0.75rem] text-label-3">Actual</div>
        <div className="relative flex h-9 gap-[2px]">
          {report.pit.stints.map((s) => (
            <div
              key={s.stint}
              className="flex items-center justify-center overflow-hidden font-mono text-[0.75rem] font-bold text-canvas"
              style={{ width: `${((s.lapEnd - s.lapStart + 1) / total) * 100}%`, background: COMPOUND_COLOR[s.compound] }}
              title={`${s.compound} · laps ${s.lapStart}–${s.lapEnd}`}
            >
              {s.lapEnd - s.lapStart >= 3 ? `${s.compound[0]} · ${s.lapEnd - s.lapStart + 1}` : s.compound[0]}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="label-caps mb-1.5 text-[0.75rem] text-label-3">Model · one-stop {m ? `${m.firstCompound[0]}→${m.secondCompound[0]}` : ""}</div>
        <div className="relative h-9 border border-hairline bg-fill-1">
          {m && (
            <>
              <div className="absolute inset-y-0 border-x border-info/60 bg-info/20" style={{ left: pct(m.window[0]), width: `${((m.window[1] - m.window[0] + 1) / total) * 100}%` }} />
              <div className="absolute inset-y-[-4px] w-[3px] bg-info shadow-[0_0_10px_rgb(var(--info))]" style={{ left: pct(m.optimalLap + 0.5) }} />
            </>
          )}
          {compared && <div className="absolute inset-y-[-4px] w-[2px] border-l-2 border-dashed border-paper/70" style={{ left: pct(compared.stop + 0.5) }} />}
        </div>
      </div>
      {m && compared ? (
        <p className="text-subhead text-label-2">
          Model stops on <span className="font-mono text-paper">lap {m.optimalLap}</span> (window {m.window[0]}–{m.window[1]}); the strategic stop came on{" "}
          <span className="font-mono text-paper">lap {compared.stop}</span> —{" "}
          {compared.stop >= m.window[0] && compared.stop <= m.window[1] ? "inside the window." : `${Math.abs(compared.stop - m.optimalLap)} laps ${compared.stop < m.optimalLap ? "earlier" : "later"} than the model.`}
        </p>
      ) : (
        <p className="text-subhead text-label-3">{report.pit.note ?? "No stop to compare."}</p>
      )}
    </div>
  );
}

// ─── Classification ──────────────────────────────────────────────────────────

function Classification() {
  const q = useQuery({ queryKey: ["backtest"], queryFn: () => getJson<Backtest>("/api/delta/classification"), staleTime: 60 * 60 * 1000 });
  if (q.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }
  if (q.isError) return <EmptyState title="Backtest unavailable" description={(q.error as Error).message} />;
  const b = q.data;
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Winner", value: b.stats.winnerCorrect ? <Check className="h-6 w-6 text-success" aria-label="Correct" /> : <X className="h-6 w-6 text-tint" aria-label="Missed" /> },
          { label: "Podium hits", value: `${b.stats.podiumHits}/3` },
          { label: "Top-10 hits", value: `${b.stats.top10Hits}/10` },
          { label: "Position MAE", value: b.stats.positionMae.toFixed(1) },
          { label: "Rank corr. ρ", value: b.stats.spearman.toFixed(2) },
        ].map((s) => (
          <div key={s.label} className="border border-hairline bg-fill-1 p-3">
            <div className="flex h-7 items-center font-display text-[1.5rem] leading-none text-paper">{s.value}</div>
            <div className="label-caps mt-1.5 text-[0.6875rem] text-label-3">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-left">
          <caption className="sr-only">Predicted versus actual finishing positions, {b.raceName}</caption>
          <thead>
            <tr className="label-caps border-b border-hairline text-[0.6875rem] text-label-3">
              <th className="py-2 pr-2 font-bold">Pred</th>
              <th className="py-2 pr-2 font-bold">Driver</th>
              <th className="py-2 pr-2 text-right font-bold">Actual</th>
              <th className="py-2 text-right font-bold">Δ places</th>
            </tr>
          </thead>
          <tbody>
            {b.rows.slice(0, 12).map((r) => (
              <tr key={r.driverId} className="border-b border-hairline last:border-0">
                <td className="py-2 pr-2 font-mono text-[0.875rem] text-label-2">P{r.predicted}</td>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <TeamLogo team={r.constructorId} season={Number(b.season)} size="sm" />
                    <span className="font-semibold text-paper">{r.code}</span>
                    <span className="hidden truncate text-footnote text-label-3 sm:inline">{r.name}</span>
                  </span>
                </td>
                <td className="py-2 pr-2 text-right font-mono text-[0.875rem] text-paper">{r.actual ? `P${r.actual}` : "DNF"}</td>
                <td className="py-2 text-right">
                  {r.delta === null ? (
                    <span className="text-label-4">—</span>
                  ) : (
                    <span className={cn("inline-flex items-center gap-1 font-mono text-[0.875rem]", r.delta === 0 ? "text-success" : "text-label-2")}>
                      {r.delta === 0 ? <Minus className="h-3.5 w-3.5" aria-hidden /> : r.delta > 0 ? <ArrowUp className="h-3.5 w-3.5 text-success" aria-hidden /> : <ArrowDown className="h-3.5 w-3.5 text-tint" aria-hidden />}
                      {r.delta === 0 ? "exact" : `${r.delta > 0 ? "+" : ""}${r.delta}`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-caption text-label-3">
        {b.raceName} {b.season}, round {b.round}. The engine only sees races before this one. Δ places: positive means the driver finished higher than predicted. Official result via{" "}
        <SourceBadge source={b.source} className="ml-1 align-middle !py-0" />
      </p>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function DeltaDashboard() {
  const [driver, setDriver] = useState<number | undefined>();
  const [synthetic, setSynthetic] = useState(false);
  const [view, setView] = useState<"overlay" | "split">("overlay");
  const [hoverLap, setHoverLap] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["delta", driver, synthetic],
    queryFn: () => getJson<DeltaReport>(`/api/delta?${new URLSearchParams({ ...(driver ? { driver: String(driver) } : {}), ...(synthetic ? { source: "synthetic" } : {}) })}`),
    placeholderData: (prev) => prev,
    staleTime: 60 * 60 * 1000,
  });
  const r = q.data;

  if (q.isError && !r) return <EmptyState title="Report unavailable" description={(q.error as Error).message} />;

  if (!r) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-footnote text-label-3">
          <Spinner /> Fetching race telemetry and running the model…
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
        <Skeleton className="h-[340px]" />
      </div>
    );
  }

  const lastScored = [...r.laps].reverse().find((l) => l.clean && !l.training && l.delta !== null)?.lap ?? null;
  const activeLap = hoverLap ?? lastScored;
  const sectorMae = r.stats.sectors.reduce((s, x) => s + x.mae, 0) / 3;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SourceBadge source={r.source} detail={`${r.session.circuit} ${r.session.year} · ${r.session.name}`} reason={r.fallbackReason} />
          {q.isFetching && <Spinner className="h-4 w-4" label="Updating" />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 border border-[var(--glass-edge)] bg-fill-1 pl-3 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-label-3">
            Driver
            <select value={r.driver.number} onChange={(e) => setDriver(Number(e.target.value))} className="h-full bg-transparent pr-2 font-mono text-[0.8125rem] normal-case tracking-normal text-paper outline-none">
              {r.drivers.map((d) => (
                <option key={d.number} value={d.number} className="bg-surface-2">
                  {d.code} · {d.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-pressed={synthetic}
            onClick={() => setSynthetic((v) => !v)}
            className={cn("pressable flex h-9 items-center border px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", synthetic ? "border-warning/60 bg-warning/10 text-warning" : "border-[var(--glass-edge)] text-label-2 hover:text-paper")}
          >
            Offline engine
          </button>
        </div>
      </div>

      {/* Dials + live delta */}
      <div className="grid gap-3 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricDial label="Lap accuracy" value={r.stats.lap.accuracy.toFixed(1)} unit="%" fill={(r.stats.lap.accuracy - 95) / 5} hint={`${r.stats.lap.n} scored laps`} color={SERIES.predicted} />
          <MetricDial label="Lap MAE" value={r.stats.lap.mae.toFixed(3)} unit="s" fill={1 - r.stats.lap.mae / 2} hint={`bias ${r.stats.lap.bias > 0 ? "+" : ""}${r.stats.lap.bias.toFixed(2)}s`} />
          <MetricDial label="Sector MAE" value={sectorMae.toFixed(3)} unit="s" fill={1 - sectorMae / 1} hint="mean of S1–S3" />
          <MetricDial label="Apex speed MAE" value={r.stats.corners.mae.toFixed(1)} unit="km/h" fill={1 - r.stats.corners.mae / 40} hint={`${r.stats.corners.n} corners`} color={SERIES.actual} />
        </div>
        <LiveDelta report={r} lap={activeLap} />
      </div>

      <Panel
        title="Lap Times"
        subtitle={`${r.driver.name} · predicted from lap ${r.model.trainingLaps[r.model.trainingLaps.length - 1] ?? 1} onward`}
        accessory={
          <div className="flex flex-wrap items-center gap-3">
            <Legend items={[{ label: "Predicted", color: SERIES.predicted, dashed: true }, { label: "Actual", color: SERIES.actual }]} />
            <Segmented size="sm" aria-label="Chart layout" value={view} onChange={setView} segments={[{ value: "overlay", label: "Overlay" }, { value: "split", label: "Split" }]} />
          </div>
        }
      >
        <LapTimesChart report={r} view={view} onHover={setHoverLap} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Lap Deltas" subtitle="Predicted minus actual, scored laps only" accessory={<Legend items={[{ label: "Model faster", color: SERIES.actual, swatch: "box" }, { label: "Model slower", color: SERIES.predicted, swatch: "box" }]} />}>
          <LapDeltaBars report={r} onHover={setHoverLap} />
        </Panel>
        <Panel title="Pit Strategy" subtitle="Actual stints vs the model's optimal one-stop window">
          <Strategy report={r} />
        </Panel>
      </div>

      <Panel title="Sector Deltas" subtitle="Mean sector times on scored laps. Tyre wear is weighted toward braking-heavy sectors.">
        <Sectors report={r} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel
          title="Cornering Speeds"
          subtitle="Apex speed predicted from track geometry (grip + downforce limit) vs measured on the fastest lap"
          accessory={<Legend items={[{ label: "Predicted", color: SERIES.predicted, swatch: "box" }, { label: "Actual", color: SERIES.actual, swatch: "box" }]} />}
        >
          <CornerChart report={r} />
        </Panel>
        <Panel title="Model Inputs" subtitle="What the race-pace model fitted and assumed for this driver">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[0.8125rem]">
            {[
              ["Base pace", formatLapSeconds(r.model.basePace)],
              ["Wear scale", `×${r.model.degScale.toFixed(2)}`],
              ["Fuel effect", `${(r.model.fuelSecPerKg * 1000).toFixed(0)} ms/kg`],
              ["Track evolution", `−${(r.model.evolutionPerLap * 1000).toFixed(0)} ms/lap`],
              ["Track temp", `${r.model.trackTemp.min.toFixed(1)}–${r.model.trackTemp.max.toFixed(1)} °C`],
              ["Calibration laps", `${r.model.trainingLaps.length}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-label-3">{k}</dt>
                <dd className="tabular text-paper">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-hairline pt-3 text-caption text-label-3">
            Lap = base + fuel + compound + thermal wear (scaled by distance from each compound&apos;s temperature window, with a cliff) + thermal pace + warm-up − track evolution.
          </p>
        </Panel>
      </div>

      <Panel title="Race Result" subtitle="Classification engine backtest on the latest finished race">
        <Classification />
      </Panel>

      <div className="flex justify-end">
        <Link href="/telemetry" className="pressable inline-flex h-10 items-center gap-2 border border-accent/60 px-4 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-paper hover:bg-accent/15">
          Open 3D telemetry
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
