import assert from 'node:assert/strict';
import test from 'node:test';
import { scorePrediction, WEIGHTS } from './engine.ts';
import { modelDistribution, normalise, spearman } from './math.ts';
import { validateSnapshot, horizonAt } from './policy.ts';
import { capturePredictionInputs, circuitCoordinates, gridPenaltySeverity, penaltiesBefore } from './data.ts';
import { baselineRankings, outcomePositions, parseOutcomes, rankingMetrics } from './metrics.ts';
import { nextScheduledRace, raceStartTime, raceEndTime } from '../utils/raceCalendar.ts';
import { fixture, outcomes, rawRace, mockedFeeds, preWeekendFeeds } from './fixtures.mjs';

const byId = (p,id)=>p.ranking.find(d=>d.driverId===id);
test('existing eight weights remain unchanged',()=>assert.deepEqual(Object.values(WEIGHTS),[.35,.15,.15,.1,.1,.07,.05,.03]));
for (const key of ['form','qualifyingHistory','circuitHistory']) {
  test(`${key}: rejects target and later results`,()=>{
    for(const [season,round] of [['2026','20'],['2027','1']]) {
      const s=fixture();s[key].value.push({season,round,endedAt:'2026-10-25T20:00:00Z',rows:[{driverId:'hamilton',position:1}]});
      assert.throws(()=>scorePrediction(s),/target or future/);
    }
  });
}
for(const key of ['entries','form','qualifyingHistory','circuitHistory','standings','qualifying','startingGrid','penalties','weather','ratings']) {
  test(`${key}: rejects response first available after cutoff`,()=>{
    const s=fixture();s[key].availableAt='2026-11-01T10:00:01Z';assert.throws(()=>scorePrediction(s),/not available/);
  });
}
test('season opener never uses current-season standings',()=>{
  const s=fixture();s.race.round='1';s.form=null;s.qualifyingHistory=null;
  assert.throws(()=>scorePrediction(s),/Standings/);
  s.standings=null;assert.equal(scorePrediction(s).ranking.length,20);
});
test('canonical wet ratings match Hamilton and Verstappen; unknown rating is neutral',()=>{
  const s=fixture(22);s.weather.value.rainProbability=80;
  const p=scorePrediction(s);
  assert.equal(byId(p,'hamilton').factors.weatherAdaptability,95);
  assert.equal(byId(p,'max_verstappen').factors.weatherAdaptability,95);
  assert.equal(byId(p,'debutant').factors.weatherAdaptability,50);
  assert.ok(byId(p,'debutant').missingFactors.includes('weatherAdaptability'));
});
test('aliases resolve consistently and alias collisions cannot duplicate a driver',()=>{
  const s=fixture();s.entries.value[1].driverId='lewis_hamilton';assert.equal(scorePrediction(s).ranking.filter(d=>d.driverId==='hamilton').length,1);
  s.entries.value[2].driverId='hamilton';assert.throws(()=>scorePrediction(s),/duplicate race entry|unique eligible/);
});
for(const count of [20,22]) test(`grid severity survives ${count}-driver field normalization`,()=>{
  const s=fixture(count);s.penalties.value=[{driverId:'hamilton',severity:3,announcedAt:s.cutoff}];
  assert.equal(byId(scorePrediction(s),'hamilton').factors.gridPenalty,70);
  s.penalties.value[0].severity=10;assert.equal(byId(scorePrediction(s),'hamilton').factors.gridPenalty,0);
  assert.equal(byId(scorePrediction(s),'alonso').factors.gridPenalty,100);
});
test('grid order does not count penalties twice or leak into qualifying',()=>{
  const s=fixture();const before=scorePrediction(s);
  s.startingGrid.value.reverse().forEach((r,i)=>{r.position=i+1;});
  // Change only the grid; fixtures share rows, so clone the whole grid for this check.
  const isolated=fixture();isolated.startingGrid=structuredClone(s.startingGrid);
  assert.deepEqual(scorePrediction(isolated),before);
  assert.notDeepEqual(baselineRankings(isolated,before.ranking).startingGrid,baselineRankings(fixture(),before.ranking).startingGrid);
});
test('championship benchmark preserves standings order without model wins bonus',()=>{
  const s=fixture();s.standings.value.rows[1].wins=10;
  const p=scorePrediction(s);
  assert.ok(byId(p,'hamilton').factors.championshipPosition>byId(p,'max_verstappen').factors.championshipPosition);
  const baseline=baselineRankings(s,p.ranking).championship;
  assert.equal([...baseline].sort((a,b)=>b.score-a.score)[0].driverId,'max_verstappen');
  s.standings.value.rows=s.standings.value.rows.slice(1);
  assert.equal(baselineRankings(s,p.ranking).championship,null);
});
test('entries admit debutants, exclude inactive history and explicit withdrawals',()=>{
  const s=fixture(22);s.entries.value[0].status='withdrawn';
  s.form.value[0].rows=s.form.value[0].rows.filter(r=>!r.driverId.includes('debutant'));
  s.qualifyingHistory=null;s.qualifying=null;s.standings=null;s.ratings=null;
  s.form.value[0].rows.push({driverId:'former_driver',position:1});
  const p=scorePrediction(s);
  assert.equal(p.ranking.length,21);assert.ok(!byId(p,'max_verstappen'));assert.ok(!byId(p,'former_driver'));
  assert.equal(byId(p,'debutant').factors.currentForm,50);assert.ok(byId(p,'debutant').missingFactors.includes('currentForm'));
});
test('missing race-specific entries fail closed; no season roster invented',()=>{
  const s=fixture();s.entries.value=[];assert.throws(()=>scorePrediction(s),/entry information/);
});
test('Spearman handles DNF gaps by ranking aligned values, never clamping',()=>{
  assert.equal(spearman([[6,1],[7,2],[8,3],[9,4],[10,5]]),1);
  assert.equal(spearman([[6,5],[7,4],[8,3],[9,2],[10,1]]),-1);
  assert.ok(Math.abs(spearman([[1,1],[1,2],[3,3]])-Math.sqrt(3)/2)<1e-12);
  assert.equal(spearman([[1,1],[2,2]]),null);assert.equal(spearman([[1,1],[1,2],[1,3]]),null);
});
test('DNF order retained; DNS omitted from ranks; disqualifications tied last',()=>{
  const parsed=parseOutcomes([
    {Driver:{driverId:'winner'},position:'1',positionText:'1',status:'Finished'},
    {Driver:{driverId:'retired'},position:'2',positionText:'R',status:'Engine'},
    {Driver:{driverId:'dns'},position:'3',positionText:'W',status:'Did not start'},
    {Driver:{driverId:'dsq1'},position:'4',positionText:'D',status:'Disqualified'},
    {Driver:{driverId:'dsq2'},position:'5',positionText:'D',status:'Disqualified'},
  ]);
  const pos=outcomePositions(parsed);assert.equal(pos.get('retired'),2);assert.ok(!pos.has('dns'));assert.equal(pos.get('dsq1'),3);assert.equal(pos.get('dsq2'),3);
});
test('missing prediction or outcome excludes aggregate scores instead of hiding drivers',()=>{
  const s=fixture();const p=scorePrediction(s);const o=outcomes(s);
  let stats=rankingMetrics(p.ranking,o.slice(1));assert.equal(stats.completeField,false);assert.equal(stats.brier,null);assert.deepEqual(stats.missingOutcomes,['max_verstappen']);
  o.push({driverId:'unpredicted',position:21,status:'dnf'});stats=rankingMetrics(p.ranking,o);assert.equal(stats.spearman,null);assert.deepEqual(stats.missingDrivers,['unpredicted']);
});
test('top-three metrics respect score ties; uniform estimates get proper full-field scores',()=>{
  const s=fixture();const ranking=s.entries.value.map(e=>({driverId:e.driverId,score:50,modelEstimate:1/20}));
  const m=rankingMetrics(ranking,outcomes(s));assert.ok(Math.abs(m.podiumHits-.45)<1e-12);assert.ok(Math.abs(m.brier-.95)<1e-12);assert.ok(Math.abs(m.logLoss-Math.log(20))<1e-12);assert.equal(m.spearman,null);
});
test('race-day calendar keeps today until end boundary, including timezone offsets',()=>{
  const races=[{date:'2026-11-01',time:'20:00:00Z',round:1},{date:'2026-11-08',time:'20:00:00Z',round:2}];
  for(const at of ['2026-11-01T00:00:01Z','2026-11-01T19:59:59Z','2026-11-01T20:00:00Z','2026-11-01T23:00:00Z']) assert.equal(nextScheduledRace(races,Date.parse(at)).round,1);
  assert.equal(nextScheduledRace(races,Date.parse('2026-11-01T23:00:01Z')).round,2);
  assert.equal(raceStartTime({date:'2026-11-02',time:'05:00:00+09:00'}),raceStartTime(races[0]));
  assert.equal(raceEndTime({date:'2026-11-01'}),Date.parse('2026-11-02T02:59:59Z'));
});
test('qualifying start, finish, and race start define separate horizons',()=>{
  const {race}=fixture();assert.equal(horizonAt(race,Date.parse('2026-10-31T17:59:59Z')),'pre-qualifying');
  assert.throws(()=>horizonAt(race,Date.parse(race.qualifyingStart)),/in progress/);
  assert.equal(horizonAt(race,Date.parse(race.qualifyingEnd)),'post-qualifying');
  assert.throws(()=>horizonAt(race,Date.parse(race.raceStart)),/Race started/);
});
test('pre-qualifying cannot consume qualifying or a final grid',()=>{
  const s=fixture();s.cutoff=s.capturedAt='2026-10-31T17:00:00Z';s.horizon='pre-qualifying';
  for(const v of Object.values(s)) if(v?.availableAt) v.availableAt=s.cutoff;
  assert.throws(()=>scorePrediction(s),/cannot contain/);s.qualifying=null;s.startingGrid=null;validateSnapshot(s);
});
test('future session results and penalty announcements are rejected',()=>{
  const s=fixture();s.sprint={source:'fixture',availableAt:s.cutoff,value:{endedAt:'2026-11-01T11:00:00Z',rows:[]}};assert.throws(()=>scorePrediction(s),/not ended/);
  s.sprint=null;s.penalties.value=[{driverId:'hamilton',severity:3,announcedAt:'2026-11-01T11:00:00Z'}];assert.throws(()=>scorePrediction(s),/future grid penalty/);
});
test('weather distinguishes observed zero rain from missing forecast',()=>{
  const s=fixture();let p=scorePrediction(s);assert.equal(p.weather.available,true);assert.equal(p.weather.rainProbability,0);
  s.weather=null;p=scorePrediction(s);assert.equal(p.weather.rainProbability,null);assert.equal(p.weather.isWetExpected,null);assert.equal(p.weather.available,false);assert.ok(byId(p,'hamilton').missingFactors.includes('weatherAdaptability'));
  assert.deepEqual(circuitCoordinates(rawRace()),[45.5,-73.5]);assert.equal(circuitCoordinates({Circuit:{Location:{}}}),null);
});
test('full-field distribution is independent of display count',()=>{
  const s=fixture();for(const key of ['form','qualifyingHistory','circuitHistory','standings','qualifying','sprint','startingGrid','penalties','weather','ratings']) s[key]=null;
  const p=scorePrediction(s,5);assert.equal(p.ranking.length,20);assert.equal(p.likelyFinishers.length,2);assert.ok(p.ranking.every(d=>d.modelEstimate===.05));assert.ok(Math.abs(p.ranking.reduce((a,d)=>a+d.modelEstimate,0)-1)<1e-12);
  assert.deepEqual(p.ranking,scorePrediction(s,10).ranking);
});
test('distribution is stable at numerical extremes and rejects invalid inputs',()=>{
  for(const scores of [[1e308,1e308,-1e308],[-1e308,-1e308],[100000,99999],Array(22).fill(50)]) {
    const p=modelDistribution(scores);assert.ok(p.every(v=>Number.isFinite(v)&&v>=0));assert.ok(Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-12);
  }
  assert.throws(()=>modelDistribution([NaN]));assert.throws(()=>modelDistribution([Infinity]));assert.throws(()=>modelDistribution([1],0));
});
test('percentile clipping preserves a sparse non-penalty signal; null is neutral',()=>{
  const n=normalise(Array.from({length:22},(_,i)=>[String(i),i===0?1:0]));assert.equal(n.get('0'),100);assert.equal(n.get('1'),0);assert.equal(normalise([['missing',null],['a',1],['b',3]]).get('missing'),50);
});
test('only confirmed pre-cutoff grid decisions count, mapped by actual session number',()=>{
  assert.equal(gridPenaltySeverity('ENGINE CHANGE NOTED'),null);assert.equal(gridPenaltySeverity('5-PLACE GRID PENALTY'),3);assert.equal(gridPenaltySeverity('CAR 1 TO START FROM PIT LANE'),10);assert.equal(gridPenaltySeverity('5 PLACE GRID PENALTY - NO FURTHER ACTION'),null);
  const s=fixture();const messages=[{driver_number:1,message:'5 PLACE GRID PENALTY',date:s.cutoff},{driver_number:2,message:'START FROM PIT LANE',date:'2026-11-01T11:00:00Z'}];
  assert.deepEqual(penaltiesBefore(messages,s.entries.value,Date.parse(s.cutoff)).map(p=>[p.driverId,p.severity]),[['max_verstappen',3]]);
  messages.push({driver_number:1,message:'GRID PENALTY RESCINDED',date:s.cutoff});assert.equal(penaltiesBefore(messages,s.entries.value,Date.parse(s.cutoff))[0].severity,0);
});
test('live opener uses race-specific entrants, no unrestricted standings, and correct Montreal forecast coordinates',async()=>{
  const {fetcher,calls}=mockedFeeds();const s=await capturePredictionInputs(rawRace(),{fetcher,now:()=>Date.parse('2026-11-01T10:00:00Z')});
  const p=scorePrediction(s);assert.equal(p.ranking.length,3);assert.ok(byId(p,'new_driver'));assert.equal(byId(p,'new_driver').factors.currentForm,50);assert.equal(byId(p,'max_verstappen').penaltySeverity,3);
  assert.ok(!calls.some(c=>/\/2026\/driverStandings/.test(c.url)));assert.ok(calls.every(c=>c.init.cache==='no-store'));
  const w=new URL(calls.find(c=>c.url.includes('open-meteo')).url);assert.equal(w.searchParams.get('latitude'),'45.5');assert.equal(w.searchParams.get('longitude'),'-73.5');
});
test('current and future circuit results returned by upstream never become historical features',async()=>{
  const options={now:()=>Date.parse('2026-11-01T10:00:00Z')};
  const before=await capturePredictionInputs(rawRace(),{...options,fetcher:mockedFeeds().fetcher});
  const after=await capturePredictionInputs(rawRace(),{...options,fetcher:mockedFeeds({futureHistory:true}).fetcher});
  assert.deepEqual(scorePrediction(before),scorePrediction(after));
});
test('forecast failures become unavailable, never fabricated dry weather',async()=>{
  const s=await capturePredictionInputs(rawRace(),{fetcher:mockedFeeds({weatherFailure:true}).fetcher,now:()=>Date.parse('2026-11-01T10:00:00Z')});
  assert.equal(s.weather,null);assert.equal(scorePrediction(s).weather.rainProbability,null);
});
test('historical replay never fetches current weather or mutable historical features',async()=>{
  let calls=0;await assert.rejects(capturePredictionInputs(rawRace(),{fetcher:async()=>{calls++;throw new Error('must not fetch');},now:()=>Date.parse('2026-11-02T10:00:00Z')}),/saved pre-race/);assert.equal(calls,0);
});
test('pre-qualifying capture uses practice field and never requests qualifying or grid',async()=>{
  const {fetcher,calls}=mockedFeeds({post:false});const s=await capturePredictionInputs(rawRace(),{fetcher,now:()=>Date.parse('2026-10-31T15:00:00Z')});
  assert.equal(s.horizon,'pre-qualifying');assert.equal(s.entryBasis,'practice');assert.ok(!calls.some(c=>c.url.includes('/qualifying.json')||c.url.includes('/starting_grid')));assert.ok(s.entries.value.some(e=>e.driverId==='openf1:99'));
});

