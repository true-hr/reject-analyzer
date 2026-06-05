# Career Core ResumeProfile Controlled Runtime Regression QA 2026-06-05

## 1. Purpose
This QA batch verifies the merged opt-in controlled runtime wiring for `buildCareerProfileFromResumeProfile()` against realistic ResumeProfile-shaped inputs.

## 2. Why This Is Regression QA
The runtime implementation is already merged. This batch adds only fixtures, a deterministic regression test, and documentation. It does not change controlled signal generation, CareerProfile normalization, scoring, WorkRecords wiring, UI, API, DB, Supabase, env, deployment, or package files.

## 3. Default Disabled Invariant
Calling `buildCareerProfileFromResumeProfile(resumeProfile)` or passing `enableControlledOwnershipSignals: false` must match the baseline result exactly. No `controlledSignalCandidate` entries and no `meta.controlledSignalCandidates` metadata should appear.

## 4. Opt-In Enabled Invariant
Controlled candidates may appear only when `enableControlledOwnershipSignals: true` is passed. Opt-in candidates must remain distinguishable through `controlledSignalCandidate: true`.

## 5. Strength, Risk, And Missing Guardrails
Controlled strength candidates are valid only when they are `explicit` or `inferred_strong`, have at least one source trace, and every source trace has non-empty `sourceText`. Weak, contradicted, absent, and source-less candidates must not become strength. Risk candidates must carry a `reasonCode` or `evidenceText`. Missing evidence must remain read-only under `meta.controlledSignalCandidates.missingEvidence` and include a `clarificationQuestion`.

## 6. Realistic ResumeProfile Fixtures
- `realistic_pm_explicit_opt_in`: service planning and PM ownership signals.
- `realistic_pm_weak_support_only`: PM support work with weak ownership.
- `realistic_data_explicit_opt_in`: metric, SQL, analysis, dashboard, and decision-support ownership.
- `realistic_sql_execution_weak`: fixed SQL execution and data-team-owned definitions.
- `realistic_excel_ambiguous`: Excel-only admin work with insufficient ownership evidence.
- `realistic_contradicted_ownership`: positive participation language plus explicit ownership contradiction.

## 7. Failure Interpretation
A failure means the runtime wiring no longer preserves default behavior, no longer limits strength to source-backed strong evidence, leaks missing evidence into the signals schema, or changes CareerProfile schema keys. Runtime logic should not be changed in this QA batch; report the failing invariant instead.

## 8. Conditions For Next Step
Proceed only when the new regression test, existing controlled runtime wiring tests, controlled profile signal tests, evidence traceability/confidence tests, ownership tests, employment tests, and production build pass. The existing date/employment baseline audit may remain `REVIEW` if it has no new `FAIL`.
