export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "B2B_SALES",
  aliases: [
    "B2B 영업",
    "기업영업",
    "법인영업",
    "기업 대상 영업",
    "business sales",
    "B2B sales",
    "corporate sales",
    "enterprise sales",
    "account executive",
    "AE"
  ],
  families: [
    {
      id: "NEW_LOGO_B2B_SALES",
      label: "신규고객 발굴형 B2B 영업",
      aliases: [
        "신규 기업영업",
        "신규 법인영업",
        "new logo sales",
        "new business sales",
        "hunter sales"
      ],
      strongSignals: [
        "미거래 기업 고객 발굴 및 첫 계약 성사",
        "타깃 계정 리스트업과 아웃바운드 영업 수행",
        "리드 발굴부터 미팅 전환까지 직접 관리",
        "초기 제안, 견적, 계약 협상 주도",
        "신규 고객 파이프라인 구축 및 관리",
        "첫 발주 또는 첫 사용 전환 책임",
        "시장 개척 지역 또는 신규 산업군 공략"
      ],
      mediumSignals: [
        "잠재고객 세그먼트 정의",
        "초기 제안서 및 소개자료 활용",
        "전시회, 세미나, 네트워킹 기반 리드 확보",
        "콜드콜·콜드메일 운영",
        "영업 단계별 전환율 관리"
      ],
      boundarySignals: [
        "기존 고객 확대와 갱신 비중이 커지면 계정 확장형 B2B 영업으로 이동",
        "장기 전략 고객 운영과 멀티스테이크홀더 관리 비중이 매우 커지면 KAM 성격으로 이동",
        "기술 데모, 구축 범위 설계, 솔루션 제안 비중이 커지면 솔루션영업 또는 기술영업으로 이동"
      ],
      adjacentFamilies: [
        "ACCOUNT_EXPANSION_B2B_SALES",
        "CHANNEL_PARTNER_B2B_SALES",
        "DEAL_EXECUTION_B2B_SALES"
      ],
      boundaryNote: "거래가 없는 기업을 발굴해 첫 계약을 만드는 책임이 분명하면 신규고객 발굴형 B2B 영업으로 읽힙니다. 반면 기존 고객 운영이나 파트너 채널, 기술 제안 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 아직 거래가 없는 기업 고객을 발굴해 첫 계약을 만드는 성격이 강합니다. 반면 기존 고객 확장이나 기술 제안 비중이 커지면 다른 B2B 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "ACCOUNT_EXPANSION_B2B_SALES",
      label: "기존고객 확장형 B2B 영업",
      aliases: [
        "기존 고객 영업",
        "법인 계정 영업",
        "account growth sales",
        "account management sales",
        "upsell sales"
      ],
      strongSignals: [
        "기존 기업 고객 매출 유지 및 확대",
        "재계약, 갱신, 추가 도입 제안",
        "고객사 내 추가 부서 또는 추가 품목 확장",
        "기존 고객 관계 유지와 정기 미팅 운영",
        "고객 요구사항 내부 조율 및 후속 제안",
        "고객별 매출 목표와 사용 현황 관리",
        "장기 고객 이슈 대응과 거래 안정화"
      ],
      mediumSignals: [
        "고객사별 실적 리뷰",
        "업셀·크로스셀 기회 발굴",
        "계약 갱신 일정 관리",
        "고객 만족도 및 리스크 체크",
        "기존 고객 기반 제안서 수정"
      ],
      boundarySignals: [
        "신규고객 발굴 비중이 커지면 신규고객 발굴형 B2B 영업으로 이동",
        "전략 계정 단위의 복잡한 의사결정 구조 관리가 매우 크면 KAM 성격으로 이동",
        "주문 처리와 운영 대응 비중이 커지면 딜 실행·운영 연계형 B2B 영업으로 이동"
      ],
      adjacentFamilies: [
        "NEW_LOGO_B2B_SALES",
        "DEAL_EXECUTION_B2B_SALES",
        "CHANNEL_PARTNER_B2B_SALES"
      ],
      boundaryNote: "이미 거래 중인 기업 고객을 유지하고 확장하는 책임이 중심이면 기존고객 확장형 B2B 영업으로 읽힙니다. 반면 신규 개척이나 운영 처리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기존 기업 고객과의 관계를 유지하면서 재계약과 추가 매출을 만드는 성격이 강합니다. 반면 신규 개척이나 주문 운영 비중이 커지면 다른 B2B 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "CHANNEL_PARTNER_B2B_SALES",
      label: "채널·파트너형 B2B 영업",
      aliases: [
        "파트너 영업",
        "채널 영업",
        "리셀러 영업",
        "channel sales",
        "partner sales",
        "reseller sales"
      ],
      strongSignals: [
        "리셀러, 총판, 파트너사 발굴 및 계약",
        "채널 파트너를 통한 간접 매출 확대",
        "파트너별 판매 목표 및 실적 관리",
        "파트너 교육, 세일즈 킷, 공동 영업 지원",
        "채널 정책, 마진 구조, 거래 조건 협의",
        "파트너 파이프라인 관리",
        "공동 제안 또는 공동 영업 기회 발굴"
      ],
      mediumSignals: [
        "채널 온보딩 운영",
        "파트너 대상 프로모션 협의",
        "채널별 실적 리뷰",
        "공동 마케팅 또는 공동 세일즈 지원",
        "파트너 리스크 및 관계 관리"
      ],
      boundarySignals: [
        "최종 고객 직접 개척 비중이 커지면 신규고객 발굴형 B2B 영업으로 이동",
        "단일 대형 고객을 직접 관리하는 비중이 커지면 기존고객 확장형 또는 KAM으로 이동",
        "제휴 구조 설계와 장기 사업 모델 협상이 중심이면 사업개발(BD)로 이동"
      ],
      adjacentFamilies: [
        "NEW_LOGO_B2B_SALES",
        "ACCOUNT_EXPANSION_B2B_SALES",
        "DEAL_EXECUTION_B2B_SALES"
      ],
      boundaryNote: "직접 판매보다 파트너, 리셀러, 총판을 통해 기업 매출을 만드는 구조라면 채널·파트너형 B2B 영업으로 읽힙니다. 반면 직접 고객 영업이나 사업 제휴 설계가 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 파트너와 리셀러를 통해 기업 매출을 만드는 성격이 강합니다. 반면 직접 고객 개척이나 사업 제휴 구조 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "DEAL_EXECUTION_B2B_SALES",
      label: "딜 실행·운영 연계형 B2B 영업",
      aliases: [
        "딜 실행 영업",
        "수주형 B2B 영업",
        "sales execution",
        "deal execution sales",
        "sales coordinator"
      ],
      strongSignals: [
        "견적, 계약, 발주, 납기까지 딜 클로징 전 과정을 관리",
        "고객 요청사항과 내부 생산·운영·물류를 조율",
        "수주 진행 현황과 클로징 일정 관리",
        "계약 조건 반영과 내부 승인 절차 진행",
        "출하, 납품, 검수, 정산 연계 관리",
        "딜별 리스크와 일정 이슈 대응",
        "계약 성사 이후 이행 안정화 비중이 큼"
      ],
      mediumSignals: [
        "견적서 및 계약서 초안 준비",
        "발주 등록 및 진행 체크",
        "내부 결재 요청",
        "납기 지연 및 변경 대응",
        "딜 현황 리포트 작성"
      ],
      boundarySignals: [
        "고객 발굴과 설득이 중심이면 신규고객 발굴형 B2B 영업으로 이동",
        "기존 고객 확대와 관계 관리가 중심이면 기존고객 확장형 B2B 영업으로 이동",
        "내부 운영 처리만 남고 고객 설득 기능이 약해지면 영업지원 또는 운영관리로 이동"
      ],
      adjacentFamilies: [
        "ACCOUNT_EXPANSION_B2B_SALES",
        "NEW_LOGO_B2B_SALES",
        "CHANNEL_PARTNER_B2B_SALES"
      ],
      boundaryNote: "기업 고객과의 딜을 실제 수주·계약·이행으로 연결하는 비중이 높으면 딜 실행·운영 연계형 B2B 영업으로 읽힙니다. 반면 고객 개척이나 장기 관계 확장 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기업 고객과의 거래를 실제 계약과 납품까지 연결하는 성격이 강합니다. 반면 고객 발굴이나 장기 계정 확장 비중이 커지면 다른 B2B 영업 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "ACCOUNT_EXECUTIVE",
      label: "기업영업 담당",
      aliases: [
        "기업영업 담당",
        "법인영업 담당",
        "account executive",
        "AE"
      ],
      family: "NEW_LOGO_B2B_SALES",
      responsibilityHints: [
        "신규 기업 고객 발굴",
        "초기 미팅과 제안 진행",
        "계약 협상",
        "파이프라인 관리"
      ],
      levelHints: [
        "주니어는 리드 발굴과 미팅 확보 비중이 큼",
        "시니어는 주요 계정 설득과 계약 클로징 비중이 큼"
      ]
    },
    {
      id: "ACCOUNT_MANAGER",
      label: "계정 영업 담당",
      aliases: [
        "계정 영업",
        "account manager",
        "customer sales manager"
      ],
      family: "ACCOUNT_EXPANSION_B2B_SALES",
      responsibilityHints: [
        "기존 고객 관계 관리",
        "재계약 및 추가 매출 확대",
        "고객 요구사항 조율",
        "사용 현황 및 매출 리뷰"
      ],
      levelHints: [
        "주니어는 고객 대응과 운영 조율 비중이 큼",
        "시니어는 업셀 전략과 장기 고객 관리 비중이 큼"
      ]
    },
    {
      id: "PARTNER_ACCOUNT_MANAGER",
      label: "파트너 영업 담당",
      aliases: [
        "파트너 영업",
        "channel account manager",
        "partner account manager"
      ],
      family: "CHANNEL_PARTNER_B2B_SALES",
      responsibilityHints: [
        "파트너 발굴 및 계약",
        "채널 실적 관리",
        "공동 영업 지원",
        "파트너 관계 관리"
      ],
      levelHints: [
        "주니어는 파트너 운영 지원 비중이 큼",
        "시니어는 채널 전략과 주요 파트너 협상 비중이 큼"
      ]
    },
    {
      id: "B2B_SALES_COORDINATOR",
      label: "B2B 영업 운영 담당",
      aliases: [
        "영업 운영 담당",
        "sales coordinator",
        "deal coordinator"
      ],
      family: "DEAL_EXECUTION_B2B_SALES",
      responsibilityHints: [
        "견적 및 계약 진행 관리",
        "수주와 납기 조율",
        "내부 부서 협업 관리",
        "딜 이행 리스크 대응"
      ],
      levelHints: [
        "주니어는 문서 처리와 일정 조율 비중이 큼",
        "시니어는 주요 딜 이행 관리와 고객 조율 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "CUSTOMER_RELATION_STAGE",
      label: "고객 관계 단계",
      values: [
        "미거래 고객 개척",
        "기존 고객 확장",
        "파트너 기반 간접 판매",
        "계약 이행 및 운영 연계"
      ]
    },
    {
      axisId: "PRIMARY_SALES_MOTION",
      label: "주요 영업 방식",
      values: [
        "아웃바운드 개척과 첫 계약 성사",
        "재계약과 업셀·크로스셀",
        "채널 운영과 파트너 매출 확대",
        "딜 클로징과 이행 관리"
      ]
    },
    {
      axisId: "STAKEHOLDER_COMPLEXITY",
      label: "이해관계자 구조",
      values: [
        "잠재고객 의사결정자 설득",
        "기존 고객 내 다부서 확장",
        "파트너와 최종고객의 이중 구조",
        "고객과 내부 운영조직의 동시 조율"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "리드 발굴과 계약 전환",
        "고객 유지와 매출 확대",
        "채널 구조와 파트너 관리",
        "계약·납기·이행 안정화"
      ]
    }
  ],
  adjacentFamilies: [
    "일반영업",
    "솔루션영업",
    "기술영업",
    "파트너영업 / 채널영업",
    "해외영업",
    "제안영업",
    "Key Account Management(KAM)",
    "신사업/사업개발(BD)",
    "영업지원"
  ],
  boundaryHints: [
    "미거래 기업 고객을 찾아 첫 계약을 만드는 비중이 많아지면 신규고객 발굴형 B2B 영업으로 읽힙니다.",
    "기존 고객의 재계약, 추가 도입, 부서 확장 비중이 커지면 기존고객 확장형 B2B 영업으로 이동합니다.",
    "리셀러, 총판, 파트너를 통한 간접 매출 구조가 중심이면 채널·파트너형 B2B 영업으로 이동합니다.",
    "견적, 계약, 발주, 납기, 납품처럼 딜 이행 비중이 커지면 딜 실행·운영 연계형 B2B 영업으로 읽힙니다.",
    "기술 설명, 데모, 구축 범위 설계, 솔루션 제안 비중이 커지면 기술영업 또는 솔루션영업으로 이동합니다.",
    "전략 계정 하나를 장기적으로 다부서·다이해관계자 구조로 관리하는 책임이 커지면 KAM 성격으로 이동합니다.",
    "제휴 구조 설계와 사업 모델 협상 비중이 커지면 사업개발(BD)로 이동합니다."
  ],
  summaryTemplate: "이 직무는 기업 고객을 대상으로 계약과 매출을 만들어내는 B2B 영업 성격이 강합니다. 다만 실제 역할은 신규 개척형, 기존 고객 확장형, 채널·파트너형, 딜 실행 연계형으로 나뉘며 작동 방식이 달라집니다. 반면 기술 제안, 전략 계정 관리, 사업 제휴 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
