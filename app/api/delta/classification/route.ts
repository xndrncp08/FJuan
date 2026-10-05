/**
 * app/api/delta/classification/route.ts
 *
 * GET /api/delta/classification?season=&round=
 *
 * Backtests the race-classification engine on a finished round (default:
 * the most recent one with results). Response: Backtest.
 */

import { NextRequest, NextResponse } from "next/server";
import { backtestRace } from "@/lib/prediction/backtest";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const season = p.get("season") ?? undefined;
  const round = p.get("round") ?? undefined;
  try {
    const result = await backtestRace(season, round);
    if (!result) return NextResponse.json({ error: "No finished race with results to compare against." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (err) {
    console.error("[/api/delta/classification]", err);
    return NextResponse.json({ error: "Backtest failed." }, { status: 502 });
  }
}
