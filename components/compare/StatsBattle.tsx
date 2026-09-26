/**
 * components/compare/StatsBattle.tsx
 *
 * Career stats as a two-sided list: each row shows both values and a
 * split bar weighted by share. The better value is emphasised; for
 * "lower is better" stats the split is inverted.
 */

import type { DriverStats } from "@/lib/types/driver";
import { formatPercentage } from "@/lib/utils/format";
import { A_COLOR, B_COLOR } from "./constants";

export interface BattleRow {
  label: string;
  a: number;
  b: number;
  kind?: "count" | "percent" | "decimal";
  lowerIsBetter?: boolean;
}

export function battleRows(a: DriverStats, b: DriverStats): BattleRow[] {
  return [
    { label: "Wins", a: a.totalWins, b: b.totalWins },
    { label: "Podiums", a: a.totalPodiums, b: b.totalPodiums },
    { label: "Pole positions", a: a.totalPoles, b: b.totalPoles },
    { label: "Points", a: a.totalPoints, b: b.totalPoints },
    { label: "Fastest laps", a: a.totalFastestLaps, b: b.totalFastestLaps },
    { label: "Races", a: a.totalRaces, b: b.totalRaces },
    { label: "Win rate", a: a.winRate, b: b.winRate, kind: "percent" },
    { label: "Podium rate", a: a.podiumRate, b: b.podiumRate, kind: "percent" },
    { label: "Points per race", a: a.pointsPerRace, b: b.pointsPerRace, kind: "decimal" },
    { label: "Average finish", a: a.avgFinishPosition, b: b.avgFinishPosition, kind: "decimal", lowerIsBetter: true },
    { label: "Retirements", a: a.dnfCount, b: b.dnfCount, lowerIsBetter: true },
    { label: "Retirement rate", a: a.retirementRate, b: b.retirementRate, kind: "percent", lowerIsBetter: true },
  ];
}

/** Which side leads a row: -1 = A, 1 = B, 0 = tie. */
export function leader(r: BattleRow): -1 | 0 | 1 {
  if (r.a === r.b) return 0;
  const aBetter = r.lowerIsBetter ? r.a < r.b : r.a > r.b;
  return aBetter ? -1 : 1;
}

function fmt(v: number, kind: BattleRow["kind"]) {
  if (v == null || Number.isNaN(v)) return "—";
  if (kind === "percent") return formatPercentage(v);
  if (kind === "decimal") return v.toFixed(1);
  return Math.round(v).toLocaleString();
}

export function StatsBattle({ rows }: { rows: BattleRow[] }) {
  return (
    <div className="card overflow-hidden">
      <ul>
        {rows.map((r) => {
          const lead = leader(r);
          const total = r.a + r.b;
          let shareA = total > 0 ? (r.a / total) * 100 : 50;
          if (r.lowerIsBetter && total > 0) shareA = 100 - shareA;
          return (
            <li key={r.label} className="border-b border-hairline px-4 py-3.5 last:border-0 sm:px-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-3">
                <span className={`tabular text-callout ${lead === -1 ? "font-bold text-paper" : "text-label-3"}`}>{fmt(r.a, r.kind)}</span>
                <span className="text-center text-footnote text-label-2">
                  {r.label}
                  {r.lowerIsBetter && <span className="sr-only"> (lower is better)</span>}
                </span>
                <span className={`tabular text-right text-callout ${lead === 1 ? "font-bold text-paper" : "text-label-3"}`}>{fmt(r.b, r.kind)}</span>
              </div>
              <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden" aria-hidden>
                <div className="h-full" style={{ width: `${shareA}%`, background: A_COLOR, opacity: lead === 1 ? 0.35 : 1 }} />
                <div className="h-full flex-1" style={{ background: B_COLOR, opacity: lead === -1 ? 0.35 : 1 }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
