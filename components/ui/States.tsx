/**
 * components/ui/States.tsx
 *
 * Empty, error, and loading states. Every async surface should render one
 * of these rather than a blank area.
 */

import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-separator text-tint [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
      )}
      <h3 className="text-title-3 text-paper">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-subhead text-label-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cn("skeleton", className)} style={style} />;
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-block h-5 w-5", className)}>
      <span className="block h-full w-full animate-spin rounded-full border-2 border-fill-3 border-t-accent" />
    </span>
  );
}
