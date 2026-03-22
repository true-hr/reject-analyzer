export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "ACCOUNTING",
  aliases: [
    "회계",
    "재무회계",
    "accounting",
    "financial accounting",
    "회계 담당",
    "회계 관리",
    "경리",
    "general accounting",
    "회계 결산",
    "재무결산",
    "회계 처리",
    "회계 실무"
  ],
  families: [
    {
      id: "FINANCIAL_ACCOUNTING",
      label: "재무회계/결산형",
      aliases: [
        "financial accounting",
        "closing accounting",
        "결산 회계"
      ],
      strongSignals: [
        "월/분기/연 결산 수행",
        "재무제표 작성",
        "계정 과목 정리 및 검토",
        "전표 승인 및 마감",
        "외부 감사 대응",
        "IFRS 또는 K-GAAP 기준 적용",
        "회계 기준 검토"
      ],
      mediumSignals: [
        "회계 마감 일정 관리",
        "결산 리포트 작성",
        "감사 자료 준비",
        "계정 잔액 검증",
        "내부 보고용 재무자료 작성"
      ],
      boundarySignals: [
        "세무 신고 및 절세 검토 비중이 커지면 세무형으로 이동",
        "일상 전표 입력 및 비용 처리 비중이 커지면 회계 운영형으로 이동",
        "재무 분석 및 의사결정 지원 비중이 커지면 FP&A 경계로 이동"
      ],
      adjacentFamilies: [
        "TAX_ACCOUNTING",
        "ACCOUNTING_OPERATION",
        "FINANCIAL_PLANNING_ANALYSIS"
      ],
      boundaryNote: "결산과 재무제표 작성 중심으로 회계 기준을 적용하는 역할이면 재무회계/결산형으로 읽힙니다. 반면 세무나 운영 처리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 결산과 재무제표 작성 등 재무회계 기준을 적용하는 성격이 강합니다. 반면 세무 대응이나 단순 처리 업무 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "TAX_ACCOUNTING",
      label: "세무회계형",
      aliases: [
        "tax accounting",
        "세무",
        "tax compliance"
      ],
      strongSignals: [
        "법인세/부가세 신고",
        "세무 조정 및 계산",
        "세무 리스크 검토",
        "세무조사 대응",
        "세법 해석 및 적용",
        "세무 신고서 작성",
        "절세 전략 검토"
      ],
      mediumSignals: [
        "세무 일정 관리",
        "세무 관련 데이터 정리",
        "외부 세무사 협업",
        "세무 리포트 작성",
        "세법 변경 모니터링"
      ],
      boundarySignals: [
        "재무제표 중심 결산 업무 비중이 커지면 재무회계형으로 이동",
        "전표 처리 및 운영 업무 비중이 커지면 회계 운영형으로 이동",
        "재무 전략 및 분석 비중이 커지면 FP&A 경계로 이동"
      ],
      adjacentFamilies: [
        "FINANCIAL_ACCOUNTING",
        "ACCOUNTING_OPERATION",
        "FINANCIAL_PLANNING_ANALYSIS"
      ],
      boundaryNote: "세무 신고와 세법 적용, 세무 리스크 관리 중심이면 세무회계형으로 읽힙니다. 반면 결산이나 운영 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 세무 신고와 세법 기반 리스크 관리에 집중하는 성격이 강합니다. 반면 결산 중심이나 운영 업무 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "ACCOUNTING_OPERATION",
      label: "회계 운영/경리형",
      aliases: [
        "accounting operation",
        "general ledger",
        "경리"
      ],
      strongSignals: [
        "전표 입력 및 처리",
        "매입/매출 관리",
        "비용 처리 및 정산",
        "계좌 관리 및 자금 집행 기록",
        "세금계산서 발행 및 검증",
        "일일 회계 처리",
        "증빙 관리"
      ],
      mediumSignals: [
        "거래 데이터 정리",
        "회계 시스템 입력",
        "기초 계정 관리",
        "지출 내역 정리",
        "간단한 결산 지원"
      ],
      boundarySignals: [
        "결산 및 재무제표 작성 비중이 커지면 재무회계형으로 이동",
        "세무 신고 및 세법 검토 비중이 커지면 세무형으로 이동",
        "자동화 및 시스템 설계 비중이 커지면 회계 시스템/프로세스형으로 이동"
      ],
      adjacentFamilies: [
        "FINANCIAL_ACCOUNTING",
        "TAX_ACCOUNTING",
        "ACCOUNTING_PROCESS_SYSTEM"
      ],
      boundaryNote: "전표 처리와 거래 기록 등 반복적인 회계 운영 업무가 중심이면 회계 운영/경리형으로 읽힙니다. 반면 결산이나 세무 중심으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 전표 처리와 거래 관리 등 회계 운영 실행 중심의 성격이 강합니다. 반면 결산이나 세무 업무 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "ACCOUNTING_PROCESS_SYSTEM",
      label: "회계 프로세스/시스템형",
      aliases: [
        "accounting process",
        "accounting system",
        "회계 시스템"
      ],
      strongSignals: [
        "회계 프로세스 개선",
        "ERP 회계 모듈 운영 및 설계",
        "회계 자동화 구축",
        "내부통제 프로세스 설계",
        "업무 표준화",
        "시스템 요구사항 정의",
        "회계 데이터 흐름 설계"
      ],
      mediumSignals: [
        "프로세스 문서화",
        "시스템 테스트 및 검증",
        "운영 효율 개선 프로젝트",
        "유관 부서 협업",
        "회계 정책 반영 시스템 설계"
      ],
      boundarySignals: [
        "실제 전표 처리 및 운영 비중이 커지면 회계 운영형으로 이동",
        "재무제표 및 결산 비중이 커지면 재무회계형으로 이동",
        "데이터 분석 및 의사결정 지원 비중이 커지면 FP&A 경계로 이동"
      ],
      adjacentFamilies: [
        "ACCOUNTING_OPERATION",
        "FINANCIAL_ACCOUNTING",
        "FINANCIAL_PLANNING_ANALYSIS"
      ],
      boundaryNote: "회계 업무를 직접 수행하기보다 프로세스와 시스템을 설계하고 개선하는 역할이면 회계 프로세스/시스템형으로 읽힙니다. 반면 실행 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 회계 업무의 효율성과 정확성을 높이기 위한 프로세스와 시스템을 설계하는 성격이 강합니다. 반면 직접 회계 처리 비중이 커지면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "ACCOUNTANT",
      label: "회계 담당자",
      aliases: [
        "accountant"
      ],
      family: "FINANCIAL_ACCOUNTING",
      responsibilityHints: [
        "결산 수행",
        "재무제표 작성",
        "계정 관리",
        "감사 대응"
      ],
      levelHints: [
        "주니어는 결산 보조와 계정 정리 중심이고",
        "시니어는 결산 총괄 및 회계 기준 해석 비중이 커집니다"
      ]
    },
    {
      id: "TAX_SPECIALIST",
      label: "세무 담당자",
      aliases: [
        "tax specialist"
      ],
      family: "TAX_ACCOUNTING",
      responsibilityHints: [
        "세무 신고",
        "세무 조정",
        "세법 검토",
        "세무 리스크 관리"
      ],
      levelHints: [
        "초기에는 신고 지원 중심이고",
        "상위 레벨에서는 세무 전략 수립 비중이 커집니다"
      ]
    },
    {
      id: "ACCOUNTING_CLERK",
      label: "경리/회계 운영 담당",
      aliases: [
        "accounting clerk"
      ],
      family: "ACCOUNTING_OPERATION",
      responsibilityHints: [
        "전표 처리",
        "비용 정산",
        "거래 기록 관리",
        "증빙 관리"
      ],
      levelHints: [
        "주니어는 입력과 처리 중심이고",
        "경험이 쌓이면 일부 결산 지원까지 확장됩니다"
      ]
    },
    {
      id: "ACCOUNTING_PROCESS_MANAGER",
      label: "회계 프로세스 매니저",
      aliases: [
        "accounting process manager"
      ],
      family: "ACCOUNTING_PROCESS_SYSTEM",
      responsibilityHints: [
        "프로세스 설계",
        "ERP 운영",
        "자동화 구축",
        "내부통제 설계"
      ],
      levelHints: [
        "초기에는 개선 과제 수행 중심이고",
        "상위 레벨에서는 전사 프로세스 설계 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "ACCOUNTING_FOCUS",
      label: "회계 업무 중심",
      values: [
        "결산/재무보고",
        "세무 신고",
        "운영 처리",
        "프로세스/시스템"
      ]
    },
    {
      axisId: "TIME_ORIENTATION",
      label: "업무 시점",
      values: [
        "사후 보고",
        "법정 신고",
        "일상 처리",
        "구조 개선"
      ]
    },
    {
      axisId: "OUTPUT_TYPE",
      label: "산출물 형태",
      values: [
        "재무제표",
        "세무 신고서",
        "거래 기록",
        "프로세스/시스템"
      ]
    },
    {
      axisId: "RESPONSIBILITY_SCOPE",
      label: "책임 범위",
      values: [
        "계정 단위",
        "세무 영역",
        "거래 단위",
        "전사 프로세스"
      ]
    }
  ],
  adjacentFamilies: [
    "재무기획",
    "자금",
    "내부감사",
    "경영관리"
  ],
  boundaryHints: [
    "결산과 재무제표 작성 비중이 커지면 재무회계형으로 읽힙니다.",
    "세무 신고 및 세법 대응 비중이 커지면 세무회계형으로 이동합니다.",
    "전표 처리와 거래 기록 중심이면 회계 운영형으로 해석됩니다.",
    "시스템 구축과 프로세스 개선 비중이 커지면 회계 프로세스형으로 이동합니다.",
    "재무 분석과 의사결정 지원 비중이 커지면 재무기획 직무로 해석될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 기업의 재무 정보를 기록하고 보고하는 회계 기능을 수행하는 성격이 강합니다. 결산, 세무, 운영 처리, 프로세스 설계 중 어디에 집중하느냐에 따라 역할이 나뉩니다. 반면 재무 분석이나 전략 중심으로 이동하면 인접 직무로 해석될 수 있습니다."
};
