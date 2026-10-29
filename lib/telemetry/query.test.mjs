import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTelemetryQuery } from './query.ts';

test('telemetry query preserves valid selections and defaults only absent values', () => {
  assert.deepEqual(parseTelemetryQuery(new URLSearchParams()), { source: 'auto', circuit: undefined });
  assert.deepEqual(parseTelemetryQuery(new URLSearchParams('source=openf1&session_key=123&driver=44&lap=2&circuit=monza')), { source: 'openf1', sessionKey: 123, driverNumber: 44, lap: 2, circuit: 'monza' });
});
test('invalid telemetry selections cannot silently become a different session or source', () => {
  for (const key of ['session_key', 'driver', 'lap']) {
    for (const value of ['', '0', '-1', '1.5', 'NaN', '9007199254740992']) assert.throws(() => parseTelemetryQuery(new URLSearchParams({ [key]: value })), /positive integer/);
  }
  for (const source of ['', 'invalid']) assert.throws(() => parseTelemetryQuery(new URLSearchParams({ source })), /source/);
});
