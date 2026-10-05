/**
 * components/three/SpeedParticles.tsx
 *
 * Air streaming past the car: glowing points plus stretched streaks that
 * travel along −x and wrap around. Additive blending gives the neon glow
 * without a post-processing pass. Speed 0 freezes them (reduced motion).
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const SPAN_X = 18;

function spawn(rand: () => number) {
  // Keep particles out of the car's own volume.
  let y = 0.05 + rand() * 2.4;
  const z = (rand() - 0.5) * 7;
  if (Math.abs(z) < 1.1 && y < 1.1) y += 1.1;
  return { x: (rand() - 0.5) * SPAN_X, y, z };
}

export function SpeedParticles({ color = "#E6501B", speed = 1, count = 700, streaks = 120 }: { color?: string; speed?: number; count?: number; streaks?: number }) {
  const points = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);

  const data = useMemo(() => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const tint = new THREE.Color(color);
    const paper = new THREE.Color("#F5E9E4");
    for (let i = 0; i < count; i++) {
      const p = spawn(rand);
      pos.set([p.x, p.y, p.z], i * 3);
      const c = tint.clone().lerp(paper, rand() * 0.5);
      col.set([c.r, c.g, c.b], i * 3);
      vel[i] = 6 + rand() * 14;
    }
    const seg = new Float32Array(streaks * 6);
    const segVel = new Float32Array(streaks);
    const segLen = new Float32Array(streaks);
    for (let i = 0; i < streaks; i++) {
      const p = spawn(rand);
      segLen[i] = 0.6 + rand() * 1.8;
      seg.set([p.x, p.y, p.z, p.x + segLen[i], p.y, p.z], i * 6);
      segVel[i] = 14 + rand() * 18;
    }
    return { pos, col, vel, seg, segVel, segLen };
  }, [color, count, streaks]);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05) * speed;
    if (!step) return;
    const half = SPAN_X / 2;
    const p = points.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (p) {
      const a = p.array as Float32Array;
      for (let i = 0; i < count; i++) {
        a[i * 3] -= data.vel[i] * step;
        if (a[i * 3] < -half) a[i * 3] += SPAN_X;
      }
      p.needsUpdate = true;
    }
    const l = lines.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (l) {
      const a = l.array as Float32Array;
      for (let i = 0; i < streaks; i++) {
        const dx = data.segVel[i] * step;
        a[i * 6] -= dx;
        a[i * 6 + 3] -= dx;
        if (a[i * 6 + 3] < -half) {
          a[i * 6] += SPAN_X;
          a[i * 6 + 3] += SPAN_X;
        }
      }
      l.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={points} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} vertexColors transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.seg, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
