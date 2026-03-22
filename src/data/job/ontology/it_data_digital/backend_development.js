export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "BACKEND_DEVELOPMENT",
  aliases: [
    "백엔드 개발자",
    "백엔드 엔지니어",
    "서버 개발자",
    "Backend Developer",
    "Backend Engineer",
    "Server-side Developer",
    "API 개발자",
    "플랫폼 백엔드",
    "서비스 백엔드"
  ],
  families: [
    {
      id: "service_backend",
      label: "서비스 백엔드",
      aliases: [
        "서비스 서버 개발",
        "API 서버 개발",
        "비즈니스 로직 개발",
        "웹 서비스 백엔드"
      ],
      strongSignals: [
        "REST API 설계 및 구현 경험",
        "비즈니스 로직 중심의 서버 개발",
        "DB CRUD 중심 기능 개발",
        "서비스 기능 단위 배포 경험",
        "Spring Boot, Django, Express 기반 서비스 개발"
      ],
      mediumSignals: [
        "로그인/회원/결제 기능 구현 경험",
        "ORM 사용 경험 (JPA, Sequelize 등)",
        "API 응답 속도 개선 경험",
        "단일 서비스 또는 모놀리식 구조 경험"
      ],
      boundarySignals: [
        "트래픽 대응보다는 기능 구현 비중이 높음",
        "인프라 설계보다 애플리케이션 코드 비중이 큼",
        "데이터 파이프라인보다는 서비스 기능 중심"
      ],
      adjacentFamilies: [
        "platform_backend",
        "data_backend"
      ],
      boundaryNote: "기능 구현과 비즈니스 로직 개발 비중이 크면 서비스 백엔드로 읽히며, 트래픽 처리나 인프라 구조 설계 비중이 커지면 플랫폼 백엔드로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 서비스 기능 구현과 비즈니스 로직 개발 중심의 백엔드 역할 성격이 강합니다. 반면 트래픽 처리나 시스템 구조 설계 비중이 커지면 플랫폼 영역으로 읽힐 수 있습니다."
    },
    {
      id: "platform_backend",
      label: "플랫폼 백엔드",
      aliases: [
        "플랫폼 서버 개발",
        "인프라 백엔드",
        "시스템 백엔드",
        "대규모 트래픽 백엔드"
      ],
      strongSignals: [
        "대규모 트래픽 처리 경험",
        "MSA 아키텍처 설계 및 운영 경험",
        "서비스 간 통신 구조 설계",
        "캐시, 메시지큐(Kafka, RabbitMQ) 활용",
        "고가용성/확장성 설계 경험"
      ],
      mediumSignals: [
        "Redis, CDN, Load Balancer 설계 경험",
        "API Gateway 구성 경험",
        "성능 튜닝 및 병목 분석 경험",
        "컨테이너 기반 서비스 운영 경험"
      ],
      boundarySignals: [
        "비즈니스 기능보다 시스템 구조 설계 비중이 높음",
        "데이터 분석보다는 서비스 안정성/확장성 중심",
        "DevOps와 경계가 일부 겹침"
      ],
      adjacentFamilies: [
        "service_backend",
        "infra_backend"
      ],
      boundaryNote: "시스템 구조 설계와 트래픽 대응 책임이 커질수록 플랫폼 백엔드로 읽히며, 인프라 운영 자동화 중심이면 인프라 영역으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 서비스 전체 구조와 트래픽 처리 설계를 담당하는 플랫폼 중심 백엔드 성격이 강합니다. 반면 인프라 운영 자동화 비중이 커지면 인프라 영역으로 읽힐 수 있습니다."
    },
    {
      id: "data_backend",
      label: "데이터 백엔드",
      aliases: [
        "데이터 서버 개발",
        "데이터 플랫폼 백엔드",
        "ETL 백엔드",
        "데이터 파이프라인 개발"
      ],
      strongSignals: [
        "데이터 파이프라인 구축 경험",
        "ETL/ELT 프로세스 개발",
        "대용량 데이터 처리 (Spark, Hadoop)",
        "데이터 적재/가공/배치 시스템 개발",
        "데이터 모델링 및 스키마 설계"
      ],
      mediumSignals: [
        "Airflow, Kafka 기반 데이터 처리 경험",
        "로그/이벤트 데이터 수집 시스템 구축",
        "데이터 웨어하우스 연동",
        "배치 처리 성능 개선 경험"
      ],
      boundarySignals: [
        "서비스 API보다는 데이터 흐름 설계 중심",
        "실시간 기능보다 배치/스트리밍 처리 비중",
        "분석/ML과 일부 경계가 겹침"
      ],
      adjacentFamilies: [
        "service_backend",
        "platform_backend"
      ],
      boundaryNote: "데이터 흐름과 파이프라인 구축 비중이 커지면 데이터 백엔드로 읽히며, 서비스 API 중심이면 서비스 백엔드로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 데이터 수집·처리·적재 흐름을 설계하는 데이터 중심 백엔드 성격이 강합니다. 반면 서비스 기능 구현 비중이 커지면 서비스 백엔드로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "backend_engineer",
      label: "백엔드 엔지니어",
      aliases: [
        "Backend Engineer",
        "Server Developer"
      ],
      family: "service_backend",
      responsibilityHints: [
        "API 설계 및 구현",
        "비즈니스 로직 개발",
        "데이터베이스 연동"
      ],
      levelHints: [
        "기능 단위 개발 경험",
        "서비스 운영 경험"
      ]
    },
    {
      id: "platform_engineer",
      label: "플랫폼 백엔드 엔지니어",
      aliases: [
        "Platform Backend Engineer",
        "System Backend Engineer"
      ],
      family: "platform_backend",
      responsibilityHints: [
        "시스템 아키텍처 설계",
        "트래픽 처리 구조 설계",
        "서비스 간 통신 설계"
      ],
      levelHints: [
        "대규모 서비스 운영 경험",
        "성능 최적화 경험"
      ]
    },
    {
      id: "data_backend_engineer",
      label: "데이터 백엔드 엔지니어",
      aliases: [
        "Data Backend Engineer",
        "ETL Developer"
      ],
      family: "data_backend",
      responsibilityHints: [
        "데이터 파이프라인 구축",
        "배치/스트리밍 처리 개발",
        "데이터 저장 구조 설계"
      ],
      levelHints: [
        "대용량 데이터 처리 경험",
        "데이터 시스템 운영 경험"
      ]
    }
  ],
  axes: [
    {
      axisId: "focus_scope",
      label: "개발 초점 범위",
      values: [
        "비즈니스 기능 중심",
        "시스템 구조 중심",
        "데이터 흐름 중심"
      ]
    },
    {
      axisId: "traffic_complexity",
      label: "트래픽 및 규모",
      values: [
        "일반 서비스 규모",
        "대규모 트래픽",
        "대용량 데이터 처리"
      ]
    },
    {
      axisId: "responsibility_layer",
      label: "책임 레이어",
      values: [
        "애플리케이션 로직",
        "아키텍처/플랫폼",
        "데이터 처리/파이프라인"
      ]
    }
  ],
  adjacentFamilies: [
    "프론트엔드개발",
    "데브옵스",
    "데이터엔지니어링"
  ],
  boundaryHints: [
    "비즈니스 기능 구현 비중이 높으면 서비스 백엔드로 읽히며, 시스템 구조 설계 책임이 커지면 플랫폼 백엔드로 이동합니다.",
    "트래픽 처리와 확장성 설계 경험이 많아질수록 플랫폼 백엔드 성격이 강해집니다.",
    "데이터 적재·가공·파이프라인 구축 비중이 커지면 데이터 백엔드로 해석됩니다.",
    "인프라 운영 자동화나 배포 중심 역할이 커지면 데브옵스와 경계가 겹칩니다."
  ],
  summaryTemplate: "이 직무는 서버 측 로직과 데이터 처리를 담당하는 백엔드 개발 역할로, 수행 업무에 따라 서비스 구현 중심, 시스템 구조 중심, 데이터 처리 중심으로 성격이 나뉩니다. 특정 책임 비중에 따라 플랫폼이나 데이터 영역으로 경계가 이동할 수 있습니다."
};