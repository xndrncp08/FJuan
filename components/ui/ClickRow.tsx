"use client";

/**
 * ClickRow
 *
 * Reusable clickable row for standings tables.
 * Accepts an optional mobileStyle prop that gets merged in when the
 * viewport is below 640px — used to swap the grid column layout on mobile.
 */

import { useRouter } from "next/navigation";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

interface Props {
  href: string;
  style?: React.CSSProperties;
  mobileStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export default function ClickRow({ href, style, mobileStyle, children }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const mergedStyle = isMobile && mobileStyle
    ? { ...style, ...mobileStyle }
    : style;

  const idleBg = (mergedStyle?.background as string) ?? "transparent";

  return (
    <div
      style={{ cursor: "pointer", transition: "background 0.15s ease", ...mergedStyle }}
      onClick={() => router.push(href)}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = idleBg}
    >
      {children}
    </div>
  );
}