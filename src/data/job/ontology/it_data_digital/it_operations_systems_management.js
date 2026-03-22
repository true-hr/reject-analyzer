export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "IT_OPERATIONS_SYSTEMS_MANAGEMENT",
  aliases: [
    "IT 운영",
    "시스템 운영",
    "시스템 관리자",
    "인프라 운영",
    "운영 엔지니어",
    "System Administrator",
    "IT Operations",
    "Infra Operations",
    "Server Operations",
    "Site Operations"
  ],
  families: [
    {
      id: "infra_operations",
      label: "인프라 운영",
      aliases: [
        "서버 운영",
        "시스템 운영",
        "온프레미스 운영",
        "IDC 운영"
      ],
      strongSignals: [
        "Linux 또는 Windows 서버 직접 운영 경험",
        "서버 장애 대응 및 원인 분석 수행",
        "OS 패치 및 보안 업데이트 관리",
        "CPU/메모리/디스크 리소스 모니터링 및 조정",
        "계정 및 권한 관리 수행"
      ],
      mediumSignals: [
        "백업 및 복구 절차 운영 경험",
        "서버 로그 분석 및 대응",
        "물리 서버 또는 가상화 환경 운영 경험",
        "운영 매뉴얼 기반 정기 점검 수행"
      ],
      boundarySignals: [
        "자동화보다 수동 운영 비중이 높음",
        "클라우드 서비스보다 자체 서버 환경 중심",
        "구축보다는 유지보수 및 안정성 확보 비중"
      ],
      adjacentFamilies: [
        "cloud_operations",
        "ops_automation"
      ],
      boundaryNote: "수동 운영과 시스템 유지보수 비중이 높으면 인프라 운영으로 읽히며, 클라우드 기반 운영이나 자동화 비중이 커지면 다른 영역으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 서버와 시스템을 안정적으로 유지하고 장애를 대응하는 인프라 운영 성격이 강합니다. 반면 클라우드 기반 운영이나 자동화 비중이 커지면 다른 운영 영역으로 읽힐 수 있습니다."
    },
    {
      id: "cloud_operations",
      label: "클라우드 운영",
      aliases: [
        "클라우드 엔지니어",
        "Cloud Operations",
        "AWS 운영",
        "GCP 운영",
        "클라우드 인프라 운영"
      ],
      strongSignals: [
        "AWS, GCP, Azure 환경에서 서비스 운영 경험",
        "EC2, RDS, S3 등 클라우드 리소스 구성 및 운영",
        "IAM 권한 및 네트워크 설정 관리",
        "클라우드 기반 장애 대응 및 복구 경험",
        "Auto Scaling 및 리소스 최적화 운영"
      ],
      mediumSignals: [
        "Terraform 또는 CloudFormation 사용 경험",
        "클라우드 비용 모니터링 및 최적화",
        "CloudWatch, Stackdriver 등 모니터링 도구 활용",
        "멀티 AZ 또는 리전 운영 경험"
      ],
      boundarySignals: [
        "온프레미스보다 클라우드 환경 비중이 높음",
        "수동 운영과 자동화가 혼재된 상태",
        "배포 자동화까지 확장되면 DevOps와 경계 형성"
      ],
      adjacentFamilies: [
        "infra_operations",
        "ops_automation"
      ],
      boundaryNote: "클라우드 리소스 운영 비중이 커지면 클라우드 운영으로 읽히며, 배포 자동화와 파이프라인 구축 책임이 커지면 자동화/DevOps 영역으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 클라우드 환경에서 인프라를 구성하고 운영하는 역할 성격이 강합니다. 반면 배포 자동화와 파이프라인 구축 비중이 커지면 자동화 영역으로 읽힐 수 있습니다."
    },
    {
      id: "ops_automation",
      label: "운영 자동화 / DevOps",
      aliases: [
        "DevOps 엔지니어",
        "운영 자동화",
        "배포 엔지니어",
        "CI/CD 엔지니어"
      ],
      strongSignals: [
        "CI/CD 파이프라인 구축 및 운영 (Jenkins, GitHub Actions 등)",
        "Docker 기반 컨테이너 운영",
        "Kubernetes 클러스터 운영 및 배포 관리",
        "Infrastructure as Code (Terraform 등) 적용",
        "배포 자동화 및 롤백 전략 설계"
      ],
      mediumSignals: [
        "Prometheus, Grafana 기반 모니터링 구성",
        "로그 수집 및 관측성 시스템 구축",
        "스크립트 기반 반복 작업 자동화",
        "Blue-Green 또는 Canary 배포 경험"
      ],
      boundarySignals: [
        "단순 운영보다 자동화 및 개발 비중이 높음",
        "플랫폼 엔지니어링과 역할 일부 중첩",
        "클라우드 운영과 기술 스택 공유"
      ],
      adjacentFamilies: [
        "cloud_operations",
        "platform_operations"
      ],
      boundaryNote: "배포 자동화와 운영 효율화 비중이 커지면 DevOps로 읽히며, 조직 공통 플랫폼 구축까지 확장되면 플랫폼 운영으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 운영 효율화를 위해 자동화와 배포 파이프라인을 구축하는 DevOps 성격이 강합니다. 반면 공통 플랫폼 구축 비중이 커지면 플랫폼 영역으로 읽힐 수 있습니다."
    },
    {
      id: "platform_operations",
      label: "플랫폼 운영",
      aliases: [
        "플랫폼 엔지니어",
        "내부 플랫폼 운영",
        "개발 플랫폼 운영",
        "Platform Operations"
      ],
      strongSignals: [
        "조직 공통 인프라 또는 플랫폼 구축 및 운영",
        "Kubernetes 기반 공통 클러스터 제공",
        "여러 서비스가 사용하는 공통 환경 설계",
        "개발자 온보딩 및 환경 자동화 시스템 구축",
        "내부 서비스 배포 표준화 및 플랫폼화"
      ],
      mediumSignals: [
        "서비스 템플릿 및 공통 모듈 제공",
        "개발자 경험(DX) 개선 작업",
        "플랫폼 SLA 및 운영 정책 관리",
        "멀티 서비스 환경 지원 경험"
      ],
      boundarySignals: [
        "단일 서비스 운영보다 다수 서비스 지원 비중",
        "자동화 및 인프라 설계 비중이 높음",
        "백엔드/플랫폼 개발과 일부 경계 형성"
      ],
      adjacentFamilies: [
        "ops_automation",
        "platform_backend"
      ],
      boundaryNote: "여러 팀을 위한 공통 플랫폼 구축 비중이 커지면 플랫폼 운영으로 읽히며, 단일 서비스 배포 자동화 중심이면 DevOps로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 조직 내 공통 인프라와 개발 환경을 플랫폼 형태로 제공하는 역할 성격이 강합니다. 반면 단일 서비스 배포 자동화 중심이면 DevOps 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "system_operator",
      label: "시스템 운영 엔지니어",
      aliases: [
        "System Operator",
        "System Administrator"
      ],
      family: "infra_operations",
      responsibilityHints: [
        "서버 운영 및 유지보수",
        "장애 대응 및 원인 분석",
        "계정 및 권한 관리"
      ],
      levelHints: [
        "운영 안정성 확보 경험",
        "다양한 장애 대응 경험"
      ]
    },
    {
      id: "cloud_operator",
      label: "클라우드 운영 엔지니어",
      aliases: [
        "Cloud Operations Engineer"
      ],
      family: "cloud_operations",
      responsibilityHints: [
        "클라우드 리소스 운영",
        "인프라 구성 및 관리",
        "클라우드 장애 대응"
      ],
      levelHints: [
        "멀티 서비스 운영 경험",
        "클라우드 아키텍처 이해"
      ]
    },
    {
      id: "devops_engineer",
      label: "DevOps 엔지니어",
      aliases: [
        "DevOps Engineer"
      ],
      family: "ops_automation",
      responsibilityHints: [
        "CI/CD 구축",
        "배포 자동화",
        "운영 효율화"
      ],
      levelHints: [
        "자동화 시스템 설계 경험",
        "서비스 가용성 개선 경험"
      ]
    },
    {
      id: "platform_operator",
      label: "플랫폼 운영 엔지니어",
      aliases: [
        "Platform Engineer",
        "Platform Operations Engineer"
      ],
      family: "platform_operations",
      responsibilityHints: [
        "공통 플랫폼 구축",
        "인프라 표준화",
        "개발 환경 제공"
      ],
      levelHints: [
        "다수 서비스 지원 경험",
        "플랫폼 설계 경험"
      ]
    }
  ],
  axes: [
    {
      axisId: "manual_vs_automation",
      label: "수동 운영 vs 자동화",
      values: [
        "수동 운영 중심",
        "클라우드 기반 운영",
        "자동화 및 배포 중심",
        "플랫폼 구축 중심"
      ]
    },
    {
      axisId: "environment_type",
      label: "운영 환경",
      values: [
        "온프레미스/IDC",
        "클라우드",
        "컨테이너/클러스터",
        "멀티 서비스 플랫폼"
      ]
    },
    {
      axisId: "responsibility_scope",
      label: "책임 범위",
      values: [
        "단일 시스템 안정성",
        "인프라 리소스 관리",
        "배포 및 운영 효율화",
        "조직 공통 플랫폼 제공"
      ]
    }
  ],
  adjacentFamilies: [
    "데브옵스",
    "플랫폼엔지니어링",
    "백엔드개발"
  ],
  boundaryHints: [
    "수동 운영과 유지보수 비중이 높으면 인프라 운영으로 읽히며, 클라우드 환경 비중이 커지면 클라우드 운영으로 이동합니다.",
    "클라우드 운영에서 배포 자동화와 파이프라인 구축 비중이 커지면 DevOps로 해석됩니다.",
    "배포 자동화와 운영 효율화 비중이 커지면 DevOps로 읽히며, 공통 플랫폼 구축까지 확장되면 플랫폼 운영으로 이동합니다.",
    "여러 서비스 공통 환경과 플랫폼 제공 책임이 커지면 플랫폼 운영으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 시스템과 인프라를 안정적으로 운영하는 역할로, 수동 운영, 클라우드 관리, 자동화, 플랫폼 구축 중 어떤 영역에 초점을 두는지에 따라 성격이 나뉩니다. 책임 범위가 확장되면 DevOps나 플랫폼 영역으로 경계가 이동할 수 있습니다."
};