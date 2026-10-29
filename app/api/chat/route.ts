import { NextRequest } from "next/server";
import { buildPredictionPrompt } from "@/lib/prediction/prompt";

/**
 * Small helper used to pause between retries.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Caps how many prior conversation turns are sent to the model on each request.
 *
 * Without this, a long-running chat keeps growing the input token cost of
 * every subsequent request — the full history gets resent every time.
 * Keeping only the most recent turns bounds that cost regardless of how
 * long the conversation has been running.
 */
const MAX_HISTORY_MESSAGES = 8;

function capHistory(messages: any[]): any[] {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  return messages.slice(messages.length - MAX_HISTORY_MESSAGES);
}

/**
 * Chat providers, tried in order. Both speak the OpenAI chat-completions
 * streaming format, so the response body is forwarded to the client as is.
 *
 * - Groq (free tier, needs GROQ_API_KEY): gpt-oss-120b, fastest.
 * - Pollinations (free, no key): gpt-oss-20b. Always available, so the
 *   bot works out of the box locally and keeps answering if Groq is
 *   unset, rate limited, or down. POLLINATIONS_TOKEN raises its limits.
 */
interface Provider {
  name: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    list.push({
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: {
        model: "openai/gpt-oss-120b",
        max_completion_tokens: 450, // includes reasoning tokens; the prompt keeps replies short
        temperature: 1,
        top_p: 1,
        // GPT-OSS is a reasoning model; "low" keeps reasoning-token
        // overhead under the free-tier 8,000 TPM cap.
        reasoning_effort: "low",
      },
    });
  }
  const pollinationsToken = process.env.POLLINATIONS_TOKEN;
  list.push({
    name: "Pollinations",
    url: "https://text.pollinations.ai/openai",
    headers: pollinationsToken ? { Authorization: `Bearer ${pollinationsToken}` } : {},
    body: {
      model: "openai",
      max_tokens: 300,
      reasoning_effort: "low",
      referrer: "fjuan",
    },
  });
  return list;
}

const MAX_RETRIES = 1;
const REQUEST_TIMEOUT_MS = 45_000;

/** One provider, with a retry on 429. Returns the streaming response or null. */
async function callProvider(provider: Provider, messages: any[]): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...provider.headers },
        body: JSON.stringify({ ...provider.body, stream: true, messages }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      console.error(`[/api/chat] ${provider.name} request failed:`, error);
      return null;
    }
    if (res.ok && res.body) return res;

    const detail = await res.text().catch(() => "");
    console.error(`[/api/chat] ${provider.name} ${res.status}:`, detail.slice(0, 300));
    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    return null;
  }
  return null;
}

function jsonError(error: string, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Handles POST /api/chat.
 *
 * Streams Nacho Bot's reply back to the client as Server-Sent Events,
 * from the first provider that answers.
 */
export async function POST(req: NextRequest) {
  let body: { messages: any[]; prediction: any } | null;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const { messages, prediction } = body ?? {};
  if (!Array.isArray(messages) || messages.some(m => !["user", "assistant"].includes(m?.role) || typeof m?.content !== "string") || !prediction?.weather || !Array.isArray(prediction?.ranking) || prediction.ranking.some((d: any) => !d?.factors || !Array.isArray(d?.missingFactors))) {
    return jsonError("messages and prediction are required.", 400);
  }

  const conversation = [{ role: "system", content: buildPredictionPrompt(prediction) }, ...capHistory(messages)];

  for (const provider of providers()) {
    const res = await callProvider(provider, conversation);
    if (res) {
      return new Response(res.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Chat-Provider": provider.name,
        },
      });
    }
  }

  return jsonError("Prediction insights are temporarily unavailable. Try again in a minute.", 503, { "Retry-After": "30" });
}
