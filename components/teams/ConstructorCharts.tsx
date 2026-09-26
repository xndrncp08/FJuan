/**
 * components/teams/ConstructorCharts.tsx
 *
 * Three views of the constructors' season, switched with a segmented
 * control: points, all-time titles, and share of points. All three are
 * plain HTML bars — easy to read on a phone and real text for screen
 * readers — with team livery as the bar color.
 */
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { shortTeamName } from "@/lib/theme/teams";

interface Team {
  constructorId: string;
  name: string;
  points: number;
  wins: number;
  championships: number;
  color: string;
}

type View = "points" | "titles" | "share";

export default function ConstructorCharts({ teams, season }: { teams: Team[]; season: string }) {
  const [view, setView] = useState<View>("points");

  const byPoints = [...teams].sort((a, b) => b.points - a.points);
  const byTitles = [...teams].filter((t) => t.championships > 0).sort((a, b) => b.championships - a.championships);
  const total = teams.reduce((s, t) => s + t.points, 0);

  const caption =
    view === "points" ? `${season} points, all constructors` : view === "titles" ? "Constructors’ titles, all time" : `Share of all ${season} points`;

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-headline text-paper">Compare teams</h2>
          <p className="mt-0.5 text-footnote text-label-3">{caption}</p>
        </div>
        <Segmented
          aria-label="Chart"
          size="sm"
          value={view}
          onChange={setView}
          segments={[
            { value: "points", label: "Points" },
            { value: "titles", label: "Titles" },
            { value: "share", label: "Share" },
          ]}
        />
      </div>

      {view === "points" && <Bars rows={byPoints.map((t) => ({ id: t.constructorId, name: shortTeamName(t.name, t.constructorId), value: t.points, color: t.color }))} />}

      {view === "titles" &&
        (byTitles.length ? (
          <Bars rows={byTitles.map((t) => ({ id: t.constructorId, name: shortTeamName(t.name, t.constructorId), value: t.championships, color: t.color }))} />
        ) : (
          <p className="py-8 text-center text-subhead text-label-3">None of this season’s teams has won a constructors’ title.</p>
        ))}

      {view === "share" && (
        <div>
          {/* One stacked bar, like a storage meter. */}
          <div className="flex h-4 w-full overflow-hidden bg-fill-1" role="img" aria-label="Points share by team">
            {byPoints.map((t) =>
              t.points > 0 ? (
                <div
                  key={t.constructorId}
                  className="h-full border-r-2 border-surface last:border-r-0"
                  style={{ width: `${(t.points / Math.max(total, 1)) * 100}%`, background: t.color }}
                  title={`${shortTeamName(t.name, t.constructorId)}: ${((t.points / Math.max(total, 1)) * 100).toFixed(1)}%`}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {byPoints.map((t) => (
              <li key={t.constructorId} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-subhead text-label-2">{shortTeamName(t.name, t.constructorId)}</span>
                <span className="tabular text-subhead font-semibold text-paper">
                  {total > 0 ? ((t.points / total) * 100).toFixed(1) : "0.0"}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function Bars({ rows }: { rows: { id: string; name: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 sm:grid-cols-[8rem_1fr_3.5rem]">
          <span className="truncate text-subhead text-label-2">{r.name}</span>
          <div className="h-2.5 overflow-hidden bg-fill-1" aria-hidden>
            <div className="h-full" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: r.color }} />
          </div>
          <span className="tabular text-right text-subhead font-semibold text-paper">{r.value.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
