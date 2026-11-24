import { areas } from './simulation.js';

export const additionalAreas = {
  office: { name: '오피스 상권', sales: 1.10, rent: 145, deposit: 1000 },
  campus: { name: '대학가', sales: 1.03, rent: 55, deposit: 400 },
  station: { name: '역세권', sales: 1.14, rent: 150, deposit: 1200 },
  alley: { name: '골목상권', sales: .91, rent: -45, deposit: -400 },
};
Object.assign(areas, additionalAreas);

export const environments = {
  baseline: { label: '2026년 기준', wage: 10320 },
  historical: { label: '2024년 기준', wage: 9860, deliveryFee: 9.8 },
  highRate: { label: '가상 · 고금리', wage: 10320, rate: 8 },
  slowdown: { label: '가상 · 내수 침체', wage: 10320, demand: 0.88, rent: 0.98 },
  inputs: { label: '가상 · 원재료 급등', wage: 10320, material: 0.06, logistics: 500 },
  rebound: { label: '가상 · 경기 회복', wage: 10320, demand: 1.1, rent: 1.05 },
};

export const environmentNotes = {
  baseline: '최저임금 10,320원. 그 밖의 조건은 업종별 기본값을 적용합니다.',
  historical: '최저임금 9,860원. 배달 중개료는 당시 기본요율 9.8% 예시를 적용합니다.',
  highRate: '대출 연이율을 8%로 설정합니다.',
  slowdown: '기준 매출 12%, 임대료 2% 감소를 가정합니다.',
  inputs: '원가율 6%p, 배달비 건당 500원 상승을 가정합니다.',
  rebound: '기준 매출 10%, 임대료 5% 증가를 가정합니다.',
};

export function applyEnvironment(state, key) {
  const scenario = environments[key];
  if (!scenario) return state;
  state.environment = key;
  state.wages *= scenario.wage / 10320;
  state.sales *= scenario.demand ?? 1;
  state.rent *= scenario.rent ?? 1;
  state.rate = scenario.rate ?? state.rate;
  state.deliveryFee = scenario.deliveryFee ?? state.deliveryFee;
  state.deliveryPerOrder += scenario.logistics ?? 0;
  state.costRatio = Math.min(.95, state.costRatio + (scenario.material ?? 0));
  return state;
}
