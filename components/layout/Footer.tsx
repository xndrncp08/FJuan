/**
 * components/layout/Footer.tsx
 *
 * Site footer: ghost FJUAN watermark, the dataset at a glance, coded links,
 * attribution. Static — it's the end of the page.
 */

import Link from "next/link";
import { Wordmark } from "./Navbar";

const EXPLORE = [
  { href: "/drivers", label: "Drivers", code: "01" },
  { href: "/teams", label: "Teams", code: "02" },
  { href: "/tracks", label: "Circuits", code: "03" },
  { href: "/calendar", label: "Calendar", code: "04" },
  { href: "/compare", label: "Compare", code: "05" },
  { href: "/predict", label: "Predict", code: "06" },
  { href: "/live", label: "Live", code: "07" },
  { href: "/telemetry", label: "3D Telemetry", code: "08" },
  { href: "/predict/delta", label: "Delta", code: "09" },
];

const DATA = [
  { href: "https://github.com/jolpica/jolpica-f1", label: "Jolpica F1 API" },
  { href: "https://openf1.org", label: "OpenF1" },
  { href: "https://open-meteo.com", label: "Open-Meteo" },
];

const STATS = [
  { value: "76", label: "Seasons" },
  { value: "1100+", label: "Races" },
  { value: "880+", label: "Drivers" },
  { value: "77", label: "Circuits" },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-hairline bg-canvas">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgb(var(--accent)),rgb(var(--accent)/0.3)_35%,transparent_70%)]" />
      <span aria-hidden className="watermark absolute -bottom-[0.18em] left-1/2 -translate-x-1/2 text-[clamp(8rem,26vw,22rem)]">
        FJUAN
      </span>

      <div className="container-page relative grid gap-10 py-14 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark className="text-[2rem]" />
          <p className="mt-4 text-subhead text-label-2">
            Formula 1 statistics, telemetry, race data, and predictions — in one high-speed data platform.
          </p>
          <p className="mt-5 flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-label-3">
            <span className="live-dot !h-1.5 !w-1.5" aria-hidden />
            2026 season / live data
          </p>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Explore</h2>
          <ul className="grid grid-cols-2 gap-x-6">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group flex min-h-[40px] items-center gap-3 text-[0.875rem] font-bold uppercase tracking-[0.12em] text-label-3 hover:text-paper">
                  <span className="font-mono text-[0.625rem] tracking-normal text-label-3 group-hover:text-tint">{l.code}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Dataset</h2>
          <dl className="grid grid-cols-2 border-l border-t border-hairline">
            {STATS.map((s) => (
              <div key={s.label} className="border-b border-r border-hairline p-3">
                <dd className="font-display text-[1.375rem] leading-none text-paper">{s.value}</dd>
                <dt className="label-caps mt-1.5 text-[0.6875rem] text-label-3">{s.label}</dt>
              </div>
            ))}
          </dl>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {DATA.map((d) => (
              <li key={d.href}>
                <a href={d.href} target="_blank" rel="noreferrer" className="inline-flex min-h-[32px] items-center text-footnote text-label-3 hover:text-paper">
                  {d.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-page relative flex flex-col gap-2 border-t border-hairline py-6 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-label-3 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 FJUAN · Built by Xander Rancap</span>
        <span>Not affiliated with F1, FOM, or the FIA · v2.6.0</span>
      </div>
    </footer>
  );
}
