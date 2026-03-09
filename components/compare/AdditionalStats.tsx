import { formatPercentage } from "@/lib/utils/format";
import { DriverStats } from "@/lib/types/driver";

interface AdditionalStatsProps {
  driverStats: DriverStats;
  isDriver1: boolean;
}

export default function AdditionalStats({
  driverStats,
  isDriver1,
}: AdditionalStatsProps) {
  const accentColor = isDriver1 ? "#E10600" : "rgba(255,255,255,0.7)";

  const stats = [
    {
      label: "Fastest Laps",
      value: driverStats.totalFastestLaps,
      highlight: true,
    },
    { label: "DNFs", value: driverStats.dnfCount, highlight: false },
    {
      label: "Retirement Rate",
      value: formatPercentage(driverStats.retirementRate),
      highlight: false,
    },
    {
      label: "Points / Race",
      value: driverStats.pointsPerRace.toFixed(2),
      highlight: true,
    },
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="h-[3px]" style={{ background: accentColor }} />

      <div
        className="p-6 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <span
          className="label-overline"
          style={{ color: isDriver1 ? "#E10600" : "rgba(255,255,255,0.5)" }}
        >
          {driverStats.driver.familyName}
        </span>
        <div
          className="mt-1"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Additional Stats
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5"
            style={{
              borderRight:
                i % 2 === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            <div className="stat-label mb-2">{stat.label}</div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: "2rem",
                lineHeight: 1,
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
