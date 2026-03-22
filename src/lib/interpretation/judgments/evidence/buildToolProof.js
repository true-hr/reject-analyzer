import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";
import {
  classifyEvidenceStrength,
  detectBareKeywordOnly,
  detectToolNameOnlyEvidence,
  detectVendorContamination,
  hasDirectTaskSignal,
  hasOutputSignal,
} from "./evidenceLadder.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.jdCompetitiveness.drivers (JD 도구 요구 불일치)
// 2순위: top3WithInterpretation — tool 관련 canonical risk
// ※ 단순 키워드 나열 ≠ 도구 사용 증빙
// ※ vendor/제품/회사 맥락 ≠ 실무자 도구 사용 증빙
// READY: 도구 + 사용 맥락(목적·산출물) 조합 확인
// PARTIAL: 도구명 존재하지만 맥락 증빙 shallow
// False-positive guard: bare keyword list → READY 차단; vendor/company 맥락 → 실무 도구 증빙 오인 차단

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

function __isGeneric(value) {
  const text = __text(value).toLowerCase();
  if (!text) return true;
  return /추가 확인|판단이 필요|가능성이 있습니다/.test(text);
}

function __isVendorContext(text) {
  return /(vendor|saas|솔루션 영업|tool sales|시스템 구축 영업|hr tool|구매 시스템 판매|erp 판매|saas 유통|솔루션 컨설팅|솔루션 판매|si 영업|소프트웨어 판매|제품 영업|it 영업|솔루션 도입 영업)/.test(text.toLowerCase());
}

function __isToolDriver(driver) {
  const combined = (__text(driver?.type) + " " + __text(driver?.text)).toLowerCase();
  return /(tool|stack|system|software|platform|기술 스택|도구|시스템|플랫폼|솔루션)/.test(combined)
    && !__isVendorContext(combined);
}

