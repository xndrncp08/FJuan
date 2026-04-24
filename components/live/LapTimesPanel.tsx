import { LapData, formatLapTime } from "./types";

interface Props { laps: LapData[]; fastestLap: number }

function pbSector(laps: LapData[], key: keyof LapData): number | null {
  const vals = laps.map((l) => l[key] as number | null).filter((v): v is number => v !== null && v > 0);
  return vals.length > 0 ? Math.min(...vals) : null;
}

function sectorColor(val: number | null, best: number | null): string {
  if (!val || !best) return "rgba(255,255,255,0.2)";
  const d = val - best;
  if (d <= 0.001) return "#4ade80";
  if (d < 0.3)   return "#f5a623";
  return "rgba(255,255,255,0.55)";
}

const COLS = "36px 1fr 1fr 1fr 1fr 86px";

export default function LapTimesPanel({ laps, fastestLap }: Props) {
  const display = [...laps].reverse().slice(0, 40);
  const pbS1 = pbSector(laps, "duration_sector_1");
  const pbS2 = pbSector(laps, "duration_sector_2");
  const pbS3 = pbSector(laps, "duration_sector_3");

  return (
    <div style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: COLS,
        padding: "0.5rem 0.75rem",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 2,
      }}>
        {["Lap", "S1", "S2", "S3", "Time", "Trap"].map((h) => (
          <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: "520px", overflowY: "auto" }}>
        {display.map((lap, idx) => {
          const isFastest = lap.lap_duration !== null && Math.abs(lap.lap_duration - fastestLap) < 0.001;
          const isPit     = lap.is_pit_out_lap;
          return (
            <div key={lap.lap_number} style={{
              display: "grid", gridTemplateColumns: COLS,
              padding: "0.45rem 0.75rem",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              background: isFastest ? "rgba(225,6,0,0.06)" : isPit ? "rgba(245,166,35,0.03)" : idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
              alignItems: "center",
            }}>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.58rem", color: isFastest ? "#E10600" : isPit ? "#f5a623" : "rgba(255,255,255,0.3)" }}>
                {lap.lap_number}
              </div>
              {[
                { val: lap.duration_sector_1, pb: pbS1 },
                { val: lap.duration_sector_2, pb: pbS2 },
                { val: lap.duration_sector_3, pb: pbS3 },
              ].map((s, i) => (
                <div key={i} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 600, color: sectorColor(s.val, s.pb) }}>
                  {formatLapTime(s.val)}
                </div>
              ))}
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: isFastest ? "0.65rem" : "0.6rem", color: isFastest ? "#E10600" : isPit ? "#f5a623" : "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: "3px" }}>
                {isFastest && <span style={{ fontSize: "0.5rem" }}>⚡</span>}
                {isPit ? <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.48rem", letterSpacing: "0.08em" }}>PIT OUT</span> : formatLapTime(lap.lap_duration)}
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", fontWeight: 600, color: lap.st_speed ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)", textAlign: "right" }}>
                {lap.st_speed ? `${lap.st_speed}` : "—"}
                {lap.st_speed && <span style={{ fontSize: "0.42rem", marginLeft: "2px", color: "rgba(255,255,255,0.2)" }}>km/h</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key */}
      <div style={{
        padding: "0.5rem 0.75rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: "1.2rem", flexWrap: "wrap",
        fontFamily: "'Rajdhani', sans-serif", fontSize: "0.45rem",
        fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.15)",
      }}>
        <span><span style={{ color: "#4ade80" }}>Green</span> = sector PB</span>
        <span><span style={{ color: "#f5a623" }}>Amber</span> = &lt;0.3s off</span>
        <span>⚡ = fastest lap</span>
      </div>
    </div>
  );
}