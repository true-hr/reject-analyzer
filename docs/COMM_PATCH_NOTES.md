# Communication Patch Notes

## 0) 제출 목적
- Evidence Fit v1 실제 코드 검수 가능 산출물 제출
- 설명 요약이 아니라 **실제 코드 원문/발췌** 중심으로 기록

## 1) src/lib/decision/evidence/evaluateEvidenceFit.js (파일 전체 원문)
`js
function normalizeText(v) {
  return String(v == null ? "" : v)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, candidates) {
  const t = normalizeText(text);
  if (!t) return false;
  const arr = Array.isArray(candidates) ? candidates : [];
  for (const c of arr) {
    const q = normalizeText(c);
    if (!q) continue;
    if (t.includes(q)) return true;
  }
  return false;
}

const TOOL_ALIASES = {
  "power bi": ["power bi", "powerbi", "pbi"],
  excel: ["excel", "?묒?", "microsoft excel"],
  sql: ["sql", "mysql", "mssql", "postgresql"],
  sap: ["sap", "sap erp", "erp"],
};

const TASK_ALIASES = {
  "?꾨왂 ?섎┰": ["?꾨왂 ?섎┰", "?ъ뾽 ?꾨왂", "以묒옣湲??꾨왂", "?꾨왂湲고쉷", "湲고쉷"],
  "?곗씠??遺꾩꽍": ["?곗씠??遺꾩꽍", "吏??遺꾩꽍", "?깃낵 遺꾩꽍", "由ы룷??, "遺꾩꽍"],
  "?꾨줈?앺듃 愿由?: ["?꾨줈?앺듃 愿由?, "pm", "?쇱젙 愿由?, "怨쇱젣 ?댁쁺"],
  "?댁쁺 媛쒖꽑": ["?댁쁺 媛쒖꽑", "?꾨줈?몄뒪 媛쒖꽑", "?⑥쑉??, "?댁쁺 怨좊룄??],
};

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function toItemText(item) {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";
  return String(item.text || item.label || item.title || item.name || "").trim();
}

function aliasCandidatesForItem(itemText, aliasMap) {
  const out = [itemText];
  const itemNorm = normalizeText(itemText);
  const map = aliasMap && typeof aliasMap === "object" ? aliasMap : {};

  for (const [key, aliases] of Object.entries(map)) {
    const group = [key].concat(Array.isArray(aliases) ? aliases : []);
    const normalized = group.map(normalizeText).filter(Boolean);
    const related = normalized.some(
      (token) => itemNorm.includes(token) || token.includes(itemNorm)
    );
    if (related) out.push(...group);
  }

  return Array.from(new Set(out.map((x) => String(x || "").trim()).filter(Boolean)));
}

function evaluateSection(items, resumeText, aliasMap) {
  const raw = safeArray(items);
  const section = {
    total: raw.length,
    matched: 0,
    missing: [],
    matchedItems: [],
  };

  for (const item of raw) {
    const itemText = toItemText(item);
    if (!itemText) continue;
    const candidates = aliasCandidatesForItem(itemText, aliasMap);
    const matched = includesAny(resumeText, candidates);
    if (matched) {
      section.matched += 1;
      section.matchedItems.push(itemText);
    } else {
      section.missing.push(itemText);
    }
  }

  return section;
}

function scoreByMatched(matched, total) {
  if (!total) return 100;
  return Math.round((Number(matched || 0) / Number(total || 1)) * 100);
}

function levelFromScore(overallScore) {
  if (overallScore >= 80) return "strong";
  if (overallScore >= 65) return "good";
  if (overallScore >= 50) return "mixed";
  if (overallScore >= 35) return "weak";
  return "none";
}

function penaltyFromScore(overallScore) {
  if (overallScore >= 80) return 0;
  if (overallScore >= 65) return 6;
  if (overallScore >= 50) return 12;
  if (overallScore >= 35) return 20;
  return 30;
}

function summaryByLevel(level) {
  if (level === "strong") return "JD ?듭떖 ?붽뎄議곌굔怨??대젰??洹쇨굅媛 ?꾨컲?곸쑝濡???留욎뒿?덈떎.";
  if (level === "good") return "JD ?붽뎄議곌굔? ?泥대줈 留욎?留??쇰? ?듭떖 洹쇨굅媛 ?쏀빀?덈떎.";
  if (level === "mixed") return "JD ?듭떖 ?붽뎄?ы빆 以??뺤씤?섎뒗 洹쇨굅? 遺議깊븳 洹쇨굅媛 ?쇱옱?⑸땲??";
  if (level === "weak") return "JD ?듭떖 ?붽뎄?ы빆 ?鍮?洹쇨굅媛 遺議깊븳 ??ぉ???곸? ?딆뒿?덈떎.";
  return "JD?먯꽌 ?붽뎄???듭떖 議곌굔 ?鍮??대젰??洹쇨굅媛 ?꾨컲?곸쑝濡?遺議깊빀?덈떎.";
}

function createBaseResult() {
  return {
    overallScore: 0,
    level: "none",
    penalty: 0,

    mustHave: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    preferred: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    tools: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    coreTasks: {
      total: 0,
      matched: 0,
      missing: [],
      matchedItems: [],
    },

    scoreBreakdown: {
      mustHaveScore: 100,
      preferredScore: 100,
      toolScore: 100,
      coreTaskScore: 100,
    },

    signals: [],
    summary: "",
  };
}

export function evaluateEvidenceFit({ jdText = "", resumeText = "", jdModel = null, ai = null } = {}) {
  void jdText;
  void ai;

  const result = createBaseResult();
  const normalizedResume = normalizeText(resumeText);

  if (!normalizedResume) {
    result.overallScore = 100;
    result.penalty = 0;
    result.level = "none";
    result.summary = "?대젰??蹂몃Ц???놁뼱 利앷굅 ?곹빀???됯????쒗븳?곸쑝濡쒕쭔 諛섏쁺?⑸땲??";
    return result;
  }

  const model = jdModel && typeof jdModel === "object" ? jdModel : {};
  const mustHaveItems = safeArray(model.mustHave);
  const preferredItems = safeArray(model.preferred);
  const toolItems = safeArray(model.tools);
  const coreTaskItems = safeArray(model.coreTasks);

  const totalTargets =
    mustHaveItems.length + preferredItems.length + toolItems.length + coreTaskItems.length;

  if (totalTargets === 0) {
    result.overallScore = 100;
    result.penalty = 0;
    result.level = "none";
    result.summary =
      "JD?먯꽌 援ъ“??媛?ν븳 ?붽뎄議곌굔??異⑸텇??異붿텧?섏? ?딆븘 利앷굅 ?곹빀???됯????쒗븳?곸쑝濡쒕쭔 諛섏쁺?⑸땲??";
    return result;
  }

  const COMMON_ALIASES = { ...TOOL_ALIASES, ...TASK_ALIASES };

  result.mustHave = evaluateSection(mustHaveItems, normalizedResume, COMMON_ALIASES);
  result.preferred = evaluateSection(preferredItems, normalizedResume, COMMON_ALIASES);
  result.tools = evaluateSection(toolItems, normalizedResume, TOOL_ALIASES);
  result.coreTasks = evaluateSection(coreTaskItems, normalizedResume, TASK_ALIASES);

  const mustHaveScore = scoreByMatched(result.mustHave.matched, result.mustHave.total);
  const preferredScore = scoreByMatched(result.preferred.matched, result.preferred.total);
  const toolScore = scoreByMatched(result.tools.matched, result.tools.total);
  const coreTaskScore = scoreByMatched(result.coreTasks.matched, result.coreTasks.total);

  result.scoreBreakdown = {
    mustHaveScore,
    preferredScore,
    toolScore,
    coreTaskScore,
  };

  result.overallScore = Math.round(
    mustHaveScore * 0.45 +
      coreTaskScore * 0.3 +
      toolScore * 0.15 +
      preferredScore * 0.1
  );
  result.level = levelFromScore(result.overallScore);
  result.penalty = penaltyFromScore(result.overallScore);

  if (result.mustHave.total >= 2 && result.mustHave.matched === 0) {
    result.signals.push("ROLE_SKILL__MUST_HAVE_MISSING");
  }
  if (result.tools.total >= 2 && result.tools.matched === 0) {
    result.signals.push("ROLE_SKILL__TOOL_GAP");
  }

  const allMissing = []
    .concat(result.mustHave.missing, result.tools.missing, result.coreTasks.missing, result.preferred.missing)
    .filter(Boolean);
  const topMissing = Array.from(new Set(allMissing)).slice(0, 2);
  const baseSummary = summaryByLevel(result.level);
  result.summary =
    topMissing.length > 0
      ? `${baseSummary} ?뱁엳 ${topMissing.join(", ")} 寃쏀뿕 洹쇨굅媛 ?쏀빀?덈떎.`
      : baseSummary;

  return result;
}

`

