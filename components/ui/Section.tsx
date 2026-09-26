/**
 * components/ui/Section.tsx
 *
 * Page scaffolding. Every page is: PageHeader, then Sections, so spacing and
 * the broadcast look stay consistent without per-page tuning.
 */

import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("container-page", className)} {...props} />;
}

export function Section({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("py-10 sm:py-14", className)} {...props}>
      <div className="container-page">{children}</div>
    </section>
  );
}

/** Splits "Driver Standings" into "Driver " + red "Standings", the FJUAN title treatment. */
export function AccentTitle({ children }: { children: React.ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  const words = children.trim().split(" ");
  if (words.length < 2) return <>{children}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <span className="text-accent">{last}</span>
    </>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8", className)}>
      <div className="min-w-0 max-w-prose">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-title-2 text-paper">
          <AccentTitle>{title}</AccentTitle>
        </h2>
        {description && <p className="mt-2 text-callout text-label-2">{description}</p>}
      </div>
      {action && <SeeAll href={action.href} label={action.label} />}
    </div>
  );
}

export function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="pressable group -mx-2 inline-flex h-10 items-center gap-2 px-2 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-tint hover:text-paper"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="pressable -ml-1 mb-6 inline-flex h-9 items-center gap-1.5 px-1 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-label-3 hover:text-paper"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

const SPEED_LINES = [
  { top: "22%", width: "38%", delay: "0s" },
  { top: "44%", width: "56%", delay: "1.4s" },
  { top: "63%", width: "28%", delay: "0.7s" },
  { top: "81%", width: "46%", delay: "2.1s" },
];

/**
 * The broadcast backdrop shared by every page header: dot grid, red glow,
 * a few slow speed lines, scanlines, a ghost watermark, and the red edge
 * lines. `tint` swaps the red for a team color on team/driver pages.
 */
export function HeaderBackdrop({ watermark, tint }: { watermark?: string; tint?: string }) {
  const glow = tint ? `${tint}38` : "rgb(var(--accent) / 0.2)";
  const edge = tint ?? "rgb(var(--accent))";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="tex-dots absolute inset-0" />
      <div className="absolute -right-[10%] -top-1/3 h-[140%] w-[70%]" style={{ background: `radial-gradient(ellipse at top right, ${glow}, transparent 65%)` }} />
      <div
        className="absolute right-0 top-0 h-full w-1/2"
        style={{ background: `linear-gradient(105deg, transparent 48%, ${tint ? `${tint}10` : "rgb(var(--accent) / 0.04)"} 48%, ${tint ? `${tint}1c` : "rgb(var(--accent) / 0.07)"} 56%, transparent 56%)` }}
      />
      {SPEED_LINES.map((l, i) => (
        <span key={i} className="speed-line" style={{ top: l.top, width: l.width, animationDelay: l.delay }} />
      ))}
      {watermark && (
        <span className="watermark absolute -bottom-[0.12em] right-[-0.04em] text-[clamp(7rem,20vw,17rem)]">{watermark}</span>
      )}
      <div className="tex-scan absolute inset-0 opacity-60" />
      <div className="absolute left-0 top-0 h-3/5 w-[3px]" style={{ background: `linear-gradient(180deg, ${edge}, transparent)` }} />
      <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${edge}, ${tint ? `${tint}55` : "rgb(var(--accent) / 0.35)"} 35%, transparent 70%)` }} />
    </div>
  );
}

/**
 * Top of every page. Uppercase title with the last word in red, a line of
 * context, optional controls. `back` renders a breadcrumb above the title.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  back,
  watermark,
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  watermark?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative mb-8 overflow-hidden border-b border-hairline sm:mb-10", className)}>
      <HeaderBackdrop watermark={watermark} />
      <div className="container-page relative pb-10 pt-10 sm:pb-12 sm:pt-16">
        {back && <BackLink {...back} />}
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="text-title-1 text-paper sm:text-display">
          <AccentTitle>{title}</AccentTitle>
        </h1>
        {description && <p className="mt-4 max-w-prose text-body text-label-2">{description}</p>}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </header>
  );
}
