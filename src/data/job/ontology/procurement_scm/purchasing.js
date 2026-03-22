export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "PURCHASING",
  aliases: [
    "구매",
    "구매관리",
    "구매담당",
    "구매기획",
    "소싱",
    "Strategic Sourcing",
    "Procurement",
    "Purchasing",
    "구매조달",
    "발주관리",
    "구매운영",
    "vendor sourcing",
    "supplier management",
    "구매MD"
  ],
  families: [
    {
      id: "pr_strategic_sourcing",
      label: "전략소싱/구매기획",
      aliases: [
        "전략구매",
        "소싱",
        "strategic sourcing",
        "구매기획",
        "카테고리 매니지먼트",
        "category management",
        "공급업체 발굴"
      ],
      strongSignals: [
        "신규 공급업체 발굴, vendor sourcing, supplier onboarding을 수행한다",
        "카테고리별 구매 전략과 sourcing 전략을 수립한다",
        "입찰(RFP, RFQ) 프로세스를 설계하고 실행한다",
        "가격 협상 전략을 수립하고 계약 조건을 협상한다",
        "공급시장 분석과 벤치마킹을 통해 구매 전략을 만든다"
      ],
      mediumSignals: [
        "기존 공급업체 성과를 평가하고 재계약 여부를 판단한다",
        "구매 단가 절감 전략과 비용 개선안을 제안한다",
        "장기 공급계약과 파트너십 구조를 설계한다",
        "내부 수요와 시장 상황을 연결해 구매 방향을 설정한다"
      ],
      boundarySignals: [
        "발주 처리, 납기 관리, 입고 확인 등 실행 비중이 커지면 구매운영으로 이동한다",
        "재고 수준 관리, 수요예측과 연계된 구매가 중심이면 SCM/재고관리로 이동한다",
        "단순 가격 비교와 발주 중심이면 운영성 구매로 읽힌다"
      ],
      adjacentFamilies: [
        "pr_purchasing_operations",
        "scm_inventory_interface",
        "supplier_quality_interface"
      ],
      boundaryNote: "이 family는 공급업체와 시장을 기준으로 구매 전략을 설계하는 역할입니다. 단순 발주나 운영이 아니라 공급구조와 협상 구조를 설계하는 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 공급업체 발굴과 구매 전략을 설계하는 성격이 강합니다. 소싱 전략, 입찰, 협상 중심이라면 이 family에 가깝습니다. 반면 발주와 납기 관리 비중이 커지면 운영 경계로 읽힐 수 있습니다."
    },
    {
      id: "pr_purchasing_operations",
      label: "구매운영/발주관리",
      aliases: [
        "구매운영",
        "발주관리",
        "purchasing operations",
        "procurement operations",
        "발주담당",
        "구매실무",
        "order management"
      ],
      strongSignals: [
        "구매 요청을 받아 발주서를 생성하고 발주를 실행한다",
        "납기 일정 관리와 공급업체 납품 일정을 조율한다",
        "입고 확인, 검수, 납품 이슈 대응을 수행한다",
        "구매 시스템 입력, 발주 데이터 관리, 정합성 점검을 한다",
        "단가 확인, 발주 수량 조정 등 일상 구매 업무를 처리한다"
      ],
      mediumSignals: [
        "구매 관련 문의 대응과 내부 요청 조율",
        "발주 프로세스 개선과 운영 효율화",
        "공급업체와의 일상적 커뮤니케이션",
        "납기 지연, 품절 등 운영 이슈 해결"
      ],
      boundarySignals: [
        "공급업체 선정, 계약 협상, sourcing 전략 비중이 커지면 전략소싱으로 이동한다",
        "재고 수준 최적화, 수요예측 기반 구매 비중이 커지면 SCM으로 이동한다",
        "품질 문제 대응과 개선 활동 비중이 커지면 품질/QA 경계로 이동한다"
      ],
      adjacentFamilies: [
        "pr_strategic_sourcing",
        "scm_inventory_interface",
        "supplier_quality_interface"
      ],
      boundaryNote: "이 family는 실제 구매를 실행하고 공급을 맞추는 역할입니다. 전략보다는 발주, 납기, 입고 등 운영 정확성이 핵심일 때 해당됩니다.",
      summaryTemplate: "이 직무는 발주와 납기 관리를 중심으로 구매를 실행하는 성격이 강합니다. 발주 처리와 공급 일정 관리가 핵심이라면 이 family에 가깝습니다. 반면 협상과 소싱 전략 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "pr_supplier_management",
      label: "공급업체 관리/평가",
      aliases: [
        "공급업체 관리",
        "vendor management",
        "supplier management",
        "협력사 관리",
        "vendor evaluation",
        "파트너 관리"
      ],
      strongSignals: [
        "공급업체 성과 평가, KPI 관리, vendor scorecard를 운영한다",
        "협력사 계약 유지, 관계 관리, 성과 개선 활동을 수행한다",
        "공급업체 리스크를 모니터링하고 대응한다",
        "장기 파트너십과 협력 구조를 관리한다",
        "공급업체 이슈(납기, 품질, 가격)를 종합적으로 관리한다"
      ],
      mediumSignals: [
        "정기적인 공급업체 평가 리포트 작성",
        "공급업체 개선 요청과 피드백 전달",
        "협력사 커뮤니케이션 채널 운영",
        "공급망 안정성 점검"
      ],
      boundarySignals: [
        "신규 공급업체 발굴과 계약 협상 비중이 커지면 전략소싱으로 이동한다",
        "발주와 납기 관리 중심이면 구매운영으로 이동한다",
        "품질 문제 분석과 개선이 중심이면 품질관리로 이동한다"
      ],
      adjacentFamilies: [
        "pr_strategic_sourcing",
        "pr_purchasing_operations",
        "supplier_quality_interface"
      ],
      boundaryNote: "이 family는 기존 공급업체를 관리하고 성과를 개선하는 역할입니다. 신규 소싱보다는 관계 유지와 평가 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 공급업체와의 관계를 관리하고 성과를 개선하는 성격이 강합니다. 협력사 평가와 관리가 핵심이라면 이 family에 가깝습니다. 반면 신규 소싱이나 발주 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "pr_cost_analysis",
      label: "구매비용분석/단가관리",
      aliases: [
        "구매분석",
        "원가분석",
        "cost analysis",
        "price analysis",
        "단가관리",
        "구매비용 관리"
      ],
      strongSignals: [
        "구매 단가 구조를 분석하고 비용 절감 기회를 도출한다",
        "원가 구성 요소를 분석해 가격 협상 근거를 만든다",
        "카테고리별 구매 비용과 트렌드를 분석한다",
        "단가 변동 요인과 시장 가격을 비교 분석한다",
        "비용 절감 프로젝트와 개선안을 도출한다"
      ],
      mediumSignals: [
        "구매 데이터 리포트 작성과 지표 관리",
        "시장 가격 조사와 벤치마킹",
        "비용 절감 효과 추적과 분석",
        "내부 구매 비용 구조 정리"
      ],
      boundarySignals: [
        "실제 협상과 공급업체 선정 비중이 커지면 전략소싱으로 이동한다",
        "발주와 납기 관리 중심이면 구매운영으로 이동한다",
        "재무 손익 분석과 예산 중심이면 FP&A 경계로 이동한다"
      ],
      adjacentFamilies: [
        "pr_strategic_sourcing",
        "pr_purchasing_operations",
        "fpna_interface"
      ],
      boundaryNote: "이 family는 구매 활동을 데이터와 비용 관점에서 분석하는 역할입니다. 실행보다 분석과 개선안 도출 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 구매 비용과 단가를 분석하는 성격이 강합니다. 원가 분석과 비용 절감이 핵심이라면 이 family에 가깝습니다. 반면 협상 실행이나 발주 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "strategic_sourcing_manager",
      label: "전략소싱 담당자",
      aliases: [
        "소싱 담당",
        "Strategic Sourcing Manager",
        "Category Manager",
        "구매기획 담당"
      ],
      family: "pr_strategic_sourcing",
      responsibilityHints: [
        "공급업체 발굴과 sourcing 전략을 수립한다",
        "입찰과 협상을 통해 계약을 체결한다",
        "카테고리별 구매 전략을 설계한다"
      ],
      levelHints: [
        "주니어는 데이터 수집과 입찰 지원을 수행한다",
        "미들 레벨은 협상과 소싱 실행을 주도한다",
        "시니어는 구매 전략과 공급 구조를 설계한다"
      ]
    },
    {
      id: "purchasing_operator",
      label: "구매운영 담당자",
      aliases: [
        "구매담당",
        "발주담당",
        "Purchasing Specialist",
        "Procurement Operator"
      ],
      family: "pr_purchasing_operations",
      responsibilityHints: [
        "발주 생성과 납기 관리를 수행한다",
        "입고와 공급 일정 문제를 해결한다",
        "구매 운영 데이터를 관리한다"
      ],
      levelHints: [
        "주니어는 발주 처리와 데이터 입력 중심이다",
        "미들 레벨은 전체 운영과 공급 조율을 담당한다",
        "시니어는 운영 프로세스 개선과 관리 책임을 진다"
      ]
    },
    {
      id: "supplier_manager",
      label: "공급업체 관리 담당자",
      aliases: [
        "협력사 담당",
        "Vendor Manager",
        "Supplier Manager"
      ],
      family: "pr_supplier_management",
      responsibilityHints: [
        "공급업체 성과를 평가하고 관리한다",
        "협력사 관계를 유지하고 개선한다",
        "공급망 리스크를 관리한다"
      ],
      levelHints: [
        "주니어는 데이터 관리와 평가 지원을 수행한다",
        "미들 레벨은 공급업체 관리와 커뮤니케이션을 담당한다",
        "시니어는 전략적 파트너십과 구조를 설계한다"
      ]
    },
    {
      id: "procurement_analyst",
      label: "구매분석 담당자",
      aliases: [
        "구매분석가",
        "Cost Analyst",
        "Procurement Analyst"
      ],
      family: "pr_cost_analysis",
      responsibilityHints: [
        "구매 비용과 단가를 분석한다",
        "비용 절감 기회를 도출한다",
        "시장 가격과 내부 데이터를 비교 분석한다"
      ],
      levelHints: [
        "주니어는 데이터 정리와 기초 분석을 수행한다",
        "미들 레벨은 분석과 개선안 도출을 담당한다",
        "시니어는 비용 전략과 방향을 제시한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: [
        "공급업체 발굴과 협상 중심",
        "발주와 납기 운영 중심",
        "공급업체 관계와 성과 관리 중심",
        "구매 비용과 단가 분석 중심"
      ]
    },
    {
      axisId: "value_creation",
      label: "가치 창출 방식",
      values: [
        "협상과 전략을 통한 비용 절감",
        "운영 효율과 납기 안정성 확보",
        "공급업체 성과 개선과 관계 관리",
        "데이터 분석을 통한 비용 개선"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "중장기 구매 전략",
        "일별·주별 운영 실행",
        "중기적 관계 관리",
        "지속적 데이터 분석과 개선"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "scm_inventory_interface",
      label: "SCM/재고관리 인접 경계",
      whyAdjacent: [
        "구매와 재고 관리가 밀접하게 연결된다",
        "재고 최적화와 수요예측이 중심이면 SCM으로 이동한다"
      ]
    },
    {
      id: "supplier_quality_interface",
      label: "품질관리 인접 경계",
      whyAdjacent: [
        "공급업체 품질 이슈를 함께 다루는 경우가 많다",
        "품질 개선과 QA가 중심이면 품질 직무로 읽힌다"
      ]
    },
    {
      id: "fpna_interface",
      label: "재무분석 인접 경계",
      whyAdjacent: [
        "비용 분석과 재무 데이터가 연결된다",
        "손익 중심 분석이면 재무 쪽으로 이동한다"
      ]
    }
  ],
  boundaryHints: [
    "공급업체 발굴과 협상 비중이 커지면 전략소싱으로 읽힙니다.",
    "발주 처리와 납기 관리 비중이 커지면 구매운영으로 읽힙니다.",
    "협력사 평가와 관계 관리 비중이 커지면 공급업체 관리로 읽힙니다.",
    "단가 분석과 비용 절감 분석 비중이 커지면 구매분석으로 읽힙니다.",
    "재고 최적화와 수요예측 중심이면 SCM으로 이동할 수 있습니다."
  ],
  summaryTemplate: "구매 직무는 공급업체를 통해 필요한 자원을 확보하는 역할을 수행합니다. 다만 공급업체를 발굴하고 협상하는지, 발주와 납기를 운영하는지, 협력사를 관리하는지, 또는 비용을 분석하는지에 따라 역할이 구분됩니다. 특히 실행 중심인지 전략·분석 중심인지에 따라 직무 경계가 나뉩니다."
};
