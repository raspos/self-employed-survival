// v2 cash-flow extension. Profiles, areas, seasonality and five checkpoint events
// are retained from the supplied prototype; units are KRW 10,000 throughout.
export const profiles={chicken:{name:'치킨',symbol:'🍗',caption:'배달과 홀 운영의 균형',sales:2700,costRatio:.43,royalty:.03,wages:550,rent:240,other:180,entry:1500,interior:5500,deposit:2500},cafe:{name:'카페',symbol:'☕',caption:'객단가·회전율·임대료',sales:1900,costRatio:.32,royalty:.04,wages:500,rent:220,other:160,entry:1200,interior:4800,deposit:2200},store:{name:'편의점',symbol:'🏪',caption:'상품 원가와 긴 영업시간',sales:4300,costRatio:.70,royalty:.01,wages:420,rent:260,other:200,entry:1000,interior:4400,deposit:2500},snack:{name:'분식',symbol:'🍜',caption:'점심 피크와 원가 관리',sales:2200,costRatio:.39,royalty:.025,wages:480,rent:210,other:150,entry:1000,interior:4000,deposit:2000}};
export const areas={res:{name:'수도권 주거지역',sales:1,rent:0,deposit:0},center:{name:'서울 주요 상권',sales:1.17,rent:180,deposit:1500},local:{name:'중소도시 상권',sales:.82,rent:-80,deposit:-800}};
export const defaults={industry:'chicken',area:'res',own:10000,loan:3000,living:280,size:20,staff:2,hours:60,rate:5,term:60,repayment:'amortizing',strategy:'balanced',brand:'standard',sales:null,costRatio:null,rent:null,interior:null,entry:null,deposit:null,franchiseDeposit:300,keyMoney:500,deliveryShare:40,deliveryFee:7.8,deliveryPerOrder:2900,ticket:25000,cardFee:1.5,deliveryPayment:3,taxRate:10,vatRate:2,hourly:10320,capitalRate:3,demolition:600,termination:200,depositRecovery:100,salvage:20};
function finite(v,key){if(!Number.isFinite(v))throw Error(key+' 값이 올바르지 않습니다.');}
export function normalize(input={}){const c={...defaults,...input};if(!profiles[c.industry]||!areas[c.area])throw Error('업종 또는 지역을 확인하세요.');
 const bounds={own:[1000,100000],loan:[0,100000],living:[0,5000],size:[5,100],staff:[0,10],hours:[1,112],rate:[0,30],term:[1,360],franchiseDeposit:[0,10000],keyMoney:[0,50000],deliveryShare:[0,100],deliveryFee:[0,30],deliveryPerOrder:[0,20000],ticket:[1000,100000],cardFee:[0,20],deliveryPayment:[0,20],taxRate:[0,50],vatRate:[0,10],hourly:[0,100000],capitalRate:[0,30],demolition:[0,10000],termination:[0,10000],depositRecovery:[0,100],salvage:[0,100]};
 for(const [k,[lo,hi]]of Object.entries(bounds)){finite(c[k],k);if(c[k]<lo||c[k]>hi)throw Error(`${k}: ${lo}~${hi} 범위로 입력하세요.`);}
 for(const k of ['sales','rent','interior','entry','deposit','costRatio'])if(c[k]!==null){finite(c[k],k);if(c[k]<0||c[k]>(k==='costRatio'?.95:1000000))throw Error(k+' 범위를 확인하세요.');}
 if(!['amortizing','bullet'].includes(c.repayment)||!['balanced','delivery','local'].includes(c.strategy)||!['standard','compact'].includes(c.brand))throw Error('운영 조건을 확인하세요.');return c;}
export function setup(input={}){const c=normalize(input),p=profiles[c.industry],a=areas[c.area],scale=c.size/20,b=c.brand==='compact'?.8:1;
 const deposit=c.deposit??Math.max(300,p.deposit+a.deposit),interior=c.interior??p.interior*scale*b,entry=c.entry??p.entry*b;
 const startcost=deposit+interior+entry+c.franchiseDeposit+c.keyMoney;
 return {...c,p,a,deposit,interior,entry,startcost,buffer:c.own+c.loan-startcost,sales:c.sales??p.sales*a.sales*Math.sqrt(scale)*(c.strategy==='delivery'?1.08:c.strategy==='local'?.96:1),rent:c.rent??Math.max(60,p.rent+a.rent)*scale,wages:p.wages*c.staff/2,other:p.other*scale,costRatio:c.costRatio??p.costRatio,royalty:p.royalty,deliveryShare:c.strategy==='delivery'?Math.min(100,c.deliveryShare+20):c.strategy==='local'?Math.max(0,c.deliveryShare-20):c.deliveryShare};}
