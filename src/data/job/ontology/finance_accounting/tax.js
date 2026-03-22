export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "TAX",
  aliases: [
    "세무",
    "세무 담당",
    "세무회계",
    "기업 세무",
    "법인세 담당",
    "부가세 담당",
    "세무 신고",
    "세무 기장",
    "tax",
    "corporate tax",
    "tax accounting",
    "tax specialist",
    "tax manager",
    "tax compliance"
  ],
  families: [
    {
      id: "TAX_COMPLIANCE",
      label: "세무 신고·컴플라이언스",
      aliases: [
        "세무 신고",
        "tax compliance",
        "세무 신고 담당",
        "법인세/부가세 신고"
      ],
      strongSignals: [
        "법인세, 부가가치세, 원천세 등 각종 세금 신고를 직접 수행",
        "세무 신고 일정 관리 및 제출 책임",
        "세법 기준에 맞게 재무 데이터를 조정하여 과세표준 산출",
        "세무조정 계산서 작성 및 신고서 작성",
        "국세청, 지방세 신고 시스템을 활용한 신고 업무 수행",
        "외부 세무대리인과 협업하여 신고 검토 및 제출"
      ],
      mediumSignals: [
        "세무 관련 자료 수집 및 정리",
        "신고 오류 검토 및 수정",
        "세무 이슈 대응 및 질의 회신",
        "회계 데이터와 세무 데이터 간 차이 조정"
      ],
      boundarySignals: [
        "세무 전략 수립, 절세 구조 설계 비중이 커지면 세무 기획으로 이동",
        "세무 리스크 대응, 세무조사 대응 비중이 커지면 세무 리스크 관리로 이동",
        "기장, 전표 처리 등 회계 처리 비중이 커지면 회계로 이동"
      ],
      adjacentFamilies: [
        "TAX_PLANNING",
        "TAX_RISK_MANAGEMENT",
        "ACCOUNTING"
      ],
      boundaryNote: "정해진 세법에 따라 정확하게 신고를 수행하는 역할이 중심이면 세무 신고·컴플라이언스로 읽힙니다. 반면 전략 설계나 리스크 대응 비중이 커지면 다른 세무 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 법인세, 부가세 등 각종 세무 신고를 정확하게 수행하는 컴플라이언스 성격이 강합니다. 반면 절세 전략 수립이나 리스크 대응 비중이 커지면 다른 세무 영역으로 읽힐 수 있습니다."
    },
    {
      id: "TAX_PLANNING",
      label: "세무 기획·전략",
      aliases: [
        "세무 기획",
        "tax planning",
        "절세 전략",
        "tax strategy"
      ],
      strongSignals: [
        "사업 구조, 거래 구조를 고려한 세무 전략 설계",
        "법인세 부담을 최소화하기 위한 절세 방안 검토",
        "신규 사업 또는 투자 구조의 세무 영향 분석",
        "세법 변경에 따른 대응 전략 수립",
        "해외 진출, 법인 설립 시 세무 구조 설계",
        "경영진에게 세무 관점 의사결정 자문 제공"
      ],
      mediumSignals: [
        "세무 시뮬레이션 및 시나리오 분석",
        "세법 리서치 및 적용 검토",
        "외부 자문사와 협업하여 전략 수립",
        "내부 정책 및 가이드 정비"
      ],
      boundarySignals: [
        "실제 신고서 작성, 세무조정 등 실행 비중이 커지면 세무 컴플라이언스로 이동",
        "세무조사 대응, 리스크 관리 비중이 커지면 세무 리스크 관리로 이동",
        "재무 분석, 경영 계획 중심이면 재무기획으로 이동"
      ],
      adjacentFamilies: [
        "TAX_COMPLIANCE",
        "TAX_RISK_MANAGEMENT",
        "FP_AND_A"
      ],
      boundaryNote: "세금을 줄이기 위한 구조 설계와 전략 수립이 중심이면 세무 기획으로 읽힙니다. 반면 실제 신고 수행이나 리스크 대응 비중이 커지면 다른 세무 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 사업 구조와 거래 구조를 고려해 세무 전략을 설계하는 성격이 강합니다. 반면 실제 신고 수행이나 리스크 대응 비중이 커지면 다른 세무 영역으로 해석될 수 있습니다."
    },
    {
      id: "TAX_RISK_MANAGEMENT",
      label: "세무 리스크·조사 대응",
      aliases: [
        "세무 리스크",
        "세무 조사 대응",
        "tax risk",
        "tax audit",
        "tax controversy"
      ],
      strongSignals: [
        "세무조사 대응 및 자료 제출, 질의 대응 수행",
        "세무 리스크 식별 및 사전 점검",
        "과세 당국과의 커뮤니케이션 및 협상",
        "세무 이슈 발생 시 대응 전략 수립",
        "과거 신고 내역 점검 및 리스크 평가",
        "세무 분쟁, 이의신청, 심판 청구 대응"
      ],
      mediumSignals: [
        "세무 리스크 리포트 작성",
        "내부 통제 및 점검 프로세스 운영",
        "외부 자문사와 협업하여 대응 전략 마련",
        "세무 이슈 교육 및 내부 공유"
      ],
      boundarySignals: [
        "정기 신고 업무 비중이 커지면 세무 컴플라이언스로 이동",
        "절세 구조 설계 및 전략 수립 비중이 커지면 세무 기획으로 이동",
        "법적 분쟁, 계약 검토 비중이 커지면 법무로 이동"
      ],
      adjacentFamilies: [
        "TAX_COMPLIANCE",
        "TAX_PLANNING",
        "LEGAL"
      ],
      boundaryNote: "세무조사 대응과 리스크 관리가 핵심 역할이면 세무 리스크·조사 대응으로 읽힙니다. 반면 정기 신고나 전략 설계 비중이 커지면 다른 세무 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 세무 리스크를 사전에 관리하고 세무조사 대응을 수행하는 성격이 강합니다. 반면 신고 수행이나 절세 전략 수립 비중이 커지면 다른 세무 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "TAX_SPECIALIST",
      label: "세무 담당자",
      aliases: [
        "세무 담당",
        "tax specialist",
        "tax accountant"
      ],
      family: "TAX_COMPLIANCE",
      responsibilityHints: [
        "각종 세금 신고 및 자료 준비",
        "세무조정 및 신고서 작성",
        "세무 일정 관리",
        "외부 세무대리인 협업"
      ],
      levelHints: [
        "주니어는 신고 자료 준비와 검증 비중이 큼",
        "시니어는 복잡한 세무 이슈 검토 및 신고 책임 비중이 큼"
      ]
    },
    {
      id: "TAX_MANAGER",
      label: "세무 매니저",
      aliases: [
        "세무 매니저",
        "tax manager"
      ],
      family: "TAX_PLANNING",
      responsibilityHints: [
        "세무 전략 수립 및 절세 방안 검토",
        "사업 구조에 대한 세무 영향 분석",
        "경영진 자문",
        "세법 변화 대응"
      ],
      levelHints: [
        "중급 이상에서 전략 수립과 의사결정 지원 역할 수행",
        "시니어는 조직 전체 세무 전략을 리딩"
      ]
    },
    {
      id: "TAX_RISK_MANAGER",
      label: "세무 리스크 담당",
      aliases: [
        "세무 리스크 담당",
        "tax risk manager",
        "tax audit manager"
      ],
      family: "TAX_RISK_MANAGEMENT",
      responsibilityHints: [
        "세무조사 대응",
        "세무 리스크 식별 및 관리",
        "과세 당국 대응",
        "세무 분쟁 처리"
      ],
      levelHints: [
        "경험 기반 대응 역량 중요",
        "시니어는 복잡한 세무 분쟁 및 전략적 대응 수행"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_OBJECTIVE",
      label: "주요 목표",
      values: [
        "정확한 세무 신고",
        "세금 부담 최소화",
        "세무 리스크 최소화"
      ]
    },
    {
      axisId: "WORK_NATURE",
      label: "업무 성격",
      values: [
        "정해진 규정 기반 실행",
        "전략 설계 및 분석",
        "리스크 대응 및 협상"
      ]
    },
    {
      axisId: "TIME_HORIZON",
      label: "시간 관점",
      values: [
        "정기적 신고 사이클 중심",
        "중장기 구조 설계",
        "이슈 발생 시 대응 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "ACCOUNTING",
    "FP_AND_A",
    "LEGAL"
  ],
  boundaryHints: [
    "세무 신고와 제출 업무 비중이 높아지면 세무 컴플라이언스로 읽힙니다.",
    "절세 구조 설계와 전략 수립 비중이 커지면 세무 기획으로 이동합니다.",
    "세무조사 대응과 리스크 관리 비중이 커지면 세무 리스크 관리로 해석됩니다.",
    "전표 처리, 재무제표 작성 등 회계 업무 비중이 커지면 회계로 이동합니다.",
    "법적 해석, 계약 검토 비중이 커지면 법무 영역으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 기업의 세무 신고, 전략, 리스크를 다루는 세무 성격이 강합니다. 다만 신고 중심, 전략 중심, 리스크 대응 중심에 따라 실제 역할이 달라집니다. 반면 회계 처리나 법적 해석 비중이 커지면 인접 직무로 해석될 수 있습니다."
};
