export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "DEVOPS_INFRA",
  aliases: [
    "DevOps 엔지니어",
    "데브옵스 엔지니어",
    "인프라 엔지니어",
    "클라우드 엔지니어",
    "SRE",
    "Site Reliability Engineer",
    "플랫폼 엔지니어",
    "Infrastructure Engineer",
    "Cloud Engineer",
    "Platform Engineer"
  ],
  families: [
    {
      id: "DEVOPS_AUTOMATION",
      label: "DevOps 자동화 중심",
      aliases: [
        "DevOps Engineer",
        "CI/CD 엔지니어",
        "배포 자동화 엔지니어"
      ],
      strongSignals: [
        "CI/CD 파이프라인 설계 및 구축 (Jenkins, GitHub Actions 등)",
        "코드 기반 배포 자동화 스크립트 작성 및 유지",
        "개발-운영 배포 프로세스 통합 및 개선",
        "IaC(Terraform, CloudFormation)로 환경 구성",
        "빌드/테스트/배포 단계 자동화 관리"
      ],
      mediumSignals: [
        "Docker 기반 컨테이너 빌드 및 배포",
        "릴리즈 프로세스 개선 경험",
        "개발팀과 협업하여 배포 구조 개선",
        "간단한 클라우드 리소스 구성 경험"
      ],
      boundarySignals: [
        "장애 대응 및 운영 지표 관리 비중이 커지면 SRE로 이동",
        "클라우드 아키텍처 설계 비중이 커지면 인프라 중심으로 이동",
        "내부 개발 플랫폼 구축 비중이 커지면 플랫폼 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "SRE_RELIABILITY",
        "CLOUD_INFRASTRUCTURE",
        "PLATFORM_ENGINEERING"
      ],
      boundaryNote: "배포 자동화와 개발-운영 연결이 핵심입니다. 운영 안정성이나 인프라 설계 책임이 커질수록 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 배포 자동화와 CI/CD 구축을 중심으로 개발과 운영을 연결하는 성격이 강합니다. 반면 운영 안정성이나 인프라 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "SRE_RELIABILITY",
      label: "신뢰성/운영 중심 (SRE)",
      aliases: [
        "SRE",
        "Site Reliability Engineer",
        "운영 안정성 엔지니어"
      ],
      strongSignals: [
        "서비스 장애 대응 및 원인 분석(RCA) 수행",
        "모니터링/알림 시스템 구축 (Prometheus, Grafana 등)",
        "SLA/SLO 정의 및 운영",
        "서비스 가용성, 지연시간, 에러율 관리",
        "온콜(on-call) 운영 경험"
      ],
      mediumSignals: [
        "로그 수집 및 분석 시스템 구축 (ELK 등)",
        "운영 자동화 스크립트 작성",
        "트래픽 급증 대응 경험",
        "배포 이후 안정성 검증 및 롤백 경험"
      ],
      boundarySignals: [
        "배포 자동화 및 CI/CD 구축 비중이 커지면 DevOps로 이동",
        "클라우드 구조 설계 비중이 커지면 인프라 엔지니어링으로 이동",
        "내부 개발자 경험 개선 도구 개발 비중이 커지면 플랫폼 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "DEVOPS_AUTOMATION",
        "CLOUD_INFRASTRUCTURE"
      ],
      boundaryNote: "운영 안정성과 장애 대응 책임이 핵심입니다. 배포 자동화나 인프라 설계보다 서비스 신뢰성 관리 비중이 높을수록 이 family로 해석됩니다.",
      summaryTemplate: "이 직무는 서비스 안정성과 신뢰성을 유지하기 위해 모니터링과 장애 대응을 중심으로 하는 성격이 강합니다. 반면 배포 자동화나 인프라 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "CLOUD_INFRASTRUCTURE",
      label: "클라우드/인프라 설계 중심",
      aliases: [
        "클라우드 엔지니어",
        "인프라 엔지니어",
        "Cloud Infrastructure Engineer"
      ],
      strongSignals: [
        "AWS/GCP/Azure 기반 인프라 아키텍처 설계",
        "VPC, 서브넷, 보안 그룹 등 네트워크 설계",
        "고가용성 및 확장성 구조 설계",
        "멀티 AZ/리전 구성 경험",
        "리소스 비용 최적화 및 설계"
      ],
      mediumSignals: [
        "Terraform 등 IaC 기반 인프라 관리",
        "Kubernetes 기반 클러스터 운영",
        "로드밸런서 및 CDN 구성 경험",
        "접근 제어 및 보안 정책 설정"
      ],
      boundarySignals: [
        "장애 대응 및 운영 지표 관리 비중이 커지면 SRE로 이동",
        "배포 자동화 및 개발 파이프라인 비중이 커지면 DevOps로 이동",
        "내부 플랫폼/툴 개발 비중이 커지면 플랫폼 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "SRE_RELIABILITY",
        "DEVOPS_AUTOMATION",
        "PLATFORM_ENGINEERING"
      ],
      boundaryNote: "클라우드 환경에서의 구조 설계와 리소스 구성이 핵심입니다. 운영 대응이나 배포 자동화 비중이 커질수록 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 클라우드 인프라를 설계하고 확장성과 안정성을 확보하는 데 집중하는 성격이 강합니다. 반면 운영 대응이나 배포 자동화 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PLATFORM_ENGINEERING",
      label: "플랫폼 엔지니어링",
      aliases: [
        "플랫폼 엔지니어",
        "Developer Platform Engineer",
        "내부 플랫폼 개발자"
      ],
      strongSignals: [
        "내부 개발자를 위한 플랫폼/툴링 구축 (Internal Developer Platform)",
        "개발 생산성 향상을 위한 CLI, 템플릿, 자동화 도구 개발",
        "공통 인프라 및 서비스 템플릿 제공",
        "개발 환경 표준화 및 셀프서비스 환경 구축",
        "플랫폼 API 또는 내부 서비스 개발"
      ],
      mediumSignals: [
        "Kubernetes 기반 플랫폼 구성",
        "개발자 경험(DX) 개선 프로젝트 수행",
        "서비스 온보딩 자동화",
        "CI/CD 템플릿화 및 표준화"
      ],
      boundarySignals: [
        "배포 자동화 자체 구현보다 파이프라인 운영 비중이 커지면 DevOps로 이동",
        "운영 안정성 및 장애 대응 비중이 커지면 SRE로 이동",
        "인프라 리소스 설계 중심으로 이동하면 클라우드 엔지니어링으로 이동"
      ],
      adjacentFamilies: [
        "DEVOPS_AUTOMATION",
        "CLOUD_INFRASTRUCTURE"
      ],
      boundaryNote: "개발자 생산성을 높이는 플랫폼 구축이 핵심입니다. 단순 배포 자동화나 인프라 구성보다 내부 플랫폼 제공 비중이 높을수록 이 family로 해석됩니다.",
      summaryTemplate: "이 직무는 개발자가 더 빠르게 개발할 수 있도록 내부 플랫폼과 도구를 구축하는 성격이 강합니다. 반면 운영 대응이나 인프라 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "DEVOPS_ENGINEER",
      label: "DevOps 엔지니어",
      aliases: [
        "DevOps Engineer",
        "데브옵스 엔지니어"
      ],
      family: "DEVOPS_AUTOMATION",
      responsibilityHints: [
        "CI/CD 파이프라인 구축 및 운영",
        "배포 자동화 및 프로세스 개선",
        "개발-운영 환경 통합"
      ],
      levelHints: [
        "주니어: 파이프라인 운영 및 수정",
        "미드: 배포 구조 설계 및 자동화 개선",
        "시니어: 조직 단위 DevOps 전략 및 구조 설계"
      ]
    },
    {
      id: "SRE_ENGINEER",
      label: "SRE 엔지니어",
      aliases: [
        "Site Reliability Engineer",
        "SRE"
      ],
      family: "SRE_RELIABILITY",
      responsibilityHints: [
        "서비스 장애 대응 및 안정성 관리",
        "모니터링/알림 시스템 구축",
        "SLO 기반 운영 개선"
      ],
      levelHints: [
        "미드: 서비스 단위 운영 안정성 관리",
        "시니어: 조직 단위 신뢰성 전략 및 SLO 설계"
      ]
    },
    {
      id: "CLOUD_ENGINEER",
      label: "클라우드 엔지니어",
      aliases: [
        "Cloud Engineer",
        "인프라 엔지니어"
      ],
      family: "CLOUD_INFRASTRUCTURE",
      responsibilityHints: [
        "클라우드 인프라 설계 및 구축",
        "네트워크 및 보안 구성",
        "확장성/비용 최적화 설계"
      ],
      levelHints: [
        "미드: 서비스 인프라 설계 및 운영",
        "시니어: 전체 아키텍처 및 클라우드 전략 설계"
      ]
    },
    {
      id: "PLATFORM_ENGINEER",
      label: "플랫폼 엔지니어",
      aliases: [
        "Platform Engineer",
        "Developer Platform Engineer"
      ],
      family: "PLATFORM_ENGINEERING",
      responsibilityHints: [
        "내부 개발 플랫폼 및 도구 개발",
        "개발 생산성 향상 시스템 구축",
        "서비스 온보딩 및 환경 자동화"
      ],
      levelHints: [
        "미드: 플랫폼 기능 개발 및 개선",
        "시니어: 조직 단위 플랫폼 전략 및 구조 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "주요 책임 초점",
      values: [
        "배포 자동화/프로세스",
        "서비스 안정성/운영",
        "인프라 설계/구성",
        "개발자 플랫폼/생산성"
      ]
    },
    {
      axisId: "RESPONSIBILITY_SCOPE",
      label: "책임 범위",
      values: [
        "파이프라인/기능 단위",
        "서비스 운영 단위",
        "인프라/시스템 단위",
        "조직 플랫폼 단위"
      ]
    },
    {
      axisId: "ENGINEERING_OUTPUT",
      label: "산출물 형태",
      values: [
        "자동화 스크립트/파이프라인",
        "운영 지표/모니터링 시스템",
        "인프라 아키텍처",
        "내부 플랫폼/툴"
      ]
    }
  ],
  adjacentFamilies: [
    "BACKEND_DEVELOPMENT",
    "DATA_ENGINEERING",
    "SECURITY_ENGINEERING"
  ],
  boundaryHints: [
    "배포 자동화보다 장애 대응과 운영 지표 관리 비중이 커지면 SRE로 읽힐 수 있습니다",
    "클라우드 리소스 설계와 네트워크 구조 설계 비중이 커지면 인프라 엔지니어링으로 이동합니다",
    "내부 개발자 도구와 플랫폼 구축 비중이 커지면 플랫폼 엔지니어링으로 읽힐 수 있습니다",
    "애플리케이션 로직 개발 비중이 커지면 백엔드 개발로 이동합니다"
  ],
  summaryTemplate: "이 직무는 시스템 운영, 배포 자동화, 인프라 설계를 통해 서비스가 안정적으로 동작하도록 만드는 역할을 수행하는 성격이 강합니다. 다만 책임의 중심이 배포, 운영, 인프라, 플랫폼 중 어디에 있느냐에 따라 세부 직무 경계가 달라질 수 있습니다."
};