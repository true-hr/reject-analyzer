export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "IR_DISCLOSURE",
  aliases: [
    "IR",
    "Investor Relations",
    "기업 IR",
    "공시",
    "공시 담당",
    "IR 담당",
    "투자자 관계",
    "IR 매니저",
    "공시 업무",
    "공시 담당자",
    "IR/공시",
    "IR & Disclosure"
  ],
  families: [
    {
      id: "INVESTOR_RELATIONS_COMMUNICATION",
      label: "IR 커뮤니케이션형",
      aliases: [
        "investor relations",
        "IR communication"
      ],
      strongSignals: [
        "투자자 대상 기업 설명(IR) 수행",
        "실적 발표 자료(IR deck) 작성",
        "애널리스트 및 투자자 미팅 대응",
        "컨퍼런스콜 준비 및 진행",
        "투자자 Q&A 대응",
        "기업 스토리 및 메시지 정리",
        "주주 및 기관 투자자 커뮤니케이션"
      ],
      mediumSignals: [
        "IR 자료 번역 및 정리",
        "투자자 대응 로그 관리",
        "시장 반응 모니터링",
        "IR FAQ 작성",
        "내부 커뮤니케이션 조율"
      ],
      boundarySignals: [
        "공시 문서 작성 및 법적 요건 대응 비중이 커지면 공시형으로 이동",
        "재무 분석 및 모델링 비중이 커지면 재무기획(FP&A) 경계로 이동",
        "브랜딩 및 외부 홍보 메시지 비중이 커지면 PR 경계로 이동"
      ],
      adjacentFamilies: [
        "DISCLOSURE_COMPLIANCE",
        "IR_ANALYTICS",
        "PR_COMMUNICATION"
      ],
      boundaryNote: "투자자와의 커뮤니케이션과 메시지 전달이 중심이면 IR 커뮤니케이션형으로 읽힙니다. 반면 공시 문서나 재무 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 투자자와의 커뮤니케이션과 기업 스토리 전달에 집중하는 성격이 강합니다. 반면 공시 작성이나 재무 분석 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "DISCLOSURE_COMPLIANCE",
      label: "공시/규제 대응형",
      aliases: [
        "disclosure",
        "regulatory disclosure",
        "공시 compliance"
      ],
      strongSignals: [
        "정기/수시 공시 작성",
        "사업보고서 및 분기보고서 작성",
        "전자공시시스템(DART 등) 제출",
        "공시 요건 검토 및 준수",
        "금융감독원 대응",
        "공시 일정 관리",
        "공시 리스크 검토"
      ],
      mediumSignals: [
        "공시 데이터 수집 및 정리",
        "내부 부서 자료 취합",
        "공시 문서 검수",
        "외부 감사/자문 협업",
        "공시 체크리스트 운영"
      ],
      boundarySignals: [
        "투자자 대상 설명 및 커뮤니케이션 비중이 커지면 IR 커뮤니케이션형으로 이동",
        "재무 데이터 분석 및 예측 비중이 커지면 IR 분석형 또는 FP&A로 이동",
        "법률 검토 비중이 매우 높아지면 법무 경계로 이동"
      ],
      adjacentFamilies: [
        "INVESTOR_RELATIONS_COMMUNICATION",
        "IR_ANALYTICS",
        "LEGAL_COMPLIANCE"
      ],
      boundaryNote: "공시 문서 작성과 규제 대응 중심으로 업무가 구성되면 공시/규제 대응형으로 읽힙니다. 반면 커뮤니케이션이나 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 법적 요건에 맞춘 공시 작성과 규제 대응에 집중하는 성격이 강합니다. 반면 투자자 커뮤니케이션이나 재무 분석 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "IR_ANALYTICS",
      label: "IR 분석/데이터형",
      aliases: [
        "IR analytics",
        "equity story analysis",
        "investor analysis"
      ],
      strongSignals: [
        "재무 데이터 기반 기업 스토리 분석",
        "밸류에이션 및 비교기업 분석",
        "시장/투자자 반응 분석",
        "IR 메시지 데이터 근거 정리",
        "실적 변동 요인 분석",
        "투자자 관점 리포트 작성",
        "주가 및 거래 데이터 분석"
      ],
      mediumSignals: [
        "엑셀 모델링",
        "재무 지표 추적",
        "리서치 자료 정리",
        "애널리스트 리포트 분석",
        "내부 보고용 분석 자료 작성"
      ],
      boundarySignals: [
        "외부 커뮤니케이션 비중이 커지면 IR 커뮤니케이션형으로 이동",
        "공시 문서 작성 비중이 커지면 공시형으로 이동",
        "내부 의사결정 지원 중심이면 재무기획(FP&A)로 이동"
      ],
      adjacentFamilies: [
        "INVESTOR_RELATIONS_COMMUNICATION",
        "DISCLOSURE_COMPLIANCE",
        "FINANCIAL_PLANNING_ANALYSIS"
      ],
      boundaryNote: "재무 데이터와 시장 정보를 분석해 IR 메시지를 만드는 역할이면 IR 분석/데이터형으로 읽힙니다. 반면 커뮤니케이션이나 공시 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 재무 데이터와 시장 정보를 분석해 투자자 관점의 인사이트를 만드는 성격이 강합니다. 반면 커뮤니케이션이나 공시 작성 비중이 커지면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "IR_MANAGER",
      label: "IR 매니저",
      aliases: [
        "IR manager",
        "investor relations manager"
      ],
      family: "INVESTOR_RELATIONS_COMMUNICATION",
      responsibilityHints: [
        "투자자 미팅 대응",
        "IR 자료 작성",
        "컨퍼런스콜 운영",
        "시장 커뮤니케이션"
      ],
      levelHints: [
        "초기에는 자료 준비 및 대응 지원 중심이고",
        "상위 레벨에서는 IR 전략과 메시지 주도 비중이 커집니다"
      ]
    },
    {
      id: "DISCLOSURE_OFFICER",
      label: "공시 담당자",
      aliases: [
        "disclosure officer"
      ],
      family: "DISCLOSURE_COMPLIANCE",
      responsibilityHints: [
        "공시 문서 작성",
        "공시 일정 관리",
        "규제 대응",
        "자료 취합 및 검토"
      ],
      levelHints: [
        "주니어는 문서 작성과 자료 취합 중심이고",
        "시니어는 공시 리스크 관리와 기준 해석 비중이 커집니다"
      ]
    },
    {
      id: "IR_ANALYST",
      label: "IR 애널리스트",
      aliases: [
        "IR analyst"
      ],
      family: "IR_ANALYTICS",
      responsibilityHints: [
        "재무 분석",
        "밸류에이션",
        "시장 데이터 분석",
        "리포트 작성"
      ],
      levelHints: [
        "초기에는 데이터 정리와 분석 지원 중심이고",
        "상위 레벨에서는 인사이트 도출과 메시지 기여 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "핵심 업무 중심",
      values: [
        "투자자 커뮤니케이션",
        "공시/규제 대응",
        "재무/시장 분석"
      ]
    },
    {
      axisId: "OUTPUT_TYPE",
      label: "주요 산출물",
      values: [
        "IR 발표 자료",
        "공시 문서",
        "분석 리포트"
      ]
    },
    {
      axisId: "EXTERNAL_INTERACTION",
      label: "외부 접점 수준",
      values: [
        "높음(투자자 직접 대응)",
        "중간(기관/규제 대응)",
        "낮음(내부 분석 중심)"
      ]
    },
    {
      axisId: "TIME_ORIENTATION",
      label: "업무 시점",
      values: [
        "실적 발표 및 이벤트 중심",
        "법정 일정 중심",
        "지속적 분석"
      ]
    }
  ],
  adjacentFamilies: [
    "재무기획",
    "PR",
    "법무",
    "경영기획"
  ],
  boundaryHints: [
    "투자자 미팅과 IR 메시지 전달 비중이 커지면 IR 커뮤니케이션형으로 읽힙니다.",
    "공시 문서 작성과 규제 대응 비중이 커지면 공시/규제 대응형으로 이동합니다.",
    "재무 데이터 분석과 밸류에이션 비중이 커지면 IR 분석형으로 이동합니다.",
    "내부 의사결정 지원 중심으로 이동하면 재무기획 직무로 해석될 수 있습니다.",
    "외부 홍보 및 브랜드 메시지 중심이면 PR 직무와 경계가 겹칠 수 있습니다."
  ],
  summaryTemplate: "이 직무는 투자자와 시장을 대상으로 기업 정보를 전달하고 공시를 수행하는 역할로 구성됩니다. 커뮤니케이션, 공시, 분석 중 어디에 중심이 있느냐에 따라 역할이 나뉩니다. 반면 내부 재무 의사결정 지원이나 홍보 중심으로 이동하면 인접 직무로 해석될 수 있습니다."
};
