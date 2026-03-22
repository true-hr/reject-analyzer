export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "PARTNER_CHANNEL_SALES",
  aliases: [
    "파트너영업",
    "파트너 영업",
    "채널영업",
    "채널 영업",
    "파트너 세일즈",
    "채널 세일즈",
    "리셀러 영업",
    "대리점 영업",
    "총판 영업",
    "간접영업",
    "간접 판매",
    "유통 파트너 영업",
    "채널 매니저",
    "파트너 매니저",
    "파트너 어카운트 매니저",
    "channel sales",
    "partner sales",
    "channel account manager",
    "partner account manager",
    "channel manager",
    "partner manager",
    "indirect sales",
    "reseller sales",
    "distributor sales",
    "alliance sales"
  ],
  families: [
    {
      id: "RESELLER_CHANNEL_MANAGEMENT",
      label: "리셀러·대리점 채널관리",
      aliases: [
        "리셀러 채널관리",
        "대리점 관리",
        "총판 관리",
        "채널 관리",
        "리셀러 영업",
        "대리점 영업",
        "reseller management",
        "distributor management",
        "channel management"
      ],
      strongSignals: [
        "리셀러·대리점·총판 발굴 및 계약",
        "채널별 매출 목표 설정과 실적 관리",
        "파트너별 sell-in / sell-out 운영",
        "재고, 발주, 프로모션 운영을 통한 채널 매출 관리",
        "대리점 정책, 가격정책, 인센티브 운영",
        "지역별 또는 유통망별 파트너 커버리지 확대",
        "파트너 월간/분기 리뷰와 목표 재설정"
      ],
      mediumSignals: [
        "채널별 매출 분석",
        "파트너 교육 및 제품 업데이트 공유",
        "판촉물, 캠페인, 공동 프로모션 운영",
        "영업권역 조정 및 파트너 간 충돌 관리",
        "유통 흐름 점검과 현장 방문"
      ],
      boundarySignals: [
        "고객사 직접 제안과 수주 활동 비중이 커지면 B2B 영업 또는 KAM으로 이동",
        "공동 사업모델 설계와 전략적 제휴 비중이 커지면 사업개발(BD) 또는 얼라이언스로 이동",
        "유통 운영보다 거래처 매대·판촉 집행 비중이 커지면 일반영업 또는 유통영업 경계가 강해짐"
      ],
      adjacentFamilies: [
        "PARTNER_ENABLEMENT_GROWTH",
        "SOLUTION_PARTNER_SALES",
        "ALLIANCE_ECOSYSTEM_SALES"
      ],
      boundaryNote: "리셀러·대리점·총판 네트워크를 통해 매출을 만들고 운영하는 비중이 크면 이 family로 읽힙니다. 반면 최종 고객 직접 수주나 전략적 제휴 설계가 중심이 되면 다른 family 경계가 강해집니다.",
      summaryTemplate: "이 직무는 리셀러·대리점·총판 같은 간접 판매 채널을 통해 매출을 만드는 성격이 강합니다. 반면 최종 고객 직접 영업 비중이 커지면 B2B 영업이나 KAM으로, 공동 사업모델 설계 비중이 커지면 제휴·BD 경계로 읽힐 수 있습니다."
    },
    {
      id: "PARTNER_ENABLEMENT_GROWTH",
      label: "파트너 육성·활성화",
      aliases: [
        "파트너 육성",
        "파트너 활성화",
        "채널 활성화",
        "파트너 프로그램 운영",
        "파트너 성공",
        "partner enablement",
        "channel enablement",
        "partner development",
        "partner success"
      ],
      strongSignals: [
        "파트너 온보딩 및 판매 준비도 확보",
        "파트너 교육 프로그램 운영",
        "세일즈 키트, 제안자료, 가이드 제공",
        "파트너 파이프라인 활성화와 영업활동 점검",
        "MDF, 인센티브, 리베이트 등 파트너 프로그램 운영",
        "활성 파트너와 비활성 파트너 구분 및 육성 전략 수립",
        "파트너의 자생적 판매 역량 강화"
      ],
      mediumSignals: [
        "웨비나, 세일즈 세션, 인증 프로그램 운영",
        "공동 캠페인 성과 리뷰",
        "파트너 커뮤니케이션 체계 운영",
        "우수 파트너 사례 확산",
        "판매 FAQ, 경쟁사 대응자료 제공"
      ],
      boundarySignals: [
        "계약 체결과 매출 협상 중심으로 가면 리셀러·대리점 채널관리로 이동",
        "기술검증, 데모, 제안 동행 비중이 커지면 솔루션 파트너 영업으로 이동",
        "교육 운영 자체가 핵심이면 교육운영 또는 파트너 마케팅 경계가 강해짐"
      ],
      adjacentFamilies: [
        "RESELLER_CHANNEL_MANAGEMENT",
        "SOLUTION_PARTNER_SALES",
        "ALLIANCE_ECOSYSTEM_SALES"
      ],
      boundaryNote: "파트너를 많이 확보하는 것보다 실제로 팔 수 있게 만들고 활동을 살아 있게 유지하는 책임이 크면 이 family로 읽힙니다. 반면 계약·조건 협상이나 기술 동행이 중심이면 다른 family에 더 가깝습니다.",
      summaryTemplate: "이 직무는 파트너가 실제로 판매할 수 있도록 육성하고 활성화하는 성격이 강합니다. 반면 계약과 매출조건 협상이 중심이면 채널관리로, 기술 제안 동행 비중이 커지면 솔루션 파트너 영업으로 읽힐 수 있습니다."
    },
    {
      id: "SOLUTION_PARTNER_SALES",
      label: "솔루션 파트너 동행영업",
      aliases: [
        "솔루션 파트너 영업",
        "파트너 동행영업",
        "공동 영업",
        "파트너 제안영업",
        "co-sell",
        "partner co-sell",
        "solution partner sales",
        "partner-led sales"
      ],
      strongSignals: [
        "파트너와 함께 최종 고객 대상 제안 및 수주 추진",
        "파트너 발굴 리드와 공급사 직판 리드를 연결한 공동 영업",
        "제안서, 데모, PoC, 구축 범위 협의에 동행",
        "파트너를 통한 솔루션 판매 기회 발굴",
        "SI, MSP, VAR, 컨설팅사와 공동 세일즈 플랜 운영",
        "영업기회 단계별 파트너 협업 관리",
        "등록딜, 딜 보호, 협업 룰 운영"
      ],
      mediumSignals: [
        "기술팀·프리세일즈와 파트너 간 조율",
        "공동 파이프라인 리뷰",
        "파트너별 주요 수주사례 관리",
        "레퍼런스 확보와 확산",
        "복수 이해관계자 조율"
      ],
      boundarySignals: [
        "기술 검증과 구축 설계가 주업무가 되면 솔루션영업 또는 프리세일즈로 이동",
        "최종 고객 직접 관리가 훨씬 커지면 KAM 또는 B2B 영업으로 이동",
        "장기적 사업제휴와 생태계 확장이 중심이면 얼라이언스·에코시스템 영업으로 이동"
      ],
      adjacentFamilies: [
        "RESELLER_CHANNEL_MANAGEMENT",
        "PARTNER_ENABLEMENT_GROWTH",
        "ALLIANCE_ECOSYSTEM_SALES"
      ],
      boundaryNote: "파트너가 단순 유통창구가 아니라 함께 딜을 만들고 제안을 밀어붙이는 공동 영업 구조라면 이 family로 읽힙니다. 반면 기술 설계가 더 깊어지면 솔루션영업, 고객 직접 관리가 커지면 KAM 쪽 경계가 강해집니다.",
      summaryTemplate: "이 직무는 파트너와 함께 실제 딜을 발굴하고 제안·수주를 추진하는 공동 영업 성격이 강합니다. 반면 기술 검증 비중이 커지면 솔루션영업으로, 고객 직접 관리 비중이 커지면 KAM이나 B2B 영업으로 읽힐 수 있습니다."
    },
    {
      id: "ALLIANCE_ECOSYSTEM_SALES",
      label: "전략 파트너·에코시스템 영업",
      aliases: [
        "전략 파트너 영업",
        "에코시스템 영업",
        "얼라이언스 영업",
        "제휴 채널 영업",
        "alliance sales",
        "ecosystem sales",
        "strategic partner sales",
        "partner ecosystem"
      ],
      strongSignals: [
        "클라우드사, 플랫폼사, 대형 SI 등 전략 파트너와 매출 연계 구조 설계",
        "공동 GTM, 공동 패키지, 공동 오퍼링 기획",
        "리퍼럴, 마켓플레이스, 번들, 협업모델 설계",
        "파트너 등급, 협업 범위, 공동 KPI 체계 수립",
        "단일 딜보다 장기 파이프라인 창출 구조 구축",
        "경영진 또는 사업 책임자 레벨 파트너십 관리",
        "파트너 생태계 내 포지셔닝과 우선순위 확보"
      ],
      mediumSignals: [
        "공동 세미나, 공동 마케팅, 공동 사례화",
        "파트너사 내 다부서 관계 관리",
        "에코시스템 내 추천 흐름 관리",
        "상호 영업기회 공유 체계 운영",
        "전략 파트너별 사업계획 수립"
      ],
      boundarySignals: [
        "계약 후 단순 유통 매출 운영이 중심이면 리셀러·대리점 채널관리로 이동",
        "공동 영업 딜 실행 비중이 더 크면 솔루션 파트너 영업으로 이동",
        "제휴 구조 설계가 영업보다 우위이면 사업개발(BD) 또는 제휴로 이동"
      ],
      adjacentFamilies: [
        "SOLUTION_PARTNER_SALES",
        "PARTNER_ENABLEMENT_GROWTH",
        "RESELLER_CHANNEL_MANAGEMENT"
      ],
      boundaryNote: "파트너 한 곳의 단기 매출보다 장기적인 생태계 위치와 공동 성장 구조를 만드는 책임이 크면 이 family로 읽힙니다. 반면 실제 유통 운영이나 개별 딜 실행이 중심이면 다른 family에 더 가깝습니다.",
      summaryTemplate: "이 직무는 전략 파트너와의 장기 협업 구조를 통해 파이프라인과 매출 기반을 넓히는 성격이 강합니다. 반면 개별 딜 실행이 중심이면 공동 영업으로, 유통 운영 비중이 크면 채널관리로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CHANNEL_ACCOUNT_MANAGER",
      label: "채널 어카운트 매니저",
      aliases: [
        "채널 어카운트 매니저",
        "채널 매니저",
        "channel account manager",
        "channel manager"
      ],
      family: "RESELLER_CHANNEL_MANAGEMENT",
      responsibilityHints: [
        "파트너 매출 목표 수립 및 관리",
        "리셀러·대리점 계약 및 관계 관리",
        "채널 실적 리뷰와 운영 이슈 조정",
        "가격정책·프로모션·재고 흐름 관리"
      ],
      levelHints: [
        "주니어는 실적관리와 운영 커뮤니케이션 비중이 큼",
        "시니어는 핵심 파트너 구조 설계와 매출 포트폴리오 조정 비중이 큼"
      ]
    },
    {
      id: "PARTNER_DEVELOPMENT_MANAGER",
      label: "파트너 개발 매니저",
      aliases: [
        "파트너 개발 매니저",
        "파트너 육성 매니저",
        "partner development manager",
        "partner enablement manager"
      ],
      family: "PARTNER_ENABLEMENT_GROWTH",
      responsibilityHints: [
        "파트너 온보딩과 교육 체계 운영",
        "활성 파트너 확대",
        "판매 자료·프로그램·인센티브 운영",
        "파트너의 실제 영업활동 점검과 육성"
      ],
      levelHints: [
        "주니어는 프로그램 운영과 커뮤니케이션 실행 비중이 큼",
        "시니어는 파트너 세그먼트 전략과 활성화 모델 설계 비중이 큼"
      ]
    },
    {
      id: "PARTNER_SALES_MANAGER",
      label: "파트너 세일즈 매니저",
      aliases: [
        "파트너 세일즈 매니저",
        "파트너 영업 매니저",
        "partner sales manager",
        "co-sell manager"
      ],
      family: "SOLUTION_PARTNER_SALES",
      responsibilityHints: [
        "파트너와 공동 영업기회 발굴",
        "제안·데모·PoC 단계 협업",
        "딜 등록과 협업 룰 관리",
        "최종 고객 수주까지 파트너 동행"
      ],
      levelHints: [
        "주니어는 파이프라인 추적과 제안 지원 비중이 큼",
        "시니어는 전략 파트너 공동 세일즈 구조와 대형 딜 조율 비중이 큼"
      ]
    },
    {
      id: "ALLIANCE_MANAGER",
      label: "얼라이언스 매니저",
      aliases: [
        "얼라이언스 매니저",
        "전략 파트너 매니저",
        "alliance manager",
        "strategic partner manager"
      ],
      family: "ALLIANCE_ECOSYSTEM_SALES",
      responsibilityHints: [
        "전략 파트너십 구조 설계",
        "공동 GTM와 공동 KPI 운영",
        "생태계 내 협업 채널 확보",
        "장기 파이프라인 창출 구조 관리"
      ],
      levelHints: [
        "주니어는 공동 프로그램 운영과 내부 조율 비중이 큼",
        "시니어는 경영진 레벨 관계 관리와 협업모델 설계 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "SALES_PATH",
      label: "판매 경로",
      values: [
        "리셀러·대리점·총판을 통한 간접 판매",
        "파트너 활성화를 통한 판매 촉진",
        "파트너와 최종 고객 대상 공동 영업",
        "전략 파트너 생태계를 통한 파이프라인 창출"
      ]
    },
    {
      axisId: "PRIMARY_RESPONSIBILITY",
      label: "주요 책임 중심",
      values: [
        "채널 매출 운영과 파트너 실적관리",
        "파트너 육성과 판매 준비도 강화",
        "공동 제안과 수주 실행",
        "장기 제휴 구조와 에코시스템 확장"
      ]
    },
    {
      axisId: "CUSTOMER_DISTANCE",
      label: "최종 고객과의 거리",
      values: [
        "최종 고객 접점이 간접적임",
        "최종 고객보다 파트너 활성화에 집중",
        "최종 고객 제안 과정에 직접 동행",
        "개별 고객보다 파트너 생태계 구조에 집중"
      ]
    },
    {
      axisId: "PARTNER_MOTION",
      label: "파트너 운영 방식",
      values: [
        "계약·실적·유통 운영 중심",
        "온보딩·교육·프로그램 운영 중심",
        "딜 단위 공동 실행 중심",
        "공동 GTM·장기 협업모델 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "B2B 영업",
    "일반영업",
    "솔루션영업",
    "제안영업",
    "Key Account Management(KAM)",
    "신사업/사업개발(BD)",
    "고객성공(CSM)",
    "마케팅",
    "운영관리"
  ],
  boundaryHints: [
    "최종 고객을 직접 설득하고 계약을 닫는 비중이 커지면 파트너영업보다 B2B 영업이나 KAM으로 읽힙니다.",
    "리셀러·대리점 매출 운영보다 파트너 교육과 활성화가 더 중요해지면 채널관리보다 파트너 육성·활성화 성격이 강해집니다.",
    "파트너와 함께 딜을 만들고 제안·PoC·수주를 밀어붙이는 비중이 커지면 솔루션 파트너 동행영업으로 이동합니다.",
    "개별 파트너 매출보다 전략 파트너십 구조, 공동 GTM, 생태계 포지셔닝 비중이 커지면 얼라이언스·에코시스템 영업으로 읽힙니다.",
    "채널 운영 대신 가격정책·재고·판촉 현장 집행이 강해지면 일반 유통영업이나 대리점 영업 경계가 강해질 수 있습니다.",
    "영업보다 제휴 구조 설계와 사업모델 협상이 중심이 되면 사업개발(BD) 또는 제휴 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 최종 고객을 직접 상대하기보다 파트너·리셀러·대리점·전략 제휴사를 통해 매출을 만드는 간접 영업 성격이 강합니다. 실제 역할은 채널 매출 운영, 파트너 육성, 공동 영업, 전략 파트너십 설계 중 어디에 무게가 실리느냐에 따라 다르게 읽힙니다. 반면 고객 직접 수주 비중이 커지면 B2B 영업이나 KAM으로, 제휴 구조 설계가 더 커지면 BD·얼라이언스 경계로 이동할 수 있습니다."
};
