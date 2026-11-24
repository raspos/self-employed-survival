import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatKind } from '../dist/event-format.js';
import { profiles, createSimulation } from '../dist/simulation.js';
import { beginEpisodes, currentEpisode, decideEpisode } from '../dist/episodes.js';

const html = fs.readFileSync('dist/index.html', 'utf8');
const files = fs.readdirSync('dist').filter(f => f.endsWith('.js'));

test('every element id used by the scripts exists in index.html or is created in JS', () => {
  const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const created = new Set();
  const used = new Set();
  for (const f of files) {
    const src = fs.readFileSync('dist/' + f, 'utf8');
    for (const m of src.matchAll(/(?:\$|getElementById)\(\s*['"]([A-Za-z][\w-]*)['"](?!\s*\+)/g)) used.add(m[1]);
    for (const m of src.matchAll(/\bid\s*=\s*['"]([A-Za-z][\w-]*)['"]|\bid:\s*'([A-Za-z][\w-]*)'|id="([A-Za-z][\w-]*)"/g)) created.add(m[1] || m[2] || m[3]);
  }
  const missing = [...used].filter(id => !htmlIds.has(id) && !created.has(id));
  assert.deepEqual(missing, []);
});

test('every event channel maps to a presentation format', () => {
  const channels = new Set();
  for (const industry of Object.keys(profiles)) {
    for (let seed = 1; seed <= 150; seed++) {
      const s = createSimulation({ industry, own: 30000 });
      beginEpisodes(s, seed);
      while (!s.finished) { const e = currentEpisode(s); if (e) channels.add(e.channel); decideEpisode(s, seed % 2 ? 'a' : 'b'); }
    }
  }
  const plain = [...channels].filter(c => formatKind(c) === 'plain');
  assert.deepEqual(plain, []);
  assert.ok(channels.size >= 20);
});

test('page has no decorative English headings left in markup', () => {
  for (const word of ['SURVIVE', 'DAY 0', 'INTERACTIVE JOURNALISM', 'CHOOSE YOUR BRAND', 'READ THE LEDGER', 'THE FINAL REPORT', 'THE NEXT CHAPTER']) {
    assert.ok(!html.includes(word) && !files.some(f => fs.readFileSync('dist/' + f, 'utf8').includes(word)), word);
  }
});

test('no body text below 12px is declared in the stylesheet', () => {
  const css = fs.readFileSync('dist/editorial.css', 'utf8');
  const sizes = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));
  assert.ok(sizes.every(n => n >= 12), sizes.filter(n => n < 12).join());
});
