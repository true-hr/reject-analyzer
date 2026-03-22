export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "FP_AND_A",
  aliases: [
    "경영분석",
    "FP&A",
    "Financial Planning and Analysis",
    "재무기획",
    "경영기획(재무)",
    "사업분석",
    "손익분석",
    "관리회계",
    "business finance",
    "finance business partner",
    "FPNA",
    "financial analyst",
    "budgeting",
    "forecasting"
  ],
  families: [
    {
      id: "PLANNING_BUDGETING",
      label: "계획·예산 중심 FP&A",
      aliases: [
        "예산 수립",
        "budgeting",
        "planning",
        "annual plan",
        "rolling forecast"
      ],
      strongSignals: [
        "연간 예산 수립 및 분기/월 단위 forecast를 직접 작성",
        "각 부서 예산 취합 후 조정 및 최종안 도출",
        "매출, 비용, 인건비 등 주요 재무 계획을 수치로 설계",
        "계획 대비 실적 차이 분석 및 재forecast 수행",
        "예산 통제 기준을 설정하고 집행 관리",
        "사업 계획 수립 과정에서 재무 수치를 중심으로 구조 설계"
      ],
      mediumSignals: [
        "부서별 예산 가이드라인 제공",
        "계획 대비 variance 리포트 작성",
        "시나리오별 손익 예측",
        "예산 관련 내부 커뮤니케이션"
      ],
      boundarySignals: [
        "실적 분석과 원인 해석, 인사이트 도출 비중이 커지면 분석 중심 FP&A로 이동",
        "사업부 의사결정 지원, 현업 밀착 협업 비중이 커지면 사업 파트너형 FP&A로 이동",
        "단순 데이터 집계, 리포팅 자동화 중심이면 회계 또는 BI로 이동"
      ],
      adjacentFamilies: [
        "ANALYSIS_INSIGHT_FPNA",
        "BUSINESS_PARTNER_FPNA",
        "ACCOUNTING"
      ],
      boundaryNote: "예산 수립과 계획 관리, forecast 운영이 핵심이면 계획·예산 중심 FP&A로 읽힙니다. 반면 분석 깊이나 사업 파트너 역할이 커지면 다른 FP&A family로 이동합니다.",
      summaryTemplate: "이 직무는 예산 수립과 forecast를 통해 회사의 재무 계획을 설계하는 성격이 강합니다. 반면 실적 분석이나 사업 의사결정 지원 비중이 커지면 다른 FP&A 역할로 읽힐 수 있습니다."
    },
    {
      id: "ANALYSIS_INSIGHT_FPNA",
      label: "분석·인사이트 중심 FP&A",
      aliases: [
        "경영분석",
        "financial analysis",
        "variance analysis",
        "손익 분석",
        "data driven finance"
      ],
      strongSignals: [
        "실적 데이터를 기반으로 매출·비용 변동 원인을 구조적으로 분석",
        "손익 구조를 분해하여 주요 드라이버를 도출",
        "경영진 보고용 분석 리포트 작성 및 인사이트 제공",
        "사업 성과를 KPI 단위로 해석하고 개선 포인트 제시",
        "데이터를 활용해 가설을 세우고 검증",
        "단순 숫자 보고가 아니라 의사결정에 필요한 해석을 제공"
      ],
      mediumSignals: [
        "정기 리포트 작성 및 대시보드 운영",
        "데이터 정합성 검증",
        "분석 모델 구축",
        "타 부서 요청 분석 지원"
      ],
      boundarySignals: [
        "예산 수립, forecast 관리 비중이 커지면 계획·예산 FP&A로 이동",
        "현업 의사결정 참여, 실행 방향 제시 비중이 커지면 사업 파트너형 FP&A로 이동",
        "데이터 추출, 리포트 자동화 비중이 커지면 BI/데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "PLANNING_BUDGETING",
        "BUSINESS_PARTNER_FPNA",
        "DATA_ANALYTICS"
      ],
      boundaryNote: "숫자를 해석해 의미 있는 인사이트를 도출하는 역할이 중심이면 분석·인사이트 FP&A로 읽힙니다. 반면 계획 수립이나 사업 파트너 역할이 커지면 다른 FP&A 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 재무 데이터를 분석해 사업 성과를 해석하고 인사이트를 제공하는 성격이 강합니다. 반면 예산 수립이나 사업 의사결정 참여 비중이 커지면 다른 FP&A 역할로 해석될 수 있습니다."
    },
    {
      id: "BUSINESS_PARTNER_FPNA",
      label: "사업 파트너형 FP&A",
      aliases: [
        "finance business partner",
        "사업부 재무",
        "BU finance",
        "commercial finance",
        "business finance"
      ],
      strongSignals: [
        "특정 사업부 또는 조직에 밀착하여 재무 관점 의사결정을 지원",
        "가격 정책, 투자, 비용 구조 등 사업 의사결정에 직접 참여",
        "사업 리더와 정기적으로 성과를 리뷰하고 방향을 제안",
        "재무 데이터 기반으로 실행 전략을 함께 설계",
        "사업 성과 개선을 위한 액션 아이템 도출",
        "단순 보고가 아니라 사업 방향에 영향"
      ],
      mediumSignals: [
        "사업부 KPI 모니터링",
        "리더 미팅 자료 준비",
        "사업 관련 재무 시뮬레이션",
        "현업과 긴밀한 커뮤니케이션"
      ],
      boundarySignals: [
        "예산 수립과 forecast 운영 비중이 커지면 계획·예산 FP&A로 이동",
        "데이터 분석과 리포트 중심이면 분석·인사이트 FP&A로 이동",
        "조직/인사 이슈 개입 비중이 커지면 HRBP로 이동"
      ],
      adjacentFamilies: [
        "PLANNING_BUDGETING",
        "ANALYSIS_INSIGHT_FPNA",
        "HRBP"
      ],
      boundaryNote: "사업부 의사결정에 직접 관여하고 재무 관점으로 방향을 제시하면 사업 파트너형 FP&A로 읽힙니다. 반면 계획 수립이나 분석 중심 역할이 커지면 다른 FP&A family로 이동합니다.",
      summaryTemplate: "이 직무는 사업부와 밀착해 재무 관점에서 의사결정을 지원하는 성격이 강합니다. 반면 예산 관리나 데이터 분석 중심 비중이 커지면 다른 FP&A 역할로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "FPNA_ANALYST",
      label: "FP&A 애널리스트",
      aliases: [
        "financial analyst",
        "FP&A analyst",
        "경영분석 담당"
      ],
      family: "ANALYSIS_INSIGHT_FPNA",
      responsibilityHints: [
        "실적 데이터 분석 및 리포트 작성",
        "variance 분석",
        "경영진 보고 자료 준비",
        "데이터 기반 인사이트 도출"
      ],
      levelHints: [
        "주니어는 데이터 정리와 기본 분석 비중이 큼",
        "시니어는 인사이트 도출과 의사결정 영향력 확대"
      ]
    },
    {
      id: "FPNA_MANAGER",
      label: "FP&A 매니저",
      aliases: [
        "FP&A manager",
        "재무기획 매니저"
      ],
      family: "PLANNING_BUDGETING",
      responsibilityHints: [
        "연간 예산 및 forecast 수립",
        "부서 예산 조정 및 통제",
        "재무 계획 관리",
        "경영 계획 수립 지원"
      ],
      levelHints: [
        "중급 이상에서 계획 수립 책임 증가",
        "시니어는 전사 재무 계획을 리딩"
      ]
    },
    {
      id: "FINANCE_BUSINESS_PARTNER",
      label: "사업부 재무 파트너",
      aliases: [
        "finance business partner",
        "business finance manager"
      ],
      family: "BUSINESS_PARTNER_FPNA",
      responsibilityHints: [
        "사업부 의사결정 지원",
        "성과 리뷰 및 전략 제안",
        "재무 시뮬레이션",
        "리더십과 협업"
      ],
      levelHints: [
        "사업 이해도가 중요",
        "시니어는 사업 전략에 직접 영향"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "핵심 초점",
      values: [
        "예산과 계획 수립",
        "데이터 분석과 인사이트",
        "사업 의사결정 지원"
      ]
    },
    {
      axisId: "WORK_MODE",
      label: "업무 방식",
      values: [
        "수치 설계와 계획 관리",
        "데이터 해석과 분석",
        "현업 협업과 전략 제안"
      ]
    },
    {
      axisId: "DECISION_PROXIMITY",
      label: "의사결정과의 거리",
      values: [
        "간접 지원 (계획/리포트 중심)",
        "분석 기반 영향",
        "직접 참여 및 공동 의사결정"
      ]
    }
  ],
  adjacentFamilies: [
    "ACCOUNTING",
    "DATA_ANALYTICS",
    "HRBP"
  ],
  boundaryHints: [
    "예산 수립과 forecast 관리 비중이 높아지면 계획·예산 FP&A로 읽힙니다.",
    "데이터 해석과 인사이트 도출 비중이 커지면 분석 중심 FP&A로 이동합니다.",
    "사업부 의사결정에 직접 관여하는 비중이 커지면 사업 파트너형 FP&A로 해석됩니다.",
    "단순 회계 처리나 결산 중심이면 회계로 이동합니다.",
    "데이터 추출과 모델링 중심이면 데이터 분석 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 재무 데이터를 기반으로 계획을 세우고 사업을 해석하는 FP&A 성격이 강합니다. 다만 예산 중심, 분석 중심, 사업 파트너 역할에 따라 실제 수행 방식이 달라집니다. 반면 회계 처리나 데이터 분석 중심으로 이동하면 인접 직무로 해석될 수 있습니다."
};
