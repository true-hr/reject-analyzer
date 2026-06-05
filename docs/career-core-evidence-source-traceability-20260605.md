# Career Core Evidence Source Traceability - 2026-06-05

## Summary

- Add `buildEvidenceTraceMap()` for read-only Career Core evidence source tracing.
- Track `sourceText`, `sourceField`, `sourceIndex`, `reasonCode`, evidence level, confidence, and contradiction state per signal.
- Separate missing and contradicted signals.
- Keep trace results read-only and not wired into CareerProfile.

## Trace Object

Each trace entry preserves the original source text and source location:

```js
{
  signal: "requirements_definition",
  evidenceLevel: "explicit",
  confidence: "explicit",
  sourceText: "요구사항 정의, PRD 작성, 사용자 스토리 정리와 우선순위 결정을 담당했다.",
  sourceSection: "description",
  sourceField: "description",
  sourceIndex: 1,
  matchedPattern: "요구사항 정의",
  reasonCode: "explicit_requirements_definition",
  isContradicted: false
}
```

## Fixture Coverage

- `explicit_pm_trace`
- `explicit_data_trace`
- `weak_sales_trace`
- `mixed_cx_trace`
- `ambiguous_excel_trace`
- `source_field_trace`

## Guardrails

- No CareerProfile wiring.
- No timeline/RoleFit/scoring changes.
- No UI/API/DB/Supabase/env/deployment changes.
- No package changes.
- No resume rewrite or generated explanation text.

## Verification

Record command results in the PR body:

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
