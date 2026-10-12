// Self-check for lib/telemetry/analysis.ts on synthetic laps with known answers.
// Run: node lib/telemetry/analysis.check.mjs   (Node 22.18+ strips the TS types)
import assert from "node:assert/strict";
import { deltaAt, deltaTrace, deriveChannels, findCorners, miniSectors, timeAtDistance } from "./analysis.ts";

// A 1 km circle (radius R) driven at constant speed, then a lap with one slow corner.
const R = 1000 / (2 * Math.PI);
function circleLap(speedKmh, n = 400, dir = 1) {
  const v = speedKmh / 3.6;
  return Array.from({ length: n + 1 }, (_, i) => {
    const d = (i / n) * 1000;
    const a = (dir * d) / R;
    return { t: d / v, distance: d, x: R * Math.cos(a), y: R * Math.sin(a), z: 0, speed: speedKmh, throttle: 100, brake: 0, gear: 7, rpm: 11000, drs: false };
  });
}

// Lateral g on a circle: v²/R/g, positive for an anticlockwise (left-hand) circle.
const lap = circleLap(180);
const { gLat, gLong } = deriveChannels(lap);
const expected = (180 / 3.6) ** 2 / R / 9.81;
const mid = gLat[200];
assert.ok(Math.abs(mid - expected) < 0.05 * expected, `gLat ${mid} ≈ ${expected}`);
assert.ok(Math.abs(gLong[200]) < 0.01, "constant speed → no longitudinal g");
assert.ok(deriveChannels(circleLap(180, 400, -1)).gLat[200] < 0, "clockwise circle → negative (right) lateral g");

// Time lookup and gap: a 200 km/h lap vs a 180 km/h lap over 1 km.
const fast = circleLap(200);
assert.ok(Math.abs(timeAtDistance(fast, 500) - 500 / (200 / 3.6)) < 1e-9);
const gap = deltaAt(lap, fast, 1);
assert.ok(Math.abs(gap - (1000 / 50 - 1000 / (200 / 3.6))) < 1e-6, "slower lap ends behind by the time difference");
assert.ok(deltaTrace(lap, fast, 10).every((p) => p.delta >= 0), "slower lap is behind everywhere");
assert.ok(miniSectors(lap, fast, 8).every((m) => m.winner === 1), "faster lap wins every mini-sector");

// One corner: 250 → 90 → 250 km/h around the 500 m mark, braking from 400 m.
const cornerLap = lap.map((s) => {
  const off = Math.abs(s.distance - 500);
  const speed = off < 100 ? 90 + (off / 100) * 160 : 250;
  return { ...s, speed, brake: s.distance > 400 && s.distance < 500 ? 100 : 0, throttle: s.distance > 400 && s.distance < 500 ? 0 : 100, gear: speed < 120 ? 3 : 8 };
});
const corners = findCorners(cornerLap);
assert.equal(corners.length, 1, "exactly one corner");
assert.ok(Math.abs(corners[0].apexDistance - 500) < 5, "apex at 500 m");
assert.ok(Math.round(corners[0].apexSpeed) <= 95, "apex speed ≈ 90");
assert.ok(Math.abs(corners[0].brakeDistance - 400) < 10, "braking point ≈ 400 m");
assert.equal(corners[0].gear, 3);

// ─── pace.ts ─────────────────────────────────────────────────────────────────
const { cleanLaps, fitLine, fuelCorrect, idealLap, stintPace, FUEL_S_PER_LAP } = await import("./pace.ts");

// 20 laps: tyres lose 0.08 s/lap, fuel gains FUEL_S_PER_LAP per lap; lap 10 is a safety-car lap, lap 11 a pit-out.
const raceLaps = Array.from({ length: 20 }, (_, i) => {
  const lap = i + 1;
  const base = 90 + 0.08 * (lap - 1) - FUEL_S_PER_LAP * (lap - 1);
  return { lap, time: lap === 10 ? 120 : base, pitOut: lap === 11, sectors: [30 + (lap === 4 ? -0.2 : 0), 30 + (lap === 7 ? -0.3 : 0), 30] };
});
assert.equal(cleanLaps(raceLaps).length, 18, "drops the safety-car lap and the pit-out lap");
assert.ok(Math.abs(fitLine([[1, 2], [2, 4], [3, 6]]).slope - 2) < 1e-9);
assert.equal(fuelCorrect(90, 1), 90);
const [st] = stintPace(raceLaps, [{ stint: 1, compound: "MEDIUM", lapStart: 1, lapEnd: 20, tyreAgeAtStart: 0 }], true);
assert.ok(Math.abs(st.deg - 0.08) < 1e-6, `fuel-corrected deg ${st.deg} ≈ 0.08 s/lap`);
const [raw] = stintPace(raceLaps, [{ stint: 1, compound: "MEDIUM", lapStart: 1, lapEnd: 20, tyreAgeAtStart: 0 }], false);
assert.ok(Math.abs(raw.deg - (0.08 - FUEL_S_PER_LAP)) < 1e-6, "raw deg includes the fuel gain");
assert.ok(Math.abs(idealLap(raceLaps) - 89.5) < 1e-9, "ideal lap = best S1 + best S2 + best S3");

console.log("analysis.check: all assertions passed");
