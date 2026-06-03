# Rejection Career Core Realistic Samples QA

## 1. QA 목적

PR #717에서 서류탈락 원인분석 결과 화면에 추가된 `Career Core v0 참고 신호` box가 실제 사용자형 샘플에서 어떻게 동작하는지 확인했다.

이번 작업은 QA 전용이다. App.jsx, UI, copy, API, DB, env, scoring 로직은 수정하지 않았다. 발견된 문제는 문서화만 했다.

## 2. 검증 환경

- Branch: `qa/rejection-career-core-realistic-samples-20260603`
- Base: `origin/main` at PR #717 merge commit
- QA method:
  - `buildRejectionCareerCoreSignal` deterministic script
  - realistic ResumeProfile/JD fixture 15개
  - UI wiring static check는 기존 `scripts/test-rejection-career-core-ui-wiring.js`로 확인
- No AI/API calls.
- No browser/manual logged-in E2E.
- No production deploy.

## 3. 실행 명령

```bash
node scripts/test-career-core-timeline.js
node scripts/test-career-core-signals.js
node scripts/test-career-core-fit.js
node scripts/qa-career-core-fit-real-cases.js
node scripts/test-rejection-career-core-bridge.js
node scripts/test-rejection-career-core-ui-wiring.js
node scripts/qa-rejection-career-core-realistic-samples.js
npm run build
```

## 4. 케이스별 결과 표

| case | resume type | JD type | expected | actual status | target role | target industry | primary fit | direct | adjacent | transferable | unrelated | unknown | QA status |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| real-001-pm-saas-service-planning-ops | service planning / operations | PM/SaaS | ready | ready | product_planning_pm | b2b_saas | direct | 48 | 0 | 0 | 0 | 0 | PASS |
| real-002-pm-saas-bio-quality | bio production quality | PM/SaaS | ready_or_skipped | ready | product_planning_pm | b2b_saas | unrelated | 0 | 0 | 0 | 60 | 0 | PASS |
| real-003-bio-gmp-quality-aligned | bio production quality | Bio/GMP quality | ready | ready | production_quality | bio_pharma | direct | 72 | 0 | 0 | 0 | 0 | PASS |
| real-004-bio-gmp-korean-only | bio production quality | Korean-only Bio/GMP quality | ready_preferred | ready | production_quality | bio_pharma | direct | 54 | 0 | 0 | 0 | 0 | PASS |
| real-005-career-education-content | career content / consulting | career education | ready | ready | marketing_growth | career_education | direct | 48 | 0 | 0 | 0 | 0 | PASS |
| real-006-marketing-content-career-content | career content / consulting | marketing content | ready_or_transferable | ready | marketing_growth |  | transferable | 0 | 0 | 36 | 0 | 0 | PASS |
| real-007-operations-cs-process | operations / CS | operations / process improvement | ready | ready | production_quality | b2b_saas | transferable | 0 | 0 | 60 | 0 | 0 | REVIEW |
| real-008-ambiguous-jd | PM/SaaS | ambiguous | skipped | skipped |  |  | unknown | 0 | 0 | 0 | 0 | 0 | PASS |
| real-009-korean-only-pm-jd | service planning / operations | Korean-only PM/SaaS | inference_gap_check | ready | product_planning_pm | b2b_saas | direct | 42 | 0 | 0 | 0 | 0 | PASS |
| real-010-long-jd-pm-saas | mixed PM / operations / production | long PM/SaaS | ready | ready | product_planning_pm | b2b_saas | transferable | 24 | 0 | 36 | 24 | 0 | PASS |
| real-011-newgrad-intern-pm | newgrad / intern | PM/SaaS | ready_or_unknown | ready | product_planning_pm | b2b_saas | adjacent | 0 | 6 | 0 | 0 | 0 | PASS |
| real-012-career-gap-ops-to-pm | operations with gap | PM/SaaS | ready | ready | product_planning_pm | b2b_saas | adjacent | 0 | 30 | 24 | 0 | 0 | PASS |
| real-013-short-tenures-marketing | short-tenure marketing | marketing content | ready | ready | marketing_growth | b2b_saas | transferable | 0 | 0 | 18 | 0 | 0 | REVIEW |
| real-014-same-industry-different-role | B2B SaaS customer support | PM/SaaS | ready | ready | product_planning_pm | b2b_saas | adjacent | 0 | 60 | 0 | 0 | 0 | PASS |
| real-015-same-role-different-industry | PM role in bio manufacturing | PM/SaaS | ready | ready | product_planning_pm | b2b_saas | unrelated | 0 | 0 | 0 | 48 | 0 | PASS |

