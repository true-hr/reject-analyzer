import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";
import {
  classifyEvidenceStrength,
  detectBareKeywordOnly,
  detectTitleOnlyEvidence,
  detectYearsOnly,
  hasDirectTaskSignal,
  hasOutputSignal,
  hasOwnershipSignal,
} from "../evidence/evidenceLadder.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.jdCompetitiveness.drivers (JD 레벨 기대 불일치)
// 2순위: top3WithInterpretation — years_seniority 패밀리 리스크
// 3순위: vm.interpretationV2.evidenceDepth.buckets.ownership / scope
// READY: JD 레벨 시그널 + seniority 리스크 조합 OR JD 시그널 + ownership/scope 조합
// PARTIAL: 단일 힌트만 존재

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
  return /추가 확인|판단이 필요|읽힐 수 있습니다|가능성이 있습니다/.test(text);
}

function __isLevelText(combined) {
  return /(seniority|senior|junior|level|band|연차|시니어|주니어|경력 연수|직급|포지션 수준)/.test(combined.toLowerCase());
}

// Wave 1e: targetLevelHints local helpers — coarse bucket normalization only
// Raw hint text must NEVER surface to UI output
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

function __normalizeLevelHints(hints) {
  const arr = Array.isArray(hints) ? hints.filter(Boolean) : [];
  if (!arr.length) return [];
  const buckets = new Set();
  for (const raw of arr) {
    const s = String(raw || "").toLowerCase();
    // Negative guard: boundary/support phrases — NOT candidate seniority proof
    if (/(c-level support|executive reporting|임원 지원|경영진 지원|보좌|비서|support\s+role)/.test(s)) continue;
    // Negative guard: bare title-only tokens without ownership context
    if (/^(manager|head|lead|팀장|리드)$/.test(s.trim())) continue;

    if (/(junior|주니어|초급|entry|신입|1-2년|1~2년)/.test(s))                  buckets.add("junior_like");
    if (/(mid|미드|중급|3-5년|3~5년|intermediate|담당)/.test(s))                 buckets.add("mid_like");
    if (/(senior|시니어|고급|5\+|7\+|experienced|숙련|senior-)/.test(s))        buckets.add("senior_like");
    if (/(lead|리드|파트장|chapter|principal|staff lead)/.test(s))              buckets.add("lead_like");
    if (/(strateg|전략|roadmap|vision|기획 총괄|cross-functional)/.test(s))     buckets.add("strategic_scope");
    if (/(execut|실행|deliverable|산출|implement|구현)/.test(s))                 buckets.add("execution_scope");
  }
  return [...buckets];
}

// Live contract: adjacent_family is a weaker step (wording/tag only, no uplift).
// Confidence uplift is same_family only — consistent with buildTargetRoleFit / buildToolProof / buildOwnershipDepth.
function __isNearFamily(familyDistance) {
  return familyDistance === "same_family";
}

// Returns true only when senior/lead/strategic hints exist AND no junior-only contradiction
function __levelHintsAlignWithOwnership(normalizedBuckets) {
  if (!normalizedBuckets.length) return false;
  const hasSeniorLead = normalizedBuckets.some(
    (b) => b === "senior_like" || b === "lead_like" || b === "strategic_scope"
  );
  const contradicted = normalizedBuckets.every(
    (b) => b === "junior_like" || b === "execution_scope"
  );
  return hasSeniorLead && !contradicted;
}

