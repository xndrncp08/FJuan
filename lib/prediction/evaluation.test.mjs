import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { evaluateManifest, calibration } from './evaluation.ts';
import { scorePrediction } from './engine.ts';
import { saveSnapshot, findSnapshot } from './snapshots.ts';
import { insightFacts } from './insights.ts';
import { buildPredictionPrompt } from './prompt.ts';
import { fixture, outcomes } from './fixtures.mjs';

function dataset() {
  const files={};
  const races=['2026-11-01','2026-11-03','2026-11-05'].map((date,i)=>{
    const round=String(20+i);const snapshots={};
    for(const horizon of ['pre-qualifying','post-qualifying']) {
      const s=fixture();s.race.round=round;s.race.raceDate=date;
      s.race.raceStart=date+'T20:00:00Z';s.race.qualifyingStart=date+'T08:00:00Z';s.race.qualifyingEnd=date+'T09:00:00Z';
      s.horizon=horizon;s.cutoff=s.capturedAt=date+(horizon==='pre-qualifying'?'T07:00:00Z':'T10:00:00Z');
      for(const value of Object.values(s)) if(value?.availableAt && value!==s.ratings) value.availableAt=s.cutoff;
      s.weather.value.raceDate=date;s.qualifying.value.endedAt=s.race.qualifyingEnd;
      if(horizon==='pre-qualifying') {s.qualifying=null;s.startingGrid=null;}
      const file=`${round}-${horizon}.json`;snapshots[horizon]=file;files[file]=s;
    }
    const outcome=round+'-outcome.json';files[outcome]={season:'2026',round,date,rows:outcomes(fixture())};
    return {season:'2026',round,date,snapshots,outcome};
  });
  return {files,manifest:{schemaVersion:1,trainThrough:'2026-11-02',validationThrough:'2026-11-04',races}};
}
test('chronological evaluation separates horizons and never opens final holdout files',async()=>{
  const {files,manifest}=dataset();const opened=[];
  const report=await evaluateManifest(manifest,async file=>{opened.push(file);assert.ok(!file.startsWith('22-'));return structuredClone(files[file]);});
  assert.equal(report.splits.reservedHoldout,1);assert.equal(report.splits.holdoutEvaluated,false);assert.equal(report.tuned,false);
  for(const split of ['train','validation']) for(const horizon of ['pre-qualifying','post-qualifying']) assert.equal(report.groups.find(g=>g.group===`${split}/${horizon}/correctedBaseline`).n,1);
  assert.ok(report.exclusions.some(e=>e.horizon==='pre-qualifying'&&e.reason.includes('startingGrid')));
  assert.ok(opened.length>0);
});
test('holdout can be scored separately with fixed weights only when included',async()=>{
  const {files,manifest}=dataset();const report=await evaluateManifest(manifest,async file=>structuredClone(files[file]),true);
  assert.equal(report.splits.holdoutEvaluated,true);assert.equal(report.groups.filter(g=>g.group.startsWith('holdout/')&&g.group.endsWith('/correctedBaseline')).length,2);
});
test('missing snapshots count as exclusions and never trigger outcome reads or backfill',async()=>{
  const {manifest}=dataset();for(const r of manifest.races) r.snapshots={};
  const report=await evaluateManifest(manifest,async()=>{throw new Error('must not read');});
  assert.equal(report.groups.length,0);assert.equal(report.exclusions.length,4);assert.ok(report.exclusions.every(e=>e.reason.includes('No pre-race snapshot')));
});
test('wrong-race outcomes and future snapshot inputs are excluded with reasons',async()=>{
  const {files,manifest}=dataset();files['20-outcome.json'].round='99';files['21-post-qualifying.json'].weather.availableAt='2026-11-06T12:00:00Z';
  const report=await evaluateManifest(manifest,async f=>structuredClone(files[f]));
  assert.ok(report.exclusions.some(e=>e.reason.includes('Outcome does not match')));assert.ok(report.exclusions.some(e=>e.reason.includes('not available at the cutoff')));
});
test('chronology and duplicate race validation prevent accidental split overlap',async()=>{
  const {manifest}=dataset();manifest.trainThrough='2027-01-01';await assert.rejects(evaluateManifest(manifest,async()=>null),/chronological/);
  manifest.trainThrough='2026-11-02';manifest.races.push(manifest.races[0]);await assert.rejects(evaluateManifest(manifest,async()=>null),/duplicate/);
});
test('full-field reliability bins have known calibration error',()=>{
  const c=calibration(Array.from({length:20},(_,i)=>({estimate:.05,won:i===0?1:0})));
  assert.equal(c.n,20);assert.ok(c.ece<1e-12);assert.equal(c.bins[0].n,20);assert.equal(calibration([]).ece,null);
});
test('snapshots persist immutably and horizon/cutoff selection cannot mix cached inputs',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'fjuan-snapshots-'));
  try {
    const s=fixture();const file=await saveSnapshot(s,directory);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),s);
    assert.equal(await saveSnapshot(s,directory),file);
    const changed=structuredClone(s);changed.weather.value.rainProbability=70;await assert.rejects(saveSnapshot(changed,directory));
    assert.equal(await findSnapshot('2026','20','pre-qualifying',undefined,directory),null);
    assert.equal(await findSnapshot('2026','20','post-qualifying','2026-11-01T09:00:00Z',directory),null);
    assert.deepEqual(await findSnapshot('2026','20','post-qualifying',s.cutoff,directory),s);
  } finally { await rm(directory,{recursive:true,force:true}); }
});
test('card insights are deterministic statements from the model factors', () => {
  const snapshot = fixture();
  snapshot.weather = null;
  snapshot.penalties = null;
  const first = scorePrediction(snapshot);
  assert.deepEqual(first, scorePrediction(structuredClone(snapshot)));
  for (const driver of first.ranking) assert.equal(driver.insight, insightFacts(driver).slice(0, 2).join(' '));
});
test('explanation context distinguishes unavailable weather/penalties and relative estimates',()=>{
  const s=fixture();s.weather=null;s.penalties=null;const prompt=buildPredictionPrompt(scorePrediction(s));
  assert.ok(prompt.includes('Forecast unavailable'));assert.ok(prompt.includes('not calibrated win or podium odds'));assert.ok(prompt.includes('"penaltySeverity":null'));assert.ok(prompt.includes('"cutoff"'));assert.ok(!/Groq|GPT|AI-powered|Llama|Pollinations/.test(prompt));
});

