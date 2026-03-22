export const JOB_ONTOLOGY_ITEM = {
  vertical: "EDUCATION_COUNSELING_COACHING",
  subVertical: "FACILITATION",
  aliases: [
    "퍼실리테이터",
    "퍼실리테이션",
    "워크숍 진행",
    "워크숍 퍼실리테이터",
    "facilitator",
    "facilitation",
    "workshop facilitator",
    "group facilitation",
    "회의 진행 전문가",
    "집단 토의 진행"
  ],
  families: [
    {
      id: "group_process_facilitation",
      label: "집단 프로세스 퍼실리테이션",
      aliases: [
        "집단 퍼실리테이션",
        "그룹 퍼실리테이터",
        "회의 퍼실리테이터",
        "워크숍 진행자",
        "group facilitation",
        "process facilitation"
      ],
      strongSignals: [
        "회의 흐름 설계 및 진행",
        "참여자 발언 균형 조정",
        "의사결정 구조 설계",
        "토의 규칙 설정 및 관리",
        "집단 합의 도출 지원",
        "발언 기회 균등화",
        "논의 흐름 개입 및 재정렬"
      ],
      mediumSignals: [
        "워크숍 아젠다 설계",
        "포스트잇/화이트보드 활용",
        "집단 참여 유도 질문 설계",
        "브레인스토밍 진행",
        "퍼실리테이션 도구 사용"
      ],
      boundarySignals: [
        "콘텐츠 교육 비중 증가",
        "개인 코칭 비중 증가",
        "조직 전략 결과물 책임 증가"
      ],
      adjacentFamilies: [
        "learning_facilitation",
        "coaching_oriented_facilitation",
        "strategic_workshop_facilitation"
      ],
      boundaryNote: "참여자 학습 전달 비중이 커지면 교육 퍼실리테이션으로 이동하고, 개인별 성장 개입이 많아지면 코칭 중심 퍼실리테이션으로 읽힙니다. 또한 결과물 책임이 커지면 전략 워크숍 퍼실리테이션으로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 집단의 논의 흐름과 참여를 설계하고 균형 있게 조율하는 성격이 강합니다. 반면 콘텐츠 전달이나 개인 개입 비중이 커지면 다른 퍼실리테이션 영역으로 해석될 수 있습니다."
    },
    {
      id: "learning_facilitation",
      label: "학습 중심 퍼실리테이션",
      aliases: [
        "교육 퍼실리테이션",
        "러닝 퍼실리테이터",
        "학습 워크숍 진행",
        "learning facilitation",
        "training facilitation"
      ],
      strongSignals: [
        "학습 목표 기반 세션 설계",
        "교육 콘텐츠 전달과 토의 병행",
        "참여형 학습 구조 설계",
        "사례 기반 학습 진행",
        "학습자 이해도 확인 및 피드백",
        "교육 효과 측정 및 개선"
      ],
      mediumSignals: [
        "강의와 퍼실리테이션 혼합 진행",
        "참여형 교육 활동 설계",
        "교육 자료 개발",
        "학습자 참여 유도 질문",
        "실습 중심 세션 구성"
      ],
      boundarySignals: [
        "집단 의사결정 지원 비중 증가",
        "개인 코칭 개입 증가",
        "조직 문제 해결 결과물 책임 증가"
      ],
      adjacentFamilies: [
        "group_process_facilitation",
        "coaching_oriented_facilitation",
        "strategic_workshop_facilitation"
      ],
      boundaryNote: "집단 의사결정 조율 역할이 강해지면 집단 프로세스 퍼실리테이션으로 이동하고, 개인 성장 개입이 강화되면 코칭 중심 퍼실리테이션으로 읽힙니다. 조직 문제 해결 결과 책임이 커지면 전략 워크숍 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 학습 목표를 중심으로 참여형 교육을 설계하고 운영하는 성격이 강합니다. 반면 집단 의사결정 조율이나 개인 개입 비중이 커지면 다른 퍼실리테이션 영역으로 해석될 수 있습니다."
    },
    {
      id: "coaching_oriented_facilitation",
      label: "코칭 중심 퍼실리테이션",
      aliases: [
        "코칭 퍼실리테이션",
        "성장 워크숍 퍼실리테이터",
        "코칭 기반 그룹 세션",
        "coaching facilitation",
        "group coaching facilitation"
      ],
      strongSignals: [
        "개인 인식 전환 질문 사용",
        "참여자 개인 목표 탐색 유도",
        "피드백 기반 자기 성찰 유도",
        "감정 및 태도 변화 개입",
        "개인 행동 변화 촉진",
        "심리적 안전감 형성"
      ],
      mediumSignals: [
        "그룹 코칭 세션 운영",
        "자기 성찰 활동 설계",
        "코칭 질문 프레임 활용",
        "개인 경험 공유 유도",
        "내면 탐색 활동 진행"
      ],
      boundarySignals: [
        "콘텐츠 전달 비중 증가",
        "집단 의사결정 구조 설계 비중 증가",
        "조직 전략 결과물 책임 증가"
      ],
      adjacentFamilies: [
        "learning_facilitation",
        "group_process_facilitation",
        "strategic_workshop_facilitation"
      ],
      boundaryNote: "교육 콘텐츠 전달이 많아지면 학습 퍼실리테이션으로 이동하고, 집단 의사결정 구조 설계가 강조되면 집단 프로세스 퍼실리테이션으로 이동합니다. 조직 문제 해결 결과 책임이 커지면 전략 워크숍 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 개인의 인식 변화와 행동 변화를 촉진하는 코칭 성격이 강합니다. 반면 교육 전달이나 집단 의사결정 조율 비중이 커지면 다른 퍼실리테이션 영역으로 해석될 수 있습니다."
    },
    {
      id: "strategic_workshop_facilitation",
      label: "전략 워크숍 퍼실리테이션",
      aliases: [
        "전략 워크숍 퍼실리테이터",
        "비즈니스 워크숍 진행",
        "문제 해결 워크숍",
        "strategy workshop facilitation",
        "business workshop facilitation"
      ],
      strongSignals: [
        "조직 문제 정의 및 구조화",
        "전략 도출 워크숍 설계",
        "결과물 기반 워크숍 진행",
        "비즈니스 의사결정 지원",
        "아이디어 수렴 및 정제",
        "실행 계획 도출",
        "워크숍 결과물 문서화"
      ],
      mediumSignals: [
        "디자인 씽킹 워크숍 진행",
        "문제 해결 프레임워크 활용",
        "팀 단위 협업 세션 설계",
        "비즈니스 캔버스 활용",
        "결과물 리뷰 및 정리"
      ],
      boundarySignals: [
        "개인 성장 개입 증가",
        "학습 전달 비중 증가",
        "집단 프로세스 중립성 강조 증가"
      ],
      adjacentFamilies: [
        "group_process_facilitation",
        "learning_facilitation",
        "coaching_oriented_facilitation"
      ],
      boundaryNote: "개인 성장 개입이 많아지면 코칭 중심 퍼실리테이션으로 이동하고, 학습 전달이 강조되면 학습 퍼실리테이션으로 이동합니다. 중립적 프로세스 조율에 집중하면 집단 퍼실리테이션으로 해석됩니다.",
      summaryTemplate: "이 직무는 조직의 문제 해결과 전략 도출을 위한 워크숍을 설계하고 실행하는 성격이 강합니다. 반면 개인 성장이나 학습 전달 비중이 커지면 다른 퍼실리테이션 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "workshop_facilitator",
      label: "워크숍 퍼실리테이터",
      aliases: ["워크숍 진행자", "workshop facilitator"],
      family: "group_process_facilitation",
      responsibilityHints: [
        "워크숍 아젠다 설계 및 진행",
        "참여자 토의 유도",
        "논의 흐름 조율"
      ],
      levelHints: [
        "단순 진행 보조에서 시작",
        "복잡한 이해관계 조율까지 확장"
      ]
    },
    {
      id: "learning_facilitator",
      label: "러닝 퍼실리테이터",
      aliases: ["교육 퍼실리테이터", "learning facilitator"],
      family: "learning_facilitation",
      responsibilityHints: [
        "학습 세션 설계 및 운영",
        "참여형 교육 진행",
        "학습자 피드백 제공"
      ],
      levelHints: [
        "단일 세션 운영에서 시작",
        "교육 프로그램 설계까지 확장"
      ]
    },
    {
      id: "group_coach_facilitator",
      label: "그룹 코칭 퍼실리테이터",
      aliases: ["코칭 퍼실리테이터", "group coach facilitator"],
      family: "coaching_oriented_facilitation",
      responsibilityHints: [
        "개인 성찰 유도 질문 설계",
        "그룹 코칭 세션 운영",
        "행동 변화 촉진"
      ],
      levelHints: [
        "기초 코칭 스킬 활용",
        "심층 코칭 개입까지 확장"
      ]
    },
    {
      id: "strategy_workshop_facilitator",
      label: "전략 워크숍 퍼실리테이터",
      aliases: ["전략 퍼실리테이터", "strategy workshop facilitator"],
      family: "strategic_workshop_facilitation",
      responsibilityHints: [
        "문제 해결 워크숍 설계",
        "전략 도출 세션 진행",
        "결과물 정리 및 실행 계획 도출"
      ],
      levelHints: [
        "단순 아이디어 워크숍 진행",
        "조직 전략 워크숍 설계 및 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "focus_target",
      label: "개입 대상 초점",
      values: ["집단 프로세스", "학습", "개인 성장", "조직 문제 해결"]
    },
    {
      axisId: "intervention_depth",
      label: "개입 깊이",
      values: ["중립적 진행", "구조 설계", "개인 개입", "결과 책임"]
    },
    {
      axisId: "output_type",
      label: "산출물 성격",
      values: ["합의", "학습 이해", "개인 변화", "전략/실행안"]
    }
  ],
  adjacentFamilies: [
    "교육 기획",
    "코칭",
    "조직개발",
    "컨설팅"
  ],
  boundaryHints: [
    "콘텐츠 전달 비중이 높아지면 교육 직무로 이동",
    "개인 행동 변화 개입이 깊어지면 코칭 직무로 이동",
    "조직 문제 해결 결과 책임이 커지면 컨설팅/조직개발로 이동",
    "중립적 진행 중심이면 퍼실리테이션으로 유지"
  ],
  summaryTemplate: "이 직무는 집단의 논의, 학습, 문제 해결을 효과적으로 이끌기 위해 구조와 흐름을 설계하고 개입하는 역할입니다. 어떤 대상에 초점을 두고 얼마나 깊게 개입하느냐에 따라 교육, 코칭, 전략 워크숍 등으로 경계가 나뉠 수 있습니다."
};
