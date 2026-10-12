/**
 * components/home/HeroSection.tsx
 *
 * Full-screen FJUAN hero, staged as an F1 start.
 *
 *   1. The five letters of FJUAN are the five start lights. They come on
 *      red one by one, hold for a random beat, then all go out.
 *   2. Lights out: the wordmark ignites (paper, ember U), surges at the
 *      camera with speed streaks, and the rest of the hero arrives —
 *      "Lights out and away we go", the stats, the CTAs.
 *   3. Idle: the 3D word tilts toward the cursor with a light following
 *      the pointer; letters lift on hover and spin on click; scrolling
 *      tips it back as the hero leaves.
 *
 * The <h1> is always real text. The WebGL scene (WordmarkScene) is laid
 * exactly over it; without WebGL the DOM letters play the same sequence in
 * 2D. Without JS a CSS fallback lights them after 3s. Any click or key
 * skips to lights out; the intro plays once per session and not at all
 * for reduced motion.
 *
 * Background layers (grid, circuit outline, heat bloom, scanline, cursor
 * glow, telemetry traces) are driven by CSS variables and refs, so pointer
 * movement and the trace animation never re-render React.
 */
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, use, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@/components/ui/icons";
import { WORDMARK } from "@/lib/theme/wordmark";
import { cn } from "@/lib/utils/cn";
import type { HeroHud } from "@/lib/api/heroHud";
import { useLightsSequence } from "./lightsSequence";

const CanvasShell = dynamic(() => import("@/components/three/CanvasShell"), { ssr: false });
const WordmarkScene = dynamic(() => import("./WordmarkScene"), { ssr: false });

const TICKER_STATIC = [
  "Session telemetry from 2023 onward",
  "Results back to 1950",
  "Any two drivers, head to head",
  "Data · Jolpica + OpenF1",
  "Built by Xander Rancap",
];

function tickerItems(h: HeroHud | null) {
  if (!h) return TICKER_STATIC;
  return [
    h.next && `Next · R${h.next.round} ${h.next.name} · ${h.next.locality}`,
    h.leader && `Leader · ${h.leader.code} ${h.leader.points} pts${h.leader.gap !== null ? ` (+${h.leader.gap})` : ""}`,
    h.last && `Last win · ${h.last.winnerCode} · ${h.last.name}`,
    `${h.season} · ${h.roundsDone} of ${h.roundsTotal} rounds run`,
    ...TICKER_STATIC,
  ].filter(Boolean) as string[];
}

const LINKS = [
  { href: "/predict", label: "Predict", code: "02" },
  { href: "/telemetry", label: "3D Telemetry", code: "03" },
  { href: "/compare", label: "Compare", code: "04" },
];

