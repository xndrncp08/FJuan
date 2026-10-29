export type PredictionHorizon = "pre-qualifying" | "post-qualifying";
export type FactorKey = "currentForm" | "qualifyingStrength" | "championshipPosition" | "circuitHistory" | "weatherAdaptability" | "sprintForm" | "tyreFit" | "gridPenalty";

export interface RaceContext {
  season: string;
  round: string;
  raceName: string;
  circuitId: string;
  circuitName: string;
  raceDate: string;
  raceStart: string;
  qualifyingStart: string;
  qualifyingEnd: string;
  latitude: number | null;
  longitude: number | null;
  isSprint: boolean;
}

/** availableAt is when this exact response was observed, not the event date. */
export interface Observation<T> { availableAt: string; source: string; value: T }
export interface Entry {
  driverId: string;
  driverCode: string;
  givenName: string;
  familyName: string;
  constructorId: string;
  constructorName: string;
  number: string;
  status: "entered" | "withdrawn";
}
export interface Position { driverId: string; position: number; wins?: number }
export interface PastResult {
  season: string;
  round: string;
  endedAt: string;
  rows: Position[];
}
export interface Penalty { driverId: string; severity: number; announcedAt: string }
export interface ForecastValues { rainProbability: number; temperatureC: number | null; windSpeedKph: number | null; raceDate: string }
export interface Ratings { wet: Record<string, number>; tyre: Record<string, Record<string, number>>; compound: Record<string, string> }

/** Immutable, versioned inputs. Never reconstruct these from today's historical API responses. */
export interface PredictionSnapshot {
  schemaVersion: 1;
  capturedAt: string;
  cutoff: string;
  horizon: PredictionHorizon;
  race: RaceContext;
  entries: Observation<Entry[]>;
  entryBasis: "qualifying" | "practice" | "entry-list" | "previous-race";
  form: Observation<PastResult[]> | null;
  qualifyingHistory: Observation<PastResult[]> | null;
  circuitHistory: Observation<PastResult[]> | null;
  standings: Observation<PastResult> | null;
  qualifying: Observation<{ endedAt: string; rows: Position[] }> | null;
  sprint: Observation<{ endedAt: string; rows: Position[] }> | null;
  startingGrid: Observation<Position[]> | null;
  penalties: Observation<Penalty[]> | null;
  weather: Observation<ForecastValues> | null;
  ratings: Observation<Ratings> | null;
  warnings: string[];
}

export interface DriverPrediction extends Omit<Entry, "number" | "status"> {
  score: number;
  /** Relative softmax estimate over the entire field, 0–1. Not calibrated win odds. */
  modelEstimate: number;
  factors: Record<FactorKey, number>;
  missingFactors: FactorKey[];
  inactiveFactors: FactorKey[];
  penaltySeverity: number | null;
  insight: string;
}
export interface WeatherForecast {
  available: boolean;
  rainProbability: number | null;
  temperatureC: number | null;
  windSpeedKph: number | null;
  isWetExpected: boolean | null;
}
export interface RacePrediction {
  raceName: string;
  circuitId: string;
  circuitName: string;
  raceDate: string;
  season: string;
  round: string;
  predictions: DriverPrediction[];
  likelyFinishers: DriverPrediction[];
  ranking: DriverPrediction[];
  generatedAt: string;
  cutoff: string;
  horizon: PredictionHorizon;
  weather: WeatherForecast;
  isSprint: boolean;
  sprintAvailable: boolean;
  entryBasis: PredictionSnapshot["entryBasis"];
  coverage: Record<FactorKey, number>;
  warnings: string[];
  modelSummary: string;
}
