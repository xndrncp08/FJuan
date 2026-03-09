import Link from "next/link";

export default function LiveHero() {
  return (
    <section className="relative overflow-hidden hero-bg py-20 lg:py-28">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated horizontal data lines */}
        {[20, 45, 70, 90].map((top, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${top}%`,
              background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${0.06 - i * 0.01}) 50%, transparent 100%)`,
              animation: `none`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <Link href="/">
          <button className="btn-ghost mb-8 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Home
          </button>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="live-dot" />
          <span className="label-overline">Real-Time Data</span>
        </div>

        <h1
          className="font-display font-black text-white leading-none"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(3.5rem, 10vw, 7rem)",
            lineHeight: 0.92,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          Live{" "}
          <span style={{ color: "#E10600" }}>Telemetry</span>
        </h1>
        <p className="text-white/40 mt-4 text-base">Real-time driver performance data — Demo Mode</p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #080808)" }}
      />
    </section>
  );
}
