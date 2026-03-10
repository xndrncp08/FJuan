"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  {
    href: "/drivers",
    label: "Driver Profiles",
    title: "Driver\nStandings",
    description: "Detailed statistics, career highlights, and championship points for every driver on the grid.",
    index: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/live",
    label: "Live Data",
    title: "Live\nTelemetry",
    description: "Real-time speed, RPM, throttle, and gear data during active race sessions.",
    index: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 10h3l2-5 4 10 2-5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/compare",
    label: "Head to Head",
    title: "Driver\nComparison",
    description: "Side-by-side career statistics and performance analysis across every season.",
    index: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 4H3v12h4M13 4h4v12h-4M10 4v12M7 8h6M7 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Race Schedule",
    title: "Race\nCalendar",
    description: "Complete Formula 1 season schedule with countdown timers and circuit details.",
    index: "04",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M6 2v2M14 2v2M2 7h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="12" r="1" fill="currentColor"/>
        <circle cx="10" cy="12" r="1" fill="currentColor"/>
        <circle cx="13" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
  },
];

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={feature.href} className="block">
      <div
        className="h-full p-7 relative overflow-hidden"
        style={{
          borderRight: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: hovered ? "rgba(255,255,255,0.012)" : "transparent",
          transition: "background 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hover wash */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at top left, rgba(225,6,0,0.06) 0%, transparent 70%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }} />

        {/* Left border accent */}
        <div style={{
          position: "absolute", left: 0, top: "1.5rem", bottom: "1.5rem",
          width: "2px",
          background: "#E10600",
          transform: hovered ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }} />

        {/* Icon + Index row */}
        <div className="flex items-center justify-between mb-6 relative">
          <div style={{
            color: hovered ? "#E10600" : "rgba(255,255,255,0.2)",
            transition: "color 0.2s ease",
          }}>
            {feature.icon}
          </div>
          <div className="data-readout" style={{
            color: hovered ? "#E10600" : "rgba(255,255,255,0.15)",
            transition: "color 0.2s ease",
          }}>
            {feature.index}
          </div>
        </div>

        {/* Label */}
        <span className="label-overline block mb-3 relative">{feature.label}</span>

        {/* Title */}
        <h3 className="relative" style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
          fontSize: "1.6rem", lineHeight: 1, textTransform: "uppercase",
          color: "white", marginBottom: "1rem", whiteSpace: "pre-line",
        }}>
          {feature.title}
        </h3>

        {/* Description */}
        <p className="relative" style={{
          color: "rgba(255,255,255,0.38)", fontSize: "0.8125rem", lineHeight: 1.7,
          marginBottom: "1.5rem",
        }}>
          {feature.description}
        </p>

        {/* Arrow */}
        <div className="relative flex items-center gap-2" style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase",
          color: hovered ? "#E10600" : "rgba(255,255,255,0.22)",
          transition: "color 0.2s ease",
        }}>
          Explore
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
            transform: hovered ? "translateX(4px)" : "translateX(0)",
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
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-10 pb-8 border-b border-white/[0.06]">
        <div>
          <span className="label-overline block mb-3">Explore</span>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.95,
            textTransform: "uppercase", color: "white",
          }}>Features</h2>
        </div>
        <p className="text-white/35 text-sm max-w-xs text-right hidden md:block" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          Comprehensive F1 analytics and real-time insights
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0" style={{
        border: "1px solid rgba(255,255,255,0.07)",
        borderRight: "none", borderBottom: "none",
      }}>
        {features.map((feature) => (
          <FeatureCard key={feature.href} feature={feature} />
        ))}
      </div>
    </section>
  );
}
