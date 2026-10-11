"use client";

import { useEffect, type RefObject } from "react";

/** Keep keyboard focus inside an open overlay, then return to its trigger. */
export function useFocusScope(container: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = () => Array.from(container.current?.querySelectorAll<HTMLElement>(selector) ?? []).filter((element) => element.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => elements()[0]?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = elements();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !container.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !container.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [container, open]);
}
