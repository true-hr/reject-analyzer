export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "PROPOSAL_SALES",
  aliases: [
    "제안영업",
    "제안 영업",
    "입찰영업",
    "프로젝트 제안 영업",
    "RFP 영업",
    "proposal sales",
    "bid sales",
    "tender sales",
    "RFP sales",
    "proposal manager",
    "bid manager"
  ],
  families: [
    {
      id: "RFP_RESPONSE_PROPOSAL_SALES",
      label: "RFP 대응형 제안영업",
      aliases: [
        "RFP 대응 영업",
        "입찰 대응 영업",
        "tender response sales",
        "RFP sales"
      ],
      strongSignals: [
        "RFP, RFQ, 제안요청서를 기반으로 요구사항 분석",
        "고객 요구사항을 항목별로 해석하고 대응 전략 수립",
        "제안서 목차 구성, 메시지 구조 설계",
        "기술, 가격, 납기 조건을 종합해 제안서 작성",
        "발주처 평가 기준에 맞춘 대응 논리 설계",
        "제안 발표 및 질의응답 준비와 실행",
        "입찰 일정과 제출 마감 관리"
      ],
      mediumSignals: [
        "제안서 템플릿 활용 및 커스터마이징",
        "내부 유관부서 자료 취합",
        "고객 질의 대응 정리",
        "제안 리뷰 및 수정 반복",
        "경쟁사 대비 포인트 정리"
      ],
      boundarySignals: [
        "고객 문제 정의와 초기 설득 비중이 커지면 솔루션영업으로 이동",
        "프로젝트 수주 이후 실행 관리 비중이 커지면 PM 또는 프로젝트관리로 이동",
        "문서 작성과 행정 대응 비중만 남으면 영업지원 또는 제안서 작성 전문 역할로 이동"
      ],
      adjacentFamilies: [
        "PROJECT_STRATEGIC_PROPOSAL_SALES",
        "TECHNICAL_PROPOSAL_SALES",
        "RELATIONSHIP_DRIVEN_PROPOSAL_SALES"
      ],
      boundaryNote: "제안요청서 기반으로 요구사항을 해석하고 문서와 발표를 통해 수주를 노리는 구조라면 RFP 대응형 제안영업으로 읽힙니다. 반면 초기 영업 설득이나 실행 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 RFP 기반 요구사항을 분석하고 제안서를 통해 수주를 만드는 성격이 강합니다. 반면 초기 영업 설득이나 프로젝트 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PROJECT_STRATEGIC_PROPOSAL_SALES",
      label: "전략 설계형 제안영업",
      aliases: [
        "전략 제안 영업",
        "proposal strategy sales",
        "bid strategy sales"
      ],
      strongSignals: [
        "단순 RFP 대응을 넘어서 수주 전략 자체를 설계",
        "고객 의사결정 구조와 평가 기준을 분석해 접근 전략 수립",
        "경쟁사 대비 차별화 포인트를 정의하고 메시지 설계",
        "제안 범위, 가격, 일정, 리스크를 통합적으로 조율",
        "내부 리소스와 외부 파트너를 조합해 최적 제안 구성",
        "수주 가능성을 높이기 위한 사전 영업 활동 일부 수행",
        "딜 전체를 관점에서 보고 제안 방향을 리딩"
      ],
      mediumSignals: [
        "Win strategy 문서 작성",
        "고객 이해관계자 맵핑",
        "제안 스토리라인 설계",
        "리스크 및 대응 전략 정리",
        "핵심 메시지 반복 정제"
      ],
      boundarySignals: [
        "문제 정의와 초기 기회 발굴 비중이 커지면 사업개발(BD) 또는 솔루션영업으로 이동",
        "기술 설계와 아키텍처 구성 비중이 커지면 기술영업 또는 프리세일즈로 이동",
        "문서 작성과 제출 대응 비중이 커지면 RFP 대응형 제안영업으로 이동"
      ],
      adjacentFamilies: [
        "RFP_RESPONSE_PROPOSAL_SALES",
        "TECHNICAL_PROPOSAL_SALES",
        "RELATIONSHIP_DRIVEN_PROPOSAL_SALES"
      ],
      boundaryNote: "단순 제안서 작성이 아니라 수주 전략, 메시지, 경쟁 구도를 설계하는 역할이 핵심이면 전략 설계형 제안영업으로 읽힙니다. 반면 기술 설계나 단순 문서 대응 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 제안서를 넘어 수주 전략과 메시지를 설계해 딜을 리딩하는 성격이 강합니다. 반면 기술 설계나 단순 문서 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "TECHNICAL_PROPOSAL_SALES",
      label: "기술 중심 제안영업",
      aliases: [
        "기술 제안 영업",
        "technical proposal sales",
        "solution proposal sales"
      ],
      strongSignals: [
        "고객 요구사항에 맞춘 기술 구성안 및 아키텍처 제안",
        "제품 또는 솔루션의 기술 적합성 설명",
        "기능 매핑, 시스템 구성도, 연동 구조 설계",
        "기술 질의 대응과 검증 논리 제시",
        "제안서 내 기술 파트 작성 비중이 큼",
        "프리세일즈 또는 엔지니어와 긴밀한 협업",
        "기술 신뢰 확보를 통해 수주 가능성 확보"
      ],
      mediumSignals: [
        "기술 문서 작성",
        "데모 시나리오 정리",
        "기술 비교표 작성",
        "성능, 보안, 확장성 설명",
        "고객 기술팀 대응"
      ],
      boundarySignals: [
        "기술 설명보다 가격, 범위, 일정 조율 비중이 커지면 RFP 대응형 제안영업으로 이동",
        "기술 검증과 데모 중심으로 전환되면 기술영업 또는 프리세일즈로 이동",
        "수주 전략과 경쟁 구도 설계 비중이 커지면 전략 설계형 제안영업으로 이동"
      ],
      adjacentFamilies: [
        "RFP_RESPONSE_PROPOSAL_SALES",
        "PROJECT_STRATEGIC_PROPOSAL_SALES",
        "RELATIONSHIP_DRIVEN_PROPOSAL_SALES"
      ],
      boundaryNote: "제안서 내에서 기술 구성과 적합성을 중심으로 설득하는 역할이면 기술 중심 제안영업으로 읽힙니다. 반면 전략 설계나 문서 대응 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 기술 구성과 적합성을 중심으로 제안을 설계하고 설득하는 성격이 강합니다. 반면 전략 설계나 문서 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "RELATIONSHIP_DRIVEN_PROPOSAL_SALES",
      label: "관계 기반 제안영업",
      aliases: [
        "관계형 제안 영업",
        "account driven proposal sales",
        "relationship sales with proposal"
      ],
      strongSignals: [
        "기존 고객 또는 사전 관계를 기반으로 제안 기회를 확보",
        "고객 내부 이해관계자와의 관계를 통해 제안 방향 사전 조율",
        "RFP 이전 단계에서 요구사항 형성에 관여",
        "제안 내용이 고객 내부 기대와 맞도록 사전 커뮤니케이션 수행",
        "경쟁사 대비 관계 기반 우위 확보",
        "계정 관리와 제안영업이 결합된 형태",
        "수주 가능성을 관계와 신뢰 기반으로 끌어올림"
      ],
      mediumSignals: [
        "고객 미팅과 사전 니즈 파악",
        "비공식 정보 수집",
        "의사결정자 네트워크 관리",
        "제안 방향 사전 공유",
        "고객 피드백 반영"
      ],
      boundarySignals: [
        "신규 고객 발굴 비중이 커지면 일반 B2B 영업으로 이동",
        "제안서 작성과 입찰 대응 비중이 커지면 RFP 대응형 제안영업으로 이동",
        "장기 계정 확장과 반복 매출 관리 비중이 커지면 KAM 또는 계정영업으로 이동"
      ],
      adjacentFamilies: [
        "RFP_RESPONSE_PROPOSAL_SALES",
        "PROJECT_STRATEGIC_PROPOSAL_SALES",
        "TECHNICAL_PROPOSAL_SALES"
      ],
      boundaryNote: "고객과의 관계를 통해 제안 기회를 만들고 방향을 사전 설계하는 역할이면 관계 기반 제안영업으로 읽힙니다. 반면 신규 개척이나 문서 중심 대응으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 고객과의 관계를 기반으로 제안 기회를 만들고 수주 가능성을 높이는 성격이 강합니다. 반면 신규 개척이나 문서 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PROPOSAL_MANAGER",
      label: "제안영업 담당",
      aliases: [
        "proposal manager",
        "bid manager",
        "제안 담당"
      ],
      family: "RFP_RESPONSE_PROPOSAL_SALES",
      responsibilityHints: [
        "RFP 분석",
        "제안서 작성",
        "입찰 일정 관리",
        "제안 발표 준비"
      ],
      levelHints: [
        "주니어는 문서 작성과 자료 취합 비중이 큼",
        "시니어는 제안 구조 설계와 발표 리딩 비중이 큼"
      ]
    },
    {
      id: "BID_STRATEGY_LEAD",
      label: "제안 전략 담당",
      aliases: [
        "bid strategy lead",
        "proposal strategist",
        "제안 전략 리드"
      ],
      family: "PROJECT_STRATEGIC_PROPOSAL_SALES",
      responsibilityHints: [
        "수주 전략 설계",
        "경쟁 분석",
        "메시지 구조 설계",
        "딜 방향 리딩"
      ],
      levelHints: [
        "주니어는 전략 보조와 분석 비중이 큼",
        "시니어는 전체 딜 전략과 의사결정 리딩 비중이 큼"
      ]
    },
    {
      id: "TECHNICAL_PROPOSAL_SPECIALIST",
      label: "기술 제안 담당",
      aliases: [
        "technical proposal specialist",
        "solution proposal engineer",
        "기술 제안 담당"
      ],
      family: "TECHNICAL_PROPOSAL_SALES",
      responsibilityHints: [
        "기술 구성안 설계",
        "기술 문서 작성",
        "기술 질의 대응",
        "프리세일즈 협업"
      ],
      levelHints: [
        "주니어는 기술 문서와 자료 작성 비중이 큼",
        "시니어는 아키텍처 설계와 고객 기술 설득 비중이 큼"
      ]
    },
    {
      id: "ACCOUNT_PROPOSAL_MANAGER",
      label: "관계 기반 제안 담당",
      aliases: [
        "account proposal manager",
        "relationship proposal sales",
        "계정 기반 제안 담당"
      ],
      family: "RELATIONSHIP_DRIVEN_PROPOSAL_SALES",
      responsibilityHints: [
        "고객 관계 관리",
        "사전 요구사항 형성",
        "제안 기회 확보",
        "내부 조율"
      ],
      levelHints: [
        "주니어는 고객 커뮤니케이션과 자료 정리 비중이 큼",
        "시니어는 계정 전략과 수주 가능성 확보 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PROPOSAL_ORIGIN",
      label: "제안 시작 지점",
      values: [
        "RFP 기반 대응",
        "전략 설계 기반 접근",
        "기술 적합성 중심",
        "관계 기반 사전 형성"
      ]
    },
    {
      axisId: "CORE_VALUE",
      label: "핵심 가치 창출 방식",
      values: [
        "요구사항 충족과 문서 완성도",
        "수주 전략과 메시지 설계",
        "기술 적합성과 신뢰 확보",
        "고객 관계와 사전 영향력"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "제안서 작성과 제출",
        "딜 전략과 방향 설정",
        "기술 구성과 설명",
        "고객 커뮤니케이션과 관계 구축"
      ]
    },
    {
      axisId: "STAKEHOLDER_CONTROL",
      label: "이해관계자 영향력",
      values: [
        "발주처 요구사항 대응 중심",
        "내부 전략 리딩 중심",
        "기술 조직과 협업 중심",
        "고객 내부 관계 영향 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "B2B 영업",
    "솔루션영업",
    "기술영업",
    "프로젝트관리(PM)",
    "사업개발(BD)",
    "Key Account Management(KAM)",
    "영업지원"
  ],
  boundaryHints: [
    "RFP 기반 문서 작성과 제출 대응 비중이 많아지면 RFP 대응형 제안영업으로 읽힙니다.",
    "수주 전략과 경쟁 구도 설계 비중이 커지면 전략 설계형 제안영업으로 이동합니다.",
    "기술 구성과 적합성 설명 비중이 커지면 기술 중심 제안영업으로 이동합니다.",
    "고객 관계와 사전 영향력 확보 비중이 커지면 관계 기반 제안영업으로 이동합니다.",
    "문제 정의와 초기 기회 발굴 비중이 커지면 솔루션영업 또는 사업개발로 이동합니다.",
    "수주 이후 일정·범위·리스크 관리 비중이 커지면 프로젝트관리(PM)로 이동합니다.",
    "단순 자료 취합과 문서 작성 중심으로 축소되면 영업지원 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 제안서를 중심으로 고객 요구사항을 해석하고 수주를 만들어내는 제안영업 성격이 강합니다. 다만 실제 역할은 RFP 대응형, 전략 설계형, 기술 중심형, 관계 기반형으로 나뉘며 작동 방식이 달라집니다. 반면 초기 영업 발굴, 기술 검증, 프로젝트 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
