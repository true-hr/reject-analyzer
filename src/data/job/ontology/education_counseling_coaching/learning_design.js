export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "LEARNING_DESIGN",
  aliases: [
    "학습설계",
    "교육기획",
    "교육과정 설계",
    "Instructional Design",
    "Learning Experience Design",
    "LXD",
    "Curriculum Design",
    "교육 콘텐츠 설계"
  ],
  families: [
    {
      id: "curriculum_design",
      label: "교육과정 설계",
      aliases: [
        "커리큘럼 설계",
        "교육과정 기획",
        "과정 개발",
        "Program Design",
        "Curriculum Planning"
      ],
      strongSignals: [
        "교육과정 구조 설계",
        "모듈/단원 단위 구성 정의",
        "학습 목표 체계 정의",
        "수강 흐름 및 단계 설계",
        "과정 로드맵 기획"
      ],
      mediumSignals: [
        "평가 방식 설계",
        "교육 시간 배분 설계",
        "선수지식 정의",
        "교육 운영 방식 정의"
      ],
      boundarySignals: [
        "콘텐츠 제작 직접 수행 비중 증가",
        "플랫폼 기능 설계 참여 증가",
        "강의 전달/강사 역할 비중 증가"
      ],
      adjacentFamilies: ["content_design", "learning_experience_design"],
      boundaryNote: "교육과정 전체 구조와 흐름 설계 비중이 줄고 개별 콘텐츠 제작이나 인터랙션 설계 비중이 커지면 콘텐츠 설계 또는 학습경험 설계로 이동합니다.",
      summaryTemplate: "이 직무는 학습 목표와 흐름을 기준으로 교육과정 전체 구조를 설계하는 성격이 강합니다. 반면 개별 콘텐츠 제작이나 인터랙션 설계 비중이 커지면 다른 설계 영역으로 해석될 수 있습니다."
    },
    {
      id: "content_design",
      label: "학습 콘텐츠 설계",
      aliases: [
        "교육 콘텐츠 기획",
        "콘텐츠 설계",
        "Instructional Content Design",
        "교육자료 설계"
      ],
      strongSignals: [
        "강의안/교안 설계",
        "콘텐츠 스크립트 작성",
        "슬라이드 구조 설계",
        "학습 자료 구성 설계",
        "예시/케이스 설계"
      ],
      mediumSignals: [
        "영상/이러닝 콘텐츠 기획",
        "퀴즈/과제 구성 설계",
        "스토리보드 작성"
      ],
      boundarySignals: [
        "교육과정 전체 구조 설계 비중 증가",
        "UX/플랫폼 인터랙션 설계 비중 증가",
        "강의 전달 및 퍼실리테이션 비중 증가"
      ],
      adjacentFamilies: ["curriculum_design", "learning_experience_design"],
      boundaryNote: "개별 콘텐츠 설계에서 벗어나 전체 교육과정 구조를 정의하기 시작하면 교육과정 설계로 이동하며, 인터랙션과 학습 경험 설계가 강조되면 학습경험 설계로 이동합니다.",
      summaryTemplate: "이 직무는 학습 내용을 실제 전달 가능한 콘텐츠로 구조화하는 역할이 중심입니다. 반면 과정 전체 설계나 사용자 경험 설계 비중이 커지면 다른 설계 영역으로 해석될 수 있습니다."
    },
    {
      id: "learning_experience_design",
      label: "학습경험 설계",
      aliases: [
        "LXD",
        "Learning Experience Design",
        "학습 UX 설계",
        "교육 UX 설계"
      ],
      strongSignals: [
        "학습자 여정 설계",
        "인터랙션 설계",
        "학습 참여 유도 구조 설계",
        "사용자 경험 기반 학습 설계",
        "플랫폼 내 학습 흐름 설계"
      ],
      mediumSignals: [
        "데이터 기반 학습 개선 설계",
        "학습 몰입도 설계",
        "게이미피케이션 요소 설계"
      ],
      boundarySignals: [
        "콘텐츠 자체 설계 비중 증가",
        "교육과정 구조 설계 비중 증가",
        "운영/강의 전달 비중 증가"
      ],
      adjacentFamilies: ["content_design", "curriculum_design"],
      boundaryNote: "학습 경험 설계에서 콘텐츠 자체 제작이나 과정 구조 설계로 중심이 이동하면 각각 콘텐츠 설계 또는 교육과정 설계로 해석됩니다.",
      summaryTemplate: "이 직무는 학습자의 경험과 참여 흐름을 중심으로 교육을 설계하는 성격이 강합니다. 반면 콘텐츠 자체 제작이나 과정 구조 설계 비중이 커지면 다른 설계 영역으로 이동할 수 있습니다."
    }
  ],
  roles: [
    {
      id: "instructional_designer",
      label: "Instructional Designer",
      aliases: [
        "교육설계자",
        "ID",
        "학습설계자"
      ],
      family: "curriculum_design",
      responsibilityHints: [
        "학습 목표 정의 및 과정 설계",
        "교육 구조 및 흐름 설계",
        "평가 방식 설계"
      ],
      levelHints: [
        "주니어는 기존 과정 개선 중심",
        "시니어는 신규 과정 구조 설계 및 전략 정의"
      ]
    },
    {
      id: "content_designer",
      label: "교육 콘텐츠 디자이너",
      aliases: [
        "교육 콘텐츠 기획자",
        "교안 설계자"
      ],
      family: "content_design",
      responsibilityHints: [
        "강의안 및 콘텐츠 구조 설계",
        "스토리보드 작성",
        "학습 자료 구성 설계"
      ],
      levelHints: [
        "주니어는 콘텐츠 단위 설계",
        "시니어는 콘텐츠 전략 및 품질 기준 정의"
      ]
    },
    {
      id: "lxd_designer",
      label: "Learning Experience Designer",
      aliases: [
        "LXD 디자이너",
        "학습경험 디자이너"
      ],
      family: "learning_experience_design",
      responsibilityHints: [
        "학습자 여정 설계",
        "인터랙션 및 참여 구조 설계",
        "플랫폼 기반 학습 경험 설계"
      ],
      levelHints: [
        "주니어는 인터랙션 설계 중심",
        "시니어는 전체 경험 전략 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "design_scope",
      label: "설계 범위",
      values: [
        "과정 전체 구조",
        "콘텐츠 단위",
        "학습 경험/인터랙션"
      ]
    },
    {
      axisId: "learner_focus",
      label: "학습자 관점 반영 수준",
      values: [
        "내용 전달 중심",
        "구조 중심",
        "경험/참여 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "teaching_delivery",
    "education_operations"
  ],
  boundaryHints: [
    "강의 전달 및 퍼실리테이션 비중이 커지면 교육 운영/강의 영역으로 이동합니다.",
    "플랫폼 운영이나 교육 관리 업무 비중이 커지면 교육 운영 영역으로 해석됩니다.",
    "설계가 아닌 실행(강의, 운영) 비중이 커질수록 학습설계 범주에서 벗어납니다."
  ],
  summaryTemplate: "이 직무는 학습 목표를 기반으로 교육과정, 콘텐츠, 학습 경험을 설계하는 역할입니다. 다만 강의 전달이나 운영 비중이 커지면 설계가 아닌 실행 영역으로 해석될 수 있습니다."
};
