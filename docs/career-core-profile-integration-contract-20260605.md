# Career Core Profile Integration Contract - 2026-06-05

## Summary

This contract defines how read-only controlled CareerProfile signal candidates may be considered before any runtime CareerProfile wiring. It does not change `buildCareerProfileFromResumeProfile()`, `buildCareerProfileFromWorkRecords()`, the CareerProfile schema, RoleFit, scoring, timeline, UI, API, DB, Supabase, env, or deployment behavior.

## Integration Status

- `read_only_candidate`: controlled utility output exists, but nothing is applied to CareerProfile.
- `eligible_for_profile_mapping`: a candidate satisfies all mapping rules and may be considered by a future runtime integration batch.
- `blocked_by_weak_evidence`: evidence is present but only `inferred_weak`, so it cannot become a strength signal.
- `blocked_by_contradiction`: source evidence is negated or assigned to someone else.
- `missing_required_evidence`: a required signal is absent and should be handled as missing evidence.

## Candidate Strength Signal Mapping Conditions

A candidate strength signal may be considered eligible only when all conditions are true:

- `evidenceConfidence` is `explicit` or `inferred_strong`.
- `sourceTraces` has at least one item.
- Every mapped `sourceTrace.sourceText` is non-empty.
- The signal is not contradicted.
- `canApplyToCareerProfile` is `true`.
- The controlled utility result still has `appliedToCareerProfile: false`.

## Candidate Risk Signal Conditions

A candidate risk signal may be considered when one or more conditions are true:

- Evidence is weak.
- Evidence is contradicted.
- There is overclaim risk.
- Ownership evidence is insufficient.
- If `sourceTraces` exist, they must be preserved.
- If `sourceTraces` are absent, `reasonCode` must explain the risk.

## Missing Evidence Conditions

Missing evidence is used when:

- A signal is absent.
- A required signal is not satisfied.
- `clarificationQuestion` exists for the missing item when available.
- The system must not write a capability as present when the evidence is missing.

## Must Not Enter CareerProfile

The following must not become CareerProfile strength signals:

- `inferred_weak` strength.
- Contradicted strength.
- Absent strength.
- Strength without source.
- `caseId`-based judgment.
- `fixture-sentence-only` judgment.
- Inflated UI display copy.

## Recommended Candidate Shape

```js
{
  strengthSignals: [
    {
      signal: "requirements_definition",
      roleFamily: "product_planning_pm",
      evidenceConfidence: "explicit",
      ownershipLevel: "lead",
      judgmentLevel: "high",
      sourceTraces: [
        {
          sourceText: "요구사항 정의, PRD 작성, 사용자 스토리 정리와 우선순위 결정을 담당했다.",
          sourceField: "description",
          sourceIndex: 1,
          reasonCode: "explicit_requirements_definition"
        }
      ],
      sourceSection: "description",
      explanationBoundary: "Only source-backed explicit or strong inferred evidence can be mapped."
    }
  ],
  riskSignals: [
    {
      signal: "product_ownership_unclear",
      reasonCode: "contradicted_prioritization",
      sourceTraces: []
    }
  ],
  missingEvidence: [
    {
      signal: "post_release_monitoring",
      reasonCode: "missing_required_signal",
      clarificationQuestion: "배포 후 어떤 지표를 모니터링했나요?"
    }
  ]
}
```

## Guardrails

- Docs, fixture, and test only.
- No runtime CareerProfile wiring.
- No schema changes.
- No RoleFit/scoring changes.
- No timeline/date/employment changes.
- No UI/API/DB/Supabase/env/deployment changes.
- No package changes.
