export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "TECHNICAL_SALES",
  aliases: [
    "기술영업",
    "기술 영업",
    "엔지니어 영업",
    "기술 지원 영업",
    "테크니컬 세일즈",
    "technical sales",
    "technical sales engineer",
    "sales engineer",
    "application engineer sales",
    "pre-sales engineer"
  ],
  families: [
    {
      id: "SPEC_TECHNICAL_SALES",
      label: "사양·적합성 중심 기술영업",
      aliases: [
        "사양 영업",
        "기술 사양 영업",
        "spec sales",
        "application sales",
        "application engineer"
      ],
      strongSignals: [
        "고객 요구 사양에 맞는 제품 적합성 검토",
        "제품 스펙 비교와 기술 질의 대응",
        "도면, 성능표, 테스트 조건 기반 제안",
        "샘플, 평가품, 파일럿 적용 지원",
        "기술 검토 후 견적 또는 제안 조건 반영",
        "고객 엔지니어와 직접 기술 커뮤니케이션 수행",
        "기존 제품 포트폴리오 안에서 최적 사양 매칭"
      ],
      mediumSignals: [
        "제품 성능 자료 설명",
        "기술 문서 번역 또는 정리",
        "고객 요구사항 정리 후 내부 개발·생산 전달",
        "경쟁사 스펙 비교 자료 작성",
        "시험 결과와 적용 가능 범위 설명"
      ],
      boundarySignals: [
        "표준 제품 매칭보다 맞춤형 구축안 설계 비중이 커지면 솔루션영업으로 이동",
        "기술 설명보다 거래처 발굴과 가격 협상 비중이 커지면 일반 B2B 영업으로 이동",
        "기술 검토보다 사후 장애 대응과 유지보수 비중이 커지면 기술지원·필드엔지니어로 이동"
      ],
      adjacentFamilies: [
        "PROJECT_TECHNICAL_SALES",
        "PRESALES_SOLUTION_TECHNICAL_SALES",
        "CHANNEL_TECHNICAL_SALES"
      ],
      boundaryNote: "고객 요구조건을 읽고 기존 제품이나 기술의 적합성을 설명해 수주 가능성을 높이면 사양·적합성 중심 기술영업으로 읽힙니다. 반면 제안 구조 설계나 프로젝트 실행, 사후 지원 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객 요구 사양에 맞는 제품과 기술을 설명하고 적합성을 설득하는 성격이 강합니다. 반면 맞춤형 솔루션 설계나 프로젝트 실행 비중이 커지면 다른 기술영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "PROJECT_TECHNICAL_SALES",
      label: "프로젝트형 기술영업",
      aliases: [
        "프로젝트 기술영업",
        "수주형 기술영업",
        "project technical sales",
        "bid technical sales"
      ],
      strongSignals: [
        "프로젝트 단위 요구사항 분석과 기술 제안 수행",
        "입찰, RFQ, RFP 대응 과정에서 기술 조건 정리",
        "고객사·시공사·발주처와 기술 기준 협의",
        "프로젝트 일정, 납기, 적용 범위와 연계된 제안",
        "수주 전 단계에서 기술 리스크와 실행 가능성 검토",
        "견적, 사양, 납품 범위가 연결된 복합 제안 관리",
        "프로젝트별 이해관계자 다수와 기술 커뮤니케이션 수행"
      ],
      mediumSignals: [
        "제안서 내 기술 파트 작성",
        "현장 조건과 설치 환경 검토",
        "유관부서와 수주 가능성 검토 회의",
        "프로젝트 마일스톤 기준 대응",
        "기술 변경 요청과 범위 조정 협의"
      ],
      boundarySignals: [
        "프로젝트 수주 이후 실행 관리까지 깊게 맡으면 PM 또는 프로젝트 엔지니어링으로 이동",
        "고객 환경 전체를 재구성하는 솔루션 제안 비중이 커지면 솔루션영업으로 이동",
        "표준 제품 스펙 설명 중심이면 사양·적합성 중심 기술영업으로 이동"
      ],
      adjacentFamilies: [
        "SPEC_TECHNICAL_SALES",
        "PRESALES_SOLUTION_TECHNICAL_SALES",
        "CHANNEL_TECHNICAL_SALES"
      ],
      boundaryNote: "단일 제품 판매보다 프로젝트 단위로 사양, 일정, 적용 범위를 묶어 기술 제안을 만들면 프로젝트형 기술영업으로 읽힙니다. 반면 수주 후 실행관리나 구축 책임이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 프로젝트 단위의 기술 요구사항을 해석하고 수주 가능성이 높은 제안을 만드는 성격이 강합니다. 반면 수주 이후 실행관리나 구축 책임 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PRESALES_SOLUTION_TECHNICAL_SALES",
      label: "프리세일즈·솔루션 연계 기술영업",
      aliases: [
        "프리세일즈",
        "프리세일즈 엔지니어",
        "pre-sales",
        "pre sales engineer",
        "solution consultant sales"
      ],
      strongSignals: [
        "고객 환경 분석 후 도입 구조와 구성안 설계",
        "데모, POC, 기술 검증 시나리오 운영",
        "제품 조합 또는 시스템 구성안을 제안",
        "기술 설명과 비즈니스 효과를 함께 설득",
        "고객 질의에 대해 아키텍처 또는 운영 관점 답변",
        "세일즈와 동행해 기술 설득을 담당",
        "도입 전 기술 장벽을 낮추는 역할 수행"
      ],
      mediumSignals: [
        "제안 발표와 데모 진행",
        "POC 결과 정리와 후속 제안",
        "기술 FAQ 작성",
        "고객 사용 시나리오 설계",
        "세일즈와 역할 분담한 미팅 운영"
      ],
      boundarySignals: [
        "실제 계약과 매출 클로징 책임이 주가 되면 B2B 영업 또는 솔루션영업으로 이동",
        "도입 후 운영 안정화와 고객 성공 비중이 커지면 CSM 또는 기술지원으로 이동",
        "표준 스펙 대응만 주로 하면 사양·적합성 중심 기술영업으로 이동"
      ],
      adjacentFamilies: [
        "SPEC_TECHNICAL_SALES",
        "PROJECT_TECHNICAL_SALES",
        "CHANNEL_TECHNICAL_SALES"
      ],
      boundaryNote: "제품을 그냥 설명하는 수준을 넘어 고객 환경에 맞는 구성과 검증 시나리오를 설계하면 프리세일즈·솔루션 연계 기술영업으로 읽힙니다. 반면 매출 클로징이나 사후 운영 안정화가 중심이 되면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객 환경에 맞는 도입 구조를 설계하고 기술 검증을 통해 구매 확신을 만드는 성격이 강합니다. 반면 계약 클로징이나 도입 후 운영 책임 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "CHANNEL_TECHNICAL_SALES",
      label: "채널·파트너 기술영업",
      aliases: [
        "파트너 기술영업",
        "채널 기술영업",
        "distributor technical sales",
        "partner technical sales",
        "channel sales engineer"
      ],
      strongSignals: [
        "대리점, 총판, 파트너사를 대상으로 기술 교육과 제안 지원",
        "파트너 영업팀의 기술 질의 대응",
        "파트너 동행 미팅에서 기술 설득 수행",
        "채널향 제품 포트폴리오와 적용 사례 설명",
        "파트너사 제안서의 기술 정확성 검토",
        "리셀러가 고객에게 설명할 수 있도록 기술 자료 제공",
        "채널 확대와 기술 활성화가 함께 평가됨"
      ],
      mediumSignals: [
        "세일즈 킷과 기술 가이드 작성",
        "파트너 온보딩 교육",
        "채널향 데모 또는 세미나 운영",
        "파트너별 기술 이슈 정리",
        "공동 영업 기회 발굴 지원"
      ],
      boundarySignals: [
        "최종 고객을 직접 설득하는 비중이 커지면 사양·적합성 또는 프리세일즈형 기술영업으로 이동",
        "기술 지원보다 채널 계약과 매출 구조 관리 비중이 커지면 파트너영업 또는 채널영업으로 이동",
        "단순 사후 기술 문의 대응만 남으면 기술지원으로 이동"
      ],
      adjacentFamilies: [
        "SPEC_TECHNICAL_SALES",
        "PRESALES_SOLUTION_TECHNICAL_SALES",
        "PROJECT_TECHNICAL_SALES"
      ],
      boundaryNote: "최종 고객보다 파트너와 리셀러가 기술적으로 팔 수 있게 만드는 역할이면 채널·파트너 기술영업으로 읽힙니다. 반면 직접 고객 설득이나 계약 구조 관리가 중심이 되면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 파트너와 리셀러가 제품을 기술적으로 이해하고 판매할 수 있도록 지원하는 성격이 강합니다. 반면 최종 고객 직접 설득이나 채널 계약 관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "TECHNICAL_SALES_ENGINEER",
      label: "기술영업 엔지니어",
      aliases: [
        "기술영업 엔지니어",
        "sales engineer",
        "technical sales engineer"
      ],
      family: "SPEC_TECHNICAL_SALES",
      responsibilityHints: [
        "고객 요구사양 분석",
        "기술 적합성 설명",
        "스펙 비교와 질의 대응",
        "기술 검토 기반 수주 지원"
      ],
      levelHints: [
        "주니어는 제품 설명과 기술자료 대응 비중이 큼",
        "시니어는 고객 설득과 복잡한 사양 협의 비중이 큼"
      ]
    },
    {
      id: "PROJECT_TECHNICAL_SALES_MANAGER",
      label: "프로젝트 기술영업 담당",
      aliases: [
        "프로젝트 기술영업",
        "project technical sales manager",
        "bid engineer"
      ],
      family: "PROJECT_TECHNICAL_SALES",
      responsibilityHints: [
        "프로젝트 요구사항 분석",
        "기술 제안과 입찰 대응",
        "현장 조건 검토",
        "수주 전 리스크 조율"
      ],
      levelHints: [
        "주니어는 제안 자료와 사양 정리 비중이 큼",
        "시니어는 프로젝트 수주 전략과 대외 협의 비중이 큼"
      ]
    },
    {
      id: "PRESALES_ENGINEER",
      label: "프리세일즈 엔지니어",
      aliases: [
        "프리세일즈",
        "pre-sales engineer",
        "solutions engineer"
      ],
      family: "PRESALES_SOLUTION_TECHNICAL_SALES",
      responsibilityHints: [
        "고객 환경 분석",
        "구성안 설계",
        "데모와 POC 운영",
        "기술 설득 지원"
      ],
      levelHints: [
        "주니어는 데모 준비와 기술 응대 비중이 큼",
        "시니어는 도입 시나리오 설계와 고난도 질의 대응 비중이 큼"
      ]
    },
    {
      id: "CHANNEL_SALES_ENGINEER",
      label: "채널 기술영업 담당",
      aliases: [
        "채널 기술영업",
        "partner sales engineer",
        "channel sales engineer"
      ],
      family: "CHANNEL_TECHNICAL_SALES",
      responsibilityHints: [
        "파트너 기술 교육",
        "동행 미팅 지원",
        "기술 제안 검토",
        "채널 활성화 지원"
      ],
      levelHints: [
        "주니어는 자료 제공과 교육 지원 비중이 큼",
        "시니어는 주요 파트너 기술 리딩과 공동 제안 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "TECHNICAL_INVOLVEMENT",
      label: "기술 관여 방식",
      values: [
        "제품 사양 적합성 설명",
        "프로젝트 요구조건 해석",
        "도입 구조와 검증 시나리오 설계",
        "파트너 기술 역량 활성화"
      ]
    },
    {
      axisId: "SALES_CONTEXT",
      label: "영업 맥락",
      values: [
        "표준 제품 기반 제안",
        "프로젝트 단위 수주 대응",
        "프리세일즈와 솔루션 제안",
        "채널·리셀러 동행 지원"
      ]
    },
    {
      axisId: "STAKEHOLDER_TYPE",
      label: "주요 상대",
      values: [
        "고객 엔지니어와 구매 담당",
        "발주처·시공사·프로젝트 관계자",
        "고객 IT·운영·현업 담당자",
        "대리점·총판·파트너 영업조직"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "스펙 설명과 기술 질의 대응",
        "입찰·제안·현장 조건 조율",
        "데모·POC·구성안 설계",
        "교육·공동 제안·채널 활성화"
      ]
    }
  ],
  adjacentFamilies: [
    "B2B 영업",
    "솔루션영업",
    "제안영업",
    "파트너영업 / 채널영업",
    "프로젝트관리(PM)",
    "기술지원 / 필드엔지니어",
    "서비스기획"
  ],
  boundaryHints: [
    "표준 제품의 사양 적합성을 설명하고 기술 질의를 풀어주는 비중이 많아지면 사양·적합성 중심 기술영업으로 읽힙니다.",
    "입찰, RFQ, 프로젝트 범위, 현장 조건을 함께 다루는 비중이 커지면 프로젝트형 기술영업으로 이동합니다.",
    "고객 환경 분석, 데모, POC, 구성안 설계 비중이 커지면 프리세일즈·솔루션 연계 기술영업으로 이동합니다.",
    "파트너나 리셀러가 기술적으로 판매할 수 있도록 교육하고 동행 지원하는 비중이 커지면 채널·파트너 기술영업으로 이동합니다.",
    "기술 설명보다 매출 클로징과 계정 발굴 비중이 커지면 일반 B2B 영업 또는 솔루션영업으로 이동합니다.",
    "수주 이후 일정, 구축, 납품, 실행 책임이 커지면 PM 또는 프로젝트 엔지니어링 경계로 이동합니다.",
    "사후 장애 대응, 유지보수, 현장 트러블슈팅 비중이 커지면 기술지원 또는 필드엔지니어 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 기술 내용을 이해하고 고객이 구매 결정을 내릴 수 있도록 설명·검증·조율하는 기술영업 성격이 강합니다. 다만 실제 역할은 사양 적합성 중심, 프로젝트 수주형, 프리세일즈형, 채널 지원형으로 나뉘며 작동 방식이 달라집니다. 반면 순수 영업 클로징이나 사후 기술지원 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
