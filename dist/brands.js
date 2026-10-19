// Annual sales are KRW 10,000. Ranking is a reference population, not a forecast.
export const brandSource={label:'공정위 2025년 가맹사업 현황 · 2026-04-12 발표 · 붙임3',url:'https://eiec.kdi.re.kr/policy/materialView.do?num=279336',document:'https://ipsi.u1.ac.kr/u1job/community/notice.do?articleNo=76294&attachNo=51263&mode=download'};
export const snackSource={label:'점포가이드 · 공정위 정보공개서 공개 집계 (보조 출처)',url:'https://jumpo.shop/franchise-ranking/bunsik/'};
const official=(id,name,keyword,detail,annualSales,rank,page)=>({id,name,keyword,detail,annualSales,rank,period:'2024년 실적',published:'2026-04-12',checked:'2026-10-19',source:brandSource,sourceKind:'official',rankingScope:'공정위 공표 해당 업종 평균매출 상위 5개 중 상위 3개',page});
const secondary=(id,name,keyword,detail,annualSales,rank)=>({id,name,keyword,detail,annualSales,rank,period:'공시연도 혼재 · 실적연도 원문 대조 대기',published:null,checked:'2026-10-19',source:snackSource,sourceKind:'secondary',rankingScope:'가맹점 20개 이상·평균매출 공개 브랜드의 보조 집계 상위 3개',page:null});
export const brands={
 chicken:[official('soy-honey','교촌치킨','간장·허니 시그니처','간장과 꿀을 연상하는 치킨',72726.4,1,28),official('young-chicken','청년치킨','청춘·가성비 치킨','젊은 이름을 내건 치킨',60969.4,2,28),official('cheese-crunch','비에이치씨(BHC)','치즈 시즈닝·바삭 치킨','가루 시즈닝으로 떠올리는 치킨',52972.4,3,28)],
 cafe:[official('cake-cafe','투썸플레이스','케이크·대형 카페','디저트와 좌석을 갖춘 카페',57172.6,1,28),official('jeju-cafe','에이바우트커피','제주에서 온 대형 카페','제주에서 시작한 이름을 떠올리기',44588.8,2,28),official('country-code','PLUS 82(플러스 82)','국가번호·배달 디저트','대한민국 국가번호를 닮은 이름',42383.8,3,28)],
 store:[official('number-25','GS25','숫자 25·생활 편의점','25가 들어가는 익숙한 간판',64371.8,1,30),official('purple-green','씨유(CU)','보라·초록 동네 편의점','두 색깔과 짧은 인사말',63383.7,2,30),official('seven-eleven','세븐일레븐','7·11·글로벌 편의점','두 숫자로 떠올리는 편의점',51121,3,30)],
 snack:[secondary('value-gimbap','싸다김밥','가성비 김밥·큰 메뉴판','가격을 강조하는 김밥·분식',86094,1),secondary('delivery-bunsik','최배달 떡순튀','최강 배달·떡순튀','배달과 떡볶이·순대·튀김',72786,2),secondary('school-bunsik','스쿨푸드','학교 감성·프리미엄 분식','학교를 뜻하는 이름의 분식',69122,3)]
};
export function getBrand(id,industry){return (brands[industry]??[]).find(b=>b.id===id)??null;}
export function benchmarkSales(brand,capture=65){return brand.annualSales/12*capture/100;}
export const brandMethod='선택 화면은 브랜드 실명 대신 연상 키워드를 사용합니다. 치킨·카페·편의점은 공정위 공표 목록의 2024년 실적 상위 3개입니다. 분식은 공정위 보도자료의 업종별 상위 목록에 없어 공개 정보공개서 집계의 상위 3개를 보조 출처로 사용했습니다. 분식의 기준 연도는 혼재되어 원문 대조가 더 필요하며, 다른 업종과 순위를 비교하지 않습니다. 게임 매출은 연평균 매출÷12×시나리오 반영률(기본 65%)에 지역·규모·전략·월 변동을 적용합니다. 65%는 신규 매장 성공률이나 실증 추정값이 아닌 수정 가능한 가정입니다. 비용·면적·인력은 실제 해당 브랜드의 계약 조건이 아닌 공통 업종 모형입니다.';
