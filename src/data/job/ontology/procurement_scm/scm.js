export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "SCM",
  aliases: [
    "SCM",
    "공급망관리",
    "Supply Chain Management",
    "SCM 담당",
    "SCM 매니저",
    "물류 관리",
    "재고 관리",
    "수요 공급 관리",
    "supply chain",
    "supply planner",
    "demand planner",
    "inventory management",
    "logistics planning",
    "operations planning"
  ],
  families: [
    {
      id: "DEMAND_SUPPLY_PLANNING",
      label: "수요·공급 계획",
      aliases: [
        "수요 계획",
        "공급 계획",
        "demand planning",
        "supply planning",
        "S&OP"
      ],
      strongSignals: [
        "수요 예측 데이터를 기반으로 생산 및 공급 계획 수립",
        "S&OP 프로세스를 운영하며 수요와 공급을 정렬",
        "재고 목표와 서비스 레벨을 고려해 생산·발주 계획 수립",
        "판매 계획, 생산 계획, 재고 계획을 통합 관리",
        "수요 변동에 따라 공급 계획을 조정",
        "부서 간 계획 정합성 확보를 위한 조율 수행"
      ],
      mediumSignals: [
        "예측 정확도(Forecast accuracy) 관리",
        "재고 회전율, 서비스 레벨 모니터링",
        "계획 대비 실적 차이 분석",
        "엑셀/시스템 기반 계획 모델 운영"
      ],
      boundarySignals: [
        "물류 운영, 배송, 창고 관리 비중이 커지면 물류·운영 SCM으로 이동",
        "구매 발주, 협력사 관리 비중이 커지면 구매·조달로 이동",
        "데이터 분석과 모델링 중심이면 데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "LOGISTICS_OPERATIONS",
        "SCM_STRATEGY_PROCESS",
        "PROCUREMENT"
      ],
      boundaryNote: "수요와 공급을 맞추기 위한 계획 수립과 조율이 핵심이면 수요·공급 계획으로 읽힙니다. 반면 실행 운영이나 구매 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 수요 예측과 공급 계획을 통해 전체 공급망의 균형을 맞추는 성격이 강합니다. 반면 물류 운영이나 구매 실행 비중이 커지면 다른 SCM 영역으로 읽힐 수 있습니다."
    },
    {
      id: "LOGISTICS_OPERATIONS",
      label: "물류·운영 SCM",
      aliases: [
        "물류 운영",
        "logistics",
        "distribution",
        "warehouse management",
        "fulfillment"
      ],
      strongSignals: [
        "입출고, 배송, 창고 운영 등 물류 프로세스를 직접 관리",
        "3PL 또는 물류 협력사와 운영 관리 및 성과 관리",
        "배송 리드타임, 물류 비용, 서비스 수준 관리",
        "재고 이동 및 배치 최적화",
        "운영 이슈(지연, 파손 등) 대응 및 개선",
        "현장 기반 물류 프로세스 개선 수행"
      ],
      mediumSignals: [
        "물류 KPI 관리",
        "운영 리포트 작성",
        "시스템(WMS, TMS) 활용",
        "재고 정확도 관리"
      ],
      boundarySignals: [
        "수요 예측과 계획 수립 비중이 커지면 수요·공급 계획으로 이동",
        "전사 프로세스 설계, 네트워크 전략 비중이 커지면 SCM 전략으로 이동",
        "구매 계약, 협력사 발주 중심이면 구매·조달로 이동"
      ],
      adjacentFamilies: [
        "DEMAND_SUPPLY_PLANNING",
        "SCM_STRATEGY_PROCESS",
        "PROCUREMENT"
      ],
      boundaryNote: "실제 물류 흐름과 운영을 관리하는 역할이 중심이면 물류·운영 SCM으로 읽힙니다. 반면 계획 수립이나 전략 설계 비중이 커지면 다른 SCM 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 물류 흐름과 재고 이동을 실제로 운영하고 관리하는 성격이 강합니다. 반면 계획 수립이나 전략 설계 비중이 커지면 다른 SCM 역할로 해석될 수 있습니다."
    },
    {
      id: "SCM_STRATEGY_PROCESS",
      label: "SCM 전략·프로세스",
      aliases: [
        "SCM 전략",
        "supply chain strategy",
        "SCM 기획",
        "operations strategy",
        "network design"
      ],
      strongSignals: [
        "공급망 구조 설계(창고 위치, 물류 네트워크 등)",
        "SCM 프로세스 표준화 및 개선 과제 기획",
        "비용 절감 및 효율화 전략 수립",
        "전사 공급망 KPI 체계 설계",
        "신규 사업 또는 확장 시 공급망 설계 참여",
        "시스템 도입(ERP, SCM 시스템) 기획 및 개선"
      ],
      mediumSignals: [
        "데이터 기반 프로세스 개선 제안",
        "벤치마킹 및 개선 과제 도출",
        "프로젝트 단위 운영",
        "내부 이해관계자 조율"
      ],
      boundarySignals: [
        "실제 물류 운영, 현장 관리 비중이 커지면 물류·운영 SCM으로 이동",
        "수요 예측과 계획 수립 비중이 커지면 수요·공급 계획으로 이동",
        "재무 분석, 비용 분석 중심이면 FP&A로 이동"
      ],
      adjacentFamilies: [
        "DEMAND_SUPPLY_PLANNING",
        "LOGISTICS_OPERATIONS",
        "FP_AND_A"
      ],
      boundaryNote: "공급망 구조와 프로세스를 설계하고 개선하는 역할이 중심이면 SCM 전략·프로세스로 읽힙니다. 반면 운영 실행이나 계획 수립 비중이 커지면 다른 SCM 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 공급망 구조와 운영 방식을 설계하고 개선하는 전략적 성격이 강합니다. 반면 실제 운영이나 계획 수립 비중이 커지면 다른 SCM 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "SUPPLY_PLANNER",
      label: "공급 계획 담당",
      aliases: [
        "supply planner",
        "demand planner",
        "SCM planner"
      ],
      family: "DEMAND_SUPPLY_PLANNING",
      responsibilityHints: [
        "수요 예측 기반 공급 계획 수립",
        "재고 및 생산 계획 관리",
        "S&OP 운영",
        "계획 대비 실적 분석"
      ],
      levelHints: [
        "주니어는 데이터 기반 계획 수립 보조",
        "시니어는 전체 계획 구조 설계 및 조율"
      ]
    },
    {
      id: "LOGISTICS_MANAGER",
      label: "물류 운영 담당",
      aliases: [
        "logistics manager",
        "warehouse manager",
        "fulfillment manager"
      ],
      family: "LOGISTICS_OPERATIONS",
      responsibilityHints: [
        "물류 운영 및 배송 관리",
        "재고 이동 및 창고 운영",
        "물류 KPI 관리",
        "운영 이슈 대응"
      ],
      levelHints: [
        "현장 운영 경험 중요",
        "시니어는 전체 물류 네트워크 운영 관리"
      ]
    },
    {
      id: "SCM_STRATEGY_MANAGER",
      label: "SCM 전략 담당",
      aliases: [
        "SCM strategist",
        "operations strategy manager"
      ],
      family: "SCM_STRATEGY_PROCESS",
      responsibilityHints: [
        "공급망 구조 설계",
        "프로세스 개선 프로젝트 수행",
        "비용 절감 전략 수립",
        "시스템 도입 및 개선"
      ],
      levelHints: [
        "프로젝트 기반 경험 중요",
        "시니어는 전사 공급망 전략 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "핵심 초점",
      values: [
        "수요·공급 계획",
        "물류 운영 실행",
        "전략 및 프로세스 설계"
      ]
    },
    {
      axisId: "WORK_TYPE",
      label: "업무 성격",
      values: [
        "계획 수립 및 조율",
        "현장 운영 및 관리",
        "전략 기획 및 개선"
      ]
    },
    {
      axisId: "TIME_HORIZON",
      label: "시간 관점",
      values: [
        "단기~중기 계획",
        "실시간 운영 대응",
        "중장기 구조 설계"
      ]
    }
  ],
  adjacentFamilies: [
    "PROCUREMENT",
    "FP_AND_A",
    "DATA_ANALYTICS"
  ],
  boundaryHints: [
    "수요 예측과 공급 계획 수립 비중이 높아지면 계획 중심 SCM으로 읽힙니다.",
    "물류 운영, 배송, 창고 관리 비중이 커지면 물류·운영 SCM으로 이동합니다.",
    "공급망 구조 설계와 프로세스 개선 비중이 커지면 SCM 전략으로 해석됩니다.",
    "구매 발주 및 협력사 관리 비중이 커지면 구매·조달로 이동합니다.",
    "데이터 분석과 모델링 중심이면 데이터 분석 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 공급망 전반의 흐름을 관리하는 SCM 성격이 강합니다. 다만 수요·공급 계획, 물류 운영, 전략 설계 중 어디에 중심을 두는지에 따라 실제 역할이 달라집니다. 반면 구매나 데이터 분석 중심으로 이동하면 인접 직무로 해석될 수 있습니다."
};
