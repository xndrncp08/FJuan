/**
 * app/api/delta/route.ts
 *
 * GET /api/delta?session_key=&driver=&source=auto|synthetic
 *
 * Race-pace model vs actual for one driver: per-lap and per-sector
 * predictions, apex speeds and pit window, scored against telemetry.
 * Response: DeltaReport (lib/prediction/delta.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import { buildDeltaReport } from "@/lib/prediction/delta";
import { getTelemetry } from "@/lib/telemetry/provider";
import { parseTelemetryQuery } from "@/lib/telemetry/query";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  let query;
  try { query = parseTelemetryQuery(p); }
  catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }
  try {
    const telemetry = await getTelemetry(query);
    const report = buildDeltaReport(telemetry);
    return NextResponse.json(report, {
      headers: { "Cache-Control": report.source === "openf1" ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=600" },
    });
  } catch (err) {
    console.error("[/api/delta]", err);
    return NextResponse.json({ error: "Could not build the prediction report." }, { status: 502 });
  }
}
