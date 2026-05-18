export const JOB_ONTOLOGY_ITEM = {
  majorCategory: "SALES",
  subcategory: "SALES_ADMIN_SUPPORT",
  id: "JOB_SALES_SALES_ADMIN_SUPPORT",
  label: "영업지원",
  aliases: [
    "영업지원", "영업 지원", "영업사무", "영업 사무", "영업행정", "영업 행정",
    "수주지원", "수주 지원", "발주지원", "발주 지원", "영업관리 지원",
    "sales support", "sales admin", "sales administration", "sales coordinator",
    "order admin", "order management support"
  ],
  families: [
    {
      id: "SALES_ORDER_CONTRACT_ADMIN",
      label: "수주·계약·정산 행정",
      aliases: ["수주 관리", "계약 관리", "견적 관리", "발주 처리", "정산 지원", "오더 관리", "order coordination", "contract admin"],
      strongSignals: [
        "견적서 작성과 견적 이력 관리", "수주 등록과 오더 처리", "계약서 작성·발송·보관 지원",
        "발주·출하·납기 일정 확인", "매출 정산과 세금계산서 발행 지원",
        "고객 요청사항을 생산·물류·재무 부서와 조율"
      ],
      mediumSignals: ["거래명세서 정리", "수주 현황표 업데이트", "납기 일정 확인", "계약 서류 취합", "정산 자료 정리"],
      boundarySignals: [
        "직접 신규 고객을 발굴하고 계약을 성사시키면 일반영업 또는 B2B 영업으로 이동",
        "영업 파이프라인 분석과 CRM 운영 설계가 중심이면 세일즈 옵스로 이동",
        "고객 접점이 거의 없고 내부 문서·총무 행정만 중심이면 공공·행정·지원 또는 고객·운영 계열로 이동"
      ],
      adjacentFamilies: ["SALES_DATA_REPORTING_SUPPORT", "SALES_CUSTOMER_CONTACT_ADMIN"],
      boundaryNote: "견적·수주·계약·발주·정산 행정이 중심이면 수주·계약·정산 행정으로 읽힙니다. 반면 고객 발굴이나 데이터 분석 설계 비중이 커지면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 견적서 작성, 수주 등록, 계약 처리, 정산 지원 등 영업팀의 행정적 흐름을 담당하는 성격이 강합니다."
    },
    {
      id: "SALES_DATA_REPORTING_SUPPORT",
      label: "매출·실적 데이터 지원",
      aliases: ["매출 관리 지원", "실적 관리 지원", "영업 실적 집계", "CRM 데이터 관리", "sales reporting support", "sales data admin"],
      strongSignals: [
        "영업 실적과 매출 데이터를 집계", "거래처별 매출 현황과 수주 현황을 정리",
        "CRM 데이터 입력·정합성 관리", "영업 보고자료와 주간·월간 리포트 작성",
        "파이프라인 현황을 영업팀에 공유"
      ],
      mediumSignals: ["실적표 업데이트", "CRM 입력", "매출 보고서 작성", "거래처 DB 관리", "영업 회의 자료 준비"],
      boundarySignals: [
        "데이터를 해석해 영업 전략·프로세스를 설계하면 세일즈 옵스로 이동",
        "매출 목표 수립과 영업 조직 운영 책임이 크면 영업기획 또는 세일즈 옵스로 이동",
        "직접 거래처를 관리하고 매출 책임을 지면 일반영업 또는 KAM 경계로 이동"
      ],
      adjacentFamilies: ["SALES_ORDER_CONTRACT_ADMIN", "SALES_CUSTOMER_CONTACT_ADMIN"],
      boundaryNote: "매출 데이터 집계와 영업 보고자료 작성이 중심이면 매출·실적 데이터 지원으로 읽힙니다. 반면 데이터 기반 전략 설계나 직접 매출 책임이 커지면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 영업 실적 데이터를 집계하고 보고자료를 만드는 성격이 강합니다."
    },
    {
      id: "SALES_CUSTOMER_CONTACT_ADMIN",
      label: "거래처 응대·행정 창구",
      aliases: ["거래처 응대 지원", "고객 요청 접수", "영업 창구", "거래처 관리 지원", "customer sales support"],
      strongSignals: [
        "거래처 문의를 접수하고 담당자 또는 내부 부서에 배분",
        "견적·계약·납기 관련 고객 요청을 확인",
        "고객 요청사항을 영업·물류·생산·재무 부서와 연결",
        "반복 문의와 요청 패턴을 정리",
        "거래처 기본 정보와 커뮤니케이션 이력을 관리"
      ],
      mediumSignals: ["고객 문의 전달", "견적 발송", "납기 확인", "거래처 정보 업데이트", "내부 담당자 연결"],
      boundarySignals: [
        "고객 문제 해결과 사용 경험 개선이 중심이면 고객·운영 계열로 이동",
        "거래처 매출 확대와 관계 유지 책임이 크면 일반영업 또는 KAM으로 이동",
        "단순 콜 응대 중심이면 고객지원/CS 계열로 이동"
      ],
      adjacentFamilies: ["SALES_ORDER_CONTRACT_ADMIN", "SALES_DATA_REPORTING_SUPPORT"],
      boundaryNote: "거래처 문의 응대와 내부 조율 창구 역할이 중심이면 거래처 응대·행정 창구로 읽힙니다. 반면 매출 책임이나 운영 품질 관리 비중이 커지면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 거래처 요청을 접수하고 내부 부서와 연결하는 창구 역할의 성격이 강합니다."
    }
  ],
  roles: [
    {
      id: "SALES_ADMIN_SUPPORT_SPECIALIST",
      label: "영업지원 담당",
      aliases: ["영업지원", "영업지원 담당", "sales support specialist"],
      family: "SALES_ORDER_CONTRACT_ADMIN",
      responsibilityHints: ["견적·계약·수주 서류 처리", "발주·납기 일정 확인", "정산 자료 정리", "영업팀 행정 지원"],
      levelHints: ["주니어는 서류 처리와 일정 확인 비중이 큼", "시니어는 주요 거래처 조율과 프로세스 개선 비중이 큼"]
    },
    {
      id: "SALES_COORDINATOR",
      label: "세일즈 코디네이터",
      aliases: ["sales coordinator", "영업 코디네이터", "영업사무 담당"],
      family: "SALES_CUSTOMER_CONTACT_ADMIN",
      responsibilityHints: ["거래처 요청 접수", "내부 부서 조율", "견적·납기 커뮤니케이션", "영업 자료 전달"],
      levelHints: ["주니어는 요청 접수와 전달 비중이 큼", "시니어는 거래처 조율과 이슈 해결 비중이 큼"]
    },
    {
      id: "SALES_REPORTING_ADMIN",
      label: "영업 실적·리포트 지원 담당",
      aliases: ["sales reporting admin", "영업 실적 관리 지원", "매출 보고 지원"],
      family: "SALES_DATA_REPORTING_SUPPORT",
      responsibilityHints: ["매출·실적 데이터 집계", "CRM 데이터 정리", "영업 보고자료 작성", "거래처 DB 관리"],
      levelHints: ["주니어는 데이터 입력과 집계 비중이 큼", "시니어는 보고 자동화와 데이터 구조 개선 비중이 큼"]
    }
  ],
  axes: [
    { axisId: "PRIMARY_SUPPORT_SCOPE", label: "지원 범위", values: ["수주·계약 행정", "매출·실적 데이터", "거래처 응대·조율"] },
    { axisId: "CUSTOMER_CONTACT_LEVEL", label: "고객 접점 수준", values: ["내부 행정 중심", "거래처 요청 응대", "영업 담당자와 고객 사이 조율"] },
    { axisId: "SALES_RESPONSIBILITY_LEVEL", label: "영업 책임 수준", values: ["행정 지원", "운영 조율", "직접 매출 책임 없음"] }
  ],
  adjacentFamilies: [
    "일반영업(general_sales)", "B2B 영업(b2b_sales)", "영업 운영/세일즈 옵스(sales_operations)",
    "Key Account Management(KAM)", "고객·운영(customer_operations)", "공공·행정·지원(public_administration_support)"
  ],
  boundaryHints: [
    "직접 고객을 발굴하고 계약을 성사시키는 책임이 크면 일반영업 또는 B2B 영업으로 이동합니다.",
    "CRM 운영, 파이프라인 분석, 영업 프로세스 설계가 중심이면 영업 운영/세일즈 옵스로 이동합니다.",
    "핵심 거래처의 매출 확대와 장기 관계 관리가 중심이면 KAM으로 이동합니다.",
    "고객 문의 해결과 서비스 운영 품질 관리가 중심이면 고객·운영 계열로 이동합니다.",
    "영업과 무관한 내부 행정·총무·문서 지원이 중심이면 공공·행정·지원 또는 운영지원 계열로 이동합니다."
  ],
  summaryTemplate: "이 직무는 직접 영업 성과를 만드는 역할이라기보다, 견적·수주·계약·정산·CRM·거래처 요청 처리 등을 통해 영업팀이 안정적으로 매출 활동을 이어가도록 지원하는 성격이 강합니다."
};
