/**
 * lib/theme/teams.ts
 *
 * One lookup for team livery colors. Callers pass whatever they have — a
 * Jolpica constructorId ("red_bull"), a display name ("Red Bull"), or an
 * OpenF1 hex without "#" — and get a usable color back.
 */

const BY_ID: Record<string, string> = {
  red_bull: "#3671C6",
  ferrari: "#E80020",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  rb: "#6692FF",
  sauber: "#52E252",
  kick_sauber: "#52E252",
  haas: "#B6BABD",
  audi: "#BB0A30",
  cadillac: "#A8A9AD",
  renault: "#FFF500",
  brabham: "#FFFFFF",
  tyrrell: "#009900",
  benetton: "#00CC00",
};

/** "Red Bull Racing" -> "red_bull"-style key, tolerant of sponsor prefixes. */
function normalize(value: string): string {
  const v = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (v.includes("red bull")) return "red_bull";
  if (v.includes("aston")) return "aston_martin";
  if (v.includes("sauber") || v.includes("stake")) return "sauber";
  if (v.includes("haas")) return "haas";
  if (v === "rb" || v.includes("racing bulls") || v.includes("alphatauri") || v.includes("visa cash app")) return "rb";
  for (const key of Object.keys(BY_ID)) {
    if (v.includes(key.replace(/_/g, " "))) return key;
  }
  return v.replace(/ /g, "_");
}

export const FALLBACK_TEAM_COLOR = "#8A7A76";

export function teamColor(team: string | null | undefined): string {
  if (!team) return FALLBACK_TEAM_COLOR;
  if (/^#?[0-9a-f]{6}$/i.test(team)) return team.startsWith("#") ? team : `#${team}`;
  return BY_ID[team] ?? BY_ID[normalize(team)] ?? FALLBACK_TEAM_COLOR;
}

const SHORT_NAMES: Record<string, string> = {
  red_bull: "Red Bull",
  ferrari: "Ferrari",
  mercedes: "Mercedes",
  mclaren: "McLaren",
  aston_martin: "Aston Martin",
  alpine: "Alpine",
  williams: "Williams",
  rb: "Racing Bulls",
  sauber: "Sauber",
  kick_sauber: "Sauber",
  haas: "Haas",
  audi: "Audi",
  cadillac: "Cadillac",
};

/** "MoneyGram Haas F1 Team" -> "Haas". Falls back to the name without "F1 Team". */
export function shortTeamName(name: string | null | undefined, id?: string): string {
  if (!name && !id) return "—";
  const key = id && SHORT_NAMES[id] ? id : normalize(name ?? id ?? "");
  return SHORT_NAMES[key] ?? (name ?? "").replace(/\s*F1 Team\s*/i, " ").trim();
}
