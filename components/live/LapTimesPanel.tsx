import { LapData, formatLapTime } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  laps: LapData[];
  fastestLap: number;
}

const HEADERS = ["Lap", "S1", "S2", "S3", "Time", "Trap"];
const COLS = "3rem 1fr 1fr 1fr 1fr 5rem";

export default function LapTimesPanel({ laps, fastestLap }: Props) {
  const displayLaps = [...laps].reverse().slice(0, 30);

  return (
    <Panel>
      <div style={{ padding: "1.25rem 1.5rem 0" }}>
        <SectionLabel>Lap Times</SectionLabel>
      </div>
      <div style={{ overflowX: "auto" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "0.5rem 1.5rem", background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {HEADERS.map((h) => (
            <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
          {displayLaps.map((lap) => {
            const isFastest = lap.lap_duration !== null && Math.abs(lap.lap_duration - fastestLap) < 0.001;
            return (
              <div
                key={lap.lap_number}
                style={{
                  display: "grid", gridTemplateColumns: COLS,
                  padding: "0.55rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isFastest ? "rgba(225,6,0,0.06)" : "transparent",
                }}
              >
                <Cell dim>{lap.lap_number}</Cell>
                <Cell dim={!lap.duration_sector_1}>{formatLapTime(lap.duration_sector_1)}</Cell>
                <Cell dim={!lap.duration_sector_2}>{formatLapTime(lap.duration_sector_2)}</Cell>
                <Cell dim={!lap.duration_sector_3}>{formatLapTime(lap.duration_sector_3)}</Cell>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: isFastest ? "#E10600" : lap.lap_duration ? "white" : "rgba(255,255,255,0.2)", fontWeight: isFastest ? 700 : 400 }}>
                  {isFastest ? "⚡ " : ""}{formatLapTime(lap.lap_duration)}
                </div>
                <Cell dim={!lap.st_speed}>{lap.st_speed ? `${lap.st_speed} km/h` : "—"}</Cell>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Cell({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: dim ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)" }}>
      {children}
    </div>
  );
}