## 2) src/lib/analyzer.js (요청 3개 발췌)

### 2-1) import 추가 부분
`js
import { computeHiddenRisk } from "./hiddenRisk.js";
import { buildSimulationViewModel } from "./simulation/buildSimulationViewModel.js";
import { detectStructuralPatterns } from "./decision/structuralPatterns.js";
import { buildDecisionPack } from "./decision/index.js";
import { buildLeadershipGapSignals } from "./signals/leadershipGapSignals.js";
import { evaluateLeadershipRisk } from "./decision/leadership/leadershipRiskEvaluator.js";
import { evaluateEducationRequirement } from "./decision/education/educationRequirementEvaluator.js";
import { evaluateEvidenceFit } from "./decision/evidence/evaluateEvidenceFit.js";
import { deriveActionCandidates, selectTopActions } from "./recommendations/actionCatalog.js";
import { buildHrViewModel } from "./hrviewModel.js";
const JD_REC_V1__LIMIT = 12;
const JD_REC_V1__MINLEN = 6;

function JD_REC_V1__safeStr(x) {
`

### 2-2) analyze() 내부 evidenceFit 계산 부분
`js
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals });
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
  const hypotheses = buildHypotheses(state, ai);
  let report = buildReport(state, ai);

  // buildStructureAnalysis({
  //   resumeText: state?.resume || "",
  //   jdText: state?.jd || "",
  //   detectedIndustry: ...,
  //   detectedRole: ...,
  //   detectedCompanySizeCandidate: (... state?.companySizeCandidate ?? "" ).toString(),
  //   detectedCompanySizeTarget: (... state?.companySizeTarget ?? "" ).toString(),
  //
  //   // ✅ append-only: KSCO hints
  //   roleKscoMajor: state?.roleKscoMajor,
  //   roleKscoOfficeSub: state?.roleKscoOfficeSub,
  // });


  // ✅ 신규(append-only): 검증 가능한 구조 패턴 감지(텍스트 기반 + 일부 타임라인 기반)
  // - 결과는 최종 return에 포함시키기 쉬우라고 별도 pack으로 보관
  // - IMPORTANT: detectStructuralPatterns는 "한 번만" 계산하고, decisionPack에도 동일 결과를 사용
  const structural = detectStructuralPatterns({
    state,
`

