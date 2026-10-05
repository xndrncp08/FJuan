/**
 * components/telemetry/TrackScene.tsx
 *
 * 3D circuit built from telemetry x/y/z: a ribbon mesh following the racing
 * line, colored per sample, with a translucent curtain down to the ground
 * so elevation reads at a glance (elevation is exaggerated to stay visible
 * at circuit scale).
 *
 * Heat modes:
 *   inputs — red braking, green full throttle, cyan coasting/partial.
 *            Braking is also drawn raised and wider, so it doesn't rely on
 *            red vs green alone.
 *   speed  — one-hue sequential ramp, slow (dark) → fast (bright).
 *
 * A glowing car marker sits at `getCursor()` (a fractional sample index,
 * read every frame so playback never re-renders React) and the camera can
 * follow it.
 */

"use client";

import { Grid, Html, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { HEAT } from "@/components/ui/chart";
import type { TelemetrySample } from "@/lib/telemetry/types";

export type HeatMode = "inputs" | "speed";

const SPAN = 12; // circuit fits in a 12-unit square
const RIBBON = 0.09;

export type DriveState = "brake" | "throttle" | "coast";

export function driveState(s: Pick<TelemetrySample, "brake" | "throttle">): DriveState {
  if (s.brake > 0) return "brake";
  if (s.throttle >= 90) return "throttle";
  return "coast";
}

const HEAT_COLORS = {
  brake: new THREE.Color(HEAT.brake),
  throttle: new THREE.Color(HEAT.throttle),
  coast: new THREE.Color(HEAT.coast),
};
const SPEED_LO = new THREE.Color("#3a0c06");
const SPEED_HI = new THREE.Color("#FFB08A");

export interface TrackLayout {
  points: THREE.Vector3[];
  tangents: THREE.Vector3[];
  scale: number;
  elevation: number;
}

export function layoutTrack(samples: TelemetrySample[]): TrackLayout {
  const xs = samples.map((s) => s.x);
  const ys = samples.map((s) => s.y);
  const zs = samples.map((s) => s.z);
  const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const scale = SPAN / extent;
  const zRange = Math.max(...zs) - Math.min(...zs);
  // Exaggerate elevation so ~1 unit of relief shows, but never invert scale.
  const elevation = zRange > 0 ? Math.min(8, Math.max(1, 1 / (zRange * scale))) : 1;
  const zMin = Math.min(...zs);
  const points = samples.map((s) => new THREE.Vector3(s.x * scale, (s.z - zMin) * scale * elevation + 0.05, -s.y * scale));
  const n = points.length;
  const tangents = points.map((_, i) => points[Math.min(n - 1, i + 1)].clone().sub(points[Math.max(0, i - 1)]).normalize());
  return { points, tangents, scale, elevation };
}

function sampleColor(s: TelemetrySample, mode: HeatMode, maxSpeed: number) {
  if (mode === "speed") return SPEED_LO.clone().lerp(SPEED_HI, Math.pow(s.speed / maxSpeed, 1.6));
  return HEAT_COLORS[driveState(s)];
}

function useRibbon(samples: TelemetrySample[], layout: TrackLayout, mode: HeatMode, widthScale: number, raise: boolean) {
  return useMemo(() => {
    const n = samples.length;
    const maxSpeed = Math.max(...samples.map((s) => s.speed)) || 1;
    const pos = new Float32Array(n * 2 * 3);
    const col = new Float32Array(n * 2 * 3);
    const idx: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const p = layout.points[i];
      const side = new THREE.Vector3().crossVectors(layout.tangents[i], up).normalize();
      const braking = mode === "inputs" && samples[i].brake > 0;
      const w = RIBBON * widthScale * (braking ? 1.45 : 1);
      const lift = raise && braking ? 0.05 : 0;
      const l = p.clone().addScaledVector(side, w);
      const r = p.clone().addScaledVector(side, -w);
      pos.set([l.x, l.y + lift, l.z, r.x, r.y + lift, r.z], i * 6);
      const c = sampleColor(samples[i], mode, maxSpeed);
      col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
      if (i < n - 1) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [samples, layout, mode, widthScale, raise]);
}

function useCurtain(samples: TelemetrySample[], layout: TrackLayout, mode: HeatMode) {
  return useMemo(() => {
    const n = samples.length;
    const maxSpeed = Math.max(...samples.map((s) => s.speed)) || 1;
    const pos = new Float32Array(n * 2 * 3);
    const col = new Float32Array(n * 2 * 3);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const p = layout.points[i];
      pos.set([p.x, p.y, p.z, p.x, 0, p.z], i * 6);
      const c = sampleColor(samples[i], mode, maxSpeed);
      col.set([c.r, c.g, c.b, 0, 0, 0], i * 6);
      if (i < n - 1) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }, [samples, layout, mode]);
}

/** Position + heading at a fractional sample index. */
export function poseAt(layout: TrackLayout, cursor: number) {
  const n = layout.points.length;
  const i = Math.max(0, Math.min(n - 1, Math.floor(cursor)));
  const j = Math.min(n - 1, i + 1);
  const f = Math.max(0, Math.min(1, cursor - i));
  return {
    position: layout.points[i].clone().lerp(layout.points[j], f),
    tangent: layout.tangents[i].clone().lerp(layout.tangents[j], f).normalize(),
  };
}

function CarMarker({ layout, getCursor, color }: { layout: TrackLayout; getCursor: () => number; color: string }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!group.current) return;
    const { position, tangent } = poseAt(layout, getCursor());
    group.current.position.copy(position);
    group.current.rotation.y = Math.atan2(tangent.x, tangent.z);
    if (ring.current) {
      const k = (state.clock.elapsedTime * 1.4) % 1;
      ring.current.scale.setScalar(0.6 + k * 1.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - k);
    }
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.11, 0.34, 4]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.16, 0.2, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={3} distance={2.5} position={[0, 0.4, 0]} />
    </group>
  );
}

