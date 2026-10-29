import type { DriverPrediction } from "@/lib/types/prediction";

export function insightFacts(driver: DriverPrediction): string[] {
  const labels: Record<string, string> = { currentForm: "Recent form", qualifyingStrength: "Qualifying", championshipPosition: "Championship", circuitHistory: "Circuit history", weatherAdaptability: "Weather fit", sprintForm: "Sprint form", tyreFit: "Tyre fit", gridPenalty: "Grid-penalty factor" };
  const observed = Object.entries(driver.factors).filter(([key]) => !driver.missingFactors.includes(key as keyof typeof driver.factors) && !driver.inactiveFactors.includes(key as keyof typeof driver.factors) && key !== "gridPenalty");
  const facts = observed.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key, value]) => `${labels[key]} scores ${value.toFixed(1)}/100.`);
  if (driver.penaltySeverity !== null && driver.penaltySeverity > 0) facts.push(`A reported grid penalty has severity ${driver.penaltySeverity}/10.`);
  if (driver.missingFactors.length) facts.push(`${driver.missingFactors.length} factors use neutral fallbacks because inputs are unavailable.`);
  return facts.length ? facts : ["Available inputs do not distinguish this driver."];
}
