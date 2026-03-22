export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "FRONTEND_DEVELOPMENT",
  aliases: [
    "프론트엔드 개발",
    "프론트엔드 개발자",
    "FE 개발자",
    "웹 프론트엔드",
    "frontend developer",
    "frontend engineer",
    "UI 개발자",
    "웹 UI 개발",
    "react 개발자",
    "vue 개발자"
  ],
  families: [
    {
      id: "UI_IMPLEMENTATION",
      label: "UI 구현 중심",
      aliases: [
        "UI 개발",
        "화면 구현",
        "마크업 개발",
        "퍼블리싱 개발"
      ],
      strongSignals: [
        "디자인 시안을 기반으로 HTML/CSS/JS로 화면 구현",
        "React/Vue 등으로 UI 컴포넌트 제작",
        "반응형 웹 및 크로스브라우징 대응",
        "디자인 시스템 기반 컴포넌트 개발",
        "CSS 스타일링 및 레이아웃 구현"
      ],
      mediumSignals: [
        "디자이너와 협업하여 UI 디테일 조정",
        "기존 UI 코드 리팩토링",
        "간단한 상태 관리 구현",
        "UI 테스트 및 수정"
      ],
      boundarySignals: [
        "복잡한 상태 관리 및 데이터 흐름 설계 비중이 커지면 애플리케이션 로직 중심으로 이동",
        "사용자 경험 설계 및 UX 기획 비중이 커지면 UX/UI 디자인으로 이동",
        "서버 API 설계 및 데이터 처리 비중이 커지면 백엔드로 이동"
      ],
      adjacentFamilies: [
        "FRONTEND_APPLICATION",
        "UX_UI_DESIGN",
        "BACKEND_DEVELOPMENT"
      ],
      boundaryNote: "디자인을 실제 화면으로 구현하는 역할이 중심이면 UI 구현 중심으로 읽힙니다. 반면 상태 관리나 데이터 흐름 설계 비중이 커지면 애플리케이션 개발로 이동합니다.",
      summaryTemplate: "이 직무는 디자인 시안을 기반으로 사용자 화면을 구현하는 UI 개발 성격이 강합니다. 반면 데이터 흐름이나 상태 관리 비중이 커지면 다른 프론트엔드 영역으로 해석될 수 있습니다."
    },
    {
      id: "FRONTEND_APPLICATION",
      label: "애플리케이션 로직 중심",
      aliases: [
        "프론트엔드 로직 개발",
        "SPA 개발",
        "웹 애플리케이션 개발"
      ],
      strongSignals: [
        "상태 관리(Redux, Zustand 등) 설계 및 구현",
        "컴포넌트 간 데이터 흐름 설계",
        "API 연동 및 비동기 처리 로직 구현",
        "프론트엔드 아키텍처 설계",
        "대규모 SPA 구조 설계 및 유지보수",
        "에러 처리 및 상태 동기화 구현"
      ],
      mediumSignals: [
        "UI 컴포넌트 구조 설계",
        "프론트 성능 최적화",
        "코드 분할 및 번들 최적화",
        "테스트 코드 작성"
      ],
      boundarySignals: [
        "단순 UI 구현 비중이 커지면 UI 구현 중심으로 이동",
        "서버 사이드 로직 및 데이터 처리 비중이 커지면 백엔드로 이동",
        "인프라 및 배포 자동화 비중이 커지면 DevOps로 이동"
      ],
      adjacentFamilies: [
        "UI_IMPLEMENTATION",
        "BACKEND_DEVELOPMENT",
        "DEVOPS_ENGINEERING"
      ],
      boundaryNote: "프론트엔드에서 상태 관리와 데이터 흐름 설계가 핵심이면 애플리케이션 로직 중심으로 읽힙니다. 반면 단순 UI 구현 비중이 크면 UI 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 프론트엔드에서 데이터 흐름과 상태를 설계하는 애플리케이션 개발 성격이 강합니다. 반면 단순 화면 구현 비중이 커지면 UI 중심 역할로 해석될 수 있습니다."
    },
    {
      id: "FRONTEND_PERFORMANCE",
      label: "성능·최적화 중심",
      aliases: [
        "프론트엔드 성능",
        "웹 성능 최적화",
        "frontend performance"
      ],
      strongSignals: [
        "웹 성능 측정 및 개선(Lighthouse, Web Vitals)",
        "번들 사이즈 최적화 및 코드 스플리팅",
        "렌더링 최적화 및 메모리 관리",
        "네트워크 요청 최적화",
        "SSR/CSR 전략 설계",
        "로딩 속도 개선 및 UX 최적화"
      ],
      mediumSignals: [
        "프론트 성능 모니터링",
        "캐싱 전략 적용",
        "이미지 및 리소스 최적화",
        "성능 관련 코드 리팩토링"
      ],
      boundarySignals: [
        "일반 기능 개발 비중이 커지면 애플리케이션 로직으로 이동",
        "인프라 및 CDN 설정 비중이 커지면 DevOps로 이동",
        "UX 설계 중심이면 UX/UI로 이동"
      ],
      adjacentFamilies: [
        "FRONTEND_APPLICATION",
        "DEVOPS_ENGINEERING",
        "UX_UI_DESIGN"
      ],
      boundaryNote: "프론트엔드 성능 개선과 최적화가 핵심이면 성능 중심으로 읽힙니다. 반면 기능 구현 비중이 커지면 일반 개발 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 웹 성능 개선과 최적화에 집중하는 프론트엔드 역할입니다. 반면 기능 구현 비중이 커지면 일반 프론트엔드 개발로 해석될 수 있습니다."
    },
    {
      id: "FRONTEND_PLATFORM",
      label: "프론트엔드 플랫폼·공통화",
      aliases: [
        "프론트엔드 플랫폼",
        "프론트엔드 인프라",
        "frontend platform"
      ],
      strongSignals: [
        "디자인 시스템 및 공통 컴포넌트 라이브러리 구축",
        "프론트엔드 개발 환경 및 빌드 시스템 구성",
        "공통 UI/로직 모듈화 및 표준화",
        "모노레포 및 코드 구조 설계",
        "개발 생산성 향상을 위한 툴링 구축",
        "프론트엔드 아키텍처 가이드 수립"
      ],
      mediumSignals: [
        "코드 컨벤션 관리",
        "리팩토링 주도",
        "개발자 경험 개선",
        "문서화 및 가이드 제공"
      ],
      boundarySignals: [
        "서비스 기능 개발 비중이 커지면 애플리케이션 로직으로 이동",
        "인프라/배포 환경 비중이 커지면 DevOps로 이동",
        "디자인 요소 중심이면 UI 구현으로 이동"
      ],
      adjacentFamilies: [
        "FRONTEND_APPLICATION",
        "DEVOPS_ENGINEERING",
        "UI_IMPLEMENTATION"
      ],
      boundaryNote: "공통 플랫폼과 개발 환경을 구축하는 역할이 중심이면 프론트엔드 플랫폼으로 읽힙니다. 반면 서비스 기능 개발 비중이 커지면 일반 개발로 이동합니다.",
      summaryTemplate: "이 직무는 프론트엔드 개발 환경과 공통 구조를 설계하는 플랫폼 성격이 강합니다. 반면 기능 개발 비중이 커지면 일반 프론트엔드 개발로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "FRONTEND_UI_DEVELOPER",
      label: "프론트엔드 UI 개발자",
      aliases: [
        "UI 프론트엔드",
        "퍼블리싱 개발자"
      ],
      family: "UI_IMPLEMENTATION",
      responsibilityHints: [
        "디자인 기반 UI 구현",
        "컴포넌트 개발",
        "스타일링 및 레이아웃 작업",
        "반응형 웹 구현"
      ],
      levelHints: [
        "주니어는 구현 중심",
        "시니어는 컴포넌트 구조 설계 및 품질 관리"
      ]
    },
    {
      id: "FRONTEND_ENGINEER",
      label: "프론트엔드 엔지니어",
      aliases: [
        "frontend engineer"
      ],
      family: "FRONTEND_APPLICATION",
      responsibilityHints: [
        "상태 관리 설계",
        "데이터 흐름 구현",
        "API 연동",
        "애플리케이션 구조 설계"
      ],
      levelHints: [
        "주니어는 기능 구현 중심",
        "시니어는 아키텍처 및 상태 설계"
      ]
    },
    {
      id: "FRONTEND_PERFORMANCE_ENGINEER",
      label: "프론트엔드 성능 엔지니어",
      aliases: [
        "frontend performance engineer"
      ],
      family: "FRONTEND_PERFORMANCE",
      responsibilityHints: [
        "성능 측정 및 개선",
        "렌더링 최적화",
        "번들 최적화",
        "UX 속도 개선"
      ],
      levelHints: [
        "성능 분석 경험 중요",
        "시니어는 전체 성능 전략 설계"
      ]
    },
    {
      id: "FRONTEND_PLATFORM_ENGINEER",
      label: "프론트엔드 플랫폼 엔지니어",
      aliases: [
        "frontend platform engineer"
      ],
      family: "FRONTEND_PLATFORM",
      responsibilityHints: [
        "디자인 시스템 구축",
        "공통 라이브러리 개발",
        "개발 환경 및 빌드 시스템 구성",
        "개발 생산성 개선"
      ],
      levelHints: [
        "구조 설계 경험 중요",
        "시니어는 조직 단위 표준화 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS_LAYER",
      label: "집중 레이어",
      values: [
        "UI 표현",
        "애플리케이션 로직",
        "성능 최적화",
        "플랫폼/공통화"
      ]
    },
    {
      axisId: "COMPLEXITY",
      label: "복잡도 관여 수준",
      values: [
        "단순 화면 구현",
        "상태 및 흐름 설계",
        "시스템 최적화",
        "개발 환경/구조 설계"
      ]
    },
    {
      axisId: "PRIMARY_VALUE",
      label: "주요 가치 기여",
      values: [
        "사용자 인터페이스 완성도",
        "서비스 기능 구현",
        "성능 및 속도 개선",
        "개발 생산성 향상"
      ]
    }
  ],
  adjacentFamilies: [
    "BACKEND_DEVELOPMENT",
    "DEVOPS_ENGINEERING",
    "UX_UI_DESIGN"
  ],
  boundaryHints: [
    "단순 화면 구현 비중이 높으면 UI 구현 중심으로 읽힙니다.",
    "상태 관리와 데이터 흐름 설계 비중이 커지면 애플리케이션 로직으로 이동합니다.",
    "성능 개선과 최적화 작업 비중이 커지면 성능 중심으로 해석됩니다.",
    "공통 구조와 개발 환경 구축 비중이 커지면 플랫폼 영역으로 이동합니다.",
    "서버 로직이나 데이터 처리 비중이 커지면 백엔드로 이동합니다."
  ],
  summaryTemplate: "이 직무는 사용자 인터페이스를 구현하는 프론트엔드 개발 역할입니다. 다만 UI 구현, 상태 관리, 성능 최적화, 플랫폼 구축 중 어디에 집중하느냐에 따라 역할이 달라집니다. 반면 서버 개발이나 UX 기획 비중이 커지면 인접 직무로 해석될 수 있습니다."
};