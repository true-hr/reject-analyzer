# Career Core Controlled Candidate Merge Utility

## 1. Purpose

`mergeControlledCandidateSignals()` creates a read-only merged candidate result from ResumeProfile controlled candidates, WorkRecords controlled candidates, and manual confirmed candidates.

It does not apply signals to CareerProfile runtime output.

## 2. Relationship to the policy document

This utility implements the policy fixed in `docs/career-core-controlled-candidate-merge-policy-20260606.md`: source preservation, same-signal dedupe, weak evidence blocking, contradiction separation, missing evidence preservation, and manual confirmation priority.

## 3. Input shape

```js
{
  resumeCandidates: {
    strengthSignals: [],
    riskSignals: [],
    missingEvidence: [],
    contradictedSignals: []
  },
  workRecordCandidates: {
    strengthSignals: [],
    riskSignals: [],
    missingEvidence: [],
    contradictedSignals: []
  },
  manualConfirmedCandidates: {
    strengthSignals: [],
    resolvedRisks: []
  }
}
```

## 4. Output shape

```js
{
  mergedStrengthSignals: [],
  mergedRiskSignals: [],
  mergedMissingEvidence: [],
  contradictedSignals: [],
  invalidCandidates: [],
  mergeStatus: "read_only_candidate",
  appliedToCareerProfile: false
}
```

## 5. Source-backed strength conditions

Strength candidates require at least one valid source trace with `sourceText`, `sourceField`, and `sourceType`. WorkRecord source traces also require `sourceRecordId`.

Source-less strength candidates are moved to `invalidCandidates`.

## 6. Weak, contradicted, and missing handling

Weak evidence levels such as `inferred_weak`, `inferred_weak_activity`, `weak_or_missing`, `missing_context`, and `absent` are not merged into strength.

Contradicted evidence separates into `contradictedSignals` and/or `mergedRiskSignals` and blocks final apply for that signal unless later resolved by manual confirmation.

Missing evidence is deduped by signal, keeps clarification questions, preserves reason codes, and remains outside strength.

## 7. Manual confirmed priority

Manual confirmed candidates have the highest priority:

```text
manual_user_confirmed_candidate > explicit_resume_profile > explicit_work_record > inferred_strong_resume_profile > inferred_strong_work_record > weak_or_missing
```

Manual confirmation does not delete prior risks or source traces. Related risk remains available with a resolution marker.

## 8. Why runtime is not connected yet

The utility is intentionally read-only so the merge contract can stabilize before CareerProfile runtime, UI, API, or storage layers consume it.

## 9. Next-step conditions

Future runtime wiring can consume this utility only if default CareerProfile behavior remains unchanged, source traces remain preserved, and weak/contradicted/source-less candidates cannot become strength.
