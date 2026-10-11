"use client";

import { useState } from "react";
import Link from "next/link";
import type { SeasonResult } from "@/lib/types/driver";
import { Segmented } from "@/components/ui/Segmented";
import { SelectField } from "@/components/ui/Fields";
import { Card } from "@/components/ui/Card";
import { TeamMark } from "@/components/ui/TeamMark";

type Metric = "points" | "wins" | "podiums";
export function SeasonHistory({ seasons, color, driverName }: { seasons: SeasonResult[]; color: string; driverName: string }) {
  const [metric, setMetric] = useState<Metric>("points");
  const [order, setOrder] = useState("recent");
  const sorted = [...seasons].sort((a, b) => order === "recent" ? Number(b.season) - Number(a.season) : b[metric] - a[metric] || Number(b.season) - Number(a.season));
  const preview = sorted.slice(0, 8);
  const max = Math.max(1, ...seasons.map((s) => s[metric]));
  const best = [...seasons].sort((a, b) => b[metric] - a[metric])[0];

  return <Card padding="none">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline p-5 sm:p-6">
      <div><h2 className="text-title-3 text-paper">Season by season</h2><p className="mt-1 text-footnote text-label-3">{seasons.length} seasons · Best {metric}: {best?.[metric] ?? "—"} in {best?.season ?? "—"}</p></div>
      <Segmented aria-label="Career season metric" value={metric} onChange={setMetric} segments={[{ value: "points", label: "Points" }, { value: "wins", label: "Wins" }, { value: "podiums", label: "Podiums" }]} />
    </div>
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><p className="text-subhead text-label-3">{Math.min(8, seasons.length)} seasons shown. Open the full record below for every value.</p><SelectField label="Season order" value={order} onChange={(e) => setOrder(e.target.value)}><option value="recent">Most recent</option><option value="highest">Highest {metric}</option></SelectField></div>
      <ol className="space-y-3" aria-label={`${driverName} ${metric} by season`}>
        {preview.map((s) => <li key={s.season} className="grid grid-cols-[3rem_minmax(0,1fr)_3.5rem] items-center gap-4"><Link href={`/drivers?season=${s.season}`} className="font-mono text-footnote text-label-2 underline-offset-4 hover:text-tint hover:underline">{s.season}</Link><div className="h-2 bg-fill-1" aria-hidden><div className="h-full" style={{ width: `${s[metric] / max * 100}%`, background: color }} /></div><span className="text-right font-mono text-footnote text-paper">{s[metric]}</span></li>)}
      </ol>
    </div>
    <details className="group border-t border-hairline">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-5 text-subhead font-semibold text-tint sm:px-6">Explore the full season record <span className="font-mono text-caption text-label-3">{seasons.length} seasons</span></summary>
      <p className="px-5 pb-3 text-caption text-label-3 sm:px-6">Points systems differ by era. Final is championship position; the current season is still in progress. Scroll horizontally to see every column on a phone.</p>
      <div tabIndex={0} role="region" aria-label="Full career season values" className="table-scroll max-h-[480px]">
        <table className="data-table min-w-[700px]">
          <caption className="sr-only">{driverName} complete season results</caption>
          <thead className="sticky top-0 z-10 bg-surface-1"><tr>{["Year", "Team", "Points", "Wins", "Podiums", "Poles", "Races", "Final"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{sorted.map((s) => <tr key={s.season}><th scope="row"><Link href={`/drivers?season=${s.season}`} className="font-mono text-footnote text-paper hover:text-tint">{s.season}</Link></th><td><span className="flex items-center gap-2"><TeamMark team={s.team} size="sm" />{s.team}</span></td>{[s.points, s.wins, s.podiums, s.poles, s.races].map((v, i) => <td key={i} className="font-mono text-footnote">{v}</td>)}<td className="font-mono text-footnote">{s.position ? `P${s.position}` : "—"}</td></tr>)}</tbody>
        </table>
      </div>
    </details>
  </Card>;
}
