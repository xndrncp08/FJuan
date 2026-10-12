/**
 * components/live/SpeedTraps.tsx
 *
 * The three timing-line speeds OpenF1 reports per lap — intermediate 1,
 * intermediate 2 and the speed trap — as best / median plus a lap-by-lap
 * sparkline. Low-downforce setups and DRS show up here first.
 */

import type { LapData } from "./types";

const TRAPS = [
  { key: "i1_speed", label: "Intermediate 1" },
  { key: "i2_speed", label: "Intermediate 2" },
  { key: "st_speed", label: "Speed trap" },
] as const;

function Spark({ values, best }: { values: (number | null)[]; best: number }) {
  const v = values.filter((x): x is number => !!x);
  if (v.length < 2) return null;
  const lo = Math.min(...v);
  const hi = Math.max(...v) || 1;
  const W = 200;
  const H = 36;
  let d = "";
  values.forEach((x, i) => {
    if (!x) return;
    const px = (i / Math.max(1, values.length - 1)) * W;
    const py = H - ((x - lo) / (hi - lo || 1)) * (H - 4) - 2;
    d += `${d ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
  });
  const bi = values.indexOf(best);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <path d={d} fill="none" stroke="#EC5C30" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
      {bi >= 0 && <circle cx={(bi / Math.max(1, values.length - 1)) * W} cy={H - ((best - lo) / (hi - lo || 1)) * (H - 4) - 2} r={2.5} fill="#B48CFF" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

export default function SpeedTraps({ laps }: { laps: LapData[] }) {
  const ordered = [...laps].sort((a, b) => a.lap_number - b.lap_number);
  const traps = TRAPS.map((t) => {
    const values = ordered.map((l) => (l[t.key] && (l[t.key] as number) > 0 ? (l[t.key] as number) : null));
    const v = values.filter((x): x is number => x !== null).sort((a, b) => a - b);
    return { ...t, values, best: v[v.length - 1] ?? 0, median: v[Math.floor(v.length / 2)] ?? 0, count: v.length };
  });
  if (!traps.some((t) => t.count)) return <p className="py-6 text-center text-subhead text-label-3">No speed-trap data for this session.</p>;

  return (
    <ul className="divide-y divide-hairline">
      {traps.map((t) => (
        <li key={t.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="label-caps text-[0.6875rem] text-label-3">{t.label}</p>
            <Spark values={t.values} best={t.best} />
          </div>
          <dl className="text-right font-mono tabular-nums">
            <dt className="sr-only">Best</dt>
            <dd className="text-[1.25rem] font-bold leading-none text-paper">{t.best || "—"}<span className="ml-1 text-[0.6875rem] font-normal text-label-3">km/h</span></dd>
            <dt className="sr-only">Median</dt>
            <dd className="mt-1 text-[0.6875rem] text-label-3">median {t.median || "—"} · {t.count} laps</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
