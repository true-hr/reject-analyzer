# Career Core Controlled CareerProfile Integration - 2026-06-05

## Summary

- Add `buildControlledCareerProfileSignals()` as a read-only integration layer.
- Convert ownership classification, evidence confidence, and source traceability into candidate strength, risk, missing, and contradicted evidence outputs.
- Prevent weak, contradicted, or absent evidence from becoming CareerProfile strength signals.
- Keep runtime CareerProfile untouched.

## Utility Shape

```js
{
  candidateStrengthSignals: [],
  candidateRiskSignals: [],
  missingEvidence: [],
  contradictedSignals: [],
  integrationStatus: "read_only_candidate",
  appliedToCareerProfile: false
}
```

## Rules

- Only `explicit` and `inferred_strong` evidence can become candidate strength signals.
- Strength signals must include at least one non-empty source trace.
- `inferred_weak` evidence becomes risk evidence, not strength.
- `contradicted` evidence becomes contradicted and risk evidence, not strength.
- `absent` evidence becomes missing evidence with a clarification prompt where available.
- Runtime CareerProfile builders and schema remain unchanged.

## Fixture Coverage

- `explicit_pm_controlled_profile_signal`
- `weak_pm_forwarding_controlled`
- `explicit_data_controlled_profile_signal`
- `weak_sql_export_controlled`
- `mixed_cx_controlled`
- `explicit_sales_controlled`
- `ambiguous_excel_controlled`
- `classification_input_controlled`

## Guardrails

- No runtime CareerProfile wiring.
- No schema changes.
- No timeline/RoleFit/scoring changes.
- No UI/API/DB/Supabase/env/deployment changes.
- No package changes.

## Verification

Record command results in the PR body:

- `node scripts/test-career-core-controlled-profile-signals.js`
- `node scripts/test-career-core-evidence-traceability.js`
- `node scripts/test-career-core-evidence-confidence.js`
- `node scripts/test-career-core-ownership-positive.js`
- `node scripts/test-career-core-ownership-domain-precision.js`
- `node scripts/test-career-core-ownership-precision.js`
- `node scripts/test-career-core-ownership-seniority.js`
- `node scripts/test-career-core-ownership-evidence-improvements.js`
- `node scripts/test-career-core-gap-employment-timeline.js`
- `node scripts/test-career-core-short-tenure-risk.js`
- `node scripts/test-career-core-employment-metadata.js`
- `node scripts/test-career-core-employment-type.js`
- `node scripts/qa-career-core-date-employment-baseline.js`
- `npm run build`
