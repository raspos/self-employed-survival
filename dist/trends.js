export const wages = [
  [2016,6030],[2017,6470],[2018,7530],[2019,8350],
  [2020,8590],[2021,8720],[2022,9160],[2023,9620],
  [2024,9860],[2025,10030],[2026,10320],[2027,10700],
];

import { sources } from './content.js';

const employmentChanges = [
  ['고용원이 있는 자영업자', 15000],
  ['고용원이 없는 자영업자', 42000],
  ['무급가족종사자', -45000],
];
const format = new Intl.NumberFormat('ko-KR');

// 글자 크기가 화면 폭에 따라 줄지 않도록 viewBox 폭을 실제 표시 폭에 맞춘다.
function wageChart(width) {
  const height = Math.round(Math.min(300, Math.max(200, width * .56))), L = 54, R = 14, T = 14, B = 34, max = 12000;
  const x = i => L + i * (width - L - R) / (wages.length - 1), y = v => T + (1 - v / max) * (height - T - B);
  const points = wages.map(([year, value], i) => ({ year, value, x: x(i), y: y(value) }));
  const actual = points.slice(0, -1), from = actual.at(-1), next = points.at(-1);
  const years = width < 420 ? [2016, 2022, 2027] : [2016, 2020, 2024, 2027];
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="2016년부터 2027년까지 시간당 최저임금. 2027년 고시액은 점선.">
    ${[0, 4000, 8000, 12000].map(v => `<path d="M${L} ${y(v)}H${width - R}" stroke="currentColor" opacity=".18"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" fill="currentColor" font-size="12">${format.format(v)}</text>`).join('')}
    <polyline points="${actual.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#375B78" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${from.x} ${from.y}L${next.x} ${next.y}" stroke="#375B78" stroke-width="3" stroke-dasharray="5 4"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#375B78"/>`).join('')}
    ${points.filter(p => years.includes(p.year)).map(p => `<text x="${p.x}" y="${height - 10}" text-anchor="${p.year === 2027 ? 'end' : p.year === 2016 ? 'start' : 'middle'}" fill="currentColor" font-size="12">${p.year}</text>`).join('')}
    <text x="${next.x}" y="${next.y - 10}" text-anchor="end" fill="currentColor" font-size="12" font-weight="700">10,700원</text>
    </svg>`;
}

export function mountTrends(container) {
  const section = document.createElement('section');
  section.className = 'data-block';
  section.innerHTML = `<h3>최저임금은 2027년 시간당 10,700원</h3>
    <p class="fine">2026년 10,320원 · 2027년 고시액은 점선 · 단위 원/시간</p>
    <div class="chart-wrap" data-wage></div>
    <p class="fine"><a href="https://www.minimumwage.go.kr/minWage/policy/decisionMain.do" target="_blank" rel="noopener noreferrer">최저임금위원회 ↗</a></p>
    <details><summary>연도별 수치</summary><div class="tablewrap"><table><thead><tr><th>적용 연도</th><th>시간급</th></tr></thead><tbody>${wages.map(([year, value]) => `<tr><th scope="row">${year}${year === 2027 ? ' (고시)' : ''}</th><td>${format.format(value)}원</td></tr>`).join('')}</tbody></table></div></details>`;
  container.after(section);
  const draw = () => { const box = section.querySelector('[data-wage]'); box.innerHTML = wageChart(Math.max(280, Math.round(box.getBoundingClientRect().width) || 340)); };
  draw();
  let last = section.getBoundingClientRect().width;
  new ResizeObserver(() => { const w = section.getBoundingClientRect().width; if (Math.abs(w - last) > 8) { last = w; draw(); } }).observe(section);
  const employment = document.createElement('section');
  employment.className = 'data-block';
  const peak = Math.max(...employmentChanges.map(([, v]) => Math.abs(v)));
  employment.innerHTML = `<h3>자영업자 종사자 구성이 바뀌었습니다</h3>
    <p class="fine">2026년 10월 · 2025년 10월 대비 증감</p>
    <ul class="employment-change">${employmentChanges.map(([label, value]) => {
      const share = Math.abs(value) / peak * 50;
      return `<li><span>${label}</span><strong class="${value < 0 ? 'neg' : 'pos'}">${value > 0 ? '+' : '−'}${format.format(Math.abs(value))}명</strong>
        <div class="axis" aria-hidden="true"><i class="${value < 0 ? 'down' : 'up'}" style="width:${share}%"></i></div></li>`;
    }).join('')}</ul>
    <p class="fine"><a href="${sources.employmentBrief.url}" target="_blank" rel="noopener noreferrer">국가데이터처 고용동향 ↗</a></p>`;
  section.after(employment);
}
