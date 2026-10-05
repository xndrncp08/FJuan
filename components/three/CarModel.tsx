/**
 * components/three/CarModel.tsx
 *
 * A procedural F1 chassis — no downloaded model, so nothing to license and
 * nothing to fetch. Built from extrusions and primitives in metres: the car
 * points along +x, sits on y = 0, and is ~5.4 m long and 2 m wide.
 *
 * Livery color comes from the selected team. `wireframe` swaps every
 * surface for a glowing blueprint material.
 */

"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Mats = Record<"livery" | "carbon" | "paper" | "tyre" | "rim" | "glow" | "stripe" | "visor", THREE.Material>;

function carbonTexture() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d0d0f";
  g.fillRect(0, 0, size, size);
  // 2×2 twill: alternating light/dark diagonal tows.
  for (let y = 0; y < size; y += 8) {
    for (let x = 0; x < size; x += 8) {
      const odd = ((x + y) / 8) % 2 === 0;
      const grad = g.createLinearGradient(x, y, x + 8, y + 8);
      grad.addColorStop(0, odd ? "#1b1b1f" : "#101013");
      grad.addColorStop(1, odd ? "#0f0f12" : "#1a1a1e");
      g.fillStyle = grad;
      g.fillRect(x, y, 8, 8);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function useMaterials(livery: string, compound: string, wireframe: boolean): Mats {
  const carbonMap = useMemo(() => carbonTexture(), []);
  const solid = useMemo<Mats>(
    () => ({
      livery: new THREE.MeshPhysicalMaterial({ color: livery, metalness: 0.4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
      carbon: new THREE.MeshStandardMaterial({ color: "#ffffff", map: carbonMap, metalness: 0.35, roughness: 0.45 }),
      paper: new THREE.MeshPhysicalMaterial({ color: "#F5E9E4", metalness: 0.1, roughness: 0.35, clearcoat: 0.6 }),
      tyre: new THREE.MeshStandardMaterial({ color: "#121212", roughness: 0.92, metalness: 0 }),
      rim: new THREE.MeshStandardMaterial({ color: "#9aa0a6", metalness: 0.95, roughness: 0.22 }),
      glow: new THREE.MeshBasicMaterial({ color: "#ff2a1a", toneMapped: false }),
      stripe: new THREE.MeshBasicMaterial({ color: compound, toneMapped: false }),
      visor: new THREE.MeshPhysicalMaterial({ color: "#111", metalness: 0.9, roughness: 0.05, clearcoat: 1 }),
    }),
    [livery, compound, carbonMap],
  );
  const wire = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: livery, wireframe: true, transparent: true, opacity: 0.9, toneMapped: false });
    const dim = new THREE.MeshBasicMaterial({ color: "#F5E9E4", wireframe: true, transparent: true, opacity: 0.35 });
    return { livery: m, carbon: dim, paper: m, tyre: dim, rim: dim, glow: solid.glow, stripe: solid.stripe, visor: dim } as Mats;
  }, [livery, solid]);

  useEffect(() => () => Object.values(solid).forEach((m) => m.dispose()), [solid]);
  useEffect(() => () => carbonMap.dispose(), [carbonMap]);
  return wireframe ? wire : solid;
}

/** Side profile of the survival cell + engine cover, extruded across the car. */
function useChassisGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.0, 0.1);
    s.lineTo(1.3, 0.1);
    s.lineTo(1.3, 0.4);
    s.quadraticCurveTo(0.9, 0.47, 0.55, 0.5);
    s.lineTo(0.3, 0.6);
    s.quadraticCurveTo(0.0, 0.68, -0.08, 0.86);
    s.quadraticCurveTo(-0.25, 0.98, -0.5, 0.92);
    s.quadraticCurveTo(-1.2, 0.72, -2.0, 0.44);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 16 });
    g.translate(0, 0, -0.25);
    return g;
  }, []);
}

function Strut({ from, to, material }: { from: [number, number, number]; to: [number, number, number]; material: THREE.Material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: a.add(b).multiplyScalar(0.5), quaternion: q, length: dir.length() };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion} material={material}>
      <cylinderGeometry args={[0.014, 0.014, length, 6]} />
    </mesh>
  );
}

