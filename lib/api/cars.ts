/**
 * lib/api/cars.ts
 *
 * The cars on the grid, from external sources only:
 *
 *   - Wikipedia's season article ("2026 Formula One World Championship")
 *     → its Entries table gives every team's entrant name, chassis and
 *     power unit in one request.
 *   - The car's own Wikipedia article → summary, designer, specification
 *     and competition history from its infobox, plus an on-track photo
 *     from Wikimedia Commons.
 *   - Formula1.com's CDN → the official side-profile renders
 *     (see f1CarImageUrl in teamLogos.ts).
 *
 * Wikipedia rate-limits bursts of parse requests, so calls go out one at a
 * time with a gap, and every response is cached by Next for hours. Only
 * plain text is extracted from Wikipedia's HTML — none of it is rendered.
 */

import { getConstructors } from "@/lib/api/jolpica";
import { toConstructorId } from "@/lib/api/teamLogos";

const API = "https://en.wikipedia.org/w/api.php";
const HEADERS = { "User-Agent": "FJUAN/1.0 (Formula 1 analytics; https://f-juan.vercel.app)" };

// ─── Throttled MediaWiki access ──────────────────────────────────────────────

const GAP_MS = 350;
let queue: Promise<unknown> = Promise.resolve();
let last = 0;

function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = last + GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Rendered HTML of one section of an article (0 = lead + infobox). */
async function parseSection(page: string, section: number, revalidate: number): Promise<{ title: string; html: string } | null> {
  const params = new URLSearchParams({ action: "parse", page, prop: "text", section: String(section), format: "json", formatversion: "2", redirects: "1" });
  try {
    const res = await throttled(() =>
      fetch(`${API}?${params}`, { headers: HEADERS, next: { revalidate }, signal: AbortSignal.timeout(10000) }),
    );
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data?.parse?.text) return null;
    return { title: data.parse.title, html: data.parse.text };
  } catch {
    return null;
  }
}

// ─── HTML → text ─────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">", "&#160;": " ", "&nbsp;": " ", "&ndash;": "–", "&mdash;": "—" };

/** Plain text from an HTML fragment: drops footnotes and styles, keeps line structure as " · ". */
export function textOf(html: string): string {
  return html
    .replace(/<sup[\s\S]*?<\/sup>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<(br|hr|\/li|\/p|\/div)\b[^>]*>/g, " · ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? " ")
    .replace(/\[\d+\]/g, "")
    .split("·")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" · ");
}

