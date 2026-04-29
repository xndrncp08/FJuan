/**
 * lib/types/prediction.ts
 *
 * Types for the race prediction engine v3.
 * Extends v2 with weather, sprint, tyre fit, and grid penalty factors.
 */

// ─── Per-driver factor breakdown ──────────────────────────────────────────────

export interface DriverPrediction {
  driverId:          string;
  driverCode:        string;  // e.g. "VER", "HAM"
  givenName:         string;
  familyName:        string;
  constructorName:   string;
  constructorId:     string;
  score:             number;  // composite weighted score (0–100)
  podiumProbability: number;  // softmax probability % (sums to 100 across top 10)

  factors: {
    // ── v2 factors ────────────────────────────────────────────────────────
    currentForm:          number; // 0–100, recency-weighted race finishing positions
    championshipPosition: number; // 0–100, inverted standing + wins bonus
    circuitHistory:       number; // 0–100, podiums at this circuit, last 10 seasons
    qualifyingStrength:   number; // 0–100, recency-weighted qualifying positions

    // ── v3 additions ──────────────────────────────────────────────────────
    weatherAdaptability:  number; // 0–100, wet-weather rating if rain expected, else 50
    sprintForm:           number; // 0–100, sprint result for this weekend (0 if not sprint)
    tyreFit:              number; // 0–100, constructor tyre-management rating for circuit compound
    gridPenalty:          number; // 0 if penalty confirmed, 100 if clean (binary)
  };

  insight: string; // Groq-generated one-sentence analyst note
}

// ─── Weather forecast snapshot ────────────────────────────────────────────────

export interface WeatherForecast {
  rainProbability: number; // 0–100, % chance of rain on race day
  temperatureC:    number; // expected max temp °C
  windSpeedKph:    number; // expected max wind speed km/h
  isWetExpected:   boolean; // true if rainProbability > 40
}

// ─── Full race prediction output ──────────────────────────────────────────────

export interface RacePrediction {
  raceName:       string;
  circuitId:      string;
  circuitName:    string;
  raceDate:       string; // ISO "YYYY-MM-DD"

  // Top 3 predicted podium finishers
  predictions:    DriverPrediction[];

  // P4–P10 range (shuffled slightly to reflect uncertainty in midfield)
  likelyFinishers: DriverPrediction[];

  generatedAt:    string; // ISO timestamp of when prediction was generated

  // ── v3 additions ─────────────────────────────────────────────────────────
  weather:        WeatherForecast; // forecast data used for the weather factor
  isSprint:       boolean;        // whether this is a sprint weekend

  // Human-readable summary of model weights and data window used
  modelSummary:   string;
}