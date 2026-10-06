/**
 * components/teams/Car3D.tsx
 *
 * A team's real 2026 car in interactive 3D, built from its official
 * renders (see lib/api/carModel.ts and components/three/realCar).
 *
 *   - Shows the flat render (CarStage) until the 3D car is ready, and stays
 *     on it if WebGL is missing or the car can't be built.
 *   - Drag to orbit (with inertia). On touch, horizontal drags turn the car
 *     and vertical drags still scroll the page.
 *   - Arrow keys rotate when focused; front wheels steer toward the cursor.
 *   - Viewer mode adds camera presets, a rolling toggle and hotspots with
 *     notes on the 2026 rules.
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import type * as THREE from "three";
import { Info, Play, Pause, Rotate3d } from "lucide-react";
import type { CarProfile } from "@/lib/api/carModel";
import type { CarBundle } from "@/components/three/realCar/RealCar";
import { createRig, type Hotspot, type Rig } from "@/components/three/realCar/rig";
import { CarStage, type StageCar } from "./CarStage";
import { cn } from "@/lib/utils/cn";

const CanvasShell = dynamic(() => import("@/components/three/CanvasShell"), { ssr: false });
const CarScene3D = dynamic(() => import("@/components/three/realCar/CarScene3D"), { ssr: false });

// three.js is loaded on demand so it stays out of the page's first bundle.
const textures = new Map<string, Promise<THREE.Texture>>();
function loadTexture(url: string) {
  let p = textures.get(url);
  if (!p) {
    p = import("three").then(async ({ TextureLoader, SRGBColorSpace }) => {
      const loader = new TextureLoader();
      loader.setCrossOrigin("anonymous");
      const t = await loader.loadAsync(url);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    });
    textures.set(url, p);
    p.catch(() => textures.delete(url));
  }
  return p;
}

async function fetchProfile(team: string, season: number): Promise<CarProfile> {
  const res = await fetch(`/api/car-model?team=${team}&season=${season}`);
  if (!res.ok) throw new Error("car model unavailable");
  return res.json();
}

/** Prefetch a car (profile + both liveries) so switching to it is instant. */
export function usePrefetchCar() {
  return (team: string, season: number) => {
    fetchProfile(team, season)
      .then((p) => Promise.all([loadTexture(p.images.right.url), loadTexture(p.images.left.url)]))
      .catch(() => {});
  };
}

const PRESETS = [
  { id: "34", label: "¾", az: 0.6, el: 0.2, dist: 7.4 },
  { id: "side", label: "Side", az: 0, el: 0.06, dist: 6.8 },
  { id: "front", label: "Front", az: Math.PI / 2, el: 0.12, dist: 5.6 },
  { id: "top", label: "Top", az: 0.001, el: 1.32, dist: 7 },
  { id: "rear", label: "Rear", az: -2.45, el: 0.2, dist: 7 },
] as const;

function hotspotsFor(p: CarProfile): Hotspot[] {
  const { rearX, frontX, radius } = p.wheels;
  const { xMin, xMax, top } = p.extent;
  const wb = frontX - rearX;
  return [
    { id: "fw", label: "Front wing · active aero", text: "Both wings now have movable elements: flattened on the straights to cut drag, angled in the corners for grip.", position: [xMax - 0.35, 0.16, 0.86] },
    { id: "rw", label: "Rear wing", text: "The rear wing opens on designated straights for every driver, replacing DRS. Overtaking help comes from extra electrical power instead.", position: [xMin + 0.18, top * 0.86, 0.48] },
    { id: "pu", label: "Power unit", text: "1.6-litre turbo V6 with electrical power raised to about 350 kW — close to half the total. The MGU-H is gone and the fuel is fully sustainable.", position: [rearX + wb * 0.3, top * 0.82, 0.22] },
    { id: "halo", label: "Halo", text: "Titanium cockpit protection, mandatory since 2018.", position: [rearX + wb * 0.63, top * 0.86, 0] },
    { id: "size", label: "Smaller, lighter", text: "2026 cars are 1.9 m wide (100 mm narrower), with a 3.4 m maximum wheelbase and a 768 kg minimum weight.", position: [rearX + wb * 0.5, 0.45, 0.74] },
    { id: "tyres", label: "Tyres", text: "Pirelli 18-inch tyres, slightly narrower than before to cut drag and weight.", position: [frontX, radius * 1.8, 0.96] },
  ];
}

