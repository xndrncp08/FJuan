/**
 * components/three/CanvasShell.tsx
 *
 * The one way a WebGL scene mounts. It renders the fallback when WebGL is
 * unavailable, stops the render loop while the canvas is off-screen (no
 * GPU work for a hero you've scrolled past), and caps the pixel ratio.
 *
 * Load it through next/dynamic with ssr:false: three.js touches `window`.
 */

"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function CanvasShell({
  children,
  className,
  label,
  decorative = false,
  fallback,
  camera,
  eventSource,
  onPointerMissed,
  onReady,
  onUnsupported,
}: {
  children: React.ReactNode;
  className?: string;
  /** Accessible description of what the scene shows. */
  label: string;
  /** The scene duplicates content that's already in the DOM: hide it from assistive tech. */
  decorative?: boolean;
  fallback?: React.ReactNode;
  camera?: CanvasProps["camera"];
  /** Element whose pointer events drive the scene, when DOM content sits on top of the canvas. */
  eventSource?: React.RefObject<HTMLElement | null>;
  onPointerMissed?: CanvasProps["onPointerMissed"];
  /** Called once the WebGL context exists. */
  onReady?: () => void;
  /** Called when the browser has no WebGL. */
  onUnsupported?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [supported] = useState(hasWebGL);

  useEffect(() => {
    if (!supported) onUnsupported?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report once on mount
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // R3F measures its container once on mount; when the canvas mounts while
  // paused off-screen (or inside a page transition) that measurement can be
  // stale and the canvas stays at 300×150. Nudge a re-measure whenever it
  // comes back into view.
  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  return (
    <div
      ref={ref}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn("relative h-full w-full", className)}
    >
      {supported ? (
        <Canvas
          frameloop={visible ? "always" : "never"}
          dpr={[1, 1.75]}
          camera={camera}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          eventSource={eventSource?.current ?? undefined}
          eventPrefix={eventSource ? "client" : undefined}
          onPointerMissed={onPointerMissed}
          onCreated={() => onReady?.()}
        >
          {children}
        </Canvas>
      ) : (
        fallback ?? (
          <div className="flex h-full items-center justify-center p-6 text-center text-footnote text-label-3">
            3D view needs WebGL, which this browser has turned off.
          </div>
        )
      )}
    </div>
  );
}
