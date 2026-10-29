import type { DriverPrediction } from "@/lib/types/prediction";

export function insightFacts(driver: DriverPrediction): string[] {
  const labels: Record<string, string> = { currentForm: "Recent form", qualifyingStrength: "Qualifying", championshipPosition: "Championship", circuitHistory: "Circuit history", weatherAdaptability: "Weather fit", sprintForm: "Sprint form", tyreFit: "Tyre fit", gridPenalty: "Grid-penalty factor" };
  const observed = Object.entries(driver.factors).filter(([key]) => !driver.missingFactors.includes(key as keyof typeof driver.factors) && !driver.inactiveFactors.includes(key as keyof typeof driver.factors) && key !== "gridPenalty");
  const facts = observed.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key, value]) => `${labels[key]} scores ${value.toFixed(1)}/100.`);
  if (driver.penaltySeverity !== null && driver.penaltySeverity > 0) facts.push(`A reported grid penalty has severity ${driver.penaltySeverity}/10.`);
  if (driver.missingFactors.length) facts.push(`${driver.missingFactors.length} factors use neutral fallbacks because inputs are unavailable.`);
  return facts.length ? facts : ["Available inputs do not distinguish this driver."];
}

/** The provider can select supported statements, but cannot add unverified prose. */
export async function generateInsight(driver: DriverPrediction): Promise<string> {
  const facts = insightFacts(driver);
  const fallback = facts.slice(0, 2).join(" ");
  if (!process.env.GROQ_API_KEY) return fallback;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(8_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", max_completion_tokens: 120, reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Select one or two relevant statements for a prediction insight. Return only {"indices":[0,1]} using indices into the supplied facts. Do not write new evidence or claims.' },
          { role: "user", content: JSON.stringify(facts) },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const body = await res.json();
    const { indices } = JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
    if (!Array.isArray(indices) || indices.length < 1 || indices.length > 2 || new Set(indices).size !== indices.length || indices.some(i => !Number.isInteger(i) || i < 0 || i >= facts.length)) return fallback;
    return indices.map(i => facts[i]).join(" ");
  } catch { return fallback; }
}
