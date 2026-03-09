import Link from "next/link";

export default function CompareHero() {
  return (
    <section className="relative overflow-hidden hero-bg py-20 lg:py-28">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dual diagonal lines suggesting comparison */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: "50%",
            background:
              "linear-gradient(180deg, rgba(225,6,0,0.2) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: "calc(50% + 2px)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <Link href="/">
          <button className="btn-ghost mb-8 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M11 6H1M6 11L1 6l5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </button>
        </Link>

        <span className="label-overline block mb-4">Head to Head</span>
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
          Driver <span style={{ color: "#E10600" }}>Comparison</span>
        </h1>
        <p className="text-white/40 mt-4 text-base">
          Compare career statistics and performance metrics
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #080808)",
        }}
      />
    </section>
  );
}
