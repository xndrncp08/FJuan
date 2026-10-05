/**
 * components/home/WordmarkScene.tsx
 *
 * The hero's FJUAN in 3D: Russo One outlines extruded into bevelled,
 * clear-coated letters, laid exactly over the DOM <h1> (which stays as the
 * real, accessible text) by measuring each letter's span.
 *
 *   Start sequence  letters are dark, light red one by one like a start
 *                   gantry, all go out, then ignite (paper + ember U) and
 *                   surge toward the camera while streaks fly past.
 *   Idle            the word tilts toward the cursor, a warm light follows
 *                   the pointer across the bevels, a softbox reflection
 *                   sweeps the clear coat, the U's glow breathes.
 *   Letters         hover lifts a letter forward; click spins it.
 *   Scroll          the word tips back and recedes as the hero leaves.
 *
 * Everything per-frame reads mutable refs — React never re-renders during
 * the animation. Reduced motion keeps the colours but drops all movement.
 */

"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { WORDMARK, WORDMARK_CAP_HEIGHT, WORDMARK_GLYPHS, WORDMARK_UNITS_PER_EM, type WordmarkChar } from "@/lib/theme/wordmark";
import { elapsed, litCount, type Timeline } from "./lightsSequence";

// Extrusion in font units (1000/em): ~0.15em deep with a soft bevel.
const DEPTH = 150;
const BEVEL = { bevelEnabled: true, bevelThickness: 16, bevelSize: 11, bevelSegments: 5, curveSegments: 12 } as const;

const PAPER = new THREE.Color("#F5E9E4");
const EMBER = new THREE.Color("#E6501B");
const LIGHT_RED = new THREE.Color("#FF2414");
const UNLIT_FACE = new THREE.Color("#2a1613");
const UNLIT_SIDE = new THREE.Color("#1a0b08");
const LIT_FACE = new THREE.Color("#3a0402");
const SIDE_PAPER = new THREE.Color("#5a1b12");
const SIDE_EMBER = new THREE.Color("#6e1606");
const BLACK = new THREE.Color("#000000");

interface Glyph {
  geometry: THREE.ExtrudeGeometry;
  /** Visual centre in font units (x from bbox, y at half cap height). */
  cx: number;
}

function buildGlyph(ch: WordmarkChar): Glyph {
  const loader = new SVGLoader();
  const svg = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${WORDMARK_GLYPHS[ch].d}"/></svg>`);
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geometry = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, ...BEVEL });
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const cx = (bb.min.x + bb.max.x) / 2;
  geometry.translate(-cx, -WORDMARK_CAP_HEIGHT / 2, -DEPTH / 2);
  return { geometry, cx };
}

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

interface Layout {
  ready: boolean;
  /** World units per font unit. */
  scale: number;
  /** Letter centres relative to the word centre. */
  letters: THREE.Vector3[];
  center: THREE.Vector3;
  cap: number;
  worldW: number;
  worldH: number;
}

/** Spring step for the ignition surge (slightly under-damped: it was thrown). */
function springStep(z: number, v: number, dt: number) {
  const K = 140;
  const C = 2 * Math.sqrt(K) * 0.55;
  const a = -K * z - C * v;
  v += a * dt;
  return { z: z + v * dt, v };
}

const STREAKS = 70;

function seedStreaks() {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: STREAKS }, () => ({ x: rand(), y: rand() - 0.5, z: -1.2 - rand() * 5, v: 0.6 + rand() * 0.8, len: 0.4 + rand() * 0.6 }));
}

