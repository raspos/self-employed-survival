// 경제 모델 편향 분석: 업종·자본·상권·전략 조합을 시드 반복 실행해 요약한다. 결과는 artifacts/bias-analysis.json 과 콘솔.
import fs from 'node:fs';
import { profiles, areas, createSimulation, totals, close } from '../dist/simulation.js';
import { beginEpisodes, decideEpisode } from '../dist/episodes.js';
const N = Number(process.env.N || 200);
const strategies = {
  always_a: (t) => 'a',
  always_b: (t) => 'b',
  alternate: (t, s) => ((t + s) % 2 ? 'a' : 'b'),
  random: (t, s) => (((s * 2654435761 + t * 40503) >>> 7) & 1 ? 'a' : 'b'),
  exit_at_3: null, exit_at_12: null,
};
const rows = [], infeasible = [];
let sims = 0;
for (const industry of Object.keys(profiles)) for (const own of [5000, 10000, 20000]) for (const area of Object.keys(areas)) for (const [name, fn] of Object.entries(strategies)) {
  try { createSimulation({ industry, own, area, loan: own >= 10000 ? Math.round(own * 0.3) : 0 }); } catch { infeasible.push([industry, own, area].join('/')); continue; }
  const rec = [], hourly = [], months = []; let survived = 0, closedEarly = 0;
  for (let seed = 1; seed <= N; seed++) {
    const s = createSimulation({ industry, own, area, loan: own >= 10000 ? Math.round(own * 0.3) : 0 });
    beginEpisodes(s, seed);
    const exitAt = name === 'exit_at_3' ? 3 : name === 'exit_at_12' ? 12 : null;
    for (let t = 0; !s.finished; t++) {
      if (exitAt !== null && t === exitAt) close(s); else decideEpisode(s, (fn || strategies.always_a)(t, seed));
    }
    const T = totals(s); sims++;
    if (!Number.isFinite(T.recovery) || !Number.isFinite(T.hourly)) throw Error(`NaN ${industry} ${own} ${area} ${name} ${seed}`);
    rec.push(T.recovery); hourly.push(T.hourly); months.push(s.month);
    if (s.month >= 36 && !s.closed) survived++; else closedEarly++;
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  rows.push({ industry, own, area, strategy: name, survivePct: +(100 * survived / N).toFixed(1), recoveryRatioMedian: +med(rec).toFixed(2), hourlyMedian: Math.round(med(hourly)), monthsMean: +mean(months).toFixed(1) });
}
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/bias-analysis.json', JSON.stringify(rows));
const group = (key) => { const m = {}; for (const r of rows) (m[r[key]] ||= []).push(r); return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { survivePct: +(v.reduce((a, r) => a + r.survivePct, 0) / v.length).toFixed(1), recoveryMedian: +(v.reduce((a, r) => a + r.recoveryRatioMedian, 0) / v.length).toFixed(2), hourlyMedian: Math.round(v.reduce((a, r) => a + r.hourlyMedian, 0) / v.length) }])); };
console.log('simulations', sims, 'infeasible', [...new Set(infeasible)]);
for (const k of ['industry', 'own', 'area', 'strategy']) { console.log('--', k); console.table(group(k)); }
