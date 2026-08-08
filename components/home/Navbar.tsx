/**
 * components/home/Navbar.tsx
 *
 * FJUAN command navigation.
 *
 * Visual direction:
 * - Motorsport telemetry
 * - Dark neutral background
 * - FJUAN red accent
 * - Grid-based graphics
 * - Animated hover states
 * - Responsive mobile navigation
 * - HUD-style search
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home", code: "00" },
  { href: "/drivers", label: "Drivers", code: "01" },
  { href: "/teams", label: "Teams", code: "02" },
  { href: "/tracks", label: "Circuits", code: "03" },
  { href: "/calendar", label: "Calendar", code: "04" },
  { href: "/compare", label: "Compare", code: "05" },
  { href: "/predict", label: "Predict", code: "06" },
  { href: "/live", label: "Live", code: "07" },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Navigation state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // HUD state
  const [scanPosition, setScanPosition] = useState(0);
  const [time, setTime] = useState("");

  const animationFrame = useRef<number | null>(null);

  // Compress the navbar while scrolling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  // Close mobile navigation after route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Animate the search HUD scan line
  useEffect(() => {
    if (!searchOpen) {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }

      return;
    }

    let position = 0;

    const animate = () => {
      position = (position + 0.3) % 100;
      setScanPosition(position);

      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [searchOpen]);

  // Client-side clock
  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };

    updateTime();

    const interval = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  // Search submission
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);

    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes navReveal {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes hudFade {
          from {
            opacity: 0;
            transform: scale(1.02);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scanMove {
          from {
            transform: translateY(-100%);
          }

          to {
            transform: translateY(100vh);
          }
        }

        @keyframes livePulse {
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

        @keyframes mobileReveal {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes logoPulse {
          0%,
          100% {
            text-shadow: 0 0 0 rgba(225, 6, 0, 0);
          }

          50% {
            text-shadow: 0 0 18px rgba(225, 6, 0, 0.2);
          }
        }

        @keyframes searchGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(225, 6, 0, 0);
          }

          50% {
            box-shadow: 0 0 30px rgba(225, 6, 0, 0.08);
          }
        }

        .fjuan-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 13px;

          color: rgba(255,255,255,0.34);
          text-decoration: none;

          font-family: "Rajdhani", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;

          transition:
            color 0.2s ease,
            letter-spacing 0.2s ease,
            transform 0.2s ease;
        }

        .fjuan-nav-link::after {
          content: "";
          position: absolute;

          left: 13px;
          right: 13px;
          bottom: 7px;

          height: 2px;

          background: #E10600;

          transform: scaleX(0);
          transform-origin: left;

          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fjuan-nav-link:hover {
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.19em;
          transform: translateY(-1px);
        }

        .fjuan-nav-link:hover::after,
        .fjuan-nav-link.active::after {
          transform: scaleX(1);
        }

        .fjuan-nav-link.active {
          color: white;
          letter-spacing: 0.19em;
        }

        .fjuan-mobile-scroll::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 900px) {
          .fjuan-desktop-nav {
            display: none !important;
          }
        }

        @media (min-width: 901px) {
          .fjuan-mobile-button {
            display: none !important;
          }
        }
      `}</style>

      {/* Search HUD */}
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(3,3,3,0.94)",
            backdropFilter: "blur(22px)",
            animation: "hudFade 0.2s ease both",
            overflow: "hidden",
          }}
          onClick={() => setSearchOpen(false)}
        >
          {/* Animated grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.45,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Red scan line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scanPosition}%`,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(225,6,0,0.5), transparent)",
              pointerEvents: "none",
            }}
          />

          {/* Decorative radial glow */}
          <div
            style={{
              position: "absolute",
              width: "500px",
              height: "500px",
              left: "50%",
              top: "35%",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(225,6,0,0.07), transparent 68%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              width: "min(720px, calc(100% - 32px))",
              margin: "15vh auto 0",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Search metadata */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.48rem",
                  letterSpacing: "0.2em",
                  color: "#E10600",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#E10600",
                    animation: "livePulse 1.2s infinite",
                  }}
                />
                FJUAN / SEARCH
              </div>

              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.45rem",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.1em",
                }}
              >
                {time}
              </span>
            </div>

            {/* Search field */}
            <form onSubmit={handleSearch}>
              <div
                style={{
                  position: "relative",
                  animation: searchFocused
                    ? "searchGlow 2s ease infinite"
                    : "none",
                }}
              >
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search drivers, teams, circuits..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",

                    padding: "22px 110px 22px 24px",

                    background: "rgba(10,10,10,0.92)",
                    border: `1px solid ${
                      searchFocused
                        ? "rgba(225,6,0,0.5)"
                        : "rgba(255,255,255,0.08)"
                    }`,

                    outline: "none",

                    color: "white",

                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",

                    transition: "border-color 0.2s ease",
                  }}
                />

                <button
                  type="submit"
                  aria-label="Submit search"
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    bottom: "8px",

                    width: "72px",

                    border: "none",
                    background: "#E10600",
                    color: "white",

                    cursor: "pointer",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    transition: "background 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#ff1a0d";
                    event.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "#E10600";
                    event.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  →
                </button>
              </div>
            </form>

            {/* Search suggestions */}
            <div
              style={{
                marginTop: "40px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              {NAV_LINKS.filter((link) => link.href !== "/").map(
                (link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSearchOpen(false)}
                    style={{
                      minHeight: "74px",
                      padding: "14px",

                      background: "rgba(255,255,255,0.025)",

                      textDecoration: "none",

                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",

                      color: "rgba(255,255,255,0.42)",

                      transition:
                        "background 0.2s ease, color 0.2s ease, transform 0.2s ease",

                      animation: `mobileReveal 0.3s ${
                        index * 0.035
                      }s ease both`,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background =
                        "rgba(225,6,0,0.08)";
                      event.currentTarget.style.color = "white";
                      event.currentTarget.style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background =
                        "rgba(255,255,255,0.025)";
                      event.currentTarget.style.color =
                        "rgba(255,255,255,0.42)";
                      event.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.4rem",
                        color: "#E10600",
                      }}
                    >
                      {link.code}
                    </span>

                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {link.label}
                    </span>
                  </Link>
                ),
              )}
            </div>

            {/* Keyboard hints */}
            <div
              style={{
                marginTop: "28px",
                display: "flex",
                gap: "24px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.4rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
              }}
            >
              <span>ESC / CLOSE</span>
              <span>ENTER / SEARCH</span>
            </div>
          </div>
        </div>
      )}

      {/* Main navbar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,

          width: "100%",

          animation: "navReveal 0.5s ease both",
        }}
      >
        <div
          style={{
            position: "relative",

            background: isScrolled ? "rgba(5,5,5,0.96)" : "rgba(5,5,5,0.82)",

            backdropFilter: "blur(20px)",

            transition: "background 0.3s ease",
          }}
        >
          {/* Background grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,

              pointerEvents: "none",

              opacity: isScrolled ? 0.18 : 0.28,

              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",

              maskImage: "linear-gradient(to right, black, transparent 80%)",
              WebkitMaskImage:
                "linear-gradient(to right, black, transparent 80%)",
            }}
          />

          {/* Ambient red glow */}
          <div
            style={{
              position: "absolute",
              left: "8%",
              top: "-100px",

              width: "280px",
              height: "180px",

              background:
                "radial-gradient(circle, rgba(225,6,0,0.08), transparent 70%)",

              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",

              width: "min(1400px, 100%)",
              margin: "0 auto",

              height: isScrolled ? "54px" : "64px",

              padding: "0 clamp(16px, 3vw, 42px)",

              display: "flex",
              alignItems: "center",

              transition: "height 0.25s ease",
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              style={{
                position: "relative",

                display: "flex",
                alignItems: "baseline",

                textDecoration: "none",

                flexShrink: 0,

                animation: "logoPulse 4s ease infinite",
              }}
            >
              <span
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: isScrolled ? "1.15rem" : "1.35rem",
                  lineHeight: 1,
                  color: "white",
                  letterSpacing: "-0.04em",
                  transition: "font-size 0.25s ease",
                }}
              >
                FJ
              </span>

              <span
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: isScrolled ? "1.15rem" : "1.35rem",
                  lineHeight: 1,
                  color: "#E10600",
                  letterSpacing: "-0.04em",
                  transition: "font-size 0.25s ease",
                }}
              >
                U
              </span>

              <span
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: isScrolled ? "1.15rem" : "1.35rem",
                  lineHeight: 1,
                  color: "white",
                  letterSpacing: "-0.04em",
                  transition: "font-size 0.25s ease",
                }}
              >
                AN
              </span>

              <span
                style={{
                  marginLeft: "5px",
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.35rem",
                }}
              >
                26
              </span>
            </Link>

            {/* Desktop navigation */}
            <div
              className="fjuan-desktop-nav"
              style={{
                display: "flex",
                alignItems: "center",

                height: "100%",

                marginLeft: "clamp(24px, 4vw, 64px)",
              }}
            >
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                const isLive = link.href === "/live";
                const isPredict = link.href === "/predict";

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`fjuan-nav-link ${isActive ? "active" : ""}`}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "9px",
                        left: "13px",

                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.32rem",

                        color: isActive
                          ? "rgba(225,6,0,0.7)"
                          : "rgba(255,255,255,0.12)",
                      }}
                    >
                      {link.code}
                    </span>

                    {isLive && (
                      <span
                        style={{
                          width: "5px",
                          height: "5px",

                          borderRadius: "50%",

                          background: "#E10600",

                          marginRight: "4px",

                          animation: "livePulse 1.4s infinite",

                          boxShadow: "0 0 10px rgba(225,6,0,0.8)",
                        }}
                      />
                    )}

                    {isPredict && !isActive && (
                      <span
                        style={{
                          color: "#E10600",
                          marginRight: "4px",
                        }}
                      >
                        ✦
                      </span>
                    )}

                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right controls */}
            <div
              style={{
                marginLeft: "auto",

                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              {/* Clock */}
              <span
                className="fjuan-desktop-nav"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.42rem",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.08em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {time}
              </span>

              {/* Search */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",

                  padding: "9px 13px",

                  background: "rgba(255,255,255,0.035)",

                  border: "none",

                  color: "rgba(255,255,255,0.38)",

                  cursor: "pointer",

                  transition:
                    "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "rgba(225,6,0,0.08)";
                  event.currentTarget.style.color = "white";
                  event.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background =
                    "rgba(255,255,255,0.035)";
                  event.currentTarget.style.color = "rgba(255,255,255,0.38)";
                  event.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: "13px" }}>⌕</span>

                <span
                  className="fjuan-desktop-nav"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.42rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  ⌘K
                </span>
              </button>

              {/* Mobile menu */}
              <button
                type="button"
                className="fjuan-mobile-button"
                onClick={() => setIsMobileOpen((value) => !value)}
                aria-label={
                  isMobileOpen ? "Close navigation" : "Open navigation"
                }
                style={{
                  width: "42px",
                  height: "42px",

                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",

                  background: "rgba(255,255,255,0.035)",
                  border: "none",

                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "2px",
                    background: "white",

                    transform: isMobileOpen
                      ? "translateY(7px) rotate(45deg)"
                      : "none",

                    transition: "transform 0.2s ease",
                  }}
                />

                <span
                  style={{
                    width: "12px",
                    height: "2px",
                    background: "#E10600",

                    opacity: isMobileOpen ? 0 : 1,

                    transition: "opacity 0.2s ease",
                  }}
                />

                <span
                  style={{
                    width: "18px",
                    height: "2px",
                    background: "white",

                    transform: isMobileOpen
                      ? "translateY(-7px) rotate(-45deg)"
                      : "none",

                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
          <div
            style={{
              maxHeight: isMobileOpen ? "650px" : "0",

              overflow: "hidden",

              background: "rgba(4,4,4,0.98)",

              transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div
              className="fjuan-mobile-scroll"
              style={{
                maxHeight: "650px",
                overflowY: "auto",
                padding: "10px 16px 22px",
              }}
            >
              {NAV_LINKS.map((link, index) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",

                      padding: "16px 12px",

                      textDecoration: "none",

                      color: isActive ? "white" : "rgba(255,255,255,0.38)",

                      background: isActive
                        ? "rgba(225,6,0,0.07)"
                        : "transparent",

                      animation: `mobileReveal 0.3s ${
                        index * 0.035
                      }s ease both`,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.4rem",
                          color: isActive
                            ? "#E10600"
                            : "rgba(255,255,255,0.18)",
                        }}
                      >
                        {link.code}
                      </span>

                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        {link.label}
                      </span>
                    </span>

                    <span
                      style={{
                        color: isActive ? "#E10600" : "rgba(255,255,255,0.15)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      →
                    </span>
                  </Link>
                );
              })}

              {/* Mobile search */}
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(true);
                  setIsMobileOpen(false);
                }}
                style={{
                  width: "100%",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",

                  padding: "16px 12px",

                  marginTop: "6px",

                  background: "rgba(225,6,0,0.06)",
                  border: "none",

                  color: "rgba(255,255,255,0.5)",

                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",

                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.4rem",
                      color: "#E10600",
                    }}
                  >
                    /
                  </span>
                  Search
                </span>

                <span>⌕</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
