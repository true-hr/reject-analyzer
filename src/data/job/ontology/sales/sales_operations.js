export const JOB_ONTOLOGY_ITEM = {
  majorCategory: "SALES",
  subcategory: "SALES_OPERATIONS",
  id: "JOB_SALES_SALES_OPERATIONS",
  label: "영업 운영 / 세일즈 옵스",
  aliases: [
    "세일즈 옵스",
    "영업 운영",
    "sales ops",
    "sales operations",
    "revenue operations",
    "RevOps",
    "영업 기획",
    "sales enablement",
    "세일즈 이네이블먼트",
    "영업기획팀",
    "영업 지원 기획"
  ],
  families: [
    {
      id: "SALES_PROCESS_ANALYTICS_OPS",
      label: "영업 프로세스·분석형 세일즈 옵스",
      aliases: [
        "영업 프로세스 설계",
        "sales analytics",
        "영업 데이터 분석",
        "CRM 운영"
      ],
      strongSignals: [
        "영업 파이프라인 데이터를 분석해 병목 구간 파악 및 개선",
        "CRM 시스템(Salesforce, HubSpot 등) 설정·운영·개선",
        "영업 목표(quota) 설계와 배분 체계 운영",
        "영업 지표(win rate, pipeline velocity, ARR) 설계와 추적",
        "영업 프로세스 표준화와 SOP 문서화",
        "리드 관리, 기회 관리, 계약 관리 체계 설계",
        "예측(forecasting) 정확도 향상을 위한 데이터 체계 구축"
      ],
      mediumSignals: [
        "CRM 데이터 정합성 관리",
        "영업 리포트 자동화",
        "영업팀 대시보드 구축",
        "영업 파이프라인 주간 리뷰 운영",
        "영업 툴 관리"
      ],
      boundarySignals: [
        "영업 프로세스보다 수익 전반(마케팅·CS 포함) 분석 비중이 커지면 RevOps로 이동",
        "데이터 분석 비중이 커지고 프로세스 개선 참여가 적으면 데이터 분석 직무로 이동",
        "직접 영업 실행과 고객 커뮤니케이션 비중이 커지면 B2B 영업 직무로 이동"
      ],
      adjacentFamilies: [
        "REVENUE_OPERATIONS_REVOPS",
        "SALES_ENABLEMENT_TRAINING"
      ],
      boundaryNote: "영업 파이프라인 데이터 분석, CRM 운영, 프로세스 표준화가 중심이면 영업 프로세스·분석형으로 읽힙니다. 반면 수익 전반 관리나 직접 영업 실행이면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 영업 파이프라인 데이터를 분석하고 CRM 운영, 프로세스 설계를 통해 영업 효율을 높이는 성격이 강합니다."
    },
    {
      id: "REVENUE_OPERATIONS_REVOPS",
      label: "레버뉴 옵스 (RevOps)",
      aliases: [
        "RevOps",
        "revenue operations",
        "레버뉴 옵스",
        "수익 운영"
      ],
      strongSignals: [
        "영업·마케팅·CS를 아우르는 수익 파이프라인 전체 설계",
        "마케팅 리드부터 CS 갱신까지 전체 고객 여정 데이터 연결",
        "부서 간 목표 정렬과 수익 예측 체계 통합",
        "GTM(Go-to-Market) 전략 실행 데이터 분석과 개선",
        "전사 수익 지표 설계와 C-level 리포팅",
        "마케팅 자동화, CRM, CS 툴 스택 통합 운영"
      ],
      mediumSignals: [
        "부서 간 리드 인계 기준 설계",
        "통합 파이프라인 리포트 작성",
        "툴 스택 통합 운영",
        "ARR/NRR 분석"
      ],
      boundarySignals: [
        "영업 파이프라인만 다루면 세일즈 옵스로 이동",
        "실제 영업 또는 마케팅 실행 비중이 커지면 해당 직무로 이동"
      ],
      adjacentFamilies: [
        "SALES_PROCESS_ANALYTICS_OPS",
        "SALES_ENABLEMENT_TRAINING"
      ],
      boundaryNote: "수익 파이프라인 전체를 아우르고 영업·마케팅·CS를 통합 운영하는 역할이면 RevOps로 읽힙니다. 반면 영업 프로세스만 다루면 세일즈 옵스로 이동합니다.",
      summaryTemplate: "이 직무는 영업, 마케팅, CS를 연결하는 수익 파이프라인 전체를 설계하고 운영하는 성격이 강합니다."
    },
    {
      id: "SALES_ENABLEMENT_TRAINING",
      label: "영업 역량 지원·이네이블먼트",
      aliases: [
        "sales enablement",
        "세일즈 이네이블먼트",
        "영업 교육",
        "영업 콘텐츠 제작"
      ],
      strongSignals: [
        "영업팀의 성과 향상을 위한 교육, 콘텐츠, 도구 제공",
        "영업 피치덱, 케이스 스터디, 배틀카드 제작",
        "신규 영업 온보딩 프로그램 설계",
        "영업 스킬 트레이닝과 코칭 운영",
        "영업 콘텐츠 라이브러리 관리"
      ],
      mediumSignals: [
        "영업 자료 제작 지원",
        "트레이닝 세션 운영",
        "영업 도구 교육",
        "Win/Loss 분석 및 공유"
      ],
      boundarySignals: [
        "영업 자료 제작보다 프로세스 분석과 CRM 운영이 중심이면 세일즈 옵스로 이동",
        "교육 내용이 영업이 아닌 사내 전반이면 L&D 또는 HR 직무로 이동"
      ],
      adjacentFamilies: [
        "SALES_PROCESS_ANALYTICS_OPS",
        "REVENUE_OPERATIONS_REVOPS"
      ],
      boundaryNote: "영업팀 역량 강화와 도구·콘텐츠 지원이 중심이면 영업 이네이블먼트로 읽힙니다. 반면 데이터 분석이나 전사 수익 관리 비중이 커지면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 영업팀이 더 효과적으로 일할 수 있도록 교육, 콘텐츠, 도구를 제공하는 성격이 강합니다."
    }
  ],
  roles: [
    {
      id: "SALES_OPS_MANAGER",
      label: "세일즈 옵스 담당",
      aliases: ["sales ops manager", "세일즈 옵스 담당", "영업 운영 담당"],
      family: "SALES_PROCESS_ANALYTICS_OPS",
      responsibilityHints: [
        "CRM 운영",
        "영업 지표 관리",
        "프로세스 표준화",
        "파이프라인 분석"
      ],
      levelHints: [
        "주니어는 CRM 데이터 관리와 리포트 작성 비중이 큼",
        "시니어는 프로세스 설계와 전략 분석 비중이 큼"
      ]
    },
    {
      id: "REVOPS_MANAGER",
      label: "레버뉴 옵스 담당",
      aliases: ["RevOps manager", "revenue operations manager", "레버뉴 옵스 담당"],
      family: "REVENUE_OPERATIONS_REVOPS",
      responsibilityHints: [
        "통합 수익 파이프라인 관리",
        "부서 간 목표 정렬",
        "GTM 전략 지원",
        "전사 수익 리포팅"
      ],
      levelHints: [
        "주니어는 데이터 연결과 리포트 작성 비중이 큼",
        "시니어는 GTM 전략 설계와 C-level 리포팅 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "SCOPE",
      label: "운영 범위",
      values: ["영업 파이프라인 전문", "수익 파이프라인 통합", "영업 역량 지원"]
    },
    {
      axisId: "PRIMARY_ACTIVITY",
      label: "핵심 활동",
      values: ["데이터 분석·CRM", "파이프라인 통합 설계", "교육·콘텐츠 지원"]
    }
  ],
  adjacentFamilies: [
    "B2B 영업(b2b_sales)",
    "영업관리(key_account_management)",
    "데이터 분석(data_analysis)",
    "운영기획(operations_management)",
    "CRM 마케팅(crm_marketing)"
  ],
  boundaryHints: [
    "직접 고객 영업과 딜 클로징이 중심이면 B2B 영업(b2b_sales)으로 이동합니다.",
    "데이터 분석과 인사이트 도출이 주 업무이고 영업 프로세스 참여가 낮으면 데이터 분석 직무로 이동합니다.",
    "영업 목표·예산·조직 관리가 중심이면 운영기획(operations_management) 경계와 겹칠 수 있습니다.",
    "단순 영업 행정 지원이면 일반영업(general_sales)이나 공공행정 지원으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 영업팀의 성과를 데이터와 프로세스로 지원하는 역할로, 실제 역할은 세일즈 옵스(영업 프로세스·CRM), RevOps(수익 전체 파이프라인), 이네이블먼트(영업 역량 강화)로 나뉩니다."
};
