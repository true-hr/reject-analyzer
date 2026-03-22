export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "BACKOFFICE_OPERATIONS",
  aliases: [
    "백오피스 운영",
    "업무지원",
    "back office",
    "backoffice operations",
    "operations support",
    "운영 지원",
    "내부 운영",
    "사무 운영",
    "오퍼레이션 지원",
    "업무 처리 운영",
    "운영 서포트"
  ],
  families: [
    {
      id: "TRANSACTION_PROCESSING",
      label: "업무 처리/정산형",
      aliases: [
        "transaction processing",
        "order processing",
        "settlement operations"
      ],
      strongSignals: [
        "주문/신청/계약 데이터 처리",
        "정산 및 지급 계산 업무",
        "수기 데이터 입력 및 검증",
        "운영 시스템 내 업무 처리",
        "정산 오류 수정",
        "일일 처리량 관리",
        "정형화된 업무 반복 처리"
      ],
      mediumSignals: [
        "엑셀 기반 데이터 정리",
        "운영 툴 사용",
        "업무 체크리스트 기반 처리",
        "처리 결과 리포트",
        "단순 데이터 검증"
      ],
      boundarySignals: [
        "업무 프로세스 개선 비중이 커지면 프로세스 운영/개선형으로 이동",
        "데이터 분석 및 지표 설계 비중이 커지면 운영 분석형으로 이동",
        "외부 고객 응대 비중이 커지면 고객지원 경계로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_IMPROVEMENT",
        "OPERATIONS_ANALYTICS",
        "INTERNAL_COORDINATION"
      ],
      boundaryNote: "정형화된 업무를 정확하게 처리하고 정산/데이터를 다루는 비중이 크면 업무 처리/정산형으로 읽힙니다. 반면 개선이나 분석 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 반복적이고 정형화된 운영 업무를 정확하게 처리하는 성격이 강합니다. 반면 프로세스 개선이나 데이터 분석 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "PROCESS_IMPROVEMENT",
      label: "프로세스 운영/개선형",
      aliases: [
        "operations improvement",
        "process management",
        "operations excellence"
      ],
      strongSignals: [
        "업무 프로세스 설계 및 개선",
        "운영 효율화 프로젝트 수행",
        "업무 자동화 기획",
        "운영 매뉴얼 및 가이드라인 정비",
        "비효율 제거 및 흐름 개선",
        "툴 도입 및 운영 체계 개선",
        "업무 표준화"
      ],
      mediumSignals: [
        "운영 데이터 기반 개선 제안",
        "내부 협업 조율",
        "업무 플로우 문서화",
        "운영 리포트 작성",
        "이슈 대응 프로세스 정리"
      ],
      boundarySignals: [
        "단순 업무 처리 비중이 크면 업무 처리/정산형으로 이동",
        "데이터 기반 분석 비중이 커지면 운영 분석형으로 이동",
        "조직 간 커뮤니케이션 비중이 커지면 내부 커뮤니케이션형으로 이동"
      ],
      adjacentFamilies: [
        "TRANSACTION_PROCESSING",
        "OPERATIONS_ANALYTICS",
        "INTERNAL_COORDINATION"
      ],
      boundaryNote: "운영 효율을 높이기 위해 프로세스를 설계하고 개선하는 역할이 중심이면 프로세스 운영/개선형으로 읽힙니다. 반면 단순 처리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 프로세스를 개선하고 효율을 높이는 성격이 강합니다. 반면 반복 처리 업무 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "OPERATIONS_ANALYTICS",
      label: "운영 분석형",
      aliases: [
        "operations analyst",
        "ops analytics",
        "operations data analysis"
      ],
      strongSignals: [
        "운영 데이터 분석",
        "처리량/오류율 등 운영 지표 관리",
        "운영 성과 리포트 작성",
        "이슈 발생 원인 분석",
        "데이터 기반 개선안 도출",
        "대시보드 활용",
        "운영 KPI 정의"
      ],
      mediumSignals: [
        "엑셀/SQL 활용",
        "지표 모니터링",
        "리포트 자동화",
        "데이터 정리",
        "성과 공유"
      ],
      boundarySignals: [
        "단순 데이터 처리 비중이 크면 업무 처리/정산형으로 이동",
        "프로세스 설계 비중이 커지면 프로세스 운영/개선형으로 이동",
        "비즈니스 전략 분석 비중이 커지면 데이터분석 직무 경계로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_IMPROVEMENT",
        "TRANSACTION_PROCESSING",
        "INTERNAL_COORDINATION"
      ],
      boundaryNote: "운영 데이터를 기반으로 문제를 분석하고 개선 방향을 도출하면 운영 분석형으로 읽힙니다. 반면 실행이나 처리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 데이터를 분석하고 개선 방향을 도출하는 성격이 강합니다. 반면 단순 처리나 프로세스 설계 중심으로 이동하면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "INTERNAL_COORDINATION",
      label: "내부 커뮤니케이션/지원형",
      aliases: [
        "operations support coordinator",
        "internal operations",
        "coordination operations"
      ],
      strongSignals: [
        "내부 부서 간 업무 조율",
        "운영 이슈 전달 및 해결 지원",
        "요청사항 접수 및 처리",
        "운영 커뮤니케이션 허브 역할",
        "내부 SLA 관리",
        "업무 진행 상황 트래킹",
        "운영 지원 업무 수행"
      ],
      mediumSignals: [
        "이메일/슬랙 커뮤니케이션",
        "요청 관리 시스템 사용",
        "업무 일정 관리",
        "이슈 로그 관리",
        "협업 회의 참여"
      ],
      boundarySignals: [
        "단순 업무 처리 비중이 크면 업무 처리/정산형으로 이동",
        "프로세스 개선 비중이 커지면 프로세스 운영/개선형으로 이동",
        "외부 고객 응대 비중이 커지면 고객지원 경계로 이동"
      ],
      adjacentFamilies: [
        "TRANSACTION_PROCESSING",
        "PROCESS_IMPROVEMENT",
        "OPERATIONS_ANALYTICS"
      ],
      boundaryNote: "내부 조직 간 커뮤니케이션과 운영 지원 역할이 중심이면 내부 커뮤니케이션/지원형으로 읽힙니다. 반면 처리나 개선 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 내부 조직 간 업무를 조율하고 운영을 지원하는 성격이 강합니다. 반면 단순 처리나 프로세스 개선 비중이 커지면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "OPERATIONS_SUPPORT_SPECIALIST",
      label: "운영 지원 담당자",
      aliases: [
        "operations support",
        "backoffice specialist"
      ],
      family: "TRANSACTION_PROCESSING",
      responsibilityHints: [
        "업무 처리",
        "데이터 입력",
        "정산 업무",
        "운영 지원"
      ],
      levelHints: [
        "주니어는 처리 업무 중심이고",
        "시니어는 업무 검증 및 프로세스 개선 비중이 커집니다"
      ]
    },
    {
      id: "OPERATIONS_MANAGER",
      label: "운영 매니저",
      aliases: [
        "operations manager"
      ],
      family: "PROCESS_IMPROVEMENT",
      responsibilityHints: [
        "프로세스 개선",
        "운영 효율화",
        "정책 정비",
        "업무 구조 설계"
      ],
      levelHints: [
        "초기에는 실행과 개선을 병행하고",
        "상위 레벨에서는 운영 구조 설계 비중이 커집니다"
      ]
    },
    {
      id: "OPERATIONS_ANALYST",
      label: "운영 분석가",
      aliases: [
        "operations analyst"
      ],
      family: "OPERATIONS_ANALYTICS",
      responsibilityHints: [
        "데이터 분석",
        "지표 관리",
        "리포트 작성",
        "개선안 도출"
      ],
      levelHints: [
        "주니어는 데이터 정리 중심이고",
        "시니어는 전략적 인사이트 도출 비중이 커집니다"
      ]
    },
    {
      id: "OPERATIONS_COORDINATOR",
      label: "운영 코디네이터",
      aliases: [
        "operations coordinator"
      ],
      family: "INTERNAL_COORDINATION",
      responsibilityHints: [
        "내부 커뮤니케이션",
        "이슈 조율",
        "업무 요청 관리",
        "운영 지원"
      ],
      levelHints: [
        "주니어는 요청 처리 중심이고",
        "시니어는 조율 및 관리 책임 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "WORK_FOCUS",
      label: "업무 중심",
      values: [
        "반복 처리",
        "프로세스 개선",
        "데이터 분석",
        "커뮤니케이션/조율"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "처리된 업무 결과",
        "개선된 프로세스",
        "분석 리포트",
        "조율된 업무 흐름"
      ]
    },
    {
      axisId: "IMPACT_SCOPE",
      label: "영향 범위",
      values: [
        "개별 업무 단위",
        "운영 프로세스",
        "운영 성과",
        "조직 간 협업"
      ]
    },
    {
      axisId: "EXECUTION_VS_DESIGN",
      label: "실행 vs 설계",
      values: [
        "실행 중심",
        "개선 실행 중심",
        "분석 중심",
        "조율 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "고객지원",
    "데이터분석",
    "프로덕트매니지먼트",
    "재무/정산"
  ],
  boundaryHints: [
    "정형화된 업무 처리 비중이 커지면 업무 처리/정산형으로 읽힙니다.",
    "프로세스 개선과 효율화 비중이 커지면 프로세스 운영/개선형으로 이동합니다.",
    "데이터 분석과 지표 관리 비중이 커지면 운영 분석형으로 이동합니다.",
    "내부 커뮤니케이션과 조율 비중이 커지면 내부 커뮤니케이션/지원형으로 이동합니다.",
    "외부 고객 응대 중심이면 고객지원 직무로 해석될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 내부 운영을 지원하고 업무를 처리하는 백오피스 성격이 강합니다. 처리, 개선, 분석, 조율 중 어디에 집중하느냐에 따라 역할이 나뉩니다. 반면 외부 고객 응대나 전략 중심 역할이 커지면 인접 직무로 해석될 수 있습니다."
};
