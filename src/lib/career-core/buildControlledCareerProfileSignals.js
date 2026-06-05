import { classifyOwnershipSeniority } from "./classifyOwnershipSeniority.js";
import { calibrateEvidenceConfidence } from "./calibrateEvidenceConfidence.js";
import { buildEvidenceTraceMap } from "./buildEvidenceTraceMap.js";

const DOMAIN_SIGNALS = {
  sales: ["customer_problem_discovery", "proposal_strategy", "commercial_negotiation", "revenue_ownership"],
  growth_marketing: ["campaign_hypothesis", "creative_ab_testing", "performance_metric_analysis", "budget_optimization"],
  cx_strategy: ["voc_analysis", "customer_journey_diagnosis", "support_policy_improvement", "customer_issue_reduction"],
  customer_experience_operations: ["voc_analysis", "customer_journey_diagnosis", "support_policy_improvement", "customer_issue_reduction"],
  data_analysis: ["metric_definition", "sql_query_design", "root_cause_analysis", "dashboard_design", "decision_support"],
  product_planning_pm: ["problem_definition", "requirements_definition", "prioritization", "cross_functional_collaboration", "post_release_monitoring"],
  service_planning: ["problem_definition", "requirements_definition", "prioritization", "cross_functional_collaboration", "post_release_monitoring"],
};

const RISK_BY_DOMAIN = {
  sales: "weak_sales_ownership_evidence",
  growth_marketing: "weak_growth_marketing_ownership_evidence",
  cx_strategy: "weak_cx_ownership_evidence",
  customer_experience_operations: "weak_cx_ownership_evidence",
  data_analysis: "weak_data_ownership",
  product_planning_pm: "weak_ownership_evidence",
  service_planning: "weak_ownership_evidence",
  unknown_admin_support: "insufficient_ownership_evidence",
};

const OVERCLAIM_RISK_BY_DOMAIN = {
  data_analysis: "data_analysis_overclaim_risk",
  product_planning_pm: "product_ownership_unclear",
  service_planning: "product_ownership_unclear",
};

const CLARIFICATION_BY_SIGNAL = {
  customer_problem_discovery: "고객의 어떤 문제나 요구사항을 직접 파악했나요?",
  proposal_strategy: "제안 전략에서 직접 정한 범위나 방향은 무엇인가요?",
  commercial_negotiation: "가격이나 도입 범위 협상에서 맡은 역할은 무엇인가요?",
  revenue_ownership: "계약 전환이나 수주에 어떻게 기여했나요?",
  metric_definition: "어떤 지표를 직접 정의했나요?",
  sql_query_design: "SQL 쿼리를 직접 작성했나요, 아니면 정해진 쿼리를 실행했나요?",
  root_cause_analysis: "어떤 원인을 분석했고 결론은 무엇이었나요?",
  dashboard_design: "대시보드 구조나 지표 설계에서 직접 정한 내용은 무엇인가요?",
  decision_support: "분석 결과가 어떤 의사결정을 지원했나요?",
  problem_definition: "해결하려던 문제를 어떻게 정의했나요?",
  requirements_definition: "요구사항, PRD, 사용자 스토리 중 직접 정의한 것은 무엇인가요?",
  prioritization: "우선순위는 어떤 기준으로 결정했나요?",
  cross_functional_collaboration: "개발/디자인과 어떤 범위에서 협업했나요?",
  post_release_monitoring: "배포 후 어떤 지표를 모니터링했나요?",
  voc_analysis: "VOC 분석에서 직접 분류하거나 해석한 내용은 무엇인가요?",
  customer_journey_diagnosis: "고객 여정의 어느 문제를 정의했나요?",
  support_policy_improvement: "상담 정책이나 응대 가이드를 어떻게 개선했나요?",
  customer_issue_reduction: "개선 후 어떤 고객 이슈 지표가 줄었나요?",
};

const TRACE_CONTRADICTION_PATTERNS = [
  /did\s+not\s+(write|own|lead|perform|define|decide)/i,
  /not\s+(responsible|owned|led|written|performed)/i,
  /owned\s+by\s+(the\s+)?(leader|pm|data\s+team)/i,
  /performed\s+by\s+(the\s+)?(data\s+team|pm|leader)/i,
  /담당하지\s*않음|직접\s*작성하지\s*않음|리더가\s*담당|PM이\s*담당|데이터팀이\s*수행/,
];

function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}

function sourceTracePayload(trace) {
  return {
    sourceText: trace.sourceText,
    sourceField: trace.sourceField,
    sourceIndex: trace.sourceIndex,
    reasonCode: trace.reasonCode,
  };
}

function hasUsableSourceTrace(trace) {
  return Boolean(trace?.sourceText && !trace.isContradicted);
}

function hasTraceContradiction(trace) {
  if (trace?.isContradicted) return true;
  return TRACE_CONTRADICTION_PATTERNS.some((pattern) => pattern.test(trace?.sourceText ?? ""));
}

