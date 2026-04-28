/**
 * components/home/Footer.tsx — "TECHNICAL BULLETIN" redesign
 *
 * Aesthetic: race team's end-of-season technical report.
 * Grid-aligned, monospaced data columns, red-ruled section headers,
 * a lap counter easter egg, and a bottom bar that reads like an FIA bulletin.
 *
 * Layout:
 */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/drivers",  label: "Drivers",   code: "01" },
  { href: "/teams",    label: "Teams",     code: "02" },
  { href: "/tracks",   label: "Circuits",  code: "03" },
  { href: "/calendar", label: "Calendar",  code: "04" },
  { href: "/compare",  label: "Compare",   code: "05" },
  { href: "/predict",  label: "Predict",   code: "06" },
  { href: "/live",     label: "Live",      code: "07" },
];

const DATA_SOURCES = [
  { name: "Jolpica API",   status: "LIVE",    latency: "42ms"  },
  { name: "OpenF1 API",    status: "LIVE",    latency: "89ms"  },
  { name: "RSS News",      status: "POLLING", latency: "—"     },
];

const STATS = [
  { label: "Seasons",  value: "76"   },
  { label: "Races",    value: "1100+" },
  { label: "Drivers",  value: "780+" },
  { label: "Circuits", value: "77"   },
];

