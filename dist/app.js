import { beginEpisodes, currentEpisode, decideEpisode, changeOperations, episodeSpeaker, episodeContext } from './episodes.js';
import { simplifySetup } from './setup-ui.js';
import { renderOutcome } from './outcomes.js';
import { mountTrends } from './trends.js';
import { businessOutflows, largestDecisionExpense } from './ledger-summary.js';
import { transferShop } from './simulation.js';
import { environments, applyEnvironment, additionalAreas, environmentNotes } from './environments.js';
import {profiles,areas,defaults,setup,createSimulation,calculateMonth,close,totals,liquidation,recommend,forecastClosure} from './simulation.js';
import {articles,indicators,sources,pending,methods,checkedAt} from './content.js';
import {brandPicker,paintBrandSummary,paintFeePreview,paintRunBurden,deliveryResult,deliveryStoryMarkup,wireDeliveryStory,paintUpdates} from './extensions.js';
const $=id=>document.getElementById(id),fmt=(n,d=0)=>n.toLocaleString('ko-KR',{maximumFractionDigits:d}),money=n=>`${n<0?'−':''}${fmt(Math.abs(n))}만원`,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
let selected='chicken',sim=null,currentStory=0,personal=false;
const basicMap={funds:'own',loan:'loan',owner:'living',area:'area',brand:'brand',salesCapture:'salesCapture',size:'size',staff:'staff',hours:'hours',strategy:'strategy'};
const overrideFields=['deliveryShare','sales','costRatio','rent','interior','entry','deposit'];
const assumptionKeys=Object.keys(defaults).filter(k=>!['industry','own','loan','living','area','brand','size','staff','hours','strategy','salesCapture'].includes(k));
const dirty=new Set();
mountTrends($('dataCards'));
simplifySetup();
const operations = document.createElement('details');
operations.className = 'assumptions';
operations.innerHTML = '<summary>운영 조정</summary><div class="actions"><button type="button" class="action-alt" data-operation="shorter">영업시간 단축</button><button type="button" class="action-alt" data-operation="pickup">포장 위주로 전환</button></div><output aria-live="polite"></output>';
$('eventChoices').after(operations);
const life = document.createElement('p');
life.className = 'mini';
operations.before(life);
const shopIllustration = document.createElement('figure');
shopIllustration.className = 'story-photo shop-illustration';
shopIllustration.hidden = true;
shopIllustration.innerHTML = '<img src="./shop-illustration.jpg" width="1672" height="941" loading="lazy" alt="마감 시간에 동네 가게에서 영수증을 정리하는 점주"><figcaption>게임 속 가게 · 일러스트</figcaption>';
$('eventTitle').before(shopIllustration);
operations.addEventListener('click', event => {
 const action = event.target.closest('button')?.dataset.operation;
 if (!action || !sim) return;
 const applied = changeOperations(sim,action);
 if (applied) renderState();
 operations.querySelector('output').textContent = applied ? '다음 달 장부부터 반영됩니다.' : '현재 적용할 수 없습니다.';
});
for (const [key, area] of Object.entries(additionalAreas)) {
 $('area').add(new Option(area.name, key));
}
const economyLabel = document.createElement('label');
economyLabel.textContent = '경제 환경 ';
const economySelect = document.createElement('select');
for (const [key, scenario] of Object.entries(environments)) {
 economySelect.add(new Option(scenario.label, key));
}
economyLabel.append(economySelect);
$('setup').querySelector('.setup-details').before(economyLabel);
const economyMethod = document.createElement('details');
const economyMethodTitle = document.createElement('summary');
economyMethodTitle.textContent = '경제 환경 적용 기준';
const economyMethodText = document.createElement('p');
economyMethod.append(economyMethodTitle,economyMethodText);
economyLabel.after(economyMethod);
economySelect.onchange = () => {
 economyMethodText.textContent = environmentNotes[economySelect.value];
};
economySelect.onchange();
economySelect.addEventListener('change',summary);
const modeLabel = document.createElement('label');
modeLabel.textContent = '운영 방식 ';
const modeSelect = document.createElement('select');
for (const [key, label] of [['staff', '직원 고용'], ['solo', '나 홀로 운영'], ['family', '가족 공동 운영']]) {
 modeSelect.add(new Option(label, key));
}
modeLabel.append(modeSelect);
economyLabel.before(modeLabel);
modeSelect.onchange = () => {
 const staffing = { staff: [2, 60], solo: [0, 78], family: [0, 52] }[modeSelect.value];
 [$('staff').value, $('hours').value] = staffing;
 summary();
};
function read(){const c={industry:selected};for(const [id,k]of Object.entries(basicMap)){if(['area','brand','strategy'].includes(k))c[k]=$(id).value;else {if(!$(id).value.trim()||!$(id).checkValidity())throw Error('입력값의 범위와 단위를 확인하세요.');c[k]=Number($(id).value);}}
 for(const k of assumptionKeys){if(overrideFields.includes(k)&&!dirty.has(k)){c[k]=null;continue;}if(k==='repayment')c[k]=$(k).value;else{if(!$(k).value.trim()||!$(k).checkValidity())throw Error('가정값의 범위와 단위를 확인하세요.');c[k]=Number($(k).value);if(k==='costRatio')c[k]/=100;}}return c;}
