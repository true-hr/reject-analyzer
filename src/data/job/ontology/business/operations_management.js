export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "OPERATIONS_MANAGEMENT",
  aliases: [
    "운영관리",
    "운영",
    "서비스 운영",
    "사업 운영",
    "operations",
    "operations management",
    "biz ops",
    "business operations",
    "ops manager"
  ],
  families: [
    {
      id: "SERVICE_OPERATIONS",
      label: "서비스 운영",
      aliases: [
        "서비스 운영",
        "서비스 운영관리",
        "service operations",
        "customer operations"
      ],
      strongSignals: [
        "서비스 운영 정책 수립 및 관리",
        "고객 이슈 처리 및 대응 프로세스 운영",
        "CS/운영팀 관리 및 운영 기준 정의",
        "서비스 품질 유지 및 개선",
        "운영 매뉴얼 및 정책 문서화",
        "운영 KPI 관리",
        "서비스 안정성 유지 활동"
      ],
      mediumSignals: [
        "고객 피드백 수집 및 반영",
        "운영 프로세스 개선",
        "운영 리포트 작성",
        "운영 인력 관리",
        "서비스 장애 대응 지원"
      ],
      boundarySignals: [
        "기능 정의 및 제품 개선 기획 비중이 커지면 서비스기획으로 이동",
        "성과 지표 분석과 체계 설계 비중이 커지면 사업성과 관리로 이동",
        "단순 고객 응대 중심이면 CS 직무로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_OPERATIONS",
        "BUSINESS_OPERATIONS",
        "RESOURCE_OPERATIONS"
      ],
      boundaryNote: "서비스 품질 유지와 고객 대응 프로세스를 중심으로 움직이면 서비스 운영으로 읽힙니다. 제품 개선이나 데이터 분석 중심으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 서비스의 안정적인 운영과 품질 관리를 중심으로 하는 역할입니다. 반면 제품 개선 기획이나 데이터 기반 분석 비중이 커지면 다른 직무로 해석될 수 있습니다."
    },
    {
      id: "PROCESS_OPERATIONS",
      label: "프로세스·운영개선",
      aliases: [
        "운영 개선",
        "프로세스 개선",
        "operations improvement",
        "process optimization"
      ],
      strongSignals: [
        "업무 프로세스 분석 및 개선",
        "운영 효율화 과제 도출",
        "표준 운영 절차(SOP) 설계",
        "반복 업무 자동화 기획",
        "운영 생산성 향상 프로젝트 수행",
        "운영 병목 구간 분석",
        "프로세스 KPI 개선"
      ],
      mediumSignals: [
        "데이터 기반 운영 개선 제안",
        "운영 툴/시스템 개선",
        "업무 흐름 재설계",
        "운영 지표 모니터링",
        "개선 과제 실행 관리"
      ],
      boundarySignals: [
        "전사 전략 방향과 연계된 개선이 많아지면 전략기획으로 이동",
        "프로젝트 단위 관리가 중심이면 PM/PMO로 이동",
        "단순 운영 수행 비중이 높으면 서비스 운영으로 이동"
      ],
      adjacentFamilies: [
        "SERVICE_OPERATIONS",
        "BUSINESS_OPERATIONS",
        "RESOURCE_OPERATIONS"
      ],
      boundaryNote: "운영 효율화와 프로세스 개선을 중심으로 하면 이 영역으로 읽힙니다. 단순 운영 수행이나 전략 설계 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 프로세스를 분석하고 개선하여 효율을 높이는 역할이 중심입니다. 반면 단순 운영 수행이나 전략 설계 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "BUSINESS_OPERATIONS",
      label: "사업 운영",
      aliases: [
        "사업 운영",
        "biz ops",
        "business operations"
      ],
      strongSignals: [
        "사업 운영 지표 관리",
        "매출/비용/성과 모니터링",
        "사업부 운영 이슈 관리",
        "운영 계획 수립 및 실행",
        "사업 운영 리포트 작성",
        "운영 의사결정 지원",
        "사업 실적 관리"
      ],
      mediumSignals: [
        "운영 데이터 분석",
        "사업부 협업 조율",
        "성과 개선 과제 도출",
        "운영 리듬 관리",
        "지표 기반 실행 관리"
      ],
      boundarySignals: [
        "성과 측정 체계 설계가 중심이면 사업성과 관리로 이동",
        "성장 전략이나 확장 과제가 많아지면 사업기획으로 이동",
        "단순 데이터 분석 비중이 높으면 데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_OPERATIONS",
        "SERVICE_OPERATIONS",
        "RESOURCE_OPERATIONS"
      ],
      boundaryNote: "사업 단위 운영과 실적 관리 중심이면 사업 운영으로 읽힙니다. 성과 체계 설계나 성장 기획 비중이 커지면 다른 직무로 이동합니다.",
      summaryTemplate: "이 직무는 사업의 운영 상태를 관리하고 실적을 유지·개선하는 역할이 중심입니다. 반면 성과 체계 설계나 성장 전략 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "RESOURCE_OPERATIONS",
      label: "자원·운영관리",
      aliases: [
        "리소스 운영",
        "인력 운영",
        "resource operations",
        "workforce management"
      ],
      strongSignals: [
        "인력 배치 및 스케줄 관리",
        "운영 리소스 계획 수립",
        "업무량 대비 인력 산정",
        "외주/협력사 운영 관리",
        "운영 비용 관리",
        "리소스 효율화 관리",
        "운영 조직 관리"
      ],
      mediumSignals: [
        "근무 스케줄 조정",
        "운영 인력 성과 관리",
        "운영 비용 분석",
        "리소스 배분 최적화",
        "운영 조직 커뮤니케이션"
      ],
      boundarySignals: [
        "HR 정책이나 인사제도 설계가 많아지면 인사 직무로 이동",
        "사업 운영 지표 관리 비중이 커지면 사업 운영으로 이동",
        "단순 인력 관리만 수행하면 운영지원으로 이동"
      ],
      adjacentFamilies: [
        "SERVICE_OPERATIONS",
        "BUSINESS_OPERATIONS",
        "PROCESS_OPERATIONS"
      ],
      boundaryNote: "인력과 자원 배치 및 효율 관리가 중심이면 자원 운영으로 읽힙니다. 사업 지표 관리나 제도 설계 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 운영에 필요한 인력과 자원을 효율적으로 배치하고 관리하는 역할이 중심입니다. 반면 사업 성과 관리나 인사 제도 설계 비중이 커지면 다른 직무로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "OPERATIONS_MANAGER",
      label: "운영 매니저",
      aliases: [
        "operations manager",
        "운영 담당자"
      ],
      family: "SERVICE_OPERATIONS",
      responsibilityHints: [
        "서비스 운영 관리",
        "운영 정책 관리",
        "이슈 대응",
        "운영 KPI 관리"
      ],
      levelHints: [
        "주니어는 운영 실행 중심",
        "시니어는 운영 정책과 개선 비중이 큼"
      ]
    },
    {
      id: "OPERATIONS_IMPROVEMENT_MANAGER",
      label: "운영개선 담당",
      aliases: [
        "operations improvement",
        "프로세스 개선 담당"
      ],
      family: "PROCESS_OPERATIONS",
      responsibilityHints: [
        "프로세스 분석",
        "운영 개선 과제 수행",
        "자동화 기획",
        "효율화 프로젝트"
      ],
      levelHints: [
        "주니어는 데이터 분석 및 지원",
        "시니어는 개선 설계 및 실행 리딩"
      ]
    },
    {
      id: "BUSINESS_OPERATIONS_MANAGER",
      label: "사업운영 매니저",
      aliases: [
        "biz ops manager",
        "business operations manager"
      ],
      family: "BUSINESS_OPERATIONS",
      responsibilityHints: [
        "사업 운영 관리",
        "성과 모니터링",
        "운영 계획 수립",
        "리포트 작성"
      ],
      levelHints: [
        "주니어는 리포팅 중심",
        "시니어는 의사결정 지원 및 개선 리딩"
      ]
    },
    {
      id: "RESOURCE_MANAGER",
      label: "리소스 운영 담당",
      aliases: [
        "resource manager",
        "workforce manager"
      ],
      family: "RESOURCE_OPERATIONS",
      responsibilityHints: [
        "인력 배치",
        "스케줄 관리",
        "운영 비용 관리",
        "외주 관리"
      ],
      levelHints: [
        "주니어는 운영 실행 중심",
        "시니어는 리소스 전략 및 최적화 중심"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS",
      label: "주요 초점",
      values: [
        "서비스 안정 운영",
        "프로세스 개선",
        "사업 운영 관리",
        "자원/인력 관리"
      ]
    },
    {
      axisId: "EXECUTION_TYPE",
      label: "실행 유형",
      values: [
        "운영 실행 중심",
        "개선 과제 중심",
        "성과 관리 중심",
        "리소스 관리 중심"
      ]
    },
    {
      axisId: "DECISION_SCOPE",
      label: "의사결정 범위",
      values: [
        "서비스 단위",
        "프로세스 단위",
        "사업 단위",
        "조직/리소스 단위"
      ]
    }
  ],
  adjacentFamilies: [
    "사업기획",
    "서비스기획",
    "프로젝트관리(PM)",
    "인사",
    "데이터 분석",
    "고객상담/CS"
  ],
  boundaryHints: [
    "서비스 품질과 고객 대응이 많아지면 서비스 운영으로 읽힙니다.",
    "업무 효율화와 프로세스 개선 비중이 커지면 운영개선으로 이동합니다.",
    "사업 실적과 지표 관리 비중이 커지면 사업 운영으로 이동합니다.",
    "인력 배치와 비용 관리 비중이 커지면 자원 운영으로 이동합니다.",
    "제품 기능 정의나 서비스 구조 설계가 많아지면 서비스기획으로 이동합니다.",
    "성과 체계 설계나 분석 중심이면 사업성과 관리 또는 데이터 분석으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 서비스와 사업의 운영을 안정적으로 유지하고 개선하는 역할이 중심입니다. 다만 서비스 운영, 프로세스 개선, 사업 운영, 자원 관리 등으로 나뉘며 작동 방식이 달라집니다. 반면 제품 기획이나 전략 설계 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
