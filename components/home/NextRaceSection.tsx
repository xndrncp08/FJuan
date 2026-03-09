import Link from "next/link";

interface NextRaceSectionProps {
  nextRace: any;
}

export default function NextRaceSection({ nextRace }: NextRaceSectionProps) {
  const raceDate = nextRace ? new Date(nextRace.date) : null;

  const formattedDate = raceDate
    ? raceDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "TBD";
  const formattedYear = raceDate
    ? raceDate.toLocaleDateString("en-US", { year: "numeric" })
    : "";

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="surface relative overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Red top stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

        {/* Faint red glow background */}
        <div
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(225,6,0,0.07) 0%, transparent 70%)" }}
        />

        <div className="p-8 lg:p-12 relative">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
            {/* Left: race info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="label-overline">Next Event</span>
                <div className="h-px w-8 bg-[#E10600]/40" />
                {nextRace && (
                  <span className="data-readout">Round {nextRace.round}</span>
                )}
              </div>

              <h2
                className="font-display font-black text-white leading-none mb-3"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}
              >
                {nextRace?.raceName || "Season Concluded"}
              </h2>

              <p className="text-white/45 text-sm font-medium mb-8 tracking-wide">
                {nextRace?.Circuit?.Location?.locality}, {nextRace?.Circuit?.Location?.country}
              </p>

              {/* Circuit strip */}
              <div
                className="inline-flex items-center gap-4 px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="stat-label" style={{ marginTop: 0 }}>Circuit</span>
                <span
                  className="text-white/80 text-sm font-medium"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  {nextRace?.Circuit?.circuitName || "TBD"}
                </span>
              </div>
            </div>

            {/* Right: date + cta */}
            <div className="flex flex-col gap-4 min-w-[200px]">
              <div
                className="p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="stat-label mb-2">Race Date</div>
                <div
                  className="font-display font-black text-white text-2xl leading-tight"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}
                >
                  {formattedDate}
                </div>
                <div className="data-readout mt-1">{formattedYear}</div>
              </div>

              <Link href="/calendar">
                <button className="btn-ghost w-full justify-center">Full Calendar</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