export function createSimulation(input={}){const s=setup(input);if(s.buffer<0)throw Error('창업자금이 부족합니다.');return {...s,config:{...s},month:0,cash:s.buffer,debt:s.loan,records:[],decisions:[],revenueMult:1,extraFixed:0,extraHours:0,finished:false,closed:false,reason:'',lastRevenue:0,lastDelta:0};}
export function monthlyVariation(m){return 1+0.085*Math.sin(m*1.79+2.1)+0.045*Math.cos(m*.53+1.2)-0.024*Math.floor((m-1)/12);}
export function calculateMonth(s,m=s.month+1,variation=monthlyVariation(m)){
 const sales=s.sales*s.revenueMult*variation,deliverySales=sales*s.deliveryShare/100,orders=deliverySales*10000/s.ticket;
 const material=sales*s.costRatio,royalty=sales*s.royalty,delivery=deliverySales*s.deliveryFee/100+orders*s.deliveryPerOrder/10000;
 // Delivery payment and in-store card fees apply to disjoint sales bases.
 const card=(sales-deliverySales)*s.cardFee/100+deliverySales*s.deliveryPayment/100;
 const cashOperating=material+royalty+delivery+card+s.wages+s.rent+s.other+s.extraFixed;
 const depreciation=s.interior/60,operating=sales-cashOperating-depreciation;
 const interest=s.debt*s.rate/100/12;
 const principal=s.repayment==='amortizing'?Math.min(s.debt,s.loan/s.term):(m===s.term?s.debt:0);
 // VAT is an explicitly simplified effective reserve on VAT-exclusive revenue;
 // it affects cash once; income tax is based on positive profit after interest.
 const vat=sales*s.vatRate/100,tax=Math.max(0,operating-interest)*s.taxRate/100;
 const netIncome=operating-interest-tax,flow=netIncome+depreciation-vat-principal-s.living;
 const hours=(s.hours+s.extraHours)*52/12,labor=hours*s.hourly/10000,capital=s.own*s.capitalRate/100/12;
 return {month:m,sales,material,royalty,delivery,card,wages:s.wages,rent:s.rent,other:s.other+s.extraFixed,depreciation,operating,interest,principal,vat,tax,netIncome,flow,living:s.living,hours,labor,capital,economic:operating-labor-capital,cash:s.cash+flow,debt:Math.max(0,s.debt-principal)};
}
export const events=[
 {month:6,key:'material',title:'원재료비가 올랐습니다',text:'가상 사건 · 납품단가 인상에 어떻게 대응하시겠습니까?',a:{title:'메뉴를 재설계한다',info:'일시 비용 200만원 · 원가율 1%p 개선',apply:s=>{s.costRatio=Math.max(.15,s.costRatio-.01)},cost:200},b:{title:'당분간 버텨 본다',info:'일시 비용 없음 · 원가율 2%p 상승',apply:s=>{s.costRatio=Math.min(.95,s.costRatio+.02)},cost:0}},
 {month:12,key:'delivery',title:'배달 경쟁이 치열해졌습니다',text:'가상 사건 · 주문을 늘리는 비용과 추가 매출을 함께 보세요.',a:{title:'배달·홍보에 투자한다',info:'일시 비용 300만원 · 매출 기준 +5% · 월 고정비 +35만원',apply:s=>{s.revenueMult*=1.05;s.extraFixed+=35},cost:300},b:{title:'기존 고객을 지킨다',info:'일시 비용 없음 · 매출 기준 −4%',apply:s=>{s.revenueMult*=.96},cost:0}},
 {month:18,key:'competition',title:'바로 옆에 경쟁점이 생겼습니다',text:'가상 사건 · 상권의 고객을 두고 경쟁하게 되었습니다.',a:{title:'매장을 새단장한다',info:'일시 비용 400만원 · 매출 기준 +3%',apply:s=>{s.revenueMult*=1.03},cost:400},b:{title:'지출을 줄이며 대응한다',info:'일시 비용 없음 · 매출 기준 −7%',apply:s=>{s.revenueMult*=.93},cost:0}},
 {month:24,key:'rent',title:'임대차 계약 갱신 시점입니다',text:'가상 사건 · 임대인이 임대료를 인상하려 합니다.',a:{title:'재계약 조건을 협상한다',info:'일시 비용 100만원 · 월 임대료 +10만원',apply:s=>{s.rent+=10},cost:100},b:{title:'인상안을 받아들인다',info:'일시 비용 없음 · 월 임대료 +40만원',apply:s=>{s.rent+=40},cost:0}},
 {month:30,key:'labor',title:'직원 채용이 어렵습니다',text:'가상 사건 · 내 노동시간도 장부에 기록됩니다.',a:{title:'사장이 근무시간을 늘린다',info:'월 인건비 최대 70만원 절감 · 점주 주 10시간 추가 (최대 112시간)',apply:s=>{s.wages=Math.max(0,s.wages-70);s.extraHours=Math.min(10,112-s.hours)},cost:0},b:{title:'임금을 올려 채용한다',info:'일시 비용 100만원 · 월 인건비 +30만원',apply:s=>{s.wages+=30},cost:100}}
];
export function advance(s){if(s.finished)return s;const target=Math.min(s.month+6,36);s.lastRevenue=0;const before=s.cash;while(s.month<target){const r=calculateMonth(s);s.records.push(r);s.month=r.month;s.cash=r.cash;s.debt=r.debt;s.lastRevenue+=r.sales;if(s.cash<0){s.finished=true;s.closed=true;s.reason='현금 부족으로 영업 중단';break;}}s.lastDelta=s.cash-before;if(s.month===36){s.finished=true;s.reason='3년 영업 종료';}return s;}
export function choose(s,key){if(s.finished)return s;const e=events.find(e=>e.month===s.month);if(!e||!['a','b'].includes(key))throw Error('선택할 수 없는 시점입니다.');const c=e[key];c.apply(s);s.cash-=c.cost;
 // Expense recognised once in both P&L and cash in the checkpoint month.
 const r=s.records.at(-1);r.other+=c.cost;r.operating-=c.cost;r.netIncome-=c.cost;r.economic-=c.cost;r.flow-=c.cost;r.cash-=c.cost;
 s.decisions.push({month:s.month,key:e.key,choice:key,title:c.title,cost:c.cost});if(s.cash<0){s.finished=true;s.closed=true;s.reason='의사결정 지출 후 현금 부족';return s;}return advance(s);}
