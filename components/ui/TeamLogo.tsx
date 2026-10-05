/**
 * components/ui/TeamLogo.tsx
 *
 * Official team logo from the Formula1.com CDN, falling back to the team's
 * Wikipedia image and finally to a livery-colored monogram badge. Always
 * paired with a visible team name by the caller; the image itself is
 * decorative (alt="") unless `label` is passed.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { f1LogoUrls, toConstructorId, wikiLogoUrl } from "@/lib/api/teamLogos";
import { shortTeamName, teamColor } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

const SIZES = { sm: 20, md: 28, lg: 44, xl: 64 } as const;

function monogram(team: string) {
  const name = shortTeamName(team, toConstructorId(team));
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.map((w) => w[0]).join("") : name.slice(0, 3)).toUpperCase().slice(0, 3);
}

export function TeamBadge({ team, color, size = "md", className }: { team: string; color?: string; size?: keyof typeof SIZES; className?: string }) {
  const px = SIZES[size];
  const c = color ?? teamColor(team);
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center border font-display leading-none text-paper", className)}
      style={{
        height: px,
        minWidth: px,
        fontSize: Math.max(9, px * 0.36),
        background: `linear-gradient(135deg, ${c}33, ${c}12)`,
        borderColor: `${c}66`,
        boxShadow: `inset 0 0 12px ${c}22`,
      }}
    >
      {monogram(team)}
    </span>
  );
}

type TeamLogoProps = {
  /** constructorId ("red_bull") or any display name. */
  team: string;
  season?: number;
  /** Jolpica constructor `url`, used to look up the Wikipedia image. */
  wikiUrl?: string;
  color?: string;
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
};

/** Keyed so the fallback chain restarts when the team changes. */
export function TeamLogo(props: TeamLogoProps) {
  return <TeamLogoChain key={`${props.team}@${props.season ?? ""}`} {...props} />;
}

function TeamLogoChain({
  team,
  season,
  wikiUrl,
  color,
  size = "md",
  label,
  className,
}: TeamLogoProps) {
  const px = SIZES[size];
  const cdn = useMemo(() => f1LogoUrls(team, season, px), [team, season, px]);
  const [index, setIndex] = useState(0);
  const [wiki, setWiki] = useState<string | null | undefined>(undefined);

  const exhaustedCdn = index >= cdn.length;

  useEffect(() => {
    if (!exhaustedCdn || wiki !== undefined) return;
    let live = true;
    wikiLogoUrl(team, wikiUrl, px * 3).then((url) => live && setWiki(url));
    return () => {
      live = false;
    };
  }, [exhaustedCdn, wiki, team, wikiUrl, px]);

  const src = !exhaustedCdn ? cdn[index] : wiki ?? null;

  if (!src) return <TeamBadge team={team} color={color} size={size} className={className} />;

  return (
    // Remote, already-sized CDN images: next/image adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label ?? ""}
      height={px}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => (exhaustedCdn ? setWiki(null) : setIndex((i) => i + 1))}
      className={cn("inline-block w-auto shrink-0 object-contain", !exhaustedCdn ? "" : "bg-paper/90 p-0.5", className)}
      style={{ height: px, maxWidth: px * 3.2 }}
    />
  );
}
