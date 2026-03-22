export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "KEY_ACCOUNT_MANAGEMENT",
  aliases: [
    "KAM",
    "Key Account Management",
    "Key Account Manager",
    "키어카운트 매니저",
    "핵심 고객 관리",
    "전략 고객 관리",
    "전략 계정 영업",
    "Strategic Account Manager",
    "Global Account Manager",
    "Enterprise Account Manager"
  ],
  families: [
    {
      id: "STRATEGIC_ACCOUNT_GROWTH",
      label: "전략 계정 성장형 KAM",
      aliases: [
        "전략 고객 성장",
        "계정 확장형 KAM",
        "strategic account growth",
        "account expansion KAM"
      ],
      strongSignals: [
        "소수 핵심 고객을 대상으로 장기 매출 성장 전략 수립",
        "고객 조직 내 여러 부서로 확장 기회를 발굴",
        "업셀, 크로스셀, 추가 계약을 통해 계정 매출을 지속적으로 확대",
        "고객별 중장기 계정 플랜과 로드맵 운영",
        "고객 내부 이해관계자 맵을 기반으로 확장 전략 실행",
        "단일 딜보다 지속적 매출 확대와 관계 유지가 핵심 성과",
        "고객 사업 방향과 연계된 제안 수행"
      ],
      mediumSignals: [
        "분기별 계정 리뷰",
        "고객 조직도 관리",
        "계약 갱신 및 추가 제안",
        "기존 고객 데이터 분석",
        "고객 피드백 기반 개선 제안"
      ],
      boundarySignals: [
        "신규 고객 발굴 비중이 커지면 B2B 영업으로 이동",
        "고객 운영 안정화와 사용 정착 비중이 커지면 CSM으로 이동",
        "단일 프로젝트 수주 중심으로 움직이면 제안영업 또는 프로젝트 영업으로 이동"
      ],
      adjacentFamilies: [
        "RELATIONSHIP_GOVERNANCE_KAM",
        "SOLUTION_DRIVEN_KAM",
        "GLOBAL_ACCOUNT_COORDINATION"
      ],
      boundaryNote: "기존 핵심 고객을 기반으로 매출을 확장하고 장기 성장 전략을 운영한다면 전략 계정 성장형 KAM으로 읽힙니다. 반면 신규 개척이나 운영 지원 중심으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 핵심 고객을 중심으로 장기 매출을 확장하고 계정 성장을 만들어내는 성격이 강합니다. 반면 신규 개척이나 고객 운영 안정화 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "RELATIONSHIP_GOVERNANCE_KAM",
      label: "관계·거버넌스 중심 KAM",
      aliases: [
        "관계형 KAM",
        "고객 거버넌스 관리",
        "relationship KAM",
        "governance account manager"
      ],
      strongSignals: [
        "고객 주요 의사결정자와 장기 관계 구축",
        "고객 내 다양한 이해관계자 간 조율 및 커뮤니케이션 관리",
        "정기 미팅, 리포트, 리뷰 체계를 통해 관계 유지",
        "고객 이슈 발생 시 내부 조직과 연결해 해결",
        "고객 신뢰 유지와 계약 지속성 확보가 핵심 역할",
        "계정 내 갈등이나 리스크 상황을 조정",
        "고객과 회사 간 커뮤니케이션 허브 역할 수행"
      ],
      mediumSignals: [
        "고객 만족도 관리",
        "정기 보고서 작성",
        "이슈 트래킹",
        "고객 요청사항 내부 전달",
        "장기 관계 유지 활동"
      ],
      boundarySignals: [
        "매출 확대와 업셀 비중이 커지면 전략 계정 성장형 KAM으로 이동",
        "고객 사용성과 운영 안정화 비중이 커지면 CSM으로 이동",
        "실질적 딜 클로징 책임이 커지면 솔루션영업 또는 B2B 영업으로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_ACCOUNT_GROWTH",
        "SOLUTION_DRIVEN_KAM",
        "GLOBAL_ACCOUNT_COORDINATION"
      ],
      boundaryNote: "고객과의 관계 유지와 내부외 커뮤니케이션 조율이 핵심이라면 관계·거버넌스 중심 KAM으로 읽힙니다. 반면 매출 확대나 기술 제안 중심으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 고객과의 장기 관계와 거버넌스를 유지하고 조율하는 성격이 강합니다. 반면 매출 확대나 기술 제안 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "SOLUTION_DRIVEN_KAM",
      label: "솔루션 확장형 KAM",
      aliases: [
        "솔루션 KAM",
        "solution driven KAM",
        "consultative KAM"
      ],
      strongSignals: [
        "기존 고객의 문제를 기반으로 추가 솔루션 제안",
        "고객 환경에 맞춘 맞춤형 솔루션 설계 및 확장",
        "제품 또는 서비스 활용 범위를 넓히는 제안 수행",
        "프리세일즈, 기술 조직과 협업해 고객 맞춤 제안 구성",
        "고객의 비즈니스 과제 해결과 연결된 확장 전략",
        "단순 관계 관리보다 솔루션 기반 매출 확대가 핵심",
        "고객 사용 데이터나 현황을 기반으로 추가 기회 도출"
      ],
      mediumSignals: [
        "고객 요구사항 분석",
        "솔루션 제안서 작성",
        "데모 및 설명 지원",
        "기술팀 협업",
        "활용 사례 공유"
      ],
      boundarySignals: [
        "신규 고객 발굴과 첫 계약 중심이면 솔루션영업으로 이동",
        "기술 검증과 데모 비중이 매우 크면 프리세일즈로 이동",
        "관계 유지와 커뮤니케이션 중심이면 관계형 KAM으로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_ACCOUNT_GROWTH",
        "RELATIONSHIP_GOVERNANCE_KAM",
        "GLOBAL_ACCOUNT_COORDINATION"
      ],
      boundaryNote: "기존 고객을 대상으로 솔루션 확장과 문제 해결 제안이 핵심이라면 솔루션 확장형 KAM으로 읽힙니다. 반면 신규 개척이나 관계 관리 중심으로 이동하면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 기존 고객의 문제를 기반으로 솔루션을 확장해 매출을 키우는 성격이 강합니다. 반면 신규 개척이나 관계 유지 중심으로 이동하면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "GLOBAL_ACCOUNT_COORDINATION",
      label: "글로벌 계정 조율형 KAM",
      aliases: [
        "글로벌 KAM",
        "글로벌 계정 매니저",
        "global account management",
        "international KAM"
      ],
      strongSignals: [
        "글로벌 고객사의 여러 국가 또는 지역 계정을 통합 관리",
        "국가별 조직과 협업해 일관된 대응 전략 유지",
        "글로벌 계약 조건과 정책 조율",
        "지역별 매출, 전략, 운영을 통합적으로 관리",
        "글로벌 고객과 본사 간 커뮤니케이션 허브 역할",
        "다국적 이해관계자 조율 및 전략 alignment 수행",
        "글로벌 단위의 확장 기회 발굴"
      ],
      mediumSignals: [
        "국가별 리포트 통합",
        "글로벌 미팅 운영",
        "다국적 팀 협업",
        "글로벌 계약 관리",
        "지역별 이슈 조율"
      ],
      boundarySignals: [
        "단일 국가 또는 계정 중심이면 전략 계정 성장형 KAM으로 이동",
        "실질적 매출 확대보다는 운영 조율 중심이면 관계형 KAM으로 이동",
        "해외 신규 개척 중심이면 해외영업으로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_ACCOUNT_GROWTH",
        "RELATIONSHIP_GOVERNANCE_KAM",
        "SOLUTION_DRIVEN_KAM"
      ],
      boundaryNote: "글로벌 고객을 대상으로 국가 간 전략과 운영을 조율하는 역할이면 글로벌 계정 조율형 KAM으로 읽힙니다. 반면 단일 계정 확장이나 관계 관리 중심이면 다른 family로 해석됩니다.",
      summaryTemplate: "이 직무는 글로벌 고객을 중심으로 국가 간 전략과 운영을 조율하는 성격이 강합니다. 반면 단일 계정 확장이나 관계 유지 중심이면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "KEY_ACCOUNT_MANAGER",
      label: "Key Account Manager",
      aliases: [
        "KAM",
        "Key Account Manager",
        "전략 고객 담당"
      ],
      family: "STRATEGIC_ACCOUNT_GROWTH",
      responsibilityHints: [
        "계정 전략 수립",
        "매출 확대",
        "고객 관계 관리",
        "확장 기회 발굴"
      ],
      levelHints: [
        "주니어는 계정 운영과 지원 비중이 큼",
        "시니어는 계정 전략과 매출 책임 비중이 큼"
      ]
    },
    {
      id: "ACCOUNT_RELATIONSHIP_MANAGER",
      label: "계정 관계 담당",
      aliases: [
        "relationship manager",
        "account relationship manager"
      ],
      family: "RELATIONSHIP_GOVERNANCE_KAM",
      responsibilityHints: [
        "고객 관계 유지",
        "이슈 조율",
        "커뮤니케이션 관리",
        "리포트 운영"
      ],
      levelHints: [
        "주니어는 커뮤니케이션 지원 비중이 큼",
        "시니어는 주요 관계와 리스크 관리 비중이 큼"
      ]
    },
    {
      id: "SOLUTION_ACCOUNT_MANAGER",
      label: "솔루션 기반 계정 담당",
      aliases: [
        "solution account manager",
        "consultative account manager"
      ],
      family: "SOLUTION_DRIVEN_KAM",
      responsibilityHints: [
        "솔루션 확장 제안",
        "고객 문제 해결",
        "기술 협업",
        "추가 매출 창출"
      ],
      levelHints: [
        "주니어는 요구사항 분석과 지원 비중이 큼",
        "시니어는 솔루션 전략과 고객 설득 비중이 큼"
      ]
    },
    {
      id: "GLOBAL_ACCOUNT_MANAGER",
      label: "글로벌 계정 담당",
      aliases: [
        "global account manager",
        "GAM"
      ],
      family: "GLOBAL_ACCOUNT_COORDINATION",
      responsibilityHints: [
        "글로벌 계정 전략",
        "국가 간 조율",
        "계약 및 정책 관리",
        "글로벌 관계 관리"
      ],
      levelHints: [
        "주니어는 리포트와 협업 지원 비중이 큼",
        "시니어는 글로벌 전략과 주요 의사결정 조율 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "ACCOUNT_SCOPE",
      label: "계정 범위",
      values: [
        "단일 핵심 고객",
        "다수 이해관계자 관계",
        "솔루션 중심 확장",
        "글로벌 다국가 계정"
      ]
    },
    {
      axisId: "VALUE_CREATION",
      label: "가치 창출 방식",
      values: [
        "매출 확장",
        "관계 유지와 신뢰",
        "문제 해결과 솔루션 확장",
        "글로벌 전략 정렬"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "계정 성장 전략",
        "커뮤니케이션과 조율",
        "솔루션 제안",
        "국가 간 협업과 통합"
      ]
    },
    {
      axisId: "SALES_INVOLVEMENT",
      label: "영업 개입 수준",
      values: [
        "직접 매출 책임",
        "관계 중심 간접 영향",
        "제안 기반 매출 확대",
        "글로벌 전략 중심 조율"
      ]
    }
  ],
  adjacentFamilies: [
    "B2B 영업",
    "솔루션영업",
    "해외영업",
    "고객성공(CSM)",
    "사업개발(BD)",
    "제안영업",
    "영업지원"
  ],
  boundaryHints: [
    "핵심 고객 매출을 직접 확대하는 비중이 커지면 전략 계정 성장형 KAM으로 읽힙니다.",
    "고객 관계 유지와 커뮤니케이션 조율 비중이 커지면 관계·거버넌스 중심 KAM으로 이동합니다.",
    "고객 문제 해결과 솔루션 제안 비중이 커지면 솔루션 확장형 KAM으로 이동합니다.",
    "다국가 계정과 글로벌 조직 조율 비중이 커지면 글로벌 계정 조율형 KAM으로 이동합니다.",
    "신규 고객 발굴 비중이 커지면 일반 B2B 영업으로 이동합니다.",
    "고객 사용 정착과 운영 안정화 비중이 커지면 고객성공(CSM)으로 이동합니다.",
    "기술 검증이나 제품 설명 중심이면 기술영업 또는 프리세일즈로 이동합니다."
  ],
  summaryTemplate: "이 직무는 핵심 고객을 중심으로 장기 관계를 유지하고 매출을 확장하는 KAM 성격이 강합니다. 다만 역할은 계정 성장, 관계 관리, 솔루션 확장, 글로벌 조율로 나뉘며 작동 방식이 달라집니다. 반면 신규 개척이나 운영 지원 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
