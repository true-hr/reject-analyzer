# Rejection Career Core Mobile Screenshot QA

## 1. QA 목적

PR #724에서 완화한 `Career Core v0 참고 신호` box의 helper copy가 desktop/mobile 화면에서 레이아웃을 깨지 않는지 확인했다.

이번 작업은 QA 전용이다. App.jsx, UI component, copy, API, DB, env, rejection scoring, target inference는 수정하지 않았다.

## 2. 검증 환경

- Branch: `qa/rejection-career-core-mobile-screenshot-20260603`
- Base: `origin/main` at PR #724 merge commit
- OS: Windows
- Browser: local Chrome headless
- Harness: Vite synthetic result-mode mount for `PreciseAnalysisFlow.jsx`
- Dependency setup: fresh worktree에서 `npm ci --legacy-peer-deps` 실행
- No AI/API calls.
- No production deploy.

## 3. QA 방법

- `scripts/qa-rejection-career-core-mobile-screenshot.js`에서 Vite harness를 생성했다.
- `PreciseAnalysisFlow`를 `mode="result"`로 마운트하고 synthetic `analysis.preciseAnalysis.careerCoreSignal`을 주입했다.
- ready, skipped, long target label 시나리오를 query string으로 전환했다.
- Chrome headless CLI로 DOM dump와 screenshot을 생성했다.
- DOM 기준으로 다음을 확인했다.
  - ready 상태에서 `Career Core v0 참고 신호` 렌더
  - helper copy 렌더
  - `18개월` month bucket 값 유지
  - skipped 상태에서 Career Core box 미렌더
  - desktop/mobile horizontal overflow 없음

## 4. 스크린샷 경로

- Desktop ready: `screenshots/rejection-career-core-desktop-ready.png`
- Mobile ready: `screenshots/rejection-career-core-mobile-ready.png`
- Mobile skipped/missing: `screenshots/rejection-career-core-mobile-skipped.png`

## 5. 케이스별 결과

| case | viewport | result | notes |
| --- | --- | --- | --- |
| Desktop ready | 1366x1000 | PASS | Career Core box is visibly secondary to the summary card. Long target role/industry labels truncate without breaking the card. Bucket grid stays in one row. |
| Mobile ready | 390x1100 | PASS | Helper copy wraps across lines but remains readable. Bucket grid wraps to 2 columns, with the last bucket on its own row. No horizontal overflow was measured. |
| Mobile skipped/missing | 390x900 | PASS | Career Core box is not rendered. Rejection result flow continues with the summary and following content. |
| 긴 target label | desktop ready scenario | PASS | Long role/industry labels are truncated inside target cards; no overflow or layout break was observed. |

## 6. 발견된 문제

- FAIL issue: none.
- REVIEW issue: none for the Career Core box itself.

Observation:

- On mobile, the helper copy makes the box taller, but it does not dominate the page more than the existing rejection summary.
- The synthetic page's top action button can appear partially at the right edge in the screenshot crop, but DOM overflow metric stayed at or below 0 and the Career Core box itself did not overflow.

## 7. 수정하지 않은 이유

- This is a QA batch.
- The observed layout is acceptable under the PASS criteria.
- UI/copy/App.jsx/API/scoring/inference changes were explicitly forbidden.

## 8. 모바일/데스크톱 위계 판단

- Desktop: PASS. Career Core box is below the main summary card and uses the same low-emphasis slate card style.
- Mobile: PASS. The box is longer after the helper copy, but still reads as a supporting reference section. Month buckets remain compact in a two-column grid.
- Skipped/missing: PASS. The box is absent, so the result flow is unchanged.

## 9. 테스트 결과

- `node scripts/test-career-core-timeline.js` PASS
- `node scripts/test-career-core-signals.js` PASS
- `node scripts/test-career-core-fit.js` PASS
- `node scripts/qa-career-core-fit-real-cases.js` PASS
- `node scripts/test-resume-jd-career-core-bridge.js` PASS
- `node scripts/test-rejection-career-core-bridge.js` PASS
- `node scripts/test-rejection-career-core-ui-wiring.js` PASS
- `node scripts/qa-rejection-career-core-realistic-samples.js` PASS
- `node scripts/test-career-core-target-inference-calibration.js` PASS
- `node scripts/qa-rejection-career-core-mobile-screenshot.js` PASS
- `npm run build` PASS

Build note:

- `npm run build` completed with existing Vite warnings about JSON import attributes, dynamic imports, and large chunks.

## 10. 다음 단계 추천

1. If the helper copy still feels visually long in real production data, evaluate a collapsed details or tooltip treatment in a separate UI batch.
2. If product wants stronger softening, review whether month values should render as `약 N개월` in a future copy batch.
3. Re-run screenshot QA after any future change to `PreciseAnalysisFlow.jsx` result card spacing.
