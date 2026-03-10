"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  {
    href: "/drivers",
    label: "Standings",
    title: "Driver\nProfiles",
    description: "Career stats, win rates, podium rates, and season-by-season breakdowns for every driver.",
    index: "01",
  },
  {
    href: "/live",
    label: "Real-Time",
    title: "Live\nTelemetry",
    description: "Speed, RPM, throttle, brake, and tyre data from any session in any season.",
    index: "02",
  },
  {
    href: "/compare",
    label: "Analysis",
    title: "Driver\nComparison",
    description: "Side-by-side career statistics and performance analysis across every season.",
    index: "03",
  },
  {
    href: "/calendar",
    label: "Schedule",
    title: "Race\nCalendar",
    description: "Full season schedule with live countdown, results, and circuit details.",
    index: "04",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={feature.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div
        style={{
          height: "100%", padding: "2rem",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: hovered ? "rgba(255,255,255,0.015)" : "transparent",
          position: "relative", overflow: "hidden",
          cursor: "pointer", transition: "background 0.2s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Top accent line — animates in on hover */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "#E10600",
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }} />

        {/* Radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at top left, rgba(225,6,0,0.07) 0%, transparent 60%)",
          opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease",
        }} />

        {/* Index + label row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)",
          }}>{feature.index}</span>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.6rem",
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: hovered ? "#E10600" : "rgba(255,255,255,0.22)",
            transition: "color 0.2s ease",
          }}>{feature.label}</span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(1.4rem, 2.5vw, 2rem)", lineHeight: 0.95,
          textTransform: "uppercase", color: "white",
          margin: "0 0 1.1rem", whiteSpace: "pre-line",
          letterSpacing: "-0.01em",
        }}>
          {feature.title}
        </h3>

        {/* Description */}
        <p style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 400,
          fontSize: "0.82rem", lineHeight: 1.75,
          color: "rgba(255,255,255,0.32)", margin: "0 0 2rem",
        }}>
          {feature.description}
        </p>

        {/* CTA */}
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

export default function FeaturesGrid() {
  return (
    <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          padding: "2rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5rem" }}>
            <h2 style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1,
              textTransform: "uppercase", color: "white", margin: 0,
              letterSpacing: "-0.01em",
            }}>Platform</h2>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em" }}>
              04 features
            </span>
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: "0.8rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
            Explore →
          </span>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", borderLeft: "1px solid rgba(255,255,255,0.06)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {features.map((feature, i) => (
            <FeatureCard key={feature.href} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}