function updateOverrides(){const c={industry:selected};for(const [id,k]of Object.entries(basicMap))c[k]=['area','brand','strategy'].includes(k)?$(id).value:Number($(id).value);try{const s=setup(c);for(const k of overrideFields)if(!dirty.has(k))$(k).value=Number((k==='costRatio'?s[k]*100:s[k]).toFixed(2));}catch{}}
function summary(){try{updateOverrides();const s=applyEnvironment(setup(read()),economySelect.value),r=calculateMonth({...s,month:0,cash:s.buffer,debt:s.loan,revenueMult:1,extraFixed:0,extraHours:0},1,1);const variable=(r.material+r.royalty+r.delivery+r.card+r.vat)/Math.max(r.sales,1);const be=(s.wages+s.rent+s.other+r.interest+r.principal+s.living)/Math.max(.01,1-variable);
 for(const [id,val]of Object.entries({sideIndustry:s.p.name,sideArea:s.a.name,sideFunding:money(s.own+s.loan),sideStartcost:money(s.startcost),sideBuffer:money(s.buffer),sideSales:money(s.sales),sideBE:money(be),sideFree:money(r.flow)}))$(id).textContent=val;
 $('start').disabled=s.buffer<0;$('startAlert').textContent=s.buffer<0?'자금이 부족합니다. 자본금·대출·초기 비용을 조정해 주세요.':`가상 개업 직후 현금 ${money(s.buffer)}. 창업비용 중 보증금 ${money(s.deposit+s.franchiseDeposit)}은 회수 가능 자산입니다. 손익분기 매출은 세전 현금 기준 근사치입니다.`;
 $('sales').dataset.override=String(dirty.has('sales'));paintBrandSummary(s);paintFeePreview(s,r);$('feeLabShare').value=Number($('deliveryShare').value);$('feeLabShareValue').textContent=$('deliveryShare').value+'%';
 $('sideBuffer').className='val '+(s.buffer<0?'bad':'good');$('sideFree').className='val '+(r.flow<0?'bad':'good');
 }catch(e){$('start').disabled=true;$('startAlert').textContent=e.message;}}
