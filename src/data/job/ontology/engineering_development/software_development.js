export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "SOFTWARE_DEVELOPMENT",
  aliases: [
    "소프트웨어 개발",
    "개발자",
    "소프트웨어 엔지니어",
    "백엔드 개발자",
    "프론트엔드 개발자",
    "풀스택 개발자",
    "application developer",
    "software engineer",
    "backend developer",
    "frontend developer",
    "fullstack developer",
    "웹 개발",
    "앱 개발"
  ],
  families: [
    {
      id: "BACKEND_DEVELOPMENT",
      label: "백엔드 개발",
      aliases: [
        "백엔드",
        "backend",
        "server developer",
        "API 개발"
      ],
      strongSignals: [
        "서버 로직 및 API 설계와 구현",
        "데이터베이스 모델링 및 쿼리 최적화",
        "인증, 권한, 트랜잭션 처리 구현",
        "서비스 성능 개선 및 확장성 설계",
        "REST/GraphQL API 개발",
        "서버 장애 대응 및 로그 기반 문제 분석"
      ],
      mediumSignals: [
        "클라우드 환경(AWS, GCP 등) 활용",
        "CI/CD 파이프라인 연동",
        "캐싱 전략 적용",
        "마이크로서비스 구조 경험"
      ],
      boundarySignals: [
        "UI 구현과 사용자 인터페이스 비중이 커지면 프론트엔드로 이동",
        "인프라 구성, 배포 자동화 비중이 커지면 DevOps로 이동",
        "데이터 분석 및 모델링 중심이면 데이터 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "FRONTEND_DEVELOPMENT",
        "DEVOPS_ENGINEERING",
        "DATA_ENGINEERING"
      ],
      boundaryNote: "서버와 데이터 처리, API 설계가 핵심이면 백엔드 개발로 읽힙니다. 반면 UI 구현이나 인프라 관리 비중이 커지면 다른 개발 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 서버 로직과 데이터 처리, API를 중심으로 시스템을 구현하는 성격이 강합니다. 반면 UI 구현이나 인프라 운영 비중이 커지면 다른 개발 영역으로 읽힐 수 있습니다."
    },
    {
      id: "FRONTEND_DEVELOPMENT",
      label: "프론트엔드 개발",
      aliases: [
        "프론트엔드",
        "frontend",
        "web frontend",
        "UI 개발"
      ],
      strongSignals: [
        "웹 또는 앱 UI 구현 및 사용자 인터페이스 개발",
        "React, Vue 등 프레임워크 기반 화면 개발",
        "사용자 인터랙션 처리 및 상태 관리 구현",
        "디자인 시스템 적용 및 UI 컴포넌트 개발",
        "브라우저 렌더링 최적화",
        "사용자 경험(UX) 개선을 위한 코드 구현"
      ],
      mediumSignals: [
        "디자이너와 협업하여 화면 구현",
        "API 연동 및 데이터 표시",
        "반응형 UI 개발",
        "프론트 성능 개선"
      ],
      boundarySignals: [
        "서버 로직, 데이터 처리 비중이 커지면 백엔드로 이동",
        "모바일 앱 네이티브 개발 비중이 커지면 모바일 개발로 이동",
        "디자인 및 UX 기획 비중이 커지면 UX/UI 디자인으로 이동"
      ],
      adjacentFamilies: [
        "BACKEND_DEVELOPMENT",
        "MOBILE_DEVELOPMENT",
        "PRODUCT_DESIGN"
      ],
      boundaryNote: "사용자 인터페이스 구현과 UX 중심 개발이면 프론트엔드로 읽힙니다. 반면 서버 처리나 디자인 기획 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 인터페이스와 경험을 구현하는 프론트엔드 개발 성격이 강합니다. 반면 서버 로직이나 디자인 기획 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "FULLSTACK_DEVELOPMENT",
      label: "풀스택 개발",
      aliases: [
        "풀스택",
        "fullstack",
        "full stack developer"
      ],
      strongSignals: [
        "프론트엔드와 백엔드를 모두 구현",
        "서비스 전체 흐름을 이해하고 end-to-end 개발 수행",
        "간단한 인프라 설정 및 배포까지 담당",
        "API 설계부터 UI 구현까지 직접 수행",
        "소규모 팀에서 전반적인 개발 역할 수행"
      ],
      mediumSignals: [
        "다양한 기술 스택 활용",
        "기능 단위로 전체 개발 책임",
        "빠른 프로토타이핑 수행",
        "서비스 운영 지원"
      ],
      boundarySignals: [
        "특정 영역(백엔드/프론트)에 깊이 집중하면 해당 전문 영역으로 이동",
        "인프라, 배포 자동화 비중이 커지면 DevOps로 이동",
        "제품 기획 비중이 커지면 PM으로 이동"
      ],
      adjacentFamilies: [
        "BACKEND_DEVELOPMENT",
        "FRONTEND_DEVELOPMENT",
        "DEVOPS_ENGINEERING"
      ],
      boundaryNote: "서비스 전반을 모두 다루는 개발 역할이면 풀스택으로 읽힙니다. 반면 특정 영역에 깊이 집중하면 전문 개발 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 프론트엔드와 백엔드를 모두 다루며 서비스 전체를 구현하는 성격이 강합니다. 반면 특정 영역에 집중하면 전문 개발 역할로 읽힐 수 있습니다."
    },
    {
      id: "DEVOPS_ENGINEERING",
      label: "DevOps·인프라",
      aliases: [
        "DevOps",
        "인프라 엔지니어",
        "SRE",
        "site reliability engineer"
      ],
      strongSignals: [
        "CI/CD 파이프라인 구축 및 배포 자동화",
        "클라우드 인프라 설계 및 운영",
        "서비스 모니터링 및 장애 대응",
        "컨테이너(Docker, Kubernetes) 기반 운영",
        "시스템 안정성과 확장성 확보",
        "로그, 메트릭 기반 운영 개선"
      ],
      mediumSignals: [
        "인프라 비용 관리",
        "보안 설정 및 접근 제어",
        "운영 자동화 스크립트 작성",
        "개발팀과 협업하여 배포 환경 개선"
      ],
      boundarySignals: [
        "애플리케이션 기능 개발 비중이 커지면 백엔드/풀스택으로 이동",
        "데이터 파이프라인 구축 비중이 커지면 데이터 엔지니어링으로 이동",
        "운영보다는 개발 중심이면 소프트웨어 개발로 이동"
      ],
      adjacentFamilies: [
        "BACKEND_DEVELOPMENT",
        "FULLSTACK_DEVELOPMENT",
        "DATA_ENGINEERING"
      ],
      boundaryNote: "인프라 구축과 배포, 운영 안정성 확보가 중심이면 DevOps로 읽힙니다. 반면 기능 개발 비중이 커지면 일반 개발 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 서비스 인프라와 배포, 운영 안정성을 책임지는 DevOps 성격이 강합니다. 반면 기능 개발 비중이 커지면 다른 개발 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "BACKEND_ENGINEER",
      label: "백엔드 엔지니어",
      aliases: [
        "backend engineer",
        "서버 개발자"
      ],
      family: "BACKEND_DEVELOPMENT",
      responsibilityHints: [
        "API 및 서버 로직 개발",
        "데이터베이스 설계",
        "성능 최적화",
        "서비스 안정성 확보"
      ],
      levelHints: [
        "주니어는 기능 구현 중심",
        "시니어는 아키텍처 설계 및 성능 최적화"
      ]
    },
    {
      id: "FRONTEND_ENGINEER",
      label: "프론트엔드 엔지니어",
      aliases: [
        "frontend engineer",
        "UI 개발자"
      ],
      family: "FRONTEND_DEVELOPMENT",
      responsibilityHints: [
        "UI 구현",
        "사용자 인터랙션 개발",
        "프론트 성능 개선",
        "디자인 시스템 적용"
      ],
      levelHints: [
        "주니어는 화면 구현 중심",
        "시니어는 구조 설계 및 UX 개선"
      ]
    },
    {
      id: "FULLSTACK_ENGINEER",
      label: "풀스택 엔지니어",
      aliases: [
        "fullstack engineer"
      ],
      family: "FULLSTACK_DEVELOPMENT",
      responsibilityHints: [
        "전체 서비스 개발",
        "프론트/백엔드 통합 구현",
        "빠른 기능 개발",
        "서비스 운영 지원"
      ],
      levelHints: [
        "다양한 기술 경험 중요",
        "시니어는 서비스 전체 구조 설계"
      ]
    },
    {
      id: "DEVOPS_ENGINEER",
      label: "DevOps 엔지니어",
      aliases: [
        "devops engineer",
        "SRE"
      ],
      family: "DEVOPS_ENGINEERING",
      responsibilityHints: [
        "배포 자동화",
        "인프라 관리",
        "모니터링 및 장애 대응",
        "운영 환경 개선"
      ],
      levelHints: [
        "운영 경험 중요",
        "시니어는 시스템 안정성 전략 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "DEVELOPMENT_LAYER",
      label: "개발 레이어",
      values: [
        "서버/데이터 처리",
        "사용자 인터페이스",
        "전체 스택",
        "인프라/운영"
      ]
    },
    {
      axisId: "PRIMARY_OUTPUT",
      label: "주요 산출물",
      values: [
        "API 및 서버 기능",
        "UI/UX 화면",
        "통합 서비스 기능",
        "배포 및 운영 환경"
      ]
    },
    {
      axisId: "SYSTEM_SCOPE",
      label: "시스템 관여 범위",
      values: [
        "부분 시스템",
        "사용자 접점",
        "전체 서비스",
        "플랫폼/인프라"
      ]
    }
  ],
  adjacentFamilies: [
    "DATA_ENGINEERING",
    "PRODUCT_DESIGN",
    "PRODUCT_MANAGEMENT"
  ],
  boundaryHints: [
    "서버 로직과 데이터 처리 비중이 커지면 백엔드로 읽힙니다.",
    "UI 구현과 사용자 경험 비중이 커지면 프론트엔드로 이동합니다.",
    "전체 서비스 구현을 모두 담당하면 풀스택으로 해석됩니다.",
    "인프라 구축과 운영 안정성 비중이 커지면 DevOps로 이동합니다.",
    "데이터 파이프라인과 분석 중심이면 데이터 엔지니어링으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 소프트웨어를 설계하고 구현하는 개발 역할입니다. 다만 서버, UI, 전체 스택, 인프라 중 어디에 집중하느냐에 따라 실제 역할이 달라집니다. 반면 데이터나 제품 기획 중심으로 이동하면 인접 직무로 해석될 수 있습니다."
};
