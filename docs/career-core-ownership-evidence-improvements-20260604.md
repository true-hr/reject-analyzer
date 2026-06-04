# Career Core Ownership Evidence Improvement Suggestions - 2026-06-04

## Purpose

This batch adds a pure utility that turns an ownership/seniority classification into resume improvement guidance.

The goal is not to rewrite the resume automatically. The goal is to tell the user:

- how the current sentence is likely to be read,
- what evidence is missing,
- what questions should be answered,
- what should not be claimed,
- and what focus would make the experience stronger.

This directly supports the PASSMAP principle:

> If an experience currently reads weakly, do not overclaim. Identify the missing evidence that would make it read stronger.

## Added utility

File:

```text
src/lib/career-core/suggestOwnershipEvidenceImprovements.js
```

Export:

```js
suggestOwnershipEvidenceImprovements(input)
```

It accepts either a raw ownership/seniority input or a precomputed classification:

```js
suggestOwnershipEvidenceImprovements({
  roleTitle: "사무보조",
  artifact: "엑셀 자료 정리",
  description: ["엑셀을 활용해 자료를 정리"]
})

suggestOwnershipEvidenceImprovements({
  classification: classifyOwnershipSeniority(input)
})
```

## Output shape

The utility returns:

```js
{
  currentReading,
  roleFamily,
  ownershipLevel,
  judgmentLevel,
  seniorityLevel,
  evidenceLevel,
  confidence,
  missingEvidence,
  clarificationQuestions,
  rewriteFocus,
  shouldNotClaim,
  safeClaimBoundary,
  appliedToResume: false,
  appliedToCareerProfile: false
}
```

## Key behavior

### Ambiguous Excel-only records

If the input only says something like "엑셀 자료 정리", the utility should not claim finance, accounting, product operations, or senior ownership.

It should return missing evidence such as:

- purpose and use of the material,
- whether the person only entered data or made judgments,
- who used the output for decisions,
- whether the person improved the process.

### Accounting admin records

For junior accounting/admin Excel work, the utility should say the current sentence reads as support-level work unless there is evidence of:

- account reconciliation,
- error detection,
- month-end close context,
- adjustment judgment,
- audit or tax reporting use.

### Senior accounting records

For senior accounting close-pack work, the utility should ask for stronger details such as:

- account scope,
- close ownership scope,
- adjustment judgment,
- audit evidence,
- financial impact explanation.

### Finance analysis records

For forecast/scenario spreadsheet work, the utility should focus on:

- assumptions,
- variables,
- scenario differences,
- decision use,
- budget or target-setting influence.

### HR operations records

For payroll/attendance spreadsheet work, the utility should keep the role as HR operations unless there is explicit evidence of accounting/finance ownership.

### Product operations records

For funnel reports, the utility should focus on:

- the funnel stage analyzed,
- what drop-off was discovered,
- what improvement was proposed,
- whether it shipped,
- how post-release impact was tracked.

## Guardrails

The utility does not:

- rewrite the resume automatically,
- mutate CareerProfile,
- add strength/risk signals to runtime profile,
- alter timeline logic,
- alter scoring,
- call AI,
- change UI/API/DB/Supabase/env/deployment.

All outputs remain advisory and return:

```js
appliedToResume: false
appliedToCareerProfile: false
```

## Verification

Expected commands:

```powershell
node scripts/test-career-core-ownership-evidence-improvements.js
node scripts/test-career-core-ownership-seniority.js
node scripts/test-career-core-gap-employment-timeline.js
node scripts/test-career-core-short-tenure-risk.js
node scripts/test-career-core-employment-metadata.js
node scripts/test-career-core-employment-type.js
node scripts/qa-career-core-date-employment-baseline.js
```

## Next patch candidates

1. Resume sentence rewrite candidate generator
2. Missing evidence / clarification question expansion for non-spreadsheet artifacts
3. Evidence extraction baseline expansion
4. Controlled CareerProfile integration with source traceability
