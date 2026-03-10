import { Driver, LapData, formatLapTime, teamColor } from "./types";

interface Props {
  laps: LapData[];
  driver: Driver | null;
}

export default function StatsSummary({ laps, driver }: Props) {
  const validLaps = laps.filter(
    (l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap,
  );
  const fastest =
    validLaps.length > 0
      ? Math.min(...validLaps.map((l) => l.lap_duration!))
      : null;
  const avg =
    validLaps.length > 0
      ? validLaps.reduce((s, l) => s + l.lap_duration!, 0) / validLaps.length
      : null;
  const topTrap = laps.reduce((max, l) => Math.max(max, l.st_speed || 0), 0);
  const color = driver ? teamColor(driver.team_colour) : "#E10600";

  const stats = [
    { label: "Total Laps", value: String(laps.length) },
    { label: "Fastest Lap", value: formatLapTime(fastest) },
    { label: "Avg Lap", value: formatLapTime(avg) },
    { label: "Top Trap Speed", value: topTrap > 0 ? `${topTrap} km/h` : "—" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "1px",
        background: "rgba(255,255,255,0.05)",
        marginBottom: "2rem",
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "#0e0e0e",
            padding: "1.1rem 1.25rem",
            borderTop: `2px solid ${color}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "0.3rem",
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "1.3rem",
              color: "white",
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
