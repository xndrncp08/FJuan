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

const Footer = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <style>{`
        @keyframes footerEdgeWipe {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes footerFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes footerPulseRing {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes footerPulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.6; }
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          padding: 0.55rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: padding-left 0.15s ease;
          position: relative;
        }
        .footer-link::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: #E10600;
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform 0.15s ease;
        }
        .footer-link:hover { padding-left: 8px; }
        .footer-link:hover::before { transform: scaleY(1); }
        .footer-link:hover .fl-label { color: white !important; }
        .footer-link:hover .fl-arrow { color: #E10600 !important; opacity: 1 !important; }
      `}</style>

      <footer style={{
        position: "relative",
        background: "#060606",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>

        {/* 2px red rule — wipes in */}
        <div style={{
          height: "2px",
          background: "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 50%, transparent 100%)",
          animation: mounted ? "footerEdgeWipe 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both" : "none",
        }} />

        {/* Dot-grid texture — same as circuits hero */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Diagonal slash */}
        <div style={{
          position: "absolute",
          top: "-10%", right: "-5%",
          width: "40%", height: "120%",
          background: "linear-gradient(105deg, transparent 45%, rgba(225,6,0,0.03) 45%, rgba(225,6,0,0.06) 55%, transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* Red radial bloom — bottom left */}
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: "40%", height: "60%",
          background: "radial-gradient(ellipse 80% 70% at 0% 100%, rgba(225,6,0,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Ghost watermark */}
        <div style={{
          position: "absolute",
          right: "-2%", bottom: "-12%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(6rem, 14vw, 13rem)",
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.025)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease",
        }}>
          FJUAN
        </div>

        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,1.5rem) clamp(1.25rem,3vw,2rem)",
          position: "relative", zIndex: 1,
        }}>

          {/* ── Main row ────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr",
            gap: "clamp(2rem,5vw,4rem)",
            alignItems: "start",
            marginBottom: "clamp(1.5rem,4vw,2.5rem)",
          }}>

            {/* Brand */}
            <div style={{
              animation: mounted ? "footerFadeUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}>
              {/* Wordmark */}
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: "1rem" }}>
                {["FJ","U","AN"].map((p, i) => (
                  <span key={i} style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "1.5rem",
                    letterSpacing: "-0.01em",
                    color: i === 1 ? "#E10600" : "white",
                  }}>{p}</span>
                ))}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.38rem", letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.18)",
                  alignSelf: "flex-end", marginLeft: "5px", marginBottom: "2px",
                }}>·26</span>
              </div>

              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 400, fontSize: "0.82rem",
                lineHeight: 1.7, color: "rgba(255,255,255,0.24)",
                maxWidth: "220px", margin: "0 0 1.5rem",
              }}>
                Formula 1 statistics, telemetry analytics, and race prediction.
              </p>

              {/* Live pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "5px 12px",
                border: "1px solid rgba(225,6,0,0.2)",
                background: "rgba(225,6,0,0.04)",
              }}>
                <div style={{ position: "relative", width: "6px", height: "6px" }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "#E10600",
                    animation: "footerPulseCore 2s ease-in-out infinite",
                  }} />
                  <div style={{
                    position: "absolute", inset: "-3px", borderRadius: "50%",
                    background: "rgba(225,6,0,0.3)",
                    animation: "footerPulseRing 2s ease-in-out infinite",
                  }} />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.4rem", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "rgba(225,6,0,0.65)",
                }}>Live · 2026 Season</span>
              </div>
            </div>

            {/* Navigate */}
            <div style={{
              animation: mounted ? "footerFadeUp 0.6s 0.22s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "0.85rem", paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(225,6,0,0.18)",
              }}>
                <div style={{ width: "10px", height: "1.5px", background: "#E10600" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.42rem", letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                }}>Navigate</span>
              </div>
              <nav>
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="footer-link">
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.36rem", letterSpacing: "0.06em",
                      color: "rgba(255,255,255,0.14)", minWidth: "1.4rem",
                    }}>{link.code}</span>
                    <span className="fl-label" style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700, fontSize: "0.7rem",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                      transition: "color 0.12s ease", flex: 1,
                    }}>{link.label}</span>
                    <span className="fl-arrow" style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.32rem", color: "rgba(255,255,255,0.1)",
                      opacity: 0.5, transition: "color 0.12s ease, opacity 0.12s ease",
                    }}>→</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Info */}
            <div style={{
              animation: mounted ? "footerFadeUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "0.85rem", paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(225,6,0,0.18)",
              }}>
                <div style={{ width: "10px", height: "1.5px", background: "#E10600" }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.42rem", letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                }}>Info</span>
              </div>

              {[
                { label: "Seasons",  value: "76"    },
                { label: "Races",    value: "1100+" },
                { label: "Drivers",  value: "780+"  },
                { label: "Circuits", value: "77"    },
              ].map((s, i) => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  padding: "0.45rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  animation: mounted ? `footerFadeUp 0.5s ${0.35 + i * 0.06}s cubic-bezier(0.16,1,0.3,1) both` : "none",
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.4rem", letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                  }}>{s.label}</span>
                  <span style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "0.85rem", color: "white", letterSpacing: "-0.01em",
                  }}>{s.value}</span>
                </div>
              ))}

              <div style={{ marginTop: "1rem" }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.35rem", letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.12)",
                  marginBottom: "3px",
                }}>Build</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.48rem", letterSpacing: "0.06em",
                  color: "#E10600",
                }}>v2.6.0 · 2026</div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ──────────────────────────────────── */}
          <div style={{
            paddingTop: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.42rem", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
              }}>© 2026 FJUAN</span>
              <span style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.38rem", letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.1)",
              }}>NOT AFFILIATED WITH F1, FOM, OR FIA</span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.38rem", letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.12)",
            }}>Built by Xander Rancap</span>
          </div>

        </div>
      </footer>
    </>
  );
};

export default Footer;