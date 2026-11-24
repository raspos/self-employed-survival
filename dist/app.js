import { beginEpisodes, currentEpisode, decideEpisode, changeOperations, episodeSpeaker, episodeContext } from './episodes.js';
import { mountPresets } from './setup-ui.js';
import { eventView } from './event-format.js';
import { sceneFor, sceneHTML } from './scenes.js';
import { renderOutcome } from './outcomes.js';
import { mountTrends } from './trends.js';
import { businessOutflows, largestDecisionExpense } from './ledger-summary.js';
import { transferShop } from './simulation.js';
import { environments, applyEnvironment, additionalAreas, environmentNotes } from './environments.js';
import {profiles,areas,defaults,setup,createSimulation,calculateMonth,close,totals,liquidation,recommend,forecastClosure} from './simulation.js';
import {articles,indicators,sources,pending,methods,checkedAt} from './content.js';
import {brandPicker,paintBrandSummary,paintFeePreview,paintRunBurden,deliveryResult,deliveryStoryMarkup,wireDeliveryStory,paintUpdates} from './extensions.js';
const $=id=>document.getElementById(id),fmt=(n,d=0)=>n.toLocaleString('ko-KR',{maximumFractionDigits:d}),money=n=>`${n<0?'−':''}${fmt(Math.abs(n))}만원`,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const big=n=>`${n<0?'−':''}${fmt(Math.abs(Math.round(n)))}<small>만원</small>`;
const eok=n=>{const a=Math.abs(Math.round(n)),e=Math.floor(a/10000),m=a%10000;return (n<0?'−':'')+(e?`${fmt(e)}억${m?` ${fmt(m)}만원`:'원'}`:`${fmt(m)}만원`);};
const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const COLORS=['#e0a458','#8fb5d6','#8fc79a'],LIGHT=['#AD352B','#375B78','#27724E'];
let selected='chicken',sim=null,currentStory=0,personal=false;
const basicMap={funds:'own',loan:'loan',owner:'living',area:'area',brand:'brand',salesCapture:'salesCapture',size:'size',staff:'staff',hours:'hours',strategy:'strategy'};
const overrideFields=['deliveryShare','sales','costRatio','rent','interior','entry','deposit'];
const assumptionKeys=Object.keys(defaults).filter(k=>!['industry','own','loan','living','area','brand','size','staff','hours','strategy','salesCapture'].includes(k));
const dirty=new Set();
const captions={chicken:['치킨집','배달 경쟁과 원재료비'],cafe:['카페','임대료와 단골 고객'],store:['편의점','인건비와 영업시간'],snack:['분식집','점심 피크와 원가 관리']};
mountTrends($('dataCards'));
mountPresets();

/* 메뉴 */
$('menuToggle').onclick=()=>{const open=$('menu').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));};
$('menu').addEventListener('click',e=>{if(e.target.closest('a'))$('menu').classList.remove('open');});

/* 운영 조정·양도 */
const operations=document.createElement('details');
operations.className='assumptions';
operations.innerHTML='<summary>운영 조정</summary><div class="actions"><button type="button" class="action-alt" data-operation="shorter">영업시간 단축</button><button type="button" class="action-alt" data-operation="pickup">포장 위주로 전환</button></div><output class="help" aria-live="polite"></output>';
$('quit').closest('.exit-box').append(operations);
operations.addEventListener('click',event=>{
 const action=event.target.closest('button')?.dataset.operation;
 if(!action||!sim)return;
 const applied=changeOperations(sim,action);
 if(applied)renderState();
 operations.querySelector('output').textContent=applied?'다음 달 장부부터 반영됩니다.':'현재 적용할 수 없습니다.';
});
const transferPanel=document.createElement('details');
transferPanel.className='assumptions';
transferPanel.innerHTML='<summary>매장 양도</summary><label>시설·권리 양도대금 (보증금 제외, 만원) <input type="number" min="0" max="100000" value="0"></label><div class="actions"><button class="action-alt" type="button">양도하고 영업 종료</button></div>';
$('quit').closest('.exit-box').append(transferPanel);
transferPanel.querySelector('button').onclick=()=>{
 const field=transferPanel.querySelector('input');
 if(!field.value||!field.reportValidity())return;
 if(transferShop(sim,Number(field.value)))renderState();
};

/* 설정 입력 */
for(const [key,area] of Object.entries(additionalAreas))$('area').add(new Option(area.name,key));
const economySelect=$('economy');
for(const [key,scenario] of Object.entries(environments))economySelect.add(new Option(scenario.label,key));
economySelect.onchange=()=>{$('economyNote').textContent=environmentNotes[economySelect.value];};
economySelect.onchange();
economySelect.addEventListener('change',summary);
const modeSelect=$('mode');
modeSelect.onchange=()=>{
 const staffing={staff:[2,60],solo:[0,78],family:[0,52]}[modeSelect.value];
 [$('staff').value,$('hours').value]=staffing;
 summary();
};
function read(){const c={industry:selected};for(const [id,k]of Object.entries(basicMap)){if(['area','brand','strategy'].includes(k))c[k]=$(id).value;else {if(!$(id).value.trim()||!$(id).checkValidity())throw Error('입력값의 범위와 단위를 확인하세요.');c[k]=Number($(id).value);}}
 for(const k of assumptionKeys){if(overrideFields.includes(k)&&!dirty.has(k)){c[k]=null;continue;}if(k==='repayment')c[k]=$(k).value;else{if(!$(k).value.trim()||!$(k).checkValidity())throw Error('가정값의 범위와 단위를 확인하세요.');c[k]=Number($(k).value);if(k==='costRatio')c[k]/=100;}}return c;}
