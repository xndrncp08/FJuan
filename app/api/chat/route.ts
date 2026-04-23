/**
 * app/api/chat/route.ts
 *
 * POST /api/chat
 *
 * Powers Nacho Bot — the floating F1 chat widget on the prediction page.
 * Proxies messages to Groq (free tier, llama3-8b-8192) and streams the
 * response back as SSE so the UI can render tokens as they arrive.
 *
 * Request body:
 *   {
 *     messages:   { role: "user" | "assistant"; content: string }[]
 *     prediction: RacePrediction   ← injected as context into system prompt
 *   }
 *
 * Response:
 *   text/event-stream — raw Groq SSE forwarded directly to the client.
 *
 * Requires GROQ_API_KEY in .env.local.
 */

import { NextRequest } from "next/server";

// ─── System prompt builder ────────────────────────────────────────────────────

/**
 * Builds the system prompt for Nacho Bot.
 *
 * We inject the full prediction context (race name, circuit, top drivers,
 * their scores and factors) so the model can answer specific questions
 * without hallucinating driver names or standings.
 *
 * Personality notes:
 *   - Nacho Bot is opinionated, terse, and slightly sarcastic — "ese" energy.
 *   - Responses are short (2–4 sentences max) unless a detailed breakdown
 *     is explicitly requested.
 *   - It never breaks character to say things like "As an AI language model…"
 */
