import assert from 'node:assert/strict';
import test from 'node:test';
import { getRaceSchedule, getDriverStandings, getDriversBySeason } from './jolpica.ts';

test('calendar and standings reject service failures instead of reporting empty data', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Unavailable', { status: 503 }));
  await assert.rejects(getRaceSchedule('2025'), /503/);
  await assert.rejects(getDriverStandings('2025'), /503/);
});

test('empty successful seasons stay empty and driver lookup respects its season', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(url);
    return Response.json({ MRData: { RaceTable: { Races: [] }, StandingsTable: { StandingsLists: [] }, DriverTable: { Drivers: [{ driverId: 'fixture' }] } } });
  });
  assert.deepEqual(await getRaceSchedule('1950'), []);
  assert.deepEqual(await getDriverStandings('1950'), []);
  assert.deepEqual(await getDriversBySeason('1950'), [{ driverId: 'fixture' }]);
  assert.ok(calls.every(url => url.includes('/1950')));
});

test('short rate limits retry once and persistent or long limits remain errors', async t => {
  let attempts = 0;
  const fetch = t.mock.method(globalThis, 'fetch', async () => ++attempts === 1
    ? new Response('', { status: 429, headers: { 'Retry-After': '0' } })
    : Response.json({ MRData: { RaceTable: { Races: [] } } }));
  assert.deepEqual(await getRaceSchedule('2025'), []);
  assert.equal(attempts, 2);
  fetch.mock.mockImplementation(async () => new Response('', { status: 429, headers: { 'Retry-After': '0' } }));
  await assert.rejects(getRaceSchedule('2025'), /429/);
  assert.equal(fetch.mock.callCount(), 4);
  fetch.mock.mockImplementation(async () => new Response('', { status: 429, headers: { 'Retry-After': '60' } }));
  await assert.rejects(getRaceSchedule('2025'), /429/);
  assert.equal(fetch.mock.callCount(), 5);
});
