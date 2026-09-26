"use client";

import { usePathname } from "next/navigation";

// Remounts on route change so each page gets a short fade-up. Transform-only
// (no filter) so position: fixed descendants like the Nacho Bot FAB still work.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main id="main" key={pathname} className="page-enter min-h-[60vh]">
      {children}
    </main>
  );
}
