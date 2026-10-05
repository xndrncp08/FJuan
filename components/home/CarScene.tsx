/**
 * components/home/CarScene.tsx
 *
 * Three.js content for the landing-page chassis: the car on a scrolling
 * grid, studio lighting from local Lightformers (no HDR download), a
 * livery-colored underglow, speed particles, and orbit controls whose
 * target drifts toward the cursor so the camera feels alive at rest.
 */

"use client";

import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CarModel } from "@/components/three/CarModel";
import { SpeedParticles } from "@/components/three/SpeedParticles";

const BASE_TARGET = new THREE.Vector3(0, 0.45, 0);

/** Pans the orbit target toward the pointer (eased) unless the user is dragging. */
function CursorRig({ enabled }: { enabled: boolean }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const dragging = useRef(false);
  const goal = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!controls) return;
    const start = () => (dragging.current = true);
    const end = () => (dragging.current = false);
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    return () => {
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
    };
  }, [controls]);

  useFrame((state, dt) => {
    if (!controls || dragging.current) return;
    goal.copy(BASE_TARGET);
    if (enabled) goal.add(new THREE.Vector3(state.pointer.x * 0.9, state.pointer.y * 0.35, -state.pointer.x * 0.4));
    controls.target.lerp(goal, 1 - Math.exp(-dt * 3));
    controls.update();
  });
  return null;
}

/** Grid that slides under the car so it reads as moving. */
function RollingGrid({ speed }: { speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.x = (ref.current.position.x - Math.min(dt, 0.05) * 16 * speed) % 2;
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
      fadeDistance={22}
      fadeStrength={1.6}
      infiniteGrid
    />
  );
}

function Underglow({ color }: { color: string }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.25)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} scale={[6.4, 2.6, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} color={color} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export default function CarScene({
  livery,
  compound,
  wireframe,
  autoRotate,
  speed,
  parallax,
}: {
  livery: string;
  compound: string;
  wireframe: boolean;
  autoRotate: boolean;
  speed: number;
  parallax: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#0c0403"]} />
      <fog attach="fog" args={["#0c0403", 12, 26]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} />
      <spotLight position={[-6, 3, -4]} angle={0.5} penumbra={0.8} intensity={60} color={livery} />
      <pointLight position={[0, 0.25, 0]} intensity={4} distance={4} color={livery} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-6, 2, 3]} rotation={[0, Math.PI / 2.5, 0]} scale={[8, 2, 1]} color="#ffd9cc" />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, -3]} rotation={[0, -Math.PI / 2.5, 0]} scale={[8, 2, 1]} color="#ff6a3a" />
        <Lightformer form="ring" intensity={0.8} position={[0, 2, 8]} scale={3} color="#ffffff" />
      </Environment>

      <group position={[0.3, 0, 0]}>
        <CarModel livery={livery} compound={compound} wireframe={wireframe} speed={speed} />
      </group>
      <Underglow color={livery} />
      <SpeedParticles speed={speed} color="#E6501B" />
      <RollingGrid speed={speed} />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.75} scale={10} blur={2.4} far={2} resolution={512} frames={1} color="#000000" />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={4.2}
        maxDistance={13}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.55}
      />
      <CursorRig enabled={parallax} />
    </>
  );
}
