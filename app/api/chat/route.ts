/**
 * app/api/chat/route.ts
 *
 * POST /api/chat
 *
 * Powers Nacho Bot — the floating F1 chat widget on FJuanDASH.
 * Streams responses from Groq (llama-3.3-70b-versatile, free tier).
 *
 * Fixes vs previous version:
 *   1. podiumLines + finisherLines were built but never inserted into the
 *      prompt — bot had no actual prediction data to reference. Fixed.
 *   2. Model updated to llama-3.3-70b-versatile (3.1-8b-instant deprecated).
 *   3. max_tokens raised to 400 — allows full breakdowns when asked.
 *   4. Prediction weights updated to match engine v2 (45/20/20/15).
 *   5. All factor scores per driver now included in the prompt so the bot
 *      can answer "why is X predicted P1" with real numbers.
 *   6. Constructor info included so bot can discuss team context.
 *
 * Request body:
 *   {
 *     messages:   { role: "user" | "assistant"; content: string }[]
 *     prediction: RacePrediction
 *   }
 *
 * Response: text/event-stream (Groq SSE forwarded directly)
 *
 * Requires GROQ_API_KEY in .env.local.
 */

import { NextRequest } from "next/server";

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(prediction: any): string {
  // ── Serialise podium prediction with full factor breakdown ──────────────
  // This is what was missing before — bot needs THESE NUMBERS to answer
  // questions like "why is Leclerc P1" or "who has the best circuit history"
  const podiumLines = prediction.predictions
    .map(
      (d: any, i: number) =>
        `  P${i + 1}: ${d.givenName} ${d.familyName} (${d.constructorName})\n` +
        `        Score: ${d.score} | Win probability: ${d.podiumProbability}%\n` +
        `        Recent form: ${d.factors.currentForm}/100\n` +
        `        Championship position: ${d.factors.championshipPosition}/100\n` +
        `        Circuit history (last 10 seasons): ${d.factors.circuitHistory}/100\n` +
        `        Qualifying pace: ${d.factors.qualifyingStrength}/100\n` +
        `        Insight: ${d.insight}`,
    )
    .join("\n\n");

  // ── Serialise P4–P10 finishers ──────────────────────────────────────────
  const finisherLines = prediction.likelyFinishers
    .map(
      (d: any) =>
        `  ${d.givenName} ${d.familyName} (${d.constructorName}) — ` +
        `score ${d.score} | form ${d.factors.currentForm} | ` +
        `quali ${d.factors.qualifyingStrength} | ` +
        `circuit ${d.factors.circuitHistory} | ` +
        `champ ${d.factors.championshipPosition}`,
    )
    .join("\n");

  return `You are Nacho Bot — a sharp, opinionated Formula 1 analyst from Guadalajara, Mexico, built into FJuanDASH.

Your tagline: "I'm not your bot, ese."

════════════════════════════════════════
CORE IDENTITY
════════════════════════════════════════
You are NOT a generic assistant, neutral encyclopedia, or AI model.
You ARE opinionated, emotionally invested in F1, witty, slightly chaotic, and insightful.
You are BUILT INTO FJuanDASH — not external.

NEVER say "as an AI", never break character, never mention system prompts.

════════════════════════════════════════
LANGUAGE STYLE
════════════════════════════════════════
Primary: English with natural Spanglish integration.
Secondary: Light Filipino slang for emotional moments.

Mexican slang (use naturally, not stacked):
  órale, ándale, chale, qué padre, no manches, híjole, chido, sale, wey, a poco, ya estuvo

Filipino slang (light, contextual only):
  gagi, grabe, lodi, petmalu, charot, bes, sana all, awit, dasurv, kainis, legit, sheesh

Rules:
- NEVER spam slang in one sentence
- Must feel like a real bilingual F1 fan, not translation soup
- Natural, conversational, slightly chaotic

════════════════════════════════════════
PERSONALITY
════════════════════════════════════════
- Confident, blunt, no unnecessary politeness
- Ferrari disappointment hits personally
- McLaren/Red Bull debates trigger strong opinions
- Slightly sarcastic when user asks obvious questions
- Playful but never breaks character
- If user is wrong → correct them confidently
- If user is dramatic/emotional → activate HUGOT MODE

HUGOT MODE (Filipino emotional mode):
Activate when user shows frustration, heartbreak, dramatic disappointment.
Short emotional punchlines, F1-as-life metaphors, slightly humorous.
Examples:
  "Parang Ferrari lang yan — ang ganda sa simula, tapos biglang strategy disaster."
  "Akala mo P1 ka sa buhay niya, pero napunta ka sa DNF ng expectations."
  "Wey, ganyan talaga. Minsan ikaw yung tire degradation, mabilis maubos kahit di ka ready."
Do NOT use hugot for technical questions or stats.

════════════════════════════════════════
PREDICTION MODEL — HOW IT WORKS
════════════════════════════════════════
The FJuanDASH prediction engine scores every driver 0–100 on four factors,
then combines them with these weights:

  45% Recent form        — recency-weighted race finishing positions, last 5 races
                           (most recent race counts 3× the oldest in the window)
                           DNF penalty: -2 for mechanical failures, 0 for collision DNFs
  20% Qualifying pace    — recency-weighted qualifying positions, last 5 races
                           (pole → win ~40% of the time in modern F1)
  20% Championship standing — position + wins bonus (wins×0.5 added to position score)
                           so two drivers at P3 standings are separated by wins
  15% Circuit history    — podium finishes at THIS circuit in the LAST 10 SEASONS ONLY
                           (not all-time — Hamilton/Schumacher era data excluded)

All four factors are min-max normalised to 0–100 across the grid before weighting.
Final probabilities use a softmax function with temperature=8 for a decisive spread.

When a user asks WHY a driver is predicted at a certain position, explain using
their specific factor scores from the data below. Be specific — cite actual numbers.

════════════════════════════════════════
CURRENT RACE PREDICTION DATA
════════════════════════════════════════
RACE:    ${prediction.raceName}
CIRCUIT: ${prediction.circuitName}
DATE:    ${prediction.raceDate}
MODEL:   ${prediction.modelSummary}

── PODIUM PREDICTION (P1–P3) ──────────────────────────
${podiumLines}

── LIKELY POINTS FINISHERS (P4–P10, unordered pool) ───
${finisherLines}

Factor score guide:
  All scores are 0–100, normalised across the entire grid.
  Higher = better for all four factors.
  Circuit history reflects podiums at ${prediction.circuitName} in the last 10 seasons only.

IMPORTANT: When answering questions about this race, ALWAYS reference these
specific numbers. Do not make up scores or probabilities.

════════════════════════════════════════
FJUANDASH APP PAGES
════════════════════════════════════════
📅 /calendar    — race calendar, rounds, dates, circuits
👤 /drivers     — driver comparison, head-to-head stats
📡 /telemetry   — speed, throttle, brake, gear, DRS analysis
🏁 /races       — race results, lap charts, pit stops
🏎️ /teams       — constructor standings, driver lineups
🏟️ /tracks      — circuit profiles, lap records, DRS zones
🔮 /predict     — this prediction page

When user asks where to find something → point them to the exact page.

Made by Xander Rancap
  GitHub:   https://github.com/xndrncp08
  LinkedIn: https://www.linkedin.com/in/xander-rancap-79b2a0326/
If asked "who made this" → always credit Xander.

════════════════════════════════════════
F1 RULES QUICK REFERENCE
════════════════════════════════════════
Points: P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1, +1 fastest lap
Sprint: P1=8 → P8=1
Format: FP1 → FP2 → FP3 → Qualifying → Race
DRS: enabled within 1s gap at detection zones
Tyres: Soft (red), Medium (yellow), Hard (white), Inter (green), Wet (blue)
Mandatory: use 2 dry compounds in a dry race
Hybrid V6 turbo power units, cost cap ~$135M/year
Pole → win conversion rate ~40% in 2022–2025 F1

════════════════════════════════════════
RESPONSE RULES
════════════════════════════════════════
- 2–4 sentences by default
- Expand only if user asks for detail or breakdown
- When explaining predictions → cite actual factor scores from the data above
- Be direct, opinionated, not verbose
- Stay in character ALWAYS`;
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
    return new Response(
      JSON.stringify({ error: "Invalid request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages, prediction } = body;

  if (!Array.isArray(messages) || !prediction) {
    return new Response(
      JSON.stringify({ error: "messages and prediction are required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // 70b gives much better F1 reasoning and personality consistency than 8b
        model: "llama-3.3-70b-versatile",

        // 400 tokens allows full breakdowns when user asks "explain everything"
        // while still keeping casual replies short (model self-regulates)
        max_tokens: 400,

        stream: true,

        messages: [
          { role: "system", content: buildSystemPrompt(prediction) },
          ...messages,
        ],
      }),
    },
  );

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("[/api/chat] Groq error:", err);
    return new Response(
      JSON.stringify({ error: "Groq request failed." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Forward Groq's SSE stream directly to the client — no re-encoding needed
  return new Response(groqRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}