### 2-3) analyze() return / __LAST_PACK__ append 부분
`js
  // [PATCH] debug snapshot for console inspection (append-only)
  // (원하면 유지) 디버그
  // console.log("decisionPack:", decisionPack);
  // [PATCH] debug snapshot for console inspection (append-only)
  try {
    if (typeof window !== "undefined") {
      window.__LAST_PACK__ = {
        decisionPack,
        evidenceFit,
        reportPack,
        decisionPressure,
        educationRequirement: (() => {
          try {
            return evaluateEducationRequirement({
              state,
              objective: { jdText: state?.jd ?? null },
            });
          } catch {
            return { requirementType: "none", minimumDegree: null, evidence: null };
          }
        })(),
        leadershipRisk: (() => {
          try {
            return evaluateLeadershipRisk({
              state,
              objective: {
                targetRole: state?.career?.targetRole ?? null,
                companyScaleCurrent: state?.career?.companyScaleCurrent ?? null,
                companyScaleTarget: state?.career?.companyScaleTarget ?? null,
              },
            });
          } catch {
            return { riskLevel: "none", type: null, scaleDirection: "similar" };
          }
        })(),
        // TMP_DEBUG: remove after confirm
        riskLayer: __riskLayerForUI,
        docRisk: riskLayer?.documentRisk || null,
        interviewRisk: riskLayer?.interviewRisk || null,
      };
    }
  } catch { }
  // ✅ 최종 출력(단일 return로 정리: 이후 코드가 죽지 않게)
  // ------------------------------
  // [PATCH] expose last analysis pack for UI/debug (append-only)
  // - 브라우저 콘솔에서 window.__LAST_PACK__로 확인 가능
  // - Worker/SSR 환경에서는 안전하게 무시
  // ------------------------------
  try {
    const __g = typeof globalThis !== "undefined" ? globalThis : null;
    if (__g) {
      __g.__LAST_PACK__ = {
        ts: Date.now(),
        objective,
        reportPack,
        decisionPack,
        evidenceFit,
        decisionPressure,
        educationRequirement: (() => {
          try {
            return evaluateEducationRequirement({
              state,
              objective: { jdText: state?.jd ?? null },
            });
          } catch {
            return { requirementType: "none", minimumDegree: null, evidence: null };
          }
        })(),
        leadershipRisk: (() => {
          try {
            return evaluateLeadershipRisk({
              state,
              objective: {
                targetRole: state?.career?.targetRole ?? null,
                companyScaleCurrent: state?.career?.companyScaleCurrent ?? null,
                companyScaleTarget: state?.career?.companyScaleTarget ?? null,
              },
            });
          } catch {
            return { riskLevel: "none", type: null, scaleDirection: "similar" };
          }
        })(),
        riskLayer: __riskLayerForUI,
        hireability,
        hiddenRisk,
        structural,
        structuralPatterns: structuralPatternsPack,
      };
    }
`

