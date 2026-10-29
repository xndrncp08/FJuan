import { getDriverStats } from "@/lib/api/fetchers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9_-]{1,80}$/.test(id)) return Response.json({ error: "Invalid driver ID." }, { status: 400 });
  const stats = await getDriverStats(id);
  if (!stats) return Response.json({ error: "Driver statistics are unavailable. Try again shortly." }, { status: 502 });
  return Response.json(stats, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
