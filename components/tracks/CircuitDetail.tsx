/**
 * components/tracks/CircuitDetail.tsx — One circuit.
 *
 * Rendered as the /tracks/[circuitId] page, or in a floating window when
 * opened from a list (app/@modal).
 *
 * Layout map is the hero; key numbers, the lap record, and reference
 * details follow. Local JSON carries the content; Jolpica adds the
 * Wikipedia link when available.
 */

import { notFound } from "next/navigation";
import { ArrowUpRight, Timer } from "lucide-react";
import { getCircuit } from "@/lib/api/jolpica";
import circuitsData from "@/lib/data/circuits.json";
import { DetailFrame, type DetailVariant } from "@/components/ui/DetailFrame";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";

export function circuitName(circuitId: string) {
  return circuitsData.find((x) => x.id === circuitId)?.name ?? "Circuit";
}

export default async function CircuitDetail({ circuitId, variant }: { circuitId: string; variant: DetailVariant }) {
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
    <DetailFrame
      variant={variant}
      back={{ href: "/tracks", label: "Circuits" }}
      watermark={c.name.split(" ")[0]}
      meta={
        <>
          {c.location} <span className="text-label-3">· Since {c.firstGP}</span>
        </>
      }
      title={c.name}
      description={c.description || undefined}
    >
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

        {variant === "page" && (
          <div className="mt-8">
            <ButtonLink href="/tracks">All circuits</ButtonLink>
          </div>
        )}
    </DetailFrame>
  );
}
