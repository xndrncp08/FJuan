/**
 * components/ui/DriverPortrait.tsx
 *
 * Driver photo on a livery-tinted panel, with the car number as a badge
 * and a source credit. If the remote image fails to load it falls back to
 * the big car number, so the header never shows a broken image.
 */

"use client";

import { useState } from "react";
import type { DriverPhoto } from "@/lib/api/driverPhotos";
import { cn } from "@/lib/utils/cn";

export function DriverPortrait({
  photo,
  name,
  number,
  color,
  className,
}: {
  photo: DriverPhoto | null;
  name: string;
  number?: string | null;
  color: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!photo || failed) {
    return number ? (
      <span
        aria-label={`Car number ${number}`}
        className={cn("tabular hidden shrink-0 text-[6rem] font-bold leading-[0.8] tracking-[-0.06em] sm:block", className)}
        style={{ color, opacity: 0.9 }}
      >
        {number}
      </span>
    ) : null;
  }

  const headshot = photo.source === "Formula1.com";
  return (
    <figure className={cn("shrink-0", className)}>
      <div
        className="glass relative h-28 w-28 overflow-hidden sm:h-44 sm:w-44 lg:h-52 lg:w-52"
        style={{ background: `radial-gradient(120% 90% at 50% 100%, ${color}66, ${color}14 60%, transparent), rgb(var(--surface-1) / 0.6)` }}
      >
        {/* Remote, already-sized image from an external CDN. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={name}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn("h-full w-full", headshot ? "object-contain object-bottom" : "object-cover object-top")}
        />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: color }} />
        {number && (
          <span
            aria-label={`Car number ${number}`}
            className="glass-strong absolute right-1.5 top-1.5 px-1.5 py-0.5 font-display text-[0.875rem] leading-none text-paper sm:text-[1.125rem]"
          >
            {number}
          </span>
        )}
      </div>
      <figcaption className="mt-1.5 text-right text-[0.6875rem] text-label-4">
        Photo:{" "}
        <a href={photo.href} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-label-2 hover:underline">
          {photo.source}
        </a>
      </figcaption>
    </figure>
  );
}
