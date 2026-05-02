export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "ECOMMERCE_OPERATIONS",
  label: "커머스운영",
  aliases: [
    "커머스운영",
    "이커머스운영",
    "e커머스운영",
    "이커머스 오퍼레이션",
    "커머스 오퍼레이션",
    "쇼핑몰운영",
    "온라인몰운영",
    "자사몰운영",
    "몰운영",
    "스토어운영",
    "마켓플레이스운영",
    "오픈마켓운영",
    "상품운영",
    "주문운영",
    "배송운영",
    "커머스 상품운영",
    "커머스 운영관리",
    "이커머스 운영관리",
    "플랫폼 상품운영",
    "온라인 쇼핑몰 운영",
    "온라인 스토어 운영",
    "ecommerce operations",
    "commerce operations",
    "online store operations",
    "marketplace operations"
  ],
  families: [
    {
      id: "COMMERCE_PRODUCT_LISTING_OPERATIONS",
      label: "상품 등록·운영 관리",
      aliases: [
        "상품 등록",
        "상품 운영",
        "상품 관리",
        "상품 정보 관리",
        "카탈로그 운영",
        "product listing operations",
        "catalog operations",
        "product data management"
      ],
      strongSignals: [
        "상품 등록, 정보 업데이트, 노출 상태 관리",
        "상품 카탈로그 정확도 점검과 오류 수정",
        "판매 가격, 재고 상태, 옵션 관리",
        "상품 노출 순서와 카테고리 배치 운영",
        "신규 상품 온보딩과 등록 기준 관리",
        "판매 중단·일시품절 상품 관리",
        "상품 데이터 정합성 점검과 수정 요청"
      ],
      mediumSignals: [
        "상품 이미지·설명 품질 점검",
        "MD 또는 파트너와 상품 정보 조율",
        "판매 불가·규정 위반 상품 처리",
        "상품 등록 매뉴얼 관리",
        "카테고리 분류 기준 운영"
      ],
      boundarySignals: [
        "카테고리 전략과 상품 구성 방향 결정 비중이 커지면 MD/머천다이징으로 이동",
        "상품 소싱과 파트너 계약 비중이 커지면 구매·소싱 직무로 이동",
        "데이터 분석과 성과 리포트 중심이면 커머스 운영분석 또는 데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "COMMERCE_ORDER_FULFILLMENT_OPERATIONS",
        "COMMERCE_PERFORMANCE_PROMOTION_OPERATIONS"
      ],
      boundaryNote: "상품 정보를 정확하게 등록하고 판매 가능 상태를 유지하는 책임이 크면 이 family로 읽힙니다. 반면 카테고리 전략이나 소싱 의사결정이 더 중심이 되면 MD 경계가 강해집니다.",
      summaryTemplate: "이 직무는 온라인 상품이 정확하게 노출되고 구매 가능 상태를 유지하도록 관리하는 성격이 강합니다."
    },
    {
      id: "COMMERCE_ORDER_FULFILLMENT_OPERATIONS",
      label: "주문·결제·배송 운영",
      aliases: [
        "주문 처리",
        "주문 운영",
        "배송 운영",
        "CS 운영",
        "결제 운영",
        "풀필먼트 운영",
        "order operations",
        "fulfillment operations",
        "order management"
      ],
      strongSignals: [
        "주문 처리 현황 점검과 이상 건 처리",
        "결제 오류, 미결제, 환불·취소 요청 처리",
        "배송 지연, 오배송, 반품·교환 대응",
        "물류 파트너·배송사와 이슈 조율",
        "구매 완료 흐름에서 발생하는 운영 이슈 해소",
        "주문 데이터 점검과 일일 정산 확인",
        "고객 CS 접수와 주문 관련 문의 대응"
      ],
      mediumSignals: [
        "배송 현황 모니터링",
        "반품·환불 처리율 추이 확인",
        "고객 응대 매뉴얼 업데이트",
        "파트너사 배송 오류 피드백",
        "운영 일지 및 처리 현황 기록"
      ],
      boundarySignals: [
        "고객 문의 응대 비중이 압도적이면 CS 직무로 이동",
        "물류 네트워크 설계와 계약 관리 비중이 커지면 물류관리·SCM으로 이동",
        "결제 시스템 요구사항 정의가 중심이면 서비스기획 경계가 강해짐"
      ],
      adjacentFamilies: [
        "COMMERCE_PRODUCT_LISTING_OPERATIONS",
        "COMMERCE_PERFORMANCE_PROMOTION_OPERATIONS"
      ],
      boundaryNote: "주문부터 배송까지 구매 흐름이 끊기지 않도록 이슈를 처리하는 책임이 크면 이 family로 읽힙니다. 반면 고객 응대가 절대적으로 크면 CS, 물류 계약이 중심이면 SCM으로 이동합니다.",
      summaryTemplate: "이 직무는 주문·결제·배송 흐름에서 발생하는 운영 이슈를 처리하고 구매 경험이 끊기지 않도록 관리하는 성격이 강합니다."
    },
    {
      id: "COMMERCE_PERFORMANCE_PROMOTION_OPERATIONS",
      label: "커머스 성과·프로모션 운영",
      aliases: [
        "프로모션 운영",
        "기획전 운영",
        "커머스 성과 관리",
        "커머스 운영 분석",
        "판매 운영",
        "commerce performance",
        "promotion operations",
        "campaign operations"
      ],
      strongSignals: [
        "기획전, 쿠폰, 할인 행사 기획과 실행 관리",
        "프로모션 결과 데이터 수집과 성과 리뷰",
        "판매 전환율, 클릭률, 구매율 지표 점검",
        "시즌 행사·이벤트 운영 일정 관리",
        "프로모션 효율 분석과 개선 방향 도출",
        "매출 목표 대비 실적 추이 확인",
        "상품별·카테고리별 판매 성과 점검"
      ],
      mediumSignals: [
        "행사 상품 선정 지원",
        "프로모션 공지 작성",
        "판매 데이터 리포트 작성",
        "매출 급변 원인 파악",
        "경쟁사 프로모션 모니터링"
      ],
      boundarySignals: [
        "카테고리 전략과 상품 구성 판단이 중심이면 MD/머천다이징으로 이동",
        "광고 집행과 미디어 운용이 주업무면 퍼포먼스 마케팅으로 이동",
        "전사 사업 성과와 예산 관리까지 확장되면 사업기획 경계가 강해짐"
      ],
      adjacentFamilies: [
        "COMMERCE_PRODUCT_LISTING_OPERATIONS",
        "COMMERCE_ORDER_FULFILLMENT_OPERATIONS"
      ],
      boundaryNote: "프로모션을 기획하고 성과를 관리하는 책임이 크면 이 family로 읽힙니다. 반면 광고 미디어 집행이나 카테고리 전략 판단이 더 중심이 되면 각각 마케팅·MD 경계가 강해집니다.",
      summaryTemplate: "이 직무는 커머스 내 프로모션을 기획·실행하고 판매 성과를 추적·개선하는 성격이 강합니다."
    }
  ],
  roles: [
    {
      id: "ECOMMERCE_OPS_MANAGER",
      label: "커머스운영 매니저",
      aliases: [
        "커머스운영 매니저",
        "이커머스 운영 담당",
        "쇼핑몰 운영 담당",
        "ecommerce operations manager",
        "commerce ops manager"
      ],
      family: "COMMERCE_ORDER_FULFILLMENT_OPERATIONS",
      responsibilityHints: [
        "주문·배송·CS 운영 흐름 전반 관리",
        "운영 이슈 탐지와 신속 처리",
        "파트너사·물류사와 협업",
        "운영 지표 점검과 일일 현황 보고"
      ],
      levelHints: [
        "주니어는 이슈 처리와 현황 점검 비중이 큼",
        "시니어는 운영 구조 개선과 파트너 조율 비중이 큼"
      ]
    },
    {
      id: "ECOMMERCE_PRODUCT_MANAGER",
      label: "커머스 상품운영 담당",
      aliases: [
        "커머스 상품운영 담당",
        "상품운영 매니저",
        "catalog manager",
        "product operations manager"
      ],
      family: "COMMERCE_PRODUCT_LISTING_OPERATIONS",
      responsibilityHints: [
        "상품 등록 및 정보 관리",
        "카탈로그 정확도 유지",
        "노출 상태와 판매 가능 여부 점검",
        "MD·파트너와 상품 정보 조율"
      ],
      levelHints: [
        "주니어는 등록 실행과 오류 수정 비중이 큼",
        "시니어는 운영 기준 설계와 품질 체계 구축 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "COMMERCE_PRIMARY_DOMAIN",
      label: "주요 운영 도메인",
      values: [
        "상품 등록·카탈로그 관리",
        "주문·결제·배송 처리",
        "프로모션·기획전 운영",
        "성과 분석과 개선"
      ]
    },
    {
      axisId: "COMMERCE_PLATFORM_TYPE",
      label: "플랫폼 유형",
      values: [
        "자사몰(D2C)",
        "오픈마켓·마켓플레이스",
        "버티컬 커머스",
        "멀티채널(자사몰+외부 채널 병행)"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "상품 등록·업데이트 처리 내역",
        "주문·배송·CS 처리 현황 리포트",
        "프로모션 기획안과 성과 리포트",
        "커머스 운영 지표 대시보드"
      ]
    }
  ],
  adjacentFamilies: [
    "CS 운영",
    "서비스운영",
    "MD/머천다이징",
    "퍼포먼스 마케팅",
    "물류·SCM",
    "서비스기획",
    "데이터 분석"
  ],
  boundaryHints: [
    "일반 서비스운영 전체가 아니라 커머스 구매 흐름, 상품 운영, 주문·배송·정산 운영 비중이 큰 경우에 해당합니다.",
    "고객 문의 응대가 주업무인 경우는 커머스운영보다 CS 운영으로 읽히는 힘이 더 강합니다.",
    "카테고리 전략과 상품 구성 의사결정 비중이 크면 커머스운영보다 MD/머천다이징 경계가 강해집니다.",
    "광고 집행과 미디어 운용 중심이면 퍼포먼스 마케팅으로 이동합니다.",
    "시스템 요구사항 정의와 서비스 기능 개선 기획이 중심이면 서비스기획 경계가 강해집니다.",
    "물류 네트워크 설계나 공급망 계약 관리가 주업무면 SCM으로 이동합니다."
  ],
  summaryTemplate: "커머스운영은 상품 등록, 주문·결제·배송, CS, 정산, 프로모션 등 온라인 구매 경험이 실제로 굴러가도록 운영하고 개선하는 직무입니다. 일반 서비스운영과 달리 커머스 특화 흐름(상품-주문-결제-배송-CS-정산)을 중심으로 운영하며, 카테고리 전략 판단이나 소싱 의사결정 비중이 커지면 MD와 경계가 생깁니다."
};
