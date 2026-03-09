import { NextRequest, NextResponse } from "next/server";
import { getRaceSchedule } from "@/lib/api/jolpica";

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season") || "2025";
  try {
    const races = await getRaceSchedule(season);
    return NextResponse.json(races || []);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}