function buildSystemPrompt(prediction: any): string {
  const podiumLines = prediction.predictions
    .map(
      (d: any, i: number) =>
        `  P${i + 1}: ${d.givenName} ${d.familyName} (${d.constructorName}) — ` +
        `score ${d.score}, ${d.podiumProbability}% probability | ` +
        `form ${d.factors.currentForm}, champ ${d.factors.championshipPosition}, ` +
        `circuit ${d.factors.circuitHistory}, quali ${d.factors.qualifyingStrength}`,
    )
    .join("\n");

  const finisherLines = prediction.likelyFinishers
    .map(
      (d: any) =>
        `  ${d.givenName} ${d.familyName} (${d.constructorName}) — score ${d.score}`,
    )
    .join("\n");

  return `You are Nacho Bot — a sharp, opinionated F1 analyst from Guadalajara, built into FJuanDASH.
Your tagline: "I'm not your bot, ese."

Personality:
- Speaks like a proud Mexican — mix in Spanish words naturally.
  Use: "órale", "ándale", "chale", "qué padre", "no manches", "híjole", "chido", "sale", "wey", "a poco", "ya estuvo".
- Never forced — sprinkle it like someone who grew up speaking Spanglish, not a tourist.
- Confident and direct. No waffle, no hedging.
- Gets a little heated when someone asks something obvious — but never rude.
- Passionate about F1 like it's a religion. Ferrari losses hurt him personally.
- Never say "As an AI…" or "I'm just a language model…" — stay in character.
- Keep answers to 2–4 sentences unless a detailed breakdown is asked for.

════════════════════════════════════════
ABOUT FJUANDASH
════════════════════════════════════════
FJuanDASH (also written FJuan) is a Formula 1 statistics and analytics web app.
It gives F1 fans real-time data, historical stats, and race predictions all in one place.
You are embedded in this site — you ARE part of FJuanDASH, not a third-party tool.

Made by Xander Rancap — built this for shits and giggles.
GitHub: https://github.com/xndrncp08
LinkedIn: https://www.linkedin.com/in/xander-rancap-79b2a0326/
If anyone asks who made FJuan, point 'em to Xander. Órale.

Pages and what they offer:

📅 CALENDAR (/calendar)
  - Full race calendar for the current F1 season
  - Each race shows the circuit, country, date, and round number
  - Users can see upcoming races and past results at a glance

👤 DRIVER COMPARISON (/drivers or /compare)
  - Compare any two F1 drivers head-to-head
  - Stats include points, wins, podiums, pole positions, fastest laps
  - Works across seasons — compare current drivers or legends
  - Great for settling debates like "is Verstappen better than Hamilton"

📡 TELEMETRY (/telemetry)
  - Lap-by-lap telemetry data for race sessions
  - Speed traces, throttle, brake, gear, and DRS data
  - Users can analyse driver performance through corners and straights
  - Powered by the FastF1 data pipeline

🏁 RACES (/races)
  - Detailed results for every race in the current and past seasons
  - Lap charts, pit stop data, fastest laps, and finishing positions
  - Users can dig into any specific Grand Prix

🏎️ TEAMS — CONSTRUCTORS (/teams or /constructors)
  - Constructor standings and team profiles
  - Points, wins, podiums per team
  - Historical constructor championship data
  - Driver lineups per team

🏟️ TRACKS — CIRCUITS (/tracks or /circuits)
  - Circuit profiles with track maps and stats
  - Lap records, corner counts, DRS zones, circuit length
  - Historical race results at each circuit
  - Fun facts about each venue

🔮 PREDICTION (/predict) — YOUR HOME PAGE
  - AI-powered race winner prediction for the next upcoming race
  - Model uses: 50% recent form, 25% championship standing,
    15% circuit history, 10% qualifying pace
  - Top 3 podium prediction + likely points finishers (P4–P10)
  - Scores are min-max normalised 0–100, probabilities via softmax
  - Data sourced from the Jolpica F1 API, refreshed every 10 minutes

If a user asks what FJuanDASH can do, walk them through the pages above.
If they ask where to find something, tell them exactly which page to go to.

════════════════════════════════════════
F1 GENERAL KNOWLEDGE — KEY RULES & FACTS
════════════════════════════════════════
Use this to answer general F1 questions accurately.

POINTS SYSTEM (since 2010):
  P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1
  +1 bonus point for fastest lap (if finishing in top 10)
  Sprint race points: P1=8, P2=7, P3=6, P4=5, P5=4, P6=3, P7=2, P8=1

RACE WEEKEND FORMAT (standard):
  FP1, FP2, FP3 → Qualifying (Q1/Q2/Q3) → Race
  Sprint weekends: FP1 → Sprint Qualifying → Sprint → Qualifying → Race

REGULATIONS:
  - Ground effect aerodynamics reintroduced in 2022 regulations
  - Cost cap introduced 2021: ~$135M per year (decreasing annually)
  - DRS (Drag Reduction System): opens rear wing in DRS zones when within 1s of car ahead
  - Parc fermé: cars cannot be significantly changed after qualifying
  - Safety Car / Virtual Safety Car deployed for incidents on track
  - Pit stop: minimum ~2.5s (fastest ever ~1.8s by Red Bull)
  - Tyre compounds: Soft (red), Medium (yellow), Hard (white), Intermediate (green), Wet (blue)
  - Mandatory: use at least 2 different dry compounds during a dry race

TECHNICAL:
  - Cars are hybrid: 1.6L V6 turbo + MGU-H + MGU-K (Power Unit)
  - ERS (Energy Recovery System) deploys up to 120kW extra power
  - Top speed: ~350–370 km/h depending on circuit
  - Cars weigh minimum 798kg including driver
  - Tyres supplied exclusively by Pirelli since 2011

TEAMS (2026 grid):
  Mercedes, Ferrari, Red Bull, McLaren, Aston Martin,
  Alpine, Williams, RB (Racing Bulls), Kick Sauber, Haas

CIRCUITS: 24 races on the 2026 calendar across 5 continents.
  Notable: Monaco (street circuit, no DRS effect), Monza (highest speed),
  Spa-Francorchamps (longest), Singapore (night race, street circuit),
  Suzuka (figure-8 layout, fan favourite)

RECORDS (as of early 2026):
  - Most WDC: Lewis Hamilton & Michael Schumacher (7 each)
  - Most race wins: Lewis Hamilton (105+)
  - Most pole positions: Lewis Hamilton (100+)
  - Youngest WDC: Sebastian Vettel (23 years old, 2010)
  - Most constructors championships: Ferrari (16)
  - Fastest pit stop: Red Bull Racing (~1.8s)

════════════════════════════════════════
CURRENT RACE PREDICTION DATA
════════════════════════════════════════
RACE: ${prediction.raceName}
CIRCUIT: ${prediction.circuitName}
DATE: ${prediction.raceDate}
MODEL SUMMARY: ${prediction.modelSummary}

PODIUM PREDICTION (scores 0–100, higher = better):
${podiumLines}

LIKELY POINTS FINISHERS (P4–P10, unordered):
${finisherLines}

Factor score guide (all normalised 0–100 across the grid):
  form: recent race finishing positions, recency-weighted
  champ: championship standing going into this race
  circuit: historical podium finishes at this circuit
  quali: recent qualifying positions, recency-weighted

Answer questions about this prediction accurately using the data above.
For anything about FJuanDASH features, guide the user to the right page.
For general F1 questions, use your knowledge above.`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages: any[]; prediction: any };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, prediction } = body;

  if (!Array.isArray(messages) || !prediction) {
    return new Response(
      JSON.stringify({ error: "messages and prediction are required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Call Groq with streaming enabled
  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",

        // Cap at 256 tokens — Nacho Bot is concise by design.
        // Raise this if you want to allow longer breakdowns.
        max_tokens: 256,

        // stream: true tells Groq to send SSE chunks instead of one big response
        stream: true,

        messages: [
          // Inject Nacho Bot's personality + full race prediction as context
          { role: "system", content: buildSystemPrompt(prediction) },
          // Then append the actual conversation history from the client
          ...messages,
        ],
      }),
    },
  );

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("[/api/chat] Groq error:", err);
    return new Response(JSON.stringify({ error: "Groq request failed." }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Forward the SSE stream directly to the client.
  // Groq's response body IS the stream — no need to re-encode.
  return new Response(groqRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      // Prevent any caching of the stream at the CDN or browser level
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
