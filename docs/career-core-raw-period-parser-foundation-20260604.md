# Career Core Raw Period Parser Foundation - 2026-06-04

## 목적

PR #751의 non-blocking Date/Employment harness에서 드러난 첫 번째 미지원 영역인 raw period string parser를 pure utility로 추가한다. 이번 작업은 `2021.07 ~ 2023.07`, `21년 7월 ~ 23년 7월`, `2021.07 ~ 현재`, gap month range 같은 원문 기간 문자열을 안전하게 정규화하는 foundation이다.

## 지원한 날짜 유형

- Full year-month range: `2021.07 ~ 2023.07`, `2021/07 ~ 2023/07`, `2021-07 ~ 2023-07`, `2021.7 ~ 2023.7`
- Short year-month range: `21.07 ~ 23.07`, `21/07 ~ 23/07`, `21년 7월 ~ 23년 7월`, `21년 07월 ~ 23년 07월`
- Korean year-month range: `2021년 7월 ~ 2023년 7월`, `2021년 07월부터 2023년 07월까지`, `2021년 7월 입사 / 2023년 7월 퇴사`
- Separator variants: no-space hyphen, en dash, em dash, wave dash
- Current expressions: `현재`, `재직중`, `재직 중`, `Present`, `now`, `현재 재직`, `입사 ~ 현재`, open-ended `2021.07 ~`
- Gap month range: `2019.08 ~ 2023.09 공백`, `2019.08-2023.09 개인 사유`

## 의도적으로 남긴 미지원 유형

이번 Batch에서는 year-only, partial-month, half-year precision을 무리하게 처리하지 않는다.

- `2021 ~ 2023`
- `2021년 ~ 2023년`
- `2021 - 2023`
- `2021 입사 / 2023 퇴사`
- `2021.07 ~ 2023`
- `2021 ~ 2023.07`
- `2021년 7월 ~ 2023년`
- `2021년 ~ 2023년 7월`
- `2019년 하반기 ~ 2023년 9월 진로탐색`

## Inclusive Month 계산 기준

월 단위 기간은 시작월과 종료월을 모두 포함한다.

- `2021.07 ~ 2023.07`: 25개월
- `2021.07 ~ 2023.06`: 24개월

## Current/Present 처리 기준

현재 재직 표현은 `options.testReferenceDate`, `options.currentDate`, `options.referenceDate` 중 제공된 기준일의 월까지 계산한다. 테스트 기준일은 `2026-06-04`이며 normalizedEnd는 `2026-06`이다.

## Open-ended 처리 기준

`2021.07 ~`처럼 종료 토큰이 비어 있고 range separator가 있는 경우 현재 재직으로 보수적으로 가정한다. 이때 `open_ended_current_assumed` warning을 남긴다.

## Gap Range 처리 기준

`공백`, `개인 사유`, `gap` 라벨이 포함된 월 단위 range는 `timelineKind: "gap"`으로 정규화한다. 실제 timeline 합산 방식은 이번 Batch에서 변경하지 않는다.

## Anti-overfitting Guardrail

- fixture id별 조건문을 넣지 않았다.
- 특정 문장 하나만 맞추는 alias를 넣지 않았다.
- parser는 숫자 year/month token, range separator, current label, gap label을 기반으로 일반화했다.
- `analyzeCareerTimeline()`에 raw string 지원을 강제로 연결하지 않았다.
- employment classifier, weighting, combined timeline adapter는 구현하지 않았다.

## Verification 결과

통과:

- `node scripts/test-career-core-period-parser.js`
- `node scripts/qa-career-core-date-employment-baseline.js`
- `node scripts/test-career-core-timeline.js`
- `node scripts/test-career-core-signals.js`
- `node scripts/test-career-core-fit.js`
- `node scripts/test-career-core-work-records-adapter.js`
- `node scripts/qa-career-core-fit-real-cases.js`

`npm run build`는 시도했지만 fresh worktree에 Vite binary가 없어 실패했다. 에러는 `'vite' is not recognized as an internal or external command`이며, parser utility 검증은 위 Node 기반 테스트로 완료했다.

## Harness 변화

Batch 2A-2 harness는 Date matrix comparable 27개를 current timeline split-input 경로로 비교했다. 이번 Batch 이후 27개가 raw period parser 경로에서도 comparable/pass로 분류된다.

현재 harness 결과:

- Date matrix total/comparable/unsupported/pass/review/fail: `36/27/9/27/9/0`
- Date raw period parser comparable/pass: `27/27`
- Employment matrix total/comparable/unsupported: `20/0/20`
- Combined cases total/comparable/unsupported: `7/0/7`

남은 Date REVIEW는 year-only 4개와 partial/half-year precision 5개다.

## 다음 patch 후보

- year-only range parser: `2021 ~ 2023`을 확정 월수 없이 range로 정규화
- partial-month parser: 한쪽 월 누락 케이스의 `durationMonthsRange` 계산
- half-year precision parser: `2019년 하반기` 같은 반기 표현 정규화
- employment type classifier
- non-blocking employment weighting metadata
- combined date + employment timeline adapter
