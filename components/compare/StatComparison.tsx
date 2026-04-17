/**
 * StatComparison Component
 * 
 * Displays a series of statistical comparisons using horizontal percentage bars.
 * Each stat has a left value (driver1), a middle bar showing percentage split,
 * and a right value (driver2).
 * 
 * Features:
 * - Animated bar widths (transition on data change)
 * - Percentage labels inside bars when space permits
 * - Handles both regular numbers, percentages, and averages
 * - Fully responsive: bars shrink text on mobile
 */

import { formatPercentage } from "@/lib/utils/format";

interface CompareStatItem {
  label: string;
  d1: number;
  d2: number;
  isPercentage?: boolean;   // If true, format as percentage string
  isAverage?: boolean;      // If true, average finish position (lower is better)
}

interface StatComparisonProps {
  compareStats: CompareStatItem[];
}

export default function StatComparison({ compareStats }: StatComparisonProps) {
  /**
   * Calculate percentage widths for the left (driver1) and right (driver2) sides.
   * For averages (like finish position), the bar represents inverse proportion
   * because lower average is better.
   */
  const getPercentageWidth = (
    d1: number,
    d2: number,
    isAverage: boolean = false
  ): { d1: number; d2: number } => {
    if (isAverage) {
      // For averages: lower number = better, so we invert the proportion
      const total = d1 + d2;
      return {
        d1: total > 0 ? (d2 / total) * 100 : 50,
        d2: total > 0 ? (d1 / total) * 100 : 50,
      };
    }
    // Regular stats: higher number = better
    const total = d1 + d2;
    return {
      d1: total > 0 ? (d1 / total) * 100 : 50,
      d2: total > 0 ? (d2 / total) * 100 : 50,
    };
  };

  /**
   * Format a numeric value based on stat type.
   * - Percentage: e.g., "45.2%"
   * - Average: one decimal place
   * - Others: rounded integer
   */
  const formatVal = (stat: CompareStatItem, val: number): string => {
    if (stat.isPercentage) return formatPercentage(val);
    if (stat.isAverage) return val.toFixed(1);
    return Math.round(val).toString();
  };

  return (
    <div className="relative overflow-hidden mb-8 md:mb-12 bg-[#111] border border-white/10">
      {/* Top red accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

      <div className="p-5 md:p-8">
        <span className="label-overline block mb-6 md:mb-8">Career Statistics</span>

        <div className="space-y-6 md:space-y-8">
          {compareStats.map((stat, index) => {
            // Calculate percentage split for the bar
            const pct = getPercentageWidth(stat.d1, stat.d2, stat.isAverage);
            // Determine which driver has better performance
            const d1Wins = stat.isAverage ? pct.d1 > pct.d2 : pct.d1 > pct.d2;

            return (
              <div key={index}>
                {/* Stat label - centered */}
                <div className="text-center mb-2 md:mb-3">
                  <span className="font-condensed font-bold text-[0.65rem] md:text-[0.7rem] tracking-[0.15em] uppercase text-white/40">
                    {stat.label}
                  </span>
                </div>

                {/* Comparison row with values and bar */}
                <div className="flex items-center gap-2 md:gap-4">
                  {/* Driver 1 value */}
                  <div className="w-16 md:w-20 text-right">
                    <span
                      className="font-condensed font-black text-xl md:text-2xl lg:text-3xl leading-tight transition-colors"
                      style={{
                        color: d1Wins ? "#E10600" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {formatVal(stat, stat.d1)}
                    </span>
                  </div>

                  {/* Horizontal bar container */}
                  <div className="flex-1 h-8 md:h-10 flex overflow-hidden border border-white/10">
                    {/* Left segment (driver1) - red gradient */}
                    <div
                      className="flex items-center justify-end pr-1 md:pr-2 transition-all duration-500"
                      style={{
                        width: `${pct.d1}%`,
                        background: "linear-gradient(90deg, #8b0000, #E10600)",
                      }}
                    >
                      {/* Show percentage label only if bar is wide enough */}
                      {pct.d1 > 18 && (
                        <span className="font-mono font-bold text-[0.6rem] md:text-[0.65rem] text-white/80">
                          {pct.d1.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {/* Right segment (driver2) - white gradient */}
                    <div
                      className="flex items-center justify-start pl-1 md:pl-2 transition-all duration-500"
                      style={{
                        width: `${pct.d2}%`,
                        background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.7))",
                      }}
                    >
                      {pct.d2 > 18 && (
                        <span className="font-mono font-bold text-[0.6rem] md:text-[0.65rem] text-black/60">
                          {pct.d2.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Driver 2 value */}
                  <div className="w-16 md:w-20 text-left">
                    <span
                      className="font-condensed font-black text-xl md:text-2xl lg:text-3xl leading-tight transition-colors"
                      style={{
                        color: !d1Wins ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {formatVal(stat, stat.d2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}