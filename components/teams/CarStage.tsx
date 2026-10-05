/**
 * components/teams/CarStage.tsx
 *
 * Showroom for an official car render (Formula1.com side profiles): a
 * team-lit backdrop, a perspective floor, a contact shadow and a floor
 * reflection.
 *
 *   Changing car   the old car drives out and the new one drives in from
 *                  the side it's heading to (with the matching left/right
 *                  render, so the nose always leads), streaks and a rolling
 *                  floor selling the speed.
 *   Flipping side  the car turns on the spot (scaleX through zero).
 *   Pointer        the whole car tilts toward the cursor (spring).
 *   Swipe          `onSwipe(±1)` for a horizontal drag or flick.
 *
 * Reduced motion: cross-fades only, no tilt.
 */

"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface StageCar {
  id: string;
  label: string;
  color: string;
  left: string | null;
  right: string | null;
}

export function CarStage({
  car,
  side,
  direction,
  onSwipe,
  className,
}: {
  car: StageCar;
  side: "left" | "right";
  /** +1 = next car (drives in from the right), −1 = previous, 0 = same car (flip/initial). */
  direction: -1 | 0 | 1;
  onSwipe?: (dir: -1 | 1) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-1, 1], [-7, 7]), { stiffness: 140, damping: 22 });
  const rotateX = useSpring(useTransform(py, [-1, 1], [4, -4]), { stiffness: 140, damping: 22 });
  const src = (side === "left" ? car.left : car.right) ?? car.right ?? car.left;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };
  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (!onSwipe) return;
    // Project the flick forward a little so a quick swipe counts.
    const travel = info.offset.x + info.velocity.x * 0.15;
    if (Math.abs(travel) > 80 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) onSwipe(travel < 0 ? 1 : -1);
  };

  const variants = {
    enter: (dir: number) =>
      reduce ? { opacity: 0 } : dir === 0 ? { opacity: 1, scaleX: 0, x: "0%", skewX: 0 } : { opacity: 0, x: `${dir * 70}%`, skewX: -dir * 7, scaleX: 1 },
    center: { opacity: 1, x: "0%", skewX: 0, scaleX: 1 },
    exit: (dir: number) =>
      reduce ? { opacity: 0 } : dir === 0 ? { opacity: 1, scaleX: 0 } : { opacity: 0, x: `${-dir * 70}%`, skewX: dir * 7 },
  };

  return (
    <motion.div
      className={cn("relative select-none overflow-hidden [perspective:1400px]", onSwipe && "touch-pan-y", className)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPanEnd={onPanEnd}
    >
      {/* Team-lit backdrop */}
      <div aria-hidden className="absolute inset-0 transition-[background] duration-700" style={{ background: `radial-gradient(60% 70% at 50% 60%, ${car.color}38, transparent 70%), radial-gradient(40% 40% at 50% 85%, ${car.color}30, transparent 70%)` }} />
      {/* Perspective floor; rolls while a car drives in */}
      <div aria-hidden className="absolute inset-x-[-25%] bottom-[-35%] h-[75%] [transform:rotateX(76deg)] [transform-origin:50%_0%]">
        <div
          key={`floor-${car.id}`}
          className={cn("h-full w-full", direction !== 0 && !reduce && "car-floor-roll")}
          style={{
            backgroundImage: `linear-gradient(90deg, rgb(var(--paper) / 0.07) 1px, transparent 1px), linear-gradient(rgb(var(--paper) / 0.07) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(60% 70% at 50% 20%, black, transparent 75%)",
            ["--roll" as string]: direction >= 0 ? "-256px" : "256px",
          }}
        />
      </div>
      {/* Speed streaks while changing car */}
      {direction !== 0 && !reduce && (
        <div key={`streaks-${car.id}`} aria-hidden className="car-streaks pointer-events-none absolute inset-0" style={{ ["--dir" as string]: direction }}>
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="absolute h-px"
              style={{ top: `${28 + i * 6.5}%`, left: `${(i * 37) % 70}%`, width: `${18 + ((i * 13) % 22)}%`, background: `linear-gradient(90deg, transparent, ${car.color}, transparent)` }}
            />
          ))}
        </div>
      )}

      {/* The car */}
      <motion.div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]" style={reduce ? undefined : { rotateX, rotateY }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={`${car.id}-${side}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduce
                ? { duration: 0.2 }
                : direction === 0
                  ? { duration: 0.22, ease: [0.77, 0, 0.175, 1] }
                  : { type: "spring", duration: 0.7, bounce: 0.12 }
            }
            className="relative w-[88%] max-w-[1100px]"
          >
            {src ? (
              <>
                {/* Contact shadow */}
                <div aria-hidden className="absolute inset-x-[6%] bottom-[2%] h-[14%] rounded-[50%] bg-black/70 blur-xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={car.label} draggable={false} className="relative block h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]" />
                {/* Floor reflection */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="pointer-events-none absolute left-0 top-full block h-auto w-full -scale-y-100 opacity-[0.16] blur-[1px]"
                  style={{ maskImage: "linear-gradient(to top, black, transparent 45%)" }}
                />
              </>
            ) : (
              <div className="flex aspect-[4.4/1] items-center justify-center font-display text-title-2 uppercase text-label-3">{car.label}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <style>{`
        .car-floor-roll { animation: carFloorRoll 0.8s cubic-bezier(0.23, 1, 0.32, 1) both; }
        @keyframes carFloorRoll { from { background-position: var(--roll) 0; } to { background-position: 0 0; } }
        .car-streaks span { opacity: 0; animation: carStreak 0.75s cubic-bezier(0.23, 1, 0.32, 1) both; }
        .car-streaks span:nth-child(odd) { animation-delay: 40ms; }
        @keyframes carStreak {
          0% { opacity: 0; transform: translateX(calc(var(--dir) * 60%)); }
          25% { opacity: 0.9; }
          100% { opacity: 0; transform: translateX(calc(var(--dir) * -120%)); }
        }
      `}</style>
    </motion.div>
  );
}
