import { calculateMonth, monthlyVariation } from './simulation.js';

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
 ['*','단골 문자','다음 행사도 부탁해요','지난 주문을 맡겼던 손님이 다음 행사 일정도 물어봅니다.','정기 주문을 논의한다','이번 한 번만 맡는다','order','order'],
 ['chicken','거래처 문자','튀김유 납품가 인상','기존 거래처가 다음 발주부터 기름값을 올립니다.','다른 제품을 시험한다','지금 쓰는 기름을 유지한다','material'],
 ['chicken','수리 기사 전화','튀김기 온도가 떨어진다','주문이 몰리면 기름 온도가 설정값까지 오르지 않습니다.','오늘 영업을 줄이고 정비한다','내일 오전에 다시 점검한다','repair'],
 ['chicken','손님 전화','야간 근무조 간식','근처 공장에서 야간조 간식 배달을 정기적으로 부탁합니다.','시험 주문을 받아본다','매장 운영에 집중한다','order'],
 ['cafe','거래처 문자','우유 납품량 조정','납품처에서 새벽 배송을 줄이겠다고 합니다.','다른 납품처를 알아본다','한 번에 더 많이 주문한다','material'],
 ['cafe','수리 기사 전화','제빙기 물이 샌다','오후부터 얼음이 충분히 나오지 않습니다.','부품을 교체한다','수리 날짜까지 음료를 줄인다','repair'],
 ['cafe','손님 전화','회의용 커피 주문','인근 사무실에서 회의가 있는 아침마다 커피를 주문하려 합니다.','예약 주문을 받는다','당일 주문만 받는다','order'],
 ['store','직원 문자','택배 접수가 몰린 저녁','계산대 한쪽에 택배 상자가 쌓여 손님 줄이 길어졌습니다.','저녁 시간에 보조 인력을 둔다','내가 저녁에 카운터를 맡는다','labor'],
 ['store','상인회 소식','역 앞 대형 마트 개점','다음 주부터 퇴근길 역 앞에서 대형 마트가 문을 엽니다.','간편식 구성을 바꾼다','현재 상품 구성을 유지한다','competition'],
 ['store','본사 공문','냉동식품 배송 시간 변경','새 배송 시간에는 근무자가 혼자 검수와 계산을 맡습니다.','검수 시간에 보조 인력을 둔다','내가 검수를 맡는다','labor'],
 ['snack','가족 문자','저녁 장사는 쉴 수 있을까','아침 장보기부터 마감까지 챙기다 보니 저녁 약속을 계속 미뤘습니다.','하루 저녁 장사를 쉰다','이번 주는 그대로 영업한다','rest'],
 ['snack','거래처 문자','김 납품 조건 변경','소량 주문에 붙는 배송비가 올라갑니다.','근처 가게와 공동 구매한다','지금처럼 소량으로 주문한다','material'],
 ['snack','손님 전화','동네 체육대회 도시락','주말 체육대회에서 참가자용 도시락을 주문하려 합니다.','인력을 구해 주문을 받는다','준비할 수 있는 수량만 받는다','order'],
 ["*","전화","카드대금 정산 지연","정산일이 밀렸다는 연락이 왔다.","거래처에 지급일을 협의한다","지금 가진 현금으로 지급한다","finance"],
 ["*","은행 알림","변동금리 재산정","다음 달 대출 금리가 재산정된다.","고정금리 전환을 문의한다","변동금리를 유지한다","finance"],
 ["*","은행 전화","거치 연장 제안","은행이 기존 대출 조건 변경을 제안했다.","상환 부담을 낮출 조건을 찾는다","기존 약정을 유지한다","finance"],
 ["*","관리비 고지서","공용 전기료 증가","상가 공용 전기료가 지난달보다 늘었다.","관리인에게 배분 근거를 요청한다","고지 금액을 낸다","utility"],
 ["*","고지서","한파 뒤 난방비","새벽에 난방을 돌린 날이 많았다.","출입문 단열을 보강한다","현재 방식으로 난방한다","utility"],
 ["*","고지서","폭염 뒤 냉방비","한낮 냉방 전력 사용이 급증했다.","냉방기와 출입문을 점검한다","설정 온도만 조정한다","utility"],
 ["*","전화","간판 조명 불량","저녁마다 간판 조명이 꺼진다.","조명 전체를 교체한다","고장 난 부분만 수리한다","repair"],
 ["*","전화","누수 발견","창고 천장 아래에 물이 고였다.","바로 수리를 부른다","물건을 옮기고 상태를 지켜본다","repair"],
 ["*","현장","출입문 고장","문이 닫힐 때 바닥에 걸린다.","영업시간 전에 정비한다","마감 뒤 임시로 손본다","repair"],
 ["*","문자","단골의 후기","단골이 동네 게시판에 가게를 소개했다.","소개 손님에게 재방문 쿠폰을 준다","평소대로 맞이한다","reputation"],
 ["*","리뷰","대기시간 불만","주말 대기시간을 지적한 후기가 올라왔다.","대기 안내를 정비한다","손님에게 직접 답글을 남긴다","reputation"],
 ["*","리뷰","주문 누락 항의","손님이 주문 일부를 받지 못했다.","주문 확인 절차를 손본다","누락 주문을 다시 전달한다","reputation"],
 ["*","상인회 소식","공사로 막힌 인도","가게 앞 보행로 일부가 공사로 막힌다.","다른 출입 동선을 안내한다","가게 앞 임시 통로를 이용한다","competition"],
 ["*","상인회 소식","축제 날짜 확정","주말에 동네 축제가 열린다.","추가 물량을 준비한다","기존 주문량만 준비한다","order"],
 ["*","상인회 소식","경쟁 점포 철수","근처 같은 업종 점포가 이달 말 문을 닫는다.","새 손님을 위한 안내를 한다","단골 위주로 영업한다","reputation"],
 ["*","계약서","보증금 추가 요청","건물주가 재계약 때 보증금을 더 올려 달라고 한다.","월세와 함께 다시 협상한다","인상 조건을 받아들인다","rent"],
 ["*","전화","상가 관리주 변경","새 관리인이 갱신 조건을 다시 정리하자고 한다.","조건을 서면으로 요청한다","기존 조건의 연장을 요청한다","rent"],
 ["*","가족 문자","병원 동행","가족이 평일 오전 병원에 같이 가 달라고 한다.","오전 영업을 쉰다","다른 가족에게 부탁한다","rest"],
 ["*","가족 문자","학예회 일정","아이의 학교 행사가 점심 영업 시간과 겹친다.","잠깐 문을 닫는다","가족에게 영상 촬영을 부탁한다","rest"],
 ["*","직원 문자","시험 기간","직원이 시험을 앞두고 주말 근무를 빼 달라고 한다.","대체 근무자를 구한다","직접 근무한다","labor"],
 ["*","직원 문자","첫 급여 협상","직원이 업무가 늘었다며 시급 조정을 요청했다.","시급을 조정한다","업무 범위를 줄여 달라고 한다","labor"],
 ["*","직원 문자","출근길 교통 장애","아침 근무자가 지연된다고 연락했다.","교대할 사람을 찾는다","문을 열고 혼자 대응한다","labor"],
 ["*","거래처 문자","최소 발주 단위 변경","거래처가 최소 발주 단위를 두 배로 늘린다.","대체 거래처를 알아본다","보관 공간을 비워 받아들인다","material"],
 ["*","거래처 전화","외상 거래 중단","거래처가 앞으로 납품 즉시 결제를 요청한다.","지급 조건을 협상한다","즉시 결제한다","finance"],
 ["*","달력","세금 준비","세금 납부 예정일이 다가온다.","지출 일정을 재조정한다","기존 지출 계획을 유지한다","finance"],
 ["*","가상 정책 소식","상인 공동 배송 사업","상인회가 공동 배송 시범 참여를 받는다.","시범 사업에 참여한다","기존 배송을 유지한다","delivery"],
 ["*","가상 정책 소식","지역 행사 입점 모집","지역 행사가 임시 판매대를 모집한다.","신청한다","점포 영업에 집중한다","order"],
 ["*","거래처 전화","단골 납품처의 휴업","거래처가 다음 주 며칠 문을 닫는다.","대체 납품처를 찾는다","이번 주에 미리 주문한다","material"],
 ["*","상인회 소식","아파트 입주","옆 단지에서 입주가 시작된다.","새 주민에게 가게를 알린다","평소대로 문을 연다","reputation"],
 ["*","가족 대화","휴가 날짜","가족이 비수기에 여행을 가자고 한다.","이틀 휴무를 잡는다","영업을 이어간다","rest"],
 ["chicken","본사 공문","포장 용기 변경","본사 지정 용기의 공급 단가가 바뀐다.","포장 구성을 조정한다","기존 포장을 유지한다","material"],
 ["chicken","리뷰","튀김이 식었다는 후기","먼 거리 주문에서 같은 후기가 이어진다.","배달 반경을 줄인다","기존 배달 반경을 유지한다","delivery"],
 ["chicken","상인회 소식","야시장 입점 제안","상인회가 저녁 야시장에 치킨 판매대를 제안했다.","소량으로 시험 판매한다","가게에서만 운영한다","order"],
 ["chicken","직원 문자","금요일 마감 교대","금요일마다 일하던 직원이 다음 달 근무를 바꾸려 한다.","대체 근무자를 구한다","내가 마감한다","labor"],
 ["chicken","거래처 전화","닭 공급처 계약 갱신","거래처가 고정 단가 적용 조건을 제안했다.","단가를 다시 협의한다","월별 단가로 주문한다","material"],
 ["cafe","단골 문자","유모차가 들어오기 어렵다","단골이 매장 통로가 좁아 들어오기 어렵다고 한다.","테이블 배치를 바꾼다","입구 쪽 좌석을 안내한다","reputation"],
 ["cafe","상인회 소식","사무실 이전","아침 손님이 많던 사무실이 이전한다.","주말 손님을 위한 메뉴를 낸다","평일 영업시간을 줄인다","competition"],
 ["cafe","전화","에스프레소 머신 압력 저하","첫 추출부터 압력이 떨어져 주문이 밀린다.","출장 수리를 부른다","매뉴얼에 따라 임시 조치한다","repair"],
 ["cafe","손님 전화","동네 독서모임","독서모임 운영자가 매달 창가 좌석을 예약하고 싶다고 한다.","정기 예약을 받는다","빈자리가 있을 때만 받는다","order"],
 ["cafe","직원과 대화","토요일 대관 문의","대관 요청 시간이 주말 손님이 몰리는 시간과 겹친다.","임시 인력을 두고 받는다","기존 영업을 유지한다","labor"],
 ["store","본사 공문","행사 상품의 반품 기간","본사가 행사 상품 반품 접수를 앞당긴다.","발주를 줄인다","행사 물량을 그대로 받는다","material"],
 ["store","직원 문자","새벽 교대 공백","새벽 근무자가 개인 사정으로 교대를 구해 달라고 한다.","대체 인력을 구한다","직접 교대한다","labor"],
 ["store","상인회 소식","버스 정류장 이전","가게 앞 정류장이 한 블록 건너로 옮겨진다.","주변 주민에게 매장을 알린다","운영시간을 줄여 대응한다","competition"],
 ["store","수리 기사 전화","결제 단말기 오류","결제 단말기가 저녁 피크에 멈췄다.","예비 단말기를 들인다","기존 장비를 수리한다","repair"],
 ["store","본사 공문","여름 냉장 진열 점검","냉장 진열장의 온도 유지에 드는 전력이 늘었다.","냉장 설비를 점검한다","진열 품목을 조정한다","utility"],
 ["snack","학교 공지","시험 기간 단축 수업","시험 기간에 학생들이 평소보다 일찍 하교한다.","간단한 포장 메뉴를 준비한다","평소 메뉴를 유지한다","order"],
 ["snack","상인회 소식","학교 앞 푸드트럭","하교 시간에 푸드트럭이 학교 앞에 선다.","학생용 메뉴 가격을 검토한다","동네 단골을 중심으로 운영한다","competition"],
 ["snack","수리 기사 전화","밥솥 교체 시기","아침 첫 취사가 끝나기 전에 밥솥이 멈췄다.","새 밥솥을 산다","여분 솥으로 당분간 운영한다","repair"],
 ["snack","고객 문자","점심 주문 누락","예약한 김밥을 받지 못한 손님에게서 연락이 왔다.","예약 확인 절차를 바꾼다","직접 연락해 사과한다","reputation"],
 ["snack","직원 문자","점심 시간 주문 대기","점심에 주문과 결제를 한꺼번에 받기 어렵다고 한다.","피크에 보조 인력을 둔다","메뉴 수를 줄인다","labor"],
 ['*','가족 문자','다음 달 휴무부터 정할까','지연이 달력을 펴고 다음 달 약속을 잡자고 합니다.','휴무일을 먼저 정한다','영업 일정을 보고 정한다','rest','family'],
 ['*','거래처 문자','소량 납품 재협상','한 사장이 지난번 협의 뒤 소량 납품 조건을 다시 제안합니다.','새 납품 조건에 합의한다','다른 조건을 알아본다','material','supplier'],
].map(([industry,channel,title,body,a,b,kind,requires],id)=>({id,industry,channel,title,body,a,b,kind,requires}));
export const episodeCount = catalog.length;

