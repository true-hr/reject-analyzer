# Career Core WorkRecords Controlled Signal Contract 2026-06-05

## Purpose
WorkRecords and AI Inbox records can be shorter and less contextual than resume evidence. This contract fixes the safe interpretation rules before connecting work-record based records to CareerProfile candidate signals.

The guiding rule is conservative interpretation: a short work record must not be promoted into a strong capability unless ownership, judgment, or impact evidence is explicit and traceable.

## WorkRecord Evidence Level

| Level | Meaning |
| --- | --- |
| `explicit_work_action` | A concrete work action is clearly described. |
| `explicit_ownership` | The record clearly supports that the user owned, led, or was directly responsible for the work. |
| `explicit_judgment` | Judgment, priority setting, criteria setting, or decision rationale is clearly described. |
| `explicit_impact` | Result, impact, usage, or outcome is clearly described. |
| `inferred_weak_activity` | Activity exists, but ownership, judgment, or impact evidence is weak. |
| `contradicted_ownership` | Evidence conflicts with the claim that the user owned the work. |
| `missing_context` | Required context is missing for safe interpretation. |

## Strength Candidate Conditions
For a WorkRecord signal to become an eligible strength candidate, it must include at least one of:

- `explicit_ownership`
- `explicit_judgment`
- `explicit_impact`

All of the following are also required:

- `sourceText` exists.
- `sourceRecordId` exists.
- `recordDate` or `createdAt` exists.
- The signal is derived from a work action, not from a case id or fixture-only marker.
- The signal is not contradicted.

## Risk Candidate Conditions
The following must be routed to risk candidates instead of strength candidates:

- `inferred_weak_activity`
- `contradicted_ownership`
- overclaim risk
- missing source
- ambiguous ownership
- unclear impact

## Missing Evidence Conditions
The following must be represented as missing evidence when the record is not sufficient for safe interpretation:

- unclear work purpose
- unclear user role
- unclear judgment criteria
- unclear result or usage
- unclear impact metric
- unclear next action

Every missing evidence item must include a `clarificationQuestion`.

## Prohibitions
- Do not confirm a strong capability from a single short work-record line alone.
- Do not promote meeting attendance alone to `cross_functional_collaboration` strength.
- Do not promote material organization alone to `data_analysis` strength.
- Do not confirm analytical capability from words like Excel, report, or dashboard alone.
- Do not promote "shared", "delivered", or "organized" alone to ownership strength.
- Do not allow strength candidates without `sourceRecordId`.
- Do not allow strength candidates without `sourceText`.
- Do not use case id based judgment.
- Do not use fixture sentence specific judgment.

## Batch Scope
- Contract, fixture, test, and documentation only.
- No WorkRecords runtime wiring.
- No ResumeProfile runtime change.
- No CareerProfile schema change.
- No RoleFit or scoring change.
- No UI, API, DB, Supabase, env, deployment, or package change.