test('service replays historical snapshots without any mutable upstream fetch',async()=>{
  const {generateRacePrediction}=await import('./service.ts');const {rawRace}=await import('./fixtures.mjs');
  const directory=await mkdtemp(path.join(tmpdir(),'fjuan-replay-'));
  const savedFetch=globalThis.fetch,savedNow=Date.now,savedDir=process.env.PREDICTION_SNAPSHOT_DIR,savedKey=process.env.GROQ_API_KEY;
  try {
    const s=fixture();await saveSnapshot(s,directory);process.env.PREDICTION_SNAPSHOT_DIR=directory;
    Date.now=()=>Date.parse('2026-11-02T10:00:00Z');process.env.GROQ_API_KEY='test-only';let requests=0;globalThis.fetch=async()=>{requests++;throw new Error('Historical replay cannot fetch');};
    const p=await generateRacePrediction({...rawRace(),round:'20'},{horizon:'post-qualifying'});
    assert.equal(p.cutoff,s.cutoff);assert.equal(requests,0);
    await assert.rejects(generateRacePrediction({...rawRace(),round:'20'},{horizon:'pre-qualifying'}),/No saved pre-race snapshot/);
  } finally {globalThis.fetch=savedFetch;Date.now=savedNow;if(savedKey===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=savedKey;if(savedDir===undefined)delete process.env.PREDICTION_SNAPSHOT_DIR;else process.env.PREDICTION_SNAPSHOT_DIR=savedDir;await rm(directory,{recursive:true,force:true});}
});
test('closed horizon can serve its saved snapshot while another horizon is live',async()=>{
  const {generateRacePrediction}=await import('./service.ts');const {rawRace,mockedFeeds}=await import('./fixtures.mjs');
  const directory=await mkdtemp(path.join(tmpdir(),'fjuan-horizon-'));
  const savedFetch=globalThis.fetch,savedNow=Date.now,savedDir=process.env.PREDICTION_SNAPSHOT_DIR;
  try {
    const s=fixture();s.horizon='pre-qualifying';s.cutoff=s.capturedAt='2026-10-31T17:00:00Z';s.qualifying=null;s.startingGrid=null;
    for(const value of Object.values(s))if(value?.availableAt&&value!==s.ratings)value.availableAt=s.cutoff;
    await saveSnapshot(s,directory);process.env.PREDICTION_SNAPSHOT_DIR=directory;Date.now=()=>Date.parse('2026-11-01T10:00:00Z');globalThis.fetch=mockedFeeds().fetcher;
    const p=await generateRacePrediction({...rawRace(),round:'20'},{horizon:'pre-qualifying'});assert.equal(p.horizon,'pre-qualifying');assert.equal(p.cutoff,s.cutoff);
  } finally {globalThis.fetch=savedFetch;Date.now=savedNow;if(savedDir===undefined)delete process.env.PREDICTION_SNAPSHOT_DIR;else process.env.PREDICTION_SNAPSHOT_DIR=savedDir;await rm(directory,{recursive:true,force:true});}
});

test('dry-weather and non-sprint neutrality are never sold as supporting evidence',()=>{
  const s=fixture();s.form=null;s.qualifying=null;s.qualifyingHistory=null;s.standings=null;s.circuitHistory=null;s.ratings=null;
  const d=scorePrediction(s).ranking[0];assert.deepEqual(d.inactiveFactors,['weatherAdaptability','sprintForm']);
  const facts=insightFacts(d).join(' ');assert.ok(!facts.includes('Weather fit'));assert.ok(!facts.includes('Sprint form'));assert.ok(facts.includes('neutral fallbacks'));
});
