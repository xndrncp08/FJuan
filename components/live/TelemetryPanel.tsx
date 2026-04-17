import { CarTelemetry } from "./types";
import { Panel, SectionLabel } from "./ui";

interface Props {
  car: CarTelemetry | null;
}

export default function TelemetryPanel({ car }: Props) {
  if (!car) {
    return (
      <Panel>
        <div className="p-4 md:p-6">
          <SectionLabel>Car Telemetry (Latest Sample)</SectionLabel>
          <div className="text-white/30 text-sm">No telemetry data available for this session.</div>
        </div>
      </Panel>
    );
  }

  const gauges = [
    { label: "Speed", value: `${car.speed}`, unit: "km/h", pct: Math.min(car.speed / 380, 1), color: "#E10600" },
    { label: "RPM", value: `${car.rpm?.toLocaleString()}`, unit: "rpm", pct: Math.min(car.rpm / 15000, 1), color: "#3671C6" },
    { label: "Throttle", value: `${car.throttle}`, unit: "%", pct: car.throttle / 100, color: "#27F4D2" },
    { label: "Brake", value: `${car.brake}`, unit: "%", pct: car.brake / 100, color: "#FF8000" },
  ];

  return (
    <Panel>
      <div className="p-4 md:p-6">
        <SectionLabel>Car Telemetry (Latest Sample)</SectionLabel>

        {/* Gauges grid: 2 columns on mobile, 2 on desktop (but stacked if needed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 mb-4">
          {gauges.map((g) => (
            <div key={g.label} className="bg-[#111] p-4">
              <div className="text-white/40 text-[0.6rem] uppercase tracking-wider mb-2">
                {g.label}
              </div>
              <div className="font-display text-2xl md:text-3xl text-white leading-none mb-2">
                {g.value}
                <span className="font-mono text-xs text-white/40 ml-1">{g.unit}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-white/10">
                <div className="h-full transition-all duration-300" style={{ width: `${g.pct * 100}%`, background: g.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Gear & DRS row – column on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-[#111] p-3 text-center border border-white/10">
            <div className="text-white/30 text-[0.6rem] uppercase tracking-wider mb-1">Gear</div>
            <div className="font-display text-3xl text-white">{car.n_gear || "N"}</div>
          </div>
          <div className="flex-1 bg-[#111] p-3 text-center border border-white/10">
            <div className="text-white/30 text-[0.6rem] uppercase tracking-wider mb-1">DRS</div>
            <div className={`font-display text-xl ${car.drs > 10 ? "text-green-500" : "text-white/40"}`}>
              {car.drs > 10 ? "OPEN" : "CLOSED"}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}