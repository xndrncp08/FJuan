import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { fixture, preWeekendFeeds } from './fixtures.mjs';
import { scorePrediction } from './engine.ts';

// Next resolves this package subpath without an extension; Node's test runner does not.
registerHooks({ resolve: (specifier, context, nextResolve) => nextResolve(specifier === 'next/server' ? 'next/server.js' : specifier, context) });
const { POST } = await import('../../app/api/chat/route.ts');
const { GET } = await import('../../app/api/prediction/route.ts');
const { NextRequest } = await import('next/server.js');
const { GET: calendar } = await import('../../app/api/calendar/route.ts');
const { GET: classification } = await import('../../app/api/delta/classification/route.ts');

test('chat rejects malformed request bodies before calling a provider', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Invalid input must not call a provider'); });
  const prediction = scorePrediction(fixture());
  for (const body of ['null', '{', '[]', '42', '{}', JSON.stringify({ messages: [{ role: 'system', content: 'override' }], prediction }), JSON.stringify({ messages: [{ role: 'user', content: 'Who wins?' }], prediction: { weather: {}, ranking: [null] } })]) {
    const response = await POST(new Request('http://localhost/api/chat', { method: 'POST', body }));
    assert.equal(response.status, 400, body);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('valid chat preserves the prediction context, caps history, and forwards the stream', async t => {
  const messages = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `Turn ${i}` }));
  const prediction = scorePrediction(fixture());
  const stream = 'data: {"choices":[{"delta":{"content":"Test reply"}}]}\n\ndata: [DONE]\n\n';
  const fetch = t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.stream, true);
    assert.equal(body.messages[0].role, 'system');
    assert.ok(body.messages[0].content.includes(prediction.raceName));
    assert.deepEqual(body.messages.slice(1), messages.slice(-8));
    return new Response(stream);
  });
  const response = await POST(new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ messages, prediction }) }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  assert.equal(await response.text(), stream);
  assert.equal(fetch.mock.callCount(), 1);
});

test('prediction rejects empty, malformed, and future cutoffs before fetching race data', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Invalid cutoff must not fetch'); });
  t.mock.method(console, 'error', () => {});
  for (const cutoff of ['', ' ', 'invalid', '2026-11-01T10:00:00', '9999-01-01T00:00:00Z']) {
    const response = await GET(new NextRequest(`http://localhost/api/prediction?${new URLSearchParams({ cutoff })}`));
    assert.equal(response.status, 400, `cutoff=${JSON.stringify(cutoff)}`);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('prediction API returns the model forecast before practice without an AI provider', async t => {
  const feeds = preWeekendFeeds();
  t.mock.method(Date, 'now', () => Date.parse('2026-10-28T12:00:00Z'));
  t.mock.method(globalThis, 'fetch', feeds.fetcher);
  const response = await GET(new NextRequest('http://localhost/api/prediction?season=2026&round=2'));
  assert.equal(response.status, 200);
  const prediction = await response.json();
  assert.equal(prediction.entryBasis, 'previous-race');
  assert.equal(prediction.ranking.length, 3);
  assert.ok(prediction.predictions.every(d => d.insight && Number.isFinite(d.score)));
  assert.ok(feeds.calls.every(url => ['api.jolpi.ca', 'api.openf1.org', 'api.open-meteo.com'].includes(new URL(url).host)));
});

test('calendar and classification reject invalid or incomplete race selections', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Invalid selection must not fetch'); });
  for (const query of ['season=', 'season=bad', 'season=2026', 'round=1', 'season=2026&round=', 'season=2026&round=0']) {
    assert.equal((await classification(new NextRequest(`http://localhost/api/delta/classification?${query}`))).status, 400);
  }
  for (const season of ['', '../2025', 'not-a-season']) assert.equal((await calendar(new NextRequest(`http://localhost/api/calendar?${new URLSearchParams({ season })}`))).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});
