import test from 'node:test';
import assert from 'node:assert/strict';
import { profiles, createSimulation, calculateMonth, totals } from '../dist/simulation.js';
import { beginEpisodes, decideEpisode } from '../dist/episodes.js';

test('delivery share default follows the industry, explicit input still wins', () => {
  assert.equal(createSimulation({ industry: 'store', own: 30000 }).deliveryShare, 5);
  assert.equal(createSimulation({ industry: 'chicken', own: 30000 }).deliveryShare, 40);
  assert.equal(createSimulation({ industry: 'store', own: 30000, deliveryShare: 40 }).deliveryShare, 40);
});

test('no industry is structurally doomed at 200M won (seeded runs)', () => {
  for (const industry of Object.keys(profiles)) {
    let survived = 0; const N = 120;
    for (let seed = 1; seed <= N; seed++) {
      const s = createSimulation({ industry, own: 20000, loan: 3000 });
      beginEpisodes(s, seed);
      while (!s.finished) decideEpisode(s, seed % 2 ? 'a' : 'b');
      assert.ok(Number.isFinite(totals(s).recovery));
      if (!s.closed) survived++;
    }
    const rate = survived / N;
    assert.ok(rate > 0.5, `${industry} survival ${rate}`);
  }
});

test('convenience store default month is not made loss-making by delivery fees', () => {
  const s = createSimulation({ industry: 'store', own: 20000 });
  assert.ok(calculateMonth(s, 1, 1).operating > 0);
});
