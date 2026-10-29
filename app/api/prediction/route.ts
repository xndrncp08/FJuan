import { NextRequest, NextResponse } from "next/server";
import { generateRacePrediction, getPredictionRace } from "@/lib/prediction/service";
import { parseHorizon, PredictionUnavailableError, timestamp } from "@/lib/prediction/policy";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  let horizon, cutoff;
  const season = p.get("season") ?? String(new Date().getUTCFullYear());
  const round = p.get("round") ?? undefined;
  try {
    if (!/^\d{4}$/.test(season) || (round !== undefined && !/^[1-9]\d?$/.test(round))) throw new Error("Invalid season or round.");
    horizon = parseHorizon(p.get("horizon"));
    cutoff = p.get("cutoff") ?? undefined;
    if (cutoff !== undefined && timestamp(cutoff) > Date.now()) throw new Error("Cutoff cannot be in the future.");
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }
  try {
    const race = await getPredictionRace(season, round);
    if (!race) return NextResponse.json({ error: "No upcoming race found." }, { status: 404 });
    const prediction = await generateRacePrediction(race, { horizon, cutoff });
    return NextResponse.json(prediction, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof PredictionUnavailableError) return NextResponse.json({ error: err.message }, { status: 422, headers: { "Cache-Control": "no-store" } });
    console.error("[/api/prediction]", err);
    return NextResponse.json({ error: "Could not generate prediction. Please try again later." }, { status: 502 });
  }
}
