export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "CUSTOMER_SUPPORT_CS",
  aliases: [
    "고객상담",
    "고객 상담",
    "CS",
    "고객지원",
    "고객 응대",
    "고객센터",
    "인바운드 상담",
    "VOC 상담",
    "고객 문의 대응",
    "customer support",
    "customer service",
    "CS agent",
    "customer care",
    "support agent",
    "support specialist"
  ],
  families: [
    {
      id: "INBOUND_CASE_HANDLING_CS",
      label: "인바운드 문의처리형 CS",
      aliases: [
        "인바운드 CS",
        "문의처리형 고객상담",
        "고객 문의 응대",
        "ticket handling support",
        "inbound customer support"
      ],
      strongSignals: [
        "전화, 채팅, 이메일, 게시판 등으로 들어오는 고객 문의를 직접 처리한다",
        "주문, 결제, 배송, 환불, 계정, 이용방법 같은 반복 문의를 SLA 안에서 해결한다",
        "상담 건별 응답시간, 처리시간, 해결률, 재문의율을 주요 운영 지표로 본다",
        "매크로, 상담 스크립트, FAQ를 활용해 다수의 문의를 빠르게 처리한다",
        "문의 분류, 이관, 처리 완료까지 케이스 단위로 운영한다",
        "상담 품질보다도 우선 기본적인 정확한 안내와 처리 속도가 중요하게 관리된다"
      ],
      mediumSignals: [
        "반복성 높은 유형 문의를 정해진 정책에 따라 안내한다",
        "고객센터 솔루션이나 티켓 시스템 안에서 상담 이력 관리 비중이 크다",
        "복잡한 문제 해결보다 문의 접수와 1차 응대 비중이 높다",
        "운영정책 변경 시 스크립트나 안내문을 업데이트해 바로 적용한다"
      ],
      boundarySignals: [
        "클레임 조정, 감정 진정, 예외 보상 판단 비중이 커지면 클레임·분쟁조정형 CS로 이동한다",
        "원인 분석과 정책·프로세스 개선 제안 비중이 커지면 VOC·개선연계형 CS로 이동한다",
        "제품 장애 분석과 기술적 재현·로그 확인 비중이 커지면 테크니컬 서포트 경계로 이동한다",
        "상담 인력 운영, 배치, 품질관리, KPI 관리 비중이 커지면 CS 운영관리 경계가 강해진다"
      ],
      adjacentFamilies: [
        "CLAIM_RESOLUTION_CS",
        "VOC_PROCESS_IMPROVEMENT_CS",
        "ACCOUNT_RETENTION_CS"
      ],
      boundaryNote: "고객 문의를 빠르고 정확하게 접수·안내·처리하는 역할이 중심이면 이 family로 읽힙니다. 반면 예외 조정, 원인 분석, 재발 방지, 이탈 방어 책임이 더 커지면 다른 family로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 고객 문의를 접수하고 정책에 따라 빠르게 해결하는 인바운드 문의처리형 CS 성격이 강합니다. 반면 클레임 조정이나 개선 과제 도출, 이탈 방어 비중이 커지면 다른 고객상담 / CS 경계로 읽힐 수 있습니다."
    },
    {
      id: "CLAIM_RESOLUTION_CS",
      label: "클레임·분쟁조정형 CS",
      aliases: [
        "클레임 CS",
        "불만고객 대응",
        "분쟁조정형 고객상담",
        "complaint handling",
        "escalation support",
        "claim resolution"
      ],
      strongSignals: [
        "불만, 항의, 서비스 실패, 오배송, 환불 분쟁 같은 고난도 케이스를 직접 조정한다",
        "고객 감정을 진정시키면서 보상안, 예외 처리, 후속 조치를 판단한다",
        "에스컬레이션 건을 받아 상황을 정리하고 관련 부서와 해결안을 맞춘다",
        "정책과 고객 경험 사이에서 예외 처리 기준을 적용하거나 상향 승인한다",
        "민원성 문의, 리뷰 악화 가능성, 환불 갈등 등 리스크가 큰 케이스를 다룬다",
        "단순 응답 속도보다 분쟁 완화, 재발 방지, 고객 수용 가능성 확보가 중요하다"
      ],
      mediumSignals: [
        "고객 감정 케어와 설명 방식이 상담 성과에 큰 영향을 준다",
        "표준 스크립트보다 상황별 조정과 설득 비중이 높다",
        "보상정책, 예외정책, escalation rule을 자주 참고한다",
        "이슈 종료 후 관련 부서에 개선 필요사항을 전달한다"
      ],
      boundarySignals: [
        "반복 문의를 대량 처리하는 비중이 커지면 인바운드 문의처리형 CS로 이동한다",
        "개별 클레임 해결보다 원인 데이터 축적과 재발 방지 개선 비중이 커지면 VOC·개선연계형 CS로 이동한다",
        "이탈 고객 설득과 재구매 방어 비중이 커지면 계정유지·리텐션형 CS로 이동한다",
        "법적 분쟁, 제휴사 책임 조율, 대외 민원 대응이 핵심이면 컴플라이언스나 운영정책 경계가 강해진다"
      ],
      adjacentFamilies: [
        "INBOUND_CASE_HANDLING_CS",
        "VOC_PROCESS_IMPROVEMENT_CS",
        "ACCOUNT_RETENTION_CS"
      ],
      boundaryNote: "고객 불만과 분쟁 상황을 조정하고 감정적 긴장을 완화하며 해결안을 만드는 역할이 핵심이면 이 family로 읽힙니다. 반면 대량 문의 처리나 데이터 기반 개선, 이탈 방어가 더 중요하면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 불만과 분쟁 상황을 조정하고 고객 수용 가능한 해결안을 만드는 클레임·분쟁조정형 CS 성격이 강합니다. 반면 반복 문의 처리나 VOC 분석, 리텐션 방어 비중이 커지면 다른 고객상담 / CS 경계로 읽힐 수 있습니다."
    },
    {
      id: "VOC_PROCESS_IMPROVEMENT_CS",
      label: "VOC·개선연계형 CS",
      aliases: [
        "VOC CS",
        "개선연계형 고객상담",
        "고객의견 분석 CS",
        "VOC management",
        "customer feedback support",
        "support insight operations"
      ],
      strongSignals: [
        "고객 문의와 불만을 유형화해 반복 원인과 개선 과제를 도출한다",
        "상담 현장에서 나온 문제를 제품, 운영, 정책 개선 안건으로 연결한다",
        "VOC 리포트, 이슈 트렌드, 반복 접점 문제를 정리해 내부 공유한다",
        "재문의가 많이 발생하는 지점이나 FAQ 미흡 영역을 찾아 개선한다",
        "케이스 처리 자체보다 왜 같은 문의가 반복되는지 분석하는 비중이 크다",
        "상담 데이터, 태깅, 이슈 카테고리, 고객 표현을 바탕으로 개선 우선순위를 제안한다"
      ],
      mediumSignals: [
        "주간·월간 VOC 보고서를 만들고 유관부서와 액션을 조율한다",
        "스크립트 개정, 정책 문구 수정, 프로세스 보완 같은 후속 조치를 만든다",
        "상담건 수보다 반복 이슈 감소나 문의 구조 개선을 더 중요하게 본다",
        "운영 현장의 문제를 내부 개선 언어로 번역하는 역할이 있다"
      ],
      boundarySignals: [
        "직접 고객 응대와 문의 처리 비중이 커지면 인바운드 문의처리형 CS로 이동한다",
        "감정 진정과 예외 조정 중심의 고난도 케이스 처리 비중이 커지면 클레임·분쟁조정형 CS로 이동한다",
        "상담 인력 생산성, 스케줄링, QA 운영 비중이 커지면 CS 운영관리 경계로 이동한다",
        "제품 기능 요구사항 정의와 상세 정책 설계 비중이 커지면 서비스기획 또는 운영기획 경계가 강해진다"
      ],
      adjacentFamilies: [
        "INBOUND_CASE_HANDLING_CS",
        "CLAIM_RESOLUTION_CS",
        "ACCOUNT_RETENTION_CS"
      ],
      boundaryNote: "고객 응대 경험을 끝내지 않고 반복 원인과 프로세스 문제를 찾아 내부 개선으로 연결하면 이 family로 읽힙니다. 반면 직접 문의 처리나 분쟁 조정 자체가 중심이 되면 다른 family 쪽으로 이동합니다.",
      summaryTemplate: "이 직무는 고객 문의를 단순 처리하는 데서 끝나지 않고 VOC를 통해 운영과 정책 개선을 연결하는 성격이 강합니다. 반면 직접 상담 처리나 클레임 조정 비중이 커지면 다른 고객상담 / CS 경계로 읽힐 수 있습니다."
    },
    {
      id: "ACCOUNT_RETENTION_CS",
      label: "계정유지·리텐션형 CS",
      aliases: [
        "리텐션 CS",
        "해지방어 상담",
        "유지형 고객상담",
        "retention support",
        "save desk",
        "cancellation prevention support"
      ],
      strongSignals: [
        "해지 문의, 환불 의사, 이탈 징후 고객을 설득하거나 유지 방안을 제시한다",
        "불만 해소를 넘어 계속 사용해야 하는 이유와 대안을 제안한다",
        "구독 유지, 재구매 유도, 해지율 방어 같은 목표가 분명하게 존재한다",
        "혜택 조정, 플랜 변경, 재이용 유도, 사용법 안내를 통해 이탈을 막는다",
        "고객의 이탈 사유를 파악하고 맞춤형 유지 시나리오로 응대한다",
        "일반 문의 처리보다 유지율, 해지방어 성공률, 재활성화 성과 비중이 크다"
      ],
      mediumSignals: [
        "해지 직전 고객이나 장기 미이용 고객을 별도로 관리한다",
        "혜택 제안, 대안 안내, 사용가치 재설명 같은 대화 구조가 중요하다",
        "CRM 캠페인과 연결되지만 실제 상담 설득과 대응 스크립트 운영이 핵심이다",
        "고객 불만 대응과 유지 제안이 한 상담 안에서 함께 발생한다"
      ],
      boundarySignals: [
        "유지 설득 없이 단순 해지·환불 처리 비중이 커지면 인바운드 문의처리형 CS로 이동한다",
        "고객 감정 진정과 분쟁 조정 비중이 더 크면 클레임·분쟁조정형 CS로 이동한다",
        "자동화 메시지, 세그먼트 운영, 캠페인 리텐션 관리 비중이 커지면 CRM 마케팅 경계로 이동한다",
        "고객 관계 확대와 업셀 영업 비중이 커지면 고객성공 또는 영업 경계가 강해진다"
      ],
      adjacentFamilies: [
        "CLAIM_RESOLUTION_CS",
        "INBOUND_CASE_HANDLING_CS",
        "VOC_PROCESS_IMPROVEMENT_CS"
      ],
      boundaryNote: "고객 문제를 해결하는 것에서 더 나아가 해지나 이탈을 막고 관계를 유지하는 책임이 크면 이 family로 읽힙니다. 반면 일반 문의 처리, 분쟁 조정, 자동화 리텐션 운영이 중심이 되면 다른 경계가 강해집니다.",
      summaryTemplate: "이 직무는 고객의 불만이나 이탈 징후 상황에서 관계 유지를 설계하는 계정유지·리텐션형 CS 성격이 강합니다. 반면 일반 문의 처리나 클레임 조정, CRM 자동화 운영 비중이 커지면 다른 고객상담 / CS 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CS_AGENT",
      label: "CS 상담원",
      aliases: [
        "CS 상담원",
        "고객상담원",
        "customer service agent",
        "support agent"
      ],
      family: "INBOUND_CASE_HANDLING_CS",
      responsibilityHints: [
        "고객 문의 접수 및 기본 정책 안내",
        "주문·결제·배송·환불·계정 관련 케이스 처리",
        "상담 이력 기록 및 후속 이관",
        "반복 문의에 대한 표준 응대 수행"
      ],
      levelHints: [
        "주니어는 정형 문의 처리와 스크립트 기반 응대 비중이 크다",
        "시니어는 복합 문의 처리와 후속 이관 판단, 난도 높은 안내 비중이 크다"
      ]
    },
    {
      id: "CUSTOMER_SUPPORT_SPECIALIST",
      label: "고객지원 담당",
      aliases: [
        "고객지원 담당",
        "고객지원 스페셜리스트",
        "customer support specialist"
      ],
      family: "INBOUND_CASE_HANDLING_CS",
      responsibilityHints: [
        "멀티채널 고객 문의 응대",
        "FAQ 및 매크로 기준 응대",
        "SLA 내 처리율 관리",
        "문의 유형 분류와 내부 전달"
      ],
      levelHints: [
        "주니어는 처리 속도와 정확성 관리 비중이 크다",
        "시니어는 복합 케이스 판단과 응대 품질 안정화 비중이 크다"
      ]
    },
    {
      id: "ESCALATION_SPECIALIST",
      label: "에스컬레이션 상담 담당",
      aliases: [
        "에스컬레이션 담당",
        "클레임 상담 담당",
        "escalation specialist",
        "complaint specialist"
      ],
      family: "CLAIM_RESOLUTION_CS",
      responsibilityHints: [
        "고난도 불만 고객 응대",
        "예외 보상 및 분쟁 조정",
        "유관부서 협업 통한 해결안 확정",
        "재발 우려 이슈 정리 및 공유"
      ],
      levelHints: [
        "주니어는 상위자 가이드 아래 복잡 케이스를 처리한다",
        "시니어는 예외 판단과 대외 민감 이슈 조율 비중이 크다"
      ]
    },
    {
      id: "VOC_ANALYST_CS",
      label: "VOC 분석 담당",
      aliases: [
        "VOC 분석 담당",
        "고객의견 분석 담당",
        "VOC analyst"
      ],
      family: "VOC_PROCESS_IMPROVEMENT_CS",
      responsibilityHints: [
        "상담 데이터 태깅 및 이슈 유형화",
        "반복 문의 원인 분석",
        "VOC 리포트 작성 및 개선 제안",
        "정책·프로세스 개선 연계"
      ],
      levelHints: [
        "주니어는 데이터 정리와 기본 리포팅 비중이 크다",
        "시니어는 개선 과제 구조화와 유관부서 액션 조율 비중이 크다"
      ]
    },
    {
      id: "RETENTION_AGENT",
      label: "리텐션 상담 담당",
      aliases: [
        "리텐션 상담 담당",
        "해지방어 상담원",
        "retention agent",
        "save desk agent"
      ],
      family: "ACCOUNT_RETENTION_CS",
      responsibilityHints: [
        "해지 의사 고객 상담 및 유지 제안",
        "이탈 사유 파악과 대안 제시",
        "혜택·플랜 조정 안내",
        "유지 성공률 및 재활성화 성과 관리"
      ],
      levelHints: [
        "주니어는 정해진 유지 시나리오 적용 비중이 크다",
        "시니어는 고객별 설득 전략 조정과 복합 불만 대응 비중이 크다"
      ]
    },
    {
      id: "CUSTOMER_CARE_SPECIALIST",
      label: "고객케어 담당",
      aliases: [
        "고객케어 담당",
        "customer care specialist",
        "care agent"
      ],
      family: "CLAIM_RESOLUTION_CS",
      responsibilityHints: [
        "불만 고객 케어와 후속 조치 안내",
        "민감 케이스 완충 및 관계 회복",
        "예외 처리 협의",
        "고객 경험 손상 최소화"
      ],
      levelHints: [
        "주니어는 표준 가이드 내 케어 응대 비중이 크다",
        "시니어는 관계 회복과 예외 조정, 난도 높은 설명 비중이 크다"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_CASE_TYPE",
      label: "주요 케이스 유형",
      values: [
        "일반 문의와 처리 요청",
        "불만·분쟁·에스컬레이션",
        "반복 이슈와 VOC 개선",
        "해지·이탈·유지 설득"
      ]
    },
    {
      axisId: "CORE_SUCCESS_METRIC",
      label: "핵심 성과 기준",
      values: [
        "응답속도·처리율·해결률",
        "분쟁 완화·수용도·리스크 감소",
        "반복 이슈 감소·개선 과제 반영",
        "유지율·해지방어 성공률·재활성화"
      ]
    },
    {
      axisId: "DECISION_COMPLEXITY",
      label: "판단 복잡도",
      values: [
        "정책 기반 표준 응대",
        "예외 판단과 감정 조정",
        "원인 분석과 내부 개선 연결",
        "관계 유지 위한 설득과 대안 제시"
      ]
    },
    {
      axisId: "WORK_OUTPUT",
      label: "주요 산출물",
      values: [
        "상담 처리 기록·응대 결과",
        "에스컬레이션 이력·보상안·조정 결과",
        "VOC 리포트·이슈 분류·개선 제안",
        "유지 시나리오·이탈 사유 정리·방어 결과"
      ]
    }
  ],
  adjacentFamilies: [
    "고객성공(CSM)",
    "운영관리",
    "CRM 마케팅",
    "서비스기획",
    "QA / 품질관리",
    "영업",
    "컴플라이언스",
    "테크니컬 서포트"
  ],
  boundaryHints: [
    "반복 문의를 정책에 따라 빠르게 처리하는 비중이 크면 인바운드 문의처리형 CS로 읽힙니다.",
    "고객 불만을 진정시키고 예외 보상이나 분쟁 조정을 직접 판단하는 비중이 커지면 클레임·분쟁조정형 CS로 이동합니다.",
    "같은 문의가 왜 반복되는지 분석하고 내부 개선 과제로 연결하는 비중이 커지면 VOC·개선연계형 CS로 이동합니다.",
    "해지 의사 고객을 설득하고 유지 대안을 제시하는 비중이 커지면 계정유지·리텐션형 CS로 이동합니다.",
    "상담 자체보다 인력 운영, 스케줄링, QA, 생산성 관리 비중이 커지면 CS 운영관리 경계가 강해집니다.",
    "문제 해결보다 계정 활용 확대, 관계 관리, 장기 성공 지원 비중이 커지면 고객성공(CSM) 경계로 읽힙니다.",
    "자동화 메시지, 세그먼트 리텐션 캠페인, 재참여 마케팅 비중이 커지면 CRM 마케팅 경계로 이동합니다.",
    "시스템 장애 재현, 기술 원인 분석, 로그 확인 비중이 커지면 테크니컬 서포트 해석이 강해집니다."
  ],
  summaryTemplate: "이 직무는 고객 접점에서 문의를 해결하고 관계 손상을 최소화하는 고객상담 / CS 성격이 강합니다. 같은 고객상담 / CS라도 반복 문의를 빠르게 처리하는 역할인지, 클레임을 조정하는 역할인지, VOC를 개선으로 연결하는 역할인지, 해지와 이탈을 방어하는 역할인지에 따라 실제 작동 방식이 달라집니다. 반면 운영관리, 고객성공, CRM 자동화, 기술지원 비중이 커지면 인접 직무 경계로 읽힐 수 있습니다."
};
