import { totals } from './simulation.js';
import { environments } from './environments.js';

export function outcome(state, result = totals(state)) {
  const { investmentReturn: gain, netIncome, hours } = result;
  const weekly = hours / Math.max(1, state.month) * 12 / 52;
  const last = state.records.at(-1);
  const voluntary = state.reason.startsWith('자발적');
  if (state.reason === '매장 양도') return '가게를 넘기고 새 출발';
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
  const ownerIncome = result.netIncome - (state.own-(state.householdReserve??0)) * state.capitalRate / 100 * years;
  return [
    ['누적 노동소득', ownerIncome, wageIncome, '만원'],
    ['노동시간', result.hours, wageHours, '시간'],
    ['추가 휴무일', state.restDays ?? 0, 0, '일'],
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
  let prior = document.getElementById('priorRun');
  if (!prior) {
    prior = document.createElement('p');
    prior.id = 'priorRun';
    panel.before(prior);
  }
  const old = state.previousRun;
  prior.hidden = !old;
  prior.textContent = old ? `지난 운영 ${environments[old.environment]?.label ?? ''} · ${old.months}개월 · 청산액 ${fmtPrior(old.equity)}만원 → 이번 ${fmtPrior(result.liquidation.net)}만원` : '';
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
  renderShare(state, result);
  renderAfterClosing(state, result.liquidation);
}

export function afterClosing(state, settlement, salary, searchMonths, repaymentMonths, options = {}) {
  let liquid = settlement.net + settlement.debt + (state.householdCash??0);
  let debt = settlement.debt;
  const principal = debt / repaymentMonths;
  const monthlyWage = salary / 12 * (1 - state.taxRate / 100);
  const rate = options.rate ?? state.rate;
  const graceMonths = options.graceMonths ?? 0;
  let shortageMonth = liquid < 0 ? 0 : null;
  for (let month = 1; month <= 12; month++) {
    const payment = month > graceMonths ? Math.min(debt, principal) : 0;
    const interest = debt * rate / 1200;
    liquid += (month > searchMonths ? monthlyWage : 0) - state.living - payment - interest;
    debt -= payment;
    if (liquid < 0 && shortageMonth === null) shortageMonth = month;
  }
  return { liquid, debt:Math.max(0,debt), shortageMonth };
}

function renderAfterClosing(state, settlement) {
  let panel = document.getElementById('afterClosing');
  if (!panel) {
    panel = document.createElement('details');
    panel.id = 'afterClosing';
    panel.className = 'assumptions';
    document.getElementById('salaryComparison').after(panel);
  }
  panel.hidden = !state.closed;
  if (!state.closed) return;
  panel.innerHTML = '<summary>영업 종료 후 1년</summary><label>재취업 세전 연봉 (만원) <input type="number" min="0" max="100000"></label> <label>구직 기간 (개월) <input type="number" min="0" max="12" value="3"></label> <label>가정한 원금 상환 기간 (개월) <input type="number" min="1" max="360" value="36"></label><p aria-live="polite"></p><details><summary>계산 기준</summary><p>구직 기간 소득은 0원. 영업 종료 시점의 이자율·생활비·실효세율을 적용합니다. 남은 대출을 유지할 수 있다고 가정하고 원금을 균등 상환합니다.</p></details>';
  const fields = Array.from(panel.querySelectorAll('input'));
  fields[0].value = state.annualSalary ?? 4200;
  const draw = () => {
    if (fields.some(field => field.value === '' || !field.checkValidity())) return;
    const [salary, searchMonths, repaymentMonths] = fields.map(field => Number(field.value));
    const projection = afterClosing(state, settlement, salary, searchMonths, repaymentMonths);
    const shortage = projection.shortageMonth === null ? '' : ` · 현금 부족 ${projection.shortageMonth}개월 차`;
    panel.querySelector('p').textContent = `12개월 뒤 현금 ${fmtPrior(projection.liquid)}만원 · 남은 원금 ${fmtPrior(projection.debt)}만원${shortage}`;
  };
  panel.oninput = draw;
  draw();
  if (settlement.debt > 0) {
    const adjustment = document.createElement('details');
    adjustment.innerHTML = '<summary>채무조정 조건 비교</summary><label>가정한 연이율 (%) <input type="number" min="0" max="30" step="0.1"></label> <label>원금 거치 기간 (개월) <input type="number" min="0" max="12" value="0"></label><p aria-live="polite"></p><p>거치 중에도 이자는 냅니다. 원금 감면과 지원 자격 심사는 포함하지 않습니다.</p><a href="https://www.newstartfund.or.kr/Contents/Prod.do" target="_blank" rel="noopener noreferrer">새출발기금 지원 대상·조건</a>';
    panel.append(adjustment);
    const [rate,grace]=adjustment.querySelectorAll('input');
    rate.value=state.rate;
    const baseDraw=panel.oninput;
    panel.oninput = () => {
      baseDraw();
      if ([...fields,rate,grace].some(field=>field.value===''||!field.checkValidity())) return;
      const [salary, searchMonths, repaymentMonths]=fields.map(field=>Number(field.value));
      const baseline=afterClosing(state,settlement,salary,searchMonths,repaymentMonths);
      const revised=afterClosing(state,settlement,salary,searchMonths,repaymentMonths,{
        rate:Number(rate.value),graceMonths:Number(grace.value),
      });
      const delta=revised.liquid-baseline.liquid;
      adjustment.querySelector('p').textContent=`12개월 뒤 현금 ${fmtPrior(revised.liquid)}만원 (기본 대비 ${delta>0?'+':''}${fmtPrior(delta)}만원) · 남은 원금 ${fmtPrior(revised.debt)}만원`;
    };
    panel.oninput();
  }
}

const fmtPrior = value => Math.round(value).toLocaleString('ko-KR');

const SERIF = "'Noto Serif KR','Nanum Myeongjo','Batang',serif";
const SANS = "'Noto Sans KR','Malgun Gothic',sans-serif";
const INK = '#f2ebe0', SUB = '#c4b9a9', LINE = '#4a3f35', BRAND = '#f09a8e', POS = '#8fc79a', PAPER = '#1b1714', AMBER = '#e0a458';
const won = n => `${n < 0 ? '−' : ''}${Math.round(Math.abs(n)).toLocaleString('ko-KR')}만원`;
const eok = n => { const a = Math.round(Math.abs(n)), e = Math.floor(a / 10000), m = a % 10000; return (n < 0 ? '−' : '') + (e ? `${e.toLocaleString('ko-KR')}억${m ? ` ${m.toLocaleString('ko-KR')}만원` : '원'}` : `${m.toLocaleString('ko-KR')}만원`); };

function wrap(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '', lines = 0;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) { ctx.fillText(line, x, y + lines * lineHeight); line = word; lines++; } else line = trial;
  }
  ctx.fillText(line, x, y + lines * lineHeight);
  return y + (lines + 1) * lineHeight;
}

