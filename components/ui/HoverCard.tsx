"use client";

/**
 * HoverCard
 *
 * Reusable wrapper that handles mouse-enter/leave background swaps.
 * Must be a client component — event handlers can't live in server components.
 */

interface Props {
  hoverBg?: string;
  defaultBg?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function HoverCard({
  hoverBg = "rgba(255,255,255,0.025)",
  defaultBg = "#0a0a0a",
  style,
  children,
}: Props) {
  return (
    <div
      style={{ background: defaultBg, transition: "background 0.2s ease", ...style }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = hoverBg}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = defaultBg}
    >
      {children}
    </div>
  );
}