`js
        decisionPack.hiddenRisk = hiddenRisk || null;
      }
    }
  } catch { }

  return {
    objective,
    hypotheses,
    report: reportText, // ✅ 텍스트 리포트는 문자열로 고정
    reportPack, // ✅ 객체들은 여기로

    keywordSignals,
    careerSignals,
    resumeSignals,
    majorSignals,

    structureAnalysis: structurePack.structureAnalysis,
    structureSummaryForAI: structurePack.structureSummaryForAI,

    hireability,
    riskLayer: __riskLayerForUI,
    decisionPressure,
    hiddenRisk,
    evidenceFit,

    // ✅ 요청 핵심: decisionPack 포함
    decisionPack,
    __dp_dbg: {
      hasFn: typeof buildDecisionPack,
      dpType: decisionPack === null ? "null" : typeof decisionPack,
      error: __dp_error || null,

    },
    // ✅ 구조/패턴 포함
    structural,
    structuralPatterns: structuralPatternsPack,

    // ✅ education requirement signal (append-only)
    educationRequirement: (() => {
      try {
        return evaluateEducationRequirement({
          state,
          objective: {
            jdText: state?.jd ?? null,
          },
        });
      } catch {
        return { requirementType: "none", minimumDegree: null, evidence: null };
      }
    })(),

    // ✅ leadership scope mismatch signal (append-only)
    leadershipRisk: (() => {
      try {
        return evaluateLeadershipRisk({
          state,
          objective: {
            targetRole: state?.career?.targetRole ?? null,
            companyScaleCurrent: state?.career?.companyScaleCurrent ?? null,
            companyScaleTarget: state?.career?.companyScaleTarget ?? null,
          },
        });
      } catch { return { riskLevel: "none", type: null, scaleDirection: "similar" }; }
    })(),
  };
}

`

## 3) src/lib/decision/index.js (요청 부분 발췌)

### 3-1) buildDecisionPack 시그니처 변경 부분
`js


  return out;
}

// 湲곗〈 ?⑥닔 PATCHED (append-only)
export function buildDecisionPack({ state, ai, structural, hiddenRisk = null, careerSignals = null, evidenceFit = null } = {}) {
  // 1) structural pressure
  const structuralFlags = structural?.flags || [];
  const structuralPressure = computeStructuralDecisionPressure(structuralFlags);

  // 2) domain-specific risk profiles (?꾩옱???뚯씪/紐⑤뱢 ?곌껐???놁쑝誘濡?null 怨좎젙)
  const timeline = null;
  const educationGate = null;
  const overqualified = null;
  const domainShift = null;

  // 3) riskProfiles ?쒖뒪???ㅽ뻾
  let riskResults = [];
  try {
    riskResults = evalRiskProfiles({ state, ai, structural });
  } catch {
    riskResults = [];
  }
  // [PATCH] normalize gates & ids (append-only)


  riskResults = __normalizeRiskResults(riskResults);

  // ✅ PATCH: robust mode + ctx + never-empty (append-only, crash-safe)
  // - buildDecisionPack 스코프에서 mode/ctx가 undefined로 터지는 문제 방지
  // - state가 비어 riskResults가 0개인 경우에도 안내 카드 1장 제공
  const __modeLocal = String(
`

