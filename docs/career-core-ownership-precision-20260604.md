# Career Core Ownership Precision Guardrails - 2026-06-04

## Purpose

This batch tightens `classifyOwnershipSeniority()` so it does not over-infer seniority or domain expertise from a single impressive-looking word.

The goal is precision, not coverage expansion.

## Problem

The previous ownership/seniority classifier passed the baseline cases, but some words could still cause false positives:

- `외부 회계법인` could incorrectly imply audit response lead.
- `경영진 회의` could incorrectly imply finance analysis.
- `매출 현황` could incorrectly imply FP&A or accounting finance.
- `마감` could incorrectly imply accounting close.
- `계정 대사` could incorrectly imply senior accountant ownership even when a senior reviewer makes the final judgment.

## Added fixture

```text
src/lib/career-core/__fixtures__/ownershipPrecisionCases.js
```

The fixture adds negative/edge cases that must not be overclassified.

## Added test

```text
scripts/test-career-core-ownership-precision.js
```

The test checks both:

1. Existing ownership/seniority baseline remains preserved.
2. New precision cases do not produce false positives.

## Classifier changes

### 1. Negated evidence handling

The classifier now detects lines such as:

```text
예측 모델링은 수행하지 않음
조정 전표 판단은 선임 회계 담당자가 최종 판단
회계 결산은 수행하지 않음
```

Negated lines are not allowed to become positive evidence for high-level classification.

### 2. Accounting precision

Accounting finance now requires stronger evidence such as:

- account reconciliation,
- account ledger/sub-ledger comparison,
- accounting close,
- adjustment entry judgment,
- audit response.

But handoff-only cases remain `accounting_admin`.

### 3. Finance analysis precision

Finance analysis now requires explicit forecasting/modeling/scenario/budget/target-setting evidence.

`경영진 공유` alone is not enough.

### 4. Close-word precision

`마감` alone is not treated as accounting close.

Project close, submission close, and schedule close remain admin/operations support unless accounting close evidence exists.

### 5. Ownership precision

Account reconciliation without lead authority is not senior ownership.

If the person marks differences and a senior accountant makes the final decision, the result should be:

```js
ownershipLevel: "support"
judgmentLevel: "medium_low"
seniorityLevel: "junior_or_mid_support"
```

## Guardrails

This batch does not change:

- CareerProfile wiring,
- timeline logic,
- RoleFit,
- scoring,
- UI,
- API,
- DB,
- Supabase,
- env,
- deployment.

## Verification

Expected commands:

```powershell
node scripts/test-career-core-ownership-precision.js
node scripts/test-career-core-ownership-seniority.js
node scripts/test-career-core-ownership-evidence-improvements.js
node scripts/test-career-core-gap-employment-timeline.js
node scripts/test-career-core-short-tenure-risk.js
node scripts/test-career-core-employment-metadata.js
node scripts/test-career-core-employment-type.js
node scripts/qa-career-core-date-employment-baseline.js
```

## Next patch candidates

1. Expand precision guardrails for sales, marketing, CS, PM, and data-analysis artifacts.
2. Add evidence confidence calibration by positive/negative evidence count.
3. Add source traceability to each extracted evidence flag.
4. Add controlled CareerProfile integration only after precision coverage improves.
