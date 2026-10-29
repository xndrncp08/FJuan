"use client";

import { useEffect, useState } from "react";

/** Hydrate with the server's placeholder, then read the clock on the first frame. */
export function useNow(intervalMs = 1000, running = true) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    const frame = requestAnimationFrame(tick);
    const interval = setInterval(tick, intervalMs);
    return () => { cancelAnimationFrame(frame); clearInterval(interval); };
  }, [intervalMs, running]);
  return now;
}
