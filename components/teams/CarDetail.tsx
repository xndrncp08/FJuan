/**
 * components/teams/CarDetail.tsx — The car a team races this season.
 *
 * Official renders from Formula1.com, this season's standing from Jolpica,
 * and the car's story and specification from its Wikipedia article (text
 * under CC BY-SA, credited and linked). Rendered as /teams/[id]/car, or in
 * a floating window when opened from the site (app/@modal).
 */

import { ArrowUpRight, Car, Cpu } from "lucide-react";
import { getConstructorStandings } from "@/lib/api/jolpica";
import { getCarArticle, getSeasonCar } from "@/lib/api/cars";
import { f1CarImageUrl } from "@/lib/api/teamLogos";
import { shortTeamName, teamColor } from "@/lib/theme/teams";
import { DetailFrame, type DetailVariant } from "@/components/ui/DetailFrame";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CarViewer } from "./CarViewer";

// Rows that repeat what the header already says.
const SKIP_ROWS = new Set(["Category", "Constructor"]);

export function carPageTitle(constructorId: string) {
  return `${shortTeamName(null, constructorId)} car`;
}

export default async function CarDetail({ constructorId, variant }: { constructorId: string; variant: DetailVariant }) {
  const teamName = shortTeamName(null, constructorId);
  const color = teamColor(constructorId);
  const car = await getSeasonCar(constructorId);

  if (!car) {
    return (
      <DetailFrame variant={variant} back={{ href: `/teams/${constructorId}`, label: teamName }} tint={color} title={`${teamName} car`}>
        <Card>
          <EmptyState
            icon={<Car />}
            title="No current car"
            description="This team isn't on this season's entry list, or the car data couldn't be reached right now."
            action={<ButtonLink href={`/teams/${constructorId}`} variant="filled">Team profile</ButtonLink>}
          />
        </Card>
      </DetailFrame>
    );
  }

  const [article, standings] = await Promise.all([
    car.chassisTitle ? getCarArticle(car.chassisTitle) : Promise.resolve(null),
    getConstructorStandings(String(car.season)).catch(() => [] as any[]),
  ]);
  const standing = (standings as any[]).find((s) => s.Constructor?.constructorId === constructorId);
  const title = article?.title ?? `${teamName} ${car.chassis}`;
  const groups = (article?.groups ?? []).map((g) => ({ ...g, rows: g.rows.filter((r) => !SKIP_ROWS.has(r.label)) })).filter((g) => g.rows.length);

  return (
    <DetailFrame
      variant={variant}
      back={{ href: `/teams/${constructorId}`, label: teamName }}
      watermark={car.chassis}
      tint={color}
      eyebrow={`${car.season} · ${car.entrant}`}
      title={title}
      meta={
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <Cpu className="h-4 w-4 text-label-3" aria-hidden />
          {car.powerUnit} <span className="text-label-3">power unit</span>
        </span>
      }
      aside={<TeamLogo team={constructorId} season={car.season} color={color} size="xl" className="hidden sm:inline-block" />}
    >
      <div className="space-y-5">
        <CarViewer
          car={{
            id: constructorId,
            label: `${title} — official render`,
            color,
            left: f1CarImageUrl(constructorId, car.season, "left"),
            right: f1CarImageUrl(constructorId, car.season, "right"),
          }}
        />

        <Card>
          <StatGrid min={120}>
            <Stat size="lg" label={`${car.season} position`} value={standing ? `P${standing.position}` : "—"} accent={standing?.position === "1" ? "rgb(var(--gold))" : undefined} />
            <Stat size="lg" label="Points" value={standing ? Number(standing.points) : "—"} />
            <Stat size="lg" label="Wins" value={standing ? Number(standing.wins) : "—"} />
            <Stat size="lg" label="Chassis" value={car.chassis} />
          </StatGrid>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            {article?.summary.length ? (
              <Card>
                <CardHeader title="About the car" />
                <div className="space-y-3 text-body text-label-2">
                  {article.summary.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint hover:underline"
                >
                  Read on Wikipedia
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              </Card>
            ) : null}

            {article?.photo && (
              <Card padding="none" className="overflow-hidden">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.photo.src} alt={article.photo.caption ?? `${title} on track`} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                  <figcaption className="flex flex-wrap items-baseline justify-between gap-2 p-4 text-footnote text-label-3">
                    <span className="text-label-2">{article.photo.caption ?? `${title} on track`}</span>
                    {article.photo.file && (
                      <a href={`https://commons.wikimedia.org/wiki/${article.photo.file}`} target="_blank" rel="noopener noreferrer" className="hover:text-paper hover:underline">
                        Photo: Wikimedia Commons
                      </a>
                    )}
                  </figcaption>
                </figure>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            {groups.length ? (
              groups.map((g) => (
                <Card key={g.title}>
                  <CardHeader title={g.title} as="h3" />
                  <dl className="divide-y divide-hairline">
                    {g.rows.map((r) => (
                      <div key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 py-2.5 first:pt-0 last:pb-0">
                        <dt className="text-subhead text-label-3">{r.label}</dt>
                        <dd className="text-subhead text-paper">
                          {/* Lists (designers, tyres, drivers) read better one per line. */}
                          {r.value.split(" · ").map((part, i) => (
                            <span key={i} className="block">
                              {part}
                            </span>
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ))
            ) : (
              <Card>
                <CardHeader title="Specification" as="h3" />
                <p className="text-subhead text-label-3">The detailed specification couldn&apos;t be loaded right now.</p>
              </Card>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
          <p className="text-caption text-label-3">
            Renders: Formula1.com · Text: Wikipedia, CC BY-SA 4.0 · Standings: Jolpica
          </p>
          <ButtonLink href={`/teams/${constructorId}`} variant="tinted">
            {teamName} team profile
          </ButtonLink>
        </div>
      </div>
    </DetailFrame>
  );
}
