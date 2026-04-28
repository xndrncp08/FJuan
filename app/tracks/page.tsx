/**
 * TracksPage – Race Circuits listing page.
 * ENHANCED ANIMATIONS — drop-in replacement
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCircuits } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";

function SectionHeader({
  overline,
  title,
  subtitle,
}: {
  overline: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.4rem",
        }}
      >
        <div style={{ width: "16px", height: "2px", background: "#E10600" }} />
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#E10600",
          }}
        >
          {overline}
        </span>
      </div>
      {title && (
        <h2
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.01em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.25)",
            margin: "0.3rem 0 0",
            letterSpacing: "0.04em",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function CircuitCard({
  circuit,
  animDelay,
}: {
  circuit: (typeof circuitsData)[number];
  animDelay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/tracks/${circuit.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          borderTop: "3px solid #E10600",
          borderLeft: hovered ? "2px solid rgba(225,6,0,0.5)" : "2px solid transparent",
          background: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.01)",
          transition: "background 0.2s ease, border-left-color 0.2s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 32px rgba(225,6,0,0.08)" : "none",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          cursor: "pointer",
          animation: `tracksSlideUp 0.7s ${animDelay}s cubic-bezier(0.16,1,0.3,1) both`,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Top red glow — fades in on hover */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "linear-gradient(180deg, rgba(225,6,0,0.1) 0%, transparent 100%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.25s ease",
            pointerEvents: "none",
          }}
        />

        {/* Heat-shimmer sweep on hover */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: hovered ? "150%" : "-100%",
            width: "60%",
            height: "100%",
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.025) 50%, transparent 60%)",
            transition: "left 0.55s ease",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Ghost circuit name watermark */}
        <div
          style={{
            position: "absolute",
            right: "-4%",
            bottom: "-10%",
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(4rem, 8vw, 7rem)",
            color: "transparent",
            WebkitTextStroke: hovered
              ? "1px rgba(255,255,255,0.06)"
              : "1px rgba(255,255,255,0.03)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            textTransform: "uppercase",
            transition: "-webkit-text-stroke-color 0.25s ease",
          }}
        >
          {circuit.name.split(" ")[0]}
        </div>

        {/* Track layout image */}
        <div
          style={{
            background: "#060606",
            border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
            height: "110px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            transition: "border-color 0.2s ease",
          }}
        >
          <img
            src={circuit.layoutUrl}
            alt={circuit.name}
            style={{
              maxHeight: "90px",
              width: "auto",
              objectFit: "contain",
              opacity: hovered ? 1 : 0.8,
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "opacity 0.25s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
            }}
            loading="lazy"
          />
        </div>

        {/* Location */}
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {circuit.location}
        </div>

        {/* Circuit name */}
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(0.9rem, 1.8vw, 1.1rem)",
            textTransform: "uppercase",
            color: "white",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            flex: 1,
          }}
        >
          {circuit.name}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.5rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "1rem",
          }}
        >
          {[
            { label: "Length", value: circuit.length },
            { label: "Laps",   value: String(circuit.laps) },
            { label: "Since",  value: String(circuit.firstGP) },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "3px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "0.78rem",
                  color: "white",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Lap record row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: "0.75rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
                marginBottom: "3px",
              }}
            >
              Lap Record
            </div>
            <div
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.85rem",
                color: "#E10600",
              }}
            >
              {circuit.lapRecord}
            </div>
          </div>

          {/* Arrow — slides right on hover */}
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: hovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
              transform: hovered ? "translateX(4px)" : "translateX(0)",
              transition: "color 0.2s ease, transform 0.2s ease",
            }}
          >
            View →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TracksPage() {
  const [circuits, setCircuits] = useState<any[]>([]);

  useEffect(() => {
    async function loadCircuits() {
      let apiCircuits: any[] = [];
      try {
        apiCircuits = await getCircuits("current");
      } catch {
        /* fall back to local JSON order silently */
      }

      const mergedCircuits = (apiCircuits.length > 0 ? apiCircuits : circuitsData)
        .map((api: any) => {
          const local = circuitsData.find(
            (c) => c.id === api.circuitId || c.id === api.id,
          );
          return local ?? null;
        })
        .filter(Boolean) as typeof circuitsData;

      setCircuits(mergedCircuits);
    }

    loadCircuits();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "#060606",
          minHeight: "clamp(300px, 38vw, 460px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Dot-grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />

        {/* Speed lines — varied durations so they desync naturally */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[
            { top: "18%", width: "35%", delay: "0s",    dur: "3.2s", opacity: 0.07 },
            { top: "32%", width: "55%", delay: "0.5s",  dur: "3.8s", opacity: 0.05 },
            { top: "48%", width: "25%", delay: "1.1s",  dur: "2.9s", opacity: 0.09 },
            { top: "61%", width: "45%", delay: "0.3s",  dur: "3.5s", opacity: 0.06 },
            { top: "74%", width: "30%", delay: "1.6s",  dur: "4.0s", opacity: 0.04 },
            { top: "85%", width: "62%", delay: "0.8s",  dur: "3.4s", opacity: 0.05 },
            { top: "24%", width: "20%", delay: "1.8s",  dur: "2.6s", opacity: 0.03 },
            { top: "55%", width: "40%", delay: "2.2s",  dur: "3.1s", opacity: 0.04 },
          ].map((line, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: line.top,
                left: "-120%",
                width: line.width,
                height: "1px",
                background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${line.opacity * 3}) 30%, rgba(255,255,255,${line.opacity}) 70%, transparent 100%)`,
                animation: `tracksSpeedLine ${line.dur} linear ${line.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Diagonal slash geometry */}
        <div
          style={{
            position: "absolute",
            top: "-20%", right: "-5%",
            width: "45%", height: "140%",
            background: "linear-gradient(105deg, transparent 45%, rgba(225,6,0,0.04) 45%, rgba(225,6,0,0.09) 55%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-20%", right: "8%",
            width: "45%", height: "140%",
            background: "linear-gradient(105deg, transparent 47%, rgba(225,6,0,0.03) 47%, rgba(225,6,0,0.055) 50%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-30%", right: "-10%",
            width: "70%", height: "130%",
            background: "radial-gradient(ellipse at top right, rgba(225,6,0,0.13) 0%, rgba(225,6,0,0.04) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Ghost watermark */}
        <div
          style={{
            position: "absolute",
            right: "-2%", bottom: "-15%",
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(8rem, 18vw, 18rem)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.04)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            animation: "tracksGhostDrift 1.4s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          F1
        </div>

        {/* Scan lines + sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* Static scan texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
            }}
          />
          {/* Moving broadcast sweep */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "80px",
              background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 50%, transparent 100%)",
              animation: "tracksScanSweep 4s linear 1.5s infinite",
            }}
          />
        </div>

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
            padding: "clamp(2.5rem,5vw,4.5rem) clamp(1.25rem,4vw,1.5rem)",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              textDecoration: "none",
              marginBottom: "1.5rem",
              animation: "tracksSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            ← Home
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
              animation: "tracksSlideUp 0.6s 0.05s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div style={{ position: "relative", width: "6px", height: "6px" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#E10600",
                  animation: "tracksPulseCore 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  background: "rgba(225,6,0,0.3)",
                  animation: "tracksPulseRing 2s ease-in-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              Formula 1 · 2026 Season
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
              lineHeight: 0.92,
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.025em",
              margin: "0 0 0.5rem",
              animation: "tracksSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            Race <span style={{ color: "#E10600" }}>Circuits</span>
          </h1>

          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
              color: "rgba(255,255,255,0.3)",
              margin: "0 0 2.5rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              maxWidth: "420px",
              animation: "tracksSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            Every circuit on the Formula 1 calendar — track layouts, lap records, and history.
          </p>

          <div
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              animation: "tracksSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {[
              { value: circuits.length || "—", label: "Circuits" },
              { value: "24", label: "Races" },
              { value: "21", label: "Countries" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "1rem clamp(1.25rem, 3vw, 2rem) 0",
                  paddingLeft: i === 0 ? 0 : undefined,
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  paddingRight: i < 2 ? "clamp(1.25rem, 3vw, 2rem)" : 0,
                  animation: `tracksStatReveal 0.5s ${0.35 + i * 0.07}s cubic-bezier(0.16,1,0.3,1) both`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.4rem, 3vw, 2rem)",
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginTop: "4px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom edge line — wipes in from left */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 40%, transparent 70%)",
            zIndex: 3,
            animation: "tracksEdgeWipe 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />

        {/* Left vertical accent bar — grows down */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "3px", height: "60%",
            background: "linear-gradient(180deg, #E10600 0%, transparent 100%)",
            zIndex: 3,
            animation: "tracksAccentGrow 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />
      </section>

      {/* ── Circuit Cards Grid ──────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "#060606",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "3rem clamp(1.25rem,4vw,1.5rem)",
          }}
        >
          <SectionHeader
            overline="2026 Calendar"
            title="All Circuits"
            subtitle="Track layouts, lap records, and circuit statistics"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: "2px",
            }}
          >
            {circuits.map((circuit, i) => (
              <CircuitCard
                key={circuit.id}
                circuit={circuit}
                animDelay={Math.min(i, 12) * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes tracksSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Ghost watermark drifts in from right */
        @keyframes tracksGhostDrift {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Speed lines — start fully off-canvas left */
        @keyframes tracksSpeedLine {
          0%   { transform: translateX(-120%); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(130vw); opacity: 0; }
        }

        /* Broadcast scan sweep */
        @keyframes tracksScanSweep {
          from { transform: translateY(-100%); }
          to   { transform: translateY(2000%); }
        }

        /* Pulse dot */
        @keyframes tracksPulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.6; }
        }
        @keyframes tracksPulseRing {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0; }
        }

        /* Edge line wipes in from left */
        @keyframes tracksEdgeWipe {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }

        /* Accent bar grows downward */
        @keyframes tracksAccentGrow {
          from { transform: scaleY(0); transform-origin: top; }
          to   { transform: scaleY(1); transform-origin: top; }
        }

        /* Stat numbers pop in */
        @keyframes tracksStatReveal {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Card entrance */
        @keyframes tracksCardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}