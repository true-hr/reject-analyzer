export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "STRATEGIC_SOURCING",
  aliases: [
    "전략구매",
    "소싱",
    "Strategic Sourcing",
    "Sourcing",
    "Procurement Strategy",
    "구매 전략",
    "구매기획",
    "Vendor Sourcing",
    "Supplier Sourcing",
    "구매개발",
    "구매기획 및 소싱",
    "Global Sourcing",
    "전략적 구매",
    "카테고리 구매",
    "Category Sourcing",
    "구매혁신",
    "구매 분석",
    "Supplier Selection",
    "공급사 발굴",
    "원가 절감 구매",
    "Cost Reduction Sourcing"
  ],
  families: [
    {
      id: "category_strategy_sourcing",
      label: "카테고리 전략 소싱",
      aliases: [
        "Category Sourcing",
        "카테고리 구매",
        "카테고리 전략",
        "구매 전략 수립",
        "commodity sourcing"
      ],
      strongSignals: [
        "특정 카테고리(원자재, 부품, 서비스 등)의 구매 전략을 수립한다",
        "카테고리별 공급 시장을 분석하고 sourcing 전략을 정의한다",
        "장기 계약, 공급 포트폴리오, 공급사 구조를 설계한다",
        "카테고리 단위로 원가 절감 목표와 실행 계획을 관리한다",
        "글로벌/지역별 sourcing 전략을 구분해 운영한다"
      ],
      mediumSignals: [
        "공급 시장 트렌드와 가격 변동을 지속적으로 모니터링한다",
        "내부 수요 조직과 협업해 구매 방향성을 정렬한다",
        "복수 공급사 구조를 설계하거나 리스크 분산 전략을 만든다",
        "중장기 관점의 sourcing 로드맵을 작성한다"
      ],
      boundarySignals: [
        "개별 계약 협상과 단건 sourcing 실행 비중이 크면 supplier sourcing family로 이동한다",
        "실제 발주, 납기 관리, 운영 구매 비중이 커지면 purchasing operation으로 읽힌다",
        "원가 분석과 should-cost 모델링 비중이 커지면 cost analysis family로 이동한다",
        "공급사 평가와 관계 관리가 핵심이면 supplier management family로 이동한다"
      ],
      adjacentFamilies: [
        "supplier_sourcing_execution",
        "supplier_management",
        "cost_analysis_value_engineering"
      ],
      boundaryNote: "카테고리 전략 소싱은 개별 거래보다 구조와 방향을 설계하는 역할입니다. 반면 단건 협상이나 실행 중심으로 이동하면 다른 소싱 실행 영역으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 특정 구매 카테고리의 sourcing 전략을 설계하고 공급 구조를 최적화하는 성격이 강합니다. 반면 개별 거래 실행이나 운영 구매 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "supplier_sourcing_execution",
      label: "공급사 발굴·선정 소싱",
      aliases: [
        "Supplier Sourcing",
        "Vendor Sourcing",
        "공급사 발굴",
        "공급사 선정",
        "RFI RFP RFQ",
        "입찰 소싱",
        "견적 비교 구매"
      ],
      strongSignals: [
        "신규 공급사를 발굴하고 비교 평가를 수행한다",
        "RFI, RFP, RFQ 프로세스를 운영하고 제안서를 평가한다",
        "가격 협상, 조건 협상을 직접 수행한다",
        "견적 비교와 선정 의사결정을 리드한다",
        "단건 또는 프로젝트 단위 소싱을 수행한다"
      ],
      mediumSignals: [
        "기존 공급사와 신규 공급사를 비교해 선택한다",
        "단가, 납기, 품질 조건을 종합적으로 검토한다",
        "입찰 프로세스를 관리하고 내부 승인 절차를 진행한다",
        "시장 가격 벤치마킹을 수행한다"
      ],
      boundarySignals: [
        "장기 전략, 카테고리 구조 설계 비중이 커지면 category strategy family로 이동한다",
        "공급사 성과 평가와 관계 관리 비중이 커지면 supplier management family로 이동한다",
        "원가 구조 분석과 cost breakdown 중심이면 cost analysis family로 이동한다",
        "발주 처리와 납기 관리 중심이면 구매 운영으로 읽힌다"
      ],
      adjacentFamilies: [
        "category_strategy_sourcing",
        "supplier_management",
        "cost_analysis_value_engineering"
      ],
      boundaryNote: "공급사 발굴·선정 소싱은 실제 거래와 협상 실행이 핵심입니다. 반면 전략 설계나 관계 관리 비중이 커지면 각각 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 공급사를 발굴하고 비교·협상해 최적의 거래 조건을 확보하는 실행 성격이 강합니다. 반면 전략 설계나 관계 관리 비중이 커지면 다른 소싱 경계로 읽힐 수 있습니다."
    },
    {
      id: "supplier_management",
      label: "공급사 관리·관계 운영",
      aliases: [
        "Supplier Management",
        "Vendor Management",
        "공급사 관리",
        "협력사 관리",
        "SRM",
        "Supplier Relationship Management"
      ],
      strongSignals: [
        "주요 공급사와의 장기 관계를 관리한다",
        "공급사 성과(KPI)를 정의하고 평가한다",
        "품질, 납기, 비용 이슈를 공급사와 함께 개선한다",
        "정기적인 공급사 리뷰와 미팅을 운영한다",
        "핵심 협력사와 전략적 파트너십을 구축한다"
      ],
      mediumSignals: [
        "공급사 리스크를 모니터링하고 대응한다",
        "이슈 발생 시 공급사와 협업해 해결한다",
        "공급사 등급화 및 관리 체계를 운영한다",
        "계약 이후 관계 유지와 개선 활동이 중심이다"
      ],
      boundarySignals: [
        "신규 공급사 발굴과 협상 비중이 크면 sourcing execution family로 이동한다",
        "카테고리 전략과 공급 구조 설계 비중이 커지면 category strategy family로 이동한다",
        "원가 절감 분석과 기술적 개선 중심이면 cost analysis family로 이동한다",
        "단순 발주 및 납기 관리 중심이면 운영 구매로 읽힌다"
      ],
      adjacentFamilies: [
        "supplier_sourcing_execution",
        "category_strategy_sourcing",
        "cost_analysis_value_engineering"
      ],
      boundaryNote: "공급사 관리·관계 운영은 계약 이후 관계와 성과를 지속적으로 관리하는 역할입니다. 반면 신규 소싱이나 전략 설계 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 공급사와의 관계를 유지·개선하며 성과를 관리하는 성격이 강합니다. 반면 신규 소싱이나 전략 설계 비중이 커지면 다른 소싱 경계로 읽힐 수 있습니다."
    },
    {
      id: "cost_analysis_value_engineering",
      label: "원가분석·가치개선 소싱",
      aliases: [
        "Cost Analysis",
        "Should Cost",
        "Value Engineering",
        "원가분석 구매",
        "원가 절감",
        "Cost Reduction",
        "구매 원가분석",
        "VE",
        "VA VE"
      ],
      strongSignals: [
        "제품 또는 부품의 원가 구조를 분석한다",
        "should-cost 모델을 만들어 협상 기준을 설정한다",
        "공급사와 함께 원가 절감 활동을 수행한다",
        "설계 변경, 사양 변경을 통해 비용 절감을 추진한다",
        "비용 요소를 세분화해 절감 기회를 도출한다"
      ],
      mediumSignals: [
        "재료비, 공정비, 간접비 등 원가 요소를 분해한다",
        "기술팀과 협업해 설계 개선을 논의한다",
        "benchmark cost를 활용해 협상 근거를 만든다",
        "원가 절감 프로젝트를 지속적으로 운영한다"
      ],
      boundarySignals: [
        "단순 가격 협상 중심이면 sourcing execution family로 이동한다",
        "카테고리 전략과 공급 구조 설계 중심이면 category strategy family로 이동한다",
        "공급사 관계 유지와 성과 관리 비중이 크면 supplier management family로 이동한다",
        "재무적 원가 분석이 중심이고 구매 실행이 약하면 관리회계 영역으로 읽힐 수 있다"
      ],
      adjacentFamilies: [
        "supplier_sourcing_execution",
        "category_strategy_sourcing",
        "supplier_management"
      ],
      boundaryNote: "원가분석·가치개선 소싱은 단순 협상보다 비용 구조 자체를 바꾸는 데 초점이 있습니다. 반면 실행 협상이나 전략 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 원가 구조를 분석하고 설계·공정 개선을 통해 비용을 절감하는 성격이 강합니다. 반면 단순 협상이나 전략 설계 비중이 커지면 다른 소싱 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "strategic_sourcing_manager",
      label: "Strategic Sourcing Manager",
      aliases: [
        "전략구매 매니저",
        "Strategic Sourcing Manager",
        "Category Manager",
        "구매 전략 담당"
      ],
      family: "category_strategy_sourcing",
      responsibilityHints: [
        "카테고리별 sourcing 전략을 수립한다",
        "공급 시장 분석과 장기 계획을 리드한다",
        "원가 절감 목표를 설정하고 실행을 관리한다"
      ],
      levelHints: [
        "단일 프로젝트보다 카테고리 단위 책임을 가진다",
        "중장기 전략과 의사결정 영향력이 커진다"
      ]
    },
    {
      id: "sourcing_specialist",
      label: "Sourcing Specialist",
      aliases: [
        "소싱 담당",
        "구매 담당",
        "Sourcing Specialist",
        "Buyer"
      ],
      family: "supplier_sourcing_execution",
      responsibilityHints: [
        "공급사 발굴 및 선정 프로세스를 수행한다",
        "견적 비교와 협상을 진행한다",
        "입찰 프로세스를 운영한다"
      ],
      levelHints: [
        "초기에는 단건 sourcing 실행 중심",
        "경험이 쌓일수록 협상 난이도와 범위가 확장된다"
      ]
    },
    {
      id: "supplier_manager",
      label: "Supplier Manager",
      aliases: [
        "공급사 관리 담당",
        "Supplier Manager",
        "Vendor Manager",
        "협력사 담당"
      ],
      family: "supplier_management",
      responsibilityHints: [
        "공급사 성과를 관리하고 개선한다",
        "관계 유지 및 리스크 대응을 수행한다",
        "정기적인 리뷰와 커뮤니케이션을 운영한다"
      ],
      levelHints: [
        "운영 이슈 대응에서 시작",
        "핵심 협력사 파트너십 관리로 확장"
      ]
    },
    {
      id: "cost_engineer",
      label: "Cost Engineer",
      aliases: [
        "원가 엔지니어",
        "Cost Engineer",
        "VE 담당",
        "원가분석 담당"
      ],
      family: "cost_analysis_value_engineering",
      responsibilityHints: [
        "원가 구조를 분석하고 절감안을 도출한다",
        "기술팀과 협업해 설계 개선을 추진한다",
        "협상 기준이 되는 cost model을 만든다"
      ],
      levelHints: [
        "기초 원가 분석에서 시작",
        "복잡한 제품/공정 단위 cost modeling으로 확장"
      ]
    },
    {
      id: "procurement_manager",
      label: "Procurement Manager",
      aliases: [
        "구매 매니저",
        "Procurement Manager",
        "소싱 매니저"
      ],
      family: "category_strategy_sourcing",
      responsibilityHints: [
        "여러 카테고리의 구매 전략을 총괄한다",
        "소싱 및 공급사 관리 조직을 리드한다",
        "성과 및 비용 절감 목표를 관리한다"
      ],
      levelHints: [
        "개별 실행보다 전략과 조직 관리 비중이 크다",
        "전사 수준 의사결정에 관여한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "strategy_vs_execution",
      label: "전략 vs 실행",
      values: [
        "장기 카테고리 전략 설계 중심",
        "단건 소싱 및 협상 실행 중심",
        "관계 관리 및 운영 중심"
      ]
    },
    {
      axisId: "cost_focus",
      label: "원가 접근 방식",
      values: [
        "시장 기반 가격 비교",
        "원가 구조 분석 기반 협상",
        "설계·공정 개선 기반 절감"
      ]
    },
    {
      axisId: "supplier_lifecycle",
      label: "공급사 라이프사이클 관여",
      values: [
        "신규 발굴 및 선정 중심",
        "계약 및 거래 실행 중심",
        "장기 관계 관리 및 개선 중심"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "단기 거래 및 협상 중심",
        "중기 비용 절감 및 프로젝트 중심",
        "장기 공급 구조 및 전략 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "purchasing_operations",
    "supply_chain_planning",
    "manufacturing_engineering",
    "finance_cost_management"
  ],
  boundaryHints: [
    "발주 처리, 납기 관리, 재고 대응 비중이 커지면 구매 운영으로 이동합니다.",
    "공급망 계획, 수요 예측, 생산 연계 비중이 커지면 SCM 계획 영역으로 읽힙니다.",
    "기술 설계와 공정 개선이 중심이 되면 엔지니어링 영역으로 경계가 이동합니다.",
    "재무적 원가 분석과 관리 중심이면 관리회계 쪽으로 일부 역할이 이동합니다.",
    "단순 가격 협상보다 전략 설계가 많아지면 전략구매로, 반대로 실행 협상이 많아지면 소싱 실행으로 읽힙니다."
  ],
  summaryTemplate: "전략구매·소싱은 공급사를 선택하고 비용과 공급 구조를 최적화하는 성격이 강합니다. 같은 영역에서도 전략 설계, 협상 실행, 관계 관리, 원가 개선 중 어디에 집중하느냐에 따라 역할 해석이 달라집니다. 반면 발주 운영이나 생산·SCM 계획 비중이 커지면 다른 직무 경계로 읽힐 수 있습니다."
};
