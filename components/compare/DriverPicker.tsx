"use client";

/**
 * components/compare/DriverPicker.tsx
 *
 * A large tappable card showing the chosen driver, with a native <select>
 * laid over it — so phones get the system picker and keyboards get full
 * select behavior for free.
 */

import { ChevronsUpDown } from "lucide-react";

export function DriverPicker({
  label,
  value,
  onChange,
  drivers,
  color,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  drivers: any[];
  color: string;
}) {
  const current = drivers.find((d) => d.driverId === value);

  return (
    <label className="card card-interactive relative block cursor-pointer p-4 sm:p-5">
      <span className="flex items-center gap-2 text-footnote font-semibold" style={{ color }}>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
        {label}
      </span>
      <span className="mt-2 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-title-3 text-paper">
          {current ? (
            <>
              <span className="font-medium text-label-2">{current.givenName} </span>
              {current.familyName}
            </>
          ) : (
            "Choose a driver"
          )}
        </span>
        <ChevronsUpDown className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {drivers.map((d) => (
          <option key={d.driverId} value={d.driverId}>
            {d.givenName} {d.familyName}
          </option>
        ))}
      </select>
    </label>
  );
}
