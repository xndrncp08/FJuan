/**
 * components/ui/DetailFrame.tsx
 *
 * The same detail view rendered two ways: as a full page (cinematic header
 * with back link and watermark, content in a Section) or inside a
 * FloatingWindow (compact heading, no back link — the window has its own
 * close control).
 */

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HeaderBackdrop, Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils/cn";

export type DetailVariant = "page" | "window";

export function DetailFrame({
  variant,
  back,
  watermark,
  tint,
  eyebrow,
  title,
  meta,
  description,
  aside,
  children,
}: {
  variant: DetailVariant;
  back?: { href: string; label: string };
  watermark?: string;
  tint?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-hand header slot (logo, portrait…). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const heading = (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className={cn("text-paper", variant === "page" ? "text-title-1 sm:text-display" : "text-title-1")}>{title}</h1>
        {meta && <p className="mt-3 text-callout text-label-2">{meta}</p>}
        {description && <p className="mt-4 max-w-prose text-body text-label-2">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );

  if (variant === "window") {
    return (
      <div className="relative px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48" style={{ background: `radial-gradient(70% 100% at 20% 0%, ${tint ?? "rgb(var(--accent))"}22, transparent 70%)` }} />
        <div className="relative">{heading}</div>
        <div className="relative mt-7">{children}</div>
      </div>
    );
  }

  return (
    <>
      <header className="relative mb-8 overflow-hidden border-b border-hairline sm:mb-10">
        <HeaderBackdrop watermark={watermark} tint={tint} />
        <div className="container-page relative pb-8 pt-8 sm:pb-10 sm:pt-12">
          {back && (
            <Link
              href={back.href}
              className="pressable -ml-1 mb-6 inline-flex h-9 items-center gap-1.5 px-1 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-label-3 hover:text-paper"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {back.label}
            </Link>
          )}
          {heading}
        </div>
      </header>
      <Section className="pt-0 sm:pt-0">{children}</Section>
    </>
  );
}
