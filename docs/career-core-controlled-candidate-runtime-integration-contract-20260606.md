# Career Core Controlled Candidate Runtime Integration Contract

## 1. Purpose

This contract fixes the safe integration boundary before controlled candidate merge and orchestration are connected to the actual CareerProfile flow.

The goal is not runtime integration. The goal is to define how `buildMergedControlledCandidateResult()` should be called, where its result should live, and which behaviors remain blocked until UI, API, database, and schema contracts are explicitly approved.

## 2. Recommended Integration Mode

Integration mode:

```text
separate_read_only_orchestrator
```

Meaning:

- Do not change the default return value of `buildCareerProfileFromResumeProfile()`.
- Do not change the default return value of `buildCareerProfileFromWorkRecords()`.
- Call `buildMergedControlledCandidateResult()` as a separate entrypoint.
- Do not automatically apply the merged result to CareerProfile.
- Keep the result as a read-only candidate result until UI/API integration is specified.

## 3. Forbidden Integration Modes

The following modes are forbidden at this stage:

```text
auto_apply_to_career_profile
default_enable_controlled_merge
write_to_supabase
render_to_ui_as_final_strength
alter_role_fit_scoring
modify_existing_career_profile_schema
```

These modes require later contracts because they affect runtime behavior, storage, UI semantics, scoring, or schema ownership.

## 4. Option Contract

The integration option shape is:

```js
{
  enableMergedControlledCandidates: true,
  enableControlledOwnershipSignals: true,
  enableControlledWorkRecordSignals: true,
  includeManualConfirmedCandidates: true,
  applyToCareerProfile: false,
}
```

Required principles:

- `enableMergedControlledCandidates: true` only enables candidate orchestration.
- `applyToCareerProfile` defaults to `false`.
- `applyToCareerProfile: true` is forbidden in this phase.
- Without `manual_user_confirmed_candidate`, final apply is blocked.
- Even with manual confirmation, final apply is blocked until UI/API/storage contracts are defined.

## 5. Output Contract

Recommended output shape:

```js
{
  careerProfile,
  controlledCandidateResult: {
    mergedStrengthSignals: [],
    mergedRiskSignals: [],
    mergedMissingEvidence: [],
    contradictedSignals: [],
    invalidCandidates: [],
    mergeStatus: "read_only_candidate",
    appliedToCareerProfile: false,
    sourceSummary: {},
  },
}
```

`controlledCandidateResult` is a sibling result. It is not automatically merged into `CareerProfile.signals`.

`CareerProfile.meta` is also not the default location in this phase. Keeping the result as a sibling prevents silent schema expansion and makes candidate/final boundaries explicit.

## 6. Final Apply Conditions

Final apply is forbidden until all conditions below are met:

```text
manual_user_confirmed_candidate exists
sourceTrace/sourceText/sourceRecordId validation is complete
contradictedSignals are absent or user-resolved
major missingEvidence items are resolved
UI can distinguish candidate from final
API/DB storage policy is finalized
```

Manual confirmation is necessary but not sufficient. It does not bypass UI/API/storage contracts.

## 7. Conflict Handling

Conflict case:

```text
ResumeProfile says user owned prioritization
WorkRecord says PO handled prioritization
```

Expected handling:

- Preserve contradiction and risk in `controlledCandidateResult`.
- Do not automatically apply `prioritization` to `careerProfile.signals.strengthSignals`.
- Preserve `clarificationQuestion`.
- Preserve both ResumeProfile and WorkRecord source traces.

This case must stay read-only until the conflict is resolved by user confirmation and downstream contracts permit final apply.

## 8. Source Preservation

Source preservation rules:

```text
sourceTraces are never deleted.
sourceType/sourceText/sourceField/sourceRecordId are preserved when present.
manual confirmation must also have sourceTrace.
source-less strength goes to invalidCandidates.
```

WorkRecord strength still requires source-backed trace information. `sourceRecordId` must not be generated synthetically to pass eligibility.

## 9. UI/API Pre-Integration Guardrails

Before UI/API integration:

- Do not display controlled candidates as final strength.
- If candidates appear in an API response, mark them explicitly as candidates.
- Do not write controlled candidate results to DB or Supabase before a storage contract exists.
- Do not generate inflated UI copy from candidate evidence.
- Do not alter RoleFit/scoring based on controlled candidates.

These guardrails keep candidate evidence auditable while preventing final profile claims from being implied before confirmation.
