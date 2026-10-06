/**
 * components/three/realCar/rig.ts
 *
 * Shared, three.js-free types for the 3D car: the camera rig written by
 * pointer handlers outside the canvas and read every frame inside it, and
 * hotspot descriptors. Kept separate so importing them doesn't pull the
 * WebGL code into a page's initial bundle.
 */

export interface Rig {
  az: number;
  el: number;
  dist: number;
  vel: number;
  dragging: boolean;
  lastInput: number;
  /** Pointer over the stage, −1…1 (for steering). */
  pointerX: number;
}

export const createRig = (): Rig => ({ az: 0.6, el: 0.2, dist: 7.4, vel: 0, dragging: false, lastInput: 0, pointerX: 0 });

export interface Hotspot {
  id: string;
  label: string;
  text: string;
  /** Model position in metres (x along the car, y up, z to the right side). */
  position: [number, number, number];
}