function FollowCamera({ layout, getCursor, enabled }: { layout: TrackLayout; getCursor: () => number; enabled: boolean }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const { camera } = useThree();
  const home = useMemo(() => ({ pos: new THREE.Vector3(0, 9.5, 9.5), target: new THREE.Vector3(0, 0, 0) }), []);
  const wasEnabled = useRef(enabled);

  useFrame((_, dt) => {
    if (!controls) return;
    const k = 1 - Math.exp(-dt * 4);
    if (enabled) {
      const { position, tangent } = poseAt(layout, getCursor());
      const goal = position.clone().addScaledVector(tangent, -2.4).add(new THREE.Vector3(0, 1.3, 0));
      camera.position.lerp(goal, k);
      controls.target.lerp(position, k * 1.5);
      controls.update();
    } else if (wasEnabled.current) {
      // Ease back to the overview once when follow is turned off.
      camera.position.lerp(home.pos, k);
      controls.target.lerp(home.target, k);
      controls.update();
      if (camera.position.distanceTo(home.pos) < 0.05) wasEnabled.current = false;
    }
    if (enabled) wasEnabled.current = true;
  });
  return null;
}

export default function TrackScene({
  samples,
  sectorSplits,
  getCursor,
  mode,
  follow,
  color,
}: {
  samples: TelemetrySample[];
  sectorSplits: [number, number];
  getCursor: () => number;
  mode: HeatMode;
  follow: boolean;
  color: string;
}) {
  const layout = useMemo(() => layoutTrack(samples), [samples]);
  const ribbon = useRibbon(samples, layout, mode, 1, true);
  const glow = useRibbon(samples, layout, mode, 2.8, false);
  const curtain = useCurtain(samples, layout, mode);
  useEffect(() => () => [ribbon, glow, curtain].forEach((g) => g.dispose()), [ribbon, glow, curtain]);

  const total = samples[samples.length - 1]?.distance || 1;
  const markers = useMemo(
    () =>
      [
        { label: "S/F", frac: 0 },
        { label: "S2", frac: sectorSplits[0] },
        { label: "S3", frac: sectorSplits[1] },
      ].map((m) => {
        const i = Math.max(0, samples.findIndex((s) => s.distance >= m.frac * total));
        return { ...m, position: layout.points[i] };
      }),
    [samples, sectorSplits, layout, total],
  );

  return (
    <>
      <color attach="background" args={["#0b0403"]} />
      <fog attach="fog" args={["#0b0403", 14, 32]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 4]} intensity={1.2} />

      <mesh geometry={ribbon}>
        <meshStandardMaterial vertexColors emissive="#ffffff" emissiveIntensity={0.08} roughness={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={glow} position={[0, -0.01, 0]}>
        <meshBasicMaterial vertexColors transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={curtain}>
        <meshBasicMaterial vertexColors transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {markers.map((m) => (
        <group key={m.label} position={[m.position.x, 0, m.position.z]}>
          <mesh position={[0, (m.position.y + 0.5) / 2, 0]}>
            <boxGeometry args={[0.025, m.position.y + 0.5, 0.025]} />
            <meshBasicMaterial color={m.label === "S/F" ? "#F5E9E4" : "#FF7A52"} toneMapped={false} />
          </mesh>
          <Html position={[0, m.position.y + 0.65, 0]} center distanceFactor={12} zIndexRange={[10, 0]}>
            <span className="pointer-events-none select-none whitespace-nowrap border border-[var(--glass-edge)] bg-[rgb(20_6_5/0.8)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-paper">
              {m.label}
            </span>
          </Html>
        </group>
      ))}

      <CarMarker layout={layout} getCursor={getCursor} color={color} />

      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#3a1712"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#7a1a10"
        fadeDistance={30}
        fadeStrength={1.4}
        infiniteGrid
      />

      <OrbitControls makeDefault enableDamping minDistance={3} maxDistance={26} maxPolarAngle={Math.PI / 2.1} />
      <FollowCamera layout={layout} getCursor={getCursor} enabled={follow} />
    </>
  );
}
