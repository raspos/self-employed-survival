// 자영업 데이터: 2024년 취재의 문제에서 출발해 세 장으로 이어 읽는 인포그래픽. 장마다 차트 형식과 배경이 다르다.
import { indicators, sources } from './content.js';
import { wages } from './trends.js';

const fmt = (n, d = 0) => n.toLocaleString('ko-KR', { maximumFractionDigits: d });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const ind = id => indicators.find(d => d.id === id);
const change = d => d.officialChange ?? (d.changeType === 'pp' ? d.after - d.before : (d.after / d.before - 1) * 100);
const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '');

const hook = (id, label) => `<p class="hook"><button type="button" data-story-link="${id}">2024년 취재 · ${label}</button></p>`;
function detail(srcKeys, defIds) {
  const src = srcKeys.map(k => `<span>${link(sources[k].url, sources[k].label)}${sources[k].published ? ` · 발표 ${sources[k].published}` : ''}</span>`).join('');
  const defs = defIds.map(id => `<p><b>${esc(ind(id).name)}</b> · ${esc(ind(id).beforePeriod)} → ${esc(ind(id).afterPeriod)}<br>${esc(ind(id).meaning)}</p>`).join('');
  return `<details class="data-defs"><summary>상세 정보</summary>${defs}<div class="chap-src">${src}</div></details>`;
}
const chapter = (cls, no, title, hookHtml, body, srcKeys, defIds) =>
  `<section class="chapter ${cls}"><div class="wrap"><p class="chap-no">${no}</p><h3>${title}</h3>${hookHtml}${body}${detail(srcKeys, defIds)}</div></section>`;

/* 01 매출: 증가율 막대(강조 1개)와 덤벨 */
function ch1() {
  const rows = [['외식 가맹점 평균 매출', ind('foodSales'), true], ['전체 가맹점 평균 매출', ind('franchiseSales')], ['전체 가맹점 수', ind('franchiseStores')]];
  const max = Math.max(...rows.map(([, d]) => change(d)));
  const rank = rows.map(([name, d, hot]) => `<div class="rk${hot ? ' hot' : ''}"><span>${name}</span><div class="bar"><i style="width:${change(d) / max * 100}%"></i></div><b>${sign(change(d))}${fmt(change(d), 1)}%</b></div>`).join('');
  const dumbbell = rows.map(([name, d]) => {
    const lo = Math.min(d.before, d.after) * .9, hi = Math.max(d.before, d.after) * 1.04, x = v => (v - lo) / (hi - lo) * 100;
    return `<div class="db"><span>${name}</span><div class="track"><i style="left:${x(d.before)}%;width:${x(d.after) - x(d.before)}%"></i><u style="left:${x(d.before)}%"></u><u class="now" style="left:${x(d.after)}%"></u></div><b>${fmt(d.before)} → ${fmt(d.after)}<small>${d.unit === '개' ? '개' : '백만원'}</small></b></div>`;
  }).join('');
  return chapter('c1', '01', '가게 매출은 늘었을까', hook('demand', '손님 없는 가게'),
    `<p class="takeaway">외식 가맹점의 평균 매출은 6.1% 늘었습니다.</p><div class="rank" role="img" aria-label="2023년 대비 2024년 증가율">${rank}</div><p class="cap">2023년 → 2024년 실적</p><div class="dbs">${dumbbell}</div>`,
    ['ftc2025'], ['foodSales', 'franchiseSales', 'franchiseStores']);
}

