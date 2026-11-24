import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation } from '../dist/simulation.js';
import { beginEpisodes, currentEpisode, decideEpisode } from '../dist/episodes.js';

function run(industry, seed, strategy, restore = false) {
  let state = createSimulation({ industry });
  beginEpisodes(state, seed);
  let turns = 0;
  while (!state.finished) {
    const event = currentEpisode(state);
    assert.ok(event);
    assert.ok(event.industry === '*' || event.industry === industry);
    assert.ok(++turns <= 18);
    if (restore) state = JSON.parse(JSON.stringify(state));
    decideEpisode(state, strategy(turns));
  }
  assert.equal(state.records.length, state.month);
  assert.equal(new Set(state.seen).size, state.seen.length);
  assert.ok(Math.abs(state.buffer + state.records.reduce((sum, row) => sum + row.flow, 0) - state.cash) < 1e-7);
  assert.ok(state.debt >= 0);
  return state;
}

test('saved episode and seed reproduce an uninterrupted playthrough', () => {
  const strategy = turn => turn % 2 ? 'a' : 'b';
  assert.deepEqual(run('cafe', 480, strategy, true), run('cafe', 480, strategy));
});

test('4,000 seeded runs settle the ledger and can reach either end state', () => {
  let closed = 0;
  for (const industry of ['chicken', 'cafe', 'store', 'snack']) {
    for (let seed = 0; seed < 1000; seed++) {
      const state = run(industry, seed, turn => (seed + turn) % 2 ? 'a' : 'b');
      closed += Number(state.closed);
    }
  }
  assert.ok(closed > 0 && closed < 4000);
});
