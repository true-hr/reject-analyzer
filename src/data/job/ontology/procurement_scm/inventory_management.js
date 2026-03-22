export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "INVENTORY_MANAGEMENT",
  aliases: [
    "재고관리",
    "Inventory Management",
    "Inventory Control",
    "재고 운영",
    "재고 통제",
    "재고 최적화",
    "재고 기획",
    "Stock Management",
    "Stock Control",
    "재고 계획",
    "재고 분석",
    "Inventory Planning",
    "재고 수준 관리",
    "Safety Stock 관리",
    "적정재고 관리",
    "재고 회전 관리",
    "재고 정확도 관리",
    "Cycle Count",
    "재고 실사",
    "WMS 재고관리",
    "창고 재고관리",
    "물류 재고관리"
  ],
  families: [
    {
      id: "inventory_planning",
      label: "재고 기획·최적화",
      aliases: [
        "Inventory Planning",
        "재고 기획",
        "재고 최적화",
        "Safety Stock 설계",
        "적정재고 관리",
        "재고 정책 수립"
      ],
      strongSignals: [
        "안전재고(Safety Stock), 최소/최대 재고 기준을 설정한다",
        "수요·리드타임을 기반으로 적정 재고 수준을 설계한다",
        "재고 회전율, 재고일수(Days of Inventory)를 관리한다",
        "과잉재고, 결품을 줄이기 위한 정책을 수립한다",
        "재고 시뮬레이션이나 시나리오 분석을 수행한다"
      ],
      mediumSignals: [
        "수요 변동성과 공급 리드타임을 반영해 재고 기준을 조정한다",
        "서비스 레벨과 재고 비용 간 균형을 고려한다",
        "재고 KPI를 정의하고 지속적으로 모니터링한다",
        "재고 정책 변경 시 영향도를 분석한다"
      ],
      boundarySignals: [
        "실제 입출고 처리, 재고 이동, 창고 운영 비중이 커지면 inventory control family로 이동한다",
        "수요 예측과 공급 계획 수립 비중이 커지면 supply planning 영역으로 읽힌다",
        "데이터 분석 자체가 목적이고 운영 연결이 약하면 데이터 분석 직무로 이동한다",
        "재고 평가, 회계 처리 비중이 커지면 재무회계 또는 관리회계 경계로 이동한다"
      ],
      adjacentFamilies: [
        "inventory_control_execution",
        "inventory_accuracy_audit",
        "supply_chain_planning"
      ],
      boundaryNote: "재고 기획·최적화는 기준과 정책을 설계하는 역할입니다. 반면 실제 입출고 운영이나 실사 중심으로 이동하면 다른 재고 운영 영역으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 적정 재고 수준과 정책을 설계해 비용과 서비스 수준을 균형 있게 관리하는 성격이 강합니다. 반면 실제 입출고 운영이나 실사 비중이 커지면 다른 재고관리 경계로 읽힐 수 있습니다."
    },
    {
      id: "inventory_control_execution",
      label: "재고 운영·통제",
      aliases: [
        "Inventory Control",
        "재고 통제",
        "재고 운영",
        "입출고 관리",
        "재고 이동 관리",
        "Stock Control"
      ],
      strongSignals: [
        "입고, 출고, 반품 등 재고 이동을 시스템에 반영한다",
        "창고 간 재고 이동 및 위치 관리를 수행한다",
        "재고 부족 또는 과잉 상황을 운영적으로 대응한다",
        "WMS 또는 ERP 상 재고 데이터를 실시간으로 관리한다",
        "재고 관련 이슈(오출고, 미입고 등)를 해결한다"
      ],
      mediumSignals: [
        "입출고 데이터와 실제 재고를 맞추는 작업을 수행한다",
        "현장(창고, 물류센터)과 긴밀히 협업한다",
        "운영 기준에 따라 재고 처리 절차를 수행한다",
        "재고 관련 요청을 처리하고 조정한다"
      ],
      boundarySignals: [
        "재고 기준 설계와 정책 수립 비중이 커지면 inventory planning family로 이동한다",
        "실사, cycle count, 정확도 검증 비중이 커지면 inventory accuracy family로 이동한다",
        "운송, 배송, 물류 흐름 관리 비중이 커지면 물류 운영 영역으로 이동한다",
        "단순 입력/처리 비중이 크고 판단이 약하면 물류 오퍼레이션으로 읽힌다"
      ],
      adjacentFamilies: [
        "inventory_planning",
        "inventory_accuracy_audit",
        "logistics_operations"
      ],
      boundaryNote: "재고 운영·통제는 실제 물량 흐름을 정확하게 반영하는 것이 핵심입니다. 반면 정책 설계나 정확도 검증 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 입출고와 재고 이동을 정확하게 반영하고 운영을 통제하는 성격이 강합니다. 반면 정책 설계나 실사 중심으로 이동하면 다른 재고관리 경계로 읽힐 수 있습니다."
    },
    {
      id: "inventory_accuracy_audit",
      label: "재고 정확도·실사 관리",
      aliases: [
        "Inventory Accuracy",
        "재고 정확도 관리",
        "Cycle Count",
        "재고 실사",
        "Stock Audit",
        "재고 검증"
      ],
      strongSignals: [
        "정기 재고 실사 및 cycle count를 계획하고 수행한다",
        "시스템 재고와 실제 재고 간 차이를 분석한다",
        "재고 오차 원인을 추적하고 개선안을 도출한다",
        "재고 정확도 KPI를 관리하고 개선한다",
        "재고 손실, 분실, 오차 이슈를 관리한다"
      ],
      mediumSignals: [
        "실사 프로세스와 기준을 정의한다",
        "재고 차이에 대한 리포트를 작성한다",
        "현장과 협업해 재고 오류를 수정한다",
        "정확도 향상을 위한 운영 개선을 수행한다"
      ],
      boundarySignals: [
        "입출고 처리와 실시간 운영 대응이 중심이면 inventory control family로 이동한다",
        "재고 정책과 기준 설계 비중이 커지면 inventory planning family로 이동한다",
        "감사 대응과 통제 중심이 강화되면 내부통제/감사 영역으로 읽힌다",
        "데이터 분석 중심이고 현장 연계가 약하면 분석 직무로 이동한다"
      ],
      adjacentFamilies: [
        "inventory_control_execution",
        "inventory_planning",
        "internal_audit"
      ],
      boundaryNote: "재고 정확도·실사 관리는 시스템과 실제 재고 간 차이를 줄이는 데 초점이 있습니다. 반면 운영 처리나 정책 설계 비중이 커지면 다른 재고관리 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 재고 실사와 정확도 관리를 통해 재고 데이터 신뢰성을 확보하는 성격이 강합니다. 반면 운영 처리나 정책 설계 비중이 커지면 다른 재고관리 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "inventory_planner",
      label: "Inventory Planner",
      aliases: [
        "재고 기획 담당",
        "Inventory Planner",
        "재고 분석가"
      ],
      family: "inventory_planning",
      responsibilityHints: [
        "적정 재고 수준과 정책을 설계한다",
        "재고 KPI를 분석하고 개선한다",
        "수요와 공급을 고려한 재고 기준을 설정한다"
      ],
      levelHints: [
        "초기에는 데이터 분석과 기준 설정 보조",
        "상위 레벨에서는 정책 설계와 의사결정 영향 확대"
      ]
    },
    {
      id: "inventory_controller",
      label: "Inventory Controller",
      aliases: [
        "재고 관리자",
        "Inventory Controller",
        "재고 운영 담당"
      ],
      family: "inventory_control_execution",
      responsibilityHints: [
        "입출고 및 재고 이동을 관리한다",
        "재고 데이터를 시스템에 반영한다",
        "재고 이슈를 운영적으로 해결한다"
      ],
      levelHints: [
        "정형화된 프로세스 실행 중심",
        "복잡한 운영 이슈 조정과 관리로 확장"
      ]
    },
    {
      id: "inventory_auditor",
      label: "Inventory Auditor",
      aliases: [
        "재고 실사 담당",
        "Inventory Auditor",
        "Cycle Count 담당"
      ],
      family: "inventory_accuracy_audit",
      responsibilityHints: [
        "재고 실사와 cycle count를 수행한다",
        "재고 차이를 분석하고 보고한다",
        "정확도 개선 활동을 수행한다"
      ],
      levelHints: [
        "단순 실사 수행에서 시작",
        "오차 원인 분석과 개선 설계로 확장"
      ]
    },
    {
      id: "inventory_manager",
      label: "Inventory Manager",
      aliases: [
        "재고 매니저",
        "Inventory Manager",
        "재고관리 책임자"
      ],
      family: "inventory_planning",
      responsibilityHints: [
        "재고 정책과 운영을 총괄한다",
        "재고 KPI와 성과를 관리한다",
        "조직 간 재고 관련 의사결정을 조율한다"
      ],
      levelHints: [
        "개별 운영보다 전체 정책과 전략 관리 비중이 크다",
        "조직 간 협업과 의사결정 영향력이 커진다"
      ]
    }
  ],
  axes: [
    {
      axisId: "planning_vs_execution",
      label: "기획 vs 실행",
      values: [
        "재고 정책 및 기준 설계 중심",
        "재고 운영 및 입출고 처리 중심",
        "정확도 검증 및 실사 중심"
      ]
    },
    {
      axisId: "data_vs_physical",
      label: "데이터 vs 물리 흐름",
      values: [
        "데이터 기반 분석 및 정책 설계 중심",
        "시스템과 물리 재고를 동시에 관리",
        "현장 실사와 물리 재고 검증 중심"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "중장기 재고 최적화",
        "일별/주별 운영 대응",
        "주기적 실사 및 점검"
      ]
    },
    {
      axisId: "problem_focus",
      label: "문제 해결 초점",
      values: [
        "과잉재고/결품 최소화",
        "운영 오류 및 흐름 문제 해결",
        "재고 오차 및 정확도 개선"
      ]
    }
  ],
  adjacentFamilies: [
    "supply_chain_planning",
    "logistics_operations",
    "warehouse_management",
    "financial_accounting"
  ],
  boundaryHints: [
    "수요 예측과 공급 계획 수립 비중이 커지면 SCM 계획 영역으로 이동합니다.",
    "창고 운영, 피킹, 패킹, 배송 처리 비중이 커지면 물류 운영으로 읽힙니다.",
    "재고 평가와 회계 처리 중심이면 재무회계 또는 관리회계로 이동합니다.",
    "단순 물류 처리보다 정책 설계가 많아지면 재고 기획으로, 반대로 실행이 많아지면 운영 재고관리로 읽힙니다.",
    "실사와 정확도 검증 비중이 커지면 감사 또는 통제 성격의 역할로 이동할 수 있습니다."
  ],
  summaryTemplate: "재고관리는 재고 수준을 적정하게 유지하고 데이터와 실제 재고를 일치시키는 성격이 강합니다. 같은 영역에서도 기획, 운영, 정확도 관리 중 어디에 집중하느냐에 따라 역할 해석이 달라집니다. 반면 물류 운영이나 SCM 계획 비중이 커지면 다른 직무 경계로 읽힐 수 있습니다."
};
