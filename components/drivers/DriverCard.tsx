"use client";

import {
  formatDriverName,
  getNationalityFlag,
  getTeamColor,
  formatPoints,
} from "@/lib/utils/format";

interface DriverCardProps {
  driver: {
    driverId: string;
    permanentNumber?: string;
    givenName: string;
    familyName: string;
    nationality: string;
    currentTeam?: string;
    currentPosition?: string;
    currentPoints?: string;
    currentWins?: string;
    code?: string;
  };
  stats?: {
    totalWins: number;
    totalPodiums: number;
    totalPoles: number;
    totalPoints: number;
  };
  onClick?: () => void;
}

export function DriverCard({ driver, stats, onClick }: DriverCardProps) {
  const teamColor = getTeamColor(driver.currentTeam || "");
  const flag = getNationalityFlag(driver.nationality);
  const driverNum = driver.permanentNumber || driver.code || "—";

  return (
    <div
      className="relative overflow-hidden group cursor-pointer transition-all duration-200"
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(225,6,0,0.35)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Team color top bar */}
      <div className="h-[3px]" style={{ background: teamColor || "#E10600" }} />

      {/* Driver number watermark */}
      <div
        className="absolute top-4 right-4 font-display font-black leading-none pointer-events-none select-none"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: "5rem",
          color: `${teamColor || "#E10600"}14`,
          lineHeight: 1,
        }}
      >
        {driverNum}
      </div>

      <div className="p-6 relative">
        {/* Position badge */}
        {driver.currentPosition && (
          <div
            className="inline-flex items-center mb-4 px-2 py-1"
            style={{
              background: "rgba(225,6,0,0.1)",
              border: "1px solid rgba(225,6,0,0.2)",
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.625rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              P{driver.currentPosition}
            </span>
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
          <div
            className="text-white/45 leading-none"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {driver.givenName}
          </div>
          <div
            className="text-white leading-none"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "1.9rem",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {driver.familyName}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm">{flag}</span>
            <span className="data-readout">{driver.nationality}</span>
          </div>
        </div>

        {/* Team strip */}
        {driver.currentTeam && (
          <div className="mb-5 pb-5 border-b border-white/[0.06]">
            <div
              className="h-px mb-3"
              style={{ background: teamColor || "#E10600", width: "2rem" }}
            />
            <span
              className="text-white/55 text-xs"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {driver.currentTeam}
            </span>
          </div>
        )}

        {/* Stats */}
        <div
          className="grid grid-cols-3 gap-0"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {[
            {
              val:
                driver.currentPoints ||
                (stats?.totalPoints ? formatPoints(stats.totalPoints) : "0"),
              lab: "PTS",
              color: "#E10600",
            },
            {
              val: driver.currentWins || stats?.totalWins || "0",
              lab: "Wins",
              color: "white",
            },
            {
              val: stats?.totalPodiums || "0",
              lab: "Pods",
              color: "white",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="py-4 text-center"
              style={{
                borderRight:
                  i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div
                className="font-display font-black leading-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  color: s.color,
                }}
              >
                {s.val}
              </div>
              <div className="stat-label">{s.lab}</div>
            </div>
          ))}
        </div>

        {stats && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
            <div>
              <div className="stat-label">Poles</div>
              <div className="data-readout text-white/70 font-medium">
                {stats.totalPoles}
              </div>
            </div>
            <div>
              <div className="stat-label">Career Pts</div>
              <div className="data-readout text-white/70 font-medium">
                {formatPoints(stats.totalPoints)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
