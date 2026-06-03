# Rejection Analysis + Career Core Read-only Signal QA

## 1. Purpose

This batch adds a read-only Career Core v0 signal that can be used beside rejection analysis.
It is not a rejection cause engine, risk scorer, eligibility judgment, or AI-generated conclusion.

The signal only summarizes deterministic role/industry fit buckets from a synthetic or parsed
ResumeProfile and JD-derived target.

## 2. Connection approach

- `buildRejectionCareerCoreSignal` accepts ResumeProfile/JD context.
- It reuses `buildCareerCoreTargetFromJdFit` for conservative target inference.
- It calls `buildCareerProfileFromResumeProfile(profile, { target })` only when a target is inferred.
- It returns a read-only object with:
  - `status`
  - inferred `target`
  - `primaryFitLevel`
  - direct/adjacent/transferable/unrelated/unknown month buckets
  - caution copy
  - raw Career Core `fit`
- It does not modify precise risk scoring, evidence, recommendations, or composite risk output.

## 3. Changed files

- `src/lib/preciseAnalysis/buildRejectionCareerCoreSignal.js`
- `scripts/test-rejection-career-core-bridge.js`
- `docs/rejection-analysis-career-core-readonly-20260603.md`

## 4. QA cases

| Case | Expected | Actual | Status |
| --- | --- | --- | --- |
| PM/SaaS JD + operations/planning resume | Ready signal, adjacent or transferable centered | primary `transferable`, 36 transferable months | PASS |
| PM/SaaS JD + bio production quality resume | Ready signal, not direct | primary `unrelated`, 48 unrelated months, 0 direct | PASS |
| Bio/GMP quality JD + bio production quality resume | Ready signal, direct centered | primary `direct`, 42 direct months | PASS |
| Career education JD + career content resume | Ready signal with career education target | primary `direct`, 36 direct months | PASS |
| Ambiguous JD | Skip without over-inference | `target_not_inferred` | PASS |
| JD missing | Skip without over-inference | `target_not_inferred` | PASS |
| Profile missing | Skip safely | `missing_resume_profile` | PASS |
| Long JD | Ready when clear target signals exist | primary `direct`, PM/SaaS target inferred | PASS |
| Korean/English mixed JD | Ready when clear mixed target signals exist | primary `direct`, PM/SaaS target inferred | PASS |

## 5. Conservative copy check

The bridge exposes the label `Career Core v0 reference signal` and caution copy:

> Career Core v0 참고 신호입니다. 직무/산업 신호 기준의 보조 분류이며 탈락 원인 확정이 아닌 참고용 해석입니다.

The bridge avoids product claims such as:

- 합격 가능성
- 정확한 유관 경력
- 최종 적격성
- 이것 때문에 떨어짐
- 확실히 맞음

## 6. Existing rejection analysis flow

Preserved:

- Existing precise analysis risk builders are unchanged.
- Existing risk score, reasons, evidence, and recommendation flow are unchanged.
- No API or App.jsx wiring was added in this batch.
- The new bridge can be consumed by a later UI/data-flow patch without changing Career Core logic.

## 7. Limits found

- This is a read-only bridge only; it is not yet displayed in the rejection analysis UI.
- Target inference remains deterministic v0 and intentionally conservative.
- Korean-only JD inference depends on the existing adapter keyword coverage.
- Month aggregation follows Career Core v0: experience duration sum, not unique de-overlapped months.
- Career Core fit should remain supporting context, not a rejection cause explanation.

## 8. Recommended next steps

1. Add a small UI box in the rejection analysis result screen once the allowed data-flow anchor is selected.
2. Expand Korean target inference only through the shared JD target adapter.
3. Product copy should keep this as a reference signal before real-user QA validates precision.
4. Do not blend this signal into rejection risk scoring until there is a separate calibration batch.
