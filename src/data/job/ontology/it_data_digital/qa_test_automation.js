export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "QA_TEST_AUTOMATION",
  aliases: [
    "QA",
    "품질 보증",
    "테스트 엔지니어",
    "QA 엔지니어",
    "Test Engineer",
    "Software Tester",
    "테스트 자동화",
    "Automation QA",
    "SDET",
    "Software Development Engineer in Test"
  ],
  families: [
    {
      id: "manual_qa",
      label: "수동 테스트 중심 QA",
      aliases: [
        "Manual QA",
        "수동 테스트",
        "테스터",
        "QA Analyst"
      ],
      strongSignals: [
        "테스트 케이스 작성 및 실행",
        "버그 리포트 작성",
        "테스트 시나리오 설계",
        "릴리즈 전 검증 테스트 수행",
        "요구사항 기반 테스트"
      ],
      mediumSignals: [
        "JIRA, TestRail 사용",
        "체크리스트 기반 테스트",
        "UI 기능 테스트",
        "회귀 테스트 수행"
      ],
      boundarySignals: [
        "자동화 코드 작성 비중 증가",
        "CI/CD 파이프라인 연동 테스트 증가",
        "테스트 프레임워크 구축 참여"
      ],
      adjacentFamilies: ["test_automation", "qa_process"],
      boundaryNote: "수동 테스트 중심에서 벗어나 자동화 코드 작성과 프레임워크 구축 비중이 커지면 테스트 자동화로 이동하며, 테스트 정책과 프로세스 설계 비중이 커지면 QA 프로세스 관리로 이동합니다.",
      summaryTemplate: "이 직무는 테스트 케이스를 기반으로 기능을 검증하고 버그를 발견하는 성격이 강합니다. 반면 자동화 구현이나 품질 프로세스 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "test_automation",
      label: "테스트 자동화",
      aliases: [
        "Automation QA",
        "Test Automation Engineer",
        "SDET",
        "자동화 테스트"
      ],
      strongSignals: [
        "테스트 자동화 코드 작성",
        "Selenium, Cypress, Playwright 사용",
        "테스트 스크립트 유지보수",
        "CI/CD 파이프라인 내 테스트 연동",
        "자동화 테스트 프레임워크 구축"
      ],
      mediumSignals: [
        "Python, Java, JavaScript 사용",
        "API 테스트 자동화",
        "테스트 커버리지 관리",
        "테스트 데이터 관리"
      ],
      boundarySignals: [
        "개발 코드 작성 및 기능 구현 비중 증가",
        "테스트보다 품질 정책 및 프로세스 정의 비중 증가",
        "수동 테스트 실행 비중 증가"
      ],
      adjacentFamilies: ["manual_qa", "qa_process"],
      boundaryNote: "자동화 구현에서 벗어나 개발 기능 구현 비중이 커지면 소프트웨어 엔지니어링으로 이동하며, 테스트 정책과 조직 품질 관리 비중이 커지면 QA 프로세스 관리로 이동합니다.",
      summaryTemplate: "이 직무는 테스트를 코드로 자동화하고 품질 검증을 시스템화하는 성격이 강합니다. 반면 개발 기능 구현이나 조직 차원의 품질 관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "qa_process",
      label: "QA 프로세스 및 품질 관리",
      aliases: [
        "QA Manager",
        "Quality Assurance Lead",
        "품질 관리",
        "테스트 전략"
      ],
      strongSignals: [
        "테스트 전략 수립",
        "품질 기준 정의",
        "QA 프로세스 설계",
        "릴리즈 게이트 관리",
        "결함 관리 프로세스 운영"
      ],
      mediumSignals: [
        "테스트 일정 관리",
        "QA 조직 운영",
        "품질 지표 관리",
        "리스크 기반 테스트 계획"
      ],
      boundarySignals: [
        "직접 테스트 수행 비중 증가",
        "자동화 코드 작성 비중 증가",
        "개발 조직과 동일한 코드 레벨 작업 증가"
      ],
      adjacentFamilies: ["manual_qa", "test_automation"],
      boundaryNote: "품질 정책과 조직 관리에서 벗어나 직접 테스트 수행이 많아지면 수동 QA로, 자동화 코드 작성 비중이 커지면 테스트 자동화로 이동합니다.",
      summaryTemplate: "이 직무는 조직의 품질 기준과 테스트 프로세스를 설계하고 관리하는 성격이 강합니다. 반면 직접 테스트 수행이나 자동화 구현 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "embedded_test",
      label: "임베디드/시스템 테스트",
      aliases: [
        "Embedded QA",
        "System Test Engineer",
        "하드웨어 테스트",
        "펌웨어 테스트"
      ],
      strongSignals: [
        "디바이스 기반 테스트 수행",
        "펌웨어/하드웨어 연동 테스트",
        "시스템 통합 테스트",
        "실환경 테스트 수행",
        "장비 기반 테스트 셋업"
      ],
      mediumSignals: [
        "테스트 장비 사용",
        "로그 기반 분석",
        "통신 프로토콜 테스트",
        "성능 및 안정성 테스트"
      ],
      boundarySignals: [
        "소프트웨어 UI/API 테스트 비중 증가",
        "자동화 테스트 코드 작성 증가",
        "품질 정책 및 프로세스 관리 비중 증가"
      ],
      adjacentFamilies: ["manual_qa", "test_automation"],
      boundaryNote: "디바이스 중심 테스트에서 벗어나 소프트웨어 기능 테스트가 많아지면 일반 QA로, 자동화 코드 작성 비중이 커지면 테스트 자동화로 이동합니다.",
      summaryTemplate: "이 직무는 하드웨어 또는 시스템 환경에서의 동작을 검증하는 성격이 강합니다. 반면 소프트웨어 중심 테스트나 자동화 구현 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "qa_engineer",
      label: "QA 엔지니어",
      aliases: ["QA Engineer", "Tester"],
      family: "manual_qa",
      responsibilityHints: [
        "테스트 케이스 작성 및 실행",
        "버그 리포트 작성",
        "기능 검증"
      ],
      levelHints: [
        "주니어는 테스트 실행 중심",
        "시니어는 테스트 설계 및 품질 판단"
      ]
    },
    {
      id: "automation_engineer",
      label: "테스트 자동화 엔지니어",
      aliases: ["Automation QA", "SDET"],
      family: "test_automation",
      responsibilityHints: [
        "자동화 테스트 코드 작성",
        "테스트 프레임워크 구축",
        "CI/CD 연동"
      ],
      levelHints: [
        "주니어는 스크립트 작성",
        "시니어는 프레임워크 설계 및 품질 전략 기여"
      ]
    },
    {
      id: "qa_manager",
      label: "QA 매니저",
      aliases: ["QA Lead", "Quality Manager"],
      family: "qa_process",
      responsibilityHints: [
        "품질 기준 정의",
        "테스트 전략 수립",
        "QA 조직 관리"
      ],
      levelHints: [
        "시니어는 조직 품질 책임",
        "리드는 품질 정책과 릴리즈 게이트 관리"
      ]
    },
    {
      id: "system_test_engineer",
      label: "시스템 테스트 엔지니어",
      aliases: ["System QA", "Embedded Tester"],
      family: "embedded_test",
      responsibilityHints: [
        "시스템 통합 테스트",
        "디바이스 기반 검증",
        "환경 테스트 수행"
      ],
      levelHints: [
        "주니어는 테스트 수행 중심",
        "시니어는 테스트 환경 설계 및 문제 분석"
      ]
    }
  ],
  axes: [
    {
      axisId: "manual_vs_automation",
      label: "수동 테스트 vs 자동화",
      values: ["수동 실행 중심", "코드 기반 자동화"]
    },
    {
      axisId: "execution_vs_strategy",
      label: "실행 vs 품질 전략",
      values: ["테스트 수행 중심", "품질 정책/프로세스 설계"]
    },
    {
      axisId: "software_vs_system",
      label: "소프트웨어 vs 시스템",
      values: ["앱/서비스 테스트", "디바이스/시스템 테스트"]
    }
  ],
  adjacentFamilies: ["software_engineering", "devops_engineering"],
  boundaryHints: [
    "테스트 코드 작성이 개발 코드 수준으로 확장되면 소프트웨어 엔지니어링으로 이동합니다.",
    "CI/CD 파이프라인 구축과 운영 비중이 커지면 DevOps 성격으로 이동합니다.",
    "품질 정책보다 직접 테스트 수행 비중이 커지면 수동 QA로 이동합니다."
  ],
  summaryTemplate: "이 직무는 소프트웨어나 시스템의 품질을 검증하고 결함을 발견하는 역할입니다. 수동 테스트, 자동화 구현, 품질 전략 설계 중 어떤 비중이 큰지에 따라 세부 성격이 달라지며, 특정 책임이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};