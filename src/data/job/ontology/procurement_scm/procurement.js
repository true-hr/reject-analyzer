export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "PROCUREMENT",
  aliases: [
    "조달",
    "구매",
    "procurement",
    "purchasing",
    "sourcing",
    "전략 구매",
    "구매 담당",
    "조달 담당",
    "vendor sourcing",
    "supplier management",
    "구매 관리",
    "구매 기획"
  ],
  families: [
    {
      id: "STRATEGIC_SOURCING",
      label: "전략 소싱형",
      aliases: [
        "strategic sourcing",
        "category sourcing",
        "vendor sourcing"
      ],
      strongSignals: [
        "공급사 발굴 및 선정",
        "입찰 및 RFP 진행",
        "가격 및 조건 협상",
        "카테고리별 구매 전략 수립",
        "공급시장 조사 및 분석",
        "벤더 비교 및 평가",
        "장기 계약 구조 설계"
      ],
      mediumSignals: [
        "견적 비교 분석",
        "협상 자료 준비",
        "공급사 미팅 진행",
        "구매 전략 리포트 작성",
        "원가 구조 분석"
      ],
      boundarySignals: [
        "발주 및 납기 관리 비중이 커지면 운영 구매형으로 이동",
        "공급사 성과 관리 비중이 커지면 공급사 관리형으로 이동",
        "재고 및 수요 계획 연계가 강해지면 SCM/수요계획 경계로 이동"
      ],
      adjacentFamilies: [
        "PROCUREMENT_OPERATION",
        "SUPPLIER_MANAGEMENT",
        "DEMAND_SUPPLY_PLANNING"
      ],
      boundaryNote: "공급사 선정과 협상, 구매 전략 수립이 중심이면 전략 소싱형으로 읽힙니다. 반면 발주 실행이나 관리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 공급사 선정과 협상을 통해 구매 전략을 수립하는 성격이 강합니다. 반면 발주 운영이나 공급사 관리 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "PROCUREMENT_OPERATION",
      label: "구매 운영형",
      aliases: [
        "purchasing operation",
        "procurement operation",
        "구매 실행"
      ],
      strongSignals: [
        "발주 처리 및 관리",
        "납기 일정 관리",
        "구매 요청 대응",
        "구매 오더 생성 및 관리",
        "입고 일정 확인",
        "거래 조건 실행",
        "구매 시스템 입력 및 운영"
      ],
      mediumSignals: [
        "발주 데이터 정리",
        "납기 지연 대응",
        "구매 요청서 검토",
        "ERP 구매 모듈 사용",
        "내부 요청 부서 대응"
      ],
      boundarySignals: [
        "공급사 선정 및 협상 비중이 커지면 전략 소싱형으로 이동",
        "공급사 평가 및 관계 관리 비중이 커지면 공급사 관리형으로 이동",
        "재고 및 물류 흐름 관리 비중이 커지면 SCM 운영 경계로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_SOURCING",
        "SUPPLIER_MANAGEMENT",
        "SCM_OPERATION"
      ],
      boundaryNote: "발주와 납기 관리 등 실제 구매 실행 업무가 중심이면 구매 운영형으로 읽힙니다. 반면 전략이나 관계 관리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 발주와 납기 관리 등 구매 실행을 담당하는 성격이 강합니다. 반면 전략 수립이나 공급사 관리 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "SUPPLIER_MANAGEMENT",
      label: "공급사 관리형",
      aliases: [
        "supplier management",
        "vendor management",
        "SRM"
      ],
      strongSignals: [
        "공급사 성과 평가",
        "공급사 관계 관리",
        "품질/납기 KPI 관리",
        "공급사 리스크 관리",
        "정기 평가 및 개선 요청",
        "협력사 커뮤니케이션",
        "공급사 포트폴리오 관리"
      ],
      mediumSignals: [
        "공급사 데이터 관리",
        "평가 리포트 작성",
        "이슈 대응",
        "협력사 미팅",
        "개선 활동 추적"
      ],
      boundarySignals: [
        "협상 및 신규 공급사 발굴 비중이 커지면 전략 소싱형으로 이동",
        "발주 및 납기 실행 비중이 커지면 구매 운영형으로 이동",
        "품질 관리 비중이 커지면 품질관리 직무로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_SOURCING",
        "PROCUREMENT_OPERATION",
        "QUALITY_MANAGEMENT"
      ],
      boundaryNote: "기존 공급사 성과와 관계를 지속적으로 관리하는 역할이면 공급사 관리형으로 읽힙니다. 반면 신규 발굴이나 실행 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 공급사와의 관계와 성과를 관리하는 성격이 강합니다. 반면 신규 소싱이나 발주 실행 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "PROCUREMENT_PLANNING",
      label: "구매 기획/통제형",
      aliases: [
        "procurement planning",
        "purchasing planning",
        "cost control"
      ],
      strongSignals: [
        "구매 예산 수립",
        "원가 절감 계획 수립",
        "구매 정책 및 기준 설정",
        "구매 실적 분석",
        "비용 구조 분석",
        "구매 KPI 관리",
        "구매 프로세스 설계"
      ],
      mediumSignals: [
        "리포트 작성",
        "비용 데이터 분석",
        "구매 정책 문서화",
        "성과 지표 관리",
        "내부 협의"
      ],
      boundarySignals: [
        "실제 발주 및 운영 비중이 커지면 구매 운영형으로 이동",
        "공급사 협상 및 소싱 비중이 커지면 전략 소싱형으로 이동",
        "전사 재무 분석 비중이 커지면 재무기획 경계로 이동"
      ],
      adjacentFamilies: [
        "PROCUREMENT_OPERATION",
        "STRATEGIC_SOURCING",
        "FINANCIAL_PLANNING_ANALYSIS"
      ],
      boundaryNote: "구매 비용과 정책, 성과를 관리하고 통제하는 역할이면 구매 기획/통제형으로 읽힙니다. 반면 실행이나 협상 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 구매 비용과 정책을 관리하고 최적화를 설계하는 성격이 강합니다. 반면 발주 실행이나 협상 중심으로 이동하면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PROCUREMENT_MANAGER",
      label: "구매 담당자",
      aliases: [
        "procurement manager",
        "buyer"
      ],
      family: "PROCUREMENT_OPERATION",
      responsibilityHints: [
        "발주 관리",
        "납기 관리",
        "구매 요청 대응",
        "시스템 운영"
      ],
      levelHints: [
        "주니어는 발주 및 데이터 처리 중심이고",
        "시니어는 공급사 대응 및 일정 관리 책임이 커집니다"
      ]
    },
    {
      id: "SOURCING_MANAGER",
      label: "소싱 매니저",
      aliases: [
        "sourcing manager"
      ],
      family: "STRATEGIC_SOURCING",
      responsibilityHints: [
        "공급사 발굴",
        "협상 진행",
        "입찰 관리",
        "전략 수립"
      ],
      levelHints: [
        "초기에는 분석 및 지원 중심이고",
        "상위 레벨에서는 협상 주도 비중이 커집니다"
      ]
    },
    {
      id: "SUPPLIER_MANAGER",
      label: "공급사 관리 담당",
      aliases: [
        "supplier manager",
        "vendor manager"
      ],
      family: "SUPPLIER_MANAGEMENT",
      responsibilityHints: [
        "공급사 평가",
        "관계 관리",
        "성과 관리",
        "이슈 대응"
      ],
      levelHints: [
        "주니어는 데이터 관리 중심이고",
        "시니어는 관계 전략과 리스크 관리 비중이 커집니다"
      ]
    },
    {
      id: "PROCUREMENT_PLANNER",
      label: "구매 기획 담당",
      aliases: [
        "procurement planner"
      ],
      family: "PROCUREMENT_PLANNING",
      responsibilityHints: [
        "비용 분석",
        "예산 관리",
        "정책 수립",
        "성과 분석"
      ],
      levelHints: [
        "초기에는 데이터 분석 중심이고",
        "상위 레벨에서는 전사 구매 전략 기획 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "WORK_FOCUS",
      label: "업무 중심",
      values: [
        "전략/협상",
        "실행/운영",
        "관계/평가",
        "기획/통제"
      ]
    },
    {
      axisId: "TIME_ORIENTATION",
      label: "업무 시점",
      values: [
        "사전 전략 수립",
        "실시간 실행",
        "사후 평가",
        "지속적 관리"
      ]
    },
    {
      axisId: "PRIMARY_OUTPUT",
      label: "주요 산출물",
      values: [
        "계약 및 조건",
        "발주 및 납기",
        "공급사 평가",
        "비용 및 정책"
      ]
    },
    {
      axisId: "INTERACTION_SCOPE",
      label: "주요 협업 대상",
      values: [
        "외부 공급사",
        "내부 요청 부서",
        "협력사 네트워크",
        "경영/재무 조직"
      ]
    }
  ],
  adjacentFamilies: [
    "SCM",
    "물류",
    "품질관리",
    "재무기획"
  ],
  boundaryHints: [
    "공급사 발굴과 협상 비중이 커지면 전략 소싱형으로 읽힙니다.",
    "발주 처리와 납기 관리 중심이면 구매 운영형으로 해석됩니다.",
    "공급사 평가와 관계 관리 비중이 커지면 공급사 관리형으로 이동합니다.",
    "비용 분석과 정책 수립 비중이 커지면 구매 기획/통제형으로 이동합니다.",
    "재고 및 물류 흐름 관리까지 포함되면 SCM 직무로 확장될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 조직에 필요한 자원을 외부에서 확보하고 관리하는 조달 기능을 수행하는 성격이 강합니다. 전략 소싱, 운영, 공급사 관리, 기획 중 어디에 중심이 있느냐에 따라 역할이 나뉩니다. 반면 물류나 재고 관리까지 확장되면 SCM 직무로 해석될 수 있습니다."
};
