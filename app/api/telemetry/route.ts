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
import { getTelemetry, type SourcePreference } from "@/lib/telemetry/provider";

const int = (v: string | null) => (v && /^\d+$/.test(v) ? parseInt(v, 10) : undefined);

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const source = (["auto", "openf1", "synthetic"].includes(p.get("source") ?? "") ? p.get("source") : "auto") as SourcePreference;

  try {
    const data = await getTelemetry({
      sessionKey: int(p.get("session_key")),
      driverNumber: int(p.get("driver")),
      lap: int(p.get("lap")),
      circuit: p.get("circuit") ?? undefined,
      source,
    });
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
