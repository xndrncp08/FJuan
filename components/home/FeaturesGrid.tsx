import Link from "next/link";

const features = [
  {
    href: "/drivers",
    label: "Driver Profiles",
    title: "Driver\nStandings",
    description: "Detailed statistics, career highlights, and championship points for every driver on the grid.",
    index: "01",
  },
  {
    href: "/live",
    label: "Live Data",
    title: "Live\nTelemetry",
    description: "Real-time speed, RPM, throttle, and gear data during active race sessions.",
    index: "02",
  },
  {
    href: "/compare",
    label: "Head to Head",
    title: "Driver\nComparison",
    description: "Side-by-side career statistics and performance analysis across every season.",
    index: "03",
  },
  {
    href: "/calendar",
    label: "Race Schedule",
    title: "Race\nCalendar",
    description: "Complete Formula 1 season schedule with countdown timers and circuit details.",
    index: "04",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-10 pb-8 border-b border-white/[0.06]">
        <div>
          <span className="label-overline block mb-3">Explore</span>
          <h2
            className="font-display font-black text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 0.95,
              textTransform: "uppercase",
            }}
          >
            Features
          </h2>
        </div>
        <p className="text-white/35 text-sm max-w-xs text-right hidden md:block">
          Comprehensive F1 analytics and real-time insights
        </p>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0" style={{ border: "1px solid rgba(255,255,255,0.07)", borderRight: "none", borderBottom: "none" }}>
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href} className="block group">
            <div
              className="h-full p-7 relative overflow-hidden transition-colors duration-200"
              style={{
                borderRight: "1px solid rgba(255,255,255,0.07)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Hover red wash */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top left, rgba(225,6,0,0.05) 0%, transparent 70%)" }}
              />

              {/* Index */}
              <div className="data-readout mb-6 group-hover:text-[#E10600] transition-colors duration-200">
                {feature.index}
              </div>

              {/* Label */}
              <span className="label-overline block mb-3">{feature.label}</span>

              {/* Title */}
              <h3
                className="font-display font-black text-white leading-none mb-4 whitespace-pre-line"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-white/40 text-[0.8125rem] leading-relaxed mb-6">
                {feature.description}
              </p>

              {/* Arrow */}
              <div
                className="flex items-center gap-2 text-white/30 group-hover:text-[#E10600] transition-colors duration-200"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                Explore
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200 group-hover:translate-x-1">
                  <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
