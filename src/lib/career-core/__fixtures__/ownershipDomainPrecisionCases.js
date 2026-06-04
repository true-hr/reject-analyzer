export const ownershipDomainPrecisionCases = Object.freeze([
  {
    id: "domain_precision_01_sales_proposal_formatting_not_sales_lead",
    title: "제안서 편집이지만 영업 리드가 아닌 케이스",
    resumeInput: {
      roleTitle: "영업지원 담당자",
      artifact: "고객사 제안서 파일",
      description: [
        "영업 담당자가 작성한 고객사 제안서의 표지와 회사 소개 자료를 취합",
        "정해진 양식에 맞춰 가격표와 일정표를 붙여넣고 오탈자를 확인",
        "고객 미팅, 가격 협상, 수주 전략 수립은 담당하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "sales_manager_review",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["sales_lead", "proposal_strategy", "revenue_ownership"],
    },
  },
  {
    id: "domain_precision_02_sns_posting_not_growth_strategy",
    title: "SNS 업로드 운영이지만 그로스 전략이 아닌 케이스",
    resumeInput: {
      roleTitle: "마케팅 운영 보조",
      artifact: "SNS 업로드 캘린더",
      description: [
        "정해진 콘텐츠를 일정에 맞춰 인스타그램과 블로그에 업로드",
        "게시 후 좋아요 수와 댓글 수를 엑셀에 기록",
        "캠페인 전략, 예산 집행, 소재 실험 설계는 담당하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "marketing_manager_review",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["growth_strategy", "campaign_owner", "performance_marketing"],
    },
  },
  {
    id: "domain_precision_03_customer_inquiry_routing_not_cx_planning",
    title: "고객 문의 배정이지만 CX 기획이 아닌 케이스",
    resumeInput: {
      roleTitle: "고객지원 담당자",
      artifact: "문의 배정 현황표",
      description: [
        "고객 문의를 유형별로 분류해 담당 부서에 전달",
        "처리 상태를 엑셀로 업데이트하고 미처리 건을 재확인",
        "고객 여정 개선안, 상담 정책 설계, VOC 분석 리포트 작성은 담당하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "cx_manager_review",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["cx_strategy", "service_planning", "voc_analysis_owner"],
    },
  },
  {
    id: "domain_precision_04_sql_export_not_data_analyst",
    title: "SQL 추출이지만 데이터 분석가가 아닌 케이스",
    resumeInput: {
      roleTitle: "운영지원 담당자",
      artifact: "SQL 추출 데이터 엑셀",
      description: [
        "정해진 SQL 쿼리를 실행해 주문 데이터를 내려받음",
        "추출한 데이터를 엑셀 양식에 붙여넣고 담당자에게 전달",
        "분석 쿼리 작성, 지표 정의, 원인 분석, 대시보드 설계는 담당하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "data_analyst_review",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["data_analyst", "metric_definition", "dashboard_owner"],
    },
  },
  {
    id: "domain_precision_05_requirements_forwarding_not_pm_ownership",
    title: "요구사항 전달이지만 PM 오너십이 아닌 케이스",
    resumeInput: {
      roleTitle: "서비스 운영 담당자",
      artifact: "개선 요청 목록",
      description: [
        "고객과 운영팀이 요청한 개선사항을 목록으로 정리",
        "정리한 내용을 개발팀에 전달하고 처리 상태를 업데이트",
        "문제 정의, 우선순위 결정, 정책 설계, 배포 범위 결정은 담당하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "pm_review_required",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["product_ownership", "requirements_definition", "roadmap_ownership"],
    },
  },
]);
