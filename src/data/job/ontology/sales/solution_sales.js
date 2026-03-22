export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "SOLUTION_SALES",
  aliases: [
    "솔루션영업",
    "솔루션 영업",
    "솔루션 세일즈",
    "기업 솔루션 영업",
    "컨설팅형 영업",
    "solution sales",
    "solution selling",
    "enterprise solution sales",
    "consultative sales",
    "account executive",
    "AE",
    "solution consultant"
  ],
  families: [
    {
      id: "CONSULTATIVE_DISCOVERY_SOLUTION_SALES",
      label: "컨설팅형 발굴·제안 영업",
      aliases: [
        "컨설팅형 영업",
        "문제 해결형 영업",
        "consultative sales",
        "discovery sales",
        "problem-solving sales"
      ],
      strongSignals: [
        "고객의 현재 업무 방식과 문제를 진단한 뒤 제안 방향을 설계",
        "단순 제품 설명보다 고객 과제 정의와 우선순위 정리에 시간을 많이 씀",
        "고객 조직의 Pain Point를 구조화해 제안 논리로 연결",
        "현황 인터뷰, 요구사항 탐색, 도입 목적 정리를 직접 수행",
        "고객별 과제에 맞춰 제안 포인트를 달리 설계",
        "기능 나열보다 운영 개선, 비용 절감, 생산성 향상 같은 효과를 중심으로 설득",
        "초기 미팅부터 도입 필요성 자체를 만들어가는 역할을 수행"
      ],
      mediumSignals: [
        "고객 업무 프로세스 질문지 운영",
        "발견된 과제를 내부 프리세일즈나 제품팀에 전달",
        "고객 맞춤형 제안 흐름 작성",
        "문제 정의 기반 제안서 초안 작성",
        "도입 기대효과 정리"
      ],
      boundarySignals: [
        "기술 검증, 데모, 아키텍처 설명 비중이 커지면 프리세일즈 연계 솔루션영업으로 이동",
        "입찰 문서, 제안 요청서 대응, 수주형 프로젝트 범위 조정 비중이 커지면 프로젝트·입찰형 솔루션영업으로 이동",
        "고객 과제 정의보다 신규 계정 발굴과 파이프라인 확보 비중이 커지면 B2B 영업으로 이동"
      ],
      adjacentFamilies: [
        "PRESALES_LINKED_SOLUTION_SALES",
        "PROJECT_BID_SOLUTION_SALES",
        "EXPANSION_ACCOUNT_SOLUTION_SALES"
      ],
      boundaryNote: "고객이 아직 문제를 명확히 정의하지 못한 상태에서 과제를 발견하고 제안 방향을 잡아주는 역할이면 컨설팅형 발굴·제안 영업으로 읽힙니다. 반면 기술 검증이나 입찰 대응, 계정 확장 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객의 문제를 먼저 구조화하고 그에 맞는 해결 방향을 설계해 구매 필요성을 만드는 성격이 강합니다. 반면 기술 검증이나 입찰 대응 비중이 커지면 다른 솔루션영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "PRESALES_LINKED_SOLUTION_SALES",
      label: "프리세일즈 연계 솔루션영업",
      aliases: [
        "프리세일즈 연계 영업",
        "세일즈 엔지니어 연계 영업",
        "pre-sales linked solution sales",
        "demo driven sales",
        "technical consultative sales"
      ],
      strongSignals: [
        "고객 요구사항을 바탕으로 데모, POC, 검증 과정을 영업과 함께 설계",
        "영업 본인이 기술 설명과 비즈니스 설득을 함께 수행하거나 프리세일즈를 리딩",
        "도입 구조, 기능 조합, 운영 시나리오를 고객 환경에 맞춰 제안",
        "고객의 기술적 반대 포인트를 해소하면서 구매 결정을 진전시킴",
        "제품 기능보다 고객 환경 내 활용 방식과 도입 효과를 연결해 설명",
        "프리세일즈, 제품, 구축 조직과 함께 제안 구조를 조율",
        "기술 장벽을 넘겨 실제 구매 검토 단계까지 밀어붙이는 역할이 분명함"
      ],
      mediumSignals: [
        "데모 시나리오 기획",
        "POC 범위와 성공 기준 정리",
        "기술 질의와 비즈니스 질의를 함께 대응",
        "제안 발표 동행",
        "도입 전 검증 결과 정리"
      ],
      boundarySignals: [
        "기술 검증보다 문제 발견과 초기 설득 비중이 크면 컨설팅형 발굴·제안 영업으로 이동",
        "수주 이후 구축 범위 조율과 프로젝트 관리 비중이 커지면 프로젝트·입찰형 솔루션영업 또는 PM으로 이동",
        "기술 설명 중심이고 매출 클로징 책임이 약하면 기술영업 또는 프리세일즈로 이동"
      ],
      adjacentFamilies: [
        "CONSULTATIVE_DISCOVERY_SOLUTION_SALES",
        "PROJECT_BID_SOLUTION_SALES",
        "EXPANSION_ACCOUNT_SOLUTION_SALES"
      ],
      boundaryNote: "고객의 구매 의사결정을 앞당기기 위해 데모, POC, 기술 검증을 영업 과정에 강하게 결합하면 프리세일즈 연계 솔루션영업으로 읽힙니다. 반면 매출 책임이 약하거나 구축 실행 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객 환경에 맞는 데모와 기술 검증을 통해 구매 확신을 만드는 성격이 강합니다. 반면 순수 기술 설명이나 구축 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PROJECT_BID_SOLUTION_SALES",
      label: "프로젝트·입찰형 솔루션영업",
      aliases: [
        "프로젝트 솔루션영업",
        "입찰형 솔루션영업",
        "제안영업형 솔루션영업",
        "project solution sales",
        "bid solution sales",
        "proposal solution sales"
      ],
      strongSignals: [
        "RFP, RFQ, 제안요청서 기반으로 솔루션 제안 구조를 설계",
        "프로젝트 범위, 산출물, 구축 일정, 가격 조건을 묶어서 제안",
        "고객, 발주처, 파트너, 내부 구축조직을 함께 조율하며 수주를 추진",
        "제안서 작성, 제안 발표, 질의응답 대응 비중이 큼",
        "입찰 요건과 고객 요구조건을 해석해 제안 범위를 정리",
        "수주 가능성과 실행 가능성을 동시에 검토하며 딜을 진행",
        "단일 제품 판매보다 복합 솔루션과 프로젝트 수주가 핵심"
      ],
      mediumSignals: [
        "제안 일정과 마감 관리",
        "가격·범위·리스크 조율",
        "컨소시엄 또는 협력사와 공동 제안",
        "고객 평가 기준 분석",
        "프로젝트 전환 시 인수인계 정리"
      ],
      boundarySignals: [
        "입찰보다 데모와 도입 시나리오 설계 비중이 크면 프리세일즈 연계 솔루션영업으로 이동",
        "프로젝트 수주 이후 실행 관리까지 깊게 맡으면 PM 또는 프로젝트관리로 이동",
        "장기 고객의 추가 도입과 확장 비중이 커지면 계정 확장형 솔루션영업으로 이동"
      ],
      adjacentFamilies: [
        "PRESALES_LINKED_SOLUTION_SALES",
        "CONSULTATIVE_DISCOVERY_SOLUTION_SALES",
        "EXPANSION_ACCOUNT_SOLUTION_SALES"
      ],
      boundaryNote: "복합 솔루션을 프로젝트 단위로 제안하고 입찰·제안·수주 과정을 리딩하면 프로젝트·입찰형 솔루션영업으로 읽힙니다. 반면 수주 이후 실행관리나 장기 계정 확장 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 복합 솔루션을 프로젝트 단위로 제안하고 수주를 만들어내는 성격이 강합니다. 반면 구축 실행이나 기존 고객 확장 비중이 커지면 다른 솔루션영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "EXPANSION_ACCOUNT_SOLUTION_SALES",
      label: "계정 확장형 솔루션영업",
      aliases: [
        "계정 확장 영업",
        "업셀형 솔루션영업",
        "existing account solution sales",
        "expansion sales",
        "upsell solution sales"
      ],
      strongSignals: [
        "기존 고객사 내 추가 부서, 추가 기능, 추가 솔루션 도입을 확장",
        "고객 사용 현황과 운영 이슈를 바탕으로 다음 제안을 설계",
        "재계약, 증설, 업셀, 크로스셀을 통해 매출을 키움",
        "기존 도입 솔루션의 활용 수준을 점검하고 확장 기회를 찾음",
        "고객사 내 여러 이해관계자를 설득해 적용 범위를 넓힘",
        "장기 계정 계획과 단계별 확장 로드맵을 운영",
        "초기 신규 발굴보다 고객 침투와 계정 성장 책임이 큼"
      ],
      mediumSignals: [
        "분기별 계정 리뷰",
        "고객 조직도와 의사결정 구조 관리",
        "추가 제안서 작성",
        "계약 갱신 일정 관리",
        "도입 효과 리포트 기반 후속 제안"
      ],
      boundarySignals: [
        "신규 계정 발굴과 첫 계약 비중이 커지면 B2B 영업 또는 컨설팅형 발굴·제안 영업으로 이동",
        "고객 성공과 운영 안정화 책임이 핵심이 되면 CSM으로 이동",
        "전략 계정 하나를 장기적으로 복합 이해관계자 구조로 관리하는 책임이 매우 커지면 KAM 성격으로 이동"
      ],
      adjacentFamilies: [
        "CONSULTATIVE_DISCOVERY_SOLUTION_SALES",
        "PRESALES_LINKED_SOLUTION_SALES",
        "PROJECT_BID_SOLUTION_SALES"
      ],
      boundaryNote: "기존 고객 기반 위에서 솔루션 도입 범위를 넓히고 추가 매출을 만드는 책임이 중심이면 계정 확장형 솔루션영업으로 읽힙니다. 반면 신규 개척이나 고객 성공 운영이 중심이 되면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 이미 도입한 고객을 기반으로 추가 솔루션과 확장 매출을 만드는 성격이 강합니다. 반면 신규 개척이나 고객 성공 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "SOLUTION_ACCOUNT_EXECUTIVE",
      label: "솔루션 영업 담당",
      aliases: [
        "솔루션 영업 담당",
        "solution account executive",
        "solution sales executive"
      ],
      family: "CONSULTATIVE_DISCOVERY_SOLUTION_SALES",
      responsibilityHints: [
        "고객 과제 발굴",
        "문제 정의 기반 제안",
        "초기 미팅과 설득",
        "딜 방향 설계"
      ],
      levelHints: [
        "주니어는 고객 니즈 파악과 제안 준비 비중이 큼",
        "시니어는 문제 구조화와 주요 딜 방향 설정 비중이 큼"
      ]
    },
    {
      id: "SOLUTION_CONSULTANT_SALES",
      label: "프리세일즈 연계 영업 담당",
      aliases: [
        "solution consultant",
        "pre-sales linked AE",
        "솔루션 컨설턴트"
      ],
      family: "PRESALES_LINKED_SOLUTION_SALES",
      responsibilityHints: [
        "데모와 POC 설계",
        "고객 환경 기반 제안",
        "기술·비즈니스 설득",
        "프리세일즈 협업 리딩"
      ],
      levelHints: [
        "주니어는 데모 지원과 요구사항 정리 비중이 큼",
        "시니어는 복잡한 고객 환경 설계와 클로징 지원 비중이 큼"
      ]
    },
    {
      id: "PROJECT_SOLUTION_SALES_MANAGER",
      label: "프로젝트 솔루션영업 담당",
      aliases: [
        "project solution sales manager",
        "입찰 영업 담당",
        "제안영업 담당"
      ],
      family: "PROJECT_BID_SOLUTION_SALES",
      responsibilityHints: [
        "RFP 기반 제안",
        "범위·가격·일정 조율",
        "제안 발표와 질의 대응",
        "수주 전략 관리"
      ],
      levelHints: [
        "주니어는 제안 자료와 일정 관리 비중이 큼",
        "시니어는 수주 전략과 복합 이해관계자 조율 비중이 큼"
      ]
    },
    {
      id: "EXPANSION_ACCOUNT_MANAGER",
      label: "솔루션 계정 확장 담당",
      aliases: [
        "expansion account manager",
        "upsell manager",
        "계정 확장 담당"
      ],
      family: "EXPANSION_ACCOUNT_SOLUTION_SALES",
      responsibilityHints: [
        "기존 고객 확장",
        "업셀·크로스셀 제안",
        "계정 리뷰와 후속 제안",
        "장기 고객 관계 관리"
      ],
      levelHints: [
        "주니어는 계정 운영과 후속 대응 비중이 큼",
        "시니어는 계정 전략과 추가 도입 설계 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PROBLEM_DEFINITION_DEPTH",
      label: "문제 정의 깊이",
      values: [
        "고객 과제 발굴 중심",
        "기술 검증과 도입 시나리오 중심",
        "제안 범위와 수주 조건 중심",
        "기존 고객 확장 기회 중심"
      ]
    },
    {
      axisId: "SALES_MOTION",
      label: "주요 영업 방식",
      values: [
        "컨설팅형 발견과 설득",
        "데모·POC 기반 검증",
        "입찰·제안·프로젝트 수주",
        "업셀·크로스셀·재계약 확장"
      ]
    },
    {
      axisId: "STAKEHOLDER_COMPLEXITY",
      label: "이해관계자 구조",
      values: [
        "초기 문제 인식 단계 고객",
        "기술 검토 조직과 현업 조직",
        "발주처·파트너·구축조직의 다자 구조",
        "기존 고객 내 다부서 확장 구조"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "과제 구조화와 제안 방향 설정",
        "도입 구조와 검증 설계",
        "범위·가격·일정·수주 조율",
        "확장 매출과 계정 성장 관리"
      ]
    }
  ],
  adjacentFamilies: [
    "B2B 영업",
    "기술영업",
    "제안영업",
    "프로젝트관리(PM)",
    "Key Account Management(KAM)",
    "고객성공(CSM)",
    "신사업/사업개발(BD)"
  ],
  boundaryHints: [
    "고객의 문제를 발견하고 해결 방향을 설계하는 비중이 많아지면 컨설팅형 발굴·제안 영업으로 읽힙니다.",
    "데모, POC, 기술 검증을 통해 구매 확신을 만드는 비중이 커지면 프리세일즈 연계 솔루션영업으로 이동합니다.",
    "RFP, 제안서, 입찰, 프로젝트 수주 비중이 커지면 프로젝트·입찰형 솔루션영업으로 이동합니다.",
    "기존 고객의 추가 도입과 확장 매출 비중이 커지면 계정 확장형 솔루션영업으로 이동합니다.",
    "기술 설명과 사양 적합성 대응이 중심이고 매출 클로징 책임이 약해지면 기술영업 경계로 이동합니다.",
    "수주 이후 구축 일정과 실행 책임이 커지면 프로젝트관리(PM) 경계로 이동합니다.",
    "도입 후 고객 활용 정착과 운영 안정화 책임이 커지면 고객성공(CSM) 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 고객의 문제를 해결하는 방식으로 솔루션을 제안하고 매출로 연결하는 솔루션영업 성격이 강합니다. 다만 실제 역할은 컨설팅형 발견, 프리세일즈 연계, 프로젝트 수주형, 계정 확장형으로 나뉘며 작동 방식이 달라집니다. 반면 순수 기술 설명, 구축 실행, 고객 운영 정착 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
