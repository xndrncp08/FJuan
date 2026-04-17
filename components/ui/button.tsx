/**
 * Button — shadcn/ui-compatible button component, styled to the FJUAN design system.
 *
 * Variants:
 *   default   → solid red (maps to .btn-primary)
 *   ghost     → transparent with border (maps to .btn-ghost)
 *   outline   → border only, no fill
 *   secondary → muted surface
 *   link      → underline text
 *   destructive → red warning variant
 *
 * Sizes: default | sm | lg | icon
 *
 * Usage:
 *   <Button>Driver Standings</Button>
 *   <Button variant="ghost" size="sm">Back</Button>
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  // ── Base styles shared across all variants ──
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "font-condensed font-bold tracking-widest uppercase",
    "text-sm transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060606]",
    "disabled:pointer-events-none disabled:opacity-45",
    "rounded-none", // Sharp corners — consistent with --radius: 0rem
  ].join(" "),
  {
    variants: {
      variant: {
        /* Solid red primary action */
        default:
          "bg-[#E10600] text-white border border-transparent hover:bg-[#c50500] hover:shadow-[0_0_24px_rgba(225,6,0,0.35)]",
        /* Transparent with subtle border — secondary actions */
        ghost:
          "bg-transparent text-white/40 border border-white/10 hover:text-white hover:border-white/22 hover:bg-white/[0.04]",
        /* Border-only outline */
        outline:
          "border border-white/10 bg-transparent text-white/60 hover:bg-white/[0.04] hover:border-white/20",
        /* Muted dark surface */
        secondary:
          "bg-[#161616] text-white/70 border border-white/07 hover:bg-[#1e1e1e]",
        /* Red warning */
        destructive:
          "bg-red-900/80 text-white border border-red-800 hover:bg-red-900",
        /* Text-only link */
        link:
          "text-[#E10600] underline-offset-4 hover:underline bg-transparent border-none",
      },
      size: {
        default: "h-10 px-6 py-2 text-[0.875rem]",
        sm:      "h-8  px-4 py-1.5 text-[0.75rem]",
        lg:      "h-12 px-8 py-3 text-[0.95rem]",
        icon:    "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Button component — wraps a <button> with the FJUAN variant styles.
 * Forwards ref for use in radix-ui compound components.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
