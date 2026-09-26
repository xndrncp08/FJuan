/**
 * app/tracks/page.tsx — Circuits on this season's calendar.
 *
 * Server component: calendar order comes from Jolpica, everything else
 * (layout map, length, lap record) from lib/data/circuits.json.
 */

import Link from "next/link";
import { Timer } from "lucide-react";
import { getCircuits } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";
import { PageHeader, Section } from "@/components/ui/Section";

export const metadata = { title: "Circuits" };

type Circuit = (typeof circuitsData)[number];

export default async function TracksPage() {
  let apiCircuits: any[] = [];
  try {
    apiCircuits = await getCircuits("current");
  } catch {
    // fall back to local order
  }

  const circuits = (apiCircuits.length > 0 ? apiCircuits : circuitsData)
    .map((c: any) => circuitsData.find((l) => l.id === c.circuitId || l.id === c.id) ?? null)
    .filter(Boolean) as Circuit[];

  const countries = new Set(circuits.map((c) => c.country)).size;

  return (
    <>
      <PageHeader
        eyebrow={`${new Date().getFullYear()} calendar`}
        title="Race Circuits"
        watermark="F1"
        description={`${circuits.length} circuits in ${countries} countries — layouts, lap records, and a little history for each.`}
      />
      <Section className="pt-0 sm:pt-0">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {circuits.map((c) => (
            <li key={c.id}>
              <CircuitCard circuit={c} />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function CircuitCard({ circuit: c }: { circuit: Circuit }) {
  return (
    <Link href={`/tracks/${c.id}`} className="card card-interactive group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.layoutUrl}
          alt={`${c.name} layout`}
          loading="lazy"
          className="circuit-map h-full w-full object-contain p-5 opacity-90 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-footnote text-label-3">{c.location}</p>
        <h2 className="mt-1 text-headline text-paper">{c.name}</h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-hairline pt-4">
          <Fact label="Length" value={c.length} />
          <Fact label="Laps" value={c.laps} />
          <Fact label="Since" value={c.firstGP} />
        </dl>
        {c.lapRecord && (
          <p className="mt-4 flex items-center gap-1.5 text-footnote text-label-3">
            <Timer className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular font-medium text-label-2">{c.lapRecord}</span>
            <span className="truncate">· {c.lapRecordHolder}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-label-3">{label}</dt>
      <dd className="tabular mt-0.5 truncate text-subhead font-semibold text-paper">{value}</dd>
    </div>
  );
}
