export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "MANAGEMENT_ACCOUNTING",
  aliases: [
    "관리회계",
    "Management Accounting",
    "Managerial Accounting",
    "FP&A",
    "Financial Planning and Analysis",
    "재무기획",
    "재무분석",
    "손익관리",
    "P&L 관리",
    "사업부 손익관리",
    "비용관리",
    "원가관리",
    "예산관리",
    "Budgeting",
    "Forecasting",
    "사업계획 수립",
    "경영계획",
    "재무계획",
    "실적 분석",
    "variance analysis",
    "비즈니스 파트너 재무",
    "Finance Business Partner"
  ],
  families: [
    {
      id: "planning_budgeting",
      label: "계획·예산 수립",
      aliases: [
        "예산 수립",
        "사업계획",
        "budget planning",
        "forecasting",
        "경영계획",
        "annual planning",
        "rolling forecast"
      ],
      strongSignals: [
        "연간 예산 수립과 분기/월 forecast를 직접 작성한다",
        "사업부 또는 전사 손익 계획을 수립하고 가정값을 정의한다",
        "매출, 비용, 투자 계획을 모델링하고 시나리오를 만든다",
        "각 조직의 예산 요청을 취합하고 조정한다",
        "경영진 보고용 계획 자료를 작성한다"
      ],
      mediumSignals: [
        "재무 가정(성장률, 마진율 등)을 설정하고 업데이트한다",
        "예산 대비 실적을 비교하기 위한 기준을 정의한다",
        "사업부와 협업하여 계획 수치를 조율한다",
        "주기적으로 forecast를 업데이트한다"
      ],
      boundarySignals: [
        "실적 마감, 계정 정합성, 회계 처리 중심이면 재무회계 경계로 이동한다",
        "실적 분석과 variance 해석 비중이 커지면 performance analysis family로 읽힌다",
        "개별 제품/공정 단위 원가 계산 비중이 커지면 cost accounting family로 이동한다",
        "단순 데이터 취합보다 전략적 가정 설정과 의사결정 지원이 약하면 reporting 중심으로 읽힌다"
      ],
      adjacentFamilies: [
        "performance_analysis",
        "cost_accounting",
        "financial_accounting"
      ],
      boundaryNote: "계획·예산 수립은 미래 가정과 시나리오를 기반으로 숫자를 만드는 역할입니다. 반면 과거 실적 분석이나 회계 마감 비중이 커지면 다른 관리회계 또는 재무회계 영역으로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 사업계획과 예산을 수립하고 미래 성과를 예측하는 성격이 강합니다. 반면 실적 분석이나 원가 계산 비중이 커지면 다른 관리회계 경계로 읽힐 수 있습니다."
    },
    {
      id: "performance_analysis",
      label: "실적 분석·손익관리",
      aliases: [
        "실적 분석",
        "손익 분석",
        "P&L 분석",
        "variance analysis",
        "경영분석",
        "사업부 손익관리",
        "financial analysis",
        "performance management"
      ],
      strongSignals: [
        "예산 대비 실적 차이를 분석하고 원인을 설명한다",
        "사업부별 손익(P&L)을 관리하고 리포트를 작성한다",
        "매출, 비용, 마진 구조를 분석해 인사이트를 도출한다",
        "월별/분기별 실적 리뷰 자료를 경영진에 보고한다",
        "데이터를 기반으로 개선 포인트를 제안한다"
      ],
      mediumSignals: [
        "비용 증가/감소 요인을 항목별로 분해한다",
        "지표(KPI) 기반으로 사업 성과를 해석한다",
        "현업과 협업하여 수치의 의미를 검증한다",
        "반복적인 리포트 작성과 ad-hoc 분석 요청을 처리한다"
      ],
      boundarySignals: [
        "미래 계획 수립과 forecast 비중이 커지면 planning family로 이동한다",
        "개별 원가 요소와 제조/서비스 단위 비용 계산이 중심이면 cost accounting family로 이동한다",
        "회계 기준에 따른 정확한 숫자 산출과 마감 책임이 핵심이면 재무회계로 이동한다",
        "데이터 수집과 단순 리포팅 비중이 높고 해석이 약하면 reporting support 성격으로 읽힌다"
      ],
      adjacentFamilies: [
        "planning_budgeting",
        "cost_accounting",
        "financial_accounting"
      ],
      boundaryNote: "실적 분석·손익관리는 숫자의 의미를 해석하고 설명하는 데 초점이 있습니다. 반면 계획 수립이나 원가 계산, 회계 처리 비중이 커지면 각각 다른 영역으로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 실적 데이터를 분석하고 손익 구조를 해석해 의사결정을 지원하는 성격이 강합니다. 반면 계획 수립이나 원가 계산 비중이 커지면 다른 관리회계 경계로 읽힐 수 있습니다."
    },
    {
      id: "cost_accounting",
      label: "원가관리",
      aliases: [
        "원가관리",
        "cost accounting",
        "product costing",
        "제조원가",
        "서비스 원가",
        "표준원가",
        "actual costing",
        "원가 분석"
      ],
      strongSignals: [
        "제품 또는 서비스 단위의 원가를 계산한다",
        "재료비, 노무비, 제조간접비 등 원가 요소를 분해한다",
        "표준원가와 실제원가 차이를 분석한다",
        "원가 절감 기회를 식별하고 개선안을 제시한다",
        "생산/운영 데이터와 연계해 원가 구조를 관리한다"
      ],
      mediumSignals: [
        "원가 배부 기준을 설정하고 검증한다",
        "재고, 생산량, 가동률과 원가 간 관계를 분석한다",
        "공정별 또는 제품군별 수익성을 비교한다",
        "원가 관련 시스템 데이터를 점검한다"
      ],
      boundarySignals: [
        "전사 손익과 사업부 P&L 중심 분석이면 performance analysis family로 이동한다",
        "예산 수립과 forecast 중심이면 planning family로 이동한다",
        "회계 기준에 따른 재고 평가, 원가 계정 처리 비중이 크면 재무회계 경계로 이동한다",
        "운영 데이터 분석보다 전략적 의사결정 지원이 강조되면 FP&A 쪽으로 읽힌다"
      ],
      adjacentFamilies: [
        "performance_analysis",
        "planning_budgeting",
        "financial_accounting"
      ],
      boundaryNote: "원가관리는 비용 구조를 세분화해 계산하는 데 초점이 있습니다. 반면 전사 손익 분석이나 계획 수립 비중이 커지면 다른 관리회계 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 제품이나 서비스 단위의 원가를 계산하고 비용 구조를 관리하는 성격이 강합니다. 반면 전사 손익 분석이나 계획 수립 비중이 커지면 다른 관리회계 경계로 읽힐 수 있습니다."
    },
    {
      id: "finance_business_partnering",
      label: "사업부 재무 파트너링",
      aliases: [
        "Finance Business Partner",
        "재무 BP",
        "사업부 재무",
        "비즈니스 파트너 재무",
        "FP&A BP",
        "사업 지원 재무"
      ],
      strongSignals: [
        "특정 사업부 또는 조직과 밀착해 재무 의사결정을 지원한다",
        "사업 전략, 투자, 비용 집행에 대해 재무 관점에서 의견을 제시한다",
        "현업과 함께 KPI를 설정하고 성과를 관리한다",
        "재무 데이터 기반으로 사업 방향에 대한 인사이트를 제공한다",
        "단순 리포팅이 아니라 의사결정 회의에 참여한다"
      ],
      mediumSignals: [
        "현업과 상시 커뮤니케이션하며 재무 이슈를 조율한다",
        "사업 성과와 재무 수치를 연결해 설명한다",
        "비정형 분석 요청과 ad-hoc 대응이 많다",
        "재무 언어를 비즈니스 언어로 번역한다"
      ],
      boundarySignals: [
        "계획 수립과 숫자 모델링 비중이 중심이면 planning family로 이동한다",
        "실적 리포트 작성과 분석 비중이 중심이면 performance analysis family로 이동한다",
        "회계 처리, 마감, 계정 관리 책임이 커지면 재무회계로 이동한다",
        "단순 데이터 제공 수준에 머무르면 파트너링 성격이 약해진다"
      ],
      adjacentFamilies: [
        "planning_budgeting",
        "performance_analysis",
        "financial_accounting"
      ],
      boundaryNote: "사업부 재무 파트너링은 숫자 자체보다 의사결정 지원과 커뮤니케이션이 핵심입니다. 반면 분석이나 계획 수립에만 집중하면 다른 관리회계 family로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 사업부와 밀착해 재무 관점에서 의사결정을 지원하는 성격이 강합니다. 반면 단순 분석이나 계획 수립 비중이 커지면 다른 관리회계 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "fpna_analyst",
      label: "FP&A Analyst",
      aliases: [
        "FP&A Analyst",
        "재무분석가",
        "Financial Analyst",
        "경영분석 담당"
      ],
      family: "performance_analysis",
      responsibilityHints: [
        "실적 데이터를 분석하고 리포트를 작성한다",
        "예산 대비 차이를 설명한다",
        "경영진 보고 자료를 준비한다"
      ],
      levelHints: [
        "정해진 리포트 구조에 따라 분석을 수행한다",
        "데이터 해석과 인사이트 도출 비중이 점차 증가한다"
      ]
    },
    {
      id: "budget_planner",
      label: "Budget Planner",
      aliases: [
        "예산 담당",
        "재무기획 담당",
        "Budget Analyst",
        "Planning Analyst"
      ],
      family: "planning_budgeting",
      responsibilityHints: [
        "연간 예산과 forecast를 수립한다",
        "사업부와 협업해 계획 수치를 조정한다",
        "재무 가정을 설정한다"
      ],
      levelHints: [
        "초기에는 데이터 취합과 모델 업데이트 중심",
        "경험이 쌓일수록 가정 설정과 시나리오 설계 비중이 커진다"
      ]
    },
    {
      id: "cost_accountant",
      label: "Cost Accountant",
      aliases: [
        "원가회계 담당",
        "Cost Accountant",
        "원가 분석가"
      ],
      family: "cost_accounting",
      responsibilityHints: [
        "제품/서비스 원가를 계산한다",
        "원가 요소를 분해하고 분석한다",
        "원가 절감 기회를 제안한다"
      ],
      levelHints: [
        "정형화된 원가 계산부터 시작",
        "복잡한 배부 기준과 구조 설계까지 확장"
      ]
    },
    {
      id: "finance_business_partner",
      label: "Finance Business Partner",
      aliases: [
        "Finance BP",
        "사업부 재무 담당",
        "비즈니스 파트너 재무"
      ],
      family: "finance_business_partnering",
      responsibilityHints: [
        "사업부 의사결정에 재무 관점으로 참여한다",
        "성과 지표를 함께 관리한다",
        "재무 데이터를 기반으로 방향성을 제시한다"
      ],
      levelHints: [
        "초기에는 분석 지원 중심",
        "상위 레벨에서는 전략적 의사결정 파트너 역할 수행"
      ]
    },
    {
      id: "fpna_manager",
      label: "FP&A Manager",
      aliases: [
        "FP&A Manager",
        "재무기획 매니저",
        "경영기획 매니저"
      ],
      family: "planning_budgeting",
      responsibilityHints: [
        "전사 또는 사업부 계획 수립을 리드한다",
        "분석과 계획 기능을 통합 관리한다",
        "경영진과 직접 커뮤니케이션한다"
      ],
      levelHints: [
        "개별 분석보다 전체 프로세스와 기준을 관리",
        "조직 간 조율과 의사결정 영향력이 커진다"
      ]
    }
  ],
  axes: [
    {
      axisId: "time_orientation",
      label: "시간 지향성",
      values: [
        "과거 실적 분석 중심",
        "현재 손익 관리 중심",
        "미래 계획 및 예측 중심"
      ]
    },
    {
      axisId: "granularity",
      label: "분석 단위",
      values: [
        "전사 또는 사업부 단위",
        "제품/서비스 단위",
        "계정 및 세부 비용 항목 단위"
      ]
    },
    {
      axisId: "decision_involvement",
      label: "의사결정 관여도",
      values: [
        "데이터 제공 및 리포팅 중심",
        "분석과 해석 제공",
        "의사결정 직접 참여 및 제안"
      ]
    },
    {
      axisId: "work_nature",
      label: "업무 성격",
      values: [
        "정형화된 리포트 및 반복 분석",
        "모델링 및 시나리오 설계",
        "비정형 문제 해결 및 커뮤니케이션 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "financial_accounting",
    "corporate_strategy",
    "data_analysis",
    "operations_management"
  ],
  boundaryHints: [
    "회계 기준에 따른 정확한 숫자 산출과 마감 책임이 커지면 재무회계로 이동합니다.",
    "사업 전략 수립과 시장 분석 비중이 커지면 전략기획 쪽으로 읽힙니다.",
    "데이터 처리와 모델링 자체가 목적이 되면 데이터 분석 직무로 경계가 이동합니다.",
    "현업 의사결정 참여보다 리포트 작성과 숫자 관리가 중심이면 관리회계 내 분석 역할로 읽힙니다.",
    "제품 단위 원가 계산이 많아지면 원가관리 쪽으로, 전사 계획 수립이 많아지면 FP&A 쪽으로 이동합니다."
  ],
  summaryTemplate: "관리회계는 숫자를 통해 사업 성과를 이해하고 의사결정을 지원하는 성격이 강합니다. 같은 관리회계 안에서도 계획 수립, 실적 분석, 원가 계산, 사업 파트너링 중 어디에 집중하느냐에 따라 역할 해석이 달라집니다. 반면 회계 처리나 전략 수립 비중이 커지면 다른 직무 경계로 읽힐 수 있습니다."
};
