import { classifyOwnershipSeniority } from "./classifyOwnershipSeniority.js";

function includesAny(values = [], candidates = []) {
  return candidates.some((candidate) => values.includes(candidate));
}

function basePlan(classification) {
  return {
    artifactType: classification.artifactType,
    roleFamily: classification.roleFamily,
    currentReading: {
      seniorityLevel: classification.seniorityLevel,
      ownershipLevel: classification.ownershipLevel,
      judgmentLevel: classification.judgmentLevel,
      evidenceLevel: classification.evidenceLevel,
      confidence: classification.confidence,
    },
    shouldNotInfer: [...classification.shouldNotInfer],
    strengthSignals: [...classification.strengthSignals],
    riskSignals: [...classification.riskSignals],
    improvementQuestions: [],
    missingEvidence: [],
    rewriteFocus: [],
    upgradePath: "not_applicable",
    appliedToCareerProfile: false,
  };
}

function adminSupportPlan(classification) {
  const plan = basePlan(classification);
  plan.upgradePath = "admin_support_to_accounting_ownership_if_evidence_exists";
  plan.missingEvidence = [
    "account_reconciliation_scope",
    "variance_or_abnormal_item_analysis",
    "adjusting_entry_judgment",
    "monthly_close_responsibility",
    "audit_or_external_accountant_response",
  ];
  plan.improvementQuestions = [
    "정해진 양식에 입력만 한 것인지, 계정/거래 차이를 직접 대사하거나 검토했는지 확인하세요.",
    "비정상 금액이나 전월 대비 차이를 발견하고 조정 전표 필요 여부를 판단한 경험이 있나요?",
    "외부 회계법인, 세무사, 대표 등에게 월마감 이슈나 재무 영향을 설명한 적이 있나요?",
    "본인이 최종 검토 책임자였는지, 상급자 검토 전 보조 자료를 준비한 것인지 구분하세요.",
  ];
  plan.rewriteFocus = [
    "단순 입력/정리라면 거래처·증빙·누락 관리 정확성을 강조",
    "회계 판단이 있었다면 계정 대사, 차이 분석, 조정 판단, 감사 대응 근거를 추가",
    "검토자/보고 대상/결과 활용처를 명시",
  ];
  return plan;
}

function seniorAccountingPlan(classification) {
  const plan = basePlan(classification);
  plan.upgradePath = "already_senior_accounting_evidence_present";
  plan.missingEvidence = [];
  plan.improvementQuestions = [
    "결산 검토 범위가 특정 계정인지 전체 월마감인지 구체화하세요.",
    "조정 전표 판단, 감사 대응, 재무 영향 설명 중 실제 본인이 주도한 범위를 수치나 사례로 보강하세요.",
    "검토 결과가 의사결정이나 감사 대응에 어떻게 사용됐는지 연결하세요.",
  ];
  plan.rewriteFocus = [
    "계정 대사와 결산 검토를 중심 동사로 배치",
    "분석 결과와 조정 판단을 구체화",
    "보고 대상과 재무 영향도를 함께 제시",
  ];
  return plan;
}

function financeAnalysisPlan(classification) {
  const plan = basePlan(classification);
  plan.upgradePath = "finance_analysis_decision_support";
  plan.missingEvidence = ["actual_business_decision_outcome", "forecast_accuracy_or_follow_up", "pnl_ownership_scope"];
  plan.improvementQuestions = [
    "예측 모델이 어떤 의사결정에 사용됐는지 명시하세요.",
    "시나리오별 가정, 민감도, 리스크 요인을 직접 설계했는지 확인하세요.",
    "예측 결과와 실제 결과를 추적했거나 예산/목표 조정에 반영한 사례가 있나요?",
  ];
  plan.rewriteFocus = [
    "단순 엑셀 모델이 아니라 가정·시나리오·의사결정 지원 구조를 강조",
    "경영진 또는 영업/재무 의사결정에 연결된 결과를 추가",
  ];
  return plan;
}

function hrOperationsPlan(classification) {
  const plan = basePlan(classification);
  plan.upgradePath = "hr_operations_depth_if_policy_or_process_evidence_exists";
  plan.missingEvidence = ["payroll_policy_judgment", "labor_law_or_rule_interpretation", "process_owner_scope"];
  plan.improvementQuestions = [
    "근태/급여 자료를 단순 취합했는지, 규정 해석이나 예외 판단까지 했는지 구분하세요.",
    "노무사무소나 리더에게 전달하기 전 어떤 오류를 발견하고 수정했는지 사례가 있나요?",
    "반복 오류를 줄이기 위해 양식이나 프로세스를 개선한 경험이 있나요?",
  ];
  plan.rewriteFocus = [
    "근태/급여 기초자료의 정확성, 누락 확인, 부서별 follow-up을 강조",
    "정책 판단을 했다는 근거가 없다면 노동법/급여정책 오너십으로 과대표현하지 않기",
  ];
  return plan;
}

function productOperationsPlan(classification) {
  const plan = basePlan(classification);
  plan.upgradePath = "product_ops_to_product_planning_if_requirement_ownership_exists";
  plan.missingEvidence = ["experiment_design_depth", "requirement_definition_scope", "post_release_metric_change"];
  plan.improvementQuestions = [
    "퍼널 리포트를 만든 뒤 어떤 개선안을 제안했고 실제 반영됐는지 확인하세요.",
    "온보딩 문구, 알림 타이밍, 화면 개선 등 요구사항을 직접 정의했나요?",
    "배포 후 전환율이나 이탈률 변화를 추적한 수치가 있나요?",
  ];
  plan.rewriteFocus = [
    "리포트 작성보다 문제 발견→개선 제안→배포 후 추적 흐름을 강조",
    "제품팀과 논의한 의사결정 포인트를 추가",
  ];
  return plan;
}

function ambiguousPlan(classification) {
  const plan = basePlan(classification);
  plan.upgradePath = "clarification_required_before_role_or_seniority_claim";
  plan.missingEvidence = [
    "domain_context",
    "decision_authority",
    "judgment_evidence",
    "stakeholder_or_review_structure",
    "impact_or_usage_context",
  ];
  plan.improvementQuestions = [
    "이 엑셀 자료가 어떤 업무 목적에 쓰였는지 먼저 명확히 하세요.",
    "정해진 양식 입력인지, 직접 분석/판단한 것인지 구분하세요.",
    "이 자료를 누가 검토했고 어떤 의사결정에 사용했는지 확인하세요.",
    "회계, 재무분석, HR, 제품운영 중 어떤 직무 맥락인지 근거를 추가하세요.",
  ];
  plan.rewriteFocus = [
    "엑셀 사용 자체보다 업무 목적, 판단 범위, 결과 활용처를 추가",
    "근거가 없으면 시니어 역량이나 도메인 전문성을 단정하지 않기",
  ];
  return plan;
}

export function buildOwnershipImprovementPlan(input = {}) {
  const classification = input.classification ?? classifyOwnershipSeniority(input);

  if (classification.roleFamily === "accounting_admin") return adminSupportPlan(classification);
  if (classification.roleFamily === "accounting_finance") return seniorAccountingPlan(classification);
  if (classification.roleFamily === "finance_analysis") return financeAnalysisPlan(classification);
  if (classification.roleFamily === "hr_operations") return hrOperationsPlan(classification);
  if (classification.roleFamily === "product_operations") return productOperationsPlan(classification);
  if (
    classification.roleFamily === "unknown_admin_support" ||
    includesAny(classification.riskSignals, ["insufficient_ownership_evidence", "domain_context_missing"])
  ) {
    return ambiguousPlan(classification);
  }

  return basePlan(classification);
}
