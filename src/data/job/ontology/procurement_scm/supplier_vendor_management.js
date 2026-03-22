export const JOB_ONTOLOGY_ITEM = {
  vertical: "PROCUREMENT_SCM",
  subVertical: "SUPPLIER_VENDOR_MANAGEMENT",
  aliases: [
    "협력사 관리",
    "벤더 관리",
    "vendor management",
    "supplier management",
    "SRM",
    "협력사 운영",
    "파트너 관리",
    "외주 관리",
    "vendor relations",
    "supplier relations",
    "협력사 담당",
    "파트너십 관리"
  ],
  families: [
    {
      id: "RELATIONSHIP_MANAGEMENT",
      label: "관계 관리 중심형",
      aliases: [
        "vendor relations",
        "supplier relationship",
        "SRM"
      ],
      strongSignals: [
        "협력사와의 정기 커뮤니케이션 운영",
        "협력사 미팅 및 관계 유지",
        "협력사 이슈 조율 및 갈등 중재",
        "장기 파트너십 관리",
        "협력사 요청 및 문의 대응 창구 역할",
        "내부-외부 커뮤니케이션 연결"
      ],
      mediumSignals: [
        "협력사 커뮤니케이션 로그 관리",
        "협력사 만족도 확인",
        "파트너 관계 개선 활동",
        "이슈 리포트 공유",
        "내부 부서와 협력사 간 조율"
      ],
      boundarySignals: [
        "성과 지표 관리 비중이 커지면 성과 관리형으로 이동",
        "계약 조건 협상 비중이 커지면 조달/소싱으로 이동",
        "운영 일정 및 납기 관리 비중이 커지면 운영 조율형으로 이동"
      ],
      adjacentFamilies: [
        "PERFORMANCE_MANAGEMENT",
        "OPERATION_COORDINATION",
        "STRATEGIC_SOURCING"
      ],
      boundaryNote: "협력사와의 관계 유지와 커뮤니케이션 조율이 핵심이면 관계 관리 중심형으로 읽힙니다. 반면 성과나 실행 관리가 강조되면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 협력사와의 관계를 유지하고 커뮤니케이션을 조율하는 성격이 강합니다. 반면 성과 관리나 운영 실행 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "PERFORMANCE_MANAGEMENT",
      label: "성과 관리 중심형",
      aliases: [
        "supplier performance",
        "vendor performance",
        "KPI management"
      ],
      strongSignals: [
        "협력사 KPI 설정 및 관리",
        "납기/품질/비용 성과 평가",
        "협력사 등급 산정",
        "정기 성과 리뷰 운영",
        "성과 개선 계획 수립",
        "성과 데이터 분석 및 리포트 작성"
      ],
      mediumSignals: [
        "성과 지표 트래킹",
        "평가 리포트 정리",
        "이슈 원인 분석",
        "개선 과제 관리",
        "성과 회의 지원"
      ],
      boundarySignals: [
        "커뮤니케이션 및 관계 유지 비중이 커지면 관계 관리형으로 이동",
        "품질 기준 및 검사 중심이면 품질관리로 이동",
        "계약 및 가격 협상 비중이 커지면 조달/소싱으로 이동"
      ],
      adjacentFamilies: [
        "RELATIONSHIP_MANAGEMENT",
        "QUALITY_MANAGEMENT",
        "STRATEGIC_SOURCING"
      ],
      boundaryNote: "협력사의 성과를 측정하고 개선하는 책임이 중심이면 성과 관리 중심형으로 읽힙니다. 반면 관계 유지나 협상 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 협력사의 성과를 측정하고 개선하는 데 집중하는 성격이 강합니다. 반면 관계 관리나 협상 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "RISK_COMPLIANCE",
      label: "리스크/컴플라이언스형",
      aliases: [
        "supplier risk",
        "vendor compliance",
        "supplier audit"
      ],
      strongSignals: [
        "협력사 리스크 평가 및 관리",
        "협력사 감사 및 실사 수행",
        "ESG 및 윤리 기준 점검",
        "계약 준수 여부 확인",
        "공급망 리스크 대응",
        "규정 위반 이슈 처리"
      ],
      mediumSignals: [
        "리스크 체크리스트 운영",
        "감사 자료 준비",
        "리스크 리포트 작성",
        "내부 규정 교육",
        "외부 감사 대응 지원"
      ],
      boundarySignals: [
        "성과 지표 관리 비중이 커지면 성과 관리형으로 이동",
        "법률 해석 중심이면 법무로 이동",
        "운영 실행 대응 비중이 커지면 운영 조율형으로 이동"
      ],
      adjacentFamilies: [
        "PERFORMANCE_MANAGEMENT",
        "LEGAL_COMPLIANCE",
        "OPERATION_COORDINATION"
      ],
      boundaryNote: "협력사 리스크와 규정 준수 관리가 핵심이면 리스크/컴플라이언스형으로 읽힙니다. 반면 성과나 운영 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 협력사의 리스크와 규정 준수를 관리하는 성격이 강합니다. 반면 성과 관리나 운영 실행 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "OPERATION_COORDINATION",
      label: "운영 조율 중심형",
      aliases: [
        "vendor coordination",
        "supplier operation",
        "partner operation"
      ],
      strongSignals: [
        "협력사 작업 일정 및 납기 조율",
        "물량 및 공급 일정 관리",
        "운영 이슈 실시간 대응",
        "프로젝트 단위 협력사 운영 관리",
        "내부 실행 조직과 협력사 간 조율",
        "운영 상태 모니터링"
      ],
      mediumSignals: [
        "운영 데이터 정리",
        "이슈 로그 관리",
        "일정 관리",
        "실행 리포트 작성",
        "협력사 요청 처리"
      ],
      boundarySignals: [
        "발주 및 구매 중심이면 구매 운영으로 이동",
        "물류 흐름 및 재고 관리 비중이 커지면 물류 직무로 이동",
        "관계 유지 중심이면 관계 관리형으로 이동"
      ],
      adjacentFamilies: [
        "PROCUREMENT_OPERATION",
        "LOGISTICS_OPERATION",
        "RELATIONSHIP_MANAGEMENT"
      ],
      boundaryNote: "협력사와의 실제 운영 실행을 조율하는 비중이 크면 운영 조율 중심형으로 읽힙니다. 반면 관계나 성과 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 협력사와의 운영 실행을 조율하는 성격이 강합니다. 반면 관계 관리나 성과 평가 중심으로 이동하면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "VENDOR_MANAGER",
      label: "벤더 매니저",
      aliases: [
        "vendor manager",
        "supplier manager"
      ],
      family: "RELATIONSHIP_MANAGEMENT",
      responsibilityHints: [
        "협력사 커뮤니케이션",
        "관계 유지",
        "이슈 조율",
        "파트너십 관리"
      ],
      levelHints: [
        "초기에는 커뮤니케이션 지원 중심이고",
        "상위 레벨에서는 관계 전략 및 협상 관여도가 높아집니다"
      ]
    },
    {
      id: "SUPPLIER_PERFORMANCE_ANALYST",
      label: "협력사 성과 담당",
      aliases: [
        "supplier performance analyst"
      ],
      family: "PERFORMANCE_MANAGEMENT",
      responsibilityHints: [
        "성과 지표 관리",
        "평가 리포트 작성",
        "데이터 분석",
        "개선 과제 도출"
      ],
      levelHints: [
        "주니어는 데이터 정리 중심이고",
        "시니어는 성과 개선 전략 설계 비중이 커집니다"
      ]
    },
    {
      id: "SUPPLIER_RISK_MANAGER",
      label: "협력사 리스크 담당",
      aliases: [
        "supplier risk manager"
      ],
      family: "RISK_COMPLIANCE",
      responsibilityHints: [
        "리스크 평가",
        "감사 대응",
        "규정 준수 점검",
        "이슈 대응"
      ],
      levelHints: [
        "초기에는 점검 및 자료 관리 중심이고",
        "상위 레벨에서는 리스크 정책 설계 비중이 커집니다"
      ]
    },
    {
      id: "VENDOR_COORDINATOR",
      label: "벤더 운영 담당",
      aliases: [
        "vendor coordinator"
      ],
      family: "OPERATION_COORDINATION",
      responsibilityHints: [
        "일정 조율",
        "납기 관리",
        "운영 이슈 대응",
        "실행 관리"
      ],
      levelHints: [
        "주니어는 일정 관리 중심이고",
        "경험이 쌓이면 전체 운영 조율 책임이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS",
      label: "업무 중심",
      values: [
        "관계 관리",
        "성과 관리",
        "리스크 관리",
        "운영 실행"
      ]
    },
    {
      axisId: "TIME_FRAME",
      label: "업무 시점",
      values: [
        "지속적 관계 유지",
        "주기적 평가",
        "사전 리스크 점검",
        "실시간 대응"
      ]
    },
    {
      axisId: "OUTPUT",
      label: "핵심 산출물",
      values: [
        "관계 상태",
        "성과 리포트",
        "리스크 평가",
        "운영 결과"
      ]
    },
    {
      axisId: "INTERACTION",
      label: "주요 협업 대상",
      values: [
        "협력사",
        "내부 조직",
        "리스크/감사 조직",
        "운영 조직"
      ]
    }
  ],
  adjacentFamilies: [
    "구매",
    "물류",
    "품질관리",
    "법무"
  ],
  boundaryHints: [
    "협력사 커뮤니케이션과 관계 유지 비중이 커지면 관계 관리형으로 읽힙니다.",
    "성과 지표 관리와 평가 비중이 커지면 성과 관리형으로 이동합니다.",
    "리스크 점검과 감사 대응 비중이 커지면 리스크/컴플라이언스형으로 이동합니다.",
    "납기 및 실행 조율 비중이 커지면 운영 조율형으로 이동합니다.",
    "가격 협상 및 계약 중심이면 조달/구매 직무로 해석될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 협력사와의 관계, 성과, 리스크, 운영을 관리하는 역할로 구성됩니다. 어떤 책임 비중이 큰지에 따라 역할이 나뉩니다. 반면 구매 협상이나 물류 실행 중심으로 이동하면 인접 직무로 해석될 수 있습니다."
};
