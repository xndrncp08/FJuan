/**
 * components/home/HeroSection.tsx
 *
 * Full-screen cinematic header (100dvh) with an orchestrated boot-sequence
 * entrance: badge -> wordmark (letter reveal) -> subtitle -> stats -> CTAs -> ticker.
 *
 * Colors come from lib/theme/palette.ts, shared with LastRaceSection and
 * NewsSection so the whole page reads as one continuous surface. This
 * section's background is solid INK, which is also where the shared
 * SECTION_BACKGROUND gradient (used below the hero) starts — that's what
 * makes the transition into the next section seamless, so there's no
 * border or divider line here.
 *
 * Visual layers, back to front: noise grain, circuit-outline SVG (parallax),
 * fine grid, mouse-tracked glow, heat bloom, scanline sweep, telemetry
 * waveform (parallax), content, LIVE ticker.
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";
import { INK, RED, EMBER, PAPER, RGB } from "../../lib/theme/palette";

const TICKER = [
  "2026 SEASON LIVE",
  "24 RACES · 10 TEAMS · 20 DRIVERS",
  "REAL-TIME TELEMETRY AVAILABLE",
  "STATISTICAL PREDICTION ENGINE V4",
  "HISTORICAL DATA BACK TO 1950",
  "COMPARE ANY TWO DRIVERS HEAD TO HEAD",
  "BUILT BY XANDER RANCAP",
  "POWERED BY JOLPICA + OPENF1",
];

const WORDMARK = ["F", "J", "U", "A", "N"];

/** Generates an SVG path string for a wandering telemetry-style line. */
function buildWave(
  pts: number,
  w: number,
  h: number,
  phase: number,
  amp: number,
): string {
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

/** Ticks a number up from 0 to `target` once, on mount + delay. */
function useCountUp(target: number, delay = 0, duration = 1.1) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, delay, duration]);
  return value;
}

// Motion variants for the boot sequence. Each stage is offset by
// `stageDelay` from the previous one so the page reveals itself in order:
// badge, then wordmark, then subtitle, then stats, then CTAs, then ticker.
const stageDelay = 0.22;

