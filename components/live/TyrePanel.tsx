/**
 * components/live/TyrePanel.tsx
 *
 * Tyre stint strategy: a proportional stint bar plus a per-stint list.
 *
 * Two fixes made here, beyond recoloring:
 * 1. This used to self-wrap in its own <Panel>/<SectionLabel>, but the
 *    parent (LivePage's <DataPanel label="Tyre Strategy">) already
 *    provides that chrome — so it was rendering a double border and a
 *    duplicate "Tyre Strategy" label. Stripped to match how every sibling
 *    panel (TelemetryPanel, LapTimesPanel, SectorDeltaPanel) behaves: it
 *    renders only its content.
 * 2. This was styled with Tailwind utility classes (font-mono, rounded-full,
 *    text-white/30) while every other live-dashboard panel uses inline
 *    styles with Russo One / Rajdhani / JetBrains Mono. That made it look
 *    like a different app. Converted to match.
 *
 * TYRE_COLORS (soft/medium/hard/etc.) are the real FIA-standard compound
 * colors, kept as-is — recoloring them would make the strategy bar
 * unreadable to anyone who follows F1.
 */
import { Stint, PitStop, TYRE_COLORS, safeArray } from "./types";
import { RED, PAPER, RGB } from "@/lib/theme/palette";

interface Props {
  stints: Stint[];
  pits: PitStop[];
  totalLaps: number;
}

export default function TyrePanel({ stints, pits, totalLaps }: Props) {
  const safeStints = safeArray<Stint>(stints);
  const safePits = safeArray<PitStop>(pits);

  if (safeStints.length === 0) {
    return (
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: `rgba(${RGB.paper},0.15)`,
          padding: "0.5rem 0",
        }}
      >
        No stint data available
      </div>
    );
  }

  return (
    <div>
      {/* Proportional stint bar */}
      <div
        style={{
          display: "flex",
          height: "32px",
          marginBottom: "1.25rem",
          background: `rgba(${RGB.paper},0.05)`,
          border: `1px solid rgba(${RGB.paper},0.1)`,
          overflow: "hidden",
        }}
      >
        {safeStints.map((stint) => {
          const laps = (stint.lap_end || totalLaps) - stint.lap_start + 1;
          const pct = totalLaps > 0 ? (laps / totalLaps) * 100 : 0;
          const color = TYRE_COLORS[stint.compound] || TYRE_COLORS.UNKNOWN;
          const darkLetter =
            stint.compound === "MEDIUM" || stint.compound === "HARD";
          return (
            <div
              key={stint.stint_number}
              title={`${stint.compound} · Laps ${stint.lap_start}–${stint.lap_end || "?"}`}
              style={{
                width: `${pct}%`,
                minWidth: "24px",
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: `1px solid rgba(${RGB.ink},0.4)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  color: darkLetter ? `rgb(${RGB.ink})` : PAPER,
                }}
              >
                {stint.compound[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-stint list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {safeStints.map((stint) => {
          const color = TYRE_COLORS[stint.compound] || TYRE_COLORS.UNKNOWN;
          const pit = safePits.find((p) => p.lap_number === stint.lap_start);
          return (
            <div
              key={stint.stint_number}
              style={{
                background: `rgba(${RGB.paper},0.02)`,
                border: `1px solid rgba(${RGB.paper},0.07)`,
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.01em",
                    color: PAPER,
                  }}
                >
                  Stint {stint.stint_number} · {stint.compound}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.5rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: `rgba(${RGB.paper},0.3)`,
                    marginTop: "3px",
                  }}
                >
                  Laps {stint.lap_start}–{stint.lap_end || "?"} · Age at start:{" "}
                  {stint.tyre_age_at_start} laps
                </div>
              </div>

              {pit && (
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: RED,
                    marginLeft: "auto",
                  }}
                >
                  {pit.pit_duration?.toFixed(1)}s pit
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
