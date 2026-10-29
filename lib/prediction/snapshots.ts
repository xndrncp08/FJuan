import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PredictionHorizon, PredictionSnapshot } from "@/lib/types/prediction";
import { timestamp, validateSnapshot } from "./policy";

export async function saveSnapshot(snapshot: PredictionSnapshot, directory: string): Promise<string> {
  validateSnapshot(snapshot);
  await mkdir(directory, { recursive: true });
  const name = `${snapshot.race.season}-${snapshot.race.round}-${snapshot.horizon}-${snapshot.cutoff.replace(/[:.]/g, "_")}.json`;
  const file = path.join(directory, name);
  const bytes = JSON.stringify(snapshot, null, 2) + "\n";
  try { await writeFile(file, bytes, { flag: "wx" }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST" || await readFile(file, "utf8") !== bytes) throw error;
  }
  return file;
}
export async function findSnapshot(season: string, round: string, horizon?: PredictionHorizon, cutoff?: string, directory = process.env.PREDICTION_SNAPSHOT_DIR): Promise<PredictionSnapshot | null> {
  if (!directory) return null;
  let files: string[];
  try { files = await readdir(directory); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return null; throw e; }
  const matches: PredictionSnapshot[] = [];
  for (const name of files.filter(f => f.startsWith(`${season}-${round}-`) && f.endsWith(".json"))) {
    const s = JSON.parse(await readFile(path.join(directory, name), "utf8")) as PredictionSnapshot;
    validateSnapshot(s);
    if (s.race.season === season && s.race.round === round && (!horizon || s.horizon === horizon) && (!cutoff || timestamp(s.cutoff) <= timestamp(cutoff))) matches.push(s);
  }
  return matches.sort((a, b) => timestamp(b.cutoff) - timestamp(a.cutoff))[0] ?? null;
}
