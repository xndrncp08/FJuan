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

const int = (v: string | null) => (v && /^\d+$/.test(v) ? parseInt(v, 10) : undefined);

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  try {
    const telemetry = await getTelemetry({
      sessionKey: int(p.get("session_key")),
      driverNumber: int(p.get("driver")),
      circuit: p.get("circuit") ?? undefined,
      source: p.get("source") === "synthetic" ? "synthetic" : "auto",
    });
    const report = buildDeltaReport(telemetry);
    return NextResponse.json(report, {
      headers: { "Cache-Control": report.source === "openf1" ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=600" },
    });
  } catch (err) {
    console.error("[/api/delta]", err);
    return NextResponse.json({ error: "Could not build the prediction report." }, { status: 502 });
  }
}
