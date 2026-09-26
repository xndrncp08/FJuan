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
      "Finishing positions over the last five races, weighted toward the most recent (the latest counts 3× the oldest). Mechanical retirements cost points; collisions that weren’t the driver’s fault don’t.",
  },
  {
    key: "qualifyingStrength",
    label: "Qualifying pace",
    weight: 15,
    description: "Qualifying positions over the same five races. Pole converts to a win roughly 40% of the time in modern F1.",
  },
  {
    key: "championshipPosition",
    label: "Championship",
    weight: 15,
    description: "Standing after the last completed round, with wins as a tie-breaker. Taken before this race so no future data leaks in.",
  },
  {
    key: "circuitHistory",
    label: "Circuit history",
    weight: 10,
    description: "Podiums at this circuit over the last ten seasons only — older results say little about today’s cars.",
  },
  {
    key: "weatherAdaptability",
    label: "Wet-weather skill",
    weight: 10,
    context: "wet",
    description: "Only active when the forecast rain chance is above 40%. On dry weekends everyone scores the same, so it adds no noise.",
  },
  {
    key: "sprintForm",
    label: "Sprint result",
    weight: 7,
    context: "sprint",
    description: "Only active on sprint weekends. The sprint is the freshest data point available, so it replaces the oldest race in the form window.",
  },
  {
    key: "tyreFit",
    label: "Tyre fit",
    weight: 5,
    description: "How well the team has historically managed the compound this circuit is allocated.",
  },
  {
    key: "gridPenalty",
    label: "Clean grid",
    weight: 3,
    description: "Drops to zero when race control confirms an engine, gearbox, or other grid penalty for this weekend.",
  },
];

export function isFactorActive(context: "wet" | "sprint" | undefined, isWet: boolean, isSprint: boolean) {
  if (context === "wet") return isWet;
  if (context === "sprint") return isSprint;
  return true;
}