function updateOverrides(){const c={industry:selected};for(const [id,k]of Object.entries(basicMap))c[k]=['area','brand','strategy'].includes(k)?$(id).value:Number($(id).value);try{const s=setup(c);for(const k of overrideFields)if(!dirty.has(k))$(k).value=Number((k==='costRatio'?s[k]*100:s[k]).toFixed(2));}catch{}}
function paintBudget(s){
 const parts=[['보증금',s.deposit+s.franchiseDeposit,'k1'],['인테리어·시설',s.interior,'k2'],['가맹비·권리금',s.entry+s.keyMoney,'k3']];
 if(s.householdReserve>0)parts.push(['생활비 예비금',s.householdReserve,'k5']);
 if(s.buffer>0)parts.push(['개업 후 남는 현금',s.buffer,'k4']);
 const fund=s.own+s.loan,total=Math.max(fund,parts.reduce((a,p)=>a+p[1],0));
 $('startupBar').innerHTML=`<p class="fine">조달 ${money(fund)} = 자본 ${money(s.own)} + 대출 ${money(s.loan)}</p><div class="stackbar" role="img" aria-label="자본 사용처">${parts.map(([n,v,c])=>`<i class="${c}" style="width:${v/total*100}%"></i>`).join('')}</div><ul class="legend">${parts.map(([n,v,c])=>`<li class="${c}"><span>${n}</span><b>${money(v)}</b></li>`).join('')}${s.buffer<0?`<li><span class="neg">자금 부족</span><b class="neg">${money(s.buffer)}</b></li>`:''}</ul>`;
}
function summary(){try{updateOverrides();const s=applyEnvironment(setup(read()),economySelect.value),r=calculateMonth({...s,month:0,cash:s.buffer,debt:s.loan,revenueMult:1,extraFixed:0,extraHours:0},1,1);const variable=(r.material+r.royalty+r.delivery+r.card+r.vat)/Math.max(r.sales,1);const fixed=s.wages+s.rent+s.other+r.interest+r.principal;const be=(fixed+s.living)/Math.max(.01,1-variable);
 $('sideStartcost').innerHTML=big(s.startcost);$('sideBuffer').innerHTML=big(s.buffer);$('sideFixed').innerHTML=big(fixed);$('sideBE').innerHTML=big(be);
 $('sideBuffer').classList.toggle('neg',s.buffer<0);$('sideRunway').textContent=r.flow<0&&s.buffer>0?`첫 달 기준 월 ${fmt(-r.flow)}만원씩 줄어 약 ${Math.floor(s.buffer/-r.flow)}개월분`:r.flow>=0?`첫 달 기준 월 ${fmt(r.flow)}만원씩 늘어납니다`:'';
 $('setupLine').textContent=`${s.p.name} · ${s.a.name} · ${s.size}평 · 직원 ${s.staff}명 · 점주 주 ${s.hours}시간 · 월 기준 매출 ${money(s.sales)}`;
 const short=s.buffer<0;$('start').disabled=short;$('toStep3').disabled=short;
 $('startAlert').textContent=short?`자금이 부족합니다. 자본금·대출·매장 규모를 조정하세요. (${money(s.buffer)})`:'';
 paintBudget(s);$('sales').dataset.override=String(dirty.has('sales'));paintBrandSummary(s);paintFeePreview(s,r);$('feeLabShare').value=Number($('deliveryShare').value);$('feeLabShareValue').textContent=$('deliveryShare').value+'%';
 }catch(e){$('start').disabled=true;$('toStep3').disabled=true;$('startAlert').textContent=e.message;}}
Object.entries(profiles).forEach(([key,p])=>{const [name,caption]=captions[key]??[p.name,p.caption];const b=document.createElement('button');b.type='button';b.className='industry';b.dataset.key=key;b.setAttribute('aria-pressed',String(key===selected));b.innerHTML=`<span class="pic pic-${key}" role="img" aria-label="${esc(name)} 상권"></span><span class="txt"><strong>${name}</strong><small>${caption}</small></span>`;b.onclick=()=>{selected=key;document.querySelectorAll('.industry').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));brandPicker(selected,()=>{dirty.delete('sales');summary();});summary();};$('industryOptions').append(b);});
brandPicker(selected,()=>{dirty.delete('sales');summary();});
$('feeLabShare').oninput=()=>{$('deliveryShare').value=$('feeLabShare').value;dirty.add('deliveryShare');summary();};
for(const id of Object.keys(basicMap))$(id).addEventListener('input',summary);
for(const k of assumptionKeys)$(k).addEventListener('input',()=>{dirty.add(k);summary();});
$('resetAssumptions').onclick=()=>{dirty.clear();for(const k of assumptionKeys)if(!overrideFields.includes(k))$(k).value=defaults[k];summary();};

