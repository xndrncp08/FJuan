/**
 * TracksPage – Race Circuits listing page.
 *
 * Data: prioritises Jolpica API circuit order for the current season;
 *       enriches with local circuits.json (layout images, lap records, stats).
 *
 * Layout (responsive):
 *   1. Hero section (title, stats strip)
 *   2. Auto-fill grid of CircuitCards (1 column on mobile, 2 on tablet, 3 on desktop)
 *   3. Each card shows layout image, location, name, length/laps/since, lap record
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCircuits } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";

export default function TracksPage() {
  const [circuits, setCircuits] = useState<any[]>([]);

  // Load circuits on mount – use API order if available, fallback to local JSON
  useEffect(() => {
    async function loadCircuits() {
      let apiCircuits: any[] = [];
      try {
        apiCircuits = await getCircuits("current");
      } catch {
        /* fall back to local JSON order */
      }

      // Merge API order with local enrichment data; drop any circuit missing local data
      const mergedCircuits = (apiCircuits.length > 0 ? apiCircuits : circuitsData)
        .map((api: any) => {
          const local = circuitsData.find(c => c.id === api.circuitId || c.id === api.id);
          return local ?? null;
        })
        .filter(Boolean) as typeof circuitsData;

      setCircuits(mergedCircuits);
    }

    loadCircuits();
  }, []);

  return (
    <main className="min-h-screen bg-[#080808]">
      {/* Hero Section */}
      <section className="relative border-b border-white/10 overflow-hidden">
        {/* Top red line */}
        <div className="h-[2px] bg-[#E10600]" />

        {/* Giant F1 watermark */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 md:pr-8 pointer-events-none select-none">
          <span className="font-display text-[clamp(6rem,15vw,18rem)] text-white/5 leading-none tracking-[-0.04em]">
            F1
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {/* Back link */}
          <Link href="/" className="nav-back inline-flex mb-6 md:mb-8">
            ← Home
          </Link>

          {/* Season label */}
          <div className="label-overline mb-2">Formula 1 · 2026 Season</div>

          {/* Title */}
          <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] text-white leading-[0.92] tracking-[-0.02em] mb-4">
            RACE<br />
            <span className="text-white/15">CIRCUITS</span>
          </h1>

          <p className="text-white/40 text-sm md:text-base max-w-md mb-8">
            Every circuit on the Formula 1 calendar — track layouts, lap records, and history.
          </p>

          {/* Stats strip – wraps on mobile */}
          <div className="inline-flex flex-wrap border-t border-white/10">
            {[
              { value: circuits.length, label: "Circuits" },
              { value: "24", label: "Races" },
              { value: "21", label: "Countries" },
            ].map((s, i) => (
              <div
                key={i}
                className="px-6 md:px-8 pt-4 first:pl-0 last:pr-0"
                style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <div className="stat-value text-2xl md:text-3xl">{s.value}</div>
                <div className="stat-label text-[0.65rem] md:text-[0.7rem]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Circuit Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {circuits.map((circuit) => (
            <Link
              key={circuit.id}
              href={`/tracks/${circuit.id}`}
              className="block h-full group no-underline"
            >
              <div className="bg-[#0a0a0a] p-5 md:p-6 h-full flex flex-col transition-colors hover:bg-[#0e0e0e]">
                {/* Red accent line */}
                <div className="w-8 h-0.5 bg-[#E10600] mb-5" />

                {/* Track layout image */}
                <div className="bg-[#060606] border border-white/10 h-[120px] flex items-center justify-center mb-5 overflow-hidden">
                  <img
                    src={circuit.layoutUrl}
                    alt={circuit.name}
                    className="h-full w-full object-contain p-2 opacity-85"
                    loading="lazy"
                  />
                </div>

                {/* Location */}
                <div className="stat-label text-[0.65rem] mb-1">{circuit.location}</div>

                {/* Circuit name */}
                <div className="font-display text-white text-base leading-tight mb-4 flex-1">
                  {circuit.name}
                </div>

                {/* Stats: Length / Laps / Since */}
                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  {[
                    { label: "Length", value: circuit.length },
                    { label: "Laps", value: circuit.laps },
                    { label: "Since", value: circuit.firstGP },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="stat-label text-[0.6rem] mb-1">{s.label}</div>
                      <div className="font-display text-sm text-white">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Lap record row */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                  <div>
                    <div className="stat-label text-[0.6rem] mb-0.5">Lap Record</div>
                    <div className="font-display text-sm text-[#E10600]">{circuit.lapRecord}</div>
                  </div>
                  <div className="nav-back text-[0.7rem] group-hover:opacity-80">View →</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}