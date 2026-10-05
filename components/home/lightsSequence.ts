/**
 * components/home/lightsSequence.ts
 *
 * The hero's F1 start sequence. FJUAN has five letters and a start gantry
 * has five red lights: they come on one by one, hold for a random beat,
 * then all go out — and the wordmark ignites.
 *
 * One mutable timeline is shared by the DOM (which only needs the coarse
 * phase, so it re-renders a handful of times) and the WebGL scene (which
 * reads exact timings every frame without touching React).
 *
 * It plays once per browser session; reduced motion and return visits go
 * straight to the finished state.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type Phase = "pending" | "lights" | "out" | "go" | "idle";

/** Seconds after start. */
const LIGHT_STEP = 0.42;
const FIRST_LIGHT = 0.45;
const OUT_TO_GO = 0.24;
const GO_TO_IDLE = 1.6;

export interface Timeline {
  /** performance.now() in ms when the sequence started; null until it starts. */
  start: number | null;
  lights: number[];
  out: number;
  go: number;
  idle: number;
}

function makeTimeline(): Timeline {
  const lights = [0, 1, 2, 3, 4].map((i) => FIRST_LIGHT + i * LIGHT_STEP);
  // Like the real thing, the hold after the fifth light is unpredictable.
  const out = lights[4] + 0.35 + Math.random() * 0.55;
  return { start: null, lights, out, go: out + OUT_TO_GO, idle: out + OUT_TO_GO + GO_TO_IDLE };
}

/** Elapsed seconds on a timeline; Infinity once skipped or finished. */
export function elapsed(t: Timeline, now = performance.now()) {
  return t.start === null ? -1 : (now - t.start) / 1000;
}

/** How many of the five lights are on at `s` seconds. */
export function litCount(t: Timeline, s: number) {
  if (s >= t.out) return 0;
  return t.lights.filter((at) => s >= at).length;
}

export function phaseAt(t: Timeline, s: number): Phase {
  if (s < 0) return "pending";
  if (s >= t.idle) return "idle";
  if (s >= t.go) return "go";
  if (s >= t.out) return "out";
  return "lights";
}

const SEEN_KEY = "fjuan-lights-seen";

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // storage blocked — it just plays again next load
  }
}

/**
 * Drives the sequence. Call `begin()` when the wordmark is ready to be
 * watched (the 3D scene exists, or we've given up waiting for it).
 */
export function useLightsSequence(reduce: boolean | null) {
  // A ref, not state: it's mutated by skip/finish and read every frame by
  // the WebGL scene without re-rendering anything.
  const timelineRef = useRef<Timeline>(makeTimeline());

  const [phase, setPhase] = useState<Phase>("pending");
  const [lit, setLit] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    // Shift the timeline so every frame-reader sees it as finished.
    timelineRef.current.start = performance.now() - timelineRef.current.idle * 1000 - 1;
    setLit(0);
    setPhase("idle");
    markSeen();
  }, []);

  /** Schedule every event still ahead of `from` seconds. */
  const schedule = useCallback(
    (from: number) => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      const at = (s: number, fn: () => void) => {
        if (s > from) timers.current.push(setTimeout(fn, (s - from) * 1000));
      };
      timelineRef.current.lights.forEach((s, i) => at(s, () => setLit(i + 1)));
      at(timelineRef.current.out, () => {
        setLit(0);
        setPhase("out");
      });
      at(timelineRef.current.go, () => setPhase("go"));
      at(timelineRef.current.idle, () => {
        setPhase("idle");
        markSeen();
      });
    },
    [],
  );

  const begin = useCallback(() => {
    if (timelineRef.current.start !== null) return;
    if (reduce || alreadySeen()) return finish();
    timelineRef.current.start = performance.now();
    setPhase("lights");
    schedule(0);
  }, [reduce, finish, schedule]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /**
   * Any click or key during the lights jumps straight to lights out — you
   * still get the ignition, just now.
   */
  const skip = useCallback(() => {
    if (timelineRef.current.start === null) return finish();
    if (elapsed(timelineRef.current) >= timelineRef.current.out) return;
    timelineRef.current.start = performance.now() - timelineRef.current.out * 1000;
    setLit(0);
    setPhase("out");
    schedule(timelineRef.current.out);
  }, [finish, schedule]);

  return { timeline: timelineRef, phase, lit, begin, skip };
}
