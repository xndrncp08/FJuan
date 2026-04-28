/**
 * TrackDetailPage – Individual circuit information page.
 * ENHANCED ANIMATIONS — drop-in replacement
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCircuit } from "@/lib/api/jolpica";
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

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ circuitId: string }>;
}) {
  const { circuitId } = await params;

  const localData = circuitsData.find((c) => c.id === circuitId);
  if (!localData) notFound();

  let apiCircuit: any = null;
  try {
    apiCircuit = await getCircuit(circuitId);
  } catch {
    /* fall back to local data silently */
  }

  const {
    name,
    location,
    country,
    description,
    length,
    laps,
    distance,
    firstGP,
    lapRecord,
    lapRecordHolder,
    lapRecordYear,
    layoutUrl,
  } = localData;

  const circuitShort = name.split(" ")[0].toUpperCase();

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

        {/* Speed lines — varied durations, start off-canvas */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[
            { top: "18%", width: "35%", delay: "0s",   dur: "3.2s", opacity: 0.07 },
            { top: "32%", width: "55%", delay: "0.5s", dur: "3.8s", opacity: 0.05 },
            { top: "48%", width: "25%", delay: "1.1s", dur: "2.9s", opacity: 0.09 },
            { top: "61%", width: "45%", delay: "0.3s", dur: "3.5s", opacity: 0.06 },
            { top: "74%", width: "30%", delay: "1.6s", dur: "4.0s", opacity: 0.04 },
            { top: "85%", width: "62%", delay: "0.8s", dur: "3.4s", opacity: 0.05 },
            { top: "24%", width: "20%", delay: "1.8s", dur: "2.6s", opacity: 0.03 },
            { top: "55%", width: "40%", delay: "2.2s", dur: "3.1s", opacity: 0.04 },
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
                animation: `detailSpeedLine ${line.dur} linear ${line.delay} infinite`,
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

        {/* Ghost country watermark — drifts in */}
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
            textTransform: "uppercase",
            animation: "detailGhostDrift 1.4s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {country}
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "80px",
              background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 50%, transparent 100%)",
              animation: "detailScanSweep 4s linear 1.5s infinite",
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
            href="/tracks"
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
              animation: "detailSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            ← All Circuits
          </Link>

          {/* Overline row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.25rem",
              animation: "detailSlideUp 0.6s 0.05s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div style={{ position: "relative", width: "6px", height: "6px", flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#E10600",
                  animation: "detailPulseCore 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  background: "rgba(225,6,0,0.3)",
                  animation: "detailPulseRing 2s ease-in-out infinite",
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
              {location}
            </span>
            <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              Since {firstGP}
            </span>
          </div>

          {/* Circuit name */}
          <h1
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              lineHeight: 0.92,
              textTransform: "uppercase",
              color: "white",
              letterSpacing: "-0.025em",
              margin: "0 0 0.5rem",
              maxWidth: "70%",
              animation: "detailSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {(() => {
              const words = name.split(" ");
              const last = words.pop();
              return (
                <>
                  {words.join(" ")}{" "}
                  <span style={{ color: "#E10600" }}>{last}</span>
                </>
              );
            })()}
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
              color: "rgba(255,255,255,0.3)",
              margin: "0 0 2rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              maxWidth: "520px",
              lineHeight: 1.6,
              animation: "detailSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {description}
          </p>

          {/* Lap record pill — pulses border */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 1rem",
              background: "rgba(225,6,0,0.06)",
              border: "1px solid rgba(225,6,0,0.18)",
              animation: `
                detailSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both,
                detailPillPulse 3s 1.5s ease-in-out infinite
              `,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "#E10600", flexShrink: 0 }}
            >
              <circle cx="8" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 6v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Lap Record: {lapRecord} — {lapRecordHolder} ({lapRecordYear})
            </span>
          </div>
        </div>

        {/* Bottom edge line — wipes in */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 40%, transparent 70%)",
            zIndex: 3,
            animation: "detailEdgeWipe 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />

        {/* Left accent bar — grows down */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "3px", height: "60%",
            background: "linear-gradient(180deg, #E10600 0%, transparent 100%)",
            zIndex: 3,
            animation: "detailAccentGrow 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
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
          <SectionHeader overline="At a Glance" title="Circuit Statistics" />

          {/* Key stats grid — each card shimmer-reveals on entry */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
              gap: "2px",
              marginBottom: "2px",
            }}
          >
            {[
              { label: "Length",   value: length,        delay: "0.35s" },
              { label: "Race Laps", value: String(laps),  delay: "0.42s" },
              { label: "Distance", value: distance,       delay: "0.49s" },
              { label: "First GP", value: String(firstGP), delay: "0.56s" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.01)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "1.25rem 1.5rem",
                  animation: `detailStatReveal 0.5s ${s.delay} cubic-bezier(0.16,1,0.3,1) both`,
                }}
              >
                {/* One-shot shimmer highlight */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                    animation: `detailShimmer 1.2s ${s.delay} linear both`,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
              gap: "2px",
              marginTop: "2rem",
              animation: "detailSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {/* Left: Track layout image */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "3px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.01)",
                padding: "1.75rem",
              }}
            >
              <SectionHeader overline="Track Layout" />
              <div
                style={{
                  background: "#060606",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "240px",
                  padding: "2rem",
                }}
              >
                <img
                  src={layoutUrl}
                  alt={`${name} circuit layout`}
                  style={{
                    maxHeight: "200px",
                    width: "auto",
                    objectFit: "contain",
                    opacity: 0.9,
                    animation: "detailLayoutReveal 0.8s 0.5s cubic-bezier(0.16,1,0.3,1) both",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  textAlign: "center",
                  marginTop: "1rem",
                }}
              >
                {laps} laps · {distance}
              </div>
            </div>

            {/* Right: Circuit info table */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "3px solid #E10600",
                background: "rgba(255,255,255,0.01)",
                padding: "1.75rem",
              }}
            >
              {/* Top red glow */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: "60px",
                  background: "linear-gradient(180deg, rgba(225,6,0,0.08) 0%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              <SectionHeader overline="Circuit Info" />

              <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Country",           value: country },
                  { label: "Location",          value: location },
                  { label: "Circuit Length",    value: length },
                  { label: "Race Laps",         value: String(laps) },
                  { label: "Race Distance",     value: distance },
                  { label: "First Grand Prix",  value: String(firstGP) },
                  ...(apiCircuit?.url
                    ? [{ label: "Wikipedia", value: "View Article →", href: apiCircuit.url as string }]
                    : []),
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.9rem 1.25rem",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      animation: `detailRowReveal 0.4s ${0.4 + i * 0.05}s cubic-bezier(0.16,1,0.3,1) both`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                      }}
                    >
                      {row.label}
                    </span>
                    {"href" in row ? (
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "0.78rem",
                          color: "#E10600",
                          textDecoration: "none",
                        }}
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span
                        style={{
                          fontFamily: "'Russo One', sans-serif",
                          fontSize: "0.78rem",
                          color: "white",
                        }}
                      >
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Back link */}
          <div
            style={{
              marginTop: "3rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Link
              href="/tracks"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
              }}
            >
              ← Back to All Circuits
            </Link>
          </div>
        </div>
      </section>

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes detailSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Ghost watermark drifts in from right */
        @keyframes detailGhostDrift {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Speed lines — start fully off-canvas */
        @keyframes detailSpeedLine {
          0%   { transform: translateX(-120%); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(130vw); opacity: 0; }
        }

        /* Broadcast scan sweep */
        @keyframes detailScanSweep {
          from { transform: translateY(-100%); }
          to   { transform: translateY(2000%); }
        }

        /* Pulse dot */
        @keyframes detailPulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.6; }
        }
        @keyframes detailPulseRing {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0; }
        }

        /* Edge line wipes in from left */
        @keyframes detailEdgeWipe {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }

        /* Accent bar grows downward */
        @keyframes detailAccentGrow {
          from { transform: scaleY(0); transform-origin: top; }
          to   { transform: scaleY(1); transform-origin: top; }
        }

        /* Lap record pill pulses border */
        @keyframes detailPillPulse {
          0%, 100% { border-color: rgba(225,6,0,0.18); box-shadow: none; }
          50%       { border-color: rgba(225,6,0,0.5);  box-shadow: 0 0 12px rgba(225,6,0,0.1); }
        }

        /* Stat cards pop in */
        @keyframes detailStatReveal {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* One-shot shimmer on stat cards */
        @keyframes detailShimmer {
          0%   { background-position: -200% center; transform: translateX(-100%); }
          100% { background-position:  200% center; transform: translateX(200%); }
        }

        /* Table rows stagger in from right */
        @keyframes detailRowReveal {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Layout image fades + scales in */
        @keyframes detailLayoutReveal {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 0.9; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}