/* 마법사 */
function goStep(n){if(n===3)$('readyScene').innerHTML=sceneHTML({svg:'open',tag:'개업 준비'});[1,2,3].forEach(i=>{$('step'+i).hidden=i!==n;});[...$('wizSteps').children].forEach((li,i)=>{li.className=i+1===n?'on':i+1<n?'done':'';});jump($('setup'));}
$('toStep2').onclick=()=>goStep(2);$('backStep1').onclick=()=>goStep(1);$('toStep3').onclick=()=>goStep(3);$('backStep2').onclick=()=>goStep(2);

const jump=el=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-56,behavior:'instant'});
function show(id){for(const k of ['setup','play','results'])$(k).classList.toggle('off',k!==id);document.body.classList.toggle('playing',id!=='setup');jump($(id));}

/* 그래프 */
const chartW=el=>Math.max(280,Math.round(el?.getBoundingClientRect().width||0)||340);
function lineChart(rows,keys,labels,width=340,colors=COLORS){const height=Math.round(Math.min(280,Math.max(190,width*.56))),L=52,R=14,T=14,B=34;let all=[0,...rows.flatMap(r=>keys.map(k=>r[k]))],min=Math.min(...all),max=Math.max(...all);if(max===min)max=min+1;const X=i=>L+i/Math.max(1,rows.length-1)*(width-L-R),Y=v=>T+(max-v)/(max-min)*(height-T-B);let out=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(labels.join(' 및 '))} 추이. 단위 만원"><title>${esc(labels.join(' · '))} (만원)</title>`;
for(let i=0;i<4;i++){const v=min+(max-min)*i/3,y=Y(v);out+=`<line x1="${L}" x2="${width-R}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".18"/><text x="${L-6}" y="${y+4}" text-anchor="end" fill="currentColor" font-size="12">${fmt(v)}</text>`;}
out+=`<line x1="${L}" x2="${width-R}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" opacity=".5" stroke-dasharray="4 4"/>`;
keys.forEach((k,j)=>{out+=`<polyline points="${rows.map((r,i)=>`${X(i)},${Y(r[k])}`).join(' ')}" fill="none" stroke="${colors[j]}" stroke-width="3" stroke-linejoin="round"/>`;});out+=`<text x="${L}" y="${height-10}" fill="currentColor" font-size="12">${rows[0]?.month??0}개월</text><text x="${width-R}" y="${height-10}" text-anchor="end" fill="currentColor" font-size="12">${rows.at(-1)?.month??0}개월</text></svg><div class="chart-legend">${labels.map((s,i)=>`<span style="--legend:${colors[i]}">${s}</span>`).join('')}<small>단위 만원</small></div>`;return out;}
function waterfall(records){const sum=k=>records.reduce((a,r)=>a+r[k],0),rev=sum('sales');if(!rev)return '';
 const rows=[['원재료·상품',sum('material')],['배달·결제 수수료',sum('delivery')+sum('card')],['로열티',sum('royalty')],['인건비',sum('wages')],['임대료',sum('rent')],['기타 운영비',sum('other')],['감가상각',sum('depreciation')],['이자',sum('interest')],['세금·부가세',sum('tax')+sum('vat')]].map(([n,v])=>[n,v/rev*100]);
 const left=100-rows.reduce((a,r)=>a+r[1],0),pct=v=>fmt(v,1);
 return `<div class="wf"><div class="wf-row total"><span>매출</span><div class="bar"><i style="left:0;width:100%"></i></div><b>100</b></div>${rows.map(([n,v])=>`<div class="wf-row"><span>${n}</span><div class="bar"><i style="left:0;width:${Math.min(100,Math.max(0,v))}%"></i></div><b>−${pct(v)}</b></div>`).join('')}<div class="wf-row left${left<0?' neg':''}"><span>남는 돈</span><div class="bar"><i style="left:0;width:${Math.min(100,Math.abs(left))}%"></i></div><b>${left<0?'−':''}${pct(Math.abs(left))}</b></div></div><p class="fine">매출 100만원당 평균. 점주 인건과 가계 생활비는 제외한 사업 기준이며 대출 원금 상환은 비용이 아닙니다.</p>`;}

