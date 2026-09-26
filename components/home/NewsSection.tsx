/**
 * components/home/NewsSection.tsx
 *
 * One featured story and a list of the next few. Headlines lead; source and
 * age are secondary. All links open the publisher in a new tab.
 */

import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

function relativeTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NewsSection({ news }: { news: any[] }) {
  if (!news?.length) return null;

  const [featured, ...rest] = news;
  const secondary = rest.slice(0, 4);

  return (
    <Section>
      <SectionHeader eyebrow="Paddock" title="Latest news" />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-5">
        <Card padding="none" className="overflow-hidden">
          <a
            href={featured.link}
            target="_blank"
            rel="noreferrer"
            className="card-interactive group flex h-full flex-col rounded-[inherit]"
          >
            {featured.image && (
              <div className="aspect-[16/9] overflow-hidden bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-5 sm:p-7">
              <Meta source={featured.source} date={featured.pubDate} />
              <h3 className="mt-3 text-title-2 text-paper">{featured.title}</h3>
              {featured.description && (
                <p className="mt-3 line-clamp-3 text-callout text-label-2">{featured.description}</p>
              )}
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint">
                Read on {featured.source}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </a>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {secondary.map((a) => (
              <li key={a.link}>
                <a href={a.link} target="_blank" rel="noreferrer" className="row-interactive group flex gap-4 p-5 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <Meta source={a.source} date={a.pubDate} />
                    <h3 className="mt-1.5 line-clamp-3 text-callout font-semibold text-paper">{a.title}</h3>
                  </div>
                  <ArrowUpRight
                    className="mt-1 h-4 w-4 shrink-0 text-label-4 transition-colors group-hover:text-tint"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

function Meta({ source, date }: { source?: string; date?: string }) {
  const rel = relativeTime(date ?? "");
  return (
    <p className="flex items-center gap-2 text-footnote">
      <span className="font-semibold text-tint">{source}</span>
      {rel && <span className="text-label-3">· {rel}</span>}
    </p>
  );
}
