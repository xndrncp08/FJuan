/**
 * lib/theme/wordmark.ts
 *
 * Outlines of the hero wordmark letters, taken from Russo One (the display
 * face loaded in app/layout.tsx; SIL Open Font License) so the 3D wordmark
 * matches the type exactly. Paths are in font units, y-up from the
 * baseline, as SVG path data.
 */

export const WORDMARK_UNITS_PER_EM = 1000;
export const WORDMARK_CAP_HEIGHT = 700;

export type WordmarkChar = "F" | "J" | "U" | "A" | "N";

export const WORDMARK_GLYPHS: Record<WordmarkChar, { advance: number; d: string }> = {
  F: {
    advance: 625,
    d: "M240 255L240 0L60 0L60 700L615 700L615 560L240 560L240 395L535 395L535 255L240 255Z",
  },
  J: {
    advance: 460,
    d: "M400 180Q400 82 354 36Q308 -10 212.5 -10Q117 -10 10 0L10 0L10 135Q88 130 170 130L170 130Q193 130 206.5 143.5Q220 157 220 180L220 180L220 560L90 560L90 700L400 700L400 180Z",
  },
  U: {
    advance: 750,
    d: "M510 190L510 700L690 700L690 190Q690 85 642.5 37.5Q595 -10 490 -10L490 -10L260 -10Q155 -10 107.5 37.5Q60 85 60 190L60 190L60 700L240 700L240 190Q240 130 300 130L300 130L450 130Q510 130 510 190L510 190Z",
  },
  A: {
    advance: 710,
    d: "M230 125L185 0L-10 0L255 700L455 700L720 0L525 0L480 125L230 125ZM355 490L275 255L435 255L355 490Z",
  },
  N: {
    advance: 730,
    d: "M670 700L670 0L480 0L240 420L240 0L60 0L60 700L250 700L490 280L490 700L670 700Z",
  },
};

export const WORDMARK: WordmarkChar[] = ["F", "J", "U", "A", "N"];