export function Car3D({
  team,
  season,
  fallback,
  direction = 0,
  mode,
  className,
}: {
  team: string;
  season: number;
  /** The flat render shown while loading, or for good if 3D isn't possible. */
  fallback: StageCar;
  direction?: -1 | 0 | 1;
  mode: "showcase" | "viewer";
  className?: string;
}) {
  const reduce = !!useReducedMotion();
  const rig = useRef<Rig>(createRig());
  const [bundle, setBundle] = useState<CarBundle | null>(null);
  const [ready, setReady] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [showHotspots, setShowHotspots] = useState(mode === "viewer");
  const drag = useRef<{ x: number; y: number; t: number; vx: number; mouse: boolean } | null>(null);

  const profile = useQuery({ queryKey: ["car-model", team, season], queryFn: () => fetchProfile(team, season), staleTime: Infinity, retry: 1 });

  // Swap the bundle only once the new car's liveries have loaded, so the
  // old car stays on stage (and drives off) instead of blanking.
  const [textureFailed, setTextureFailed] = useState<string | null>(null);
  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    let live = true;
    Promise.all([loadTexture(p.images.right.url), loadTexture(p.images.left.url)])
      .then(([right, left]) => live && setBundle({ profile: p, right, left }))
      .catch(() => live && setTextureFailed(p.team));
    return () => {
      live = false;
    };
  }, [profile.data]);

  const failed = noWebGL || profile.isError || textureFailed === team;
  const show3D = !!bundle && ready && !failed;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!show3D) return;
    drag.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, vx: 0, mouse: e.pointerType === "mouse" };
    rig.current.dragging = true;
    rig.current.vel = 0;
    rig.current.lastInput = e.timeStamp;
    if (e.pointerType === "mouse") e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rig.current.pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
    const d = drag.current;
    if (!d) return;
    const now = e.timeStamp;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    rig.current.az -= dx * 0.009;
    if (d.mouse) rig.current.el = Math.min(1.35, Math.max(0.02, rig.current.el + dy * 0.006));
    d.vx = (-dx * 0.009) / Math.max(0.008, (now - d.t) / 1000);
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = now;
    rig.current.lastInput = now;
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    // Carry the flick's speed into the spin.
    rig.current.vel = reduce ? 0 : Math.max(-6, Math.min(6, drag.current.vx));
    rig.current.dragging = false;
    rig.current.lastInput = e.timeStamp;
    drag.current = null;
  };
  const preset = (p: (typeof PRESETS)[number], at: number) => {
    // Take the short way round to the preset's azimuth, and hold it a few
    // seconds before auto-rotate resumes.
    const cur = rig.current.az;
    const turn = ((((p.az - cur) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    Object.assign(rig.current, { az: cur + turn, el: p.el, dist: p.dist, vel: 0, lastInput: at + 4000 });
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Flat render: the loading state and the fallback */}
      <div className={cn("absolute inset-0 transition-opacity duration-500", show3D ? "pointer-events-none opacity-0" : "opacity-100")}>
        <CarStage car={fallback} side={direction === -1 ? "right" : direction === 1 ? "left" : "right"} direction={direction} className="h-full w-full" />
      </div>

      {!failed && (
        <div
          className={cn("absolute inset-0 touch-pan-y transition-opacity duration-500", show3D ? "cursor-grab opacity-100 active:cursor-grabbing" : "opacity-0")}
          tabIndex={show3D && mode === "viewer" ? 0 : -1}
          role="img"
          aria-label={`${fallback.label}, 3D model built from the official renders. Drag or use arrow keys to rotate.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => {
            rig.current.pointerX = 0;
          }}
          onKeyDown={(e) => {
            // In the showcase the arrow keys change car instead (handled by the parent).
            if (mode !== "viewer" || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
            e.preventDefault();
            e.stopPropagation();
            rig.current.az += e.key === "ArrowLeft" ? 0.35 : -0.35;
            rig.current.lastInput = e.timeStamp;
          }}
        >
          {bundle && (
            <CanvasShell label={fallback.label} decorative camera={{ position: [4, 1.6, 6], fov: 30 }} onReady={() => setReady(true)} onUnsupported={() => setNoWebGL(true)}>
              <CarScene3D bundle={bundle} direction={direction} rolling={rolling} reduce={reduce} rig={rig} hotspots={showHotspots ? hotspotsFor(bundle.profile) : undefined} />
            </CanvasShell>
          )}
        </div>
      )}

      {show3D && (
        <div
          className={cn(
            "pointer-events-none absolute flex flex-wrap items-center gap-1.5",
            mode === "viewer" ? "inset-x-2 bottom-2 flex-nowrap justify-between sm:inset-x-4 sm:bottom-4" : "right-3 top-3 justify-end sm:right-5 sm:top-5",
          )}
        >
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              aria-pressed={rolling}
              onClick={() => setRolling((v) => !v)}
              className={cn("pressable glass-strong flex h-9 items-center gap-1.5 px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", rolling ? "text-paper" : "text-label-2 hover:text-paper")}
            >
              {rolling ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
              <span className={cn(mode === "viewer" && "sr-only sm:not-sr-only")}>{rolling ? "Stop" : "Roll"}</span>
            </button>
            {mode === "viewer" && (
              <button
                type="button"
                aria-pressed={showHotspots}
                onClick={() => setShowHotspots((v) => !v)}
                className={cn("pressable glass-strong flex h-9 items-center gap-1.5 px-3 text-[0.75rem] font-bold uppercase tracking-[0.12em]", showHotspots ? "text-paper" : "text-label-2 hover:text-paper")}
              >
                <Info className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only sm:not-sr-only">2026 rules</span>
              </button>
            )}
          </div>
          {mode === "viewer" && (
            <div className="pointer-events-auto glass-strong flex" role="group" aria-label="Camera">
              <span className="hidden items-center pl-2.5 pr-1 text-label-3 sm:flex" aria-hidden>
                <Rotate3d className="h-4 w-4" />
              </span>
              {PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={(e) => preset(p, e.timeStamp)} className="pressable h-9 px-2 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-label-2 hover:bg-fill-1 hover:text-paper sm:px-2.5 sm:tracking-[0.1em]">
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
