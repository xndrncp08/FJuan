/**
 * components/teams/CarViewer.tsx
 *
 * One car in interactive 3D (Car3D, viewer mode: camera presets, rolling,
 * 2026-rules hotspots), built from its official renders. The flat render
 * shows while it loads, and stays if 3D isn't possible.
 */

"use client";

import { Car3D } from "./Car3D";
import type { StageCar } from "./CarStage";

export function CarViewer({ car, season }: { car: StageCar; season: number }) {
  return (
    <div className="glass overflow-hidden">
      <Car3D mode="viewer" team={car.id} season={season} fallback={car} className="aspect-square min-h-[340px] sm:aspect-[16/8] sm:min-h-[320px] lg:aspect-[16/7]" />
      <p className="border-t border-[var(--glass-edge)] px-4 py-2.5 text-caption text-label-3">
        3D model built from the official Formula1.com renders — shape traced from the side profile, livery from each side. Drag to rotate.
      </p>
    </div>
  );
}