function signalsFor(roleFamily, options = {}) {
  if (Array.isArray(options.signals) && options.signals.length) return options.signals;
  return DOMAIN_SIGNALS[roleFamily] ?? [];
}

function fallbackRoleFamily(input, classification, options = {}) {
  return options.roleFamily
    ?? options.domain
    ?? classification?.roleFamily
    ?? input?.roleFamily
    ?? "unknown_admin_support";
}

function normalizeInput(inputOrBundle = {}) {
  return inputOrBundle.input ?? inputOrBundle.resumeInput ?? inputOrBundle.rawInput ?? inputOrBundle;
}

function getClassification(input, inputOrBundle, options) {
  return options.classification
    ?? inputOrBundle.classification
    ?? classifyOwnershipSeniority(input);
}

function getConfidence(input, inputOrBundle, options, roleFamily, signals) {
  return options.confidence
    ?? options.confidenceResult
    ?? inputOrBundle.confidence
    ?? inputOrBundle.confidenceResult
    ?? calibrateEvidenceConfidence(input, { roleFamily, signals });
}

function getTraceMap(input, inputOrBundle, options, roleFamily, signals) {
  return options.traceMap
    ?? inputOrBundle.traceMap
    ?? buildEvidenceTraceMap(input, { domain: roleFamily, signals });
}

function riskSignalFor(roleFamily, reasonCode, sourceTraces = []) {
  return {
    signal: OVERCLAIM_RISK_BY_DOMAIN[roleFamily] ?? RISK_BY_DOMAIN[roleFamily] ?? "weak_ownership_evidence",
    reasonCode,
    sourceTraces,
    canApplyToCareerProfile: false,
  };
}

export function buildControlledCareerProfileSignals(inputOrBundle = {}, options = {}) {
  const input = normalizeInput(inputOrBundle);
  const classification = getClassification(input, inputOrBundle, options);
  const roleFamily = fallbackRoleFamily(input, classification, options);
  const signals = signalsFor(roleFamily, options);
  const confidence = getConfidence(input, inputOrBundle, options, roleFamily, signals);
  const traceMap = getTraceMap(input, inputOrBundle, options, roleFamily, signals);

  const candidateStrengthSignals = [];
  const candidateRiskSignals = [];
  const missingEvidence = [];
  const contradictedSignals = [];

  for (const signal of signals) {
    const evidenceConfidence = confidence.evidenceConfidenceBySignal?.[signal] ?? "absent";
    const traces = traceMap.tracesBySignal?.[signal] ?? [];
    const sourceTraces = traces.filter(hasUsableSourceTrace).map(sourceTracePayload);
    const contradictedSourceTraces = traces.filter(hasTraceContradiction).map(sourceTracePayload);
    const isStrong = evidenceConfidence === "explicit" || evidenceConfidence === "inferred_strong";
    const isContradicted = evidenceConfidence === "contradicted"
      || traceMap.contradictedSignals?.includes(signal)
      || traces.some(hasTraceContradiction);
    const isMissing = evidenceConfidence === "absent" || traceMap.missingSignals?.includes(signal);

    if (isStrong && sourceTraces.length > 0 && !isContradicted) {
      candidateStrengthSignals.push({
        signal,
        roleFamily,
        evidenceConfidence,
        ownershipLevel: classification.ownershipLevel,
        judgmentLevel: classification.judgmentLevel,
        sourceTraces,
        canApplyToCareerProfile: true,
      });
      continue;
    }

    if (isContradicted) {
      contradictedSignals.push({
        signal,
        reasonCode: `contradicted_${signal}`,
        sourceTraces: contradictedSourceTraces,
        canApplyToCareerProfile: false,
      });
      candidateRiskSignals.push(riskSignalFor(roleFamily, `contradicted_${signal}`, contradictedSourceTraces));
      continue;
    }

    if (isMissing) {
      missingEvidence.push({
        signal,
        reasonCode: "missing_required_signal",
        clarificationQuestion: CLARIFICATION_BY_SIGNAL[signal],
      });
      continue;
    }

    candidateRiskSignals.push(riskSignalFor(roleFamily, `weak_or_missing_${signal}_evidence`, sourceTraces));
  }

  if (signals.length === 0 || roleFamily === "unknown_admin_support") {
    candidateRiskSignals.push(riskSignalFor(roleFamily, "insufficient_ownership_evidence"));
  }

  return {
    candidateStrengthSignals,
    candidateRiskSignals: uniqueList(candidateRiskSignals.map((item) => item.signal)).map((signal) => (
      candidateRiskSignals.find((item) => item.signal === signal)
    )),
    missingEvidence,
    contradictedSignals,
    integrationStatus: "read_only_candidate",
    appliedToCareerProfile: false,
  };
}
