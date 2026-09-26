/**
 * components/home/LastRaceSection.tsx
 *
 * Podium recap for the most recent race. Winner first (and widest on
 * desktop), then P2 and P3. Medal colors are the one place gold/silver/
 * bronze appear, because that's a motorsport-wide convention.
 */

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { TeamMark } from "@/components/ui/TeamMark";
import { cn } from "@/lib/utils/cn";

const MEDAL = ["text-gold", "text-silver", "text-bronze"];
const MEDAL_BG = ["bg-gold/15", "bg-silver/15", "bg-bronze/15"];

export default function LastRaceSection({ lastRace }: { lastRace: any }) {
  if (!lastRace?.Results?.length) return null;

  const podium = lastRace.Results.slice(0, 3);
  const date = new Date(`${lastRace.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Section>
      <SectionHeader
        eyebrow={`Round ${lastRace.round} · ${date}`}
        title={`${lastRace.raceName} podium`}
        action={{ href: `/races/${lastRace.season}/${lastRace.round}`, label: "Full results" }}
      />
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr] md:gap-5">
        {podium.map((r: any, i: number) => (
          <PodiumCard key={r.Driver?.driverId ?? i} result={r} place={i} />
        ))}
      </div>
    </Section>
  );
}

function PodiumCard({ result, place }: { result: any; place: number }) {
  const d = result.Driver;
  const winner = place === 0;
  const time = place === 0 ? result.Time?.time : result.Time?.time ?? result.status;

  return (
    <Card padding="none" className={cn("relative overflow-hidden", winner && "md:row-span-1")}>
      <Link href={`/drivers/${d?.driverId}`} className="card-interactive block h-full rounded-[inherit] p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex h-9 items-center gap-1.5 px-3 text-subhead font-bold",
              MEDAL[place],
              MEDAL_BG[place],
            )}
          >
            {winner && <Trophy className="h-4 w-4" aria-hidden />}P{place + 1}
          </span>
          {d?.code && <span className="text-footnote font-semibold tracking-wide text-label-3">{d.code}</span>}
        </div>

        <div className={cn("mt-8", winner && "md:mt-12")}>
          <div className="text-callout text-label-2">{d?.givenName}</div>
          <div className={cn("truncate font-bold tracking-[-0.03em] text-paper", winner ? "text-title-1" : "text-title-2")}>
            {d?.familyName}
          </div>
          <div className="mt-2 flex items-center gap-2 text-footnote text-label-3">
            <TeamMark team={result.Constructor?.constructorId} size="sm" />
            {result.Constructor?.name}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-hairline pt-4">
          <div className="min-w-0">
            <dt className="text-caption text-label-3">{winner ? "Time" : "Gap"}</dt>
            <dd className="tabular mt-0.5 truncate text-subhead font-semibold text-paper">{time ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption text-label-3">Points</dt>
            <dd className="tabular mt-0.5 text-subhead font-semibold text-paper">{result.points}</dd>
          </div>
          <div>
            <dt className="text-caption text-label-3">Grid</dt>
            <dd className="tabular mt-0.5 text-subhead font-semibold text-paper">{result.grid === "0" ? "Pit" : `P${result.grid}`}</dd>
          </div>
        </dl>
      </Link>
    </Card>
  );
}
