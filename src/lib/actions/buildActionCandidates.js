import { ACTION_TEMPLATES } from "./actionTemplates.js";

const IMPACT_WEIGHT = {
  high: 0.08,
  medium: 0.04,
};

const EASE_WEIGHT = {
  high: 0.03,
  medium: 0.01,
};

const GATE_PRIORITY_BONUS = 0.06;
const GATE_FAVOR_GROUPS = new Set(["objection", "requirement_bridge", "year_gap", "hard_gate"]);

const SIGNAL_CLUSTER_MAP = {
  TASK__CORE_COVERAGE_LOW: "jd_alignment",
  ROLE_SKILL__JD_KEYWORD_ABSENCE: "jd_alignment",
  ROLE_SKILL__LOW_SEMANTIC_SIMILARITY: "jd_alignment",
  TASK__EVIDENCE_TOO_WEAK: "evidence_strength",
  EVIDENCE_THIN: "evidence_strength",
  IMPACT_WEAK: "evidence_strength",
  PROOF_WEAK: "evidence_strength",
  LOW_CONTENT_DENSITY_RISK: "evidence_strength",
  RISK__EXECUTION_IMPACT_GAP: "evidence_strength",
  DOMAIN__MISMATCH__JOB_FAMILY: "domain_fit",
  GATE__DOMAIN_MISMATCH__JOB_FAMILY: "domain_fit",
  DOMAIN__WEAK__KEYWORD_SPARSE: "domain_fit",
  SIMPLE__DOMAIN_SHIFT: "domain_fit",
  ROLE_DOMAIN_SHIFT: "domain_fit",
  TITLE_DOMAIN_SHIFT: "domain_fit",
  SIMPLE__ROLE_SHIFT: "transition_logic",
  RISK__ROLE_LEVEL_MISMATCH: "transition_logic",
  TITLE_SENIORITY_MISMATCH: "seniority_gap",
  SENIORITY__UNDER_MIN_YEARS: "seniority_gap",
  GATE__AGE: "hard_gate",
  GATE__SALARY_MISMATCH: "hard_gate",
  GATE__CRITICAL_EXPERIENCE_GAP: "hard_gate",
  ROLE_SKILL__MUST_HAVE_MISSING: "hard_gate",
  RISK__TIMELINE_MISMATCH: "timeline_risk",
  RISK__JOB_HOPPING: "stability_risk",
  JOB_HOPPING_DENSITY: "stability_risk",
};

const RISK_FAMILY_BY_SIGNAL = {
  SENIORITY_GAP: "scope_reframe",
  SENIORITY__UNDER_MIN_YEARS: "scope_reframe",
  TITLE_SENIORITY_MISMATCH: "scope_reframe",
  RISK__ROLE_LEVEL_MISMATCH: "scope_reframe",
  GATE__SENIOR_LEVEL_REQUIRED: "scope_reframe",
  STRATEGIC_SCOPE_GAP: "strategy_reframing",
  DOMAIN_STRATEGY_GAP: "strategy_reframing",
  HR_ALIGNMENT_GAP: "strategy_reframing",
  ROLE_SKILL__MUST_HAVE_MISSING: "adjacent_mapping",
  GATE__CRITICAL_EXPERIENCE_GAP: "adjacent_mapping",
  CORE_RESPONSIBILITY_MISSING: "adjacent_mapping",
  TASK__CORE_COVERAGE_LOW: "adjacent_mapping",
  DOMAIN__MISMATCH__JOB_FAMILY: "adjacent_mapping",
  GATE__DOMAIN_MISMATCH__JOB_FAMILY: "adjacent_mapping",
  ROLE_DOMAIN_SHIFT: "adjacent_mapping",
  TITLE_DOMAIN_SHIFT: "adjacent_mapping",
  SIMPLE__DOMAIN_SHIFT: "adjacent_mapping",
  LOW_CONTENT_DENSITY_RISK: "evidence_structuring",
  PROOF_WEAK: "evidence_structuring",
  EVIDENCE_THIN: "evidence_structuring",
  IMPACT_WEAK: "evidence_structuring",
  TASK__EVIDENCE_TOO_WEAK: "evidence_structuring",
  RISK__EXECUTION_IMPACT_GAP: "evidence_structuring",
};

