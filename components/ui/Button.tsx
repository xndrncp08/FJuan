/**
 * components/ui/Button.tsx
 *
 * Square, uppercase buttons in the original FJUAN style. Three variants:
 *   filled  — the one primary action on a surface (red, glows on hover)
 *   tinted  — secondary actions (ghost with a hairline border)
 *   plain   — tertiary, red text
 * Press feedback is instant on pointer-down via `.pressable`.
 */

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "filled" | "tinted" | "plain";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  filled: "bg-accent text-paper hover:bg-[#D5170F] hover:shadow-[0_0_24px_rgb(var(--accent)/0.45)]",
  tinted: "border border-separator text-label-1 hover:border-paper/30 hover:bg-fill-1",
  plain: "text-tint hover:bg-fill-1",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] gap-1.5",
  md: "h-11 px-5 text-[0.875rem] gap-2",
  lg: "h-12 px-7 text-[0.9375rem] gap-2",
};

export function buttonClasses(variant: Variant = "tinted", size: Size = "md", className?: string) {
  return cn(
    "pressable inline-flex select-none items-center justify-center whitespace-nowrap font-bold uppercase tracking-[0.12em]",
    "disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

/** Round icon-only button. Always pass an aria-label. */
export const IconButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "pressable inline-flex h-11 w-11 shrink-0 items-center justify-center border border-separator text-label-2 hover:border-accent/60 hover:text-paper",
          className,
        )}
        {...props}
      />
    );
  },
);
