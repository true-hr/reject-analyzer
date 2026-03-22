export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "GENERAL_SALES",
  aliases: [
    "일반영업",
    "영업",
    "영업 담당",
    "영업사원",
    "영업관리 포함 영업",
    "sales",
    "general sales",
    "sales representative",
    "account sales",
    "field sales"
  ],
  families: [
    {
      id: "NEW_ACCOUNT_SALES",
      label: "신규고객 발굴 영업",
      aliases: [
        "신규영업",
        "신규 고객 영업",
        "개척영업",
        "hunter sales",
        "new account sales"
      ],
      strongSignals: [
        "신규 고객사 발굴 및 첫 거래 성사",
        "잠재고객 리스트업과 콜드콜·콜드메일 수행",
        "미팅 어포인트 확보와 초기 제안 진행",
        "신규 거래처 계약 조건 협의",
        "첫 발주 또는 첫 계약 전환 관리",
        "영업 파이프라인 상단 리드 확보",
        "미개척 지역 또는 미개척 고객군 공략"
      ],
      mediumSignals: [
        "시장 내 잠재 고객 조사",
        "초기 제안서 또는 회사 소개 자료 활용",
        "전시회·네트워킹 기반 리드 확보",
        "영업 전환율 관리",
        "리드 상태 추적 및 후속 연락"
      ],
      boundarySignals: [
        "기존 거래처 유지와 반복 수주 비중이 커지면 기존거래처 관리 영업으로 이동",
        "대리점·총판 개설과 채널 확장 비중이 커지면 채널 영업으로 이동",
        "기술 설명과 솔루션 설계 비중이 커지면 기술영업 또는 솔루션영업으로 이동"
      ],
      adjacentFamilies: [
        "ACCOUNT_RETENTION_SALES",
        "CHANNEL_ROUTE_SALES",
        "ORDER_COORDINATION_SALES"
      ],
      boundaryNote: "새 고객을 찾아 첫 거래를 만드는 책임이 분명하면 신규고객 발굴 영업으로 읽힙니다. 반면 기존 거래 관리나 채널 운영, 기술 설명 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 아직 거래가 없는 고객을 발굴해 첫 거래를 성사시키는 성격이 강합니다. 반면 기존 거래처 운영이나 채널 확장 비중이 커지면 다른 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "ACCOUNT_RETENTION_SALES",
      label: "기존거래처 관리 영업",
      aliases: [
        "기존 거래처 영업",
        "거래처 관리",
        "고객 관리 영업",
        "account management sales",
        "retention sales"
      ],
      strongSignals: [
        "기존 거래처 매출 유지 및 증대",
        "반복 발주 관리와 수주 연장",
        "고객사 방문 및 관계 유지",
        "거래처별 매출 목표 관리",
        "재구매, 추가 발주, 품목 확대 제안",
        "고객 불만 및 납기 이슈 조율",
        "장기 거래처 계약 갱신 또는 운영"
      ],
      mediumSignals: [
        "월별 거래처 실적 리뷰",
        "고객 요청사항 내부 전달 및 조율",
        "매출 채권 또는 수금 이슈 확인",
        "프로모션 또는 판촉 협의",
        "거래처별 운영 현황 보고"
      ],
      boundarySignals: [
        "신규 고객 발굴 비중이 커지면 신규고객 발굴 영업으로 이동",
        "주문·출하·정산 실무 처리 비중이 커지면 수주·운영 연계 영업으로 이동",
        "핵심 대형 고객에 대한 전략적 관리 비중이 매우 크면 KAM 성격으로 이동"
      ],
      adjacentFamilies: [
        "NEW_ACCOUNT_SALES",
        "ORDER_COORDINATION_SALES",
        "CHANNEL_ROUTE_SALES"
      ],
      boundaryNote: "이미 거래 중인 고객을 유지하고 매출을 키우는 책임이 중심이면 기존거래처 관리 영업으로 읽힙니다. 반면 신규 개척이나 운영 처리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기존 거래처와의 관계를 유지하며 반복 매출과 추가 매출을 만드는 성격이 강합니다. 반면 신규 개척이나 운영 처리 비중이 커지면 다른 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "CHANNEL_ROUTE_SALES",
      label: "채널·유통 영업",
      aliases: [
        "채널 영업",
        "유통 영업",
        "대리점 영업",
        "총판 영업",
        "channel sales",
        "distribution sales"
      ],
      strongSignals: [
        "대리점·총판·리셀러 발굴 및 관리",
        "채널별 판매 목표 설정 및 실적 관리",
        "입점, 유통망 확장, 판매처 확보",
        "채널 파트너 계약 및 거래 조건 협의",
        "채널 재고, 판촉, 판매 정책 조율",
        "리셀러 교육 및 영업 지원",
        "채널별 매출 구조 관리"
      ],
      mediumSignals: [
        "유통 파트너 커뮤니케이션",
        "판촉 행사 협의",
        "매장 또는 유통 현장 점검",
        "채널별 판매 데이터 확인",
        "판매 인센티브 운영 지원"
      ],
      boundarySignals: [
        "최종 고객 직접 개척 비중이 커지면 신규고객 발굴 영업으로 이동",
        "기존 단일 고객사 관리 비중이 커지면 기존거래처 관리 영업으로 이동",
        "단순 입출고·주문 대응 비중이 커지면 수주·운영 연계 영업으로 이동"
      ],
      adjacentFamilies: [
        "NEW_ACCOUNT_SALES",
        "ACCOUNT_RETENTION_SALES",
        "ORDER_COORDINATION_SALES"
      ],
      boundaryNote: "직접 판매보다 대리점·총판·유통망을 통해 매출을 만드는 구조라면 채널·유통 영업으로 읽힙니다. 반면 직접 고객 개척이나 단일 거래처 관리가 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 대리점, 총판, 유통 파트너를 통해 매출을 만드는 성격이 강합니다. 반면 직접 고객 개척이나 개별 거래처 관리 비중이 커지면 다른 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "ORDER_COORDINATION_SALES",
      label: "수주·운영 연계 영업",
      aliases: [
        "수주 영업",
        "영업관리형 영업",
        "오더 관리 영업",
        "sales operations linked sales",
        "order coordination sales"
      ],
      strongSignals: [
        "주문 접수부터 출하까지 영업 창구 역할 수행",
        "납기, 재고, 출하 일정 조율",
        "견적, 발주, 수주 등록 및 진행 관리",
        "고객 요청사항과 내부 생산·물류 조율",
        "수주 실적 관리와 오더 클로징",
        "반복 주문 운영과 거래 조건 반영",
        "매출 확정보다 주문 이행 관리 비중이 큼"
      ],
      mediumSignals: [
        "견적서 작성",
        "출하 일정 커뮤니케이션",
        "납기 지연 대응",
        "수주 현황 리포트 작성",
        "정산 또는 매출 마감 지원"
      ],
      boundarySignals: [
        "고객 발굴과 계약 성사 비중이 커지면 신규영업 또는 기존거래처 영업으로 이동",
        "내부 운영 처리만 남고 고객 접점이 약해지면 영업지원 또는 운영지원으로 이동",
        "생산·물류 계획 조정이 핵심이 되면 SCM 또는 운영관리 경계로 이동"
      ],
      adjacentFamilies: [
        "ACCOUNT_RETENTION_SALES",
        "NEW_ACCOUNT_SALES",
        "CHANNEL_ROUTE_SALES"
      ],
      boundaryNote: "영업이지만 실제로는 주문 이행과 납기 조율, 내부 협업 비중이 높으면 수주·운영 연계 영업으로 읽힙니다. 반면 고객 발굴이나 전략 제안 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객과의 접점을 유지하면서 주문, 납기, 출하를 안정적으로 연결하는 성격이 강합니다. 반면 고객 발굴이나 계약 성사 비중이 커지면 다른 영업 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "SALES_REPRESENTATIVE",
      label: "영업 담당",
      aliases: [
        "영업 담당",
        "sales representative",
        "sales executive"
      ],
      family: "NEW_ACCOUNT_SALES",
      responsibilityHints: [
        "신규 고객 발굴",
        "초기 제안 및 미팅 진행",
        "계약 협의",
        "영업 파이프라인 관리"
      ],
      levelHints: [
        "주니어는 리드 발굴과 미팅 확보 비중이 큼",
        "시니어는 주요 고객 설득과 계약 전환 비중이 큼"
      ]
    },
    {
      id: "ACCOUNT_SALES_MANAGER",
      label: "거래처 영업 담당",
      aliases: [
        "거래처 영업",
        "account sales manager",
        "account manager"
      ],
      family: "ACCOUNT_RETENTION_SALES",
      responsibilityHints: [
        "기존 거래처 관리",
        "반복 매출 확대",
        "고객 요청 조율",
        "계약 갱신 및 추가 발주 관리"
      ],
      levelHints: [
        "주니어는 운영 대응과 관계 유지 비중이 큼",
        "시니어는 매출 확대와 고객 전략 관리 비중이 큼"
      ]
    },
    {
      id: "CHANNEL_SALES_MANAGER",
      label: "채널 영업 담당",
      aliases: [
        "채널 영업",
        "대리점 영업",
        "channel sales manager"
      ],
      family: "CHANNEL_ROUTE_SALES",
      responsibilityHints: [
        "유통 파트너 발굴",
        "채널 매출 관리",
        "입점 및 판매정책 협의",
        "파트너 지원 및 관계 관리"
      ],
      levelHints: [
        "주니어는 채널 운영 지원과 데이터 관리 비중이 큼",
        "시니어는 채널 구조 설계와 파트너 협상 비중이 큼"
      ]
    },
    {
      id: "ORDER_SALES_COORDINATOR",
      label: "수주 영업 담당",
      aliases: [
        "수주 영업",
        "order sales coordinator",
        "sales coordinator"
      ],
      family: "ORDER_COORDINATION_SALES",
      responsibilityHints: [
        "견적 및 수주 관리",
        "납기·출하 조율",
        "고객 요청 대응",
        "내부 부서 협업 관리"
      ],
      levelHints: [
        "주니어는 주문 처리와 일정 조율 비중이 큼",
        "시니어는 주요 거래처 운영과 이슈 해결 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "CUSTOMER_BASE",
      label: "고객 기반",
      values: [
        "미거래 신규 고객",
        "기존 거래처",
        "대리점·총판·유통 파트너",
        "주문 운영 중심 고객"
      ]
    },
    {
      axisId: "PRIMARY_SALES_MOTION",
      label: "주요 영업 방식",
      values: [
        "개척과 첫 거래 성사",
        "관계 유지와 반복 매출 확대",
        "채널 확장과 유통 운영",
        "수주 이행과 납기 조율"
      ]
    },
    {
      axisId: "WORKFLOW_COMPLEXITY",
      label: "업무 흐름의 무게중심",
      values: [
        "리드 발굴과 계약 전환",
        "거래 유지와 매출 증대",
        "유통망 관리와 파트너 조율",
        "주문 처리와 내부 운영 연계"
      ]
    },
    {
      axisId: "FIELD_ACTIVITY_LEVEL",
      label: "현장 활동 정도",
      values: [
        "신규 미팅과 개척 활동 중심",
        "정기 방문과 관계 관리 중심",
        "유통 현장·채널 운영 중심",
        "내부 조율과 고객 창구 역할 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "B2B 영업",
    "B2C 영업",
    "기술영업",
    "솔루션영업",
    "파트너영업 / 채널영업",
    "Key Account Management(KAM)",
    "영업지원",
    "운영관리"
  ],
  boundaryHints: [
    "신규 고객을 찾고 첫 거래를 만드는 비중이 많아지면 신규고객 발굴 영업으로 읽힙니다.",
    "이미 거래 중인 고객을 유지하고 반복 매출을 키우는 비중이 커지면 기존거래처 관리 영업으로 이동합니다.",
    "대리점, 총판, 리셀러 같은 유통 파트너를 관리하는 비중이 커지면 채널·유통 영업으로 이동합니다.",
    "견적, 수주, 납기, 출하 조율처럼 주문 이행 비중이 커지면 수주·운영 연계 영업으로 읽힙니다.",
    "기술 설명, 구축 범위 협의, 솔루션 제안 비중이 커지면 기술영업 또는 솔루션영업으로 이동합니다.",
    "핵심 대형 고객을 장기적으로 전략 관리하는 책임이 커지면 KAM 성격으로 이동합니다.",
    "고객 접점보다 내부 문서 처리와 지원 비중이 커지면 영업지원 또는 운영지원 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 고객 접점을 통해 매출을 만들고 유지하는 일반영업 성격이 강합니다. 다만 실제 역할은 신규 개척형, 기존 거래처 관리형, 채널 운영형, 수주·운영 연계형으로 나뉘며 작동 방식이 달라집니다. 반면 기술 설명, 전략 고객 관리, 내부 운영 지원 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
