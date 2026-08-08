/**
 * components/home/Footer.tsx
 *
 * FJUAN global footer.
 *
 * Visual direction:
 * - Dark motorsport interface
 * - No unnecessary divider lines
 * - Dot-grid texture
 * - Large FJUAN watermark
 * - Telemetry-inspired statistics
 * - Red ambient glow
 * - Responsive layout
 * - Lightweight CSS animations
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/drivers", label: "Drivers", code: "01" },
  { href: "/teams", label: "Teams", code: "02" },
  { href: "/tracks", label: "Circuits", code: "03" },
  { href: "/calendar", label: "Calendar", code: "04" },
  { href: "/compare", label: "Compare", code: "05" },
  { href: "/predict", label: "Predict", code: "06" },
  { href: "/live", label: "Live", code: "07" },
];

const FOOTER_STATS = [
  { label: "Seasons", value: "76" },
  { label: "Races", value: "1100+" },
  { label: "Drivers", value: "780+" },
  { label: "Circuits", value: "77" },
];

const Footer = () => {
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animations after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes footerReveal {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes footerGlow {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(1);
          }

          50% {
            opacity: 0.55;
            transform: scale(1.08);
          }
        }

        @keyframes footerPulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.35;
            transform: scale(0.7);
          }
        }

        @keyframes footerRing {
          0% {
            opacity: 0.7;
            transform: scale(0.6);
          }

          100% {
            opacity: 0;
            transform: scale(3);
          }
        }

        @keyframes watermarkMove {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-25px, 0, 0);
          }
        }

        .fjuan-footer-link {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 7px 0;

          text-decoration: none;

          color: rgba(255,255,255,0.32);

          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .fjuan-footer-link:hover {
          color: white;
          transform: translateX(6px);
        }

        .fjuan-footer-link:hover .footer-arrow {
          color: #E10600;
          transform: translateX(4px);
        }

        .footer-arrow {
          color: rgba(255,255,255,0.12);

          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .footer-stat {
          transition:
            transform 0.25s ease,
            background 0.25s ease;
        }

        .footer-stat:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.035) !important;
        }

        .footer-stat:hover .footer-stat-value {
          color: #E10600 !important;
        }

        @media (max-width: 760px) {
          .fjuan-footer-grid {
            grid-template-columns: 1fr !important;
          }

          .fjuan-footer-brand {
            max-width: 420px !important;
          }

          .fjuan-footer-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 480px) {
          .fjuan-footer-stats {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <footer
        style={{
          position: "relative",
          overflow: "hidden",

          background: "#050505",

          paddingTop: "clamp(5rem, 9vw, 9rem)",
          paddingBottom: "clamp(1.5rem, 3vw, 2.5rem)",
        }}
      >
        {/* Technical grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,

            pointerEvents: "none",

            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
            `,
            backgroundSize: "42px 42px",

            maskImage: "linear-gradient(to bottom, black, transparent 80%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black, transparent 80%)",
          }}
        />

        {/* Ambient red glow */}
        <div
          style={{
            position: "absolute",

            left: "-8%",
            bottom: "-30%",

            width: "600px",
            height: "600px",

            borderRadius: "50%",

            background:
              "radial-gradient(circle, rgba(225,6,0,0.12), transparent 68%)",

            filter: "blur(20px)",

            pointerEvents: "none",

            animation: "footerGlow 6s ease-in-out infinite",
          }}
        />

        {/* Secondary glow */}
        <div
          style={{
            position: "absolute",

            right: "-15%",
            top: "10%",

            width: "500px",
            height: "500px",

            borderRadius: "50%",

            background:
              "radial-gradient(circle, rgba(225,6,0,0.045), transparent 70%)",

            pointerEvents: "none",
          }}
        />

        {/* Oversized background wordmark */}
        <div
          style={{
            position: "absolute",

            right: "-3%",
            bottom: "-3%",

            fontFamily: "'Russo One', sans-serif",

            fontSize: "clamp(8rem, 22vw, 22rem)",

            lineHeight: 0.75,

            letterSpacing: "-0.07em",

            color: "transparent",

            WebkitTextStroke: "1px rgba(255,255,255,0.025)",

            pointerEvents: "none",
            userSelect: "none",

            whiteSpace: "nowrap",

            animation: "watermarkMove 8s ease-in-out infinite alternate",
          }}
        >
          FJUAN
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,

            width: "min(1400px, 100%)",

            margin: "0 auto",

            padding: "0 clamp(1rem, 4vw, 3rem)",
            boxSizing: "border-box",
          }}
        >
          {/* Main footer layout */}
          <div
            className="fjuan-footer-grid"
            style={{
              display: "grid",

              gridTemplateColumns: "1.5fr 0.8fr 1fr",

              gap: "clamp(3rem, 8vw, 8rem)",

              alignItems: "start",

              animation: mounted
                ? "footerReveal 0.7s cubic-bezier(0.16,1,0.3,1) both"
                : "none",
            }}
          >
            {/* Brand */}
            <div className="fjuan-footer-brand">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",

                  marginBottom: "22px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    color: "white",
                    letterSpacing: "-0.05em",
                  }}
                >
                  FJ
                </span>

                <span
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    color: "#E10600",
                    letterSpacing: "-0.05em",
                  }}
                >
                  U
                </span>

                <span
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    color: "white",
                    letterSpacing: "-0.05em",
                  }}
                >
                  AN
                </span>
              </div>

              <p
                style={{
                  maxWidth: "420px",

                  margin: 0,

                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "1rem",
                  lineHeight: 1.7,

                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Formula 1 statistics, telemetry analytics, race data, driver
                performance, and prediction tools built into one high-speed data
                platform.
              </p>

              {/* Live status */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",

                  marginTop: "28px",

                  padding: "8px 12px",

                  background: "rgba(225,6,0,0.055)",

                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.4rem",
                  letterSpacing: "0.14em",

                  color: "rgba(225,6,0,0.72)",

                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    position: "relative",

                    width: "6px",
                    height: "6px",

                    borderRadius: "50%",

                    background: "#E10600",

                    animation: "footerPulse 1.5s infinite",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: "-3px",

                      borderRadius: "50%",

                      background: "rgba(225,6,0,0.3)",

                      animation: "footerRing 1.5s infinite",
                    }}
                  />
                </span>
                2026 Season / Live Data
              </div>
            </div>

            {/* Navigation */}
            <div>
              <div
                style={{
                  marginBottom: "16px",

                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.42rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",

                  color: "rgba(255,255,255,0.2)",
                }}
              >
                Explore
              </div>

              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="fjuan-footer-link"
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.38rem",
                          color: "rgba(225,6,0,0.5)",
                        }}
                      >
                        {link.code}
                      </span>

                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          letterSpacing: "0.13em",
                          textTransform: "uppercase",
                        }}
                      >
                        {link.label}
                      </span>
                    </span>

                    <span className="footer-arrow">→</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Statistics */}
            <div>
              <div
                style={{
                  marginBottom: "16px",

                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.42rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",

                  color: "rgba(255,255,255,0.2)",
                }}
              >
                Dataset
              </div>

              <div
                className="fjuan-footer-stats"
                style={{
                  display: "grid",

                  gridTemplateColumns: "repeat(2, 1fr)",

                  gap: "6px",
                }}
              >
                {FOOTER_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="footer-stat"
                    style={{
                      padding: "16px",

                      background: "rgba(255,255,255,0.018)",
                    }}
                  >
                    <div
                      className="footer-stat-value"
                      style={{
                        marginBottom: "5px",

                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "1.25rem",

                        color: "white",

                        transition: "color 0.2s ease",
                      }}
                    >
                      {stat.value}
                    </div>

                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.36rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",

                        color: "rgba(255,255,255,0.18)",
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Build information */}
              <div
                style={{
                  marginTop: "20px",

                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.38rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",

                  color: "rgba(255,255,255,0.15)",
                }}
              >
                Build
                <span
                  style={{
                    marginLeft: "8px",
                    color: "#E10600",
                  }}
                >
                  v2.6.0
                </span>
              </div>
            </div>
          </div>

          {/* Footer metadata */}
          <div
            style={{
              marginTop: "clamp(4rem, 8vw, 7rem)",

              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",

              flexWrap: "wrap",
              gap: "12px",

              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.38rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",

              color: "rgba(255,255,255,0.14)",
            }}
          >
            <span>© 2026 FJUAN</span>

            <span>Not affiliated with F1, FOM, or FIA</span>

            <span>
              Built by{" "}
              <span style={{ color: "rgba(255,255,255,0.35)" }}>
                Xander Rancap
              </span>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
