export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "CONSULTING",
  aliases: [
    "컨설턴트",
    "컨설팅",
    "Consultant",
    "비즈니스 컨설턴트",
    "전략 컨설턴트",
    "경영 컨설턴트",
    "프로세스 컨설턴트",
    "IT 컨설턴트",
    "운영 컨설팅",
    "Strategy Consultant"
  ],
  families: [
    {
      id: "strategy_consulting",
      label: "전략 컨설팅",
      aliases: [
        "전략 컨설턴트",
        "경영 전략 컨설팅",
        "Strategy Consulting",
        "사업 전략 컨설팅"
      ],
      strongSignals: [
        "시장 진입 전략 수립",
        "신사업 기획",
        "경영진 보고용 전략 문서 작성",
        "시장/경쟁사 분석",
        "Top-down 문제 정의",
        "사업 포트폴리오 분석"
      ],
      mediumSignals: [
        "재무 모델링 일부 수행",
        "슬라이드 기반 인사이트 도출",
        "CXO 레벨 커뮤니케이션"
      ],
      boundarySignals: [
        "실행보다 방향성 제시 중심",
        "프로세스 개선보다 전략적 의사결정 지원 강조",
        "IT 구현/시스템 구축 관여 없음"
      ],
      adjacentFamilies: ["operations_consulting", "management_consulting"],
      boundaryNote: "조직 실행이나 프로세스 개선까지 깊게 개입하기 시작하면 운영/경영 컨설팅으로 이동하며, 방향성 정의와 의사결정 지원이 중심이면 전략 컨설팅으로 읽힙니다.",
      summaryTemplate: "이 직무는 기업의 방향성과 의사결정을 정의하는 전략 수립 성격이 강합니다. 반면 실제 실행 설계나 조직 운영 개선 비중이 커지면 운영 또는 경영 컨설팅 영역으로 읽힐 수 있습니다."
    },
    {
      id: "operations_consulting",
      label: "운영/프로세스 컨설팅",
      aliases: [
        "운영 컨설턴트",
        "프로세스 컨설팅",
        "Operations Consulting",
        "프로세스 개선 컨설턴트"
      ],
      strongSignals: [
        "업무 프로세스 분석 및 개선",
        "운영 효율화 프로젝트 수행",
        "KPI 기반 운영 개선",
        "As-is / To-be 프로세스 설계",
        "현업 인터뷰 및 실행 설계"
      ],
      mediumSignals: [
        "현장 중심 문제 정의",
        "데이터 기반 운영 진단",
        "프로세스 문서화"
      ],
      boundarySignals: [
        "전략 수립보다 실행 설계 비중 높음",
        "시스템 구축 자체보다는 운영 방식 정의 중심",
        "조직 구조보다는 업무 흐름 개선 강조"
      ],
      adjacentFamilies: ["strategy_consulting", "it_consulting"],
      boundaryNote: "전략 방향 정의 비중이 커지면 전략 컨설팅으로 이동하며, 시스템 구현과 기술 설계까지 포함되면 IT 컨설팅으로 이동합니다.",
      summaryTemplate: "이 직무는 실제 업무 흐름과 운영 방식을 개선하는 실행 중심 컨설팅 성격이 강합니다. 반면 전략 방향 정의 비중이 커지면 전략 컨설팅으로, 시스템 구현 중심이 되면 IT 컨설팅으로 읽힐 수 있습니다."
    },
    {
      id: "management_consulting",
      label: "경영/조직 컨설팅",
      aliases: [
        "경영 컨설턴트",
        "조직 컨설팅",
        "Management Consulting",
        "HR 컨설팅",
        "조직 설계 컨설팅"
      ],
      strongSignals: [
        "조직 구조 설계",
        "성과관리 체계 설계",
        "인사/평가 제도 컨설팅",
        "리더십 및 조직 운영 개선",
        "조직 진단 및 변화관리"
      ],
      mediumSignals: [
        "인터뷰 기반 조직 문제 분석",
        "제도 설계 문서 작성",
        "워크샵 및 변화관리 프로그램 운영"
      ],
      boundarySignals: [
        "프로세스보다 조직/사람 중심 문제 정의",
        "기술 구현 없음",
        "전략보다는 조직 운영 체계 강조"
      ],
      adjacentFamilies: ["strategy_consulting", "operations_consulting"],
      boundaryNote: "조직과 사람 중심의 문제 해결이 핵심이면 경영 컨설팅으로 읽히며, 업무 흐름 개선 중심으로 이동하면 운영 컨설팅으로, 방향성 정의 중심이면 전략 컨설팅으로 이동합니다.",
      summaryTemplate: "이 직무는 조직 구조와 운영 체계를 설계하는 경영/조직 중심 컨설팅 성격이 강합니다. 반면 업무 프로세스 개선이나 전략 방향 정의 비중이 커지면 다른 컨설팅 영역으로 읽힐 수 있습니다."
    },
    {
      id: "it_consulting",
      label: "IT 컨설팅",
      aliases: [
        "IT 컨설턴트",
        "시스템 컨설팅",
        "디지털 컨설팅",
        "Tech Consulting",
        "ERP 컨설턴트"
      ],
      strongSignals: [
        "시스템 도입/구축 컨설팅",
        "ERP/CRM 등 솔루션 설계",
        "IT 아키텍처 설계",
        "디지털 전환 프로젝트",
        "요구사항 정의 및 기술 설계"
      ],
      mediumSignals: [
        "개발팀과 협업",
        "데이터 구조 설계 일부 참여",
        "솔루션 벤더 협업"
      ],
      boundarySignals: [
        "비즈니스 전략보다 시스템 구현 중심",
        "운영 개선보다 기술 기반 해결 강조",
        "코딩은 직접 수행하지 않는 경우 많음"
      ],
      adjacentFamilies: ["operations_consulting", "strategy_consulting"],
      boundaryNote: "기술과 시스템 도입 중심이면 IT 컨설팅으로 읽히며, 업무 프로세스 개선 중심이면 운영 컨설팅으로, 방향성 정의 중심이면 전략 컨설팅으로 이동합니다.",
      summaryTemplate: "이 직무는 기술과 시스템을 활용해 문제를 해결하는 IT 기반 컨설팅 성격이 강합니다. 반면 비즈니스 프로세스나 전략 중심으로 이동하면 다른 컨설팅 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "strategy_consultant",
      label: "전략 컨설턴트",
      aliases: ["Strategy Consultant", "전략 컨설팅 담당"],
      family: "strategy_consulting",
      responsibilityHints: [
        "시장 및 경쟁 분석",
        "전략 수립 및 보고서 작성",
        "경영진 의사결정 지원"
      ],
      levelHints: [
        "주니어는 리서치 및 자료 작성 중심",
        "시니어는 문제 정의 및 인사이트 도출 주도"
      ]
    },
    {
      id: "operations_consultant",
      label: "운영 컨설턴트",
      aliases: ["Operations Consultant", "프로세스 컨설턴트"],
      family: "operations_consulting",
      responsibilityHints: [
        "업무 프로세스 분석",
        "운영 개선안 설계",
        "현업 인터뷰 및 실행 설계"
      ],
      levelHints: [
        "주니어는 데이터 분석 및 문서화 중심",
        "시니어는 개선안 설계 및 실행 리딩"
      ]
    },
    {
      id: "management_consultant",
      label: "경영 컨설턴트",
      aliases: ["Management Consultant", "조직 컨설턴트"],
      family: "management_consulting",
      responsibilityHints: [
        "조직 구조 및 제도 설계",
        "성과관리 체계 구축",
        "조직 진단 수행"
      ],
      levelHints: [
        "주니어는 분석 및 자료 정리",
        "시니어는 제도 설계 및 변화관리 주도"
      ]
    },
    {
      id: "it_consultant",
      label: "IT 컨설턴트",
      aliases: ["Tech Consultant", "시스템 컨설턴트"],
      family: "it_consulting",
      responsibilityHints: [
        "시스템 요구사항 정의",
        "솔루션 설계",
        "IT 프로젝트 관리"
      ],
      levelHints: [
        "주니어는 요구사항 정리 및 테스트 지원",
        "시니어는 아키텍처 설계 및 프로젝트 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "problem_focus",
      label: "문제 초점",
      values: ["전략/방향성", "운영/프로세스", "조직/사람", "기술/시스템"]
    },
    {
      axisId: "involvement_depth",
      label: "개입 수준",
      values: ["의사결정 지원", "설계 및 정의", "실행 설계", "구현/도입"]
    }
  ],
  adjacentFamilies: ["data_analysis", "product_management"],
  boundaryHints: [
    "의사결정 지원과 방향 정의 비중이 커지면 전략 컨설팅으로 이동",
    "업무 흐름 개선과 실행 설계 비중이 커지면 운영 컨설팅으로 이동",
    "조직 구조와 제도 설계 비중이 커지면 경영 컨설팅으로 이동",
    "시스템 도입과 기술 설계 비중이 커지면 IT 컨설팅으로 이동"
  ],
  summaryTemplate: "이 직무는 기업 문제를 정의하고 해결 방향을 제시하는 컨설팅 성격이 강하며, 무엇을 중심으로 다루는지에 따라 세부 영역이 나뉩니다. 전략, 운영, 조직, 기술 중 어느 영역에 더 깊이 개입하는지에 따라 서로 다른 컨설팅 영역으로 읽힐 수 있습니다."
};
