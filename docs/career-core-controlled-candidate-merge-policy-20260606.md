# Career Core Controlled Candidate Merge Policy

## 1. Purpose

This policy fixes how controlled candidates from ResumeProfile and WorkRecords must be merged, preserved, and blocked before they are applied to CareerProfile output or user-facing reports.

This batch is policy only. It does not add a runtime merge utility, UI wiring, API wiring, database storage, Supabase changes, or default CareerProfile behavior changes.

## 2. Candidate Source Types

- `resume_profile_controlled_candidate`: controlled candidate derived from ResumeProfile evidence.
- `work_record_controlled_candidate`: controlled candidate derived from WorkRecords evidence.
- `manual_user_confirmed_candidate`: user-confirmed candidate that explicitly resolves ownership, judgment, impact, or missing context.
- `system_inferred_candidate`: system-generated inference that is not directly user-confirmed.

## 3. Merge Principles

1. Only source-backed candidates are eligible for merge.
2. Source information such as `sourceTrace`, `sourceText`, `sourceRecordId`, and `sourceField` must not be removed.
3. The same signal from different sources must not blindly overwrite another source.
4. When ResumeProfile and WorkRecords provide the same signal, source traces are combined.
5. WorkRecords can support a ResumeProfile strength, but a WorkRecord alone must not over-confirm a final strength.
6. Contradicted candidates block strength or move to separated risk handling.
7. Weak candidates do not strengthen or upgrade strength.
8. `missingEvidence` is preserved as clarification candidates, not deleted.
9. Lower-confidence candidates must not lower or overwrite higher-confidence candidates.
10. Until a `manual_user_confirmed_candidate` exists, merged output remains candidate state, not final apply.

## 4. Priority Policy

Priority order:

```text
manual_user_confirmed_candidate > explicit_resume_profile > explicit_work_record > inferred_strong_resume_profile > inferred_strong_work_record > weak_or_missing
```

Higher priority does not delete lower-priority source traces. Lower-priority sources remain as `supportingTrace` or `relatedEvidence`.

## 5. Conflict Policy

Conflict case:

```text
ResumeProfile says user owned prioritization
WorkRecord says PO handled prioritization
```

Expected handling:

- `prioritization` strength is blocked from final apply.
- Contradicted evidence is separated into `contradictedSignals` or `riskSignals`.
- A clarification question is generated.
- Both ResumeProfile and WorkRecord source traces are preserved.

## 6. MissingEvidence Policy

- `missingEvidence` is not promoted to strength.
- `missingEvidence` is not deleted.
- When multiple sources produce the same missing signal, dedupe the signal while preserving questions and source-specific reasons.
- Missing evidence without `clarificationQuestion` is excluded from merge or treated as invalid.

## 7. Forbidden Behavior

- Case-id based merge logic.
- Fixture-sentence-only merge logic.
- Source-less strength merge.
- Strength upgrades from weak evidence.
- Keeping strength while ignoring contradicted evidence.
- Overwriting ResumeProfile explicit strength with a single WorkRecord line.
- Generating exaggerated UI copy for display.