/* 게임 화면 */
function renderPlay(){const t=totals(sim),r=sim.records.at(-1),e=currentEpisode(sim);
 $('playKicker').textContent=`개업 ${sim.month}개월차`;
 $('progressFill').style.width=`${sim.month/36*100}%`;$('progress').setAttribute('aria-valuenow',String(sim.month));
 $('cashNow').innerHTML=big(sim.cash);$('cashNow').classList.toggle('neg',sim.cash<0);$('salesNow').innerHTML=big(sim.lastRevenue);$('debtNow').innerHTML=big(sim.debt);
 const fatigue=sim.fatigue??0;
 $('statusList').innerHTML=[['월 영업이익',`<b class="${r.operating<0?'neg':''}">${money(r.operating)}</b>`],['지난 구간 현금 증감',`<b class="${sim.lastDelta<0?'neg':''}">${sim.lastDelta>0?'+':''}${money(sim.lastDelta)}</b>`],['점주 노동시간',`<b>주 ${fmt(sim.hours+sim.extraHours)}시간</b>`],['피로',`<b>${fatigue>=65?'높음':fatigue>=35?'보통':'낮음'}</b>`],['추가 휴무',`<b>${sim.restDays??0}일</b>`],['직원',`<b>${sim.staff}명</b>`],...(sim.householdCash>0?[['가계 예비금',`<b>${money(sim.householdCash)}</b>`]]:[])].map(([a,b])=>`<li><span>${a}</span>${b}</li>`).join('');
 const box=$('cashChartBox');box.innerHTML=lineChart([{month:0,cash:sim.buffer,debt:sim.loan},...sim.records],['cash','debt'],['현금','대출'],chartW(box.parentElement));
 paintRunBurden(sim,r);
 const sc=sceneFor(e,sim),scene=$('scene');scene.hidden=!sc;scene.innerHTML=sceneHTML(sc);
 if(e){const who=episodeSpeaker(e),person=who!==e.channel,nm=who.split(' · ').pop();$('eventWho').innerHTML=person?`<i>${esc(nm[0])}</i><b>${esc(who)}</b>`:`<b>${esc(who)}</b>`;$('eventTitle').textContent=e.title;$('eventText').innerHTML=eventView({channel:e.channel,who:episodeSpeaker(e),text:episodeContext(sim,e),month:sim.month});}
 else{$('eventWho').innerHTML='';$('eventTitle').textContent='최종 결산';$('eventText').innerHTML='';}
 $('eventChoices').innerHTML='';if(e)for(const key of ['a','b']){const c=e[key],b=document.createElement('button');b.className='choice';b.type='button';b.innerHTML=`<i>${key==='a'?1:2}</i><span></span>`;b.lastChild.textContent=c;b.onclick=()=>{decideEpisode(sim,key);renderState();};$('eventChoices').append(b);}
 const f=forecastClosure(sim);$('closePreview').innerHTML=`지금 정리하면 ${money(f.now)} · ${f.target}개월까지 영업 후 정리하면 ${money(f.later)}<br>영업하는 동안 생활비 ${money(f.livingPaid)}가 가게 현금에서 나갑니다.<br><small>${f.assumption} 회수액은 음수가 될 수 있습니다.</small>`;}
