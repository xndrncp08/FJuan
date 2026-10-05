/**
 * components/ui/Logo.tsx
 *
 * The FJUAN logo as inline SVG, built from lib/theme/logo.ts. It sizes from
 * the current font-size (height ≈ 1.15em), so `text-[…]` classes scale it
 * the same way they scaled the old type-only wordmark.
 */

import { useId } from "react";
import { F_PATHS, JUAN_PATHS, LOGO_EMBER_STOPS, LOGO_RED_STOPS, LOGO_SKEW, PIXEL_TRAIL } from "@/lib/theme/logo";
import { cn } from "@/lib/utils/cn";

const SHEAR = Math.tan((-LOGO_SKEW * Math.PI) / 180);

function Gradients({ red, ember }: { red: string; ember: string }) {
  return (
    <defs>
      <linearGradient id={red} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor={LOGO_RED_STOPS[0]} />
        <stop offset=".55" stopColor={LOGO_RED_STOPS[1]} />
        <stop offset="1" stopColor={LOGO_RED_STOPS[2]} />
      </linearGradient>
      <linearGradient id={ember} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={LOGO_EMBER_STOPS[0]} />
        <stop offset="1" stopColor={LOGO_EMBER_STOPS[1]} />
      </linearGradient>
    </defs>
  );
}

/** Full lockup: pixel trail, F mark and JUAN. */
export function Logo({ className, title = "FJUAN" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const red = `fj-red-${id}`;
  const ember = `fj-ember-${id}`;
  return (
    <svg
      viewBox="-8 -2 349 104"
      role="img"
      aria-label={title}
      className={cn("inline-block h-[1.15em] w-auto shrink-0 overflow-visible", className)}
    >
      <Gradients red={red} ember={ember} />
      <g transform={`translate(${(100 * SHEAR).toFixed(2)} 0) skewX(${LOGO_SKEW})`}>
        {PIXEL_TRAIL.map(([x, y, w, h, o], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={`url(#${ember})`} opacity={o} />
        ))}
        {F_PATHS.map((d) => (
          <path key={d} d={d} fill={`url(#${red})`} />
        ))}
        <g fill="rgb(var(--paper))">
          {JUAN_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** The F on its own, for tight spaces (cockpit rail, avatars). */
export function LogoMark({ className, title = "FJUAN" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const red = `fj-red-${id}`;
  return (
    <svg viewBox="36 -2 154 104" role="img" aria-label={title} className={cn("inline-block h-[1em] w-auto shrink-0", className)}>
      <Gradients red={red} ember={`fj-ember-${id}`} />
      <g transform={`translate(${(100 * SHEAR).toFixed(2)} 0) skewX(${LOGO_SKEW})`}>
        {F_PATHS.map((d) => (
          <path key={d} d={d} fill={`url(#${red})`} />
        ))}
      </g>
    </svg>
  );
}
