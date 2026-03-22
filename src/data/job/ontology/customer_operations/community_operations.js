export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "COMMUNITY_OPERATIONS",
  aliases: [
    "커뮤니티 운영",
    "커뮤니티 매니저",
    "community manager",
    "community operations",
    "user community management",
    "유저 커뮤니티 운영",
    "포럼 운영",
    "카페 운영",
    "디스코드 운영",
    "커뮤니티 관리",
    "community lead",
    "커뮤니티 활성화"
  ],
  families: [
    {
      id: "ENGAGEMENT_OPERATION",
      label: "참여/활성화 중심형",
      aliases: [
        "community engagement",
        "growth community",
        "activation manager"
      ],
      strongSignals: [
        "커뮤니티 참여 이벤트 기획 및 운영",
        "유저 활동 유도 캠페인 실행",
        "게시글/댓글 활성화 관리",
        "유저 리텐션 개선 활동",
        "커뮤니티 온보딩 설계",
        "활성 유저 비율 관리",
        "커뮤니티 분위기 조성 및 유지"
      ],
      mediumSignals: [
        "콘텐츠 업로드 관리",
        "공지/이벤트 게시",
        "유저 피드백 수집",
        "커뮤니티 운영 지표 모니터링",
        "SNS 연계 운영"
      ],
      boundarySignals: [
        "콘텐츠 제작 비중이 커지면 콘텐츠 운영형으로 이동",
        "정책/제재 관리 비중이 커지면 모더레이션형으로 이동",
        "유저 문의 대응 비중이 커지면 고객지원 경계로 이동"
      ],
      adjacentFamilies: [
        "CONTENT_DRIVEN_OPERATION",
        "MODERATION_POLICY_OPERATION",
        "COMMUNITY_STRATEGY"
      ],
      boundaryNote: "유저 참여를 유도하고 커뮤니티 활성화를 만드는 활동이 중심이면 참여/활성화 중심형으로 읽힙니다. 반면 콘텐츠 제작이나 정책 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 커뮤니티 참여를 유도하고 활성화를 만드는 성격이 강합니다. 반면 콘텐츠 제작이나 정책 관리 비중이 커지면 다른 운영 역할로 해석될 수 있습니다."
    },
    {
      id: "CONTENT_DRIVEN_OPERATION",
      label: "콘텐츠 운영형",
      aliases: [
        "community content manager",
        "content-led community",
        "editorial community"
      ],
      strongSignals: [
        "커뮤니티 콘텐츠 기획 및 제작",
        "게시글/아티클 작성",
        "콘텐츠 큐레이션",
        "운영 콘텐츠 캘린더 관리",
        "유저 생성 콘텐츠(UGC) 관리",
        "콘텐츠 품질 기준 설정",
        "콘텐츠 중심 커뮤니티 성장"
      ],
      mediumSignals: [
        "콘텐츠 성과 분석",
        "카피라이팅",
        "콘텐츠 업로드 운영",
        "이미지/영상 제작 협업",
        "콘텐츠 가이드라인 관리"
      ],
      boundarySignals: [
        "유저 참여 유도 활동 비중이 커지면 참여/활성화 중심형으로 이동",
        "정책 위반 관리 비중이 커지면 모더레이션형으로 이동",
        "브랜드/마케팅 콘텐츠 비중이 커지면 마케팅 경계로 이동"
      ],
      adjacentFamilies: [
        "ENGAGEMENT_OPERATION",
        "MODERATION_POLICY_OPERATION",
        "COMMUNITY_STRATEGY"
      ],
      boundaryNote: "콘텐츠를 중심으로 커뮤니티를 운영하고 성장시키면 콘텐츠 운영형으로 읽힙니다. 반면 참여 유도나 정책 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 콘텐츠를 기반으로 커뮤니티를 운영하고 성장시키는 성격이 강합니다. 반면 참여 활성화나 정책 관리 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "MODERATION_POLICY_OPERATION",
      label: "모더레이션/정책형",
      aliases: [
        "community moderation",
        "policy enforcement",
        "trust and safety community"
      ],
      strongSignals: [
        "커뮤니티 가이드라인 수립 및 관리",
        "게시글/댓글 모니터링 및 제재",
        "신고 처리 및 정책 적용",
        "유해 콘텐츠 필터링",
        "운영 정책 개선",
        "커뮤니티 규칙 교육",
        "유저 분쟁 대응"
      ],
      mediumSignals: [
        "운영 로그 관리",
        "모니터링 툴 사용",
        "운영 매뉴얼 작성",
        "리스크 케이스 대응",
        "운영 리포트 작성"
      ],
      boundarySignals: [
        "유저 참여 유도 활동 비중이 커지면 참여/활성화 중심형으로 이동",
        "고객 문의 해결 중심이면 고객지원 경계로 이동",
        "플랫폼 정책 설계 비중이 커지면 trust & safety 정책 직무로 이동"
      ],
      adjacentFamilies: [
        "ENGAGEMENT_OPERATION",
        "CONTENT_DRIVEN_OPERATION",
        "COMMUNITY_STRATEGY"
      ],
      boundaryNote: "커뮤니티 질서를 유지하고 정책을 적용하는 역할이 중심이면 모더레이션/정책형으로 읽힙니다. 반면 활성화나 콘텐츠 운영 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 커뮤니티 규칙을 관리하고 질서를 유지하는 성격이 강합니다. 반면 참여 활성화나 콘텐츠 운영 비중이 커지면 다른 운영 역할로 해석될 수 있습니다."
    },
    {
      id: "COMMUNITY_STRATEGY",
      label: "커뮤니티 전략형",
      aliases: [
        "community strategy",
        "community lead",
        "community growth strategy"
      ],
      strongSignals: [
        "커뮤니티 운영 전략 수립",
        "지표 기반 커뮤니티 성장 설계",
        "운영 방향성 정의",
        "커뮤니티 구조 설계",
        "핵심 유저 그룹 관리",
        "커뮤니티 목표 설정",
        "운영 프로세스 설계"
      ],
      mediumSignals: [
        "운영 데이터 분석",
        "유저 세그먼트 정의",
        "협업 조직 커뮤니케이션",
        "운영 리포트 작성",
        "실험 기반 운영 개선"
      ],
      boundarySignals: [
        "실제 운영 실행 비중이 크면 참여/활성화 중심형으로 이동",
        "마케팅 캠페인 중심이면 마케팅 경계로 이동",
        "제품 개선 요구사항 정의 비중이 커지면 프로덕트 경계로 이동"
      ],
      adjacentFamilies: [
        "ENGAGEMENT_OPERATION",
        "CONTENT_DRIVEN_OPERATION",
        "MODERATION_POLICY_OPERATION"
      ],
      boundaryNote: "커뮤니티의 방향성과 구조를 설계하고 성장 전략을 수립하면 전략형으로 읽힙니다. 반면 실행 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 커뮤니티의 성장 방향과 운영 전략을 설계하는 성격이 강합니다. 반면 실행 운영 비중이 커지면 다른 운영 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "COMMUNITY_MANAGER",
      label: "커뮤니티 매니저",
      aliases: [
        "community manager"
      ],
      family: "ENGAGEMENT_OPERATION",
      responsibilityHints: [
        "유저 참여 유도",
        "이벤트 기획",
        "커뮤니티 활성화",
        "유저 커뮤니케이션"
      ],
      levelHints: [
        "주니어는 운영 실행 중심이고",
        "시니어는 커뮤니티 성장 설계 비중이 커집니다"
      ]
    },
    {
      id: "COMMUNITY_CONTENT_MANAGER",
      label: "커뮤니티 콘텐츠 매니저",
      aliases: [
        "community content manager"
      ],
      family: "CONTENT_DRIVEN_OPERATION",
      responsibilityHints: [
        "콘텐츠 기획",
        "게시글 작성",
        "콘텐츠 캘린더 관리",
        "UGC 관리"
      ],
      levelHints: [
        "주니어는 콘텐츠 제작 중심이고",
        "시니어는 콘텐츠 전략 설계 비중이 커집니다"
      ]
    },
    {
      id: "COMMUNITY_MODERATOR",
      label: "커뮤니티 모더레이터",
      aliases: [
        "community moderator"
      ],
      family: "MODERATION_POLICY_OPERATION",
      responsibilityHints: [
        "게시글 모니터링",
        "정책 적용",
        "신고 처리",
        "유저 제재"
      ],
      levelHints: [
        "주니어는 운영 대응 중심이고",
        "시니어는 정책 설계 및 개선 비중이 커집니다"
      ]
    },
    {
      id: "COMMUNITY_LEAD",
      label: "커뮤니티 리드",
      aliases: [
        "community lead"
      ],
      family: "COMMUNITY_STRATEGY",
      responsibilityHints: [
        "운영 전략 수립",
        "지표 관리",
        "커뮤니티 구조 설계",
        "팀 리딩"
      ],
      levelHints: [
        "초기에는 실행과 전략을 병행하고",
        "상위 레벨에서는 전략과 방향성 정의 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "OPERATION_FOCUS",
      label: "운영 중심",
      values: [
        "참여 활성화",
        "콘텐츠 중심",
        "정책/관리",
        "전략/설계"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "활성화된 커뮤니티 활동",
        "콘텐츠 및 게시물",
        "운영 정책 및 규칙",
        "성장 전략 및 구조"
      ]
    },
    {
      axisId: "USER_INTERACTION_STYLE",
      label: "유저 تعامل 방식",
      values: [
        "직접 소통 및 참여 유도",
        "콘텐츠 제공",
        "관리 및 제재",
        "간접적 구조 설계"
      ]
    },
    {
      axisId: "DECISION_SCOPE",
      label: "의사결정 범위",
      values: [
        "운영 실행",
        "콘텐츠 방향",
        "정책 적용",
        "전략 수립"
      ]
    }
  ],
  adjacentFamilies: [
    "고객지원",
    "마케팅",
    "콘텐츠기획",
    "프로덕트매니지먼트"
  ],
  boundaryHints: [
    "유저 참여 이벤트와 활성화 비중이 커지면 참여/활성화 중심형으로 읽힙니다.",
    "콘텐츠 제작과 운영 비중이 커지면 콘텐츠 운영형으로 이동합니다.",
    "규칙 관리와 제재 비중이 커지면 모더레이션/정책형으로 이동합니다.",
    "전략 수립과 구조 설계 비중이 커지면 커뮤니티 전략형으로 이동합니다.",
    "유저 문의 해결 중심이면 고객지원 직무로 해석될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 유저 커뮤니티를 운영하고 활성화하는 역할 성격이 강합니다. 참여 유도, 콘텐츠 운영, 정책 관리, 전략 설계 중 어디에 집중하느냐에 따라 역할이 나뉩니다. 반면 단순 고객 응대나 마케팅 캠페인 중심이면 인접 직무로 해석될 수 있습니다."
};