/* 02 비용: 큰 대비 수치, 범위 막대, 선 그래프 */
function wageSvg(width) {
  const h = Math.round(Math.min(320, Math.max(220, width * .5))), L = 54, R = 16, T = 30, B = 34, max = 12000;
  const X = i => L + i * (width - L - R) / (wages.length - 1), Y = v => T + (1 - v / max) * (h - T - B);
  const pts = wages.map(([year, value], i) => ({ year, value, x: X(i), y: Y(value) })), real = pts.slice(0, -1), last = pts.at(-1), prev = real.at(-1);
  const mark = pts.filter(p => [2024, 2026, 2027].includes(p.year));
  return `<svg viewBox="0 0 ${width} ${h}" role="img" aria-label="2016년부터 2027년까지 시간당 최저임금. 2027년 고시액은 점선.">
  ${[0, 4000, 8000, 12000].map(v => `<path d="M${L} ${Y(v)}H${width - R}" stroke="currentColor" opacity=".18"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" fill="currentColor" font-size="13">${fmt(v)}</text>`).join('')}
  <path d="M${real.map(p => `${p.x} ${p.y}`).join('L')}L${prev.x} ${Y(0)}L${real[0].x} ${Y(0)}Z" fill="#375B78" opacity=".12"/>
  <polyline points="${real.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#375B78" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M${prev.x} ${prev.y}L${last.x} ${last.y}" stroke="#375B78" stroke-width="3.5" stroke-dasharray="6 5"/>
  ${mark.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#fff" stroke="#AD352B" stroke-width="3"/><text x="${p.x}" y="${p.year === 2026 ? p.y + 26 : p.y - 12}" text-anchor="${p.year === 2027 ? 'end' : 'middle'}" fill="#171717" font-size="14" font-weight="700">${p.year} · ${fmt(p.value)}원</text>`).join('')}
  ${[2016, 2020, width < 420 ? 2023 : 2024].map(y => { const p = pts.find(q => q.year === y); return `<text x="${p.x}" y="${h - 10}" text-anchor="${y === 2016 ? 'start' : 'middle'}" fill="currentColor" font-size="13">${y}</text>`; }).join('')}
  </svg>`;
}
function ch2() {
  const x = v => v / 10 * 100, sup = ind('foodSupply'), sales = ind('foodSales');
  return chapter('c2', '02', '가게를 운영하는 데 드는 돈은 얼마나 늘었을까', hook('delivery', '배달 플랫폼 비용') + hook('rent', '월세를 못 내는 사장'),
    `<div class="vs"><div class="side"><span>외식 가맹점 평균 매출</span><strong>+${fmt(change(sales), 1)}%</strong></div><div class="side hot"><span>평균 차액가맹금</span><strong>+${fmt(change(sup), 1)}%</strong><em>${fmt(sup.before)} → ${fmt(sup.after)}백만원</em></div></div><p class="cap">2023년 → 2024년 실적</p>
    <h4 class="sub">배달 중개료</h4>
    <div class="rng" role="img" aria-label="배달 중개료율 비교"><div class="axis">${[0, 2, 4, 6, 8, 10].map(v => `<span style="left:${x(v)}%">${v}%</span>`).join('')}</div>
    <div class="line"><span>2024년 기본</span><div class="lane"><i class="pt" style="left:${x(9.8)}%"></i><b style="left:${x(9.8)}%">9.8%</b></div></div>
    <div class="line"><span>상생요금제 이후</span><div class="lane"><i class="band" style="left:${x(2)}%;width:${x(7.8) - x(2)}%"></i><b style="left:${x(2)}%">2.0%</b><b style="left:${x(7.8)}%">7.8%</b></div></div>
    <div class="line plus"><span>여기에 더해</span><div class="lane"><i class="add" style="left:0;width:100%"></i><b style="left:0">점주 배달비 · 결제료 · 광고비 별도</b></div></div></div>
    <h4 class="sub">최저임금은 10,320원에서 10,700원으로</h4><div class="wage" data-wage></div><p class="cap">원/시간 · 2027년은 고시액(점선)</p>`,
    ['ftc2025', 'delivery2024', 'baemin', 'coupangCurrent', 'wage24', 'wage26'], ['foodSupply', 'wage']);
}

/* 03 생존: 단위 차트, 와플, 양방향 막대 */
function squares(n) { const full = Math.floor(n); return Array.from({ length: 101 }, (_, i) => `<i class="${i < full ? 'on' : i === full ? 'part' : ''}" ${i === full ? `style="--p:${n - full}"` : ''}></i>`).join(''); }
function waffle(v) { return Array.from({ length: 100 }, (_, i) => `<i class="${i < Math.floor(v) ? 'on' : i === Math.floor(v) ? 'part' : ''}" ${i === Math.floor(v) ? `style="--p:${v - Math.floor(v)}"` : ''}></i>`).join(''); }
function ch3() {
  const c = ind('closure'), one = ind('one'), five = ind('five');
  const emp = [['고용원이 있는 자영업자', 15000], ['고용원이 없는 자영업자', 42000], ['무급가족종사자', -45000]];
  return chapter('c3 dark', '03', '얼마나 많은 가게가 살아남았을까', hook('closure', '가게를 닫는 데도 돈이 든다'),
    `<p class="takeaway">폐업 신고는 3.2% 줄었지만, 신생기업 100곳 중 5년을 넘기는 곳은 약 36곳입니다.</p>
    <div class="duo"><figure><div class="units">${squares(c.before)}</div><figcaption><b>${fmt(c.before, 1)}만 개</b>${c.beforePeriod}</figcaption></figure><figure><div class="units">${squares(c.after)}</div><figcaption><b>${fmt(c.after, 1)}만 개</b>${c.afterPeriod} · ${sign(change(c))}${fmt(Math.abs(change(c)), 1)}%</figcaption></figure></div><p class="cap">네모 하나는 폐업 사업자 1만 개입니다.</p>
    <div class="duo waf"><figure><div class="waffle">${waffle(one.after)}</div><figcaption><b>1년 뒤 ${fmt(one.after, 1)}곳</b>신생기업 100곳 중 · ${fmt(one.before, 1)} → ${fmt(one.after, 1)}</figcaption></figure><figure><div class="waffle">${waffle(five.after)}</div><figcaption><b>5년 뒤 ${fmt(five.after, 1)}곳</b>신생기업 100곳 중 · ${fmt(five.before, 1)} → ${fmt(five.after, 1)}</figcaption></figure></div>
    <h4 class="sub">혼자 일하는 가게가 늘었다</h4>
    <ul class="div">${emp.map(([n, v]) => `<li><span>${n}</span><div class="ax"><i class="${v < 0 ? 'dn' : 'up'}" style="width:${Math.abs(v) / 45000 * 50}%"></i></div><b class="${v < 0 ? 'neg' : 'pos'}">${sign(v)}${fmt(Math.abs(v))}명</b></li>`).join('')}</ul><p class="cap">2026년 10월 · 2025년 10월 대비</p>`,
    ['closures', 'survival', 'employmentBrief'], ['closure', 'one', 'five']);
}

export function mountDataStory(root) {
  root.innerHTML = ch1() + ch2() + ch3();
  const box = root.querySelector('[data-wage]');
  const draw = () => { box.innerHTML = wageSvg(Math.max(280, Math.round(box.getBoundingClientRect().width) || 340)); };
  draw();
  let last = box.getBoundingClientRect().width;
  new ResizeObserver(() => { const w = box.getBoundingClientRect().width; if (Math.abs(w - last) > 8) { last = w; draw(); } }).observe(box);
}
