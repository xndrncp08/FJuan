/**
 * components/three/realCar/RealCar.tsx
 *
 * One real 2026 car in 3D: the body lofted from its official render with
 * its real livery projected on each side, and four wheels whose outer
 * faces carry the render's own wheel art. Wheels spin with `spin` (radians,
 * driven by distance travelled) and the fronts steer with `steer`.
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CarProfile } from "@/lib/api/carModel";
import { buildBody, liveryMaterial, wheelFace } from "./geometry";

export interface CarBundle {
  profile: CarProfile;
  right: THREE.Texture;
  left: THREE.Texture;
}

// 2026 rules: narrower tyres, 1.9 m overall width.
const TRACK = { front: 0.8, rear: 0.78 };
const TYRE_WIDTH = { front: 0.3, rear: 0.37 };

const rubber = new THREE.MeshStandardMaterial({ color: "#121212", roughness: 0.88, metalness: 0 });
const innerFace = new THREE.MeshStandardMaterial({ color: "#0b0b0c", roughness: 0.7, metalness: 0.3 });

function Wheel({
  bundle,
  x,
  front,
  side,
  spin,
  steer,
}: {
  bundle: CarBundle;
  x: number;
  front: boolean;
  side: "right" | "left";
  spin: React.RefObject<number>;
  steer: React.RefObject<number>;
}) {
  const { profile } = bundle;
  const r = profile.wheels.radius;
  const width = front ? TYRE_WIDTH.front : TYRE_WIDTH.rear;
  const z = (front ? TRACK.front : TRACK.rear) * (side === "right" ? 1 : -1);
  const outward = side === "right" ? 1 : -1;
  const steerRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);

  const face = useMemo(() => wheelFace(profile, x, side), [profile, x, side]);
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: side === "right" ? bundle.right : bundle.left, roughness: 0.55, metalness: 0.2, alphaTest: 0.3 }),
    [bundle, side],
  );
  useEffect(() => () => face.dispose(), [face]);
  useEffect(() => () => faceMat.dispose(), [faceMat]);

  useFrame(() => {
    if (spinRef.current) spinRef.current.rotation.z = -(spin.current ?? 0);
    if (steerRef.current && front) steerRef.current.rotation.y = steer.current ?? 0;
  });

  return (
    <group position={[x, r, z]}>
      <group ref={steerRef}>
        <group ref={spinRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={rubber} castShadow>
            <cylinderGeometry args={[r, r, width, 48, 1, true]} />
          </mesh>
          {/* Outer face: the render's tyre sidewall and rim. Inner face: dark. */}
          <mesh geometry={face} material={faceMat} position={[0, 0, (outward * width) / 2 + outward * 0.002]} rotation={[0, side === "right" ? 0 : Math.PI, 0]} />
          <mesh position={[0, 0, (-outward * width) / 2]} rotation={[0, side === "right" ? Math.PI : 0, 0]} material={innerFace}>
            <circleGeometry args={[r, 32]} />
          </mesh>
          <mesh position={[0, 0, (outward * width) / 2 - outward * 0.004]} rotation={[0, side === "right" ? 0 : Math.PI, 0]} material={innerFace}>
            <circleGeometry args={[r * 0.995, 32]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function RealCar({ bundle, spin, steer }: { bundle: CarBundle; spin: React.RefObject<number>; steer: React.RefObject<number> }) {
  const { profile } = bundle;
  const body = useMemo(() => buildBody(profile), [profile]);
  const livery = useMemo(() => liveryMaterial(bundle.right, bundle.left, new THREE.Color(profile.color)), [bundle, profile.color]);
  useEffect(() => () => body.dispose(), [body]);
  useEffect(() => () => livery.material.dispose(), [livery]);

  const { rearX, frontX } = profile.wheels;
  return (
    <group>
      <mesh geometry={body} material={livery.material} castShadow />
      {(["right", "left"] as const).map((side) => (
        <group key={side}>
          <Wheel bundle={bundle} x={rearX} front={false} side={side} spin={spin} steer={steer} />
          <Wheel bundle={bundle} x={frontX} front side={side} spin={spin} steer={steer} />
        </group>
      ))}
    </group>
  );
}