export function episodeSpeaker(event) {
  if (/가족/.test(event.channel)) return '가족 · 지연';
  if (/직원/.test(event.channel)) return '직원 · 민서';
  if (/거래처/.test(event.channel)) return '납품처 · 한 사장';
  if (/건물주|계약서/.test(event.channel)) return '건물주 · 박 씨';
  if (/은행/.test(event.channel)) return '은행 · 이 대리';
  if (/본사/.test(event.channel)) return '본사 · 오 매니저';
  if (/단골/.test(event.channel)) return '단골 · 수진';
  return event.channel;
}

const contacts = {labor:'민서', order:'수진', family:'지연', supplier:'한 사장'};
const contactFor = event => event.requires ??
  (/가족/.test(event.channel) ? 'family' :
   event.kind === 'material' && /거래처/.test(event.channel) ? 'supplier' : event.kind);

export function episodeContext(state, event) {
  if (!event.requires) return event.body;
  const previous = state.contacts?.[event.requires];
  return previous
    ? `${previous.month}개월 차에 고른 ‘${previous.choice}’에 이어 ${contacts[event.requires]}에게서 연락이 왔습니다. ${event.body}`
    : event.body;
}

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

export function changeOperations(state, action) {
  if (state.finished || !currentEpisode(state)) return false;
  state.operations ??= [];
  if (state.operations.some(item => item.month === state.month)) return false;
  let title;
  if (action === 'shorter') {
    if (state.hours + state.extraHours < 25) return false;
    state.extraHours -= 8;
    state.revenueMult *= .95;
    state.other *= .94;
    title = '영업시간 단축';
  } else if (action === 'pickup') {
    if (state.deliveryShare < 10) return false;
    state.deliveryShare -= 10;
    state.revenueMult *= .98;
    title = '배달 일부를 포장으로 전환';
  } else {
    return false;
  }
  state.operations.push({ month: state.month, title });
  state.decisions.push({ month: state.month, key: 'operation', title, cost: 0 });
  return true;
}

