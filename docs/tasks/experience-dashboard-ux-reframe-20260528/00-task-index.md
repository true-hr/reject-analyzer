# PASSMAP 경험 정리 대시보드 UX 재구성 작업 인덱스

## 작업 목적

PASSMAP의 유저용 `업무 관리` 화면을 단순 업무 저장/업무 관리 화면이 아니라, 사용자의 기록이 `경험 정리 → AI 기반 경험 해석 → 직무 연결 → 이력서 후보 → 다음 추천 행동`으로 이어지는 경험 정리 대시보드로 재구성한다.

## 이번 작업의 실제 대상

- 기업/기관용 B2B 화면이 아니다.
- 현재 구현 대상은 취준생/이직 준비자가 보는 유저용 화면이다.
- 장기적으로 기업/기관 과금 모델을 고려하지만, 지금은 유저가 자신의 경험이 커리어 자산으로 바뀌는 느낌을 받는 것이 핵심이다.

## 반드시 먼저 읽을 파일 순서

1. `01-investigation-summary.md`
2. `02-scope-and-rules.md`
3. `10-artifact-a-top-summary-card.md`
4. `20-artifact-b-calendar-flow.md`
5. `30-artifact-c-bottom-flow.md`
6. `40-copy-and-tone-rules.md`
7. `90-implementation-plan.md`
8. `99-handoff-template.md`

## 구현 순서

1. 산출물 A: 상단 4개 요약 박스 → 단일 최근 경험 분석 결과 카드
2. 산출물 B: 캘린더 → 경험 흐름 캘린더
3. 산출물 C: 하단 → 최근 경험 흐름 / 현재 강점 및 부족 신호 / 다음 추천 행동
4. 카피/톤 정리
5. 검증 및 handoff

## 현재 구체화 수준

- `10-artifact-a-top-summary-card.md`는 상세 정의 완료.
- `20-artifact-b-calendar-flow.md`, `30-artifact-c-bottom-flow.md`, `40-copy-and-tone-rules.md`는 이후 순차 구체화 예정.

## 완료 기준

각 산출물 md 파일의 체크리스트를 만족해야 완료로 본다. 체크리스트를 만족하지 못하면 작업 완료로 보고하지 않는다.

## Codex 운영 원칙

- 이 폴더의 문서를 이번 UX 작업의 단일 기준으로 삼는다.
- 애매하면 사용자에게 질문하지 말고 `02-scope-and-rules.md`의 기본값을 따른다.
- DB, RLS, env, deploy, main merge가 필요하면 그 항목만 보류하고 나머지를 계속한다.
- 목표 산출물과 다르면 완료로 보지 않는다.
