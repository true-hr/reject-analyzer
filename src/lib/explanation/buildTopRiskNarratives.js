const DOMAIN_SHIFT_IDS = new Set([
  "domainShiftRisk",
  "DOMAIN__MISMATCH__JOB_FAMILY",
  "GATE__DOMAIN_MISMATCH__JOB_FAMILY",
  "DOMAIN__WEAK__KEYWORD_SPARSE",
  "SIMPLE__DOMAIN_SHIFT",
  "ROLE_DOMAIN_SHIFT",
  "TITLE_DOMAIN_SHIFT",
  "TASK__ROLE_FAMILY_MISMATCH",
]);

function __text(value) {
  return String(value || "").trim();
}

function __score01(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num <= 0) return 0;
  if (num >= 1) return 1;
  return num;
}

function __pick(...values) {
  for (const value of values) {
    const text = __text(value);
    if (text) return text;
  }
  return "";
}

function __toBool(value) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return null;
}

function __readDomainContext(risk) {
  const meta = risk?.meta && typeof risk.meta === "object" ? risk.meta : {};
  const evidence = risk?.evidence && typeof risk.evidence === "object" ? risk.evidence : {};
  const taskMeta = risk?.taskOntologyMeta && typeof risk.taskOntologyMeta === "object" ? risk.taskOntologyMeta : {};

  const roleCurrent = __pick(
    meta.roleCurrent,
    meta.currentCanonicalRole,
    taskMeta.resumeFamily
  );
  const roleTarget = __pick(
    meta.roleTarget,
    meta.targetCanonicalRole,
    taskMeta.jdFamily,
    evidence.jdFamily
  );

  const industryCurrent = __pick(meta.industryCurrent);
  const industryTarget = __pick(meta.industryTarget);
  const roleMismatch = __toBool(meta.roleMismatch);
  const industryMismatch = __toBool(meta.industryMismatch);
  const domainShiftType = __pick(meta.domainShiftType);
  const overlapCount = Number.isFinite(Number(evidence.overlapCount)) ? Number(evidence.overlapCount) : 0;
  const familyDistance = Number.isFinite(Number(taskMeta.familyDistance))
    ? Number(taskMeta.familyDistance)
    : Number.isFinite(Number(meta.familyDistance))
      ? Number(meta.familyDistance)
      : null;

  return {
    roleCurrent,
    roleTarget,
    industryCurrent,
    industryTarget,
    roleMismatch,
    industryMismatch,
    domainShiftType,
    overlapCount,
    familyDistance,
  };
}

