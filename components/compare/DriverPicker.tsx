"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "@/components/ui/icons";
import type { Driver } from "@/lib/types/driver";
import { cn } from "@/lib/utils/cn";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function DriverPicker({ label, value, onChange, drivers, color, autoFocus }: {
  label: string; value: string; onChange: (id: string) => void; drivers: Driver[]; color: string; autoFocus?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const current = drivers.find((d) => d.driverId === value);
  const matches = useMemo(() => {
    const terms = fold(query.trim()).split(/\s+/).filter(Boolean);
    return drivers.filter((d) => terms.every((t) => fold(`${d.givenName} ${d.familyName} ${d.code ?? ""} ${d.nationality}`).includes(t)));
  }, [drivers, query]);
  const shown = matches.slice(0, 30);
  const activeIndex = Math.min(active, shown.length - 1);

  const choose = (driver: Driver) => { onChange(driver.driverId); setOpen(false); setQuery(""); };
  const move = (index: number) => {
    const next = Math.max(0, Math.min(index, shown.length - 1));
    setActive(next);
    requestAnimationFrame(() => document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" }));
  };

  return (
    <div className="relative min-w-0 border border-separator bg-surface-1 p-4 focus-within:ring-2 focus-within:ring-tint/60 sm:p-5" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id} className="mb-3 flex items-center gap-2 text-footnote font-semibold" style={{ color }}>
        <span className="h-2 w-2" style={{ background: color }} aria-hidden />{label}
      </label>
      <div className="flex min-h-11 items-center gap-2 border-b border-separator focus-within:border-tint">
        <Search className="h-4 w-4 shrink-0 text-label-3" aria-hidden />
        <input
          ref={input} id={id} role="combobox" autoFocus={autoFocus} autoComplete="off" aria-autocomplete="list" aria-expanded={open}
          aria-controls={`${id}-list`} aria-activedescendant={open && shown.length ? `${id}-option-${activeIndex}` : undefined}
          value={open ? query : current ? `${current.givenName} ${current.familyName}` : value.replaceAll("_", " ")}
          placeholder="Find any driver in F1 history"
          className="min-w-0 flex-1 bg-transparent py-2 text-[1.125rem] font-semibold text-paper outline-none placeholder:text-label-3"
          onFocus={() => { setOpen(true); setQuery(""); setActive(0); }}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.stopPropagation(); setOpen(false); return; }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); move(open ? activeIndex + (e.key === "ArrowDown" ? 1 : -1) : 0); }
            if (open && e.key === "Enter") { e.preventDefault(); if (shown[activeIndex]) choose(shown[activeIndex]); }
            if (open && e.key === "Home") { e.preventDefault(); move(0); }
            if (open && e.key === "End") { e.preventDefault(); move(shown.length - 1); }
          }}
        />
        <button type="button" tabIndex={-1} aria-label={`Choose ${label.toLowerCase()}`} onMouseDown={(e) => e.preventDefault()} onClick={() => { if (open) setOpen(false); else { input.current?.focus(); setOpen(true); setQuery(""); } }} className="pressable flex h-11 w-8 shrink-0 items-center justify-center text-label-3"><ChevronsUpDown className="h-4 w-4" aria-hidden /></button>
      </div>
      <p className="mt-2 text-caption text-label-3">{open ? "Search by name, nationality or driver code" : "Select to search the current grid & F1 history"}</p>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 border border-separator border-t-tint bg-surface-1 shadow-popover">
          <ul id={`${id}-list`} role="listbox" aria-label={`${label} results`} className="max-h-64 overflow-y-auto p-1">
            {shown.map((d, i) => (
              <li key={d.driverId} role="presentation">
                <button id={`${id}-option-${i}`} type="button" role="option" aria-selected={value === d.driverId} tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(d)} className={cn("flex min-h-12 w-full items-center gap-3 px-3 text-left", i === activeIndex ? "bg-fill-2" : "hover:bg-fill-1")}>
                  <span className="min-w-0 flex-1"><span className="block text-callout font-semibold text-paper">{d.givenName} {d.familyName}</span><span className="block text-caption text-label-3">{d.nationality}{d.code && ` · ${d.code}`}</span></span>
                  {value === d.driverId && <Check className="h-4 w-4 shrink-0 text-tint" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
          <p role="status" className="border-t border-hairline px-4 py-3 text-caption text-label-3">{matches.length ? `${shown.length} of ${matches.length} matches${matches.length > 30 ? " · Type more to narrow your search" : ""}` : "No drivers match. Try a surname or nationality."}</p>
        </div>
      )}
    </div>
  );
}
