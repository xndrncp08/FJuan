"use client";

/**
 * components/compare/ChartsSection.tsx
 *
 * One card, four views of the two careers. A secondary segmented control
 * appears only on views that have a metric to choose.
 */

import { useState } from "react";
import type { DriverStats } from "@/lib/types/driver";
import { Segmented } from "@/components/ui/Segmented";
import { A_COLOR, B_COLOR, alignSeasons } from "./constants";
import { SeasonPerformanceChart, type SeasonMetric } from "./SeasonPerformanceChart";
import { PointsProgressionChart } from "./PointsProgressionChart";
import { WinRateTrendChart } from "./WinRateTrendChart";
import { PerformanceRadarChart } from "./PerformanceRadarChart";

type View = "seasons" | "points" | "rates" | "profile";

const CAPTION: Record<View, string> = {
  seasons: "Season by season",
  points: "Career points, accumulated",
  rates: "Share of races finished on top",
  profile: "Relative strengths — each axis scaled between the two",
};

export function ChartsSection({ a, b }: { a: DriverStats; b: DriverStats }) {
  const [view, setView] = useState<View>("seasons");
  const [metric, setMetric] = useState<SeasonMetric>("wins");
  const [rate, setRate] = useState<"wins" | "podiums">("wins");

  return (
    <div className="card min-w-0 p-5 sm:p-6">
      <div className="instrument-heading flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-headline text-paper">Careers over time</h2>
          <p className="mt-0.5 text-footnote text-label-3">{CAPTION[view]}</p>
        </div>
        <Segmented
          aria-label="Chart"
          size="sm"
          value={view}
          onChange={setView}
          segments={[
            { value: "seasons", label: "Seasons" },
            { value: "points", label: "Points" },
            { value: "rates", label: "Rates" },
            { value: "profile", label: "Profile" },
          ]}
        />
      </div>

      <div className="mt-5 flex min-h-8 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-footnote text-label-2">
          <Key color={A_COLOR} name={a.driver.familyName} />
          <Key color={B_COLOR} name={b.driver.familyName} dashed />
        </div>
        {view === "seasons" && (
          <Segmented
            aria-label="Metric"
            size="sm"
            value={metric}
            onChange={setMetric}
            segments={[
              { value: "wins", label: "Wins" },
              { value: "podiums", label: "Podiums" },
              { value: "poles", label: "Poles" },
              { value: "points", label: "Points" },
            ]}
          />
        )}
        {view === "rates" && (
          <Segmented
            aria-label="Rate"
            size="sm"
            value={rate}
            onChange={setRate}
            segments={[
              { value: "wins", label: "Win rate" },
              { value: "podiums", label: "Podium rate" },
            ]}
          />
        )}
      </div>

      <div className={view === "profile" ? "mt-4 h-[320px]" : "mt-4 h-[260px] sm:h-[300px]"}>
        {view === "seasons" && <SeasonPerformanceChart a={a} b={b} metric={metric} />}
        {view === "points" && <PointsProgressionChart a={a} b={b} />}
        {view === "rates" && <WinRateTrendChart a={a} b={b} metric={rate} />}
        {view === "profile" && <PerformanceRadarChart a={a} b={b} />}
      </div>
      <details className="mt-5 border-t border-hairline pt-4">
        <summary className="cursor-pointer text-footnote font-semibold text-tint">Explore the season values</summary>
        <p className="mt-3 text-caption text-label-3">Season totals from the same career data used in the charts. A dash means the driver did not race that season.</p>
        <div className="mt-3 max-h-72 overflow-auto" tabIndex={0} role="region" aria-label="Season comparison values">
          <table className="w-full text-left text-footnote">
            <caption className="sr-only">Season totals for {a.driver.familyName} and {b.driver.familyName}</caption>
            <thead className="sticky top-0 bg-surface-1 text-label-2"><tr><th scope="col" className="p-2">Season</th><th scope="col" className="p-2">Driver</th><th scope="col" className="p-2 text-right">Wins</th><th scope="col" className="p-2 text-right">Podiums</th><th scope="col" className="p-2 text-right">Points</th></tr></thead>
            <tbody>{alignSeasons(a, b).flatMap((row) => ([{ stats: row.a, driver: a.driver }, { stats: row.b, driver: b.driver }].map(({ stats, driver }) => (
              <tr key={`${row.season}-${driver.driverId}`} className="border-t border-hairline"><th scope="row" className="p-2 font-mono text-caption font-normal">{row.season}</th><td className="p-2">{driver.familyName}</td><td className="p-2 text-right font-mono text-caption">{stats?.wins ?? "—"}</td><td className="p-2 text-right font-mono text-caption">{stats?.podiums ?? "—"}</td><td className="p-2 text-right font-mono text-caption">{stats?.points ?? "—"}</td></tr>
            ))))}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Key({ color, name, dashed = false }: { color: string; name: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-5 border-t-2" style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }} aria-hidden />
      {name}
    </span>
  );
}
