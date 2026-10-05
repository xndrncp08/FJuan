/**
 * lib/theme/logo.ts
 *
 * FJUAN logo geometry, reconstructed as vectors from the brand artwork.
 * Shapes are drawn upright and the whole lockup is sheared by SKEW degrees,
 * so the F mark, pixel trail and JUAN letters share one slant.
 * public/fjuan-logo.svg, app/icon.svg and app/apple-icon.png are exports of
 * these same paths.
 */

export const LOGO_SKEW = -16;

/** Outer and inner strokes of the double-line F. */
export const F_PATHS = [
  "M40 100V10Q40 0 50 0H156Q146 13 128 16H58V100Z",
  "M64 100V37Q64 30 71 30H126Q118 41 104 44H80V100Z",
] as const;

/** Checkered pixel trail behind the F: [x, y, width, height, opacity]. */
export const PIXEL_TRAIL: readonly (readonly [number, number, number, number, number])[] = [
  [24, 34, 12, 7, 1],
  [8, 34, 12, 7, 0.55],
  [30, 46, 8, 6, 0.8],
  [14, 46, 12, 6, 0.45],
  [-4, 46, 10, 6, 0.25],
  [22, 58, 14, 7, 0.9],
  [4, 58, 12, 7, 0.5],
  [30, 70, 8, 6, 0.6],
  [12, 70, 12, 6, 0.3],
];

/** J, U, A, N. */
export const JUAN_PATHS = [
  "M151 42H166V92Q166 100 158 100H130Q122 100 122 92V76H137V85H151Z",
  "M176 42H191V85H207V42H222V92Q222 100 214 100H184Q176 100 176 92Z",
  "M229 100L250 42H264L285 100H269L257 64L245 100Z",
  "M291 100V42H305L324 77V42H339V100H325L306 65V100Z",
] as const;

export const LOGO_RED_STOPS = ["#A80B08", "#D3120C", "#F0561E"] as const;
export const LOGO_EMBER_STOPS = ["#C3110C", "#FF6A2A"] as const;
