export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "PROCESS_ENGINEERING",
  aliases: [
    "공정기술",
    "공정엔지니어",
    "Process Engineering",
    "Process Engineer",
    "제조공정",
    "공정개발",
    "공정개선",
    "공정설계",
    "양산공정",
    "생산기술",
    "Manufacturing Engineering",
    "ME Engineer",
    "라인 셋업",
    "공정 최적화"
  ],
  families: [
    {
      id: "pe_process_design",
      label: "공정설계/양산이관",
      aliases: [
        "공정설계",
        "공정개발",
        "양산이관",
        "Process Design",
        "NPI 공정",
        "New Product Introduction"
      ],
      strongSignals: [
        "신제품 양산을 위한 공정 흐름과 작업 순서를 설계한다",
        "라인 구성, 설비 배치, 공정 조건을 정의한다",
        "파일럿 생산, 시생산을 통해 공정을 검증하고 양산으로 이관한다",
        "공정 조건(온도, 압력, 시간 등)을 설정하고 표준화한다",
        "작업 표준서, 공정 기준서, SOP를 작성한다"
      ],
      mediumSignals: [
        "설비 선정과 공정 구성 검토",
        "공정 검증 테스트와 결과 분석",
        "신제품 공정 리스크 사전 검토",
        "양산 준비 일정 관리"
      ],
      boundarySignals: [
        "기존 공정의 불량 개선과 생산성 향상 비중이 커지면 공정개선으로 이동한다",
        "설비 자체 설계와 자동화 개발 비중이 커지면 설비/자동화 엔지니어링으로 이동한다",
        "품질 기준 설정과 불량 원인 분석이 중심이면 품질 쪽으로 이동한다"
      ],
      adjacentFamilies: [
        "pe_process_improvement",
        "equipment_engineering_interface",
        "quality_engineering_interface"
      ],
      boundaryNote: "이 family는 공정을 새로 설계하고 양산으로 넘기는 역할입니다. 기존 공정을 개선하기보다 공정 구조를 처음부터 정의하는 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 제품 양산을 위한 공정을 설계하는 성격이 강합니다. 공정 흐름 정의와 양산 이관이 핵심이라면 이 family에 가깝습니다. 반면 기존 공정 개선이나 품질 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "pe_process_improvement",
      label: "공정개선/수율개선",
      aliases: [
        "공정개선",
        "수율개선",
        "공정최적화",
        "Process Improvement",
        "Yield Improvement",
        "생산성 개선"
      ],
      strongSignals: [
        "불량 원인을 분석하고 공정 조건을 개선한다",
        "수율(yield) 향상과 생산성 개선을 수행한다",
        "공정 데이터 분석을 통해 개선안을 도출한다",
        "공정 조건 변경, 레시피 조정으로 품질과 효율을 개선한다",
        "라인 병목 제거와 cycle time 단축을 수행한다"
      ],
      mediumSignals: [
        "개선 프로젝트 리딩과 성과 측정",
        "현장 문제 대응과 원인 분석",
        "공정 데이터 모니터링과 이상 탐지",
        "지속적 개선 활동(CI) 수행"
      ],
      boundarySignals: [
        "신규 공정 설계와 양산 이관 비중이 커지면 공정설계로 이동한다",
        "설비 구조 변경과 자동화 개발 비중이 커지면 설비/자동화로 이동한다",
        "품질 기준 관리와 검사 체계 구축이 중심이면 품질로 이동한다"
      ],
      adjacentFamilies: [
        "pe_process_design",
        "equipment_engineering_interface",
        "quality_engineering_interface"
      ],
      boundaryNote: "이 family는 이미 운영 중인 공정을 개선하는 역할입니다. 신규 설계보다 문제 해결과 최적화 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 공정의 불량과 비효율을 개선하는 성격이 강합니다. 수율 개선과 공정 최적화가 핵심이라면 이 family에 가깝습니다. 반면 신규 공정 설계나 품질 기준 관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "pe_process_control",
      label: "공정관리/표준화",
      aliases: [
        "공정관리",
        "공정표준화",
        "Process Control",
        "공정조건 관리",
        "SPC",
        "공정 유지관리"
      ],
      strongSignals: [
        "공정 조건을 모니터링하고 기준 이탈을 관리한다",
        "SPC, 관리도 등을 활용해 공정 안정성을 유지한다",
        "표준 작업서와 공정 기준을 유지·관리한다",
        "일상 생산 중 공정 이상을 감지하고 대응한다",
        "공정 변경 관리(change control)를 수행한다"
      ],
      mediumSignals: [
        "공정 데이터 수집과 분석",
        "현장 작업자 교육과 표준 준수 관리",
        "공정 audit 대응",
        "공정 안정성 관련 KPI 관리"
      ],
      boundarySignals: [
        "근본 원인 분석과 대규모 개선 프로젝트 비중이 커지면 공정개선으로 이동한다",
        "신규 공정 설계와 조건 정의 비중이 커지면 공정설계로 이동한다",
        "품질 검사와 불량 판정 중심이면 품질관리로 이동한다"
      ],
      adjacentFamilies: [
        "pe_process_improvement",
        "pe_process_design",
        "quality_control_interface"
      ],
      boundaryNote: "이 family는 공정을 안정적으로 유지하는 역할입니다. 개선이나 설계보다 일상적인 공정 안정성과 표준 관리 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 공정을 안정적으로 유지하고 관리하는 성격이 강합니다. 공정 조건 모니터링과 표준 관리가 핵심이라면 이 family에 가깝습니다. 반면 개선 프로젝트나 신규 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "pe_process_integration",
      label: "공정통합/라인최적화",
      aliases: [
        "공정통합",
        "라인최적화",
        "Process Integration",
        "라인 밸런싱",
        "공정 흐름 최적화"
      ],
      strongSignals: [
        "여러 공정을 연결해 전체 생산 흐름을 최적화한다",
        "라인 밸런싱과 공정 간 병목을 조정한다",
        "공정 간 인터페이스 문제를 해결한다",
        "전체 생산 효율(OEE 등)을 개선한다",
        "공정 간 리드타임과 흐름을 설계한다"
      ],
      mediumSignals: [
        "라인 성능 분석과 개선안 도출",
        "공정 간 협업 조율",
        "전체 공정 KPI 관리",
        "시스템 관점에서 공정 개선"
      ],
      boundarySignals: [
        "개별 공정 조건 개선에 집중하면 공정개선으로 이동한다",
        "신규 공정 설계와 구축이 중심이면 공정설계로 이동한다",
        "설비 자체 개선과 자동화 비중이 커지면 설비 엔지니어링으로 이동한다"
      ],
      adjacentFamilies: [
        "pe_process_improvement",
        "pe_process_design",
        "equipment_engineering_interface"
      ],
      boundaryNote: "이 family는 개별 공정보다 전체 라인과 흐름을 보는 역할입니다. 공정 간 연결과 전체 최적화 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 여러 공정을 연결해 전체 생산 흐름을 최적화하는 성격이 강합니다. 라인 밸런싱과 병목 개선이 핵심이라면 이 family에 가깝습니다. 반면 개별 공정 개선이나 설비 중심 역할이면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "process_design_engineer",
      label: "공정설계 엔지니어",
      aliases: [
        "공정개발 엔지니어",
        "Process Design Engineer",
        "NPI Engineer"
      ],
      family: "pe_process_design",
      responsibilityHints: [
        "신제품 공정 설계와 양산 이관을 수행한다",
        "공정 흐름과 조건을 정의한다",
        "파일럿 생산과 검증을 담당한다"
      ],
      levelHints: [
        "주니어는 테스트와 데이터 수집 중심이다",
        "미들 레벨은 공정 설계를 주도한다",
        "시니어는 전체 공정 구조와 전략을 설계한다"
      ]
    },
    {
      id: "process_improvement_engineer",
      label: "공정개선 엔지니어",
      aliases: [
        "수율개선 엔지니어",
        "Process Improvement Engineer",
        "Yield Engineer"
      ],
      family: "pe_process_improvement",
      responsibilityHints: [
        "불량 원인을 분석하고 개선한다",
        "수율과 생산성을 향상시킨다",
        "공정 데이터를 분석한다"
      ],
      levelHints: [
        "주니어는 데이터 분석과 문제 대응 중심이다",
        "미들 레벨은 개선 프로젝트를 주도한다",
        "시니어는 개선 전략과 방향을 설정한다"
      ]
    },
    {
      id: "process_control_engineer",
      label: "공정관리 엔지니어",
      aliases: [
        "공정유지 담당",
        "Process Control Engineer",
        "SPC Engineer"
      ],
      family: "pe_process_control",
      responsibilityHints: [
        "공정 조건을 모니터링하고 유지한다",
        "표준 작업과 공정 기준을 관리한다",
        "이상 발생 시 대응한다"
      ],
      levelHints: [
        "주니어는 모니터링과 데이터 관리 중심이다",
        "미들 레벨은 공정 안정성 관리 책임을 진다",
        "시니어는 표준과 시스템을 설계한다"
      ]
    },
    {
      id: "process_integration_engineer",
      label: "공정통합 엔지니어",
      aliases: [
        "라인 최적화 엔지니어",
        "Process Integration Engineer"
      ],
      family: "pe_process_integration",
      responsibilityHints: [
        "전체 공정 흐름을 최적화한다",
        "라인 밸런싱과 병목을 해결한다",
        "공정 간 인터페이스를 조정한다"
      ],
      levelHints: [
        "미들 이상에서 주로 수행된다",
        "시니어는 전체 라인 구조와 전략을 설계한다",
        "시스템 관점의 사고가 요구된다"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: [
        "신규 공정 설계와 양산 이관",
        "기존 공정 개선과 수율 향상",
        "공정 안정성과 표준 유지",
        "전체 공정 흐름과 라인 최적화"
      ]
    },
    {
      axisId: "problem_scope",
      label: "문제 범위",
      values: [
        "공정 구조와 설계 단계",
        "개별 공정 문제와 개선",
        "일상 운영과 안정성 유지",
        "공정 간 연결과 시스템 수준 문제"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "신규 양산 준비와 초기 단계",
        "지속적 개선과 중기 활동",
        "일상 운영과 단기 대응",
        "중기~장기 라인 최적화"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "equipment_engineering_interface",
      label: "설비/자동화 인접 경계",
      whyAdjacent: [
        "공정과 설비가 밀접하게 연결된다",
        "설비 설계와 자동화가 중심이면 설비 엔지니어링으로 이동한다"
      ]
    },
    {
      id: "quality_engineering_interface",
      label: "품질 인접 경계",
      whyAdjacent: [
        "불량 분석과 품질 개선에서 겹친다",
        "검사와 품질 기준 관리가 중심이면 품질 직무로 읽힌다"
      ]
    },
    {
      id: "production_interface",
      label: "생산관리 인접 경계",
      whyAdjacent: [
        "현장 생산과 밀접하게 연결된다",
        "인력·일정 관리 중심이면 생산관리로 이동한다"
      ]
    }
  ],
  boundaryHints: [
    "신규 공정 설계와 양산 이관 비중이 커지면 공정설계로 읽힙니다.",
    "불량 개선과 수율 향상 비중이 커지면 공정개선으로 읽힙니다.",
    "공정 조건 유지와 표준 관리 비중이 커지면 공정관리로 읽힙니다.",
    "라인 전체 최적화와 병목 개선 비중이 커지면 공정통합으로 읽힙니다.",
    "설비 구조 변경과 자동화 개발이 중심이면 설비 엔지니어링으로 이동할 수 있습니다."
  ],
  summaryTemplate: "공정기술 직무는 생산 공정을 설계하고 개선하며 안정적으로 운영하는 역할을 수행합니다. 다만 신규 공정을 설계하는지, 기존 공정을 개선하는지, 공정을 유지관리하는지, 또는 전체 라인을 최적화하는지에 따라 역할이 구분됩니다. 특히 공정을 새로 만드는지, 개선하는지, 유지하는지에 따라 핵심 경계가 나뉩니다."
};
