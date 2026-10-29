import type { DriverPrediction } from "@/lib/types/prediction";

export type FactorKey = keyof DriverPrediction["factors"];

/**
 * The model's eight factors, in weight order. `context` factors only carry
 * signal on some weekends (wet race, sprint); otherwise every driver scores
 * a neutral 50 and the UI dims them.
 */
export const FACTORS: {
  key: FactorKey;
  label: string;
  weight: number;
  context?: "wet" | "sprint";
  description: string;
}[] = [
  {
    key: "currentForm",
    label: "Recent form",
    weight: 35,
    description:
      "Finishing positions over the last five races, weighted toward the most recent (the latest counts 3× the oldest). Official finishing order includes retirements; no fault is inferred. Missing driver history is neutral.",
  },
  {
    key: "qualifyingStrength",
    label: "Qualifying pace",
    weight: 15,
    description: "Before qualifying: recent qualifying form. After qualifying: this weekend’s published qualifying order, with prior form as a disclosed fallback if unavailable. Starting-grid order is a separate evaluation baseline.",
  },
  {
    key: "championshipPosition",
    label: "Championship",
    weight: 15,
    description: "Standing after the last completed round, with wins as a tie-breaker. Captured before this race. Openers use the previous season when available.",
  },
  {
    key: "circuitHistory",
    label: "Circuit history",
    weight: 10,
    description: "Podiums at this circuit in the ten seasons preceding the cutoff, with recency decay. The target race and later results are excluded.",
  },
  {
    key: "weatherAdaptability",
    label: "Wet-weather skill",
    weight: 10,
    context: "wet",
    description: "Versioned subjective ratings, active only when a forecast captured before the cutoff exceeds 40% rain. Unknown forecasts or ratings are neutral.",
  },
  {
    key: "sprintForm",
    label: "Sprint result",
    weight: 7,
    context: "sprint",
    description: "An additional signal only when this weekend’s sprint has finished and its result was captured before the cutoff. It does not replace recent form.",
  },
  {
    key: "tyreFit",
    label: "Tyre fit",
    weight: 5,
    description: "A versioned subjective team rating for an assumed circuit compound. This is a heuristic, not a verified event allocation. Missing ratings are neutral.",
  },
  {
    key: "gridPenalty",
    label: "Grid penalty",
    weight: 3,
    description: "Explicit grid decisions known at the cutoff, graded by severity. Unavailable messages are neutral. Qualifying uses session order, so grid penalties are not counted twice.",
  },
];

export function isFactorActive(context: "wet" | "sprint" | undefined, isWet: boolean, isSprint: boolean) {
  if (context === "wet") return isWet;
  if (context === "sprint") return isSprint;
  return true;
}
