/**
 * components/home/HeroSection.tsx — "Pit Wall" redesign
 *
 * Compact cinematic header. Not full-viewport — real estate belongs to the
 * dashboard below. Sets the tone: dark, precise, military-industrial.
 *
 * Layers:
 *  1. Abstract SVG circuit outline (annotated with DRS zones, sectors, SF line)
 *  2. Noise grain + fine grid
 *  3. Animated telemetry waveform (SVG, two traces: speed + throttle)
 *  4. Scan-line sweep + mouse radial glow
 *  5. Content: season badge · FJUAN wordmark · data strip · CTA pills
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TICKER = [
  "2026 SEASON LIVE",
  "24 RACES · 10 TEAMS · 20 DRIVERS",
  "REAL-TIME TELEMETRY AVAILABLE",
  "STATISTICAL PREDICTION ENGINE V2",
  "HISTORICAL DATA BACK TO 1950",
  "COMPARE ANY TWO DRIVERS HEAD TO HEAD",
  "BUILT BY XANDER RANCAP",
  "POWERED BY JOLPICA + OPENF1",
];

function buildWave(pts: number, w: number, h: number, phase: number, amp: number): string {
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

export default function HeroSection() {
  const [mounted, setMounted]     = useState(false);
  const [glitch, setGlitch]       = useState(false);
  const [mouse, setMouse]         = useState({ x: 0.5, y: 0.5 });
  const [phase, setPhase]         = useState(0);
  const sectionRef                = useRef<HTMLElement>(null);
  const rafRef                    = useRef<number>(0);

  useEffect(() => {
    setMounted(true);

    // Glitch burst every 7s
    const gi = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 110);
    }, 7000);

    // Animate telemetry waveform phase
    const animate = () => {
      setPhase(p => p + 0.018);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => { clearInterval(gi); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const speedWave    = mounted ? buildWave(100, 1400, 100, phase, 0.22) : "";
  const throttleWave = mounted ? buildWave(100, 1400, 100, phase * 0.8 + 1.2, 0.14) : "";

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative", overflow: "hidden",
        background: "#060606",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* ── 1. Noise grain ──────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        pointerEvents: "none", opacity: 0.38, mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
        backgroundSize: "160px",
      }} />

      {/* ── 2. Abstract circuit SVG backdrop ────────────────────── */}
      <svg
        style={{
          position: "absolute", top: 0, right: 0,
          height: "100%", width: "55%", zIndex: 0,
          pointerEvents: "none", opacity: 0.055,
        }}
        viewBox="0 0 800 340"
        preserveAspectRatio="xMaxYMid meet"
      >
        {/* Track outline */}
        <polyline
          points="60,280 130,255 200,290 290,305 375,272 415,210 393,148 328,110 282,72 348,44 458,34 578,50 676,76 736,54 792,88 828,145 808,208 742,250 704,296 618,314 532,292 468,258 408,268 368,308 282,318 178,306 96,288 60,280"
          fill="none" stroke="#E10600" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* SF line */}
        <line x1="58" y1="262" x2="58" y2="298" stroke="#E10600" strokeWidth="2.5" />
        <text x="40" y="258" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="monospace" letterSpacing="0.5">SF</text>
        {/* Sector dots */}
        <circle cx="415" cy="210" r="3.5" fill="#E10600" opacity="0.7" />
        <circle cx="676" cy="76"  r="3.5" fill="#E10600" opacity="0.7" />
        <text x="424" y="206" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">S2</text>
        <text x="685" y="72"  fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">S3</text>
        {/* DRS zones */}
        <line x1="200" y1="290" x2="290" y2="305" stroke="#27F4D2" strokeWidth="2" opacity="0.55" strokeDasharray="5 4" />
        <line x1="618" y1="314" x2="704" y2="296" stroke="#27F4D2" strokeWidth="2" opacity="0.55" strokeDasharray="5 4" />
        <text x="228" y="322" fill="#27F4D2" fontSize="6.5" fontFamily="monospace" opacity="0.55">DRS 1</text>
        <text x="640" y="312" fill="#27F4D2" fontSize="6.5" fontFamily="monospace" opacity="0.55">DRS 2</text>
        {/* Speed trap marker */}
        <polygon points="455,34 465,34 460,26" fill="#FFD700" opacity="0.5" />
        <text x="468" y="38" fill="#FFD700" fontSize="6" fontFamily="monospace" opacity="0.5">TRAP</text>
      </svg>

      {/* ── 3. Fine grid ────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* ── 4. Mouse glow ───────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: `radial-gradient(700px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(225,6,0,0.09) 0%, transparent 55%)`,
        transition: "background 0.1s linear",
      }} />

      {/* ── 5. Red bloom top ────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 70% at 50% -15%, rgba(225,6,0,0.16) 0%, transparent 60%)",
      }} />

      {/* ── 6. Scan line ────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "80px",
          background: "linear-gradient(180deg, transparent 0%, rgba(225,6,0,0.025) 45%, rgba(225,6,0,0.05) 50%, rgba(225,6,0,0.025) 55%, transparent 100%)",
          animation: "heroScan 12s linear infinite",
        }} />
      </div>

      {/* ── 7. Animated telemetry waveforms ─────────────────────── */}
      {mounted && (
        <svg
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}
          viewBox="0 0 1400 100" preserveAspectRatio="none" width="100%" height="100"
        >
          <defs>
            <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="10%"  stopColor="#E10600" stopOpacity="0.6" />
              <stop offset="90%"  stopColor="#E10600" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="throttleGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="10%"  stopColor="#27F4D2" stopOpacity="0.35" />
              <stop offset="90%"  stopColor="#27F4D2" stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d={speedWave}    fill="none" stroke="url(#speedGrad)"    strokeWidth="1.5" />
          <path d={throttleWave} fill="none" stroke="url(#throttleGrad)" strokeWidth="1"   />
        </svg>
      )}

      {/* ── LIVE ticker ─────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        background: "rgba(0,0,0,0.55)",
        overflow: "hidden", height: "28px", display: "flex",
      }}>
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center",
          padding: "0 14px", background: "#E10600", gap: "5px",
        }}>
          <div style={{
            width: "5px", height: "5px", borderRadius: "50%", background: "white",
            animation: "liveDot 1.2s ease-in-out infinite",
          }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", color: "white" }}>
            LIVE
          </span>
        </div>
        <div style={{ overflow: "hidden", flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{
            display: "flex", whiteSpace: "nowrap",
            animation: "tickerScroll 42s linear infinite",
          }}>
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
                letterSpacing: "0.14em", padding: "0 2.5rem",
                color: "rgba(255,255,255,0.32)",
              }}>
                {item}
                <span style={{ color: "#E10600", marginLeft: "2.5rem" }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 5,
        maxWidth: "1280px", margin: "0 auto",
        padding: "clamp(2.2rem, 5vw, 3.8rem) clamp(1.25rem, 4vw, 1.5rem)",
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", gap: "2rem", flexWrap: "wrap",
      }}>

        {/* Left: wordmark */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <div style={{ width: "2px", height: "20px", background: "#E10600" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
              letterSpacing: "0.26em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
            }}>
              2026 · Formula 1 Analytics
            </span>
          </div>

          {/* Wordmark + glitch */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <h1 style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(4rem, 11vw, 9rem)",
              lineHeight: 0.88, letterSpacing: "-0.025em",
              textTransform: "uppercase", color: "white", margin: 0,
              transform: glitch ? "skewX(-2deg) translateX(3px)" : "none",
              transition: glitch ? "none" : "transform 0.08s ease",
            }}>
              FJ<span style={{ color: "#E10600" }}>U</span>AN
            </h1>
            {glitch && (
              <h1 aria-hidden style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(4rem, 11vw, 9rem)",
                lineHeight: 0.88, letterSpacing: "-0.025em",
                textTransform: "uppercase", color: "#E10600",
                margin: 0, position: "absolute", top: 0, left: "4px",
                opacity: 0.22, clipPath: "inset(30% 0 48% 0)", pointerEvents: "none",
              }}>
                FJUAN
              </h1>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ height: "1px", width: "28px", background: "rgba(225,6,0,0.5)" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem",
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
            }}>
              Race Data · Telemetry · Prediction
            </span>
          </div>
        </div>

        {/* Right: data strip + nav */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1rem" }}>

          {/* Telemetry readout chips */}
          <div style={{
            display: "flex", gap: "1px",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
          }}>
            {[
              { label: "Drivers", value: "20" },
              { label: "Rounds",  value: "24" },
              { label: "Seasons", value: "76" },
            ].map((d, i) => (
              <div key={i} style={{
                padding: "0.6rem 1rem", background: "#080808",
                borderTop: i === 0 ? "2px solid #E10600" : "2px solid transparent",
                textAlign: "center", minWidth: "64px",
              }}>
                <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.15rem", color: "white", lineHeight: 1 }}>{d.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginTop: "3px" }}>{d.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {[
              { href: "/drivers", label: "Standings", primary: true },
              { href: "/predict", label: "Predict",   primary: false },
              { href: "/compare", label: "Compare",   primary: false },
              { href: "/calendar",label: "Calendar",  primary: false },
            ].map(({ href, label, primary }) => (
              <Link key={href} href={href}>
                <button style={{
                  padding: "0.5rem 1rem",
                  background: primary ? "#E10600" : "transparent",
                  border: `1px solid ${primary ? "#E10600" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                  fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
                  color: primary ? "white" : "rgba(255,255,255,0.4)",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: "0.35rem",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!primary) { el.style.borderColor = "rgba(225,6,0,0.45)"; el.style.color = "white"; }
                  else el.style.opacity = "0.85";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!primary) { el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "rgba(255,255,255,0.4)"; }
                  else el.style.opacity = "1";
                }}
                >
                  {label}
                  {primary && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "48px",
        background: "linear-gradient(to bottom, transparent, rgba(6,6,6,0.8))",
        pointerEvents: "none", zIndex: 6,
      }} />

      <style>{`
        @keyframes heroScan {
          from { top: -80px; }
          to   { top: 100%; }
        }
        @keyframes liveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.6); }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}