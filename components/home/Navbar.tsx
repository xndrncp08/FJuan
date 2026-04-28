/**
 * components/home/Navbar.tsx — "COMMAND STRIP" redesign
 *
 * Aesthetic direction: military telemetry meets motorsport pit-wall.
 * - Top bar splits into: [logo] [nav strip with velocity indicators] [utility cluster]
 * - Active route: full-bleed red underline + letter-spacing expansion
 * - Hover: individual letter glow + color flash, not just color change
 * - Search overlay: full HUD with animated scan + live input pulse
 * - Mobile: slide-down with staggered row reveals + speed lines
 * - Scroll: nav compresses height + gains a subtle blur vignette
 */
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/",         label: "Home",     code: "00" },
  { href: "/drivers",  label: "Drivers",  code: "01" },
  { href: "/teams",    label: "Teams",    code: "02" },
  { href: "/tracks",   label: "Circuits", code: "03" },
  { href: "/calendar", label: "Calendar", code: "04" },
  { href: "/compare",  label: "Compare",  code: "05" },
  { href: "/predict",  label: "Predict",  code: "06" },
  { href: "/live",     label: "Live",     code: "07" },
];

const Navbar = () => {
  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isMobileOpen,     setIsMobileOpen]      = useState(false);
  const [searchOpen,       setSearchOpen]        = useState(false);
  const [searchQuery,      setSearchQuery]       = useState("");
  const [searchFocused,    setSearchFocused]     = useState(false);
  const [hoveredLink,      setHoveredLink]       = useState<string | null>(null);
  const [scanPos,          setScanPos]           = useState(0);
  const [tick,             setTick]              = useState(0);
  const pathname  = usePathname();
  const router    = useRouter();
  const rafRef    = useRef<number>(0);

  /* Scroll compression */
  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setIsMobileOpen(false); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* Close mobile on route change */
  useEffect(() => setIsMobileOpen(false), [pathname]);

  /* HUD scan animation for search overlay */
  useEffect(() => {
    if (!searchOpen) return;
    let pos = 0;
    const run = () => {
      pos = (pos + 0.4) % 100;
      setScanPos(pos);
      rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, [searchOpen]);

  /* Blinking clock tick */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <>
      <style>{`
        /* ── Navbar keyframes ─────────────────────────────── */
        @keyframes navReveal {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hudFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes mobileRowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes redPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225,6,0,0); }
          50%       { box-shadow: 0 0 12px 2px rgba(225,6,0,0.35); }
        }
        @keyframes liveBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.2; }
        }
        @keyframes inputSweep {
          from { width: 0%; }
          to   { width: 100%; }
        }

        .nav-link-item {
          position: relative;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 14px;
          transition: color 0.12s ease, letter-spacing 0.2s ease;
          white-space: nowrap;
        }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #E10600;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .nav-link-item:hover::after,
        .nav-link-item.active::after {
          transform: scaleX(1);
        }
        .nav-link-item.active {
          color: white !important;
          letter-spacing: 0.22em;
        }
        .nav-link-item:hover {
          color: rgba(255,255,255,0.85) !important;
        }

        /* Velocity slash decoration on hover */
        .nav-link-item::before {
          content: attr(data-code);
          position: absolute;
          top: 8px; left: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.32rem;
          color: rgba(225,6,0,0);
          transition: color 0.15s ease;
          letter-spacing: 0.08em;
        }
        .nav-link-item:hover::before { color: rgba(225,6,0,0.5); }
        .nav-link-item.active::before { color: rgba(225,6,0,0.7); }

        /* Mobile row stagger */
        .mobile-nav-row { animation: mobileRowIn 0.28s ease both; }

        /* Live dot */
        .live-blink { animation: liveBlink 1s step-end infinite; }

        /* Search HUD input glow */
        .search-input-active {
          animation: redPulse 2s ease infinite;
        }

        /* Mobile: scrollbar hide */
        .mobile-scroll::-webkit-scrollbar { display: none; }

        @media (max-width: 640px) {
          .nav-utility-time { display: none !important; }
        }
      `}</style>

      {/* ── Search HUD Overlay ──────────────────────────────────────────── */}
      {searchOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(18px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-start",
            paddingTop: "12vh",
            animation: "hudFadeIn 0.18s ease-out",
          }}
          onClick={() => setSearchOpen(false)}
        >
          {/* HUD scan line */}
          <div style={{
            position: "absolute", top: `${scanPos}%`, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.15) 20%, rgba(225,6,0,0.4) 50%, rgba(225,6,0,0.15) 80%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* Corner brackets — HUD frame */}
          {[
            { top: "8vh", left: "calc(50% - 320px)", borderTop: "1px solid rgba(225,6,0,0.4)", borderLeft: "1px solid rgba(225,6,0,0.4)" },
            { top: "8vh", right: "calc(50% - 320px)", borderTop: "1px solid rgba(225,6,0,0.4)", borderRight: "1px solid rgba(225,6,0,0.4)" },
            { bottom: "calc(100% - 8vh - 280px)", left: "calc(50% - 320px)", borderBottom: "1px solid rgba(225,6,0,0.4)", borderLeft: "1px solid rgba(225,6,0,0.4)" },
            { bottom: "calc(100% - 8vh - 280px)", right: "calc(50% - 320px)", borderBottom: "1px solid rgba(225,6,0,0.4)", borderRight: "1px solid rgba(225,6,0,0.4)" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: "18px", height: "18px", ...s, pointerEvents: "none" }} />
          ))}

          <div
            style={{ width: "100%", maxWidth: "640px", padding: "0 1.5rem" }}
            onClick={e => e.stopPropagation()}
          >
            {/* HUD label */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "1rem",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem",
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: "#E10600",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <div style={{ width: "4px", height: "4px", background: "#E10600", animation: "liveBlink 1s step-end infinite" }} />
                FJUAN · Search Interface
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                letterSpacing: "0.14em", color: "rgba(255,255,255,0.2)",
              }}>
                {timeStr}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSearch}>
              <div style={{ position: "relative" }}>
                {/* Left accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: "3px",
                  background: searchFocused ? "#E10600" : "rgba(225,6,0,0.35)",
                  transition: "background 0.15s ease",
                }} />

                {/* Search icon */}
                <div style={{
                  position: "absolute", left: "1.25rem", top: "50%",
                  transform: "translateY(-50%)",
                  color: searchFocused ? "#E10600" : "rgba(255,255,255,0.2)",
                  transition: "color 0.15s ease",
                }}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>

                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search drivers, teams, circuits..."
                  className={searchFocused ? "search-input-active" : ""}
                  style={{
                    width: "100%",
                    background: "#0c0c0c",
                    border: `1px solid ${searchFocused ? "rgba(225,6,0,0.45)" : "rgba(255,255,255,0.08)"}`,
                    borderLeft: "none",
                    padding: "1.1rem 3.5rem 1.1rem 3rem",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600, fontSize: "1.05rem",
                    color: "white", outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease",
                    letterSpacing: "0.04em",
                  }}
                />

                {/* Sweep line on focus */}
                {searchFocused && (
                  <div style={{
                    position: "absolute", bottom: 0, left: "3px",
                    height: "1px", background: "#E10600",
                    animation: "inputSweep 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
                  }} />
                )}

                {/* Clear */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute", right: "3.25rem", top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.2)", padding: "4px",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}

                {/* Submit */}
                <button type="submit" style={{
                  position: "absolute", right: 0, top: 0, bottom: 0,
                  background: "#E10600", border: "none", cursor: "pointer",
                  color: "white", padding: "0 14px",
                  display: "flex", alignItems: "center",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#c00500"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#E10600"}
                >
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>

            {/* Quick nav — styled as command codes */}
            <div style={{ marginTop: "1.75rem" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)", marginBottom: "0.85rem",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <div style={{ width: "12px", height: "1px", background: "rgba(255,255,255,0.18)" }} />
                Quick Navigate
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {NAV_LINKS.filter(l => l.href !== "/").map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSearchOpen(false)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.07)",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700, fontSize: "0.68rem",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                      textDecoration: "none",
                      display: "flex", alignItems: "center", gap: "6px",
                      transition: "all 0.12s ease",
                      animation: `mobileRowIn 0.25s ${i * 0.04}s ease both`,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(225,6,0,0.5)";
                      el.style.color = "white";
                      el.style.background = "rgba(225,6,0,0.06)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                      el.style.color = "rgba(255,255,255,0.3)";
                      el.style.background = "#0a0a0a";
                    }}
                  >
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.4rem", color: "#E10600", opacity: 0.7,
                    }}>{link.code}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: "1.5rem",
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem",
              letterSpacing: "0.14em", color: "rgba(255,255,255,0.14)",
              display: "flex", gap: "1.5rem",
            }}>
              <span>ESC — dismiss</span>
              <span>↵ — execute search</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Navbar ─────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50, width: "100%",
          animation: "navReveal 0.4s ease both",
        }}
      >
        {/* Top accent — 2px red with velocity gradient */}
        <div style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #E10600 15%, #ff2010 50%, #E10600 85%, transparent 100%)",
        }} />

        <div style={{
          background: isScrolled
            ? "rgba(4,4,4,0.98)"
            : "rgba(6,6,6,0.92)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.045)",
          transition: "background 0.3s ease, height 0.2s ease",
        }}>
          <div style={{
            maxWidth: "1280px", margin: "0 auto",
            padding: "0 clamp(1rem, 3vw, 1.5rem)",
            display: "flex", alignItems: "center",
            height: isScrolled ? "48px" : "56px",
            transition: "height 0.2s ease",
            gap: "0",
          }}>

            {/* ── Logo ── */}
            <Link href="/" style={{
              textDecoration: "none",
              display: "flex", alignItems: "baseline",
              gap: "0", marginRight: "clamp(1rem, 3vw, 2.5rem)",
              flexShrink: 0,
            }}>
              {["FJ", "U", "AN"].map((part, i) => (
                <span key={i} style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: isScrolled ? "1.1rem" : "1.25rem",
                  color: i === 1 ? "#E10600" : "white",
                  letterSpacing: "-0.01em", lineHeight: 1,
                  transition: "font-size 0.2s ease",
                }}>{part}</span>
              ))}
              {/* Tiny season badge */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.38rem", letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.2)",
                alignSelf: "flex-end", marginLeft: "5px", marginBottom: "2px",
              }}>·26</span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div
              className="hidden md:flex"
              style={{ flex: 1, alignItems: "stretch", height: "100%" }}
            >
              {NAV_LINKS.map((link) => {
                const isActive  = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                const isLive    = link.href === "/live";
                const isPredict = link.href === "/predict";

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-code={link.code}
                    className={`nav-link-item${isActive ? " active" : ""}`}
                    style={{
                      color: isActive ? "white" : "rgba(255,255,255,0.35)",
                      height: "100%",
                    }}
                  >
                    {isLive && (
                      <span className="live-blink" style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: "#E10600", flexShrink: 0,
                        boxShadow: "0 0 6px rgba(225,6,0,0.8)",
                      }} />
                    )}
                    {isPredict && !isActive && (
                      <svg width="7" height="7" viewBox="0 0 12 12" fill="none" style={{ color: "#E10600", flexShrink: 0 }}>
                        <path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.5 1.5M8 8l1.5 1.5M2.5 9.5L4 8M8 4l1.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* ── Utility cluster (right side) ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: "1px",
              marginLeft: "auto",
            }}>
              {/* Live clock — desktop only */}
              <div
                className="nav-utility-time"
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem",
                  letterSpacing: "0.1em", color: "rgba(255,255,255,0.18)",
                  padding: "0 12px",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeStr}
              </div>

              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "0.38rem 0.9rem",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderLeft: "3px solid rgba(225,6,0,0.4)",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.3)",
                  transition: "all 0.15s ease",
                  marginLeft: "8px",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderLeftColor = "#E10600";
                  el.style.color = "rgba(255,255,255,0.7)";
                  el.style.background = "rgba(225,6,0,0.05)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderLeftColor = "rgba(225,6,0,0.4)";
                  el.style.color = "rgba(255,255,255,0.3)";
                  el.style.background = "transparent";
                }}
                aria-label="Search (⌘K)"
              >
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.46rem", letterSpacing: "0.1em",
                  display: "flex", alignItems: "center", gap: "3px",
                }}>
                  <span className="hidden md:inline">⌘K</span>
                </span>
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle menu"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "8px 4px 8px 10px",
                  display: "flex", flexDirection: "column",
                  justifyContent: "center", gap: "5px",
                }}
              >
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    display: "block", height: "2px",
                    width: i === 1 ? "16px" : "22px",
                    background: isMobileOpen && i === 1 ? "transparent" : "white",
                    transition: "transform 0.22s ease, opacity 0.22s ease, width 0.2s ease",
                    transform:
                      i === 0 && isMobileOpen ? "rotate(45deg) translate(5px, 5px)" :
                      i === 2 && isMobileOpen ? "rotate(-45deg) translate(5px, -5px)" :
                      "none",
                    opacity: i === 1 && isMobileOpen ? 0 : 1,
                  }} />
                ))}
              </button>
            </div>
          </div>

          {/* ── Mobile menu ── */}
          <div style={{
            maxHeight: isMobileOpen ? "500px" : "0",
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1)",
            borderTop: isMobileOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}>
            {/* Speed-line accent */}
            <div style={{
              height: "1px",
              background: "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.2) 60%, transparent 100%)",
            }} />

            {NAV_LINKS.map((link, i) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              const isLive   = link.href === "/live";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="mobile-nav-row"
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "13px 24px",
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    fontSize: "0.82rem", letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: isActive ? "white" : "rgba(255,255,255,0.38)",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: isActive ? "rgba(225,6,0,0.06)" : "transparent",
                    borderLeft: isActive ? "2px solid #E10600" : "2px solid transparent",
                    animationDelay: `${i * 0.04}s`,
                    minHeight: "44px",
                  }}
                >
                  {/* Code */}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.4rem", color: isActive ? "#E10600" : "rgba(255,255,255,0.2)",
                    letterSpacing: "0.06em", minWidth: "1.4rem",
                  }}>{link.code}</span>
                  {isLive && !isActive && (
                    <span className="live-blink" style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      background: "#E10600", boxShadow: "0 0 5px rgba(225,6,0,0.7)",
                    }} />
                  )}
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile search row */}
            <button
              onClick={() => { setSearchOpen(true); setIsMobileOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "13px 24px", width: "100%",
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                borderLeft: "2px solid transparent",
                cursor: "pointer",
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                minHeight: "44px",
              }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.4rem", color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.06em", minWidth: "1.4rem",
              }}>⌘K</span>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Search
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;