function Wheel({ position, width, mats, spin }: { position: [number, number, number]; width: number; mats: Mats; spin: React.RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const outer = position[2] > 0 ? 1 : -1;
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -(spin.current ?? 0);
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.tyre} castShadow>
          <cylinderGeometry args={[0.36, 0.36, width, 40, 1]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.rim}>
          <cylinderGeometry args={[0.235, 0.235, width + 0.012, 20, 1]} />
        </mesh>
        {/* Spokes, so the spin reads. */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, (outer * (width + 0.014)) / 2]} material={mats.carbon}>
            <boxGeometry args={[0.04, 0.42, 0.01]} />
          </mesh>
        ))}
      </group>
      {/* Compound stripe on the outer sidewall. */}
      <mesh position={[0, 0, (outer * (width + 0.004)) / 2]} material={mats.stripe}>
        <torusGeometry args={[0.3, 0.012, 8, 56]} />
      </mesh>
    </group>
  );
}

export function CarModel({
  livery,
  compound = "#F5E9E4",
  wireframe = false,
  speed = 1,
}: {
  livery: string;
  /** Sidewall stripe color — soft red, medium yellow, hard white. */
  compound?: string;
  wireframe?: boolean;
  /** Relative wheel spin speed; 0 parks the car. */
  speed?: number;
}) {
  const mats = useMaterials(livery, compound, wireframe);
  const chassis = useChassisGeometry();
  const spin = useRef(0);
  const rain = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    spin.current += dt * 22 * speed;
    // Rain light pulses at ~1.3 Hz, like the real thing in ERS harvest mode.
    if (rain.current) (rain.current.material as THREE.MeshBasicMaterial).color.setRGB(0.6 + 0.6 * Math.max(0, Math.sin(state.clock.elapsedTime * 8)), 0.08, 0.05);
  });

  const wheels: { p: [number, number, number]; w: number }[] = [
    { p: [1.72, 0.36, 0.82], w: 0.32 },
    { p: [1.72, 0.36, -0.82], w: 0.32 },
    { p: [-1.52, 0.36, 0.8], w: 0.4 },
    { p: [-1.52, 0.36, -0.8], w: 0.4 },
  ];

  return (
    <group>
      {/* Floor + plank */}
      <mesh position={[-0.15, 0.065, 0]} material={mats.carbon} castShadow>
        <boxGeometry args={[3.8, 0.03, 1.42]} />
      </mesh>
      <mesh position={[-0.15, 0.045, 0]} material={mats.paper}>
        <boxGeometry args={[3.2, 0.012, 0.28]} />
      </mesh>

      {/* Survival cell + engine cover */}
      <mesh geometry={chassis} material={mats.livery} castShadow />

      {/* Nose cone */}
      <mesh position={[1.98, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.72]} material={mats.livery} castShadow>
        <cylinderGeometry args={[0.06, 0.2, 1.45, 20]} />
      </mesh>
      <mesh position={[2.72, 0.3, 0]} material={mats.paper}>
        <sphereGeometry args={[0.06, 16, 12]} />
      </mesh>

      {/* Front wing: three elements + endplates */}
      <mesh position={[2.56, 0.09, 0]} material={mats.carbon}>
        <boxGeometry args={[0.42, 0.024, 1.96]} />
      </mesh>
      <mesh position={[2.46, 0.155, 0]} rotation={[0, 0, 0.28]} material={mats.livery}>
        <boxGeometry args={[0.3, 0.02, 1.72]} />
      </mesh>
      <mesh position={[2.39, 0.215, 0]} rotation={[0, 0, 0.5]} material={mats.paper}>
        <boxGeometry args={[0.2, 0.018, 1.5]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[2.5, 0.16, 0.98 * side]} material={mats.livery}>
          <boxGeometry args={[0.56, 0.24, 0.02]} />
        </mesh>
      ))}
      {[0.14, -0.14].map((z) => (
        <mesh key={z} position={[2.42, 0.18, z]} material={mats.carbon}>
          <boxGeometry args={[0.16, 0.2, 0.02]} />
        </mesh>
      ))}

      {/* Sidepods with coke-bottle taper */}
      {[1, -1].map((side) => (
        <group key={side}>
          <RoundedBox args={[1.4, 0.36, 0.42]} radius={0.1} smoothness={4} position={[-0.1, 0.32, 0.5 * side]} material={mats.livery} castShadow />
          <RoundedBox args={[0.9, 0.26, 0.26]} radius={0.08} smoothness={4} position={[-1.05, 0.26, 0.38 * side]} material={mats.livery} />
          <mesh position={[0.61, 0.36, 0.5 * side]} material={mats.carbon}>
            <boxGeometry args={[0.02, 0.2, 0.32]} />
          </mesh>
          {/* Mirror */}
          <mesh position={[0.5, 0.66, 0.4 * side]} material={mats.carbon}>
            <boxGeometry args={[0.1, 0.06, 0.16]} />
          </mesh>
          <Strut from={[0.5, 0.63, 0.32 * side]} to={[0.5, 0.52, 0.22 * side]} material={mats.carbon} />
        </group>
      ))}

      {/* Shark fin + engine cover stripe */}
      <mesh position={[-1.25, 0.78, 0]} material={mats.livery}>
        <boxGeometry args={[0.9, 0.22, 0.012]} />
      </mesh>
      <mesh position={[-0.25, 0.98, 0]} material={mats.paper}>
        <boxGeometry args={[0.3, 0.01, 0.16]} />
      </mesh>

      {/* Halo */}
      <group position={[0.22, 0.72, 0]}>
        <mesh rotation={[Math.PI / 2, 0, -Math.PI / 2]} material={mats.carbon}>
          <torusGeometry args={[0.3, 0.026, 10, 40, Math.PI]} />
        </mesh>
        <Strut from={[0.3, 0, 0]} to={[0.42, -0.18, 0]} material={mats.carbon} />
      </group>

      {/* Driver helmet */}
      <mesh position={[0.14, 0.66, 0]} material={mats.paper}>
        <sphereGeometry args={[0.12, 24, 18]} />
      </mesh>
      <mesh position={[0.22, 0.68, 0]} scale={[0.6, 0.35, 1]} material={mats.visor}>
        <sphereGeometry args={[0.105, 20, 12]} />
      </mesh>

      {/* Rear wing: main plane, DRS flap, endplates, beam wing, pylon */}
      <mesh position={[-2.2, 0.82, 0]} material={mats.carbon}>
        <boxGeometry args={[0.32, 0.03, 1.0]} />
      </mesh>
      <mesh position={[-2.12, 0.93, 0]} rotation={[0, 0, -0.35]} material={mats.livery}>
        <boxGeometry args={[0.22, 0.024, 1.0]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[-2.18, 0.76, 0.51 * side]} material={mats.livery}>
          <boxGeometry args={[0.62, 0.5, 0.022]} />
        </mesh>
      ))}
      <mesh position={[-2.15, 0.46, 0]} material={mats.carbon}>
        <boxGeometry args={[0.22, 0.022, 0.8]} />
      </mesh>
      <mesh position={[-2.08, 0.6, 0]} material={mats.carbon}>
        <boxGeometry args={[0.08, 0.36, 0.04]} />
      </mesh>
      {/* Diffuser */}
      <mesh position={[-2.12, 0.14, 0]} rotation={[0, 0, -0.32]} material={mats.carbon}>
        <boxGeometry args={[0.5, 0.02, 1.2]} />
      </mesh>
      {/* Rain light */}
      <mesh ref={rain} position={[-2.32, 0.38, 0]} material={mats.glow}>
        <boxGeometry args={[0.03, 0.07, 0.14]} />
      </mesh>

      {/* Suspension */}
      {wheels.map(({ p }, i) => {
        const side = p[2] > 0 ? 1 : -1;
        const inboard = p[2] - side * 0.6;
        return (
          <group key={i}>
            <Strut from={[p[0] + 0.18, 0.42, inboard]} to={[p[0], 0.4, p[2] - side * 0.16]} material={mats.carbon} />
            <Strut from={[p[0] - 0.18, 0.42, inboard]} to={[p[0], 0.4, p[2] - side * 0.16]} material={mats.carbon} />
            <Strut from={[p[0] + 0.18, 0.22, inboard]} to={[p[0], 0.28, p[2] - side * 0.16]} material={mats.carbon} />
            <Strut from={[p[0] - 0.18, 0.22, inboard]} to={[p[0], 0.28, p[2] - side * 0.16]} material={mats.carbon} />
          </group>
        );
      })}

      {wheels.map(({ p, w }, i) => (
        <Wheel key={i} position={p} width={w} mats={mats} spin={spin} />
      ))}
    </group>
  );
}
