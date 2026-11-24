import { calculateMonth } from './simulation.js';

const catalog = [
 ['chicken','배달앱 알림','배달비 조정','다음 달부터 배달 주문 한 건당 점주 부담이 500원 오릅니다.','포장 주문을 받는다','배달을 유지한다','delivery'],
 ['chicken','거래처 문자','닭 납품 지연','거래처에서 이번 주 물량이 부족하다는 연락이 왔습니다.','다른 거래처를 찾는다','메뉴를 줄인다','material'],
 ['chicken','손님 전화','야구장 단체 주문','경기 시작 전에 치킨 40마리를 맞춰 달라는 주문이 들어왔습니다.','임시 인력을 구한다','받을 수 있는 양만 제안한다','order'],
 ['cafe','상인회 소식','길 건너 카페','새 카페가 출근 시간에 커피를 할인합니다.','아침 메뉴를 손본다','단골 응대에 집중한다','competition'],
 ['cafe','직원과 대화','오전 줄이 길어졌다','출근 시간 손님들이 줄을 보고 돌아갑니다.','오전 근무자를 늘린다','메뉴를 간소화한다','labor'],
 ['cafe','단골 문자','원두를 사고 싶다는 손님','단골들이 집에서도 마실 수 있게 원두를 팔아 달라고 합니다.','소량으로 시작한다','음료 판매에 집중한다','order'],
 ['store','본사 공문','심야 영업 재검토','심야 매출이 줄었습니다. 본사 담당자가 운영 시간 조정을 논의하자고 합니다.','심야 운영을 줄인다','지금 운영 시간을 유지한다','rest'],
 ['store','직원 문자','도시락 폐기','밤마다 남는 도시락을 정리하느라 마감이 늦어집니다.','발주량을 줄인다','마감 할인을 한다','material'],
 ['store','본사 공문','냉장 진열장 교체','냉장 진열장의 온도가 하루에도 몇 번씩 올라갑니다.','교체한다','수리를 맡긴다','repair'],
 ['snack','상인회 소식','방학을 앞둔 대학가','다음 주부터 수업이 끝나면서 점심 유동인구가 줄어듭니다.','동네 손님용 메뉴를 낸다','발주와 영업 시간을 줄인다','competition'],
 ['snack','거래처 문자','채소 공급가 인상','채소 거래처에서 다음 주문부터 단가를 올려 달라고 합니다.','제철 재료로 바꾼다','기존 메뉴를 유지한다','material'],
 ['snack','손님 전화','교내 행사 주문','학과 행사에 맞춰 김밥을 아침 일찍 준비해 달라는 요청입니다.','준비 인력을 구한다','주문 수량을 줄여 제안한다','order'],
 ['*','건물주 전화','월세 갱신','건물주가 다음 계약부터 월세를 올리고 싶다고 합니다.','갱신 조건을 협상한다','인상안을 받아들인다','rent'],
 ['*','가족 문자','하루만 같이 쉬자','가족이 오랫동안 미뤄 온 약속을 이번 달에는 지키자고 합니다.','하루 문을 닫는다','영업 후에 만난다','rest'],
 ['*','직원과 대화','다음 달 근무표','직원이 개인 사정으로 저녁 근무를 줄여 달라고 합니다.','대체 인력을 구한다','내가 저녁을 맡는다','labor'],
 ['*','수리 기사 전화','장비 점검','수리 기사가 지금 손보면 장비를 더 쓸 수 있다고 합니다.','예방 정비를 한다','고장 날 때 수리한다','repair'],
 ['*','직원과 대화','그때 구한 근무자','지난번에 함께한 근무자가 바쁜 날 더 일할 수 있다고 합니다.','다음 달도 부탁한다','기존 근무표로 간다','labor','labor'],
 ['*','단골 문자','다음 행사도 부탁해요','지난 주문을 맡겼던 손님이 다음 행사 일정도 물어봅니다.','정기 주문을 논의한다','이번 한 번만 맡는다','order','order']
].map(([industry,channel,title,body,a,b,kind,requires],id)=>({id,industry,channel,title,body,a,b,kind,requires}));

function random(state) {
  state.rng = (Math.imul(1664525,state.rng)+1013904223) >>> 0;
  return state.rng / 4294967296;
}

export function beginEpisodes(state, seed) {
  state.seed = seed >>> 0;
  state.rng = state.seed;
  state.seen = [];
  state.threads = [];
  return nextEpisode(state);
}

export function currentEpisode(state) {
  return catalog[state.episode];
}

function nextEpisode(state) {
  const target = Math.min(36,state.month+2+Math.floor(random(state)*4));
  const before = state.cash;
  state.lastRevenue = 0;
  while(state.month<target && state.cash>=0) {
    const row = calculateMonth(state);
    state.records.push(row);
    Object.assign(state,{month:row.month,cash:row.cash,debt:row.debt});
    state.lastRevenue += row.sales;
  }
  state.lastDelta = state.cash-before;
  state.closed = state.cash<0;
  state.finished = state.closed || state.month===36;
  state.reason = state.closed ? '현금 부족으로 영업 중단' : state.finished ? '3년 영업 종료' : '';
  if(state.finished) return;
  const eligible = catalog.filter(e=>!state.seen.includes(e.id) &&
    (e.industry==='*'||e.industry===state.industry) &&
    (!e.requires||state.threads.includes(e.requires)) &&
    (e.kind!=='rent'||state.month>=16));
  const followups = eligible.filter(e=>e.requires);
  const pool = followups.length ? followups : eligible;
  state.episode = pool[Math.floor(random(state)*pool.length)]?.id;
  if(!pool.length) nextEpisode(state);
}

export function decideEpisode(state, choice) {
  const event = currentEpisode(state);
  if(state.finished || !event || !['a','b'].includes(choice)) return;
  const first = choice==='a';
  const roll = random(state);
  const previous = state.records.at(-1);
  let cost = 0;
  switch(event.kind) {
    case 'delivery': state.deliveryPerOrder += 500; if(first) state.deliveryShare=Math.max(0,state.deliveryShare-10); break;
    case 'material': cost=first?70:0; state.costRatio=Math.min(.95,state.costRatio+(first?.005:.017)); break;
    case 'competition': cost=first?140:0; state.revenueMult*=first && roll>.35?1.035:.965; break;
    case 'order': cost=first?80:0; state.revenueMult*=first && roll>.3?1.05:1.012; break;
    case 'labor': state.wages+=first?85:0; state.extraHours=Math.max(1-state.hours,Math.min(112-state.hours,state.extraHours+(first?-5:8))); break;
    case 'rest': cost=first?40:0; state.extraHours=Math.max(1-state.hours,Math.min(112-state.hours,state.extraHours+(first?-3:3))); break;
    case 'rent': state.rent+=first && roll>.3?20:55; break;
    case 'repair': cost=first?210:roll>.6?320:25; break;
  }
  state.cash-=cost;
  for(const key of ['operating','netIncome','economic','flow','cash']) previous[key]-=cost;
  previous.other+=cost;
  state.seen.push(event.id);
  if(first && ['labor','order'].includes(event.kind)) state.threads.push(event.kind);
  state.decisions.push({month:state.month,key:event.kind,choice,title:event[choice],cost});
  nextEpisode(state);
}
