/**
 * components/live/SectorDeltaPanel.tsx
 *
 * Per-lap sector deltas vs. personal best. Green/amber/red delta tiers are
 * the same functional telemetry palette used in LapTimesPanel — kept
 * separate from the brand palette on purpose (see that file's header
 * comment). RED here is now the shared brand RED rather than a one-off hex.
 */
"use client";

import { LapData, formatLapTime } from "./types";
import { RED, RGB } from "@/lib/theme/palette";

function deltaColor(delta: number | null): string {
  if (delta === null) return `rgba(${RGB.paper},0.15)`;
  if (delta <= 0) return "#4ade80"; // faster than PB
  if (delta < 0.3) return "#f5a623"; // close
  return RED; // slower
}

function deltaLabel(delta: number | null): string {
  if (delta === null) return "—";
  return `${delta <= 0 ? "" : "+"}${delta.toFixed(3)}s`;
}

function pbSector(laps: LapData[], key: keyof LapData): number | null {
  const vals = laps
    .map((l) => l[key] as number | null)
    .filter((v): v is number => v !== null && v > 0);
  return vals.length > 0 ? Math.min(...vals) : null;
}

interface Props {
  laps: LapData[];
}

export default function SectorDeltaPanel({ laps }: Props) {
  const valid = laps.filter((l) => !l.is_pit_out_lap && l.lap_duration);
  const pbS1 = pbSector(valid, "duration_sector_1");
  const pbS2 = pbSector(valid, "duration_sector_2");
  const pbS3 = pbSector(valid, "duration_sector_3");

  const display = [...valid].reverse().slice(0, 8);

  if (display.length === 0) {
    return (
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          color: `rgba(${RGB.paper},0.15)`,
          letterSpacing: "0.06em",
        }}
      >
        No sector data available.
      </div>
    );
  }

  const headerStyle: React.CSSProperties = {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.48rem",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: `rgba(${RGB.paper},0.2)`,
    textAlign: "center",
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40px 1fr 1fr 1fr",
          gap: "2px",
          marginBottom: "4px",
          padding: "0.5rem 0.6rem",
          background: `rgba(${RGB.red},0.06)`,
          borderTop: `1px solid rgba(${RGB.paper},0.07)`,
          borderRight: `1px solid rgba(${RGB.paper},0.07)`,
          borderBottom: `1px solid rgba(${RGB.paper},0.07)`,
          borderLeft: `2px solid ${RED}`,
        }}
      >
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.48rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: RED,
            alignSelf: "center",
          }}
        >
          PB
        </div>
        {[pbS1, pbS2, pbS3].map((pb, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={headerStyle}>S{i + 1}</div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.7rem",
                color: `rgb(${RGB.paper})`,
              }}
            >
              {formatLapTime(pb)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {display.map((lap) => {
          const d1 =
            lap.duration_sector_1 && pbS1 ? lap.duration_sector_1 - pbS1 : null;
          const d2 =
            lap.duration_sector_2 && pbS2 ? lap.duration_sector_2 - pbS2 : null;
          const d3 =
            lap.duration_sector_3 && pbS3 ? lap.duration_sector_3 - pbS3 : null;
          return (
            <div
              key={lap.lap_number}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 1fr",
                gap: "2px",
                padding: "0.4rem 0.6rem",
                background: `rgba(${RGB.paper},0.01)`,
                border: `1px solid rgba(${RGB.paper},0.05)`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: `rgba(${RGB.paper},0.3)`,
                  alignSelf: "center",
                }}
              >
                L{lap.lap_number}
              </div>
              {[d1, d2, d3].map((delta, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Russo One', sans-serif",
                      fontSize: "0.62rem",
                      color: deltaColor(delta),
                    }}
                  >
                    {deltaLabel(delta)}
                  </div>
                  {delta !== null && (
                    <div
                      style={{
                        height: "2px",
                        background: `rgba(${RGB.paper},0.05)`,
                        marginTop: "3px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left:
                            delta <= 0
                              ? `${50 + Math.max(delta * 40, -50)}%`
                              : "50%",
                          width: `${Math.min(Math.abs(delta) * 40, 50)}%`,
                          height: "100%",
                          background: deltaColor(delta),
                          opacity: 0.7,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: 0,
                          bottom: 0,
                          width: "1px",
                          background: `rgba(${RGB.paper},0.1)`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "0.6rem",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.48rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: `rgba(${RGB.paper},0.15)`,
          display: "flex",
          gap: "1rem",
        }}
      >
        <span style={{ color: "#4ade80" }}>Green</span> = faster than PB &nbsp;
        <span style={{ color: "#f5a623" }}>Amber</span> = &lt;0.3s off &nbsp;
        <span style={{ color: RED }}>Red</span> = &gt;0.3s off
      </div>
    </div>
  );
}
