import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: interpretationPack.secondarySources.candidateAxisPack (canonical axis 분석)
// 2순위: vm.candidateAxisPack (fallback)
// 3순위: evidenceFitMeta.domainDirectnessHint (interactionPack 기반 도메인 힌트)
// 4순위: interpretationPack.sectionAssemblies.industryContext.notes (보조 참고)
// ※ interactionPack은 이미 axisPack으로 canonicalize되어 있음
// ※ 원문 업종명 나열은 증빙이 아님 — 업무 구조 연결이 핵심 증빙
// READY: why 비generic + context 존재
// PARTIAL: why 또는 context 중 하나만 비generic

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

function __isGeneric(value) {
  const text = __text(value).toLowerCase();
  if (!text) return true;
  return /limited industry transfer evidence|추가 확인|판단이 필요|연결 가능성|읽힐 수 있습니다/.test(text);
}

function __isVendorContext(value) {
  const text = __text(value).toLowerCase();
  if (!text) return false;
  // 회사 제품/솔루션 맥락을 본인 경력 도메인으로 오인하지 않도록 guard
  // HR SaaS 영업 ≠ HR 실무자, 구매 솔루션 영업 ≠ 구매 운영자
  return /(hr saas|hr 솔루션|인사 솔루션|구매 솔루션|scm 솔루션|솔루션 영업|시스템 구축 영업|vendor|tool sales)/.test(text);
}

export function buildIndustryContinuity({ vm = null, interpretationPack = null, evidenceFitMeta = null } = {}) {
  const axisPack = interpretationPack?.secondarySources?.candidateAxisPack || vm?.candidateAxisPack || null;
  const narrativeContext = axisPack?.narrativeContext || null;
  const familyDistance = __text(narrativeContext?.familyDistance);
  const axisSummary = __text(narrativeContext?.axisSummary);
  const industryAsm = interpretationPack?.sectionAssemblies?.industryContext || null;
  const industryNote = __firstLine(industryAsm?.notes?.[0]);
  const domainHint = __firstLine(evidenceFitMeta?.domainDirectnessHint);

  // why: 비generic + 비vendor 맥락인 소스 중 가장 신뢰도 높은 것 선택
  // vendor/솔루션 영업 맥락이 섞인 힌트는 도메인 연결 why로 사용 불가
  const why = (!__isGeneric(domainHint) && !__isVendorContext(domainHint)) ? domainHint
    : (!__isGeneric(industryNote) && !__isVendorContext(industryNote)) ? industryNote
    : "";

  // context: axisSummary → familyDistance 순서 (generic 필터 적용)
  const context = !__isGeneric(axisSummary) ? axisSummary
    : !__isGeneric(familyDistance) ? familyDistance
    : "";

  if (!why && !context) {
    return {
      key: JUDGMENT_TYPES.INDUSTRY_CONTINUITY,
      status: JUDGMENT_STATUS.UNAVAILABLE,
      confidence: null,
      sourceFamily: "fallback",
      why: null,
      context: null,
      proofFor: [],
      proofMissing: [],
      actionHint: null,
    };
  }

  // READY: why 비generic + context 존재
  // PARTIAL: 둘 중 하나만 존재
  const status = why && context
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  // confidence: familyDistance + axisSummary 모두 비generic이면 medium
  const confidence = !__isGeneric(familyDistance) && !__isGeneric(axisSummary) ? "medium" : "low";

  const proofFor = __dedup([
    !__isGeneric(axisSummary) ? axisSummary : "",
    !__isGeneric(industryNote) ? industryNote : "",
  ]).slice(0, 2);

  // proofMissing: 실제로 누락된 경우만 — domainHint도 없고 familyDistance도 없을 때
  const proofMissing = !why && !familyDistance
    ? ["도메인 이동 거리와 연결 근거 설명 필요"]
    : [];

  return {
    key: JUDGMENT_TYPES.INDUSTRY_CONTINUITY,
    status,
    confidence,
    // dominant evidence owner 기준: axisPack 비generic → candidate_axis_pack; domainHint만 → evidence_fit_meta
    sourceFamily: !__isGeneric(axisSummary) || !__isGeneric(familyDistance) ? "candidate_axis_pack"
      : (!__isGeneric(domainHint) && !__isVendorContext(domainHint)) ? "evidence_fit_meta"
      : "fallback",
    why: why || null,
    context: context || null,
    proofFor,
    proofMissing,
    actionHint: why ? "업종명이 아니라 이어지는 업무 구조와 재사용 가능한 경험부터 연결해 설명합니다." : null,
  };
}
