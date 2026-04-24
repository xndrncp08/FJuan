import { CarTelemetry } from "./types";

interface Props { car: CarTelemetry | null }

export default function TelemetryPanel({ car }: Props) {
  if (!car) {
    return (
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.15)", padding: "0.5rem 0" }}>
        No telemetry data available for this session.
      </div>
    );
  }

  const gauges = [
    { label: "Speed",    value: String(car.speed),                unit: "km/h", pct: Math.min(car.speed / 380, 1), color: "#E10600", max: "380" },
    { label: "RPM",      value: car.rpm?.toLocaleString() ?? "0", unit: "rpm",  pct: Math.min(car.rpm / 15000, 1), color: "#3b82f6", max: "15000" },
    { label: "Throttle", value: String(car.throttle),             unit: "%",    pct: car.throttle / 100,            color: "#27F4D2", max: "100" },
    { label: "Brake",    value: String(car.brake),                unit: "%",    pct: car.brake / 100,               color: "#FF8000", max: "100" },
  ];

  return (
    <div>
      {/* Gauge grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginBottom: "2px" }}>
        {gauges.map((g) => (
          <div key={g.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem 1rem" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.35rem" }}>
              {g.label}
            </div>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.5rem", color: "white", lineHeight: 1, letterSpacing: "-0.02em", marginBottom: "0.1rem" }}>
              {g.value}
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.52rem", color: "rgba(255,255,255,0.2)", marginLeft: "4px", fontWeight: 600 }}>{g.unit}</span>
            </div>
            <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", marginTop: "0.5rem" }}>
              <div style={{ height: "100%", width: `${g.pct * 100}%`, background: g.color, boxShadow: `0 0 6px ${g.color}60`, transition: "width 0.3s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.4rem", color: "rgba(255,255,255,0.12)", letterSpacing: "0.04em" }}>
              <span>0</span><span>{g.max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gear + DRS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>Gear</div>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "2rem", color: "white", lineHeight: 1 }}>{car.n_gear || "N"}</div>
          </div>
          {/* Gear bar indicator */}
          <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
            {[1,2,3,4,5,6,7,8].map((g) => (
              <div key={g} style={{ width: "3px", height: `${g * 4}px`, background: g <= (car.n_gear || 0) ? "#E10600" : "rgba(255,255,255,0.06)", transition: "background 0.2s" }} />
            ))}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "0.75rem 1rem" }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.25rem" }}>DRS</div>
          <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", letterSpacing: "0.04em", color: car.drs > 10 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
            {car.drs > 10 ? "OPEN" : "CLOSED"}
          </div>
          {car.drs > 10 && (
            <div style={{ marginTop: "0.4rem", height: "2px", background: "#4ade80", boxShadow: "0 0 6px #4ade80", animation: "drsFlash 1s ease-in-out infinite" }} />
          )}
        </div>
      </div>
      <style>{`@keyframes drsFlash { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}