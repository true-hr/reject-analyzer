# Rejection Career Core UI Wiring

## 1. 목적

PR #712의 `buildRejectionCareerCoreSignal`을 서류탈락 원인분석 결과 화면에 read-only 보조 신호로 표시했다.

이번 변경은 PR #714에서 확인한 anchor를 따른다. Career Core v0 signal은 rejection cause, risk score, recommendation, eligibility 판단에 사용하지 않는다.

## 2. data-flow 변경 요약

- `src/App.jsx` 분석 생성부에서 JD, merged resume text, parsed resume, JD fit이 있는 시점에 `buildRejectionCareerCoreSignal`을 호출한다.
- parsed resume가 있으면 기존 `buildResumeProfileFromParsedResume`로 ResumeProfile을 만든다.
- parsed resume가 없거나 target을 추정하지 못하면 bridge가 `status: "skipped"`를 반환한다.
- 결과 payload에는 `analysis.preciseAnalysis.careerCoreSignal` read-only slot만 추가했다.

## 3. UI 변경 요약

- `src/components/input/PreciseAnalysisFlow.jsx` result mode의 기존 summary box 바로 아래에 작은 read-only box를 추가했다.
- 렌더 조건은 `analysis.preciseAnalysis.careerCoreSignal.status === "ready"`뿐이다.
- skipped 또는 slot이 없는 기존/공유/복원 결과에서는 아무 것도 렌더링하지 않는다.
- 표시 항목:
  - primary fit level
  - target role/industry 추정값
  - 직접 유관 / 인접 / 전환 가능 / 비유관 / 판단 보류 month buckets
  - `경험 항목 기준 합산`
- caution copy:
  - `직무/산업 신호 기준의 보조 분류이며, 탈락 원인 확정이 아닌 참고용 해석입니다.`

## 4. App.jsx 수정 범위

- import 1개 추가: `buildRejectionCareerCoreSignal`.
- 분석 callback local 변수 1개 추가: `__rejectionCareerCoreSignal`.
- precise analysis build 이후, existing `window.__JD_RESUME_FIT__`와 parsed resume snapshot을 사용해 read-only signal을 생성.
- `preciseAnalysis` object에 `careerCoreSignal` slot 추가.

금지한 변경은 하지 않았다.

- API 호출 없음
- AI 호출 없음
- 분석 순서 대규모 변경 없음
- state shape 전체 개편 없음
- existing `compositeRisk`, `aiDeepAnalysis`, `aiMeta`, `resumeCareerInterpretation`, `jdRequirementDecomposition`, `roleFitCareerMatch` 동작 변경 없음

## 5. 기존 rejection scoring 보존 여부

보존했다.

`careerCoreSignal`은 `compositeRisk`와 분리된 sibling slot이다. 기존 risk builders, `buildCompositeRisk`, risk reasons, evidence, recommendation 흐름에 입력되지 않는다.

## 6. QA 케이스별 결과

| Case | Expected | Result |
| --- | --- | --- |
| Career Core signal ready인 결과 | 보조 box 렌더 | PASS |
| `careerCoreSignal.status === "skipped"`인 결과 | 미렌더 | PASS |
| `careerCoreSignal` 자체가 없는 기존/공유/복원 결과 | 미렌더 | PASS |
| PM/SaaS JD + 운영/기획 이력 | ready, transferable/adjacent 계열 | PASS |
| PM/SaaS JD + 바이오 생산품질 이력 | ready, direct 0 | PASS |
| Bio/GMP quality JD + 바이오 생산품질 이력 | ready, direct 중심 | PASS |
| 애매한 JD | skipped `target_not_inferred` | PASS |
| profile 없음 | skipped `missing_resume_profile` | PASS |
| 모바일 폭 | box grid가 `grid-cols-2`에서 `sm:grid-cols-5`로 확장, fixed overflow 요소 없음 | PASS by static UI check |

## 7. 테스트 결과

Required checks:

- `node scripts/test-career-core-timeline.js` PASS
- `node scripts/test-career-core-signals.js` PASS
- `node scripts/test-career-core-fit.js` PASS
- `node scripts/qa-career-core-fit-real-cases.js` PASS
- `node scripts/test-rejection-career-core-bridge.js` PASS
- `node scripts/test-rejection-career-core-ui-wiring.js` PASS
- `npm run build` PASS

Build environment note:

- Fresh worktree에는 `node_modules`가 없어 최초 `npm run build` 전 dependency install이 필요했다.
- plain `npm ci`는 기존 React 19 / `@react-pdf/renderer@3.4.5` peer dependency conflict로 실패할 수 있어, 이전 QA와 동일하게 `npm ci --legacy-peer-deps`가 필요하다.

## 8. guardrails

- No API changes
- No DB/schema changes
- No env/deployment changes
- No AI calls
- No rejection risk scoring changes
- App.jsx change limited to read-only `analysis.preciseAnalysis.careerCoreSignal` slot
- No unrelated dirty files included

## 9. 남은 한계

- parsed resume가 없는 결과에서는 signal이 skipped되고 UI는 표시되지 않는다.
- target inference는 Career Core v0 adapter 기준이라 conservative하다.
- month bucket은 experience duration sum 기준이며 unique de-overlapped months가 아니다.
- 이번 batch는 static UI wiring 검증을 포함했지만, logged-in browser/manual E2E는 수행하지 않았다.

## 10. 다음 단계 추천

1. 실제 사용자 샘플에서 ready/skipped 비율을 QA한다.
2. Korean-only JD target inference 품질은 shared adapter 쪽에서 별도 개선한다.
3. UI copy는 계속 read-only reference tone을 유지하고, rejection cause나 scoring 문맥으로 확장하지 않는다.
