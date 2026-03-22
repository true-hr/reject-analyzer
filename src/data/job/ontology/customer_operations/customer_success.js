export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "CUSTOMER_SUCCESS",
  aliases: [
    "고객성공",
    "고객 성공",
    "CSM",
    "Customer Success",
    "Customer Success Manager",
    "고객성공매니저",
    "고객 성공 매니저",
    "고객성공 매니저",
    "어카운트 성공",
    "고객 성장 관리",
    "고객 활성화",
    "고객 온보딩 및 성공",
    "customer success",
    "customer success manager",
    "client success",
    "client success manager",
    "customer growth",
    "customer lifecycle management",
    "customer success operations"
  ],
  families: [
    {
      id: "ADOPTION_ONBOARDING_CSM",
      label: "도입·온보딩 중심 CSM",
      aliases: [
        "온보딩 CSM",
        "도입 지원 CSM",
        "활성화 CSM",
        "adoption csm",
        "onboarding csm",
        "implementation success",
        "customer onboarding"
      ],
      strongSignals: [
        "신규 고객의 도입 일정과 초기 사용 활성화 관리",
        "고객 온보딩 플랜 수립과 단계별 진행 관리",
        "초기 세팅, 사용자 교육, 사용 시작 지원",
        "도입 초기 사용률과 핵심 기능 활성화 추적",
        "고객이 첫 성과를 내기까지의 시간 단축 책임",
        "초기 이슈 정리와 내부 전달을 통한 안정화 지원",
        "파일럿 이후 정식 전환과 초기 정착 관리"
      ],
      mediumSignals: [
        "킥오프 미팅 진행",
        "사용자 가이드와 교육 세션 운영",
        "도입 체크리스트 관리",
        "초기 미사용 계정 리마인드",
        "고객 담당자와 주간 진행상황 공유"
      ],
      boundarySignals: [
        "구축 범위 정의와 기술 프로젝트 관리가 더 커지면 구현·프로젝트 매니지먼트 또는 솔루션 컨설팅으로 이동",
        "계약 갱신과 업셀 책임 비중이 커지면 리뉴얼·성장 CSM 또는 어카운트 매니지먼트로 이동",
        "반복 문의 대응과 티켓 처리 비중이 커지면 고객지원(CS) 또는 테크니컬 서포트 경계가 강해짐"
      ],
      adjacentFamilies: [
        "RETENTION_GROWTH_CSM",
        "STRATEGIC_ACCOUNT_CSM",
        "PROGRAM_SCALE_CSM"
      ],
      boundaryNote: "신규 고객이 제품을 실제로 쓰기 시작하고 초기 성과를 내도록 만드는 책임이 크면 이 family로 읽힙니다. 반면 기술 구축 관리, 매출 확장, 반복 문의 처리 비중이 더 커지면 다른 family나 인접 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 고객이 제품을 도입하고 초기에 안정적으로 사용하도록 만드는 성격이 강합니다. 반면 기술 구축 프로젝트 관리가 중심이면 구현·컨설팅으로, 갱신과 확장 책임이 커지면 성장형 CSM이나 어카운트 매니지먼트 경계로 읽힐 수 있습니다."
    },
    {
      id: "RETENTION_GROWTH_CSM",
      label: "리텐션·성장 중심 CSM",
      aliases: [
        "리텐션 CSM",
        "성장형 CSM",
        "갱신 CSM",
        "확장형 CSM",
        "retention csm",
        "growth csm",
        "renewal csm",
        "expansion csm"
      ],
      strongSignals: [
        "고객 사용성과 사업성과를 점검하며 계약 갱신 가능성 관리",
        "업셀, 크로스셀, 확장 사용 기회 발굴",
        "정기 비즈니스 리뷰를 통해 성과와 리스크 점검",
        "사용 저하 고객에 대한 리텐션 액션 설계",
        "고객 목표와 실제 활용 수준의 간극 관리",
        "갱신 시점 전후의 관계 관리와 내부 협업 주도",
        "건강도 지표를 바탕으로 이탈 위험과 성장 기회 관리"
      ],
      mediumSignals: [
        "QBR, MBR 등 정기 리뷰 운영",
        "활성 사용자 수와 기능 사용 추이 점검",
        "고객별 성공계획서 운영",
        "업셀 후보 기능 제안",
        "갱신 일정과 의사결정 구조 파악"
      ],
      boundarySignals: [
        "직접 견적 협상과 세일즈 클로징 책임이 커지면 어카운트 매니지먼트 또는 영업으로 이동",
        "기술 지원과 장애 대응 비중이 커지면 기술지원 또는 TAM 경계가 강해짐",
        "하이터치 관계관리보다 대규모 세그먼트 운영이 중심이면 프로그램·스케일 CSM으로 이동"
      ],
      adjacentFamilies: [
        "ADOPTION_ONBOARDING_CSM",
        "STRATEGIC_ACCOUNT_CSM",
        "PROGRAM_SCALE_CSM"
      ],
      boundaryNote: "고객이 계속 쓰고 더 크게 쓰도록 만드는 책임이 크면 이 family로 읽힙니다. 반면 직접 매출 클로징, 기술 이슈 해결, 대량 세그먼트 자동 운영이 중심이면 다른 family 경계가 강해집니다.",
      summaryTemplate: "이 직무는 고객의 지속 사용과 갱신, 확장 성장을 만드는 성격이 강합니다. 반면 직접 세일즈 클로징 비중이 커지면 어카운트 매니지먼트로, 기술 이슈 대응이 중심이면 TAM이나 기술지원 경계로 읽힐 수 있습니다."
    },
    {
      id: "STRATEGIC_ACCOUNT_CSM",
      label: "전략고객·하이터치 CSM",
      aliases: [
        "전략고객 CSM",
        "엔터프라이즈 CSM",
        "하이터치 CSM",
        "전략 어카운트 CSM",
        "strategic csm",
        "enterprise csm",
        "high touch csm",
        "strategic account success"
      ],
      strongSignals: [
        "대형 고객사 또는 핵심 고객사 전담 성공관리",
        "복수 이해관계자와 장기 관계 형성",
        "고객 조직의 목표와 제품 활용 전략을 연결",
        "경영진 또는 실무 리더 대상 비즈니스 리뷰 진행",
        "장기 리스크와 확장 기회를 계정 단위로 관리",
        "내부 제품, 지원, 영업, 컨설팅 조직과 복합 조율",
        "고객사별 맞춤 성공계획과 우선순위 관리"
      ],
      mediumSignals: [
        "임원 보고용 성과 자료 준비",
        "복수 부서 도입 확대 조율",
        "고객 조직도와 의사결정 구조 파악",
        "고객별 이슈 에스컬레이션 관리",
        "핵심 레퍼런스 고객 육성"
      ],
      boundarySignals: [
        "상업 조건 협상과 매출 숫자 책임이 더 크면 KAM 또는 어카운트 매니지먼트로 이동",
        "구축 프로젝트 납기와 범위 관리가 더 중요하면 프로젝트 매니지먼트 또는 전문서비스로 이동",
        "고객 수가 많고 표준 프로세스 운영이 중심이면 프로그램·스케일 CSM으로 이동"
      ],
      adjacentFamilies: [
        "RETENTION_GROWTH_CSM",
        "ADOPTION_ONBOARDING_CSM",
        "PROGRAM_SCALE_CSM"
      ],
      boundaryNote: "소수의 핵심 고객을 깊게 관리하며 장기 성공과 관계를 만드는 책임이 크면 이 family로 읽힙니다. 반면 상업 협상, 구축 프로젝트, 대량 계정 표준 운영이 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 전략 고객을 깊게 관리하며 장기적인 성공과 관계를 만드는 성격이 강합니다. 반면 상업 협상 비중이 커지면 KAM으로, 프로젝트 납기 관리가 중심이면 전문서비스나 PM 경계로 읽힐 수 있습니다."
    },
    {
      id: "PROGRAM_SCALE_CSM",
      label: "프로그램·스케일 CSM",
      aliases: [
        "스케일 CSM",
        "프로그램 CSM",
        "디지털 CSM",
        "저터치 CSM",
        "scale csm",
        "program csm",
        "digital customer success",
        "low touch csm"
      ],
      strongSignals: [
        "다수 고객을 세그먼트 기준으로 운영하는 성공 프로그램 설계",
        "하이터치 1:1 관리보다 캠페인, 플레이북, 자동화 중심 운영",
        "고객 건강도 기준으로 대상군을 나누고 액션 실행",
        "웨비나, 가이드, 인앱 안내, 이메일 시퀀스 등 확장 가능한 운영",
        "반복 성공 패턴을 표준화해 대규모 고객군에 적용",
        "고객 여정 단계별 프로그램 성과 측정",
        "CSM 인력 투입 없이도 사용 활성화를 높이는 구조 설계"
      ],
      mediumSignals: [
        "세그먼트별 넛지 캠페인 운영",
        "자주 묻는 주제 기반 교육 콘텐츠 배포",
        "저활성 고객군 리인게이지먼트 프로그램",
        "고객 여정 플레이북 관리",
        "운영 자동화 도구와 협업"
      ],
      boundarySignals: [
        "마케팅 자동화와 리드 육성이 주목적이면 CRM 마케팅으로 이동",
        "고객 문의 해결과 헬프센터 운영이 중심이면 고객지원 또는 셀프서비스 운영 경계가 강해짐",
        "핵심 고객 1:1 관계 관리가 커지면 전략고객·하이터치 CSM으로 이동"
      ],
      adjacentFamilies: [
        "RETENTION_GROWTH_CSM",
        "ADOPTION_ONBOARDING_CSM",
        "STRATEGIC_ACCOUNT_CSM"
      ],
      boundaryNote: "많은 고객을 동일한 방식으로 방치하지 않고, 세그먼트별 성공 프로그램으로 관리하는 책임이 크면 이 family로 읽힙니다. 반면 마케팅 육성, 문의 처리, 핵심 고객 전담 관리가 더 중요해지면 다른 경계가 강해집니다.",
      summaryTemplate: "이 직무는 다수 고객을 세그먼트와 프로그램 단위로 운영해 사용 활성화와 리텐션을 높이는 성격이 강합니다. 반면 마케팅 자동화 목적이 더 크면 CRM 마케팅으로, 소수 고객의 깊은 관계 관리가 중심이면 전략고객 CSM으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CUSTOMER_SUCCESS_MANAGER",
      label: "고객성공 매니저",
      aliases: [
        "고객성공 매니저",
        "고객 성공 매니저",
        "CSM",
        "customer success manager"
      ],
      family: "RETENTION_GROWTH_CSM",
      responsibilityHints: [
        "고객 사용성과 사업성과 점검",
        "갱신 리스크와 성장 기회 관리",
        "정기 리뷰와 성공계획 운영",
        "내부 팀과 협업해 고객 문제 해결 및 확장 지원"
      ],
      levelHints: [
        "주니어는 운영 점검과 고객 커뮤니케이션 실행 비중이 큼",
        "시니어는 계정 전략, 리스크 판단, 확장 기회 관리 비중이 큼"
      ]
    },
    {
      id: "ONBOARDING_SUCCESS_MANAGER",
      label: "온보딩 성공 매니저",
      aliases: [
        "온보딩 매니저",
        "도입 성공 매니저",
        "onboarding success manager",
        "implementation success manager"
      ],
      family: "ADOPTION_ONBOARDING_CSM",
      responsibilityHints: [
        "신규 고객 도입 일정과 초기 세팅 관리",
        "교육과 활성화 지원",
        "초기 사용률과 첫 성과 달성 점검",
        "도입 초기 이슈 조율"
      ],
      levelHints: [
        "주니어는 체크리스트 운영과 교육 실행 비중이 큼",
        "시니어는 도입 구조 설계와 초기 활성화 전략 비중이 큼"
      ]
    },
    {
      id: "ENTERPRISE_CSM",
      label: "엔터프라이즈 CSM",
      aliases: [
        "엔터프라이즈 CSM",
        "전략고객 CSM",
        "enterprise customer success manager",
        "strategic csm"
      ],
      family: "STRATEGIC_ACCOUNT_CSM",
      responsibilityHints: [
        "핵심 고객사 장기 성공관리",
        "복수 이해관계자 관계 관리",
        "비즈니스 리뷰와 계정별 성공 전략 운영",
        "고객사 내 확장 기회 및 리스크 총괄"
      ],
      levelHints: [
        "주니어는 운영 지원과 이슈 추적 비중이 큼",
        "시니어는 계정 전략, 임원 커뮤니케이션, 내부 에스컬레이션 조율 비중이 큼"
      ]
    },
    {
      id: "SCALE_CSM_MANAGER",
      label: "스케일 CSM 매니저",
      aliases: [
        "스케일 CSM 매니저",
        "프로그램 CSM",
        "디지털 CSM 매니저",
        "scale csm manager",
        "program customer success manager"
      ],
      family: "PROGRAM_SCALE_CSM",
      responsibilityHints: [
        "세그먼트별 성공 프로그램 설계",
        "저활성 고객군 재참여 액션 운영",
        "자동화·캠페인형 고객성공 운영",
        "여정 단계별 프로그램 성과 관리"
      ],
      levelHints: [
        "주니어는 캠페인 운영과 성과 모니터링 비중이 큼",
        "시니어는 세그먼트 전략과 플레이북 설계 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "LIFECYCLE_STAGE",
      label: "고객 여정 단계",
      values: [
        "도입 직후 온보딩과 초기 활성화",
        "정상 사용 단계의 유지와 확장",
        "핵심 고객의 장기 관계와 전략 성공",
        "다수 고객군의 표준화된 프로그램 운영"
      ]
    },
    {
      axisId: "TOUCH_MODEL",
      label: "운영 방식",
      values: [
        "고객별 도입 중심 하이터치",
        "계정 단위 성과·갱신 관리",
        "핵심 고객 전담 하이터치",
        "세그먼트·자동화 중심 스케일 운영"
      ]
    },
    {
      axisId: "PRIMARY_OUTCOME",
      label: "핵심 성과 방향",
      values: [
        "빠른 도입 완료와 초기 사용 정착",
        "리텐션, 갱신, 확장 사용",
        "전략 고객 장기 유지와 관계 심화",
        "대규모 고객군 활성화 효율 향상"
      ]
    },
    {
      axisId: "BOUNDARY_DIRECTION",
      label: "인접 직무로 기우는 방향",
      values: [
        "기술 구축과 프로젝트 관리가 커지면 구현·전문서비스",
        "상업 협상과 매출 클로징이 커지면 어카운트 매니지먼트·영업",
        "반복 문의 해결이 중심이면 고객지원·기술지원",
        "자동화 캠페인과 리드 육성이 중심이면 CRM 마케팅"
      ]
    }
  ],
  adjacentFamilies: [
    "고객지원(CS)",
    "기술지원 / 테크니컬서포트",
    "TAM / 기술 어카운트 매니지먼트",
    "어카운트 매니지먼트",
    "영업",
    "프로젝트 매니지먼트",
    "전문서비스 / 구축 컨설팅",
    "CRM 마케팅"
  ],
  boundaryHints: [
    "고객이 잘 쓰도록 만드는 것보다 반복 문의를 빠르게 해결하는 비중이 커지면 고객성공보다 고객지원이나 기술지원으로 읽힙니다.",
    "활용 확산과 리텐션 관리보다 견적, 조건 협상, 계약 클로징 책임이 커지면 어카운트 매니지먼트나 영업 경계가 강해집니다.",
    "도입 일정, 범위, 산출물, 납기 관리가 중심이면 온보딩 CSM이 아니라 프로젝트 매니지먼트나 전문서비스로 이동할 수 있습니다.",
    "고객 수가 적고 임원 포함 다층 관계관리 비중이 커지면 전략고객·하이터치 CSM으로 읽히는 힘이 강해집니다.",
    "고객 수가 많고 표준화된 플레이북, 자동화 캠페인, 세그먼트 운영이 많아지면 프로그램·스케일 CSM 쪽으로 이동합니다.",
    "제품 활용과 사업성과 연결보다는 기술 아키텍처, 장애 원인, 성능 이슈 조율이 중요해지면 TAM 또는 기술지원 경계가 강해집니다.",
    "리텐션 운영을 하더라도 목적이 고객 육성보다 마케팅 자동화와 캠페인 반응 관리에 가까우면 CRM 마케팅으로 이동할 수 있습니다."
  ],
  summaryTemplate: "이 직무는 고객이 제품을 도입한 뒤 실제로 잘 사용하고 성과를 내도록 만들어 유지와 성장을 이끄는 성격이 강합니다. 실제 역할은 온보딩, 리텐션·확장, 전략고객 관리, 대규모 프로그램 운영 중 어디에 무게가 실리느냐에 따라 다르게 읽힙니다. 반면 문의 해결, 기술 이슈 대응, 계약 협상, 구축 프로젝트 관리 비중이 커지면 각각 고객지원, TAM, 어카운트 매니지먼트, 전문서비스 경계로 읽힐 수 있습니다."
};
