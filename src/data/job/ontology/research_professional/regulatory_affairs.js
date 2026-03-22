export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "REGULATORY_AFFAIRS",
  aliases: [
    "RA",
    "Regulatory Affairs",
    "규제 대응",
    "인허가",
    "허가 담당",
    "규제 업무",
    "Regulatory Specialist",
    "RA Specialist",
    "RA Manager"
  ],
  families: [
    {
      id: "approval_registration",
      label: "인허가/등록",
      aliases: [
        "허가 등록",
        "제품 인허가",
        "Registration",
        "Submission",
        "허가 서류 작성"
      ],
      strongSignals: [
        "허가 신청서 작성 및 제출",
        "식약처/규제기관 제출 대응",
        "CTD/eCTD 문서 준비",
        "제품 등록 일정 관리",
        "허가 승인 프로세스 관리"
      ],
      mediumSignals: [
        "허가 요건 검토",
        "제출 문서 업데이트",
        "규제기관 질의 대응",
        "허가 전략 일부 참여"
      ],
      boundarySignals: [
        "규제 해석 및 정책 대응 비중 증가",
        "품질/컴플라이언스 관리 비중 증가",
        "임상/시험 데이터 관리 비중 증가"
      ],
      adjacentFamilies: [
        "regulatory_strategy",
        "compliance_quality",
        "clinical_regulatory"
      ],
      boundaryNote: "단순 제출과 등록을 넘어서 규제 해석과 전략 수립 비중이 커지면 규제 전략으로 이동하며, 품질 기준 관리가 중심이 되면 컴플라이언스 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 제품의 인허가를 위해 규제기관에 제출할 문서를 준비하고 승인 절차를 관리하는 성격이 강합니다. 반면 규제 해석이나 전략 수립 비중이 커지면 다른 영역으로 읽힐 수 있습니다."
    },
    {
      id: "regulatory_strategy",
      label: "규제 전략/해석",
      aliases: [
        "Regulatory Strategy",
        "규제 전략",
        "규제 해석",
        "허가 전략",
        "RA 전략"
      ],
      strongSignals: [
        "규제 요구사항 해석",
        "국가별 인허가 전략 수립",
        "제품 출시 전략과 규제 연계",
        "규제 리스크 사전 검토",
        "허가 경로 설계"
      ],
      mediumSignals: [
        "규제 가이드라인 분석",
        "내부 부서 대상 규제 자문",
        "허가 일정 전략 수립",
        "변경 허가 전략 검토"
      ],
      boundarySignals: [
        "실제 제출 문서 작성 비중 증가",
        "품질 기준 준수 관리 비중 증가",
        "임상 데이터 운영 비중 증가"
      ],
      adjacentFamilies: [
        "approval_registration",
        "compliance_quality",
        "clinical_regulatory"
      ],
      boundaryNote: "전략 수립보다 문서 작성과 제출이 중심이 되면 인허가/등록으로 이동하며, 품질 기준 관리나 내부 감사 대응이 중심이 되면 컴플라이언스로 읽힙니다.",
      summaryTemplate: "이 직무는 규제 요구사항을 해석하고 제품의 인허가 방향과 전략을 설계하는 성격이 강합니다. 반면 실행 중심의 제출 업무 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "compliance_quality",
      label: "규제 컴플라이언스/품질",
      aliases: [
        "RA Compliance",
        "규제 컴플라이언스",
        "품질 규제",
        "Regulatory Compliance",
        "GxP 관리"
      ],
      strongSignals: [
        "규제 기준 준수 관리",
        "내부/외부 감사 대응",
        "SOP 관리 및 운영",
        "GMP/GCP 등 규정 준수 관리",
        "변경 관리 및 이슈 대응"
      ],
      mediumSignals: [
        "품질 문서 관리",
        "교육 및 트레이닝 운영",
        "규제 변화 모니터링",
        "리스크 관리 지원"
      ],
      boundarySignals: [
        "허가 제출 문서 작성 비중 증가",
        "규제 전략 설계 비중 증가",
        "임상 데이터 제출 관리 비중 증가"
      ],
      adjacentFamilies: [
        "approval_registration",
        "regulatory_strategy",
        "clinical_regulatory"
      ],
      boundaryNote: "허가 제출과 승인 프로세스 관리가 중심이 되면 인허가/등록으로 이동하며, 규제 방향 설계가 중심이 되면 전략 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 규제 기준을 준수하도록 조직의 프로세스를 관리하고 감사 대응을 수행하는 성격이 강합니다. 반면 인허가 제출이나 전략 설계 비중이 커지면 다른 영역으로 구분될 수 있습니다."
    },
    {
      id: "clinical_regulatory",
      label: "임상/시험 규제 대응",
      aliases: [
        "임상 RA",
        "Clinical Regulatory",
        "시험 규제",
        "임상 인허가",
        "IND/NDA 대응"
      ],
      strongSignals: [
        "임상시험 승인 신청",
        "IND/NDA 문서 준비",
        "임상 데이터 제출 관리",
        "임상 규제기관 대응",
        "시험 계획서 규제 검토"
      ],
      mediumSignals: [
        "임상 관련 규정 해석",
        "시험 변경사항 규제 대응",
        "임상 문서 관리",
        "데이터 제출 일정 관리"
      ],
      boundarySignals: [
        "일반 제품 인허가 비중 증가",
        "품질/컴플라이언스 관리 비중 증가",
        "전략 수립 비중 증가"
      ],
      adjacentFamilies: [
        "approval_registration",
        "regulatory_strategy",
        "compliance_quality"
      ],
      boundaryNote: "임상 단계가 아닌 일반 제품 허가 중심으로 이동하면 인허가/등록으로 해석되며, 전략 설계 비중이 커지면 규제 전략 영역으로 확장됩니다.",
      summaryTemplate: "이 직무는 임상시험과 관련된 규제 요구사항을 충족하고 승인 절차를 관리하는 성격이 강합니다. 반면 일반 인허가나 전략 설계 비중이 커지면 다른 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "ra_specialist",
      label: "RA 담당자",
      aliases: ["Regulatory Specialist"],
      family: "approval_registration",
      responsibilityHints: [
        "허가 문서 작성 및 제출",
        "규제기관 대응",
        "등록 일정 관리"
      ],
      levelHints: [
        "주니어는 문서 작성 및 제출 중심, 시니어는 전체 허가 프로세스 관리"
      ]
    },
    {
      id: "ra_strategy_manager",
      label: "RA 전략 담당",
      aliases: ["Regulatory Strategy Manager"],
      family: "regulatory_strategy",
      responsibilityHints: [
        "규제 전략 수립",
        "시장별 허가 방향 설계",
        "리스크 사전 검토"
      ],
      levelHints: [
        "주니어는 분석 지원, 시니어는 전략 의사결정 영향 확대"
      ]
    },
    {
      id: "ra_compliance_manager",
      label: "RA 컴플라이언스 담당",
      aliases: ["Regulatory Compliance Manager"],
      family: "compliance_quality",
      responsibilityHints: [
        "규제 준수 관리",
        "감사 대응",
        "품질 시스템 운영"
      ],
      levelHints: [
        "주니어는 문서/운영 지원, 시니어는 시스템 설계 및 리스크 관리"
      ]
    },
    {
      id: "clinical_ra_specialist",
      label: "임상 RA 담당",
      aliases: ["Clinical Regulatory Specialist"],
      family: "clinical_regulatory",
      responsibilityHints: [
        "임상 승인 문서 준비",
        "규제기관 대응",
        "임상 데이터 제출 관리"
      ],
      levelHints: [
        "주니어는 문서 준비 중심, 시니어는 전체 임상 규제 전략 일부 참여"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: [
        "제출/등록 실행 중심",
        "규제 해석 및 전략 중심",
        "품질/컴플라이언스 관리 중심",
        "임상 규제 대응 중심"
      ]
    },
    {
      axisId: "lifecycle_stage",
      label: "제품 라이프사이클 단계",
      values: [
        "개발/임상 단계",
        "허가/출시 단계",
        "운영/유지 단계"
      ]
    }
  ],
  adjacentFamilies: [
    "quality_assurance",
    "clinical_operations",
    "strategy_consulting"
  ],
  boundaryHints: [
    "허가 문서 작성과 제출 비중이 높아지면 인허가/등록으로 이동합니다.",
    "규제 해석과 제품 출시 방향 설계 비중이 커지면 규제 전략으로 읽힙니다.",
    "규정 준수 관리와 감사 대응 비중이 커지면 컴플라이언스 영역으로 이동합니다.",
    "임상시험 승인과 데이터 제출 관리 비중이 높아지면 임상 규제 대응으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 규제 요구사항을 기반으로 제품의 인허가와 운영을 지원하는 역할입니다. 다만 제출 실행, 전략 설계, 컴플라이언스 관리, 임상 대응 중 어떤 비중이 큰지에 따라 세부 영역이 달라질 수 있습니다."
};
