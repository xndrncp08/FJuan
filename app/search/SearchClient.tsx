"use client";

/**
 * Instant search over drivers (all of F1 history), teams, and circuits.
 * Filtering is local, so results update per keystroke with no network
 * round-trip; the query is mirrored to ?q= so results can be shared.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, MapPin, Search, Trophy, User } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";

export interface SearchIndex {
  drivers: { id: string; name: string; nationality: string; code: string; number: string; born: string }[];
  teams: { id: string; name: string; nationality: string; color: string; titles: number }[];
  circuits: { id: string; name: string; location: string }[];
}

// Accent-insensitive: "hulkenberg" finds "Hülkenberg".
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function SearchClient({ index }: { index: SearchIndex }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the URL in step without adding history entries per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [query, pathname, router]);

  const folded = useMemo(
    () => ({
      drivers: index.drivers.map((d) => fold(`${d.name} ${d.code} ${d.nationality} ${d.number}`)),
      teams: index.teams.map((t) => fold(`${t.name} ${t.nationality}`)),
      circuits: index.circuits.map((c) => fold(`${c.name} ${c.location}`)),
    }),
    [index],
  );

  const q = fold(query.trim());
  const terms = q.split(/\s+/).filter(Boolean);
  const hit = (hay: string) => terms.every((t) => hay.includes(t));

  const drivers = q.length >= 2 ? index.drivers.filter((_, i) => hit(folded.drivers[i])).slice(0, 12) : [];
  const teams = q.length >= 2 ? index.teams.filter((_, i) => hit(folded.teams[i])).slice(0, 6) : [];
  const circuits = q.length >= 2 ? index.circuits.filter((_, i) => hit(folded.circuits[i])).slice(0, 6) : [];
  const total = drivers.length + teams.length + circuits.length;

  return (
    <Container className="pb-16 pt-10 sm:pt-16">
      <h1 className="text-title-1 text-paper">Search</h1>
      <p className="mt-2 text-callout text-label-2">
        {index.drivers.length.toLocaleString()} drivers, {index.teams.length} teams, and {index.circuits.length} circuits.
      </p>

      <label className="relative mt-6 flex items-center">
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-label-3" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “Senna”, “Monza”, or “Ferrari”"
          aria-label="Search drivers, teams, and circuits"
          autoFocus
          enterKeyHint="search"
          className="card h-14 w-full rounded-lg bg-surface pl-12 pr-4 text-[1.0625rem] text-paper outline-none placeholder:text-label-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint"
        />
      </label>

      <div className="mt-8" aria-live="polite">
        {q.length < 2 ? (
          <p className="text-subhead text-label-3">Type at least two letters.</p>
        ) : total === 0 ? (
          <div className="card">
            <EmptyState icon={<Search />} title={`No results for “${query.trim()}”`} description="Check the spelling, or search by nationality or three-letter code." />
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-footnote text-label-3">
              {total} {total === 1 ? "result" : "results"}
            </p>

            {drivers.length > 0 && (
              <Group title="Drivers">
                {drivers.map((d) => (
                  <Row key={d.id} href={`/drivers/${d.id}`} icon={<User className="h-4 w-4" />} title={d.name} detail={[d.nationality, d.born && `born ${d.born}`].filter(Boolean).join(" · ")} meta={d.code || (d.number && `#${d.number}`)} />
                ))}
              </Group>
            )}

            {teams.length > 0 && (
              <Group title="Teams">
                {teams.map((t) => (
                  <Row
                    key={t.id}
                    href={`/teams/${t.id}`}
                    icon={<span className="h-3 w-3 rounded-full" style={{ background: t.color }} />}
                    title={t.name}
                    detail={t.nationality}
                    meta={
                      t.titles > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5 text-gold" aria-hidden />
                          {t.titles}
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </Group>
            )}

            {circuits.length > 0 && (
              <Group title="Circuits">
                {circuits.map((c) => (
                  <Row key={c.id} href={`/tracks/${c.id}`} icon={<MapPin className="h-4 w-4" />} title={c.name} detail={c.location} />
                ))}
              </Group>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-headline text-paper">{title}</h2>
      <ul className="card overflow-hidden">{children}</ul>
    </section>
  );
}

function Row({ href, icon, title, detail, meta }: { href: string; icon: React.ReactNode; title: string; detail?: string; meta?: React.ReactNode }) {
  return (
    <li className="border-b border-hairline last:border-0">
      <Link href={href} className="row-interactive flex items-center gap-3 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-fill-2 text-label-2">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-callout font-semibold text-paper">{title}</span>
          {detail && <span className="block truncate text-footnote text-label-3">{detail}</span>}
        </span>
        {meta && <span className="tabular shrink-0 text-footnote font-semibold text-label-3">{meta}</span>}
        <ChevronRight className="h-4 w-4 shrink-0 text-label-4" aria-hidden />
      </Link>
    </li>
  );
}