export function close(s){if(s.finished)return s;s.finished=true;s.closed=true;s.reason='자발적 폐업 및 정산';return s;}
export function liquidation(s){const recoveredDeposit=(s.deposit+s.franchiseDeposit)*s.depositRecovery/100,salvage=s.interior*s.salvage/100*Math.max(0,1-s.month/60),demolition=s.demolition,termination=s.termination;return {cash:s.cash,recoveredDeposit,salvage,debt:s.debt,demolition,termination,net:s.cash+recoveredDeposit+salvage-s.debt-demolition-termination};}
export function totals(s){const sum=k=>s.records.reduce((n,r)=>n+r[k],0),l=liquidation(s);return {revenue:sum('sales'),operating:sum('operating'),hours:sum('hours'),labor:sum('labor'),economic:sum('economic'),netIncome:sum('netIncome'),flow:sum('flow'),delivery:sum('delivery'),rent:sum('rent'),interest:sum('interest'),principal:sum('principal'),hourly:sum('hours')?sum('operating')*10000/sum('hours'):0,recovery:l.net/s.own*100,investmentReturn:l.net-s.own,liquidation:l};}
export function recommend(s){const t=totals(s);if(s.closed)return {id:'closure',why:'가게 정리와 남은 부채를 함께 살펴봅니다.'};if(t.interest+t.principal>t.operating*.7&&s.loan>0)return {id:'debt',why:'영업손익과 대출 상환 뒤의 현금은 다릅니다.'};if(t.hourly<s.hourly||s.hours+s.extraHours>=70)return {id:'labor',why:'당신의 노동시간을 비용으로 계산하면 결과가 달라집니다.'};if(t.delivery>t.rent)return {id:'delivery',why:'배달 관련 비용이 임대료보다 컸습니다.'};if(s.revenueMult<.95)return {id:'demand',why:'매출 감소는 상권의 변화와도 연결됩니다.'};return {id:'rent',why:'매출이 바뀌어도 매달 나가는 고정비를 살펴봅니다.'};}
export function forecastClosure(s){const next=structuredClone(s);next.finished=false;next.closed=false;next.reason='';const target=Math.min(next.month+6,36);while(next.month<target){const r=calculateMonth(next);next.month=r.month;next.cash=r.cash;next.debt=r.debt;}return {now:liquidation(s).net,later:liquidation(next).net,target,assumption:'추가 의사결정 없이 현재 조건과 동일한 계절 변동을 적용한 6개월 전망입니다. 실제 예측이 아닙니다.'};}
