import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { evaluateManifest } from '../lib/prediction/evaluation.ts';
const args = process.argv.slice(2);
const value = flag => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1]; };
const manifestFile = value('--manifest');
if (!manifestFile) throw new Error('Usage: npm run prediction:evaluate -- --manifest manifest.json [--out report.json] [--holdout]');
const manifestBytes = await readFile(manifestFile, 'utf8');
const hashes = { manifest: createHash('sha256').update(manifestBytes).digest('hex') };
const load = async file => {
  const bytes = await readFile(path.resolve(path.dirname(manifestFile), file), 'utf8');
  hashes[file] = createHash('sha256').update(bytes).digest('hex');
  return JSON.parse(bytes);
};
const report = await evaluateManifest(JSON.parse(manifestBytes), load, args.includes('--holdout'));
const result = JSON.stringify({ ...report, inputHashes: hashes }, null, 2) + '\n';
if (value('--out')) await writeFile(value('--out'), result);
console.log(result);
