/**
 * AdditionalStats Component
 * 
 * Displays secondary career metrics: fastest laps, DNFs, retirement rate, points per race.
 * Used in a 2x2 grid layout.
 * 
 * Features:
 * - Color-coded values (highlighted stats use accent color)
 * - Responsive padding and text sizes
 * - Border separators between cells
 */

import { formatPercentage } from "@/lib/utils/format";
import { DriverStats } from "@/lib/types/driver";

interface AdditionalStatsProps {
  driverStats: DriverStats;
  isDriver1: boolean;          // Determines accent color for highlighted values
}

export default function AdditionalStats({
  driverStats,
  isDriver1,
}: AdditionalStatsProps) {
  // Accent color: red for left driver, white/gray for right
  const accentColor = isDriver1 ? "#E10600" : "rgba(255,255,255,0.7)";

  // Define the four stats to display
  const stats = [
    { label: "Fastest Laps", value: driverStats.totalFastestLaps, highlight: true },
    { label: "DNFs", value: driverStats.dnfCount, highlight: false },
    { label: "Retirement Rate", value: formatPercentage(driverStats.retirementRate), highlight: false },
    { label: "Points / Race", value: driverStats.pointsPerRace.toFixed(2), highlight: true },
  ];

  return (
    <div className="relative overflow-hidden bg-[#111] border border-white/10 h-full">
      {/* Top accent bar - color changes based on driver side */}
      <div className="h-[3px]" style={{ background: accentColor }} />

      {/* Header section with driver name */}
      <div className="p-5 md:p-6 border-b border-white/10">
        <span
          className="label-overline text-xs"
          style={{ color: isDriver1 ? "#E10600" : "rgba(255,255,255,0.5)" }}
        >
          {driverStats.driver.familyName}
        </span>
        <div className="font-condensed font-extrabold text-base uppercase tracking-wide text-white/60 mt-1">
          Additional Stats
        </div>
      </div>

      {/* 2x2 grid of stats - responsive with equal width cells */}
      <div className="grid grid-cols-2 divide-y divide-white/10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 md:p-5"
            style={{
              borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            <div className="stat-label text-[0.6rem] md:text-[0.65rem] mb-1 md:mb-2">
              {stat.label}
            </div>
            <div
              className="font-condensed font-black text-2xl md:text-3xl lg:text-4xl leading-tight"
              style={{
                color: stat.highlight ? accentColor : "rgba(255,255,255,0.7)",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}