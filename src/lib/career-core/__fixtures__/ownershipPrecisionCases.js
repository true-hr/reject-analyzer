export const ownershipPrecisionCases = Object.freeze([
  {
    id: "precision_01_accounting_firm_handoff_not_close_owner",
    title: "외부 회계법인 전달이 있지만 결산 소유권은 없는 케이스",
    resumeInput: {
      roleTitle: "회계 보조",
      artifact: "회계법인 요청자료 엑셀",
      description: [
        "외부 회계법인이 요청한 세금계산서와 영수증 파일을 취합",
        "정해진 체크리스트에 맞춰 증빙 파일명과 거래처명을 정리",
        "담당 회계사가 검토할 수 있도록 폴더와 엑셀 목록을 전달",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "senior_review_required",
        accountingJudgment: "not_evidenced",
      },
    },
    expected: {
      roleFamily: "accounting_admin",
      ownershipLevel: "support",
      judgmentLevel: "low",
      seniorityLevel: "junior_support",
      evidenceLevel: "explicit",
      shouldNotInferIncludes: ["closing_ownership", "audit_response_lead", "senior_accounting_judgment"],
    },
  },
  {
    id: "precision_02_executive_share_not_finance_analysis",
    title: "경영진 공유가 있지만 재무분석은 아닌 운영 리포트 케이스",
    resumeInput: {
      roleTitle: "운영 담당자",
      artifact: "주간 운영 현황 엑셀",
      description: [
        "주간 주문 처리 건수와 고객 문의 건수를 엑셀로 취합",
        "경영진 회의 전에 운영 현황 파일을 공유",
        "전월 대비 차이 분석이나 예측 모델링은 수행하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "manager_review_required",
        accountingJudgment: "not_applicable",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["finance_analysis", "senior_ownership", "domain_expertise"],
    },
  },
  {
    id: "precision_03_sales_revenue_table_not_fpna",
    title: "매출표 정리이지만 예측/시나리오 분석은 없는 케이스",
    resumeInput: {
      roleTitle: "영업지원 담당자",
      artifact: "월별 매출 현황 엑셀",
      description: [
        "영업팀에서 전달받은 월별 매출액을 거래처별로 정리",
        "상급자 보고용 표 형식에 맞춰 금액과 담당자를 입력",
        "매출 예측, 예산 배분, 시나리오 분석은 담당하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "manager_review_required",
        accountingJudgment: "not_primary",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["finance_analysis", "accounting_finance", "senior_ownership"],
    },
  },
  {
    id: "precision_04_close_word_without_accounting_scope",
    title: "마감이라는 단어가 있지만 회계 월마감이 아닌 케이스",
    resumeInput: {
      roleTitle: "프로젝트 운영 담당자",
      artifact: "프로젝트 마감 일정표",
      description: [
        "프로젝트 마감 일정과 산출물 제출 현황을 엑셀로 정리",
        "팀별 제출 여부를 확인하고 미제출 항목을 재요청",
        "계정 대사, 회계 결산, 조정 전표 판단은 수행하지 않음",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "project_manager_review",
        accountingJudgment: "not_applicable",
      },
    },
    expected: {
      roleFamily: "unknown_admin_support",
      ownershipLevel: "support",
      judgmentLevel: "unknown",
      seniorityLevel: "unknown",
      evidenceLevel: "inferred_weak",
      shouldNotInferIncludes: ["accounting_finance", "closing_ownership", "senior_ownership"],
    },
  },
  {
    id: "precision_05_account_reconciliation_without_lead_context",
    title: "대사 업무는 있지만 리드 권한은 명확하지 않은 케이스",
    resumeInput: {
      roleTitle: "회계 담당자",
      artifact: "계정 대사 보조 파일",
      description: [
        "매출 계정 원장과 보조명세 차이를 확인",
        "차이 항목을 표시해 선임 회계 담당자에게 전달",
        "조정 전표 필요 여부는 선임 회계 담당자가 최종 판단",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "senior_decision_required",
        accountingJudgment: "partial",
      },
    },
    expected: {
      roleFamily: "accounting_finance",
      ownershipLevel: "support",
      judgmentLevel: "medium_low",
      seniorityLevel: "junior_or_mid_support",
      evidenceLevel: "explicit",
      shouldNotInferIncludes: ["audit_response_lead", "senior_accounting_judgment"],
    },
  },
]);
