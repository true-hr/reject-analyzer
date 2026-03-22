export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "TESTING_VALIDATION",
  aliases: [
    "테스트",
    "검증",
    "Testing",
    "Validation",
    "Verification",
    "V&V",
    "제품 검증",
    "품질 테스트",
    "시험 엔지니어",
    "Test Engineer",
    "Validation Engineer",
    "신뢰성 시험",
    "Reliability Test",
    "성능 시험",
    "기능 테스트",
    "시스템 테스트",
    "통합 테스트",
    "환경 시험",
    "내구 시험",
    "QA Test",
    "하드웨어 테스트",
    "소프트웨어 테스트"
  ],
  families: [
    {
      id: "functional_testing",
      label: "기능 테스트",
      aliases: [
        "기능 테스트",
        "Functional Testing",
        "Feature Test",
        "시스템 기능 검증"
      ],
      strongSignals: [
        "제품의 기능 요구사항을 기준으로 테스트 케이스를 설계한다",
        "기능이 정상 동작하는지 시나리오 기반으로 검증한다",
        "버그를 재현하고 원인을 추적해 리포트한다",
        "릴리즈 전 기능 검증 테스트를 수행한다",
        "요구사항 대비 동작 여부를 확인한다"
      ],
      mediumSignals: [
        "테스트 케이스와 체크리스트를 작성한다",
        "개발팀과 협업해 이슈를 해결한다",
        "테스트 결과를 문서화하고 공유한다",
        "반복 테스트를 통해 안정성을 확인한다"
      ],
      boundarySignals: [
        "성능 수치 측정과 벤치마크 중심이면 performance testing family로 이동한다",
        "장기 신뢰성 및 내구성 시험 비중이 커지면 reliability testing family로 이동한다",
        "자동화 코드 작성 비중이 커지면 test automation 영역으로 이동한다",
        "요구사항 정의와 설계 참여 비중이 커지면 QA 또는 제품기획으로 이동한다"
      ],
      adjacentFamilies: [
        "performance_testing",
        "reliability_testing",
        "test_automation"
      ],
      boundaryNote: "기능 테스트는 요구사항 충족 여부를 확인하는 데 초점이 있습니다. 반면 성능 측정이나 장기 신뢰성 검증 비중이 커지면 다른 테스트 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 제품 기능이 요구사항대로 동작하는지 검증하는 성격이 강합니다. 반면 성능이나 신뢰성 중심 검증 비중이 커지면 다른 테스트 경계로 읽힐 수 있습니다."
    },
    {
      id: "performance_testing",
      label: "성능 테스트",
      aliases: [
        "성능 테스트",
        "Performance Testing",
        "Load Test",
        "Stress Test",
        "Benchmark Test"
      ],
      strongSignals: [
        "속도, 처리량, 응답시간 등 성능 지표를 측정한다",
        "부하 테스트, 스트레스 테스트를 수행한다",
        "성능 병목 구간을 식별하고 개선 포인트를 제시한다",
        "벤치마크 테스트를 통해 성능 비교를 수행한다",
        "성능 기준을 정의하고 검증한다"
      ],
      mediumSignals: [
        "테스트 환경을 구성하고 시나리오를 설정한다",
        "성능 데이터 로그를 분석한다",
        "시스템 리소스 사용량을 모니터링한다",
        "개발팀과 협업해 성능 개선을 지원한다"
      ],
      boundarySignals: [
        "기능 동작 검증 중심이면 functional testing family로 이동한다",
        "장시간 내구성 및 고장률 분석 중심이면 reliability testing family로 이동한다",
        "테스트 자동화 스크립트 개발 비중이 크면 automation 영역으로 이동한다",
        "시스템 설계 개선까지 깊게 관여하면 아키텍처/개발 영역으로 이동한다"
      ],
      adjacentFamilies: [
        "functional_testing",
        "reliability_testing",
        "test_automation"
      ],
      boundaryNote: "성능 테스트는 수치 기반으로 시스템 성능을 평가하는 역할입니다. 반면 기능 검증이나 신뢰성 검증 중심이면 다른 테스트 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 시스템이나 제품의 성능을 수치로 측정하고 병목을 개선하는 성격이 강합니다. 반면 기능 검증이나 신뢰성 시험 비중이 커지면 다른 테스트 경계로 읽힐 수 있습니다."
    },
    {
      id: "reliability_testing",
      label: "신뢰성·내구 시험",
      aliases: [
        "신뢰성 시험",
        "Reliability Testing",
        "내구 시험",
        "환경 시험",
        "Life Test",
        "HALT",
        "HASS"
      ],
      strongSignals: [
        "장시간 사용 조건에서 제품의 고장 여부를 검증한다",
        "온도, 습도, 진동 등 환경 조건 시험을 수행한다",
        "제품 수명(Life cycle)을 평가한다",
        "고장 모드(Failure mode)를 분석한다",
        "신뢰성 기준을 정의하고 검증한다"
      ],
      mediumSignals: [
        "시험 계획을 수립하고 장비를 운영한다",
        "시험 데이터를 수집하고 분석한다",
        "제품 신뢰성 개선을 위한 피드백을 제공한다",
        "시험 결과를 리포트로 정리한다"
      ],
      boundarySignals: [
        "기능 동작 확인 중심이면 functional testing family로 이동한다",
        "성능 수치 측정 중심이면 performance testing family로 이동한다",
        "품질 문제 원인 분석과 개선 설계 비중이 커지면 품질 엔지니어링으로 이동한다",
        "시험 설비 개발과 자동화 비중이 커지면 test equipment engineering으로 이동한다"
      ],
      adjacentFamilies: [
        "functional_testing",
        "performance_testing",
        "quality_engineering"
      ],
      boundaryNote: "신뢰성·내구 시험은 장기 사용과 극한 조건에서 제품의 안정성을 검증하는 역할입니다. 반면 기능이나 성능 중심 검증이면 다른 테스트 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 제품이 다양한 환경과 장기 사용 조건에서도 정상 동작하는지 검증하는 성격이 강합니다. 반면 기능이나 성능 중심 검증 비중이 커지면 다른 테스트 경계로 읽힐 수 있습니다."
    },
    {
      id: "test_automation",
      label: "테스트 자동화",
      aliases: [
        "Test Automation",
        "자동화 테스트",
        "테스트 자동화 엔지니어",
        "QA Automation",
        "자동화 검증"
      ],
      strongSignals: [
        "테스트 케이스를 코드로 자동화한다",
        "CI/CD 환경에서 테스트 자동화를 구축한다",
        "테스트 스크립트를 개발하고 유지보수한다",
        "자동화된 테스트 결과를 분석한다",
        "반복 테스트를 자동화해 효율을 높인다"
      ],
      mediumSignals: [
        "테스트 프레임워크를 설정한다",
        "개발 언어를 활용해 테스트 코드를 작성한다",
        "테스트 커버리지를 관리한다",
        "개발 프로세스에 테스트를 통합한다"
      ],
      boundarySignals: [
        "수동 테스트 수행 비중이 크면 functional testing family로 이동한다",
        "성능 테스트 도구 활용 중심이면 performance testing family로 이동한다",
        "개발 코드 작성 비중이 커지고 제품 기능 구현에 관여하면 소프트웨어 개발로 이동한다",
        "테스트 전략 수립 비중이 커지면 QA 엔지니어링으로 이동한다"
      ],
      adjacentFamilies: [
        "functional_testing",
        "performance_testing",
        "software_engineering"
      ],
      boundaryNote: "테스트 자동화는 테스트를 코드로 구현해 효율을 높이는 역할입니다. 반면 직접 테스트 수행이나 개발 참여 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 테스트를 자동화해 반복 검증을 효율화하는 성격이 강합니다. 반면 수동 테스트나 개발 참여 비중이 커지면 다른 테스트 또는 개발 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "test_engineer",
      label: "Test Engineer",
      aliases: [
        "테스트 엔지니어",
        "Test Engineer",
        "검증 엔지니어"
      ],
      family: "functional_testing",
      responsibilityHints: [
        "테스트 케이스를 설계하고 수행한다",
        "버그를 발견하고 리포트한다",
        "제품 기능을 검증한다"
      ],
      levelHints: [
        "정형화된 테스트 수행에서 시작",
        "복잡한 시나리오 설계 및 문제 분석으로 확장"
      ]
    },
    {
      id: "performance_test_engineer",
      label: "Performance Test Engineer",
      aliases: [
        "성능 테스트 엔지니어",
        "Performance Engineer"
      ],
      family: "performance_testing",
      responsibilityHints: [
        "성능 테스트를 설계하고 수행한다",
        "성능 데이터를 분석한다",
        "병목을 식별하고 개선안을 제시한다"
      ],
      levelHints: [
        "테스트 수행 중심에서 시작",
        "시스템 구조 이해와 개선 영향력 확대"
      ]
    },
    {
      id: "reliability_engineer",
      label: "Reliability Engineer",
      aliases: [
        "신뢰성 엔지니어",
        "Reliability Engineer",
        "시험 엔지니어"
      ],
      family: "reliability_testing",
      responsibilityHints: [
        "환경 및 내구 시험을 수행한다",
        "고장 원인을 분석한다",
        "신뢰성 개선을 지원한다"
      ],
      levelHints: [
        "시험 수행 중심",
        "고장 메커니즘 이해와 개선 설계 참여로 확장"
      ]
    },
    {
      id: "automation_test_engineer",
      label: "Automation Test Engineer",
      aliases: [
        "자동화 테스트 엔지니어",
        "QA Automation Engineer"
      ],
      family: "test_automation",
      responsibilityHints: [
        "테스트 자동화 코드를 작성한다",
        "자동화 환경을 구축한다",
        "테스트 효율을 개선한다"
      ],
      levelHints: [
        "스크립트 작성 중심",
        "테스트 아키텍처 설계로 확장"
      ]
    },
    {
      id: "test_manager",
      label: "Test Manager",
      aliases: [
        "테스트 매니저",
        "QA Manager",
        "검증 팀장"
      ],
      family: "functional_testing",
      responsibilityHints: [
        "테스트 전략과 계획을 수립한다",
        "테스트 조직을 관리한다",
        "품질 검증 프로세스를 총괄한다"
      ],
      levelHints: [
        "개별 테스트보다 전체 전략과 품질 기준 관리 중심",
        "조직 간 협업과 의사결정 영향력 확대"
      ]
    }
  ],
  axes: [
    {
      axisId: "test_focus",
      label: "테스트 초점",
      values: [
        "기능 동작 검증 중심",
        "성능 수치 측정 중심",
        "신뢰성 및 내구성 검증 중심"
      ]
    },
    {
      axisId: "execution_vs_automation",
      label: "수동 vs 자동화",
      values: [
        "수동 테스트 수행 중심",
        "부분 자동화 테스트",
        "완전 자동화 및 코드 기반 테스트"
      ]
    },
    {
      axisId: "time_horizon",
      label: "검증 기간",
      values: [
        "단기 기능 검증",
        "중기 성능 평가",
        "장기 신뢰성 시험"
      ]
    },
    {
      axisId: "engineering_depth",
      label: "엔지니어링 깊이",
      values: [
        "테스트 실행 중심",
        "문제 분석 및 개선 제안",
        "시스템/설계 개선까지 관여"
      ]
    }
  ],
  adjacentFamilies: [
    "quality_assurance",
    "software_engineering",
    "hardware_engineering",
    "data_analysis"
  ],
  boundaryHints: [
    "품질 기준 설계와 프로세스 구축 비중이 커지면 QA 영역으로 이동합니다.",
    "제품 기능 구현 코드 작성 비중이 커지면 소프트웨어 개발로 이동합니다.",
    "하드웨어 설계와 회로 분석 비중이 커지면 하드웨어 엔지니어링으로 이동합니다.",
    "데이터 분석 자체가 목적이 되면 데이터 분석 직무로 이동합니다.",
    "단순 테스트 수행보다 자동화와 시스템 개선 비중이 커지면 엔지니어링 성격이 강해집니다."
  ],
  summaryTemplate: "테스트·검증 직무는 제품이 요구사항과 품질 기준을 만족하는지 확인하는 성격이 강합니다. 기능, 성능, 신뢰성 중 어디에 집중하느냐와 자동화 수준에 따라 역할이 달라집니다. 반면 품질 설계나 개발 참여 비중이 커지면 다른 엔지니어링 경계로 읽힐 수 있습니다."
};
