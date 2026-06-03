# Rejection Career Core UI Anchor Investigation

## 1. 조사 목적

PR #712에서 추가된 `buildRejectionCareerCoreSignal`을 서류탈락 원인분석 결과 화면에 붙일 수 있는 안전한 UI/data-flow anchor를 확인했다.

이번 조사는 구현보다 anchor 확인을 우선했다. `App.jsx`, API, DB/schema/env/deployment 설정은 변경하지 않았고, Career Core signal을 rejection risk score/reasons/evidence/recommendation 흐름에 섞지 않았다.

## 2. 확인한 파일/컴포넌트

- `src/components/input/PreciseAnalysisFlow.jsx`
  - 서류탈락 원인분석 입력/로딩/결과 UI owner.
  - `mode === "result"` 분기에서 결과 화면을 렌더링한다.
  - props: `mode`, `state`, `setState`, `analysis`, `isAnalyzing`, `onAnalyze`, `onBack`, `onGoHome`, `onReset`, `onPrimaryCta`, `onSecondaryCta`, `onOpenShare`, `onRetryAiDeepAnalysis`, `shareAnchorRef`.
- `src/App.jsx`
  - 서류탈락 분석 실행과 `analysis.preciseAnalysis` 구성 owner.
  - 조사만 수행했고 수정하지 않았다.
- `src/lib/preciseAnalysis/buildRejectionCareerCoreSignal.js`
  - PR #712의 read-only bridge.
  - `resumeProfile` 또는 `profile`, `jdText`, `fit`, `targetRole`, `targetCompany`, `targetIndustry`, `currentDate`를 입력으로 받는다.
  - ResumeProfile이 없으면 `status: "skipped"`, `reason: "missing_resume_profile"`을 반환한다.
- `scripts/test-rejection-career-core-bridge.js`
  - bridge가 read-only signal이며 risk/scoring 필드를 만들지 않는지 검증한다.
- `docs/rejection-analysis-career-core-readonly-20260603.md`
  - PR #712의 bridge QA 문서.

## 3. rejection analysis data flow 요약

1. `PreciseAnalysisFlow.jsx` input mode에서 `state.jd`, `state.resume` 입력을 받는다.
2. `handleAnalyzeClick`이 `onAnalyze`를 호출한다.
3. `App.jsx`의 분석 실행부가 `buildJdResumeFit`, precise risk builders, `buildCompositeRisk`를 실행한다.
4. 결과는 `analysis.preciseAnalysis.compositeRisk`에 저장된다.
5. `PreciseAnalysisFlow.jsx` result mode는 `analysis.preciseAnalysis.compositeRisk`를 `compositeData`로 읽고 상단 summary, top risks, supporting risks, report sections, AI deep analysis box를 렌더링한다.

기존 결과 화면의 주요 local anchor:

- `PreciseAnalysisFlow.jsx`의 `mode === "result"` 분기.
- `compositeData` 산출 직후 또는 `CardContent` 내부의 summary box 다음.
- 이 위치는 기존 risk builder와 scoring 계산 이후의 read-only render layer라서 Career Core signal을 risk scoring에 섞지 않는 조건을 지키기 쉽다.

## 4. ResumeProfile/JD 접근 가능 여부

- JD text: 가능.
  - `PreciseAnalysisFlow.jsx` result mode에서 `state?.jd`에 접근한다.
  - 공유 결과 경로도 `PreciseAnalysisFlow`에 `state={__sharePreciseAnalysis?.state || null}` 형태로 전달된다.
- resume text: 가능.
  - `PreciseAnalysisFlow.jsx` result mode에서 `state?.resume`에 접근한다.
- parsed resume: 조건부 가능.
  - `App.jsx` 분석 시점에 `__stateForAnalyze.__parsedResume`를 붙이는 흐름이 있다.
  - 결과 저장 payload에도 `state: __stateForAnalyze`가 포함되므로 result component에서 `state.__parsedResume`를 볼 수 있는 경로가 있다.
  - 다만 모든 입력/공유/저장 복원 경로에서 `state.__parsedResume` 존재가 보장되는지는 이번 조사만으로 확정하지 않았다.
- ResumeProfile object: 현재 결과 컴포넌트 prop으로는 직접 전달되지 않는다.
  - `buildRejectionCareerCoreSignal`은 raw resume text만으로는 ready signal을 만들 수 없다.
  - `state.__parsedResume`가 있을 때 component-local에서 `buildResumeProfileFromParsedResume`를 호출하는 방식은 가능 후보지만, UI component에 profile 변환 책임이 추가된다.

## 5. 기존 preciseAnalysis result 구조

`analysis.preciseAnalysis`는 결과 UI에서 다음 구조로 소비된다.

- `compositeRisk`
  - `summary`
  - `topRisks`
  - `supporting.lowRisks`
  - `supporting.insufficientData`
- `error`
- `aiDeepAnalysis`
- `aiMeta`
- `resumeCareerInterpretation`
- `jdRequirementDecomposition`
- `roleFitCareerMatch`

