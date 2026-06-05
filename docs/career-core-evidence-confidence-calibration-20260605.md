# Career Core Evidence Confidence Calibration - 2026-06-05

## Summary

- Add `calibrateEvidenceConfidence()` as a read-only utility for Career Core ownership evidence.
- Distinguish `explicit`, `inferred_strong`, `inferred_weak`, `contradicted`, and `absent` evidence.
- Preserve positive ownership examples and false-positive guardrails.
- Keep results read-only and not wired into CareerProfile.

## Confidence Levels

- `explicit`: action, responsibility, judgment, or outcome is directly stated.
- `inferred_strong`: direct ownership words are missing, but multiple strong evidence signals make the inference likely.
- `inferred_weak`: artifacts or domain words exist, but action, ownership, judgment, or outcome evidence is thin.
- `contradicted`: positive-looking evidence is negated or assigned to another owner.
- `absent`: the requested evidence signal does not appear.

## Fixture Coverage

- `explicit_sales_ownership`
- `weak_sales_support`
- `explicit_growth_marketing`
- `weak_marketing_upload`
- `explicit_cx_improvement`
- `weak_cx_routing`
- `explicit_data_analysis`
- `weak_sql_export`
- `explicit_pm_requirements`
- `weak_pm_forwarding`
- `ambiguous_excel_only`
- `mixed_positive_and_negative`

## Guardrails

- No CareerProfile wiring.
- No timeline/RoleFit/scoring changes.
- No UI/API/DB/Supabase/env/deployment changes.
- No package changes.

## Verification

Record command results in the PR body:

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
