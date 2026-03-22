export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "MECHANICAL_DESIGN",
  aliases: [
    "기구설계",
    "Mechanical Design",
    "기계 설계",
    "제품 기구설계",
    "구조 설계",
    "하드웨어 기구설계",
    "기구 엔지니어",
    "Mechanical Engineer",
    "제품 구조 설계",
    "3D 설계",
    "CAD 설계",
    "기구 개발",
    "메카 설계",
    "장비 기구설계",
    "기계 구조 설계",
    "Housing 설계",
    "Bracket 설계",
    "금형 고려 설계",
    "양산 설계"
  ],
  families: [
    {
      id: "product_mechanical_design",
      label: "제품 기구 설계",
      aliases: [
        "제품 기구설계",
        "제품 구조 설계",
        "consumer product mechanical design",
        "device mechanical design"
      ],
      strongSignals: [
        "제품 외형과 내부 구조를 설계한다",
        "부품 간 조립 구조와 간섭을 고려해 설계한다",
        "3D CAD로 제품 구조를 모델링한다",
        "내구성, 강도, 사용성 등을 고려한 구조 설계를 수행한다",
        "양산을 고려한 설계 변경을 반복한다"
      ],
      mediumSignals: [
        "디자인, 전자, 소프트웨어와 협업해 제품 구조를 맞춘다",
        "시제품 제작 후 피드백을 반영해 설계를 수정한다",
        "재질 선정과 부품 사양을 결정한다",
        "제품 크기, 무게, 조립성을 고려한다"
      ],
      boundarySignals: [
        "금형, 사출, 가공 공정 최적화 비중이 커지면 manufacturing design family로 이동한다",
        "해석, 시뮬레이션 중심이면 CAE/해석 엔지니어링으로 이동한다",
        "회로, 전자 부품 설계 비중이 커지면 하드웨어 설계로 이동한다",
        "단순 도면 작성 비중이 높고 설계 의사결정이 약하면 drafting 역할로 읽힌다"
      ],
      adjacentFamilies: [
        "manufacturing_design_dfx",
        "mechanical_analysis_validation",
        "hardware_engineering"
      ],
      boundaryNote: "제품 기구 설계는 구조와 조립을 중심으로 제품 형태를 만드는 역할입니다. 반면 공정 최적화나 해석 중심으로 이동하면 다른 엔지니어링 영역으로 읽힙니다.",
      summaryTemplate: "이 직무는 제품의 외형과 내부 구조를 설계하고 실제 조립 가능성을 구현하는 성격이 강합니다. 반면 공정 최적화나 해석 중심 비중이 커지면 다른 기계 설계 경계로 읽힐 수 있습니다."
    },
    {
      id: "manufacturing_design_dfx",
      label: "양산·공정 설계(DFX)",
      aliases: [
        "DFM",
        "DFA",
        "양산 설계",
        "공정 고려 설계",
        "제조 설계",
        "Design for Manufacturing",
        "Design for Assembly"
      ],
      strongSignals: [
        "금형, 사출, 가공 공정을 고려해 설계를 수정한다",
        "양산성(Manufacturability)을 개선하기 위한 구조 변경을 수행한다",
        "공정 불량을 줄이기 위한 설계 개선을 수행한다",
        "조립 공정 효율을 높이기 위한 설계를 수행한다",
        "생산 라인과 협업해 설계 문제를 해결한다"
      ],
      mediumSignals: [
        "공정 제약 조건을 설계에 반영한다",
        "생산성, 수율 개선을 위한 설계 변경을 검토한다",
        "공정 테스트 결과를 설계에 반영한다",
        "제조 비용 절감을 위한 설계 최적화를 수행한다"
      ],
      boundarySignals: [
        "초기 제품 구조 설계 비중이 크면 product mechanical design family로 이동한다",
        "공정 설계 자체(라인 설계, 공정 flow 설계)가 중심이면 생산기술로 이동한다",
        "원가 분석 중심이면 cost engineering으로 이동한다",
        "품질 문제 분석과 개선 중심이면 품질 엔지니어링으로 이동한다"
      ],
      adjacentFamilies: [
        "product_mechanical_design",
        "production_engineering",
        "quality_engineering"
      ],
      boundaryNote: "양산·공정 설계는 설계를 생산 가능하게 만드는 데 초점이 있습니다. 반면 제품 구조 설계나 공정 자체 설계 비중이 커지면 각각 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 제품을 실제 양산 가능한 형태로 개선하고 공정 적합성을 확보하는 성격이 강합니다. 반면 초기 설계나 공정 자체 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "mechanical_analysis_validation",
      label: "기구 해석·검증",
      aliases: [
        "기구 해석",
        "CAE",
        "Mechanical Analysis",
        "구조 해석",
        "Simulation Engineer",
        "강도 해석",
        "열 해석"
      ],
      strongSignals: [
        "구조 해석, 열 해석, 진동 해석 등을 수행한다",
        "CAE 툴을 활용해 설계의 성능을 검증한다",
        "하중, 온도, 환경 조건에 따른 제품 거동을 분석한다",
        "설계 변경 필요성을 해석 결과로 제시한다",
        "시험 결과와 해석 결과를 비교 검증한다"
      ],
      mediumSignals: [
        "해석 모델을 구축하고 조건을 설정한다",
        "시뮬레이션 결과를 리포트로 작성한다",
        "설계팀과 협업해 개선 방향을 제안한다",
        "제품 신뢰성 검증을 지원한다"
      ],
      boundarySignals: [
        "실제 구조 설계 비중이 커지면 product mechanical design family로 이동한다",
        "시험 장비 기반 물리 테스트 중심이면 validation/시험 엔지니어로 이동한다",
        "데이터 분석 중심이면 데이터 사이언스 영역으로 일부 이동한다",
        "단순 해석 수행만 있고 설계 반영 영향이 적으면 지원 역할로 읽힌다"
      ],
      adjacentFamilies: [
        "product_mechanical_design",
        "manufacturing_design_dfx",
        "validation_testing"
      ],
      boundaryNote: "기구 해석·검증은 설계를 검증하고 개선 방향을 제시하는 역할입니다. 반면 직접 설계 수행 비중이 커지면 설계 직무로 이동합니다.",
      summaryTemplate: "이 직무는 해석과 시뮬레이션을 통해 설계의 성능과 신뢰성을 검증하는 성격이 강합니다. 반면 직접 구조 설계 비중이 커지면 다른 기구설계 경계로 읽힐 수 있습니다."
    },
    {
      id: "mechanical_drafting_detailing",
      label: "도면·상세 설계",
      aliases: [
        "기계 도면",
        "Mechanical Drafting",
        "상세 설계",
        "Detail Design",
        "2D 도면 작성",
        "도면화"
      ],
      strongSignals: [
        "3D 설계를 기반으로 2D 도면을 작성한다",
        "치수, 공차, 재질 정보를 명확히 정의한다",
        "도면 기준에 맞게 설계 문서를 작성한다",
        "BOM과 도면 간 정합성을 유지한다",
        "설계 변경 사항을 도면에 반영한다"
      ],
      mediumSignals: [
        "표준 도면 규격을 준수한다",
        "설계자의 의도를 도면으로 구체화한다",
        "제조 가능성을 고려한 상세 정보를 포함한다",
        "CAD 툴을 활용한 도면 작업이 중심이다"
      ],
      boundarySignals: [
        "설계 의사결정과 구조 설계 비중이 커지면 product mechanical design family로 이동한다",
        "단순 반복 도면 작업 비중이 높으면 오퍼레이션 역할로 읽힌다",
        "공정 최적화나 양산 개선 비중이 커지면 manufacturing design family로 이동한다",
        "해석과 검증 비중이 커지면 analysis family로 이동한다"
      ],
      adjacentFamilies: [
        "product_mechanical_design",
        "manufacturing_design_dfx",
        "mechanical_analysis_validation"
      ],
      boundaryNote: "도면·상세 설계는 설계를 명확히 전달하는 역할입니다. 반면 구조 설계나 공정 개선 비중이 커지면 다른 기구설계 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 설계 결과를 도면으로 구체화하고 제조에 필요한 정보를 명확히 정의하는 성격이 강합니다. 반면 구조 설계나 공정 개선 비중이 커지면 다른 기구설계 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "mechanical_design_engineer",
      label: "Mechanical Design Engineer",
      aliases: [
        "기구 설계 엔지니어",
        "Mechanical Engineer",
        "제품 설계 엔지니어"
      ],
      family: "product_mechanical_design",
      responsibilityHints: [
        "제품 구조와 부품을 설계한다",
        "CAD를 활용해 모델링을 수행한다",
        "조립성과 내구성을 고려한 설계를 한다"
      ],
      levelHints: [
        "초기에는 단일 부품 설계 중심",
        "경험이 쌓일수록 전체 구조 설계와 의사결정 비중 증가"
      ]
    },
    {
      id: "dfx_engineer",
      label: "DFX Engineer",
      aliases: [
        "DFM 엔지니어",
        "DFA 엔지니어",
        "양산 설계 엔지니어"
      ],
      family: "manufacturing_design_dfx",
      responsibilityHints: [
        "양산성 개선을 위한 설계 변경을 수행한다",
        "공정 조건을 설계에 반영한다",
        "생산성과 수율을 개선한다"
      ],
      levelHints: [
        "초기에는 설계 수정 지원 중심",
        "상위 레벨에서는 공정-설계 통합 개선 리드"
      ]
    },
    {
      id: "mechanical_analysis_engineer",
      label: "Mechanical Analysis Engineer",
      aliases: [
        "CAE 엔지니어",
        "구조 해석 엔지니어",
        "Simulation Engineer"
      ],
      family: "mechanical_analysis_validation",
      responsibilityHints: [
        "구조 및 열 해석을 수행한다",
        "설계 검증을 위한 시뮬레이션을 진행한다",
        "해석 결과를 기반으로 개선안을 제시한다"
      ],
      levelHints: [
        "기초 해석 수행에서 시작",
        "복잡한 시스템 해석 및 설계 영향도 확대"
      ]
    },
    {
      id: "mechanical_drafter",
      label: "Mechanical Drafter",
      aliases: [
        "기계 도면 담당",
        "CAD Drafter",
        "도면 설계자"
      ],
      family: "mechanical_drafting_detailing",
      responsibilityHints: [
        "2D 도면을 작성하고 관리한다",
        "치수와 공차를 정의한다",
        "설계 변경 사항을 도면에 반영한다"
      ],
      levelHints: [
        "정형화된 도면 작업 중심",
        "복잡한 설계 의도 반영 및 상세화로 확장"
      ]
    },
    {
      id: "mechanical_manager",
      label: "Mechanical Engineering Manager",
      aliases: [
        "기구 설계 매니저",
        "Mechanical Manager",
        "기계 설계 팀장"
      ],
      family: "product_mechanical_design",
      responsibilityHints: [
        "기구 설계 조직을 리드한다",
        "설계 방향성과 품질을 관리한다",
        "프로젝트 전반의 설계 의사결정을 조율한다"
      ],
      levelHints: [
        "개별 설계보다 전체 구조와 방향성 관리 중심",
        "조직 간 협업과 의사결정 영향력 확대"
      ]
    }
  ],
  axes: [
    {
      axisId: "design_vs_validation",
      label: "설계 vs 검증",
      values: [
        "구조 설계 중심",
        "공정 고려 설계 중심",
        "해석 및 검증 중심"
      ]
    },
    {
      axisId: "product_vs_process",
      label: "제품 vs 공정",
      values: [
        "제품 구조 설계 중심",
        "양산 및 공정 최적화 중심",
        "공정 연계 설계 개선 중심"
      ]
    },
    {
      axisId: "decision_level",
      label: "의사결정 수준",
      values: [
        "도면 및 상세 설계 실행 중심",
        "부품 및 구조 설계 의사결정",
        "제품 전체 구조 및 방향성 결정"
      ]
    },
    {
      axisId: "analysis_depth",
      label: "해석 깊이",
      values: [
        "기본 설계 검토 수준",
        "해석 기반 설계 보완",
        "고급 시뮬레이션 기반 설계 검증"
      ]
    }
  ],
  adjacentFamilies: [
    "hardware_engineering",
    "production_engineering",
    "quality_engineering",
    "industrial_design"
  ],
  boundaryHints: [
    "전자 회로 설계 비중이 커지면 하드웨어 엔지니어링으로 이동합니다.",
    "생산 공정 설계와 라인 구축 비중이 커지면 생산기술 영역으로 이동합니다.",
    "품질 문제 분석과 개선 비중이 커지면 품질 엔지니어링으로 이동합니다.",
    "외형 디자인과 사용자 경험 비중이 커지면 산업디자인으로 이동합니다.",
    "단순 도면 작업 비중이 높아지면 설계보다는 오퍼레이션 역할로 읽힙니다."
  ],
  summaryTemplate: "기구설계는 제품의 구조와 형태를 설계하고 실제 구현 가능성을 만드는 성격이 강합니다. 같은 기구설계 내에서도 제품 설계, 양산 설계, 해석, 도면 중 어디에 집중하느냐에 따라 역할이 달라집니다. 반면 공정, 전자, 품질 중심 비중이 커지면 다른 엔지니어링 영역으로 읽힐 수 있습니다."
};
