import Link from "next/link";

interface TopDriversSectionProps {
  topDrivers: any[];
}

const podiumAccent = [
  { color: "#C9A84C", label: "Champion" },
  { color: "#9BA5B2", label: "2nd" },
  { color: "#A0674A", label: "3rd" },
];

export default function TopDriversSection({
  topDrivers,
}: TopDriversSectionProps) {
  if (!topDrivers || topDrivers.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-10 pb-8 border-b border-white/[0.06]">
        <div>
          <span className="label-overline block mb-3">Championship</span>
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
            Current Leaders
          </h2>
        </div>
        <Link href="/drivers" className="hidden md:block">
          <button className="btn-ghost">View All Drivers</button>
        </Link>
      </div>

      {/* Drivers grid */}
      <div
        className="grid md:grid-cols-3 gap-0"
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          borderRight: "none",
        }}
      >
        {topDrivers.map((standing: any, index: number) => {
          const accent = podiumAccent[index] || {
            color: "#E10600",
            label: `${index + 1}`,
          };
          return (
            <div
              key={standing.Driver.driverId}
              className="relative overflow-hidden group"
              style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Colored top bar */}
              <div
                className="h-[3px] w-full"
                style={{ background: accent.color }}
              />

              {/* Hover wash */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at top center, ${accent.color}0d 0%, transparent 60%)`,
                }}
              />

              <div className="p-8 relative">
                {/* Position watermark */}
                <div
                  className="absolute top-6 right-6 font-display font-black leading-none pointer-events-none select-none"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: "6rem",
                    color: `${accent.color}0f`,
                    lineHeight: 1,
                  }}
                >
                  {index + 1}
                </div>

                <div className="relative">
                  {/* Position label */}
                  <div
                    className="inline-flex items-center gap-2 mb-5 px-2 py-1"
                    style={{
                      border: `1px solid ${accent.color}33`,
                      background: `${accent.color}0d`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.625rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: accent.color,
                      }}
                    >
                      P{index + 1}
                    </span>
                  </div>

                  {/* Driver name */}
                  <div className="mb-6">
                    <div
                      className="text-white/50 font-display leading-none"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {standing.Driver.givenName}
                    </div>
                    <div
                      className="text-white font-display leading-none"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: "2.25rem",
                        textTransform: "uppercase",
                        lineHeight: 1,
                      }}
                    >
                      {standing.Driver.familyName}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div
                        className="h-px w-6"
                        style={{ background: accent.color }}
                      />
                      <span className="data-readout">
                        {standing.Driver.nationality}
                      </span>
                    </div>
                  </div>

                  {/* Team */}
                  <div
                    className="px-3 py-2 mb-6 text-white/50 text-xs"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {standing.Constructors[0]?.name}
                  </div>

                  {/* Stats */}
                  <div
                    className="grid grid-cols-3 gap-0"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {[
                      { val: standing.points, lab: "PTS" },
                      { val: standing.wins, lab: "Wins" },
                      { val: standing.Driver.permanentNumber, lab: "No." },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="py-4 text-center"
                        style={{
                          borderRight:
                            i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                        }}
                      >
                        <div
                          className="font-display font-black text-white leading-none"
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 800,
                            fontSize: "1.5rem",
                          }}
                        >
                          {s.val}
                        </div>
                        <div className="stat-label">{s.lab}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile CTA */}
      <div className="md:hidden mt-6">
        <Link href="/drivers">
          <button className="btn-primary w-full justify-center">
            View All Drivers
          </button>
        </Link>
      </div>
    </section>
  );
}
