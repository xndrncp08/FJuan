"use client";

/**
 * components/prediction/Podium3D.tsx
 *
 * The model's top three on a 3D podium: livery-coloured steps rise into
 * place, then the camera sways slowly with the pointer. Names and odds are
 * DOM text under the canvas, so the scene itself is decorative.
 * Load through next/dynamic with ssr:false (three.js needs window).
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Group, Mesh } from "three";
import CanvasShell from "@/components/three/CanvasShell";

export interface PodiumStep {
  code: string;
  color: string;
}

// Classic podium order left→right: P2, P1, P3.
const LAYOUT = [
  { x: -1.7, h: 1.25, delay: 0.25 },
  { x: 0, h: 1.8, delay: 0 },
  { x: 1.7, h: 0.85, delay: 0.5 },
];

function Step({ color, x, h, delay, still }: { color: string; x: number; h: number; delay: number; still: boolean }) {
  const mesh = useRef<Mesh>(null);
  const t = useRef(still ? 10 : 0);
  useFrame((_, dt) => {
    if (!mesh.current) return;
    t.current += dt;
    const k = Math.min(1, Math.max(0, (t.current - delay) / 0.9));
    const ease = 1 - Math.pow(1 - k, 3);
    mesh.current.scale.y = Math.max(0.001, ease);
    mesh.current.position.y = (h * ease) / 2;
  });
  return (
    <mesh ref={mesh} position={[x, h / 2, 0]}>
      <RoundedBox args={[1.6, h, 1.4]} radius={0.04} smoothness={2}>
        <meshStandardMaterial color="#6B3A2E" emissive={color} emissiveIntensity={0.12} roughness={0.45} metalness={0.2} />
        <Edges color={color} />
      </RoundedBox>
      {/* livery stripe on the riser */}
      <mesh position={[0, h / 2 - 0.08, 0.705]}>
        <planeGeometry args={[1.6, 0.12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </mesh>
  );
}

function Rig({ children, still }: { children: React.ReactNode; still: boolean }) {
  const group = useRef<Group>(null);
  // Narrow (phone) canvases shrink the podium so the outer steps stay in frame.
  const fit = Math.min(1, useThree((st) => st.size.width) / 560);
  useFrame(({ pointer, clock }) => {
    if (!group.current || still) return;
    const sway = Math.sin(clock.elapsedTime * 0.4) * 0.12;
    group.current.rotation.y += (pointer.x * 0.35 + sway - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-pointer.y * 0.08 - group.current.rotation.x) * 0.05;
  });
  return <group ref={group} scale={0.7 + 0.3 * fit}>{children}</group>;
}

export default function Podium3D({ steps }: { steps: PodiumStep[] }) {
  const still = !!useReducedMotion();
  const ordered = [steps[1], steps[0], steps[2]];
  return (
    <CanvasShell decorative label="Predicted podium" camera={{ position: [0, 1.6, 6.4], fov: 36 }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} />
      <directionalLight position={[-4, 2, 3]} intensity={0.8} color="#E6501B" />
      <pointLight position={[0, 1.5, 3]} intensity={3} color="#C3110C" distance={8} />
      <group position={[0, -1, 0]}>
        <Rig still={still}>
          {ordered.map((s, i) => s && <Step key={s.code + i} color={s.color} still={still} {...LAYOUT[i]} />)}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
            <ringGeometry args={[2.9, 2.95, 64]} />
            <meshBasicMaterial color="#C3110C" toneMapped={false} />
          </mesh>
        </Rig>
      </group>
    </CanvasShell>
  );
}
