export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "DATA_ANALYSIS",
  aliases: [
    "데이터 분석",
    "데이터 애널리스트",
    "Data Analyst",
    "Product Analyst",
    "Business Analyst",
    "Analytics",
    "데이터 인사이트",
    "데이터 기반 의사결정"
  ],
  families: [
    {
      id: "product_analytics",
      label: "프로덕트 분석",
      aliases: [
        "Product Analyst",
        "서비스 분석",
        "유저 행동 분석",
        "앱 분석",
        "웹 분석"
      ],
      strongSignals: [
        "퍼널 분석",
        "코호트 분석",
        "A/B 테스트 설계 및 해석",
        "유저 행동 로그 분석",
        "리텐션 분석",
        "기능 개선 인사이트 도출"
      ],
      mediumSignals: [
        "Amplitude, GA, Mixpanel 사용",
        "이벤트 트래킹 설계",
        "SQL 기반 로그 분석",
        "대시보드 구축"
      ],
      boundarySignals: [
        "실험 설계보다 리포팅 비중이 커짐",
        "비즈니스 KPI 보고 중심으로 이동",
        "데이터 파이프라인 설계 참여 증가"
      ],
      adjacentFamilies: ["business_analytics", "data_platform_analytics"],
      boundaryNote: "제품 개선을 위한 실험과 행동 분석 비중이 줄고 KPI 보고 중심이 되면 비즈니스 분석으로 이동하며, 데이터 구조 설계 참여가 늘어나면 데이터 플랫폼 성격으로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 행동과 제품 지표를 분석해 서비스 개선 인사이트를 도출하는 성격이 강합니다. 반면 KPI 보고 중심이 되거나 데이터 구조 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "business_analytics",
      label: "비즈니스 분석",
      aliases: [
        "Business Analyst",
        "사업 분석",
        "경영 데이터 분석",
        "매출 분석",
        "성과 분석"
      ],
      strongSignals: [
        "매출 및 비용 분석",
        "KPI 정의 및 모니터링",
        "사업 성과 리포트 작성",
        "의사결정 지원 분석",
        "부서별 지표 정리"
      ],
      mediumSignals: [
        "엑셀 기반 분석",
        "BI 툴 사용",
        "정기 리포팅",
        "데이터 요청 대응"
      ],
      boundarySignals: [
        "실험 설계 및 유저 행동 분석 증가",
        "데이터 모델링 및 파이프라인 설계 참여",
        "고급 통계 모델 활용 증가"
      ],
      adjacentFamilies: ["product_analytics", "advanced_analytics"],
      boundaryNote: "정기 리포팅 중심에서 벗어나 실험 설계와 유저 행동 분석 비중이 커지면 프로덕트 분석으로, 통계 모델 기반 분석이 늘어나면 고급 분석으로 이동합니다.",
      summaryTemplate: "이 직무는 사업 성과와 KPI를 중심으로 데이터를 해석하고 의사결정을 지원하는 성격이 강합니다. 반면 실험 기반 분석이나 고급 모델링 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "advanced_analytics",
      label: "고급 분석",
      aliases: [
        "Advanced Analytics",
        "통계 분석",
        "예측 분석",
        "데이터 사이언스 기초 분석",
        "모델링 기반 분석"
      ],
      strongSignals: [
        "회귀 분석",
        "예측 모델 구축",
        "통계적 검정 수행",
        "머신러닝 모델 활용",
        "변수 중요도 분석"
      ],
      mediumSignals: [
        "Python, R 사용",
        "scikit-learn 사용",
        "데이터 전처리 및 피처 엔지니어링",
        "모델 성능 평가"
      ],
      boundarySignals: [
        "모델 개발보다 리포팅 중심으로 이동",
        "엔지니어링 및 배포 책임 증가",
        "단순 지표 분석 비중 증가"
      ],
      adjacentFamilies: ["business_analytics", "data_platform_analytics"],
      boundaryNote: "통계 모델 기반 분석에서 벗어나 리포팅 중심으로 가면 비즈니스 분석으로, 모델 운영과 데이터 파이프라인 책임이 커지면 데이터 플랫폼 성격으로 이동합니다.",
      summaryTemplate: "이 직무는 통계와 모델을 활용해 데이터를 설명하거나 예측하는 성격이 강합니다. 반면 단순 리포팅이나 시스템 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "data_platform_analytics",
      label: "데이터 플랫폼 분석",
      aliases: [
        "Analytics Engineer",
        "데이터 모델링",
        "데이터 마트 설계",
        "BI 엔지니어",
        "데이터 구조 설계"
      ],
      strongSignals: [
        "데이터 모델링",
        "데이터 마트 설계",
        "ETL 설계 및 관리",
        "지표 정의 체계 구축",
        "데이터 품질 관리"
      ],
      mediumSignals: [
        "dbt 사용",
        "데이터 웨어하우스 설계",
        "BI 툴 연동",
        "SQL 최적화"
      ],
      boundarySignals: [
        "인사이트 도출 및 분석 비중 증가",
        "모델링보다 리포팅 중심으로 이동",
        "엔지니어링 코드 및 배포 비중 증가"
      ],
      adjacentFamilies: ["product_analytics", "advanced_analytics"],
      boundaryNote: "데이터 구조 설계에서 벗어나 인사이트 도출 비중이 커지면 프로덕트/비즈니스 분석으로, 코드 기반 시스템 개발이 늘어나면 데이터 엔지니어링으로 이동합니다.",
      summaryTemplate: "이 직무는 분석을 위한 데이터 구조와 지표 체계를 설계하는 성격이 강합니다. 반면 직접적인 인사이트 도출이나 시스템 개발 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "product_analyst",
      label: "프로덕트 애널리스트",
      aliases: ["Product Analyst", "서비스 분석가"],
      family: "product_analytics",
      responsibilityHints: [
        "유저 행동 데이터 분석",
        "제품 개선 인사이트 도출",
        "실험 설계 및 결과 해석"
      ],
      levelHints: [
        "주니어는 데이터 추출 및 리포트 중심",
        "시니어는 실험 설계 및 제품 전략 기여"
      ]
    },
    {
      id: "business_analyst",
      label: "비즈니스 애널리스트",
      aliases: ["Business Analyst", "사업 분석가"],
      family: "business_analytics",
      responsibilityHints: [
        "KPI 관리 및 리포팅",
        "사업 성과 분석",
        "의사결정 지원"
      ],
      levelHints: [
        "주니어는 데이터 정리 및 리포트 작성",
        "시니어는 KPI 설계 및 전략 분석"
      ]
    },
    {
      id: "data_analyst_advanced",
      label: "고급 데이터 분석가",
      aliases: ["Advanced Analyst", "Statistical Analyst"],
      family: "advanced_analytics",
      responsibilityHints: [
        "통계 분석 및 모델링",
        "예측 모델 개발",
        "데이터 기반 가설 검증"
      ],
      levelHints: [
        "주니어는 모델 적용 및 분석",
        "시니어는 모델 설계 및 문제 정의"
      ]
    },
    {
      id: "analytics_engineer",
      label: "애널리틱스 엔지니어",
      aliases: ["Analytics Engineer", "BI Engineer"],
      family: "data_platform_analytics",
      responsibilityHints: [
        "데이터 모델링 및 마트 설계",
        "지표 정의 체계 구축",
        "데이터 파이프라인 관리"
      ],
      levelHints: [
        "주니어는 SQL 기반 데이터 가공",
        "시니어는 데이터 구조 설계 및 표준화"
      ]
    }
  ],
  axes: [
    {
      axisId: "analysis_vs_modeling",
      label: "분석 vs 모델링",
      values: ["리포트/해석 중심", "통계/모델 중심"]
    },
    {
      axisId: "product_vs_business",
      label: "제품 vs 사업 중심",
      values: ["유저/제품 중심", "매출/성과 중심"]
    },
    {
      axisId: "insight_vs_infrastructure",
      label: "인사이트 vs 데이터 구조",
      values: ["인사이트 도출", "데이터 구조 설계"]
    }
  ],
  adjacentFamilies: ["data_engineering", "machine_learning_engineering"],
  boundaryHints: [
    "데이터 파이프라인 구축과 시스템 개발 비중이 커지면 데이터 엔지니어링으로 이동합니다.",
    "모델 개발과 운영, 배포 책임이 커지면 머신러닝 엔지니어링으로 이동합니다.",
    "단순 리포팅보다 실험 설계와 제품 개선 참여가 많아지면 프로덕트 분석으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 데이터를 해석하여 인사이트를 도출하고 의사결정을 지원하는 역할입니다. 분석 대상이 제품인지 사업인지, 그리고 모델링과 데이터 구조 설계 비중에 따라 세부 성격이 달라지며, 특정 영역의 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};