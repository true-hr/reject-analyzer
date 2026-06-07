# Controlled Candidate API Response Mapper

## 1. 목적

`mapControlledCandidateExposureResponse`는 `controlledCandidateResult`를 API/UI가 오해 없이 읽을 수 있는 read-only response shape로 변환한다.

이 mapper는 candidate 노출 전용이다. `CareerProfile.signals`, `CareerProfile.meta`, RoleFit/scoring, DB 저장에는 영향을 주지 않는다.

## 2. exposure contract와의 관계

Controlled Candidate Exposure Contract는 candidate를 final strength로 표시하지 않는 원칙을 정의한다.

이 mapper는 그 원칙을 실행 가능한 응답 구조로 고정한다. `controlledCandidateResult`는 `careerProfile`의 하위 병합 결과가 아니라 sibling response field로 노출된다.

## 3. 입력 구조

```js
{
  careerProfile,
  controlledCandidateResult
}
```

`careerProfile`은 응답에 보존된다. `controlledCandidateResult`는 merged strength/risk/missing/contradiction/invalid candidate 배열과 source summary를 포함할 수 있다.

## 4. 출력 구조

```js
{
  careerProfile,
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
  }
}
```

## 5. candidate/final 구분 방식

`status`는 항상 `candidate_only`다.

세부 상태는 `exposureLabels`에 추가된다.

- `candidate_only`
- `needs_review`
- `source_backed`
- `manual_confirmation_required`
- `conflict_detected`
- `missing_evidence`
- `invalid_source`

`appliedToCareerProfile`은 항상 `false`이고 `mergeStatus`는 항상 `read_only_candidate`다. `finalDisplayAllowed`는 항상 `false`다.

## 6. risk/contradiction/missing/invalid 처리

`mergedRiskSignals`와 `contradictedSignals`는 삭제하지 않는다. contradiction이 있으면 `conflict_detected` label과 `exposureMeta.hasConflict`가 설정된다.

`mergedMissingEvidence`는 결핍이나 단점이 아니라 추가 확인 대상으로 노출한다. `clarificationQuestion`이 있는 항목만 `needs_clarification` display group으로 노출한다. 질문이 없는 missing evidence는 strength로 노출하지 않고 invalid candidate 쪽으로 이동한다.

`invalidCandidates`가 있으면 `invalid_source` label과 `exposureMeta.hasInvalidSource`가 설정된다. invalid candidate는 strength candidate처럼 노출하지 않는다.

## 7. CareerProfile mutation 금지

mapper는 입력 `careerProfile`을 mutation하지 않는다. 응답의 `careerProfile`도 controlled candidate signal을 자동 병합하지 않은 보존 형태다.

`CareerProfile.signals`와 `CareerProfile.meta`에 조용히 삽입하는 동작은 이 batch 범위 밖이며 금지된다.

## 8. 실제 API route를 아직 만들지 않는 이유

이번 batch는 pure mapper만 추가한다.

API route, UI rendering, runtime integration, DB/Supabase 저장은 아직 contract가 완료되지 않았거나 별도 batch에서 검증되어야 한다. route를 먼저 만들면 candidate가 final profile처럼 소비될 위험이 있다.

## 9. 다음 단계 조건

다음 단계는 아래 조건이 충족된 뒤 진행한다.

- API response contract가 mapper shape를 그대로 사용하기로 확정된다.
- UI가 candidate/final 구분 label을 명확히 렌더링한다.
- manual confirmation, conflict, missing evidence, invalid source UX가 정의된다.
- DB/Supabase 저장 정책과 retention 정책이 별도 승인된다.
- CareerProfile schema 변경 없이 sibling result로 소비하는 runtime integration이 검증된다.