export function buildLevelPositionFit({ vm = null, top3WithInterpretation = [] } = {}) {
  const jdComp = vm?.interpretationV2?.jdCompetitiveness || null;
  const drivers = __arr(jdComp?.drivers).map((d) => ({
    type: __text(d?.type || d?.kind),
    text: __firstLine(d?.text || d),
  })).filter((d) => d.text);

  const levelDriver = drivers.find((d) => __isLevelText(d.type + " " + d.text)) || null;

  const evidenceDepth = vm?.interpretationV2?.evidenceDepth || null;
  const buckets = evidenceDepth?.buckets || null;
  const ownershipCount = Number(buckets?.ownership) || 0;
  const scopeCount = Number(buckets?.scope) || 0;

  const seniorityRisk = __arr(top3WithInterpretation).find((risk) => {
    const haystack = [
      risk?.id,
      risk?.canonicalCard?.sourceKey,
      risk?.canonicalCard?.headline,
      risk?.canonicalCard?.summary,
    ].map((v) => __text(v).toLowerCase()).join(" ");
    return /(year|seniority|연차|시니어|경력 기간|직급)/.test(haystack);
  }) || null;

  const hasJdLevelSignal = Boolean(levelDriver);
  const hasSeniorityRisk = Boolean(seniorityRisk);
  const hasOwnershipDepth = ownershipCount > 0 || scopeCount > 0;

  if (!hasJdLevelSignal && !hasSeniorityRisk && !hasOwnershipDepth) {
    return {
      key: JUDGMENT_TYPES.LEVEL_POSITION_FIT,
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
    levelDriver?.text ||
    seniorityRisk?.canonicalCard?.summary ||
    ""
  );
  const why = __isGeneric(rawWhy) ? null : rawWhy;

  const rawContext = __firstLine(seniorityRisk?.canonicalCard?.supportingEvidence || "");
  // Phase 4 sub-round C: 3순위 fallback — job ontology role-family structural path
  const roleSummary = __text(vm?.candidateAxisPack?.narrativeContext?.roleSummary);
  // Wave 1e: read targetLevelHints — normalize only, never surface raw text
  const rawTargetLevelHints = __arr(vm?.candidateAxisPack?.narrativeContext?.targetLevelHints);
  const normalizedLevelBuckets = __normalizeLevelHints(rawTargetLevelHints);
  const familyDistance = __text(vm?.candidateAxisPack?.narrativeContext?.familyDistance);

  const context = !__isGeneric(rawContext) ? rawContext
    : !__isGeneric(roleSummary) ? roleSummary
    : null;

  // Phase 3/4 weak linkage: role identity weakness guard
  // Reads jobAxis.familyDistance — same path as buildTargetRoleFit — independently, no coupling to its output
  const __jobAxisFamilyDistance = __text(vm?.candidateAxisPack?.jobAxis?.familyDistance) || "unclear_family";
  const __roleIdentityIsWeak = __jobAxisFamilyDistance !== "same_family";

  // READY: JD 레벨 시그널 + 다른 근거 조합 확인
  let status = (hasJdLevelSignal && hasSeniorityRisk) || (hasJdLevelSignal && hasOwnershipDepth)
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  const confidence = hasJdLevelSignal && hasSeniorityRisk ? "medium" : "low";

  // Wave 1e: one-notch uplift — restrained, supportive only
  // Conditions: currently low, same/adjacent family, ownership evidence exists, hints align
  // Negative guards: distant/unknown family, title-only, tenure-only → uplift blocked
  const finalConfidence = (
    confidence === "low" &&
    normalizedLevelBuckets.length > 0 &&
    __isNearFamily(familyDistance) &&
    hasOwnershipDepth &&
    __levelHintsAlignWithOwnership(normalizedLevelBuckets)
  ) ? "medium" : confidence;
  const evidenceStrength = classifyEvidenceStrength({
    hasDirectTaskEvidence: hasDirectTaskSignal(rawWhy, rawContext),
    hasOwnershipEvidence: hasOwnershipDepth || hasOwnershipSignal(rawWhy, rawContext),
    hasOutputEvidence: scopeCount > 0,
    hasResultEvidence: hasOutputSignal(rawWhy, rawContext),
    hasMeaningfulSupportEvidence: hasJdLevelSignal || hasSeniorityRisk || hasOwnershipDepth,
    hasContextEvidence: Boolean(why || context),
    bareKeywordOnly: detectBareKeywordOnly(rawWhy, rawContext, roleSummary),
    titleOnly: detectTitleOnlyEvidence(rawWhy, rawContext, roleSummary),
    yearsOnly: detectYearsOnly(rawWhy, rawContext),
  });
  if (evidenceStrength === "weak" || evidenceStrength === "noise") {
    status = JUDGMENT_STATUS.PARTIAL;
  }

  const sourceFamily = hasJdLevelSignal ? "jd_competitiveness"
    : hasOwnershipDepth ? "career_accumulation"
    : !__isGeneric(roleSummary) ? "candidate_axis_pack"
    : "fallback";

  const proofFor = [
    ownershipCount > 0 ? "오너십" : "",
    scopeCount > 0 ? "규모·범위" : "",
  ].filter(Boolean).slice(0, 2);

  const proofMissing = hasJdLevelSignal && !why
    ? ["JD 기대 레벨 대비 수행 범위 증빙 필요"]
    : hasJdLevelSignal && !hasSeniorityRisk
    ? ["직접 수행한 범위·책임 규모를 연차·직급 기대와 연결한 기술 필요"]
    : [];

  return {
    key: JUDGMENT_TYPES.LEVEL_POSITION_FIT,
    status,
    confidence: finalConfidence,
    sourceFamily: __normalizeSourceFamily(sourceFamily),
    evidenceStrength,
    why: __normalizeNullableText(why),
    context: __normalizeNullableText(context),
    proofFor: __normalizeStringArray(proofFor),
    proofMissing: __normalizeStringArray(proofMissing),
    actionHint: why
      ? (__roleIdentityIsWeak && finalConfidence === "low"
        ? "직무 역할 정체성이 불확실하므로, 목표 직무 적합성을 먼저 구체화한 뒤 직급 기대와 연결합니다."
        : "직급 기대와 실제 수행 범위 간 간격을 구체적 사례로 연결해 설명합니다.")
      : null,
  };
}
