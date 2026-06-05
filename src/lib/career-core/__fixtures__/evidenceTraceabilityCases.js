export const evidenceTraceabilityCases = Object.freeze([
  {
    id: "explicit_pm_trace",
    input: {
      roleTitle: "서비스 기획 PM",
      artifact: "요구사항 정의 문서",
      description: [
        "결제 이탈 문제 정의 후 정책/플로우 설계 방향을 정리했다.",
        "요구사항 정의, PRD 작성, 사용자 스토리 정리와 우선순위 결정을 담당했다.",
        "개발/디자인 협업으로 배포 범위를 조율하고 배포 후 지표 모니터링을 수행했다.",
      ],
    },
    options: {
      domain: "product_planning_pm",
    },
    expected: {
      tracedSignals: ["requirements_definition", "prioritization", "post_release_monitoring"],
      missingSignals: [],
      sourceIndexBySignal: {
        requirements_definition: 1,
        prioritization: 1,
        post_release_monitoring: 2,
      },
    },
  },
  {
    id: "explicit_data_trace",
    input: {
      roleTitle: "데이터 분석 담당",
      artifact: "지표 및 대시보드 설계 문서",
      description: [
        "지표 정의와 리텐션 KPI 정의를 수행하고 SQL 쿼리를 직접 작성했다.",
        "전환율 하락 원인 분석 후 대시보드 설계와 의사결정 지원을 제공했다.",
      ],
    },
    options: {
      domain: "data_analysis",
    },
    expected: {
      tracedSignals: [
        "metric_definition",
        "sql_query_design",
        "root_cause_analysis",
        "dashboard_design",
        "decision_support",
      ],
      missingSignals: [],
    },
  },
  {
    id: "weak_sales_trace",
    input: {
      roleTitle: "영업지원 담당",
      artifact: "고객사 제안서 파일",
      description: [
        "고객사 제안서 파일 정리와 가격표 붙여넣기를 수행했다.",
        "협상, 전략, 수주 담당하지 않음.",
      ],
    },
    options: {
      domain: "sales",
    },
    expected: {
      tracedSignals: ["customer_problem_discovery", "proposal_strategy", "commercial_negotiation"],
      contradictedOneOf: ["proposal_strategy", "commercial_negotiation", "revenue_ownership"],
      noExplicitSignals: ["proposal_strategy", "commercial_negotiation", "revenue_ownership"],
    },
  },
  {
    id: "mixed_cx_trace",
    input: {
      roleTitle: "CX 운영 담당",
      artifact: "VOC 검토 메모",
      description: [
        "VOC 분석 리포트를 검토했지만 직접 작성하지 않음.",
        "문의 유형은 분류했으나 상담 정책 개선은 리더가 담당.",
      ],
    },
    options: {
      domain: "cx_strategy",
    },
    expected: {
      tracedSignals: ["voc_analysis", "support_policy_improvement"],
      contradictedSignals: ["voc_analysis", "support_policy_improvement"],
      missingSignalsIncludes: ["customer_journey_diagnosis"],
    },
  },
  {
    id: "ambiguous_excel_trace",
    input: {
      roleTitle: "사무보조",
      artifact: "엑셀 자료 정리",
      description: ["엑셀 자료 정리만 수행했다."],
    },
    options: {
      signals: ["basic_data_organization", "metric_definition"],
    },
    expected: {
      tracedSignals: ["basic_data_organization"],
      missingSignalsIncludes: ["metric_definition"],
      noTraceSignals: ["metric_definition"],
    },
  },
  {
    id: "source_field_trace",
    input: {
      roleTitle: "데이터 분석 담당",
      artifact: "대시보드 설계 문서",
      description: ["SQL 직접 작성으로 분석 테이블을 만들었다."],
      context: {
        decisionAuthority: "lead",
      },
    },
    options: {
      signals: ["dashboard_design", "sql_query_design", "decision_authority"],
    },
    expected: {
      sourceFieldBySignal: {
        dashboard_design: "artifact",
        sql_query_design: "description",
        decision_authority: "context.decisionAuthority",
      },
      sourceIndexBySignal: {
        sql_query_design: 0,
      },
    },
  },
]);
