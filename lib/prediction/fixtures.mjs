// Synthetic inputs for correctness tests only. These are not historical forecast records.
import { RATINGS } from './ratings.ts';
export function fixture(count = 20) {
  const ids = ['max_verstappen', 'hamilton', 'alonso', 'russell', 'norris', 'leclerc', 'piastri', 'sainz', 'stroll', 'ocon', 'gasly', 'hulkenberg', 'tsunoda', 'albon', 'bottas', 'zhou', 'magnussen', 'sargeant', 'bearman', 'lawson', 'debutant', 'other_debutant'];
  const at = '2026-11-01T10:00:00.000Z';
  const obs = value => ({ source: 'synthetic test fixture', availableAt: at, value });
  const entries = ids.slice(0, count).map((id, i) => ({ driverId: id, driverCode: id.slice(0,3).toUpperCase(), givenName: id, familyName: 'Fixture', constructorId: 'mercedes', constructorName: 'Mercedes', number: String(i+1), status: 'entered' }));
  const rows = entries.map((e, i) => ({driverId:e.driverId, position:i+1, wins:0}));
  const previous = { season:'2026', round:'19', endedAt:'2026-10-25T23:00:00Z', rows };
  return {
    schemaVersion:1, capturedAt:at, cutoff:at, horizon:'post-qualifying',
    race:{season:'2026',round:'20',raceName:'Fixture Grand Prix',circuitId:'villeneuve',circuitName:'Circuit Gilles Villeneuve',raceDate:'2026-11-01',raceStart:'2026-11-01T20:00:00Z',qualifyingStart:'2026-10-31T18:00:00Z',qualifyingEnd:'2026-10-31T19:00:00Z',latitude:45.5,longitude:-73.5,isSprint:false},
    entryBasis:'entry-list', entries:obs(entries), form:obs([previous]),qualifyingHistory:obs([previous]),circuitHistory:obs([]),standings:obs(previous),
    qualifying:obs({endedAt:'2026-10-31T19:00:00Z',rows}),sprint:null,startingGrid:obs(rows),penalties:obs([]),weather:obs({rainProbability:0,temperatureC:20,windSpeedKph:10,raceDate:'2026-11-01'}),ratings:structuredClone(RATINGS),warnings:[],
  };
}
export function outcomes(s) { return s.entries.value.filter(e=>e.status==='entered').map((e,i)=>({driverId:e.driverId,position:i+1,status:'finished'})); }
export function rawRace() {
  return { season:'2026',round:'1',raceName:'Fixture Grand Prix',date:'2026-11-01',time:'20:00:00Z',Qualifying:{date:'2026-10-31',time:'18:00:00Z'},Circuit:{circuitId:'villeneuve',circuitName:'Circuit Gilles Villeneuve',Location:{lat:'45.5',long:'-73.5'}} };
}
export function mockedFeeds({weatherFailure=false, futureHistory=false, post=true}={}) {
  const calls=[];
  const fetcher = async (url, init) => {
    calls.push({url:String(url),init});
    const u = new URL(url);
    const respond = body=>new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
    const driver = (driverId,number,givenName,familyName)=>({driverId,permanentNumber:number,code:driverId.slice(0,3).toUpperCase(),givenName,familyName});
    const drivers = [driver('max_verstappen','33','Max','Verstappen'),driver('hamilton','44','Lewis','Hamilton'),driver('new_driver','99','New','Driver')];
    const resultRows = drivers.map((d,i)=>({Driver:d,Constructor:{constructorId:'mercedes',name:'Mercedes'},position:String(i+1),wins:'0'}));
    if(u.pathname==='/v1/sessions') return respond([
      {session_name:'Race',session_key:10,meeting_key:1,date_start:'2026-11-01T20:00:00Z',date_end:'2026-11-01T23:00:00Z'},
      {session_name:'Qualifying',session_key:9,meeting_key:1,date_start:'2026-10-31T18:00:00Z',date_end:'2026-10-31T19:00:00Z'},
      {session_name:'Practice 3',session_key:8,meeting_key:1,date_start:'2026-10-31T12:00:00Z',date_end:'2026-10-31T13:00:00Z'},
    ]);
    if(u.pathname==='/v1/drivers') return respond([{driver_number:1,full_name:'MAX VERSTAPPEN',first_name:'Max',last_name:'Verstappen',team_name:'Mercedes'},{driver_number:44,full_name:'LEWIS HAMILTON',first_name:'Lewis',last_name:'Hamilton',team_name:'Mercedes'},{driver_number:99,full_name:'NEW DRIVER',first_name:'New',last_name:'Driver',team_name:'Mercedes'}]);
    if(u.pathname==='/v1/starting_grid') return respond([{driver_number:1,position:1},{driver_number:44,position:2},{driver_number:99,position:3}]);
    if(u.pathname==='/v1/race_control') return respond([{driver_number:1,date:post?'2026-11-01T09:00:00Z':'2026-10-31T14:00:00Z',message:'CAR 1 - 5 PLACE GRID PENALTY'}]);
    if(u.host==='api.open-meteo.com') return weatherFailure?new Response('Unavailable',{status:503}):respond({hourly:{time:['2026-11-01T20:00'],precipitation_probability:[0],temperature_2m:[20],wind_speed_10m:[10]}});
    if(u.pathname.includes('/circuits/')) {
      const rows=futureHistory?[{...rawRace(),season:'2026',round:'1',Results:resultRows.slice(0,1)},{...rawRace(),season:'2027',Results:resultRows.slice(0,1)}]:[];
      return respond({MRData:{total:String(rows.length),RaceTable:{Races:rows}}});
    }
    if(u.pathname.endsWith('/qualifying.json')) return respond({MRData:{RaceTable:{Races:[{...rawRace(),QualifyingResults:resultRows}]}}});
    if(u.pathname==='/ergast/f1/2025.json') return respond({MRData:{RaceTable:{Races:[]}}});
    if(u.pathname==='/ergast/f1/2026.json') return respond({MRData:{RaceTable:{Races:[rawRace()]}}});
    throw new Error('Unexpected fixture request '+url);
  };
  return {calls,fetcher};
}
