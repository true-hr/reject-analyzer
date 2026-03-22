export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "SERVICE_OPERATIONS",
  aliases: [
    "서비스운영",
    "서비스 운영",
    "운영관리",
    "서비스 관리",
    "운영 담당",
    "서비스 운영 담당",
    "운영 매니저",
    "오퍼레이션 매니저",
    "비즈니스 운영",
    "서비스 오퍼레이션",
    "운영 기획 및 운영",
    "운영 PM",
    "service operations",
    "service operation",
    "operations manager",
    "service operations manager",
    "business operations",
    "ops manager",
    "operation management"
  ],
  families: [
    {
      id: "PROCESS_POLICY_OPERATIONS",
      label: "프로세스·정책 운영",
      aliases: [
        "운영 정책 관리",
        "운영 프로세스 관리",
        "서비스 프로세스 운영",
        "운영 표준화",
        "SOP 운영",
        "process operations",
        "policy operations",
        "operations policy",
        "standard operations"
      ],
      strongSignals: [
        "운영 정책, 운영 기준, 예외 처리 기준 수립 및 개정",
        "서비스 운영 프로세스 설계와 표준화",
        "반복 이슈를 운영 정책으로 정리해 재발 방지",
        "업무 매뉴얼, SOP, 운영 가이드 문서 관리",
        "운영 단계별 승인 조건과 처리 기준 정리",
        "유관부서 간 운영 핸드오프 기준 정립",
        "신규 서비스 출시 시 운영 정책 반영과 안정화"
      ],
      mediumSignals: [
        "운영 FAQ와 내부 가이드 업데이트",
        "정책 변경 공지와 교육 운영",
        "예외 케이스 분류와 처리 흐름 정리",
        "운영 이슈 원인 분석과 프로세스 개선 제안",
        "운영 기준 준수 여부 점검"
      ],
      boundarySignals: [
        "데이터 대시보드 분석과 KPI 관리 비중이 커지면 운영관리·운영분석으로 이동",
        "현장 인력 배치와 일정 운영 비중이 커지면 현장 운영·운영 실행으로 이동",
        "시스템 요구사항 정의와 제품 개선 우선순위 조율이 중심이면 서비스기획 또는 운영기획 경계가 강해짐"
      ],
      adjacentFamilies: [
        "EXECUTION_WORKFLOW_OPERATIONS",
        "SERVICE_QUALITY_MONITORING",
        "OPERATIONS_CONTROL_ANALYTICS"
      ],
      boundaryNote: "서비스가 일관되게 돌아가도록 정책과 처리 기준을 만드는 책임이 크면 이 family로 읽힙니다. 반면 현장 실행, 수치 관리, 시스템 개선 조율이 더 중심이면 다른 family나 인접 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 서비스가 흔들리지 않도록 운영 정책과 처리 기준을 설계하고 정리하는 성격이 강합니다. 반면 현장 실행 비중이 커지면 실행 운영으로, 데이터 기반 통제 비중이 커지면 운영관리·운영분석 경계로 읽힐 수 있습니다."
    },
    {
      id: "EXECUTION_WORKFLOW_OPERATIONS",
      label: "운영 실행·워크플로우 관리",
      aliases: [
        "운영 실행",
        "서비스 실행 운영",
        "워크플로우 운영",
        "오퍼레이션 실행",
        "일일 운영 관리",
        "execution operations",
        "workflow operations",
        "daily operations",
        "service delivery operations"
      ],
      strongSignals: [
        "일일 운영 흐름 점검과 업무 배분",
        "처리 대기 건, 병목 구간, SLA 이슈 실시간 관리",
        "운영 인력 또는 외주 파트너의 작업 진행 통제",
        "운영 일정, 큐, 처리 순서 조정",
        "당일 서비스 안정 운영을 위한 이슈 핸들링",
        "반복 작업의 누락·지연 방지와 처리 완료 관리",
        "운영 현황판, 티켓, 작업 큐 기반 실행 관리"
      ],
      mediumSignals: [
        "교대·스케줄 운영",
        "긴급 요청 우선순위 조정",
        "운영 마감 점검",
        "파트너사 실행 품질 체크",
        "운영 리포트와 인수인계 작성"
      ],
      boundarySignals: [
        "운영 기준 설계와 정책 개정 비중이 커지면 프로세스·정책 운영으로 이동",
        "고객 문의 응대와 상담 처리 비중이 커지면 고객지원 또는 CS 운영으로 이동",
        "대규모 인력 운영과 현장 동선 관리가 중심이면 현장운영·물류운영 등 도메인 운영 경계가 강해짐"
      ],
      adjacentFamilies: [
        "PROCESS_POLICY_OPERATIONS",
        "SERVICE_QUALITY_MONITORING",
        "OPERATIONS_CONTROL_ANALYTICS"
      ],
      boundaryNote: "정책을 만드는 것보다 실제 운영이 제때 돌아가도록 매일 통제하고 처리 흐름을 관리하는 책임이 크면 이 family로 읽힙니다. 반면 정책 설계, 고객 응대, 현장 중심 오퍼레이션이 더 커지면 다른 경계가 강해집니다.",
      summaryTemplate: "이 직무는 서비스 운영이 매일 끊기지 않도록 처리 흐름과 우선순위를 관리하는 성격이 강합니다. 반면 정책 설계 비중이 커지면 프로세스 운영으로, 고객 응대가 중심이면 CS 운영 경계로 읽힐 수 있습니다."
    },
    {
      id: "SERVICE_QUALITY_MONITORING",
      label: "서비스 품질·모니터링 운영",
      aliases: [
        "서비스 품질 운영",
        "운영 품질 관리",
        "서비스 모니터링",
        "QA 운영",
        "품질 모니터링",
        "quality operations",
        "service quality",
        "operations quality",
        "monitoring operations"
      ],
      strongSignals: [
        "서비스 품질 기준 정의와 운영 중 품질 점검",
        "처리 오류, 누락, 지연, 오처리 사례 모니터링",
        "운영 품질 샘플링과 결과 피드백",
        "품질 이슈 유형화와 개선 요청",
        "SLA, 응답속도, 정확도 등 운영 품질 지표 추적",
        "품질 저하 원인 분석과 재발 방지 액션 관리",
        "운영 담당자 또는 파트너 대상 품질 기준 교육"
      ],
      mediumSignals: [
        "모니터링 체크리스트 운영",
        "품질 리포트 작성",
        "운영 오류 사례 아카이빙",
        "품질 개선 회의 운영",
        "이상 징후 탐지와 에스컬레이션"
      ],
      boundarySignals: [
        "분석 체계 설계와 경영지표 관리가 중심이면 운영관리·운영분석으로 이동",
        "제품 결함 재현과 테스트 수행이 주업무면 QA 또는 테스트 직무로 이동",
        "상담 품질 모니터링 비중이 커지면 CS QA 또는 컨택센터 품질관리 경계가 강해짐"
      ],
      adjacentFamilies: [
        "PROCESS_POLICY_OPERATIONS",
        "EXECUTION_WORKFLOW_OPERATIONS",
        "OPERATIONS_CONTROL_ANALYTICS"
      ],
      boundaryNote: "서비스가 돌아가는지만 보는 것이 아니라 얼마나 정확하고 안정적으로 운영되는지 품질을 점검하는 책임이 크면 이 family로 읽힙니다. 반면 경영 지표 통제, 제품 테스트, 상담 품질 관리가 더 중심이면 다른 경계가 강해집니다.",
      summaryTemplate: "이 직무는 서비스 운영의 정확도와 안정성을 점검하고 품질 저하를 막는 성격이 강합니다. 반면 분석 체계와 경영지표 관리가 중심이면 운영분석으로, 제품 테스트가 핵심이면 QA 경계로 읽힐 수 있습니다."
    },
    {
      id: "OPERATIONS_CONTROL_ANALYTICS",
      label: "운영 통제·지표 관리",
      aliases: [
        "운영 통제",
        "운영 지표 관리",
        "운영관리",
        "운영 분석",
        "서비스 운영 관리",
        "operations control",
        "operations analytics",
        "operations management",
        "ops analytics"
      ],
      strongSignals: [
        "운영 KPI, 생산성, 처리량, SLA 달성률 관리",
        "운영 현황 대시보드와 지표 체계 운영",
        "인력 투입 대비 처리 효율 분석",
        "운영 병목 구간과 비용 구조 파악",
        "주간·월간 운영 성과 리뷰와 개선 과제 도출",
        "지표 이상 징후 감지와 원인 추적",
        "운영 리소스 계획과 처리량 예측 지원"
      ],
      mediumSignals: [
        "리포트 자동화",
        "운영 데이터 정합성 점검",
        "목표 대비 실적 추이 관리",
        "운영 단위별 생산성 비교",
        "경영진 보고용 운영 성과 자료 작성"
      ],
      boundarySignals: [
        "실제 작업 배분과 당일 운영 통제 비중이 커지면 운영 실행·워크플로우 관리로 이동",
        "프로세스 기준 설계와 정책 개정이 중심이면 프로세스·정책 운영으로 이동",
        "재무·사업 전사 지표 관리까지 확장되면 경영기획 또는 사업관리 경계가 강해짐"
      ],
      adjacentFamilies: [
        "EXECUTION_WORKFLOW_OPERATIONS",
        "PROCESS_POLICY_OPERATIONS",
        "SERVICE_QUALITY_MONITORING"
      ],
      boundaryNote: "운영을 직접 돌리는 것보다 수치와 통제 지표를 통해 상태를 관리하고 개선 우선순위를 잡는 책임이 크면 이 family로 읽힙니다. 반면 당일 실행 통제나 정책 설계가 더 중요해지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 상태를 지표로 통제하고 병목과 비효율을 관리하는 성격이 강합니다. 반면 현장 실행 비중이 커지면 워크플로우 운영으로, 정책 설계가 중심이면 프로세스 운영 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "SERVICE_OPERATIONS_MANAGER",
      label: "서비스 운영 매니저",
      aliases: [
        "서비스 운영 매니저",
        "운영 매니저",
        "service operations manager",
        "operations manager"
      ],
      family: "EXECUTION_WORKFLOW_OPERATIONS",
      responsibilityHints: [
        "일일 운영 흐름과 처리 현황 관리",
        "우선순위 조정과 병목 해소",
        "운영 일정, 인력, 파트너 실행 통제",
        "운영 이슈 에스컬레이션과 마감 관리"
      ],
      levelHints: [
        "주니어는 실행 관리와 현황 점검 비중이 큼",
        "시니어는 운영 구조 조정과 복수 이해관계자 조율 비중이 큼"
      ]
    },
    {
      id: "OPERATIONS_POLICY_MANAGER",
      label: "운영정책 매니저",
      aliases: [
        "운영정책 매니저",
        "프로세스 운영 매니저",
        "operations policy manager",
        "process operations manager"
      ],
      family: "PROCESS_POLICY_OPERATIONS",
      responsibilityHints: [
        "운영 정책과 예외 기준 정리",
        "업무 프로세스 표준화",
        "운영 가이드와 SOP 관리",
        "운영 이슈를 정책 개선안으로 연결"
      ],
      levelHints: [
        "주니어는 문서 업데이트와 기준 정리 비중이 큼",
        "시니어는 정책 설계와 구조적 개선안 도출 비중이 큼"
      ]
    },
    {
      id: "SERVICE_QUALITY_MANAGER",
      label: "서비스 품질 매니저",
      aliases: [
        "서비스 품질 매니저",
        "운영 품질 매니저",
        "quality operations manager",
        "service quality manager"
      ],
      family: "SERVICE_QUALITY_MONITORING",
      responsibilityHints: [
        "운영 품질 기준 점검",
        "오류·누락·지연 사례 모니터링",
        "품질 리포트와 개선 과제 운영",
        "품질 교육과 재발 방지 액션 관리"
      ],
      levelHints: [
        "주니어는 모니터링 실행과 결과 정리 비중이 큼",
        "시니어는 품질 기준 설계와 개선 우선순위 관리 비중이 큼"
      ]
    },
    {
      id: "OPERATIONS_ANALYST_MANAGER",
      label: "운영관리 매니저",
      aliases: [
        "운영관리 매니저",
        "운영 분석 매니저",
        "operations analytics manager",
        "operations control manager"
      ],
      family: "OPERATIONS_CONTROL_ANALYTICS",
      responsibilityHints: [
        "운영 KPI와 생산성 지표 관리",
        "대시보드와 성과 리뷰 운영",
        "병목과 비용 구조 분석",
        "운영 리소스 계획과 개선안 도출"
      ],
      levelHints: [
        "주니어는 리포트 작성과 데이터 정리 비중이 큼",
        "시니어는 통제 체계 설계와 경영 의사결정 지원 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_CONTROL_POINT",
      label: "주요 통제 지점",
      values: [
        "운영 정책과 처리 기준",
        "일일 실행 흐름과 작업 큐",
        "품질 기준과 오류·지연 모니터링",
        "KPI, 처리량, 생산성 지표"
      ]
    },
    {
      axisId: "MAIN_TIME_HORIZON",
      label: "주요 시간 범위",
      values: [
        "중장기 운영 기준과 구조 설계",
        "당일·주간 실행 운영",
        "상시 품질 감시와 재발 방지",
        "주간·월간 성과 통제와 계획"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "정책 문서, SOP, 운영 가이드",
        "운영 현황판, 배분안, 실행 리포트",
        "품질 점검표, 오류 분석, 개선 액션",
        "대시보드, KPI 리포트, 생산성 분석"
      ]
    },
    {
      axisId: "BOUNDARY_DIRECTION",
      label: "인접 직무로 기우는 방향",
      values: [
        "고객 응대가 많아지면 고객지원·CS 운영",
        "시스템 요구사항 조율이 커지면 서비스기획·운영기획",
        "현장 인력·동선 관리가 커지면 현장운영",
        "전사 성과·예산 통제가 커지면 경영기획·사업관리"
      ]
    }
  ],
  adjacentFamilies: [
    "고객지원(CS) 운영",
    "운영기획",
    "서비스기획",
    "현장운영",
    "물류운영",
    "QA / 테스트",
    "경영기획",
    "사업관리"
  ],
  boundaryHints: [
    "운영 이슈를 처리하더라도 핵심이 고객 문의 응대와 해결이라면 서비스운영보다 고객지원(CS) 운영으로 읽힙니다.",
    "정책과 기준을 정리하는 것보다 매일의 작업 배분, SLA 관리, 병목 해소 비중이 커지면 운영 실행·워크플로우 관리 쪽으로 이동합니다.",
    "운영 상태를 보는 것보다 오류·정확도·누락률을 집중 점검하면 품질·모니터링 운영으로 읽히는 힘이 강해집니다.",
    "당일 운영보다 KPI, 생산성, 처리량, 리소스 효율 분석이 더 중요하면 운영 통제·지표 관리로 이동합니다.",
    "운영 개선을 많이 하더라도 시스템 화면, 기능 요구사항, 사용자 흐름 정의가 중심이면 서비스기획이나 운영기획 경계가 강해집니다.",
    "현장 인력 스케줄, 공간 동선, 물리적 자원 배치 비중이 커지면 일반 서비스운영보다 현장운영·도메인 운영으로 이동할 수 있습니다.",
    "운영 지표를 다루더라도 범위가 전사 손익, 예산, 사업 포트폴리오까지 넓어지면 경영기획이나 사업관리로 읽힐 수 있습니다."
  ],
  summaryTemplate: "이 직무는 서비스가 정해진 기준대로 안정적으로 돌아가도록 운영 흐름을 관리하는 성격이 강합니다. 실제 역할은 정책·프로세스 설계, 일일 실행 통제, 품질 모니터링, 지표 기반 운영관리 중 어디에 무게가 실리느냐에 따라 다르게 읽힙니다. 반면 고객 응대, 시스템 기획, 현장 자원 운영, 전사 사업관리 비중이 커지면 각각 CS 운영, 서비스기획, 현장운영, 경영기획 경계로 읽힐 수 있습니다."
};
