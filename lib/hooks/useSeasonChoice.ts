"use client";

import { useSyncExternalStore } from "react";

const EVENT = "fjuan-season-change";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener("popstate", listener); window.removeEventListener(EVENT, listener); };
}
export function useSeasonChoice() {
  const current = String(new Date().getFullYear());
  const season = useSyncExternalStore(subscribe, () => {
    const value = new URLSearchParams(window.location.search).get("season");
    return value && /^\d{4}$/.test(value) && Number(value) >= 1950 && Number(value) <= Number(current) ? value : current;
  }, () => current);
  const setSeason = (value: string) => {
    const url = new URL(window.location.href);
    if (value === current) url.searchParams.delete("season"); else url.searchParams.set("season", value);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    window.dispatchEvent(new Event(EVENT));
  };
  return [season, setSeason] as const;
}
