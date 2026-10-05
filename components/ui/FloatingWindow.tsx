/**
 * components/ui/FloatingWindow.tsx
 *
 * Detail pages opened from a list (race results, circuits, cars) appear in
 * a floating window over the page you were on, via Next.js intercepting
 * routes in app/@modal. The URL still changes, so the window can be shared
 * or refreshed — a direct load renders the full page instead.
 *
 * Desktop: a glass window, draggable by its title bar (rubber-bands at the
 *          viewport edge), double-click the bar to maximise.
 * Phone:   a bottom sheet; drag it down (or flick) to dismiss.
 *
 * Esc, the close button or the scrim close it: the window animates out,
 * then the route goes back. Focus moves into the window and is trapped
 * there; the page behind doesn't scroll.
 */

"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useReducedMotion } from "framer-motion";
import { Maximize2, Minimize2, SquareArrowOutUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SPRING = { type: "spring", bounce: 0, duration: 0.32 } as const;

function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 639px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function FloatingWindow({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const phone = useIsPhone();
  const titleId = useId();
  const [open, setOpen] = useState(true);
  const [maximized, setMaximized] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const bounds = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const drag = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const left = useRef(false);
  /** Leave the window's route exactly once (after the exit animation, or a timer if frames are paused). */
  const leave = () => {
    if (left.current) return;
    left.current = true;
    router.back();
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (open) return;
    const id = setTimeout(leave, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leave is stable in effect (guarded by ref)
  }, [open]);

  // Focus in, trap Tab, Esc to close, lock page scroll; restore on unmount.
  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      restoreFocus.current?.focus?.({ preventScroll: true });
    };
  }, []);

  // Moving between windows (prev/next round, race → circuit) keeps the
  // window but brings the new content to the top.
  useEffect(() => {
    panel.current?.querySelector("[data-window-body]")?.scrollTo({ top: 0 });
  }, [pathname]);

  const toggleMax = () => {
    setMaximized((m) => !m);
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  };

  // Individual x/y/scale (not a transform string): drag writes the same
  // x/y motion values, so enter/exit and dragging compose instead of fight.
  const enter = reduce ? { opacity: 0 } : phone ? { opacity: 1, y: "100%" } : { opacity: 0, scale: 0.96, y: 12 };
  const shown = reduce ? { opacity: 1 } : phone ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 };
  const exitTo = reduce ? { opacity: 0 } : phone ? { opacity: 1, y: "100%" } : { opacity: 0, scale: 0.96 };

  return (
    <AnimatePresence onExitComplete={leave}>
      {open && (
        <motion.div
          key="window-layer"
          className="fixed inset-0 z-[250]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1, transition: { duration: 0.24 } }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <div ref={bounds} className={cn("pointer-events-none absolute", phone ? "inset-0" : "inset-3 sm:inset-6")} />
          <div className={cn("pointer-events-none absolute inset-0 flex", phone ? "items-end" : "items-center justify-center p-3 sm:p-6")}>
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className={cn(
                "glass-strong pointer-events-auto relative flex flex-col overflow-hidden shadow-popover outline-none",
                phone
                  ? "h-[92dvh] w-full rounded-t-2xl border-b-0"
                  : maximized
                    ? "h-full w-full"
                    : "h-[min(88dvh,920px)] w-[min(1080px,100%)]",
              )}
              style={{ x, y, background: "rgb(var(--canvas) / 0.9)" }}
              initial={enter}
              animate={shown}
              exit={exitTo}
              transition={reduce ? { duration: 0.15 } : SPRING}
              drag={phone ? "y" : !maximized}
              dragListener={false}
              dragControls={drag}
              dragMomentum={false}
              dragConstraints={phone ? { top: 0, bottom: 0 } : bounds}
              dragElastic={phone ? { top: 0, bottom: 0.7 } : 0.12}
              onDragEnd={(_, info) => {
                if (phone && (info.offset.y > 140 || info.velocity.y > 700)) close();
              }}
            >
              {/* Title bar — the drag handle */}
              <header
                onPointerDown={(e) => drag.start(e)}
                onDoubleClick={() => !phone && toggleMax()}
                className={cn(
                  "flex shrink-0 select-none items-center gap-3 border-b border-[var(--glass-edge)] px-4 py-2.5 sm:px-5",
                  phone ? "touch-none" : maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                )}
              >
                {phone && <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-paper/25" />}
                <span aria-hidden className="h-4 w-[3px] shrink-0 bg-accent" />
                <div className="min-w-0 flex-1">
                  {eyebrow && <p className="truncate font-mono text-[0.75rem] uppercase tracking-[0.18em] text-label-3">{eyebrow}</p>}
                  <h2 id={titleId} className="truncate font-display text-[1rem] uppercase leading-tight text-paper">
                    {title}
                  </h2>
                </div>
                <a
                  href={pathname}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pressable hidden h-9 items-center gap-1.5 px-2.5 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-label-3 hover:bg-fill-1 hover:text-paper sm:flex"
                >
                  <SquareArrowOutUpRight className="h-4 w-4" aria-hidden />
                  Full page
                </a>
                {!phone && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={toggleMax}
                    aria-label={maximized ? "Restore window size" : "Maximise window"}
                    className="pressable flex h-9 w-9 items-center justify-center text-label-3 hover:bg-fill-1 hover:text-paper"
                  >
                    {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={close}
                  aria-label="Close window"
                  className="pressable flex h-9 w-9 items-center justify-center text-label-2 hover:bg-accent hover:text-paper"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div data-window-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
