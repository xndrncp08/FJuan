"use client";

import { Driver, teamColor } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  drivers: Driver[];
  selected: number | null;
  onSelect: (n: number) => void;
}

export default function DriverSelector({ drivers, selected, onSelect }: Props) {
  return (
    <Panel>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <SectionLabel>Select Driver</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {drivers.map((d) => {
            const isSelected = selected === d.driver_number;
            const color = teamColor(d.team_colour);
            return (
              <button
                key={d.driver_number}
                onClick={() => onSelect(d.driver_number)}
                style={{
                  background: isSelected ? `${color}22` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.08)"}`,
                  padding: "0.5rem 0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ width: "3px", height: "14px", background: color, flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "white", letterSpacing: "0.06em" }}>
                    {d.name_acronym}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.3)" }}>
                    #{d.driver_number}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