PR #712의 `buildRejectionCareerCoreSignal` 결과는 현재 이 구조에 연결되어 있지 않다.

## 6. App.jsx/API 없이 붙일 수 있는지

조건부로 가능하다.

가능한 최소 방식:

- `PreciseAnalysisFlow.jsx`에서 `state.__parsedResume`가 object인지 확인한다.
- `buildResumeProfileFromParsedResume`로 component-local ResumeProfile을 만든다.
- `buildRejectionCareerCoreSignal`에 `resumeProfile`, `jdText: state?.jd`, `fit: window.__JD_RESUME_FIT__` 또는 `analysis` 내 fit 후보, target taxonomy 값을 넘긴다.
- `signal.status === "ready"`일 때만 작은 read-only box를 렌더링한다.
- `status === "skipped"`이면 아무 것도 렌더링하지 않는다.

하지만 이번 배치에서는 구현하지 않았다.

사유:

- 결과 컴포넌트가 ResumeProfile 객체를 prop으로 받지 않는다.
- `state.__parsedResume`는 존재 가능성이 있지만 모든 결과 진입 경로에서 보장되는 public contract로 보기는 어렵다.
- `window.__JD_RESUME_FIT__` fallback은 debug/global 성격이라 UI anchor의 primary data source로 삼기에는 약하다.
- App.jsx 수정 금지 조건 때문에 `analysis.preciseAnalysis.careerCoreSignal` 같은 안정적인 data-flow slot을 생성할 수 없다.

## 7. 권장 anchor

권장 UI anchor:

- 파일: `src/components/input/PreciseAnalysisFlow.jsx`
- 위치: `mode === "result"` 분기 내부, `CardContent`의 기존 `summary` box 바로 아래
- 렌더 조건: `careerCoreSignal?.status === "ready"`
- UI 위계: 기존 rejection summary/top risk보다 낮은 보조 box
- 표시명: `Career Core v0 참고 신호`
- caution copy: `직무/산업 신호 기준의 보조 분류이며, 탈락 원인 확정이 아닌 참고용 해석입니다.`

권장 data-flow anchor:

- 최선: 추후 별도 구현 배치에서 `App.jsx` 분석 결과 생성부가 `analysis.preciseAnalysis.careerCoreSignal`을 read-only slot으로 채우고, `PreciseAnalysisFlow.jsx`는 렌더만 담당한다.
- App.jsx 수정 금지가 유지되는 경우: `PreciseAnalysisFlow.jsx`에서 `state.__parsedResume`가 있을 때만 local 계산하고, 없으면 조용히 미표시한다.

## 8. 구현 여부

구현하지 않았다.

이번 결과는 조사 문서만 추가했다. anchor는 `PreciseAnalysisFlow.jsx` result mode로 좁혀졌지만, 안정적인 ResumeProfile data-flow가 public prop/analysis slot으로 보장되지 않아 UI box 구현은 다음 배치로 넘기는 편이 안전하다.

## 9. 구현하지 않은 사유

- `buildRejectionCareerCoreSignal`의 ready path는 ResumeProfile 객체가 필요하다.
- 결과 UI가 직접 받는 안정 props에는 `state`, `analysis`만 있고 ResumeProfile prop은 없다.
- `state.__parsedResume` 기반 local 변환은 가능 후보지만, 저장/공유/복원 경로에서 누락될 수 있다.
- App.jsx/API 수정 금지 조건에서는 signal을 분석 생성 단계에 안정적으로 저장할 수 없다.
- 이번 작업의 1차 목표가 anchor 조사이므로, 불확실한 UI 구현을 피했다.

## 10. 남은 리스크

- 공유 결과 화면에서 `state.__parsedResume`가 항상 유지되는지 추가 확인이 필요하다.
- `buildResumeProfileFromParsedResume`를 UI component에서 호출할 경우 렌더 비용과 책임 경계가 증가한다.
- `buildCareerCoreTargetFromJdFit`는 target inference가 conservative하므로 Korean-only JD에서는 skip될 수 있다.
- month bucket은 Career Core v0의 experience duration sum 기준이며, unique de-overlapped months가 아니다.
- UI copy는 반드시 rejection cause, pass probability, eligibility처럼 읽히지 않게 유지해야 한다.

## 11. 다음 단계 추천

1. 별도 구현 배치에서 `analysis.preciseAnalysis.careerCoreSignal` read-only slot 추가 여부를 결정한다.
2. App.jsx 수정이 허용되면 분석 생성부에서 ResumeProfile/JD/fit이 동시에 있는 시점에 signal을 계산하고 결과 UI는 렌더만 하도록 한다.
3. App.jsx 수정이 계속 금지되면 `PreciseAnalysisFlow.jsx` local 계산 방식으로 구현하되, `state.__parsedResume`가 없을 때 미표시하는 테스트를 추가한다.
4. UI 구현 시 `scripts/test-rejection-career-core-ui-anchor.js` 또는 Vite/Playwright harness로 skipped/ready 렌더 조건을 검증한다.