const firstWikiLink = (html: string) => html.match(/href="\/wiki\/([^"#?]+)"/)?.[1] ?? null;

// ─── Season entries ──────────────────────────────────────────────────────────

export interface SeasonCar {
  season: number;
  constructorId: string;
  entrant: string;
  constructorName: string;
  chassis: string;
  /** Wikipedia article for the car, when it has one. */
  chassisTitle: string | null;
  powerUnit: string;
}

/**
 * The Entries table: Entrant | Constructor | Chassis | Power unit | No. |
 * Drivers | Rounds. Constructor links are the same Wikipedia articles Jolpica
 * points at, which is how rows map to constructorIds.
 */
function parseEntries(html: string, season: number, urlToId: Map<string, string>): SeasonCar[] {
  const table = html.match(/<table class="wikitable[\s\S]*?<\/table>/)?.[0];
  if (!table) return [];
  const cars: SeasonCar[] = [];
  for (const row of table.split(/<tr[\s>]/).slice(1)) {
    const cells = [...row.matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]);
    // Team rows start with entrant + constructor + chassis + power unit;
    // continuation rows (second driver etc.) have fewer cells.
    if (cells.length < 5) continue;
    const [entrantHtml, ctorHtml, chassisHtml, puHtml] = cells;
    const chassis = textOf(chassisHtml);
    if (!chassis || /^chassis$/i.test(chassis)) continue;
    const ctorTitle = firstWikiLink(ctorHtml);
    const constructorName = textOf(ctorHtml);
    const id = (ctorTitle && urlToId.get(decodeURIComponent(ctorTitle))) ?? toConstructorId(constructorName.split("-")[0]);
    cars.push({
      season,
      constructorId: id,
      entrant: textOf(entrantHtml),
      constructorName,
      chassis,
      chassisTitle: firstWikiLink(chassisHtml),
      powerUnit: textOf(puHtml),
    });
  }
  return cars;
}

async function constructorUrlMap(season: number) {
  const ctors: any[] = await getConstructors(String(season)).catch(() => []);
  return new Map((ctors ?? []).map((c) => [decodeURIComponent(String(c.url).split("/wiki/")[1] ?? ""), c.constructorId as string]));
}

/** Every car on the grid for a season (falls back a season before the entry list exists). */
export async function getSeasonCars(season = new Date().getFullYear()): Promise<SeasonCar[]> {
  for (const year of [season, season - 1]) {
    const [section, urlToId] = await Promise.all([parseSection(`${year}_Formula_One_World_Championship`, 1, 21600), constructorUrlMap(year)]);
    const cars = section ? parseEntries(section.html, year, urlToId) : [];
    if (cars.length) return cars;
  }
  return [];
}

export async function getSeasonCar(constructorId: string, season?: number): Promise<SeasonCar | null> {
  const cars = await getSeasonCars(season);
  return cars.find((c) => c.constructorId === constructorId) ?? null;
}

// ─── Car article ─────────────────────────────────────────────────────────────

export interface SpecGroup {
  title: string;
  rows: { label: string; value: string }[];
}

export interface CarArticle {
  title: string;
  url: string;
  summary: string[];
  groups: SpecGroup[];
  photo: { src: string; file: string | null; caption: string | null } | null;
}

/** Infobox rows grouped under their header rows ("Technical specifications", …). */
function parseInfobox(html: string) {
  const box = html.match(/<table class="infobox[\s\S]*?<\/table>/)?.[0] ?? "";
  const groups: SpecGroup[] = [{ title: "Overview", rows: [] }];
  for (const tr of box.split(/<tr[\s>]/).slice(1)) {
    const header = tr.match(/<th[^>]*class="[^"]*infobox-header[^"]*"[^>]*>([\s\S]*?)<\/th>/);
    if (header) {
      groups.push({ title: textOf(header[1]), rows: [] });
      continue;
    }
    const th = tr.match(/<th[^>]*class="[^"]*infobox-label[^"]*"[^>]*>([\s\S]*?)<\/th>/);
    const td = tr.match(/<td[^>]*class="[^"]*infobox-data[^"]*"[^>]*>([\s\S]*?)<\/td>/);
    if (!th || !td) continue;
    const label = textOf(th[1]);
    const value = textOf(td[1]);
    if (label && value) groups[groups.length - 1].rows.push({ label, value });
  }
  const img = box.match(/<td[^>]*class="[^"]*infobox-image[^"]*"[\s\S]*?<\/td>/)?.[0] ?? "";
  const src = img.match(/<img[^>]*src="([^"]+)"/)?.[1];
  const file = img.match(/href="\/wiki\/(File:[^"]+)"/)?.[1] ?? null;
  const caption = textOf(box.match(/<div class="infobox-caption"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "") || null;
  return {
    groups: groups.filter((g) => g.rows.length),
    photo: src
      ? {
          // Ask Commons for a wider thumbnail than the infobox's 250–330px.
          src: (src.startsWith("//") ? `https:${src}` : src).replace(/&amp;/g, "&").replace(/\/(\d+)px-/, "/960px-"),
          file,
          caption,
        }
      : null,
  };
}

export async function getCarArticle(title: string): Promise<CarArticle | null> {
  const section = await parseSection(title, 0, 21600);
  if (!section) return null;
  const { groups, photo } = parseInfobox(section.html);
  // Lead paragraphs come after the infobox; skip empty/coordinates paragraphs.
  const summary = [...section.html.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((m) => textOf(m[1]))
    .filter((p) => p.length > 60)
    .slice(0, 3);
  return {
    title: section.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(section.title.replace(/ /g, "_"))}`,
    summary,
    groups,
    photo,
  };
}
