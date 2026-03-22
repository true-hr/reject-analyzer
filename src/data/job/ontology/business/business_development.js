export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "BUSINESS_DEVELOPMENT",
  aliases: [
    "사업개발",
    "신사업",
    "신사업 개발",
    "사업 개발",
    "BD",
    "biz dev",
    "business development",
    "new business",
    "partnership manager",
    "alliance manager"
  ],
  families: [
    {
      id: "PARTNERSHIP_DEVELOPMENT",
      label: "제휴·파트너십 개발",
      aliases: [
        "제휴",
        "파트너십",
        "alliance",
        "partnership",
        "partnership manager"
      ],
      strongSignals: [
        "외부 파트너 발굴 및 제휴 기회 탐색",
        "제휴 조건 협상 및 계약 체결",
        "파트너사와 협업 모델 설계",
        "제휴 기반 매출 또는 사용자 확보",
        "제휴 성과 관리 및 리포트",
        "협업 프로젝트 기획 및 실행",
        "외부 이해관계자 커뮤니케이션 주도"
      ],
      mediumSignals: [
        "시장 내 잠재 파트너 조사",
        "제휴 제안서 작성",
        "계약 조건 검토",
        "파트너 관계 유지 관리",
        "공동 프로모션 기획"
      ],
      boundarySignals: [
        "자사 서비스/제품 기획 비중이 커지면 서비스기획으로 이동",
        "사업 구조 설계나 전략 수립 비중이 커지면 사업기획으로 이동",
        "영업 KPI 달성과 거래 성사 중심이면 영업으로 이동"
      ],
      adjacentFamilies: [
        "NEW_BUSINESS_INCUBATION",
        "COMMERCIAL_DEAL_DRIVEN_BD",
        "STRATEGIC_BD"
      ],
      boundaryNote: "외부 파트너 발굴과 협상, 계약 체결이 중심이면 제휴 개발로 읽힙니다. 내부 기획이나 단순 영업으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 외부 파트너와의 협업을 통해 사업 기회를 만드는 제휴 중심 역할이 강합니다. 반면 내부 서비스 기획이나 단순 영업 성과 중심으로 이동하면 다른 직무로 해석될 수 있습니다."
    },
    {
      id: "NEW_BUSINESS_INCUBATION",
      label: "신사업 발굴·인큐베이션",
      aliases: [
        "신사업 기획",
        "신사업 개발",
        "new business incubation",
        "venture building"
      ],
      strongSignals: [
        "신규 사업 아이디어 발굴 및 검증",
        "시장 조사 및 사업 타당성 분석",
        "비즈니스 모델 설계",
        "파일럿 프로젝트 실행",
        "초기 KPI 설정 및 검증",
        "사업 런칭 준비 및 실행",
        "신사업 로드맵 수립"
      ],
      mediumSignals: [
        "시장/경쟁 분석",
        "고객 인터뷰 및 니즈 검증",
        "내부 조직 설득 및 정렬",
        "사업 계획서 작성",
        "초기 운영 구조 설계"
      ],
      boundarySignals: [
        "제휴나 외부 계약 중심이면 파트너십 BD로 이동",
        "기존 사업 운영 개선 중심이면 사업기획으로 이동",
        "제품 기능 정의 비중이 커지면 서비스기획으로 이동"
      ],
      adjacentFamilies: [
        "PARTNERSHIP_DEVELOPMENT",
        "STRATEGIC_BD",
        "COMMERCIAL_DEAL_DRIVEN_BD"
      ],
      boundaryNote: "새로운 사업을 발굴하고 초기 실행까지 리딩하면 신사업 인큐베이션으로 읽힙니다. 외부 제휴나 기존 사업 개선 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 새로운 사업 기회를 발굴하고 초기 실행까지 연결하는 역할이 중심입니다. 반면 제휴 중심이나 기존 사업 운영 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "COMMERCIAL_DEAL_DRIVEN_BD",
      label: "거래·매출 중심 BD",
      aliases: [
        "커머셜 BD",
        "deal driven BD",
        "sales driven BD"
      ],
      strongSignals: [
        "거래 성사 및 매출 창출 중심 활동",
        "고객사 발굴 및 계약 체결",
        "가격 및 조건 협상",
        "매출 목표 기반 활동",
        "계약 파이프라인 관리",
        "리드 발굴 및 전환",
        "영업 유사 KPI 관리"
      ],
      mediumSignals: [
        "고객 미팅 및 제안",
        "견적 작성",
        "영업 자료 작성",
        "계약 관리",
        "매출 리포트 작성"
      ],
      boundarySignals: [
        "장기 파트너십 구조 설계가 많아지면 파트너십 BD로 이동",
        "제품/서비스 구조 설계가 많아지면 서비스기획으로 이동",
        "단순 반복 영업이면 영업 직무로 이동"
      ],
      adjacentFamilies: [
        "PARTNERSHIP_DEVELOPMENT",
        "NEW_BUSINESS_INCUBATION",
        "STRATEGIC_BD"
      ],
      boundaryNote: "매출과 거래 성사 중심으로 움직이면 거래 중심 BD로 읽힙니다. 장기 파트너십이나 사업 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 계약과 매출을 만들어내는 거래 중심 역할이 강합니다. 반면 장기 파트너십 설계나 사업 구조 기획 비중이 커지면 다른 직무로 해석될 수 있습니다."
    },
    {
      id: "STRATEGIC_BD",
      label: "전략 연계 BD",
      aliases: [
        "전략 BD",
        "strategic BD"
      ],
      strongSignals: [
        "전사 전략과 연계된 사업 기회 발굴",
        "신규 시장 진입 전략 수립",
        "M&A 또는 투자 검토 참여",
        "핵심 파트너십 방향 설계",
        "사업 포트폴리오 확장 기획",
        "경영진 보고 및 의사결정 지원",
        "중장기 성장 기회 정의"
      ],
      mediumSignals: [
        "시장 분석 및 인사이트 도출",
        "전략 문서 작성",
        "내부 이해관계자 조율",
        "사업 기회 평가",
        "리스크 분석"
      ],
      boundarySignals: [
        "실제 계약 및 제휴 실행 중심이면 파트너십 BD로 이동",
        "사업 실행과 운영까지 깊게 관여하면 사업기획으로 이동",
        "전략 수립만 수행하면 전략기획으로 이동"
      ],
      adjacentFamilies: [
        "NEW_BUSINESS_INCUBATION",
        "PARTNERSHIP_DEVELOPMENT",
        "COMMERCIAL_DEAL_DRIVEN_BD"
      ],
      boundaryNote: "전사 전략과 연결된 사업 기회를 설계하면 전략 BD로 읽힙니다. 실행 중심이나 계약 중심으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 전략과 연결된 사업 기회를 발굴하고 방향을 설계하는 역할이 중심입니다. 반면 실행이나 계약 중심으로 이동하면 다른 직무로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PARTNERSHIP_MANAGER",
      label: "파트너십 매니저",
      aliases: [
        "partnership manager",
        "alliance manager"
      ],
      family: "PARTNERSHIP_DEVELOPMENT",
      responsibilityHints: [
        "파트너 발굴 및 협상",
        "제휴 계약 체결",
        "협업 모델 설계",
        "파트너 관계 관리"
      ],
      levelHints: [
        "주니어는 실행 및 지원 중심",
        "시니어는 협상 및 구조 설계 중심"
      ]
    },
    {
      id: "NEW_BUSINESS_MANAGER",
      label: "신사업 담당",
      aliases: [
        "new business manager",
        "venture builder"
      ],
      family: "NEW_BUSINESS_INCUBATION",
      responsibilityHints: [
        "사업 아이디어 발굴",
        "시장 검증",
        "사업 모델 설계",
        "초기 실행 리딩"
      ],
      levelHints: [
        "주니어는 조사 및 실행 지원",
        "시니어는 사업 설계 및 런칭 리딩"
      ]
    },
    {
      id: "BD_MANAGER",
      label: "BD 매니저",
      aliases: [
        "business development manager",
        "BD manager"
      ],
      family: "COMMERCIAL_DEAL_DRIVEN_BD",
      responsibilityHints: [
        "고객 발굴",
        "계약 체결",
        "매출 관리",
        "파이프라인 관리"
      ],
      levelHints: [
        "주니어는 리드 발굴 중심",
        "시니어는 거래 구조 설계 및 성과 책임"
      ]
    },
    {
      id: "STRATEGIC_BD_MANAGER",
      label: "전략 BD 담당",
      aliases: [
        "strategic BD manager"
      ],
      family: "STRATEGIC_BD",
      responsibilityHints: [
        "사업 기회 발굴",
        "시장 진입 전략 수립",
        "경영진 보고",
        "투자/제휴 방향 설계"
      ],
      levelHints: [
        "주니어는 분석 및 자료 작성",
        "시니어는 전략 설계 및 의사결정 지원"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS",
      label: "주요 초점",
      values: [
        "파트너십",
        "신사업 발굴",
        "거래/매출",
        "전략 기회"
      ]
    },
    {
      axisId: "EXECUTION_TYPE",
      label: "실행 유형",
      values: [
        "협상 및 계약",
        "사업 설계 및 검증",
        "매출 창출",
        "전략 설계"
      ]
    },
    {
      axisId: "TIME_HORIZON",
      label: "시간 범위",
      values: [
        "단기 거래",
        "중기 사업 검증",
        "지속적 파트너십",
        "중장기 전략"
      ]
    }
  ],
  adjacentFamilies: [
    "사업기획",
    "전략기획",
    "영업",
    "서비스기획",
    "마케팅"
  ],
  boundaryHints: [
    "외부 파트너 발굴과 계약 체결이 많아지면 파트너십 BD로 읽힙니다.",
    "신규 사업 아이디어 발굴과 검증이 중심이면 신사업 인큐베이션으로 이동합니다.",
    "매출 목표와 거래 성사 중심이면 거래형 BD로 이동합니다.",
    "전사 전략과 연계된 기회 설계가 많아지면 전략 BD로 이동합니다.",
    "제품 기능 정의나 서비스 설계가 많아지면 서비스기획으로 이동합니다.",
    "단순 거래 반복과 KPI 달성 중심이면 영업으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 새로운 사업 기회를 만들고 확장하는 역할로, 제휴, 신사업 발굴, 거래 중심, 전략 기회 설계 등으로 나뉘며 작동 방식이 달라집니다. 반면 제품 기획이나 단순 영업 성격이 강해지면 인접 직무로 경계가 이동할 수 있습니다."
};
