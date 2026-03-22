export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "FINANCE",
  aliases: [
    "재무",
    "재무관리",
    "재무팀",
    "Finance",
    "Corporate Finance",
    "재무기획",
    "자금",
    "Treasury",
    "자금관리",
    "재무분석",
    "FP&A",
    "Financial Planning & Analysis",
    "투자검토",
    "IR 재무",
    "재무전략"
  ],
  families: [
    {
      id: "fpna_financial_planning",
      label: "재무기획·분석(FP&A)",
      aliases: [
        "재무기획",
        "FP&A",
        "경영계획",
        "예산관리",
        "손익관리",
        "Financial Planning",
        "재무분석"
      ],
      strongSignals: [
        "연간/분기 예산 수립 및 관리",
        "실적 대비 예산 분석(Budget vs Actual)",
        "손익(P&L) 분석 및 리포트 작성",
        "경영진 보고용 재무 리포트 작성",
        "사업계획 수립 및 재무 시뮬레이션",
        "비용 구조 분석 및 개선안 도출"
      ],
      mediumSignals: [
        "부서별 예산 협의",
        "매출·비용 트렌드 분석",
        "재무 KPI 정의 및 관리",
        "엑셀 기반 재무 모델링",
        "사업부 손익 리뷰 미팅 참여"
      ],
      boundarySignals: [
        "자금 운용보다 손익 분석과 계획 수립 비중이 크면 이 family에 가깝다",
        "외부 투자자 대응보다 내부 경영 리포트 비중이 크면 이 family에 가깝다",
        "회계 처리보다 계획·분석·의사결정 지원 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "treasury_cash_management",
        "investment_mna_finance",
        "ir_finance"
      ],
      boundaryNote: "실제 자금 이동이나 투자 실행보다 사업 성과를 분석하고 계획을 수립하는 책임이 커질수록 재무기획·분석으로 읽힙니다. 반면 자금 흐름 관리나 투자 의사결정 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 손익을 기반으로 사업 성과를 분석하고 재무 계획을 수립하는 성격이 강합니다. 경영 의사결정을 지원하는 리포트와 예산 관리가 핵심입니다. 반면 자금 운용이나 투자 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "treasury_cash_management",
      label: "자금·유동성 관리",
      aliases: [
        "자금관리",
        "자금팀",
        "Treasury",
        "Cash Management",
        "유동성 관리",
        "자금 운용"
      ],
      strongSignals: [
        "일일 자금 수지 관리",
        "현금 흐름(Cash Flow) 관리 및 예측",
        "차입 및 상환 관리",
        "금융기관 커뮤니케이션 및 계약 관리",
        "단기 자금 운용 및 예치",
        "외환 관리 및 환리스크 대응"
      ],
      mediumSignals: [
        "계좌 잔액 모니터링",
        "자금 집행 일정 관리",
        "금융상품 검토",
        "이자 비용 관리",
        "자금 관련 내부 보고"
      ],
      boundarySignals: [
        "손익 분석보다 실제 자금 흐름 관리 비중이 크면 이 family에 가깝다",
        "투자 검토보다 현금 유동성 안정성 확보 비중이 크면 이 family에 가깝다",
        "리포트보다 자금 실행과 운영 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "fpna_financial_planning",
        "investment_mna_finance",
        "accounting"
      ],
      boundaryNote: "계획이나 분석보다 실제 현금 흐름과 자금 조달을 관리하는 책임이 커질수록 자금·유동성 관리로 읽힙니다. 반면 자금 자체보다 사업 성과 분석이나 투자 판단 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기업의 현금 흐름과 자금 유동성을 안정적으로 관리하는 성격이 강합니다. 실제 자금 운용과 금융기관 대응이 핵심입니다. 반면 분석이나 투자 판단 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "investment_mna_finance",
      label: "투자·M&A 재무",
      aliases: [
        "투자 재무",
        "M&A",
        "기업 인수합병",
        "Investment",
        "Deal Finance",
        "Corporate Development",
        "투자 검토"
      ],
      strongSignals: [
        "기업 가치 평가(Valuation)",
        "투자 타당성 분석 및 재무 모델링",
        "M&A 딜 구조 설계",
        "실사(Due Diligence) 재무 검토",
        "투자안 보고서 작성",
        "인수 후 재무 통합 계획 수립"
      ],
      mediumSignals: [
        "시장 및 경쟁사 분석",
        "재무 시나리오 분석",
        "외부 자문사 협업",
        "투자 조건 협의 지원",
        "포트폴리오 성과 모니터링"
      ],
      boundarySignals: [
        "일상 자금 관리보다 특정 투자 건 분석 비중이 크면 이 family에 가깝다",
        "내부 예산 관리보다 외부 투자 의사결정 지원 비중이 크면 이 family에 가깝다",
        "정기 리포트보다 딜 단위 프로젝트 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "fpna_financial_planning",
        "treasury_cash_management",
        "ir_finance"
      ],
      boundaryNote: "정기적인 재무 관리보다 특정 투자나 인수합병 프로젝트 중심으로 재무 분석을 수행할수록 투자·M&A 재무로 읽힙니다. 반면 반복적인 계획·리포트 업무가 중심이면 FP&A 쪽으로 이동합니다.",
      summaryTemplate: "이 직무는 투자나 인수합병과 같은 개별 딜의 재무적 타당성을 분석하는 성격이 강합니다. 기업 가치 평가와 재무 모델링이 핵심입니다. 반면 일상적인 계획이나 자금 관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ir_finance",
      label: "IR·대외 재무 커뮤니케이션",
      aliases: [
        "IR",
        "Investor Relations",
        "투자자 관계",
        "공시",
        "재무 커뮤니케이션",
        "IR 재무"
      ],
      strongSignals: [
        "투자자 대상 재무 정보 설명",
        "실적 발표 자료 작성",
        "공시 자료 및 IR Deck 작성",
        "애널리스트 및 투자자 미팅 대응",
        "시장 커뮤니케이션 전략 수립",
        "주가 및 시장 반응 모니터링"
      ],
      mediumSignals: [
        "재무 데이터 정리 및 스토리라인 구성",
        "경영진 메시지 정리",
        "IR Q&A 대응 자료 준비",
        "경쟁사 IR 자료 분석",
        "투자자 피드백 정리"
      ],
      boundarySignals: [
        "내부 분석보다 외부 커뮤니케이션 비중이 크면 이 family에 가깝다",
        "재무 수치 계산보다 메시지 전달과 스토리 구성 비중이 크면 이 family에 가깝다",
        "자금 운용보다 투자자 대응 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "fpna_financial_planning",
        "investment_mna_finance",
        "strategy"
      ],
      boundaryNote: "재무 데이터를 내부 의사결정에 쓰기보다 외부 투자자에게 설명하고 커뮤니케이션하는 책임이 커질수록 IR·대외 재무로 읽힙니다. 반면 외부 대응보다 내부 분석과 계획 비중이 커지면 FP&A로 이동합니다.",
      summaryTemplate: "이 직무는 재무 정보를 외부 투자자와 시장에 전달하는 성격이 강합니다. 실적 설명과 커뮤니케이션 전략이 핵심입니다. 반면 내부 분석이나 투자 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "fpna_analyst",
      label: "재무기획 담당자",
      aliases: [
        "FP&A Analyst",
        "재무분석가",
        "예산 담당",
        "경영계획 담당"
      ],
      family: "fpna_financial_planning",
      responsibilityHints: [
        "예산 수립 및 관리",
        "손익 분석",
        "경영 리포트 작성",
        "사업계획 수립 지원"
      ],
      levelHints: [
        "데이터를 기반으로 사업 성과를 설명할 수 있다",
        "단순 집계가 아니라 분석과 인사이트 도출이 가능하다"
      ]
    },
    {
      id: "treasury_manager",
      label: "자금 담당자",
      aliases: [
        "Treasury Manager",
        "자금 관리자",
        "Cash Manager",
        "자금 운영 담당"
      ],
      family: "treasury_cash_management",
      responsibilityHints: [
        "자금 수지 관리",
        "현금 흐름 예측",
        "차입 및 상환 관리",
        "금융기관 대응"
      ],
      levelHints: [
        "자금 리스크를 관리할 수 있다",
        "유동성 확보를 위한 의사결정을 수행할 수 있다"
      ]
    },
    {
      id: "investment_analyst",
      label: "투자 재무 담당자",
      aliases: [
        "Investment Analyst",
        "M&A Analyst",
        "투자 분석가",
        "Corporate Development Analyst"
      ],
      family: "investment_mna_finance",
      responsibilityHints: [
        "기업 가치 평가",
        "투자 타당성 분석",
        "재무 모델링",
        "딜 검토 지원"
      ],
      levelHints: [
        "재무 모델을 통해 투자 가치를 설명할 수 있다",
        "딜 구조를 이해하고 분석할 수 있다"
      ]
    },
    {
      id: "ir_manager",
      label: "IR 담당자",
      aliases: [
        "IR Manager",
        "Investor Relations Manager",
        "공시 담당",
        "투자자 대응 담당"
      ],
      family: "ir_finance",
      responsibilityHints: [
        "실적 발표 자료 작성",
        "투자자 미팅 대응",
        "공시 자료 준비",
        "시장 커뮤니케이션"
      ],
      levelHints: [
        "재무 데이터를 외부 관점에서 설명할 수 있다",
        "시장과 투자자의 관심 포인트를 이해하고 대응할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "focus_object",
      label: "주요 대상",
      values: [
        "손익 및 사업 성과",
        "현금 및 유동성",
        "투자 대상 기업 및 딜",
        "외부 투자자 및 시장"
      ]
    },
    {
      axisId: "work_nature",
      label: "업무 성격",
      values: [
        "계획 및 분석 중심",
        "운영 및 실행 중심",
        "프로젝트 기반 분석",
        "커뮤니케이션 중심"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "중장기 계획",
        "단기 유동성 관리",
        "딜 단위 이벤트",
        "정기적 외부 커뮤니케이션"
      ]
    }
  ],
  adjacentFamilies: [
    "회계",
    "전략기획",
    "경영기획",
    "세무",
    "IR"
  ],
  boundaryHints: [
    "손익 분석과 예산 관리 비중이 커지면 재무기획으로 읽힙니다.",
    "현금 흐름과 자금 운용 비중이 커지면 자금 관리로 이동합니다.",
    "특정 투자나 인수합병 프로젝트 중심이면 투자·M&A 재무로 해석됩니다.",
    "외부 투자자 대응과 커뮤니케이션 비중이 커지면 IR로 읽힙니다.",
    "재무 기록과 처리 중심이면 회계와 경계가 가까워집니다."
  ],
  summaryTemplate: "재무 직무는 기업의 돈 흐름과 성과를 관리하고 의사결정을 지원하는 역할입니다. 손익 분석, 자금 운용, 투자 판단, 외부 커뮤니케이션 중 어디에 중심이 있는지에 따라 실제 역할이 달라집니다. 반면 회계 처리나 전략 수립 비중이 커지면 인접 직무로 해석될 수 있습니다."
};
