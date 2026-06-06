# Career Core Controlled Candidate Merge Orchestrator

## 1. Purpose

This batch adds a read-only orchestrator for collecting controlled candidates from ResumeProfile, WorkRecords, and manual confirmation before any CareerProfile runtime integration.

The orchestrator builds a merged candidate result only. It does not apply merged signals back to CareerProfile, scoring, UI, API, database, or deployment surfaces.

## 2. Relationship To Merge Utility

`buildMergedControlledCandidateResult()` delegates merge policy execution to `mergeControlledCandidateSignals()`.

The orchestrator is responsible for source collection and normalization:

- call the ResumeProfile builder with controlled ownership opt-in enabled
- call the WorkRecords builder with controlled WorkRecord opt-in enabled
- extract controlled strength, risk, contradicted, and missing candidates
- pass those candidates, plus manual confirmations, into the pure merge utility

The merge utility remains the only component that dedupes signals, blocks weak or source-less strength, separates contradictions, and preserves manual confirmation priority.

## 3. ResumeProfile Candidate Extraction

When `resumeProfile` is present, the orchestrator calls:

```js
buildCareerProfileFromResumeProfile(resumeProfile, {
  ...resumeOptions,
  enableControlledOwnershipSignals: true,
})
```

It extracts:

- `signals.strengthSignals` where `controlledSignalCandidate === true`
- `signals.riskSignals` where `controlledSignalCandidate === true`
- `meta.controlledSignalCandidates.missingEvidence`

Extracted ResumeProfile traces are normalized as `resume_profile_controlled_candidate` source traces for merge validation.

## 4. WorkRecords Candidate Extraction

When `workRecords` are present, the orchestrator calls:

```js
buildCareerProfileFromWorkRecords(workRecords, {
  ...workRecordOptions,
  enableControlledWorkRecordSignals: true,
})
```

It extracts:

- `signals.strengthSignals` where `controlledWorkRecordSignalCandidate === true`
- `signals.riskSignals` where `controlledWorkRecordSignalCandidate === true`
- `meta.controlledWorkRecordSignalCandidates.missingEvidence`

Extracted WorkRecord traces are normalized as `work_record_controlled_candidate` source traces. The orchestrator does not create synthetic WorkRecord source IDs.

## 5. Manual Confirmed Candidates

`manualConfirmedCandidates` are passed through to `mergeControlledCandidateSignals()` without being applied to CareerProfile.

Manual confirmed strength remains highest priority inside the merge utility, but existing risk and source traces are preserved as related evidence instead of being deleted.

## 6. Read-Only Result Principle

The output is the merge utility result plus source summary metadata:

```js
{
  mergedStrengthSignals: [],
  mergedRiskSignals: [],
  mergedMissingEvidence: [],
  contradictedSignals: [],
  invalidCandidates: [],
  mergeStatus: "read_only_candidate",
  appliedToCareerProfile: false,
  sourceSummary: {
    hasResumeProfile: true,
    hasWorkRecords: true,
    hasManualConfirmedCandidates: false,
    resumeCandidateCount: 0,
    workRecordCandidateCount: 0,
    manualCandidateCount: 0,
  },
}
```

`appliedToCareerProfile` must remain `false`.

## 7. Why Runtime Is Not Connected Yet

This batch intentionally avoids connecting the merged result to existing CareerProfile runtime output.

Runtime connection is deferred because the merge result still needs downstream contract decisions for display, user confirmation, persistence, API boundaries, and schema ownership. Until that is finalized, the merged result remains read-only metadata from a standalone utility call.

## 8. Next Step Conditions

A future runtime integration batch should proceed only after these conditions are met:

- final apply rules are specified for manual confirmation
- UI/API/DB persistence boundaries are defined
- source trace display and audit behavior are fixed
- contradicted and missing evidence review flows are specified
- CareerProfile schema impact is explicitly approved if any schema change is required
