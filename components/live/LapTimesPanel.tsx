import { LapData, formatLapTime } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  laps: LapData[];
  fastestLap: number;
}

// Define column widths for responsive table (min-width ensures scroll on small screens)
const HEADERS = ["Lap", "S1", "S2", "S3", "Time", "Trap"];
const COLS = "minmax(60px, auto) minmax(70px, auto) minmax(70px, auto) minmax(70px, auto) minmax(90px, auto) minmax(80px, auto)";

export default function LapTimesPanel({ laps, fastestLap }: Props) {
  // Show most recent laps first (reverse order)
  const displayLaps = [...laps].reverse().slice(0, 30);

  return (
    <Panel>
      <div className="p-4 md:p-6 pb-0">
        <SectionLabel>Lap Times</SectionLabel>
      </div>

      {/* Horizontal scroll container for mobile */}
      <div className="overflow-x-auto">
        {/* Header row */}
        <div
          className="px-4 md:px-6 py-2 bg-[#0a0a0a] border-b border-white/10"
          style={{ display: "grid", gridTemplateColumns: COLS }}
        >
          {HEADERS.map((h) => (
            <div key={h} className="text-white/30 text-[0.6rem] uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Data rows with max height and scroll */}
        <div className="max-h-[320px] overflow-y-auto">
          {displayLaps.map((lap) => {
            const isFastest =
              lap.lap_duration !== null && Math.abs(lap.lap_duration - fastestLap) < 0.001;
            return (
              <div
                key={lap.lap_number}
                className="px-4 md:px-6 py-2 border-b border-white/5"
                style={{
                  display: "grid",
                  gridTemplateColumns: COLS,
                  background: isFastest ? "rgba(225,6,0,0.06)" : "transparent",
                }}
              >
                <Cell dim={false}>{lap.lap_number}</Cell>
                <Cell dim={!lap.duration_sector_1}>{formatLapTime(lap.duration_sector_1)}</Cell>
                <Cell dim={!lap.duration_sector_2}>{formatLapTime(lap.duration_sector_2)}</Cell>
                <Cell dim={!lap.duration_sector_3}>{formatLapTime(lap.duration_sector_3)}</Cell>
                <div
                  className="font-mono text-xs md:text-sm"
                  style={{
                    color: isFastest ? "#E10600" : lap.lap_duration ? "white" : "rgba(255,255,255,0.2)",
                    fontWeight: isFastest ? 700 : 400,
                  }}
                >
                  {isFastest && "⚡ "}
                  {formatLapTime(lap.lap_duration)}
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

// Helper component for table cells
function Cell({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div className={`font-mono text-xs md:text-sm ${dim ? "text-white/20" : "text-white/70"}`}>
      {children}
    </div>
  );
}