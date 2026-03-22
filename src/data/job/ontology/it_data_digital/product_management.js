export const JOB_ONTOLOGY_ITEM = {
  majorCategory: "IT_DATA_DIGITAL",
  subcategory: "PRODUCT_MANAGEMENT",
  id: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT",
  label: "프로덕트 매니지먼트",
  aliases: [
    "PM",
    "PO",
    "프로덕트 매니저",
    "프로덕트 오너",
    "product manager",
    "product owner",
    "product management",
    "프로덕트 매니지먼트",
    "제품 기획",
    "프로덕트팀",
    "CPO",
    "product team lead",
    "프로덕트 리드"
  ],
  families: [
    {
      id: "DISCOVERY_STRATEGY_PM",
      label: "전략·디스커버리 중심 PM",
      aliases: [
        "전략 PM",
        "product strategy",
        "프로덕트 전략",
        "discovery PM"
      ],
      strongSignals: [
        "사용자 리서치와 문제 정의를 통해 무엇을 만들지 방향을 결정",
        "제품 비전, 전략, 로드맵을 수립하고 C-level 또는 이해관계자와 조율",
        "시장 분석, 경쟁사 분석을 통한 제품 포지셔닝 설계",
        "OKR 또는 KPI 기반 제품 목표 설정과 우선순위 결정",
        "가설 기반 MVP 설계와 제품 방향 검증",
        "사업 목표와 제품 기능을 연결하는 로드맵 설계",
        "B2B 또는 B2C 제품의 GTM 전략 수립 참여"
      ],
      mediumSignals: [
        "유저 인터뷰와 리서치 주도",
        "제품 전략 문서 작성",
        "임원 보고용 프로덕트 리뷰 주도",
        "경쟁사 분석 리포트 작성"
      ],
      boundarySignals: [
        "기능 요구사항과 스펙 작성 비중이 커지면 실행형 PM으로 이동",
        "서비스 UI/UX 설계 비중이 커지면 서비스기획(it_planning)으로 이동",
        "제품 방향보다 C-level 의사결정 지원과 중장기 사업 전략이 중심이면 전략기획(strategy)으로 이동"
      ],
      adjacentFamilies: [
        "EXECUTION_DELIVERY_PM",
        "DATA_DRIVEN_PM"
      ],
      boundaryNote: "제품의 방향과 목표 설정, 로드맵 전략 수립이 중심이면 전략·디스커버리 중심 PM으로 읽힙니다. 반면 기능 명세 작성이나 UI 설계 비중이 커지면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 제품의 방향성과 전략을 설정하고 이해관계자와 정렬하는 성격이 강합니다."
    },
    {
      id: "EXECUTION_DELIVERY_PM",
      label: "실행·딜리버리 중심 PM",
      aliases: [
        "실행 PM",
        "delivery PM",
        "프로덕트 딜리버리",
        "feature PM"
      ],
      strongSignals: [
        "기능 요구사항을 명세로 구체화하고 개발팀과 함께 구현",
        "스프린트 계획, 백로그 관리, 릴리즈 일정 조율",
        "디자인-개발-QA 협업을 주도하며 기능 완성도 관리",
        "사용자 피드백 기반 개선을 반복 수행",
        "기술 제약과 비즈니스 요구사항 사이에서 우선순위 조율",
        "베타 출시, A/B 테스트 계획 수립과 결과 반영"
      ],
      mediumSignals: [
        "스펙 문서 작성",
        "일정 관리와 이슈 트래킹",
        "QA 기준 정의와 검수 참여",
        "제품 데모와 릴리즈 노트 작성"
      ],
      boundarySignals: [
        "기능 설계보다 제품 방향 설정과 로드맵 전략 비중이 커지면 전략형 PM으로 이동",
        "기능 명세보다 화면 설계와 IA 중심이면 서비스기획(it_planning)으로 이동",
        "일정 관리보다 리스크 관리와 이해관계자 조율이 중심이면 프로젝트 매니저(project_management)로 이동"
      ],
      adjacentFamilies: [
        "DISCOVERY_STRATEGY_PM",
        "DATA_DRIVEN_PM"
      ],
      boundaryNote: "기능 요구사항 구체화와 개발팀 딜리버리가 중심이면 실행형 PM으로 읽힙니다. 반면 제품 방향 설계나 데이터 중심 운영이면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 기능 명세와 개발팀 협업을 통해 제품을 구체적으로 만들어내는 성격이 강합니다."
    },
    {
      id: "DATA_DRIVEN_PM",
      label: "데이터 기반 프로덕트 오너",
      aliases: [
        "데이터 기반 PM",
        "data-driven PM",
        "growth PM"
      ],
      strongSignals: [
        "제품 지표(MAU, 리텐션, 전환율 등)를 직접 설계하고 추적",
        "데이터 분석 기반으로 기능 우선순위를 결정",
        "A/B 테스트 설계, 결과 해석, 제품 반영",
        "코호트 분석과 퍼널 데이터를 통한 UX 개선",
        "SQL 또는 BI 도구를 직접 활용한 분석",
        "데이터 기반 실험 문화 정착과 팀 기여"
      ],
      mediumSignals: [
        "지표 대시보드 설계",
        "실험 결과 리포트 작성",
        "이벤트 트래킹 정의",
        "데이터 분석 협업"
      ],
      boundarySignals: [
        "데이터 분석 비중이 커지고 기능 결정 참여가 적으면 데이터 분석(data_analysis) 직무로 이동",
        "실험보다 기능 구현 딜리버리 비중이 커지면 실행형 PM으로 이동"
      ],
      adjacentFamilies: [
        "DISCOVERY_STRATEGY_PM",
        "EXECUTION_DELIVERY_PM"
      ],
      boundaryNote: "데이터와 실험으로 제품 방향을 판단하는 역할이 중심이면 데이터 기반 PM으로 읽힙니다. 반면 분석 자체가 주 업무이거나 개발 딜리버리 중심이면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 데이터와 실험을 기반으로 제품 방향을 검증하고 의사결정하는 성격이 강합니다."
    }
  ],
  roles: [
    {
      id: "PRODUCT_MANAGER",
      label: "프로덕트 매니저",
      aliases: ["프로덕트 매니저", "product manager", "PM"],
      family: "DISCOVERY_STRATEGY_PM",
      responsibilityHints: [
        "제품 전략 수립",
        "로드맵 설계",
        "이해관계자 조율",
        "성과 지표 관리"
      ],
      levelHints: [
        "주니어는 기능 스펙 작성과 딜리버리 참여 비중이 큼",
        "시니어는 전략 수립, 우선순위 결정, C-level 커뮤니케이션 비중이 큼"
      ]
    },
    {
      id: "PRODUCT_OWNER",
      label: "프로덕트 오너",
      aliases: ["프로덕트 오너", "product owner", "PO"],
      family: "EXECUTION_DELIVERY_PM",
      responsibilityHints: [
        "백로그 관리",
        "기능 명세 작성",
        "스프린트 계획",
        "개발팀 협업"
      ],
      levelHints: [
        "주니어는 스펙 문서 작성과 이슈 트래킹 비중이 큼",
        "시니어는 딜리버리 전략 설계와 우선순위 결정 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRODUCT_ORIENTATION",
      label: "프로덕트 관점",
      values: ["전략·방향 설정", "딜리버리·실행", "데이터·실험"]
    },
    {
      axisId: "COLLABORATION_MODE",
      label: "협업 방식",
      values: ["C-level / 이해관계자 정렬", "개발·디자인·QA 팀 협업", "데이터·마케팅 협업"]
    }
  ],
  adjacentFamilies: [
    "서비스기획(it_planning)",
    "프로젝트 매니저(project_management)",
    "전략기획(strategy)",
    "데이터 분석(data_analysis)",
    "프로덕트 마케팅(product_marketing_pmm)"
  ],
  boundaryHints: [
    "화면 설계, IA, 스토리보드 중심이면 서비스기획(it_planning)으로 이동합니다.",
    "일정 관리, 리스크 관리, 이해관계자 조율이 중심이면 프로젝트 매니저(project_management)로 이동합니다.",
    "제품 방향보다 중장기 사업 전략과 C-level 의사결정 지원이 중심이면 전략기획(strategy)으로 이동합니다.",
    "데이터 분석과 인사이트 도출이 중심이면 데이터 분석(data_analysis)으로 이동합니다.",
    "제품 포지셔닝, 런칭 전략, GTM이 중심이면 프로덕트 마케팅(product_marketing_pmm)으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 제품의 방향 설정, 딜리버리 실행, 데이터 기반 개선을 담당하며, 실제 역할은 전략·디스커버리 중심과 실행·딜리버리 중심, 데이터 기반으로 나뉩니다. 서비스기획이나 프로젝트 매니저와 혼동되기 쉬우나 제품 성과 오너십 여부가 핵심 구분 기준입니다."
};
