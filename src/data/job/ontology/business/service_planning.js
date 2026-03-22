export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "SERVICE_PLANNING",
  aliases: [
    "서비스기획",
    "서비스 기획",
    "프로덕트 기획",
    "제품 기획",
    "플랫폼 기획",
    "서비스 PM",
    "product planning",
    "service planning",
    "product manager",
    "PM",
    "product owner",
    "PO"
  ],
  families: [
    {
      id: "FEATURE_PRODUCT_PLANNING",
      label: "기능·프로덕트 기획",
      aliases: [
        "프로덕트 기획",
        "기능 기획",
        "product planning",
        "feature planning"
      ],
      strongSignals: [
        "신규 기능 정의 및 요구사항 작성",
        "PRD 또는 기능 명세서 작성",
        "유저 스토리 및 시나리오 설계",
        "개발/디자인 협업 통한 기능 구현",
        "기능 단위 우선순위 설정",
        "서비스 기능 개선 과제 도출",
        "배포 후 기능 성과 모니터링"
      ],
      mediumSignals: [
        "유저 요구사항 수집",
        "기능별 KPI 정의",
        "QA 및 테스트 참여",
        "개발 일정 협의",
        "기능 단위 리포트 작성"
      ],
      boundarySignals: [
        "전체 서비스 구조나 UX 흐름 설계 비중이 커지면 UX/서비스 설계로 이동",
        "데이터 분석과 실험 설계 비중이 커지면 그로스/데이터 기반 기획으로 이동",
        "로드맵과 전략 방향 설정 비중이 커지면 프로덕트 전략으로 이동"
      ],
      adjacentFamilies: [
        "UX_SERVICE_DESIGN",
        "PRODUCT_STRATEGY_PLANNING",
        "GROWTH_DATA_DRIVEN_PLANNING"
      ],
      boundaryNote: "기능 단위 정의와 구현 관리가 중심이면 기능·프로덕트 기획으로 읽힙니다. 반면 전체 흐름 설계나 전략 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 서비스 내 기능을 정의하고 구현까지 연결하는 프로덕트 기획 성격이 강합니다. 반면 UX 구조 설계나 전략 수립 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "UX_SERVICE_DESIGN",
      label: "UX·서비스 설계",
      aliases: [
        "UX 기획",
        "서비스 설계",
        "서비스 구조 설계",
        "ux planning",
        "service design"
      ],
      strongSignals: [
        "서비스 플로우 및 사용자 여정 설계",
        "화면 구조 및 정보 구조 정의",
        "와이어프레임 작성",
        "사용자 경험 개선 과제 도출",
        "서비스 전체 흐름 설계",
        "유저 시나리오 기반 구조 설계",
        "UX 기준 정의"
      ],
      mediumSignals: [
        "디자인 협업",
        "사용자 피드백 반영",
        "서비스 사용성 개선",
        "A/B 테스트 아이디어 제안",
        "서비스 정책 정의"
      ],
      boundarySignals: [
        "구체 기능 정의와 개발 협업이 많아지면 기능·프로덕트 기획으로 이동",
        "데이터 기반 실험과 성과 개선이 중심이면 그로스 기획으로 이동",
        "브랜드 메시지나 콘텐츠 중심이면 마케팅/콘텐츠 기획으로 이동"
      ],
      adjacentFamilies: [
        "FEATURE_PRODUCT_PLANNING",
        "GROWTH_DATA_DRIVEN_PLANNING",
        "PRODUCT_STRATEGY_PLANNING"
      ],
      boundaryNote: "사용자 흐름과 경험 설계가 중심이면 UX·서비스 설계로 읽힙니다. 기능 구현이나 데이터 기반 실험 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 경험과 서비스 흐름을 설계하는 역할이 중심입니다. 반면 기능 구현이나 데이터 기반 성장 실험 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "GROWTH_DATA_DRIVEN_PLANNING",
      label: "그로스·데이터 기반 기획",
      aliases: [
        "그로스 기획",
        "데이터 기반 기획",
        "growth planning",
        "growth product",
        "data-driven planning"
      ],
      strongSignals: [
        "A/B 테스트 설계 및 실행",
        "전환율/리텐션 개선 과제 도출",
        "퍼널 분석 기반 개선",
        "지표 기반 기능 개선 반복",
        "실험 결과 분석 및 인사이트 도출",
        "사용자 행동 데이터 분석",
        "성장 KPI 관리"
      ],
      mediumSignals: [
        "데이터 대시보드 활용",
        "실험 우선순위 설정",
        "마케팅/제품 협업",
        "성과 리포트 작성",
        "지표 정의 지원"
      ],
      boundarySignals: [
        "기능 정의와 명세 작성이 많아지면 기능·프로덕트 기획으로 이동",
        "서비스 구조 설계 비중이 커지면 UX 설계로 이동",
        "사업 성장 전략이나 시장 확장 비중이 커지면 사업기획으로 이동"
      ],
      adjacentFamilies: [
        "FEATURE_PRODUCT_PLANNING",
        "UX_SERVICE_DESIGN",
        "PRODUCT_STRATEGY_PLANNING"
      ],
      boundaryNote: "데이터와 실험을 통해 성장을 만드는 역할이면 그로스 기획으로 읽힙니다. 기능 정의나 UX 설계 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 데이터와 실험을 기반으로 서비스 성장을 만드는 역할이 중심입니다. 반면 기능 정의나 UX 설계 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "PRODUCT_STRATEGY_PLANNING",
      label: "프로덕트 전략 기획",
      aliases: [
        "프로덕트 전략",
        "제품 전략",
        "product strategy",
        "roadmap planning"
      ],
      strongSignals: [
        "프로덕트 로드맵 수립",
        "중장기 서비스 방향 설정",
        "우선순위 기준 정의",
        "시장/경쟁 분석 기반 전략 수립",
        "제품 포지셔닝 정의",
        "핵심 기능 방향 결정",
        "비즈니스 목표와 제품 연결"
      ],
      mediumSignals: [
        "제품 성과 리뷰",
        "내부 이해관계자 조율",
        "신규 기능 방향성 제안",
        "데이터 기반 의사결정 지원",
        "전략 문서 작성"
      ],
      boundarySignals: [
        "구체 기능 정의와 실행 관리 비중이 커지면 기능 기획으로 이동",
        "사업 확장이나 매출 중심 의사결정이 많아지면 사업기획으로 이동",
        "순수 전략 수립만 하고 실행이 약하면 전략기획으로 이동"
      ],
      adjacentFamilies: [
        "FEATURE_PRODUCT_PLANNING",
        "GROWTH_DATA_DRIVEN_PLANNING",
        "UX_SERVICE_DESIGN"
      ],
      boundaryNote: "제품의 방향성과 우선순위를 정의하면 프로덕트 전략 기획으로 읽힙니다. 실행 중심 역할이 커지면 기능 기획이나 그로스 기획으로 이동합니다.",
      summaryTemplate: "이 직무는 서비스의 방향성과 로드맵을 설계하는 전략적 성격이 강합니다. 반면 기능 구현이나 실행 중심 역할이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PRODUCT_MANAGER",
      label: "프로덕트 매니저",
      aliases: [
        "PM",
        "product manager",
        "서비스 기획자"
      ],
      family: "FEATURE_PRODUCT_PLANNING",
      responsibilityHints: [
        "기능 정의 및 요구사항 작성",
        "개발/디자인 협업",
        "기능 우선순위 설정",
        "제품 개선"
      ],
      levelHints: [
        "주니어는 기능 정의 및 운영 중심",
        "시니어는 제품 방향성과 의사결정 비중이 큼"
      ]
    },
    {
      id: "UX_PLANNER",
      label: "UX 기획자",
      aliases: [
        "UX 기획",
        "서비스 설계자",
        "ux planner"
      ],
      family: "UX_SERVICE_DESIGN",
      responsibilityHints: [
        "서비스 구조 설계",
        "사용자 흐름 정의",
        "와이어프레임 작성",
        "UX 개선"
      ],
      levelHints: [
        "주니어는 화면 단위 설계",
        "시니어는 전체 서비스 구조 설계"
      ]
    },
    {
      id: "GROWTH_PM",
      label: "그로스 PM",
      aliases: [
        "growth PM",
        "growth manager",
        "그로스 기획자"
      ],
      family: "GROWTH_DATA_DRIVEN_PLANNING",
      responsibilityHints: [
        "A/B 테스트 설계",
        "퍼널 분석",
        "성장 지표 개선",
        "실험 기반 개선"
      ],
      levelHints: [
        "주니어는 실험 실행 중심",
        "시니어는 성장 전략 설계 중심"
      ]
    },
    {
      id: "PRODUCT_STRATEGIST",
      label: "프로덕트 전략 담당",
      aliases: [
        "product strategist",
        "제품 전략 담당"
      ],
      family: "PRODUCT_STRATEGY_PLANNING",
      responsibilityHints: [
        "로드맵 수립",
        "제품 방향 설정",
        "시장 분석",
        "우선순위 정의"
      ],
      levelHints: [
        "주니어는 분석 및 지원",
        "시니어는 전략 수립 및 의사결정 주도"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS",
      label: "주요 초점",
      values: [
        "기능 정의",
        "사용자 경험 설계",
        "데이터 기반 성장",
        "제품 방향성"
      ]
    },
    {
      axisId: "TIME_HORIZON",
      label: "시간 범위",
      values: [
        "단기 기능 실행",
        "중기 UX 개선",
        "지속적 성장 실험",
        "중장기 전략"
      ]
    },
    {
      axisId: "DECISION_STYLE",
      label: "의사결정 방식",
      values: [
        "요구사항 중심",
        "사용자 경험 중심",
        "데이터 중심",
        "전략/시장 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "사업기획",
    "전략기획",
    "마케팅",
    "데이터 분석",
    "디자인",
    "프로젝트관리(PM)"
  ],
  boundaryHints: [
    "기능 정의와 개발 협업이 많아지면 프로덕트 기획으로 읽힙니다.",
    "사용자 흐름과 화면 구조 설계가 중심이면 UX 설계로 이동합니다.",
    "데이터 분석과 실험 기반 개선이 많아지면 그로스 기획으로 이동합니다.",
    "제품 방향과 로드맵 설계 비중이 커지면 프로덕트 전략으로 이동합니다.",
    "사업 모델이나 매출 중심 의사결정이 많아지면 사업기획으로 이동합니다.",
    "브랜드 메시지나 캠페인 중심이면 마케팅으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 서비스와 제품을 설계하고 개선하는 역할로, 기능 기획, UX 설계, 데이터 기반 성장, 전략 기획으로 나뉘며 작동 방식이 달라집니다. 반면 사업 모델 설계나 마케팅 실행 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