function arrangeResults(){const flow=$('resultFlow');for(const id of ['keyEventBlock','wfBlock','salaryComparison','priorRun','afterClosing','runCharts','extendedResults','resultShare']){const el=$(id);if(el)flow.append(el);}if($('salaryComparison'))$('salaryComparison').open=true;}
function renderState(){
 try{localStorage.setItem("survival-v3",JSON.stringify(sim));}catch{}
 if(sim.finished){renderResults();renderOutcome(sim,totals(sim));renderRunCharts();arrangeResults();return;}
 if($('play').classList.contains('off'))show('play');
 renderPlay();
}
function renderRunCharts(){
 let charts=$('runCharts');
 if(!charts){charts=document.createElement('details');charts.id='runCharts';charts.className='assumptions';$('resultFlow').append(charts);}
 const costs=businessOutflows(sim.records);
 const major=largestDecisionExpense(sim.decisions);
 const breakdown=costs.rows.map(({label,amount})=>{const share=100*amount/costs.total;return `<tr><th scope="row">${label}</th><td>${money(amount)}</td><td>${fmt(share,1)}%</td></tr>`;}).join('');
 charts.innerHTML=`<summary>36개월 추이와 지출 내역</summary>
  <p>가계 예비금 잔액 <strong>${money(sim.householdCash??0)}</strong></p>
  <div class="chart-wrap" id="runChartA"></div><div class="chart-wrap" id="runChartB"></div>
  ${breakdown?`<h3>영업 기간 사업 지출</h3><div class="tablewrap"><table><thead><tr><th>항목</th><th>지출</th><th>비중</th></tr></thead><tbody>${breakdown}</tbody></table></div>`:''}
  ${major?`<p>가장 큰 일시 지출 · ${major.month}개월, ${esc(major.title)} <strong>${money(major.cost)}</strong></p>`:''}`;
 charts.addEventListener('toggle',()=>{if(!charts.open)return;const a=$('runChartA'),b=$('runChartB');a.innerHTML=lineChart(sim.records,['sales','netIncome'],['매출','세후 손익'],chartW(a));b.innerHTML=lineChart([{month:0,cash:sim.buffer,debt:sim.loan},...sim.records],['cash','debt'],['현금','대출'],chartW(b));},{once:false});
}
const replayControls=document.createElement('div');
replayControls.className='actions';
for(const [label,sameSeed] of [['같은 조건으로 다시',false],['같은 사건 시드로 다시',true]]){
 const button=document.createElement('button');
 button.type='button';
 button.className='action-alt';
 button.textContent=label;
 button.onclick=()=>{
  const seed=sameSeed?sim.seed:crypto.getRandomValues(new Uint32Array(1))[0];
  const input=sim.initialInput??{
   ...sim.config,
   deliveryShare:Math.max(0,Math.min(100,sim.config.deliveryShare-
    (sim.config.strategy==='delivery'?20:sim.config.strategy==='local'?-20:0))),
  };
  const environment=sim.environment;
  const previousRun={environment,months:sim.month,equity:liquidation(sim).net,hours:totals(sim).hours};
  sim=Object.assign(applyEnvironment(createSimulation(input),environment),{initialInput:input,previousRun,annualSalary:sim.annualSalary});
  beginEpisodes(sim,seed);
  renderState();
 };
 replayControls.append(button);
}
const replayEnvironment=document.createElement('select');
replayEnvironment.setAttribute('aria-label','다시 도전할 경제 환경');
for(const [key,scenario] of Object.entries(environments))replayEnvironment.add(new Option(scenario.label,key));
const compareRun=document.createElement('button');
compareRun.type='button';
compareRun.className='action-alt';
compareRun.textContent='환경을 바꿔 다시';
compareRun.onclick=()=>{
 const input=sim.initialInput;
 if(!input)return;
 const previousRun={environment:sim.environment,months:sim.month,equity:liquidation(sim).net,hours:totals(sim).hours};
 const seed=sim.seed;
 sim=Object.assign(applyEnvironment(createSimulation(input),replayEnvironment.value),{initialInput:input,previousRun,annualSalary:sim.annualSalary});
 beginEpisodes(sim,seed);
 renderState();
};
replayControls.append(replayEnvironment,compareRun);
$('restart').closest('.actions').after(replayControls);
$('start').onclick=()=>{
 try{
  const input=read();
  const salary=$('annualSalary');
  if(!salary.value||!salary.checkValidity())throw Error('비교용 연봉을 확인하세요.');
  sim=Object.assign(applyEnvironment(createSimulation(input),economySelect.value),{initialInput:input,annualSalary:Number(salary.value)});
  resume.remove();
  beginEpisodes(sim,crypto.getRandomValues(new Uint32Array(1))[0]);
  renderState();
 }catch(e){
  $('startAlert').textContent=e.message;
 }
};
const resume=document.createElement('button');
resume.type='button';
resume.className='btn';
resume.textContent='이어서 플레이';
try{
 const saved=JSON.parse(localStorage.getItem('survival-v3'));
 if(saved?.seen){
  if(saved.finished)resume.textContent='지난 결과 보기';
  $('resumeBox').append(resume);
  resume.onclick=()=>{sim=saved;resume.remove();renderState();};
 }
}catch{}
$('quit').onclick=()=>{close(sim);renderState();};

