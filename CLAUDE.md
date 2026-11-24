# CLAUDE.md — 대한민국 자영업자로 살아남기 3.0

Codex에서 Claude Code로 인수한 프로젝트다. 요구사항 원문은 SPEC.md, 단계 계획은 PLANS.md, 진행 기록은 PROGRESS.md, 요구사항별 상태는 IMPLEMENTATION_STATUS.md, 실제 테스트 결과는 TEST_REPORT.md.

## 구조
- `dist/` 가 소스이자 배포물이다(빌드 단계 없음, 의존성 없음). `scripts/build.mjs` 는 검증만 한다.
- `dist/simulation.js` 경제 엔진(금액 단위 만원), `episodes.js` 사건 82개, `outcomes.js` 엔딩 16종, `content.js` 통계·기사, `app.js` UI.
- `legacy/` 원본 프로토타입. 수정 금지.
- `scripts/upgrade.mjs`, `integrate-v21.mjs` 는 과거 이관용이다. dist 를 덮어쓸 수 있으니 다시 실행하지 않는다.
- 실행: `npm test` / `npm run build` / `npm run dev`(http://127.0.0.1:4173).
- 배포: `.openai/hosting.json` 이 OpenAI Sites 프로젝트를 가리킨다. Claude Code 에서는 배포할 수 없다. 기존 주소 갱신 권한이 확인되기 전에는 새 주소를 만들거나 갱신 완료로 보고하지 않는다.

## 작업 원칙
- 개별 기능 완료를 프로젝트 완료로 보지 않는다. 계획만 내고 끝내지 않는다.
- 승인된 범위에서는 반복 확인 없이 진행한다. 막히면 원인을 기록하고 독립 작업을 계속한다.
- Codex 의 완료 보고는 믿지 않는다. 코드와 실행 결과로 확인한다.
- 구현 후 반드시 `npm test`, 브라우저 동작 확인. 상태는 파일에 남긴다(PROGRESS.md).
- 기존 기사·사진·통계·출처·산식은 보존한다. 기사 인물·인용·수치를 바꾸지 않는다.
- 확인하지 못한 통계는 게시하지 않는다. 가상 수치를 공식 통계처럼 쓰지 않는다.
- 선택지에 결과 점수를 노출하지 않는다. 경제 모델을 실패 쪽으로 조작하지 않는다.
- 화면 문구는 짧게. AI식 설명, 이모지, 불필요한 영어·그라데이션·카드 금지.
- 미커밋 변경을 임의로 삭제·초기화하지 않는다. 푸시/배포는 사용자 승인 후.
- 복구 지점: 커밋 `42fd7a1`(공개 v5), 그리고 `../_backup_self-employed-survival_20261124`(폴더 사본·git bundle·미커밋 패치, Claude Code 인수 시점).
- 인코딩: 파일은 UTF-8(BOM 없음). PowerShell 콘솔 출력의 한글 깨짐은 표시 문제일 수 있으니 파일 내용으로 판단한다.
