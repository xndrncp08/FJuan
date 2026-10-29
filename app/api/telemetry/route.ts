/**
 * app/api/telemetry/route.ts
 *
 * GET /api/telemetry?session_key=&driver=&lap=&source=auto|openf1|synthetic&circuit=
 *
 * Server-side proxy for the telemetry provider so the browser never hits
 * OpenF1 directly (no CORS surprises, shared caching, one place to fall
 * back to the synthetic engine). Response: SessionTelemetry JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTelemetry } from "@/lib/telemetry/provider";
import { parseTelemetryQuery } from "@/lib/telemetry/query";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  let query;
  try { query = parseTelemetryQuery(p); }
  catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }

  try {
    const data = await getTelemetry(query);
    return NextResponse.json(data, {
      headers: {
        // Historical laps never change; synthetic is deterministic.
        "Cache-Control": data.source === "openf1" ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("[/api/telemetry]", err);
    return NextResponse.json({ error: "Telemetry unavailable for this request." }, { status: 502 });
  }
}
