export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "MERCHANDISING",
  label: "MD/머천다이징",
  aliases: [
    "MD",
    "엠디",
    "머천다이저",
    "머천다이징",
    "리테일MD",
    "온라인MD",
    "커머스MD",
    "이커머스MD",
    "상품MD",
    "카테고리MD",
    "카테고리 매니저",
    "카테고리매니저",
    "온라인 상품기획",
    "커머스 상품기획",
    "리테일 상품기획",
    "상품 운영 기획",
    "상품전략",
    "카테고리 운영",
    "상품 구성",
    "상품 소싱 기획",
    "판매전략 MD",
    "merchandiser",
    "merchandising",
    "category manager",
    "buying manager",
    "retail MD",
    "online MD"
  ],
  families: [
    {
      id: "CATEGORY_PRODUCT_ASSORTMENT",
      label: "카테고리·상품 구성 기획",
      aliases: [
        "카테고리 기획",
        "상품 구성 기획",
        "카테고리 전략",
        "상품 편성",
        "category planning",
        "assortment planning",
        "product curation"
      ],
      strongSignals: [
        "카테고리 내 판매 상품 구성과 라인업 기획",
        "신규 상품 소싱 방향 수립과 입점 상품 선정",
        "카테고리 전략 방향과 타깃 고객 분석",
        "경쟁사 상품 구성 모니터링과 차별화 기획",
        "시즌·트렌드 반영한 상품 라인업 조정",
        "상품 노출 우선순위와 카탈로그 편성 판단",
        "카테고리 KPI 목표 설정과 성과 방향 결정"
      ],
      mediumSignals: [
        "입점 파트너·브랜드 협의",
        "상품 트렌드 리포트 작성",
        "카테고리 내 신상품 평가",
        "소비자 리뷰·구매 데이터 분석",
        "시즌 특수 상품 라인업 검토"
      ],
      boundarySignals: [
        "실제 소싱 계약과 가격 협상 비중이 압도적이면 구매·소싱 직무로 이동",
        "상품 등록 실행과 데이터 관리 중심이면 커머스운영으로 이동",
        "광고 집행과 미디어 채널 운영 비중이 커지면 퍼포먼스 마케팅으로 이동"
      ],
      adjacentFamilies: [
        "SALES_PERFORMANCE_PRODUCT_MANAGEMENT",
        "VENDOR_PARTNER_COORDINATION"
      ],
      boundaryNote: "어떤 상품을 어떻게 구성해 고객에게 선보일지 방향을 잡는 책임이 크면 이 family로 읽힙니다. 반면 실제 소싱 계약이나 상품 등록 실행이 더 중심이 되면 구매·커머스운영 경계가 강해집니다.",
      summaryTemplate: "이 직무는 카테고리 내 어떤 상품을 어떤 구성으로 판매할지 기획하고 방향을 설정하는 성격이 강합니다."
    },
    {
      id: "SALES_PERFORMANCE_PRODUCT_MANAGEMENT",
      label: "판매 성과·상품 운영 관리",
      aliases: [
        "상품 성과 관리",
        "판매 실적 관리",
        "MD 운영",
        "판매 운영 기획",
        "sales performance management",
        "product performance management",
        "retail performance"
      ],
      strongSignals: [
        "상품별·카테고리별 매출, 판매량, 마진 분석",
        "저성과 상품 교체와 판매 개선 전략 수립",
        "프로모션 기획과 가격 전략 조정",
        "재고 소진율과 회전율 관리",
        "판매 목표 달성을 위한 운영 전략 수립",
        "시즌 이후 잔여 재고 처리 기획",
        "상품 수명주기 관리와 교체 시점 판단"
      ],
      mediumSignals: [
        "할인·행사 기획 협의",
        "판매 데이터 리포트 작성",
        "카테고리 성과 리뷰",
        "재입고 여부 판단",
        "트렌드 변화에 따른 라인업 조정"
      ],
      boundarySignals: [
        "전사 사업 수익성 관리까지 확장되면 사업기획 경계가 강해짐",
        "광고 집행이 중심이면 퍼포먼스 마케팅으로 이동",
        "물류·재고 시스템 운영이 중심이면 SCM으로 이동"
      ],
      adjacentFamilies: [
        "CATEGORY_PRODUCT_ASSORTMENT",
        "VENDOR_PARTNER_COORDINATION"
      ],
      boundaryNote: "상품이 실제로 잘 팔리도록 성과를 추적하고 판매 전략을 조정하는 책임이 크면 이 family로 읽힙니다. 반면 전사 사업 전략이나 광고 채널 운영이 중심이 되면 사업기획·마케팅 경계가 강해집니다.",
      summaryTemplate: "이 직무는 상품 판매 성과를 추적하고 저성과 상품을 개선하며 카테고리 목표를 달성하는 운영 전략을 세우는 성격이 강합니다."
    },
    {
      id: "VENDOR_PARTNER_COORDINATION",
      label: "파트너·협력사 조율",
      aliases: [
        "파트너 관리",
        "입점사 관리",
        "협력사 관리",
        "브랜드사 협의",
        "vendor management",
        "partner coordination",
        "supplier relations"
      ],
      strongSignals: [
        "입점 브랜드·파트너와 상품 조건 협의",
        "납품 일정, 재고 확보, 공급 조건 조율",
        "파트너 상품 품질 기준과 정보 관리 조율",
        "신규 파트너 온보딩과 계약 지원",
        "파트너 성과 리뷰와 관계 유지",
        "프로모션 참여 조건 협의",
        "파트너 이슈 대응과 클레임 조율"
      ],
      mediumSignals: [
        "파트너사 연락 및 커뮤니케이션 관리",
        "입점 가이드라인 전달",
        "파트너사 데이터 점검",
        "계약 갱신 지원",
        "입점사 만족도 관리"
      ],
      boundarySignals: [
        "소싱·구매 계약과 가격 결정 비중이 압도적이면 구매MD·소싱 직무로 이동",
        "파트너십 전략과 사업 개발 비중이 커지면 BD(사업개발)로 이동",
        "실제 상품 등록·운영 실행이 중심이면 커머스운영으로 이동"
      ],
      adjacentFamilies: [
        "CATEGORY_PRODUCT_ASSORTMENT",
        "SALES_PERFORMANCE_PRODUCT_MANAGEMENT"
      ],
      boundaryNote: "파트너·브랜드와의 관계에서 상품 구성과 운영 조건을 조율하는 책임이 크면 이 family로 읽힙니다. 반면 구매 계약 체결이나 BD 전략이 더 중심이 되면 각각 구매·BD 경계가 강해집니다.",
      summaryTemplate: "이 직무는 입점 브랜드·파트너와 상품 조건, 공급 일정, 프로모션 참여를 조율하는 성격이 강합니다."
    }
  ],
  roles: [
    {
      id: "MD_CATEGORY_MANAGER",
      label: "카테고리 MD",
      aliases: [
        "카테고리 MD",
        "카테고리 매니저",
        "category MD",
        "category manager"
      ],
      family: "CATEGORY_PRODUCT_ASSORTMENT",
      responsibilityHints: [
        "카테고리 내 상품 구성과 라인업 결정",
        "판매 성과 기반 상품 교체와 운영 전략",
        "트렌드 분석과 시즌 상품 기획",
        "파트너·브랜드와 상품 조건 협의"
      ],
      levelHints: [
        "주니어는 데이터 분석과 상품 등록 지원 비중이 큼",
        "시니어는 카테고리 전략 수립과 파트너 계약 조율 비중이 큼"
      ]
    },
    {
      id: "MD_SALES_PERFORMANCE",
      label: "판매 성과 MD",
      aliases: [
        "판매 성과 MD",
        "MD 운영 담당",
        "sales MD",
        "retail performance MD"
      ],
      family: "SALES_PERFORMANCE_PRODUCT_MANAGEMENT",
      responsibilityHints: [
        "상품별 판매 실적 분석과 개선 방향 도출",
        "프로모션 기획과 가격 전략 조정",
        "재고 소진 전략 수립",
        "카테고리 KPI 달성 관리"
      ],
      levelHints: [
        "주니어는 리포팅과 데이터 정리 비중이 큼",
        "시니어는 전략 기획과 의사결정 지원 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "MD_PRIMARY_FOCUS",
      label: "주요 역할 중심",
      values: [
        "카테고리·상품 구성 기획",
        "판매 성과 추적과 개선",
        "파트너·협력사 조율",
        "프로모션·가격 전략"
      ]
    },
    {
      axisId: "MD_CHANNEL_TYPE",
      label: "채널 유형",
      values: [
        "온라인 커머스(이커머스 전용)",
        "오프라인 리테일",
        "온·오프라인 병행",
        "마켓플레이스"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "카테고리 기획안과 상품 라인업 보고",
        "판매 성과 리포트와 개선 전략",
        "파트너 협의 결과와 계약 지원 문서",
        "시즌 프로모션 기획안"
      ]
    }
  ],
  adjacentFamilies: [
    "구매·소싱",
    "커머스운영",
    "퍼포먼스 마케팅",
    "사업기획",
    "서비스기획",
    "BD(사업개발)"
  ],
  boundaryHints: [
    "구매MD, 소싱MD, 구매엠디, 소싱엠디, 조달MD처럼 소싱·가격협상·계약이 핵심인 역할은 이 직무가 아니라 구매·소싱(PROCUREMENT) 쪽으로 읽힙니다.",
    "상품 등록 실행과 주문·배송 처리가 주업무면 커머스운영 경계가 강해집니다.",
    "광고 집행과 디지털 채널 운용이 중심이면 퍼포먼스 마케팅으로 이동합니다.",
    "수익모델, 시장 전략, 전사 사업 성과 관리가 중심이면 사업기획 경계가 강해집니다.",
    "시스템 화면 기획과 서비스 기능 정의 비중이 커지면 서비스기획 경계가 생깁니다.",
    "파트너십 전략과 신규 사업 개발 비중이 커지면 BD(사업개발)로 이동합니다."
  ],
  summaryTemplate: "MD/머천다이징은 어떤 상품을 어떤 구성으로 판매할지 기획하고, 판매 성과를 추적하며, 파트너와 조율하는 직무입니다. 소싱·계약 중심의 구매MD와 달리 상품 구성 기획·성과 관리·카테고리 전략에 무게가 실립니다. 온라인 커머스 환경에서는 커머스운영과 자주 겹치지만, 판매 방향을 결정하는 기획 책임이 있는지가 MD와 운영 실행의 핵심 구분점입니다."
};