const coord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? pos : neg}`;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Wandering telemetry trace as an SVG path. */
function buildWave(pts: number, w: number, h: number, phase: number, amp: number) {
  let d = `M 0 ${h * 0.5}`;
  for (let i = 1; i <= pts; i++) {
    const x = (i / pts) * w;
    const y =
      h * 0.5 +
      Math.sin(i * 0.28 + phase) * h * amp +
      Math.sin(i * 0.73 + phase * 1.3) * h * amp * 0.45 +
      Math.sin(i * 2.1 + phase * 0.7) * h * amp * 0.18;
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/** Counts up to `target` once `run` turns true. */
function useCountUp(target: number, run: boolean, delay = 0, reduce = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const c = animate(0, target, { duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay, ease: EASE_OUT, onUpdate: (v) => setValue(Math.round(v)) });
    return () => c.stop();
  }, [target, run, delay, reduce]);
  return value;
}

type CanvasState = "pending" | "ready" | "unsupported";

export default function HeroSection({ hud }: { hud: Promise<HeroHud | null> }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const baselineRef = useRef<HTMLSpanElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const speedPath = useRef<SVGPathElement>(null);
  const throttlePath = useRef<SVGPathElement>(null);
  const [canvas, setCanvas] = useState<CanvasState>("pending");
  // The DOM letters stay visible until the 3D overlay has finished fading
  // in on top of them, so a late-loading scene never leaves a gap.
  const [handedOff, setHandedOff] = useState(false);
  const { timeline, phase, lit, begin, skip } = useLightsSequence(reduce);

  const ignited = phase === "go" || phase === "idle";
  const revealed = phase === "out" || ignited;

  // Start the lights once the 3D wordmark exists — or after a short wait,
  // so a slow GPU never holds the page hostage (the DOM letters take over).
  useEffect(() => {
    if (canvas !== "pending") begin();
    const id = setTimeout(begin, 1500);
    return () => clearTimeout(id);
  }, [canvas, begin]);

  useEffect(() => {
    if (canvas !== "ready") return;
    const id = setTimeout(() => setHandedOff(true), 550);
    return () => clearTimeout(id);
  }, [canvas]);

  // JS is running: disable the no-JS CSS ignition fallback.
  useEffect(() => {
    sectionRef.current?.setAttribute("data-hero-js", "");
  }, []);

  // Any click or key during the lights skips to lights out.
  useEffect(() => {
    if (phase !== "lights" && phase !== "pending") return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, skip]);

  // Cursor glow + parallax via CSS variables — no React re-render per move.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduce) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width).toFixed(3));
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height).toFixed(3));
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // Telemetry traces: path data written straight to the DOM, only while
  // the hero is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    const write = (p: number) => {
      speedPath.current?.setAttribute("d", buildWave(100, 1400, 100, p, 0.22));
      throttlePath.current?.setAttribute("d", buildWave(100, 1400, 100, p * 0.8 + 1.2, 0.14));
    };
    write(0);
    if (!el || reduce) return;
    let visible = true;
    let phaseV = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible) {
        phaseV += dt * 1.1;
        write(phaseV);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduce]);


  /** What each DOM letter shows: hidden under the 3D scene, or the 2D sequence. */
  const letterState = (i: number) => {
    if (handedOff) return "under3d";
    if (ignited) return "lit";
    if (phase === "lights" && i < lit) return "red";
    return "dark";
  };

  const reveal = (delay: number) => ({
    initial: false as const,
    animate: revealed ? { opacity: 1, transform: "translateY(0px)" } : { opacity: 0, transform: "translateY(12px)" },
    transition: reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT, delay: revealed ? delay : 0 },
  });

  return (
    <section
      ref={sectionRef}
      onPointerDown={() => (phase === "lights" || phase === "pending") && skip()}
      className="hero relative flex flex-col overflow-hidden bg-ink"
      style={{ ["--mx" as string]: 0.5, ["--my" as string]: 0.4 }}
    >
      {/* ── Background ─────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundSize: "160px",
          }}
        />
        {/* Circuit outline, drifting against the cursor */}
        <div className="hero-parallax absolute inset-0">
          <svg className="absolute right-0 top-0 h-full w-[60%] opacity-[0.07]" viewBox="0 0 800 340" preserveAspectRatio="xMaxYMid meet">
            <polyline
              points="60,280 130,255 200,290 290,305 375,272 415,210 393,148 328,110 282,72 348,44 458,34 578,50 676,76 736,54 792,88 828,145 808,208 742,250 704,296 618,314 532,292 468,258 408,268 368,308 282,318 178,306 96,288 60,280"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="58" y1="262" x2="58" y2="298" stroke="rgb(var(--accent))" strokeWidth="2.5" />
            <line x1="200" y1="290" x2="290" y2="305" stroke="rgb(var(--ember))" strokeWidth="2" strokeDasharray="5 4" />
            <line x1="618" y1="314" x2="704" y2="296" stroke="rgb(var(--ember))" strokeWidth="2" strokeDasharray="5 4" />
            <circle cx="415" cy="210" r="3.5" fill="rgb(var(--accent))" />
            <circle cx="676" cy="76" r="3.5" fill="rgb(var(--accent))" />
          </svg>
        </div>
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgb(var(--paper) / 0.025) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--paper) / 0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 85%)",
          }}
        />
        {/* Heat bloom from below and above */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 65% at 50% 118%, rgb(var(--ember) / 0.3) 0%, rgb(var(--accent) / 0.16) 32%, transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -15%, rgb(var(--accent) / 0.14) 0%, transparent 60%)" }} />
        {/* Ignition: the whole hero warms up when the lights go out */}
        <div
          className={cn("absolute inset-0 transition-opacity duration-700", ignited ? "opacity-100" : "opacity-0")}
          style={{ background: "radial-gradient(ellipse 55% 45% at 50% 46%, rgb(var(--ember) / 0.16), transparent 70%)" }}
        />
        {/* Start-light wash while the letters are red */}
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{ opacity: phase === "lights" ? lit / 5 : 0, background: "radial-gradient(ellipse 60% 40% at 50% 46%, rgb(255 36 20 / 0.14), transparent 70%)" }}
        />
        {/* Cursor glow */}
        <div className="hero-glow absolute inset-0" />
        {/* Scanline */}
        <div className="hero-scan absolute inset-x-0 h-20" />
        {/* Telemetry traces */}
        <div className="hero-parallax-soft absolute inset-x-0 bottom-9">
          <span className="absolute left-[10%] top-0 hidden font-mono text-[0.625rem] tracking-[0.2em] text-accent/70 sm:inline">SPD</span>
          <span className="absolute left-[13%] top-0 hidden font-mono text-[0.625rem] tracking-[0.2em] text-ember/60 sm:inline">THR</span>
          <svg viewBox="0 0 1400 100" preserveAspectRatio="none" width="100%" height="110">
            <defs>
              <linearGradient id="heroSpeed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="10%" stopColor="rgb(var(--accent))" stopOpacity="0.55" />
                <stop offset="90%" stopColor="rgb(var(--accent))" stopOpacity="0.55" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="heroThrottle" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="10%" stopColor="rgb(var(--ember))" stopOpacity="0.4" />
                <stop offset="90%" stopColor="rgb(var(--ember))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path ref={speedPath} fill="none" stroke="url(#heroSpeed)" strokeWidth="1.5" />
            <path ref={throttlePath} fill="none" stroke="url(#heroThrottle)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* ── 3D wordmark (pointer events come from the section) ─────── */}
      <div
        className={cn("pointer-events-none absolute inset-0 z-[4] transition-opacity duration-500", canvas === "ready" ? "opacity-100" : "opacity-0")}
      >
        <CanvasShell
          label="FJUAN"
          decorative
          eventSource={sectionRef}
          camera={{ position: [0, 0, 30], fov: 18 }}
          onReady={() => setCanvas("ready")}
          onUnsupported={() => setCanvas("unsupported")}
          fallback={null}
        >
          <WordmarkScene timeline={timeline} spans={spansRef} baseline={baselineRef} heading={headingRef} section={sectionRef} reduce={!!reduce} />
        </CanvasShell>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="relative z-[5] flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-8">
        {/* Eyebrow with the five-light gantry */}
        <div className="mb-5 flex items-center gap-2.5 sm:mb-6 sm:gap-3">
          <span className="h-[18px] w-[2px] bg-accent" aria-hidden />
          <span className="flex gap-1.5" aria-hidden>
            {WORDMARK.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-[background-color,box-shadow] duration-75",
                  phase === "lights" && i < lit ? "bg-[#ff2414] shadow-[0_0_10px_2px_rgb(255_36_20/0.75)]" : "bg-paper/15",
                )}
              />
            ))}
          </span>
          <span className="whitespace-nowrap font-mono text-[0.75rem] uppercase tracking-[0.2em] text-label-3 sm:tracking-[0.28em]">
            2026 · <span className="sm:hidden">F1</span>
            <span className="hidden sm:inline">Formula 1</span> Analytics
          </span>
          <span className="h-[18px] w-[2px] bg-accent" aria-hidden />
        </div>

        {/* Wordmark */}
        <div className="relative w-full">
          {/* Ignition ring */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full motion-reduce:hidden"
            style={{ background: "radial-gradient(circle, rgb(var(--ember) / 0.9) 0%, rgb(var(--accent) / 0.45) 45%, transparent 72%)" }}
            initial={false}
            animate={!reduce && phase === "go" ? { opacity: [0.9, 0], transform: ["scale(0.6)", "scale(34)"] } : { opacity: 0, transform: "scale(0.6)" }}
            transition={{ duration: 1.3, ease: EASE_OUT }}
          />
          <h1
            ref={headingRef}
            aria-label="FJUAN"
            className="relative m-0 w-full font-display uppercase leading-[0.82] tracking-[-0.02em]"
            style={{ fontSize: "clamp(4.5rem, 18vw, 17rem)" }}
          >
            {WORDMARK.map((ch, i) => (
              <span
                key={ch}
                ref={(el) => void (spansRef.current[i] = el)}
                aria-hidden
                data-state={letterState(i)}
                data-letter={ch}
                className="hero-letter inline-block"
              >
                {ch}
              </span>
            ))}
            {/* Baseline probe: lets the 3D scene sit glyphs exactly on the text baseline. */}
            <span ref={baselineRef} aria-hidden className="inline-block h-0 w-0 align-baseline" />
          </h1>
        </div>

        {/* Tagline: the call on ignition, then the product line */}
        <div className="mt-5 flex min-h-5 items-center gap-4 sm:mt-6">
          <span className="hidden h-px w-7 bg-accent/50 sm:block" aria-hidden />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={phase === "go" ? "go" : "line"}
              className={cn("font-mono text-[0.75rem] uppercase tracking-[0.14em] sm:tracking-[0.22em]", phase === "go" ? "text-tint" : "text-label-3")}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
              animate={{ opacity: revealed ? 1 : 0, transform: "translateY(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            >
              {phase === "go" ? "Lights out and away we go" : "Race data · Telemetry · Prediction"}
            </motion.p>
          </AnimatePresence>
          <span className="hidden h-px w-7 bg-accent/50 sm:block" aria-hidden />
        </div>

        <motion.div {...reveal(0)} className="mt-7 w-full max-w-3xl sm:mt-8" style={{ pointerEvents: revealed ? "auto" : "none" }}>
          <Suspense fallback={<SpecStripSkeleton />}>
            <SpecStrip hud={hud} run={revealed} reduce={!!reduce} />
          </Suspense>
        </motion.div>

        <motion.nav {...reveal(0.08)} aria-label="Start here" className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-0" style={{ pointerEvents: revealed ? "auto" : "none" }}>
          <Link
            href="/drivers"
            tabIndex={revealed ? undefined : -1}
            className="pressable group flex h-12 items-center gap-3 bg-accent px-6 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-paper hover:bg-[#D5170F] hover:shadow-[0_0_28px_rgb(var(--accent)/0.5)]"
          >
            <span className="font-mono text-[0.6875rem] text-paper">01</span>
            Standings
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <ul className="flex flex-wrap justify-center sm:ml-2 sm:border-l sm:border-paper/15 sm:pl-2">
            {LINKS.map(({ href, label, code }) => (
              <li key={href}>
                <Link href={href} tabIndex={revealed ? undefined : -1} className="pressable group flex h-12 items-center gap-2 px-3.5 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-label-2 hover:text-paper">
                  <span className="font-mono text-[0.625rem] text-label-3 group-hover:text-tint">{code}</span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>

      {/* Instrument frame: corner brackets, an edge ruler that tracks the pointer, and live readouts. */}
      <motion.div {...reveal(0.2)} aria-hidden className="pointer-events-none absolute inset-0 z-[5] hidden sm:block">
        <span className="hero-bracket left-6 top-6 border-l border-t" />
        <span className="hero-bracket right-6 top-6 border-r border-t" />
        <span className="hero-bracket bottom-[4.5rem] left-6 border-b border-l" />
        <span className="hero-bracket bottom-[4.5rem] right-6 border-b border-r" />
        <div className="hero-ruler absolute bottom-[6rem] left-8 top-24 w-3" />
        <Suspense fallback={null}>
          <HudCorners hud={hud} />
        </Suspense>
      </motion.div>

      {/* Skip (only while the lights are running) */}
      <AnimatePresence>
        {(phase === "lights" || (phase === "pending" && canvas !== "pending")) && (
          <motion.button
            type="button"
            onClick={skip}
            className="absolute bottom-14 right-4 z-[6] h-10 px-3 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-label-3 hover:text-paper sm:right-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Skip intro
          </motion.button>
        )}
      </AnimatePresence>

      {/* LIVE ticker */}
      <div className="relative z-10 flex h-8 shrink-0 overflow-hidden bg-maroon/50 backdrop-blur-sm">
        <div className="flex shrink-0 items-center gap-1.5 bg-accent px-3.5">
          <span className="hero-live-dot h-1.5 w-1.5 rounded-full bg-paper" aria-hidden />
          <span className="font-mono text-[0.75rem] font-bold tracking-[0.2em] text-paper">FEED</span>
        </div>
        <div className="flex flex-1 items-center overflow-hidden">
          <Suspense fallback={<Ticker items={TICKER_STATIC} />}>
            <LiveTicker hud={hud} />
          </Suspense>
        </div>
      </div>

      <style>{`
        .hero-letter { transition: color 120ms ease, text-shadow 200ms ease, -webkit-text-stroke-color 120ms ease; }
        .hero-letter[data-state="dark"] { color: transparent; -webkit-text-stroke: 1.5px rgb(var(--paper) / 0.16); }
        .hero-letter[data-state="red"] { color: #ff2414; -webkit-text-stroke: 0; text-shadow: 0 0 28px rgb(255 36 20 / 0.8), 0 0 80px rgb(255 36 20 / 0.45); transition-duration: 40ms; }
        .hero-letter[data-state="lit"] { color: rgb(var(--paper)); -webkit-text-stroke: 0; text-shadow: 0 0 90px rgb(var(--ember) / 0.35); }
        .hero-letter[data-state="lit"][data-letter="U"] { color: rgb(var(--ember)); text-shadow: 0 0 34px rgb(var(--ember) / 0.6); }
        .hero-letter[data-state="under3d"] { color: transparent; -webkit-text-stroke: 0; text-shadow: none; transition: none; }

        /* No JS: light the letters after the moment the sequence would have finished. */
        .hero:not([data-hero-js]) .hero-letter[data-state="dark"] { animation: heroIgnite 0.4s ease-out 3s forwards; }
        .hero:not([data-hero-js]) .hero-letter[data-state="dark"][data-letter="U"] { animation-name: heroIgniteU; }
        @keyframes heroIgnite { to { color: rgb(var(--paper)); -webkit-text-stroke-color: transparent; } }
        @keyframes heroIgniteU { to { color: rgb(var(--ember)); -webkit-text-stroke-color: transparent; } }

        .hero-bracket { position: absolute; width: 22px; height: 22px; border-color: rgb(var(--paper) / 0.28); }
        .hero-ruler {
          background-image: repeating-linear-gradient(180deg, rgb(var(--paper) / 0.22) 0 1px, transparent 1px 12px), repeating-linear-gradient(180deg, rgb(var(--paper) / 0.32) 0 1px, transparent 1px 60px);
          background-size: 6px 100%, 12px 100%;
          background-repeat: no-repeat;
        }
        .hero-ruler::after {
          content: ""; position: absolute; left: 0; width: 18px; height: 2px; background: rgb(var(--accent));
          top: calc(var(--my) * 100%); box-shadow: 0 0 10px rgb(var(--accent) / 0.8); transition: top 0.25s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .hero-spec-bar { transform-origin: left; animation: heroBar 0.9s cubic-bezier(0.23, 1, 0.32, 1) backwards; }
        @keyframes heroBar { from { transform: scaleX(0); } }
        .hero-glow { background: radial-gradient(760px circle at calc(var(--mx) * 100%) calc(var(--my) * 100%), rgb(var(--ember) / 0.1), transparent 55%); }
        .hero-parallax { transform: translate3d(calc((var(--mx) - 0.5) * -16px), calc((var(--my) - 0.5) * -10px), 0); transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
        .hero-parallax-soft { transform: translate3d(calc((var(--mx) - 0.5) * -6px), 0, 0); transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
        .hero-scan { background: linear-gradient(180deg, transparent, rgb(var(--accent) / 0.03) 45%, rgb(var(--accent) / 0.06) 50%, rgb(var(--accent) / 0.03) 55%, transparent); animation: heroScan 12s linear infinite; }
        .hero-ticker { animation: heroTicker 42s linear infinite; }
        .hero-live-dot { animation: heroLive 1.2s ease-in-out infinite; }
        .hero-cue { animation: heroCue 2.2s cubic-bezier(0.23, 1, 0.32, 1) infinite; }
        @keyframes heroScan { from { top: -80px; } to { top: 100%; } }
        @keyframes heroTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes heroLive { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.6); } }
        @keyframes heroCue { 0% { transform: translateY(-8px); opacity: 0; } 40% { opacity: 1; } 100% { transform: translateY(10px); opacity: 0; } }

        @media (prefers-reduced-motion: reduce) {
          .hero-scan, .hero-ticker, .hero-live-dot, .hero-cue { animation: none; }
          .hero-parallax, .hero-parallax-soft { transform: none; }
          .hero:not([data-hero-js]) .hero-letter[data-state="dark"] { animation-delay: 0s; animation-duration: 0.01s; }
        }
      `}</style>
    </section>
  );
}

// ─── Live data (streamed from the server; the hero never waits on it) ────────

function useClock(run = true) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!run) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run]);
  return now;
}

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `T−${d}D ${hh}:${mm}:${ss}`;
}

function SpecCell({ index, label, value, sub, bar, delay }: { index: string; label: string; value: React.ReactNode; sub?: React.ReactNode; bar?: number; delay: number }) {
  return (
    <div className="relative min-w-0 px-4 py-3 text-left">
      <span aria-hidden className="hero-spec-bar absolute inset-x-0 top-0 h-px bg-accent/70" style={{ animationDelay: `${delay}ms` }} />
      <dt className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-label-3">
        <span className="text-tint">{index}</span>
        {label}
      </dt>
      <dd className="mt-1.5 truncate font-display text-[1.25rem] uppercase leading-none text-paper sm:text-[1.375rem]">{value}</dd>
      {sub && <dd className="mt-1 truncate font-mono text-[0.6875rem] tabular-nums text-label-2">{sub}</dd>}
      {bar !== undefined && (
        <dd aria-hidden className="mt-2 h-[3px] bg-paper/10">
          <span className="hero-spec-bar block h-full bg-accent" style={{ width: `${bar * 100}%`, animationDelay: `${delay + 200}ms` }} />
        </dd>
      )}
    </div>
  );
}

// Hairline grid: 1px gaps over a light backing, cells on a dark translucent fill.
const specGrid = "grid grid-cols-2 gap-px border border-paper/10 bg-paper/10 backdrop-blur-md sm:grid-cols-4 [&>*]:bg-[rgb(var(--canvas)/0.72)]";

function SpecStrip({ hud, run, reduce }: { hud: Promise<HeroHud | null>; run: boolean; reduce: boolean }) {
  const h = use(hud);
  const now = useClock(!!h?.next);
  const points = useCountUp(h?.leader?.points ?? 0, run, 0.1, reduce);
  const done = useCountUp(h?.roundsDone ?? 0, run, 0.2, reduce);
  if (!h) return null;
  return (
    <dl className={specGrid}>
      <SpecCell
        index="01"
        label={h.next ? `Next · R${h.next.round}` : "Next"}
        value={h.next?.locality ?? "Season over"}
        sub={h.next ? (now === null ? "T−" : countdown(new Date(h.next.start).getTime() - now)) : undefined}
        delay={0}
      />
      <SpecCell index="02" label="Leader" value={h.leader?.code ?? "—"} sub={h.leader ? `${points} PTS${h.leader.gap !== null ? ` · +${h.leader.gap}` : ""}` : undefined} delay={80} />
      <SpecCell index="03" label={h.last ? `Last win · R${h.last.round}` : "Last win"} value={h.last?.winnerCode ?? "—"} sub={h.last?.name.replace(/ Grand Prix.*/, " GP")} delay={160} />
      <SpecCell index="04" label={`Season ${h.season}`} value={<>{done}<span className="text-label-3">/{h.roundsTotal}</span></>} bar={h.roundsTotal ? h.roundsDone / h.roundsTotal : 0} delay={240} />
    </dl>
  );
}

function SpecStripSkeleton() {
  return (
    <div className={specGrid} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-3">
          <div className="skeleton h-2.5 w-16" />
          <div className="skeleton mt-2 h-5 w-20" />
          <div className="skeleton mt-1.5 h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}

function HudCorners({ hud }: { hud: Promise<HeroHud | null> }) {
  const h = use(hud);
  const now = useClock();
  const utc = now === null ? "--:--:--" : new Date(now).toISOString().slice(11, 19);
  return (
    <>
      <div className="absolute left-12 top-9 font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.18em] text-label-3">
        <p className="text-label-2">FJUAN / Race intelligence</p>
        <p>UTC {utc}{h ? ` · ${h.drivers} drivers tracked` : ""}</p>
      </div>
      {h?.next && (
        <div className="absolute right-12 top-9 text-right font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.18em] text-label-3">
          <p className="text-label-2">Target · {h.next.locality}, {h.next.country}</p>
          <p className="tabular-nums">{coord(h.next.lat, "N", "S")} {coord(h.next.long, "E", "W")}</p>
        </div>
      )}
    </>
  );
}

function LiveTicker({ hud }: { hud: Promise<HeroHud | null> }) {
  return <Ticker items={tickerItems(use(hud))} />;
}

function Ticker({ items }: { items: string[] }) {
  return (
    <div className="hero-ticker flex whitespace-nowrap">
      {[...items, ...items].map((item, i) => (
        <span key={i} aria-hidden={i >= items.length || undefined} className="px-10 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-label-3">
          {item}
          <span className="ml-10 text-ember">·</span>
        </span>
      ))}
    </div>
  );
}