## 5. ready/skipped 비율

- Total: 15
- Ready: 14 / 15 (93.3%)
- Skipped: 1 / 15 (6.7%)
- PASS: 13
- REVIEW: 2
- FAIL: 0

Interpretation:

- Target hints and mixed English/Korean keywords make the signal ready in most realistic cases.
- Very ambiguous JD correctly skipped and would not render the UI box.
- Ready does not mean aligned: mismatch cases safely produced `unrelated`, `transferable`, or `adjacent` instead of direct.

## 6. Korean-only JD inference 결과

- Korean-only cases: 2
- Ready: 2
- Skipped: 0

Observed:

- Korean Bio/GMP quality JD inferred `production_quality / bio_pharma`.
- Korean PM/SaaS JD inferred `product_planning_pm / b2b_saas`.

Limit:

- This sample set includes Korean words plus globally recognizable terms like `B2B SaaS`, `GMP`, and `PM-like` duty terms. Broader Korean-only coverage is still needed before treating this as robust.

## 7. 과잉 추론 사례

### REVIEW: operations quality word over-inferred as production_quality

- Case: `real-007-operations-cs-process`
- JD was operations/CS/process improvement.
- Actual target role: `production_quality`
- Likely trigger: generic phrase `service quality metrics` includes `quality`, and role inference currently checks production/quality before operations.
- Impact: UI still shows `transferable`, not direct, so it is not a scoring failure. But target role label may look surprising to users.

### Long JD check

- Case: `real-010-long-jd-pm-saas`
- Result: ready, primary `transferable`, direct 24, transferable 36, unrelated 24.
- No over-direct issue found. Long keyword-heavy JD did not make all experiences direct.

## 8. 과소 추론/skipped 사례

### Expected skipped

- Case: `real-008-ambiguous-jd`
- Actual: skipped `target_not_inferred`
- This is acceptable and safer than showing a weakly inferred box.

### Korean-only skipped

- None in this batch.
- Still needs broader Korean-only samples without English acronyms or common borrowed terms.

## 9. UI/copy 오해 가능성

Observed through static UI and output review:

- Box title uses `Career Core v0 참고 신호`, which keeps it below the main rejection summary.
- Required caution copy says it is a supplementary classification and not a rejection-cause conclusion.
- The box is rendered only for `status === "ready"`; skipped/missing does not render.

Potential misunderstanding:

- Month buckets like `48개월`, `60개월`, `18개월` can look exact, especially for short-tenure or gap cases.
- The existing `경험 항목 기준 합산` copy helps, but users may still read month values as exact relevant-career duration.
- `target role` and `target industry` are shown as inferred identifiers; when inference is surprising, the box may feel more authoritative than intended.

## 10. 모바일/레이아웃 확인 여부

- Browser screenshot QA was not performed in this batch.
- Static layout check:
  - Existing UI wiring test verifies the box is present only for ready signals and uses `sm:grid-cols-5`.
  - Month bucket grid uses `grid-cols-2` on narrow width and `sm:grid-cols-5` above small breakpoint.
  - No fixed-width text block was added in this QA batch.

Reason screenshot was not performed:

- The task explicitly allowed deterministic/component/static QA as fallback.
- This batch forbids feature/UI copy changes and focuses on ready/skipped behavior and interpretation risk.

## 11. 발견된 문제

1. REVIEW: operations/CS/process JD can infer `production_quality` when `quality` appears in a generic service-quality phrase.
2. REVIEW: short-tenure marketing case shows `18개월` as a precise bucket; month values may look more exact than the v0 signal intends.

No FAIL issues found.

## 12. 수정하지 않은 이유

- This is a QA batch.
- App.jsx, UI, copy, target inference, scoring, API, DB, env, deployment changes are explicitly forbidden.
- The observed issues are interpretation/inference risks, not runtime failures.

## 13. 다음 단계 추천

1. Add a separate target-inference calibration batch for operations vs production-quality precedence.
2. Add copy/product review for whether month buckets need a softer label or tooltip in a future UI batch.
3. Expand Korean-only QA with JD samples that do not include English acronyms like `B2B SaaS`, `GMP`, `PM`, or `CRM`.
4. Run Playwright desktop/mobile screenshots in a UI QA batch if visual hierarchy needs formal evidence.