const TEMPLATE_LIST = Object.values(ACTION_TEMPLATES || {});
const SIGNAL_TEMPLATE_MAP = TEMPLATE_LIST.reduce((acc, template) => {
  for (const signalKey of Array.isArray(template?.signalKeys) ? template.signalKeys : []) {
    const normalizedKey = String(signalKey || "").trim();
    if (!normalizedKey) continue;
    if (!acc.has(normalizedKey)) acc.set(normalizedKey, []);
    acc.get(normalizedKey).push(template);
  }
  return acc;
}, new Map());

function __getSignalPriority(signal) {
  const base = Number(signal?.priority ?? signal?.score ?? 0.5);
  return Number.isFinite(base) ? base : 0.5;
}

function __resolveProblemCluster(signalId, template) {
  return String(template?.primaryCluster || SIGNAL_CLUSTER_MAP[signalId] || "general").trim();
}

function __resolveActionFamily(template) {
  return String(template?.actionFamily || template?.category || "general").trim();
}

function __getTemplatePriority(signal, template) {
  let next = __getSignalPriority(signal);
  next += IMPACT_WEIGHT[template?.impact] || 0;
  next += EASE_WEIGHT[template?.ease] || 0;
  if (
    String(signal?.id || "").startsWith("GATE__") &&
    (GATE_FAVOR_GROUPS.has(String(template?.dedupeGroup || "")) ||
      String(template?.primaryCluster || "") === "hard_gate")
  ) {
    next += GATE_PRIORITY_BONUS;
  }
  return next;
}

function __resolveSourceRiskFamily(signalId) {
  return RISK_FAMILY_BY_SIGNAL[String(signalId || "").trim()] || "generic";
}

function __getPrimaryRiskBoost(signalId, context = {}) {
  const id = String(signalId || "").trim();
  const primaryId = String(context?.primaryRiskId || "").trim();
  const supportIds = Array.isArray(context?.supportRiskIds) ? context.supportRiskIds : [];
  const family = __resolveSourceRiskFamily(id);
  const primaryFamily = __resolveSourceRiskFamily(primaryId);
  const supportFamilies = [...new Set(supportIds.map((riskId) => __resolveSourceRiskFamily(riskId)).filter(Boolean))];

  if (id && primaryId && id === primaryId) return 0.22;
  if (family !== "generic" && family === primaryFamily) return 0.14;
  if (supportIds.includes(id)) return 0.08;
  if (family !== "generic" && supportFamilies.includes(family)) return 0.05;
  if (family === "evidence_structuring" && primaryFamily && primaryFamily !== "evidence_structuring") return -0.08;
  return 0;
}

