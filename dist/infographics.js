// 실제 취재 화면의 설명 도표. 장부·청산은 게임 엔진의 기본 조건(치킨, 자본 1억원, 대출 3천만원) 계산값을 그대로 쓴다.
import { createSimulation, calculateMonth, liquidation, close } from './simulation.js';

const fmt = n => Math.round(Math.abs(n)).toLocaleString('ko-KR');
const money = n => `${n < 0 ? '−' : ''}${fmt(n)}만원`;
const base = () => createSimulation({ industry: 'chicken', own: 10000, loan: 3000 });

// 막대 폭포(워터폴): 각 단계가 어디서 어디까지 움직였는지를 한 줄 막대로 보여준다.
function waterfall(steps) {
  let run = 0;
  const rows = steps.map(([label, v, type]) => {
    let from, to;
    if (type === 'start') { from = 0; to = v; run = v; }
    else if (type === 'minus') { from = run - v; to = run; run -= v; }
    else if (type === 'plus') { from = run; to = run + v; run += v; }
    else { from = Math.min(0, run); to = Math.max(0, run); }
    return { label, v, type, from, to, run };
  });
  const lo = Math.min(0, ...rows.map(r => r.from)), hi = Math.max(...rows.map(r => r.to)), span = hi - lo || 1, pos = x => (x - lo) / span * 100;
  const zero = pos(0);
  return `<div class="wfh-chart">${rows.map(r => {
    const val = r.type === 'minus' ? `−${fmt(r.v)}` : r.type === 'plus' ? `+${fmt(r.v)}` : `${r.run < 0 ? '−' : ''}${fmt(r.run)}`;
    const cls = r.type === 'subtotal' || r.type === 'result' ? (r.run < 0 ? 'res neg' : 'res pos') : r.type;
    return `<div class="wfh ${cls}"><span class="l">${r.label}</span><div class="t"><u style="left:${zero}%"></u><i style="left:${pos(r.from)}%;width:${Math.max(.6, pos(r.to) - pos(r.from))}%"></i></div><b>${val}</b></div>`;
  }).join('')}</div>`;
}

export function cashflowSteps() {
  const r = calculateMonth(base(), 1, 1);
  return {
    r,
    steps: [['매출', r.sales, 'start'], ['운영비·감가상각', r.sales - r.operating, 'minus'], ['영업이익', 0, 'subtotal'], ['이자', r.interest, 'minus'], ['원금 상환', r.principal, 'minus'], ['세금·부가세', r.tax + r.vat, 'minus'], ['생활비', r.living, 'minus'], ['감가상각(현금 지출 아님)', r.depreciation, 'plus'], ['통장 현금의 변화', 0, 'result']],
  };
}
export function cashflow() {
  const { r, steps } = cashflowSteps();
  return `<figure class="info"><figcaption><b>한 달 장부</b>치킨 20평 · 게임 기본 조건 · 개업 첫 달, 만원</figcaption>${waterfall(steps)}<p class="info-take">영업이익은 ${money(r.operating)}이지만 통장 현금은 ${money(r.flow)} 움직입니다.</p></figure>`;
}

export function closureSteps() {
  const s = base(); close(s);
  return liquidation(s);
}
export function closureChart() {
  const l = closureSteps();
  return `<figure class="info"><figcaption><b>가게를 닫으면</b>치킨 20평 · 게임 기본 조건 · 개업 직후 정리한다면, 만원</figcaption>${waterfall([['현금', l.cash, 'start'], ['돌려받는 보증금', l.recoveredDeposit, 'plus'], ['시설 처분', l.salvage, 'plus'], ['남은 대출', l.debt, 'minus'], ['철거·원상복구', l.demolition, 'minus'], ['계약 해지', l.termination, 'minus'], ['다음 출발의 자금', 0, 'result']])}<p class="info-take">정리 비용을 모두 치르면 ${money(l.net)}가 남습니다.</p></figure>`;
}

