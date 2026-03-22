export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "PRODUCTION_ENGINEERING",
  aliases: [
    "생산기술",
    "공정기술",
    "Manufacturing Engineering",
    "Production Engineering",
    "공정 설계",
    "라인 설계",
    "설비 셋업",
    "양산 기술",
    "공정 개발",
    "공정 조건 설정",
    "제조기술",
    "Process Engineering",
    "양산 이관",
    "Pilot 생산",
    "공정 조건 최적화"
  ],
  families: [
    {
      id: "process_design_setup",
      label: "공정 설계·라인 셋업",
      aliases: [
        "공정 설계",
        "라인 설계",
        "Process Design",
        "라인 셋업",
        "공정 구축",
        "양산 준비"
      ],
      strongSignals: [
        "신규 제품 양산 공정 설계",
        "공정 흐름(Flow) 및 작업 순서 정의",
        "라인 레이아웃 설계",
        "설비 선정 및 셋업",
        "작업 표준서(SOP) 초기 정의",
        "Pilot 생산 및 양산 이관 수행"
      ],
      mediumSignals: [
        "설비 사양 검토",
        "초기 공정 조건 설정",
        "양산성 검토",
        "공정 구축 일정 관리",
        "개발-생산 간 협의"
      ],
      boundarySignals: [
        "개선보다 신규 공정 구축 비중이 크면 이 family에 가깝다",
        "운영 문제 대응보다 초기 설계 비중이 크면 이 family에 가깝다",
        "품질 검사보다 생산 흐름 설계 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "process_optimization_improvement",
        "production_support_troubleshooting",
        "equipment_engineering"
      ],
      boundaryNote: "기존 공정을 개선하기보다 신규 공정을 설계하고 라인을 구축하는 책임이 커질수록 공정 설계·라인 셋업으로 읽힙니다. 반면 양산 이후 개선이나 문제 대응 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 제품 양산을 위한 공정과 라인을 설계하는 성격이 강합니다. 초기 공정 구조를 정의하는 역할이 핵심입니다. 반면 운영 개선이나 문제 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "process_optimization_improvement",
      label: "공정 최적화·개선",
      aliases: [
        "공정 개선",
        "공정 최적화",
        "Process Improvement",
        "생산성 개선",
        "Yield 개선",
        "공정 조건 최적화"
      ],
      strongSignals: [
        "수율(Yield) 개선 활동",
        "공정 조건 최적화",
        "불량 원인 분석 및 개선",
        "공정 병목 제거",
        "생산성 향상 프로젝트 수행",
        "공정 데이터 기반 개선안 도출"
      ],
      mediumSignals: [
        "공정 지표 분석",
        "개선 과제 관리",
        "표준 작업 개선",
        "공정 변수 테스트",
        "개선 결과 검증"
      ],
      boundarySignals: [
        "신규 설계보다 기존 공정 개선 비중이 크면 이 family에 가깝다",
        "단순 운영 대응보다 구조적 개선 비중이 크면 이 family에 가깝다",
        "품질 검사보다 공정 자체 개선 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "process_design_setup",
        "production_support_troubleshooting",
        "quality_engineering"
      ],
      boundaryNote: "공정을 새로 설계하기보다 기존 공정의 효율과 품질을 개선하는 책임이 커질수록 공정 최적화·개선으로 읽힙니다. 반면 초기 설계나 단기 문제 대응 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기존 생산 공정을 개선하고 최적화하는 성격이 강합니다. 수율과 생산성 향상이 핵심입니다. 반면 신규 공정 설계나 운영 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "production_support_troubleshooting",
      label: "양산 지원·문제 대응",
      aliases: [
        "양산 기술 지원",
        "생산 지원",
        "Troubleshooting",
        "공정 문제 대응",
        "라인 지원"
      ],
      strongSignals: [
        "양산 중 발생하는 공정 문제 원인 분석",
        "설비 및 공정 이상 대응",
        "생산 중단 이슈 긴급 대응",
        "현장 기술 지원",
        "재발 방지 대책 수립",
        "공정 안정화 활동"
      ],
      mediumSignals: [
        "현장 이슈 모니터링",
        "문제 발생 데이터 분석",
        "임시 조치 및 개선안 제시",
        "유관 부서 협업 대응",
        "문제 해결 리포트 작성"
      ],
      boundarySignals: [
        "장기 개선보다 단기 문제 해결 비중이 크면 이 family에 가깝다",
        "설계보다 현장 대응 비중이 크면 이 family에 가깝다",
        "정기 개선 프로젝트보다 긴급 대응 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "process_optimization_improvement",
        "process_design_setup",
        "production_management"
      ],
      boundaryNote: "공정을 구조적으로 개선하기보다 양산 중 발생하는 문제를 빠르게 해결하는 책임이 커질수록 양산 지원·문제 대응으로 읽힙니다. 반면 장기 개선이나 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 양산 과정에서 발생하는 공정 문제를 해결하고 생산을 안정화하는 성격이 강합니다. 현장 대응과 문제 해결이 핵심입니다. 반면 구조적 개선이나 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "manufacturing_system_standard",
      label: "제조 표준·시스템 구축",
      aliases: [
        "제조 표준화",
        "공정 표준",
        "MES 구축",
        "제조 시스템",
        "Manufacturing System",
        "공정 표준 관리"
      ],
      strongSignals: [
        "공정 표준(SOP) 수립 및 관리",
        "MES 등 제조 시스템 도입 및 운영 정의",
        "작업 기준 및 공정 조건 표준화",
        "데이터 기반 공정 관리 체계 구축",
        "공정 변경 관리 프로세스 설계",
        "표준 준수 체계 구축"
      ],
      mediumSignals: [
        "표준 문서 관리",
        "시스템 요구사항 정의",
        "표준 교육 및 전파",
        "데이터 수집 체계 정리",
        "표준 이탈 모니터링"
      ],
      boundarySignals: [
        "현장 대응보다 표준과 시스템 구축 비중이 크면 이 family에 가깝다",
        "개별 개선보다 전체 기준 정립 비중이 크면 이 family에 가깝다",
        "설비 제어보다 프로세스 표준 관리 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "process_design_setup",
        "process_optimization_improvement",
        "it_system"
      ],
      boundaryNote: "개별 공정 개선이나 문제 대응보다 전사 또는 공정 단위의 표준과 시스템을 구축하는 책임이 커질수록 제조 표준·시스템 구축으로 읽힙니다. 반면 현장 개선이나 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 제조 공정의 표준과 시스템을 구축하고 관리하는 성격이 강합니다. 일관된 공정 운영을 위한 기준 정의가 핵심입니다. 반면 현장 개선이나 문제 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "process_engineer",
      label: "공정기술 엔지니어",
      aliases: [
        "Process Engineer",
        "생산기술 엔지니어",
        "공정 엔지니어"
      ],
      family: "process_optimization_improvement",
      responsibilityHints: [
        "공정 조건 최적화",
        "수율 개선",
        "불량 원인 분석",
        "공정 개선 프로젝트"
      ],
      levelHints: [
        "데이터 기반으로 공정을 개선할 수 있다",
        "문제 원인을 구조적으로 분석할 수 있다"
      ]
    },
    {
      id: "manufacturing_engineer",
      label: "생산기술 엔지니어",
      aliases: [
        "Manufacturing Engineer",
        "생산기술 담당",
        "양산 기술 담당"
      ],
      family: "process_design_setup",
      responsibilityHints: [
        "공정 설계",
        "라인 구축",
        "설비 셋업",
        "양산 이관"
      ],
      levelHints: [
        "제품을 양산 가능한 공정으로 전환할 수 있다",
        "공정 전체 흐름을 설계할 수 있다"
      ]
    },
    {
      id: "troubleshooting_engineer",
      label: "생산 지원 엔지니어",
      aliases: [
        "Troubleshooting Engineer",
        "양산 지원 엔지니어",
        "라인 지원 엔지니어"
      ],
      family: "production_support_troubleshooting",
      responsibilityHints: [
        "공정 문제 대응",
        "현장 이슈 해결",
        "재발 방지 대책 수립",
        "생산 안정화"
      ],
      levelHints: [
        "현장 문제를 빠르게 파악하고 해결할 수 있다",
        "다양한 공정 변수의 영향을 이해할 수 있다"
      ]
    },
    {
      id: "manufacturing_system_engineer",
      label: "제조 시스템 담당자",
      aliases: [
        "MES 담당",
        "제조 시스템 엔지니어",
        "공정 표준 담당"
      ],
      family: "manufacturing_system_standard",
      responsibilityHints: [
        "MES 구축 및 운영 정의",
        "공정 표준 수립",
        "데이터 관리 체계 구축",
        "표준 준수 관리"
      ],
      levelHints: [
        "공정을 시스템과 연결해 관리할 수 있다",
        "표준을 통해 운영 일관성을 유지할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "lifecycle_stage",
      label: "공정 생애주기 단계",
      values: [
        "초기 설계 및 구축",
        "양산 안정화 및 개선",
        "문제 대응 및 유지",
        "표준 및 시스템화"
      ]
    },
    {
      axisId: "work_focus",
      label: "업무 중심",
      values: [
        "공정 구조 설계",
        "성능 개선",
        "현장 대응",
        "기준 및 시스템 구축"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "양산 준비 단계",
        "지속적 개선",
        "즉각 대응",
        "장기 표준화"
      ]
    }
  ],
  adjacentFamilies: [
    "생산관리",
    "품질",
    "설비기술",
    "R&D",
    "IT 시스템"
  ],
  boundaryHints: [
    "공정 설계와 양산 준비 비중이 커지면 공정 설계 쪽으로 읽힙니다.",
    "수율 개선과 생산성 향상 비중이 커지면 공정 개선으로 이동합니다.",
    "현장 문제 대응 비중이 커지면 양산 지원으로 해석됩니다.",
    "표준화와 시스템 구축 비중이 커지면 제조 시스템 쪽으로 읽힙니다.",
    "생산 일정이나 운영 관리 비중이 커지면 생산관리 직무와 경계가 가까워집니다."
  ],
  summaryTemplate: "생산기술 직무는 공정을 설계하고 안정화하며 개선하는 역할을 중심으로 합니다. 설계, 개선, 문제 대응, 표준화 중 어디에 중심이 있는지에 따라 역할이 달라집니다. 반면 운영 관리나 품질 검사 비중이 커지면 인접 직무로 읽힐 수 있습니다."
};
