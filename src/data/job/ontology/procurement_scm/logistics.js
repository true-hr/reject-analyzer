export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "LOGISTICS",
  aliases: [
    "물류",
    "물류관리",
    "Logistics",
    "물류 운영",
    "Logistics Operations",
    "배송 관리",
    "출고 관리",
    "입고 관리",
    "창고 관리",
    "Warehouse",
    "물류 기획",
    "물류 전략",
    "물류 운영관리",
    "풀필먼트",
    "Fulfillment",
    "운송 관리",
    "Transportation"
  ],
  families: [
    {
      id: "warehouse_fulfillment_ops",
      label: "창고·풀필먼트 운영",
      aliases: [
        "창고관리",
        "풀필먼트 운영",
        "WMS 운영",
        "입출고 관리",
        "재고 운영",
        "Warehouse Operations",
        "Fulfillment Operations"
      ],
      strongSignals: [
        "입고·출고 프로세스 운영 및 관리",
        "재고 정확도 관리 및 실사 수행",
        "피킹·패킹 프로세스 관리",
        "WMS 사용 및 운영",
        "창고 레이아웃 및 동선 관리",
        "작업 인력 배치 및 생산성 관리"
      ],
      mediumSignals: [
        "재고 회전율 모니터링",
        "입출고 일정 조율",
        "작업 SOP 작성",
        "물류센터 운영 지표 관리",
        "이상 재고 및 파손 관리"
      ],
      boundarySignals: [
        "운송보다 창고 내부 작업 관리 비중이 크면 이 family에 가깝다",
        "전략 기획보다 일일 운영 관리 비중이 크면 이 family에 가깝다",
        "외부 업체 관리보다 내부 프로세스 관리 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "transportation_delivery_mgmt",
        "logistics_planning_optimization",
        "logistics_vendor_mgmt"
      ],
      boundaryNote: "물류센터 내부의 입출고와 재고 운영을 직접 관리하는 책임이 커질수록 창고·풀필먼트 운영으로 읽힙니다. 반면 운송 경로나 비용 최적화, 외부 업체 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 물류센터 내 입출고와 재고를 운영하는 성격이 강합니다. 현장 운영과 프로세스 관리가 핵심입니다. 반면 운송이나 전략 기획 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "transportation_delivery_mgmt",
      label: "운송·배송 관리",
      aliases: [
        "운송관리",
        "배송관리",
        "Transportation",
        "Delivery Management",
        "라스트마일",
        "Last Mile",
        "배차 관리",
        "운송 운영"
      ],
      strongSignals: [
        "배송 경로 및 배차 계획 수립",
        "운송 스케줄 관리",
        "배송 리드타임 관리",
        "운송 비용 관리",
        "택배사·운송사 협업 및 관리",
        "배송 이슈 대응 및 클레임 처리"
      ],
      mediumSignals: [
        "배송 데이터 모니터링",
        "운송 KPI 관리",
        "배송 지연 원인 분석",
        "운송 계약 조건 검토",
        "배송 품질 개선 활동"
      ],
      boundarySignals: [
        "창고 내부 작업보다 외부 배송 관리 비중이 크면 이 family에 가깝다",
        "전략 설계보다 운송 실행 관리 비중이 크면 이 family에 가깝다",
        "재고 관리보다 배송 리드타임 관리 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "warehouse_fulfillment_ops",
        "logistics_vendor_mgmt",
        "logistics_planning_optimization"
      ],
      boundaryNote: "물류센터 운영보다 실제 배송과 운송 흐름을 관리하는 책임이 커질수록 운송·배송 관리로 읽힙니다. 반면 경로 설계나 비용 구조 최적화 비중이 커지면 물류 기획 쪽으로 이동합니다.",
      summaryTemplate: "이 직무는 상품이 고객에게 전달되는 운송과 배송 과정을 관리하는 성격이 강합니다. 배차와 리드타임 관리가 핵심입니다. 반면 전략적 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "logistics_planning_optimization",
      label: "물류 기획·최적화",
      aliases: [
        "물류기획",
        "물류 전략",
        "Logistics Planning",
        "SCM 물류 기획",
        "물류 최적화",
        "네트워크 설계"
      ],
      strongSignals: [
        "물류 네트워크 설계 및 재구성",
        "물류 비용 구조 분석 및 절감 방안 도출",
        "물류 KPI 및 성과 지표 설계",
        "운송·창고 프로세스 개선 기획",
        "물류 시뮬레이션 및 시나리오 분석",
        "중장기 물류 전략 수립"
      ],
      mediumSignals: [
        "데이터 기반 물류 개선 과제 수행",
        "운영 지표 분석",
        "프로세스 개선안 도출",
        "자동화 도입 검토",
        "물류 시스템 요구사항 정의"
      ],
      boundarySignals: [
        "현장 운영보다 구조 설계와 개선 비중이 크면 이 family에 가깝다",
        "일일 운영보다 중장기 계획 비중이 크면 이 family에 가깝다",
        "실행보다 분석과 설계 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "warehouse_fulfillment_ops",
        "transportation_delivery_mgmt",
        "strategy"
      ],
      boundaryNote: "현장 운영을 직접 수행하기보다 물류 구조와 비용, 프로세스를 설계하고 개선하는 책임이 커질수록 물류 기획·최적화로 읽힙니다. 반면 실행과 운영 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 물류 운영 구조를 설계하고 효율을 개선하는 성격이 강합니다. 비용과 프로세스 최적화가 핵심입니다. 반면 현장 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "logistics_vendor_mgmt",
      label: "물류 파트너·외주 관리",
      aliases: [
        "물류업체 관리",
        "3PL 관리",
        "외주 물류 관리",
        "Vendor Management",
        "3PL 운영",
        "물류 파트너 관리"
      ],
      strongSignals: [
        "3PL 업체 선정 및 계약 관리",
        "물류 파트너 성과 평가",
        "SLA 관리 및 협상",
        "외주 물류 운영 품질 관리",
        "물류 업체 비용 협상",
        "파트너 이슈 대응 및 개선 요구"
      ],
      mediumSignals: [
        "업체 정기 미팅 운영",
        "성과 리포트 작성",
        "계약 조건 검토",
        "업체 변경 또는 재계약 검토",
        "외주 운영 프로세스 점검"
      ],
      boundarySignals: [
        "내부 운영보다 외부 업체 관리 비중이 크면 이 family에 가깝다",
        "직접 실행보다 협력사 조정 비중이 크면 이 family에 가깝다",
        "단순 계약 관리보다 성과 관리 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "transportation_delivery_mgmt",
        "warehouse_fulfillment_ops",
        "procurement"
      ],
      boundaryNote: "물류를 직접 수행하기보다 외부 파트너를 통해 운영하고 이를 관리하는 책임이 커질수록 물류 파트너·외주 관리로 읽힙니다. 반면 내부 운영 비중이 커지면 창고 또는 운송 관리로 이동합니다.",
      summaryTemplate: "이 직무는 물류 파트너와 협력해 운영을 관리하는 성격이 강합니다. 계약과 성과 관리가 핵심입니다. 반면 직접 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "warehouse_manager",
      label: "창고 운영 담당자",
      aliases: [
        "Warehouse Manager",
        "풀필먼트 매니저",
        "창고 관리자",
        "입출고 담당"
      ],
      family: "warehouse_fulfillment_ops",
      responsibilityHints: [
        "입출고 관리",
        "재고 정확도 관리",
        "작업 인력 운영",
        "WMS 운영"
      ],
      levelHints: [
        "현장 운영을 안정적으로 관리할 수 있다",
        "재고와 작업 효율을 동시에 고려할 수 있다"
      ]
    },
    {
      id: "transportation_manager",
      label: "운송·배송 담당자",
      aliases: [
        "Transportation Manager",
        "배송 담당",
        "배차 담당",
        "운송 관리자"
      ],
      family: "transportation_delivery_mgmt",
      responsibilityHints: [
        "배차 계획 수립",
        "배송 일정 관리",
        "운송 비용 관리",
        "배송 이슈 대응"
      ],
      levelHints: [
        "배송 리드타임을 관리할 수 있다",
        "운송 비용과 서비스 수준을 균형 있게 고려할 수 있다"
      ]
    },
    {
      id: "logistics_planner",
      label: "물류기획 담당자",
      aliases: [
        "Logistics Planner",
        "물류 전략 담당",
        "SCM 기획",
        "물류 분석 담당"
      ],
      family: "logistics_planning_optimization",
      responsibilityHints: [
        "물류 구조 설계",
        "비용 분석 및 절감안 도출",
        "프로세스 개선",
        "지표 설계"
      ],
      levelHints: [
        "운영 데이터를 기반으로 개선안을 도출할 수 있다",
        "물류 구조를 전체적으로 이해하고 설계할 수 있다"
      ]
    },
    {
      id: "logistics_vendor_manager",
      label: "물류 파트너 관리 담당자",
      aliases: [
        "3PL Manager",
        "Vendor Manager",
        "물류 외주 담당",
        "물류 협력사 담당"
      ],
      family: "logistics_vendor_mgmt",
      responsibilityHints: [
        "3PL 계약 관리",
        "업체 성과 평가",
        "SLA 관리",
        "파트너 협업 조정"
      ],
      levelHints: [
        "외부 업체와 협상 및 조정이 가능하다",
        "성과 기반으로 파트너를 관리할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "operation_scope",
      label: "운영 범위",
      values: [
        "창고 내부 운영",
        "운송 및 배송",
        "전사 물류 구조",
        "외부 파트너 관리"
      ]
    },
    {
      axisId: "work_focus",
      label: "업무 중심",
      values: [
        "현장 실행",
        "운송 흐름 관리",
        "분석 및 설계",
        "협력사 관리"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "일일 운영",
        "단기 배송 관리",
        "중장기 최적화",
        "계약 및 성과 관리"
      ]
    }
  ],
  adjacentFamilies: [
    "구매",
    "SCM 기획",
    "생산관리",
    "영업관리",
    "CS"
  ],
  boundaryHints: [
    "창고 내 입출고와 재고 관리 비중이 커지면 창고 운영으로 읽힙니다.",
    "배송과 운송 흐름 관리 비중이 커지면 운송 관리로 이동합니다.",
    "비용 구조와 프로세스 개선 비중이 커지면 물류 기획으로 해석됩니다.",
    "외부 업체와의 협업 및 계약 관리 비중이 커지면 파트너 관리로 읽힙니다.",
    "물류 실행보다 구매 계약이나 조달 비중이 커지면 구매 직무와 경계가 가까워집니다."
  ],
  summaryTemplate: "물류 직무는 상품의 이동과 보관을 관리하고 효율을 높이는 역할입니다. 창고 운영, 운송 관리, 구조 설계, 파트너 관리 중 어디에 중심이 있는지에 따라 실제 역할이 달라집니다. 반면 조달이나 생산과 연계된 책임이 커지면 인접 직무로 읽힐 수 있습니다."
};
