export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "PROJECT_MANAGEMENT",
  aliases: [
    "프로젝트관리",
    "프로젝트 매니저",
    "PM",
    "프로젝트 PM",
    "project manager",
    "project management",
    "program manager",
    "PMO"
  ],
  families: [
    {
      id: "DELIVERY_PROJECT_MANAGEMENT",
      label: "딜리버리 중심 PM",
      aliases: [
        "딜리버리 PM",
        "delivery project manager",
        "execution PM"
      ],
      strongSignals: [
        "프로젝트 일정 수립 및 관리",
        "산출물 납기 관리",
        "프로젝트 범위 및 요구사항 관리",
        "이슈 및 리스크 관리",
        "개발/디자인/운영 조직 협업 조율",
        "프로젝트 진행 상황 보고",
        "프로젝트 완료 기준 관리"
      ],
      mediumSignals: [
        "WBS 작성 및 관리",
        "회의체 운영",
        "이해관계자 커뮤니케이션",
        "프로젝트 일정 조정",
        "진행 리포트 작성"
      ],
      boundarySignals: [
        "단순 일정 관리만 수행하면 PMO로 이동",
        "기능 정의와 제품 방향 설정 비중이 커지면 서비스기획으로 이동",
        "사업 운영이나 성과 관리까지 확장되면 사업기획으로 이동"
      ],
      adjacentFamilies: [
        "PMO_GOVERNANCE",
        "PROGRAM_PROJECT_MANAGEMENT",
        "STRATEGIC_PROJECT_MANAGEMENT"
      ],
      boundaryNote: "프로젝트 실행과 납기 관리 중심이면 딜리버리 PM으로 읽힙니다. 단순 통제 역할이 되면 PMO, 기획 중심이면 서비스기획으로 이동합니다.",
      summaryTemplate: "이 직무는 프로젝트를 계획대로 실행하고 납기를 맞추는 딜리버리 중심 역할이 강합니다. 반면 단순 관리나 기획 중심 역할로 이동하면 다른 직무로 해석될 수 있습니다."
    },
    {
      id: "PMO_GOVERNANCE",
      label: "PMO·관리체계 운영",
      aliases: [
        "PMO",
        "프로젝트 관리 조직",
        "project management office"
      ],
      strongSignals: [
        "프로젝트 관리 표준 및 프로세스 수립",
        "프로젝트 포트폴리오 관리",
        "프로젝트 상태 모니터링 및 통제",
        "프로젝트 보고 체계 운영",
        "리스크 및 이슈 관리 기준 수립",
        "프로젝트 관리 툴 및 체계 운영",
        "여러 프로젝트 간 우선순위 관리"
      ],
      mediumSignals: [
        "프로젝트 KPI 정의",
        "리포팅 체계 관리",
        "프로젝트 데이터 취합",
        "프로젝트 감사 및 점검",
        "프로세스 개선"
      ],
      boundarySignals: [
        "개별 프로젝트 실행까지 깊게 관여하면 딜리버리 PM으로 이동",
        "전사 전략이나 투자 우선순위와 연결되면 전략기획으로 이동",
        "단순 행정 지원 역할이면 운영지원으로 이동"
      ],
      adjacentFamilies: [
        "DELIVERY_PROJECT_MANAGEMENT",
        "PROGRAM_PROJECT_MANAGEMENT",
        "STRATEGIC_PROJECT_MANAGEMENT"
      ],
      boundaryNote: "프로젝트 관리 체계와 통제를 중심으로 하면 PMO로 읽힙니다. 직접 실행을 리딩하면 딜리버리 PM 성격이 강해집니다.",
      summaryTemplate: "이 직무는 프로젝트를 직접 수행하기보다 관리 체계와 통제를 담당하는 역할이 중심입니다. 반면 실행 리딩 비중이 커지면 딜리버리 PM으로 이동할 수 있습니다."
    },
    {
      id: "PROGRAM_PROJECT_MANAGEMENT",
      label: "프로그램·다중 프로젝트 관리",
      aliases: [
        "프로그램 매니저",
        "program manager",
        "multi-project management"
      ],
      strongSignals: [
        "여러 프로젝트를 통합 관리",
        "프로젝트 간 의존성 조율",
        "중장기 프로그램 계획 수립",
        "복수 조직 간 협업 구조 설계",
        "프로그램 단위 성과 관리",
        "프로젝트 우선순위 조정",
        "조직 간 리소스 배분 조율"
      ],
      mediumSignals: [
        "프로젝트 간 일정 정렬",
        "상위 목표 기준 관리",
        "이해관계자 조율",
        "프로그램 리포트 작성",
        "전사 협업 커뮤니케이션"
      ],
      boundarySignals: [
        "단일 프로젝트 중심이면 딜리버리 PM으로 이동",
        "관리 체계만 운영하면 PMO로 이동",
        "사업 성과나 전략 목표 중심이면 사업기획으로 이동"
      ],
      adjacentFamilies: [
        "DELIVERY_PROJECT_MANAGEMENT",
        "PMO_GOVERNANCE",
        "STRATEGIC_PROJECT_MANAGEMENT"
      ],
      boundaryNote: "여러 프로젝트를 묶어 통합 관리하면 프로그램 관리로 읽힙니다. 단일 프로젝트 실행이나 체계 운영 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 여러 프로젝트를 묶어 통합적으로 관리하고 조율하는 역할이 중심입니다. 반면 단일 프로젝트 실행이나 관리 체계 운영 중심이면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "STRATEGIC_PROJECT_MANAGEMENT",
      label: "전략 연계 프로젝트 관리",
      aliases: [
        "전략 프로젝트 PM",
        "strategic project manager"
      ],
      strongSignals: [
        "전사 전략 과제 프로젝트 리딩",
        "핵심 이니셔티브 실행 관리",
        "경영진 보고 및 의사결정 지원",
        "사업 변화 과제 실행",
        "프로젝트 성과가 사업 KPI와 직접 연결",
        "전략 과제 로드맵 관리",
        "조직 변화 관리"
      ],
      mediumSignals: [
        "경영진 커뮤니케이션",
        "사업 목표 연계 관리",
        "핵심 과제 우선순위 설정",
        "성과 리포트 작성",
        "조직 간 협업 조율"
      ],
      boundarySignals: [
        "전략 수립 자체가 중심이면 전략기획으로 이동",
        "실행 관리만 수행하면 딜리버리 PM으로 이동",
        "사업 운영 관리까지 포함되면 사업기획으로 이동"
      ],
      adjacentFamilies: [
        "PROGRAM_PROJECT_MANAGEMENT",
        "DELIVERY_PROJECT_MANAGEMENT",
        "PMO_GOVERNANCE"
      ],
      boundaryNote: "전략 과제 실행과 경영진 의사결정 지원이 중심이면 이 영역으로 읽힙니다. 전략 설계나 단순 실행으로 치우치면 다른 직무로 이동합니다.",
      summaryTemplate: "이 직무는 전략 과제를 실행으로 연결하는 프로젝트 관리 역할이 중심입니다. 반면 전략 수립이나 단순 실행 관리로 치우치면 다른 직무로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PROJECT_MANAGER",
      label: "프로젝트 매니저",
      aliases: [
        "PM",
        "project manager"
      ],
      family: "DELIVERY_PROJECT_MANAGEMENT",
      responsibilityHints: [
        "프로젝트 일정 및 범위 관리",
        "이슈 및 리스크 관리",
        "조직 간 협업 조율",
        "프로젝트 실행 리딩"
      ],
      levelHints: [
        "주니어는 일정 관리 중심",
        "시니어는 프로젝트 전체 리딩 및 의사결정 비중이 큼"
      ]
    },
    {
      id: "PMO_MANAGER",
      label: "PMO 담당",
      aliases: [
        "PMO",
        "project office manager"
      ],
      family: "PMO_GOVERNANCE",
      responsibilityHints: [
        "프로젝트 관리 체계 운영",
        "리포트 및 통제 관리",
        "프로젝트 포트폴리오 관리",
        "프로세스 개선"
      ],
      levelHints: [
        "주니어는 데이터 취합 중심",
        "시니어는 체계 설계 및 통제 비중이 큼"
      ]
    },
    {
      id: "PROGRAM_MANAGER",
      label: "프로그램 매니저",
      aliases: [
        "program manager"
      ],
      family: "PROGRAM_PROJECT_MANAGEMENT",
      responsibilityHints: [
        "다수 프로젝트 관리",
        "의존성 조율",
        "리소스 배분",
        "성과 관리"
      ],
      levelHints: [
        "주니어는 프로젝트 지원",
        "시니어는 프로그램 전체 설계 및 조율"
      ]
    },
    {
      id: "STRATEGIC_PM",
      label: "전략 프로젝트 매니저",
      aliases: [
        "strategic PM"
      ],
      family: "STRATEGIC_PROJECT_MANAGEMENT",
      responsibilityHints: [
        "전략 과제 실행",
        "경영진 보고",
        "핵심 이니셔티브 관리",
        "성과 연계 관리"
      ],
      levelHints: [
        "주니어는 실행 지원",
        "시니어는 전략 과제 리딩 및 의사결정 지원"
      ]
    }
  ],
  axes: [
    {
      axisId: "SCOPE",
      label: "관리 범위",
      values: [
        "단일 프로젝트",
        "복수 프로젝트",
        "전사 프로그램",
        "전략 과제"
      ]
    },
    {
      axisId: "FOCUS",
      label: "주요 초점",
      values: [
        "실행 및 납기",
        "관리 체계",
        "통합 조율",
        "전략 연계"
      ]
    },
    {
      axisId: "EXECUTION_DEPTH",
      label: "실행 관여도",
      values: [
        "직접 실행 관리",
        "모니터링 및 통제",
        "조율 중심",
        "의사결정 지원"
      ]
    }
  ],
  adjacentFamilies: [
    "사업기획",
    "전략기획",
    "서비스기획",
    "운영관리",
    "데이터 분석"
  ],
  boundaryHints: [
    "프로젝트 일정과 실행 관리가 중심이면 딜리버리 PM으로 읽힙니다.",
    "프로젝트 관리 체계와 통제가 중심이면 PMO로 이동합니다.",
    "여러 프로젝트를 통합 관리하면 프로그램 관리로 이동합니다.",
    "전략 과제 실행과 경영진 보고가 많아지면 전략 프로젝트 PM으로 이동합니다.",
    "제품 기능 정의나 서비스 설계가 많아지면 서비스기획으로 이동합니다.",
    "사업 성과 관리나 운영 관리가 많아지면 사업기획 또는 운영관리로 이동합니다."
  ],
  summaryTemplate: "이 직무는 프로젝트를 계획하고 실행을 관리하는 역할로, 실행 중심, 관리 체계, 프로그램 통합, 전략 연계 등으로 나뉘어 작동 방식이 달라집니다. 반면 제품 기획이나 사업 운영 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
