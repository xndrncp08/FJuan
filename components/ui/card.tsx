/**
 * Card — shadcn/ui-compatible card primitives, tuned for the FJUAN dark theme.
 *
 * All cards use sharp corners (--radius: 0rem), dark surfaces, and subtle borders.
 * The base <Card> component exposes a `variant` prop for surface depth:
 *   "default"  → bg-[#111] (--bg-surface)
 *   "panel"    → bg-[#0d0d0d] (--bg-panel), slightly deeper
 *   "elevated" → bg-[#161616] (--bg-surface-2)
 *
 * Sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 */
import * as React from "react";
import { cn } from "@/lib/utils/cn";

/* ── Root Card ────────────────────────────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual depth variant — controls background colour */
  variant?: "default" | "panel" | "elevated";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const bg =
      variant === "panel"    ? "bg-[#0d0d0d]" :
      variant === "elevated" ? "bg-[#161616]" :
                               "bg-[#111111]";

    return (
      <div
        ref={ref}
        className={cn(
          // Sharp corners, dark border, no box-shadow by default
          "border border-white/[0.07] text-white",
          bg,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

/* ── CardHeader ───────────────────────────────────────────────────────────── */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/* ── CardTitle ────────────────────────────────────────────────────────────── */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-xl uppercase tracking-tight text-white leading-none",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* ── CardDescription ──────────────────────────────────────────────────────── */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "font-sans text-sm leading-relaxed text-white/40",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* ── CardContent ──────────────────────────────────────────────────────────── */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

/* ── CardFooter ───────────────────────────────────────────────────────────── */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 border-t border-white/[0.05]",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
