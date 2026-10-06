/**
 * components/three/realCar/CarScene3D.tsx
 *
 * Studio for a RealCar: key light, team-coloured rim light, local
 * Lightformer reflections (nothing downloaded), contact shadow, and a grid
 * floor that rolls while the car moves.
 *
 *   Changing car  the old car drives off and the new one drives in from
 *                 the side it's heading to; wheels turn by the distance
 *                 covered, so they never skid.
 *   Camera        orbit rig fed by `rig` (written by pointer handlers in
 *                 Car3D): eased azimuth/elevation/distance with inertia,
 *                 slow auto-rotate when idle, presets.
 *   Front wheels  steer toward the pointer.
 *   Hotspots      optional labelled points (car page) with short notes.
 */

"use client";

import { ContactShadows, Environment, Grid, Html, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils/cn";
import { RealCar, type CarBundle } from "./RealCar";
import type { Hotspot, Rig } from "./rig";

const DRIVE = 9; // metres off-stage

function CarInstance({
  bundle,
  phase,
  dir,
  rolling,
  reduce,
  rig,
  onExited,
}: {
  bundle: CarBundle;
  phase: "enter" | "idle" | "exit";
  dir: -1 | 0 | 1;
  rolling: boolean;
  reduce: boolean;
  rig: React.RefObject<Rig>;
  onExited?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const steer = useRef(0);
  // Cars always drive forward (nose = +x): in from the left, off to the
  // right. Starting off-stage means the first frame is already in place.
  const state = useRef({ x: phase === "enter" && dir !== 0 && !reduce ? -DRIVE : 0, done: false });
  const r = bundle.profile.wheels.radius;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 20);
    const s = state.current;
    const target = phase === "exit" ? DRIVE : 0;
    const before = s.x;
    if (reduce) s.x = target;
    else easing.damp(s, "x", target, phase === "exit" ? 0.32 : 0.45, dt);
    g.position.x = s.x;
    // Rolling without slipping: wheel angle = distance / radius.
    spin.current += (s.x - before) / r;
    if (rolling && !reduce) spin.current += (dt * 14) / r;
    easing.damp(steer, "current", reduce ? 0 : (rig.current?.pointerX ?? 0) * -0.32, 0.25, dt);
    if (phase === "exit" && !s.done && Math.abs(s.x - target) < 0.05) {
      s.done = true;
      onExited?.();
    }
  });

  return (
    <group ref={group}>
      <RealCar bundle={bundle} spin={spin} steer={steer} />
    </group>
  );
}

function CameraRig({ rig, center, reduce }: { rig: React.RefObject<Rig>; center: THREE.Vector3; reduce: boolean }) {
  const cur = useRef({ az: 0.6, el: 0.2, dist: 7.4 });
  useFrame((state, delta) => {
    const camera = state.camera;
    const R = rig.current;
    if (!R) return;
    const dt = Math.min(delta, 1 / 20);
    if (!R.dragging) {
      R.az += R.vel * dt;
      R.vel *= Math.exp(-dt * 3.2);
      if (!reduce && performance.now() - R.lastInput > 3500) R.az += dt * 0.16;
    }
    easing.damp(cur.current, "az", R.az, 0.22, dt);
    easing.damp(cur.current, "el", R.el, 0.3, dt);
    easing.damp(cur.current, "dist", R.dist, 0.35, dt);
    const { az, el } = cur.current;
    // Portrait stages (phones) have a narrow horizontal view: back off so
    // the whole car still fits.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const dist = cur.current.dist * Math.max(1, 1.6 / aspect);
    camera.position.set(center.x + dist * Math.cos(el) * Math.sin(az), center.y + dist * Math.sin(el), center.z + dist * Math.cos(el) * Math.cos(az));
    camera.lookAt(center);
  });
  return null;
}

function RollingGrid({ rolling, reduce }: { rolling: boolean; reduce: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current || !rolling || reduce) return;
    ref.current.position.x = (ref.current.position.x - Math.min(delta, 0.05) * 14) % 2;
  });
  return (
    <Grid
      ref={ref}
      position={[0, 0.001, 0]}
      args={[40, 40]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#4a201a"
      sectionSize={2}
      sectionThickness={1.1}
      sectionColor="#C3110C"
      fadeDistance={24}
      fadeStrength={1.6}
      infiniteGrid
    />
  );
}

