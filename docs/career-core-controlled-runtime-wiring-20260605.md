# Career Core Controlled Runtime Wiring 2026-06-05

## Summary
- Adds opt-in runtime wiring for controlled CareerProfile ownership signals.
- Keeps default `buildCareerProfileFromResumeProfile()` behavior unchanged.
- Reflects only eligible controlled strength candidates into existing `signals.strengthSignals`.
- Reflects weak, contradicted, overclaim, and insufficient ownership evidence only into `signals.riskSignals`.
- Keeps missing evidence as read-only candidate metadata under `meta.controlledSignalCandidates.missingEvidence`.

## Guardrails
- `enableControlledOwnershipSignals` must be `true`.
- `explicit` and `inferred_strong` are the only allowed strength confidence values.
- Strength candidates require at least one `sourceTraces` entry.
- Every strength `sourceTrace.sourceText` must be non-empty.
- `inferred_weak`, `contradicted`, `absent`, and source-less signals are blocked from strength wiring.
- `buildControlledCareerProfileSignals()` remains read-only and returns `appliedToCareerProfile: false`.
- No WorkRecords, RoleFit, scoring, UI, API, DB, Supabase, env, deployment, or package changes.

## Verification
- `node scripts/test-career-core-controlled-runtime-wiring.js`
- Existing Career Core contract and ownership/evidence scripts.
- `npm run build`
