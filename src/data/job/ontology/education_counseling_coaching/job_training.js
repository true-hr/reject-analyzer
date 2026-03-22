export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "JOB_TRAINING",
  aliases: [
    "직무교육",
    "직무 교육",
    "사내 교육",
    "corporate training",
    "employee training",
    "직무 트레이닝",
    "직무 역량 교육",
    "직무 교육 기획",
    "L&D",
    "learning and development",
    "교육 기획",
    "교육 운영"
  ],
  families: [
    {
      id: "training_program_design",
      label: "교육 기획/설계",
      aliases: [
        "교육 기획",
        "교육 설계",
        "instructional design",
        "curriculum design",
        "learning design"
      ],
      strongSignals: [
        "교육 과정 커리큘럼 설계",
        "학습 목표 및 성과 정의",
        "직무 기반 교육 체계 설계",
        "콘텐츠 구조 및 학습 흐름 설계",
        "교육 니즈 분석 수행"
      ],
      mediumSignals: [
        "교안 기획",
        "교육 로드맵 수립",
        "학습자 분석",
        "교육 효과 측정 설계"
      ],
      boundarySignals: [
        "강의 실행보다 설계 문서 작성 비중이 클 때",
        "운영보다 교육 구조 정의 업무가 많을 때",
        "콘텐츠 제작보다 전체 학습 경험 설계가 중심일 때"
      ],
      adjacentFamilies: ["training_delivery", "learning_content_development"],
      boundaryNote: "교육 구조와 커리큘럼 설계가 핵심일 때 해당 영역으로 읽히며, 강의 실행 비중이 커지면 교육 운영/강의로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 직무 역량 향상을 위한 교육 과정과 학습 구조를 설계하는 역할입니다. 반면 실제 강의나 운영 비중이 커지면 다른 교육 실행 영역으로 해석될 수 있습니다."
    },
    {
      id: "training_delivery",
      label: "교육 운영/강의",
      aliases: [
        "교육 운영",
        "강사",
        "trainer",
        "facilitator",
        "교육 진행",
        "강의"
      ],
      strongSignals: [
        "교육 강의 및 워크샵 진행",
        "학습자 대상 실시간 교육 운영",
        "질의응답 및 참여 유도",
        "교육 현장 운영 관리",
        "교육 일정 및 세션 운영"
      ],
      mediumSignals: [
        "교육 피드백 수집",
        "강의 자료 활용",
        "학습자 관리"
      ],
      boundarySignals: [
        "설계보다 강의 실행 비중이 클 때",
        "콘텐츠 제작보다 전달과 퍼실리테이션이 중심일 때",
        "교육 성과보다 학습 경험 관리가 강조될 때"
      ],
      adjacentFamilies: ["training_program_design", "learning_operations"],
      boundaryNote: "강의와 교육 실행이 핵심일 때 해당 영역으로 읽히며, 커리큘럼 설계 비중이 커지면 교육 기획으로 이동합니다.",
      summaryTemplate: "이 직무는 교육을 직접 진행하고 학습 경험을 운영하는 역할입니다. 반면 교육 구조 설계 비중이 커지면 교육 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "learning_content_development",
      label: "교육 콘텐츠 개발",
      aliases: [
        "교육 콘텐츠 개발",
        "콘텐츠 제작",
        "e-learning 제작",
        "learning content",
        "교육 자료 제작"
      ],
      strongSignals: [
        "교육 콘텐츠 제작",
        "이러닝 콘텐츠 개발",
        "영상/교안 제작",
        "콘텐츠 스토리보드 작성",
        "디지털 학습 자료 제작"
      ],
      mediumSignals: [
        "콘텐츠 편집",
        "툴 활용 제작",
        "콘텐츠 업데이트"
      ],
      boundarySignals: [
        "강의보다 콘텐츠 제작 시간이 많을 때",
        "설계보다 제작 실행 비중이 클 때",
        "학습 구조 정의보다 콘텐츠 산출물이 중심일 때"
      ],
      adjacentFamilies: ["training_program_design", "training_delivery"],
      boundaryNote: "콘텐츠 제작과 산출물이 핵심일 때 해당 영역으로 읽히며, 교육 구조 설계 비중이 커지면 교육 기획으로 이동합니다.",
      summaryTemplate: "이 직무는 교육 콘텐츠를 직접 제작하여 학습 경험을 구현하는 역할입니다. 반면 교육 구조 설계 비중이 커지면 교육 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "learning_operations",
      label: "교육 운영 관리",
      aliases: [
        "교육 운영 관리",
        "L&D 운영",
        "교육 운영 기획",
        "learning operations"
      ],
      strongSignals: [
        "교육 프로그램 운영 관리",
        "교육 일정 및 리소스 조율",
        "LMS 운영",
        "교육 참여율 및 이수 관리",
        "교육 운영 프로세스 개선"
      ],
      mediumSignals: [
        "교육 데이터 관리",
        "운영 리포트 작성",
        "강사 및 외부 업체 관리"
      ],
      boundarySignals: [
        "강의보다는 운영 관리 업무가 중심일 때",
        "콘텐츠 제작보다 시스템 운영 비중이 클 때",
        "교육 설계보다 운영 효율화가 주요 책임일 때"
      ],
      adjacentFamilies: ["training_delivery", "training_program_design"],
      boundaryNote: "교육 운영과 시스템 관리가 핵심일 때 해당 영역으로 읽히며, 강의 실행 비중이 커지면 교육 운영/강의로 이동합니다.",
      summaryTemplate: "이 직무는 교육 프로그램을 안정적으로 운영하고 관리하는 역할입니다. 반면 강의 실행 비중이 커지면 교육 운영/강의 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "instructional_designer",
      label: "교육 기획자",
      aliases: [
        "instructional designer",
        "교육 설계자"
      ],
      family: "training_program_design",
      responsibilityHints: [
        "커리큘럼 설계",
        "학습 목표 정의",
        "교육 구조 기획"
      ],
      levelHints: [
        "주니어: 모듈 단위 설계 지원",
        "시니어: 교육 체계 및 전략 설계"
      ]
    },
    {
      id: "trainer",
      label: "직무 교육 강사",
      aliases: [
        "trainer",
        "강사",
        "facilitator"
      ],
      family: "training_delivery",
      responsibilityHints: [
        "강의 진행",
        "워크샵 운영",
        "학습자 참여 유도"
      ],
      levelHints: [
        "주니어: 정해진 커리큘럼 기반 강의",
        "시니어: 강의 설계 및 퍼실리테이션 리딩"
      ]
    },
    {
      id: "learning_content_creator",
      label: "교육 콘텐츠 개발자",
      aliases: [
        "learning content developer",
        "이러닝 제작자"
      ],
      family: "learning_content_development",
      responsibilityHints: [
        "콘텐츠 제작",
        "스토리보드 작성",
        "영상/자료 제작"
      ],
      levelHints: [
        "주니어: 제작 실행",
        "시니어: 콘텐츠 구조 및 품질 리딩"
      ]
    },
    {
      id: "learning_operations_manager",
      label: "교육 운영 담당",
      aliases: [
        "learning operations manager",
        "교육 운영 매니저"
      ],
      family: "learning_operations",
      responsibilityHints: [
        "교육 운영 관리",
        "LMS 운영",
        "리소스 조율"
      ],
      levelHints: [
        "주니어: 운영 지원",
        "시니어: 운영 체계 설계 및 개선"
      ]
    }
  ],
  axes: [
    {
      axisId: "design_vs_execution",
      label: "설계 vs 실행",
      values: ["설계 중심", "혼합", "실행 중심"]
    },
    {
      axisId: "content_vs_operation",
      label: "콘텐츠 vs 운영",
      values: ["콘텐츠 중심", "혼합", "운영 중심"]
    }
  ],
  adjacentFamilies: ["hr_development", "coaching"],
  boundaryHints: [
    "교육 설계 비중이 높아지면 교육 기획/설계로 이동합니다.",
    "강의 및 퍼실리테이션 비중이 커지면 교육 운영/강의로 이동합니다.",
    "콘텐츠 제작 시간이 많아지면 교육 콘텐츠 개발로 이동합니다.",
    "운영 관리와 시스템 관리 비중이 커지면 교육 운영 관리로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 직무 역량 향상을 위한 교육을 설계하고 운영하는 역할입니다. 반면 설계, 강의, 콘텐츠, 운영 중 어떤 비중이 크냐에 따라 세부 역할이 달라질 수 있습니다."
};
