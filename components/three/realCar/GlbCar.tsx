/**
 * components/three/realCar/GlbCar.tsx
 *
 * A Sketchfab car model, normalised so every car sits the same way in the
 * scene: length along +x with the nose at +x, centred, wheels on y = 0,
 * scaled to a 5.4 m car. Models arrive in different orientations, so the
 * nose is found from the shape: the rear wing makes the back end tall,
 * the front wing keeps the nose end low.
 */

"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const TARGET_LENGTH = 5.4;

export interface CarDims {
  length: number;
  width: number;
  height: number;
}

/**
 * Height profile along x: the highest (sampled) vertex above the box floor
 * in each of `bins` equal slices of the box.
 */
function heightProfile(root: THREE.Object3D, box: THREE.Box3, bins = 10) {
  const { x: x0, y: y0 } = box.min;
  const x1 = box.max.x;
  const prof = new Array<number>(bins).fill(0);
  const v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 4000));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      const k = Math.min(bins - 1, Math.max(0, Math.floor(((v.x - x0) / (x1 - x0)) * bins)));
      prof[k] = Math.max(prof[k], v.y - y0);
    }
  });
  return prof;
}

export function normaliseCar(scene: THREE.Object3D): { object: THREE.Group; dims: CarDims } {
  const model = scene.clone(true);
  const pivot = new THREE.Group();
  pivot.add(model);

  // Lay the car's long axis along x.
  let box = new THREE.Box3().setFromObject(pivot);
  let size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) model.rotation.y = Math.PI / 2;
  pivot.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(pivot);

  // Nose = the lower end (no rear wing). Compare the outer 30% of each end
  // rather than a single slice, so one stray part can't flip the car.
  const prof = heightProfile(pivot, box);
  const minEnd = prof[0] + prof[1] + prof[2];
  const maxEnd = prof[7] + prof[8] + prof[9];
  if (minEnd < maxEnd) model.rotation.y += Math.PI;

  // Scale, centre, and stand it on the ground.
  pivot.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(pivot);
  size = box.getSize(new THREE.Vector3());
  const s = TARGET_LENGTH / size.x;
  pivot.scale.setScalar(s);
  pivot.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(pivot);
  const center = box.getCenter(new THREE.Vector3());
  pivot.position.set(-center.x, -box.min.y, -center.z);

  const outer = new THREE.Group();
  outer.add(pivot);
  outer.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  const finalSize = new THREE.Box3().setFromObject(outer).getSize(new THREE.Vector3());
  return { object: outer, dims: { length: finalSize.x, width: finalSize.z, height: finalSize.y } };
}

export function GlbCar({ url }: { url: string }) {
  // Third argument: meshopt decoder (the models are meshopt-compressed).
  const gltf = useGLTF(url, false, true);
  const { object } = useMemo(() => normaliseCar(gltf.scene), [gltf.scene]);
  return <primitive object={object} />;
}

export const preloadCar = (url: string) => useGLTF.preload(url, false, true);
