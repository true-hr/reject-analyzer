export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "DATA_ENGINEERING",
  aliases: [
    "데이터 엔지니어",
    "데이터 엔지니어링",
    "data engineer",
    "data engineering",
    "데이터 파이프라인",
    "데이터 플랫폼",
    "big data engineer",
    "데이터 인프라",
    "데이터 처리 엔지니어",
    "ETL 개발자"
  ],
  families: [
    {
      id: "DATA_PIPELINE",
      label: "데이터 파이프라인 구축",
      aliases: [
        "ETL",
        "ELT",
        "데이터 파이프라인",
        "batch processing"
      ],
      strongSignals: [
        "데이터 수집부터 적재까지 ETL/ELT 파이프라인 구축",
        "Airflow, Spark 등을 활용한 데이터 처리 워크플로우 구성",
        "정기 배치 작업 설계 및 운영",
        "데이터 정합성 검증 및 처리 로직 구현",
        "다양한 소스(DB, 로그, API)에서 데이터 수집",
        "데이터 적재 자동화"
      ],
      mediumSignals: [
        "데이터 처리 스크립트 작성",
        "데이터 품질 체크 로직 구현",
        "데이터 스케줄링 관리",
        "기본적인 데이터 모델링"
      ],
      boundarySignals: [
        "데이터 저장 구조 설계와 분석 모델링 비중이 커지면 데이터 웨어하우스/모델링으로 이동",
        "실시간 처리 및 스트리밍 비중이 커지면 스트리밍 엔지니어링으로 이동",
        "분석 및 리포팅 비중이 커지면 데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "DATA_WAREHOUSE_MODELING",
        "STREAMING_ENGINEERING",
        "DATA_ANALYTICS"
      ],
      boundaryNote: "데이터를 수집하고 정제하여 적재하는 흐름 구축이 중심이면 파이프라인 엔지니어링으로 읽힙니다. 반면 분석 구조 설계나 실시간 처리 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 데이터를 수집·정제·적재하는 파이프라인 구축 성격이 강합니다. 반면 분석 구조 설계나 실시간 처리 비중이 커지면 다른 데이터 영역으로 해석될 수 있습니다."
    },
    {
      id: "DATA_WAREHOUSE_MODELING",
      label: "데이터 웨어하우스·모델링",
      aliases: [
        "데이터 모델링",
        "data warehouse",
        "DW",
        "데이터 마트",
        "data modeling"
      ],
      strongSignals: [
        "데이터 웨어하우스 구조 설계 및 구축",
        "스타 스키마, 스노우플레이크 등 데이터 모델링 수행",
        "분석용 데이터 마트 설계",
        "BI/리포팅을 위한 데이터 구조 최적화",
        "데이터 정합성과 일관성 설계",
        "쿼리 성능 최적화를 위한 테이블 구조 설계"
      ],
      mediumSignals: [
        "SQL 기반 데이터 변환",
        "데이터 구조 리팩토링",
        "데이터 카탈로그 관리",
        "BI 도구 연동"
      ],
      boundarySignals: [
        "데이터 수집 및 처리 로직 비중이 커지면 파이프라인으로 이동",
        "데이터 분석 및 인사이트 도출 비중이 커지면 데이터 분석으로 이동",
        "플랫폼 및 인프라 구축 비중이 커지면 데이터 플랫폼으로 이동"
      ],
      adjacentFamilies: [
        "DATA_PIPELINE",
        "DATA_PLATFORM",
        "DATA_ANALYTICS"
      ],
      boundaryNote: "데이터를 어떻게 구조화하고 분석 가능하게 만드는지가 중심이면 데이터 모델링 영역으로 읽힙니다. 반면 처리 흐름이나 인프라 중심이면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 데이터를 분석 가능한 구조로 설계하는 데이터 모델링 성격이 강합니다. 반면 데이터 처리 흐름이나 플랫폼 구축 비중이 커지면 다른 데이터 엔지니어링 역할로 해석될 수 있습니다."
    },
    {
      id: "DATA_PLATFORM",
      label: "데이터 플랫폼·인프라",
      aliases: [
        "데이터 플랫폼",
        "data platform",
        "데이터 인프라",
        "big data platform"
      ],
      strongSignals: [
        "데이터 처리 및 저장을 위한 플랫폼 구축",
        "Hadoop, Spark, Kafka 등 빅데이터 인프라 운영",
        "데이터 처리 시스템 아키텍처 설계",
        "데이터 접근 권한 및 보안 관리",
        "데이터 처리 성능 및 확장성 설계",
        "클라우드 기반 데이터 인프라 구축"
      ],
      mediumSignals: [
        "데이터 시스템 모니터링",
        "리소스 관리 및 비용 최적화",
        "데이터 서비스 운영",
        "플랫폼 장애 대응"
      ],
      boundarySignals: [
        "애플리케이션 기능 개발 비중이 커지면 백엔드로 이동",
        "파이프라인 구현 비중이 커지면 데이터 파이프라인으로 이동",
        "인프라 운영 자동화 중심이면 DevOps로 이동"
      ],
      adjacentFamilies: [
        "DATA_PIPELINE",
        "DEVOPS_ENGINEERING",
        "BACKEND_DEVELOPMENT"
      ],
      boundaryNote: "데이터를 처리하고 저장하는 플랫폼 자체를 구축하고 운영하는 역할이면 데이터 플랫폼으로 읽힙니다. 반면 개별 파이프라인 구현이나 서비스 개발 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 데이터 처리 인프라와 플랫폼을 설계하고 운영하는 성격이 강합니다. 반면 개별 데이터 처리 로직이나 서비스 개발 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "STREAMING_ENGINEERING",
      label: "스트리밍·실시간 처리",
      aliases: [
        "스트리밍 처리",
        "real-time data",
        "stream processing",
        "Kafka 엔지니어"
      ],
      strongSignals: [
        "Kafka, Flink 등을 활용한 실시간 데이터 처리 시스템 구축",
        "이벤트 기반 데이터 파이프라인 설계",
        "실시간 데이터 수집 및 처리 로직 구현",
        "지연 시간(latency) 최소화를 위한 구조 설계",
        "스트리밍 데이터 정합성 및 순서 보장 처리",
        "실시간 모니터링 및 알림 시스템 연계"
      ],
      mediumSignals: [
        "메시지 큐 운영",
        "실시간 로그 처리",
        "스트리밍 파이프라인 유지보수",
        "데이터 흐름 모니터링"
      ],
      boundarySignals: [
        "배치 처리 비중이 커지면 데이터 파이프라인으로 이동",
        "인프라 운영 중심이면 데이터 플랫폼으로 이동",
        "데이터 분석 비중이 커지면 데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "DATA_PIPELINE",
        "DATA_PLATFORM",
        "DATA_ANALYTICS"
      ],
      boundaryNote: "실시간 데이터 흐름과 이벤트 기반 처리 시스템이 중심이면 스트리밍 엔지니어링으로 읽힙니다. 반면 배치 처리나 인프라 중심이면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 실시간 데이터 흐름을 처리하는 스트리밍 엔지니어링 성격이 강합니다. 반면 배치 처리나 플랫폼 운영 비중이 커지면 다른 데이터 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "DATA_ENGINEER_PIPELINE",
      label: "데이터 엔지니어(파이프라인)",
      aliases: [
        "ETL 엔지니어"
      ],
      family: "DATA_PIPELINE",
      responsibilityHints: [
        "데이터 수집 및 적재 파이프라인 구축",
        "배치 작업 설계",
        "데이터 정제 로직 구현",
        "데이터 흐름 자동화"
      ],
      levelHints: [
        "주니어는 파이프라인 구현 중심",
        "시니어는 전체 데이터 흐름 설계"
      ]
    },
    {
      id: "DATA_MODELING_ENGINEER",
      label: "데이터 모델링 엔지니어",
      aliases: [
        "DW 엔지니어"
      ],
      family: "DATA_WAREHOUSE_MODELING",
      responsibilityHints: [
        "데이터 모델 설계",
        "데이터 마트 구축",
        "쿼리 최적화",
        "분석 구조 설계"
      ],
      levelHints: [
        "SQL 및 모델링 경험 중요",
        "시니어는 데이터 구조 전략 설계"
      ]
    },
    {
      id: "DATA_PLATFORM_ENGINEER",
      label: "데이터 플랫폼 엔지니어",
      aliases: [
        "big data engineer"
      ],
      family: "DATA_PLATFORM",
      responsibilityHints: [
        "데이터 인프라 구축",
        "플랫폼 운영 및 관리",
        "성능 및 확장성 설계",
        "시스템 안정성 확보"
      ],
      levelHints: [
        "인프라 경험 중요",
        "시니어는 플랫폼 아키텍처 설계"
      ]
    },
    {
      id: "STREAMING_ENGINEER",
      label: "스트리밍 데이터 엔지니어",
      aliases: [
        "real-time data engineer"
      ],
      family: "STREAMING_ENGINEERING",
      responsibilityHints: [
        "실시간 데이터 처리 시스템 구축",
        "이벤트 기반 아키텍처 설계",
        "지연 시간 최적화",
        "스트리밍 데이터 관리"
      ],
      levelHints: [
        "실시간 처리 경험 중요",
        "시니어는 전체 스트리밍 아키텍처 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "PROCESSING_TYPE",
      label: "데이터 처리 방식",
      values: [
        "배치 처리",
        "실시간 처리",
        "혼합 처리",
        "플랫폼 기반 처리"
      ]
    },
    {
      axisId: "PRIMARY_FOCUS",
      label: "핵심 역할 초점",
      values: [
        "데이터 수집·적재",
        "데이터 구조 설계",
        "인프라 및 플랫폼",
        "실시간 데이터 흐름"
      ]
    },
    {
      axisId: "SYSTEM_SCOPE",
      label: "관여 범위",
      values: [
        "개별 파이프라인",
        "데이터 모델",
        "플랫폼 전체",
        "이벤트 스트림"
      ]
    }
  ],
  adjacentFamilies: [
    "DATA_ANALYTICS",
    "BACKEND_DEVELOPMENT",
    "DEVOPS_ENGINEERING"
  ],
  boundaryHints: [
    "데이터 수집과 적재 흐름 구축 비중이 크면 파이프라인 엔지니어링으로 읽힙니다.",
    "데이터 구조 설계와 분석용 모델링 비중이 커지면 데이터 모델링으로 이동합니다.",
    "데이터 인프라와 플랫폼 구축 비중이 커지면 데이터 플랫폼 영역으로 해석됩니다.",
    "실시간 데이터 처리 비중이 커지면 스트리밍 엔지니어링으로 이동합니다.",
    "데이터 분석 및 리포팅 비중이 커지면 데이터 분석 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 데이터를 수집·처리·저장하는 구조를 구축하는 데이터 엔지니어링 역할입니다. 다만 파이프라인, 모델링, 플랫폼, 실시간 처리 중 어디에 집중하느냐에 따라 역할이 달라집니다. 반면 분석이나 서비스 개발 비중이 커지면 인접 직무로 해석될 수 있습니다."
};