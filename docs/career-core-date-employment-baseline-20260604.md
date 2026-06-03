# Career Core Date & Employment Type Robustness Baseline - Batch 2A

## 1. 목적

Career Core Golden Profile Baseline Batch 1 이후, 실제 이력서 해석의 가장 앞단인 날짜/기간/고용형태 기준선을 고정한다. 이번 Batch는 엔진 수정이 아니라 fixture 기준선 작성이다.

기준일은 `2026-06-04`이며, 현재 재직 표현은 이 기준일의 월인 `2026-06`까지 inclusive 기준으로 계산한다.

## 2. 왜 RoleFit보다 Date/Employment가 먼저인지

RoleFit은 CareerProfile이 안정적으로 만들어진 뒤에 판단할 수 있다. 날짜 파싱, 기간 계산, 공백 산정, 고용형태 해석이 흔들리면 직접/인접/전환 가능 경력 월수와 short tenure 리스크가 모두 왜곡된다.

따라서 Batch 2A는 특정 JD 적합도보다 앞선 입력 정규화 기준선으로 Date Format Matrix, Employment Type Matrix, Date + Employment Combined Cases를 정의한다.

## 3. 이번 Batch에서 하지 않는 것

- Career Core 로직 수정 금지
- 날짜 파서 수정 금지
- 고용형태 분류 로직 구현 금지
- 실제 테스트 파일 작성 금지
- QA script 작성 금지
- Target JD 작성 금지
- Expected RoleFit 작성 금지
- Mutation Set 정식 fixture 작성 금지
- UI, API, DB, Supabase, env, Vercel 변경 금지

## 4. Date Format Robustness Matrix 요약

`dateFormatMatrix.js`에는 36개 날짜 입력 케이스를 작성했다.

- 온전한 연월 표기: `2021.07 ~ 2023.07`, slash, dash, 한 자리 월 변형
- inclusive 기준 anchor: `2021.07 ~ 2023.07`은 25개월, `2021.07 ~ 2023.06`은 24개월
- 축약 연도 표기: `21.07`, `21/07`, `21년 7월`, `21년 07월`
- 한글 표기: `2021년 7월`, `부터/까지`, `입사/퇴사`
- 구분자 변형: hyphen, en dash, em dash, tilde, wave dash
- 현재 재직 표현: `현재`, `재직중`, `재직 중`, `Present`, `now`, open-ended `2021.07 ~`
- 연도만 있는 표기: 월 단위 확정값을 만들지 않고 `datePrecision: "year"`와 `durationMonthsRange` 사용
- 월 누락/불완전 표기: `datePrecision: "partial_month"`와 parse warning 사용
- 공백 표현: 공백/진로탐색/개인 사유 기간을 경력 기간과 분리

`expectedDateParseResults.js`는 각 matrix id에 대한 normalizedStart, normalizedEnd, isCurrent, datePrecision, duration, parseWarnings를 별도 expected fixture로 분리한다.

## 5. Employment Type Robustness Matrix 요약

`employmentTypeMatrix.js`에는 20개 고용형태를 작성했다.

- 정규직: `full_time`, weight 1.0, shortTenureApplicable true
- 계약직: `contract`, weight 0.85, shortTenureApplicable contextual
- 인턴: `internship`, weight 0.4, shortTenureApplicable false
- 체험형 인턴: `experience_internship`, weight 0.35
- 채용연계형 인턴: `conversion_internship`, weight 0.55
- 파견직: `dispatch`, weight 0.75
- 프리랜서: `freelance`, weight 0.65
- 개인사업자/창업: `founder_or_self_employed`, contextual
- 아르바이트/파트타임: `part_time`, weight 0.3
- 외주/프로젝트 계약: `project_contract`, weight 0.6
- 교육생/부트캠프: `training`, 실무 경력 합산 제외, signal만 반영
- 공백/진로탐색: `gap`, gapMonths로 반영
- 군복무: `military_service`, 일반 직무 경력도 공백도 아님
- 휴직: `leave_of_absence`, 무조건 공백 처리 금지
- 무급 활동/대외활동: `unpaid_activity`, contextual signal

`expectedEmploymentProfiles.js`는 각 고용형태가 CareerProfile의 experienceMonths, weightedExperienceMonths, gapMonths, riskSignals에 어떤 영향을 줘야 하는지 별도 expected로 분리한다.

## 6. Date + Employment Combined Cases 요약

`dateEmploymentCombinedCases.js`와 `expectedDateEmploymentProfiles.js`에는 7개 결합 케이스를 작성했다.

- `combined_01_intern_contract_fulltime_sequence`: 인턴 6개월, 계약직 18개월, 현재 정규직 36개월의 연속 경력
- `combined_02_freelance_to_fulltime`: 프리랜서 18개월 후 정규직 40개월
- `combined_03_bootcamp_to_fulltime`: 부트캠프 6개월은 signal only, 정규직 36개월만 실무 경력
- `combined_04_gap_contract_fulltime`: 공백 17개월 후 계약직 12개월, 정규직 30개월
- `combined_05_military_activity_fulltime`: 군복무와 대외활동은 일반 직무 경력과 분리, 정규직 48개월
- `combined_06_leave_inside_fulltime`: 현재 정규직 재직 중 휴직 6개월은 gap이 아님
- `combined_07_overlapping_project_contracts`: 겹치는 프로젝트 계약은 중복 합산하지 않고 deduplicated calendar duration 사용

## 7. 실패 조건

### Date Parsing Failure

- `21.07`을 1921년 또는 잘못된 연도로 해석
- `2021.07 ~ 2023.07`을 24/25개월 기준 없이 임의 계산
- 현재/재직중/Present를 인식하지 못함
- open-ended 기간을 무조건 오류 처리
- 연도만 있는 기간을 월 단위 확정값으로 단정
- 월 누락 경고 없이 정확한 기간처럼 처리

### Timeline Logic Failure

- 겹치는 경력을 중복 합산
- 공백 기간을 경력으로 합산
- 프리랜서 기간을 공백으로 처리
- 휴직을 무조건 공백으로 처리
- 군복무를 일반 직무 경력으로 합산

### Employment Type Failure

- 인턴을 정규직과 동일한 깊이로 평가
- 인턴 3~6개월을 short_tenure 리스크로 처리
- 계약직/파견직을 경력에서 완전히 제외
- 부트캠프/교육을 실무 경력으로 합산
- 아르바이트를 무조건 무시하거나 정규직과 동일하게 평가
- 창업/개인사업자를 무조건 공백으로 처리
- 프리랜서를 무조건 full-time 경력으로 과대평가

## 8. 다음 Batch 제안

다음 Batch에서는 이 기준선을 바탕으로 실제 parser/timeline 결과를 fixture expected와 비교하는 QA test harness를 작성할 수 있다. RoleFit fixture는 날짜/고용형태 기준선과 CareerProfile 기준선이 안정화된 뒤 별도 Batch에서 다룬다.
