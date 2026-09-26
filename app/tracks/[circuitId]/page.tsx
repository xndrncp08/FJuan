/**
 * app/tracks/[circuitId]/page.tsx — One circuit.
 *
 * Layout map is the hero; key numbers, the lap record, and reference
 * details follow. Local JSON carries the content; Jolpica adds the
 * Wikipedia link when available.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight, Timer } from "lucide-react";
import { getCircuit } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";
import { Section, HeaderBackdrop } from "@/components/ui/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({ params }: { params: Promise<{ circuitId: string }> }) {
  const { circuitId } = await params;
  const c = circuitsData.find((x) => x.id === circuitId);
  return { title: c?.name ?? "Circuit" };
}

export default async function TrackDetailPage({ params }: { params: Promise<{ circuitId: string }> }) {
  const { circuitId } = await params;
  const c = circuitsData.find((x) => x.id === circuitId);
  if (!c) notFound();

  let apiCircuit: any = null;
  try {
    apiCircuit = await getCircuit(circuitId);
  } catch {
    // local data is enough
  }

  const details = [
    { label: "Country", value: c.country },
    { label: "Location", value: c.location },
    { label: "Race distance", value: c.distance },
    { label: "First Grand Prix", value: c.firstGP },
  ];

  return (
    <>
      <header className="relative mb-8 overflow-hidden border-b border-hairline sm:mb-10">
        <HeaderBackdrop watermark={c.name.split(" ")[0]} />
        <div className="container-page relative pb-8 pt-8 sm:pt-12">
          <Link
            href="/tracks"
            className="pressable -ml-1 mb-6 inline-flex h-9 items-center gap-1.5 px-1 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-label-3 hover:text-paper"
          >
            <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
            Circuits
          </Link>
          <p className="mb-3 text-subhead text-label-2">
            {c.location} <span className="text-label-3">· Since {c.firstGP}</span>
          </p>
          <h1 className="text-title-1 text-paper sm:text-display">{c.name}</h1>
          {c.description && <p className="mt-4 max-w-prose text-body text-label-2">{c.description}</p>}
        </div>
      </header>

      <Section className="pt-0 sm:pt-0">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-5">
          <Card padding="none" className="overflow-hidden">
            <div className="flex aspect-[16/10] items-center justify-center bg-surface-2/50 p-4 sm:p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.layoutUrl} alt={`${c.name} track layout`} className="circuit-map h-full w-full object-contain" />
            </div>
            <div className="border-t border-hairline p-5 sm:p-6">
              <StatGrid min={100}>
                <Stat size="md" label="Lap length" value={c.length} />
                <Stat size="md" label="Race laps" value={c.laps} />
                <Stat size="md" label="Distance" value={c.distance} />
              </StatGrid>
            </div>
          </Card>

          <div className="space-y-4 lg:space-y-5">
            {c.lapRecord && (
              <Card>
                <p className="flex items-center gap-2 label-caps text-[0.75rem] text-tint">
                  <Timer className="h-4 w-4" aria-hidden />
                  Lap record
                </p>
                <p className="tabular mt-2 text-stat-lg text-paper">{c.lapRecord}</p>
                <p className="mt-2 text-subhead text-label-2">
                  {c.lapRecordHolder}
                  <span className="text-label-3"> · {c.lapRecordYear}</span>
                </p>
              </Card>
            )}

            <Card>
              <CardHeader title="Details" />
              <dl className="divide-y divide-hairline">
                {details.map((d) => (
                  <div key={d.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <dt className="text-subhead text-label-3">{d.label}</dt>
                    <dd className="tabular text-right text-subhead font-medium text-paper">{d.value}</dd>
                  </div>
                ))}
              </dl>
              {apiCircuit?.url && (
                <a
                  href={apiCircuit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint hover:underline"
                >
                  Read more on Wikipedia
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <ButtonLink href="/tracks">All circuits</ButtonLink>
        </div>
      </Section>
    </>
  );
}
