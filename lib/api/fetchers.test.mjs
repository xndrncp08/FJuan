import assert from 'node:assert/strict';
import test from 'node:test';
import { getDriverStats } from './fetchers.ts';
import championships from '../data/championships.json' with { type: 'json' };
import { GET } from '../../app/api/drivers/[id]/stats/route.ts';

test('title archive covers all 76 completed championships through 2025 using canonical IDs', () => {
  assert.equal(Object.values(championships).reduce((sum, count) => sum + count, 0), 76);
  assert.equal(Object.values(championships).filter(count => count > 0).length, 35);
  assert.equal(championships.emerson_fittipaldi, 2);
  assert.equal(championships.hill, 2);
  assert.equal(championships.jones, 1);
  assert.equal(championships.norris, 1);
});

function feeds({ failedPage = false, empty = false } = {}) {
  return async url => {
    const u = new URL(url);
    const races = empty ? [] : [1, 2].map(position => ({ season: '2025', round: String(position), raceName: 'Fixture race', Results: [{ position: String(position), points: '10', status: 'Finished', Constructor: { name: 'Fixture team' } }], QualifyingResults: [{ position: String(position) }] }));
    if (u.pathname.includes('driverStandings')) return Response.json({ MRData: { StandingsTable: { StandingsLists: [{ DriverStandings: [{ Driver: { driverId: 'fixture' }, Constructors: [] }] }] } } });
    if (u.pathname.endsWith('/fixture.json')) return Response.json({ MRData: { DriverTable: { Drivers: [{ driverId: 'fixture' }] } } });
    if (u.searchParams.get('offset') === '100' && failedPage) return new Response('Unavailable', { status: 503 });
    return Response.json({ MRData: { total: failedPage ? '101' : String(races.length), RaceTable: { Races: u.pathname.includes('/fastest/') ? [] : races } } });
  };
}

test('career stats use qualifying results for season poles and average position', async t => {
  t.mock.method(globalThis, 'fetch', feeds());
  const stats = await getDriverStats('fixture');
  assert.equal(stats.totalPoles, 1);
  assert.equal(stats.seasonResults[0].poles, 1);
  assert.equal(stats.avgQualifyingPosition, 1.5);
});
test('failed pagination never publishes partial career totals', async t => {
  t.mock.method(globalThis, 'fetch', feeds({ failedPage: true }));
  t.mock.method(console, 'error', () => {});
  assert.equal(await getDriverStats('fixture'), null);
});
test('a driver with no race results has a finite career span', async t => {
  t.mock.method(globalThis, 'fetch', feeds({ empty: true }));
  assert.equal((await getDriverStats('fixture')).careerSpan.yearsActive, 0);
});

test('driver stats proxy validates IDs and serves complete stats', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', feeds());
  const request = new Request('http://localhost/api/drivers/fixture/stats');
  assert.equal((await GET(request, { params: Promise.resolve({ id: '../bad' }) })).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
  const response = await GET(request, { params: Promise.resolve({ id: 'fixture' }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).seasonResults[0].poles, 1);
});

test('driver stats proxy returns a retryable error for incomplete upstream results', async t => {
  t.mock.method(globalThis, 'fetch', feeds({ failedPage: true }));
  t.mock.method(console, 'error', () => {});
  const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'fixture' }) });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('cache-control'), null);
});
