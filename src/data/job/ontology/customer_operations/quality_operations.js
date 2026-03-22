export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "QUALITY_OPERATIONS",
  aliases: [
    "품질 운영",
    "품질 관리",
    "quality operations",
    "quality management",
    "QA 운영",
    "서비스 품질 관리",
    "운영 품질 개선",
    "CS 품질 관리",
    "품질 모니터링",
    "quality assurance operations",
    "품질 분석"
  ],
  families: [
    {
      id: "QUALITY_MONITORING",
      label: "품질 모니터링형",
      aliases: [
        "quality monitoring",
        "qa monitoring",
        "call monitoring"
      ],
      strongSignals: [
        "상담/응대 품질 모니터링",
        "콜/채팅 녹취 리뷰",
        "품질 평가 기준에 따른 점검",
        "QA 스코어링 수행",
        "운영 품질 샘플링 점검",
        "품질 이슈 식별",
        "품질 점검 리포트 작성"
      ],
      mediumSignals: [
        "QA 체크리스트 활용",
        "정기 품질 점검",
        "운영 로그 리뷰",
        "품질 결과 공유",
        "기본 피드백 제공"
      ],
      boundarySignals: [
        "교육/코칭 비중이 커지면 품질 개선/코칭형으로 이동",
        "지표 분석 및 개선 설계 비중이 커지면 품질 분석/전략형으로 이동",
        "프로세스 설계 비중이 커지면 품질 프로세스 설계형으로 이동"
      ],
      adjacentFamilies: [
        "QUALITY_COACHING",
        "QUALITY_ANALYTICS",
        "QUALITY_PROCESS_DESIGN"
      ],
      boundaryNote: "운영 결과를 모니터링하고 품질을 평가하는 활동이 중심이면 품질 모니터링형으로 읽힙니다. 반면 개선 활동이나 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 품질을 점검하고 문제를 식별하는 성격이 강합니다. 반면 교육, 개선 설계, 프로세스 구축 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "QUALITY_COACHING",
      label: "품질 개선/코칭형",
      aliases: [
        "quality coaching",
        "qa coaching",
        "quality improvement"
      ],
      strongSignals: [
        "상담사/운영자 피드백 제공",
        "품질 개선 코칭 세션 진행",
        "운영자 교육 프로그램 운영",
        "품질 개선 액션 플랜 수립",
        "개별 퍼포먼스 개선 지원",
        "품질 기준 교육",
        "베스트 케이스 공유"
      ],
      mediumSignals: [
        "QA 결과 기반 피드백",
        "교육 자료 제작",
        "운영자 평가 지원",
        "개선 가이드 제공",
        "워크샵 진행"
      ],
      boundarySignals: [
        "단순 점검 비중이 크면 품질 모니터링형으로 이동",
        "지표 기반 분석 비중이 커지면 품질 분석/전략형으로 이동",
        "프로세스 설계 및 표준화 비중이 커지면 품질 프로세스 설계형으로 이동"
      ],
      adjacentFamilies: [
        "QUALITY_MONITORING",
        "QUALITY_ANALYTICS",
        "QUALITY_PROCESS_DESIGN"
      ],
      boundaryNote: "운영자의 품질을 개선하기 위한 피드백과 교육이 중심이면 품질 개선/코칭형으로 읽힙니다. 반면 점검이나 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영자의 품질을 개선하기 위해 코칭과 교육을 수행하는 성격이 강합니다. 반면 단순 점검이나 분석 중심으로 이동하면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "QUALITY_ANALYTICS",
      label: "품질 분석/전략형",
      aliases: [
        "quality analytics",
        "quality strategy",
        "qa analyst"
      ],
      strongSignals: [
        "품질 지표 설계 및 정의",
        "품질 데이터 분석",
        "품질 개선 전략 수립",
        "이슈 발생 원인 분석",
        "품질 트렌드 분석",
        "품질 KPI 관리",
        "데이터 기반 개선안 도출"
      ],
      mediumSignals: [
        "리포트 자동화",
        "지표 모니터링",
        "대시보드 활용",
        "운영 데이터 정리",
        "성과 분석"
      ],
      boundarySignals: [
        "단순 점검 및 평가 비중이 크면 품질 모니터링형으로 이동",
        "코칭 및 교육 비중이 커지면 품질 개선/코칭형으로 이동",
        "프로세스 설계 및 시스템 개선 비중이 커지면 품질 프로세스 설계형으로 이동"
      ],
      adjacentFamilies: [
        "QUALITY_MONITORING",
        "QUALITY_COACHING",
        "QUALITY_PROCESS_DESIGN"
      ],
      boundaryNote: "품질 데이터를 기반으로 문제를 분석하고 개선 방향을 설계하면 품질 분석/전략형으로 읽힙니다. 반면 실행 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 품질 데이터를 분석하고 개선 전략을 수립하는 성격이 강합니다. 반면 점검이나 코칭 실행 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "QUALITY_PROCESS_DESIGN",
      label: "품질 프로세스 설계형",
      aliases: [
        "quality process design",
        "qa process",
        "quality system design"
      ],
      strongSignals: [
        "품질 운영 프로세스 설계",
        "QA 기준 및 정책 정의",
        "품질 평가 체계 구축",
        "운영 매뉴얼 및 가이드라인 설계",
        "품질 관리 시스템 개선",
        "운영 프로세스 표준화",
        "툴 및 시스템 도입 설계"
      ],
      mediumSignals: [
        "운영 정책 문서화",
        "프로세스 개선 제안",
        "협업 조직 커뮤니케이션",
        "품질 리포트 구조 설계",
        "업무 플로우 정리"
      ],
      boundarySignals: [
        "데이터 분석 중심이면 품질 분석/전략형으로 이동",
        "현장 피드백 및 교육 중심이면 품질 개선/코칭형으로 이동",
        "단순 점검 중심이면 품질 모니터링형으로 이동"
      ],
      adjacentFamilies: [
        "QUALITY_ANALYTICS",
        "QUALITY_COACHING",
        "QUALITY_MONITORING"
      ],
      boundaryNote: "품질 기준과 운영 프로세스를 설계하고 체계를 만드는 역할이 중심이면 품질 프로세스 설계형으로 읽힙니다. 반면 실행이나 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 품질 관리 체계를 설계하고 운영 프로세스를 구조화하는 성격이 강합니다. 반면 실행 점검이나 분석 중심으로 이동하면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "QA_MONITOR",
      label: "QA 모니터",
      aliases: [
        "qa monitor",
        "quality monitor"
      ],
      family: "QUALITY_MONITORING",
      responsibilityHints: [
        "상담 품질 점검",
        "녹취 리뷰",
        "QA 평가 수행",
        "품질 리포트 작성"
      ],
      levelHints: [
        "주니어는 점검 수행 중심이고",
        "시니어는 평가 기준 개선 비중이 커집니다"
      ]
    },
    {
      id: "QA_COACH",
      label: "QA 코치",
      aliases: [
        "qa coach",
        "quality coach"
      ],
      family: "QUALITY_COACHING",
      responsibilityHints: [
        "운영자 코칭",
        "피드백 제공",
        "교육 프로그램 운영",
        "품질 개선 지원"
      ],
      levelHints: [
        "주니어는 코칭 지원 중심이고",
        "시니어는 개선 전략과 교육 체계 설계 비중이 커집니다"
      ]
    },
    {
      id: "QUALITY_ANALYST",
      label: "품질 분석가",
      aliases: [
        "quality analyst",
        "qa analyst"
      ],
      family: "QUALITY_ANALYTICS",
      responsibilityHints: [
        "품질 데이터 분석",
        "지표 설계",
        "이슈 원인 분석",
        "개선 전략 수립"
      ],
      levelHints: [
        "주니어는 데이터 분석 지원 중심이고",
        "시니어는 전략 수립과 의사결정 지원 비중이 커집니다"
      ]
    },
    {
      id: "QA_PROCESS_MANAGER",
      label: "QA 프로세스 매니저",
      aliases: [
        "qa process manager",
        "quality manager"
      ],
      family: "QUALITY_PROCESS_DESIGN",
      responsibilityHints: [
        "품질 프로세스 설계",
        "운영 기준 정의",
        "정책 수립",
        "시스템 개선"
      ],
      levelHints: [
        "초기에는 운영 개선 중심이고",
        "상위 레벨에서는 조직 전체 품질 체계 설계 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "QUALITY_ACTIVITY_FOCUS",
      label: "품질 활동 중심",
      values: [
        "점검/평가",
        "코칭/교육",
        "분석/전략",
        "프로세스 설계"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "품질 점검 결과",
        "개선된 운영 퍼포먼스",
        "품질 분석 리포트",
        "운영 기준 및 프로세스"
      ]
    },
    {
      axisId: "IMPACT_SCOPE",
      label: "영향 범위",
      values: [
        "개별 운영 건",
        "운영자 퍼포먼스",
        "조직 품질 지표",
        "전체 운영 구조"
      ]
    },
    {
      axisId: "EXECUTION_VS_DESIGN",
      label: "실행 vs 설계",
      values: [
        "실행 중심",
        "개선 실행 중심",
        "분석 중심",
        "설계 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "고객지원",
    "운영관리",
    "데이터분석",
    "교육/트레이닝"
  ],
  boundaryHints: [
    "품질 점검과 평가 비중이 커지면 품질 모니터링형으로 읽힙니다.",
    "운영자 코칭과 교육 비중이 커지면 품질 개선/코칭형으로 이동합니다.",
    "지표 분석과 전략 수립 비중이 커지면 품질 분석/전략형으로 이동합니다.",
    "운영 기준과 프로세스 설계 비중이 커지면 품질 프로세스 설계형으로 이동합니다.",
    "단순 고객 응대 중심이면 고객지원 직무로 해석될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 운영 품질을 관리하고 개선하는 역할 성격이 강합니다. 점검, 코칭, 분석, 프로세스 설계 중 어디에 집중하느냐에 따라 역할이 나뉩니다. 반면 단순 고객 응대나 일반 운영 관리 비중이 커지면 인접 직무로 해석될 수 있습니다."
};
