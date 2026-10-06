/**
 * lib/data/carModels.ts
 *
 * 3D models of the cars, from Sketchfab (all CC BY 4.0 — credit shown on
 * every car view). Downloaded once and optimised (meshopt geometry, WebP
 * textures ≤2048px) into public/models/cars/. Where no 2026 model exists,
 * the newest one available is used and labelled with its year.
 */

export interface CarModel {
  file: string;
  title: string;
  /** Season the model depicts. */
  year: number;
  author: string;
  authorUrl: string;
  modelUrl: string;
}

const tyler = { author: "Tyler_Dave", authorUrl: "https://sketchfab.com/Tyler_Dave" };

export const CAR_MODEL_LICENSE = { label: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" };

export const CAR_MODELS: Record<string, CarModel> = {
  mclaren: { file: "/models/cars/mclaren.glb", title: "2026 McLaren MCL40", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-mclaren-mcl40-96214ad5624f42a0861f77008f8d29e7" },
  ferrari: { file: "/models/cars/ferrari.glb", title: "2026 Ferrari SF-26", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-ferrari-sf-26-e5ca6cecdc42449283f4bed27360f2a7" },
  mercedes: { file: "/models/cars/mercedes.glb", title: "2026 Mercedes W17", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-mercedes-w17-b806f1e70aa343219e7158169549b97b" },
  red_bull: { file: "/models/cars/red_bull.glb", title: "2026 Red Bull RB22", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-redbull-rb22-0a3d24a58e0549d591a5a48c22eec383" },
  aston_martin: { file: "/models/cars/aston_martin.glb", title: "2026 Aston Martin AMR26", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-aston-martin-amr26-a50d1c7bc086455c9412470d93fc3fc7" },
  williams: { file: "/models/cars/williams.glb", title: "2026 Williams FW48", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-williams-fw48-4efa51e6d64a4192a83418f1b715c671" },
  haas: { file: "/models/cars/haas.glb", title: "2026 Haas VF-26", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-haas-vf-26-1f41e03886724bc6acd16c92402989bc" },
  audi: { file: "/models/cars/audi.glb", title: "2026 Audi R26", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-audi-r26-32bf228264b047669b100b0f1b8769ac" },
  cadillac: { file: "/models/cars/cadillac.glb", title: "2026 Cadillac MAC-26", year: 2026, ...tyler, modelUrl: "https://sketchfab.com/3d-models/2026-cadillac-mac-26-95bcd37aa7c649779efc33b90b6c023e" },
  alpine: {
    file: "/models/cars/alpine.glb",
    title: "2025 Alpine A525",
    year: 2025,
    author: "Abu Saif",
    authorUrl: "https://sketchfab.com/abuhossain844",
    modelUrl: "https://sketchfab.com/3d-models/2025-alpine-a525-5f029644bc2d4eaebbec88712ea46dfa",
  },
  rb: {
    file: "/models/cars/rb.glb",
    title: "2024 Racing Bulls VCARB 01",
    year: 2024,
    author: "bachlamanh406",
    authorUrl: "https://sketchfab.com/bachlamanh406",
    modelUrl: "https://sketchfab.com/3d-models/visa-cash-app-red-bull-racing-vcarb01-b9fd0d3d26e349cebfceed712b577f97",
  },
};

export const carModelFor = (team: string): CarModel | null => CAR_MODELS[team === "kick_sauber" || team === "sauber" ? "audi" : team] ?? null;
