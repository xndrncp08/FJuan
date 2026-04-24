"use client";

import { Driver, teamColor } from "./types";

interface Props {
  drivers:  Driver[];
  selected: number | null;
  onSelect: (n: number) => void;
}

export default function DriverSelector({ drivers, selected, onSelect }: Props) {
  return (
    <div
      style={{
        background: "#060606",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: "3px solid #E10600",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: "2px",
        }}
      >
        {drivers.map((d) => (
          <DriverButton
            key={d.driver_number}
            driver={d}
            isSelected={selected === d.driver_number}
            color={teamColor(d.team_colour)}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: "0.75rem",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.55rem",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.15)",
        }}
      >
        {drivers.length} drivers — click to load telemetry
      </div>
    </div>
  );
}

// Extracted component avoids the border shorthand/longhand conflict React warns about.
// All four border sides are set individually — never using the `border` shorthand
// alongside borderLeft/borderTop etc. on the same element during re-renders.
function DriverButton({
  driver: d,
  isSelected,
  color,
  onSelect,
}: {
  driver: Driver;
  isSelected: boolean;
  color: string;
  onSelect: (n: number) => void;
}) {
  const sideBorder = `1px solid ${isSelected ? color : "rgba(255,255,255,0.07)"}`;

  return (
    <button
      onClick={() => onSelect(d.driver_number)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0.75rem 0.85rem",
        borderTop:    sideBorder,
        borderRight:  sideBorder,
        borderBottom: sideBorder,
        borderLeft:   `3px solid ${color}`,
        background:   isSelected ? `${color}18` : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (isSelected) return;
        const el = e.currentTarget;
        el.style.background       = `${color}0d`;
        el.style.borderTopColor    = `${color}55`;
        el.style.borderRightColor  = `${color}55`;
        el.style.borderBottomColor = `${color}55`;
      }}
      onMouseLeave={(e) => {
        if (isSelected) return;
        const el = e.currentTarget;
        el.style.background       = "rgba(255,255,255,0.02)";
        el.style.borderTopColor    = "rgba(255,255,255,0.07)";
        el.style.borderRightColor  = "rgba(255,255,255,0.07)";
        el.style.borderBottomColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "0.95rem",
          textTransform: "uppercase",
          color: isSelected ? color : "rgba(255,255,255,0.85)",
          letterSpacing: "0.02em",
          lineHeight: 1,
          marginBottom: "4px",
        }}
      >
        {d.name_acronym}
      </div>
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.5rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: isSelected ? `${color}99` : "rgba(255,255,255,0.2)",
          lineHeight: 1.3,
          marginBottom: "2px",
        }}
      >
        {d.team_name}
      </div>
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.48rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.15)",
        }}
      >
        #{d.driver_number}
      </div>
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: "0.4rem",
            right: "0.4rem",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      )}
    </button>
  );
}