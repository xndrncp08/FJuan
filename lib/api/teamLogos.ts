/**
 * lib/api/teamLogos.ts
 *
 * Official team logos, resolved at runtime instead of shipped as local
 * files. Sources, in the order a <TeamLogo> tries them:
 *
 *   1. Formula1.com media CDN (Cloudinary) — white logos for the requested
 *      season, then the most recent season we know the slug exists for.
 *   2. MediaWiki — the lead image of the team's Wikipedia article, for
 *      historical constructors the F1 CDN doesn't carry.
 *   3. A livery-colored monogram badge (rendered by the component).
 *
 * Livery colors come from OpenF1's `team_colour` for the latest session
 * when available, with lib/theme/teams.ts as the static fallback.
 */

import { teamColor } from "@/lib/theme/teams";

const F1_CDN = "https://media.formula1.com/image/upload";
const OPENF1 = "https://api.openf1.org/v1";
const WIKI_API = "https://en.wikipedia.org/w/api.php";

/** Jolpica constructorId -> F1 CDN slug, with the seasons the slug is published for. */
const F1_SLUGS: Record<string, { slug: string; seasons: number[] }> = {
  mclaren: { slug: "mclaren", seasons: [2026, 2025] },
  ferrari: { slug: "ferrari", seasons: [2026, 2025] },
  red_bull: { slug: "redbullracing", seasons: [2026, 2025] },
  mercedes: { slug: "mercedes", seasons: [2026, 2025] },
  aston_martin: { slug: "astonmartin", seasons: [2026, 2025] },
  alpine: { slug: "alpine", seasons: [2026, 2025] },
  williams: { slug: "williams", seasons: [2026, 2025] },
  rb: { slug: "racingbulls", seasons: [2026, 2025] },
  haas: { slug: "haas", seasons: [2026, 2025] },
  sauber: { slug: "kicksauber", seasons: [2025] },
  kick_sauber: { slug: "kicksauber", seasons: [2025] },
  audi: { slug: "audi", seasons: [2026] },
  cadillac: { slug: "cadillac", seasons: [2026] },
};

/** Wikipedia article titles for teams whose Jolpica record has no `url`. */
const WIKI_TITLES: Record<string, string> = {
  mclaren: "McLaren",
  ferrari: "Scuderia Ferrari",
  red_bull: "Red Bull Racing",
  mercedes: "Mercedes-AMG Petronas F1 Team",
  aston_martin: "Aston Martin in Formula One",
  alpine: "Alpine F1 Team",
  williams: "Williams Racing",
  rb: "Racing Bulls",
  haas: "Haas F1 Team",
  sauber: "Sauber Motorsport",
  audi: "Audi in Formula One",
  cadillac: "Cadillac Formula 1 Team",
};

/** Normalizes display names and OpenF1 team names to a constructorId. */
export function toConstructorId(team: string): string {
  const v = team.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (F1_SLUGS[team]) return team;
  if (v.includes("red bull")) return "red_bull";
  if (v.includes("racing bulls") || v === "rb" || v.includes("visa cash app") || v.includes("alphatauri")) return "rb";
  if (v.includes("aston")) return "aston_martin";
  if (v.includes("sauber") || v.includes("stake")) return "sauber";
  if (v.includes("haas")) return "haas";
  for (const id of Object.keys(F1_SLUGS)) if (v.includes(id.replace(/_/g, " "))) return id;
  return v.replace(/ /g, "_");
}

/**
 * Official car render from the Formula1.com CDN: a transparent side
 * profile, nose pointing `side`. Null if we don't know the team's slug for
 * that season.
 */
export function f1CarImageUrl(team: string, season: number, side: "left" | "right" = "right", width = 1600): string | null {
  const entry = F1_SLUGS[toConstructorId(team)];
  if (!entry) return null;
  const year = entry.seasons.includes(season) ? season : entry.seasons[0];
  return `${F1_CDN}/c_fit,w_${width}/q_auto/common/f1/${year}/${entry.slug}/${year}${entry.slug}car${side}.webp`;
}

/** Formula1.com CDN logo URLs to try, best first. `height` is in CSS px; we request 2x. */
export function f1LogoUrls(team: string, season?: number, height = 32): string[] {
  const entry = F1_SLUGS[toConstructorId(team)];
  if (!entry) return [];
  const years = season && entry.seasons.includes(season) ? [season, ...entry.seasons.filter((y) => y !== season)] : entry.seasons;
  const h = Math.round(height * 2);
  return years.map((y) => `${F1_CDN}/c_fit,h_${h}/q_auto/common/f1/${y}/${entry.slug}/${y}${entry.slug}logowhite.webp`);
}

/** Wikipedia title from a Jolpica constructor `url` ("http://en.wikipedia.org/wiki/McLaren"). */
function wikiTitle(team: string, wikiUrl?: string): string | null {
  if (wikiUrl) {
    const m = wikiUrl.match(/\/wiki\/([^?#]+)/);
    if (m) return decodeURIComponent(m[1]).replace(/_/g, " ");
  }
  return WIKI_TITLES[toConstructorId(team)] ?? null;
}

const wikiCache = new Map<string, Promise<string | null>>();

/**
 * Lead image of the team's Wikipedia article via the MediaWiki API
 * (CORS-enabled with origin=*). Cached per title for the page lifetime.
 */
export function wikiLogoUrl(team: string, wikiUrl?: string, size = 128): Promise<string | null> {
  const title = wikiTitle(team, wikiUrl);
  if (!title) return Promise.resolve(null);
  const key = `${title}@${size}`;
  const hit = wikiCache.get(key);
  if (hit) return hit;

  const params = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(size),
    titles: title,
    redirects: "1",
    format: "json",
    origin: "*",
  });
  const req = fetch(`${WIKI_API}?${params}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const pages = data?.query?.pages ?? {};
      const page = Object.values(pages)[0] as { thumbnail?: { source?: string } } | undefined;
      return page?.thumbnail?.source ?? null;
    })
    .catch(() => null);
  wikiCache.set(key, req);
  return req;
}

export interface LiveTeamColour {
  constructorId: string;
  teamName: string;
  color: string;
}

/**
 * Team colours as OpenF1 publishes them for the latest session. Returns an
 * empty list (and callers fall back to teamColor()) if OpenF1 is down or
 * rate-limited.
 */
export async function getLiveTeamColours(): Promise<LiveTeamColour[]> {
  try {
    const res = await fetch(`${OPENF1}/drivers?session_key=latest`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const rows: { team_name?: string; team_colour?: string }[] = await res.json();
    const seen = new Map<string, LiveTeamColour>();
    for (const r of rows) {
      if (!r.team_name || !r.team_colour) continue;
      const id = toConstructorId(r.team_name);
      if (!seen.has(id)) seen.set(id, { constructorId: id, teamName: r.team_name, color: `#${r.team_colour}` });
    }
    return [...seen.values()];
  } catch {
    return [];
  }
}

/** Resolve a colour from a live map first, then the static table. */
export function resolveTeamColour(team: string | null | undefined, live?: LiveTeamColour[]): string {
  if (team && live?.length) {
    const id = toConstructorId(team);
    const hit = live.find((t) => t.constructorId === id);
    if (hit) return hit.color;
  }
  return teamColor(team);
}