Object.entries(profiles).forEach(([key,p])=>{const b=document.createElement('button');b.type='button';b.className='option'+(key===selected?' chosen':'');b.setAttribute('aria-pressed',String(key===selected));b.innerHTML=`<strong>${p.name}</strong><small>${p.caption}</small>`;b.onclick=()=>{selected=key;document.querySelectorAll('.option').forEach(x=>{x.classList.toggle('chosen',x===b);x.setAttribute('aria-pressed',String(x===b));});brandPicker(selected,()=>{dirty.delete('sales');summary();});summary();};$('industryOptions').append(b);});
brandPicker(selected,()=>{dirty.delete('sales');summary();});
$('feeLabShare').oninput=()=>{$('deliveryShare').value=$('feeLabShare').value;dirty.add('deliveryShare');summary();};
for(const id of Object.keys(basicMap))$(id).addEventListener('input',summary);
for(const k of assumptionKeys)$(k).addEventListener('input',()=>{dirty.add(k);summary();});
$('resetAssumptions').onclick=()=>{dirty.clear();for(const k of assumptionKeys)if(!overrideFields.includes(k))$(k).value=defaults[k];summary();};
function show(id){for(const k of ['setup','play','results'])$(k).classList.toggle('off',k!==id);document.querySelectorAll('.step').forEach((e,i)=>e.classList.toggle('active',i===(id==='setup'?0:id==='results'?3:sim.month<=6?1:2)));$(id).scrollIntoView({behavior:'smooth',block:'start'});}
function lineChart(rows,keys,labels,width=620,height=220){const colors=['#c95935','#22756a','#aa8d56'];let all=[0,...rows.flatMap(r=>keys.map(k=>r[k]))],min=Math.min(...all),max=Math.max(...all);if(max===min)max=min+1;const X=i=>55+i/Math.max(1,rows.length-1)*(width-80),Y=v=>20+(max-v)/(max-min)*(height-65);let out=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(labels.join(' 및 '))} 추이. 단위 만원"><title>${esc(labels.join(' · '))} (만원)</title>`;
for(let i=0;i<4;i++){const v=min+(max-min)*i/3,y=Y(v);out+=`<line x1="55" x2="${width-25}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".13"/><text x="48" y="${y+4}" text-anchor="end" fill="currentColor" font-size="10">${fmt(v)}</text>`;}
out+=`<line x1="55" x2="${width-25}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".4" stroke-dasharray="4 4"/>`;
keys.forEach((k,j)=>{out+=`<polyline points="${rows.map((r,i)=>`${X(i)},${Y(r[k])}`).join(' ')}" fill="none" stroke="${colors[j]}" stroke-width="3"/>`;});out+=`<text x="55" y="${height-18}" fill="currentColor" font-size="11">${rows[0]?.month??0}</text><text x="${width-25}" y="${height-18}" text-anchor="end" fill="currentColor" font-size="11">${rows.at(-1)?.month??0}개월</text></svg><div class="chart-legend">${labels.map((s,i)=>`<span style="--legend:${colors[i]}">${s}</span>`).join('')}<small>단위: 만원</small></div>`;return out;}
function renderPlay(){const t=totals(sim),r=sim.records.at(-1),e=currentEpisode(sim);$('playKicker').textContent=`${sim.month} / 36개월`;$('playTitle').textContent=`${sim.p.name} 가게, ${sim.month}개월 차 장부`;$('playSubtitle').textContent=`${sim.a.name} · ${sim.size}평 · 직원 ${sim.staff}명 · 점주 주 ${sim.hours+sim.extraHours}시간 · 가상 시나리오`;$('cashNow').textContent=money(sim.cash);$('salesNow').textContent=money(sim.lastRevenue);$('profitNow').textContent=money(sim.lastDelta);$('profitNow').className='num '+(sim.lastDelta<0?'neg':'');
 document.querySelector('#play .graphbox').innerHTML=lineChart([{month:0,cash:sim.buffer,debt:sim.loan},...sim.records],['cash','debt'],['현금 잔액','대출 잔액']);
 paintRunBurden(sim,r);$('playStory').textContent=`최근 월 영업이익 ${money(r.operating)} / 순현금 ${money(r.flow)}. 누적 점주 노동 ${fmt(t.hours)}시간. 이익이 나도 원금상환과 생활비로 현금은 줄 수 있습니다.`;
 $('eventTitle').textContent=e?episodeSpeaker(e)+' · '+e.title:'최종 결산';$('eventText').textContent=e?episodeContext(sim,e):'';$('eventChoices').innerHTML='';if(e)for(const key of ['a','b']){const c=e[key],b=document.createElement('button');b.className='choice';b.type='button';b.textContent=c;b.onclick=()=>{decideEpisode(sim,key);renderState();};$('eventChoices').append(b);}
 const f=forecastClosure(sim);$('closePreview').innerHTML=`<strong>폐업도 경영의 선택입니다.</strong><br>지금 정리하면 ${money(f.now)} / ${f.target}개월까지 영업 후 정리하면 ${money(f.later)}<br><small>${f.assumption} 회수액은 음수가 될 수 있습니다.</small>`;}
