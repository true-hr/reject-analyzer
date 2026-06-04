# Career Core Ownership & Seniority Classifier - 2026-06-04

## Purpose

This batch adds a pure `classifyOwnershipSeniority()` utility.

The goal is to prevent Career Core from over-interpreting artifact labels such as "Excel" or "report". The same artifact can represent very different career value depending on action, ownership, judgment, domain, and impact.

## Core principle

Do not classify seniority or role depth from artifact type alone.

Bad inference:

```text
Excel → finance analysis
Excel → senior accounting
Report → strategy
Dashboard → senior analytics
```

Required inference path:

```text
Artifact → Action → Ownership → Judgment → Domain → Impact
```

## Added files

```text
src/lib/career-core/classifyOwnershipSeniority.js
scripts/test-career-core-ownership-seniority.js
docs/career-core-ownership-seniority-classifier-20260604.md
```

`src/lib/career-core/index.js` exports:

```js
classifyOwnershipSeniority
extractOwnershipEvidence
```

## Input

The utility accepts a work-record/resume-fragment shaped object:

```js
{
  roleTitle: "시니어 회계 담당자",
  artifact: "월마감 결산 검토 엑셀 패키지",
  description: [
    "월마감 시 매출, 매입, 미수금, 미지급금 계정별 원장과 보조명세를 대사",
    "전월 대비 차이와 비정상 변동 항목을 분석해 조정 전표 필요 여부를 판단",
    "대표와 외부 회계법인에 월마감 이슈와 재무 영향도를 설명"
  ],
  context: {
    decisionAuthority: "lead",
    reviewStructure: "owns_close_review",
    accountingJudgment: "explicit"
  }
}
```

## Output

The utility returns:

```js
{
  artifactType,
  roleFamily,
  seniorityLevel,
  ownershipLevel,
  judgmentLevel,
  domainDepth,
  evidenceLevel,
  shouldNotInfer,
  strengthSignals,
  riskSignals,
  explanationBoundary,
  confidence,
  evidence,
  appliedToCareerProfile: false
}
```

## Supported baseline distinctions

The current classifier is calibrated to the ownership/seniority baseline fixtures:

1. Accounting admin Excel entry
2. Senior accountant monthly close pack
3. Finance analyst forecast model
4. HR operations payroll input sheet
5. Product operations funnel report
6. Ambiguous Excel-only admin support

## Classification examples

### Junior accounting/admin support

Signals:

- receipt/invoice collection
- fixed-format entry
- document organization
- evidence folder management
- senior review required

Output:

```js
roleFamily: "accounting_admin"
ownershipLevel: "support"
judgmentLevel: "low"
seniorityLevel: "junior_support"
```

### Senior accounting/close ownership

Signals:

- account reconciliation
- monthly close review
- variance analysis
- adjustment entry judgment
- audit evidence preparation
- financial issue explanation

Output:

```js
roleFamily: "accounting_finance"
ownershipLevel: "lead"
judgmentLevel: "high"
seniorityLevel: "senior_practitioner"
```

### Finance analysis

Signals:

- forecast modeling
- scenario analysis
- sensitivity analysis
- business assumptions
- executive decision support

Output:

```js
roleFamily: "finance_analysis"
ownershipLevel: "recommend"
judgmentLevel: "medium_high"
seniorityLevel: "analyst_or_mid"
```

### HR operations

Signals:

- attendance data
- leave/overtime data
- payroll input preparation
- cross-department follow-up
- external payroll office handoff

Output:

```js
roleFamily: "hr_operations"
ownershipLevel: "support"
judgmentLevel: "medium_low"
seniorityLevel: "junior_or_mid_support"
```

### Product operations

Signals:

- funnel report
- user drop-off diagnosis
- onboarding/message/timing improvement
- product team discussion
- post-release monitoring

Output:

```js
roleFamily: "product_operations"
ownershipLevel: "recommend_and_follow_up"
judgmentLevel: "medium_high"
seniorityLevel: "mid_practitioner"
```

### Ambiguous Excel-only record

Signals:

- Excel usage only
- basic data organization
- no decision authority
- no domain-specific action
- no stakeholder/impact evidence

Output:

```js
roleFamily: "unknown_admin_support"
ownershipLevel: "unknown"
judgmentLevel: "unknown"
evidenceLevel: "inferred_weak"
confidence: "low"
```

## Anti-overclaim behavior

The classifier returns `shouldNotInfer` to guard against overclaiming.

For example, ambiguous Excel-only work includes:

```js
shouldNotInfer: [
  "accounting_finance",
  "finance_analysis",
  "product_operations",
  "senior_ownership",
  "domain_expertise"
]
```

This is the core trust mechanism.

## Not applied yet

This utility is not wired into:

- CareerProfile
- timeline calculation
- RoleFit
- scoring
- UI
- API
- DB
- Supabase
- deployment

Every result returns:

```js
appliedToCareerProfile: false
```

## Verification

Expected commands:

```powershell
node scripts/test-career-core-ownership-seniority.js
node scripts/test-career-core-gap-employment-timeline.js
node scripts/test-career-core-short-tenure-risk.js
node scripts/test-career-core-employment-metadata.js
node scripts/test-career-core-employment-type.js
node scripts/qa-career-core-date-employment-baseline.js
```

## Next patch candidates

1. Evidence extraction baseline expansion
2. Resume sentence rewrite suggestion utility
3. Missing evidence / clarification question generator
4. Controlled integration into CareerProfile strength/risk signals
