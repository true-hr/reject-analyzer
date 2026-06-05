# Career Core Positive Ownership Examples - 2026-06-04

## Summary

- Added positive ownership fixtures for Sales, Growth Marketing, CX, Data, and PM/Service Planning.
- Updated `classifyOwnershipSeniority()` so positive ownership is inferred only when domain, action, ownership, judgment, and impact evidence appears together.
- Preserved existing false-positive guardrails by keeping domain-specific `shouldNotInfer` expansion scoped to `unknown_admin_support`.

## Positive Cases

- Sales proposal strategy owner: customer problem discovery, proposal strategy, commercial negotiation, and revenue ownership.
- Growth marketing campaign owner: campaign hypothesis, creative A/B testing, performance metric analysis, and budget optimization.
- CX/VOC improvement owner: VOC analysis, customer journey diagnosis, support policy improvement, and customer issue reduction.
- Data metric/dashboard analyst: metric definition, SQL query design, root cause analysis, dashboard design, and decision support.
- PM/service planning requirements owner: problem definition, requirements definition, prioritization, cross-functional collaboration, and post-release monitoring.

## Guardrails

- No CareerProfile wiring.
- No timeline/RoleFit/scoring changes.
- No UI/API/DB/Supabase/env/deployment changes.
- No package changes.
- Existing negative/domain precision cases must remain passing.

## Verification

Record command results in the PR body:

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
