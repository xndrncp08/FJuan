// Shared daily index for search and historical driver comparison.
const BASE = "https://api.jolpi.ca/ergast/f1";
const PAGE = 100; // Jolpica caps `limit` at 100, so the full list takes several pages.

/**
 * Every driver in F1 history, built once a day on the server. Pages are
 * fetched one at a time to stay under Jolpica's burst limit.
 */
export async function getDriverIndex() {
  const out: any[] = [];
  try {
    for (let offset = 0; offset < 2000; offset += PAGE) {
      const res = await fetch(`${BASE}/drivers.json?limit=${PAGE}&offset=${offset}`, { next: { revalidate: 86_400 } });
      if (!res.ok) break;
      const data = await res.json();
      const page = data?.MRData?.DriverTable?.Drivers ?? [];
      out.push(...page);
      if (out.length >= Number(data?.MRData?.total ?? 0) || page.length < PAGE) break;
    }
  } catch {
    // Partial index is better than none.
  }
  return out;
}

