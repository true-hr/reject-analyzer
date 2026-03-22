export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "FULLSTACK_DEVELOPMENT",
  aliases: [
    "풀스택 개발자",
    "풀스택 엔지니어",
    "Fullstack Developer",
    "Full Stack Engineer",
    "프론트엔드+백엔드 개발자",
    "웹 전반 개발자",
    "서비스 전반 개발자"
  ],
  families: [
    {
      id: "PRODUCT_ORIENTED_FULLSTACK",
      label: "제품지향 풀스택",
      aliases: [
        "제품 개발 풀스택",
        "서비스 중심 풀스택",
        "Product Fullstack",
        "서비스 풀스택 개발자"
      ],
      strongSignals: [
        "기능 기획 의도 이해 및 사용자 흐름 기반 구현",
        "프론트엔드와 백엔드를 모두 수정하며 기능 단위로 배포",
        "A/B 테스트, 사용자 행동 데이터 기반 개선 경험",
        "PM/디자이너와 협업하여 요구사항을 정의하거나 수정",
        "기능 출시 이후 지표 변화까지 책임지는 역할 수행"
      ],
      mediumSignals: [
        "React/Vue와 Node.js/Django 등 양쪽 스택 모두 실무 사용",
        "API 설계부터 UI 구현까지 단일 담당 경험",
        "서비스 단위 ownership 경험",
        "빠른 릴리즈 사이클 환경 경험"
      ],
      boundarySignals: [
        "프론트엔드 구현 비중이 압도적으로 높아지면 프론트엔드 전문으로 이동",
        "백엔드 아키텍처 설계 비중이 커지면 플랫폼/백엔드 중심으로 이동",
        "데이터 처리 및 파이프라인 비중이 커지면 데이터 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "PLATFORM_ORIENTED_FULLSTACK",
        "FRONTEND_HEAVY_FULLSTACK"
      ],
      boundaryNote: "사용자 기능 단위 책임과 제품 지표에 대한 관여가 핵심입니다. 시스템 구조 설계나 인프라 비중이 커지면 플랫폼 지향으로, UI 구현 비중이 압도되면 프론트엔드 중심으로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 기능 단위로 프론트와 백엔드를 함께 다루며 제품 개선에 직접 기여하는 성격이 강합니다. 반면 시스템 구조 설계나 특정 레이어 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PLATFORM_ORIENTED_FULLSTACK",
      label: "플랫폼지향 풀스택",
      aliases: [
        "플랫폼 풀스택",
        "인프라 포함 풀스택",
        "Platform Fullstack",
        "시스템 중심 풀스택"
      ],
      strongSignals: [
        "서비스 아키텍처 설계 및 API 구조 설계 주도",
        "배포 파이프라인, CI/CD, 인프라 구성까지 관여",
        "성능 최적화, 확장성, 트래픽 대응 설계 경험",
        "여러 서비스에서 공통으로 사용하는 백엔드 구조 설계",
        "모놀리식/마이크로서비스 전환 경험"
      ],
      mediumSignals: [
        "Docker, Kubernetes, 클라우드 환경 운영 경험",
        "백엔드 중심이지만 프론트 수정 및 연동 경험 보유",
        "로그/모니터링/알림 시스템 구축 경험",
        "대규모 트래픽 또는 멀티 서비스 환경 경험"
      ],
      boundarySignals: [
        "UI/사용자 경험 개선 비중이 커지면 제품지향으로 이동",
        "프론트엔드 기술 스택 깊이가 깊어지면 프론트엔드 중심으로 이동",
        "데이터 파이프라인 및 분석 중심으로 이동하면 데이터 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "PRODUCT_ORIENTED_FULLSTACK"
      ],
      boundaryNote: "시스템 안정성과 구조 설계 책임이 핵심입니다. 사용자 기능 단위 개선보다 인프라와 아키텍처 책임이 커질수록 이 family로 해석됩니다.",
      summaryTemplate: "이 직무는 프론트와 백엔드를 모두 다루되 시스템 구조와 인프라까지 책임지는 성격이 강합니다. 반면 사용자 기능 중심 개선 비중이 커지면 제품지향으로 읽힐 수 있습니다."
    },
    {
      id: "FRONTEND_HEAVY_FULLSTACK",
      label: "프론트엔드 중심 풀스택",
      aliases: [
        "프론트엔드 위주 풀스택",
        "Frontend Heavy Fullstack",
        "UI 중심 풀스택"
      ],
      strongSignals: [
        "React/Vue 기반 UI 구현 비중이 높고 상태관리 설계 경험",
        "디자인 시스템, 컴포넌트 구조 설계 주도",
        "백엔드는 API 연동 또는 간단한 서버 구현 수준",
        "UX 개선, 인터랙션 최적화 경험",
        "웹 성능 최적화(Lighthouse, 렌더링 최적화 등)"
      ],
      mediumSignals: [
        "Node.js 기반 간단한 API 서버 구현 경험",
        "프론트엔드 빌드/번들링 설정 경험",
        "디자이너와 협업 비중 높음",
        "SPA/SSR 구조 경험"
      ],
      boundarySignals: [
        "백엔드 로직 설계 및 데이터 모델링 비중이 커지면 제품지향으로 이동",
        "인프라 및 시스템 설계 비중이 커지면 플랫폼 지향으로 이동"
      ],
      adjacentFamilies: [
        "PRODUCT_ORIENTED_FULLSTACK"
      ],
      boundaryNote: "UI와 사용자 경험 구현이 중심입니다. 백엔드나 인프라 책임이 커질수록 풀스택 내 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 프론트엔드 구현과 사용자 경험 개선에 강하게 집중된 풀스택 성격입니다. 반면 백엔드 설계나 시스템 책임이 커지면 다른 경계로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "FULLSTACK_ENGINEER",
      label: "풀스택 엔지니어",
      aliases: [
        "Fullstack Engineer",
        "풀스택 개발자"
      ],
      family: "PRODUCT_ORIENTED_FULLSTACK",
      responsibilityHints: [
        "프론트엔드와 백엔드를 모두 구현하며 기능 단위 개발",
        "요구사항을 기능으로 변환하여 end-to-end로 구현",
        "서비스 개선 및 버그 수정까지 포함"
      ],
      levelHints: [
        "주니어: 기능 단위 구현 중심",
        "미드: 기능 설계 및 일부 구조 개선",
        "시니어: 서비스 단위 ownership 및 기술 선택 관여"
      ]
    },
    {
      id: "PLATFORM_FULLSTACK_ENGINEER",
      label: "플랫폼 풀스택 엔지니어",
      aliases: [
        "Platform Fullstack Engineer",
        "플랫폼 중심 풀스택"
      ],
      family: "PLATFORM_ORIENTED_FULLSTACK",
      responsibilityHints: [
        "서비스 아키텍처 및 API 구조 설계",
        "배포 및 인프라 구성까지 포함한 시스템 설계",
        "성능 및 확장성 개선"
      ],
      levelHints: [
        "미드: 특정 서비스 구조 설계 참여",
        "시니어: 전체 시스템 구조 및 기술 스택 결정"
      ]
    },
    {
      id: "FRONTEND_FOCUSED_FULLSTACK",
      label: "프론트 중심 풀스택",
      aliases: [
        "Frontend-focused Fullstack",
        "프론트엔드 중심 풀스택 개발자"
      ],
      family: "FRONTEND_HEAVY_FULLSTACK",
      responsibilityHints: [
        "UI/UX 구현과 상태관리 구조 설계",
        "API 연동 및 프론트 중심 기능 개발",
        "웹 성능 최적화"
      ],
      levelHints: [
        "주니어: UI 구현 중심",
        "미드: 컴포넌트 구조 및 상태관리 설계",
        "시니어: 프론트 아키텍처 및 디자인 시스템 주도"
      ]
    }
  ],
  axes: [
    {
      axisId: "RESPONSIBILITY_FOCUS",
      label: "책임 중심",
      values: [
        "사용자 기능 구현 중심",
        "시스템/아키텍처 중심",
        "UI/UX 중심"
      ]
    },
    {
      axisId: "STACK_BALANCE",
      label: "스택 균형",
      values: [
        "프론트/백 균형",
        "프론트 편중",
        "백엔드/인프라 편중"
      ]
    },
    {
      axisId: "OWNERSHIP_SCOPE",
      label: "책임 범위",
      values: [
        "기능 단위",
        "서비스 단위",
        "플랫폼/시스템 단위"
      ]
    }
  ],
  adjacentFamilies: [
    "FRONTEND_DEVELOPMENT",
    "BACKEND_DEVELOPMENT",
    "DATA_ENGINEERING"
  ],
  boundaryHints: [
    "프론트엔드 기술 깊이와 UI 구현 비중이 높아지면 프론트엔드 개발로 읽힐 수 있습니다",
    "백엔드 로직과 데이터 모델링, API 설계 비중이 커지면 백엔드 개발로 이동합니다",
    "인프라, 배포, 시스템 설계 책임이 커지면 플랫폼/백엔드 엔지니어링으로 해석됩니다",
    "데이터 파이프라인, ETL, 분석 처리 비중이 높아지면 데이터 엔지니어링으로 이동합니다"
  ],
  summaryTemplate: "이 직무는 프론트엔드와 백엔드를 모두 다루며 기능 단위부터 시스템 단위까지 유연하게 관여하는 성격이 강합니다. 다만 특정 레이어나 책임 비중이 커질수록 전문 직무 경계로 이동할 수 있습니다."
};