/**
 * lib/api/driverPhotos.ts
 *
 * Driver portraits from external sources — nothing stored locally:
 *
 *   1. Formula1.com headshot, via OpenF1's `headshot_url` for the latest
 *      session (current grid). Upgraded from the 93px "1col" rendition to
 *      the 432px "4col" one.
 *   2. The lead image of the driver's Wikipedia article (MediaWiki API),
 *      which covers every era back to 1950.
 *
 * Returns null when neither has a photo; the profile then shows the car
 * number instead.
 */

export interface DriverPhoto {
  src: string;
  source: "Formula1.com" | "Wikipedia";
  /** Where the image comes from, for the credit link. */
  href: string;
}

interface DriverRef {
  code?: string;
  permanentNumber?: string;
  familyName: string;
  url?: string;
}

interface OpenF1Driver {
  driver_number: number;
  name_acronym: string;
  last_name: string;
  headshot_url: string | null;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function fromOpenF1(d: DriverRef): Promise<DriverPhoto | null> {
  try {
    const res = await fetch("https://api.openf1.org/v1/drivers?session_key=latest", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const rows: OpenF1Driver[] = await res.json();
    if (!Array.isArray(rows)) return null;
    // Match on acronym plus surname or number, so two drivers sharing an
    // acronym across eras can't swap faces.
    const hit = rows.find(
      (r) =>
        r.headshot_url &&
        d.code &&
        r.name_acronym === d.code &&
        (norm(r.last_name) === norm(d.familyName) || String(r.driver_number) === d.permanentNumber),
    );
    if (!hit?.headshot_url) return null;
    return {
      src: hit.headshot_url.replace(/\/\d+col\/image\.png$/, "/4col/image.png"),
      source: "Formula1.com",
      href: "https://www.formula1.com/en/drivers",
    };
  } catch {
    return null;
  }
}

async function fromWikipedia(d: DriverRef): Promise<DriverPhoto | null> {
  const title = d.url?.match(/\/wiki\/([^?#]+)/)?.[1];
  if (!title) return null;
  try {
    const params = new URLSearchParams({
      action: "query",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "640",
      titles: decodeURIComponent(title).replace(/_/g, " "),
      redirects: "1",
      format: "json",
    });
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "FJUAN/1.0 (F1 analytics)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data?.query?.pages ?? {})[0] as { thumbnail?: { source?: string } } | undefined;
    const src = page?.thumbnail?.source;
    return src ? { src, source: "Wikipedia", href: `https://en.wikipedia.org/wiki/${title}` } : null;
  } catch {
    return null;
  }
}

export async function getDriverPhoto(d: DriverRef): Promise<DriverPhoto | null> {
  return (await fromOpenF1(d)) ?? (await fromWikipedia(d));
}
