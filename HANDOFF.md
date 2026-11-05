# 프로젝트 현재 상태

대한민국 자영업자의 창업부터 36개월 운영·폐업까지를 체험하는 공개 정적 인터랙티브 콘텐츠다. 현재 단계는 PUBLIC이며 배포 주소는 https://self-employed-survival.raspos.chatgpt.site 이다. 원본 HTML은 `legacy/`에 보존되어 있고, 실행 산출물은 `dist/`다.

## 최근 작업

- `dist/brands.js`, `dist/delivery.js`, `dist/extensions.js`: 브랜드 키워드 선택과 배달비 분석 추가
- `dist/content.js`: 공식 통계·기사·2024년 이후 변화 자료 구조화
- `dist/simulation.js`, `dist/app.js`: 36개월 현금흐름과 UI 연결
- `tests/brands-delivery.test.mjs`: 브랜드·배달 계산 회귀 검증
- 최근 배포 커밋: `24a21ca` 계열의 Sites source update

## 실행 방법

```powershell
cd 'C:\Users\kimwo\OneDrive\문서\New project\self-employed-survival'
npm test
npm run build
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 연다. API 키와 런타임 환경변수는 필요하지 않다. 배포 설정은 `.openai/hosting.json`에 있다.

## 다음 작업

1. 12개 브랜드 선택지의 정보공개서 원문·실적연도·계약비용을 대조한다.
2. 배달 플랫폼 정책과 공식 통계를 갱신할 수동 검수 주기를 정한다.
3. 공개 URL에서 키보드·스크린리더·주요 브라우저 접근성을 점검한다.

## 수정 시 주의사항

- `legacy/자영업자로_살아남기_프로토타입.html`은 원본 보존본이므로 수정하지 않는다.
- `dist/`를 수정하면 `scripts/build.mjs`와 브라우저 QA를 함께 실행한다.
- `dist/simulation.js`의 금액 단위는 만원이며 영업비용·세금·VAT는 단순화된 가정이다.
- 공개 배포는 저장 버전과 커밋 SHA를 일치시킨 뒤 진행한다.

## 알려진 오류

재현된 치명적 실행 오류는 없다. 다만 브랜드 비용·계약조건의 원자료 대조, 자동 갱신, 접근성 정밀 감사는 남아 있다. npm이 PATH에 없는 환경에서는 Node 실행 경로를 확인해야 한다.

## 데이터 관련 주의사항

치킨·카페·편의점 선택지는 공정위 공개 자료의 2024년 실적을 기준으로 했고, 분식 선택지는 보조 공개 집계로 별도 표시한다. 배달 요율 비교는 공개 정책 범위의 조건부 시나리오이며 모든 점포의 실제 정산액이 아니다. 화면과 문서에 표시된 기간·정의·검증 상태를 함께 읽어야 한다.

## PM 승인 필요 사항

새 업종·브랜드·데이터 API·자동 수집을 추가하거나, 가정값을 실제 예측으로 표현하거나, UI와 핵심 콘셉트를 바꾸는 일은 총괄 PM 승인 후 진행한다.