function __getRiskAwareActionOverride(signalId, template) {
  const family = __resolveSourceRiskFamily(signalId);
  const templateActionFamily = __resolveActionFamily(template);
  const templateCluster = __resolveProblemCluster(signalId, template);

  if (family === "scope_reframe") {
    if (templateActionFamily === "seniority_positioning" || templateCluster === "seniority_gap") {
      return {
        actionType: "scope_reframe",
        title: "연차보다 맡은 범위와 오너십을 상향 재서술",
        task: "기간보다 조정, 기획, 주도, 의사결정 영향이 보이게 역할 문장을 다시 쓰기",
        example: "실행 지원이 아니라 일정 조율, 우선순위 판단, 직접 책임 범위를 드러내는 문장으로 변환",
      };
    }
    return {
      actionType: "scope_reframe",
      title: "상위 레벨처럼 읽히게 역할 범위를 재정의",
      task: "실행 중심 bullet을 맡은 범위, 판단 구간, 오너십 언어로 다시 정리",
      example: "운영 실행 문장을 조정, 기획, 주도, 의사결정 영향이 보이는 문장으로 변환",
    };
  }

  if (family === "strategy_reframing") {
    if (templateActionFamily === "rewrite" || templateCluster === "jd_alignment") {
      return {
        actionType: "strategy_reframing",
        title: "운영 경험을 JD 전략 문맥으로 재서술",
        task: "운영 bullet을 정책 개선, 기준 수립, 의사결정 지원 문장으로 다시 연결",
        example: "운영 task를 전략 판단 지원, 운영 기준 정리, 정책 개선 기여 문장으로 재표현",
      };
    }
    return {
      actionType: "strategy_reframing",
      title: "운영 경험을 전략/개선 관점으로 연결",
      task: "반복 실행 경험이 조직 판단, 정책 운영, 개선 의사결정에 어떻게 기여했는지 적기",
      example: "운영 경험을 전략 판단 기여, 정책 운영 개선, 의사결정 지원 관점으로 번역",
    };
  }

  if (family === "adjacent_mapping") {
    if (templateCluster === "hard_gate" || templateActionFamily === "requirement_match" || templateActionFamily === "gate_response") {
      return {
        actionType: "adjacent_mapping",
        title: "직접 경험이 없으면 인접 책임 대응표로 연결",
        task: "JD 핵심 요구 항목별로 가장 가까운 내 경험을 1:1 대응 bullet로 정리",
        example: "JD 요구 항목 3개를 뽑아 각 항목 아래에 대응되는 내 경험 bullet을 바로 붙이기",
      };
    }
    return {
      actionType: "adjacent_mapping",
      title: "유사 기능과 공통 구조를 먼저 매핑",
      task: "직접 동일 경험 대신 문제 구조와 책임이 가장 가까운 인접 경험을 앞세우기",
      example: "직접 동일 경험이 없으면 유사 기능, 공통 책임, 인접 산출물을 대응표처럼 연결",
    };
  }

  if (family === "evidence_structuring") {
    if (templateActionFamily === "structure" || templateActionFamily === "evidence" || templateCluster === "evidence_strength") {
      return {
        actionType: "evidence_structuring",
        title: "대표 사례 1개를 문제-행동-결과 구조로 강화",
        task: "대표 사례 1개를 골라 맥락, 행동, 결과, 수치가 보이게 다시 쓰기",
        example: "문제-행동-결과 구조로 사례 1개를 다시 쓰고 수치와 결과를 함께 붙이기",
      };
    }
    return {
      actionType: "evidence_structuring",
      title: "약한 근거를 대표 사례 중심으로 정리",
      task: "흩어진 성과 문장을 대표 사례 1개로 묶고 결과와 맥락을 보강",
      example: "핵심 사례 1개를 선택해 배경, 행동, 결과, 숫자를 순서대로 정리",
    };
  }

  return null;
}


function __buildSyntheticTemplateForSignal(signalId) {
  const family = __resolveSourceRiskFamily(signalId);
  if (family === "strategy_reframing") {
    return {
      id: `synthetic_strategy_${String(signalId || "").toLowerCase()}`,
      title: "운영 경험을 전략 문맥으로 다시 연결",
      task: "운영 경험을 정책, 개선, 기준 수립, 의사결정 지원 문장으로 재구성",
      example: "운영 task를 전략 판단 지원, 정책 개선, 운영 기준 정리 기여 문장으로 재표현",
      dedupeGroup: "synthetic_strategy_reframing",
      category: "transition",
      impact: "high",
      ease: "medium",
      actionFamily: "bridge",
      primaryCluster: "transition_logic",
    };
  }
  if (family === "adjacent_mapping") {
    return {
      id: `synthetic_adjacent_${String(signalId || "").toLowerCase()}`,
      title: "직접 경험 부족은 인접 책임으로 대응",
      task: "직접 동일 경험 대신 가장 가까운 기능, 책임, 산출물을 대응표로 연결",
      example: "JD 요구 항목별로 내 유사 경험과 대응되는 bullet을 1:1로 배치",
      dedupeGroup: "synthetic_adjacent_mapping",
      category: "requirement_bridge",
      impact: "high",
      ease: "medium",
      actionFamily: "gate_response",
      primaryCluster: "hard_gate",
    };
  }
  return null;
}
function __dedupeByBest(items = [], keySelector) {
  const deduped = new Map();
  for (const item of items) {
    const key = String(keySelector(item) || "").trim();
    if (!key) continue;
    const prev = deduped.get(key);
    if (!prev || Number(item?.priority || 0) > Number(prev?.priority || 0)) {
      deduped.set(key, item);
    }
  }
  return Array.from(deduped.values());
}

