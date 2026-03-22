export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "OVERSEAS_SALES",
  aliases: [
    "해외영업",
    "해외 영업",
    "국제영업",
    "글로벌 영업",
    "수출영업",
    "해외사업 영업",
    "overseas sales",
    "international sales",
    "global sales",
    "export sales",
    "regional sales manager",
    "overseas account manager"
  ],
  families: [
    {
      id: "EXPORT_ACCOUNT_SALES",
      label: "수출·거래처 개척형 해외영업",
      aliases: [
        "수출영업",
        "해외 거래처 개척",
        "export sales",
        "international account sales",
        "new overseas sales"
      ],
      strongSignals: [
        "해외 신규 바이어 발굴 및 첫 거래 성사",
        "국가 또는 권역별 바이어 리스트업과 접촉",
        "수출 조건, 가격, MOQ, 결제 조건 협상",
        "전시회, 온라인 플랫폼, 네트워크를 통한 해외 리드 발굴",
        "첫 샘플 테스트 이후 초도 발주 전환 관리",
        "해외 거래처와 메일, 화상회의, 방문 미팅을 통한 계약 협의",
        "신규 국가 또는 미개척 시장 진입 초기 영업 수행"
      ],
      mediumSignals: [
        "해외 문의 리드 대응",
        "제품 카탈로그, 소개자료, 견적서 활용",
        "시장별 잠재 바이어 조사",
        "거래 개시를 위한 내부 승인 및 조건 검토",
        "샘플 발송과 후속 커뮤니케이션"
      ],
      boundarySignals: [
        "기존 거래처 반복 운영과 물량 관리 비중이 커지면 기존거래처 운영형 해외영업으로 이동",
        "대리점, 총판, 현지 파트너 구조 관리 비중이 커지면 채널·디스트리뷰터형 해외영업으로 이동",
        "무역실무와 선적, 서류 처리 비중이 압도적으로 커지면 무역사무 또는 수출운영 경계로 이동"
      ],
      adjacentFamilies: [
        "OVERSEAS_ACCOUNT_EXPANSION",
        "CHANNEL_DISTRIBUTOR_OVERSEAS_SALES",
        "PROJECT_BID_OVERSEAS_SALES"
      ],
      boundaryNote: "해외 신규 바이어를 발굴해 첫 거래를 만드는 책임이 분명하면 수출·거래처 개척형 해외영업으로 읽힙니다. 반면 기존 거래 운영이나 채널 관리, 무역실무 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 해외 신규 바이어를 발굴하고 첫 수출 거래를 성사시키는 성격이 강합니다. 반면 기존 거래처 운영이나 채널 관리 비중이 커지면 다른 해외영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "OVERSEAS_ACCOUNT_EXPANSION",
      label: "기존거래처 운영형 해외영업",
      aliases: [
        "기존 바이어 관리",
        "해외 거래처 관리",
        "global account sales",
        "overseas account management",
        "export account management"
      ],
      strongSignals: [
        "기존 해외 바이어 매출 유지 및 확대",
        "반복 발주, 연간 계약, 시즌별 물량 운영 관리",
        "국가별 거래처별 실적 리뷰와 목표 관리",
        "가격 조정, 납기, 클레임, 재발주 이슈 조율",
        "기존 거래선 내 추가 품목 또는 추가 국가 확장 제안",
        "바이어 요청사항을 내부 생산, 물류, 품질과 조율",
        "장기 거래 관계 유지와 갱신 협상 수행"
      ],
      mediumSignals: [
        "월별 수출 실적 보고",
        "바이어 미팅과 정기 커뮤니케이션",
        "수금, 채권, 결제 일정 확인",
        "판촉 자료 및 프로모션 협의",
        "시장 반응을 반영한 후속 제안"
      ],
      boundarySignals: [
        "신규 바이어 발굴 비중이 커지면 수출·거래처 개척형 해외영업으로 이동",
        "현지 파트너 체계와 유통망 관리 비중이 커지면 채널·디스트리뷰터형 해외영업으로 이동",
        "주문·선적·서류 처리만 남고 고객 설득 기능이 약해지면 무역사무 또는 영업운영으로 이동"
      ],
      adjacentFamilies: [
        "EXPORT_ACCOUNT_SALES",
        "CHANNEL_DISTRIBUTOR_OVERSEAS_SALES",
        "PROJECT_BID_OVERSEAS_SALES"
      ],
      boundaryNote: "이미 거래 중인 해외 바이어를 유지하고 반복 매출을 키우는 책임이 중심이면 기존거래처 운영형 해외영업으로 읽힙니다. 반면 신규 개척이나 채널 구조 관리가 중심이 되면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기존 해외 바이어와의 거래를 안정적으로 운영하면서 반복 매출과 추가 매출을 만드는 성격이 강합니다. 반면 신규 개척이나 유통망 관리 비중이 커지면 다른 해외영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "CHANNEL_DISTRIBUTOR_OVERSEAS_SALES",
      label: "채널·디스트리뷰터형 해외영업",
      aliases: [
        "해외 채널영업",
        "디스트리뷰터 영업",
        "총판 영업",
        "global channel sales",
        "distributor sales",
        "regional distributor management"
      ],
      strongSignals: [
        "국가별 총판, 대리점, 디스트리뷰터 발굴 및 계약",
        "현지 파트너를 통한 간접 판매 구조 운영",
        "파트너별 판매 목표와 실적 관리",
        "현지 유통 정책, 가격 정책, 마진 구조 협의",
        "채널 재고, 판촉, 시장 커버리지 관리",
        "총판 교육, 영업자료 제공, 공동 영업 지원",
        "국가 또는 권역 단위 채널 전략 운영"
      ],
      mediumSignals: [
        "현지 파트너 정기 리뷰",
        "채널 계약 갱신",
        "리셀러 세미나 또는 교육 운영",
        "유통 데이터 확인",
        "현지 시장별 프로모션 협의"
      ],
      boundarySignals: [
        "최종 바이어를 직접 개척하는 비중이 커지면 수출·거래처 개척형 해외영업으로 이동",
        "사업 제휴 구조 설계와 장기 사업 모델 협상이 중심이면 사업개발(BD)로 이동",
        "현지 운영 지원과 매장 관리만 남으면 운영관리 또는 채널 운영 경계로 이동"
      ],
      adjacentFamilies: [
        "EXPORT_ACCOUNT_SALES",
        "OVERSEAS_ACCOUNT_EXPANSION",
        "PROJECT_BID_OVERSEAS_SALES"
      ],
      boundaryNote: "직접 판매보다 총판, 대리점, 현지 파트너를 통해 해외 매출을 만드는 구조라면 채널·디스트리뷰터형 해외영업으로 읽힙니다. 반면 직접 바이어 개척이나 사업 제휴 설계가 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 현지 파트너와 유통망을 통해 해외 매출을 만드는 성격이 강합니다. 반면 직접 바이어 개척이나 사업 제휴 비중이 커지면 다른 해외영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "PROJECT_BID_OVERSEAS_SALES",
      label: "프로젝트·입찰형 해외영업",
      aliases: [
        "프로젝트 해외영업",
        "해외 수주 영업",
        "입찰형 해외영업",
        "project overseas sales",
        "international bid sales",
        "overseas proposal sales"
      ],
      strongSignals: [
        "해외 프로젝트 단위로 요구사항과 수주 조건을 분석",
        "입찰, 제안요청서, 프로젝트 스펙 기반 제안 수행",
        "발주처, 현지 파트너, 내부 기술·운영 조직을 함께 조율",
        "가격, 납기, 범위, 계약 조건이 연결된 복합 딜 관리",
        "프로젝트별 기술 질의, 상업 조건, 실행 가능성 검토",
        "해외 고객 또는 발주처 대상 제안 발표와 협상",
        "단순 반복 발주보다 프로젝트 수주 성공이 핵심 성과임"
      ],
      mediumSignals: [
        "제안 일정과 마감 관리",
        "현지 규격, 인증, 문서 요건 검토",
        "컨소시엄 또는 협력사 공동 제안",
        "프로젝트 리스크 정리",
        "수주 후 인수인계 범위 조율"
      ],
      boundarySignals: [
        "프로젝트 수주 이후 실행 관리까지 깊게 맡으면 PM 또는 프로젝트관리로 이동",
        "기술 검증과 솔루션 설계 비중이 매우 크면 솔루션영업 또는 기술영업으로 이동",
        "반복적인 바이어 운영 비중이 커지면 기존거래처 운영형 해외영업으로 이동"
      ],
      adjacentFamilies: [
        "EXPORT_ACCOUNT_SALES",
        "OVERSEAS_ACCOUNT_EXPANSION",
        "CHANNEL_DISTRIBUTOR_OVERSEAS_SALES"
      ],
      boundaryNote: "해외 시장에서 프로젝트 단위의 수주를 만들고 입찰·제안 과정을 리딩하면 프로젝트·입찰형 해외영업으로 읽힙니다. 반면 수주 후 실행관리나 솔루션 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 해외 프로젝트를 제안하고 수주로 연결하는 성격이 강합니다. 반면 구축 실행이나 기술 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "EXPORT_SALES_MANAGER",
      label: "수출영업 담당",
      aliases: [
        "수출영업 담당",
        "export sales manager",
        "international sales manager"
      ],
      family: "EXPORT_ACCOUNT_SALES",
      responsibilityHints: [
        "신규 바이어 발굴",
        "견적과 조건 협상",
        "초도 거래 전환",
        "국가별 시장 개척"
      ],
      levelHints: [
        "주니어는 리드 발굴과 샘플 대응 비중이 큼",
        "시니어는 주요 바이어 협상과 국가 개척 전략 비중이 큼"
      ]
    },
    {
      id: "OVERSEAS_ACCOUNT_MANAGER",
      label: "해외 거래처 담당",
      aliases: [
        "해외 거래처 담당",
        "overseas account manager",
        "global account manager"
      ],
      family: "OVERSEAS_ACCOUNT_EXPANSION",
      responsibilityHints: [
        "기존 바이어 관리",
        "반복 발주와 매출 확대",
        "납기·클레임 조율",
        "장기 거래 관계 유지"
      ],
      levelHints: [
        "주니어는 주문 운영과 커뮤니케이션 비중이 큼",
        "시니어는 매출 확대와 주요 거래선 협상 비중이 큼"
      ]
    },
    {
      id: "REGIONAL_CHANNEL_MANAGER",
      label: "해외 채널영업 담당",
      aliases: [
        "regional channel manager",
        "distributor manager",
        "해외 채널 담당"
      ],
      family: "CHANNEL_DISTRIBUTOR_OVERSEAS_SALES",
      responsibilityHints: [
        "디스트리뷰터 발굴 및 관리",
        "채널 목표와 실적 관리",
        "현지 파트너 교육",
        "가격·유통 정책 협의"
      ],
      levelHints: [
        "주니어는 파트너 운영 지원과 데이터 관리 비중이 큼",
        "시니어는 국가별 채널 전략과 주요 파트너 협상 비중이 큼"
      ]
    },
    {
      id: "OVERSEAS_PROJECT_SALES_MANAGER",
      label: "해외 프로젝트 영업 담당",
      aliases: [
        "해외 프로젝트 영업",
        "project sales manager",
        "international bid manager"
      ],
      family: "PROJECT_BID_OVERSEAS_SALES",
      responsibilityHints: [
        "입찰 및 제안 대응",
        "프로젝트 범위와 가격 조율",
        "발주처·파트너 협상",
        "수주 전략 관리"
      ],
      levelHints: [
        "주니어는 제안 자료와 문서 대응 비중이 큼",
        "시니어는 복합 조건 협상과 수주 전략 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "CUSTOMER_STRUCTURE",
      label: "고객 구조",
      values: [
        "직접 해외 바이어",
        "기존 거래선 중심",
        "총판·대리점·디스트리뷰터",
        "발주처·프로젝트 이해관계자"
      ]
    },
    {
      axisId: "PRIMARY_SALES_MOTION",
      label: "주요 영업 방식",
      values: [
        "신규 시장과 바이어 개척",
        "반복 거래와 관계 확장",
        "채널 운영과 간접 판매",
        "입찰·제안·프로젝트 수주"
      ]
    },
    {
      axisId: "CROSS_BORDER_COMPLEXITY",
      label: "국경 간 복잡도",
      values: [
        "초기 거래 조건과 문화 차이 대응",
        "장기 거래 운영과 이슈 조율",
        "현지 유통 구조와 파트너 관리",
        "국가별 프로젝트 조건과 문서 요건 대응"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "리드 발굴과 첫 거래 성사",
        "반복 발주와 매출 유지 확대",
        "채널 실적과 유통 정책 관리",
        "제안 범위·가격·납기·수주 조율"
      ]
    }
  ],
  adjacentFamilies: [
    "일반영업",
    "B2B 영업",
    "기술영업",
    "솔루션영업",
    "파트너영업 / 채널영업",
    "제안영업",
    "무역사무",
    "신사업/사업개발(BD)"
  ],
  boundaryHints: [
    "해외 신규 바이어를 발굴하고 첫 수출 거래를 만드는 비중이 많아지면 수출·거래처 개척형 해외영업으로 읽힙니다.",
    "기존 해외 거래처의 반복 발주와 매출 확대 비중이 커지면 기존거래처 운영형 해외영업으로 이동합니다.",
    "총판, 대리점, 디스트리뷰터를 통한 간접 판매 구조가 중심이면 채널·디스트리뷰터형 해외영업으로 이동합니다.",
    "입찰, 제안서, 프로젝트 수주 비중이 커지면 프로젝트·입찰형 해외영업으로 이동합니다.",
    "기술 설명, 사양 검토, 솔루션 구성안 설계 비중이 커지면 기술영업 또는 솔루션영업으로 이동합니다.",
    "선적, 통관, 수출 서류, 결제 실무 비중이 커지고 고객 설득 기능이 약해지면 무역사무 또는 수출운영 경계로 이동합니다.",
    "현지 파트너와의 장기 사업 구조 설계와 사업 모델 협상 비중이 커지면 사업개발(BD) 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 해외 시장과 고객을 대상으로 거래를 만들고 유지하는 해외영업 성격이 강합니다. 다만 실제 역할은 신규 수출 개척형, 기존 거래선 운영형, 채널·디스트리뷰터형, 프로젝트 수주형으로 나뉘며 작동 방식이 달라집니다. 반면 기술 제안, 무역실무, 사업 제휴 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
