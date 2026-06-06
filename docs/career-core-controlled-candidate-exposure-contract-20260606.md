# Career Core Controlled Candidate Exposure Contract

Date: 2026-06-06

Batch: QA/Contract Batch / Controlled Candidate Exposure Contract

## 1. Purpose

This contract fixes how `buildMergedControlledCandidateResult()` may be exposed later through API or UI without confusing candidate signals with final `CareerProfile` strengths.

The result is intentionally a controlled candidate surface. It is not a final CareerProfile update, not a scoring input, and not a database persistence contract.

## 2. Exposure Principles

- `controlledCandidateResult` is not the final `CareerProfile`.
- A candidate is a review and confirmation target.
- Even when source-backed, a candidate must not be displayed as a final strength before manual/user confirmation and downstream exposure contracts are complete.
- `risk`, `contradicted`, and `missingEvidence` signals must not be hidden.
- `sourceTrace` must be preserved for auditability.
- Read-only candidate fields must stay read-only until API, UI, DB storage, and user disclosure contracts are complete.

## 3. Recommended API Response Shape

Recommended sibling shape:

```js
{
  careerProfile: { ... },
  controlledCandidateResult: {
    status: "candidate_only",
    displayLabel: "검토 필요 후보",
    appliedToCareerProfile: false,
    mergeStatus: "read_only_candidate",
    mergedStrengthSignals: [],
    mergedRiskSignals: [],
    mergedMissingEvidence: [],
    contradictedSignals: [],
    invalidCandidates: [],
    sourceSummary: {}
  }
}
```

Forbidden:

- Automatically merging candidates into `careerProfile.signals.strengthSignals`.
- Silently inserting candidates into `careerProfile.meta`.
- Reflecting candidates in `scoreCareerRoleFit`.
- Exposing candidates under names such as `finalStrengths`.
- Exposing candidates under names such as `confirmedSkills`.

## 4. UI Label Contract

Any UI exposure must make candidate status explicit with labels/statuses such as:

- `candidate_only`
- `needs_review`
- `source_backed`
- `manual_confirmation_required`
- `conflict_detected`
- `missing_evidence`
- `invalid_source`

Allowed example copy:

- "검토 필요 후보"
- "근거는 있으나 최종 확정 전입니다"
- "상충 근거가 있어 확인이 필요합니다"
- "추가 확인이 필요한 항목입니다"

Forbidden copy:

- "확정 역량"
- "검증 완료"
- "최종 강점"
- "당신의 핵심 역량입니다"
- "기업에 바로 공개 가능"

## 5. Risk And Contradiction Exposure

- `contradictedSignals` must not be hidden.
- `riskSignals` may have lower visual priority than strengths, but must remain accessible.
- If any item has `conflict_detected`, final display is forbidden.
- If a `clarificationQuestion` exists, it may be exposed next to the conflict or risk.
- A contradicted candidate must not be shown as a clean strength while the contradiction is hidden elsewhere.

## 6. Missing Evidence Exposure

- `missingEvidence` must not be framed as a defect, weakness, or negative evaluation.
- Preferred wording is "추가 확인 필요".
- Missing evidence without a `clarificationQuestion` must not be exposed.
- Duplicate signals may be deduped for display, but source-specific questions and reasons must be preserved.

## 7. Manual Confirmed Candidate Exposure

Manual confirmation alone does not allow final apply in this current pre-integration batch. This is a current exposure gate, not a permanent product prohibition.

Future final apply may be introduced by a separate implementation batch after all of the following are true:

- UI can clearly distinguish candidate from final.
- API response field contract is finalized.
- DB storage contract is finalized.
- User-facing disclosure scope can be explained.

Until then, even manual-confirmed candidates remain `candidate_only`, `read_only_candidate`, and `appliedToCareerProfile: false` for this contract.

## 8. Read-Only Fields Before DB Storage

Before a DB storage contract exists, these fields remain read-only exposure fields:

- `status`
- `displayLabel`
- `appliedToCareerProfile`
- `mergeStatus`
- `mergedStrengthSignals`
- `mergedRiskSignals`
- `mergedMissingEvidence`
- `contradictedSignals`
- `invalidCandidates`
- `sourceSummary`
- all `sourceTrace` / `sourceTraces` entries
- all `clarificationQuestion` values

No Supabase or database write is allowed by this exposure contract.

## 9. Forbidden Behaviors

- Displaying a candidate as a final strength.
- Displaying a candidate without source evidence.
- Hiding a contradicted candidate while showing only the strength.
- Displaying `missingEvidence` as a negative evaluation.
- Treating manual-confirmed candidates as enterprise-shareable or public-ready.
- Using exaggerated UI copy.
- Writing candidate results to DB or Supabase.
- Changing `CareerProfile` schema for this exposure batch.
- Changing role/industry scoring based on controlled candidate results.

## 10. Current Batch Scope

This batch defines documentation, fixtures, and deterministic contract tests only.

It does not implement API response wiring, UI rendering, runtime integration, database persistence, scoring changes, or schema changes.
