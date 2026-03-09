import { DriverStats } from "@/lib/types/driver";

interface DriverProfileCardProps {
  driverStats: DriverStats;
  isDriver1: boolean;
  currentTeam: string;
}

export default function DriverProfileCard({
  driverStats,
  isDriver1,
  currentTeam,
}: DriverProfileCardProps) {
  const accentColor = isDriver1 ? "#E10600" : "rgba(255,255,255,0.55)";

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Top accent */}
      <div className="h-[3px]" style={{ background: accentColor }} />

      {/* Number watermark */}
      <div
        className="absolute top-4 right-5 font-display font-black pointer-events-none select-none leading-none"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: "7rem",
          color: `${isDriver1 ? "#E10600" : "rgba(255,255,255,1)"}0a`,
          lineHeight: 1,
        }}
      >
        {driverStats.driver.permanentNumber || "#"}
      </div>

      <div className="p-8 relative">
        {/* Driver label */}
        <div
          className="inline-flex items-center mb-5 px-2 py-1"
          style={{
            background: isDriver1
              ? "rgba(225,6,0,0.1)"
              : "rgba(255,255,255,0.05)",
            border: `1px solid ${isDriver1 ? "rgba(225,6,0,0.25)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "0.625rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: accentColor,
            }}
          >
            Driver {isDriver1 ? "1" : "2"}
          </span>
        </div>

        {/* Name */}
        <div className="mb-6">
          <div
            className="leading-none"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: "1.1rem",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.04em",
            }}
          >
            {driverStats.driver.givenName}
          </div>
          <div
            className="text-white leading-none"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "2.5rem",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {driverStats.driver.familyName}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6" style={{ background: accentColor }} />
            <span className="data-readout">
              {driverStats.driver.nationality}
            </span>
          </div>
        </div>

        {/* Stats table */}
        <div className="border-t border-white/[0.06] pt-6 space-y-4">
          {[
            { label: "Current Team", value: currentTeam },
            {
              label: "Career Span",
              value: `${driverStats.careerSpan.yearsActive} years`,
            },
            {
              label: "Championships",
              value: driverStats.totalChampionships,
              highlight: true,
            },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="stat-label" style={{ marginTop: 0 }}>
                {row.label}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: row.highlight ? 900 : 700,
                  fontSize: row.highlight ? "1.75rem" : "0.875rem",
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