export function buildActionCandidates(signals = [], context = {}) {
  const candidates = [];

  for (const signal of Array.isArray(signals) ? signals : []) {
    const signalId = String(signal?.id || "").trim();
    if (!signalId) continue;
    const mappedTemplates = SIGNAL_TEMPLATE_MAP.get(signalId) || [];
    const syntheticTemplate = __buildSyntheticTemplateForSignal(signalId);
    const templates = mappedTemplates.length ? mappedTemplates : (syntheticTemplate ? [syntheticTemplate] : []);
    if (!templates.length) continue;
    const sourcePriority = __getSignalPriority(signal);

    for (const template of templates) {
      const primaryRiskId = String(context?.primaryRiskId || "").trim();
      const supportRiskIds = Array.isArray(context?.supportRiskIds) ? context.supportRiskIds : [];
      const sourceRiskFamily = __resolveSourceRiskFamily(signalId);
      const primaryRiskFamily = __resolveSourceRiskFamily(primaryRiskId);
      const supportRiskFamilies = [...new Set(supportRiskIds.map((riskId) => __resolveSourceRiskFamily(riskId)).filter(Boolean))];
      const problemCluster = __resolveProblemCluster(signalId, template);
      const actionFamily = __resolveActionFamily(template);
      const override = __getRiskAwareActionOverride(signalId, template);
      const resolvedActionType = String(override?.actionType || actionFamily || template?.category || "general").trim();
      const isGateAction =
        problemCluster === "hard_gate" || String(signalId).startsWith("GATE__");
      const isEvidenceAction = problemCluster === "evidence_strength" || actionFamily === "evidence";
      const isRewriteAction =
        actionFamily === "rewrite" ||
        actionFamily === "requirement_match" ||
        problemCluster === "jd_alignment";
      const isBridgeAction =
        actionFamily === "bridge" ||
        actionFamily === "gate_response" ||
        problemCluster === "domain_fit" ||
        problemCluster === "transition_logic";
      const isStructuralAction = [
        "structure",
        "timeline_story",
        "stability_story",
        "seniority_positioning",
      ].includes(actionFamily);
      const isPrimaryRiskAction = !!signalId && signalId === primaryRiskId;
      const isPrimaryRiskFamilyAction =
        sourceRiskFamily !== "generic" &&
        primaryRiskFamily !== "generic" &&
        sourceRiskFamily === primaryRiskFamily;
      const isSupportRiskAction = supportRiskIds.includes(signalId);
      const isSupportRiskFamilyAction =
        sourceRiskFamily !== "generic" &&
        supportRiskFamilies.includes(sourceRiskFamily);

      candidates.push({
        id: template.id,
        title: override?.title || template.title,
        task: override?.task || template.task,
        example: override?.example || template.example,
        priority: __getTemplatePriority(signal, template) + __getPrimaryRiskBoost(signalId, context),
        dedupeGroup: template.dedupeGroup,
        category: template.category,
        impact: template.impact,
        ease: template.ease,
        sourceSignal: signalId,
        sourceSignalId: signalId,
        sourceRiskFamily,
        sourcePriority,
        problemCluster,
        actionFamily,
        actionType: resolvedActionType,
        isGateAction,
        isStructuralAction,
        isEvidenceAction,
        isRewriteAction,
        isBridgeAction,
        isPrimaryRiskAction,
        isPrimaryRiskFamilyAction,
        isSupportRiskAction,
        isSupportRiskFamilyAction,
      });
    }
  }

  const dedupedById = __dedupeByBest(candidates, (action) => action?.id);
  const grouped = [];
  const ungrouped = [];

  for (const action of dedupedById) {
    if (String(action?.dedupeGroup || "").trim()) grouped.push(action);
    else ungrouped.push(action);
  }

  const dedupedByGroup = __dedupeByBest(
    grouped,
    (action) =>
      `${String(action?.problemCluster || "").trim()}::${String(action?.dedupeGroup || "").trim()}`
  );
  return [...dedupedByGroup, ...ungrouped];
}