test('before practice the model runs with a disclosed provisional field from the previous race', async () => {
  const { race, fetcher, calls } = preWeekendFeeds();
  const snapshot = await capturePredictionInputs(race, { fetcher, now: () => Date.parse('2026-10-28T12:00:00Z') });
  const prediction = scorePrediction(snapshot);
  assert.equal(snapshot.entryBasis, 'previous-race');
  assert.equal(prediction.horizon, 'pre-qualifying');
  assert.equal(prediction.ranking.length, 3);
  assert.equal(prediction.coverage.currentForm, 1);
  assert.ok(prediction.warnings.some(w => w.includes('previous race')));
  assert.ok(!calls.some(url => url.includes('/2026/2/qualifying') || url.includes('/starting_grid') || url.includes('/2026/drivers')));
});

test('malformed race identifiers cannot escape the snapshot directory',()=>{
  const s=fixture();s.race.season='../../outside';assert.throws(()=>validateSnapshot(s),/race identity/);
});
test('post-qualifying capture requires published results, not just a scheduled end',async()=>{
  const feeds=mockedFeeds();const fetcher=async(url,init)=>String(url).includes('/qualifying.json')?new Response(JSON.stringify({MRData:{RaceTable:{Races:[]}}})):feeds.fetcher(url,init);
  await assert.rejects(capturePredictionInputs(rawRace(),{fetcher,now:()=>Date.parse('2026-11-01T10:00:00Z')}),/Published qualifying/);
});
test('missing actual session numbers neutralizes penalty data rather than assuming permanent numbers',async()=>{
  const feeds=mockedFeeds();const fetcher=async(url,init)=>String(url).includes('/v1/drivers')?new Response('[]'):feeds.fetcher(url,init);
  const s=await capturePredictionInputs(rawRace(),{fetcher,now:()=>Date.parse('2026-11-01T10:00:00Z')});assert.equal(s.penalties,null);assert.equal(byId(scorePrediction(s),'max_verstappen').penaltySeverity,null);
});
test('explicit pre-cutoff race withdrawals remove entries; future messages cannot',async()=>{
  const feeds=mockedFeeds();const fetcher=async(url,init)=>String(url).includes('/race_control')?new Response(JSON.stringify([{driver_number:44,date:'2026-11-01T09:00:00Z',message:'CAR 44 WITHDRAWN FROM THE RACE'},{driver_number:1,date:'2026-11-01T11:00:00Z',message:'CAR 1 WITHDRAWN FROM THE RACE'}])):feeds.fetcher(url,init);
  const s=await capturePredictionInputs(rawRace(),{fetcher,now:()=>Date.parse('2026-11-01T10:00:00Z')});const p=scorePrediction(s);assert.ok(!byId(p,'hamilton'));assert.ok(byId(p,'max_verstappen'));
});
test('a capture crossing lights out is rejected, even when its first response was pre-race',async()=>{
  const feeds=mockedFeeds();let time=Date.parse('2026-11-01T19:59:59Z');
  const fetcher=async(url,init)=>{const result=await feeds.fetcher(url,init);if(String(url).includes('open-meteo')) time=Date.parse('2026-11-01T20:00:00Z');return result;};
  await assert.rejects(capturePredictionInputs(rawRace(),{fetcher,now:()=>time}),/Race started/);
});

test('recorded responses cannot precede the results or decisions they claim to contain',()=>{
  const s=fixture();s.qualifying.availableAt='2026-10-31T18:00:00Z';assert.throws(()=>scorePrediction(s),/not ended/);
  s.qualifying=null;s.penalties.value=[{driverId:'hamilton',severity:3,announcedAt:'2026-11-01T09:00:00Z'}];s.penalties.availableAt='2026-11-01T08:00:00Z';assert.throws(()=>scorePrediction(s),/future grid penalty/);
});
