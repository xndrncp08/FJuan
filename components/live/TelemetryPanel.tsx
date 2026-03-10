import { CarTelemetry } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  car: CarTelemetry | null;
}

export default function TelemetryPanel({ car }: Props) {
  if (!car) return (
    <Panel>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <SectionLabel>Car Telemetry (Latest Sample)</SectionLabel>
        <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem" }}>
          No telemetry data available for this session.
        </div>
      </div>
    </Panel>
  );

  const gauges = [
    { label: "Speed", value: `${car.speed}`, unit: "km/h", pct: Math.min(car.speed / 380, 1), color: "#E10600" },
    { label: "RPM", value: `${car.rpm?.toLocaleString()}`, unit: "rpm", pct: Math.min(car.rpm / 15000, 1), color: "#3671C6" },
    { label: "Throttle", value: `${car.throttle}`, unit: "%", pct: car.throttle / 100, color: "#27F4D2" },
    { label: "Brake", value: `${car.brake}`, unit: "%", pct: car.brake / 100, color: "#FF8000" },
  ];

  return (
    <Panel>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <SectionLabel>Car Telemetry (Latest Sample)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
          {gauges.map((g) => (
            <div key={g.label} style={{ background: "#111", padding: "1rem 1.25rem" }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "0.4rem" }}>
                {g.label}
              </div>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.6rem", color: "white", lineHeight: 1, marginBottom: "0.5rem" }}>
                {g.value}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>
                  {g.unit}
                </span>
              </div>
              <div style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: "100%", width: `${g.pct * 100}%`, background: g.color, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ background: "#111", padding: "0.75rem 1rem", flex: 1, textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>Gear</div>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "2rem", color: "white", lineHeight: 1 }}>{car.n_gear || "N"}</div>
          </div>
          <div style={{ background: "#111", padding: "0.75rem 1rem", flex: 1, textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>DRS</div>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.1rem", color: car.drs > 10 ? "#39B54A" : "rgba(255,255,255,0.3)", lineHeight: 1, marginTop: "4px" }}>
              {car.drs > 10 ? "OPEN" : "CLOSED"}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