function renderState(){
 try{localStorage.setItem("survival-v3",JSON.stringify(sim));}catch{}
 if(sim.finished){renderResults();renderOutcome(sim,totals(sim));renderRunCharts();return;}
 const fatigue = sim.fatigue ?? 0;
 shopIllustration.hidden = sim.decisions.length !== 0;
 life.textContent = `추가 휴무 ${sim.restDays ?? 0}일 · 피로 ${fatigue >= 65 ? '높음' : fatigue >= 35 ? '보통' : '낮음'}`;
 renderPlay();
 if ($('play').classList.contains('off')) show('play');
 else $('eventTitle').scrollIntoView({ block:'nearest', behavior:'instant' });
}
function renderRunCharts() {
 let charts = $('runCharts');
 if (!charts) {
  charts = document.createElement('details');
  charts.id = 'runCharts';
  charts.className = 'assumptions';
  $('extendedResults').after(charts);
 }
 const timeline = sim.decisions.map(item => `<li><strong>${item.month}개월</strong> · ${esc(item.title)}</li>`).join('');
 const costs = businessOutflows(sim.records);
 const major = largestDecisionExpense(sim.decisions);
 const breakdown = costs.rows.map(({label,amount}) => {
  const share = 100*amount/costs.total;
  return `<tr><th scope="row">${label}</th><td>${money(amount)}</td><td>${fmt(share,1)}%</td></tr>`;
 }).join('');
 charts.innerHTML = `<summary>36개월 장부와 선택 기록</summary>
  <p>가계 예비금 잔액 <strong>${money(sim.householdCash??0)}</strong></p>
  <div class="graphbox">${lineChart(sim.records,['sales','netIncome'],['매출','세후 손익'])}</div>
  <div class="graphbox">${lineChart([{month:0,cash:sim.buffer,debt:sim.loan},...sim.records],['cash','debt'],['현금','대출'])}</div>
  ${breakdown ? `<h3>영업 기간 사업 지출</h3><div class="tablewrap"><table><thead><tr><th>항목</th><th>지출</th><th>비중</th></tr></thead><tbody>${breakdown}</tbody></table></div>` : ''}
  ${major ? `<p>가장 큰 일시 지출 · ${major.month}개월, ${esc(major.title)} <strong>${money(major.cost)}</strong></p>` : ''}
  ${timeline ? '<ol>'+timeline+'</ol>' : ''}`;
}
const replayControls = document.createElement('div');
replayControls.className = 'actions';
for (const [label, sameSeed] of [['같은 조건으로 다시', false], ['같은 사건 시드로 다시', true]]) {
 const button = document.createElement('button');
 button.type = 'button';
 button.className = 'action-alt';
 button.textContent = label;
 button.onclick = () => {
  const seed = sameSeed ? sim.seed : crypto.getRandomValues(new Uint32Array(1))[0];
  const input = sim.initialInput ?? {
   ...sim.config,
   deliveryShare: Math.max(0, Math.min(100, sim.config.deliveryShare -
    (sim.config.strategy === 'delivery' ? 20 : sim.config.strategy === 'local' ? -20 : 0))),
  };
  const environment = sim.environment;
  const previousRun = { environment, months: sim.month, equity: liquidation(sim).net, hours: totals(sim).hours };
  sim = Object.assign(applyEnvironment(createSimulation(input), environment), { initialInput: input, previousRun, annualSalary:sim.annualSalary });
  beginEpisodes(sim, seed);
  renderState();
 };
 replayControls.append(button);
}
const replayEnvironment = document.createElement('select');
replayEnvironment.setAttribute('aria-label','다시 도전할 경제 환경');
for (const [key, scenario] of Object.entries(environments)) replayEnvironment.add(new Option(scenario.label,key));
const compareRun = document.createElement('button');
compareRun.type='button';
compareRun.className='action-alt';
compareRun.textContent='환경을 바꿔 다시';
compareRun.onclick=()=>{
 const input = sim.initialInput;
 if (!input) return;
 const previousRun = { environment: sim.environment, months: sim.month, equity: liquidation(sim).net, hours: totals(sim).hours };
 const seed = sim.seed;
 sim = Object.assign(applyEnvironment(createSimulation(input),replayEnvironment.value),{initialInput:input,previousRun,annualSalary:sim.annualSalary});
 beginEpisodes(sim,seed);
 renderState();
};
replayControls.append(replayEnvironment,compareRun);
$('restart').after(replayControls);
$('start').onclick=()=>{
 try {
  const input=read();
  const salary=$('annualSalary');
  if(!salary.value || !salary.checkValidity()) throw Error('비교용 연봉을 확인하세요.');
  sim=Object.assign(applyEnvironment(createSimulation(input),economySelect.value),{initialInput:input,annualSalary:Number(salary.value)});
  resume.remove();
  beginEpisodes(sim,crypto.getRandomValues(new Uint32Array(1))[0]);
  renderState();
 } catch(e) {
  $('startAlert').textContent=e.message;
 }
};
const resume=document.createElement('button');
resume.type='button';
resume.className='action-alt';
resume.textContent='이어서 플레이';
try {
 const saved=JSON.parse(localStorage.getItem('survival-v3'));
 if(saved?.seen){
  if(saved.finished) resume.textContent='지난 결과 보기';
  $('start').after(resume);
  resume.onclick=()=>{sim=saved;resume.remove();renderState();};
 }
} catch {}
$('quit').onclick=()=>{close(sim);renderState();};
const transferPanel = document.createElement('details');
transferPanel.className = 'assumptions';
transferPanel.innerHTML = '<summary>매장 양도</summary><label>시설·권리 양도대금 (보증금 제외, 만원) <input type="number" min="0" max="100000" value="0"></label><button class="action-alt" type="button">양도하고 영업 종료</button>';
$('quit').after(transferPanel);
transferPanel.querySelector('button').onclick = () => {
 const field = transferPanel.querySelector('input');
 if (!field.value || !field.reportValidity()) return;
 if (transferShop(sim,Number(field.value))) renderState();
};
const metric=(label,value)=>`<div class="result-metric"><span>${label}</span><strong>${value}</strong></div>`;
function renderResults(){const t=totals(sim),l=t.liquidation;$('resultTitle').textContent=sim.reason;$('finalWorth').textContent=money(l.net);$('finalWorth').style.color=l.net<0?'#a8392b':'#18775e';$('resultMessage').textContent=sim.closed?`${sim.month}개월의 영업을 마쳤습니다. 가게 정리는 남은 자산과 부채를 다루는 선택입니다. 결과를 개인의 능력만으로 설명할 수는 없습니다.`:'36개월을 운영했습니다. 수익을 얻기 위해 투입한 시간과 감수한 위험도 함께 살펴보세요.';$('monthsRun').textContent=sim.month+'개월';$('totalRevenue').textContent=money(t.revenue);$('netChange').textContent=money(t.investmentReturn);
 $('extendedResults').innerHTML=`<div class="result-grid">${metric('초기 투자·보증금',money(sim.startcost))}${metric('초기 자기자본',money(sim.own))}${metric('누적 영업손익',money(t.operating))}${metric('점주 노동시간',fmt(t.hours)+'시간')}${metric('점주 노동비용 차감 후',money(t.operating-t.labor))}${metric('노동·자본 기회비용 반영 후',money(t.economic))}${metric('대출 잔액',money(sim.debt))}${metric('사업 현금 잔액',money(sim.cash))}${metric('청산 기준 투자 회수율',fmt(t.recovery,1)+'%')}${metric('실제 폐업 선택·중단 여부',sim.closed?'영업 정리':'36개월 운영 완료')}</div><div class="hourly-panel"><p>사장님의 진짜 시간값</p><strong>${fmt(t.hourly)}<small>원 / 시간</small></strong><h3>사장님은 정말 최저임금보다 많이 벌었을까요?</h3><p>점주 노동시간당 사업소득 = 영업이익 ÷ 노동시간<br>2026년 적용 최저임금 10,320원과의 참고 비교: ${t.hourly>=10320?'이상':'미만'}. 자본 수익을 포함할 수 있으며 법정 임금이 아닙니다.</p><label for="resultHour">내 노동 비교 시급 (원)</label><input id="resultHour" type="number" min="0" max="100000" value="${sim.hourly}"/><label for="resultCapital">자기자본 기회비용 (연 %)</label><input id="resultCapital" type="number" min="0" max="30" step=".1" value="${sim.capitalRate}"/><output id="economicOutput">경제적 수익 ${money(t.economic)}</output></div><details><summary>폐업·청산 정산 항목 보기</summary><div class="result-grid">${metric('현금',money(l.cash))}${metric('회수 보증금',money(l.recoveredDeposit))}${metric('시설 처분액',money(l.salvage))}${metric('잔여 대출',money(l.debt))}${metric('철거·복구비',money(l.demolition))}${metric('계약 해지비',money(l.termination))}</div><p class="mini">36개월 운영 완료 시에도 비교를 위해 같은 청산 가정을 적용했습니다. 보증금 회수율 ${sim.depositRecovery}%, 시설 초기 처분비율 ${sim.salvage}%에서 경과월수만큼 감액. 권리금 회수 0.</p></details>`;
 $('extendedResults').insertAdjacentHTML('afterbegin',deliveryResult(sim));$('resultDeliveryLink').onclick=()=>{reality(false);currentStory=articles.findIndex(a=>a.id==='delivery');renderStory();$('reality').scrollIntoView({behavior:'smooth'});};
 const recalc=()=>{const h=Number($('resultHour').value),c=Number($('resultCapital').value);$('economicOutput').textContent=$('resultHour').value!==''&&$('resultCapital').value!==''&&$('resultHour').checkValidity()&&$('resultCapital').checkValidity()?`경제적 수익 ${money(t.operating-t.hours*h/10000-sim.own*c/100*sim.month/12)}`:'입력 범위를 확인하세요.';};$('resultHour').oninput=recalc;$('resultCapital').oninput=recalc;
 $('bridgeLine').textContent=sim.closed?'게임 속 당신은 3년을 버티지 못했습니다.':'게임 속 당신은 3년을 버텼습니다.';
 document.querySelector('#results thead').innerHTML='<tr><th>월</th><th>매출</th><th>영업손익</th><th>이자</th><th>원금</th><th>세금·유보</th><th>생활비</th><th>현금증감</th><th>현금잔액</th><th>노동시간</th></tr>';
 $('recordTable').innerHTML=sim.records.map(r=>`<tr>${[r.month,...['sales','operating','interest','principal'].map(k=>fmt(r[k])),fmt(r.tax+r.vat),fmt(r.living),fmt(r.flow),fmt(r.cash),fmt(r.hours)].map(v=>`<td>${v}</td>`).join('')}</tr>`).join('');show('results');}
