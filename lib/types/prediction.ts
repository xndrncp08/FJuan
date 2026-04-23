/**
 * lib/types/prediction.ts
 *
 * Type definitions for the race winner prediction feature.
 * These types flow from the prediction engine → API route → UI components.
 */

/** A single driver's computed prediction score and breakdown */
/**
 * lib/types/prediction.ts
 */

export interface DriverPrediction {
  driverId: string;
  driverCode: string;
  givenName: string;
  familyName: string;
  constructorName: string;
  constructorId: string;
  score: number;
  podiumProbability: number;
  factors: {
    currentForm: number;
    championshipPosition: number;
    circuitHistory: number;
    qualifyingStrength: number;
  };
  insight: string;
}

export interface RacePrediction {
  raceName: string;
  circuitId: string;
  circuitName: string;
  raceDate: string;

  /** Ordered P1–P3 */
  predictions: DriverPrediction[];

  /** Unordered P4–P10 likely finishers */
  likelyFinishers: DriverPrediction[];

  generatedAt: string;
  modelSummary: string;
}