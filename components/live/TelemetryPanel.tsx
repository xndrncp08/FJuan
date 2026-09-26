/**
 * components/live/TelemetryPanel.tsx
 *
 * The latest car-data sample: speed, RPM, throttle, brake as meters, plus
 * gear and DRS. Each channel keeps its own hue so they stay distinct.
 */

import { CarTelemetry } from "./types";
import { EMBER, INFO, SUCCESS, WARNING } from "@/lib/theme/palette";
import { cn } from "@/lib/utils/cn";

export default function TelemetryPanel({ car }: { car: CarTelemetry | null }) {
  if (!car) return <p className="py-6 text-center text-subhead text-label-3">No car data recorded for this session.</p>;

  const meters = [
    { label: "Speed", value: car.speed, unit: "km/h", pct: car.speed / 380, color: EMBER },
    { label: "RPM", value: car.rpm?.toLocaleString() ?? "0", unit: "", pct: (car.rpm ?? 0) / 15000, color: INFO },
    { label: "Throttle", value: car.throttle, unit: "%", pct: car.throttle / 100, color: SUCCESS },
    { label: "Brake", value: car.brake, unit: "%", pct: car.brake / 100, color: WARNING },
  ];
  const drsOpen = car.drs > 10;

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {meters.map((m) => (
          <div key={m.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-footnote text-label-3">{m.label}</span>
              <span className="font-mono tabular text-headline text-paper">
                {m.value}
                {m.unit && <span className="ml-0.5 text-caption font-normal text-label-3">{m.unit}</span>}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-fill-1" aria-hidden>
              <div className="h-full" style={{ width: `${Math.min(1, Math.max(0, m.pct)) * 100}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-hairline pt-5">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-fill-1">
          <span className="font-mono tabular text-title-2 font-bold leading-none text-paper">{car.n_gear || "N"}</span>
          <span className="mt-0.5 text-caption text-label-3">Gear</span>
        </div>
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
            <span key={g} className={cn("h-2 flex-1", g <= (car.n_gear || 0) ? "bg-ember" : "bg-fill-2")} />
          ))}
        </div>
        <span className={cn(" px-3 py-1 text-caption font-bold", drsOpen ? "bg-success/15 text-success" : "bg-fill-2 text-label-3")}>
          DRS {drsOpen ? "open" : "closed"}
        </span>
      </div>
    </div>
  );
}
