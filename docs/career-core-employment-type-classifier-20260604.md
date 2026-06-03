# Career Core Employment Type Classifier Foundation - 2026-06-04

## 목적

Date parser foundation 이후 남은 미지원 영역 중 employment type classifier를 pure utility로 추가한다. 이번 Batch는 고용형태 label을 정규화하는 foundation이며 CareerProfile 계산, weighting, short tenure, gapMonths에는 연결하지 않는다.

## 왜 Weighting이 아니라 Classifier부터인지

employment weighting과 weightedExperienceMonths는 분류 결과가 안정적일 때만 의미가 있다. 먼저 raw label을 `full_time`, `contract`, `internship`, `freelance`, `training`, `gap` 등으로 일관되게 정규화해야 이후 가중치, gap mapping, short tenure override를 안전하게 붙일 수 있다.

## 지원한 고용형태

- `full_time`
- `contract`
- `internship`
- `experience_internship`
- `conversion_internship`
- `dispatch`
- `freelance`
- `founder_or_self_employed`
- `part_time`
- `project_contract`
- `training`
- `gap`
- `military_service`
- `leave_of_absence`
- `unpaid_activity`

## Alias Normalization 기준

`normalizeEmploymentLabel()`은 입력을 NFKC 정규화하고, 대소문자와 공백/하이픈/언더스코어 차이를 줄인다. `classifyEmploymentType()`은 alias map으로 정규화한다.

- 개인사업자/창업: `founder_or_self_employed`
- 외주/프로젝트 계약: `project_contract`
- 교육생/부트캠프: `training`
- 공백/진로탐색: `gap`
- 아르바이트/파트타임: `part_time`

## Unknown 처리 기준

빈 값은 `unknown`과 `missing_employment_type` warning을 반환한다. alias map에 없는 값은 `unknown`과 `unknown_employment_type` warning을 반환한다.

## Metadata-only로 남긴 항목

이번 Batch에서는 아래 항목을 계산에 적용하지 않고 harness에서 metadata-only REVIEW로 남긴다.

- `countsAsExperience`
- `countsAsGap`
- `countsAsSignal`
- `experienceWeight`
- `shortTenureApplicable`
- `expectedCareerProfileImpact`
- weightedExperienceMonths
- gapMonths mapping

## Harness 변화

이번 Batch 이후 employment matrix는 classifier로 비교된다.

- Date matrix total/comparable/unsupported/pass/review/fail: `36/36/0/36/0/0`
- Date raw period parser comparable/pass: `36/36`
- Employment matrix total/comparable/unsupported/pass/review/fail: `20/20/0/20/20/0`
- Combined cases total/comparable/unsupported: `7/0/7`

Harness 결론은 metadata-only와 combined 미지원 영역 때문에 계속 `REVIEW`다.

## Verification 결과

통과:

- `node scripts/test-career-core-employment-type.js`
- `node scripts/qa-career-core-date-employment-baseline.js`
- `node scripts/test-career-core-period-parser.js`
- `node scripts/test-career-core-timeline.js`
- `node scripts/test-career-core-signals.js`
- `node scripts/test-career-core-fit.js`
- `node scripts/test-career-core-work-records-adapter.js`
- `node scripts/qa-career-core-fit-real-cases.js`

`npm run build`는 시도했지만 fresh worktree에 Vite binary가 없어 실패했다. 에러는 `'vite' is not recognized as an internal or external command`이다.

## 다음 Patch 후보

- non-blocking employment weighting metadata adapter
- employment-aware short tenure override
- gap employment type mapping into timeline calculation
- combined date + employment timeline adapter
- overlapping project dedup
- leave/military special interval modeling
