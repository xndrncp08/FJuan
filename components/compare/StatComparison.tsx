import { formatPercentage } from "@/lib/utils/format";

interface CompareStatItem {
  label: string;
  d1: number;
  d2: number;
  isPercentage?: boolean;
  isAverage?: boolean;
}

interface StatComparisonProps {
  compareStats: CompareStatItem[];
}

export default function StatComparison({ compareStats }: StatComparisonProps) {
  const getPercentageWidth = (
    d1: number,
    d2: number,
    isAverage: boolean = false,
  ) => {
    if (isAverage) {
      const total = d1 + d2;
      return {
        d1: total > 0 ? (d2 / total) * 100 : 50,
        d2: total > 0 ? (d1 / total) * 100 : 50,
      };
    }
    const total = d1 + d2;
    return {
      d1: total > 0 ? (d1 / total) * 100 : 50,
      d2: total > 0 ? (d2 / total) * 100 : 50,
    };
  };

  const formatVal = (stat: CompareStatItem, val: number) => {
    if (stat.isPercentage) return formatPercentage(val);
    if (stat.isAverage) return val.toFixed(1);
    return Math.round(val);
  };

  return (
    <div
      className="relative overflow-hidden mb-10"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

      <div className="p-8">
        <span className="label-overline block mb-8">Career Statistics</span>

        <div className="space-y-8">
          {compareStats.map((stat, index) => {
            const pct = getPercentageWidth(
              stat.d1,
              stat.d2,
              stat.isAverage || false,
            );
            const d1Wins = pct.d1 > pct.d2;

            return (
              <div key={index}>
                {/* Label */}
                <div className="text-center mb-3">
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.6875rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {stat.label}
                  </span>
                </div>

                {/* Comparison row */}
                <div className="flex items-center gap-4">
                  {/* D1 value */}
                  <div className="w-20 text-right">
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: "1.75rem",
                        color: d1Wins ? "#E10600" : "rgba(255,255,255,0.6)",
                        lineHeight: 1,
                      }}
                    >
                      {formatVal(stat, stat.d1)}
                    </span>
                  </div>

                  {/* Bar */}
                  <div
                    className="flex-1 h-10 flex overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="flex items-center justify-end pr-2 transition-all duration-500"
                      style={{
                        width: `${pct.d1}%`,
                        background: "linear-gradient(90deg, #8b0000, #E10600)",
                      }}
                    >
                      {pct.d1 > 18 && (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {pct.d1.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-start pl-2 transition-all duration-500"
                      style={{
                        width: `${pct.d2}%`,
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.7))",
                      }}
                    >
                      {pct.d2 > 18 && (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            color: "rgba(0,0,0,0.6)",
                          }}
                        >
                          {pct.d2.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* D2 value */}
                  <div className="w-20 text-left">
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: "1.75rem",
                        color: !d1Wins
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.5)",
                        lineHeight: 1,
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
