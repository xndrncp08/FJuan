import { DriverStats } from "@/lib/types/driver";
import { StatBattleRow } from "./StatBattleRow";
import { D1_COLOR, D2_COLOR } from "./constants";

interface StatsBattleProps {
  d1: DriverStats;
  d2: DriverStats;
}

export function StatsBattle({ d1, d2 }: StatsBattleProps) {
  const stats = [
    { label: "Total Wins",          d1: d1.totalWins,           d2: d2.totalWins },
    { label: "Total Podiums",       d1: d1.totalPodiums,        d2: d2.totalPodiums },
    { label: "Pole Positions",      d1: d1.totalPoles,          d2: d2.totalPoles },
    { label: "Total Points",        d1: d1.totalPoints,         d2: d2.totalPoints },
    { label: "Fastest Laps",        d1: d1.totalFastestLaps,    d2: d2.totalFastestLaps },
    { label: "Races Entered",       d1: d1.totalRaces,          d2: d2.totalRaces },
    { label: "Win Rate",            d1: d1.winRate,             d2: d2.winRate,           isPercentage: true },
    { label: "Podium Rate",         d1: d1.podiumRate,          d2: d2.podiumRate,        isPercentage: true },
    { label: "Points per Race",     d1: d1.pointsPerRace,       d2: d2.pointsPerRace },
    { label: "Avg Finish Position", d1: d1.avgFinishPosition,   d2: d2.avgFinishPosition, isAverage: true },
    { label: "DNFs",                d1: d1.dnfCount,            d2: d2.dnfCount,          isAverage: true },
    { label: "Retirement Rate",     d1: d1.retirementRate,      d2: d2.retirementRate,    isAverage: true, isPercentage: true },
  ];

  // Tally category leads
  let d1Wins = 0, d2Wins = 0;
  stats.forEach(({ d1: v1, d2: v2, isAverage }) => {
    const pct1 = isAverage ? v2 / (v1 + v2) * 100 : v1 / (v1 + v2) * 100;
    if (pct1 > 50) d1Wins++; else if (pct1 < 50) d2Wins++;
  });

  return (
    <div style={{
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: "3px solid rgba(255,255,255,0.08)",
      animation: "compareSlideUp 0.65s 0.1s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          padding: "1rem clamp(1rem,3vw,1.75rem)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", alignItems: "flex-start",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
            color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: "2px",
          }}>Category Leads</span>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.4rem,4vw,2.2rem)",
            color: D1_COLOR, lineHeight: 1,
          }}>{d1Wins}</span>
        </div>

        <div style={{
          padding: "1rem",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "16px", height: "2px", background: D1_COLOR }} />
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: "0.6rem", letterSpacing: "0.22em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
            }}>Career Statistics</span>
            <div style={{ width: "16px", height: "2px", background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>

        <div style={{
          padding: "1rem clamp(1rem,3vw,1.75rem)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", alignItems: "flex-end",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
            color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: "2px",
          }}>Category Leads</span>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.4rem,4vw,2.2rem)",
            color: D2_COLOR, lineHeight: 1,
          }}>{d2Wins}</span>
        </div>
      </div>

      {/* Stat rows */}
      {stats.map((s, i) => (
        <StatBattleRow key={s.label} {...s} index={i} />
      ))}
    </div>
  );
}