const badgeVariant = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0 * stageDelay },
  },
};
const wordContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, delayChildren: 1 * stageDelay },
  },
};
const letterVariant = {
  hidden: { opacity: 0, y: 46, filter: "blur(14px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
  },
};
const subtitleVariant = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 2.1 * stageDelay },
  },
};
const chipsVariant = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 2.6 * stageDelay },
  },
};
const ctaVariant = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 3.1 * stageDelay },
  },
};
const tickerVariant = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 3.6 * stageDelay },
  },
};

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [phase, setPhase] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);

    // Brief skew/double-exposure glitch burst, repeating every 7s.
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 110);
    }, 7000);

    // Drives the telemetry waveform's motion.
    const animateWave = () => {
      setPhase((p) => p + 0.018);
      rafRef.current = requestAnimationFrame(animateWave);
    };
    rafRef.current = requestAnimationFrame(animateWave);

    return () => {
      clearInterval(glitchInterval);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Tracks cursor position within the section, normalized 0-1, for the
  // mouse-glow and parallax effects below.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setMouse({
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const speedWave = mounted ? buildWave(100, 1400, 100, phase, 0.22) : "";
  const throttleWave = mounted
    ? buildWave(100, 1400, 100, phase * 0.8 + 1.2, 0.14)
    : "";

  const drivers = useCountUp(20, 4.0 * stageDelay);
  const rounds = useCountUp(24, 4.15 * stageDelay);
  const seasons = useCountUp(76, 4.3 * stageDelay);

  // Background layers drift opposite the cursor for a subtle depth effect.
  const parX = (mouse.x - 0.5) * -16;
  const parY = (mouse.y - 0.5) * -10;

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        overflow: "hidden",
        height: "100dvh",
        minHeight: "560px",
        display: "flex",
        flexDirection: "column",
        background: INK,
      }}
    >
      {/* Noise grain, for texture on the flat background. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.38,
          mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }}
      />

      {/* Abstract circuit outline with sector markers, DRS zones, and a
          speed-trap flag. Purely decorative, low opacity. Drifts slightly
          with the cursor for depth. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          transform: `translate3d(${parX}px, ${parY}px, 0)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        <svg
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: "60%",
            opacity: 0.06,
          }}
          viewBox="0 0 800 340"
          preserveAspectRatio="xMaxYMid meet"
        >
          <polyline
            points="60,280 130,255 200,290 290,305 375,272 415,210 393,148 328,110 282,72 348,44 458,34 578,50 676,76 736,54 792,88 828,145 808,208 742,250 704,296 618,314 532,292 468,258 408,268 368,308 282,318 178,306 96,288 60,280"
            fill="none"
            stroke={RED}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="58"
            y1="262"
            x2="58"
            y2="298"
            stroke={RED}
            strokeWidth="2.5"
          />
          <text
            x="40"
            y="258"
            fill={`rgba(${RGB.paper},0.5)`}
            fontSize="8"
            fontFamily="monospace"
            letterSpacing="0.5"
          >
            SF
          </text>
          <circle cx="415" cy="210" r="3.5" fill={RED} opacity="0.7" />
          <circle cx="676" cy="76" r="3.5" fill={RED} opacity="0.7" />
          <text
            x="424"
            y="206"
            fill={`rgba(${RGB.paper},0.3)`}
            fontSize="7"
            fontFamily="monospace"
          >
            S2
          </text>
          <text
            x="685"
            y="72"
            fill={`rgba(${RGB.paper},0.3)`}
            fontSize="7"
            fontFamily="monospace"
          >
            S3
          </text>
          <line
            x1="200"
            y1="290"
            x2="290"
            y2="305"
            stroke={EMBER}
            strokeWidth="2"
            opacity="0.55"
            strokeDasharray="5 4"
          />
          <line
            x1="618"
            y1="314"
            x2="704"
            y2="296"
            stroke={EMBER}
            strokeWidth="2"
            opacity="0.55"
            strokeDasharray="5 4"
          />
          <text
            x="228"
            y="322"
            fill={EMBER}
            fontSize="6.5"
            fontFamily="monospace"
            opacity="0.6"
          >
            DRS 1
          </text>
          <text
            x="640"
            y="312"
            fill={EMBER}
            fontSize="6.5"
            fontFamily="monospace"
            opacity="0.6"
          >
            DRS 2
          </text>
          <polygon points="455,34 465,34 460,26" fill={EMBER} opacity="0.55" />
          <text
            x="468"
            y="38"
            fill={EMBER}
            fontSize="6"
            fontFamily="monospace"
            opacity="0.55"
          >
            TRAP
          </text>
        </svg>
      </div>

      {/* Fine grid, barely visible, gives the flat background structure. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(${RGB.paper},0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(${RGB.paper},0.02) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Warm glow that follows the cursor. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `radial-gradient(760px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(${RGB.ember},0.10) 0%, transparent 55%)`,
          transition: "background 0.1s linear",
        }}
      />

      {/* Heat bloom rising from the bottom, like a brake disc glowing —
          this is also what visually hands off into the next section, since
          it fades toward the same INK the section below opens on. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 90% 65% at 50% 118%, rgba(${RGB.ember},0.30) 0%, rgba(${RGB.red},0.16) 32%, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 80% 60% at 50% -15%, rgba(${RGB.red},0.14) 0%, transparent 60%)`,
        }}
      />

      {/* Slow horizontal scanline sweep. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "80px",
            background: `linear-gradient(180deg, transparent 0%, rgba(${RGB.red},0.03) 45%, rgba(${RGB.red},0.06) 50%, rgba(${RGB.red},0.03) 55%, transparent 100%)`,
            animation: "heroScan 12s linear infinite",
          }}
        />
      </div>

      {/* Two animated telemetry traces (speed, throttle), also drifting
          with the cursor. */}
      {mounted && (
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            left: 0,
            right: 0,
            zIndex: 2,
            pointerEvents: "none",
            transform: `translate3d(${parX * 0.4}px, 0, 0)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <svg
            viewBox="0 0 1400 100"
            preserveAspectRatio="none"
            width="100%"
            height="110"
          >
            <defs>
              <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="10%" stopColor={RED} stopOpacity="0.55" />
                <stop offset="90%" stopColor={RED} stopOpacity="0.55" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="throttleGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="10%" stopColor={EMBER} stopOpacity="0.4" />
                <stop offset="90%" stopColor={EMBER} stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d={speedWave}
              fill="none"
              stroke="url(#speedGrad)"
              strokeWidth="1.5"
            />
            <path
              d={throttleWave}
              fill="none"
              stroke="url(#throttleGrad)"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {/* Main content: centered column, full-bleed wordmark. */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 clamp(1rem, 4vw, 2rem)",
        }}
      >
        <motion.div
          initial="hidden"
          animate={mounted ? "show" : "hidden"}
          variants={badgeVariant}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ width: "2px", height: "18px", background: RED }} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: `rgba(${RGB.paper},0.45)`,
            }}
          >
            2026 · Formula 1 Analytics
          </span>
          <div style={{ width: "2px", height: "18px", background: RED }} />
        </motion.div>

        <div style={{ position: "relative", width: "100%" }}>
          {/* Ignition pulse — a single ring that expands and fades behind
              the wordmark as it appears, like the display powering on. */}
          <motion.div
            aria-hidden
            initial={{ scale: 0, opacity: 0.85 }}
            animate={mounted ? { scale: 42, opacity: 0 } : {}}
            transition={{
              duration: 1.5,
              ease: [0.16, 1, 0.3, 1],
              delay: 1 * stageDelay,
            }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "10px",
              height: "10px",
              borderRadius: "9999px",
              background: `radial-gradient(circle, rgba(${RGB.ember},0.9) 0%, rgba(${RGB.red},0.45) 45%, transparent 72%)`,
              translateX: "-50%",
              translateY: "-50%",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          <motion.h1
            initial="hidden"
            animate={mounted ? "show" : "hidden"}
            variants={wordContainer}
            style={{
              position: "relative",
              zIndex: 1,
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(4.5rem, 18vw, 17rem)",
              lineHeight: 0.82,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: PAPER,
              margin: 0,
              width: "100%",
              transform: glitch ? "skewX(-2deg) translateX(3px)" : "none",
              transition: glitch ? "none" : "transform 0.08s ease",
              textShadow: `0 0 90px rgba(${RGB.ember},0.35)`,
            }}
          >
            {/* Each letter animates in on its own delay (staggerChildren
                on the parent). The "U" additionally gets a slow, looping
                ember glow once it's settled. */}
            {WORDMARK.map((char, i) =>
              char === "U" ? (
                <motion.span
                  key={i}
                  variants={letterVariant}
                  style={{ display: "inline-block", color: EMBER }}
                  animate={
                    mounted
                      ? {
                          textShadow: [
                            `0 0 18px rgba(${RGB.ember},0.35)`,
                            `0 0 34px rgba(${RGB.ember},0.7)`,
                            `0 0 18px rgba(${RGB.ember},0.35)`,
                          ],
                        }
                      : {}
                  }
                  transition={{
                    textShadow: {
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.6,
                    },
                  }}
                >
                  {char}
                </motion.span>
              ) : (
                <motion.span
                  key={i}
                  variants={letterVariant}
                  style={{ display: "inline-block" }}
                >
                  {char}
                </motion.span>
              ),
            )}
          </motion.h1>

          {/* Glitch double-exposure: a red duplicate, clipped to a thin
              horizontal band, shown only during the brief glitch state. */}
          {glitch && (
            <h1
              aria-hidden
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(4.5rem, 18vw, 17rem)",
                lineHeight: 0.82,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: RED,
                margin: 0,
                position: "absolute",
                top: 0,
                left: "4px",
                width: "100%",
                zIndex: 2,
                opacity: 0.25,
                clipPath: "inset(30% 0 48% 0)",
                pointerEvents: "none",
              }}
            >
              FJUAN
            </h1>
          )}
        </div>

        <motion.div
          initial="hidden"
          animate={mounted ? "show" : "hidden"}
          variants={subtitleVariant}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginTop: "1.25rem",
          }}
        >
          <div
            style={{
              height: "1px",
              width: "28px",
              background: `rgba(${RGB.red},0.5)`,
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: `rgba(${RGB.paper},0.35)`,
            }}
          >
            Race Data · Telemetry · Prediction
          </span>
          <div
            style={{
              height: "1px",
              width: "28px",
              background: `rgba(${RGB.red},0.5)`,
            }}
          />
        </motion.div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.1rem",
            marginTop: "2rem",
          }}
        >
          <motion.div
            initial="hidden"
            animate={mounted ? "show" : "hidden"}
            variants={chipsVariant}
            style={{
              display: "flex",
              gap: "1px",
              border: `1px solid rgba(${RGB.paper},0.08)`,
              background: `rgba(${RGB.paper},0.02)`,
            }}
          >
            {[
              { label: "Drivers", value: drivers },
              { label: "Rounds", value: rounds },
              { label: "Seasons", value: seasons },
            ].map((d, i) => (
              <div
                key={i}
                style={{
                  padding: "0.6rem 1.1rem",
                  background: `rgba(${RGB.ink},0.6)`,
                  borderTop:
                    i === 0 ? `2px solid ${RED}` : "2px solid transparent",
                  textAlign: "center",
                  minWidth: "68px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "1.2rem",
                    color: PAPER,
                    lineHeight: 1,
                  }}
                >
                  {d.value}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.42rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: `rgba(${RGB.paper},0.3)`,
                    marginTop: "3px",
                  }}
                >
                  {d.label}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            animate={mounted ? "show" : "hidden"}
            variants={ctaVariant}
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              { href: "/drivers", label: "Standings", primary: true },
              { href: "/predict", label: "Predict", primary: false },
              { href: "/compare", label: "Compare", primary: false },
              { href: "/calendar", label: "Calendar", primary: false },
            ].map(({ href, label, primary }) => (
              <Link key={href} href={href}>
                <motion.button
                  whileHover={{
                    scale: 1.045,
                    boxShadow: primary
                      ? `0 0 22px rgba(${RGB.red},0.55)`
                      : `0 0 16px rgba(${RGB.ember},0.3)`,
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    padding: "0.6rem 1.3rem",
                    background: primary ? RED : "transparent",
                    border: `1px solid ${primary ? RED : `rgba(${RGB.paper},0.14)`}`,
                    cursor: "pointer",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: primary ? PAPER : `rgba(${RGB.paper},0.5)`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  onMouseEnter={(e) => {
                    if (!primary)
                      (e.currentTarget as HTMLElement).style.color = PAPER;
                  }}
                  onMouseLeave={(e) => {
                    if (!primary)
                      (e.currentTarget as HTMLElement).style.color =
                        `rgba(${RGB.paper},0.5)`;
                  }}
                >
                  {label}
                  {primary && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M1 6h10M6 1l5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </motion.button>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* LIVE ticker, pinned to the bottom edge of the viewport. */}
      <motion.div
        initial="hidden"
        animate={mounted ? "show" : "hidden"}
        variants={tickerVariant}
        style={{
          position: "relative",
          zIndex: 10,
          background: `rgba(${RGB.maroon},0.5)`,
          backdropFilter: "blur(2px)",
          overflow: "hidden",
          height: "28px",
          display: "flex",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            background: RED,
            gap: "5px",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: PAPER,
              animation: "liveDot 1.2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.52rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: PAPER,
            }}
          >
            LIVE
          </span>
        </div>
        <div
          style={{
            overflow: "hidden",
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "tickerScroll 42s linear infinite",
            }}
          >
            {[...TICKER, ...TICKER].map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.52rem",
                  letterSpacing: "0.14em",
                  padding: "0 2.5rem",
                  color: `rgba(${RGB.paper},0.4)`,
                }}
              >
                {item}
                <span style={{ color: EMBER, marginLeft: "2.5rem" }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes heroScan { from { top: -80px; } to { top: 100%; } }
        @keyframes liveDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.6); } }
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </section>
  );
}
