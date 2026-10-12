"use client";

/**
 * components/telemetry/CornerTable.tsx
 *
 * Every detected corner on the lap: direction, gear, braking point, entry /
 * apex / exit speed, and — against a reference lap — the apex-speed and
 * time difference from the braking point to the exit. Selecting a row jumps
 * the playhead to just before that braking zone.
 */

import { timeAtDistance, valueAtDistance } from "@/lib/telemetry/analysis";
import { cn } from "@/lib/utils/cn";
import { usePlayhead, type Playhead } from "./playhead";
import { SLOT_A, SLOT_B, cursorAt, fmtDelta, lapLength, type LapView } from "./model";

export function CornerTable({ a, b, playhead, onJump }: { a: LapView; b?: LapView; playhead: Playhead; onJump: () => void }) {
  const t = usePlayhead(playhead);
  const { index } = cursorAt(a, t);
  const la = lapLength(a);
  const lb = b ? lapLength(b) : 1;
  const current = a.corners.find((c) => c.brakeIndex <= index && index <= c.apexIndex + 6)?.number;

  if (!a.corners.length) return <p className="text-footnote text-label-3">No distinct corners were detected on this lap.</p>;

  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Corner analysis">
      <table className="w-full min-w-[640px] text-left font-mono text-[0.75rem] tabular-nums">
        <caption className="sr-only">Corner-by-corner speeds and braking points{b ? `, ${a.code} against ${b.code}` : ""}</caption>
        <thead>
          <tr className="border-b border-hairline text-[0.5625rem] uppercase tracking-[0.14em] text-label-3">
            <th scope="col" className="py-2 pr-2 font-normal">Corner</th>
            <th scope="col" className="py-2 pr-2 font-normal">Gear</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Brake @</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Entry</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Apex</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Exit</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Shed</th>
            {b && <th scope="col" className="py-2 pr-2 text-right font-normal">Apex Δ</th>}
            {b && <th scope="col" className="py-2 text-right font-normal">Time Δ</th>}
          </tr>
        </thead>
        <tbody>
          {a.corners.map((c) => {
            const exitD = Math.min(la, c.apexDistance + 120);
            const f0 = c.brakeDistance / la;
            const f1 = exitD / la;
            const apexB = b ? valueAtDistance(b.samples, c.apexFrac * lb, (s) => s.speed) : 0;
            const dt = b ? timeAtDistance(a.samples, exitD) - timeAtDistance(a.samples, c.brakeDistance) - (timeAtDistance(b.samples, f1 * lb) - timeAtDistance(b.samples, f0 * lb)) : 0;
            return (
              <tr
                key={c.number}
                tabIndex={0}
                aria-current={current === c.number || undefined}
                onClick={() => {
                  onJump();
                  playhead.set(Math.max(0, timeAtDistance(a.samples, c.brakeDistance - 60)));
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  onJump();
                  playhead.set(Math.max(0, timeAtDistance(a.samples, c.brakeDistance - 60)));
                }}
                className={cn("cursor-pointer border-b border-hairline last:border-0 hover:bg-fill-1", current === c.number && "bg-accent/10")}
              >
                <th scope="row" className="py-2 pr-2 font-bold text-paper">
                  <span className={cn("mr-1.5 inline-block w-0.5 align-middle", current === c.number ? "h-3 bg-accent" : "h-3 bg-transparent")} />
                  T{c.number} <span className="font-normal text-label-3">{c.direction === "L" ? "◄ L" : "R ►"}</span>
                </th>
                <td className="py-2 pr-2 text-label-2">{c.gear}</td>
                <td className="py-2 pr-2 text-right text-label-2">{Math.round(c.brakeDistance)} m</td>
                <td className="py-2 pr-2 text-right text-label-2">{Math.round(c.entrySpeed)}</td>
                <td className="py-2 pr-2 text-right font-bold text-paper">{Math.round(c.apexSpeed)}</td>
                <td className="py-2 pr-2 text-right text-label-2">{Math.round(c.exitSpeed)}</td>
                <td className="py-2 pr-2 text-right text-label-3">−{Math.round(c.entrySpeed - c.apexSpeed)}</td>
                {b && (
                  <td className="py-2 pr-2 text-right" style={{ color: c.apexSpeed >= apexB ? SLOT_A : SLOT_B }}>
                    {c.apexSpeed - apexB >= 0 ? "+" : "−"}
                    {Math.abs(Math.round(c.apexSpeed - apexB))}
                  </td>
                )}
                {b && <td className="py-2 text-right font-bold" style={{ color: dt <= 0 ? SLOT_A : SLOT_B }}>{fmtDelta(dt)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-caption text-label-3">
        Speeds in km/h. Shed is speed lost from the fastest point before the corner to the apex.{b ? ` Δ columns are ${a.code} against ${b.code} through the same stretch of track: braking point to 120 m past the apex.` : ""} Select a corner to replay it.
      </p>
    </div>
  );
}
