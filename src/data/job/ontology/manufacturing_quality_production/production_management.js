export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "PRODUCTION_MANAGEMENT",
  aliases: [
    "생산관리",
    "제조관리",
    "생산 운영",
    "production management",
    "manufacturing operations",
    "production control",
    "공정관리",
    "라인관리",
    "생산계획",
    "production planning",
    "shopfloor management"
  ],
  families: [
    {
      id: "PRODUCTION_PLANNING_CONTROL",
      label: "생산계획·통제",
      aliases: [
        "생산계획",
        "production planning",
        "production control",
        "MPS",
        "생산 스케줄링"
      ],
      strongSignals: [
        "생산 계획(MPS) 수립 및 일정 스케줄링 수행",
        "수요 대비 생산능력(Capacity) 검토 후 계획 조정",
        "납기 준수를 위한 생산 순서 및 우선순위 설계",
        "계획 대비 실적 차이(Variance) 분석 및 재계획 수행",
        "자재 수급 상황을 반영한 생산 일정 변경",
        "ERP/MRP 기반 생산 계획 운영"
      ],
      mediumSignals: [
        "라인별 부하 관리",
        "계획 정확도 관리",
        "영업·구매와 일정 조율",
        "생산 KPI 모니터링"
      ],
      boundarySignals: [
        "현장 인력 관리와 실시간 운영 대응 비중이 커지면 현장 운영으로 이동",
        "공정 개선 및 설비 최적화 비중이 커지면 공정 개선으로 이동",
        "재고·물류 흐름 관리 비중이 커지면 SCM으로 이동"
      ],
      adjacentFamilies: [
        "SHOPFLOOR_EXECUTION",
        "PROCESS_IMPROVEMENT",
        "SCM"
      ],
      boundaryNote: "생산 일정과 계획을 설계하고 통제하는 역할이 중심이면 생산계획·통제로 읽힙니다. 반면 현장 실행이나 공정 개선 비중이 커지면 다른 생산관리 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 생산 계획과 스케줄을 설계하고 통제하는 성격이 강합니다. 반면 현장 운영이나 공정 개선 비중이 커지면 다른 생산관리 역할로 읽힐 수 있습니다."
    },
    {
      id: "SHOPFLOOR_EXECUTION",
      label: "현장 실행·라인 운영",
      aliases: [
        "라인관리",
        "현장관리",
        "production supervisor",
        "shopfloor control",
        "manufacturing execution"
      ],
      strongSignals: [
        "생산 라인 운영 및 작업자 배치 직접 관리",
        "일일 생산 실적 및 목표 달성 관리",
        "설비 이상, 생산 지연 등 현장 이슈 즉각 대응",
        "작업 표준 준수 및 안전 관리",
        "불량 발생 시 즉시 조치 및 재작업 지시",
        "현장 중심 의사결정 및 실행 관리"
      ],
      mediumSignals: [
        "작업 지시 및 실적 기록 관리",
        "현장 커뮤니케이션",
        "라인 효율 모니터링",
        "기본적인 개선 활동 참여"
      ],
      boundarySignals: [
        "생산 계획 수립 및 일정 설계 비중이 커지면 생산계획으로 이동",
        "공정 개선 및 구조적 문제 해결 비중이 커지면 공정 개선으로 이동",
        "품질 기준 관리 및 분석 비중이 커지면 품질관리로 이동"
      ],
      adjacentFamilies: [
        "PRODUCTION_PLANNING_CONTROL",
        "PROCESS_IMPROVEMENT",
        "QUALITY_CONTROL"
      ],
      boundaryNote: "생산 현장에서 실행과 운영을 직접 관리하면 현장 실행·라인 운영으로 읽힙니다. 반면 계획 설계나 공정 개선 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 생산 현장에서 실제 실행과 운영을 관리하는 성격이 강합니다. 반면 계획 수립이나 공정 개선 비중이 커지면 다른 생산관리 역할로 해석될 수 있습니다."
    },
    {
      id: "PROCESS_IMPROVEMENT",
      label: "공정 개선·생산성 향상",
      aliases: [
        "공정개선",
        "생산성 향상",
        "process improvement",
        "manufacturing engineering",
        "lean manufacturing"
      ],
      strongSignals: [
        "생산 공정의 병목 구간 분석 및 개선 수행",
        "생산성 향상 및 원가 절감을 위한 개선 프로젝트 리딩",
        "작업 표준 및 공정 흐름 재설계",
        "설비 도입 및 자동화 검토",
        "Lean, Six Sigma 기반 개선 활동 수행",
        "공정 데이터 기반 문제 원인 분석 및 개선 적용"
      ],
      mediumSignals: [
        "개선 과제 도출 및 실행",
        "공정 KPI 관리",
        "현장 협업을 통한 개선 적용",
        "테스트 및 검증 수행"
      ],
      boundarySignals: [
        "현장 운영과 인력 관리 비중이 커지면 현장 운영으로 이동",
        "생산 계획 및 스케줄링 비중이 커지면 생산계획으로 이동",
        "품질 기준 및 불량 분석 비중이 커지면 품질관리로 이동"
      ],
      adjacentFamilies: [
        "SHOPFLOOR_EXECUTION",
        "PRODUCTION_PLANNING_CONTROL",
        "QUALITY_CONTROL"
      ],
      boundaryNote: "공정 자체를 개선하고 생산성을 높이는 역할이 중심이면 공정 개선으로 읽힙니다. 반면 실행 운영이나 계획 수립 비중이 커지면 다른 생산관리 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 생산 공정을 분석하고 개선해 효율을 높이는 성격이 강합니다. 반면 현장 운영이나 생산 계획 비중이 커지면 다른 생산관리 역할로 읽힐 수 있습니다."
    },
    {
      id: "PRODUCTION_COORDINATION",
      label: "생산 조정·유관부서 협업",
      aliases: [
        "생산 조정",
        "production coordination",
        "operations coordination",
        "생산 커뮤니케이션"
      ],
      strongSignals: [
        "영업, 구매, 품질 등 유관부서와 생산 일정 조율",
        "납기 변경, 긴급 오더 대응을 위한 생산 재조정",
        "부서 간 정보 정합성 확보 및 커뮤니케이션 허브 역할",
        "생산 관련 이슈를 종합하여 의사결정 지원",
        "다수 이해관계자 간 우선순위 조정",
        "생산 관련 리스크를 사전에 공유하고 대응"
      ],
      mediumSignals: [
        "회의 운영 및 커뮤니케이션 관리",
        "이슈 트래킹 및 공유",
        "간단한 데이터 정리 및 보고",
        "프로세스 흐름 이해 기반 조율"
      ],
      boundarySignals: [
        "직접 생산 계획 수립 비중이 커지면 생산계획으로 이동",
        "현장 실행 및 라인 관리 비중이 커지면 현장 운영으로 이동",
        "전사 프로세스 설계 및 개선 비중이 커지면 생산기획/SCM 전략으로 이동"
      ],
      adjacentFamilies: [
        "PRODUCTION_PLANNING_CONTROL",
        "SHOPFLOOR_EXECUTION",
        "SCM"
      ],
      boundaryNote: "유관부서 간 생산 관련 의사결정과 조율 역할이 중심이면 생산 조정으로 읽힙니다. 반면 직접 계획 수립이나 현장 운영 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 생산과 관련된 여러 부서 간 조율과 커뮤니케이션을 통해 흐름을 맞추는 성격이 강합니다. 반면 직접 계획 수립이나 현장 운영 비중이 커지면 다른 생산관리 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PRODUCTION_PLANNER",
      label: "생산계획 담당",
      aliases: [
        "production planner",
        "생산계획 담당"
      ],
      family: "PRODUCTION_PLANNING_CONTROL",
      responsibilityHints: [
        "생산 계획 및 스케줄 수립",
        "수요와 생산능력 조율",
        "납기 관리",
        "계획 대비 실적 분석"
      ],
      levelHints: [
        "주니어는 데이터 기반 계획 지원",
        "시니어는 전체 생산 계획 구조 설계 및 조정"
      ]
    },
    {
      id: "PRODUCTION_SUPERVISOR",
      label: "생산 라인 관리자",
      aliases: [
        "production supervisor",
        "라인 관리자"
      ],
      family: "SHOPFLOOR_EXECUTION",
      responsibilityHints: [
        "생산 라인 운영 및 인력 관리",
        "생산 실적 관리",
        "현장 문제 대응",
        "안전 및 품질 관리"
      ],
      levelHints: [
        "현장 경험 중요",
        "시니어는 다수 라인 및 전체 운영 관리"
      ]
    },
    {
      id: "PROCESS_ENGINEER",
      label: "공정 개선 엔지니어",
      aliases: [
        "process engineer",
        "생산기술 엔지니어"
      ],
      family: "PROCESS_IMPROVEMENT",
      responsibilityHints: [
        "공정 분석 및 개선",
        "생산성 향상 프로젝트 수행",
        "설비 및 공정 최적화",
        "데이터 기반 개선 실행"
      ],
      levelHints: [
        "문제 해결 및 분석 역량 중요",
        "시니어는 전사 개선 프로젝트 리딩"
      ]
    },
    {
      id: "PRODUCTION_COORDINATOR",
      label: "생산 조정 담당",
      aliases: [
        "production coordinator",
        "operations coordinator"
      ],
      family: "PRODUCTION_COORDINATION",
      responsibilityHints: [
        "유관부서 간 생산 일정 조율",
        "납기 및 이슈 대응 조정",
        "커뮤니케이션 허브 역할",
        "생산 관련 정보 통합 관리"
      ],
      levelHints: [
        "커뮤니케이션과 조율 능력 중요",
        "시니어는 복잡한 이해관계 조정 및 의사결정 지원"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "핵심 초점",
      values: [
        "생산 계획 및 통제",
        "현장 실행 및 운영",
        "공정 개선 및 효율화",
        "부서 간 조정 및 협업"
      ]
    },
    {
      axisId: "WORK_LAYER",
      label: "업무 레이어",
      values: [
        "계획 설계 레벨",
        "현장 실행 레벨",
        "구조 개선 레벨",
        "조정·커뮤니케이션 레벨"
      ]
    },
    {
      axisId: "PROBLEM_SOLVING_STYLE",
      label: "문제 해결 방식",
      values: [
        "계획 재조정",
        "현장 즉시 대응",
        "원인 분석 후 구조 개선",
        "이해관계자 간 조율"
      ]
    }
  ],
  adjacentFamilies: [
    "SCM",
    "QUALITY_CONTROL",
    "PROCESS_ENGINEERING"
  ],
  boundaryHints: [
    "생산 계획과 스케줄 수립 비중이 커지면 생산계획으로 읽힙니다.",
    "현장 운영과 인력 관리 비중이 커지면 현장 운영으로 이동합니다.",
    "공정 분석과 개선 프로젝트 비중이 커지면 공정 개선으로 해석됩니다.",
    "부서 간 일정 조율과 커뮤니케이션 비중이 커지면 생산 조정으로 읽힙니다.",
    "재고 및 공급 흐름 관리 비중이 커지면 SCM으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 생산을 계획하고 실행하며 개선하는 생산관리 성격이 강합니다. 다만 계획 중심, 현장 운영 중심, 공정 개선, 조정 역할에 따라 실제 수행 방식이 달라집니다. 반면 SCM이나 품질 중심 비중이 커지면 인접 직무로 해석될 수 있습니다."
};