### 3-2) evidencePenalty 추출 부분
`js
  // gateBoost/merged 적용 여부 확인
  const merged = mergeDecisionPressures(
    [structuralPressure, gateBoost, timeline, educationGate, overqualified, domainShift].filter(Boolean),
    { topN: 12 }
  );
  const __evidenceFit =
    (evidenceFit && typeof evidenceFit === "object" ? evidenceFit : null) ||
    (state?.analysis?.evidenceFit && typeof state.analysis.evidenceFit === "object" ? state.analysis.evidenceFit : null) ||
    (state?.evidenceFit && typeof state.evidenceFit === "object" ? state.evidenceFit : null) ||
    null;
  const evidencePenalty = Number(__evidenceFit?.penalty || 0);
  const __evidencePenaltySafe = Number.isFinite(evidencePenalty) ? Math.max(0, evidencePenalty) : 0;
  // ------------------------------
  // [PATCH][P0] gate -> score cap (append-only)
  // - 목적: Gate를 "리스크 설명"이 아니라 "점수 상한"으로 분리
  // - AI 추가 없음: 기존에 주입된 ai.semanticMatches.matchRate(0~1)를 기반 점수로 사용
  // - 기존 merged/pressure/riskResults 로직은 건드리지 않음
  // ------------------------------
  const __num01 = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    if (n <= 1) return Math.max(0, Math.min(1, n));
    return Math.max(0, Math.min(1, n / 100));
  };

  // base fit proxy: semantic matchRate (0~1)
  // ✅ PATCH (append-only): also consider state.analysis.ai as matchRate source
  const __aiFromState =
    (state && state.analysis && state.analysis.ai && typeof state.analysis.ai === "object")
      ? state.analysis.ai
      : (ctx && ctx.state && ctx.state.analysis && ctx.state.analysis.ai && typeof ctx.state.analysis.ai === "object")
`

### 3-3) __rawScoreAfterEvidencePenalty 계산 + 최종 점수 반영 + decisionScore.meta append
`js

    if (typeof total === "number") {
      // 경험상 total이 0~8 사이로 흔함 → 88~40 정도로 퍼지게
      const n = 88 - (total * 6);
      return Math.round(Math.max(0, Math.min(100, n)));
    }

    // 3) 최후 fallback (하지만 이제 웬만하면 여기 안 옴)
    return 55;
  })();
  const __rawScoreAfterEvidencePenalty = Math.max(
    0,
    Math.min(100, __rawScore - __evidencePenaltySafe)
  );

  const __cappedScore =
    typeof __capFinal === "number"
      ? Math.min(__rawScoreAfterEvidencePenalty, Math.max(0, Math.min(100, __capFinal)))
      : __rawScoreAfterEvidencePenalty;

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

  // ✅ append-only: Layer2(Must) — MUST__TOOL__MISSING_1 (missing==1 & no gate)
  try {
    const __probe =
      (__toolMustProbe && typeof __toolMustProbe === "object" ? __toolMustProbe : null) ||
      (() => { try { return globalThis.__PASSMAP_TOOL_MUST_PROBE__ || null; } catch { return null; } })();
`

## 4) 정확한 삽입/교체 위치 (파일 경로 / 함수명 / 앵커)
- src/lib/decision/evidence/evaluateEvidenceFit.js
  - 함수: evaluateEvidenceFit
  - 앵커: export function evaluateEvidenceFit({ jdText = "", resumeText = "", jdModel = null, ai = null } = {})
- src/lib/analyzer.js
  - 함수: nalyze
  - 앵커1(import): import { evaluateEvidenceFit } from "./decision/evidence/evaluateEvidenceFit.js";
  - 앵커2(계산): const evidenceFit = evaluateEvidenceFit({
  - 앵커3(append): window.__LAST_PACK__ = { / __g.__LAST_PACK__ = { / eturn { ... evidenceFit ... }
- src/lib/decision/index.js
  - 함수: uildDecisionPack
  - 앵커1(시그니처): export function buildDecisionPack({ state, ai, structural, hiddenRisk = null, careerSignals = null, evidenceFit = null } = {})
  - 앵커2(추출): const evidencePenalty = Number(__evidenceFit?.penalty || 0);
  - 앵커3(반영): const __rawScoreAfterEvidencePenalty = Math.max(
  - 앵커4(최종 반영): const __cappedScore = 에서 __rawScoreAfterEvidencePenalty 사용
  - 앵커5(meta): evidencePenalty, evidenceFitLevel, evidenceFitOverallScore

## 5) 기존 유지 / 추가 사항
- 유지한 것
  - gate/cap 구조 재설계 없음 (기존 cap 흐름 유지)
  - App.jsx 미수정
  - report UI 미수정
  - analyzer 대공사 없음
- 추가한 것
  - Evidence Fit helper 신규 추가
  - analyzer에서 evidenceFit 계산 + 분석팩/리턴 append
  - decision 점수 흐름에 evidencePenalty soft 반영
