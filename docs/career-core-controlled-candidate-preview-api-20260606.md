# Controlled Candidate Preview API

## 1. 목적

Controlled Candidate preview API를 read-only, candidate-only 형태로 최소 구현한다.

이번 구현은 `mapControlledCandidateExposureResponse()` 결과를 API response shape로 감싸는 local contract handler다. DB/Supabase write, CareerProfile apply, UI 구현, scoring 반영은 하지 않는다.

## 2. route 위치

프로젝트에서 배포 가능한 `/api/**` route 구조가 확인되지 않았고, 기존 changed-file guard가 `src/api/**`를 protected path로 막고 있다.

따라서 이번 batch의 route 구현은 아래 importable local handler로 제한한다.

```js
import { handleControlledCandidatePreviewApiRequest } from "../src/lib/career-core/mapControlledCandidateExposureResponse.js";
```

Future public endpoint contract는 아래 이름을 유지한다.

```text
POST /api/career-core/controlled-candidates/preview
careerCoreControlledCandidatesPreview
```

실제 deployed route 연결은 auth/session wiring contract가 확정된 다음 batch에서 진행한다.

## 3. request body

허용 body는 아래 범위다.

```js
{
  resumeProfile?: object,
  workRecords?: array,
  manualConfirmedCandidates?: object,
  options?: {
    includeResumeProfileCandidates?: boolean,
    includeWorkRecordCandidates?: boolean,
    includeManualConfirmedCandidates?: boolean
  }
}
```

`POST`만 허용한다. `GET`, `PUT`, `PATCH`, `DELETE` 등 non-POST request는 `METHOD_NOT_ALLOWED`를 반환한다.

## 4. forbidden input

아래 input은 금지한다.

```text
applyToCareerProfile
writeToDatabase
writeToSupabase
publishToCompany
exposeAsFinal
updateCareerProfile
finalStrengths
confirmedSkills
verifiedStrengths
```

final apply 계열 input은 `FORBIDDEN_FINAL_APPLY`로 막는다. storage write 계열 input은 `FORBIDDEN_STORAGE_WRITE`로 막는다. final-strength field input은 `INVALID_INPUT`으로 막는다.

## 5. success response shape

성공 response는 `mapControlledCandidateExposureResponse()` 결과를 기반으로 한다.

```js
{
  ok: true,
  mode: "preview_only",
  careerProfile: { ... },
  controlledCandidateResult: {
    status: "candidate_only",
    displayLabel: "검토 필요 후보",
    appliedToCareerProfile: false,
    mergeStatus: "read_only_candidate",
    exposureLabels: [],
    mergedStrengthSignals: [],
    mergedRiskSignals: [],
    mergedMissingEvidence: [],
    contradictedSignals: [],
    invalidCandidates: [],
    sourceSummary: {},
    exposureMeta: {
      candidateOnly: true,
      finalDisplayAllowed: false,
      manualConfirmationRequired: true,
      hasConflict: false,
      hasMissingEvidence: false,
      hasInvalidSource: false
    }
  },
  warnings: []
}
```

## 6. error response shape

실패 response는 아래 shape를 유지한다.

```js
{
  ok: false,
  error: {
    code: "INVALID_INPUT",
    message: "...",
    details: []
  }
}
```

현재 구현된 code는 아래와 같다.

```text
INVALID_INPUT
FORBIDDEN_FINAL_APPLY
FORBIDDEN_STORAGE_WRITE
METHOD_NOT_ALLOWED
UNAUTHENTICATED
```

`FORBIDDEN_RESOURCE`는 기존 resource ownership helper가 없으므로 이번 handler에서는 구현하지 않는다.

## 7. auth/session 처리 방식

프로젝트의 deployed API auth/session 구조가 확인되지 않아 새 auth helper나 Supabase ownership query를 만들지 않았다.

local handler는 caller가 `request.session`을 명시적으로 전달해야 성공한다. session이 없으면 아래 response를 반환한다.

```js
{
  ok: false,
  error: {
    code: "UNAUTHENTICATED",
    message: "Authentication is required.",
    details: []
  }
}
```

auth integration은 pending이다. public route로 연결할 때는 기존 auth/session helper를 사용해야 하며, 새 DB ownership query를 이 batch에서 invent하지 않는다.

## 8. DB/Supabase write 금지

handler는 DB insert/update/delete를 수행하지 않는다. Supabase write를 호출하지 않는다. request body에 `writeToDatabase` 또는 `writeToSupabase`가 있으면 candidate builder를 호출하기 전에 차단한다.

manual confirmed candidate도 저장하지 않는다. 저장/retention 정책은 별도 Storage Contract 전까지 금지다.

## 9. candidate/final 구분 방식

성공 response는 항상 아래 guard를 유지한다.

```text
mode: "preview_only"
controlledCandidateResult.status: "candidate_only"
controlledCandidateResult.appliedToCareerProfile: false
controlledCandidateResult.mergeStatus: "read_only_candidate"
controlledCandidateResult.exposureMeta.finalDisplayAllowed: false
```

candidate는 `controlledCandidateResult.mergedStrengthSignals` 안에 남고, `careerProfile.signals.strengthSignals`로 자동 병합되지 않는다.

## 10. 이번 Batch에서 UI를 만들지 않는 이유

이번 batch는 route/handler guard만 추가한다.

UI가 candidate를 final strength로 렌더링하지 않으려면 badge, review state, conflict/missing/invalid presentation contract가 필요하다. 해당 UI contract와 화면 구현은 별도 batch에서 다룬다.

## 11. 다음 단계 조건

다음 단계는 아래 조건이 충족된 뒤 진행한다.

- 기존 auth/session helper가 public route에서 확정된다.
- resource ownership 검증 방식이 DB write 없이 정의된다.
- deployed `/api/**` route 구조 또는 Edge Function 위치가 확정된다.
- UI가 `candidate_only`, `needs_review`, `conflict_detected`, `missing_evidence`, `invalid_source`를 final과 구분해 소비한다.
- Storage Contract 전까지 preview result 저장 금지를 계속 유지한다.
