import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";
import {
  classifyEvidenceStrength,
  detectBareKeywordOnly,
  detectSupportWording,
  detectTitleOnlyEvidence,
  detectVendorContamination,
  hasDirectTaskSignal,
  hasOutputSignal,
  hasOwnershipSignal,
} from "./evidenceLadder.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.evidenceDepth.buckets.ownership
// 2순위: vm.interpretationV2.evidenceDepth.buckets.scope / action
// 3순위: vm.interpretationV2.evidenceDepth.narrative
// READY: ownership 확인 + scope 또는 action 병행 + upstream status strong/moderate
// PARTIAL: ownership 힌트 있지만 shallow / 단독
// UNAVAILABLE: task listing 수준만 (ownership = 0)
// False-positive guard: tool usage 단독, 참여/지원 wording → ownership 과잉 해석 차단

function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Wave 1d: count targetOwnershipSignals with ownership-specific token matching in evidence texts
// Token-level — only tokens that match the ownership-term pattern are used for matching
const __OWNERSHIP_TOKEN_RE = /(주도|책임|결정|의사결정|ownership|소유|리드|lead|decision)/i;
function __ownershipSignalMatchCount(signals, evidenceTexts) {
  if (!signals.length || !evidenceTexts.length) return 0;
  const combined = evidenceTexts
    .map((t) => __text(t).toLowerCase())
    .join(" ");
  return signals.filter((s) => {
    const tokens = __text(s).toLowerCase().split(/\s+/).filter(
      (tok) => tok.length >= 2 && __OWNERSHIP_TOKEN_RE.test(tok)
    );
    return tokens.length > 0 && tokens.some((tok) => combined.includes(tok));
  }).length;
}

function __isGeneric(value) {
  const text = __text(value).toLowerCase();
  if (!text) return true;
  if (/추가 확인|판단이 필요/.test(text)) return true;
  // support-wording guard: 지원/보조/참여/담당이 주된 패턴이고 ownership anchor가 없는 경우만 suppression
  if (/(지원|보조|참여|담당)/.test(text) && !/(주도|책임|결정|리드|소유|운영|설계|기획|구축|직접|완결)/.test(text)) return true;
  return false;
}

function __normalizeNullableText(value) {
  const text = __text(value);
  return text || null;
}

function __normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => __text(item)).filter(Boolean);
}

function __normalizeSourceFamily(value) {
  const text = __text(value);
  return text && text !== "fallback" && text !== "unavailable" ? text : null;
}

