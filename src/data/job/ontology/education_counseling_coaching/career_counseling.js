export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "CAREER_COUNSELING",
  aliases: [
    "진로상담",
    "커리어 상담",
    "진로 컨설팅",
    "커리어 코칭",
    "career counseling",
    "career guidance",
    "career advisor",
    "career coach",
    "진로 지도",
    "취업 상담"
  ],
  families: [
    {
      id: "exploration_oriented_counseling",
      label: "탐색 중심 진로상담",
      aliases: [
        "진로 탐색 상담",
        "적성 탐색 상담",
        "career exploration counseling"
      ],
      strongSignals: [
        "적성 검사 결과 해석",
        "흥미/가치관 기반 진로 탐색",
        "직무/직업군 비교 설명",
        "진로 방향성 초기 설정",
        "자기 이해 질문 중심 상담",
        "진로 선택지 확장 유도"
      ],
      mediumSignals: [
        "검사 도구 활용 상담",
        "직업 정보 제공",
        "진로 로드맵 초안 작성",
        "학생/초기 커리어 대상 상담",
        "자기 인식 활동 진행"
      ],
      boundarySignals: [
        "구체적 취업 준비 행동 설계 증가",
        "이직 전략 수립 비중 증가",
        "심리 문제 개입 비중 증가"
      ],
      adjacentFamilies: [
        "employment_support_counseling",
        "career_transition_counseling",
        "psychological_counseling_blended"
      ],
      boundaryNote: "구체적인 취업 준비 행동 설계가 많아지면 취업 지원 상담으로 이동하고, 이직 전략 수립 비중이 커지면 커리어 전환 상담으로 읽힙니다. 심리 문제 개입이 깊어지면 심리 상담과의 경계로 이동합니다.",
      summaryTemplate: "이 직무는 개인의 흥미와 적성을 기반으로 진로 방향을 탐색하도록 돕는 성격이 강합니다. 반면 구체적인 취업 전략이나 심리 개입 비중이 커지면 다른 상담 영역으로 해석될 수 있습니다."
    },
    {
      id: "employment_support_counseling",
      label: "취업 준비 지원 상담",
      aliases: [
        "취업 상담",
        "구직 상담",
        "취업 컨설팅",
        "employment counseling",
        "job search counseling"
      ],
      strongSignals: [
        "이력서/자소서 피드백 제공",
        "면접 준비 코칭",
        "채용 공고 분석 및 매칭",
        "구직 전략 수립 지원",
        "취업 일정 관리 지원",
        "직무별 준비 방향 제시"
      ],
      mediumSignals: [
        "채용 트렌드 설명",
        "직무 요구 역량 설명",
        "포트폴리오 구성 조언",
        "취업 프로그램 운영",
        "구직 활동 점검"
      ],
      boundarySignals: [
        "자기 이해 중심 탐색 증가",
        "장기 커리어 방향 설정 증가",
        "심리적 문제 개입 증가"
      ],
      adjacentFamilies: [
        "exploration_oriented_counseling",
        "career_transition_counseling",
        "psychological_counseling_blended"
      ],
      boundaryNote: "자기 이해 기반 탐색이 많아지면 탐색 중심 상담으로 이동하고, 장기 커리어 설계 비중이 커지면 커리어 전환 상담으로 읽힙니다. 심리적 문제 개입이 깊어지면 심리 상담과의 경계로 이동합니다.",
      summaryTemplate: "이 직무는 취업을 위한 구체적인 준비와 실행을 지원하는 성격이 강합니다. 반면 자기 탐색이나 장기 커리어 설계 비중이 커지면 다른 진로상담 영역으로 해석될 수 있습니다."
    },
    {
      id: "career_transition_counseling",
      label: "커리어 전환 상담",
      aliases: [
        "이직 상담",
        "커리어 전환 컨설팅",
        "경력 전환 상담",
        "career transition counseling",
        "career change coaching"
      ],
      strongSignals: [
        "이직 방향성 설정",
        "경력 재구성 및 스토리 설계",
        "이전 경험의 직무 전환 연결",
        "시장 가치 기반 포지셔닝",
        "중장기 커리어 전략 수립",
        "이직 타이밍 판단 지원"
      ],
      mediumSignals: [
        "경력 분석 및 재정리",
        "직무 전환 가능성 평가",
        "업계/직무 트렌드 설명",
        "네트워크 활용 조언",
        "경력 공백 설명 전략"
      ],
      boundarySignals: [
        "단기 취업 준비 지원 증가",
        "초기 진로 탐색 비중 증가",
        "심리 상담 개입 증가"
      ],
      adjacentFamilies: [
        "employment_support_counseling",
        "exploration_oriented_counseling",
        "psychological_counseling_blended"
      ],
      boundaryNote: "단기 취업 준비 지원이 중심이 되면 취업 상담으로 이동하고, 초기 진로 탐색이 많아지면 탐색 중심 상담으로 읽힙니다. 심리적 문제 개입이 깊어지면 심리 상담 영역과 경계가 겹칩니다.",
      summaryTemplate: "이 직무는 기존 경력을 기반으로 새로운 방향을 설계하고 전환 전략을 수립하는 성격이 강합니다. 반면 단기 취업 준비나 초기 탐색 비중이 커지면 다른 진로상담 영역으로 해석될 수 있습니다."
    },
    {
      id: "psychological_counseling_blended",
      label: "심리 결합형 진로상담",
      aliases: [
        "심리 기반 진로상담",
        "상담심리 진로상담",
        "career counseling with psychotherapy"
      ],
      strongSignals: [
        "진로 불안/우울 등 정서 문제 다룸",
        "자기 효능감 저하 개입",
        "의사결정 회피/불안 탐색",
        "심리적 장벽 해소 중심 상담",
        "상담 기법 활용 (예: 인지 재구성)",
        "장기적 정서 변화 지원"
      ],
      mediumSignals: [
        "상담 기록 및 사례 관리",
        "정서 상태 평가",
        "심리 검사 활용",
        "상담 세션 반복 진행",
        "내면 갈등 탐색"
      ],
      boundarySignals: [
        "구체적 취업 행동 설계 증가",
        "직무 정보 제공 중심으로 이동",
        "전략적 경력 설계 비중 증가"
      ],
      adjacentFamilies: [
        "exploration_oriented_counseling",
        "employment_support_counseling",
        "career_transition_counseling"
      ],
      boundaryNote: "구체적인 취업 행동 설계가 많아지면 취업 상담으로 이동하고, 직무 정보 제공 중심이면 탐색 상담으로 읽힙니다. 전략적 경력 설계 비중이 커지면 커리어 전환 상담으로 이동합니다.",
      summaryTemplate: "이 직무는 진로 문제를 개인의 정서와 심리 상태와 연결해 다루는 성격이 강합니다. 반면 행동 중심 취업 지원이나 전략 설계 비중이 커지면 다른 진로상담 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "career_counselor",
      label: "진로상담사",
      aliases: ["career counselor", "진로 지도 교사"],
      family: "exploration_oriented_counseling",
      responsibilityHints: [
        "적성 및 흥미 기반 진로 탐색 지원",
        "진로 검사 해석 및 상담",
        "진로 선택지 제시"
      ],
      levelHints: [
        "기초 상담 진행",
        "복합 진로 문제 해석 및 설계"
      ]
    },
    {
      id: "employment_consultant",
      label: "취업 컨설턴트",
      aliases: ["취업 상담사", "job consultant"],
      family: "employment_support_counseling",
      responsibilityHints: [
        "이력서/면접 코칭",
        "구직 전략 수립 지원",
        "채용 공고 분석"
      ],
      levelHints: [
        "기초 서류 피드백",
        "산업/직무 기반 전략 설계"
      ]
    },
    {
      id: "career_transition_consultant",
      label: "커리어 전환 컨설턴트",
      aliases: ["이직 컨설턴트", "career transition consultant"],
      family: "career_transition_counseling",
      responsibilityHints: [
        "이직 전략 설계",
        "경력 재구성 지원",
        "시장 가치 기반 포지셔닝"
      ],
      levelHints: [
        "단순 이직 상담",
        "복합 경력 전략 설계"
      ]
    },
    {
      id: "career_psychological_counselor",
      label: "진로 심리상담사",
      aliases: ["career psychological counselor"],
      family: "psychological_counseling_blended",
      responsibilityHints: [
        "진로 관련 정서 문제 상담",
        "자기 효능감 회복 지원",
        "의사결정 불안 개입"
      ],
      levelHints: [
        "기초 정서 상담",
        "심층 심리 개입"
      ]
    }
  ],
  axes: [
    {
      axisId: "intervention_focus",
      label: "개입 초점",
      values: ["자기 탐색", "취업 실행", "경력 전략", "심리 개입"]
    },
    {
      axisId: "time_horizon",
      label: "시간 범위",
      values: ["단기 선택", "단기 취업", "중장기 커리어", "장기 심리 변화"]
    },
    {
      axisId: "intervention_mode",
      label: "개입 방식",
      values: ["정보 제공", "행동 설계", "전략 설계", "정서 개입"]
    }
  ],
  adjacentFamilies: [
    "코칭",
    "심리상담",
    "교육 기획",
    "HRD"
  ],
  boundaryHints: [
    "구체적인 취업 행동 설계가 많아지면 취업 지원 영역으로 이동",
    "자기 탐색 질문과 검사 해석 비중이 커지면 탐색 중심 상담으로 이동",
    "경력 전략과 시장 포지셔닝 비중이 커지면 커리어 전환 영역으로 이동",
    "정서 문제 개입이 깊어지면 심리상담 영역으로 이동"
  ],
  summaryTemplate: "이 직무는 개인의 진로 선택과 커리어 방향 설정을 돕기 위해 탐색, 실행, 전략, 심리 개입을 조합하는 역할입니다. 어떤 요소에 더 집중하느냐에 따라 취업 지원, 커리어 전환, 심리 상담 등으로 경계가 나뉠 수 있습니다."
};