const Footer = () => {
  const [lapTime, setLapTime]   = useState(0);
  const [ticking, setTicking]   = useState(false);
  const [blinkOn, setBlinkOn]   = useState(true);

  /* Lap timer easter egg — click to start/stop */
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setLapTime(t => t + 0.013), 13);
    return () => clearInterval(id);
  }, [ticking]);

  /* Status blink */
  useEffect(() => {
    const id = setInterval(() => setBlinkOn(b => !b), 800);
    return () => clearInterval(id);
  }, []);

  const formatLap = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms   = Math.floor((t % 1) * 1000);
    return `${String(mins).padStart(1,"0")}:${String(secs).padStart(2,"0")}.${String(ms).padStart(3,"0")}`;
  };

  return (
    <>
      <style>{`
        @keyframes footerDotBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          50%       { box-shadow: 0 0 6px 1px rgba(34, 197, 94, 0.3); }
        }
        .footer-nav-link {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: color 0.12s ease, padding-left 0.15s ease;
          min-height: 36px;
        }
        .footer-nav-link:hover {
          color: white;
          padding-left: 6px;
        }
        .footer-nav-link:hover .footer-link-code {
          color: #E10600;
        }
        .footer-stat-val {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          color: white;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .footer-stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.42rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          margin-top: 3px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-brand-col {
            grid-column: 1 / -1 !important;
          }
          .footer-stats-strip {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
          .footer-brand-col {
            grid-column: 1 !important;
          }
        }
      `}</style>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        background: "#060606",
        overflow: "hidden",
      }}>

        {/* 2px red top accent */}
        <div style={{
          height: "2px",
          background: "linear-gradient(90deg, #E10600 0%, #ff2010 40%, rgba(225,6,0,0.5) 70%, transparent 100%)",
        }} />

        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.008) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.008) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Red corner bloom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: "40%", height: "60%",
          background: "radial-gradient(ellipse 80% 70% at 0% 100%, rgba(225,6,0,0.04) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(2rem, 5vw, 3.5rem) clamp(0.75rem, 4vw, 1.5rem) clamp(1.5rem, 4vw, 2.5rem)",
          position: "relative", zIndex: 1,
        }}>

          {/* ── Stats strip — full width above columns ─────────────── */}
          <div
            className="footer-stats-strip"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              background: "rgba(255,255,255,0.04)",
              marginBottom: "2rem",
            }}
          >
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                background: "#090909",
                padding: "0.85rem 1rem",
                borderTop: i === 0 ? "2px solid #E10600" : "2px solid transparent",
              }}>
                <div className="footer-stat-val">{s.value}</div>
                <div className="footer-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Main 4-column grid ────────────────────────────────── */}
          <div
            className="footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              gap: "clamp(1.5rem, 4vw, 2.5rem)",
              alignItems: "start",
            }}
          >

            {/* Brand column */}
            <div className="footer-brand-col">
              {/* Logo */}
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "baseline", gap: "0" }}>
                {["FJ", "U", "AN"].map((p, i) => (
                  <span key={i} style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "1.5rem", letterSpacing: "-0.01em",
                    color: i === 1 ? "#E10600" : "white",
                  }}>{p}</span>
                ))}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.4rem", letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.2)",
                  alignSelf: "flex-end", marginLeft: "5px", marginBottom: "2px",
                }}>·26</span>
              </div>

              <p style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
                fontSize: "0.85rem", lineHeight: 1.75,
                color: "rgba(255,255,255,0.28)",
                maxWidth: "220px", margin: "0 0 1rem",
              }}>
                Comprehensive Formula 1 statistics, telemetry analytics, and race prediction engine.
              </p>

              {/* Lap timer easter egg */}
              <button
                onClick={() => setTicking(t => !t)}
                style={{
                  background: ticking ? "rgba(225,6,0,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${ticking ? "rgba(225,6,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer",
                  padding: "0.45rem 0.75rem",
                  display: "flex", alignItems: "center", gap: "8px",
                  transition: "all 0.15s ease",
                  marginBottom: "0.75rem",
                }}
                title="Lap timer"
              >
                <span style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: ticking ? "#E10600" : "rgba(255,255,255,0.2)",
                  animation: ticking ? "footerDotBlink 0.6s step-end infinite" : "none",
                  transition: "background 0.15s ease",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.58rem", letterSpacing: "0.1em",
                  color: ticking ? "white" : "rgba(255,255,255,0.25)",
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.15s ease",
                  minWidth: "7ch",
                }}>
                  {formatLap(lapTime)}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.38rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}>
                  {ticking ? "STOP" : "LAP"}
                </span>
              </button>

              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem",
                letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase", margin: 0,
              }}>
                Built by Xander Rancap
              </p>
            </div>

            {/* Navigate column */}
            <div>
              {/* Column header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "0.85rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(225,6,0,0.25)",
              }}>
                <div style={{ width: "12px", height: "1.5px", background: "#E10600" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}>Navigate</span>
              </div>
              <nav>
                {NAV_LINKS.map(link => (
                  <Link key={link.href} href={link.href} className="footer-nav-link">
                    <span className="footer-link-code" style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.38rem", letterSpacing: "0.06em",
                      color: "rgba(255,255,255,0.18)",
                      minWidth: "1.4rem",
                      transition: "color 0.12s ease",
                    }}>{link.code}</span>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Data sources column */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "0.85rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(225,6,0,0.25)",
              }}>
                <div style={{ width: "12px", height: "1.5px", background: "#E10600" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}>Data Sources</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {DATA_SOURCES.map(src => (
                  <div key={src.name} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.5rem 0.6rem",
                    background: "#0a0a0a",
                    borderLeft: `2px solid ${src.status === "LIVE" ? "rgba(34,197,94,0.5)" : "rgba(255,200,0,0.4)"}`,
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem",
                      letterSpacing: "0.06em", color: "rgba(255,255,255,0.45)",
                    }}>{src.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.38rem",
                        letterSpacing: "0.08em",
                        color: src.status === "LIVE" ? "rgba(34,197,94,0.7)" : "rgba(255,200,0,0.6)",
                      }}>{src.latency}</span>
                      <span style={{
                        width: "4px", height: "4px", borderRadius: "50%",
                        background: src.status === "LIVE" ? "#22c55e" : "#fbbf24",
                        opacity: blinkOn ? 1 : 0.2,
                        transition: "opacity 0.1s",
                        animation: src.status === "LIVE" ? "statusPulse 2s ease infinite" : "none",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status column */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "0.85rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(225,6,0,0.25)",
              }}>
                <div style={{ width: "12px", height: "1.5px", background: "#E10600" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}>System</span>
              </div>

              {/* System status tiles */}
              {[
                { label: "API",       ok: true  },
                { label: "Standings", ok: true  },
                { label: "Live Feed", ok: true  },
                { label: "Predict",   ok: true  },
              ].map(item => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.45rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                  }}>{item.label}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem",
                    letterSpacing: "0.1em",
                    color: item.ok ? "rgba(34,197,94,0.7)" : "rgba(225,6,0,0.8)",
                    display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    <span style={{
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: item.ok ? "#22c55e" : "#E10600",
                      opacity: blinkOn ? 1 : 0.3,
                      transition: "opacity 0.1s",
                    }} />
                    {item.ok ? "OK" : "ERR"}
                  </span>
                </div>
              ))}

              {/* Version tag */}
              <div style={{
                marginTop: "1rem",
                padding: "0.5rem 0.65rem",
                background: "rgba(225,6,0,0.06)",
                border: "1px solid rgba(225,6,0,0.15)",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.38rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)", marginBottom: "2px",
                }}>Build</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
                  letterSpacing: "0.06em", color: "#E10600",
                }}>v2.6.0 · 2026</div>
              </div>
            </div>
          </div>

          {/* ── Bottom FIA-style bulletin bar ──────────────────────── */}
          <div style={{
            marginTop: "clamp(1.5rem, 4vw, 2.5rem)",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap", gap: "0.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}>© 2026 FJUAN</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.42rem",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.1)" }} />
                NOT AFFILIATED WITH FORMULA 1, FOM, OR FIA
              </span>
            </div>

            {/* Mini live indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px",
              border: "1px solid rgba(225,6,0,0.18)",
              background: "rgba(225,6,0,0.04)",
            }}>
              <span style={{
                width: "4px", height: "4px", borderRadius: "50%",
                background: "#E10600",
                animation: "footerDotBlink 1.2s step-end infinite",
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.42rem",
                letterSpacing: "0.14em", textTransform: "uppercase",
                color: "rgba(225,6,0,0.7)",
              }}>Live · 2026 Season</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;