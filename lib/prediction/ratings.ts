import type { Observation, Ratings } from "@/lib/types/prediction";

// Legacy subjective ratings, first versioned here. No claim of historical availability.
export const RATINGS_AVAILABLE_AT = "2026-10-27T20:03:52Z";
const DRIVER_ALIASES: Record<string, string> = {"max_verstappen": "max_verstappen", "lewis_hamilton": "hamilton", "fernando_alonso": "alonso", "george_russell": "russell", "lando_norris": "norris", "carlos_sainz": "sainz", "charles_leclerc": "leclerc", "oscar_piastri": "piastri", "lance_stroll": "stroll", "esteban_ocon": "ocon", "pierre_gasly": "gasly", "nico_hulkenberg": "hulkenberg", "yuki_tsunoda": "tsunoda", "alexander_albon": "albon", "valtteri_bottas": "bottas", "guanyu_zhou": "zhou", "kevin_magnussen": "magnussen", "logan_sargeant": "sargeant", "nyck_de_vries": "de_vries", "oliver_bearman": "bearman", "franco_colapinto": "colapinto", "jack_doohan": "doohan", "isack_hadjar": "hadjar", "andrea_kimi_antonelli": "antonelli", "alex_albon": "albon", "kimi_antonelli": "antonelli", "gabriel_bortoleto": "bortoleto", "liam_lawson": "lawson"};
export function canonicalDriverId(id: string): string { return DRIVER_ALIASES[id] ?? id; }
export function sessionDriverId(fullName: string, number: string): string {
  const key = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, "_");
  return DRIVER_ALIASES[key] ?? `openf1:${number}`;
}

export const RATINGS: Observation<Ratings> = {
  availableAt: RATINGS_AVAILABLE_AT,
  source: "Versioned subjective ratings; not fitted to outcomes",
  value: {
    wet: {
  max_verstappen: 9.5,
  hamilton: 9.5,
  alonso: 9.5,
  russell: 8.5,
  norris: 8.0,
  sainz: 8.0,
  leclerc: 8.0,
  piastri: 7.5,
  stroll: 7.5,
  ocon: 7.0,
  gasly: 7.0,
  hulkenberg: 7.0,
  tsunoda: 7.0,
  albon: 7.0,
  bottas: 6.5,
  zhou: 5.5,
  magnussen: 6.0,
  sargeant: 5.0,
  de_vries: 5.5,
  bearman: 6.0,
  colapinto: 5.5,
  doohan: 5.5,
  hadjar: 5.5,
  antonelli: 6.0,
  bortoleto: 5.5,
  lawson: 6.5,
},
    tyre: {
  red_bull: { soft: 8.5, medium: 9.0, hard: 8.5 },
  ferrari: { soft: 9.0, medium: 8.5, hard: 7.5 },
  mercedes: { soft: 7.5, medium: 8.5, hard: 9.0 },
  mclaren: { soft: 9.0, medium: 9.0, hard: 8.5 },
  aston_martin: { soft: 7.0, medium: 7.5, hard: 8.0 },
  alpine: { soft: 7.0, medium: 7.0, hard: 6.5 },
  williams: { soft: 6.5, medium: 7.0, hard: 7.5 },
  haas: { soft: 6.0, medium: 6.5, hard: 6.0 },
  rb: { soft: 6.5, medium: 7.0, hard: 6.5 },
  sauber: { soft: 5.5, medium: 6.0, hard: 6.0 },
},
    compound: {
  monaco: "soft",
  hungaroring: "soft",
  singapore: "soft",
  baku: "soft",
  monza: "hard",
  spa: "hard",
  silverstone: "hard",
  suzuka: "hard",
  interlagos: "hard",
  americas: "hard",
  jeddah: "hard",
  bahrain: "hard",
  albert_park: "medium",
  imola: "medium",
  red_bull_ring: "medium",
  zandvoort: "medium",
  rodriguez: "medium",
  yas_marina: "medium",
  miami: "medium",
  catalunya: "medium",
  losail: "medium",
  las_vegas: "medium",
  shanghai: "medium",
}
  },
};
