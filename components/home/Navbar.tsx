"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
  { href: "/tracks", label: "Circuits" },
  { href: "/calendar", label: "Calendar" },
  { href: "/compare", label: "Compare" },
  { href: "/live", label: "Live" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setIsMobileMenuOpen(false); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Search overlay */}
      {searchOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: "14vh",
            animation: "fade-in 0.15s ease-out",
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            style={{ width: "100%", maxWidth: "600px", margin: "0 1.5rem" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search label */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem",
              color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em",
              textTransform: "uppercase", marginBottom: "0.75rem",
              paddingLeft: "2px",
            }}>Search FJUAN</div>

            <form onSubmit={handleSearch}>
              <div style={{ position: "relative" }}>
                {/* Search icon */}
                <div style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: searchFocused ? "#E10600" : "rgba(255,255,255,0.25)", transition: "color 0.15s ease" }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
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
                  style={{
                    width: "100%", background: "#0e0e0e",
                    border: `1px solid ${searchFocused ? "rgba(225,6,0,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderLeft: `3px solid ${searchFocused ? "#E10600" : "rgba(225,6,0,0.4)"}`,
                    padding: "1.15rem 3.5rem 1.15rem 3rem",
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "1.05rem",
                    color: "white", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s ease",
                  }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} style={{
                    position: "absolute", right: "3.5rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.25)", padding: "4px",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
                <button type="submit" style={{
                  position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                  background: "#E10600", border: "none", cursor: "pointer", color: "white",
                  padding: "6px 10px", display: "flex", alignItems: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>

            {/* Quick links */}
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Quick Navigate</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {NAV_LINKS.filter(l => l.href !== "/").map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setSearchOpen(false)} style={{
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                    fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)", textDecoration: "none",
                    padding: "0.4rem 0.85rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(225,6,0,0.35)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.18)", marginTop: "1.25rem", letterSpacing: "0.05em" }}>
              ESC to close · Enter to search
            </div>
          </div>
        </div>
      )}

      <nav className="w-full sticky top-0 z-50">
        {/* Top red bar */}
        <div style={{ height: "2px", background: "#E10600", width: "100%" }} />

        <div style={{
          background: isScrolled ? "rgba(6,6,6,0.98)" : "rgba(8,8,8,0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          transition: "background 0.3s ease",
        }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.3rem", color: "white", letterSpacing: "-0.01em", lineHeight: 1 }}>FJ</span>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.3rem", color: "#E10600", letterSpacing: "-0.01em", lineHeight: 1 }}>U</span>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.3rem", color: "white", letterSpacing: "-0.01em", lineHeight: 1 }}>AN</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                const isLive = link.href === "/live";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.73rem",
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      color: isActive ? "white" : "rgba(255,255,255,0.38)",
                      padding: "0 12px", height: "56px",
                      display: "flex", alignItems: "center", gap: "6px",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                      borderBottom: isActive ? "2px solid #E10600" : "2px solid transparent",
                      position: "relative",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; }}
                  >
                    {isLive && <span className="live-dot" />}
                    {link.label}
                  </Link>
                );
              })}

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  marginLeft: "8px", padding: "0.35rem 0.85rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", color: "rgba(255,255,255,0.35)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(225,6,0,0.3)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.05em" }}>⌘K</span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col justify-center gap-[5px] p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: "block", height: "2px", width: "22px", background: "white",
                  transition: "transform 0.22s ease, opacity 0.22s ease",
                  transform: i === 0 && isMobileMenuOpen ? "rotate(45deg) translate(5px, 5px)"
                    : i === 2 && isMobileMenuOpen ? "rotate(-45deg) translate(5px, -5px)"
                    : "none",
                  opacity: i === 1 && isMobileMenuOpen ? 0 : 1,
                }} />
              ))}
            </button>
          </div>

          {/* Mobile menu */}
          <div style={{
            maxHeight: isMobileMenuOpen ? "400px" : "0",
            overflow: "hidden",
            transition: "max-height 0.3s cubic-bezier(0.22,1,0.36,1)",
            borderTop: isMobileMenuOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}>
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              const isLive = link.href === "/live";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 24px",
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                    fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase",
                    color: isActive ? "white" : "rgba(255,255,255,0.4)",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: isActive ? "rgba(225,6,0,0.06)" : "transparent",
                  }}
                >
                  {isActive && <span style={{ width: "3px", height: "16px", background: "#E10600", flexShrink: 0 }} />}
                  {isLive && !isActive && <span className="live-dot" />}
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setSearchOpen(true); setIsMobileMenuOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 24px", width: "100%",
                background: "none", border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
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
