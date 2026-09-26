/**
 * lib/theme/palette.ts
 *
 * Single source of truth for the FJUAN color system.
 *
 * Design intent: a heat gradient (ink -> maroon -> red -> ember), evoking
 * asphalt and brake glow. Brand colors are used sparingly — as signal, not
 * as surface. Surfaces are warm-tinted neutrals that step lighter as they
 * elevate (Apple's dark-mode layering), so hierarchy reads through depth
 * instead of borders and glows.
 *
 * CSS gets these same values as custom properties in app/globals.css and
 * as Tailwind colors in tailwind.config.js. Use this file only where a
 * literal color is required (Recharts, SVG attributes, canvas).
 */

// ─── Brand ────────────────────────────────────────────────────────────────
export const INK = "#280905"; // brand ink — hero glows, deepest accents
export const MAROON = "#740A03"; // recessed brand tone
export const RED = "#C3110C"; // primary signal — filled buttons, live, selection
export const EMBER = "#E6501B"; // secondary signal — highlights, data emphasis
export const PAPER = "#F5E9E4"; // warm off-white — primary text

// ─── Surfaces (base -> elevated) ─────────────────────────────────────────
export const CANVAS = "#140605"; // page background
export const SURFACE_1 = "#1F0E0B"; // cards
export const SURFACE_2 = "#2A1612"; // nested / hovered cards
export const SURFACE_3 = "#361E19"; // controls on cards, tooltips

// ─── Text tiers (PAPER at fixed alphas; all ≥ 4.5:1 on SURFACE_2 but the last) ─
export const LABEL_1 = PAPER;
export const LABEL_2 = "rgba(245,233,228,0.72)";
export const LABEL_3 = "rgba(245,233,228,0.54)";
export const LABEL_4 = "rgba(245,233,228,0.32)"; // decorative / disabled only

// ─── Tint: accent readable as small text (≈5:1 on CANVAS) ────────────────
export const TINT = "#FF7A52";

// ─── Semantic ─────────────────────────────────────────────────────────────
export const SUCCESS = "#34D27B";
export const WARNING = "#FFC53D";
export const INFO = "#6CC4FF";
export const PURPLE = "#B48CFF"; // F1 timing convention: fastest

// Real-world podium convention, kept outside the brand palette on purpose.
export const MEDAL = { gold: "#E8C35A", silver: "#C9CDD3", bronze: "#C98A5B" } as const;

// ─── Charts ───────────────────────────────────────────────────────────────
export const CHART = {
  grid: "rgba(245,233,228,0.07)",
  axis: "rgba(245,233,228,0.54)",
  tooltipBg: SURFACE_3,
  series: [EMBER, "#F2A541", INFO, PURPLE, SUCCESS, PAPER],
} as const;

/**
 * Same colors as bare "r,g,b" triplets, for building rgba() strings with a
 * custom alpha without re-deriving the values each time.
 */
export const RGB = {
  ink: "40,9,5",
  maroon: "116,10,3",
  red: "195,17,12",
  ember: "230,80,27",
  paper: "245,233,228",
  canvas: "20,6,5",
} as const;

/** Section background — kept as a flat canvas so sections read as one page. */
export const SECTION_BACKGROUND = CANVAS;
