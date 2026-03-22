export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "DEMAND_SUPPLY_PLANNING",
  aliases: [
    "수요계획",
    "공급계획",
    "수요예측",
    "Demand Planning",
    "Supply Planning",
    "S&OP",
    "Sales and Operations Planning",
    "IBP",
    "Integrated Business Planning",
    "Production Planning",
    "Master Planning",
    "MPS",
    "MRP",
    "재고계획",
    "재고운영 계획",
    "수급계획",
    "PSI planning",
    "forecasting",
    "planning analyst"
  ],
  families: [
    {
      id: "scm_demand_planning",
      label: "수요계획/수요예측",
      aliases: [
        "수요계획",
        "수요예측",
        "Demand Planner",
        "Forecasting",
        "Demand Forecast",
        "판매예측"
      ],
      strongSignals: [
        "판매 데이터 기반으로 수요예측(forecast)을 생성하고 관리한다",
        "프로모션, 시즌성, 이벤트를 반영해 수요를 조정한다",
        "영업·마케팅과 협업해 수요 가정을 설정한다",
        "forecast accuracy, bias 등 예측 정확도를 측정하고 개선한다",
        "SKU/제품 단위 수요 계획을 수립하고 업데이트한다"
      ],
      mediumSignals: [
        "과거 판매 데이터 분석과 트렌드 파악",
        "신제품 수요 가정 설정과 초기 예측",
        "수요 변화 원인 분석 및 리포트 작성",
        "수요 관련 지표 관리와 모니터링"
      ],
      boundarySignals: [
        "생산량, 발주량, 재고 배분 결정 비중이 커지면 공급계획으로 이동한다",
        "S&OP 회의 운영과 전사 계획 통합 비중이 커지면 통합계획으로 이동한다",
        "재고 수준 직접 관리와 배분 실행이 중심이면 물류/재고운영으로 이동한다"
      ],
      adjacentFamilies: [
        "scm_supply_planning",
        "scm_integrated_planning",
        "inventory_operations_interface"
      ],
      boundaryNote: "이 family는 수요를 예측하고 가정을 만드는 역할입니다. 실제 공급 실행이나 생산 계획보다 수요 신호를 만드는 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 제품이나 서비스의 수요를 예측하는 성격이 강합니다. 판매 데이터 기반 forecast 생성과 조정이 핵심이라면 이 family에 가깝습니다. 반면 생산·재고 결정 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "scm_supply_planning",
      label: "공급계획/생산계획",
      aliases: [
        "공급계획",
        "생산계획",
        "Supply Planner",
        "Production Planning",
        "MPS",
        "MRP",
        "자재소요계획",
        "수급계획"
      ],
      strongSignals: [
        "수요계획을 기반으로 생산량, 발주량을 결정한다",
        "MPS, MRP를 통해 생산 및 자재 계획을 수립한다",
        "공급 제약(설비, 리드타임, MOQ)을 반영해 계획을 조정한다",
        "재고 수준을 고려해 생산·구매 계획을 최적화한다",
        "납기 충족을 위한 공급 시나리오를 설계한다"
      ],
      mediumSignals: [
        "생산/구매 계획 리포트 작성",
        "공장, 구매, 물류와 협업해 계획 실행 조율",
        "재고 부족/과잉 이슈 대응",
        "리드타임 및 공급 조건 관리"
      ],
      boundarySignals: [
        "수요 예측 생성과 정확도 관리 비중이 커지면 수요계획으로 이동한다",
        "전사 계획 통합과 S&OP 운영 비중이 커지면 통합계획으로 이동한다",
        "실제 물류 실행, 입출고 운영 비중이 커지면 물류로 이동한다"
      ],
      adjacentFamilies: [
        "scm_demand_planning",
        "scm_integrated_planning",
        "logistics_operations_interface"
      ],
      boundaryNote: "이 family는 수요를 기반으로 실제 공급을 어떻게 맞출지 결정하는 역할입니다. 생산과 자재 흐름을 계획하는 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 수요에 맞춰 공급과 생산을 계획하는 성격이 강합니다. 생산량과 자재 계획 수립이 핵심이라면 이 family에 가깝습니다. 반면 수요 예측이나 전사 계획 조정 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "scm_integrated_planning",
      label: "통합계획/S&OP",
      aliases: [
        "S&OP",
        "IBP",
        "통합계획",
        "Integrated Planning",
        "Sales and Operations Planning",
        "전사계획"
      ],
      strongSignals: [
        "수요계획과 공급계획을 통합해 전사 계획을 수립한다",
        "S&OP 회의를 운영하고 의사결정을 조율한다",
        "재무, 영업, 생산 간 계획을 정렬한다",
        "시나리오 기반 계획과 의사결정 지원 자료를 만든다",
        "전사 KPI(서비스 수준, 재고, 매출)를 균형 있게 관리한다"
      ],
      mediumSignals: [
        "부서 간 계획 충돌 조정과 커뮤니케이션",
        "계획 가정과 리스크를 정리한 리포트 작성",
        "중장기 계획과 단기 계획 간 연결",
        "경영진 보고 자료 작성"
      ],
      boundarySignals: [
        "개별 forecast 생성과 데이터 분석 비중이 커지면 수요계획으로 이동한다",
        "생산량·자재 계획 실행 비중이 커지면 공급계획으로 이동한다",
        "재무 예산과 손익 중심 계획이면 FP&A로 이동한다"
      ],
      adjacentFamilies: [
        "scm_demand_planning",
        "scm_supply_planning",
        "fpna_interface"
      ],
      boundaryNote: "이 family는 수요와 공급을 통합해 전사 관점에서 계획을 조정하는 역할입니다. 개별 계획 수행보다 의사결정 조율과 통합이 핵심일 때 해당됩니다.",
      summaryTemplate: "이 직무는 수요와 공급을 통합해 전사 계획을 조율하는 성격이 강합니다. S&OP 운영과 부서 간 조정이 핵심이라면 이 family에 가깝습니다. 반면 개별 계획 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "scm_inventory_planning",
      label: "재고계획/재고최적화",
      aliases: [
        "재고계획",
        "재고관리 계획",
        "Inventory Planning",
        "Inventory Optimization",
        "Safety Stock",
        "재고정책"
      ],
      strongSignals: [
        "안전재고(safety stock), 목표 재고 수준을 설계한다",
        "서비스 수준과 재고 비용 간 균형을 맞춘다",
        "재고 회전율, 커버리지, 과잉/부족 재고를 분석한다",
        "재고 정책과 replenishment 기준을 설정한다",
        "다품목(SKU) 재고 구조를 최적화한다"
      ],
      mediumSignals: [
        "재고 관련 KPI 관리와 리포트 작성",
        "수요·공급 계획과 연계해 재고 수준 조정",
        "재고 이슈 원인 분석",
        "재고 시뮬레이션 및 개선안 도출"
      ],
      boundarySignals: [
        "생산 및 자재 계획 실행 비중이 커지면 공급계획으로 이동한다",
        "수요 예측 생성이 중심이면 수요계획으로 이동한다",
        "창고 운영, 입출고 실행 비중이 커지면 물류로 이동한다"
      ],
      adjacentFamilies: [
        "scm_supply_planning",
        "scm_demand_planning",
        "logistics_operations_interface"
      ],
      boundaryNote: "이 family는 재고 수준과 정책을 설계하는 역할입니다. 물류 실행보다 재고 구조와 기준을 설정하는 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 재고 수준과 정책을 설계하는 성격이 강합니다. 안전재고와 재고 최적화가 핵심이라면 이 family에 가깝습니다. 반면 생산 계획이나 물류 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "demand_planner",
      label: "수요계획 담당자",
      aliases: [
        "Demand Planner",
        "수요예측 담당",
        "Forecast Analyst"
      ],
      family: "scm_demand_planning",
      responsibilityHints: [
        "판매 데이터를 기반으로 수요예측을 생성한다",
        "영업·마케팅과 협업해 forecast를 조정한다",
        "예측 정확도를 관리하고 개선한다"
      ],
      levelHints: [
        "주니어는 데이터 분석과 forecast 생성 지원 중심이다",
        "미들 레벨은 수요 계획과 조정을 주도한다",
        "시니어는 수요 전략과 가정 설정을 리드한다"
      ]
    },
    {
      id: "supply_planner",
      label: "공급계획 담당자",
      aliases: [
        "Supply Planner",
        "생산계획 담당",
        "MPS Planner"
      ],
      family: "scm_supply_planning",
      responsibilityHints: [
        "생산 및 자재 계획을 수립한다",
        "공급 제약을 반영해 계획을 조정한다",
        "납기 충족을 위한 공급 시나리오를 설계한다"
      ],
      levelHints: [
        "주니어는 계획 데이터 관리와 실행 지원 중심이다",
        "미들 레벨은 생산·자재 계획을 주도한다",
        "시니어는 공급 전략과 구조를 설계한다"
      ]
    },
    {
      id: "sop_manager",
      label: "S&OP/통합계획 담당자",
      aliases: [
        "S&OP Manager",
        "IBP Manager",
        "통합계획 담당"
      ],
      family: "scm_integrated_planning",
      responsibilityHints: [
        "수요와 공급 계획을 통합한다",
        "S&OP 회의를 운영하고 의사결정을 조율한다",
        "전사 KPI 균형을 관리한다"
      ],
      levelHints: [
        "미들 이상에서 주로 수행된다",
        "시니어는 전사 계획과 의사결정 구조를 설계한다",
        "조율과 커뮤니케이션 역량 비중이 크다"
      ]
    },
    {
      id: "inventory_planner",
      label: "재고계획 담당자",
      aliases: [
        "Inventory Planner",
        "재고관리 담당",
        "재고최적화 담당"
      ],
      family: "scm_inventory_planning",
      responsibilityHints: [
        "재고 정책과 안전재고를 설계한다",
        "재고 수준을 최적화한다",
        "재고 KPI를 관리하고 개선한다"
      ],
      levelHints: [
        "주니어는 데이터 분석과 리포트 중심이다",
        "미들 레벨은 재고 정책을 설계한다",
        "시니어는 전사 재고 전략을 수립한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "planning_scope",
      label: "계획 범위",
      values: [
        "수요 생성과 예측 중심",
        "공급과 생산 실행 계획 중심",
        "전사 통합 계획과 조율 중심",
        "재고 수준과 정책 설계 중심"
      ]
    },
    {
      axisId: "decision_focus",
      label: "의사결정 초점",
      values: [
        "수요 신호와 forecast 정확도",
        "생산·자재·납기 충족",
        "부서 간 계획 정렬과 균형",
        "재고 비용과 서비스 수준 균형"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "단기~중기 수요 예측",
        "단기 생산 및 공급 계획",
        "중기~장기 통합 계획",
        "중기 재고 최적화"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "logistics_operations_interface",
      label: "물류/운영 인접 경계",
      whyAdjacent: [
        "계획과 실제 물류 실행이 연결된다",
        "입출고와 배송 실행이 중심이면 물류로 읽힌다"
      ]
    },
    {
      id: "fpna_interface",
      label: "재무계획 인접 경계",
      whyAdjacent: [
        "수요와 매출 계획이 재무와 연결된다",
        "손익과 예산 중심이면 FP&A로 이동한다"
      ]
    },
    {
      id: "production_interface",
      label: "생산관리 인접 경계",
      whyAdjacent: [
        "생산 계획과 현장 운영이 연결된다",
        "현장 실행과 공정 관리가 중심이면 생산관리로 이동한다"
      ]
    }
  ],
  boundaryHints: [
    "판매 데이터 기반 수요예측 생성 비중이 커지면 수요계획으로 읽힙니다.",
    "생산량과 자재 계획 수립 비중이 커지면 공급계획으로 읽힙니다.",
    "부서 간 계획 조정과 S&OP 운영 비중이 커지면 통합계획으로 읽힙니다.",
    "재고 수준과 정책 설계 비중이 커지면 재고계획으로 읽힙니다.",
    "실제 입출고와 물류 실행 비중이 커지면 물류 직무로 이동할 수 있습니다."
  ],
  summaryTemplate: "공급계획/수요계획 직무는 수요를 예측하고 이를 기반으로 공급과 재고를 맞추는 역할을 수행합니다. 다만 수요를 만드는지, 공급을 계획하는지, 전사적으로 통합하는지, 재고를 최적화하는지에 따라 역할이 구분됩니다. 특히 계획을 어디에 두고 의사결정을 하느냐에 따라 직무 경계가 나뉩니다."
};
