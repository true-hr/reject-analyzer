export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "MANUFACTURING_INNOVATION",
  aliases: [
    "제조혁신",
    "생산혁신",
    "Manufacturing Innovation",
    "Production Innovation",
    "공정 혁신",
    "Lean",
    "Six Sigma",
    "Operational Excellence",
    "OPEX",
    "공장 혁신",
    "스마트팩토리",
    "디지털 제조 혁신",
    "PI",
    "Process Innovation"
  ],
  families: [
    {
      id: "lean_sixsigma_improvement",
      label: "Lean·Six Sigma 개선",
      aliases: [
        "Lean",
        "Six Sigma",
        "공정 개선",
        "낭비 제거",
        "생산성 혁신",
        "Continuous Improvement"
      ],
      strongSignals: [
        "DMAIC 기반 개선 프로젝트 수행",
        "낭비(Waste) 제거 및 공정 효율 개선",
        "Cycle Time 단축 활동",
        "수율(Yield) 개선 프로젝트",
        "표준 작업 개선 및 최적화",
        "공정 데이터 기반 문제 정의 및 개선"
      ],
      mediumSignals: [
        "개선 과제 포트폴리오 관리",
        "현장 개선 워크숍 운영",
        "개선 성과 측정 및 리포트",
        "개선 방법론 교육",
        "개선 사례 확산"
      ],
      boundarySignals: [
        "디지털 시스템 도입보다 현장 공정 개선 비중이 크면 이 family에 가깝다",
        "전략 기획보다 실행형 개선 프로젝트 비중이 크면 이 family에 가깝다",
        "일회성 대응보다 반복 개선 활동 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "smart_factory_digitalization",
        "process_standardization_system",
        "strategy_transformation"
      ],
      boundaryNote: "시스템 도입이나 전략 수립보다 현장의 낭비 제거와 공정 개선 프로젝트 수행 비중이 커질수록 Lean·Six Sigma 개선으로 읽힙니다. 반면 디지털화나 전사 전략 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 공정의 낭비를 줄이고 생산성을 높이는 개선 활동을 수행하는 성격이 강합니다. Lean과 Six Sigma 기반 실행형 개선이 핵심입니다. 반면 디지털화나 전략 기획 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "smart_factory_digitalization",
      label: "스마트팩토리·디지털 전환",
      aliases: [
        "스마트팩토리",
        "디지털 제조",
        "Manufacturing Digitalization",
        "MES 구축",
        "IoT 제조",
        "공장 자동화",
        "데이터 기반 제조"
      ],
      strongSignals: [
        "MES, ERP, SCADA 등 시스템 도입 및 고도화",
        "설비 데이터 수집 및 IoT 연계",
        "공정 데이터 기반 의사결정 체계 구축",
        "자동화 설비 및 로봇 도입 검토",
        "디지털 대시보드 구축",
        "데이터 기반 생산 관리 체계 설계"
      ],
      mediumSignals: [
        "시스템 요구사항 정의",
        "데이터 정합성 관리",
        "현장-시스템 연계 조정",
        "디지털 전환 로드맵 수립",
        "사용자 교육 및 전파"
      ],
      boundarySignals: [
        "공정 개선보다 시스템 도입 및 데이터 활용 비중이 크면 이 family에 가깝다",
        "현장 개선보다 IT/데이터 연계 비중이 크면 이 family에 가깝다",
        "단순 자동화보다 전체 운영 디지털화 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "lean_sixsigma_improvement",
        "process_standardization_system",
        "it_system"
      ],
      boundaryNote: "현장 공정 자체 개선보다 시스템과 데이터를 활용한 제조 혁신 비중이 커질수록 스마트팩토리·디지털 전환으로 읽힙니다. 반면 시스템보다 공정 개선 중심이면 Lean 개선으로 이동합니다.",
      summaryTemplate: "이 직무는 제조 현장을 디지털화하고 데이터 기반으로 운영을 혁신하는 성격이 강합니다. 시스템과 데이터 활용이 핵심입니다. 반면 공정 개선 중심이면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "process_standardization_system",
      label: "프로세스 표준화·운영체계 구축",
      aliases: [
        "표준화",
        "운영 체계 구축",
        "Process Standardization",
        "운영 표준",
        "SOP 구축",
        "Best Practice 확산"
      ],
      strongSignals: [
        "전사 공정 표준(SOP) 수립 및 관리",
        "Best Practice 정의 및 확산",
        "표준 준수 체계 구축",
        "공정 변경 관리 프로세스 설계",
        "운영 매뉴얼 및 기준 정립",
        "표준 기반 운영 평가 체계 구축"
      ],
      mediumSignals: [
        "표준 문서 관리",
        "표준 교육 및 전파",
        "표준 준수 모니터링",
        "운영 프로세스 정비",
        "표준 이탈 개선 활동"
      ],
      boundarySignals: [
        "개별 개선보다 전사 기준 정립 비중이 크면 이 family에 가깝다",
        "시스템 구축보다 운영 기준 정의 비중이 크면 이 family에 가깝다",
        "단기 개선보다 지속 운영 체계 구축 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "lean_sixsigma_improvement",
        "smart_factory_digitalization",
        "quality_management"
      ],
      boundaryNote: "개별 공정 개선보다 전사적으로 동일하게 적용할 기준과 운영 체계를 만드는 책임이 커질수록 프로세스 표준화·운영체계 구축으로 읽힙니다. 반면 개선 프로젝트나 시스템 도입 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 제조 공정의 표준과 운영 체계를 정립하는 성격이 강합니다. 일관된 운영을 위한 기준 정의가 핵심입니다. 반면 개선 실행이나 시스템 구축 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "strategy_transformation",
      label: "제조 혁신 전략·Transformation",
      aliases: [
        "제조 전략",
        "혁신 전략",
        "Transformation",
        "공장 혁신 전략",
        "Operational Strategy",
        "혁신 로드맵"
      ],
      strongSignals: [
        "전사 제조 혁신 로드맵 수립",
        "혁신 과제 포트폴리오 설계",
        "투자 우선순위 및 효과 분석",
        "혁신 KPI 정의 및 관리",
        "중장기 생산 구조 재설계",
        "경영진 보고용 혁신 전략 수립"
      ],
      mediumSignals: [
        "혁신 프로젝트 성과 관리",
        "전사 단위 협의 및 조정",
        "외부 벤치마크 분석",
        "혁신 프로그램 기획",
        "전략 실행 모니터링"
      ],
      boundarySignals: [
        "현장 실행보다 전략 수립 비중이 크면 이 family에 가깝다",
        "개별 개선보다 전사 방향 설정 비중이 크면 이 family에 가깝다",
        "시스템 구축보다 투자 및 전략 판단 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "lean_sixsigma_improvement",
        "smart_factory_digitalization",
        "strategy"
      ],
      boundaryNote: "현장 개선이나 시스템 구축보다 전사 차원의 방향과 우선순위를 설계하는 책임이 커질수록 제조 혁신 전략·Transformation으로 읽힙니다. 반면 실행 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 제조 혁신의 방향과 전략을 설계하는 성격이 강합니다. 중장기 로드맵과 투자 판단이 핵심입니다. 반면 실행이나 시스템 구축 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "continuous_improvement_manager",
      label: "지속개선 담당자",
      aliases: [
        "Continuous Improvement Manager",
        "Lean 담당",
        "Six Sigma 담당",
        "생산혁신 담당"
      ],
      family: "lean_sixsigma_improvement",
      responsibilityHints: [
        "개선 프로젝트 수행",
        "생산성 향상 활동",
        "낭비 제거",
        "개선 성과 관리"
      ],
      levelHints: [
        "문제를 구조적으로 정의하고 개선할 수 있다",
        "현장에서 실행 가능한 개선안을 도출할 수 있다"
      ]
    },
    {
      id: "smart_factory_engineer",
      label: "스마트팩토리 담당자",
      aliases: [
        "Smart Factory Engineer",
        "디지털 제조 담당",
        "MES 담당",
        "제조 데이터 담당"
      ],
      family: "smart_factory_digitalization",
      responsibilityHints: [
        "시스템 도입 및 운영 정의",
        "데이터 기반 공정 관리",
        "자동화 설비 검토",
        "디지털 대시보드 구축"
      ],
      levelHints: [
        "제조와 IT를 연결해 이해할 수 있다",
        "데이터 기반 개선 방향을 제시할 수 있다"
      ]
    },
    {
      id: "process_standard_manager",
      label: "표준화 담당자",
      aliases: [
        "Process Standard Manager",
        "운영 표준 담당",
        "SOP 담당",
        "공정 표준 담당"
      ],
      family: "process_standardization_system",
      responsibilityHints: [
        "표준 수립 및 관리",
        "운영 체계 구축",
        "표준 준수 관리",
        "Best Practice 확산"
      ],
      levelHints: [
        "전사 기준을 정의하고 정착시킬 수 있다",
        "표준과 실제 운영 간 괴리를 줄일 수 있다"
      ]
    },
    {
      id: "manufacturing_strategy_manager",
      label: "제조혁신 전략 담당자",
      aliases: [
        "Manufacturing Strategy Manager",
        "혁신 전략 담당",
        "Transformation Manager",
        "공장 혁신 전략 담당"
      ],
      family: "strategy_transformation",
      responsibilityHints: [
        "혁신 로드맵 수립",
        "투자 우선순위 설정",
        "전사 과제 설계",
        "성과 관리"
      ],
      levelHints: [
        "전사 관점에서 제조 구조를 설계할 수 있다",
        "전략과 실행을 연결해 설명할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "innovation_focus",
      label: "혁신 초점",
      values: [
        "공정 개선 실행",
        "디지털 전환",
        "표준 및 체계 구축",
        "전략 및 방향 설정"
      ]
    },
    {
      axisId: "execution_vs_strategy",
      label: "실행 vs 전략",
      values: [
        "현장 실행 중심",
        "시스템 구축 중심",
        "운영 기준 중심",
        "전략 설계 중심"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "단기 개선",
        "중기 전환",
        "지속 운영 체계",
        "중장기 전략"
      ]
    }
  ],
  adjacentFamilies: [
    "생산기술",
    "생산관리",
    "품질",
    "IT",
    "전략기획"
  ],
  boundaryHints: [
    "현장 개선 프로젝트 비중이 커지면 Lean 개선으로 읽힙니다.",
    "시스템과 데이터 기반 전환 비중이 커지면 스마트팩토리로 이동합니다.",
    "표준과 운영 체계 구축 비중이 커지면 표준화 쪽으로 해석됩니다.",
    "전사 전략과 로드맵 수립 비중이 커지면 전략·Transformation으로 읽힙니다.",
    "공정 설계나 기술 개발 비중이 커지면 생산기술 직무와 경계가 가까워집니다."
  ],
  summaryTemplate: "제조혁신 직무는 생산 공정과 운영 방식을 개선하고 진화시키는 역할입니다. 개선 실행, 디지털 전환, 표준화, 전략 설계 중 어디에 중심이 있는지에 따라 역할이 달라집니다. 반면 기술 개발이나 일상 운영 비중이 커지면 인접 직무로 읽힐 수 있습니다."
};
