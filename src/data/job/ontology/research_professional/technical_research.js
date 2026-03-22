export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "TECHNICAL_RESEARCH",
  aliases: [
    "기술 연구",
    "R&D",
    "Research Engineer",
    "Research Scientist",
    "기술개발",
    "선행연구",
    "Applied Research",
    "기술개발 연구원"
  ],
  families: [
    {
      id: "applied_research",
      label: "응용 연구",
      aliases: [
        "Applied Research",
        "제품화 연구",
        "기술개발",
        "상용화 연구"
      ],
      strongSignals: [
        "제품 적용을 위한 기술 개발",
        "프로토타입 구현",
        "성능 개선 실험",
        "기술 검증 및 테스트",
        "사업/제품 요구사항 기반 연구"
      ],
      mediumSignals: [
        "실험 결과 기반 개선 반복",
        "엔지니어링 협업",
        "기술 문서 작성",
        "PoC 수행"
      ],
      boundarySignals: [
        "논문 작성 및 이론 연구 비중 증가",
        "제품 개발 코드 구현 비중 증가",
        "장기 기술 탐색 비중 증가"
      ],
      adjacentFamilies: ["fundamental_research", "development_oriented_research"],
      boundaryNote: "제품 적용보다 이론적 탐구와 논문 작성 비중이 커지면 기초 연구로 이동하며, 실제 서비스 코드 구현과 배포 책임이 커지면 개발 중심 역할로 이동합니다.",
      summaryTemplate: "이 직무는 실제 제품이나 서비스에 적용 가능한 기술을 개발하고 검증하는 성격이 강합니다. 반면 이론 탐구나 개발 구현 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "fundamental_research",
      label: "기초 연구",
      aliases: [
        "Fundamental Research",
        "기초 연구",
        "Research Scientist",
        "이론 연구"
      ],
      strongSignals: [
        "논문 작성 및 발표",
        "이론 모델 설계",
        "새로운 알고리즘 제안",
        "학술 연구 수행",
        "장기 연구 과제 수행"
      ],
      mediumSignals: [
        "실험 설계 및 분석",
        "학회 발표",
        "연구 주제 탐색",
        "연구 보고서 작성"
      ],
      boundarySignals: [
        "제품 적용 및 PoC 수행 증가",
        "코드 구현 및 서비스화 비중 증가",
        "단기 성과 중심 프로젝트 증가"
      ],
      adjacentFamilies: ["applied_research", "development_oriented_research"],
      boundaryNote: "이론 중심에서 벗어나 제품 적용과 실험 구현 비중이 커지면 응용 연구로 이동하며, 실제 서비스 코드 구현이 많아지면 개발 중심 역할로 이동합니다.",
      summaryTemplate: "이 직무는 새로운 이론이나 기술을 탐구하고 학문적 성과를 만드는 성격이 강합니다. 반면 제품 적용이나 개발 구현 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "development_oriented_research",
      label: "개발 연계형 연구",
      aliases: [
        "Research Engineer",
        "R&D Engineer",
        "개발형 연구",
        "엔지니어링 기반 연구"
      ],
      strongSignals: [
        "연구 결과 코드 구현",
        "프로덕션 수준 코드 작성",
        "시스템/서비스 적용",
        "성능 최적화 및 개선",
        "개발 조직과 협업"
      ],
      mediumSignals: [
        "API 개발",
        "데이터 파이프라인 구현",
        "모델 서빙",
        "코드 리뷰 참여"
      ],
      boundarySignals: [
        "이론 연구 및 논문 작성 비중 증가",
        "제품 요구 기반 실험 설계 비중 증가",
        "순수 개발 기능 구현 비중 증가"
      ],
      adjacentFamilies: ["applied_research", "software_engineering"],
      boundaryNote: "연구 코드 구현에서 벗어나 기능 개발과 서비스 운영 비중이 커지면 소프트웨어 엔지니어링으로 이동하며, 이론 탐구 비중이 커지면 기초 연구로 이동합니다.",
      summaryTemplate: "이 직무는 연구 결과를 실제 코드와 시스템으로 구현하는 성격이 강합니다. 반면 이론 연구나 순수 개발 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "exploratory_research",
      label: "탐색형/선행 연구",
      aliases: [
        "Exploratory Research",
        "선행 연구",
        "기술 탐색",
        "Future Tech Research"
      ],
      strongSignals: [
        "신기술 탐색",
        "기술 트렌드 분석",
        "장기 연구 로드맵 수립",
        "기술 가능성 검증",
        "프로토타입 아이디어 실험"
      ],
      mediumSignals: [
        "기술 리서치 보고서 작성",
        "외부 논문 및 기술 분석",
        "컨셉 검증 실험",
        "내부 기술 제안"
      ],
      boundarySignals: [
        "구체적 제품 적용 및 개발 비중 증가",
        "논문 작성 및 학술 연구 비중 증가",
        "조직 내 전략 기획 비중 증가"
      ],
      adjacentFamilies: ["applied_research", "fundamental_research"],
      boundaryNote: "탐색 단계에서 벗어나 실제 제품 적용과 개발 비중이 커지면 응용 연구로 이동하며, 이론적 깊이가 강조되면 기초 연구로 이동합니다.",
      summaryTemplate: "이 직무는 미래 기술과 가능성을 탐색하고 초기 개념을 검증하는 성격이 강합니다. 반면 제품 적용이나 이론 연구 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "research_engineer",
      label: "리서치 엔지니어",
      aliases: ["Research Engineer", "R&D Engineer"],
      family: "development_oriented_research",
      responsibilityHints: [
        "연구 결과 구현",
        "시스템 적용",
        "성능 개선"
      ],
      levelHints: [
        "주니어는 코드 구현 중심",
        "시니어는 시스템 설계 및 기술 방향 기여"
      ]
    },
    {
      id: "research_scientist",
      label: "리서치 사이언티스트",
      aliases: ["Research Scientist"],
      family: "fundamental_research",
      responsibilityHints: [
        "이론 연구 수행",
        "논문 작성",
        "알고리즘 개발"
      ],
      levelHints: [
        "주니어는 실험 및 분석",
        "시니어는 연구 주제 정의 및 리딩"
      ]
    },
    {
      id: "applied_researcher",
      label: "응용 연구원",
      aliases: ["Applied Researcher"],
      family: "applied_research",
      responsibilityHints: [
        "기술 검증 및 적용",
        "프로토타입 개발",
        "제품 연계 연구"
      ],
      levelHints: [
        "주니어는 실험 수행",
        "시니어는 적용 전략 및 기술 방향 정의"
      ]
    },
    {
      id: "exploratory_researcher",
      label: "선행 연구원",
      aliases: ["Exploratory Researcher"],
      family: "exploratory_research",
      responsibilityHints: [
        "기술 탐색",
        "미래 기술 검증",
        "아이디어 실험"
      ],
      levelHints: [
        "주니어는 리서치 및 실험",
        "시니어는 기술 방향 및 로드맵 수립"
      ]
    }
  ],
  axes: [
    {
      axisId: "theory_vs_application",
      label: "이론 vs 적용",
      values: ["이론/탐구 중심", "제품 적용 중심"]
    },
    {
      axisId: "research_vs_engineering",
      label: "연구 vs 구현",
      values: ["연구/실험 중심", "코드/시스템 구현 중심"]
    },
    {
      axisId: "short_term_vs_long_term",
      label: "단기 vs 장기",
      values: ["단기 성과/적용", "장기 기술 탐색"]
    }
  ],
  adjacentFamilies: ["software_engineering", "data_science"],
  boundaryHints: [
    "연구보다 기능 개발과 서비스 운영 비중이 커지면 소프트웨어 엔지니어링으로 이동합니다.",
    "통계 분석과 데이터 기반 모델링 중심으로 이동하면 데이터 사이언스로 해석될 수 있습니다.",
    "장기 탐색보다 제품 적용과 실험 구현 비중이 커지면 응용 연구로 이동합니다."
  ],
  summaryTemplate: "이 직무는 기술을 탐구하고 실험을 통해 새로운 가능성을 검증하거나 제품에 적용하는 역할입니다. 이론 탐구, 제품 적용, 코드 구현 중 어떤 비중이 큰지에 따라 성격이 달라지며, 특정 영역의 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
