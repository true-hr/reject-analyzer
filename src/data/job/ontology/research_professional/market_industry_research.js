export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "MARKET_INDUSTRY_RESEARCH",
  aliases: [
    "시장조사",
    "산업분석",
    "시장 분석가",
    "산업 연구원",
    "Market Researcher",
    "Industry Analyst",
    "시장 리서처",
    "리서치 애널리스트",
    "Market Intelligence",
    "Business Research Analyst"
  ],
  families: [
    {
      id: "market_research_execution",
      label: "시장조사 실행",
      aliases: [
        "정량 조사",
        "정성 조사",
        "리서치 실행",
        "서베이 설계",
        "FGI",
        "인터뷰 리서치"
      ],
      strongSignals: [
        "설문 설계 및 배포",
        "응답 데이터 수집 및 정제",
        "FGI/IDI 진행",
        "리서치 패널 관리",
        "리서치 결과 리포트 작성"
      ],
      mediumSignals: [
        "데이터 코딩 및 클리닝",
        "기초 통계 분석 수행",
        "리서치 업체 협업",
        "리서치 일정 관리"
      ],
      boundarySignals: [
        "산업 구조 분석 비중 증가",
        "사업 전략 제안 비중 증가",
        "데이터 모델링 및 고급 분석 증가"
      ],
      adjacentFamilies: [
        "industry_analysis",
        "strategy_insight",
        "data_research"
      ],
      boundaryNote: "단순 조사 실행을 넘어서 산업 구조나 경쟁 구도를 해석하기 시작하면 산업분석으로 이동하며, 의사결정 제안까지 포함되면 전략 인사이트 영역으로 확장됩니다.",
      summaryTemplate: "이 직무는 시장 데이터를 직접 수집하고 조사 설계를 통해 인사이트를 도출하는 실행 중심 성격이 강합니다. 반면 산업 구조 해석이나 전략 제안 비중이 커지면 다른 영역으로 읽힐 수 있습니다."
    },
    {
      id: "industry_analysis",
      label: "산업/시장 분석",
      aliases: [
        "산업 분석",
        "시장 분석",
        "Competitive Analysis",
        "산업 리서치",
        "시장 구조 분석"
      ],
      strongSignals: [
        "시장 규모 추정",
        "경쟁사 분석",
        "산업 구조 분석",
        "밸류체인 분석",
        "트렌드 리포트 작성"
      ],
      mediumSignals: [
        "시장 성장률 예측",
        "데스크 리서치 수행",
        "외부 데이터 소스 활용",
        "리포트 기반 인사이트 정리"
      ],
      boundarySignals: [
        "설문/인터뷰 실행 비중 증가",
        "전략 실행안 제시 비중 증가",
        "데이터 모델링 중심 분석 증가"
      ],
      adjacentFamilies: [
        "market_research_execution",
        "strategy_insight",
        "data_research"
      ],
      boundaryNote: "1차 조사 실행이 중심이 되면 시장조사 실행으로 이동하며, 분석 결과를 기반으로 구체적 사업 방향 제안까지 수행하면 전략 인사이트 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 산업과 시장 구조를 해석하고 경쟁 구도를 분석하는 성격이 강합니다. 반면 직접 조사 실행이나 전략 실행 제안 비중이 커지면 다른 영역으로 구분될 수 있습니다."
    },
    {
      id: "strategy_insight",
      label: "전략 인사이트 리서치",
      aliases: [
        "전략 리서치",
        "인사이트 분석",
        "Business Insight",
        "전략 분석가",
        "시장 인사이트"
      ],
      strongSignals: [
        "경영 의사결정 지원 리포트 작성",
        "시장 진입 전략 제안",
        "신사업 기회 도출",
        "핵심 인사이트 기반 액션 제안",
        "경영진 보고용 자료 작성"
      ],
      mediumSignals: [
        "시장/산업 분석 결과 재해석",
        "리서치 결과를 전략으로 연결",
        "비즈니스 케이스 작성",
        "가설 기반 분석"
      ],
      boundarySignals: [
        "데이터 수집/조사 실행 비중 증가",
        "순수 산업 구조 분석 비중 증가",
        "통계 모델링 중심 분석 증가"
      ],
      adjacentFamilies: [
        "industry_analysis",
        "market_research_execution",
        "data_research"
      ],
      boundaryNote: "전략 제안보다 분석 자체에 집중하면 산업분석으로 이동하며, 조사 실행이 중심이 되면 시장조사 실행으로 읽힙니다.",
      summaryTemplate: "이 직무는 시장과 산업 데이터를 기반으로 실제 사업 의사결정에 연결되는 인사이트를 도출하는 성격이 강합니다. 반면 분석 자체나 조사 실행 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "data_research",
      label: "데이터 기반 리서치",
      aliases: [
        "데이터 리서치",
        "Quant Research",
        "데이터 분석 리서처",
        "리서치 데이터 분석"
      ],
      strongSignals: [
        "대규모 데이터 분석 수행",
        "통계 모델 활용",
        "데이터 기반 인사이트 도출",
        "SQL/Python 기반 분석",
        "데이터 시각화 리포트 작성"
      ],
      mediumSignals: [
        "기초 통계 분석",
        "데이터 정제 및 전처리",
        "데이터 파이프라인 일부 이해",
        "대시보드 활용"
      ],
      boundarySignals: [
        "설문/인터뷰 중심 조사 증가",
        "산업 구조 해석 중심 분석 증가",
        "전략 제안 비중 증가"
      ],
      adjacentFamilies: [
        "market_research_execution",
        "industry_analysis",
        "strategy_insight"
      ],
      boundaryNote: "데이터 처리보다 조사 설계와 실행이 중심이 되면 시장조사로 이동하며, 산업 구조 해석이나 전략 제안 비중이 커지면 각각 산업분석이나 전략 인사이트 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 데이터 분석을 통해 시장과 사용자 행동을 정량적으로 해석하는 성격이 강합니다. 반면 조사 실행이나 전략 제안 비중이 커지면 다른 영역으로 구분될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "market_researcher",
      label: "시장조사 연구원",
      aliases: ["Market Researcher"],
      family: "market_research_execution",
      responsibilityHints: [
        "설문 및 인터뷰 설계",
        "데이터 수집 및 분석",
        "리서치 리포트 작성"
      ],
      levelHints: [
        "주니어는 조사 실행 중심, 시니어는 설계 및 인사이트 도출 비중 증가"
      ]
    },
    {
      id: "industry_analyst",
      label: "산업 분석가",
      aliases: ["Industry Analyst"],
      family: "industry_analysis",
      responsibilityHints: [
        "시장 규모 및 경쟁 분석",
        "산업 구조 해석",
        "트렌드 리포트 작성"
      ],
      levelHints: [
        "주니어는 데이터 수집/정리, 시니어는 구조 해석과 전망 제시"
      ]
    },
    {
      id: "strategy_analyst",
      label: "전략 분석가",
      aliases: ["Strategy Analyst"],
      family: "strategy_insight",
      responsibilityHints: [
        "사업 전략 인사이트 도출",
        "의사결정 지원 자료 작성",
        "신사업 기회 분석"
      ],
      levelHints: [
        "주니어는 분석 보조, 시니어는 방향성 제안과 의사결정 영향 확대"
      ]
    },
    {
      id: "data_research_analyst",
      label: "데이터 리서치 분석가",
      aliases: ["Quant Researcher", "Data Research Analyst"],
      family: "data_research",
      responsibilityHints: [
        "데이터 기반 분석 수행",
        "통계 모델 활용",
        "데이터 시각화 및 리포트"
      ],
      levelHints: [
        "주니어는 데이터 처리 중심, 시니어는 모델링과 인사이트 설계 비중 증가"
      ]
    }
  ],
  axes: [
    {
      axisId: "research_method",
      label: "리서치 방식",
      values: [
        "1차 조사 중심",
        "데스크/산업 분석 중심",
        "데이터 모델링 중심"
      ]
    },
    {
      axisId: "insight_depth",
      label: "인사이트 활용 수준",
      values: [
        "데이터/사실 전달 중심",
        "해석 중심",
        "전략/의사결정 제안 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "strategy_consulting",
    "data_analytics",
    "product_analytics"
  ],
  boundaryHints: [
    "설문/인터뷰 등 1차 데이터 수집 비중이 높아지면 시장조사 실행으로 이동합니다.",
    "경쟁 구도와 산업 구조 해석 비중이 커지면 산업분석으로 읽힙니다.",
    "경영 의사결정에 직접 연결되는 제안 비중이 커지면 전략 인사이트 영역으로 확장됩니다.",
    "데이터 모델링과 정량 분석 비중이 높아지면 데이터 기반 리서치로 이동합니다."
  ],
  summaryTemplate: "이 직무는 시장과 산업에 대한 정보를 수집하고 해석하여 인사이트를 도출하는 역할입니다. 다만 조사 실행, 구조 분석, 전략 제안, 데이터 분석 중 어떤 비중이 큰지에 따라 세부 영역이 달라질 수 있습니다."
};
