/**
 * CompareHero Component
 * 
 * Hero section for the driver comparison page.
 * Features:
 * - Background gradient and diagonal comparison lines
 * - Large title with red accent
 * - Back navigation button
 * - Fully responsive text scaling
 */

import Link from "next/link";

export default function CompareHero() {
  return (
    <section className="relative overflow-hidden hero-bg py-16 md:py-20 lg:py-28">
      {/* Decorative diagonal lines suggesting comparison */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: "50%",
            background: "linear-gradient(180deg, rgba(225,6,0,0.2) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: "calc(50% + 2px)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Back to home button */}
        <Link href="/">
          <button className="btn-ghost mb-6 md:mb-8 flex items-center gap-2 text-sm">
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

        {/* Section label */}
        <span className="label-overline block mb-3 md:mb-4">Head to Head</span>

        {/* Main title - responsive clamp */}
        <h1 className="font-condensed font-black text-white leading-[0.92] uppercase tracking-[-0.01em]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}>
          Driver <span className="text-[#E10600]">Comparison</span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/40 mt-3 md:mt-4 text-sm md:text-base">
          Compare career statistics and performance metrics
        </p>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </section>
  );
}