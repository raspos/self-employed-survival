import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, close, transferShop, liquidation } from '../dist/simulation.js';
import { beginEpisodes, decideEpisode } from '../dist/episodes.js';
import { outcome, afterClosing } from '../dist/outcomes.js';

test('all 16 headlines are reachable through the simulation', () => {
  const endings = new Set();
  for (let seed=0; seed<4000; seed++) {
    const state=createSimulation({own:9000+seed*7,hours:28+seed%65,sales:1100+seed%3100,term:12+seed%84});
    beginEpisodes(state,seed);
    if(seed%19===0) transferShop(state,300);
    if(seed%11===0) close(state);
    while(!state.finished) decideEpisode(state,(state.month+seed)%2?'a':'b');
    endings.add(outcome(state));
  }
  for (const [input, exitEarly, seed=304] of [
    [{own:10000,hours:40,sales:7000},false],
    [{own:10000,hours:40,sales:7000},true],
    [{own:10000,hours:40,sales:2600,loan:15000},true],
    [{own:30000,sales:2104,hours:55},false,154],
  ]) {
    const state = createSimulation(input);
    beginEpisodes(state,seed);
    for(let turn=0;!state.finished;turn++) {
      if(exitEarly && turn===2) close(state);
      else decideEpisode(state,'a');
    }
    endings.add(outcome(state));
  }
  assert.equal(endings.size,16,[...endings].join(' / '));
});

test('sale proceeds replace salvage and the debt principal is settled once', () => {
  const state = createSimulation();
  const prior = liquidation(state);
  assert.equal(transferShop(state,600),true);
  assert.equal(transferShop(state,1200),false);
  const settlement = liquidation(state);
  assert.equal(settlement.net,prior.net-prior.salvage+600+prior.demolition);
  const projection = afterClosing({...state,rate:0,living:0},settlement,0,12,12);
  assert.equal(projection.liquid,settlement.net);
  assert.equal(projection.debt,0);
});