export function buildOwnershipDepth({ vm = null } = {}) {
  const evidenceDepth = vm?.interpretationV2?.evidenceDepth || null;
  const depthStatus = __text(evidenceDepth?.status);
  const narrative = __text(evidenceDepth?.narrative);
  const buckets = evidenceDepth?.buckets || null;

  const ownershipCount = Number(buckets?.ownership) || 0;
  const scopeCount = Number(buckets?.scope) || 0;
  const actionCount = Number(buckets?.action) || 0;

  if (ownershipCount === 0 && scopeCount === 0) {
    return {
      key: JUDGMENT_TYPES.OWNERSHIP_DEPTH,
      status: JUDGMENT_STATUS.UNAVAILABLE,
      confidence: null,
      sourceFamily: null,
      why: null,
      context: null,
      proofFor: [],
      proofMissing: [],
      actionHint: null,
    };
  }

  // false-positive guard: ownership 단독이면 PARTIAL만
  const hasStrongEvidence = ownershipCount > 0 && (scopeCount > 0 || actionCount > 0);
  let judgmentStatus = hasStrongEvidence && (depthStatus === "strong" || depthStatus === "moderate")
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  let confidence = hasStrongEvidence && depthStatus === "strong" ? "medium" : "low";

  // Wave 1d: ontology-aware ownership signal layer
  // targetOwnershipSignals + familyDistance are supporting evidence only — cannot replace direct depth signals
  const targetOwnershipSignals = Array.isArray(vm?.candidateAxisPack?.narrativeContext?.targetOwnershipSignals)
    ? vm.candidateAxisPack.narrativeContext.targetOwnershipSignals.filter(Boolean)
    : [];
  const familyDistance = __text(vm?.candidateAxisPack?.jobAxis?.familyDistance) || "unclear_family";
  const boundaryHintClassification = Array.isArray(vm?.candidateAxisPack?.jobAxis?.boundaryHintClassification)
    ? vm.candidateAxisPack.jobAxis.boundaryHintClassification
    : [];

  const isSameFamily = familyDistance === "same_family";
  const hasOwnershipGapHint = boundaryHintClassification.includes("ownership_gap");
  const ownershipSignalMatchCount = __ownershipSignalMatchCount(
    targetOwnershipSignals,
    [narrative]  // evidenceDepth.narrative is the live ownership-depth text
  );

  // Rule A: same-family + ownership signal match + strong-adjacent evidence → allow "medium" for "moderate" depthStatus
  // Currently only depthStatus==="strong" gives "medium"; this extends to "moderate" in same-family confirmed context
  if (isSameFamily && ownershipSignalMatchCount >= 1 && hasStrongEvidence && depthStatus === "moderate") {
    confidence = "medium";
  }

  const why = !__isGeneric(narrative) ? narrative : null;
  const evidenceStrength = classifyEvidenceStrength({
    hasDirectTaskEvidence: hasDirectTaskSignal(narrative),
    hasOwnershipEvidence: ownershipCount > 0 || hasOwnershipSignal(narrative),
    hasOutputEvidence: scopeCount > 0,
    hasResultEvidence: actionCount > 0 || hasOutputSignal(narrative),
    hasMeaningfulSupportEvidence: ownershipCount > 0 || scopeCount > 0 || actionCount > 0,
    hasContextEvidence: Boolean(narrative),
    vendorContamination: detectVendorContamination(narrative),
    supportWording: detectSupportWording(narrative),
    bareKeywordOnly: detectBareKeywordOnly(narrative),
    titleOnly: detectTitleOnlyEvidence(narrative),
  });
  if (evidenceStrength === "weak" || evidenceStrength === "noise") {
    judgmentStatus = JUDGMENT_STATUS.PARTIAL;
  }
  const context = ownershipCount > 0
    ? `오너십 항목 ${ownershipCount}건 확인${scopeCount > 0 ? `, 범위 ${scopeCount}건` : ""}`
    : null;

  const proofFor = [
    ownershipCount > 0 ? `직접 소유·주도 근거 ${ownershipCount}건` : "",
    scopeCount > 0 ? `운영 범위·규모 기술 ${scopeCount}건` : "",
    actionCount > 0 ? `주도 행위 기술 ${actionCount}건` : "",
  ].filter(Boolean).slice(0, 3);

  // Rule B: ontology expects ownership scope — improve proofMissing specificity when direct evidence is weak
  const proofMissing = ownershipCount === 0
    ? ["직접 소유·책임 범위를 명시한 기술 필요 (범위·결과·의사결정 포함)"]
    : !hasStrongEvidence
    ? [
        targetOwnershipSignals.length > 0 || hasOwnershipGapHint
          ? "직무군 요구 오너십 수준의 직접 결정·완결 장면 기술 필요"
          : "직접 소유한 결과 지표 또는 의사결정 장면 기술 필요",
      ]
    : [];

  const sourceFamily = hasStrongEvidence ? "career_accumulation"
    : ownershipCount > 0 ? "evidence_fit_meta"
    : "fallback";

  return {
    key: JUDGMENT_TYPES.OWNERSHIP_DEPTH,
    status: judgmentStatus,
    confidence,
    sourceFamily: __normalizeSourceFamily(sourceFamily),
    evidenceStrength,
    why: __normalizeNullableText(why),
    context: __normalizeNullableText(context),
    proofFor: __normalizeStringArray(proofFor),
    proofMissing: __normalizeStringArray(proofMissing),
    actionHint: judgmentStatus === JUDGMENT_STATUS.READY
      ? "책임 범위와 의사결정 장면을 추가해 오너십 증빙을 강화합니다."
      : "과업 나열보다 어디까지 직접 결정하고 완결했는지를 중심으로 서술합니다.",
  };
}