function Streaks({ layout, timeline, reduce }: { layout: React.RefObject<Layout>; timeline: React.RefObject<Timeline>; reduce: boolean }) {
  const ref = useRef<THREE.LineSegments>(null);
  const N = STREAKS;
  // Refs: these are mutated every frame.
  const data = useRef(seedStreaks());
  const [positions] = useState(() => new Float32Array(N * 6));

  useFrame((_, delta) => {
    const L = layout.current;
    const line = ref.current;
    if (!line || !L?.ready) return;
    const tl = timeline.current;
    const s = elapsed(tl);
    const sinceGo = s - tl.go;
    const burst = sinceGo >= 0 && sinceGo < 3 ? 3.4 * Math.exp(-sinceGo * 2.1) : 0;
    const intensity = reduce ? 0 : burst + (sinceGo >= 0 ? 0.05 : 0);
    const mat = line.material as THREE.LineBasicMaterial;
    mat.opacity = Math.min(0.85, intensity * 0.35 + (intensity > 0 ? 0.1 : 0));
    line.visible = intensity > 0;
    if (!line.visible) return;
    const span = L.worldW * 1.6;
    const dt = Math.min(delta, 1 / 20);
    for (let i = 0; i < N; i++) {
      const d = data.current[i];
      d.x -= (d.v * intensity * dt * span) / 4;
      if (d.x < 0) d.x += 1;
      const x = (d.x - 0.5) * span;
      const len = d.len * (0.3 + intensity * 1.4);
      const y = d.y * L.worldH * 0.9;
      (line.geometry.attributes.position.array as Float32Array).set([x, y, d.z, x + len, y, d.z], i * 6);
    }
    line.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#FF6A2A" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

export default function WordmarkScene({
  timeline,
  spans,
  baseline,
  heading,
  section,
  reduce,
}: {
  timeline: React.RefObject<Timeline>;
  /** The five DOM letter spans the 3D letters sit on. */
  spans: React.RefObject<(HTMLSpanElement | null)[]>;
  /** Zero-size inline-block at the text baseline. */
  baseline: React.RefObject<HTMLSpanElement | null>;
  heading: React.RefObject<HTMLHeadingElement | null>;
  section: React.RefObject<HTMLElement | null>;
  reduce: boolean;
}) {
  const { camera, gl, size } = useThree();
  const glyphs = useMemo(() => WORDMARK.map(buildGlyph), []);
  const halo = useMemo(() => haloTexture(), []);
  const mats = useMemo(
    () =>
      WORDMARK.map(() => ({
        face: new THREE.MeshPhysicalMaterial({ color: UNLIT_FACE, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, emissive: BLACK }),
        side: new THREE.MeshPhysicalMaterial({ color: UNLIT_SIDE, roughness: 0.45, metalness: 0.35, clearcoat: 0.6, emissive: BLACK }),
        halo: new THREE.MeshBasicMaterial({ map: halo, color: LIGHT_RED, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      })),
    [halo],
  );
  useEffect(
    () => () => {
      glyphs.forEach((g) => g.geometry.dispose());
      mats.forEach((m) => Object.values(m).forEach((x) => x.dispose()));
      halo.dispose();
    },
    [glyphs, mats, halo],
  );

  const layout = useRef<Layout>({ ready: false, scale: 0, letters: WORDMARK.map(() => new THREE.Vector3()), center: new THREE.Vector3(), cap: 1, worldW: 1, worldH: 1 });
  const word = useRef<THREE.Group>(null);
  const letterRefs = useRef<(THREE.Group | null)[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const haloRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cursorLight = useRef<THREE.PointLight>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.DirectionalLight>(null);
  // Scene-wide light level: the studio stays dim until the letters ignite,
  // so unlit letters read as dark glass and the start lights as pure red.
  const stage = useRef({ light: 0.2, scrollY: 0, scrollZ: 0, scrollTilt: 0, primed: false });
  const sweep = useRef<THREE.Mesh>(null);

  // Per-letter motion state.
  const motion = useRef(
    WORDMARK.map(() => ({ hover: false, lift: 0, tilt: 0, spin: 0, spinTarget: 0, z: 0, v: 0, kicked: false })),
  );

  // ── Overlay the DOM letters ─────────────────────────────────────────────
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const measure = () => {
      const canvasRect = gl.domElement.getBoundingClientRect();
      const base = baseline.current;
      const h1 = heading.current;
      const els = spans.current;
      if (!base || !h1 || !els || !canvasRect.height) return;
      const worldH = 2 * cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const k = worldH / canvasRect.height;
      const fontPx = parseFloat(getComputedStyle(h1).fontSize);
      const scale = (fontPx / WORDMARK_UNITS_PER_EM) * k;
      const cx = canvasRect.left + canvasRect.width / 2;
      const cy = canvasRect.top + canvasRect.height / 2;
      const baseY = base.getBoundingClientRect().top;
      const abs = WORDMARK.map((_, i) => {
        const r = els[i]?.getBoundingClientRect();
        if (!r) return new THREE.Vector3();
        return new THREE.Vector3(
          (r.left - cx) * k + glyphs[i].cx * scale,
          -(baseY - cy) * k + (WORDMARK_CAP_HEIGHT / 2) * scale,
          0,
        );
      });
      const center = abs.reduce((a, v) => a.add(v), new THREE.Vector3()).divideScalar(abs.length);
      center.y = abs[0].y;
      const L = layout.current;
      L.center.copy(center);
      L.letters = abs.map((v) => v.clone().sub(center));
      L.scale = scale;
      L.cap = WORDMARK_CAP_HEIGHT * scale;
      L.worldH = worldH;
      L.worldW = worldH * (canvasRect.width / canvasRect.height);
      L.ready = true;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (heading.current) ro.observe(heading.current);
    ro.observe(gl.domElement);
    // Letter positions move when the web font swaps in.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [camera, gl, size, spans, baseline, heading, glyphs]);

  // ── Pointer affordance ──────────────────────────────────────────────────
  const setCursor = (pointer: boolean) => {
    section.current?.style.setProperty("cursor", pointer ? "pointer" : "");
  };
  const over = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    motion.current[i].hover = true;
    setCursor(true);
  };
  const out = (i: number) => () => {
    motion.current[i].hover = false;
    if (!motion.current.some((m) => m.hover)) setCursor(false);
  };
  const click = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A full turn per click; clicks stack while it's still spinning.
    if (!reduce) motion.current[i].spinTarget += Math.PI * 2;
  };
  useEffect(() => {
    const el = section.current;
    return () => {
      el?.style.removeProperty("cursor");
    };
  }, [section]);

  useFrame((state, delta) => {
    const L = layout.current;
    if (!word.current) return;
    // Hidden until the overlay is measured (glyphs are in font units until scaled).
    word.current.visible = L.ready;
    if (!L.ready) return;
    const dt = Math.min(delta, 1 / 30);
    const tl = timeline.current;
    const s = elapsed(tl);
    const lit = s >= 0 ? litCount(tl, s) : 0;
    const ignited = s >= tl.go;
    const sinceGo = s - tl.go;
    const t = state.clock.elapsedTime;

    // Word: pinned over the DOM heading; scroll tips it back and away;
    // the cursor tilts it. Only the motion is eased — never the overlay
    // position itself, so it can't drift off the text it covers.
    const hero = section.current;
    const st = stage.current;
    // First visible frame: jump straight to the current state (the scene
    // may arrive after the lights already went out) instead of easing in.
    const snap = !st.primed;
    st.primed = true;
    const scrollP = hero && !reduce ? THREE.MathUtils.clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1) : 0;
    easing.damp(st, "scrollY", scrollP * L.cap * 0.6, 0.12, dt);
    easing.damp(st, "scrollZ", -scrollP * 6, 0.12, dt);
    easing.damp(st, "scrollTilt", scrollP * 0.7, 0.12, dt);
    word.current.position.set(L.center.x, L.center.y + st.scrollY, L.center.z + st.scrollZ);
    const px = reduce ? 0 : state.pointer.x;
    const py = reduce ? 0 : state.pointer.y;
    easing.dampE(word.current.rotation, [-py * 0.12 + st.scrollTilt, px * 0.22, 0], 0.35, dt);

    easing.damp(st, "light", ignited ? 1 : 0.32, snap ? 1e-4 : ignited ? 0.25 : 0.05, dt);
    if (keyLight.current) keyLight.current.intensity = 2.2 * st.light;
    if (fillLight.current) fillLight.current.intensity = 0.5 * st.light;

    WORDMARK.forEach((ch, i) => {
      const g = letterRefs.current[i];
      const mesh = meshRefs.current[i];
      const haloMesh = haloRefs.current[i];
      const m = motion.current[i];
      const mat = mats[i];
      if (!g || !mesh || !haloMesh) return;
      const isU = ch === "U";

      // Colour state: dark → red start light → dark → ignited.
      let face = UNLIT_FACE;
      let side = UNLIT_SIDE;
      let emissive = BLACK;
      let emissiveI = 0;
      let haloColor = LIGHT_RED;
      let haloOpacity = 0;
      let tau = 0.09;
      if (ignited) {
        face = isU ? EMBER : PAPER;
        side = isU ? SIDE_EMBER : SIDE_PAPER;
        emissive = isU ? EMBER : PAPER;
        const breathe = reduce ? 0 : Math.sin(t * 2.2) * 0.12;
        emissiveI = isU ? 0.42 + breathe : 0.14;
        haloColor = EMBER;
        haloOpacity = isU ? 0.32 + breathe : 0;
        // A brief flash on ignition, then settle.
        if (sinceGo < 0.5) emissiveI += (0.5 - sinceGo) * 1.6;
        tau = 0.16;
      } else if (i < lit) {
        face = LIT_FACE;
        side = LIT_FACE;
        emissive = LIGHT_RED;
        emissiveI = 1.15;
        haloOpacity = 0.85;
        tau = 0.03; // bulbs snap on
      } else if (s >= tl.out) {
        tau = 0.025; // and snap off
      }
      if (snap) tau = 1e-4;
      mat.face.envMapIntensity = 1.3 * st.light;
      mat.side.envMapIntensity = st.light;
      easing.dampC(mat.face.color, face, tau, dt);
      easing.dampC(mat.face.emissive, emissive, tau, dt);
      easing.damp(mat.face, "emissiveIntensity", emissiveI, tau, dt);
      easing.dampC(mat.side.color, side, tau, dt);
      easing.dampC(mat.side.emissive, emissive, tau, dt);
      easing.damp(mat.side, "emissiveIntensity", emissiveI * 0.6, tau, dt);
      easing.dampC(mat.halo.color, haloColor, tau, dt);
      easing.damp(mat.halo, "opacity", haloOpacity, tau, dt);

      // Ignition surge: each letter is kicked toward the camera in turn.
      // Only for a live sequence — a skipped or repeat visit just settles.
      if (ignited && !m.kicked && sinceGo >= i * 0.045) {
        m.kicked = true;
        if (!reduce && sinceGo < 0.5) m.v = 7 * L.cap;
      }
      const step = springStep(m.z, m.v, dt);
      m.z = step.z;
      m.v = step.v;

      easing.damp(m, "lift", m.hover && !reduce ? L.cap * 0.38 : 0, 0.14, dt);
      easing.damp(m, "tilt", m.hover && !reduce ? -0.22 : 0, 0.14, dt);
      easing.damp(m, "spin", m.spinTarget, 0.55, dt);

      const float = reduce || !ignited ? 0 : Math.sin(t * 0.9 + i * 0.8) * L.cap * 0.012;
      g.position.set(L.letters[i].x, L.letters[i].y + float, m.z + m.lift);
      g.rotation.set(m.tilt, m.spin, 0);
      mesh.scale.setScalar(L.scale);
      haloMesh.scale.setScalar(L.cap * 2.1);
      haloMesh.position.z = -L.cap * 0.25;
    });

    // Warm light that follows the pointer across the bevels.
    if (cursorLight.current) {
      easing.damp3(cursorLight.current.position, [px * L.worldW * 0.5, py * L.worldH * 0.5, L.cap * 1.6], 0.12, dt);
      cursorLight.current.distance = L.cap * 6;
      cursorLight.current.intensity = 9 * st.light;
    }
    // Softbox reflection sweeping the clear coat every ~7s.
    if (sweep.current) sweep.current.position.x = reduce ? -30 : ((t % 7) / 7) * 40 - 20;
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight ref={keyLight} position={[-4, 6, 8]} intensity={0.7} />
      <directionalLight ref={fillLight} position={[6, -3, 5]} intensity={0.16} color="#ffb59a" />
      <spotLight position={[0, 5, -9]} angle={0.7} penumbra={1} intensity={45} color="#ff3a1a" />
      <pointLight ref={cursorLight} intensity={3} color="#ffb89c" decay={2} />

      <Environment resolution={128} frames={reduce ? 1 : Infinity}>
        <Lightformer form="rect" intensity={1.6} position={[0, 6, 4]} rotation={[Math.PI / 2.4, 0, 0]} scale={[16, 4, 1]} />
        <Lightformer form="rect" intensity={0.9} position={[-8, 0, 4]} rotation={[0, Math.PI / 3, 0]} scale={[6, 10, 1]} color="#ffd2c0" />
        <Lightformer form="rect" intensity={0.8} position={[8, 0, 4]} rotation={[0, -Math.PI / 3, 0]} scale={[6, 10, 1]} color="#ff6a3a" />
        <Lightformer ref={sweep} form="rect" intensity={3} position={[-30, 0, 6]} scale={[1.2, 14, 1]} color="#ffffff" />
      </Environment>

      <group ref={word} visible={false}>
        {WORDMARK.map((ch, i) => (
          <group key={ch} ref={(el) => void (letterRefs.current[i] = el)}>
            <mesh
              ref={(el) => void (haloRefs.current[i] = el)}
              material={mats[i].halo}
              renderOrder={-1}
            >
              <planeGeometry />
            </mesh>
            <mesh
              ref={(el) => void (meshRefs.current[i] = el)}
              geometry={glyphs[i].geometry}
              material={[mats[i].face, mats[i].side]}
              onPointerOver={over(i)}
              onPointerOut={out(i)}
              onClick={click(i)}
            />
          </group>
        ))}
      </group>

      <Streaks layout={layout} timeline={timeline} reduce={reduce} />
    </>
  );
}
