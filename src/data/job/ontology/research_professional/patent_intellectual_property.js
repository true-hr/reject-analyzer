export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "PATENT_INTELLECTUAL_PROPERTY",
  aliases: [
    "특허",
    "지식재산",
    "IP",
    "Patent",
    "Intellectual Property",
    "변리사",
    "Patent Attorney",
    "IP Analyst",
    "특허 분석",
    "특허 출원",
    "지식재산 관리"
  ],
  families: [
    {
      id: "patent_prosecution",
      label: "특허 출원/권리화",
      aliases: [
        "Patent Prosecution",
        "특허 출원",
        "명세서 작성",
        "권리화",
        "OA 대응"
      ],
      strongSignals: [
        "특허 명세서 작성",
        "청구항 작성 및 보정",
        "출원 전략 수립",
        "Office Action 대응",
        "발명 인터뷰 진행"
      ],
      mediumSignals: [
        "특허 선행기술 조사",
        "출원 일정 관리",
        "기술 내용 문서화",
        "특허 포트폴리오 일부 관리"
      ],
      boundarySignals: [
        "침해 분석 및 소송 대응 비중 증가",
        "특허 맵 및 경쟁사 분석 비중 증가",
        "내부 IP 정책 및 관리 업무 비중 증가"
      ],
      adjacentFamilies: ["ip_litigation", "ip_analysis_strategy"],
      boundaryNote: "명세서 작성과 권리 확보보다 침해 분석이나 소송 대응 비중이 커지면 분쟁 대응으로 이동하며, 경쟁사 분석과 전략 수립 비중이 커지면 IP 분석/전략으로 이동합니다.",
      summaryTemplate: "이 직무는 특허를 출원하고 권리를 확보하는 실무에 집중하는 성격이 강합니다. 반면 분쟁 대응이나 전략 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ip_litigation",
      label: "특허 분쟁/침해 대응",
      aliases: [
        "IP Litigation",
        "특허 소송",
        "침해 분석",
        "무효 심판",
        "IP Dispute"
      ],
      strongSignals: [
        "특허 침해 여부 분석",
        "무효 심판 대응",
        "소송 자료 준비 및 대응",
        "클레임 해석 및 비교 분석",
        "법적 의견서 작성"
      ],
      mediumSignals: [
        "선행기술 조사",
        "외부 로펌 협업",
        "분쟁 리스크 검토",
        "기술-법률 연계 분석"
      ],
      boundarySignals: [
        "명세서 작성 및 출원 비중 증가",
        "특허 데이터 기반 전략 분석 비중 증가",
        "IP 운영 및 관리 업무 비중 증가"
      ],
      adjacentFamilies: ["patent_prosecution", "ip_analysis_strategy"],
      boundaryNote: "분쟁 대응에서 벗어나 출원 및 권리 확보 비중이 커지면 출원/권리화로 이동하며, 기업 전략 기반 분석 비중이 커지면 IP 전략으로 이동합니다.",
      summaryTemplate: "이 직무는 특허 침해 여부를 판단하고 분쟁과 소송에 대응하는 성격이 강합니다. 반면 출원 업무나 전략 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ip_analysis_strategy",
      label: "IP 분석/전략",
      aliases: [
        "IP Analyst",
        "Patent Analyst",
        "IP Strategy",
        "특허 분석",
        "특허 전략"
      ],
      strongSignals: [
        "특허 맵 작성",
        "경쟁사 특허 포트폴리오 분석",
        "기술 트렌드 분석",
        "FTO 분석",
        "IP 전략 수립"
      ],
      mediumSignals: [
        "특허 데이터 정리 및 시각화",
        "리서치 보고서 작성",
        "기술 분류 및 클러스터링",
        "출원 방향 제안"
      ],
      boundarySignals: [
        "명세서 작성 및 출원 직접 수행 증가",
        "침해 분석 및 소송 대응 비중 증가",
        "조직 내 IP 운영 및 관리 비중 증가"
      ],
      adjacentFamilies: ["patent_prosecution", "ip_litigation"],
      boundaryNote: "분석 중심에서 벗어나 명세서 작성과 출원 비중이 커지면 권리화로 이동하며, 분쟁 대응 비중이 커지면 소송 대응으로 이동합니다.",
      summaryTemplate: "이 직무는 특허 데이터를 기반으로 기술과 경쟁 환경을 분석하고 전략을 수립하는 성격이 강합니다. 반면 출원이나 분쟁 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ip_management",
      label: "IP 관리/운영",
      aliases: [
        "IP Manager",
        "지식재산 관리",
        "특허 관리",
        "IP 운영",
        "IP Portfolio Management"
      ],
      strongSignals: [
        "특허 포트폴리오 관리",
        "출원 및 등록 프로세스 관리",
        "IP 비용 및 예산 관리",
        "라이선스 및 계약 관리",
        "내부 IP 정책 운영"
      ],
      mediumSignals: [
        "특허 일정 및 상태 관리",
        "외부 대리인 커뮤니케이션",
        "IP 시스템 운영",
        "내부 보고서 작성"
      ],
      boundarySignals: [
        "특허 분석 및 전략 수립 비중 증가",
        "명세서 작성 및 출원 직접 수행 증가",
        "침해 분석 및 분쟁 대응 비중 증가"
      ],
      adjacentFamilies: ["ip_analysis_strategy", "patent_prosecution"],
      boundaryNote: "운영 관리에서 벗어나 기술 분석과 전략 수립 비중이 커지면 IP 전략으로 이동하며, 직접 출원 업무 비중이 커지면 권리화 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 조직의 지식재산을 체계적으로 관리하고 운영하는 성격이 강합니다. 반면 분석이나 출원 실무 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "patent_attorney",
      label: "변리사",
      aliases: ["Patent Attorney"],
      family: "patent_prosecution",
      responsibilityHints: [
        "특허 명세서 작성",
        "출원 및 권리 확보",
        "OA 대응"
      ],
      levelHints: [
        "주니어는 명세서 작성 보조",
        "시니어는 출원 전략 및 클레임 설계"
      ]
    },
    {
      id: "ip_litigation_specialist",
      label: "IP 분쟁 전문가",
      aliases: ["IP Litigation Specialist"],
      family: "ip_litigation",
      responsibilityHints: [
        "침해 분석",
        "소송 대응",
        "법적 의견 작성"
      ],
      levelHints: [
        "주니어는 자료 조사 및 분석",
        "시니어는 분쟁 전략 수립"
      ]
    },
    {
      id: "ip_analyst",
      label: "IP 분석가",
      aliases: ["Patent Analyst", "IP Analyst"],
      family: "ip_analysis_strategy",
      responsibilityHints: [
        "특허 데이터 분석",
        "경쟁사 분석",
        "전략 리포트 작성"
      ],
      levelHints: [
        "주니어는 데이터 정리 및 리서치",
        "시니어는 전략 수립 및 방향 제시"
      ]
    },
    {
      id: "ip_manager",
      label: "IP 매니저",
      aliases: ["IP Manager"],
      family: "ip_management",
      responsibilityHints: [
        "IP 포트폴리오 관리",
        "출원 및 등록 프로세스 운영",
        "IP 정책 관리"
      ],
      levelHints: [
        "주니어는 운영 및 관리 지원",
        "시니어는 IP 전략 및 조직 관리"
      ]
    }
  ],
  axes: [
    {
      axisId: "creation_vs_analysis",
      label: "권리화 vs 분석",
      values: ["출원/명세서 작성 중심", "데이터 분석/전략 중심"]
    },
    {
      axisId: "legal_vs_strategic",
      label: "법적 대응 vs 전략",
      values: ["소송/분쟁 대응", "전략/포트폴리오 기획"]
    },
    {
      axisId: "execution_vs_management",
      label: "실무 vs 운영",
      values: ["직접 수행 중심", "관리/운영 중심"]
    }
  ],
  adjacentFamilies: ["legal_compliance", "research_development"],
  boundaryHints: [
    "법률 해석과 계약 중심 업무 비중이 커지면 일반 법무/컴플라이언스로 이동합니다.",
    "기술 개발과 연구 자체 수행 비중이 커지면 R&D 직무로 이동합니다.",
    "특허 분석보다 출원 및 명세서 작성 비중이 커지면 권리화 중심으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 특허를 중심으로 기술 권리를 확보하고 분석하며 조직의 지식재산을 관리하는 역할입니다. 출원, 분쟁 대응, 전략 분석, 운영 중 어떤 비중이 큰지에 따라 성격이 달라지며, 특정 영역이 강화되면 인접 직무로 경계가 이동할 수 있습니다."
};
