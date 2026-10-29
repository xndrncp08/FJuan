import { NextRequest, NextResponse } from "next/server";
import { getRaceSchedule } from "@/lib/api/jolpica";

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season") ?? "current";
  if (season !== "current" && !/^\d{4}$/.test(season)) return NextResponse.json({ error: "Invalid season." }, { status: 400 });
  try {
    const races = await getRaceSchedule(season);
    return NextResponse.json(races || []);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
