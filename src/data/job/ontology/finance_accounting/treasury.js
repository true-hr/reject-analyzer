export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "TREASURY",
  aliases: [
    "자금",
    "자금관리",
    "재무자금",
    "Treasury",
    "Corporate Treasury",
    "자금운용",
    "자금기획",
    "cash management",
    "fund management",
    "liquidity management",
    "자금조달",
    "차입금 관리",
    "외환관리",
    "FX management"
  ],
  families: [
    {
      id: "tr_cash_operations",
      label: "자금운영/출납",
      aliases: [
        "자금운영",
        "출납",
        "cash operations",
        "cash management",
        "자금집행",
        "지급관리",
        "입출금 관리"
      ],
      strongSignals: [
        "일일 자금 잔액 확인, 입출금 관리, 계좌 잔고를 관리한다",
        "지급 요청 검토 후 자금 집행, 송금, 이체를 실행한다",
        "계좌 관리, 법인계좌 개설·해지, 은행 거래를 직접 수행한다",
        "일별 cash position, 자금일보를 작성하고 보고한다",
        "지급 오류, 자금 이체 문제를 해결하고 운영 리스크를 관리한다"
      ],
      mediumSignals: [
        "지급 승인 프로세스 운영과 내부 통제 절차를 따른다",
        "자금 관련 시스템 입력 및 정합성 점검",
        "단기 유동성 상황을 모니터링하고 보고한다",
        "은행과의 일상적 커뮤니케이션을 수행한다"
      ],
      boundarySignals: [
        "자금계획 수립, 중장기 현금흐름 예측 비중이 커지면 자금기획으로 이동한다",
        "차입, 회사채 발행, 금융구조 설계 비중이 커지면 자금조달로 이동한다",
        "외환 포지션 관리, 환리스크 대응 비중이 커지면 외환관리로 이동한다"
      ],
      adjacentFamilies: [
        "tr_funding_planning",
        "tr_fundraising",
        "tr_fx_management"
      ],
      boundaryNote: "이 family는 자금의 실제 이동과 지급을 정확하게 처리하는 운영 성격이 강합니다. 계획이나 구조 설계보다 일별 자금 흐름과 집행 정확성이 핵심일 때 해당됩니다.",
      summaryTemplate: "이 직무는 자금의 실제 집행과 계좌 운영을 담당하는 성격이 강합니다. 일일 자금 잔액 관리와 지급 실행이 핵심이라면 이 family에 가깝습니다. 반면 자금 계획이나 조달 구조 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "tr_funding_planning",
      label: "자금기획/유동성관리",
      aliases: [
        "자금기획",
        "유동성 관리",
        "cash planning",
        "liquidity planning",
        "자금계획",
        "현금흐름 관리",
        "cash flow planning"
      ],
      strongSignals: [
        "중장기 자금 계획, cash flow forecast를 수립한다",
        "자금 수요와 공급을 예측하고 부족·잉여 자금을 관리한다",
        "운전자본, 현금흐름 구조를 분석하고 개선안을 제안한다",
        "자금 사용 계획과 재원 배분을 설계한다",
        "단기·중기 유동성 리스크를 관리하고 대응 전략을 수립한다"
      ],
      mediumSignals: [
        "월별, 분기별 자금 계획 리포트를 작성한다",
        "자금 사용 현황과 계획 대비 차이를 분석한다",
        "사업부와 협의해 자금 수요를 취합한다",
        "자금 관련 KPI와 지표를 관리한다"
      ],
      boundarySignals: [
        "실제 지급 실행, 계좌 관리, 자금 집행 비중이 커지면 자금운영으로 이동한다",
        "차입 구조 설계, 금융상품 활용, 조달 실행 비중이 커지면 자금조달로 이동한다",
        "환율 대응, 외환 거래, 헤지 전략 비중이 커지면 외환관리로 이동한다"
      ],
      adjacentFamilies: [
        "tr_cash_operations",
        "tr_fundraising",
        "tr_fx_management"
      ],
      boundaryNote: "이 family는 자금의 흐름을 계획하고 예측하는 역할입니다. 실제 집행보다는 자금이 언제 얼마나 필요한지, 어떻게 배분할지를 설계하는 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 자금의 흐름을 계획하고 유동성을 관리하는 성격이 강합니다. cash flow forecast와 자금 계획 수립이 핵심이라면 이 family에 가깝습니다. 반면 자금 집행이나 조달 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "tr_fundraising",
      label: "자금조달/금융구조",
      aliases: [
        "자금조달",
        "차입",
        "fundraising",
        "financing",
        "debt management",
        "회사채 발행",
        "대출 관리",
        "project financing",
        "PF"
      ],
      strongSignals: [
        "은행 차입, 회사채 발행 등 자금 조달을 실행한다",
        "금융기관과 협상해 금리, 조건, 한도를 설정한다",
        "차입금 구조, 상환 스케줄, 금융구조를 설계한다",
        "신규 자금 조달 방안을 검토하고 실행한다",
        "금융계약, covenant 조건을 관리한다"
      ],
      mediumSignals: [
        "금융시장 상황과 금리 환경을 모니터링한다",
        "조달 비용과 구조를 비교 분석한다",
        "내부 자금 계획과 연계해 조달 전략을 수립한다",
        "금융기관 리레이션을 관리한다"
      ],
      boundarySignals: [
        "일상적 자금 집행, 지급 운영 비중이 커지면 자금운영으로 이동한다",
        "자금 수요 예측과 계획 수립 중심이면 자금기획으로 이동한다",
        "환율 리스크 관리와 외환 거래 비중이 커지면 외환관리로 이동한다"
      ],
      adjacentFamilies: [
        "tr_funding_planning",
        "tr_cash_operations",
        "tr_fx_management"
      ],
      boundaryNote: "이 family는 외부 자금을 어떻게 확보하고 구조화할지에 초점이 있습니다. 단순 운영이나 계획보다 금융 거래와 구조 설계 책임이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 자금을 외부에서 조달하고 금융구조를 설계하는 성격이 강합니다. 차입, 회사채 발행, 금융기관 협상이 핵심이라면 이 family에 가깝습니다. 반면 자금 운영이나 계획 중심이면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "tr_fx_management",
      label: "외환/환리스크 관리",
      aliases: [
        "외환관리",
        "환관리",
        "FX management",
        "foreign exchange",
        "환리스크 관리",
        "hedging",
        "환율 대응",
        "외환 거래"
      ],
      strongSignals: [
        "외환 거래, 환전, 송금 시 환율을 관리한다",
        "환리스크를 분석하고 hedge 전략을 수립한다",
        "통화별 자금 포지션을 관리한다",
        "환율 변동에 따른 손익 영향을 분석한다",
        "선물환, 스왑 등 파생상품을 활용해 리스크를 관리한다"
      ],
      mediumSignals: [
        "환율 시장 동향을 모니터링한다",
        "외화 자금 계획과 연계해 환전 전략을 수립한다",
        "외화 계좌와 외화 흐름을 관리한다",
        "외환 관련 리포트를 작성한다"
      ],
      boundarySignals: [
        "외화 거래보다는 전체 자금 흐름 계획 비중이 커지면 자금기획으로 이동한다",
        "차입 구조 설계, 금융기관 협상 비중이 커지면 자금조달로 이동한다",
        "일상적 자금 집행과 계좌 운영 비중이 커지면 자금운영으로 이동한다"
      ],
      adjacentFamilies: [
        "tr_funding_planning",
        "tr_fundraising",
        "tr_cash_operations"
      ],
      boundaryNote: "이 family는 환율과 외화 자금에 특화된 역할입니다. 자금 업무 중에서도 통화와 환리스크 대응 비중이 클 때 해당됩니다.",
      summaryTemplate: "이 직무는 외환과 환리스크를 관리하는 성격이 강합니다. 환율 대응과 외화 자금 관리가 핵심이라면 이 family에 가깝습니다. 반면 일반 자금 운영이나 조달 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "cash_manager",
      label: "자금운영 담당자",
      aliases: [
        "자금담당",
        "출납담당",
        "Cash Manager",
        "Treasury Operations",
        "자금집행 담당"
      ],
      family: "tr_cash_operations",
      responsibilityHints: [
        "일일 자금 입출금과 계좌 잔액을 관리한다",
        "지급 요청을 검토하고 자금을 집행한다",
        "자금 운영 이슈를 해결하고 정확성을 유지한다"
      ],
      levelHints: [
        "주니어는 지급 실행과 데이터 입력 중심이다",
        "미들 레벨은 전체 자금 운영과 계좌 관리 책임을 진다",
        "시니어는 운영 통제와 리스크 관리까지 담당한다"
      ]
    },
    {
      id: "treasury_planner",
      label: "자금기획 담당자",
      aliases: [
        "자금기획자",
        "Treasury Planner",
        "Liquidity Manager",
        "Cash Flow Planner"
      ],
      family: "tr_funding_planning",
      responsibilityHints: [
        "자금 계획과 cash flow forecast를 수립한다",
        "자금 수요와 공급을 분석하고 조정한다",
        "유동성 리스크를 관리한다"
      ],
      levelHints: [
        "주니어는 데이터 수집과 기초 분석 중심이다",
        "미들 레벨은 계획 수립과 분석을 주도한다",
        "시니어는 전체 자금 전략과 방향을 설정한다"
      ]
    },
    {
      id: "treasury_fundraising_manager",
      label: "자금조달 담당자",
      aliases: [
        "자금조달 담당",
        "Funding Manager",
        "Financing Manager",
        "Debt Manager"
      ],
      family: "tr_fundraising",
      responsibilityHints: [
        "차입과 회사채 발행 등 자금 조달을 실행한다",
        "금융기관과 협상하고 조건을 설정한다",
        "조달 구조와 비용을 설계한다"
      ],
      levelHints: [
        "주니어는 자료 준비와 분석 보조를 한다",
        "미들 레벨은 조달 실행과 협상을 담당한다",
        "시니어는 금융구조와 전략을 설계한다"
      ]
    },
    {
      id: "fx_manager",
      label: "외환관리 담당자",
      aliases: [
        "외환 담당",
        "FX Manager",
        "환관리 담당",
        "Foreign Exchange Manager"
      ],
      family: "tr_fx_management",
      responsibilityHints: [
        "외환 거래와 환율 리스크를 관리한다",
        "헤지 전략을 수립하고 실행한다",
        "외화 자금 포지션을 관리한다"
      ],
      levelHints: [
        "주니어는 거래 실행과 데이터 관리 중심이다",
        "미들 레벨은 환리스크 분석과 전략 수립을 한다",
        "시니어는 전사 환리스크 전략을 리드한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: [
        "자금 집행과 계좌 운영 중심",
        "자금 흐름 계획과 유동성 관리 중심",
        "외부 자금 조달과 금융구조 설계 중심",
        "외환과 환리스크 관리 중심"
      ]
    },
    {
      axisId: "time_horizon",
      label: "시간 관점",
      values: [
        "일별 운영과 단기 자금 흐름",
        "월·분기 단위 자금 계획",
        "중장기 조달 구조와 금융 전략",
        "환율 변동 대응과 실시간 포지션 관리"
      ]
    },
    {
      axisId: "core_activity",
      label: "핵심 활동",
      values: [
        "지급 실행과 계좌 관리",
        "현금흐름 예측과 계획 수립",
        "차입·발행·금융 협상",
        "환율 대응과 헤지 전략 실행"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "accounting_interface",
      label: "회계 인접 경계",
      whyAdjacent: [
        "자금 흐름과 회계 처리 데이터가 연결된다",
        "그러나 분개, 재무제표 작성이 중심이면 회계로 읽힌다"
      ]
    },
    {
      id: "fpna_interface",
      label: "FP&A 인접 경계",
      whyAdjacent: [
        "현금흐름 예측과 재무 계획에서 FP&A와 겹친다",
        "그러나 손익 중심 분석이면 FP&A 쪽에 가깝다"
      ]
    },
    {
      id: "risk_management_interface",
      label: "리스크관리 인접 경계",
      whyAdjacent: [
        "환리스크와 금융 리스크 관리에서 연결된다",
        "그러나 전사 리스크 관리 체계가 중심이면 별도 리스크 직무로 읽힌다"
      ]
    }
  ],
  boundaryHints: [
    "일일 자금 입출금과 지급 실행 비중이 커지면 자금운영으로 읽힙니다.",
    "현금흐름 예측과 자금 계획 수립 비중이 커지면 자금기획으로 읽힙니다.",
    "차입, 회사채 발행, 금융기관 협상 비중이 커지면 자금조달로 읽힙니다.",
    "외환 거래와 환리스크 대응 비중이 커지면 외환관리로 읽힙니다.",
    "손익 중심 분석과 사업계획 수립 비중이 커지면 FP&A로 이동할 수 있습니다."
  ],
  summaryTemplate: "자금 직무는 기업의 현금 흐름을 관리하고 필요한 자금을 확보하는 역할을 수행합니다. 다만 실제 자금 집행을 담당하는지, 자금 흐름을 계획하는지, 자금을 조달하는지, 또는 외환 리스크를 관리하는지에 따라 역할이 명확히 구분됩니다. 특히 자금의 이동을 직접 다루는지, 구조와 계획을 설계하는지에 따라 핵심 경계가 갈립니다."
};
