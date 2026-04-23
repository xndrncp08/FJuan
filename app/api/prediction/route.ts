/**
 * app/api/prediction/route.ts
 *
 * GET /api/prediction
 *
 * Returns a race winner prediction for the next upcoming race on the
 * calendar. The prediction is generated server-side by the engine in
 * lib/prediction/engine.ts and then cached by Next.js for 10 minutes.
 *
 * Query params (all optional — defaults to next race):
 *   season  - e.g. "2025"
 *   round   - e.g. "5"
 *
 * Response: RacePrediction JSON (see lib/types/prediction.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRacePrediction } from "@/lib/types/prediction/engine";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

/** Finds the next upcoming race on the calendar for a given season */
async function getNextUpcomingRace(season: string): Promise<any | null> {
  try {
    const res = await fetch(`${BASE_URL}/${season}.json?limit=100`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];

    const today = new Date();
    // Find the first race whose date is in the future (or today)
    return (
      races.find((r) => new Date(r.date) >= today) ??
      races[races.length - 1] ?? // fallback to last race if season is over
      null
    );
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Allow overriding season/round via query params for testing
    const season =
      searchParams.get("season") ?? new Date().getFullYear().toString();

    let round = searchParams.get("round");
    let raceName = "";
    let circuitId = "";
    let circuitName = "";
    let raceDate = "";

    if (round) {
      // Specific round requested — look it up directly
      const res = await fetch(`${BASE_URL}/${season}/${round}.json`, {
        next: { revalidate: 600 },
      });
      const data = await res.json();
      const race = data?.MRData?.RaceTable?.Races?.[0];
      if (!race) {
        return NextResponse.json(
          { error: `Round ${round} not found in ${season} season.` },
          { status: 404 },
        );
      }
      raceName = race.raceName;
      circuitId = race.Circuit.circuitId;
      circuitName = race.Circuit.circuitName;
      raceDate = race.date;
    } else {
      // Default: next upcoming race
      const race = await getNextUpcomingRace(season);
      if (!race) {
        return NextResponse.json(
          { error: "No upcoming race found." },
          { status: 404 },
        );
      }
      round = race.round;
      raceName = race.raceName;
      circuitId = race.Circuit.circuitId;
      circuitName = race.Circuit.circuitName;
      raceDate = race.date;
    }

    // Generate the prediction — this is the heavy lift
    const prediction = await generateRacePrediction(
      season,
      round!,
      raceName,
      circuitId,
      circuitName,
      raceDate,
      10, // return top 10 drivers
    );

    // Cache the response for 10 minutes at the CDN/edge layer
    return NextResponse.json(prediction, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[/api/prediction] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate prediction. Please try again later." },
      { status: 500 },
    );
  }
}
