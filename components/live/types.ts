export interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  year: number;
}

export interface Driver {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
}

export interface LapData {
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
}

export interface Stint {
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
}

export interface PitStop {
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  date: string;
}

export interface CarTelemetry {
  date: string;
  speed: number;
  rpm: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export const TYRE_COLORS: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FFF200",
  HARD: "#FFFFFF",
  INTERMEDIATE: "#39B54A",
  WET: "#0067FF",
  UNKNOWN: "#888888",
};

export function formatLapTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, "0");
  return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
}

export function teamColor(hex: string | undefined): string {
  if (!hex) return "#E10600";
  return hex.startsWith("#") ? hex : `#${hex}`;
}

export function safeArray<T>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}