$('restart').onclick=()=>{sim=null;personal=false;$('personalized').innerHTML='';summary();show('setup');};
$('export').onclick=()=>{if(!sim)return;const cols=['month','sales','material','royalty','delivery','card','wages','rent','other','depreciation','operating','interest','principal','tax','vat','living','netIncome','flow','cash','debt','hours','labor','capital','economic'];const csv=['# 가상 시나리오 / 금액 만원 / 시간 hours / 공식 관측치 아님',cols.join(','),...sim.records.map(r=>cols.map(k=>r[k]).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='자영업_2.0_가상월별장부.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
function reality(personalize=false){personal=personalize&&!!sim;if(!personal)$('personalized').innerHTML='';if(personal){const rec=recommend(sim);currentStory=articles.findIndex(a=>a.id===rec.id);$('personalized').innerHTML=`<span>YOUR EXPERIENCE → REALITY</span><h3>${esc(rec.why)}</h3><p>${sim.month}개월의 게임 기록에서 고른 첫 이야기입니다. 모든 이야기를 자유롭게 읽을 수 있습니다.</p>`;}renderStory();}
$('compare').onclick=()=>{reality(true);$('reality').scrollIntoView({behavior:'smooth'});};
$('navReality').onclick=$('sideReality').onclick=()=>reality(false);
function illustration(id){if(id==='rent')return `<div class="interactive-chart"><span>가상 구조 실험 / 월 매출 변화</span><label for="salesSlider">월 매출 <b id="sliderLabel"></b></label><input id="salesSlider" type="range" min="600" max="3500" value="2200" step="100"/><div id="breakChart"></div><p id="breakCaption"></p><small>가정: 원재료 40%, 고정 인건비 500만원, 임대료 250만원, 기타 고정비 150만원. 이자·세금·감가상각 제외. 현금은 초기 500만원에서 1개월 증감.</small></div>`;
 if(id==='delivery')return deliveryStoryMarkup();
 if(id==='franchise')return `<div class="cost-structure">${['가입 시 → 가맹비·교육비','돌려받을 수 있는 돈 → 보증금','매달 → 로열티·필수품목','정리할 때 → 해지·원상복구'].map((s,i)=>`<div><b>0${i+1}</b><p>${s}</p></div>`).join('')}</div><p class="reality-caption">정보공개서의 기존 가맹점 평균 매출은 신규 점포의 예상 매출이 아닙니다. 키워드는 실제 브랜드를 참고하지만 게임의 비용·계약 조건은 업종 공통 모형입니다.</p>`;
 if(id==='labor')return `<div class="scene-number">60<span>시간 / 주</span></div><p class="reality-caption">가상 게임의 기본 점주 노동시간입니다. 실제 자영업자의 평균이 아닙니다.<br>2024년 기사 속 연령 비중을 현재 수치로 제시하지 않았습니다.</p>`;
 if(id==='closure'||id==='debt')return `<div class="flow-diagram">${(id==='closure'?['현금 + 회수 자산','− 남은 부채','− 가게 정리 비용','= 다음 출발의 자금']:['매출 − 운영비','= 영업이익','− 이자·세금·원금','= 통장 현금의 변화']).map(s=>`<div>${s}</div>`).join('')}</div>`;
return `<div class="street-diagram" aria-label="수요 이동과 점포 경쟁을 설명하는 개념도"><div>학생·고시생 수요</div><b>↓ &nbsp; 문화·인구·상권의 변화</b><div>같은 거리, 달라진 고객</div><b>↓ &nbsp; 점포 사이의 경쟁</b><div>매출과 고정비의 간격</div></div><p class="reality-caption">취재를 설명하는 개념도입니다. 관악구 인구·점포 수의 실제 시계열 그래프가 아닙니다.</p>`;}
function renderStory(){const a=articles[currentStory];$('storyTabs').innerHTML=articles.map((a,i)=>`<button type="button" data-story="${i}" aria-pressed="${i===currentStory}">${String(i+1).padStart(2,'0')} ${a.title}</button>`).join('');$('storyTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{currentStory=Number(b.dataset.story);renderStory();});$('storyContent').innerHTML=`<div class="story-heading"><span>STORY ${String(currentStory+1).padStart(2,'0')} / ${a.reportedAt} 당시</span><h3>${a.title}</h3></div><div class="story-body"><p class="story-question">${a.question}</p><p>${a.facts}</p>${a.id==='demand'?'<figure class="story-photo"><img src="https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202409/24/27a53bdc-c3c2-4d3e-9d48-6f9e96f5c2f0.jpg" alt="녹두호프에서 맥주병을 치우는 점주 김례숙 씨" loading="lazy"><figcaption>2024년 9월, 서울 관악구 녹두호프 · 사진 중앙일보</figcaption></figure>':''}<div class="article-note"><small>취재 대상: ${a.subject}<br>확인 범위: ${a.verification}</small><br>${link(a.url,a.originalTitle??'관련 기획 원문')}</div></div>${illustration(a.id)}<div class="related-sources">${a.relatedStatistics.map(k=>link(sources[k].url,sources[k].label)).join('<br>')}</div>`;$('prevStory').disabled=currentStory===0;$('nextStory').textContent=currentStory===articles.length-1?'그때와 지금 비교하기 →':'다음 이야기 →';
 if(a.id==='rent'){const draw=()=>{const sales=Number($('salesSlider').value),profit=sales*.6-900;$('sliderLabel').textContent=money(sales);const rows=Array.from({length:30},(_,i)=>{const v=600+i*100;return{month:v,op:v*.6-900,cash:500+v*.6-900};});$('breakChart').innerHTML=lineChart(rows,['op','cash'],['영업손익 (감가상각 제외)','1개월 뒤 현금']);$('breakChart').querySelector('svg').setAttribute('aria-label','매출 600~3500만원일 때 영업손익과 1개월 뒤 현금. 손익분기 매출 1500만원');$('breakChart').querySelectorAll('svg text').forEach(n=>{if(n.textContent.endsWith('개월'))n.textContent='3,500 매출';});$('breakCaption').textContent=`선택 매출 ${money(sales)} − 원재료 ${money(sales*.4)} − 인건비 500만원 − 임대료 250만원 − 기타 150만원 = 영업손익 ${money(profit)} / 현금 ${money(500+profit)}. 손익분기 매출 1,500만원.`;};$('salesSlider').oninput=draw;draw();}
 if(a.id==='delivery')wireDeliveryStory();}

$('prevStory').onclick=()=>{currentStory=Math.max(0,currentStory-1);renderStory();$('storyContent').scrollIntoView({behavior:'smooth'});};$('nextStory').onclick=()=>{if(currentStory===articles.length-1){$('data').scrollIntoView({behavior:'smooth'});return;}currentStory++;renderStory();$('storyContent').scrollIntoView({behavior:'smooth'});};
function comparison(){const d=indicators.find(d=>d.id===$('indicatorSelect').value),src=sources[d.source],change=d.officialChange??(d.changeType==='pp'?d.after-d.before:(d.after/d.before-1)*100);const max=Math.max(d.before,d.after)*1.16;$('comparison').innerHTML=`<div class="comparison-main"><p>${d.name}</p><div class="comparison-values"><div><span>${d.beforePeriod}</span><strong>${fmt(d.before,1)}<small>${d.unit}</small></strong></div><b>→</b><div><span>${d.afterPeriod}</span><strong>${fmt(d.after,1)}<small>${d.unit}</small></strong></div></div><div class="compare-bars"><span style="width:${d.before/max*100}%">이전 ${fmt(d.before,1)}</span><span style="width:${d.after/max*100}%">최신 확인 ${fmt(d.after,1)}</span></div><div class="change"><b>${change>0?'+':''}${fmt(change,1)}${d.changeType==='pp'?'%p':'%'}</b><p>${d.meaning}</p></div><p class="mini">최신 확인 자료 발표일 ${src.published} · 대상 기간은 위 표기 참조 · 확인일 ${checkedAt}</p>${link(src.url,src.label)}${d.beforeSource?'<br>'+link(sources[d.beforeSource].url,'이전 공표 자료'):''}</div>`;}
$('indicatorSelect').innerHTML=indicators.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');$('indicatorSelect').onchange=comparison;
$('dataCards').innerHTML=indicators.map(d=>`<button type="button" class="data-card" data-indicator="${d.id}"><span>${d.name}</span><strong>${fmt(d.after,1)}<small>${d.unit}</small></strong><p>${d.afterPeriod}</p><em>비교 살펴보기 ↗</em></button>`).join('');$('dataCards').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('indicatorSelect').value=b.dataset.indicator;comparison();$('comparison').scrollIntoView({behavior:'smooth'});});
$('pendingData').innerHTML=pending.map(([label,status,key])=>`<div class="pending-row"><strong>${label}</strong><p>${status}</p>${link(sources[key].url,'확인 경로')}</div>`).join('');
$('articleSources').innerHTML=articles.map(a=>`<p>${link(a.url,a.originalTitle??a.title)}<small> · ${a.reportedAt} · ${a.verification}</small></p>`).join('');
$('officialSources').innerHTML=Object.values(sources).filter(s=>s.kind==='official').map(s=>`<p>${link(s.url,s.label)}<small>${s.published?' · 발표 '+s.published:''}</small></p>`).join('');
$('methodText').innerHTML=`<p class="desc">${methods.accounting}</p><p class="mini">${methods.simulation}</p><a class="text-link" href="#sources">계산 방식과 검증 범위 읽기 ↗</a>`;
$('allMethods').innerHTML=Object.entries(methods).map(([k,v])=>`<p>${v}</p>`).join('');
paintUpdates();summary();reality();comparison();