// 프랜차이즈 비용: 내는 돈과 돌려받는 돈이 시간 순서로 나타난다.
export function franchiseTimeline() {
  const s = base(), dep = s.deposit + s.franchiseDeposit, roy = s.sales * s.royalty, exit = s.termination + s.demolition;
  const node = (when, name, value, unit, kind) => `<li class="${kind}"><span class="when">${when}</span><b>${value}<small>${unit}</small></b><em>${name}</em></li>`;
  return `<ol class="ftl" aria-label="프랜차이즈 비용의 시간 순서">${node('가입할 때', '가맹비·교육비', fmt(s.entry), '만원', 'pay')}${node('가입할 때', '보증금 (돌려받는 돈)', fmt(dep), '만원', 'back')}${node('매달', '로열티 (월 매출의 ' + Math.round(s.royalty * 100) + '%)', fmt(roy), '만원', 'pay')}${node('정리할 때', '해지·원상복구', fmt(exit), '만원', 'pay')}</ol><p class="legend-line"><i class="pay"></i>내는 돈 <i class="back"></i>돌려받는 돈 · 치킨 20평 게임 기본 조건</p>`;
}

// 점주 노동시간: 법정 기준과 비교
export function laborBars() {
  const rows = [['직장인 법정 기준', 40], ['법정 상한(연장 포함)', 52], ['이 게임의 점주 기본', 60]], max = 60;
  return `<figure class="info"><figcaption><b>일주일에 일하는 시간</b>시간</figcaption><div class="lab-bars">${rows.map(([n, v], i) => `<div class="lb${i === 2 ? ' hot' : ''}"><span>${n}</span><div class="t"><i style="width:${v / max * 100}%"></i></div><b>${v}<small>시간</small></b></div>`).join('')}</div></figure>`;
}

// 수요·경쟁 도식: 같은 거리에서 손님과 점포가 어떻게 바뀌는지
const person = c => `<svg class="pp" viewBox="0 0 20 28" aria-hidden="true"><circle cx="10" cy="7" r="5.5" fill="${c}"/><path d="M1 28v-9a9 9 0 0 1 18 0v9z" fill="${c}"/></svg>`;
const shop = c => `<svg class="sh" viewBox="0 0 30 26" aria-hidden="true"><path d="M2 8h26l-3-7H5z" fill="${c}"/><rect x="4" y="9" width="22" height="16" fill="none" stroke="${c}" stroke-width="2.5"/><rect x="12" y="15" width="6" height="10" fill="${c}"/></svg>`;
export function streetFlow() {
  const A = '#e0a458', B = '#375B78', R = '#AD352B', G = '#9a948a';
  const old = Array.from({ length: 12 }, () => person('#8f6a2e')).join('');
  const now = Array.from({ length: 4 }, () => person('#8f6a2e')).join('') + Array.from({ length: 4 }, () => person(B)).join('');
  const shops = Array.from({ length: 3 }, () => shop(G)).join('') + Array.from({ length: 3 }, () => shop(R)).join('');
  return `<div class="street" role="img" aria-label="학생·고시생 수요가 줄고 점포가 늘어 매출과 고정비의 간격이 벌어지는 과정">
  <div class="st"><span class="n">1</span><div class="ic">${old}</div><b>학생·고시생 수요</b></div>
  <div class="ar"><span>문화·인구·상권의 변화</span></div>
  <div class="st"><span class="n">2</span><div class="ic">${now}</div><b>같은 거리, 달라진 고객</b></div>
  <div class="ar"><span>점포 사이의 경쟁</span></div>
  <div class="st"><span class="n">3</span><div class="ic">${shops}</div><b>더 많은 점포가 같은 손님을 나눈다</b></div>
  <div class="ar"><span>그래서</span></div>
  <div class="st gap"><span class="n">4</span><svg viewBox="0 0 220 120" class="gapchart" aria-hidden="true"><path d="M10 28L210 92V40L10 40z" fill="${R}" opacity=".18"/><path d="M10 28L210 92" stroke="${R}" stroke-width="4" fill="none"/><path d="M10 40H210" stroke="${B}" stroke-width="4" fill="none" stroke-dasharray="8 6"/><circle cx="10" cy="28" r="5" fill="${R}"/><circle cx="210" cy="92" r="5" fill="${R}"/></svg><div class="gl"><span class="s1">매출</span><span class="s2">고정비</span></div><b>매출과 고정비의 간격</b></div>
  </div>`;
}
