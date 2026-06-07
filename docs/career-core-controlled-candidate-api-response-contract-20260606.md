# Controlled Candidate API Response Contract

## 1. 목적

Controlled candidate result를 API로 노출하기 전, candidate-only 응답 계약과 저장 금지선을 고정한다.

이번 batch는 contract, fixture, deterministic test만 추가한다. 실제 API route, handler, UI, runtime integration, DB/Supabase 저장은 만들지 않는다.

## 2. 권장 endpoint contract

Future endpoint는 후보 조회 전용 preview API로 정의한다.

```text
POST /api/career-core/controlled-candidates/preview
```

현재 라우팅 구조가 다르게 확정될 수 있으므로 실제 구현 전까지 logical endpoint 이름도 함께 사용한다.

```text
careerCoreControlledCandidatesPreview
```

이번 batch에서는 route를 만들지 않는다. endpoint 이름은 future contract다.

## 3. request input contract

허용 input은 아래 범위로 제한한다.

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

금지 input은 아래와 같다.

```text
applyToCareerProfile
writeToDatabase
publishToCompany
exposeAsFinal
updateCareerProfile
```

금지 input이 들어오면 future API는 `400` 또는 validation error를 반환해야 한다. `applyToCareerProfile`, `publishToCompany`, `exposeAsFinal`, `updateCareerProfile`은 final apply 시도로 보고 `FORBIDDEN_FINAL_APPLY`를 반환한다. `writeToDatabase` 또는 storage write 계열 input은 `INVALID_INPUT` 또는 `FORBIDDEN_STORAGE_WRITE`로 막는다.

## 4. auth/session contract

인증 없는 사용자는 controlled candidate preview를 생성할 수 없다.

사용자 소유가 확인되지 않은 `resumeProfile` 또는 `workRecords`는 처리하지 않는다. `manualConfirmedCandidates`는 해당 사용자 session 범위 안에서만 유효하다.

정의된 error code는 아래와 같다.

```text
UNAUTHENTICATED
FORBIDDEN_RESOURCE
INVALID_INPUT
FORBIDDEN_FINAL_APPLY
FORBIDDEN_STORAGE_WRITE
```

## 5. response output contract

성공 response shape는 아래와 같다.

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

실패 response shape는 아래와 같다.

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

`controlledCandidateResult`는 `careerProfile`의 내부 필드가 아니라 sibling response field다.

## 6. candidate/final hard guard

`ok: true`여도 `mode`는 항상 `preview_only`다.

`controlledCandidateResult.status`는 항상 `candidate_only`다. `appliedToCareerProfile`은 항상 `false`다. `exposureMeta.finalDisplayAllowed`는 항상 `false`다.

아래 final/confirmed/verified 계열 필드는 API response에서 금지한다.

```text
finalStrengths
confirmedSkills
verifiedStrengths
```

candidate를 final strength로 반환하는 future API는 이 contract를 위반한다.

## 7. DB/Supabase 저장 금지

preview API는 DB/Supabase에 controlled candidate result를 저장하지 않는다.

manual confirmed candidate도 이번 단계에서는 저장하지 않는다. 저장/retention 정책은 별도 Storage Contract 전까지 금지다.

금지되는 동작은 아래와 같다.

```text
Supabase write
DB insert/update/upsert
manual confirmation persistence
controlled candidate retention
```

## 8. UI 소비 가이드

UI가 이 API response를 소비할 때는 candidate/final 구분을 화면에서 강제해야 한다.

- `candidate_only` badge 필수
- `needs_review` 표시 필수
- `conflict_detected`가 있으면 final strength UI 금지
- `missing_evidence`는 "추가 확인 필요"로 표시
- `invalid_source`는 strength 목록에서 제외

UI는 `mergedStrengthSignals`를 final strength 목록으로 렌더링하면 안 된다. 이 배열은 검토 후보 목록의 input일 뿐이다.

## 9. error/invalid/missing/conflict response

`UNAUTHENTICATED`는 session이 없을 때 반환한다.

`FORBIDDEN_RESOURCE`는 resume/workRecords/manual confirmation 후보가 session user 소유로 확인되지 않을 때 반환한다.

`INVALID_INPUT`은 허용되지 않은 input shape나 알 수 없는 preview option이 들어올 때 반환한다.

`FORBIDDEN_FINAL_APPLY`는 preview 요청에서 final apply, publish, CareerProfile update 의도가 감지될 때 반환한다.

성공 response 안에서 contradiction은 `exposureLabels`의 `conflict_detected`와 `contradictedSignals`로 보존한다. missing evidence는 `missing_evidence` label과 `mergedMissingEvidence[].clarificationQuestion`으로 보존한다. invalid source는 `invalid_source` label과 `invalidCandidates`로 보존하며 strength 목록에 섞지 않는다.

## 10. 금지 사항

아래는 이번 batch 및 future preview endpoint에서 Storage Contract 전까지 금지한다.

```text
실제 API route 구현 금지
API handler 추가 금지
Supabase write 금지
DB 저장 금지
CareerProfile schema 변경 금지
RoleFit/scoring 반영 금지
candidate를 final strength로 반환 금지
```
