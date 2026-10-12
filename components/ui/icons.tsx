/**
 * components/ui/icons.tsx
 *
 * FJUAN's own icon set. Square caps and mitred joins to match the square
 * panels, a 2px stroke on a 24px grid, `currentColor` throughout. A few
 * carry racing details: the menu is three speed lines, the flag is
 * chequered, the car is a side-on F1 car.
 *
 * Decorative by default (aria-hidden). Pass aria-label to make one an image.
 */

import { forwardRef } from "react";

export type IconProps = React.SVGProps<SVGSVGElement>;

function make(name: string, body: React.ReactNode) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(props, ref) {
    const labelled = props["aria-label"] != null;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? "img" : undefined}
        focusable="false"
        {...props}
      >
        {body}
      </svg>
    );
  });
  Icon.displayName = name;
  return Icon;
}

const dot = (x: number, y: number, s = 2) => <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill="currentColor" stroke="none" />;

// ─── Direction ──────────────────────────────────────────────────────────
export const ChevronRight = make("ChevronRight", <path d="M9.5 5.5 16 12l-6.5 6.5" />);
export const ChevronLeft = make("ChevronLeft", <path d="M14.5 5.5 8 12l6.5 6.5" />);
export const ChevronDown = make("ChevronDown", <path d="M5.5 9.5 12 16l6.5-6.5" />);
export const ChevronsUpDown = make("ChevronsUpDown", <path d="M7.5 9 12 4.5 16.5 9M7.5 15l4.5 4.5 4.5-4.5" />);
export const ArrowRight = make("ArrowRight", <><path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" /><path d="M2 12h0.5" /></>);
export const ArrowUpRight = make("ArrowUpRight", <path d="M7 17 17 7M9 7h8v8" />);
export const ArrowUp = make("ArrowUp", <path d="M12 20V5M6.5 10.5 12 5l5.5 5.5" />);
export const ArrowDown = make("ArrowDown", <path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" />);
export const ArrowLeftRight = make("ArrowLeftRight", <path d="M4 8h15M15.5 4.5 19 8l-3.5 3.5M20 16H5M8.5 12.5 5 16l3.5 3.5" />);
export const GitCompareArrows = make("GitCompareArrows", <><path d="M3 7h10M10 4l3 3-3 3M21 17H11M14 14l-3 3 3 3" /><path d="M17 4v6M7 14v6" /></>);
export const SquareArrowOutUpRight = make("SquareArrowOutUpRight", <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />);

// ─── Actions ────────────────────────────────────────────────────────────
export const X = make("X", <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />);
export const Check = make("Check", <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />);
export const Minus = make("Minus", <path d="M5.5 12h13" />);
export const Search = make("Search", <><path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Z" /><path d="m15.5 15.5 5 5" /></>);
export const Menu = make("Menu", <path d="M3 6h18M6 12h15M10 18h11" />);
export const RotateCcw = make("RotateCcw", <path d="M4 4v5h5M4.6 9A8 8 0 1 1 4 12" />);
export const RefreshCw = make("RefreshCw", <path d="M20 4v5h-5M4 20v-5h5M19.4 9A8 8 0 0 0 5 8M4.6 15A8 8 0 0 0 19 16" />);
export const Play = make("Play", <path d="M7 4.5v15L19.5 12Z" fill="currentColor" strokeLinejoin="round" />);
export const Pause = make("Pause", <><rect x="6" y="5" width="4" height="14" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" fill="currentColor" stroke="none" /></>);
export const Maximize2 = make("Maximize2", <path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />);
export const Minimize2 = make("Minimize2", <path d="M4 14h6v6M20 10h-6V4M14 10l6.5-6.5M10 14l-6.5 6.5" />);
export const Rotate3d = make("Rotate3d", <><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="3.6" ry="9" /><path d="M19 6.5 21 9h-3" /></>);

// ─── Status ─────────────────────────────────────────────────────────────
export const Info = make("Info", <><rect x="3.5" y="3.5" width="17" height="17" /><path d="M12 11v6" />{dot(12, 7.75)}</>);
export const TriangleAlert = make("TriangleAlert", <><path d="M12 3.5 21.5 20h-19Z" /><path d="M12 10v4.5" />{dot(12, 17.25)}</>);
export const Sparkles = make("Sparkles", <><path d="M10 4l1.6 5.4L17 11l-5.4 1.6L10 18l-1.6-5.4L3 11l5.4-1.6Z" strokeLinejoin="round" /><path d="M18.5 3v4M16.5 5h4" /></>);
export const Zap = make("Zap", <path d="M13.5 2.5 4.5 14H11l-1 7.5 9-11.5h-6.5Z" />);
export const Activity = make("Activity", <path d="M2 12h4l3-7.5 6 15 3-7.5h4" />);
export const TrendingUp = make("TrendingUp", <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />);
export const TrendingDown = make("TrendingDown", <path d="M3 7l6 6 4-4 8 8M15 17h6v-6" />);
export const Crosshair = make("Crosshair", <><path d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></>);
export const Compass = make("Compass", <><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" /><path d="m15.5 8.5-2 5-5 2 2-5Z" fill="currentColor" /></>);

// ─── Racing ─────────────────────────────────────────────────────────────
export const Trophy = make("Trophy", <path d="M7 4h10v5a5 5 0 0 1-10 0ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8" />);
export const Timer = make("Timer", <><path d="M12 5.5a7.75 7.75 0 1 1 0 15.5 7.75 7.75 0 0 1 0-15.5Z" /><path d="M12 13.25 15 10.25M10 2.5h4M12 2.5v3M18.5 6l1.5-1.5" /></>);
export const Flag = make("Flag", (
  <>
    <path d="M5 21.5V3.5h14v11H5" />
    {[0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((r) => ((c + r) % 2 === 0 ? <rect key={`${c}${r}`} x={5 + c * 3.5} y={3.5 + r * (11 / 3)} width={3.5} height={11 / 3} fill="currentColor" stroke="none" /> : null)))}
  </>
));
export const Car = make("Car", (
  <>
    <path d="M2 16.5v-2.5l7-1.5 2.5-3h3l1.5 2.5h4V8h2v8.5" strokeLinejoin="round" />
    <path d="M9 16.5h6" />
    <circle cx="6" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
  </>
));
export const Cpu = make("Cpu", <><rect x="6" y="6" width="12" height="12" /><rect x="9.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none" /><path d="M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5" /></>);
export const Radio = make("Radio", <>{dot(12, 12, 4)}<path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" strokeLinecap="butt" /></>);
export const Database = make("Database", <><ellipse cx="12" cy="5.5" rx="8" ry="2.75" /><path d="M4 5.5v13c0 1.5 3.6 2.75 8 2.75s8-1.25 8-2.75v-13M4 12c0 1.5 3.6 2.75 8 2.75s8-1.25 8-2.75" /></>);

export const Home = make("Home", <path d="M3.5 11 12 4l8.5 7M6 9.5v10.5h4.5v-6h3v6H18V9.5" />);

// ─── Places & time ──────────────────────────────────────────────────────
export const MapPin = make("MapPin", <><path d="M12 21.5s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" strokeLinejoin="round" />{dot(12, 9.5, 3.5)}</>);
export const CalendarDays = make("CalendarDays", <><path d="M3.5 5.5h17v15h-17ZM3.5 10h17M8 3v4M16 3v4" />{dot(8, 14)}{dot(12, 14)}{dot(16, 14)}{dot(8, 17.5)}{dot(12, 17.5)}</>);
export const CalendarX = make("CalendarX", <path d="M3.5 5.5h17v15h-17ZM3.5 10h17M8 3v4M16 3v4M10 13l4 4M14 13l-4 4" />);

// ─── Weather ────────────────────────────────────────────────────────────
export const Thermometer = make("Thermometer", <><path d="M10 14.5V4.5a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0Z" strokeLinejoin="round" /><path d="M12 9v8" /></>);
export const Wind = make("Wind", <path d="M3 8.5h10a2.75 2.75 0 1 0-2.75-2.75M3 12.5h15a2.75 2.75 0 1 1-2.75 2.75M3 16.5h6" />);
export const CloudRain = make("CloudRain", <><path d="M7 14.5a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 7.5a3.5 3.5 0 0 1 .5 7Z" strokeLinejoin="round" /><path d="M8.5 18 7.5 21M12.5 18l-1 3M16.5 18l-1 3" /></>);

// ─── People ─────────────────────────────────────────────────────────────
export const User = make("User", <path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4.5 21v-1a7.5 7.5 0 0 1 15 0v1" />);
export const Users = make("Users", <path d="M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM2.5 20.5v-.5a6.5 6.5 0 0 1 13 0v.5M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.5a6.5 6.5 0 0 1 3 5.5v.5" />);
export const UserX = make("UserX", <path d="M9 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM2 21v-1a7 7 0 0 1 14 0v1M17.5 8.5l4 4M21.5 8.5l-4 4" />);

// ─── Chat ───────────────────────────────────────────────────────────────
export const MessageCircle = make("MessageCircle", <path d="M3.5 4h17v12h-9l-5 4v-4h-3Z" />);

/**
 * Nacho Bot's mascot: a tortilla chip in a racing visor, with a grin and a
 * cheese drip. Full colour, so it ignores currentColor.
 */
export function NachoIcon({ className, ...props }: IconProps) {
  const labelled = props["aria-label"] != null;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden={labelled ? undefined : true} role={labelled ? "img" : undefined} focusable="false" {...props}>
      {/* chip */}
      <path d="M16 2.5c.6 0 1 .3 1.3.8l11.4 21.2c.5 1-.1 2.1-1.2 2.3-3.5.6-7.4.9-11.5.9s-8-.3-11.5-.9c-1.1-.2-1.7-1.3-1.2-2.3L14.7 3.3c.3-.5.7-.8 1.3-.8Z" fill="#E8B54A" />
      <path d="M16 2.5c.6 0 1 .3 1.3.8l11.4 21.2c.5 1-.1 2.1-1.2 2.3L16 4.6 4.5 26.8c-1.1-.2-1.7-1.3-1.2-2.3L14.7 3.3c.3-.5.7-.8 1.3-.8Z" fill="#F6CF6E" opacity=".55" />
      {/* visor */}
      <path d="M9.3 14.2h13.4l2.3 4.6c.3.6 0 1.3-.7 1.4-2.6.5-5.4.7-8.3.7s-5.7-.2-8.3-.7c-.7-.1-1-.8-.7-1.4Z" fill="#140605" />
      <path d="M10.6 15.6h4.6" stroke="#F5E9E4" strokeOpacity=".35" strokeWidth=".9" strokeLinecap="round" />
      {/* eyes */}
      <path d="M11.2 17.2h3.2l-.5 1.6h-2.9Z" fill="#FF7A52" />
      <path d="M17.6 17.2h3.2l.2 1.6h-2.9Z" fill="#FF7A52" />
      {/* grin */}
      <path d="M13.6 22.2c1.5 1 3.3 1 4.8 0" stroke="#7A3E0A" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      {/* cheese drip */}
      <path d="M4.8 24.2c3.6.8 7.4 1.2 11.2 1.2s7.6-.4 11.2-1.2l.6 1.2c.3.6-.1 1.3-.8 1.4-1 .2-2.1.3-3.2.4-.2 1.4-.6 2.2-1.1 2.2s-.9-.8-1-2c-1.9.1-3.8.2-5.7.2-.2 1-.6 1.6-1 1.6s-.8-.6-1-1.7c-1.9-.1-3.7-.3-5.4-.5-1.1-.1-1.7-1.2-1.2-2.1Z" fill="#FFC53D" />
      {/* salt */}
      <circle cx="10.4" cy="22.4" r=".6" fill="#FFF7EC" opacity=".8" />
      <circle cx="21.6" cy="22.1" r=".6" fill="#FFF7EC" opacity=".8" />
      <circle cx="17.6" cy="10.6" r=".5" fill="#FFF7EC" opacity=".7" />
      <circle cx="13.8" cy="11.8" r=".5" fill="#FFF7EC" opacity=".7" />
    </svg>
  );
}
