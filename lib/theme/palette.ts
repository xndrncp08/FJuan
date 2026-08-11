/**
 * lib/theme/palette.ts
 *
 * Single source of truth for the FJUAN color system.
 *
 * HeroSection, LastRaceSection, and NewsSection all import from here rather
 * than hard-coding hex values. This is what keeps the three sections visually
 * aligned as one continuous page instead of three separately-styled blocks —
 * if the palette ever changes, it changes everywhere at once.
 *
 * Design intent: a heat gradient (ink -> maroon -> red -> ember), evoking
 * asphalt and brake glow rather than a generic dark-mode neon dashboard.
 */

export const INK = "#280905"; // base background
export const MAROON = "#740A03"; // recessed panels, ticker background
export const RED = "#C3110C"; // primary signal (live indicators, CTAs, headings accents)
export const EMBER = "#E6501B"; // secondary signal (DRS-style highlights, hover glow)
export const PAPER = "#F5E9E4"; // off-white text — none of the four brand colors
// have enough contrast against INK to work as body text

/**
 * Same four colors as bare "r,g,b" triplets, for building rgba() strings
 * with custom alpha without re-deriving the values each time.
 */
export const RGB = {
  ink: "40,9,5",
  maroon: "116,10,3",
  red: "195,17,12",
  ember: "230,80,27",
  paper: "245,233,228",
} as const;

/**
 * Shared vertical background for every section below the hero.
 *
 * It starts and ends on INK, matching the hero's solid INK background.
 * Because every section's top edge and bottom edge are the exact same
 * color, the seam between sections disappears on scroll — the page reads
 * as one continuous surface rather than a stack of distinct blocks.
 */
export const SECTION_BACKGROUND = `linear-gradient(180deg, ${INK} 0%, #34110a 45%, ${INK} 100%)`;
