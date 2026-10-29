/**
 * app/api/delta/classification/route.ts
 *
 * GET /api/delta/classification?season=&round=
 *
 * Backtests the race-classification engine on a finished round (default:
 * the most recent one with results). Response: Backtest.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseHorizon, PredictionUnavailableError } from "@/lib/prediction/policy";
import { backtestRace } from "@/lib/prediction/backtest";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const season = p.get("season") ?? undefined;
  const round = p.get("round") ?? undefined;
  let horizon;
  try {
    if ((season === undefined) !== (round === undefined) || (season !== undefined && !/^\d{4}$/.test(season)) || (round !== undefined && !/^[1-9]\d?$/.test(round))) throw new Error("Provide a valid season and round together.");
    horizon = parseHorizon(p.get("horizon")) ?? "post-qualifying";
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }
  try {
    const result = await backtestRace(season, round, horizon);
    if (!result) return NextResponse.json({ error: "No finished race with results to compare against." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof PredictionUnavailableError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[/api/delta/classification]", err);
    return NextResponse.json({ error: "Backtest failed." }, { status: 502 });
  }
}