function nextEpisode(state) {
  const target = Math.min(36,state.month+2+Math.floor(random(state)*4));
  const before = state.cash;
  state.lastRevenue = 0;
  while(state.month<target && state.cash>=0) {
    const month = state.month + 1;
    const fatigueDrag = 1 - Math.max(0, (state.fatigue ?? 0) - 40) / 1000;
    const row = calculateMonth(state, month, monthlyVariation(month) * fatigueDrag);
    state.records.push(row);
    Object.assign(state,{month:row.month,cash:row.cash,debt:row.debt,householdCash:row.householdCash});
    const weekly = row.hours * 12 / 52;
    state.fatigue = Math.max(0, Math.min(100, (state.fatigue ?? 0) + (weekly - 55) / 4));
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
    (e.title!=='방학을 앞둔 대학가'||state.area==='campus') &&
    (e.kind!=='finance'||state.debt>0||state.cash<state.own/4) &&
    (e.kind!=='rent'||state.month>=16));
  const followups = eligible.filter(e=>e.requires);
  const timely = eligible.filter(e=>e.industry===state.industry || (e.kind==='rest' && state.fatigue>=45));
  const pool = followups.length ? followups : timely.length && random(state)<.65 ? timely : eligible;
  state.episode = pool[Math.floor(random(state)*pool.length)]?.id;
  if(!pool.length) nextEpisode(state);
}

