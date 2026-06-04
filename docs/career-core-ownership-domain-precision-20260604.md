# Career Core Ownership Domain Precision Expansion - 2026-06-04

## Purpose

This batch expands ownership/seniority false-positive guardrails beyond accounting/finance into adjacent business domains.

The goal is precision. The classifier must not infer senior ownership from impressive domain words alone.

## Added fixture

```text
src/lib/career-core/__fixtures__/ownershipDomainPrecisionCases.js
```

The fixture covers five false-positive-prone domains:

1. Sales support
2. Marketing operations
3. Customer support / CX routing
4. Data export / SQL execution
5. Product requirement forwarding

## Added test

```text
scripts/test-career-core-ownership-domain-precision.js
```

The test checks two things:

1. Existing ownership/seniority baseline remains exactly preserved.
2. New domain precision cases remain `unknown_admin_support` unless there is stronger evidence of actual ownership, judgment, or strategy.

## Guarded false positives

### Sales

Words like `고객사`, `제안서`, `가격표`, or `수주` are not enough to infer:

- `sales_lead`
- `proposal_strategy`
- `revenue_ownership`

### Marketing

Words like `SNS`, `블로그`, `캠페인`, or `업로드` are not enough to infer:

- `growth_strategy`
- `campaign_owner`
- `performance_marketing`

### Customer support / CX

Words like `고객 문의`, `VOC`, or `문의 배정` are not enough to infer:

- `cx_strategy`
- `service_planning`
- `voc_analysis_owner`

### Data / SQL

Words like `SQL`, `쿼리`, `데이터 추출`, or `대시보드` are not enough to infer:

- `data_analyst`
- `metric_definition`
- `dashboard_owner`

### Product / PM

Words like `요구사항`, `개선 요청`, or `개발팀 전달` are not enough to infer:

- `product_ownership`
- `requirements_definition`
- `roadmap_ownership`

## Implementation note

The classifier does not add these new `shouldNotInfer` values to every ambiguous case.

Instead, it dynamically appends domain-specific `shouldNotInfer` values only when the relevant domain wording appears in the input. This preserves the existing baseline exactly while making false-positive cases safer.

## Guardrails

This batch does not change:

- CareerProfile wiring
- timeline logic
- RoleFit/scoring
- UI
- API
- DB
- Supabase
- env
- deployment

## Verification

Expected commands:

```powershell
node scripts/test-career-core-ownership-domain-precision.js
node scripts/test-career-core-ownership-precision.js
node scripts/test-career-core-ownership-seniority.js
node scripts/test-career-core-ownership-evidence-improvements.js
node scripts/test-career-core-gap-employment-timeline.js
node scripts/test-career-core-short-tenure-risk.js
node scripts/test-career-core-employment-metadata.js
node scripts/test-career-core-employment-type.js
node scripts/qa-career-core-date-employment-baseline.js
npm run build
```

## Next patch candidates

1. Add positive examples for sales, marketing, CS/CX, data, and PM ownership.
2. Add evidence confidence calibration by positive/negative evidence count.
3. Add source traceability per extracted evidence flag.
4. Add controlled CareerProfile integration after positive/negative coverage is broader.
