# Career Core Date & Employment Harness - Batch 2A-2

## 목적

Date/Employment baseline fixtures를 현재 Career Core parser/timeline 출력과 비교하는 비차단 QA harness를 추가한다. 이번 작업은 엔진 수정이 아니라 현재 엔진과 기준선 사이의 차이를 드러내는 진단 작업이다.

## 왜 non-blocking harness인지

현재 `analyzeCareerTimeline()`은 분리된 `startDate`/`endDate` 월 단위 입력을 처리한다. raw period string parser, employment type classifier, employment weighting, combined employment timeline adapter는 아직 구현되어 있지 않다.

따라서 fixture import/runtime error만 exit 1로 처리하고, expected/current 차이 또는 미지원 영역은 REVIEW로 출력하되 exit 0을 유지한다.

## 비교한 fixture 범위

- `dateFormatMatrix.js`
- `expectedDateParseResults.js`
- `employmentTypeMatrix.js`
- `expectedEmploymentProfiles.js`
- `dateEmploymentCombinedCases.js`
- `expectedDateEmploymentProfiles.js`

## 현재 Career Core에서 직접 비교 가능한 범위

Date matrix 중 expected 결과가 `YYYY-MM` start/end와 확정 inclusive duration을 갖는 케이스는 현재 timeline 엔진에 분리 입력으로 넣어 비교할 수 있다. 이 범위는 `supported_by_current_timeline`으로 분류한다.

## 현재 미지원 범위

- raw period string parser: `"2021.07 ~ 2023.07"` 같은 원문 문자열 직접 파싱
- year-only / partial-month precision parser
- employment type classifier
- employment weighting
- employment type별 short tenure override
- gap employment type mapping
- date + employment combined timeline adapter
- overlapping project dedup
- leave inside full-time modeling
- military service special interval modeling

## Date 결과

현재 harness 기준:

- Date matrix total: 36
- comparable: 27
- unsupported: 9
- pass: 27
- review: 9
- fail: 0

비교 가능한 `YYYY-MM` 분리 입력 범위에서는 현재 timeline의 month normalization, current handling, inclusive duration 계산이 expected와 일치한다. Raw range parser가 없으므로 raw 문자열 직접 파싱은 미지원으로 분리한다.

## Employment 결과

현재 harness 기준:

- Employment matrix total: 20
- comparable: 0
- unsupported: 20

현재 Career Core에는 employment type classifier와 weighting layer가 없으므로 모든 employment matrix는 미지원 진단으로 분류한다.

## Combined 결과

현재 harness 기준:

- Combined cases total: 7
- comparable: 0
- unsupported: 7

현재 Career Core에는 date + employment combined timeline adapter가 없으므로 combined case는 전부 미지원 진단으로 분류한다.

## Failure Type 분류

- `raw_range_parser_missing`
- `expected_future_parser_case`
- `employment_classifier_missing`
- `employment_weighting_missing`
- `short_tenure_employment_override_missing`
- `gap_employment_type_mapping_missing`
- `combined_timeline_adapter_missing`
- `employment_weighted_duration_missing`
- `overlapping_project_dedup_missing`
- `leave_inside_fulltime_not_modeled`
- `military_service_not_modeled`

## 다음 patch 후보

- raw period string parser 추가: 한글, 축약연도, 구분자, 현재 재직, year-only, partial-month date range 정규화
- employment type classifier 추가: full_time, contract, internship, freelance, training, gap, military, leave, project_contract 등
- employment weighting metadata 추가: CareerProfile scoring에 반영하기 전 비차단 메타데이터로 검증
- combined date + employment timeline adapter 추가
- project-contract overlap dedup rule 추가
- 휴직을 공백과 분리하는 timeline interval 모델링
- 군복무를 일반 직무 경력/공백과 분리하는 special interval 모델링

## 금지한 작업

- Career Core 로직 수정 없음
- 날짜 파서 수정 없음
- 고용형태 분류 구현 없음
- taxonomy/scoring 수정 없음
- RoleFit fixture 작성 없음
- Target JD 작성 없음
- Mutation Set 정식 fixture 작성 없음
- UI, API, DB, Supabase, env, Vercel 변경 없음

## 검증 결과

통과:

- `node scripts/qa-career-core-date-employment-baseline.js`
- `node scripts/test-career-core-timeline.js`
- `node scripts/test-career-core-signals.js`
- `node scripts/test-career-core-fit.js`
- `node scripts/test-career-core-work-records-adapter.js`
- `node scripts/qa-career-core-fit-real-cases.js`

`npm run build`는 이번 Batch 필수 검증이 아니므로 실행하지 않았다.
