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
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh" }} onClick={() => setSearchOpen(false)}>
          <div style={{ width: "100%", maxWidth: "580px", margin: "0 1rem" }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch}>
              <div style={{ position: "relative" }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search drivers, teams, circuits..."
                  style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderLeft: "3px solid #E10600", padding: "1.1rem 3rem 1.1rem 1.25rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "1.1rem", color: "white", outline: "none", boxSizing: "border-box" }}
                />
                <button type="submit" style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#E10600" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </form>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", marginTop: "0.75rem", letterSpacing: "0.05em" }}>Press ESC to close · Enter to search</div>
          </div>
        </div>
      )}

      <nav className="w-full sticky top-0 z-50">
        <div style={{ height: "2px", background: "#E10600", width: "100%" }} />
        <div style={{ background: isScrolled ? "rgba(8,8,8,0.97)" : "rgba(10,10,10,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.3s ease" }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">

            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.3rem", color: "white", letterSpacing: "-0.01em", lineHeight: 1 }}>FJ</span>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.3rem", color: "#E10600", letterSpacing: "-0.01em", lineHeight: 1 }}>U</span>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.3rem", color: "white", letterSpacing: "-0.01em", lineHeight: 1 }}>AN</span>
            </Link>

            <div className="hidden md:flex items-center gap-0">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: isActive ? "white" : "rgba(255,255,255,0.4)", padding: "0 12px", height: "56px", display: "flex", alignItems: "center", textDecoration: "none", transition: "color 0.15s ease", borderBottom: isActive ? "2px solid #E10600" : "2px solid transparent" }}>
                    {link.label}
                  </Link>
                );
              })}

              {/* Search button */}
              <button onClick={() => setSearchOpen(true)} style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px", padding: "0.35rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.05em" }}>⌘K</span>
              </button>
            </div>

            <button className="md:hidden flex flex-col justify-center gap-[5px] p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu" style={{ background: "none", border: "none", cursor: "pointer" }}>
              <span style={{ display: "block", height: "2px", width: "22px", background: "white", transition: "transform 0.2s ease", transform: isMobileMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
              <span style={{ display: "block", height: "2px", width: "22px", background: "white", transition: "opacity 0.2s ease", opacity: isMobileMenuOpen ? 0 : 1 }} />
              <span style={{ display: "block", height: "2px", width: "22px", background: "white", transition: "transform 0.2s ease", transform: isMobileMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
            </button>
          </div>

          {isMobileMenuOpen && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", color: isActive ? "white" : "rgba(255,255,255,0.4)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isActive ? "rgba(225,6,0,0.06)" : "transparent" }}>
                    {isActive && <span style={{ width: "3px", height: "16px", background: "#E10600", flexShrink: 0 }} />}
                    {link.label}
                  </Link>
                );
              })}
              <button onClick={() => { setSearchOpen(true); setIsMobileMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 24px", width: "100%", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                Search
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;