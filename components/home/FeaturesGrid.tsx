/**
 * FeaturesGrid — homepage section showcasing the four key platform features.
 *
 * Layout: 4-column equal grid with shared borders (no gap, borders act as dividers).
 * Each FeatureCard reveals a top accent bar and label colour change on hover.
 *
 * Features: Driver Profiles · Live Telemetry · Driver Comparison · Race Calendar
 */
"use client";

import Link from "next/link";
import { useState } from "react";

/* Feature card data */
const features = [
  {
    href:        "/drivers",
    label:       "Standings",
    title:       "Driver\nProfiles",
    description: "Career stats, win rates, podium rates, and season-by-season breakdowns for every driver.",
    index:       "01",
  },
  {
    href:        "/live",
    label:       "Real-Time",
    title:       "Live\nTelemetry",
    description: "Speed, RPM, throttle, brake, and tyre data from any session in any season.",
    index:       "02",
  },
  {
    href:        "/compare",
    label:       "Analysis",
    title:       "Driver\nComparison",
    description: "Side-by-side career statistics and performance analysis across every season.",
    index:       "03",
  },
  {
    href:        "/calendar",
    label:       "Schedule",
    title:       "Race\nCalendar",
    description: "Full season schedule with live countdown, results, and circuit details.",
    index:       "04",
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */

/** Individual feature card with hover animation */
function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={feature.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div
        style={{
          height: "100%",
          padding: "2rem",
          /* Shared border system — right + bottom borders form the grid lines */
          borderRight:  "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: hovered ? "rgba(255,255,255,0.015)" : "transparent",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "background 0.2s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Top red accent line — slides in from left on hover */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "#E10600",
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }} />

        {/* Subtle radial glow top-left on hover */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at top left, rgba(225,6,0,0.07) 0%, transparent 60%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }} />

        {/* Index + category label row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <span className="data-readout" style={{ fontSize: "0.6rem" }}>{feature.index}</span>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.6rem",
            letterSpacing: "0.2em", textTransform: "uppercase",
            /* Label turns red on hover */
            color: hovered ? "#E10600" : "rgba(255,255,255,0.22)",
            transition: "color 0.2s ease",
          }}>
            {feature.label}
          </span>
        </div>

        {/* Feature title — large, display font, multi-line via pre-line */}
        <h3 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
          lineHeight: 0.95,
          textTransform: "uppercase",
          color: "white",
          margin: "0 0 1.1rem",
          whiteSpace: "pre-line",
          letterSpacing: "-0.01em",
        }}>
          {feature.title}
        </h3>

        {/* Description body copy */}
        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
          fontSize: "0.82rem", lineHeight: 1.75,
          color: "rgba(255,255,255,0.32)", margin: "0 0 2rem",
        }}>
          {feature.description}
        </p>

        {/* CTA — arrow slides right on hover */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase",
          color: hovered ? "#E10600" : "rgba(255,255,255,0.18)",
          transition: "color 0.2s ease",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          Explore
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{
            transform: hovered ? "translateX(4px)" : "none",
            transition: "transform 0.2s ease",
          }}>
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function FeaturesGrid() {
  return (
    <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Section header */}
        <div style={{
          padding: "2rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5rem" }}>
            <h2 style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              lineHeight: 1,
              textTransform: "uppercase",
              color: "white",
              margin: 0,
              letterSpacing: "-0.01em",
            }}>
              Platform
            </h2>
            {/* Feature count */}
            <span className="data-readout" style={{ fontSize: "0.58rem" }}>
              {features.length.toString().padStart(2, "0")} features
            </span>
          </div>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
            fontSize: "0.8rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em",
          }}>
            Explore →
          </span>
        </div>

        {/* Feature cards grid — auto-fill with shared border dividers */}
        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            borderLeft:  "1px solid rgba(255,255,255,0.06)",
            borderTop:   "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.href} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
