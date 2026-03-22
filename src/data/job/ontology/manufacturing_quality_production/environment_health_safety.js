export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "ENVIRONMENT_HEALTH_SAFETY",
  aliases: [
    "안전환경",
    "EHS",
    "HSE",
    "SHE",
    "환경안전",
    "안전보건환경",
    "산업안전",
    "안전관리",
    "환경관리",
    "보건관리",
    "Environment Health Safety",
    "Health Safety Environment",
    "Safety Health Environment",
    "안전환경관리",
    "안전보건",
    "환경안전보건"
  ],
  families: [
    {
      id: "ehs_safety_management",
      label: "안전관리/산업안전",
      aliases: [
        "안전관리",
        "산업안전",
        "안전보건관리",
        "Safety Management",
        "Industrial Safety",
        "현장안전",
        "작업안전"
      ],
      strongSignals: [
        "위험성평가를 수행하고 작업별 안전대책을 수립한다",
        "산업재해 예방 활동, 사고조사, 재발방지 대책 수립을 담당한다",
        "작업허가서, 안전점검, TBM, 순회점검을 운영한다",
        "보호구 착용, 작업표준 준수, 안전수칙 이행을 관리한다",
        "협력사 안전관리와 현장 작업 안전 통제를 수행한다"
      ],
      mediumSignals: [
        "안전교육 계획과 법정 교육 이수를 관리한다",
        "위험작업 공정의 안전절차를 문서화한다",
        "안전 관련 법규 대응과 점검 준비를 지원한다",
        "near miss, 사고지표, 점검결과를 관리한다"
      ],
      boundarySignals: [
        "폐기물, 대기·수질 배출, 화학물질 인허가 대응 비중이 커지면 환경관리로 이동한다",
        "작업환경측정, 특수건강검진, 유해인자 노출 관리 비중이 커지면 보건관리로 이동한다",
        "전사 규정 체계, 감사 대응, ISO 시스템 운영 비중이 커지면 EHS 시스템/컴플라이언스 경계로 이동한다"
      ],
      adjacentFamilies: [
        "ehs_environment_management",
        "ehs_health_management",
        "ehs_system_compliance"
      ],
      boundaryNote: "이 family는 현장 작업과 설비 주변의 안전 리스크를 직접 통제하는 성격이 강합니다. 환경 인허가나 보건 노출관리보다 작업 안전 통제와 사고 예방 책임이 크면 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 작업 현장의 위험을 통제하고 사고를 예방하는 성격이 강합니다. 위험성평가, 안전점검, 작업허가, 사고 재발방지 대책이 핵심이라면 이 family에 가깝습니다. 반면 환경 인허가나 작업환경 노출관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ehs_environment_management",
      label: "환경관리/환경인허가",
      aliases: [
        "환경관리",
        "환경안전",
        "환경인허가",
        "Environment Management",
        "환경법규",
        "대기수질관리",
        "폐기물관리",
        "화학물질관리"
      ],
      strongSignals: [
        "대기, 수질, 폐기물, 소음·진동 등 환경 배출기준을 관리한다",
        "환경 인허가 취득·변경·갱신과 관공서 대응을 수행한다",
        "폐기물 처리, 배출시설 운영, 법정 보고를 관리한다",
        "화학물질 취급, 저장, 배출 관련 규제 대응을 담당한다",
        "환경사고 예방과 비상대응 체계를 운영한다"
      ],
      mediumSignals: [
        "배출량, 처리실적, 환경지표를 모니터링한다",
        "환경 점검과 내부 audit를 수행한다",
        "외부 처리업체, 분석기관, 관공서와 커뮤니케이션한다",
        "환경개선 투자안과 운영 개선안을 검토한다"
      ],
      boundarySignals: [
        "사고예방, 작업허가, 현장 안전통제 비중이 커지면 안전관리로 이동한다",
        "유해인자 노출, 건강검진, 근로자 건강보호 비중이 커지면 보건관리로 이동한다",
        "문서체계, ISO 인증, 전사 compliance 운영 비중이 커지면 EHS 시스템/컴플라이언스 경계로 이동한다"
      ],
      adjacentFamilies: [
        "ehs_safety_management",
        "ehs_health_management",
        "ehs_system_compliance"
      ],
      boundaryNote: "이 family는 환경 규제와 배출·폐기·화학물질 관리 책임이 핵심입니다. 현장 작업 안전보다 환경 인허가와 배출기준 준수 비중이 크면 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 환경 규제 준수와 배출·폐기 관리에 무게가 실리는 성격이 강합니다. 대기·수질·폐기물·화학물질 관리와 인허가 대응이 핵심이라면 이 family에 가깝습니다. 반면 작업 안전 통제나 건강보호 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ehs_health_management",
      label: "보건관리/작업환경",
      aliases: [
        "보건관리",
        "산업보건",
        "작업환경관리",
        "Health Management",
        "Occupational Health",
        "산업위생",
        "유해인자관리"
      ],
      strongSignals: [
        "작업환경측정, 유해인자 노출 수준 관리, 개선 대책 수립을 담당한다",
        "특수건강검진, 일반건강검진, 사후관리 등 건강보호 활동을 운영한다",
        "소음, 분진, 화학물질 노출과 같은 산업위생 이슈를 관리한다",
        "근골격계 부담작업, 인간공학, 직무 관련 건강 리스크를 점검한다",
        "보건교육, 건강상담, 유소견자 관리 등 근로자 건강관리 체계를 운영한다"
      ],
      mediumSignals: [
        "MSDS, 유해물질 취급 정보, 노출정보를 관리한다",
        "작업환경 개선을 위해 현장과 협업한다",
        "보건 관련 법정 서류와 대응자료를 관리한다",
        "건강 지표와 보건 프로그램 운영 실적을 관리한다"
      ],
      boundarySignals: [
        "작업허가, 설비 위험 통제, 사고 예방 비중이 커지면 안전관리로 이동한다",
        "폐기물, 배출기준, 환경 인허가 대응 비중이 커지면 환경관리로 이동한다",
        "전사 규정, 인증, 감사 체계 운영 비중이 커지면 EHS 시스템/컴플라이언스 경계로 이동한다"
      ],
      adjacentFamilies: [
        "ehs_safety_management",
        "ehs_environment_management",
        "ehs_system_compliance"
      ],
      boundaryNote: "이 family는 근로자의 노출과 건강 보호에 초점이 있습니다. 현장 안전 통제나 환경 배출 대응보다 작업환경과 건강관리 책임이 크면 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 근로자의 건강과 작업환경 노출을 관리하는 성격이 강합니다. 작업환경측정, 건강검진, 유해인자 관리가 핵심이라면 이 family에 가깝습니다. 반면 현장 안전 통제나 환경 인허가 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ehs_system_compliance",
      label: "EHS 시스템/컴플라이언스",
      aliases: [
        "EHS 시스템",
        "SHE 시스템",
        "컴플라이언스",
        "EHS Compliance",
        "ISO 14001",
        "ISO 45001",
        "안전환경 시스템",
        "법규관리"
      ],
      strongSignals: [
        "ISO 14001, ISO 45001 등 인증 체계 구축과 유지관리를 담당한다",
        "EHS 규정, 절차서, 문서체계, 점검체계를 설계하고 운영한다",
        "법규 리스트 관리, compliance 점검, 내부 audit 대응을 수행한다",
        "전사 EHS KPI, 보고 체계, governance를 운영한다",
        "사업장 공통 기준과 본사 차원의 관리체계를 정립한다"
      ],
      mediumSignals: [
        "내부 심사, 외부 심사 준비와 시정조치 추적",
        "사업장별 EHS 운영 현황 취합과 보고",
        "제도 개정과 교육자료 배포",
        "리스크 평가 체계와 개선과제 관리"
      ],
      boundarySignals: [
        "현장 위험 통제와 사고 대응이 중심이면 안전관리로 이동한다",
        "배출시설, 폐기물, 인허가 실무 비중이 커지면 환경관리로 이동한다",
        "작업환경측정과 건강검진 운영 비중이 커지면 보건관리로 이동한다"
      ],
      adjacentFamilies: [
        "ehs_safety_management",
        "ehs_environment_management",
        "ehs_health_management"
      ],
      boundaryNote: "이 family는 전사적 기준과 관리체계를 운영하는 성격이 강합니다. 현장 실무를 직접 처리하기보다 시스템, 규정, 감사, 인증 운영 비중이 크면 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 안전환경보건의 기준과 관리체계를 운영하는 성격이 강합니다. ISO 인증, 규정 체계, 법규 compliance, audit 대응이 핵심이라면 이 family에 가깝습니다. 반면 현장 안전 통제나 환경·보건 실무 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "safety_manager",
      label: "안전관리 담당자",
      aliases: [
        "산업안전 담당",
        "Safety Manager",
        "Safety Officer",
        "안전보건 담당"
      ],
      family: "ehs_safety_management",
      responsibilityHints: [
        "현장 위험성평가와 안전점검을 수행한다",
        "사고 예방 활동과 사고조사, 재발방지 대책을 운영한다",
        "작업허가와 협력사 안전관리를 담당한다"
      ],
      levelHints: [
        "주니어는 점검, 교육 운영, 현장 순회 비중이 높다",
        "미들 레벨은 사고 대응과 안전체계 운영을 주도한다",
        "시니어는 사업장 안전전략과 관리기준을 설계한다"
      ]
    },
    {
      id: "environment_manager",
      label: "환경관리 담당자",
      aliases: [
        "환경안전 담당",
        "Environment Manager",
        "환경인허가 담당",
        "환경법규 담당"
      ],
      family: "ehs_environment_management",
      responsibilityHints: [
        "대기·수질·폐기물 등 환경기준 준수를 관리한다",
        "환경 인허가와 관공서 대응을 수행한다",
        "환경 배출 및 처리 관련 운영을 관리한다"
      ],
      levelHints: [
        "주니어는 실적 관리와 법정 보고 지원 비중이 높다",
        "미들 레벨은 인허가와 대외 대응을 주도한다",
        "시니어는 환경 리스크와 투자 방향을 설계한다"
      ]
    },
    {
      id: "occupational_health_manager",
      label: "보건관리 담당자",
      aliases: [
        "산업보건 담당",
        "Occupational Health Manager",
        "산업위생 담당",
        "작업환경 담당"
      ],
      family: "ehs_health_management",
      responsibilityHints: [
        "작업환경측정과 유해인자 노출 관리를 수행한다",
        "건강검진과 사후관리 체계를 운영한다",
        "근로자 건강보호 프로그램을 관리한다"
      ],
      levelHints: [
        "주니어는 측정 결과 관리와 운영 지원 비중이 높다",
        "미들 레벨은 노출 개선과 건강관리 체계를 주도한다",
        "시니어는 보건 전략과 기준을 설계한다"
      ]
    },
    {
      id: "ehs_compliance_manager",
      label: "EHS 시스템 담당자",
      aliases: [
        "EHS Compliance Manager",
        "SHE 시스템 담당",
        "ISO 담당",
        "안전환경 컴플라이언스 담당"
      ],
      family: "ehs_system_compliance",
      responsibilityHints: [
        "EHS 인증과 규정 체계를 운영한다",
        "법규 관리, audit 대응, 시정조치를 관리한다",
        "전사 기준과 보고 체계를 정립한다"
      ],
      levelHints: [
        "주니어는 문서 관리와 심사 대응 지원 비중이 높다",
        "미들 레벨은 인증 운영과 규정 체계를 주도한다",
        "시니어는 전사 governance와 기준 체계를 설계한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "risk_focus",
      label: "핵심 관리 리스크",
      values: [
        "작업 안전사고와 현장 위험",
        "배출·폐기·화학물질 등 환경 규제 리스크",
        "유해인자 노출과 근로자 건강 리스크",
        "법규·인증·감사 중심의 시스템 리스크"
      ]
    },
    {
      axisId: "work_scope",
      label: "업무 범위",
      values: [
        "현장 작업 통제와 사고 예방",
        "환경 인허가와 배출 관리",
        "작업환경과 건강보호 관리",
        "전사 기준·문서·감사 체계 운영"
      ]
    },
    {
      axisId: "primary_artifacts",
      label: "주요 산출물",
      values: [
        "위험성평가서, 작업허가서, 사고조사 보고서",
        "인허가 서류, 법정 보고자료, 배출·폐기 관리 기록",
        "작업환경측정 결과, 건강검진 사후관리 자료, 노출관리 기록",
        "ISO 문서, audit 시정조치, 법규 리스트, EHS KPI 보고서"
      ]
    },
    {
      axisId: "intervention_level",
      label: "개입 수준",
      values: [
        "현장 작업과 사람의 행동 통제",
        "설비·배출시설·법정 의무 관리",
        "노출 원인과 건강 영향 관리",
        "제도·규정·감사 체계 관리"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "facility_management_interface",
      label: "시설관리 인접 경계",
      whyAdjacent: [
        "설비 점검과 비상설비 관리가 겹칠 수 있다",
        "그러나 유틸리티 운영과 설비 유지보수가 중심이면 시설관리로 읽힌다"
      ]
    },
    {
      id: "quality_compliance_interface",
      label: "품질/컴플라이언스 인접 경계",
      whyAdjacent: [
        "감사, 규정, 문서체계 운영 방식이 유사해 보일 수 있다",
        "그러나 제품 품질 기준과 고객 audit 대응이 중심이면 품질 컴플라이언스로 읽힌다"
      ]
    },
    {
      id: "production_management_interface",
      label: "생산관리 인접 경계",
      whyAdjacent: [
        "현장 운영과 작업 통제에서 생산과 밀접하게 연결된다",
        "그러나 생산 일정, 인력, 실적 운영이 중심이면 생산관리로 이동한다"
      ]
    }
  ],
  boundaryHints: [
    "위험성평가, 작업허가, 사고조사, 협력사 안전통제 비중이 커지면 안전관리로 읽힙니다.",
    "폐기물, 배출시설, 대기·수질 관리, 환경 인허가 대응 비중이 커지면 환경관리로 읽힙니다.",
    "작업환경측정, 유해인자 노출관리, 건강검진과 사후관리 비중이 커지면 보건관리로 읽힙니다.",
    "ISO 14001/45001, 규정 체계, audit 대응, 전사 KPI 운영 비중이 커지면 EHS 시스템/컴플라이언스로 읽힙니다.",
    "현장 실무보다 전사 기준과 governance 책임이 커질수록 시스템 family로 이동하고, 반대로 문서체계보다 현장 점검과 즉시 대응 비중이 커질수록 안전·환경·보건 실무 family로 이동합니다."
  ],
  summaryTemplate: "안전환경 직무는 사업장의 사고, 환경 규제, 건강 노출 리스크를 관리하는 성격이 강합니다. 다만 실제 역할은 현장 안전을 통제하는지, 환경 인허가와 배출을 관리하는지, 작업환경과 건강을 보호하는지, 혹은 전사 기준과 compliance 체계를 운영하는지에 따라 분명히 갈립니다. 특히 현장 실무 중심인지, 규정·시스템 중심인지가 이 직무의 핵심 경계를 만듭니다."
};
