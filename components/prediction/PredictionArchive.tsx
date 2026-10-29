"use client";

/**
 * components/prediction/PredictionArchive.tsx
 *
 * "Did we call it?" for any finished race. Pick a round; the classification
 * engine re-runs on only the data available before that race (the same
 * backtest as /predict/delta) and the result is laid out three ways:
 *   1. a scorecard (winner, podium, top 10, average miss)
 *   2. the predicted podium next to the real one
 *   3. a slope chart, predicted order on the left, real order on the right
 * The full table sits in a disclosure for screen readers and detail.
 * Season and round live in the URL so race pages can link straight in.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, ChevronDown, Minus, X } from "@/components/ui/icons";
import type { Backtest, BacktestRow } from "@/lib/prediction/backtest";
import { raceEndTime } from "@/lib/utils/raceCalendar";
import { getRaceSchedule } from "@/lib/api/jolpica";
import { teamColor } from "@/lib/theme/teams";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { cn } from "@/lib/utils/cn";

const THIS_YEAR = new Date().getFullYear();
const SEASONS = Array.from({ length: THIS_YEAR - 2021 + 1 }, (_, i) => String(THIS_YEAR - i));

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "The model review service didn’t respond.");
  return body as T;
}

export default function PredictionArchive() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const season = params.get("season") ?? String(THIS_YEAR);
  const roundParam = params.get("round");
  const horizon = params.get("horizon") === "pre-qualifying" ? "pre-qualifying" : "post-qualifying";
  const go = (s: string, r?: string, h = horizon) => router.replace(`${pathname}?${new URLSearchParams({ season: s, ...(r ? { round: r } : {}), horizon: h })}`, { scroll: false });

  const schedule = useQuery({
    queryKey: ["schedule", season],
    staleTime: 3_600_000,
    queryFn: () => getRaceSchedule(season) as Promise<any[]>,
  });
  const [now] = useState(() => Date.now());
  const finished = useMemo(
    () => (schedule.data ?? []).filter((r) => raceEndTime(r) < now),
    [schedule.data, now],
  );
  // Results can lag the flag; the API falls back gracefully, but default to the latest finished round.
  const round = roundParam ?? finished[finished.length - 1]?.round ?? null;

  const backtest = useQuery({
    queryKey: ["backtest", season, round, horizon],
    enabled: !!round,
    staleTime: 3_600_000,
    queryFn: () => getJson<Backtest>(`/api/delta/classification?season=${season}&round=${round}&horizon=${horizon}`),
  });

  const rail = useRef<HTMLOListElement>(null);
  useEffect(() => {
    rail.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [round, finished.length]);

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-caps text-caption text-label-3">Pick a race</p>
          <label className="flex min-w-0 flex-wrap items-center gap-2 text-footnote text-label-2">Prediction horizon
            <select className="min-h-11 max-w-full border border-separator bg-surface px-2 text-paper" aria-label="Prediction horizon" value={horizon} onChange={e => go(season, round ?? undefined, e.target.value as typeof horizon)}>
              <option value="pre-qualifying">Pre-qualifying</option>
              <option value="post-qualifying">Post-qualifying / pre-race</option>
            </select>
          </label>
          <label className="pressable relative inline-flex h-11 items-center border border-separator bg-fill-1 pl-3 pr-8 text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-paper focus-within:outline focus-within:outline-2 focus-within:outline-tint">
            {season}
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-label-3" />
            <select aria-label="Season" value={season} onChange={(e) => go(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
              {SEASONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>
        {schedule.isPending ? (
          <div className="flex gap-2 overflow-hidden">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-32 shrink-0" />)}</div>
        ) : schedule.isError ? (
          <div className="status-line flex flex-wrap items-center justify-between gap-3" role="alert"><span>The {season} calendar didn’t load.</span><Button size="sm" onClick={() => void schedule.refetch()}>Retry</Button></div>
        ) : !finished.length ? (
          <p className="status-line">No finished races in {season} yet.</p>
        ) : (
          <ol ref={rail} className="scroller fade-edges-x -mx-4 gap-2 px-4 pb-1 sm:-mx-6 sm:px-6" aria-label={`Finished ${season} races`}>
            {finished.map((r) => {
              const on = r.round === round;
              return (
                <li key={r.round} className="shrink-0">
                  <button
                    type="button"
                    aria-current={on || undefined}
                    onClick={() => go(season, r.round)}
                    className={cn("pressable relative flex h-16 w-32 flex-col justify-center overflow-hidden border px-3 text-left", on ? "border-accent bg-accent/15" : "border-separator bg-fill-1 hover:border-paper/30")}
                  >
                    {on && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent" />}
                    <span className="font-mono text-[0.6875rem] text-label-3">R{String(r.round).padStart(2, "0")}</span>
                    <span className="truncate text-callout font-bold text-paper">{r.raceName.replace(/ Grand Prix.*$/, "")}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!round ? null : backtest.isPending ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <p className="text-footnote text-label-3">Evaluating a saved snapshot from the selected horizon…</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-[28rem]" />
        </div>
      ) : backtest.isError ? (
        <div className="card"><EmptyState title="No verdict for this race" description={(backtest.error as Error).message} action={<Button onClick={() => void backtest.refetch()}>Try again</Button>} /></div>
      ) : (
        <Verdict key={`${season}-${round}-${horizon}`} b={backtest.data} />
      )}
    </div>
  );
}

function Verdict({ b }: { b: Backtest }) {
  const byPred = b.rows;
  const byActual = [...b.rows].filter((r) => r.actual !== null).sort((x, y) => x.actual! - y.actual!);
  const winnerPred = byPred[0];
  const winnerReal = byActual[0];

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Round {b.round} · {new Date(`${b.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</p>
          <h2 className="font-display text-[clamp(1.5rem,5vw,2.25rem)] uppercase leading-none text-paper">{b.raceName}</h2>
        </div>
        <ButtonLink href={`/races/${b.season}/${b.round}`} size="sm" variant="plain">Full results</ButtonLink>
      </div>

      <p className="text-footnote text-label-3">{b.horizon} · inputs captured {b.cutoff}. Ranking metrics include retired drivers in official order; tied scores use average ranks. Top-three hits account for ties.</p>
      {!b.stats.completeField && <p className="status-line">Incomplete field: aggregate metrics are withheld. Missing predictions: {b.stats.missingDrivers.join(", ") || "none"}; missing outcomes: {b.stats.missingOutcomes.join(", ") || "none"}.</p>}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Winner" good={b.stats.winnerCorrect === true}>
          <span className="flex items-center gap-2">
            {b.stats.winnerCorrect === null ? <Minus className="h-6 w-6 text-label-3" /> : b.stats.winnerCorrect ? <Check className="h-6 w-6 text-success" /> : <X className="h-6 w-6 text-tint" />}
            {b.stats.winnerCorrect === null ? "Not scored" : b.stats.winnerCorrect ? "Called" : "Missed"}
          </span>
        </Tile>
        <Tile label="Podium" hint="drivers in the right top 3" good={(b.stats.podiumHits ?? 0) >= 2}>{b.stats.podiumHits?.toFixed(1) ?? "—"}/3</Tile>
        <Tile label="Top 10" hint="points finishers called" good={(b.stats.top10Hits ?? 0) >= 7}>{b.stats.top10Hits?.toFixed(1) ?? "—"}/10</Tile>
        <Tile label="Avg miss" hint="places per driver">±{b.stats.positionMae?.toFixed(1) ?? "—"}</Tile>
      </dl>

      <div className="grid gap-3 md:grid-cols-2">
        <Podium title="Model ranking" rows={byPred.slice(0, 3)} rank={(r) => r.predicted} highlight={(r) => r.actual !== null && r.actual <= 3} />
        <Podium title="What happened" rows={byActual.slice(0, 3)} rank={(r) => r.actual!} highlight={(r) => r.predicted <= 3} real />
      </div>
      {winnerPred && winnerReal && b.stats.winnerCorrect === false && winnerPred.score > (byPred[1]?.score ?? -Infinity) && (
        <p className="text-footnote text-label-2">
          The model had <b className="text-paper">{winnerPred.name}</b> on top; <b className="text-paper">{winnerReal.name}</b> won from a predicted P{winnerReal.predicted}.
        </p>
      )}

      <Slope rows={b.rows} />

      <details className="card group p-4 sm:p-6">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-callout font-semibold text-paper">
          Full classification
          <ChevronDown className="h-4 w-4 text-label-3 transition-transform group-open:rotate-180" />
        </summary>
        <div className="table-scroll mt-3" tabIndex={0} role="region" aria-label="Predicted and actual classification">
          <table className="w-full min-w-[420px] text-left">
            <caption className="sr-only">Predicted versus actual finishing positions, {b.raceName}</caption>
            <thead>
              <tr className="label-caps border-b border-hairline text-[0.6875rem] text-label-3">
                <th scope="col" className="py-2 pr-2 font-bold">Pred</th>
                <th scope="col" className="py-2 pr-2 font-bold">Driver</th>
                <th scope="col" className="py-2 pr-2 text-right font-bold">Actual</th>
                <th scope="col" className="py-2 text-right font-bold">Places</th>
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.driverId} className="border-b border-hairline last:border-0">
                  <td className="py-2 pr-2 font-mono text-[0.875rem] text-label-2">P{r.predicted}</td>
                  <th scope="row" className="py-2 pr-2 font-normal">
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-1" style={{ background: teamColor(r.constructorId) }} aria-hidden />
                      <span className="font-semibold text-paper">{r.code}</span>
                      <span className="truncate text-footnote text-label-3">{r.name}</span>
                    </span>
                  </th>
                  <td className="py-2 pr-2 text-right font-mono text-[0.875rem] text-paper">{r.actual ? `P${r.actual}${r.status === "dnf" ? " · DNF" : r.status === "dsq" ? " · DSQ" : ""}` : r.status.toUpperCase()}</td>
                  <td className="py-2 text-right"><DeltaChip delta={r.delta} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Tile({ label, hint, good, children }: { label: string; hint?: string; good?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("relative border border-hairline bg-fill-1 p-4", good && "border-success/30")}>
      <dd className="font-display text-[1.75rem] leading-none text-paper">{children}</dd>
      <dt className="label-caps mt-2 text-[0.6875rem] text-label-3">{label}{hint && <span className="mt-0.5 block normal-case tracking-normal text-label-4">{hint}</span>}</dt>
    </div>
  );
}

function Podium({ title, rows, rank, highlight, real }: { title: string; rows: BacktestRow[]; rank: (r: BacktestRow) => number; highlight: (r: BacktestRow) => boolean; real?: boolean }) {
  return (
    <div className={cn("card p-4 sm:p-5", real && "card-accent relative")}>
      <h3 className="label-caps mb-3 text-caption text-label-3">{title}</h3>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.driverId} className="stagger-in flex items-center gap-3" style={{ ["--i" as string]: i }}>
            <span className={cn("flex h-9 w-9 items-center justify-center border font-display", ["border-gold/50 text-gold", "border-silver/50 text-silver", "border-bronze/50 text-bronze"][i])}>{rank(r)}</span>
            <span className="h-7 w-1" style={{ background: teamColor(r.constructorId) }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-callout font-semibold text-paper">{r.name}</span>
            {highlight(r) ? <Check className="h-4 w-4 shrink-0 text-success" aria-label="On both podiums" /> : <span className="shrink-0 font-mono text-caption text-label-3">{real ? `pred P${r.predicted}` : r.actual ? `fin P${r.actual}` : r.status.toUpperCase()}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Predicted rank (left) to actual rank (right), one line per driver. Tap a driver to follow their line. */