/* 결과 */
const metric=(label,value)=>`<div class="result-metric"><span>${label}</span><strong>${value}</strong></div>`;
function renderResults(){const t=totals(sim),l=t.liquidation,gap=l.net-sim.own;
 $('resultTitle').textContent=sim.reason;{const rs=$('resultScene');rs.hidden=false;rs.innerHTML=sceneHTML(sim.closed?{svg:'closed',tag:'폐업'}:{art:'art-open',tag:`${sim.month}개월 영업`});}
 const span=sim.month>=36?'3년':`${sim.month}개월`;
 $('resultHeadline').innerHTML=`당신은 ${span} 동안<br>${eok(t.revenue)}을 팔았습니다.<br><em class="${gap>=0?'pos':''}">${gap>=0?'창업할 때보다 자본이 늘었습니다.':'하지만 손에 남은 돈은 창업할 때보다 적었습니다.'}</em>`;
 $('resultMessage').textContent=`${sim.p.name} · ${sim.a.name} · 청산하면 ${money(l.net)}가 남습니다. 창업 때 자기자본은 ${money(sim.own)}였고 차이는 ${gap>=0?'+':''}${money(gap)}입니다.`;
 $('finalWorth').innerHTML=big(l.net);$('finalWorth').classList.toggle('neg',gap<0);$('finalWorth').classList.toggle('pos',gap>=0);
 $('finalWorthSub').textContent=`자기자본 ${money(sim.own)} 대비`;
 $('laborHours').innerHTML=`${fmt(t.hours)}<small>시간</small>`;$('debtLeft').innerHTML=big(sim.debt);$('hourlyReal').innerHTML=`${fmt(t.hourly)}<small>원</small>`;
 const major=largestDecisionExpense(sim.decisions),recent=sim.decisions.slice(-6).map(d=>`<li><b>${d.month}개월</b> · ${esc(d.title)}</li>`).join('');
 $('keyEvent').innerHTML=`${major?`<p class="scene-number" style="font-size:20px">${major.month}개월 · ${esc(major.title)}<span>${money(major.cost)}</span></p>`:'<p>가장 큰 일시 지출은 없었습니다.</p>'}${recent?`<ul class="timeline">${recent}</ul>`:''}`;
 $('wfBox').innerHTML=waterfall(sim.records);
 $('extendedResults').innerHTML=`<div class="result-block"><h3>사장님의 시간값</h3><div class="hourly-panel"><p>점주 노동시간당 사업소득</p><strong>${fmt(t.hourly)}<small>원 / 시간</small></strong><p>2026년 최저임금 10,320원과 ${t.hourly>=10320?'비교하면 이상':'비교하면 미만'}입니다. 영업이익 ÷ 노동시간이며 자본 수익이 섞여 있고 법정 임금이 아닙니다.</p><details class="assumptions"><summary>내 기준으로 다시 계산</summary><label for="resultHour">비교 시급 (원)</label><input id="resultHour" type="number" min="0" max="100000" value="${sim.hourly}"/><label for="resultCapital">자기자본 기회비용 (연 %)</label><input id="resultCapital" type="number" min="0" max="30" step=".1" value="${sim.capitalRate}"/><p id="economicOutput">경제적 수익 ${money(t.economic)}</p></details></div></div><details class="assumptions"><summary>세부 수치와 청산 정산</summary><div class="result-grid">${metric('초기 투자·보증금',money(sim.startcost))}${metric('초기 자기자본',money(sim.own))}${metric('가게 현금에서 쓴 생활비',money(sim.records.reduce((x,r)=>x+(r.ownerDraw??0),0)))}${metric('누적 매출',money(t.revenue))}${metric('누적 영업손익',money(t.operating))}${metric('점주 노동비용 차감 후',money(t.operating-t.labor))}${metric('노동·자본 기회비용 반영 후',money(t.economic))}${metric('사업 현금 잔액',money(sim.cash))}${metric('청산 기준 투자 회수율',fmt(t.recovery,1)+'%')}${metric('종료 방식',sim.closed?'영업 정리':'36개월 운영 완료')}</div><h4 style="margin-top:var(--s5)">청산 정산</h4><div class="result-grid">${metric('현금',money(l.cash))}${metric('회수 보증금',money(l.recoveredDeposit))}${metric('시설 처분액',money(l.salvage))}${metric('잔여 대출',money(l.debt))}${metric('철거·복구비',money(l.demolition))}${metric('계약 해지비',money(l.termination))}</div><p class="help">36개월 운영 완료 시에도 비교를 위해 같은 청산 가정을 적용했습니다. 보증금 회수율 ${sim.depositRecovery}%, 시설 처분 비율 ${sim.salvage}%에서 경과월수만큼 감액하며 권리금 회수는 0입니다.</p></details>`;
 $('extendedResults').insertAdjacentHTML('afterbegin',deliveryResult(sim));$('resultDeliveryLink').onclick=()=>{reality(false);currentStory=articles.findIndex(a=>a.id==='delivery');renderStory();$('reality').scrollIntoView({behavior:'smooth'});};
 const recalc=()=>{const h=Number($('resultHour').value),c=Number($('resultCapital').value);$('economicOutput').textContent=$('resultHour').value!==''&&$('resultCapital').value!==''&&$('resultHour').checkValidity()&&$('resultCapital').checkValidity()?`경제적 수익 ${money(t.operating-t.hours*h/10000-sim.own*c/100*sim.month/12)}`:'입력 범위를 확인하세요.';};$('resultHour').oninput=recalc;$('resultCapital').oninput=recalc;
 $('bridgeLine').textContent=sim.closed?'게임 속 당신은 3년을 버티지 못했습니다.':'게임 속 당신은 3년을 버텼습니다.';
 document.querySelector('#results thead').innerHTML='<tr><th>월</th><th>매출</th><th>영업손익</th><th>이자</th><th>원금</th><th>세금·유보</th><th>생활비</th><th>현금증감</th><th>현금잔액</th><th>노동시간</th></tr>';
 $('recordTable').innerHTML=sim.records.map(r=>`<tr>${[r.month,...['sales','operating','interest','principal'].map(k=>fmt(r[k])),fmt(r.tax+r.vat),fmt(r.living),fmt(r.flow),fmt(r.cash),fmt(r.hours)].map(v=>`<td>${v}</td>`).join('')}</tr>`).join('');show('results');}
