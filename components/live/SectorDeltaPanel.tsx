"use client";

import { LapData, formatLapTime } from "./types";

function deltaColor(delta: number | null): string {
  if (delta === null) return "rgba(255,255,255,0.15)";
  if (delta <= 0)    return "#4ade80"; // faster than PB
  if (delta < 0.3)  return "#f5a623"; // close
  return "#E10600";                    // slower
}

function deltaLabel(delta: number | null): string {
  if (delta === null) return "—";
  return `${delta <= 0 ? "" : "+"}${delta.toFixed(3)}s`;
}

function pbSector(laps: LapData[], key: keyof LapData): number | null {
  const vals = laps.map((l) => l[key] as number | null).filter((v): v is number => v !== null && v > 0);
  return vals.length > 0 ? Math.min(...vals) : null;
}

interface Props { laps: LapData[] }

export default function SectorDeltaPanel({ laps }: Props) {
  const valid = laps.filter((l) => !l.is_pit_out_lap && l.lap_duration);
  const pbS1  = pbSector(valid, "duration_sector_1");
  const pbS2  = pbSector(valid, "duration_sector_2");
  const pbS3  = pbSector(valid, "duration_sector_3");

  const display = [...valid].reverse().slice(0, 8);

  if (display.length === 0) {
    return (
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.06em" }}>
        No sector data available.
      </div>
    );
  }

  const headerStyle: React.CSSProperties = {
    fontFamily: "'Rajdhani', sans-serif", fontSize: "0.48rem",
    fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
    color: "rgba(255,255,255,0.2)", textAlign: "center",
  };

  return (
    <div>
      {/* PB row */}
      <div style={{
        display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr",
        gap: "2px", marginBottom: "4px",
        padding: "0.5rem 0.6rem",
        background: "rgba(225,6,0,0.05)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        borderLeft: "2px solid #E10600",
      }}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E10600", alignSelf: "center" }}>
          PB
        </div>
        {[pbS1, pbS2, pbS3].map((pb, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={headerStyle}>S{i + 1}</div>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.7rem", color: "white" }}>
              {formatLapTime(pb)}
            </div>
          </div>
        ))}
      </div>

      {/* Delta rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {display.map((lap) => {
          const d1 = lap.duration_sector_1 && pbS1 ? lap.duration_sector_1 - pbS1 : null;
          const d2 = lap.duration_sector_2 && pbS2 ? lap.duration_sector_2 - pbS2 : null;
          const d3 = lap.duration_sector_3 && pbS3 ? lap.duration_sector_3 - pbS3 : null;
          return (
            <div key={lap.lap_number} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr",
              gap: "2px", padding: "0.4rem 0.6rem",
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>
                L{lap.lap_number}
              </div>
              {[d1, d2, d3].map((delta, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.62rem", color: deltaColor(delta) }}>
                    {deltaLabel(delta)}
                  </div>
                  {delta !== null && (
                    <div style={{ height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "3px", position: "relative" }}>
                      <div style={{
                        position: "absolute",
                        left: delta <= 0 ? `${50 + Math.max(delta * 40, -50)}%` : "50%",
                        width: `${Math.min(Math.abs(delta) * 40, 50)}%`,
                        height: "100%",
                        background: deltaColor(delta),
                        opacity: 0.7,
                      }} />
                      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.1)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: "0.6rem", fontFamily: "'Rajdhani', sans-serif",
        fontSize: "0.48rem", fontWeight: 600, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.15)",
        display: "flex", gap: "1rem",
      }}>
        <span style={{ color: "#4ade80" }}>Green</span> = faster than PB &nbsp;
        <span style={{ color: "#f5a623" }}>Amber</span> = &lt;0.3s off &nbsp;
        <span style={{ color: "#E10600" }}>Red</span> = &gt;0.3s off
      </div>
    </div>
  );
}