export function decideEpisode(state, choice) {
  const event = currentEpisode(state);
  if(state.finished || !event || !['a','b'].includes(choice)) return;
  const first = choice==='a';
  const contact = contactFor(event);
  const relationship = state.contacts?.[contact]?.trust ?? 0;
  const roll = Math.min(1, random(state) + (event.requires ? relationship * .04 : 0));
  const previous = state.records.at(-1);
  let cost = 0;
  switch(event.kind) {
    case 'delivery': state.deliveryPerOrder += 500; if(first) state.deliveryShare=Math.max(0,state.deliveryShare-10); break;
    case 'material':
      cost=first?(event.requires==='supplier' && relationship>0 ? 30 : 70):0;
      state.costRatio=Math.min(.95,state.costRatio+(first?.005:.017));
      break;
    case 'competition': cost=first?140:0; state.revenueMult*=first && roll>.35?1.035:.965; break;
    case 'order': cost=first?80:0; state.revenueMult*=first && roll>.3?1.05:1.012; break;
    case 'labor': {
      const returningWorker = event.requires === 'labor' && relationship > 0;
      state.wages += first ? (returningWorker ? 65 : 85) : 0;
      state.extraHours = Math.max(1-state.hours,Math.min(112-state.hours,state.extraHours+(first?-5:8)));
      break;
    }
    case 'rest':
      cost=first?40:0;
      state.extraHours=Math.max(1-state.hours,Math.min(112-state.hours,state.extraHours+(first?-3:3)));
      if(first) {
        state.restDays=(state.restDays??0)+1;
        state.fatigue=Math.max(0,(state.fatigue??0)-(event.requires==='family' && relationship>0 ? 18 : 12));
      }
      break;
    case 'rent': state.rent+=first && roll>.3?20:55; break;
    case 'repair': cost=first?210:roll>.6?320:25; break;
    case 'finance': cost=first?45:0; if(!first && state.debt>0) state.rate=Math.min(30,state.rate+.35); break;
    case 'utility': cost=first?120:0; state.extraFixed+=first?8:22; break;
    case 'reputation': cost=first?50:0; state.revenueMult*=first&&roll>.25?1.035:1.008; break;
  }
  state.cash-=cost;
  for(const key of ['operating','netIncome','economic','flow','cash']) previous[key]-=cost;
  previous.other+=cost;
  state.seen.push(event.id);
  if(first && contacts[contact] && !state.threads.includes(contact)) state.threads.push(contact);
  if (contacts[contact]) {
    state.contacts ??= {};
    state.contacts[contact] = {
      month: state.month,
      choice: event[choice],
      trust: Math.max(-3,Math.min(3,relationship+(first?1:-1))),
    };
  }
  state.decisions.push({month:state.month,key:event.kind,choice,title:event[choice],cost});
  nextEpisode(state);
}
