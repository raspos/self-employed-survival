import { totals } from './simulation.js';

export function outcome(state, result = totals(state)) {
  const { investmentReturn: gain, netIncome, hours } = result;
  const weekly = hours / Math.max(1, state.month) * 12 / 52;
  const last = state.records.at(-1);
  const voluntary = state.reason.startsWith('자발적');
  if (state.closed) {
    if (voluntary && gain >= 0) return '자본을 회수하고 가게를 닫았다';
    if (voluntary && weekly >= 65) return '긴 영업 끝에 문을 닫았다';
    if (voluntary && state.debt > state.own / 3) return '대출을 남기고 영업을 정리했다';
    if (voluntary) return '여기서 가게를 정리하기로 했다';
    if (result.operating > 0) return '장부는 흑자, 통장은 바닥';
    if (state.month <= 6) return '첫 반년을 넘기지 못했다';
    return '운영자금이 떨어져 문을 닫았다';
  }
  if (gain > state.own / 2 && weekly < 60) return '시간과 자본을 함께 지켰다';
  if (gain > 0 && weekly >= 65) return '돈을 벌었지만 일은 길었다';
  if (gain > 0 && state.debt < 1) return '빚을 갚고 자본을 늘렸다';
  if (gain > state.own / 4) return '창업 자본을 불렸다';
  if (gain >= 0) return '3년 끝에 창업 자본을 지켰다';
  if (netIncome > 0) return '이익을 냈지만 투자금은 줄었다';
  if (last?.netIncome > 0) return '마지막 달에 흑자로 돌아섰다';
  return '3년을 버텼지만 자본은 줄었다';
}

export function comparison(state, annualSalary, result = totals(state)) {
  const years = state.month / 12;
  const wageIncome = annualSalary * years * (1 - state.taxRate / 100);
  const wageHours = years * 52 * 40;
  const wageAssets = wageIncome - state.living * state.month +
    state.own * ((1 + state.capitalRate / 100) ** years - 1);
  const ownerIncome = result.netIncome - state.own * state.capitalRate / 100 * years;
  return [
    ['누적 노동소득', ownerIncome, wageIncome, '만원'],
    ['노동시간', result.hours, wageHours, '시간'],
    ['시간당 노동소득', result.hours ? ownerIncome * 10000 / result.hours : 0, wageHours ? wageIncome * 10000 / wageHours : 0, '원'],
    ['초기 자본 대비 순자산 변화', result.investmentReturn, wageAssets, '만원'],
    ['정산 전 대출 잔액', state.debt, 0, '만원'],
  ];
}

export function renderOutcome(state, result) {
  document.getElementById('resultTitle').textContent = outcome(state, result);
  document.getElementById('resultMessage').textContent = `${state.p.name} · ${state.month}개월 · ${state.reason}`;
  let panel = document.getElementById('salaryComparison');
  if (!panel) {
    panel = document.createElement('details');
    panel.id = 'salaryComparison';
    panel.className = 'assumptions';
    document.getElementById('extendedResults').after(panel);
  }
  const fmt = value => Math.round(value).toLocaleString('ko-KR');
  panel.innerHTML = '<summary>직장인으로 남았다면</summary><label>세전 연봉 (만원) <input type="number" min="0" max="100000" step="100"></label><div class="tablewrap"></div><details><summary>비교 기준</summary><p>같은 기간·생활비·소득세율을 적용합니다. 직장인은 주 40시간 근무하며 초기 자본을 설정한 연 수익률로 운용합니다. 가게의 노동소득은 세후 사업소득에서 자기자본 기회비용을 뺀 값입니다. 가게 순자산은 청산 기준입니다.</p></details>';
  const field = panel.querySelector('input');
  const table = panel.querySelector('.tablewrap');
  field.value = state.annualSalary ?? 4200;
  const draw = () => {
    if (!field.value || !field.checkValidity()) return;
    const rows = comparison(state, Number(field.value), result);
    table.innerHTML = '<table><thead><tr><th>항목</th><th>내 가게</th><th>직장인</th></tr></thead><tbody>' +
      rows.map(([name, owner, worker, unit]) => `<tr><th scope="row">${name}</th><td>${fmt(owner)}${unit}</td><td>${fmt(worker)}${unit}</td></tr>`).join('') +
      '</tbody></table>';
  };
  field.oninput = draw;
  draw();
}