$('restart').onclick=()=>{sim=null;personal=false;$('personalized').innerHTML='';summary();show('setup');goStep(1);};
$('again').onclick=e=>{e.preventDefault();show('setup');goStep(1);};
$('navPlay').onclick=e=>{if(!sim)return;e.preventDefault();show(sim.finished?'results':'play');};
$('export').onclick=()=>{if(!sim)return;const cols=['month','sales','material','royalty','delivery','card','wages','rent','other','depreciation','operating','interest','principal','tax','vat','living','netIncome','flow','cash','debt','hours','labor','capital','economic'];const csv=['# 가상 시나리오 / 금액 만원 / 시간 hours / 공식 관측치 아님',cols.join(','),...sim.records.map(r=>cols.map(k=>r[k]).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='자영업_3.0_가상월별장부.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};

/* 실제 사장님들 */
function reality(personalize=false){personal=personalize&&!!sim;if(!personal)$('personalized').innerHTML='';if(personal){const rec=recommend(sim);currentStory=articles.findIndex(a=>a.id===rec.id);$('personalized').innerHTML=`<span>게임에서 겪은 일과 이어지는 이야기</span><h3>${esc(rec.why)}</h3>`;}renderStory();}
$('compare').onclick=()=>{reality(true);$('reality').scrollIntoView({behavior:'smooth'});};
$('navReality').onclick=()=>reality(false);
function illustration(id){if(id==='rent')return `<div class="interactive-chart"><span>가상 구조 실험</span><label for="salesSlider" class="label">월 매출 <b id="sliderLabel"></b></label><input id="salesSlider" type="range" min="600" max="3500" value="2200" step="100"/><div id="breakChart"></div><p id="breakCaption"></p><small>가정: 원재료 40%, 고정 인건비 500만원, 임대료 250만원, 기타 고정비 150만원. 이자·세금·감가상각 제외. 현금은 초기 500만원에서 1개월 증감.</small></div>`;
 if(id==='delivery')return deliveryStoryMarkup();
 if(id==='franchise')return `<div class="cost-structure">${['가입 시 → 가맹비·교육비','돌려받을 수 있는 돈 → 보증금','매달 → 로열티·필수품목','정리할 때 → 해지·원상복구'].map((s,i)=>`<div><b>0${i+1}</b><p>${s}</p></div>`).join('')}</div><p class="reality-caption">정보공개서의 기존 가맹점 평균 매출은 신규 점포의 예상 매출이 아닙니다. 게임의 비용·계약 조건은 업종 공통 모형입니다.</p>`;
 if(id==='labor')return `<div class="scene-number">60<span>시간 / 주</span></div><p class="reality-caption">가상 게임의 기본 점주 노동시간입니다. 실제 자영업자의 평균이 아닙니다.</p>`;
 if(id==='closure'||id==='debt')return `<div class="flow-diagram">${(id==='closure'?['현금 + 회수 자산','− 남은 부채','− 가게 정리 비용','= 다음 출발의 자금']:['매출 − 운영비','= 영업이익','− 이자·세금·원금','= 통장 현금의 변화']).map(s=>`<div>${s}</div>`).join('')}</div>`;
return `<div class="street-diagram" aria-label="수요 이동과 점포 경쟁을 설명하는 개념도"><div>학생·고시생 수요</div><b>↓ 문화·인구·상권의 변화</b><div>같은 거리, 달라진 고객</div><b>↓ 점포 사이의 경쟁</b><div>매출과 고정비의 간격</div></div><p class="reality-caption">취재를 설명하는 개념도이며 관악구 인구·점포 수의 실제 시계열이 아닙니다.</p>`;}
const photos={demand:['https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202409/24/27a53bdc-c3c2-4d3e-9d48-6f9e96f5c2f0.jpg','녹두호프에서 맥주병을 치우는 점주 김례숙 씨','2024년 9월, 서울 관악구 녹두호프'],rent:['https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202409/25/5f6b8026-67e1-4181-8b20-8f37e3999ac9.jpg','호부침개 백선기 씨가 손님을 기다리며 가게 밖을 내다보는 모습','호부침개 백선기 씨가 손님을 기다리면서 가게 밖을 내다보고 있다.'],franchise:['https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202409/27/91a44d9b-a69e-41ab-bffe-4d6097cb6639.jpg','맘스터치 상도역점 황성구 씨가 손님을 기다리는 모습','맘스터치 상도역점 황성구 씨(왼쪽)가 손님을 기다리고 있다.']};
const photo=id=>photos[id]?`<figure class="story-photo"><img src="${photos[id][0]}" alt="${photos[id][1]}" loading="lazy" referrerpolicy="no-referrer"><figcaption>${photos[id][2]} · 사진 중앙일보</figcaption></figure>`:'';
function renderStory(){const a=articles[currentStory];$('storyTabs').innerHTML=articles.map((a,i)=>`<button type="button" data-story="${i}" aria-pressed="${i===currentStory}">${String(i+1).padStart(2,'0')} ${a.title}</button>`).join('');$('storyTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{currentStory=Number(b.dataset.story);renderStory();});$('storyContent').innerHTML=`<div class="story-heading"><span>${a.reportedAt} 당시</span><h3>${a.title}</h3></div><div class="story-body"><p class="story-question">${a.question}</p><p>${a.facts}</p>${photo(a.id)}<div class="article-note"><small>취재 대상: ${a.subject}<br>확인 범위: ${a.verification}</small><br>${link(a.url,a.originalTitle??'관련 기획 원문')}</div></div>${illustration(a.id)}<div class="related-sources">${a.relatedStatistics.map(k=>link(sources[k].url,sources[k].label)).join('<br>')}</div>`;$('prevStory').disabled=currentStory===0;$('nextStory').textContent=currentStory===articles.length-1?'그때와 지금 비교하기':'다음 이야기';
 if(a.id==='rent'){const draw=()=>{const sales=Number($('salesSlider').value),profit=sales*.6-900;$('sliderLabel').textContent=money(sales);const rows=Array.from({length:30},(_,i)=>{const v=600+i*100;return{month:v,op:v*.6-900,cash:500+v*.6-900};});$('breakChart').innerHTML=lineChart(rows,['op','cash'],['영업손익 (감가상각 제외)','1개월 뒤 현금'],chartW($('breakChart')),LIGHT);$('breakChart').querySelector('svg').setAttribute('aria-label','매출 600~3500만원일 때 영업손익과 1개월 뒤 현금. 손익분기 매출 1500만원');$('breakChart').querySelectorAll('svg text').forEach(n=>{if(n.textContent.endsWith('개월'))n.textContent=n.getAttribute('text-anchor')==='end'?'매출 3,500':'매출 600';});$('breakCaption').textContent=`선택 매출 ${money(sales)} − 원재료 ${money(sales*.4)} − 인건비 500만원 − 임대료 250만원 − 기타 150만원 = 영업손익 ${money(profit)} / 현금 ${money(500+profit)}. 손익분기 매출 1,500만원.`;};$('salesSlider').oninput=draw;draw();}
 if(a.id==='delivery')wireDeliveryStory();}
$('prevStory').onclick=()=>{currentStory=Math.max(0,currentStory-1);renderStory();$('storyContent').scrollIntoView({behavior:'smooth'});};$('nextStory').onclick=()=>{if(currentStory===articles.length-1){$('data').scrollIntoView({behavior:'smooth'});return;}currentStory++;renderStory();$('storyContent').scrollIntoView({behavior:'smooth'});};

/* 데이터 */
function comparison(){const d=indicators.find(d=>d.id===$('indicatorSelect').value),src=sources[d.source],change=d.officialChange??(d.changeType==='pp'?d.after-d.before:(d.after/d.before-1)*100);const max=Math.max(d.before,d.after)*1.16;$('comparison').innerHTML=`<div class="comparison-main"><p>${d.name}</p><div class="comparison-values"><div><span>${d.beforePeriod}</span><strong>${fmt(d.before,1)}<small>${d.unit}</small></strong></div><b>→</b><div><span>${d.afterPeriod}</span><strong>${fmt(d.after,1)}<small>${d.unit}</small></strong></div></div><div class="compare-bars"><span style="width:${d.before/max*100}%">이전 ${fmt(d.before,1)}</span><span style="width:${d.after/max*100}%">최신 ${fmt(d.after,1)}</span></div><div class="change"><b>${change>0?'+':''}${fmt(change,1)}${d.changeType==='pp'?'%p':'%'}</b><p>${d.meaning}</p></div><p class="fine">최신 자료 발표일 ${src.published} · 확인일 ${checkedAt}</p>${link(src.url,src.label)}${d.beforeSource?'<br>'+link(sources[d.beforeSource].url,'이전 공표 자료'):''}</div>`;}
$('indicatorSelect').innerHTML=indicators.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');$('indicatorSelect').onchange=comparison;
$('dataCards').innerHTML=indicators.map(d=>`<button type="button" class="data-card" data-indicator="${d.id}"><span>${d.name}</span><strong>${fmt(d.after,1)}<small>${d.unit}</small></strong><p>${d.afterPeriod}</p><em>이전과 비교하기</em></button>`).join('');$('dataCards').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('indicatorSelect').value=b.dataset.indicator;comparison();$('comparison').scrollIntoView({behavior:'smooth'});});
$('pendingData').innerHTML=pending.map(([label,status,key])=>`<div class="pending-row"><strong>${label}</strong><p>${status}</p>${link(sources[key].url,'확인 경로')}</div>`).join('');
$('articleSources').innerHTML=articles.map(a=>`<p>${link(a.url,a.originalTitle??a.title)}<small> · ${a.reportedAt} · ${a.verification}</small></p>`).join('');
$('officialSources').innerHTML=Object.values(sources).filter(s=>s.kind==='official').map(s=>`<p>${link(s.url,s.label)}<small>${s.published?' · 발표 '+s.published:''}</small></p>`).join('');
$('methodText').innerHTML=`<p>${methods.accounting}</p><p class="help">${methods.simulation}</p>`;
$('allMethods').innerHTML=Object.entries(methods).map(([k,v])=>`<p>${v}</p>`).join('');
paintUpdates();summary();reality();comparison();
