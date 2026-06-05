export const evidenceConfidenceCases = Object.freeze([
  {
    id: "explicit_sales_ownership",
    domain: "sales",
    resumeInput: {
      roleTitle: "B2B 영업 담당",
      artifact: "제안 전략 및 계약 전환 리포트",
      description: [
        "고객 문제 파악과 요구사항 직접 파악을 통해 제안 전략 구성을 주도했다.",
        "가격 협상과 도입 범위 협상을 진행하고 계약 전환과 수주 기여를 추적했다.",
      ],
    },
    expected: {
      overallEvidenceConfidence: "explicit",
      shouldDowngrade: false,
      shouldAskClarification: false,
      positiveEvidenceCount: 4,
    },
  },
  {
    id: "weak_sales_support",
    domain: "sales",
    resumeInput: {
      roleTitle: "영업지원 담당",
      artifact: "고객사 제안서 파일",
      description: [
        "고객사 제안서 파일 정리와 가격표 붙여넣기를 수행했다.",
        "협상, 전략, 수주 담당하지 않음.",
      ],
    },
    expected: {
      overallEvidenceConfidenceOneOf: ["contradicted", "inferred_weak"],
      shouldDowngrade: true,
      shouldAskClarification: true,
      contradictedEvidenceCountAtLeast: 1,
    },
  },
  {
    id: "explicit_growth_marketing",
    domain: "growth_marketing",
    resumeInput: {
      roleTitle: "그로스 마케팅 담당",
      artifact: "캠페인 실험 리포트",
      description: [
        "캠페인 가설 수립 후 소재 A/B 테스트를 설계했다.",
        "CPA 분석과 전환율 분석을 수행하고 예산 조정을 진행했다.",
      ],
    },
    expected: {
      overallEvidenceConfidence: "explicit",
      shouldDowngrade: false,
      shouldAskClarification: false,
      positiveEvidenceCount: 4,
    },
  },
  {
    id: "weak_marketing_upload",
    domain: "growth_marketing",
    resumeInput: {
      roleTitle: "마케팅 운영 보조",
      artifact: "SNS 업로드 캘린더",
      description: [
        "SNS 업로드와 좋아요 수 기록을 담당했다.",
        "전략, 예산, 실험 담당하지 않음.",
      ],
    },
    expected: {
      overallEvidenceConfidenceOneOf: ["contradicted", "inferred_weak"],
      shouldDowngrade: true,
      shouldAskClarification: true,
      contradictedEvidenceCountAtLeast: 1,
    },
  },
  {
    id: "explicit_cx_improvement",
    domain: "cx_strategy",
    resumeInput: {
      roleTitle: "CX 운영 담당",
      artifact: "VOC 개선 리포트",
      description: [
        "VOC 분석과 고객 문의 유형 분석으로 고객 여정 문제 정의를 수행했다.",
        "응대 가이드 개선 후 반복 문의 감소와 처리 시간 개선 지표를 추적했다.",
      ],
    },
    expected: {
      overallEvidenceConfidence: "explicit",
      shouldDowngrade: false,
      shouldAskClarification: false,
      positiveEvidenceCount: 4,
    },
  },
  {
    id: "weak_cx_routing",
    domain: "cx_strategy",
    resumeInput: {
      roleTitle: "고객지원 담당",
      artifact: "문의 배정 현황표",
      description: [
        "고객 문의 배정과 처리 상태 업데이트를 수행했다.",
        "VOC 분석과 정책 설계 담당하지 않음.",
      ],
    },
    expected: {
      overallEvidenceConfidenceOneOf: ["contradicted", "inferred_weak"],
      shouldDowngrade: true,
      shouldAskClarification: true,
      contradictedEvidenceCountAtLeast: 1,
    },
  },
  {
    id: "explicit_data_analysis",
    domain: "data_analysis",
    resumeInput: {
      roleTitle: "데이터 분석 담당",
      artifact: "지표 및 대시보드 문서",
      description: [
        "지표 정의와 리텐션 KPI 정의를 수행하고 SQL 쿼리를 직접 작성했다.",
        "전환율 하락 원인 분석 후 대시보드 설계와 의사결정 지원을 제공했다.",
      ],
    },
    expected: {
      overallEvidenceConfidence: "explicit",
      shouldDowngrade: false,
      shouldAskClarification: false,
      positiveEvidenceCount: 5,
    },
  },
  {
    id: "weak_sql_export",
    domain: "data_analysis",
    resumeInput: {
      roleTitle: "운영 데이터 보조",
      artifact: "SQL 데이터 다운로드 파일",
      description: [
        "정해진 SQL 실행과 데이터 다운로드만 수행했다.",
        "지표 정의는 데이터팀이 수행했고 분석과 대시보드 설계 담당하지 않음.",
      ],
    },
    expected: {
      overallEvidenceConfidence: "contradicted",
      shouldDowngrade: true,
      shouldAskClarification: true,
      contradictedEvidenceCountAtLeast: 1,
    },
  },
  {
    id: "explicit_pm_requirements",
    domain: "product_planning_pm",
    resumeInput: {
      roleTitle: "서비스 기획 PM",
      artifact: "요구사항 정의 문서",
      description: [
        "문제 정의 후 요구사항 정의, PRD 작성, 사용자 스토리 정리를 담당했다.",
        "우선순위 결정과 개발/디자인 협업을 진행하고 배포 후 지표 모니터링을 수행했다.",
      ],
    },
    expected: {
      overallEvidenceConfidence: "explicit",
      shouldDowngrade: false,
      shouldAskClarification: false,
      positiveEvidenceCount: 5,
    },
  },
  {
    id: "weak_pm_forwarding",
    domain: "product_planning_pm",
    resumeInput: {
      roleTitle: "서비스 운영 담당",
      artifact: "개선 요청 목록",
      description: [
        "개선 요청 목록 전달과 처리 상태 업데이트를 수행했다.",
        "문제 정의, 우선순위 결정, 정책/플로우 설계 담당하지 않음.",
      ],
    },
    expected: {
      overallEvidenceConfidenceOneOf: ["contradicted", "inferred_weak"],
      shouldDowngrade: true,
      shouldAskClarification: true,
      contradictedEvidenceCountAtLeast: 1,
    },
  },
  {
    id: "ambiguous_excel_only",
    domain: "admin_support",
    resumeInput: {
      roleTitle: "사무보조",
      artifact: "엑셀 자료 정리",
      description: ["엑셀 자료 정리만 수행했다."],
    },
    options: {
      signals: ["basic_data_organization"],
    },
    expected: {
      overallEvidenceConfidence: "inferred_weak",
      shouldDowngrade: true,
      shouldAskClarification: true,
      weakEvidenceCount: 1,
    },
  },
  {
    id: "mixed_positive_and_negative",
    domain: "cx_strategy",
    resumeInput: {
      roleTitle: "CX 운영 담당",
      artifact: "VOC 검토 메모",
      description: [
        "VOC 분석 리포트를 검토했지만 직접 작성하지 않음.",
        "문의 유형은 분류했으나 상담 정책 개선은 리더가 담당.",
      ],
    },
    expected: {
      overallEvidenceConfidenceOneOf: ["contradicted", "inferred_weak"],
      shouldDowngrade: true,
      shouldAskClarification: true,
      contradictedEvidenceCountAtLeast: 1,
    },
  },
]);
