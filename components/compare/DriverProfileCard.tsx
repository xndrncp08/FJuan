/**
 * DriverProfileCard Component
 * 
 * Displays detailed personal information and career highlights for a single driver.
 * Used twice on the compare page (left and right).
 * 
 * Features:
 * - Driver number as large watermark background
 * - Name, nationality, current team
 * - Career span, championships won
 * - Responsive text scaling for mobile
 */

import { DriverStats } from "@/lib/types/driver";

interface DriverProfileCardProps {
  driverStats: DriverStats;    // Complete driver statistics object
  isDriver1: boolean;          // Determines accent color (red for driver1, white/gray for driver2)
  currentTeam: string;         // Most recent team name
}

export default function DriverProfileCard({
  driverStats,
  isDriver1,
  currentTeam,
}: DriverProfileCardProps) {
  // Dynamic accent color: F1 red for left driver, muted white for right
  const accentColor = isDriver1 ? "#E10600" : "rgba(255,255,255,0.55)";

  return (
    <div className="relative overflow-hidden bg-[#111] border border-white/10 h-full">
      {/* Top colored accent bar */}
      <div className="h-[3px]" style={{ background: accentColor }} />

      {/* Driver number as huge transparent watermark */}
      <div
        className="absolute top-4 right-4 md:top-6 md:right-6 font-condensed font-black pointer-events-none select-none leading-none"
        style={{
          fontSize: "clamp(5rem, 12vw, 7rem)",
          color: `${isDriver1 ? "#E10600" : "white"}0a`, // 6-7% opacity
        }}
      >
        {driverStats.driver.permanentNumber || "#"}
      </div>

      <div className="p-5 md:p-8 relative">
        {/* Driver label badge */}
        <div
          className="inline-flex items-center mb-4 md:mb-5 px-2 py-1"
          style={{
            background: isDriver1 ? "rgba(225,6,0,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${isDriver1 ? "rgba(225,6,0,0.25)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <span
            className="font-condensed font-bold text-[0.6rem] tracking-[0.15em] uppercase"
            style={{ color: accentColor }}
          >
            Driver {isDriver1 ? "1" : "2"}
          </span>
        </div>

        {/* Driver name block */}
        <div className="mb-5 md:mb-6">
          <div className="font-condensed font-semibold text-sm uppercase tracking-wide text-white/40">
            {driverStats.driver.givenName}
          </div>
          <div className="font-condensed font-black text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-tight">
            {driverStats.driver.familyName}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6" style={{ background: accentColor }} />
            <span className="data-readout text-xs">{driverStats.driver.nationality}</span>
          </div>
        </div>

        {/* Stats table: Current Team, Career Span, Championships */}
        <div className="border-t border-white/10 pt-5 space-y-4">
          {[
            { label: "Current Team", value: currentTeam },
            { label: "Career Span", value: `${driverStats.careerSpan.yearsActive} years` },
            { label: "Championships", value: driverStats.totalChampionships, highlight: true },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="stat-label text-[0.6rem] md:text-[0.65rem] whitespace-nowrap">
                {row.label}
              </span>
              <span
                className="font-condensed text-right"
                style={{
                  fontWeight: row.highlight ? 900 : 700,
                  fontSize: row.highlight ? "clamp(1.2rem, 5vw, 1.75rem)" : "0.875rem",
                  color: row.highlight ? accentColor : "rgba(255,255,255,0.75)",
                  lineHeight: 1,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}