const trace = (signal, sourceText, sourceIndex = 0) => ({
  sourceText,
  sourceField: "description",
  sourceIndex,
  reasonCode: `explicit_${signal}`,
});

const strength = (signal, roleFamily, sourceText, sourceIndex = 0) => ({
  signal,
  roleFamily,
  evidenceConfidence: "explicit",
  ownershipLevel: "lead",
  judgmentLevel: "high",
  sourceTraces: [trace(signal, sourceText, sourceIndex)],
  canApplyToCareerProfile: true,
});

export const profileIntegrationContractCases = Object.freeze([
  {
    id: "explicit_pm_contract",
    controlledOutput: {
      candidateStrengthSignals: [
        strength("problem_definition", "product_planning_pm", "문제 정의 후 결제 이탈 원인을 정리했다.", 0),
        strength("requirements_definition", "product_planning_pm", "요구사항 정의, PRD 작성, 사용자 스토리 정리를 담당했다.", 1),
        strength("prioritization", "product_planning_pm", "우선순위 결정을 담당했다.", 1),
        strength("cross_functional_collaboration", "product_planning_pm", "개발/디자인 협업으로 배포 범위를 조율했다.", 2),
        strength("post_release_monitoring", "product_planning_pm", "배포 후 지표 모니터링을 수행했다.", 2),
      ],
      candidateRiskSignals: [],
      missingEvidence: [],
      contradictedSignals: [],
      integrationStatus: "read_only_candidate",
      appliedToCareerProfile: false,
    },
    expected: {
      eligibleStrengthSignals: [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ],
      riskSignals: [],
      missingEvidence: [],
    },
  },
  {
    id: "weak_pm_contract",
    controlledOutput: {
      candidateStrengthSignals: [],
      candidateRiskSignals: [
        {
          signal: "product_ownership_unclear",
          reasonCode: "contradicted_prioritization",
          sourceTraces: [trace("prioritization", "우선순위 결정은 PM이 담당했다.", 1)],
          canApplyToCareerProfile: false,
        },
      ],
      missingEvidence: [
        {
          signal: "requirements_definition",
          reasonCode: "missing_required_signal",
          clarificationQuestion: "요구사항이나 PRD 중 직접 정의한 것은 무엇인가요?",
        },
        {
          signal: "post_release_monitoring",
          reasonCode: "missing_required_signal",
          clarificationQuestion: "배포 후 어떤 지표를 모니터링했나요?",
        },
      ],
      contradictedSignals: [
        {
          signal: "prioritization",
          reasonCode: "contradicted_prioritization",
          sourceTraces: [trace("prioritization", "우선순위 결정은 PM이 담당했다.", 1)],
        },
      ],
      integrationStatus: "read_only_candidate",
      appliedToCareerProfile: false,
    },
    expected: {
      forbiddenStrengthSignals: ["requirements_definition", "prioritization", "post_release_monitoring"],
      riskSignals: ["product_ownership_unclear"],
      missingIncludes: ["requirements_definition", "post_release_monitoring"],
    },
  },
  {
    id: "explicit_data_contract",
    controlledOutput: {
      candidateStrengthSignals: [
        strength("metric_definition", "data_analysis", "지표 정의와 리텐션 KPI 정의를 수행했다.", 0),
        strength("sql_query_design", "data_analysis", "SQL 쿼리를 직접 작성했다.", 0),
        strength("root_cause_analysis", "data_analysis", "전환율 하락 원인 분석을 수행했다.", 1),
        strength("dashboard_design", "data_analysis", "대시보드 설계를 담당했다.", 1),
        strength("decision_support", "data_analysis", "의사결정 지원 회의에 분석 결과를 제공했다.", 1),
      ],
      candidateRiskSignals: [],
      missingEvidence: [],
      contradictedSignals: [],
      integrationStatus: "read_only_candidate",
      appliedToCareerProfile: false,
    },
    expected: {
      eligibleStrengthSignals: [
        "metric_definition",
        "sql_query_design",
        "root_cause_analysis",
        "dashboard_design",
        "decision_support",
      ],
      requireSourceTraces: true,
    },
  },
  {
    id: "weak_sql_contract",
    controlledOutput: {
      candidateStrengthSignals: [],
      candidateRiskSignals: [
        {
          signal: "data_analysis_overclaim_risk",
          reasonCode: "contradicted_metric_definition",
          sourceTraces: [trace("metric_definition", "지표 정의는 데이터팀이 수행했다.", 1)],
          canApplyToCareerProfile: false,
        },
      ],
      missingEvidence: [
        {
          signal: "root_cause_analysis",
          reasonCode: "missing_required_signal",
          clarificationQuestion: "어떤 원인을 분석했고 결론은 무엇이었나요?",
        },
        {
          signal: "decision_support",
          reasonCode: "missing_required_signal",
          clarificationQuestion: "분석 결과가 어떤 의사결정을 지원했나요?",
        },
      ],
      contradictedSignals: [
        {
          signal: "metric_definition",
          reasonCode: "contradicted_metric_definition",
          sourceTraces: [trace("metric_definition", "지표 정의는 데이터팀이 수행했다.", 1)],
        },
      ],
      integrationStatus: "read_only_candidate",
      appliedToCareerProfile: false,
    },
    expected: {
      forbiddenStrengthSignals: ["metric_definition", "sql_query_design", "dashboard_design"],
      riskSignals: ["data_analysis_overclaim_risk"],
      missingIncludes: ["root_cause_analysis", "decision_support"],
    },
  },
  {
    id: "ambiguous_excel_contract",
    controlledOutput: {
      candidateStrengthSignals: [],
      candidateRiskSignals: [
        {
          signal: "insufficient_ownership_evidence",
          reasonCode: "insufficient_ownership_evidence",
          sourceTraces: [],
          canApplyToCareerProfile: false,
        },
      ],
      missingEvidence: [
        {
          signal: "ownership_scope",
          reasonCode: "missing_required_signal",
          clarificationQuestion: "이 자료 정리에서 직접 판단하거나 개선한 부분이 있었나요?",
        },
      ],
      contradictedSignals: [],
      integrationStatus: "read_only_candidate",
      appliedToCareerProfile: false,
    },
    expected: {
      eligibleStrengthSignals: [],
      riskSignals: ["insufficient_ownership_evidence"],
      missingIncludes: ["ownership_scope"],
    },
  },
  {
    id: "source_required_contract",
    controlledOutput: {
      candidateStrengthSignals: [
        {
          signal: "requirements_definition",
          roleFamily: "product_planning_pm",
          evidenceConfidence: "explicit",
          ownershipLevel: "lead",
          judgmentLevel: "high",
          sourceTraces: [],
          canApplyToCareerProfile: true,
        },
      ],
      candidateRiskSignals: [],
      missingEvidence: [],
      contradictedSignals: [],
      integrationStatus: "read_only_candidate",
      appliedToCareerProfile: false,
    },
    expected: {
      blockedStrengthSignals: ["requirements_definition"],
      blockedStatus: "missing_required_evidence",
    },
  },
]);
