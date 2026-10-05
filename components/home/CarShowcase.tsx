/**
 * components/home/CarShowcase.tsx
 *
 * "The 2026 grid" on the landing page: every team's real car — the
 * official Formula1.com renders — on a showroom stage. Drive between cars
 * by swiping, with the arrow keys or buttons, or by picking a team; the
 * new car drives in nose-first from the side it's heading to. Each car
 * shows its chassis and power unit (Wikipedia's entry list) and opens its
 * full spec in a floating window.
 */

"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import { SectionHeader } from "@/components/ui/Section";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CarStage, type StageCar } from "@/components/teams/CarStage";
import { f1CarImageUrl } from "@/lib/api/teamLogos";
import { shortTeamName, teamColor } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

export interface ShowcaseCar {
  constructorId: string;
  chassis: string | null;
  entrant: string | null;
  powerUnit: string | null;
}

/** Shown if the entry list can't be loaded — the renders still work. */
const FALLBACK_GRID = ["mclaren", "mercedes", "red_bull", "ferrari", "williams", "rb", "aston_martin", "haas", "audi", "alpine", "cadillac"];

export default function CarShowcase({ cars, season }: { cars: ShowcaseCar[]; season: number }) {
  const reduce = useReducedMotion();
  const grid: ShowcaseCar[] = cars.length ? cars : FALLBACK_GRID.map((id) => ({ constructorId: id, chassis: null, entrant: null, powerUnit: null }));
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  // Nose leads: heading left (next) shows the left-side render.
  const [side, setSide] = useState<"left" | "right">("right");

  const go = useCallback(
    (to: number, dir: -1 | 1) => {
      const n = grid.length;
      setDirection(dir);
      setSide(dir === 1 ? "left" : "right");
      setIndex(((to % n) + n) % n);
    },
    [grid.length],
  );
  const next = () => go(index + 1, 1);
  const prev = () => go(index - 1, -1);

  const current = grid[index];
  const id = current.constructorId;
  const name = shortTeamName(null, id);
  const color = teamColor(id);
  const stageCar: StageCar = {
    id,
    label: `${name} ${current.chassis ?? ""}`.trim(),
    color,
    left: f1CarImageUrl(id, season, "left"),
    right: f1CarImageUrl(id, season, "right"),
  };

  return (
    <section className="relative py-12 sm:py-16" aria-roledescription="carousel" aria-label={`${season} cars`}>
      <div className="container-page">
        <SectionHeader
          eyebrow="Chassis lab"
          title={`The ${season} Grid`}
          description="Every car on the grid, as the teams revealed them. Swipe or use the arrows to drive through them."
        />

        <div
          className="glass relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-tint"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              next();
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              prev();
            }
          }}
        >
          <CarStage car={stageCar} side={side} direction={direction} onSwipe={(d) => (d === 1 ? next() : prev())} className="aspect-[4/5] min-h-[380px] sm:aspect-[16/8] sm:min-h-[360px] lg:aspect-[16/7]" />

          {/* Identity, top-left */}
          <div className="pointer-events-none absolute left-3 right-3 top-3 sm:left-5 sm:right-auto sm:top-5" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="glass-strong inline-flex max-w-full items-center gap-3 px-3 py-2.5 sm:px-4"
              >
                <TeamLogo team={id} season={season} color={color} size="lg" />
                <div className="min-w-0">
                  <div className="truncate font-mono text-[0.75rem] uppercase tracking-[0.14em] text-label-3">{current.entrant ?? name}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[1.5rem] uppercase leading-none text-paper sm:text-[1.875rem]">{current.chassis ?? name}</span>
                    {current.chassis && <span className="truncate text-subhead text-label-2">{name}</span>}
                  </div>
                  {current.powerUnit && (
                    <div className="mt-1 flex items-center gap-1.5 text-footnote text-label-3">
                      <Cpu className="h-3.5 w-3.5" aria-hidden />
                      {current.powerUnit}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev / next */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous car"
            className="pressable glass-strong absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-label-2 hover:text-paper sm:left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next car"
            className="pressable glass-strong absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-label-2 hover:text-paper sm:right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Team picker + explore */}
          <div className="glass-strong absolute inset-x-0 bottom-0 border-x-0 border-b-0">
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Team">
                {grid.map((c, i) => {
                  const active = i === index;
                  const tc = teamColor(c.constructorId);
                  return (
                    <button
                      key={c.constructorId}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`${shortTeamName(null, c.constructorId)}${c.chassis ? ` ${c.chassis}` : ""}`}
                      title={`${shortTeamName(null, c.constructorId)}${c.chassis ? ` · ${c.chassis}` : ""}`}
                      onClick={() => i !== index && go(i, i > index ? 1 : -1)}
                      className={cn("pressable flex h-10 min-w-10 shrink-0 items-center justify-center border px-2", active ? "border-transparent bg-fill-2" : "border-[var(--glass-edge)] hover:bg-fill-1")}
                      style={active ? { boxShadow: `0 0 0 1px ${tc}, 0 0 18px -4px ${tc}` } : undefined}
                    >
                      <TeamLogo team={c.constructorId} season={season} size="sm" />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[0.75rem] tabular-nums text-label-3">
                  {String(index + 1).padStart(2, "0")} / {String(grid.length).padStart(2, "0")}
                </span>
                <Link
                  href={`/teams/${id}/car`}
                  scroll={false}
                  className="pressable flex h-10 items-center gap-2 bg-accent px-4 text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-paper hover:bg-[#D5170F]"
                >
                  Explore the car
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-caption text-label-3">Car renders: Formula1.com · Entry list: Wikipedia</p>
      </div>
    </section>
  );
}
