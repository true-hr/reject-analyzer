export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "QUALITY_ASSURANCE_QA",
  aliases: [
    "품질보증",
    "QA",
    "quality assurance",
    "품질 보증",
    "제조 QA",
    "공정 QA",
    "고객품질",
    "supplier quality assurance",
    "SQA",
    "품질 시스템",
    "quality system",
    "quality compliance",
    "품질경영",
    "품질 인증",
    "품질 assurance"
  ],
  families: [
    {
      id: "PROCESS_QA",
      label: "공정 품질보증형",
      aliases: [
        "공정 QA",
        "process quality assurance",
        "제조 QA",
        "라인 QA"
      ],
      strongSignals: [
        "공정 이상 원인 분석 및 재발방지",
        "제조 라인 품질 기준 수립",
        "공정 변경점 품질 검토",
        "양산 초기 품질 안정화",
        "불량률 관리와 공정 개선 협업",
        "작업표준서 및 검사기준서 개정 검토",
        "현장 품질 이슈 대응"
      ],
      mediumSignals: [
        "CAPA 운영",
        "공정 감사 대응",
        "수율 지표 모니터링",
        "공정 조건 변경 검토",
        "생산/기술 부서와 품질 회의 운영"
      ],
      boundarySignals: [
        "출하 이후 고객 불만과 클레임 대응 비중이 커지면 고객 품질보증형으로 이동",
        "문서 체계와 인증 유지 비중이 커지면 시스템 품질보증형으로 이동",
        "협력사 불량과 공급사 개선 비중이 커지면 협력사 품질보증형으로 이동"
      ],
      adjacentFamilies: [
        "CUSTOMER_QA",
        "SYSTEM_QA",
        "SUPPLIER_QA"
      ],
      boundaryNote: "생산 공정 안에서 품질 기준을 설계하고 이상 원인과 재발방지를 다루는 비중이 크면 공정 품질보증형으로 읽힙니다. 반면 고객 대응이나 시스템 문서 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 생산 공정 안에서 품질을 안정화하고 재발방지 체계를 만드는 성격이 강합니다. 반면 고객 클레임 대응이나 인증 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "CUSTOMER_QA",
      label: "고객 품질보증형",
      aliases: [
        "고객 QA",
        "customer quality",
        "customer quality assurance",
        "CS 품질",
        "field quality"
      ],
      strongSignals: [
        "고객 클레임 접수 및 원인 분석",
        "8D report 작성 및 제출",
        "고객 감사 대응",
        "출하 이후 시장 불량 대응",
        "고객사 요구 품질 기준 반영",
        "고객 불량 재발방지 대책 수립",
        "대외 품질 커뮤니케이션"
      ],
      mediumSignals: [
        "VOC 기반 품질 이슈 정리",
        "고객사 방문 대응",
        "품질 개선 일정 관리",
        "대외 보고서 작성",
        "영업/개발/생산 부서와 대책 조율"
      ],
      boundarySignals: [
        "공정 내부 불량 안정화와 라인 기준 관리 비중이 커지면 공정 품질보증형으로 이동",
        "공급사 불량 개선과 협력사 감사 비중이 커지면 협력사 품질보증형으로 이동",
        "인증 문서와 내부 규정 유지 비중이 커지면 시스템 품질보증형으로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_QA",
        "SUPPLIER_QA",
        "SYSTEM_QA"
      ],
      boundaryNote: "고객사와 시장에서 발생한 품질 이슈를 설명하고 재발방지 대책을 조율하는 비중이 크면 고객 품질보증형으로 읽힙니다. 반면 내부 공정 관리나 시스템 유지 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객과 시장에서 발생한 품질 이슈를 해석하고 대외적으로 대응하는 성격이 강합니다. 반면 내부 공정 관리나 인증 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "SUPPLIER_QA",
      label: "협력사 품질보증형",
      aliases: [
        "협력사 QA",
        "supplier quality assurance",
        "SQA",
        "vendor quality"
      ],
      strongSignals: [
        "협력사 품질 평가 및 개선",
        "협력사 공정 감사",
        "입고 불량 원인 분석 및 시정조치",
        "협력사 CAPA 추적",
        "협력사 승인 및 품질 기준 점검",
        "외주 부품 품질 안정화",
        "공급망 품질 리스크 관리"
      ],
      mediumSignals: [
        "협력사 성과지표 관리",
        "부품 승인 문서 검토",
        "공급사 방문 점검",
        "입고 품질 데이터 분석",
        "구매/개발 부서와 공급사 개선 협업"
      ],
      boundarySignals: [
        "고객 클레임과 대외 보고 비중이 커지면 고객 품질보증형으로 이동",
        "내부 공정 불량과 생산 안정화 비중이 커지면 공정 품질보증형으로 이동",
        "규격서, 인증, 시스템 문서 유지 비중이 커지면 시스템 품질보증형으로 이동"
      ],
      adjacentFamilies: [
        "CUSTOMER_QA",
        "PROCESS_QA",
        "SYSTEM_QA"
      ],
      boundaryNote: "협력사와 공급망에서 발생하는 품질 리스크를 관리하고 시정조치를 이끄는 비중이 크면 협력사 품질보증형으로 읽힙니다. 반면 고객 대응이나 내부 공정 관리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 협력사와 공급망의 품질 수준을 관리하고 개선을 이끄는 성격이 강합니다. 반면 고객 대응이나 내부 공정 안정화 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "SYSTEM_QA",
      label: "시스템/인증 품질보증형",
      aliases: [
        "품질 시스템",
        "system QA",
        "quality system",
        "QMS",
        "인증 QA"
      ],
      strongSignals: [
        "ISO/IATF/GMP 등 인증 유지",
        "QMS 문서 체계 운영",
        "내부 심사 및 외부 심사 대응",
        "품질 규정 및 표준 제개정",
        "시정조치 체계 운영",
        "품질 시스템 교육",
        "전사 품질 기준 관리"
      ],
      mediumSignals: [
        "문서 개정 이력 관리",
        "감사 체크리스트 운영",
        "시스템 적합성 점검",
        "표준 준수 모니터링",
        "부서별 품질 체계 정비"
      ],
      boundarySignals: [
        "현장 불량과 공정 개선 비중이 커지면 공정 품질보증형으로 이동",
        "고객 클레임과 대외 품질 대응 비중이 커지면 고객 품질보증형으로 이동",
        "협력사 감사와 공급망 품질 비중이 커지면 협력사 품질보증형으로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_QA",
        "CUSTOMER_QA",
        "SUPPLIER_QA"
      ],
      boundaryNote: "인증 유지와 문서 체계, 내부 심사처럼 품질 시스템을 운영하는 비중이 크면 시스템/인증 품질보증형으로 읽힙니다. 반면 현장 문제 해결이나 고객 대응 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 품질 시스템과 인증 체계를 유지하고 조직의 품질 기준을 관리하는 성격이 강합니다. 반면 현장 공정 개선이나 고객 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PROCESS_QA_ENGINEER",
      label: "공정 QA 엔지니어",
      aliases: [
        "공정 QA 엔지니어",
        "process QA engineer",
        "manufacturing QA engineer"
      ],
      family: "PROCESS_QA",
      responsibilityHints: [
        "공정 불량 분석",
        "재발방지 대책 수립",
        "양산 품질 안정화",
        "공정 기준 관리"
      ],
      levelHints: [
        "주니어는 현장 이슈 추적과 데이터 정리 비중이 크고",
        "시니어는 공정 기준 설계와 유관 부서 조율 책임이 커집니다"
      ]
    },
    {
      id: "CUSTOMER_QA_MANAGER",
      label: "고객 QA 담당",
      aliases: [
        "고객 QA 담당",
        "customer quality manager",
        "field quality manager"
      ],
      family: "CUSTOMER_QA",
      responsibilityHints: [
        "고객 클레임 대응",
        "8D report 작성",
        "대외 감사 대응",
        "고객 요구사항 반영"
      ],
      levelHints: [
        "주니어는 자료 취합과 이슈 정리 비중이 크고",
        "시니어는 고객 커뮤니케이션과 개선 대책 총괄 비중이 커집니다"
      ]
    },
    {
      id: "SUPPLIER_QA_ENGINEER",
      label: "협력사 QA 엔지니어",
      aliases: [
        "협력사 QA 엔지니어",
        "SQA engineer",
        "supplier quality engineer"
      ],
      family: "SUPPLIER_QA",
      responsibilityHints: [
        "협력사 감사",
        "입고 불량 개선",
        "시정조치 추적",
        "공급사 품질 평가"
      ],
      levelHints: [
        "주니어는 불량 데이터 관리와 후속 조치 추적 비중이 크고",
        "시니어는 협력사 품질 체계 개선과 승인 판단 책임이 커집니다"
      ]
    },
    {
      id: "QMS_SPECIALIST",
      label: "품질시스템 담당",
      aliases: [
        "품질시스템 담당",
        "QMS specialist",
        "quality system specialist"
      ],
      family: "SYSTEM_QA",
      responsibilityHints: [
        "인증 유지",
        "문서 체계 운영",
        "내부 심사 대응",
        "품질 규정 관리"
      ],
      levelHints: [
        "주니어는 문서 운영과 심사 준비 비중이 크고",
        "시니어는 전사 품질 체계 설계와 인증 전략 책임이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "qa_scope",
      label: "품질보증의 주된 적용 범위",
      values: [
        "내부 생산 공정",
        "출하 이후 고객/시장",
        "협력사 및 공급망",
        "전사 시스템/인증 체계"
      ]
    },
    {
      axisId: "qa_primary_output",
      label: "주요 산출물의 형태",
      values: [
        "재발방지 대책과 공정 기준",
        "고객 대응 보고서와 개선 대책",
        "협력사 평가와 시정조치",
        "문서 체계와 인증 유지 결과"
      ]
    },
    {
      axisId: "qa_interaction",
      label: "가장 많이 맞닿는 이해관계자",
      values: [
        "생산/기술/제조 현장",
        "고객사와 대외 품질 창구",
        "협력사와 구매 조직",
        "내부 심사 조직과 인증 기관"
      ]
    },
    {
      axisId: "qa_problem_timing",
      label: "문제를 다루는 시점",
      values: [
        "양산 중 사전/동시 안정화",
        "출하 이후 사후 대응",
        "공급 이전 사전 승인과 사후 개선",
        "상시 체계 유지와 정기 심사 대응"
      ]
    }
  ],
  adjacentFamilies: [
    "품질관리(QC)",
    "생산기술",
    "구매/조달",
    "고객지원",
    "인증/규제대응"
  ],
  boundaryHints: [
    "현장 불량과 양산 안정화 비중이 커지면 공정 품질보증형으로 읽힙니다.",
    "고객 클레임, 8D report, 대외 감사 대응 비중이 커지면 고객 품질보증형으로 이동합니다.",
    "협력사 감사, 공급사 개선, 입고 불량 대응 비중이 커지면 협력사 품질보증형으로 이동합니다.",
    "QMS 문서, 인증 유지, 내부 심사 운영 비중이 커지면 시스템/인증 품질보증형으로 이동합니다.",
    "단순 검사와 판정, 측정 업무 비중이 커지고 원인·체계 설계 책임이 약해지면 품질관리(QC) 경계로 읽힐 수 있습니다."
  ],
  summaryTemplate: "이 직무는 제품이나 공정의 품질을 검사하는 데 그치기보다, 기준을 만들고 재발을 막는 체계를 운영하는 성격이 강합니다. 다만 공정 안정화, 고객 대응, 협력사 관리, 시스템 인증 중 어디에 책임 비중이 큰지에 따라 해석이 달라집니다. 반면 검사 실행 자체의 비중이 더 크면 품질관리(QC) 경계로 읽힐 수 있습니다."
};
