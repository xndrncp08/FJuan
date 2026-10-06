/**
 * app/api/car-model/route.ts
 *
 * GET /api/car-model?team=mclaren[&season=2026]
 *
 * The data a 3D car is built from, derived from the team's official side
 * renders (lib/api/carModel.ts). Renders don't change during a season, so
 * responses are cached for a day at the edge.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCarProfile } from "@/lib/api/carModel";

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  const season = Number(req.nextUrl.searchParams.get("season")) || new Date().getFullYear();
  if (!team || !/^[a-z_]+$/.test(team)) return NextResponse.json({ error: "team is required" }, { status: 400 });
  try {
    const profile = await getCarProfile(team, season);
    if (!profile) return NextResponse.json({ error: "No renders for this team" }, { status: 404 });
    return NextResponse.json(profile, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (err) {
    console.error("[/api/car-model]", err);
    return NextResponse.json({ error: "Could not build the car" }, { status: 502 });
  }
}