function Hotspots({ items }: { items: Hotspot[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      {items.map((h) => {
        const active = open === h.id;
        return (
          <Html key={h.id} position={h.position} center zIndexRange={[20, 0]}>
            <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setOpen(active ? null : h.id)}
                aria-expanded={active}
                aria-label={h.label}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[0.875rem] font-bold leading-none text-paper shadow-[0_0_14px_rgba(230,80,27,0.6)] transition-transform duration-150",
                  active ? "scale-110 border-paper bg-accent" : "border-paper/60 bg-accent/80 hover:scale-110",
                )}
              >
                {active ? "×" : "+"}
              </button>
              {active && (
                <div className="glass-strong absolute left-1/2 top-9 w-64 -translate-x-1/2 p-3 text-left">
                  <p className="label-caps text-[0.75rem] text-tint">{h.label}</p>
                  <p className="mt-1 text-footnote text-paper">{h.text}</p>
                </div>
              )}
            </div>
          </Html>
        );
      })}
    </>
  );
}

export default function CarScene3D({
  bundle,
  direction,
  rolling,
  reduce,
  rig,
  hotspots,
}: {
  bundle: CarBundle;
  direction: -1 | 0 | 1;
  rolling: boolean;
  reduce: boolean;
  rig: React.RefObject<Rig>;
  hotspots?: Hotspot[];
}) {
  // Cars on stage: the current one, plus the previous one while it drives off.
  const [cars, setCars] = useState<{ bundle: CarBundle; id: number; phase: "enter" | "idle" | "exit"; dir: -1 | 0 | 1 }[]>(() => [
    { bundle, id: 0, phase: "idle", dir: 0 },
  ]);
  const [shown, setShown] = useState(bundle);
  if (shown !== bundle) {
    setShown(bundle);
    setCars((list) => [
      ...list.filter((c) => c.phase !== "exit").map((c) => ({ ...c, phase: "exit" as const, dir: direction || 1 })),
      { bundle, id: Math.max(0, ...list.map((c) => c.id)) + 1, phase: "enter", dir: direction || 1 },
    ]);
  }

  const color = bundle.profile.color;
  const { xMin, xMax, top } = bundle.profile.extent;
  const center = useMemo(() => new THREE.Vector3((xMin + xMax) / 2, top * 0.4, 0), [xMin, xMax, top]);

  useEffect(() => {
    // Hand the stage to the new car once it has arrived.
    const id = setTimeout(() => setCars((list) => list.map((c) => (c.phase === "enter" ? { ...c, phase: "idle" } : c))), 900);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <>
      <color attach="background" args={["#0c0403"]} />
      <fog attach="fog" args={["#0c0403", 14, 30]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 8, 6]} intensity={1.6} />
      <directionalLight position={[-6, 4, -5]} intensity={0.5} />
      <spotLight position={[-5, 4, -6]} angle={0.6} penumbra={0.9} intensity={70} color={color} />
      <pointLight position={[0, 0.25, 0]} intensity={4} distance={4.5} color={color} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 5, 1]} />
        <Lightformer form="rect" intensity={1.3} position={[-7, 2, 4]} rotation={[0, Math.PI / 2.6, 0]} scale={[9, 2.5, 1]} color="#ffe4d8" />
        <Lightformer form="rect" intensity={1.1} position={[7, 2, -4]} rotation={[0, -Math.PI / 2.6, 0]} scale={[9, 2.5, 1]} color="#ff7a4a" />
        <Lightformer form="ring" intensity={0.9} position={[0, 2.5, 9]} scale={3.5} />
      </Environment>

      {cars.map((c) => (
        <CarInstance
          key={c.id}
          bundle={c.bundle}
          phase={c.phase}
          dir={c.dir}
          rolling={rolling}
          reduce={reduce}
          rig={rig}
          onExited={() => setCars((list) => list.filter((o) => o.id !== c.id))}
        />
      ))}
      {hotspots && cars.length === 1 && <Hotspots items={hotspots} />}

      <RollingGrid rolling={rolling || cars.length > 1} reduce={reduce} />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.8} scale={12} blur={2.2} far={2.2} resolution={512} color="#000000" />
      <CameraRig rig={rig} center={center} reduce={reduce} />
    </>
  );
}
