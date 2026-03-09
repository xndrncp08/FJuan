import { format as formatDate, formatDistanceToNow } from "date-fns";

// Format lap time from milliseconds
export function formatLapTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = milliseconds % 1000;

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

// Format race time (e.g., "1:32:15.123")
export function formatRaceTime(timeString: string): string {
  return timeString;
}

// Format points with precision
export function formatPoints(points: string | number): string {
  const p = typeof points === "string" ? parseFloat(points) : points;
  return p % 1 === 0 ? p.toFixed(0) : p.toFixed(1);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format position with ordinal suffix
export function formatPosition(position: number | string): string {
  const pos = typeof position === "string" ? parseInt(position) : position;

  if (pos === 1) return "1st";
  if (pos === 2) return "2nd";
  if (pos === 3) return "3rd";
  return `${pos}th`;
}

// Format driver name
export function formatDriverName(
  givenName: string,  
  familyName: string,
  format: "full" | "short" | "abbrev" = "full",
): string {
  switch (format) {
    case "full":
      return `${givenName} ${familyName}`;
    case "short":
      return familyName;
    case "abbrev":
      return `${givenName[0]}. ${familyName}`;
    default:
      return `${givenName} ${familyName}`;
  }
}

// Format date for display
export function formatRaceDate(
  dateString: string,
  timeString?: string,
): string {
  const date = new Date(`${dateString}${timeString ? `T${timeString}` : ""}`);
  return formatDate(date, "MMM dd, yyyy");
}

// Format date with time
export function formatDateTime(
  dateString: string,
  timeString?: string,
): string {
  const date = new Date(`${dateString}${timeString ? `T${timeString}` : ""}`);
  return formatDate(date, "MMM dd, yyyy HH:mm");
}

// Get countdown to event
export function getCountdown(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Get team color
export function getTeamColor(teamName: string): string {
  const teamColors: Record<string, string> = {
    "Red Bull Racing": "#3671C6",
    "Red Bull": "#3671C6",
    Ferrari: "#E8002D",
    Mercedes: "#27F4D2",
    McLaren: "#FF8000",
    "Aston Martin": "#229971",
    Alpine: "#FF87BC",
    Williams: "#64C4FF",
    Haas: "#B6BABD",
    "Haas F1 Team": "#B6BABD",
    RB: "#6692FF",
    "RB F1 Team": "#6692FF",
    Sauber: "#52E252",
    "Kick Sauber": "#52E252",
    AlphaTauri: "#5E8FAA",
    "Alfa Romeo": "#C92D4B",
  };

  return teamColors[teamName] || "#666666";
}

// Get nationality flag emoji
export function getNationalityFlag(nationality: string): string {
  const flags: Record<string, string> = {
    British: "🇬🇧",
    Dutch: "🇳🇱",
    Spanish: "🇪🇸",
    Monegasque: "🇲🇨",
    Mexican: "🇲🇽",
    Australian: "🇦🇺",
    Canadian: "🇨🇦",
    German: "🇩🇪",
    French: "🇫🇷",
    Japanese: "🇯🇵",
    Thai: "🇹🇭",
    Chinese: "🇨🇳",
    Danish: "🇩🇰",
    Finnish: "🇫🇮",
    Italian: "🇮🇹",
    American: "🇺🇸",
    Belgian: "🇧🇪",
    Brazilian: "🇧🇷",
    Argentine: "🇦🇷",
    Austrian: "🇦🇹",
    Swiss: "🇨🇭",
    Swedish: "🇸🇪",
    "New Zealander": "🇳🇿",
    Polish: "🇵🇱",
  };

  return flags[nationality] || "🏁";
}

// Format speed
export function formatSpeed(
  speed: number,
  unit: "kmh" | "mph" = "kmh",
): string {
  if (unit === "mph") {
    return `${(speed * 0.621371).toFixed(1)} mph`;
  }
  return `${speed.toFixed(1)} km/h`;
}

// Format gap time
export function formatGap(gap: number): string {
  if (gap === 0) return "Leader";
  if (gap < 1) return `+${(gap * 1000).toFixed(0)}ms`;
  return `+${gap.toFixed(3)}s`;
}

// Format duration in seconds to readable format
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}