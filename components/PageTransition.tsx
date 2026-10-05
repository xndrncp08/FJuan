"use client";

import { usePagePathname } from "@/lib/hooks/usePagePathname";

// Remounts on route change so each page gets a short fade-up. Transform-only
// (no filter) so position: fixed descendants like the Nacho Bot FAB still work.
//
// Keyed on the page actually on screen, not the URL: opening a floating
// window changes the URL but must not remount the page underneath — it
// would lose its state (scroll, the selected car, an open tab).
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const page = usePagePathname();
  return (
    <main id="main" key={page} className="page-enter min-h-[60vh]">
      {children}
    </main>
  );
}
