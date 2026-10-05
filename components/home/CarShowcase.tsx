/**
 * components/home/CarShowcase.tsx
 *
 * "Chassis lab" on the landing page: the interactive 3D car with glass HUD
 * controls — livery by team, wireframe, spin, and airflow speed. The WebGL
 * scene is code-split and only mounts in the browser.
 */

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Gauge, Rotate3d, Scan, type LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/ui/Section";
import { Segmented } from "@/components/ui/Segmented";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Spinner } from "@/components/ui/States";
import { shortTeamName, teamColor } from "@/lib/theme/teams";
import { cn } from "@/lib/utils/cn";

const CanvasShell = dynamic(() => import("@/components/three/CanvasShell"), { ssr: false, loading: () => <SceneLoading /> });
const CarScene = dynamic(() => import("./CarScene"), { ssr: false });

const TEAMS = ["mclaren", "ferrari", "red_bull", "mercedes", "aston_martin", "alpine", "williams", "rb", "haas", "audi", "cadillac"];

const COMPOUNDS = [
  { value: "soft", label: "Soft", color: "#E8322E" },
  { value: "medium", label: "Medium", color: "#FFC53D" },
  { value: "hard", label: "Hard", color: "#F5E9E4" },
] as const;

const SPEEDS = { idle: 0, cruise: 0.45, full: 1.15 } as const;
type Speed = keyof typeof SPEEDS;

function SceneLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-3 text-footnote text-label-3">
      <Spinner />
      Loading chassis
    </div>
  );
}

function Toggle({ pressed, onClick, icon: Icon, children }: { pressed: boolean; onClick: () => void; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "pressable flex h-9 items-center gap-2 border px-3 text-[0.75rem] font-bold uppercase tracking-[0.14em]",
        pressed ? "neon border-accent bg-accent/20 text-paper" : "border-[var(--glass-edge)] text-label-2 hover:text-paper",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}

export default function CarShowcase() {
  const reduce = useReducedMotion();
  const [team, setTeam] = useState("mclaren");
  const [compound, setCompound] = useState<(typeof COMPOUNDS)[number]["value"]>("soft");
  const [wireframe, setWireframe] = useState(false);
  const [spin, setSpin] = useState(true);
  const [speed, setSpeed] = useState<Speed>("cruise");

  const livery = teamColor(team);
  const effectiveSpeed = reduce ? 0 : SPEEDS[speed];

  return (
    <section className="relative py-12 sm:py-16">
      <div className="container-page">
        <SectionHeader
          eyebrow="Chassis lab"
          title="Interactive Chassis"
          description="Drag to orbit, scroll to zoom. Switch liveries, strip it to wireframe, and turn the airflow up."
        />

        <div className="glass relative overflow-hidden" style={{ ["--glow" as string]: "var(--accent)" }}>
          <div className="h-[min(72vh,640px)] min-h-[420px]">
            <CanvasShell label={`3D ${shortTeamName(null, team)} Formula 1 car${wireframe ? " in wireframe" : ""}`} camera={{ position: [5.6, 2.3, 6.4], fov: 36 }}>
              <CarScene
                livery={livery}
                compound={COMPOUNDS.find((c) => c.value === compound)!.color}
                wireframe={wireframe}
                autoRotate={spin && !reduce}
                speed={effectiveSpeed}
                parallax={!reduce}
              />
            </CanvasShell>
          </div>

          {/* HUD: identity */}
          <div className="glass-strong pointer-events-none absolute left-3 top-3 flex items-center gap-3 px-3 py-2 sm:left-4 sm:top-4">
            <TeamLogo team={team} season={2026} color={livery} size="md" />
            <div>
              <div className="label-caps text-[0.6875rem] text-label-3">Livery</div>
              <div className="font-display text-[1rem] uppercase leading-none text-paper">{shortTeamName(null, team)}</div>
            </div>
          </div>

          {/* HUD: controls */}
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2 sm:right-4 sm:top-4">
            <Toggle pressed={wireframe} onClick={() => setWireframe((v) => !v)} icon={Scan}>
              Wireframe
            </Toggle>
            {!reduce && (
              <Toggle pressed={spin} onClick={() => setSpin((v) => !v)} icon={Rotate3d}>
                Spin
              </Toggle>
            )}
          </div>

          <div className="glass-strong absolute inset-x-0 bottom-0 border-x-0 border-b-0">
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="radiogroup" aria-label="Team livery">
                {TEAMS.map((id) => {
                  const active = id === team;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={shortTeamName(null, id)}
                      title={shortTeamName(null, id)}
                      onClick={() => setTeam(id)}
                      className={cn(
                        "pressable flex h-10 min-w-10 shrink-0 items-center justify-center border px-2",
                        active ? "border-transparent bg-fill-2" : "border-[var(--glass-edge)] hover:bg-fill-1",
                      )}
                      style={active ? { boxShadow: `0 0 0 1px ${teamColor(id)}, 0 0 18px -4px ${teamColor(id)}` } : undefined}
                    >
                      <TeamLogo team={id} season={2026} size="sm" />
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  size="sm"
                  aria-label="Tyre compound"
                  value={compound}
                  onChange={setCompound}
                  segments={COMPOUNDS.map((c) => ({
                    value: c.value,
                    label: (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden />
                        {c.label}
                      </span>
                    ),
                  }))}
                />
                {!reduce && (
                  <Segmented
                    size="sm"
                    aria-label="Airflow speed"
                    value={speed}
                    onChange={setSpeed}
                    segments={[
                      { value: "idle", label: "Idle" },
                      { value: "cruise", label: "Cruise" },
                      { value: "full", label: <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" aria-hidden />Full</span> },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
