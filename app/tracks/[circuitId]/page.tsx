/**
 * TrackDetailPage – Individual circuit information page.
 *
 * Features:
 * - Hero with circuit name, location, first GP, country watermark
 * - Key stats grid (length, laps, distance, first GP)
 * - Lap record info with holder and year
 * - Two-column layout: track layout image + circuit info table
 * - Responsive: columns stack on mobile, side-by-side on desktop
 * - Back link to circuits listing
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCircuit } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ circuitId: string }>;
}) {
  const { circuitId } = await params;

  // Find local data – if missing, 404
  const localData = circuitsData.find((c) => c.id === circuitId);
  if (!localData) notFound();

  // Optionally fetch extra info from API (Wikipedia link)
  let apiCircuit: any = null;
  try {
    apiCircuit = await getCircuit(circuitId);
  } catch {
    // fall back to local data silently
  }

  const { name, location, country, description, length, laps, distance, firstGP, lapRecord, lapRecordHolder, lapRecordYear, layoutUrl } =
    localData;

  return (
    <main className="min-h-screen bg-[#060606]">
      {/* Hero Section */}
      <section className="relative border-b border-white/10 overflow-hidden">
        {/* Top red line */}
        <div className="h-[2px] bg-[#E10600]" />

        {/* Country watermark */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 md:pr-8 pointer-events-none select-none">
          <span className="font-display text-[clamp(4rem,12vw,12rem)] text-white/5 leading-none tracking-[-0.03em]">
            {country.toUpperCase()}
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/tracks"
            className="inline-flex items-center gap-2 text-white/40 text-xs uppercase tracking-[0.15em] mb-6 hover:text-white/70 transition"
          >
            ← All Circuits
          </Link>

          {/* Location + first GP */}
          <div className="mb-2">
            <span className="text-[#E10600] text-[0.7rem] md:text-xs font-semibold tracking-[0.28em] uppercase">
              {location} · Since {firstGP}
            </span>
          </div>

          {/* Circuit name */}
          <h1 className="font-display text-[clamp(2rem,5vw,4rem)] text-white leading-[0.95] tracking-[-0.02em] mb-4">
            {name.toUpperCase()}
          </h1>

          {/* Description */}
          <p className="text-white/45 text-sm md:text-base leading-relaxed max-w-lg">
            {description}
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Key Stats Grid – 2x2 on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 mb-6">
          {[
            { label: "Length", value: length },
            { label: "Race Laps", value: String(laps) },
            { label: "Distance", value: distance },
            { label: "First GP", value: String(firstGP) },
          ].map((s, i) => (
            <div
              key={s.label}
              className="bg-[#0a0a0a] p-5"
              style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
            >
              <div className="stat-label text-[0.65rem] mb-1">{s.label}</div>
              <div className="font-display text-xl md:text-2xl text-white leading-tight">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Lap Record Banner */}
        <div className="bg-[#0d0d0d] border border-white/10 border-t-0 px-5 py-3 flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="stat-label text-[0.65rem]">Lap Record</span>
            <span className="font-display text-sm md:text-base text-[#E10600]">{lapRecord}</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="text-white/40 text-xs md:text-sm font-mono">
            {lapRecordHolder} · {lapRecordYear}
          </div>
        </div>

        {/* Two-column layout – stacks on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/10">
          {/* Left: Track Layout */}
          <div className="bg-[#0a0a0a] p-6">
            <div className="stat-label text-[0.65rem] mb-4">Track Layout</div>
            <div className="bg-[#060606] border border-white/10 flex items-center justify-center min-h-[260px] p-6">
              <img
                src={layoutUrl}
                alt={`${name} layout`}
                className="max-h-[220px] w-auto object-contain opacity-90"
              />
            </div>
            <div className="font-mono text-[0.7rem] text-white/20 text-center mt-4 tracking-wide">
              {laps} laps · {distance}
            </div>
          </div>

          {/* Right: Circuit Info Table */}
          <div className="bg-[#0a0a0a] p-6">
            <div className="stat-label text-[0.65rem] mb-4">Circuit Info</div>
            <div className="flex flex-col">
              {[
                { label: "Country", value: country },
                { label: "Location", value: location },
                { label: "Circuit Length", value: length },
                { label: "Race Laps", value: String(laps) },
                { label: "Race Distance", value: distance },
                { label: "First Grand Prix", value: String(firstGP) },
                ...(apiCircuit?.url
                  ? [
                      {
                        label: "Wikipedia",
                        value: "View Article →",
                        href: apiCircuit.url,
                        external: true,
                      },
                    ]
                  : []),
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-3 border-b border-white/10 first:pt-0 last:border-0"
                >
                  <span className="text-white/30 text-xs uppercase tracking-wider font-semibold">
                    {row.label}
                  </span>
                  {"href" in row ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-sm text-[#E10600] hover:underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="font-display text-sm text-white">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom back link */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <Link
            href="/tracks"
            className="text-white/40 text-xs uppercase tracking-[0.15em] hover:text-white/70 transition"
          >
            ← Back to All Circuits
          </Link>
        </div>
      </div>
    </main>
  );
}