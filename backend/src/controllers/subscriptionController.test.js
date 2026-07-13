import test from 'node:test';
import assert from 'node:assert/strict';
import { addCycle, getMonthlyEquivalent } from './subscriptionController.js';

test('getMonthlyEquivalent returns expected normalized monthly amount', () => {
  assert.equal(getMonthlyEquivalent(120, 'monthly'), 120);
  assert.equal(getMonthlyEquivalent(1200, 'yearly'), 100);
  assert.equal(getMonthlyEquivalent(300, 'quarterly'), 100);
  assert.equal(getMonthlyEquivalent(70, 'weekly'), (70 * 52) / 12);
});

test('addCycle increments date according to billing cycle', () => {
  const base = new Date('2026-01-15T00:00:00.000Z');

  const weekly = addCycle(base, 'weekly');
  assert.equal(weekly.toISOString().slice(0, 10), '2026-01-22');

  const monthly = addCycle(base, 'monthly');
  assert.equal(monthly.toISOString().slice(0, 10), '2026-02-15');

  const quarterly = addCycle(base, 'quarterly');
  assert.equal(quarterly.toISOString().slice(0, 10), '2026-04-15');

  const yearly = addCycle(base, 'yearly');
  assert.equal(yearly.toISOString().slice(0, 10), '2027-01-15');
});
