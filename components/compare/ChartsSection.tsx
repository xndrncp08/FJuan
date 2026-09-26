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
import { A_COLOR, B_COLOR } from "./constants";
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
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <Key color={B_COLOR} name={b.driver.familyName} />
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
    </div>
  );
}

function Key({ color, name }: { color: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
      {name}
    </span>
  );
}
