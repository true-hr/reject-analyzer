export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "EDUCATION_OPERATIONS",
  aliases: [
    "교육운영",
    "교육 운영",
    "학습 운영",
    "교육 프로그램 운영",
    "training operations",
    "learning operations",
    "L&D operations",
    "교육과정 운영",
    "교육 코디네이션",
    "교육 admin",
    "교육 지원"
  ],
  families: [
    {
      id: "program_operations",
      label: "프로그램 운영",
      aliases: [
        "교육 프로그램 운영",
        "과정 운영",
        "교육 일정 관리",
        "교육 실행",
        "course operations"
      ],
      strongSignals: [
        "교육 일정 편성 및 운영 캘린더 관리",
        "강사 섭외 및 일정 조율",
        "교육 진행 체크리스트 관리",
        "교육 실행 현장 운영 총괄",
        "수강생 출결 및 참여 관리"
      ],
      mediumSignals: [
        "교육 자료 배포 및 준비",
        "교육 만족도 조사 운영",
        "운영 이슈 대응 및 커뮤니케이션",
        "교육 장소 및 환경 세팅"
      ],
      boundarySignals: [
        "콘텐츠 기획 비중이 증가하면 콘텐츠/커리큘럼 기획으로 이동",
        "플랫폼 설정 및 LMS 관리 비중이 높으면 플랫폼 운영으로 이동",
        "학습자 상담 및 코칭 비중이 커지면 학습지원/코칭으로 이동"
      ],
      adjacentFamilies: ["content_planning", "platform_operations", "learner_support"],
      boundaryNote: "교육을 '어떻게 실행하느냐'에 집중되어 있습니다. 커리큘럼 자체를 설계하거나 학습자 개별 지원 비중이 커지면 다른 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 교육 프로그램의 일정, 강사, 참여자 등을 조율하여 교육이 계획대로 실행되도록 만드는 운영 성격이 강합니다. 반면 콘텐츠 설계나 학습자 개별 지원 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "platform_operations",
      label: "플랫폼 운영",
      aliases: [
        "LMS 운영",
        "학습 플랫폼 운영",
        "교육 시스템 운영",
        "learning platform ops",
        "LMS admin"
      ],
      strongSignals: [
        "LMS 내 과정 등록 및 설정 관리",
        "학습자 계정 및 권한 관리",
        "온라인 교육 콘텐츠 업로드 및 배포",
        "플랫폼 이용 이슈 대응 및 관리",
        "수강 데이터 및 이수 현황 관리"
      ],
      mediumSignals: [
        "플랫폼 기능 개선 요청 정리",
        "교육 리포트 추출 및 전달",
        "외부 솔루션 연동 관리",
        "운영 매뉴얼 작성"
      ],
      boundarySignals: [
        "교육 실행 현장 운영 비중이 커지면 프로그램 운영으로 이동",
        "데이터 분석 및 인사이트 도출 비중이 커지면 교육기획/분석 영역으로 이동",
        "사용자 상담 대응 비중이 커지면 학습지원으로 이동"
      ],
      adjacentFamilies: ["program_operations", "learner_support"],
      boundaryNote: "교육 시스템을 통해 학습이 문제없이 이루어지도록 관리하는 역할입니다. 현장 운영이나 콘텐츠 기획 비중이 커지면 다른 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 LMS 및 학습 플랫폼을 기반으로 교육이 안정적으로 운영되도록 관리하는 성격이 강합니다. 반면 현장 실행이나 콘텐츠 기획 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "learner_support",
      label: "학습자 지원",
      aliases: [
        "학습자 지원",
        "교육 운영 지원",
        "수강생 관리",
        "학습 코디네이터",
        "learner support"
      ],
      strongSignals: [
        "수강생 문의 대응 및 상담",
        "학습 진행 독려 및 리마인드",
        "출결 및 과제 제출 관리",
        "교육 참여율 관리",
        "학습 이탈 방지 활동"
      ],
      mediumSignals: [
        "교육 안내 및 공지 전달",
        "FAQ 대응 및 가이드 제공",
        "기초 학습 안내",
        "커뮤니티 운영 지원"
      ],
      boundarySignals: [
        "심층 코칭 및 커리어 상담 비중이 커지면 코칭/상담으로 이동",
        "교육 일정 및 강사 조율 비중이 커지면 프로그램 운영으로 이동",
        "플랫폼 설정 및 시스템 관리 비중이 커지면 플랫폼 운영으로 이동"
      ],
      adjacentFamilies: ["program_operations", "platform_operations"],
      boundaryNote: "학습자의 경험과 참여를 유지하는 데 집중된 역할입니다. 상담 깊이가 깊어지거나 운영 기획 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 학습자의 참여와 경험을 관리하며 교육이 원활히 진행되도록 지원하는 성격이 강합니다. 반면 상담 깊이나 운영 기획 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "content_planning",
      label: "콘텐츠/커리큘럼 운영",
      aliases: [
        "교육 콘텐츠 운영",
        "커리큘럼 운영",
        "과정 구성 관리",
        "learning content ops"
      ],
      strongSignals: [
        "교육 커리큘럼 구성 및 업데이트",
        "강의 콘텐츠 기획 및 구성 조정",
        "교육 과정 구조 설계",
        "콘텐츠 품질 검수",
        "강의 자료 기획 및 수정"
      ],
      mediumSignals: [
        "강사와 콘텐츠 방향 협의",
        "교육 니즈 기반 과정 개선",
        "콘텐츠 버전 관리",
        "교육 효과 피드백 반영"
      ],
      boundarySignals: [
        "교육 실행 및 일정 관리 비중이 커지면 프로그램 운영으로 이동",
        "콘텐츠 제작 비중이 커지면 콘텐츠 제작/기획 직무로 이동",
        "플랫폼 등록 및 운영 비중이 커지면 플랫폼 운영으로 이동"
      ],
      adjacentFamilies: ["program_operations", "platform_operations"],
      boundaryNote: "콘텐츠 자체의 구성과 흐름을 다루는 운영 역할입니다. 제작이나 실행 중심으로 이동하면 다른 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 교육 콘텐츠와 커리큘럼의 구조를 설계하고 관리하는 성격이 강합니다. 반면 실제 실행 운영이나 제작 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "training_coordinator",
      label: "교육 코디네이터",
      aliases: ["교육 코디", "training coordinator"],
      family: "program_operations",
      responsibilityHints: [
        "교육 일정 및 강사 조율",
        "교육 진행 준비 및 운영",
        "참여자 관리"
      ],
      levelHints: [
        "운영 실무 중심",
        "다수 과정 동시 관리 경험"
      ]
    },
    {
      id: "lms_administrator",
      label: "LMS 관리자",
      aliases: ["LMS admin", "학습 시스템 관리자"],
      family: "platform_operations",
      responsibilityHints: [
        "플랫폼 과정 등록",
        "계정 및 권한 관리",
        "운영 이슈 대응"
      ],
      levelHints: [
        "시스템 이해도 필요",
        "데이터 관리 경험"
      ]
    },
    {
      id: "learner_coordinator",
      label: "학습자 코디네이터",
      aliases: ["수강생 관리 담당", "learner coordinator"],
      family: "learner_support",
      responsibilityHints: [
        "학습자 문의 대응",
        "출결 및 참여 관리",
        "학습 독려"
      ],
      levelHints: [
        "커뮤니케이션 중심",
        "운영 경험 기반 확장 가능"
      ]
    },
    {
      id: "curriculum_operator",
      label: "커리큘럼 운영 담당",
      aliases: ["교육과정 운영", "curriculum ops"],
      family: "content_planning",
      responsibilityHints: [
        "교육 과정 구성 관리",
        "콘텐츠 업데이트",
        "강의 구조 설계"
      ],
      levelHints: [
        "콘텐츠 이해도 필요",
        "기획 경험으로 확장 가능"
      ]
    }
  ],
  axes: [
    {
      axisId: "execution_vs_structure",
      label: "실행 운영 vs 구조 설계",
      values: [
        "실행 중심 운영",
        "구조 및 커리큘럼 설계 중심"
      ]
    },
    {
      axisId: "platform_dependency",
      label: "플랫폼 의존도",
      values: [
        "오프라인/현장 중심",
        "플랫폼 기반 운영 중심"
      ]
    },
    {
      axisId: "learner_interaction",
      label: "학습자 직접 상호작용 수준",
      values: [
        "간접 관리 중심",
        "직접 지원 및 관리 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "learning_planning",
    "content_creation",
    "coaching_counseling"
  ],
  boundaryHints: [
    "교육 일정, 강사, 운영 체크리스트 관리 비중이 높아지면 프로그램 운영으로 해석됩니다.",
    "플랫폼 설정, 계정 관리, 데이터 관리 비중이 커지면 플랫폼 운영으로 이동합니다.",
    "학습자 문의 대응과 참여 관리 비중이 커지면 학습자 지원으로 해석됩니다.",
    "교육 내용 자체를 설계하고 구조화하는 비중이 커지면 콘텐츠/커리큘럼 영역으로 이동합니다.",
    "학습자의 성장, 상담, 코칭 역할이 강화되면 교육운영이 아니라 상담/코칭 영역으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 교육이 실제로 실행되고 유지되도록 일정, 플랫폼, 학습자 등을 관리하는 운영 성격이 강합니다. 반면 콘텐츠 설계나 학습자 코칭 비중이 커지면 다른 직무 경계로 해석될 수 있습니다."
};
