export const wages = [
  [2016,6030],[2017,6470],[2018,7530],[2019,8350],
  [2020,8590],[2021,8720],[2022,9160],[2023,9620],
  [2024,9860],[2025,10030],[2026,10320],[2027,10700],
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
}
