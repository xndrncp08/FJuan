/**
 * lib/telemetry/types.ts
 *
 * Shapes shared by every telemetry source (OpenF1, Jolpica, synthetic), so
 * the 3D views and the delta suite never care where the numbers came from.
 */

export type TelemetrySource = "openf1" | "jolpica" | "synthetic";

export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";

/** One car sample, aligned to a position on the lap. */
export interface TelemetrySample {
  /** Seconds since the start of the lap. */
  t: number;
  /** Metres since the start of the lap. */
  distance: number;
  /** Track position in metres, origin at the circuit centre. z is elevation. */
  x: number;
  y: number;
  z: number;
  speed: number; // km/h
  throttle: number; // 0–100
  brake: number; // 0–100 (OpenF1 reports 0 or 100)
  gear: number; // 0–8
  rpm: number;
  drs: boolean;
}

export interface LapTrace {
  lapNumber: number;
  lapTime: number; // seconds
  sectors: [number, number, number];
  /** Fraction of lap distance where sectors 2 and 3 start. */
  sectorSplits: [number, number];
  samples: TelemetrySample[];
}

export interface LapSummary {
  lapNumber: number;
  lapTime: number | null;
  sectors: [number | null, number | null, number | null];
  compound: Compound | null;
  tyreAge: number;
  isPitOutLap: boolean;
  /** Track temperature (°C) at the start of the lap, if known. */
  trackTemp: number | null;
}

export interface Stint {
  stint: number;
  compound: Compound;
  lapStart: number;
  lapEnd: number;
  tyreAgeAtStart: number;
}

export interface SessionInfo {
  sessionKey: number | null;
  name: string;
  circuit: string;
  country: string;
  year: number;
  date: string;
}

export interface DriverInfo {
  number: number;
  code: string;
  name: string;
  team: string;
  color: string;
}

/** Everything the telemetry cockpit needs for one driver in one session. */
export interface SessionTelemetry {
  source: TelemetrySource;
  /** Why a fallback source was used, if one was. */
  fallbackReason?: string;
  session: SessionInfo;
  driver: DriverInfo;
  drivers: DriverInfo[];
  lap: LapTrace;
  laps: LapSummary[];
  stints: Stint[];
  /** Track temperature through the session: [minutes from start, °C]. */
  trackTemps: [number, number][];
  /** Circuit length in metres. */
  trackLength: number;
}

export interface ClassificationRow {
  position: number | null;
  driverId: string;
  code: string;
  name: string;
  constructorId: string;
  constructorName: string;
  grid: number | null;
  status: string;
  points: number;
}

export interface RaceClassification {
  source: TelemetrySource;
  season: string;
  round: string;
  raceName: string;
  circuitId: string;
  circuitName: string;
  date: string;
  rows: ClassificationRow[];
}
