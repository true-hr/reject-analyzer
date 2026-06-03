# Career Core Work Records Adapter Foundation

## 1. 작업 목적

AI Inbox / Work Records 데이터를 Career Core가 해석할 수 있도록 pure adapter foundation을 추가했다.

이번 배치는 UI 연결, 저장 데이터 변경, DB/schema 변경, API 변경, Supabase 변경 없이 WorkRecord 배열을 CareerProfile-compatible 구조로 변환하는 기반만 만든다.

## 2. 구현 파일

- `src/lib/career-core/buildCareerProfileFromWorkRecords.js`
- `src/lib/career-core/index.js`
- `scripts/test-career-core-work-records-adapter.js`
- `docs/career-core-work-records-adapter-foundation-20260603.md`

## 3. adapter 입력 shape

`buildCareerProfileFromWorkRecords(workRecords, options)`는 WorkRecord-like object 배열을 받는다.

읽는 top-level field:

- `title`
- `description`
- `task`
- `result`
- `record_date`
- `strength_tags`
- `skill_tags`
- `raw_payload` 또는 `rawPayload`

읽는 `raw_payload` field:

- `acceptedCandidates`
- `experienceSignals`
- `assetSkills`
- `assetJobTags`
- `assetCollaborationTags`
- `summary`
- `sourceMode`
- `sourceLabel`

읽는 candidate aliases:

- `skills`
- `job_tags`
- `jobTags`
- `industry_tags`
- `industryTags`
- `result`
- `resultCandidate`
- `actions`
- `evidenceTexts`
- `suggestedResumeBullet`
- `riskNotes`
- `missingInfoQuestions`
- `confidenceLevel`
- `resumePotential`

## 4. WorkRecord → ResumeProfile-like 변환 방식

adapter는 Career Core 내부 model을 새로 만들지 않고, WorkRecord를 ResumeProfile-like intermediate로 변환한 뒤 기존 `buildCareerProfileFromResumeProfile()`를 재사용한다.

각 WorkRecord는 하나의 `experience`가 된다.

- `experience.id`: WorkRecord `id` 또는 fallback id
- `experience.title`: WorkRecord title/task, raw asset job tags, candidate title/role/job tags를 결합
- `experience.company`: source label/mode, candidate industry tags를 보수적으로 결합
- `experience.bullets`: top-level evidence, candidate action/result/evidence/suggested bullet, risk/missing info를 bullet text로 변환

## 5. alias normalization 방식

WorkTrace candidate와 browser extension candidate의 alias를 같이 읽는다.

- role/job 후보: `job_tags`, `jobTags`, candidate title/role
- industry 후보: `industry_tags`, `industryTags`
- skill 후보: `skills`, WorkRecord `strength_tags`, `skill_tags`, raw asset tags
- result 후보: `result`, `resultCandidate`, `suggestedResumeBullet`, `actions`, `evidenceTexts`
- weak evidence 후보: `riskNotes`, `missingInfoQuestions`

중복 문자열은 lowercase key 기준으로 제거한다. 입력 object는 mutate하지 않는다.

## 6. duration/record_date 처리 원칙

`record_date`는 기록일이지 경력 기간이 아니므로 `startDate/endDate`로 사용하지 않는다.

명확한 `startDate/endDate`가 없는 WorkRecord는 duration unknown으로 둔다. 그 결과 Career Core timeline의 `durationMonths`는 0이고, fit summary의 month bucket도 증가하지 않는다.

adapter meta warning:

- `record_date_is_not_duration`
- `work_record_duration_unknown`

adapter meta:

- `source: "work_records"`
- `durationPrecision: "record_based_reference"`
- `adapterSchemaVersion: "passmap.workRecordsCareerProfileAdapter.v0"`

## 7. target fit 처리 방식

`options.target`이 있으면 기존 `buildCareerProfileFromResumeProfile()` 경로와 동일하게 `buildCareerFitSummary()`가 실행된다.

단, duration이 unknown인 WorkRecord는 signal fit level이 direct/adjacent로 분류될 수 있어도 `durationMonths`가 0이므로 `totalClassifiedMonths`와 month buckets를 과장하지 않는다.

## 8. warnings/known limits

- WorkRecord는 ResumeProfile보다 기간/회사/직책 정보가 약하므로 Career Core 결과는 read-only reference signal이다.
- `record_date`만 있는 기록은 경력 개월 수로 환산하지 않는다.
- raw source text 없이 동작하도록 설계했으며 `raw_sources.raw_text` 조회를 전제로 하지 않는다.
- 한국어 깨짐이 있는 기존 source 문자열은 현 catalog keyword와 동일한 한계 안에서만 매칭된다.
- 저장/DB/API/UI 연결은 이번 배치에 포함하지 않았다.

## 9. 테스트 결과

실행 대상:

- `node scripts/test-career-core-timeline.js`
- `node scripts/test-career-core-signals.js`
- `node scripts/test-career-core-fit.js`
- `node scripts/qa-career-core-fit-real-cases.js`
- `node scripts/test-career-core-work-records-adapter.js`
- `npm run build`

검증 항목:

- empty input safe handling
- top-level WorkRecord tags/text signal extraction
- `raw_payload.acceptedCandidates` alias normalization
- browser extension `jobTags/industryTags/resultCandidate` shape handling
- `record_date` duration overstatement prevention
- target fit read-only reference behavior
- no raw text dependency
- input immutability

## 10. 다음 UI 연결 Batch 제안

다음 batch는 UI surface 하나만 선택하는 것을 권장한다.

추천 순서:

1. AI Inbox card-level read-only signal
2. Career Asset Map aggregate signal
3. Home dashboard limited signal

다음 UI batch에서도 저장 데이터, DB/schema, API, Supabase, App.jsx는 변경하지 않는 것이 안전하다.
