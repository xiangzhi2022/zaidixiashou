import test from 'node:test';
import assert from 'node:assert/strict';
import { HealthController } from './health.controller.js';

test('HealthController returns ok status', () => {
  const controller = new HealthController();
  assert.deepEqual(controller.health(), { status: 'ok' });
});

