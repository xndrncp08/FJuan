/**
 * components/ui/TeamMark.tsx
 *
 * The one way team identity shows up: a small livery-colored capsule next
 * to a name. Color is a cue, never the only carrier of meaning — the team
 * name is always rendered nearby.
 */

import { teamColor } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

export function TeamMark({
  team,
  color,
  size = "md",
  className,
}: {
  team?: string | null;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const c = color ?? teamColor(team);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0",
        size === "sm" ? "h-3 w-1" : size === "md" ? "h-4 w-1" : "h-6 w-1.5",
        className,
      )}
      style={{ background: c }}
    />
  );
}