function Slope({ rows }: { rows: BacktestRow[] }) {
  const [focus, setFocus] = useState<string | null>(null);
  const ROW = 28;
  const W = 400;
  const LEFT = 88;
  const RIGHT = W - LEFT;
  const y = (slot: number) => 4 + (slot - 0.5) * ROW;
  // Finishing slots: classified drivers by position, then non-finishers stacked below.
  const byActual = [...rows].sort((a, b) => (a.actual ?? 99) - (b.actual ?? 99));
  const slot = new Map(byActual.map((r, i) => [r.driverId, i + 1]));
  const H = rows.length * ROW + 8;

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-title-3 text-paper">Predicted → actual</h3>
        <p className="text-footnote text-label-3">Tap a driver to follow their line</p>
      </div>
      <div className="mx-auto mb-2 flex max-w-[520px] justify-between font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-label-3" aria-hidden>
        <span>Predicted</span><span>Finished</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[520px]" role="img" aria-label="Slope chart of predicted versus actual finishing order. The full classification table follows.">
        {rows.map((r, i) => {
          const c = teamColor(r.constructorId);
          const dim = focus && focus !== r.driverId;
          const y1 = y(r.predicted);
          const y2 = y(slot.get(r.driverId)!);
          return (
            <g key={r.driverId} className="cursor-pointer" opacity={dim ? 0.15 : 1} style={{ transition: "opacity .2s" }} onClick={() => setFocus((f) => (f === r.driverId ? null : r.driverId))}>
              <path
                d={`M${LEFT} ${y1} C${W / 2} ${y1} ${W / 2} ${y2} ${RIGHT} ${y2}`}
                fill="none"
                stroke={c}
                strokeWidth={focus === r.driverId ? 3.5 : 2}
                strokeDasharray={r.actual === null ? "4 4" : undefined}
                pathLength={1}
                className={r.actual === null ? undefined : "slope-draw"}
                style={{ animationDelay: `${i * 30}ms` }}
              />
              <rect x={0} y={y1 - ROW / 2} width={LEFT} height={ROW} fill="transparent" />
              <text x={LEFT - 10} y={y1 + 5} textAnchor="end" className="fill-[var(--label-3)] font-mono text-[13px]">{r.predicted}</text>
              <text x={LEFT - 34} y={y1 + 5} textAnchor="end" fill="rgb(var(--paper))" className="text-[15px] font-bold">{r.code}</text>
              <circle cx={LEFT} cy={y1} r={3.5} fill={c} />
              <circle cx={RIGHT} cy={y2} r={3.5} fill={c} />
            </g>
          );
        })}
        {byActual.map((r) => (
          <g key={r.driverId} opacity={focus && focus !== r.driverId ? 0.15 : 1} className="cursor-pointer" onClick={() => setFocus((f) => (f === r.driverId ? null : r.driverId))}>
            <rect x={RIGHT} y={y(slot.get(r.driverId)!) - ROW / 2} width={W - RIGHT} height={ROW} fill="transparent" />
            <text x={RIGHT + 10} y={y(slot.get(r.driverId)!) + 5} className="fill-[var(--label-3)] font-mono text-[13px]">{r.actual ?? "–"}</text>
            <text x={RIGHT + 34} y={y(slot.get(r.driverId)!) + 5} fill="rgb(var(--paper))" className="text-[15px] font-bold">{r.code}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-label-4">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-[0.875rem]", delta === 0 ? "text-success" : delta > 0 ? "text-success" : "text-tint")}>
      {delta === 0 ? <Minus className="h-3.5 w-3.5" /> : delta > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
      {delta === 0 ? "exact" : Math.abs(delta)}
      <span className="sr-only">{delta === 0 ? "" : delta > 0 ? " places better than predicted" : " places worse than predicted"}</span>
    </span>
  );
}
