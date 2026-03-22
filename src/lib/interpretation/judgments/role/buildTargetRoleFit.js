import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";
import {
  classifyEvidenceStrength,
  detectAdjacentOnlyEvidence,
  detectBareKeywordOnly,
  detectOntologyOnlyEvidence,
  detectTitleOnlyEvidence,
  detectVendorContamination,
  hasDirectTaskSignal,
  hasOutputSignal,
  hasOwnershipSignal,
} from "../evidence/evidenceLadder.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.jdCompetitiveness.drivers (canonical JD 경쟁성 분석 결과)
// 2순위: top3WithInterpretation의 canonicalCard (canonical risk 증빙)
// ※ interactionPack은 jdCompetitiveness로 이미 canonicalize된 상태로만 반영됨
// ※ parsedResume / parsedJD는 canonicalCard.supportingEvidence를 통해 간접 참조
// ※ 원문 텍스트는 증빙이며 target 정의 owner가 아님
// READY: jdComp driver 존재 AND canonical risk 연결 확인
// PARTIAL: driver 또는 risk 중 하나만 존재

function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function __firstLine(value) {
  return __text(value)
    .split(/\n+/)
    .map((line) => __text(line))
    .find(Boolean) || "";
}

function __dedup(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = __text(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function __normalizeNullableText(value) {
  const text = __text(value);
  return text || null;
}

function __normalizeStringArray(value) {
  return __arr(value).map((item) => __text(item)).filter(Boolean);
}

function __normalizeSourceFamily(value) {
  const text = __text(value);
  return text && text !== "fallback" && text !== "unavailable" ? text : null;
}

function __isGeneric(value) {
  const text = __text(value).toLowerCase();
  if (!text) return true;
  return /추가 확인|판단이 필요|읽힐 수 있습니다|가능성이 있습니다|리스크가 커질/.test(text);
}

// Wave 1b: count how many targetFamilySignals appear in the given evidence texts
// Returns match count — used as supporting signal only, never as sole truth
function __familySignalMatchCount(signals, evidenceTexts) {
  if (!signals.length || !evidenceTexts.length) return 0;
  const combined = evidenceTexts
    .map((t) => __text(t).toLowerCase())
    .join(" ");
  return signals.filter((s) => {
    const term = __text(s).toLowerCase();
    return term.length >= 3 && combined.includes(term);
  }).length;
}

function __family(risk) {
  const haystack = [
    risk?.id,
    risk?.canonicalCard?.sourceKey,
    risk?.canonicalCard?.headline,
    risk?.canonicalCard?.summary,
  ].map((value) => __text(value).toLowerCase()).join(" ");
  // 우선순위: must_have_gap > directness_context > years_seniority
  // vendor/SaaS/솔루션 영업 맥락은 실무자 직접성으로 분류하지 않음 (false-positive guard)
  const isVendorContext = /(vendor|saas|hr tool|hr system|procurement solution|scm solution|solution sales|system sales|솔루션 영업|구축 영업|시스템 구축 영업|소프트웨어 판매|tool sales|구매 시스템 판매)/.test(haystack);
  if (/must_have|필수 역량|required skill/.test(haystack)) return "must_have_gap";
  if (!isVendorContext && /role_skill|직무 직접|semantic|직접 수행|도메인 직접/.test(haystack)) return "directness_context";
  if (/year|seniority|연차|시니어|경력 기간/.test(haystack)) return "years_seniority";
  return "unknown";
}

export function buildTargetRoleFit({ vm = null, top3WithInterpretation = [] } = {}) {
  const jdComp = vm?.interpretationV2?.jdCompetitiveness || null;
  const drivers = __arr(jdComp?.drivers).map((driver) => ({
    type: __text(driver?.type || driver?.kind),
    text: __firstLine(driver?.text || driver),
  })).filter((item) => item.text);
  const conflict = drivers.find((item) => item.type === "conflict") || null;
  const direct = drivers.find((item) => item.type === "directConnection") || null;
  const domain = drivers.find((item) => item.type === "domainDirectness") || null;
  const concreteRisk = __arr(top3WithInterpretation).find((risk) => {
    const family = __family(risk);
    return family === "must_have_gap" || family === "directness_context" || family === "years_seniority";
  }) || null;

  const rawWhy = __firstLine(conflict?.text || direct?.text || concreteRisk?.canonicalCard?.summary);
  const rawContext = __firstLine(domain?.text || direct?.text || concreteRisk?.canonicalCard?.supportingEvidence);
  const why = __isGeneric(rawWhy) ? "" : rawWhy;
  // Phase 4 sub-round B: 3순위 fallback — job ontology role-family structural path
  const roleSummary = __text(vm?.candidateAxisPack?.narrativeContext?.roleSummary);
  const context = !__isGeneric(rawContext) ? rawContext
    : !__isGeneric(roleSummary) ? roleSummary
    : "";

  if (!why && !context) {
    return {
      key: JUDGMENT_TYPES.TARGET_ROLE_FIT,
      status: JUDGMENT_STATUS.UNAVAILABLE,
      semanticStatus: null,
      confidence: null,
      sourceFamily: null,
      why: null,
      context: null,
      proofFor: [],
      proofMissing: [],
      actionHint: null,
    };
  }

  const hasConflict = Boolean(conflict?.text);
  const hasDirect = Boolean(direct?.text || domain?.text);
  const hasRisk = Boolean(concreteRisk);

  // READY: driver 존재 AND canonical risk 연결 확인
  // PARTIAL: driver 또는 risk 중 하나만 존재
  const status = (hasConflict || hasDirect) && hasRisk
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  // confidence: 3-tier — conflict + direct + risk 모두 → high; 둘 중 하나 조합 → medium; 단일 → low
  let confidence = (hasConflict && hasDirect && hasRisk) ? "high"
    : (hasConflict || (hasDirect && hasRisk)) ? "medium"
    : "low";

  // Wave 1b: ontology-aware family signal layer
  // targetFamilySignals + familyDistance are supporting evidence only — cannot replace JD/risk.
  const targetFamilySignals = __arr(vm?.candidateAxisPack?.narrativeContext?.targetFamilySignals);
  const familyDistance = __text(vm?.candidateAxisPack?.jobAxis?.familyDistance) || "unclear_family";
  const boundaryHintClassification = __arr(vm?.candidateAxisPack?.jobAxis?.boundaryHintClassification);

  const familyMatchCount = __familySignalMatchCount(targetFamilySignals, [rawWhy, rawContext, roleSummary]);
  const isSameFamily = familyDistance === "same_family";
  const isAdjacentFamily = familyDistance === "adjacent_family" || familyDistance === "bridgeable_family";
  const evidenceStrength = classifyEvidenceStrength({
    hasDirectTaskEvidence: hasDirectTaskSignal(rawWhy, rawContext),
    hasOwnershipEvidence: hasOwnershipSignal(rawWhy, rawContext),
    hasOutputEvidence: hasOutputSignal(rawContext),
    hasResultEvidence: hasOutputSignal(rawWhy),
    hasMeaningfulSupportEvidence: hasConflict || hasDirect || hasRisk,
    hasContextEvidence: Boolean(why || context),
    vendorContamination: detectVendorContamination(rawWhy, rawContext, roleSummary),
    bareKeywordOnly: detectBareKeywordOnly(rawWhy, rawContext, roleSummary),
    adjacentOnly: detectAdjacentOnlyEvidence({
      familyDistance,
      hasDirectTaskEvidence: hasDirectTaskSignal(rawWhy, rawContext),
      texts: [rawWhy, rawContext, roleSummary],
    }),
    titleOnly: detectTitleOnlyEvidence(rawWhy, rawContext, roleSummary),
    ontologyOnly: detectOntologyOnlyEvidence({
      familyMatchCount,
      sameFamilyPrior: isSameFamily,
      hasDirectEvidence: hasConflict || hasDirect || hasRisk,
      texts: [roleSummary],
    }),
  });

  // Rule A: same-family + signal match + existing supporting evidence → floor confidence at "medium"
  // >= 2 threshold: prevents single short-token (CRM/SQL/3-char) accidental matches from firing alone
  if (isSameFamily && familyMatchCount >= 2 && (hasConflict || (hasDirect && hasRisk))) {
    if (confidence === "low") confidence = "medium";
  }

  // Rule D: family-only match without primary JD/risk evidence → cap confidence at "low"
  // (Rule C absorbed: distant-family produces no familyMatchCount uplift here regardless)
  if (!hasConflict && !hasDirect && !hasRisk && familyMatchCount > 0) {
    confidence = "low";
  }

  // Rule E: adjacent-family + boundary hints → tag sourceFamily as bridge (wording only, no status change)
  const hasBridgeHint = isAdjacentFamily && boundaryHintClassification.length > 0;

  // Phase 3/4 bridge: declared-role prior and semantic status enrichment
  // __hasDeclaredSameFamilyPrior: user's current role is in same family as declared target → protected prior
  const __hasDeclaredSameFamilyPrior = isSameFamily;
  const __hasCoreJdEvidence = (hasConflict || hasDirect) && hasRisk;
  const __hasPartialJdEvidence = hasConflict || hasDirect || hasRisk;
  // P1-P5: semantic status — declared prior shapes interpretation trajectory
  const __semanticStatus = __hasDeclaredSameFamilyPrior
    ? (__hasCoreJdEvidence && evidenceStrength === "strong" ? "confirmed"
      : (__hasPartialJdEvidence && (evidenceStrength === "strong" || evidenceStrength === "medium")) ? "likely"
      : "weak_evidence")                          // P2: declared prior but core evidence thin
    : isAdjacentFamily
    ? (__hasCoreJdEvidence && evidenceStrength !== "noise" ? "disputed" : "weak_evidence")  // P5: adjacent = weak competing only
    : (__hasCoreJdEvidence && evidenceStrength !== "noise" ? "overridden" : "weak_evidence"); // P3/P4: cross-family needs positive proof
  // Why enrichment: declared-prior-aware explanation sentence
  const __declaredPriorWhy =
    __semanticStatus === "confirmed" ? "사용자 선택 직무 계열과 일치하는 근거가 확인됩니다." :
    __semanticStatus === "likely" ? "사용자 선택 직무 계열이며, 관련 행동 신호가 일부 확인됩니다." :
    (__semanticStatus === "weak_evidence" && __hasDeclaredSameFamilyPrior) ? "사용자 선택 직무 계열이지만 핵심 증거는 아직 제한적입니다." :
    isAdjacentFamily ? "선택 직무와 인접 계열이며, 서로 다른 직무 신호가 함께 보입니다." :
    "사용자 선택 직무와 달리 실제 서술은 다른 직무 축 증거가 더 강합니다.";
  const __enrichedWhy = why || __declaredPriorWhy;
  // ActionHint enrichment: semantic-status-aware next step
  const __semanticActionHint =
    __semanticStatus === "weak_evidence" ? "목표 직무의 핵심 산출물과 직접 연결되는 경험을 1개 이상 추가합니다." :
    __semanticStatus === "disputed" ? "경쟁하는 직무 신호 중 목표 직무 쪽을 더 명확히 드러내는 사례를 보강합니다." :
    __semanticStatus === "overridden" ? "입력한 목표 직무 계열과 더 가까운 수행 경험을 이력서에서 더 드러낼 필요가 있습니다." :
    "JD 핵심 요구 장면과 직접 대응되는 실제 수행 경험 1개를 구체적으로 준비합니다.";

  const proofFor = __dedup([
    __firstLine(concreteRisk?.resumeEvidence?.[0]),
    __firstLine(concreteRisk?.canonicalCard?.supportingEvidence),
    !__isGeneric(roleSummary) ? roleSummary : "",
  ]).slice(0, 2);

  const proofMissing = __dedup([
    __firstLine(concreteRisk?.jdEvidence?.[0]),
    hasConflict && !__isGeneric(conflict.text) ? conflict.text : "",
  ]).slice(0, 2);

  // Phase 3/4: extend proofMissing with declared-prior missing hint
  const __declaredProofMissing = (__semanticStatus === "weak_evidence" || __semanticStatus === "disputed")
    ? "목표 직무 핵심 수행 경험 및 산출물 근거 보강 필요" : null;
  const proofMissingFinal = __declaredProofMissing
    ? __dedup([...proofMissing, __declaredProofMissing]).slice(0, 2)
    : proofMissing;

  // dominant evidence owner — bridge hint can qualify adjacent reads in sourceFamily tag
  const sourceFamily = hasConflict || (hasDirect && hasRisk) ? "jd_competitiveness"
    : hasRisk ? "top3_canonical"
    : hasBridgeHint ? "candidate_axis_pack_bridge"
    : !__isGeneric(roleSummary) ? "candidate_axis_pack"
    : "fallback";

  return {
    key: JUDGMENT_TYPES.TARGET_ROLE_FIT,
    status,
    semanticStatus: __semanticStatus,
    confidence,
    sourceFamily: __normalizeSourceFamily(sourceFamily),
    evidenceStrength,
    why: __normalizeNullableText(__enrichedWhy),
    context: __normalizeNullableText(context),
    proofFor: __normalizeStringArray(proofFor),
    proofMissing: __normalizeStringArray(proofMissingFinal),
    actionHint: __normalizeNullableText(__semanticActionHint),
  };
}
