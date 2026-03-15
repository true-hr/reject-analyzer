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

export function buildActionCandidates(signals = []) {
  const candidates = [];

  for (const signal of Array.isArray(signals) ? signals : []) {
    const signalId = String(signal?.id || "").trim();
    if (!signalId) continue;
    const templates = SIGNAL_TEMPLATE_MAP.get(signalId) || [];
    if (!templates.length) continue;
    const sourcePriority = __getSignalPriority(signal);

    for (const template of templates) {
      const problemCluster = __resolveProblemCluster(signalId, template);
      const actionFamily = __resolveActionFamily(template);
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

      candidates.push({
        id: template.id,
        title: template.title,
        task: template.task,
        example: template.example,
        priority: __getTemplatePriority(signal, template),
        dedupeGroup: template.dedupeGroup,
        category: template.category,
        impact: template.impact,
        ease: template.ease,
        sourceSignal: signalId,
        sourceSignalId: signalId,
        sourcePriority,
        problemCluster,
        actionFamily,
        isGateAction,
        isStructuralAction,
        isEvidenceAction,
        isRewriteAction,
        isBridgeAction,
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
