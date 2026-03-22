export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "EQUIPMENT_MAINTENANCE",
  aliases: [
    "설비관리",
    "설비 유지보수",
    "설비 보전",
    "유지보수",
    "설비 엔지니어",
    "maintenance",
    "equipment maintenance",
    "facility maintenance",
    "plant maintenance",
    "maintenance engineer",
    "보전관리",
    "설비 운영"
  ],
  families: [
    {
      id: "PREVENTIVE_MAINTENANCE",
      label: "예방보전·정기점검",
      aliases: [
        "예방보전",
        "preventive maintenance",
        "정기점검",
        "PM",
        "planned maintenance"
      ],
      strongSignals: [
        "정기 점검 계획을 수립하고 설비 점검 수행",
        "고장 예방을 위한 유지보수 일정 관리",
        "설비 점검 체크리스트 기반 관리",
        "설비 상태 데이터를 기반으로 교체·정비 시점 결정",
        "고장 이력 분석을 통해 예방 활동 설계",
        "정기 보전 계획에 따라 설비 가동 안정성 확보"
      ],
      mediumSignals: [
        "설비 점검 기록 관리",
        "보전 이력 데이터 정리",
        "기본적인 부품 교체 및 유지보수",
        "설비 상태 모니터링"
      ],
      boundarySignals: [
        "고장 발생 후 즉각 대응 비중이 커지면 사후보전으로 이동",
        "설비 개선, 자동화 프로젝트 비중이 커지면 설비 개선·엔지니어링으로 이동",
        "단순 운영 및 사용 중심이면 생산 운영으로 이동"
      ],
      adjacentFamilies: [
        "CORRECTIVE_MAINTENANCE",
        "MAINTENANCE_ENGINEERING",
        "SHOPFLOOR_OPERATIONS"
      ],
      boundaryNote: "고장을 예방하기 위한 정기 점검과 계획 기반 유지보수가 중심이면 예방보전으로 읽힙니다. 반면 고장 대응이나 설비 개선 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 설비 고장을 예방하기 위한 정기 점검과 계획 기반 유지보수 성격이 강합니다. 반면 고장 대응이나 설비 개선 비중이 커지면 다른 설비관리 역할로 읽힐 수 있습니다."
    },
    {
      id: "CORRECTIVE_MAINTENANCE",
      label: "사후보전·고장대응",
      aliases: [
        "사후보전",
        "고장 대응",
        "breakdown maintenance",
        "corrective maintenance",
        "troubleshooting"
      ],
      strongSignals: [
        "설비 고장 발생 시 즉각적인 원인 파악 및 복구 수행",
        "라인 중단 최소화를 위한 긴급 대응",
        "고장 원인 분석 및 재발 방지 조치",
        "설비 트러블슈팅 및 긴급 수리 수행",
        "현장 중심 문제 해결",
        "설비 다운타임 최소화를 위한 대응"
      ],
      mediumSignals: [
        "고장 이력 관리",
        "간단한 예방 조치 수행",
        "현장 커뮤니케이션",
        "긴급 대응 프로세스 운영"
      ],
      boundarySignals: [
        "정기 점검 및 계획 수립 비중이 커지면 예방보전으로 이동",
        "설비 구조 개선 및 설계 변경 비중이 커지면 설비 개선·엔지니어링으로 이동",
        "품질 문제 원인 분석 비중이 커지면 품질관리로 이동"
      ],
      adjacentFamilies: [
        "PREVENTIVE_MAINTENANCE",
        "MAINTENANCE_ENGINEERING",
        "QUALITY_CONTROL"
      ],
      boundaryNote: "설비 고장 발생 후 빠르게 대응하고 복구하는 역할이 중심이면 사후보전으로 읽힙니다. 반면 예방 중심이나 구조 개선 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 설비 고장 발생 시 빠르게 대응하고 복구하는 성격이 강합니다. 반면 예방 활동이나 설비 개선 비중이 커지면 다른 설비관리 역할로 해석될 수 있습니다."
    },
    {
      id: "MAINTENANCE_ENGINEERING",
      label: "설비 개선·보전기술",
      aliases: [
        "설비 개선",
        "보전기술",
        "maintenance engineering",
        "equipment engineering",
        "설비 엔지니어링"
      ],
      strongSignals: [
        "설비 구조 개선 및 성능 향상 프로젝트 수행",
        "설비 자동화 및 효율화 설계",
        "설비 도입 및 개조(Modification) 검토",
        "고장 원인을 구조적으로 분석하고 설계 개선 적용",
        "설비 성능 KPI 개선",
        "신규 설비 투자 검토 및 기술 검증"
      ],
      mediumSignals: [
        "설비 데이터 분석",
        "개선 과제 도출",
        "테스트 및 검증 수행",
        "현장 적용 지원"
      ],
      boundarySignals: [
        "정기 점검과 유지보수 중심이면 예방보전으로 이동",
        "고장 대응 중심이면 사후보전으로 이동",
        "생산 공정 개선 중심이면 생산기술/공정으로 이동"
      ],
      adjacentFamilies: [
        "PREVENTIVE_MAINTENANCE",
        "CORRECTIVE_MAINTENANCE",
        "PROCESS_ENGINEERING"
      ],
      boundaryNote: "설비 자체를 개선하고 성능을 높이는 역할이 중심이면 설비 개선·보전기술로 읽힙니다. 반면 유지보수 실행 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 설비 구조를 개선하고 성능을 향상시키는 엔지니어링 성격이 강합니다. 반면 단순 유지보수나 고장 대응 비중이 커지면 다른 설비관리 역할로 읽힐 수 있습니다."
    },
    {
      id: "FACILITY_INFRA_MANAGEMENT",
      label: "설비 운영·인프라 관리",
      aliases: [
        "시설관리",
        "facility management",
        "유틸리티 관리",
        "plant facility",
        "인프라 관리"
      ],
      strongSignals: [
        "공장 설비(전기, 공조, 유틸리티 등) 운영 및 관리",
        "설비 가동 환경 유지 및 안정성 확보",
        "외주 업체 관리 및 점검",
        "설비 운영 비용 관리",
        "시설 관련 법규 및 안전 기준 준수 관리",
        "에너지 사용 및 효율 관리"
      ],
      mediumSignals: [
        "시설 점검 계획 수립",
        "운영 리포트 작성",
        "유틸리티 사용량 모니터링",
        "외부 협력사 커뮤니케이션"
      ],
      boundarySignals: [
        "개별 설비 고장 대응 비중이 커지면 사후보전으로 이동",
        "정밀 설비 개선 및 기술 개발 비중이 커지면 설비 엔지니어링으로 이동",
        "생산 라인 운영 비중이 커지면 생산관리로 이동"
      ],
      adjacentFamilies: [
        "CORRECTIVE_MAINTENANCE",
        "MAINTENANCE_ENGINEERING",
        "SHOPFLOOR_OPERATIONS"
      ],
      boundaryNote: "공장 인프라와 설비 환경을 안정적으로 운영하는 역할이 중심이면 설비 운영·인프라 관리로 읽힙니다. 반면 설비 기술 개선이나 고장 대응 중심이면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 공장 설비와 인프라를 안정적으로 운영하고 유지하는 성격이 강합니다. 반면 설비 개선이나 고장 대응 비중이 커지면 다른 설비관리 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "MAINTENANCE_TECHNICIAN",
      label: "설비 유지보수 담당",
      aliases: [
        "maintenance technician",
        "설비 보전 담당"
      ],
      family: "CORRECTIVE_MAINTENANCE",
      responsibilityHints: [
        "설비 고장 대응 및 수리",
        "현장 트러블슈팅",
        "고장 원인 분석",
        "설비 가동 유지"
      ],
      levelHints: [
        "현장 대응 경험 중요",
        "시니어는 복잡한 고장 원인 분석 및 해결 수행"
      ]
    },
    {
      id: "MAINTENANCE_PLANNER",
      label: "보전 계획 담당",
      aliases: [
        "maintenance planner",
        "보전 계획 담당"
      ],
      family: "PREVENTIVE_MAINTENANCE",
      responsibilityHints: [
        "정기 점검 및 유지보수 계획 수립",
        "보전 일정 관리",
        "설비 상태 데이터 분석",
        "예방보전 체계 운영"
      ],
      levelHints: [
        "데이터 기반 계획 수립 중요",
        "시니어는 전체 보전 전략 설계"
      ]
    },
    {
      id: "EQUIPMENT_ENGINEER",
      label: "설비 엔지니어",
      aliases: [
        "equipment engineer",
        "설비 엔지니어"
      ],
      family: "MAINTENANCE_ENGINEERING",
      responsibilityHints: [
        "설비 개선 및 성능 향상",
        "설비 설계 및 자동화 검토",
        "기술적 문제 해결",
        "신규 설비 도입 검토"
      ],
      levelHints: [
        "기술 이해와 분석 역량 중요",
        "시니어는 설비 전략 및 투자 리딩"
      ]
    },
    {
      id: "FACILITY_MANAGER",
      label: "시설 관리 담당",
      aliases: [
        "facility manager",
        "시설관리자"
      ],
      family: "FACILITY_INFRA_MANAGEMENT",
      responsibilityHints: [
        "공장 인프라 운영",
        "유틸리티 관리",
        "외주 업체 관리",
        "시설 안전 및 규정 준수"
      ],
      levelHints: [
        "운영 관리 경험 중요",
        "시니어는 전체 시설 운영 전략 관리"
      ]
    }
  ],
  axes: [
    {
      axisId: "MAINTENANCE_APPROACH",
      label: "보전 접근 방식",
      values: [
        "예방 중심",
        "고장 대응 중심",
        "구조 개선 중심",
        "운영 관리 중심"
      ]
    },
    {
      axisId: "WORK_FOCUS",
      label: "업무 초점",
      values: [
        "정기 점검 및 계획",
        "현장 문제 해결",
        "설비 성능 개선",
        "시설 운영 안정성"
      ]
    },
    {
      axisId: "TIME_HORIZON",
      label: "시간 관점",
      values: [
        "사전 예방",
        "즉각 대응",
        "중장기 개선",
        "지속 운영"
      ]
    }
  ],
  adjacentFamilies: [
    "PROCESS_ENGINEERING",
    "PRODUCTION_MANAGEMENT",
    "QUALITY_CONTROL"
  ],
  boundaryHints: [
    "정기 점검과 예방 활동 비중이 커지면 예방보전으로 읽힙니다.",
    "고장 발생 시 대응과 복구 비중이 커지면 사후보전으로 이동합니다.",
    "설비 구조 개선과 성능 향상 비중이 커지면 설비 엔지니어링으로 해석됩니다.",
    "공장 인프라와 유틸리티 운영 비중이 커지면 시설관리로 이동합니다.",
    "생산 라인 운영이나 공정 개선 비중이 커지면 생산관리 또는 공정 영역으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 설비의 안정적인 가동을 유지하기 위한 유지보수와 관리 성격이 강합니다. 다만 예방 중심, 고장 대응 중심, 설비 개선, 시설 운영에 따라 역할이 달라집니다. 반면 생산관리나 공정 개선 비중이 커지면 인접 직무로 해석될 수 있습니다."
};