// 매출 100만원당 비용 구성(사업 기준). 막대 하나로 보여준다.
function costShares(state) {
  const sum = k => state.records.reduce((a, r) => a + r[k], 0), rev = sum('sales') || 1;
  const parts = [['원재료', sum('material')], ['인건비', sum('wages')], ['임대료', sum('rent')], ['수수료·기타', sum('delivery') + sum('card') + sum('royalty') + sum('other') + sum('depreciation') + sum('interest') + sum('tax') + sum('vat')]]
    .map(([name, v]) => [name, v / rev * 100]);
  const left = 100 - parts.reduce((a, p) => a + p[1], 0);
  return { parts, left };
}

export function drawShareCard(canvas, state, result, address) {
  const W = 1080, H = canvas.height, M = 72, ctx = canvas.getContext('2d');
  const gap = result.liquidation.net - state.own;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = AMBER; ctx.fillRect(M, 64, W - M * 2, 8);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK; ctx.font = `900 40px ${SERIF}`; ctx.fillText('대한민국 자영업자로 살아남기', M, 132);
  ctx.fillStyle = SUB; ctx.font = `500 26px ${SANS}`; ctx.textAlign = 'right'; ctx.fillText('가상 시뮬레이션 결과', W - M, 132); ctx.textAlign = 'left';
  ctx.fillStyle = LINE; ctx.fillRect(M, 156, W - M * 2, 2);
  ctx.fillStyle = SUB; ctx.font = `500 30px ${SANS}`;
  ctx.fillText(`${state.p.name} · ${state.a.name} · ${state.month}개월 운영`, M, 212);
  const tall = H > 1100, title = outcome(state, result);
  let size = tall ? 84 : 76;
  ctx.font = `900 ${size}px ${SERIF}`;
  if (!tall && ctx.measureText(title).width > W - M * 2) size = 62;
  ctx.fillStyle = gap >= 0 ? POS : BRAND; ctx.font = `900 ${size}px ${SERIF}`;
  let y = wrap(ctx, title, M, 316, W - M * 2, Math.round(size * 1.28));
  ctx.fillStyle = INK; ctx.font = `500 34px ${SERIF}`;
  y = wrap(ctx, `${state.month >= 36 ? '3년' : `${state.month}개월`} 동안 ${eok(result.revenue)}을 팔았습니다.`, M, y + 20, W - M * 2, 50);
  const cells = [
    ['청산 후 회수 자본', won(result.liquidation.net), gap >= 0 ? POS : BRAND],
    ['누적 노동시간', `${Math.round(result.hours).toLocaleString('ko-KR')}시간`, INK],
    ['남은 대출', won(state.debt), INK],
    ['실질시급', `${Math.round(result.hourly).toLocaleString('ko-KR')}원`, INK],
  ];
  const top = Math.max(y + 30, tall ? 640 : 0), colW = (W - M * 2) / 2, pitch = tall ? 150 : 118;
  cells.forEach(([label, value, color], i) => {
    const cx = M + (i % 2) * colW, cy = top + Math.floor(i / 2) * pitch;
    ctx.fillStyle = LINE; ctx.fillRect(cx, cy, colW - 24, 2);
    ctx.fillStyle = SUB; ctx.font = `500 26px ${SANS}`; ctx.fillText(label, cx, cy + (tall ? 40 : 34));
    ctx.fillStyle = color; ctx.font = `900 ${tall ? 52 : 46}px ${SERIF}`; ctx.fillText(value, cx, cy + (tall ? 102 : 88), colW - 36);
  });
  const barY = top + (tall ? 330 : 256), barW = W - M * 2, { parts, left } = costShares(state);
  ctx.fillStyle = INK; ctx.font = `700 26px ${SANS}`; ctx.fillText('매출 100만원 중 남은 돈', M, barY);
  const colors = ['#e0a458', '#8fb5d6', '#a9a095', '#7d6f60'];
  let x = M;
  [...parts, ['남는 돈', Math.max(0, left)]].forEach(([, v], i) => {
    const w = Math.max(0, v) / 100 * barW;
    ctx.fillStyle = i === parts.length ? (left < 0 ? BRAND : POS) : colors[i]; ctx.fillRect(x, barY + 20, w, 44); x += w;
  });
  ctx.fillStyle = SUB; ctx.font = `500 22px ${SANS}`;
  ctx.fillText(`${parts.map(([n, v]) => `${n} ${v.toFixed(0)}`).join(' · ')} · 남는 돈 ${left.toFixed(1)}`, M, barY + (tall ? 98 : 88), barW);
  ctx.fillStyle = LINE; ctx.fillRect(M, H - 150, W - M * 2, 2);
  ctx.fillStyle = INK; ctx.font = `500 26px ${SANS}`; ctx.fillText(address, M, H - 104, W - M * 2);
  ctx.fillStyle = SUB; ctx.font = `500 22px ${SANS}`;
  ctx.fillText('실제 창업 수익을 예측하지 않는 가상 경영 체험입니다. 독립 제작물입니다.', M, H - 68, W - M * 2);
}

