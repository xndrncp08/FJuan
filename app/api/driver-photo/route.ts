/**
 * app/api/driver-photo/route.ts
 *
 * GET /api/driver-photo?code=&number=&family=&url=
 *
 * The driver photo lookup (OpenF1 headshot, then Wikipedia) for client
 * pages. Responds with a DriverPhoto, or null when neither source has one.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDriverPhoto } from "@/lib/api/driverPhotos";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const familyName = p.get("family");
  const url = p.get("url") ?? undefined;
  if (!familyName) return NextResponse.json({ error: "family is required" }, { status: 400 });
  // Only Wikipedia article links are followed.
  if (url && !/^https?:\/\/en\.wikipedia\.org\/wiki\//.test(url)) return NextResponse.json({ error: "Unsupported url" }, { status: 400 });
  const photo = await getDriverPhoto({ familyName, url, code: p.get("code") ?? undefined, permanentNumber: p.get("number") ?? undefined });
  return NextResponse.json(photo, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
