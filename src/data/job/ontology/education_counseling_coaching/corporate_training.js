export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "CORPORATE_TRAINING",
  aliases: [
    "기업교육",
    "기업 교육 담당",
    "Corporate Training",
    "사내 교육",
    "인재개발 교육",
    "HRD 교육",
    "사내 강사",
    "교육 기획 및 운영",
    "L&D"
  ],
  families: [
    {
      id: "training_design",
      label: "교육 기획/설계",
      aliases: [
        "교육 기획자",
        "교육 설계",
        "Instructional Design",
        "커리큘럼 설계"
      ],
      strongSignals: [
        "교육 과정 기획 및 커리큘럼 설계",
        "학습 목표 및 평가 기준 정의",
        "교육 콘텐츠 구조 설계",
        "Instructional Design 모델 적용",
        "교육 니즈 분석 수행"
      ],
      mediumSignals: [
        "교육 자료 제작 일부 수행",
        "교육 효과 측정 설계",
        "현업 인터뷰 기반 교육 설계"
      ],
      boundarySignals: [
        "강의 직접 수행보다 설계 중심",
        "운영보다 구조 설계 비중 높음",
        "콘텐츠 제작보다 학습 흐름 정의 강조"
      ],
      adjacentFamilies: ["training_delivery", "learning_content"],
      boundaryNote: "교육 실행이나 강의 비중이 커지면 전달/운영 영역으로 이동하며, 콘텐츠 제작 비중이 커지면 학습 콘텐츠 제작 영역으로 읽힙니다.",
      summaryTemplate: "이 직무는 교육의 구조와 학습 경험을 설계하는 기획 중심 성격이 강합니다. 반면 직접 강의나 운영 비중이 커지면 전달 영역으로, 콘텐츠 제작 비중이 커지면 콘텐츠 제작 영역으로 읽힐 수 있습니다."
    },
    {
      id: "training_delivery",
      label: "교육 운영/강의",
      aliases: [
        "사내 강사",
        "교육 운영 담당",
        "교육 진행자",
        "Facilitator",
        "Trainer"
      ],
      strongSignals: [
        "교육 강의 직접 수행",
        "워크샵 및 교육 세션 진행",
        "교육 운영 및 일정 관리",
        "참여자 관리 및 피드백 수집",
        "오프라인/온라인 교육 진행"
      ],
      mediumSignals: [
        "교육 자료 일부 수정",
        "교육 효과 피드백 반영",
        "현장 중심 문제 대응"
      ],
      boundarySignals: [
        "교육 설계보다 전달 중심",
        "콘텐츠 제작보다 강의 비중 높음",
        "성과 측정보다 운영 안정성 강조"
      ],
      adjacentFamilies: ["training_design", "learning_content"],
      boundaryNote: "교육 구조 설계 비중이 커지면 기획/설계 영역으로 이동하며, 콘텐츠 제작 중심으로 이동하면 학습 콘텐츠 제작 영역으로 읽힙니다.",
      summaryTemplate: "이 직무는 교육을 실제로 전달하고 운영하는 실행 중심 성격이 강합니다. 반면 교육 설계나 콘텐츠 제작 비중이 커지면 다른 교육 영역으로 읽힐 수 있습니다."
    },
    {
      id: "learning_content",
      label: "학습 콘텐츠 제작",
      aliases: [
        "교육 콘텐츠 제작",
        "이러닝 콘텐츠 개발",
        "콘텐츠 디벨로퍼",
        "e-learning 개발자"
      ],
      strongSignals: [
        "이러닝 콘텐츠 제작",
        "교육 영상/자료 제작",
        "스토리보드 작성",
        "콘텐츠 제작 툴 활용 (Articulate, Captivate 등)",
        "교육 콘텐츠 편집 및 업데이트"
      ],
      mediumSignals: [
        "교육 기획안 기반 콘텐츠 제작",
        "디자인 및 텍스트 구성",
        "학습 경험 일부 고려"
      ],
      boundarySignals: [
        "교육 설계보다 제작 중심",
        "강의 수행 없음",
        "학습 흐름보다는 콘텐츠 단위 작업"
      ],
      adjacentFamilies: ["training_design", "training_delivery"],
      boundaryNote: "학습 구조 설계까지 관여하면 기획/설계 영역으로 이동하며, 강의나 운영 비중이 커지면 교육 운영/강의 영역으로 읽힙니다.",
      summaryTemplate: "이 직무는 교육에 사용되는 콘텐츠를 제작하는 역할 성격이 강합니다. 반면 교육 구조 설계나 강의 비중이 커지면 다른 교육 영역으로 읽힐 수 있습니다."
    },
    {
      id: "hrd_program_management",
      label: "HRD 프로그램 운영",
      aliases: [
        "HRD 담당",
        "교육 프로그램 매니저",
        "인재개발 운영",
        "L&D 운영"
      ],
      strongSignals: [
        "교육 프로그램 운영 관리",
        "연간 교육 계획 수립",
        "외부 교육 업체 관리",
        "교육 예산 관리",
        "교육 운영 프로세스 관리"
      ],
      mediumSignals: [
        "교육 성과 리포트 작성",
        "교육 참여율 관리",
        "교육 시스템(LMS) 운영"
      ],
      boundarySignals: [
        "강의나 콘텐츠 제작 없음",
        "교육 기획보다 운영 관리 중심",
        "프로그램 단위 관리 강조"
      ],
      adjacentFamilies: ["training_design", "training_delivery"],
      boundaryNote: "교육 구조 설계까지 깊게 관여하면 기획/설계 영역으로 이동하며, 직접 강의나 실행 비중이 커지면 교육 운영/강의 영역으로 읽힙니다.",
      summaryTemplate: "이 직무는 기업 내 교육 프로그램을 운영하고 관리하는 역할 성격이 강합니다. 반면 교육 설계나 강의 실행 비중이 커지면 다른 교육 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "instructional_designer",
      label: "교육 설계자",
      aliases: ["Instructional Designer", "교육 기획자"],
      family: "training_design",
      responsibilityHints: [
        "교육 커리큘럼 설계",
        "학습 목표 정의",
        "교육 니즈 분석"
      ],
      levelHints: [
        "주니어는 콘텐츠 구조 설계 지원",
        "시니어는 전체 교육 프로그램 설계 주도"
      ]
    },
    {
      id: "corporate_trainer",
      label: "사내 강사",
      aliases: ["Trainer", "교육 강사"],
      family: "training_delivery",
      responsibilityHints: [
        "교육 강의 수행",
        "워크샵 진행",
        "참여자 관리"
      ],
      levelHints: [
        "주니어는 강의 보조 및 일부 세션 진행",
        "시니어는 핵심 교육 과정 리딩"
      ]
    },
    {
      id: "learning_content_developer",
      label: "교육 콘텐츠 개발자",
      aliases: ["e-learning 개발자", "콘텐츠 제작자"],
      family: "learning_content",
      responsibilityHints: [
        "이러닝 콘텐츠 제작",
        "스토리보드 작성",
        "교육 자료 제작"
      ],
      levelHints: [
        "주니어는 콘텐츠 제작 중심",
        "시니어는 콘텐츠 기획 및 품질 관리"
      ]
    },
    {
      id: "hrd_program_manager",
      label: "HRD 프로그램 매니저",
      aliases: ["L&D 매니저", "교육 운영 관리자"],
      family: "hrd_program_management",
      responsibilityHints: [
        "교육 프로그램 운영",
        "외부 업체 관리",
        "교육 예산 및 일정 관리"
      ],
      levelHints: [
        "주니어는 운영 지원",
        "시니어는 전체 교육 체계 관리"
      ]
    }
  ],
  axes: [
    {
      axisId: "focus_area",
      label: "핵심 역할 초점",
      values: ["교육 설계", "강의/전달", "콘텐츠 제작", "프로그램 운영"]
    },
    {
      axisId: "involvement_type",
      label: "개입 방식",
      values: ["구조 설계", "직접 실행", "제작", "관리"]
    }
  ],
  adjacentFamilies: ["coaching", "hr_management"],
  boundaryHints: [
    "교육 구조와 커리큘럼 설계 비중이 커지면 교육 기획/설계로 이동",
    "직접 강의와 교육 전달 비중이 커지면 교육 운영/강의로 이동",
    "콘텐츠 제작 비중이 커지면 학습 콘텐츠 제작으로 이동",
    "프로그램 운영과 관리 비중이 커지면 HRD 프로그램 운영으로 이동"
  ],
  summaryTemplate: "이 직무는 기업 내 교육을 설계, 제작, 전달, 운영하는 다양한 역할을 포함하며 어떤 활동에 더 집중하는지에 따라 세부 영역이 나뉩니다. 교육 설계, 강의, 콘텐츠 제작, 운영 관리 중 어느 비중이 큰지에 따라 다른 교육 영역으로 읽힐 수 있습니다."
};
