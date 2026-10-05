/**
 * lib/hooks/usePagePathname.ts
 *
 * The pathname of the page actually on screen. Soft navigations to window
 * URLs (intercepting routes in app/@modal) change the URL but only open a
 * floating window over the current page, so for those the previous page's
 * pathname is kept. A direct load of a window URL renders it as a page, so
 * the initial value is always the real pathname.
 */

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

/** Keep in sync with the intercepting routes in app/@modal. */
export const WINDOW_ROUTES = [/^\/races\/[^/]+\/[^/]+\/?$/, /^\/tracks\/[^/]+\/?$/, /^\/teams\/[^/]+\/car\/?$/];

export function usePagePathname() {
  const pathname = usePathname();
  const [page, setPage] = useState(pathname);
  const opensWindow = WINDOW_ROUTES.some((r) => r.test(pathname));
  if (!opensWindow && page !== pathname) setPage(pathname);
  return page;
}
