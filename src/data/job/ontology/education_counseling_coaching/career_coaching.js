export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "CAREER_COACHING",
  aliases: [
    "커리어코치",
    "커리어 코칭",
    "커리어상담",
    "진로코치",
    "진로상담",
    "Career Coach",
    "Career Coaching",
    "Career Counselor",
    "Career Advisory",
    "Career Consulting"
  ],
  families: [
    {
      id: "individual_transition_coaching",
      label: "개인 전환 코칭",
      aliases: [
        "이직코칭",
        "커리어 전환 코칭",
        "진로 변경 코칭",
        "취업 코칭",
        "Career Transition Coaching",
        "Job Change Coaching"
      ],
      strongSignals: [
        "이직 준비 과정 설계",
        "경력 방향 재정의",
        "목표 직무 설정 및 포지셔닝",
        "개인 맞춤 커리어 전략 수립",
        "경력 스토리 재구성",
        "의사결정 지원 (이직 vs 잔류)"
      ],
      mediumSignals: [
        "이력서/자기소개서 방향성 코칭",
        "직무 탐색 워크",
        "강점 및 경험 구조화",
        "시장 기회 분석"
      ],
      boundarySignals: [
        "면접 준비 및 스킬 트레이닝 비중이 커짐",
        "기업 내부 인사제도 중심 논의가 증가함",
        "성과/리더십 개발 중심 코칭으로 이동함"
      ],
      adjacentFamilies: [
        "job_search_execution_coaching",
        "organizational_career_development"
      ],
      boundaryNote: "이직 실행 단계(면접 대비, 서류 피드백)가 중심이 되면 취업 실행 코칭으로 읽히며, 조직 내 승진/성과 중심이면 조직 내 커리어 개발로 이동합니다.",
      summaryTemplate: "이 직무는 개인의 커리어 방향을 재설계하고 이직·전환 전략을 구체화하는 성격이 강합니다. 반면 실행 단계(면접 준비 등)의 비중이 커지면 취업 코칭으로 읽힐 수 있습니다."
    },
    {
      id: "job_search_execution_coaching",
      label: "취업/이직 실행 코칭",
      aliases: [
        "취업 코칭",
        "면접 코칭",
        "이력서 코칭",
        "자기소개서 첨삭",
        "Interview Coaching",
        "Resume Coaching",
        "Job Search Coaching"
      ],
      strongSignals: [
        "이력서 및 자기소개서 직접 피드백",
        "모의 면접 진행",
        "면접 답변 구조 코칭",
        "채용 프로세스 대응 전략",
        "포지션별 지원 전략 구체화"
      ],
      mediumSignals: [
        "기업 분석 방법 안내",
        "직무별 면접 유형 대비",
        "지원 일정 관리"
      ],
      boundarySignals: [
        "장기적인 커리어 방향 설계 비중이 커짐",
        "개인 성장/리더십 개발 논의가 확대됨",
        "조직 내 인사제도 및 승진 전략 중심으로 이동"
      ],
      adjacentFamilies: [
        "individual_transition_coaching",
        "organizational_career_development"
      ],
      boundaryNote: "장기 커리어 설계 중심으로 확장되면 개인 전환 코칭으로 읽히며, 조직 내부 성장 전략 중심이면 조직 커리어 개발로 이동합니다.",
      summaryTemplate: "이 직무는 채용 과정에서의 실행력을 높이는 코칭에 초점을 둡니다. 반면 장기 커리어 방향 설정 비중이 커지면 전환 코칭 영역으로 확장될 수 있습니다."
    },
    {
      id: "organizational_career_development",
      label: "조직 내 커리어 개발 코칭",
      aliases: [
        "사내 커리어 코칭",
        "경력 개발 코칭",
        "리더십 커리어 코칭",
        "Internal Career Coaching",
        "Career Development Coaching"
      ],
      strongSignals: [
        "사내 경력 개발 계획 수립 지원",
        "승진 및 역할 확장 전략 코칭",
        "성과 기반 커리어 설계",
        "조직 내 이동 및 포지셔닝 전략",
        "리더십 성장 경로 설계"
      ],
      mediumSignals: [
        "퍼포먼스 리뷰 해석",
        "직무 확장 기회 탐색",
        "조직 구조 이해 지원"
      ],
      boundarySignals: [
        "이직/외부 시장 중심 전략이 강화됨",
        "면접/이력서 등 외부 채용 대응 비중 증가",
        "심리적 상담/정서 지원 비중 확대"
      ],
      adjacentFamilies: [
        "individual_transition_coaching",
        "job_search_execution_coaching"
      ],
      boundaryNote: "외부 시장 중심 전략이 강화되면 전환 코칭으로 이동하며, 채용 준비가 중심이 되면 취업 실행 코칭으로 읽힙니다.",
      summaryTemplate: "이 직무는 조직 내부에서의 성장과 역할 확장에 초점을 둔 커리어 코칭입니다. 외부 이직 전략이 중심이 되면 전환 코칭으로 해석될 수 있습니다."
    },
    {
      id: "exploratory_career_guidance",
      label: "탐색형 진로 코칭",
      aliases: [
        "진로 탐색 코칭",
        "커리어 방향 탐색",
        "초기 진로 상담",
        "Career Exploration Coaching",
        "Career Guidance"
      ],
      strongSignals: [
        "직무/산업 탐색 중심 대화",
        "자기 이해 기반 진로 탐색",
        "관심사 및 적성 분석",
        "직무 정보 제공 및 비교",
        "초기 커리어 방향 설정"
      ],
      mediumSignals: [
        "간단한 경력 설계 가이드",
        "학습/경험 추천",
        "직무별 요구 역량 안내"
      ],
      boundarySignals: [
        "구체적인 이직 전략 수립 비중 증가",
        "이력서/면접 등 실행 단계 개입 확대",
        "조직 내 승진 및 성과 중심 논의 확대"
      ],
      adjacentFamilies: [
        "individual_transition_coaching",
        "job_search_execution_coaching"
      ],
      boundaryNote: "구체적인 실행 전략이나 이직 준비가 포함되면 전환 코칭 또는 취업 코칭으로 이동하며, 조직 내 성장 중심이면 조직 커리어 개발로 읽힙니다.",
      summaryTemplate: "이 직무는 다양한 가능성을 탐색하며 방향을 설정하는 초기 단계 코칭 성격이 강합니다. 실행 전략이 구체화되면 다른 커리어 코칭 영역으로 확장될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "career_transition_coach",
      label: "커리어 전환 코치",
      aliases: [
        "이직 코치",
        "Career Transition Coach"
      ],
      family: "individual_transition_coaching",
      responsibilityHints: [
        "이직 전략 수립 지원",
        "경력 방향 재정의",
        "목표 직무 설정"
      ],
      levelHints: [
        "개인 맞춤 전략 설계 경험",
        "다양한 산업/직무 이해도"
      ]
    },
    {
      id: "interview_resume_coach",
      label: "면접/이력서 코치",
      aliases: [
        "면접 코치",
        "이력서 코치",
        "Interview Coach"
      ],
      family: "job_search_execution_coaching",
      responsibilityHints: [
        "이력서 첨삭",
        "모의 면접 진행",
        "지원 전략 피드백"
      ],
      levelHints: [
        "채용 프로세스 이해",
        "실제 면접 대응 경험"
      ]
    },
    {
      id: "internal_career_coach",
      label: "사내 커리어 코치",
      aliases: [
        "경력 개발 코치",
        "Internal Career Coach"
      ],
      family: "organizational_career_development",
      responsibilityHints: [
        "사내 경력 개발 계획 지원",
        "승진 및 역할 확장 코칭"
      ],
      levelHints: [
        "조직 구조 이해",
        "성과 관리 경험"
      ]
    },
    {
      id: "career_exploration_coach",
      label: "진로 탐색 코치",
      aliases: [
        "진로 상담가",
        "Career Guidance Counselor"
      ],
      family: "exploratory_career_guidance",
      responsibilityHints: [
        "직무 탐색 지원",
        "자기 이해 기반 방향 설정"
      ],
      levelHints: [
        "다양한 직무 정보 이해",
        "상담 기반 커뮤니케이션 능력"
      ]
    }
  ],
  axes: [
    {
      axisId: "time_horizon",
      label: "개입 시점",
      values: [
        "초기 탐색",
        "전환 설계",
        "실행 단계",
        "조직 내 성장"
      ]
    },
    {
      axisId: "focus_scope",
      label: "초점 범위",
      values: [
        "개인 방향성",
        "채용 대응",
        "조직 내 경력",
        "탐색 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "hr_talent_development",
    "psychological_counseling",
    "executive_coaching"
  ],
  boundaryHints: [
    "이직 준비 실행(이력서, 면접)이 많아지면 취업 실행 코칭으로 이동합니다.",
    "조직 내부 승진과 역할 확장이 중심이 되면 조직 커리어 개발로 읽힙니다.",
    "초기 방향 탐색 중심이면 진로 탐색 코칭으로 해석됩니다.",
    "정서적 문제 해결 중심으로 이동하면 상담 영역으로 분리됩니다."
  ],
  summaryTemplate: "이 직무는 개인의 커리어 방향을 설정하고 실행 전략까지 연결하는 코칭 역할입니다. 다만 실행 단계나 조직 내부 성장 비중에 따라 세부 영역이 달라질 수 있습니다."
};
