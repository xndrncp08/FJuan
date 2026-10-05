/**
 * components/ui/Card.tsx
 *
 * Cards are the main surface: square glass panels (translucent surface,
 * backdrop blur, 10% white edge) over the cockpit's ambient lighting. `CardLink` makes the whole card the
 * hit target (a real <a>, so it's keyboard- and middle-click-friendly).
 */

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Padding = "none" | "sm" | "md" | "lg";

const PAD: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  padding = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { padding?: Padding }) {
  return <div className={cn("card", PAD[padding], className)} {...props} />;
}

export function CardLink({
  padding = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { padding?: Padding }) {
  return <Link className={cn("card card-interactive block", PAD[padding], className)} {...props} />;
}

/** Title row inside a card: title on the left, optional accessory on the right. */
export function CardHeader({
  title,
  subtitle,
  accessory,
  as: Heading = "h2",
  className,
}: {
  title: React.ReactNode;
  as?: "h2" | "h3";
  subtitle?: React.ReactNode;
  accessory?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <Heading className="text-title-3 text-paper">{title}</Heading>
        {subtitle && <p className="mt-0.5 text-footnote text-label-3">{subtitle}</p>}
      </div>
      {accessory && <div className="shrink-0">{accessory}</div>}
    </div>
  );
}
