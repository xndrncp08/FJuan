"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Timer } from "lucide-react";
import type circuitsData from "@/lib/data/circuits.json";
import { PageHeader, Section } from "@/components/ui/Section";
import { SearchField, SelectField } from "@/components/ui/Fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
type Circuit = (typeof circuitsData)[number];

export default function CircuitDirectory({ circuits }: { circuits: Circuit[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [order, setOrder] = useState("calendar");
  const countriesList = [...new Set(circuits.map((c) => c.country))].sort();
  const shown = circuits.filter((c) => `${c.name} ${c.location} ${c.country}`.toLowerCase().includes(query.trim().toLowerCase()) && (!country || c.country === country));
  if (order === "name") shown.sort((a, b) => a.name.localeCompare(b.name));
  if (order === "length") shown.sort((a, b) => parseFloat(b.length) - parseFloat(a.length));
  const reset = () => { setQuery(""); setCountry(""); setOrder("calendar"); };
  const countries = new Set(circuits.map((c) => c.country)).size;

  return (
    <>
      <PageHeader
        eyebrow={`${new Date().getFullYear()} calendar`}
        title="Race Circuits"
        watermark="ATLAS"
        description={`${circuits.length} circuits in ${countries} countries — layouts, lap records, and a little history for each.`}
      />
      <Section className="pt-0 sm:pt-0">
        <div className="filter-toolbar">
          <SearchField label="Find a circuit" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, city or country" />
          <SelectField label="Country" value={country} onChange={(e) => setCountry(e.target.value)}><option value="">All countries</option>{countriesList.map((c) => <option key={c}>{c}</option>)}</SelectField>
          <SelectField label="Order" value={order} onChange={(e) => setOrder(e.target.value)}><option value="calendar">Calendar order</option><option value="name">Circuit name</option><option value="length">Longest lap</option></SelectField>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-footnote text-label-3">{shown.length} of {circuits.length} circuits</p>{(query || country || order !== "calendar") && <Button variant="plain" size="sm" onClick={reset}>Clear filters</Button>}</div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <li key={c.id}>
              <CircuitCard circuit={c} index={circuits.indexOf(c)} />
            </li>
          ))}
        </ul>
        {!shown.length && <div className="card"><EmptyState title="No circuits match" description="Try another place or clear your filters." action={<Button onClick={reset}>Clear filters</Button>} /></div>}
      </Section>
    </>
  );
}

function CircuitCard({ circuit: c, index }: { circuit: Circuit; index: number }) {
  return (
    <Link href={`/tracks/${c.id}`} className="card card-interactive group flex h-full flex-col overflow-hidden">
      <div className="circuit-atlas tex-grid relative aspect-[16/10] overflow-hidden border-b border-separator">
        <span className="circuit-index" aria-hidden>TRACK / {String(index + 1).padStart(2, "0")}</span>
        <span className="absolute right-5 top-4 text-label-3 group-hover:text-tint"><ArrowUpRight className="h-4 w-4" aria-hidden /></span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.layoutUrl}
          alt={`${c.name} layout`}
          loading="lazy"
          className="circuit-map h-full w-full object-contain p-8 pt-12 opacity-90 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="label-caps text-[0.75rem] text-tint">{c.country}</p>
        <p className="mt-1 text-footnote text-label-3">{c.location}</p>
        <h2 className="mt-2 text-headline text-paper">{c.name}</h2>
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
      <dd className="tabular mt-1 truncate font-mono text-[0.8125rem] font-semibold text-paper">{value}</dd>
    </div>
  );
}
