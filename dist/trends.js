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

export function mountTrends(container) {
  const section = document.createElement('section');
  section.className = 'graphbox';
  const format = new Intl.NumberFormat('ko-KR');
  const points = wages.map(([year, value], index) => ({
    year, value, x:45+index*44, y:175-value/12000*150,
  }));
  const actual = points.slice(0,-1);
  const from = actual.at(-1);
  const next = points.at(-1);
  section.innerHTML = `<h3>최저임금 추이</h3>
    <p>2026년 시간당 <strong>10,320원</strong> · 2027년 고시 10,700원</p>
    <svg viewBox="0 0 560 210" role="img" aria-label="2016년부터 2027년까지 시간당 최저임금. 2027년 고시액은 점선.">
    ${[0,4000,8000,12000].map(value=>{const y=175-value/12000*150;return `<path d="M45 ${y}H540" stroke="currentColor" opacity=".18"/><text x="40" y="${y+4}" text-anchor="end" fill="currentColor" font-size="11">${format.format(value)}</text>`}).join('')}
    <polyline points="${actual.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="#286753" stroke-width="3"/>
    <path d="M${from.x} ${from.y}L${next.x} ${next.y}" stroke="#286753" stroke-width="3" stroke-dasharray="5 4"/>
    ${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3" fill="#286753"/>`).join('')}
    ${points.filter(p=>[2016,2020,2024,2027].includes(p.year)).map(p=>`<text x="${p.x}" y="195" text-anchor="middle" fill="currentColor" font-size="12">${p.year}</text>`).join('')}
    </svg>
    <p><a href="https://www.minimumwage.go.kr/minWage/policy/decisionMain.do" target="_blank" rel="noopener noreferrer">최저임금위원회</a></p>
    <details><summary>연도별 수치</summary><div class="tablewrap"><table><thead><tr><th>적용 연도</th><th>시간급</th></tr></thead><tbody>${wages.map(([year,value])=>`<tr><th scope="row">${year}${year===2027?' (고시)':''}</th><td>${format.format(value)}원</td></tr>`).join('')}</tbody></table></div></details>`;
  container.after(section);
  const employment = document.createElement('section');
  employment.className = 'graphbox';
  employment.innerHTML = `<h3>자영업 고용 변화</h3>
    <p>2026년 10월 · 2025년 10월 대비</p>
    <ul class="employment-change">${employmentChanges.map(([label,value])=>{
      const length = Math.abs(value)/1000;
      const start = value<0 ? 50-length : 50;
      return `<li><span>${label}</span><strong>${value>0?'+':'−'}${format.format(Math.abs(value))}명</strong>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <rect x="${start}" y="2" width="${length}" height="6" fill="${value<0?'#a84e32':'#286753'}"/>
          <line x1="50" y1="0" x2="50" y2="10" stroke="currentColor" stroke-width=".35"/>
        </svg></li>`;
    }).join('')}</ul>
    <p><a href="${sources.employmentBrief.url}" target="_blank" rel="noopener noreferrer">국가데이터처 고용동향</a></p>`;
  section.after(employment);
}