function __classifyDomainNarrative(risk) {
  const id = __text(risk?.id || risk?.__id || risk?.code);
  if (!DOMAIN_SHIFT_IDS.has(id)) return null;

  const ctx = __readDomainContext(risk);
  const score = __score01(risk?.score);
  const roleMismatch = ctx.roleMismatch === null
    ? Boolean(ctx.domainShiftType) || (ctx.familyDistance !== null && ctx.familyDistance >= 1)
    : ctx.roleMismatch;
  const industryMismatch = ctx.industryMismatch === null
    ? Boolean(ctx.industryCurrent && ctx.industryTarget && ctx.industryCurrent !== ctx.industryTarget)
    : ctx.industryMismatch;
  const shiftType = String(ctx.domainShiftType || "").toUpperCase();

  let narrativeType = null;
  if (industryMismatch && roleMismatch) {
    narrativeType = "ROLE_AND_INDUSTRY_SHIFT";
  } else if (industryMismatch) {
    narrativeType = "INDUSTRY_SHIFT_ONLY";
  } else if (shiftType === "FUNCTION_SHIFT" && ctx.overlapCount > 0) {
    narrativeType = "TRANSFERABLE_FUNCTION";
  } else if (shiftType === "FUNCTION_SHIFT" || (ctx.familyDistance !== null && ctx.familyDistance === 1)) {
    narrativeType = "ADJACENT_ROLE_SHIFT";
  } else if (
    shiftType === "DOMAIN_SHIFT" ||
    shiftType === "HARD_DOMAIN_MISMATCH" ||
    id === "TASK__ROLE_FAMILY_MISMATCH" ||
    id === "DOMAIN__MISMATCH__JOB_FAMILY" ||
    id === "GATE__DOMAIN_MISMATCH__JOB_FAMILY"
  ) {
    narrativeType = "HARD_ROLE_SHIFT";
  } else if (ctx.overlapCount > 0) {
    narrativeType = "TRANSFERABLE_FUNCTION";
  }

  if (!narrativeType) return null;

  const roleCurrent = ctx.roleCurrent || "현재 직무";
  const roleTarget = ctx.roleTarget || "지원 직무";
  const industryCurrent = ctx.industryCurrent || "현재 산업";
  const industryTarget = ctx.industryTarget || "지원 산업";
  const severityTone = score >= 0.8 ? "high" : score >= 0.45 ? "medium" : "guarded";

  const templates = {
    HARD_ROLE_SHIFT: {
      headline: "지금은 직무 축이 다르게 읽히는 상태",
      interviewerView: `${roleCurrent}에서 ${roleTarget}로 바로 이어지는 후보인지보다, 왜 이 전환이 성립하는지부터 확인하게 되는 상태입니다.`,
      userExplanation: `이력서의 대표 경험이 ${roleTarget}의 핵심 산출물과 직접 연결되지 않아, 현재까지는 직무 축이 바뀌는 전환으로 읽힙니다.`,
      interviewPrepHint: `${roleTarget}에서 이미 수행한 과업, 산출물, 의사결정 경험을 1~2개로 고정해 브릿지 문장을 먼저 준비하세요.`,
    },
    ADJACENT_ROLE_SHIFT: {
      headline: "인접 직무 전환 후보로 읽히는 상태",
      interviewerView: `${roleCurrent}와 ${roleTarget} 사이의 거리가 아주 멀지는 않지만, 목표 역할의 핵심 책임을 실제로 해봤는지 확인 질문이 먼저 붙을 수 있습니다.`,
      userExplanation: `직무 간 연결 가능성은 보이지만, 현재 문서만으로는 ${roleTarget}의 대표 업무를 어디까지 직접 맡았는지가 선명하지 않습니다.`,
      interviewPrepHint: `${roleCurrent} 경험 중 ${roleTarget}와 겹치는 책임, KPI, 협업 구조를 한 문단으로 묶어 먼저 설명할 준비를 하세요.`,
    },
    INDUSTRY_SHIFT_ONLY: {
      headline: "직무는 맞지만 산업 맥락 전환으로 읽히는 상태",
      interviewerView: `${industryCurrent}에서 ${industryTarget}로 이동할 때 적응 비용이 얼마나 드는지, 업종 차이를 얼마나 빨리 줄일 수 있는지 확인하려는 흐름입니다.`,
      userExplanation: `직무 자체보다 산업 맥락 차이가 먼저 보입니다. 그래서 동일 업무라도 다른 고객 구조나 KPI에 바로 적용 가능한지가 핵심 질문이 됩니다.`,
      interviewPrepHint: `${industryCurrent} 경험 중 ${industryTarget}에도 그대로 옮길 수 있는 공통 KPI, 운영 구조, 문제 해결 방식을 먼저 정리하세요.`,
    },
    ROLE_AND_INDUSTRY_SHIFT: {
      headline: "직무와 산업이 함께 바뀌는 전환 후보로 읽히는 상태",
      interviewerView: `${roleTarget} 적합성 판단 전에 ${industryCurrent}에서의 경험이 ${industryTarget}와 ${roleTarget} 양쪽에 동시에 이어지는지부터 검증하려는 상태입니다.`,
      userExplanation: `현재는 역할 변화와 산업 변화가 한 번에 걸쳐 보여, 강점이 없는 것이 아니라 연결 논리가 문서 앞단에서 충분히 드러나지 않는 상태에 가깝습니다.`,
      interviewPrepHint: `전환 이유보다 먼저, 공통 과업 구조와 재사용 가능한 성과 프레임을 2개 정도로 압축해 설명 문장을 준비하세요.`,
    },
    TRANSFERABLE_FUNCTION: {
      headline: "전이 가능한 기능은 보이지만 해석 연결이 더 필요한 상태",
      interviewerView: `${roleCurrent} 경험 안에 ${roleTarget}로 옮겨갈 수 있는 기능은 보이지만, 그 기능이 실제 채용 역할에서 바로 쓰일 근거를 더 확인하려는 흐름입니다.`,
      userExplanation: `완전히 다른 후보로 읽히지는 않지만, 전이 가능한 기능이 점처럼 흩어져 있어 하나의 직무 적합 스토리로 아직 충분히 묶이지 않았습니다.`,
      interviewPrepHint: `겹치는 기능 ${ctx.overlapCount > 0 ? `${ctx.overlapCount}개 안팎` : "몇 가지"}를 산출물과 결과 중심으로 재배치해 '이미 해본 일'처럼 들리게 준비하세요.`,
    },
  };

  return {
    type: narrativeType,
    headline: templates[narrativeType].headline,
    interviewerView: templates[narrativeType].interviewerView,
    userExplanation: templates[narrativeType].userExplanation,
    interviewPrepHint: templates[narrativeType].interviewPrepHint,
    severityTone,
  };
}

