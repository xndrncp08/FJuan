"use client";

import React from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/drivers", label: "Drivers" },
  { href: "/tracks", label: "Circuits" },
  { href: "/calendar", label: "Calendar" },
  { href: "/compare", label: "Compare" },
  { href: "/live", label: "Live" },
];

const Footer = () => {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "2rem", position: "relative" }}>
      <div style={{ height: "2px", background: "#E10600", position: "absolute", top: 0, left: 0, right: 0 }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3.5rem 1.5rem 2.5rem" }}>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "3rem", alignItems: "start" }}
          className="grid-cols-1 md:grid-cols-[1fr_auto_auto]">

          {/* Brand */}
          <div>
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.4rem", color: "white", letterSpacing: "-0.01em" }}>FJ</span>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.4rem", color: "#E10600", letterSpacing: "-0.01em" }}>U</span>
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.4rem", color: "white", letterSpacing: "-0.01em" }}>AN</span>
            </div>
            <p style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 400,
              fontSize: "0.88rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.28)",
              maxWidth: "230px",
              margin: "0 0 0.75rem",
            }}>
              Comprehensive Formula 1 statistics and analytics platform.
            </p>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.15)",
              letterSpacing: "0.05em",
            }}>
              Built by Xander Ranc
            </p>
          </div>

          {/* Nav */}
          <div>
            <div className="label-overline" style={{ marginBottom: "1rem" }}>Navigate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.32)",
                    textDecoration: "none",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.32)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div>
            <div className="label-overline" style={{ marginBottom: "1rem" }}>Data Sources</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {["Jolpica API", "OpenF1 API", "RSS News"].map((src) => (
                <span key={src} className="data-readout">{src}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: "3rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
          <span className="data-readout">© 2026 FJUAN</span>
          <span className="data-readout" style={{ color: "rgba(255,255,255,0.15)" }}>Not affiliated with Formula 1 or FIA</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;