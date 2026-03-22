export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "RESEARCH_AND_DEVELOPMENT",
  aliases: [
    "연구개발",
    "R&D",
    "Research and Development",
    "연구소",
    "개발연구",
    "선행개발",
    "제품개발",
    "기술개발",
    "신기술개발",
    "신제품개발",
    "응용연구",
    "개발엔지니어",
    "연구원",
    "R&D Engineer",
    "Research Engineer",
    "Development Engineer"
  ],
  families: [
    {
      id: "rnd_advanced_research",
      label: "선행연구/기술탐색",
      aliases: [
        "선행연구",
        "기술탐색",
        "기초연구",
        "응용연구",
        "advanced research",
        "applied research",
        "technology scouting",
        "feasibility study",
        "PoC 연구"
      ],
      strongSignals: [
        "신기술 가능성을 검토하고 feasibility study, PoC를 수행한다",
        "제품화 이전 단계에서 원리 검증, 성능 가능성, 기술 대안을 탐색한다",
        "논문, 특허, 기술동향을 검토해 연구 방향을 제안한다",
        "실험 설계와 프로토타입 검증을 통해 기술 성립 여부를 판단한다",
        "당장 양산이나 출시보다 미래 기술 축적과 기술 선택이 핵심이다"
      ],
      mediumSignals: [
        "실험 데이터 기반으로 기술 옵션을 비교하고 연구 방향을 정리한다",
        "특허 검토, 신규성 검토, 기술 차별화 포인트를 정리한다",
        "외부 기술, 산학 협력, 연구과제 기반으로 가능성을 탐색한다",
        "기술 로드맵, 선행 검토 보고서, 연구 결과 요약 자료를 작성한다"
      ],
      boundarySignals: [
        "양산 적용, 부품 사양 확정, 일정 맞춤형 개발 비중이 커지면 제품개발/상용화개발로 이동한다",
        "성능 튜닝과 불량 개선, 기존 제품 개선 비중이 커지면 제품개선/성능개선으로 이동한다",
        "특허보다 출시 요구사항, 고객 스펙, 인증 대응 비중이 커지면 상용화 개발 경계로 이동한다"
      ],
      adjacentFamilies: [
        "rnd_product_development",
        "rnd_product_improvement",
        "technology_strategy_interface"
      ],
      boundaryNote: "이 family는 아직 정답이 확정되지 않은 기술 가능성을 탐색하는 성격이 강합니다. 일정이 고정된 제품 개발보다 기술 성립 여부와 대안 검토 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 제품화 이전 단계에서 기술 가능성을 탐색하는 성격이 강합니다. 선행연구, PoC, 원리 검증, 기술 대안 탐색이 핵심이라면 이 family에 가깝습니다. 반면 출시 일정에 맞춘 사양 확정과 양산 적용 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "rnd_product_development",
      label: "제품개발/상용화개발",
      aliases: [
        "제품개발",
        "상용화개발",
        "신제품개발",
        "개발",
        "development",
        "product development",
        "commercialization development",
        "NPI 개발",
        "양산개발"
      ],
      strongSignals: [
        "제품 요구사항을 바탕으로 사양을 구체화하고 개발한다",
        "개발 일정, 샘플 제작, 성능 검증, 양산 이관을 포함한 제품화 과정을 주도한다",
        "부품 선정, 구조 설계, 회로·소재·알고리즘 등 실제 제품 구성 요소를 확정한다",
        "고객 요구사항, 인증 기준, 양산성 제약을 반영해 개발안을 조정한다",
        "개발 결과물을 시제품, EVT/DVT/PVT, 양산 적용 단계로 연결한다"
      ],
      mediumSignals: [
        "유관부서와 협업해 BOM, 사양서, 테스트 결과, 변경 이력을 관리한다",
        "양산 전 검증과 이슈 대응을 수행한다",
        "원가, 일정, 품질, 성능의 균형을 맞춰 개발 결정을 내린다",
        "프로젝트 단위로 개발 milestone과 deliverable을 관리한다"
      ],
      boundarySignals: [
        "원리 검증과 기술 탐색 비중이 커지면 선행연구/기술탐색으로 이동한다",
        "출시 후 성능 튜닝, 필드 이슈 대응, 개선개발 비중이 커지면 제품개선/성능개선으로 이동한다",
        "시험 절차 운영과 인증 문서 대응 비중이 커지면 검증/시험 또는 인증 경계로 이동한다"
      ],
      adjacentFamilies: [
        "rnd_advanced_research",
        "rnd_product_improvement",
        "verification_testing_interface"
      ],
      boundaryNote: "이 family는 실제 시장이나 고객 요구에 맞는 제품을 완성해내는 성격이 강합니다. 기술 탐색보다 사양 확정과 제품화, 양산 연결 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 요구사항을 실제 제품으로 구체화하고 상용화하는 성격이 강합니다. 사양 확정, 시제품 개발, 검증, 양산 이관이 핵심이라면 이 family에 가깝습니다. 반면 기술 탐색 중심이거나 출시 후 개선 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "rnd_product_improvement",
      label: "제품개선/성능개선",
      aliases: [
        "제품개선",
        "성능개선",
        "개선개발",
        "cost down 개발",
        "value engineering",
        "optimization",
        "제품 튜닝",
        "기존제품 개선"
      ],
      strongSignals: [
        "기존 제품의 성능, 품질, 원가, 신뢰성을 개선한다",
        "시장 출시 이후 발생한 문제를 분석하고 설계나 사양을 수정한다",
        "불량 원인, 성능 저하, 고객 클레임 이슈를 개발 관점에서 해결한다",
        "원가절감, 부품 대체, 구조 변경, 소프트웨어 튜닝 등 개선안을 적용한다",
        "완전 신제품보다 기존 플랫폼이나 기존 제품의 업그레이드 비중이 크다"
      ],
      mediumSignals: [
        "필드 데이터, 불량 데이터, VOC를 분석해 개선 우선순위를 정한다",
        "변경점 검증과 재발 방지 관점에서 개선안을 설계한다",
        "생산, 품질, 서비스 부서와 함께 개선 효과를 확인한다",
        "개선 이력과 변경관리 문서를 유지한다"
      ],
      boundarySignals: [
        "신규 기술 성립 여부 검토와 미래 기술 탐색 비중이 커지면 선행연구/기술탐색으로 이동한다",
        "완전히 새로운 제품 아키텍처와 신규 사양 개발 비중이 커지면 제품개발/상용화개발로 이동한다",
        "공정 조건, 생산 수율, 제조 최적화 비중이 커지면 생산기술/공정기술 경계로 이동한다"
      ],
      adjacentFamilies: [
        "rnd_product_development",
        "rnd_advanced_research",
        "process_engineering_interface"
      ],
      boundaryNote: "이 family는 이미 존재하는 제품을 더 잘 작동하게 만들거나 더 싸고 안정적으로 바꾸는 성격이 강합니다. 완전 신규 개발보다 성능 개선과 문제 해결 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 기존 제품의 성능, 품질, 원가를 개선하는 성격이 강합니다. 불량 원인 해결, 성능 튜닝, cost down, 사양 개선이 핵심이라면 이 family에 가깝습니다. 반면 완전 신규 제품 개발이나 기술 탐색 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "rnd_verification_reliability",
      label: "개발검증/신뢰성",
      aliases: [
        "개발검증",
        "신뢰성",
        "R&D 검증",
        "reliability engineering",
        "validation engineering",
        "design verification",
        "DV",
        "reliability test"
      ],
      strongSignals: [
        "개발품의 성능, 신뢰성, 내구성 시험 계획을 수립하고 수행한다",
        "설계 검증 항목, test spec, validation criteria를 정의한다",
        "환경시험, 수명시험, 내구시험, 신뢰성 시험 결과로 설계 적합성을 판단한다",
        "시험 중 발견된 failure mode를 분석하고 개발팀과 개선안을 도출한다",
        "출시 전 검증 게이트를 운영하거나 신뢰성 기준 충족 여부를 확인한다"
      ],
      mediumSignals: [
        "시험 장비 셋업, 샘플 관리, 검증 리포트 작성을 수행한다",
        "재현 시험, 비교 시험, 기준 이탈 분석을 수행한다",
        "품질, 인증, 개발 부서와 함께 기준과 결과를 조율한다",
        "신뢰성 지표와 validation coverage를 관리한다"
      ],
      boundarySignals: [
        "핵심 책임이 설계 자체와 사양 확정이면 제품개발/상용화개발로 이동한다",
        "공식 인증 취득, 규격 문서 대응, 대외 인증기관 대응 비중이 커지면 인증/규제 대응 경계로 이동한다",
        "양산 후 불량 개선과 field issue 중심이면 제품개선/성능개선으로 이동한다"
      ],
      adjacentFamilies: [
        "rnd_product_development",
        "rnd_product_improvement",
        "certification_regulatory_interface"
      ],
      boundaryNote: "이 family는 제품을 직접 설계하기보다 설계가 기준을 만족하는지 입증하는 성격이 강합니다. 시험 설계와 신뢰성 판단 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 개발된 제품이 성능과 신뢰성 기준을 만족하는지 검증하는 성격이 강합니다. 설계 검증, 내구시험, failure 분석, 신뢰성 판단이 핵심이라면 이 family에 가깝습니다. 반면 설계 자체나 인증 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "advanced_research_engineer",
      label: "선행연구원",
      aliases: [
        "선행개발 연구원",
        "Research Engineer",
        "Applied Research Engineer",
        "선행기술 연구원"
      ],
      family: "rnd_advanced_research",
      responsibilityHints: [
        "기술 가능성 검토와 PoC를 수행한다",
        "기술 대안을 비교하고 연구 방향을 제안한다",
        "논문, 특허, 실험 결과를 바탕으로 기술 성립 여부를 판단한다"
      ],
      levelHints: [
        "주니어는 실험 수행과 데이터 정리 비중이 높다",
        "미들 레벨은 연구 설계와 기술 옵션 비교를 주도한다",
        "시니어는 기술 로드맵과 연구 방향 설정을 이끈다"
      ]
    },
    {
      id: "product_development_engineer",
      label: "제품개발 엔지니어",
      aliases: [
        "개발연구원",
        "R&D Engineer",
        "Product Development Engineer",
        "신제품개발 담당"
      ],
      family: "rnd_product_development",
      responsibilityHints: [
        "제품 사양을 구체화하고 시제품부터 양산 이관까지 개발한다",
        "부품·구조·알고리즘 등 실제 제품 구성 요소를 확정한다",
        "품질, 원가, 일정 제약을 반영해 개발안을 조정한다"
      ],
      levelHints: [
        "주니어는 설계 변경 반영과 샘플 평가 비중이 높다",
        "미들 레벨은 모듈 또는 제품 단위 개발을 주도한다",
        "시니어는 제품 아키텍처와 개발 방향을 총괄한다"
      ]
    },
    {
      id: "product_improvement_engineer",
      label: "제품개선 엔지니어",
      aliases: [
        "개선개발 엔지니어",
        "Optimization Engineer",
        "Value Engineering Engineer",
        "성능개선 담당"
      ],
      family: "rnd_product_improvement",
      responsibilityHints: [
        "기존 제품의 성능, 품질, 원가 개선안을 설계한다",
        "필드 이슈와 불량 원인을 개발 관점에서 해결한다",
        "부품 대체와 구조 변경, 튜닝을 통해 개선 효과를 만든다"
      ],
      levelHints: [
        "주니어는 데이터 분석과 개선안 검증 지원 비중이 높다",
        "미들 레벨은 개선 과제를 주도하고 변경 효과를 검증한다",
        "시니어는 개선 우선순위와 플랫폼 전략을 설계한다"
      ]
    },
    {
      id: "validation_reliability_engineer",
      label: "개발검증/신뢰성 엔지니어",
      aliases: [
        "Reliability Engineer",
        "Validation Engineer",
        "DV Engineer",
        "신뢰성 시험 담당"
      ],
      family: "rnd_verification_reliability",
      responsibilityHints: [
        "설계 검증과 신뢰성 시험 계획을 수립하고 수행한다",
        "시험 결과로 설계 적합성을 판단하고 failure를 분석한다",
        "개발팀과 함께 개선 포인트를 도출한다"
      ],
      levelHints: [
        "주니어는 시험 수행과 결과 정리 비중이 높다",
        "미들 레벨은 검증 항목 설계와 failure 분석을 주도한다",
        "시니어는 validation 기준과 신뢰성 전략을 설계한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "innovation_horizon",
      label: "기술 시계열",
      values: [
        "미래 기술 가능성 탐색 중심",
        "출시 목표 제품 개발 중심",
        "기존 제품 개선 중심",
        "개발 결과 검증과 신뢰성 입증 중심"
      ]
    },
    {
      axisId: "primary_output",
      label: "주요 산출물",
      values: [
        "PoC 결과, 연구 보고서, 기술 옵션 비교안",
        "사양서, 시제품, 개발 결과물, 양산 이관 자료",
        "개선 설계안, 변경 이력, 성능/원가 개선 결과",
        "시험 계획서, 검증 리포트, 신뢰성 평가 결과"
      ]
    },
    {
      axisId: "decision_driver",
      label: "핵심 의사결정 기준",
      values: [
        "기술 성립 가능성과 차별화 가능성",
        "고객 요구 충족과 제품화 가능성",
        "문제 해결 효과와 개선 효율",
        "기준 충족 여부와 실패 원인 규명"
      ]
    },
    {
      axisId: "work_constraint",
      label: "대표 제약 조건",
      values: [
        "불확실한 기술 대안과 연구 방향성",
        "일정, 양산성, 원가, 인증 요구",
        "기존 플랫폼 제약과 변경 영향",
        "시험 기준, 재현성, 신뢰성 확보"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "verification_testing_interface",
      label: "검증/시험 인접 경계",
      whyAdjacent: [
        "R&D 내에서도 개발검증 역할은 시험 직무와 겹쳐 보일 수 있다",
        "그러나 시험 운영 체계나 품질 프로세스 자체가 중심이면 별도 검증/시험 직무로 읽힌다"
      ]
    },
    {
      id: "process_engineering_interface",
      label: "공정기술 인접 경계",
      whyAdjacent: [
        "개발 결과를 양산에 적용하는 과정에서 공정기술과 경계가 붙는다",
        "그러나 생산 수율, 공정 조건, 제조 최적화가 중심이면 공정기술로 이동한다"
      ]
    },
    {
      id: "technology_strategy_interface",
      label: "기술전략 인접 경계",
      whyAdjacent: [
        "선행연구는 기술 로드맵, 특허, 미래 기술 방향과 맞닿아 있다",
        "그러나 실제 연구 수행보다 포트폴리오, 투자 우선순위, 기술기획이 중심이면 기술전략으로 읽힌다"
      ]
    },
    {
      id: "certification_regulatory_interface",
      label: "인증/규제 인접 경계",
      whyAdjacent: [
        "개발검증과 인증 대응은 시험 문서와 기준 해석에서 겹칠 수 있다",
        "그러나 대외 인증 취득과 규제 문서 대응이 중심이면 인증/규제 대응으로 읽힌다"
      ]
    }
  ],
  boundaryHints: [
    "기술 가능성 탐색, 논문·특허 검토, PoC, feasibility study 비중이 커지면 선행연구/기술탐색으로 읽힙니다.",
    "고객 요구사항 반영, 사양 확정, 시제품 개발, 양산 이관 비중이 커지면 제품개발/상용화개발로 읽힙니다.",
    "기존 제품의 불량 해결, 성능 튜닝, 원가절감, 부품 대체 비중이 커지면 제품개선/성능개선으로 읽힙니다.",
    "시험 계획 수립, 내구·신뢰성 시험, failure 분석, 검증 리포트 비중이 커지면 개발검증/신뢰성으로 읽힙니다.",
    "같은 R&D라도 기술이 아직 열려 있고 대안 탐색이 많을수록 선행연구에 가깝고, 반대로 출시 일정과 양산 제약이 강해질수록 제품개발 쪽으로 이동합니다."
  ],
  summaryTemplate: "연구개발(R&D) 직무는 기술 가능성을 탐색하고 이를 실제 제품으로 구현하거나 개선하는 성격이 강합니다. 다만 실제 역할은 미래 기술을 탐색하는지, 출시 목표 제품을 개발하는지, 기존 제품을 개선하는지, 혹은 개발 결과를 검증하는지에 따라 분명히 갈립니다. 특히 기술 탐색 단계인지, 제품화 단계인지, 개선·검증 단계인지가 이 직무의 핵심 경계를 만듭니다."
};
