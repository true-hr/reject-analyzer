export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "TECHNICAL_SUPPORT_FIELD_ENGINEERING",
  aliases: [
    "기술지원",
    "기술 지원",
    "필드엔지니어",
    "Field Engineer",
    "Field Application Engineer",
    "FAE",
    "Customer Support Engineer",
    "Technical Support Engineer",
    "현장 엔지니어",
    "서비스 엔지니어",
    "A/S 엔지니어",
    "설치 엔지니어",
    "장비 엔지니어",
    "기술 고객지원",
    "제품 기술지원",
    "현장 대응 엔지니어",
    "유지보수 엔지니어",
    "After Service Engineer"
  ],
  families: [
    {
      id: "field_installation_maintenance",
      label: "현장 설치·유지보수",
      aliases: [
        "설치 엔지니어",
        "현장 설치",
        "장비 설치",
        "유지보수",
        "A/S",
        "On-site Maintenance"
      ],
      strongSignals: [
        "고객 현장에서 장비 또는 제품 설치를 수행한다",
        "장비 고장 시 현장 방문해 수리 및 교체를 진행한다",
        "정기 점검 및 예방 유지보수를 수행한다",
        "현장에서 발생한 문제를 즉시 해결한다",
        "설치 매뉴얼 및 절차에 따라 작업을 수행한다"
      ],
      mediumSignals: [
        "출장 기반 업무 비중이 높다",
        "고객사 현장과 직접 커뮤니케이션한다",
        "장비 상태를 점검하고 기록한다",
        "부품 교체 및 간단한 수리를 수행한다"
      ],
      boundarySignals: [
        "고객 기술 문의 대응과 제품 이해 중심이면 technical support family로 이동한다",
        "문제 원인 분석과 설계 개선 피드백 비중이 커지면 product engineering 경계로 이동한다",
        "영업과 연계된 기술 설명 비중이 커지면 FAE 영역으로 이동한다",
        "단순 반복 작업 비중이 높으면 오퍼레이션 역할로 읽힌다"
      ],
      adjacentFamilies: [
        "technical_issue_support",
        "fae_presales_support",
        "product_feedback_escalation"
      ],
      boundaryNote: "현장 설치·유지보수는 물리적인 장비 대응과 즉각적인 문제 해결이 핵심입니다. 반면 기술 상담이나 설계 피드백 비중이 커지면 다른 기술지원 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 고객 현장에서 장비를 설치하고 유지보수하며 문제를 직접 해결하는 성격이 강합니다. 반면 기술 상담이나 제품 개선 연계 비중이 커지면 다른 기술지원 경계로 읽힐 수 있습니다."
    },
    {
      id: "technical_issue_support",
      label: "기술 문의 대응·문제 해결",
      aliases: [
        "기술지원 엔지니어",
        "Technical Support",
        "Customer Support Engineer",
        "기술 문의 대응",
        "트러블슈팅"
      ],
      strongSignals: [
        "고객의 기술 문의를 분석하고 해결 방법을 제시한다",
        "문제 재현 및 원인 분석을 수행한다",
        "이슈 티켓을 관리하고 해결 상태를 추적한다",
        "제품 사용 중 발생하는 문제를 원격 또는 현장에서 해결한다",
        "FAQ, 가이드 문서를 작성한다"
      ],
      mediumSignals: [
        "고객과 이메일, 전화, 시스템을 통해 커뮤니케이션한다",
        "문제 해결 과정을 문서화한다",
        "반복 이슈를 정리하고 개선 포인트를 도출한다",
        "내부 개발팀과 협업해 문제를 해결한다"
      ],
      boundarySignals: [
        "현장 설치와 물리적 대응 비중이 크면 field maintenance family로 이동한다",
        "영업 지원과 기술 설명 비중이 크면 FAE 영역으로 이동한다",
        "제품 개선 요구사항 정리와 전달 비중이 크면 product feedback family로 이동한다",
        "단순 문의 응답 중심이고 기술 깊이가 낮으면 고객지원(CS)로 읽힌다"
      ],
      adjacentFamilies: [
        "field_installation_maintenance",
        "fae_presales_support",
        "product_feedback_escalation"
      ],
      boundaryNote: "기술 문의 대응은 문제 원인을 분석하고 해결책을 제시하는 데 초점이 있습니다. 반면 설치 작업이나 영업 지원 비중이 커지면 다른 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 고객의 기술 문제를 분석하고 해결책을 제시하는 성격이 강합니다. 반면 현장 대응이나 영업 지원 비중이 커지면 다른 기술지원 경계로 읽힐 수 있습니다."
    },
    {
      id: "fae_presales_support",
      label: "FAE·기술 영업 지원",
      aliases: [
        "FAE",
        "Field Application Engineer",
        "기술 영업 지원",
        "Pre-sales Engineer",
        "Application Engineer"
      ],
      strongSignals: [
        "제품의 기술적 특성을 고객에게 설명하고 적용 방안을 제안한다",
        "영업과 함께 고객 요구사항을 분석한다",
        "PoC, 데모, 기술 검증을 지원한다",
        "고객 환경에 맞는 기술 솔루션을 설계한다",
        "기술 미팅 및 프레젠테이션을 수행한다"
      ],
      mediumSignals: [
        "영업팀과 긴밀히 협업한다",
        "고객 요구사항을 내부 개발팀에 전달한다",
        "제품 적용 사례를 정리한다",
        "기술 문서를 작성한다"
      ],
      boundarySignals: [
        "설치 및 유지보수 중심이면 field maintenance family로 이동한다",
        "문제 해결 및 이슈 대응 중심이면 technical support family로 이동한다",
        "제품 설계 및 개발 참여 비중이 커지면 엔지니어링 영역으로 이동한다",
        "영업 목표 달성 책임이 커지면 세일즈 역할로 읽힌다"
      ],
      adjacentFamilies: [
        "technical_issue_support",
        "field_installation_maintenance",
        "product_feedback_escalation"
      ],
      boundaryNote: "FAE는 기술을 기반으로 고객 요구를 해결하고 영업을 지원하는 역할입니다. 반면 직접 문제 해결이나 설치 중심이면 다른 기술지원 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 제품 기술을 바탕으로 고객 요구를 해결하고 영업을 지원하는 성격이 강합니다. 반면 설치나 문제 해결 중심 비중이 커지면 다른 기술지원 경계로 읽힐 수 있습니다."
    },
    {
      id: "product_feedback_escalation",
      label: "제품 이슈 피드백·개선 연계",
      aliases: [
        "제품 피드백",
        "Issue Escalation",
        "Customer Feedback Engineering",
        "품질 이슈 전달",
        "Field Feedback"
      ],
      strongSignals: [
        "현장에서 발생한 문제를 개발팀에 전달하고 개선을 요청한다",
        "반복 이슈를 분석해 제품 개선 포인트를 도출한다",
        "고객 요구사항을 정리해 제품 로드맵에 반영한다",
        "이슈 escalation 프로세스를 관리한다",
        "개선 결과를 고객과 공유한다"
      ],
      mediumSignals: [
        "이슈 데이터를 정리하고 패턴을 분석한다",
        "개발팀과 커뮤니케이션하며 개선 우선순위를 조정한다",
        "고객 피드백을 문서화한다",
        "제품 개선 이후 효과를 검증한다"
      ],
      boundarySignals: [
        "직접 문제 해결과 고객 대응 비중이 크면 technical support family로 이동한다",
        "설치 및 현장 대응 비중이 크면 field maintenance family로 이동한다",
        "제품 설계와 기능 정의 참여 비중이 커지면 제품기획 또는 개발로 이동한다",
        "데이터 분석 중심이고 고객 접점이 약하면 분석 직무로 이동한다"
      ],
      adjacentFamilies: [
        "technical_issue_support",
        "fae_presales_support",
        "product_management"
      ],
      boundaryNote: "제품 피드백·개선 연계는 현장 문제를 제품 개선으로 연결하는 역할입니다. 반면 직접 해결이나 영업 지원 비중이 커지면 다른 기술지원 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 고객 현장의 문제를 분석해 제품 개선으로 연결하는 성격이 강합니다. 반면 직접 문제 해결이나 영업 지원 비중이 커지면 다른 기술지원 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "field_service_engineer",
      label: "Field Service Engineer",
      aliases: [
        "필드 서비스 엔지니어",
        "서비스 엔지니어",
        "현장 엔지니어"
      ],
      family: "field_installation_maintenance",
      responsibilityHints: [
        "장비 설치 및 유지보수를 수행한다",
        "현장 문제를 직접 해결한다",
        "정기 점검과 수리를 진행한다"
      ],
      levelHints: [
        "초기에는 표준 작업 수행 중심",
        "경험이 쌓일수록 복잡한 문제 해결과 고객 대응 확대"
      ]
    },
    {
      id: "technical_support_engineer",
      label: "Technical Support Engineer",
      aliases: [
        "기술지원 엔지니어",
        "Customer Support Engineer"
      ],
      family: "technical_issue_support",
      responsibilityHints: [
        "고객 기술 문제를 분석하고 해결한다",
        "이슈를 관리하고 추적한다",
        "문제 해결 가이드를 제공한다"
      ],
      levelHints: [
        "기본 문제 해결에서 시작",
        "복잡한 시스템 문제 분석으로 확장"
      ]
    },
    {
      id: "fae_engineer",
      label: "Field Application Engineer",
      aliases: [
        "FAE",
        "Application Engineer",
        "기술 영업 엔지니어"
      ],
      family: "fae_presales_support",
      responsibilityHints: [
        "고객 요구사항에 맞는 기술 솔루션을 제안한다",
        "영업과 협업해 기술 지원을 수행한다",
        "데모 및 PoC를 진행한다"
      ],
      levelHints: [
        "제품 이해 기반 기술 설명에서 시작",
        "고객 맞춤 솔루션 설계로 확장"
      ]
    },
    {
      id: "customer_feedback_engineer",
      label: "Customer Feedback Engineer",
      aliases: [
        "피드백 엔지니어",
        "Field Feedback Engineer"
      ],
      family: "product_feedback_escalation",
      responsibilityHints: [
        "고객 이슈를 분석하고 개발팀에 전달한다",
        "제품 개선 요구사항을 정리한다",
        "이슈 개선 결과를 추적한다"
      ],
      levelHints: [
        "이슈 정리와 전달 중심",
        "제품 개선 방향 제안으로 확장"
      ]
    },
    {
      id: "technical_support_manager",
      label: "Technical Support Manager",
      aliases: [
        "기술지원 매니저",
        "Support Manager"
      ],
      family: "technical_issue_support",
      responsibilityHints: [
        "기술지원 조직을 관리한다",
        "이슈 대응 프로세스를 설계한다",
        "고객 만족과 품질을 관리한다"
      ],
      levelHints: [
        "개별 대응보다 프로세스와 조직 관리 중심",
        "조직 간 협업과 전략적 의사결정 확대"
      ]
    }
  ],
  axes: [
    {
      axisId: "field_vs_remote",
      label: "현장 vs 원격",
      values: [
        "현장 방문 및 물리적 대응 중심",
        "원격 기술 지원 중심",
        "혼합 형태"
      ]
    },
    {
      axisId: "execution_vs_consulting",
      label: "실행 vs 자문",
      values: [
        "설치 및 수리 실행 중심",
        "문제 분석 및 해결 제안",
        "기술 컨설팅 및 솔루션 제안"
      ]
    },
    {
      axisId: "customer_vs_product",
      label: "고객 대응 vs 제품 개선",
      values: [
        "고객 문제 해결 중심",
        "고객 요구 분석 및 전달",
        "제품 개선 연계 중심"
      ]
    },
    {
      axisId: "sales_involvement",
      label: "영업 연계도",
      values: [
        "영업 연계 낮음",
        "기술 지원 수준 협업",
        "프리세일즈 및 영업 지원 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "quality_engineering",
    "product_management",
    "software_engineering",
    "sales_engineering"
  ],
  boundaryHints: [
    "제품 설계와 기능 개발 참여 비중이 커지면 엔지니어링 개발로 이동합니다.",
    "고객 대응보다 품질 개선과 원인 분석 비중이 커지면 품질 엔지니어링으로 이동합니다.",
    "영업 목표와 계약 성과 책임이 커지면 세일즈 엔지니어링으로 이동합니다.",
    "단순 문의 응답 비중이 높고 기술 깊이가 낮으면 고객지원(CS)로 읽힙니다.",
    "현장 대응보다 데이터 분석과 개선 제안 비중이 커지면 제품 기획 또는 분석 영역으로 이동합니다."
  ],
  summaryTemplate: "기술지원·필드엔지니어 직무는 고객 환경에서 제품 문제를 해결하고 기술적 지원을 제공하는 성격이 강합니다. 현장 대응, 문제 해결, 영업 지원, 제품 개선 연계 중 어디에 집중하느냐에 따라 역할이 달라집니다. 반면 개발이나 영업 책임 비중이 커지면 다른 직무 경계로 읽힐 수 있습니다."
};
