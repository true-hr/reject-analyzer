# Career Core Period Precision Parser - 2026-06-04

## 목적

PR #754 이후 intentionally deferred로 남긴 year-only, partial-month, half-year precision 기간 문자열을 `parseCareerPeriod()`에 추가한다. 목표는 Date matrix의 남은 REVIEW 9개를 줄이고, employment classifier나 combined timeline adapter는 그대로 분리하는 것이다.

## PR #754 이후 남은 미지원 영역

PR #754 기준 Date matrix는 `36/27/9/27/9/0`이었고, 남은 Date REVIEW는 아래 9개였다.

- year-only range 4개
- partial-month range 4개
- half-year precision 1개

## Year-only 처리 기준

`2021 ~ 2023`, `2021년 ~ 2023년`, `2021 - 2023`, `2021 입사 / 2023 퇴사`를 `datePrecision: "year"`로 정규화한다.

- `normalizedStart: "2021"`
- `normalizedEnd: "2023"`
- `durationMonthsRange: { min: 13, max: 36 }`
- `parseWarnings: ["month_missing"]`
- `durationMonthsInclusive`는 만들지 않는다.

## Partial-month 처리 기준

한쪽만 월이 있는 range는 `datePrecision: "partial_month"`로 정규화한다.

- `2021.07 ~ 2023`: `normalizedStart: "2021-07"`, `normalizedEnd: "2023"`, `durationMonthsRange: { min: 19, max: 30 }`
- `2021 ~ 2023.07`: `normalizedStart: "2021"`, `normalizedEnd: "2023-07"`, `durationMonthsRange: { min: 20, max: 31 }`
- 한글 year/month 변형도 동일한 방식으로 처리한다.
- 빠진 쪽에 따라 `end_month_missing` 또는 `start_month_missing` warning을 남긴다.

## Half-year Precision 처리 기준

`2019년 하반기 ~ 2023년 9월 진로탐색`은 반기 precision으로 처리한다.

- `normalizedStart: "2019-H2"`
- `normalizedEnd: "2023-09"`
- `datePrecision: "partial_month"`
- `durationMonthsRange: { min: 46, max: 51 }`
- `timelineKind: "gap"`
- `parseWarnings: ["start_month_imprecise"]`

## 확정 월수와 Range 월수 구분

월이 양쪽에 모두 있는 경우에만 `durationMonthsInclusive`를 만든다. year-only, partial-month, half-year precision은 정확한 시작/종료 월을 단정하지 않고 `durationMonthsRange`만 반환한다.

## 이번 Batch에서 의도적으로 남긴 미지원 영역

- employment type classifier
- employment weighting
- combined date + employment timeline adapter
- project overlap dedup
- leave/military special interval modeling
- RoleFit/Target JD fixture
- taxonomy/scoring 변경

## Harness 변화

이번 Batch 이후 Date matrix는 모두 raw parser로 비교된다.

- Date matrix total/comparable/unsupported/pass/review/fail: `36/36/0/36/0/0`
- Date raw period parser comparable/pass: `36/36`
- Employment matrix total/comparable/unsupported: `20/0/20`
- Combined cases total/comparable/unsupported: `7/0/7`

Harness 결론은 Date 때문이 아니라 employment/combined 미지원 영역 때문에 계속 `REVIEW`다.

## Verification 결과

통과:

- `node scripts/test-career-core-period-parser.js`
- `node scripts/qa-career-core-date-employment-baseline.js`
- `node scripts/test-career-core-timeline.js`
- `node scripts/test-career-core-signals.js`
- `node scripts/test-career-core-fit.js`
- `node scripts/test-career-core-work-records-adapter.js`
- `node scripts/qa-career-core-fit-real-cases.js`

`npm run build`는 시도했지만 fresh worktree에 Vite binary가 없어 실패했다. 에러는 `'vite' is not recognized as an internal or external command`이다.

## 다음 patch 후보

- employment type classifier
- non-blocking employment weighting metadata
- combined date + employment timeline adapter
- overlapping project dedup
- leave inside full-time modeling
- military service special interval modeling