// ── Phase 9.6-B: maps riskSummary block to per-risk narrative shape ──
// Phase 11-9A: headline cleared — section-level, must not propagate to per-card narrative.
// Phase 11-10: interviewerView also cleared — riskBlock interviewerView is derived from
// section-level supportLine+bulletLines (same for ALL cards). When narrative.interviewerView
// carries this shared text, __narrativeInterviewerView wins __preferredExplanationHint in
// buildSimulationViewModel before per-card __efHint / __evidenceLinkHint, causing all 3
// cards to show the identical generic sentence. Surface B uses headline+bulletLines directly
// from sectionSentences.riskSummary; per-card narratives must remain clear of section text
// so that per-card evidence paths can win.
function __mapRiskSummaryBlockToNarrative(riskBlock) {
  const bulletText = (Array.isArray(riskBlock.bulletLines) ? riskBlock.bulletLines : []).filter(Boolean).join(" ");
  return {
    type: "RISK_SUMMARY_ASSEMBLY",
    headline: "",       // Phase 11-9A: cleared
    interviewerView: "", // Phase 11-10: cleared — section-level, same for all cards
    userExplanation: bulletText || riskBlock.supportLine || "",
    interviewPrepHint: riskBlock.cautionLine || "",
    severityTone: riskBlock.confidenceLabel || "",
  };
}

// Per-risk fan-out: maps the shared riskSummary block to one entry per risk, preserving risk.id
function __buildAssemblyRiskNarrativeEntries(selectedTop3, riskBlock) {
  const baseNarrative = __mapRiskSummaryBlockToNarrative(riskBlock);
  return (Array.isArray(selectedTop3) ? selectedTop3 : [])
    .map((risk) => {
      const id = __text(risk?.id || risk?.__id || risk?.code);
      if (!id) return null;
      return { id, narrative: baseNarrative };
    })
    .filter(Boolean);
}

export function buildTopRiskNarratives(selectedTop3 = [], { interpretationPack } = {}) {
  // ── Phase 9.6-B: assembly-v1 sentence layer (wrapper) ──
  // Prefers sectionSentences.riskSummary if available and usable; falls back to legacy.
  const _riskBlock = interpretationPack?.sectionSentences?.riskSummary;
  if (
    _riskBlock?.generationMode === "assembly-v1" &&
    Array.isArray(selectedTop3) && selectedTop3.length > 0 &&
    (_riskBlock.headline || (Array.isArray(_riskBlock.bulletLines) && _riskBlock.bulletLines.length > 0))
  ) {
    return __buildAssemblyRiskNarrativeEntries(selectedTop3, _riskBlock);
  }
  // ── legacy fallback ──

  return (Array.isArray(selectedTop3) ? selectedTop3 : [])
    .map((risk) => {
      const id = __text(risk?.id || risk?.__id || risk?.code);
      const narrative = __classifyDomainNarrative(risk);
      if (!id || !narrative) return null;
      return { id, narrative };
    })
    .filter(Boolean);
}
