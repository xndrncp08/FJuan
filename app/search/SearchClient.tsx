"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, MapPin, Search, Trophy, User } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SearchField } from "@/components/ui/Fields";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState } from "@/components/ui/States";

export interface SearchIndex {
  drivers: { id: string; name: string; nationality: string; code: string; number: string; born: string }[];
  teams: { id: string; name: string; nationality: string; color: string; titles: number }[];
  circuits: { id: string; name: string; location: string }[];
}
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
type Category = "all" | "drivers" | "teams" | "circuits";

export default function SearchClient({ index }: { index: SearchIndex }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const category: Category = ["drivers", "teams", "circuits"].includes(params.get("type") ?? "") ? params.get("type") as Category : "all";
  const [limit, setLimit] = useState(12);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
    setLimit(12);
  };
  const folded = useMemo(() => ({
    drivers: index.drivers.map((d) => fold(`${d.name} ${d.code} ${d.nationality} ${d.number}`)),
    teams: index.teams.map((t) => fold(`${t.name} ${t.nationality}`)),
    circuits: index.circuits.map((c) => fold(`${c.name} ${c.location}`)),
  }), [index]);
  const q = fold(query.trim());
  const terms = q.split(/\s+/).filter(Boolean);
  const hit = (hay: string) => terms.every((t) => hay.includes(t));
  const drivers = q.length >= 2 ? index.drivers.filter((_, i) => hit(folded.drivers[i])) : [];
  const teams = q.length >= 2 ? index.teams.filter((_, i) => hit(folded.teams[i])) : [];
  const circuits = q.length >= 2 ? index.circuits.filter((_, i) => hit(folded.circuits[i])) : [];
  const total = (category === "all" || category === "drivers" ? drivers.length : 0) + (category === "all" || category === "teams" ? teams.length : 0) + (category === "all" || category === "circuits" ? circuits.length : 0);
  const more = Math.max(category === "all" || category === "drivers" ? drivers.length : 0, category === "all" || category === "teams" ? teams.length : 0, category === "all" || category === "circuits" ? circuits.length : 0) > limit;

  return <>
    <PageHeader eyebrow="The F1 archive" title="Find Your Subject" watermark="SEARCH" description={`${index.drivers.length.toLocaleString()} drivers, ${index.teams.length} teams and ${index.circuits.length} circuits. Search by name, nationality, location or driver code.`}>
      <SearchField label="Search the archive" value={query} onChange={(e) => update("q", e.target.value)} placeholder="Try Senna, Monza or Ferrari" enterKeyHint="search" />
      <div className="mt-4"><Segmented aria-label="Result type" value={category} onChange={(v) => update("type", v)} segments={[{ value: "all", label: "All" }, { value: "drivers", label: "Drivers" }, { value: "teams", label: "Teams" }, { value: "circuits", label: "Circuits" }]} /></div>
    </PageHeader>
    <Section className="pt-0 sm:pt-0">
      <p role="status" className="mb-5 text-footnote text-label-3">{q.length >= 2 ? `${total} ${total === 1 ? "match" : "matches"} for “${query.trim()}”` : "Start with a name, place or nationality. Enter at least two characters."}</p>
      {q.length < 2 ? (
        <div className="grid gap-8 sm:grid-cols-2">
          <div><h2 className="text-title-3 text-paper">A place to start</h2><p className="mt-3 max-w-md text-body text-label-2">Meet an F1 legend, inspect a circuit or trace a team’s history. Every result leads to the detail behind the name.</p></div>
          <div className="border-t border-hairline">{[{ name: "Ayrton Senna", hint: "A career in numbers", query: "Senna" }, { name: "Monza", hint: "The Temple of Speed", query: "Monza" }, { name: "Ferrari", hint: "A constructor’s story", query: "Ferrari" }].map((item) => <button key={item.query} type="button" onClick={() => update("q", item.query)} className="row-interactive flex min-h-16 w-full items-center justify-between gap-4 border-b border-hairline py-3 text-left"><span><span className="block text-headline text-paper">{item.name}</span><span className="text-footnote text-label-3">{item.hint}</span></span><ChevronRight className="h-4 w-4 text-tint" aria-hidden /></button>)}</div>
        </div>
      ) : total === 0 ? <div className="card"><EmptyState icon={<Search />} title="No matches yet" description="Try a shorter name, another nationality, or switch to all result types." action={<Button onClick={() => { update("q", ""); }}>Clear search</Button>} /></div> : (
        <div className="space-y-8">
          {(category === "all" || category === "drivers") && drivers.length > 0 && <Group title="Drivers" count={drivers.length}>{drivers.slice(0, limit).map((d) => <Row key={d.id} href={`/drivers/${d.id}`} icon={<User className="h-4 w-4" />} title={d.name} detail={[d.nationality, d.born && `born ${d.born}`].filter(Boolean).join(" · ")} meta={d.code || (d.number && `#${d.number}`)} />)}</Group>}
          {(category === "all" || category === "teams") && teams.length > 0 && <Group title="Teams" count={teams.length}>{teams.slice(0, limit).map((t) => <Row key={t.id} href={`/teams/${t.id}`} icon={<span className="h-3 w-3" style={{ background: t.color }} />} title={t.name} detail={t.nationality} meta={t.titles > 0 ? <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-gold" aria-hidden />{t.titles}</span> : undefined} />)}</Group>}
          {(category === "all" || category === "circuits") && circuits.length > 0 && <Group title="Circuits" count={circuits.length}>{circuits.slice(0, limit).map((c) => <Row key={c.id} href={`/tracks/${c.id}`} icon={<MapPin className="h-4 w-4" />} title={c.name} detail={c.location} />)}</Group>}
          {more && <Button onClick={() => setLimit((n) => n + 24)}>Show more matches</Button>}
        </div>
      )}
    </Section>
  </>;
}
function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return <section><div className="mb-3 flex items-baseline gap-3"><h2 className="text-headline text-paper">{title}</h2><span className="font-mono text-caption text-label-3">{count}</span></div><ul className="card overflow-hidden">{children}</ul></section>;
}
function Row({ href, icon, title, detail, meta }: { href: string; icon: React.ReactNode; title: string; detail?: string; meta?: React.ReactNode }) {
  return <li className="border-b border-hairline last:border-0"><Link href={href} className="row-interactive flex items-center gap-3 px-4 py-4 sm:px-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center bg-fill-2 text-label-2" aria-hidden>{icon}</span><span className="min-w-0 flex-1"><span className="block text-callout font-semibold text-paper">{title}</span>{detail && <span className="block text-footnote text-label-3">{detail}</span>}</span>{meta && <span className="tabular shrink-0 text-footnote font-semibold text-label-3">{meta}</span>}<ChevronRight className="h-4 w-4 shrink-0 text-label-4" aria-hidden /></Link></li>;
}
