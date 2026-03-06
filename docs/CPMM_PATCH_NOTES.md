# CPMM Patch Notes

## 1) src/lib/analyzer.js

### evidenceFit 계산 부분
```js
const evidenceFit = evaluateEvidenceFit({
  jdText: state?.jd || state?.jdText || "",
  resumeText: state?.resume || state?.resumeText || "",
  jdModel:
    objective?.jdModel ||
    ai?.jdModel ||
    state?.__parsedJD ||
    state?.parsedJD ||
    null,
  ai,
});
```

### buildDecisionPack 호출부 (evidenceFit 전달 확인)
```js
decisionPack = buildDecisionPack({
  state,
  ai: __ai_for_decision,
  structural,
  evidenceFit,
  // (하위호환) 기존 경로 + (디버그 보험) __DBG_ACTIVE__
  careerSignals: __cs_for_decision,
});
```

---

## 2) src/lib/decision/index.js

### buildDecisionPack 시그니처
```js
export function buildDecisionPack({
  state,
  ai,
  structural,
  hiddenRisk = null,
  careerSignals = null,
  evidenceFit = null,
} = {}) {
```

### evidencePenalty 계산
```js
const __evidenceFit =
  (evidenceFit && typeof evidenceFit === "object" ? evidenceFit : null) ||
  (state?.analysis?.evidenceFit && typeof state.analysis.evidenceFit === "object" ? state.analysis.evidenceFit : null) ||
  (state?.evidenceFit && typeof state.evidenceFit === "object" ? state.evidenceFit : null) ||
  null;
const evidencePenalty = Number(__evidenceFit?.penalty || 0);
const __evidencePenaltySafe = Number.isFinite(evidencePenalty) ? Math.max(0, evidencePenalty) : 0;
```

### __rawScoreAfterEvidencePenalty 계산
```js
const __rawScoreAfterEvidencePenalty = Math.max(
  0,
  Math.min(100, __rawScore - __evidencePenaltySafe)
);
```

### __cappedScore 계산 (최종 반영 연결)
```js
const __cappedScore =
  typeof __capFinal === "number"
    ? Math.min(__rawScoreAfterEvidencePenalty, Math.max(0, Math.min(100, __capFinal)))
    : __rawScoreAfterEvidencePenalty;
```

### final score 반영 + decisionScore.meta append
```js
const decisionScore = {
  raw: __rawScore,
  capped: __cappedScore,
  cap: (typeof __capFinal === "number") ? __capFinal : null,
  capReason:
    (typeof __capFinal === "number")
      ? `gate_cap:${__capFinal} (maxGateP:${__maxGateP}, gateId:${__maxGateId || "unknown"})`
      : "",
  meta: {
    matchRate01: (typeof __match01 === "number") ? __match01 : null,
    gateCount: __gateArr.length,
    maxGateP: __maxGateP,
    maxGateId: __maxGateId || null,
    evidencePenalty: __evidencePenaltySafe,
    evidenceFitLevel: __evidenceFit?.level || null,
    evidenceFitOverallScore: Number.isFinite(Number(__evidenceFit?.overallScore))
      ? Number(__evidenceFit?.overallScore)
      : null,
    grayZone: __grayZoneMeta,
    toolMustProbe: (() => { try { return globalThis.__PASSMAP_TOOL_MUST_PROBE__ || null; } catch { return null; } })(),
  },
};
```

---

## 3) src/lib/decision/evidence/evaluateEvidenceFit.js

### TASK_ALIASES (깨진 한글 문자열 수정본)
```js
const TASK_ALIASES = {
  "전략 수립": ["전략 수립", "사업 전략", "중장기 전략", "전략기획", "기획"],
  "데이터 분석": ["데이터 분석", "지표 분석", "성과 분석", "리포팅", "분석"],
  "프로젝트 관리": ["프로젝트 관리", "pm", "일정 관리", "과제 운영"],
  "운영 개선": ["운영 개선", "프로세스 개선", "효율화", "운영 고도화"],
};
```

### summary 문자열 (깨진 한글 문자열 수정본)
```js
function summaryByLevel(level) {
  if (level === "strong") return "JD 핵심 요구조건과 이력서 근거가 전반적으로 잘 맞습니다.";
  if (level === "good") return "JD 요구조건은 대체로 맞지만 일부 핵심 근거가 약합니다.";
  if (level === "mixed") return "JD 핵심 요구사항 중 확인되는 근거와 부족한 근거가 혼재합니다.";
  if (level === "weak") return "JD 핵심 요구사항 대비 근거가 부족한 항목이 적지 않습니다.";
  return "JD에서 요구한 핵심 조건 대비 이력서 근거가 전반적으로 부족합니다.";
}
```

---

## 4) 정확한 삽입/교체 위치 (앵커)
- `src/lib/analyzer.js` / `analyze`
  - `const evidenceFit = evaluateEvidenceFit({` (계산)
  - `decisionPack = buildDecisionPack({ ... evidenceFit, ... })` (전달)
- `src/lib/decision/index.js` / `buildDecisionPack`
  - `const evidencePenalty = Number(__evidenceFit?.penalty || 0);`
  - `const __rawScoreAfterEvidencePenalty = Math.max(`
  - `const __cappedScore =` (여기서 `__rawScoreAfterEvidencePenalty` 사용)
  - `decisionScore.meta` 내 `evidencePenalty / evidenceFitLevel / evidenceFitOverallScore`
- `src/lib/decision/evidence/evaluateEvidenceFit.js`
  - `const TASK_ALIASES = { ... }`
  - `function summaryByLevel(level) { ... }`

## 5) 유지/추가
- 유지
  - gate/cap 구조 미변경
  - App.jsx / report UI 미수정
  - analyzer 대공사 없음
- 추가
  - Evidence Fit helper + analyzer 전달 + decision soft penalty 연결
