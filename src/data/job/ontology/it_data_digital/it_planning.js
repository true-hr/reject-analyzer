export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "IT_PLANNING",
  aliases: [
    "IT 기획",
    "서비스 기획",
    "웹 기획",
    "앱 기획",
    "프로덕트 기획",
    "IT 서비스 기획자",
    "product planner",
    "service planner",
    "IT planner",
    "디지털 서비스 기획"
  ],
  families: [
    {
      id: "SERVICE_PLANNING",
      label: "서비스 기획",
      aliases: [
        "서비스 기획",
        "웹서비스 기획",
        "앱 서비스 기획"
      ],
      strongSignals: [
        "신규 서비스 기능 정의 및 요구사항 도출",
        "화면 흐름(IA, user flow) 설계",
        "기획서, 스토리보드, 기능 명세 작성",
        "개발/디자인 협업을 위한 요구사항 정리",
        "사용자 시나리오 기반 기능 설계",
        "서비스 정책 및 로직 정의"
      ],
      mediumSignals: [
        "기능 우선순위 설정",
        "QA 및 릴리즈 검수",
        "서비스 개선안 도출",
        "기본적인 데이터 확인"
      ],
      boundarySignals: [
        "지표 분석 및 데이터 기반 의사결정 비중이 커지면 프로덕트 매니지먼트로 이동",
        "UI/UX 설계 및 디자인 비중이 커지면 UX/UI 디자인으로 이동",
        "기술 구현 및 아키텍처 이해 비중이 커지면 IT 아키텍처 기획으로 이동"
      ],
      adjacentFamilies: [
        "PRODUCT_MANAGEMENT",
        "UX_UI_DESIGN",
        "IT_ARCHITECTURE_PLANNING"
      ],
      boundaryNote: "기능 정의와 화면 흐름 설계 중심이면 서비스 기획으로 읽힙니다. 반면 데이터 기반 의사결정이나 제품 전략 비중이 커지면 PM 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 기능과 화면 흐름을 정의하는 서비스 기획 성격이 강합니다. 반면 데이터 기반 의사결정이나 제품 전략 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "PRODUCT_MANAGEMENT",
      label: "프로덕트 매니지먼트",
      aliases: [
        "PM",
        "프로덕트 매니저",
        "product manager"
      ],
      strongSignals: [
        "제품 방향성과 로드맵 수립",
        "핵심 지표(KPI) 기반 의사결정",
        "사용자 행동 데이터 분석 및 개선 방향 도출",
        "비즈니스 목표와 기능 우선순위 정렬",
        "A/B 테스트 및 실험 설계",
        "제품 성장 전략 수립"
      ],
      mediumSignals: [
        "기능 기획 참여",
        "이해관계자 커뮤니케이션",
        "성과 리포트 작성",
        "시장 및 사용자 조사"
      ],
      boundarySignals: [
        "기능 정의 및 화면 설계 비중이 커지면 서비스 기획으로 이동",
        "프로젝트 일정 관리 중심이면 프로젝트 매니지먼트로 이동",
        "마케팅 전략 비중이 커지면 그로스/마케팅으로 이동"
      ],
      adjacentFamilies: [
        "SERVICE_PLANNING",
        "PROJECT_MANAGEMENT",
        "GROWTH_MARKETING"
      ],
      boundaryNote: "지표 기반으로 제품 방향과 우선순위를 결정하면 프로덕트 매니지먼트로 읽힙니다. 반면 기능 정의 중심이면 서비스 기획으로 이동합니다.",
      summaryTemplate: "이 직무는 데이터와 지표를 기반으로 제품 방향을 결정하는 프로덕트 매니지먼트 성격이 강합니다. 반면 기능 정의 중심이면 서비스 기획으로 해석될 수 있습니다."
    },
    {
      id: "PROJECT_MANAGEMENT",
      label: "프로젝트 관리",
      aliases: [
        "PMO",
        "프로젝트 매니저",
        "project manager"
      ],
      strongSignals: [
        "IT 프로젝트 일정 및 리소스 관리",
        "요구사항 정리 및 이해관계자 조율",
        "개발 진행 상황 추적 및 이슈 관리",
        "프로젝트 범위 및 일정 계획 수립",
        "외주 및 협력사 관리",
        "프로젝트 산출물 관리"
      ],
      mediumSignals: [
        "회의 운영 및 커뮤니케이션",
        "진행 리포트 작성",
        "리스크 관리",
        "품질 일정 조율"
      ],
      boundarySignals: [
        "기능 정의 및 서비스 설계 비중이 커지면 서비스 기획으로 이동",
        "제품 전략 및 지표 관리 비중이 커지면 PM으로 이동",
        "기술 설계 비중이 커지면 IT 아키텍처 기획으로 이동"
      ],
      adjacentFamilies: [
        "SERVICE_PLANNING",
        "PRODUCT_MANAGEMENT",
        "IT_ARCHITECTURE_PLANNING"
      ],
      boundaryNote: "프로젝트 일정과 실행 관리가 중심이면 프로젝트 관리로 읽힙니다. 반면 제품 방향이나 기능 설계 중심이면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 IT 프로젝트의 일정과 실행을 관리하는 성격이 강합니다. 반면 제품 방향이나 기능 설계 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "IT_ARCHITECTURE_PLANNING",
      label: "IT 구조·아키텍처 기획",
      aliases: [
        "IT 아키텍처",
        "시스템 기획",
        "solution architect",
        "technical planner"
      ],
      strongSignals: [
        "시스템 구조 및 아키텍처 설계",
        "서비스 기술 스택 및 구조 정의",
        "데이터 흐름 및 시스템 간 연계 설계",
        "기술 요구사항 정의",
        "확장성과 안정성을 고려한 구조 설계",
        "기술 검토 및 솔루션 선정"
      ],
      mediumSignals: [
        "개발팀과 기술 논의",
        "시스템 문서 작성",
        "기술 표준 정의",
        "기술 리스크 검토"
      ],
      boundarySignals: [
        "기능 정의 및 사용자 흐름 설계 비중이 커지면 서비스 기획으로 이동",
        "인프라 구축 및 운영 비중이 커지면 DevOps로 이동",
        "개발 구현 비중이 커지면 소프트웨어 개발로 이동"
      ],
      adjacentFamilies: [
        "SERVICE_PLANNING",
        "DEVOPS_ENGINEERING",
        "SOFTWARE_DEVELOPMENT"
      ],
      boundaryNote: "시스템 구조와 기술 설계를 중심으로 역할을 수행하면 IT 아키텍처 기획으로 읽힙니다. 반면 기능 정의나 구현 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 시스템 구조와 기술 흐름을 설계하는 아키텍처 기획 성격이 강합니다. 반면 기능 정의나 구현 비중이 커지면 다른 IT 직무로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "SERVICE_PLANNER",
      label: "서비스 기획자",
      aliases: [
        "웹 기획자",
        "앱 기획자"
      ],
      family: "SERVICE_PLANNING",
      responsibilityHints: [
        "기능 정의 및 요구사항 작성",
        "화면 설계",
        "사용자 시나리오 설계",
        "개발 협업"
      ],
      levelHints: [
        "주니어는 기능 단위 기획",
        "시니어는 서비스 구조 설계"
      ]
    },
    {
      id: "PRODUCT_MANAGER",
      label: "프로덕트 매니저",
      aliases: [
        "PM"
      ],
      family: "PRODUCT_MANAGEMENT",
      responsibilityHints: [
        "제품 로드맵 수립",
        "지표 기반 의사결정",
        "우선순위 설정",
        "성과 관리"
      ],
      levelHints: [
        "데이터 해석 능력 중요",
        "시니어는 제품 전략 리딩"
      ]
    },
    {
      id: "PROJECT_MANAGER",
      label: "프로젝트 매니저",
      aliases: [
        "PMO"
      ],
      family: "PROJECT_MANAGEMENT",
      responsibilityHints: [
        "일정 및 리소스 관리",
        "이슈 조율",
        "프로젝트 실행 관리",
        "이해관계자 커뮤니케이션"
      ],
      levelHints: [
        "운영 및 조율 능력 중요",
        "시니어는 복잡한 프로젝트 리딩"
      ]
    },
    {
      id: "IT_ARCHITECT",
      label: "IT 아키텍트",
      aliases: [
        "solution architect"
      ],
      family: "IT_ARCHITECTURE_PLANNING",
      responsibilityHints: [
        "시스템 구조 설계",
        "기술 요구사항 정의",
        "데이터 흐름 설계",
        "기술 검토"
      ],
      levelHints: [
        "기술 이해도 중요",
        "시니어는 전체 시스템 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "DECISION_FOCUS",
      label: "의사결정 기준",
      values: [
        "기능 정의",
        "지표 및 성과",
        "일정 및 실행",
        "기술 구조"
      ]
    },
    {
      axisId: "PRIMARY_OUTPUT",
      label: "주요 산출물",
      values: [
        "기획서 및 화면 설계",
        "제품 로드맵 및 KPI",
        "프로젝트 일정 및 리포트",
        "시스템 아키텍처 문서"
      ]
    },
    {
      axisId: "ROLE_SCOPE",
      label: "역할 범위",
      values: [
        "기능 단위",
        "제품 단위",
        "프로젝트 단위",
        "시스템 단위"
      ]
    }
  ],
  adjacentFamilies: [
    "UX_UI_DESIGN",
    "SOFTWARE_DEVELOPMENT",
    "GROWTH_MARKETING"
  ],
  boundaryHints: [
    "기능 정의와 화면 설계 비중이 크면 서비스 기획으로 읽힙니다.",
    "지표 기반 의사결정과 제품 방향 설정 비중이 커지면 PM으로 이동합니다.",
    "일정과 실행 관리 비중이 커지면 프로젝트 관리로 해석됩니다.",
    "시스템 구조와 기술 설계 비중이 커지면 IT 아키텍처 기획으로 이동합니다.",
    "사용자 경험 설계 비중이 커지면 UX/UI 영역으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 IT 서비스나 제품을 기획하는 역할로, 기능 정의부터 제품 전략, 프로젝트 관리, 시스템 설계까지 다양한 형태로 나뉩니다. 무엇을 중심으로 의사결정하느냐에 따라 역할이 달라지며, 개발이나 디자인 비중이 커지면 인접 직무로 해석될 수 있습니다."
};