/**
 * components/live/StatsSummary.tsx
 *
 * Five headline stat cards (total laps, fastest lap, avg lap, consistency,
 * top speed trap). Each card's top accent uses the selected driver's real
 * team color, same as DriverSelector; everything else is the shared
 * brand palette.
 */
import { Driver, LapData, formatLapTime, teamColor } from "./types";
import { RED, RGB } from "@/lib/theme/palette";

interface Props {
  laps: LapData[];
  driver: Driver | null;
}

export default function StatsSummary({ laps, driver }: Props) {
  const valid = laps.filter(
    (l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap,
  );
  const fastest =
    valid.length > 0 ? Math.min(...valid.map((l) => l.lap_duration!)) : null;
  const avg =
    valid.length > 0
      ? valid.reduce((s, l) => s + l.lap_duration!, 0) / valid.length
      : null;
  const topTrap = laps.reduce((max, l) => Math.max(max, l.st_speed || 0), 0);
  const pitLaps = laps.filter((l) => l.is_pit_out_lap).length;
  const consistent = fastest
    ? valid.filter((l) => l.lap_duration! - fastest < 1.0).length
    : 0;
  const consistency =
    valid.length > 0 ? Math.round((consistent / valid.length) * 100) : null;

  const color = driver ? teamColor(driver.team_colour) : RED;

  const stats = [
    {
      label: "Total Laps",
      value: String(laps.length),
      sub: pitLaps > 0 ? `${pitLaps} pit` : undefined,
    },
    { label: "Fastest Lap", value: formatLapTime(fastest), sub: undefined },
    {
      label: "Avg Lap",
      value: formatLapTime(avg),
      sub:
        fastest && avg ? `+${(avg - fastest).toFixed(3)}s off PB` : undefined,
    },
    {
      label: "Consistency",
      value: consistency !== null ? `${consistency}%` : "—",
      sub: "laps within 1s of PB",
    },
    {
      label: "Top Trap",
      value: topTrap > 0 ? String(topTrap) : "—",
      sub: topTrap > 0 ? "km/h" : undefined,
    },
  ];

  return (
    <>
      <div
        className="live-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "2px",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: `rgba(${RGB.paper},0.02)`,
              border: `1px solid rgba(${RGB.paper},0.07)`,
              borderTopWidth: "2px",
              borderTopColor: color,
              padding: "1rem 1.25rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: `rgba(${RGB.paper},0.25)`,
                marginBottom: "0.4rem",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(1rem, 2.2vw, 1.4rem)",
                color: `rgb(${RGB.paper})`,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
            {s.sub && (
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.48rem",
                  color: `rgba(${RGB.paper},0.2)`,
                  marginTop: "0.3rem",
                  letterSpacing: "0.06em",
                }}
              >
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 800px) { .live-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 500px) { .live-stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
