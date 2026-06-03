# AI Inbox Career Core Read-only UI

## 1. 작업 목적

AI Inbox 카드에 WorkRecord/ExperienceCard 기반 Career Core v0 참고 신호를 read-only로 표시했다.

이번 배치는 UI surface 1개만 연결한다. 저장 데이터, DB schema, API, Supabase, App.jsx, AI 호출은 변경하지 않았다.

## 2. 변경 파일

- `src/components/experience/AiExperienceInboxPanel.jsx`
- `scripts/qa-ai-inbox-career-core-readonly-ui.js`
- `docs/ai-inbox-career-core-readonly-ui-20260603.md`

## 3. UI anchor

anchor는 `AiExperienceInboxPanel.jsx` 내부 `InboxCard`이다.

기존 tag row 아래, evidence preview 위에 작은 muted sub-block으로 표시한다. 기존 후보 제목, 이력서 문장 후보, evidence, action button보다 시각 위계가 낮다.

## 4. 입력 shape

AI Inbox item 1개에서 다음 값을 읽는다.

- `title`
- `summary`
- `situation`
- `task`
- `suggestedResumeBullet`
- `resultCandidate`
- `skills`
- `jobTags` / `job_tags`
- `industryTags` / `industry_tags`
- `actions`
- `result`
- `evidenceTexts`
- `riskNotes`
- `missingInfoQuestions`
- `confidenceLevel`
- `resumePotential`
- `recordDate`

`raw_sources.raw_text`는 사용하지 않는다.

## 5. Career Core adapter 사용 방식

`buildCareerProfileFromWorkRecords()`를 import한다.

AI Inbox item을 WorkRecord-like object 1개로 변환해 adapter에 넘긴다.

- `title`: item title
- `description`: situation 또는 summary
- `task`: item task
- `result`: suggested resume bullet 또는 result candidate
- `strength_tags`: item skills
- `skill_tags`: item jobTags
- `raw_payload.acceptedCandidates`: item을 candidate-like object로 1개 포함

adapter 결과에서 role/industry/strength signal label만 읽고 UI에 표시한다.

## 6. 표시 조건

다음 중 하나 이상의 입력이 있을 때만 adapter를 실행한다.

- title
- summary/situation/task
- suggested resume bullet
- skills/jobTags/industryTags
- evidence texts

adapter 결과에 role/industry/strength signal이 없으면 block은 렌더하지 않는다.

## 7. 표시 copy

제목:

- `Career Core v0 참고 신호`

caution copy:

- `저장된 후보의 직무/산업/강점 단서를 바탕으로 만든 참고 신호입니다.`
- `경력 기간이나 적합도 확정 판단이 아닙니다.`

금지 표현인 합격 가능성, 탈락 원인, 최종 적격성, 정확한 유관 경력, N개월 유관 경력은 사용하지 않는다.

## 8. duration/month 미표시 이유

AI Inbox item은 기록일 중심 데이터이며 실제 경력 기간이 아니다. 따라서 Career Core adapter가 내부적으로 duration guardrail을 갖고 있더라도 UI에서는 month bucket, duration, 유관 개월 수를 표시하지 않는다.

## 9. 저장/DB/API 미변경 확인

- 저장 데이터 변경 없음
- DB/schema 변경 없음
- API 변경 없음
- Supabase 변경 없음
- App.jsx 변경 없음
- AI 호출 없음
- `raw_sources.raw_text` 의존 없음
- Career Core 결과 persistence 없음

## 10. QA 결과

`scripts/qa-ai-inbox-career-core-readonly-ui.js`는 다음을 검증한다.

- Career Core block title/caution copy 존재
- 충분한 synthetic item은 adapter signal 생성
- 빈 item은 signal 없음
- recordDate-only duration 과장 없음
- duration/month bucket UI 미표시
- raw source text/API/AI 호출 의존 없음
- archive/convert action wiring 유지
- mobile/desktop overflow 방지를 위한 wrap/max-width class 존재

## 11. known limits

- component JSX를 Node에서 직접 import하지 않고 source static checks와 adapter synthetic harness를 결합해 검증한다.
- 실제 로그인 데이터 기반 manual E2E는 수행하지 않았다.
- PR #730 adapter foundation이 main에 merge되기 전에는 이 UI PR은 #730 위에 stacked PR로 유지되어야 한다.

## 12. 다음 단계 제안

다음 단계는 실제 AI Inbox 데이터가 있는 로그인 세션에서 manual visual QA를 수행하는 것이다.

이후 확장 시에도 저장/DB/API 변경 없이 read-only 표시만 유지하는 것이 안전하다.