function renderShare(state, result) {
  let panel = document.getElementById('resultShare');
  if (!panel) {
    panel = document.createElement('details');
    panel.id = 'resultShare';
    panel.className = 'assumptions';
    document.getElementById('salaryComparison').after(panel);
  }
  panel.innerHTML = '<summary>결과 공유</summary><div class="share-box"><canvas class="share-preview" width="1080" height="1080" aria-label="공유 이미지 미리보기"></canvas><div class="share-side"><label>이미지 비율 <select><option value="1080">1:1</option><option value="1350">4:5</option></select></label><div class="actions"><button type="button" class="action-alt">이미지 저장</button><button type="button" class="action-alt">주소 복사</button><button type="button" class="action-alt" hidden>공유하기</button></div><div class="share-links"><a data-x target="_blank" rel="noopener noreferrer">X</a><a data-threads target="_blank" rel="noopener noreferrer">스레드</a><a data-fb target="_blank" rel="noopener noreferrer">페이스북</a></div><p class="fine">카카오톡은 이미지를 저장해 대화방에 올리거나 공유하기를 이용하세요. 공유 문구에는 결과 제목과 주소만 들어갑니다.</p><output aria-live="polite"></output></div></div>';
  const canvas = panel.querySelector('canvas'), select = panel.querySelector('select');
  const [save, copy, nativeShare] = panel.querySelectorAll('button');
  const status = panel.querySelector('output');
  const address = location.protocol.startsWith('http') ? location.origin + location.pathname : 'https://raspos.github.io/self-employed-survival/';
  const text = `${outcome(state, result)} — 대한민국 자영업자로 살아남기 (가상 시뮬레이션)`;
  panel.querySelector('[data-x]').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(address)}`;
  panel.querySelector('[data-threads]').href = `https://www.threads.net/intent/post?text=${encodeURIComponent(text + ' ' + address)}`;
  panel.querySelector('[data-fb]').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(address)}`;
  const draw = async () => {
    canvas.height = Number(select.value);
    try { await Promise.all([document.fonts.load("900 40px 'Noto Serif KR'"), document.fonts.load("500 26px 'Noto Sans KR'")]); } catch { /* 글꼴 없이 그린다 */ }
    drawShareCard(canvas, state, result, address);
  };
  select.onchange = draw;
  panel.addEventListener('toggle', () => { if (panel.open) draw(); });
  if (navigator.share) { nativeShare.hidden = false; nativeShare.onclick = () => navigator.share({ title: '대한민국 자영업자로 살아남기', text, url: address }).catch(() => {}); }
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(address); status.textContent = '주소를 복사했습니다.'; } catch { status.textContent = address; }
  };
  save.onclick = async () => {
    await draw();
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '자영업-결과.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, 'image/png');
  };
}
