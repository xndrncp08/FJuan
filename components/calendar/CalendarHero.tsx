/**
 * CalendarHero – Hero section for calendar page
 * 
 * Features:
 * - Giant F1 watermark
 * - Back to home link
 * - Season title with red accent
 * - Description text
 * - Responsive padding and font sizes
 */

import Link from "next/link";

interface CalendarHeroProps {
  season: string;
}

export default function CalendarHero({ season }: CalendarHeroProps) {
  return (
    <section className="relative border-b border-white/10 overflow-hidden">
      {/* Top red line */}
      <div className="h-[2px] bg-[#E10600]" />

      {/* Giant F1 watermark – responsive clamp */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 md:pr-8 pointer-events-none select-none">
        <span className="font-display text-[clamp(4rem,15vw,16rem)] text-white/5 leading-none">
          F1
        </span>
      </div>

      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 text-xs uppercase tracking-[0.15em] mb-6 hover:text-white/70 transition"
        >
          ← Home
        </Link>

        {/* Season label */}
        <div className="mb-2">
          <span className="text-[#E10600] text-[0.7rem] md:text-xs font-semibold tracking-[0.28em] uppercase">
            Formula 1 · Race Schedule
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] text-white leading-[0.92] tracking-[-0.02em] mb-3">
          {season} <span className="text-[#E10600]">CALENDAR</span>
        </h1>

        {/* Description */}
        <p className="text-white/40 text-sm md:text-base max-w-md">
          Complete Formula 1 season schedule with results and countdown.
        </p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#060606] to-transparent pointer-events-none" />
    </section>
  );
}