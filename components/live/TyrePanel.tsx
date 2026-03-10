import { Stint, PitStop, TYRE_COLORS, safeArray } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  stints: Stint[];
  pits: PitStop[];
  totalLaps: number;
}

export default function TyrePanel({ stints, pits, totalLaps }: Props) {
  // Guard against API returning non-array
  const safeStints = safeArray<Stint>(stints);
  const safePits = safeArray<PitStop>(pits);

  return (
    <Panel>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <SectionLabel>Tyre Strategy</SectionLabel>
        {safeStints.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem" }}>
            No stint data available
          </div>
        ) : (
          <>
            {/* Visual stint bar */}
            <div style={{
              display: "flex", height: "32px", marginBottom: "1.25rem",
              background: "rgba(255,255,255,0.04)", overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {safeStints.map((stint) => {
                const laps = (stint.lap_end || totalLaps) - stint.lap_start + 1;
                const pct = totalLaps > 0 ? (laps / totalLaps) * 100 : 0;
                const color = TYRE_COLORS[stint.compound] || TYRE_COLORS.UNKNOWN;
                return (
                  <div
                    key={stint.stint_number}
                    title={`${stint.compound} · Laps ${stint.lap_start}–${stint.lap_end || "?"}`}
                    style={{
                      width: `${pct}%`, background: color,
                      borderRight: "2px solid rgba(0,0,0,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      minWidth: "24px",
                    }}
                  >
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", fontWeight: 700,
                      color: stint.compound === "MEDIUM" || stint.compound === "HARD" ? "#000" : "#fff",
                      letterSpacing: "0.05em",
                    }}>
                      {stint.compound[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stint list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
              {safeStints.map((stint) => {
                const color = TYRE_COLORS[stint.compound] || TYRE_COLORS.UNKNOWN;
                const pit = safePits.find((p) => p.lap_number === stint.lap_start);
                return (
                  <div key={stint.stint_number} style={{ background: "#111", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "white", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Stint {stint.stint_number} · {stint.compound}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                        Laps {stint.lap_start}–{stint.lap_end || "?"} · Age at start: {stint.tyre_age_at_start} laps
                      </div>
                    </div>
                    {pit && (
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "#E10600" }}>
                        {pit.pit_duration?.toFixed(1)}s pit
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