// Wave 1c: count targetToolSignals with at least one tool-specific token matching in evidence texts
// Only tokens that themselves match the tool-term pattern are used for matching —
// generic Korean connectors ("데이터", "시스템" as filler) do not inflate the count
const __TOOL_TOKEN_RE = /(tool|stack|crm|sql|tableau|excel|jira|salesforce|hubspot|erp|bi\b|etl|gcp|aws|api|도구|툴|플랫폼)/i;
function __toolSignalMatchCount(signals, evidenceTexts) {
  if (!signals.length || !evidenceTexts.length) return 0;
  const combined = evidenceTexts
    .map((t) => __text(t).toLowerCase())
    .join(" ");
  return signals.filter((s) => {
    const tokens = __text(s).toLowerCase().split(/\s+/).filter(
      (tok) => tok.length >= 3 && __TOOL_TOKEN_RE.test(tok)
    );
    return tokens.length > 0 && tokens.some((tok) => combined.includes(tok));
  }).length;
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

export function buildToolProof({ vm = null, top3WithInterpretation = [] } = {}) {
  const jdComp = vm?.interpretationV2?.jdCompetitiveness || null;
  const drivers = __arr(jdComp?.drivers).map((d) => ({
    type: __text(d?.type || d?.kind),
    text: __firstLine(d?.text || d),
  })).filter((d) => d.text);

  const toolDriver = drivers.find((d) => __isToolDriver(d)) || null;

  const toolRisk = __arr(top3WithInterpretation).find((risk) => {
    const haystack = [
      risk?.id,
      risk?.canonicalCard?.sourceKey,
      risk?.canonicalCard?.headline,
      risk?.canonicalCard?.summary,
    ].map((v) => __text(v).toLowerCase()).join(" ");
    return /(tool|stack|system|platform|기술 스택|도구|시스템|플랫폼)/.test(haystack)
      && !__isVendorContext(haystack);
  }) || null;

  const hasJdToolSignal = Boolean(toolDriver);
  const hasToolRisk = Boolean(toolRisk);

  // Wave 1c: read ontology tool signals and family distance (supporting evidence only)
  const targetToolSignals = __arr(vm?.candidateAxisPack?.narrativeContext?.targetToolSignals);
  const familyDistance = __text(vm?.candidateAxisPack?.jobAxis?.familyDistance) || "unclear_family";

  // Phase 4 sub-round C: 3순위 fallback — job ontology role-family structural path
  const roleSummary = __text(vm?.candidateAxisPack?.narrativeContext?.roleSummary);
  if (!hasJdToolSignal && !hasToolRisk && __isGeneric(roleSummary)) {
    return {
      key: JUDGMENT_TYPES.TOOL_PROOF,
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

  const rawWhy = __firstLine(
    toolDriver?.text ||
    toolRisk?.canonicalCard?.summary ||
    ""
  );
  const why = __isGeneric(rawWhy) ? null : rawWhy;

  const rawContext = __firstLine(
    toolRisk?.canonicalCard?.supportingEvidence || toolDriver?.text || ""
  );
  const context = !__isGeneric(rawContext) ? rawContext
    : !__isGeneric(roleSummary) ? roleSummary
    : null;

  // false-positive guard: contextual proof 없으면 PARTIAL만
  const hasContextualProof = Boolean(why) || Boolean(context);

  let judgmentStatus = hasJdToolSignal && hasContextualProof
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  let confidence = hasJdToolSignal && hasToolRisk && hasContextualProof ? "medium" : "low";
  const evidenceStrength = classifyEvidenceStrength({
    hasDirectTaskEvidence: hasDirectTaskSignal(rawWhy, rawContext),
    hasOutputEvidence: hasOutputSignal(rawContext),
    hasResultEvidence: hasOutputSignal(rawWhy),
    hasMeaningfulSupportEvidence: hasJdToolSignal || hasToolRisk,
    hasContextEvidence: hasContextualProof,
    vendorContamination: detectVendorContamination(rawWhy, rawContext, roleSummary),
    bareKeywordOnly: detectBareKeywordOnly(rawWhy, rawContext),
    toolNameOnly: detectToolNameOnlyEvidence(rawWhy, rawContext, roleSummary),
  });
  if (evidenceStrength === "weak" || evidenceStrength === "noise") {
    judgmentStatus = JUDGMENT_STATUS.PARTIAL;
  }

  // Rule A: same-family + tool signal overlap + both direct evidence present → floor confidence at "medium"
  // Requires hasJdToolSignal AND hasToolRisk — ontology signals alone cannot generate "medium"
  const toolSignalMatchCount = __toolSignalMatchCount(
    targetToolSignals,
    [toolDriver?.text, toolRisk?.canonicalCard?.summary, toolRisk?.canonicalCard?.supportingEvidence]
  );
  const isSameFamily = familyDistance === "same_family";
  if (isSameFamily && toolSignalMatchCount >= 2 && hasJdToolSignal && hasToolRisk) {
    if (confidence === "low") confidence = "medium";
  }

  const sourceFamily = hasJdToolSignal ? "jd_competitiveness"
    : hasToolRisk ? "evidence_fit_meta"
    : !__isGeneric(roleSummary) ? "candidate_axis_pack"
    : "fallback";

  const proofFor = [
    toolRisk ? __firstLine(toolRisk.resumeEvidence?.[0]) : "",
    context || "",
  ].filter((v) => v && !__isGeneric(v)).slice(0, 2);

  const proofMissing = [
    hasJdToolSignal && !hasContextualProof
      ? "JD 요구 도구의 실제 사용 목적·산출물·운영 맥락 기술 필요"
      : "",
    hasJdToolSignal && !hasToolRisk
      ? "이력서 내 해당 도구 직접 사용 장면·결과 기술 필요"
      : "",
    // Rule B: ontology expects tools but no direct evidence at all — normalized proofMissing only
    targetToolSignals.length > 0 && !hasJdToolSignal && !hasToolRisk
      ? "직무군 핵심 도구의 직접 운영·활용 경험을 이력서에 기술 필요"
      : "",
  ].filter(Boolean).slice(0, 2);

  return {
    key: JUDGMENT_TYPES.TOOL_PROOF,
    status: judgmentStatus,
    confidence,
    sourceFamily: __normalizeSourceFamily(sourceFamily),
    evidenceStrength,
    why: __normalizeNullableText(why),
    context: __normalizeNullableText(context),
    proofFor: __normalizeStringArray(proofFor),
    proofMissing: __normalizeStringArray(proofMissing),
    actionHint: "도구 이름 옆에 사용 목적·산출물·활용 맥락을 1줄 이상 추가합니다.",
  };
}
