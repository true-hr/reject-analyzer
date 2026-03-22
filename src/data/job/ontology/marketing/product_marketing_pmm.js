export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "PRODUCT_MARKETING_PMM",
  aliases: [
    "상품마케팅",
    "상품 마케팅",
    "상품마케팅(PMM)",
    "상품마케터",
    "프로덕트 마케팅",
    "프로덕트마케팅",
    "프로덕트 마케터",
    "PMM",
    "product marketing",
    "product marketer",
    "product marketing manager",
    "go-to-market",
    "GTM marketing"
  ],
  families: [
    {
      id: "GTM_PRODUCT_MARKETING",
      label: "GTM·출시 중심 상품마케팅",
      aliases: [
        "GTM 상품마케팅",
        "출시 중심 PMM",
        "go-to-market product marketing",
        "launch marketing",
        "product launch marketing"
      ],
      strongSignals: [
        "신제품 또는 신규 기능 출시 계획을 세우고 GTM 실행을 주도한다",
        "출시 일정에 맞춰 포지셔닝, 핵심 메시지, 세일즈 자료, 캠페인 연계를 정리한다",
        "제품 출시 전후로 타깃 세그먼트, 출시 시나리오, 채널별 전달 방식을 설계한다",
        "출시 readiness 점검, 부서 간 alignment, launch checklist 운영을 맡는다",
        "세일즈, CS, 마케팅, 제품팀과 함께 출시 커뮤니케이션 체계를 맞춘다",
        "런칭 후 초기 반응, adoption, enablement 이슈를 점검하며 메시지를 조정한다"
      ],
      mediumSignals: [
        "신규 기능 소개서, 릴리즈 노트, 출시 FAQ, 내부 교육 자료를 만든다",
        "캠페인 팀과 협업하지만 핵심 책임은 제품 출시 설계와 메시지 정렬에 있다",
        "제품 로드맵 변화에 따라 외부 커뮤니케이션 우선순위를 조정한다",
        "시장 반응보다 출시 타이밍과 조직 간 실행 정합성 관리가 상대적으로 더 중요하다"
      ],
      boundarySignals: [
        "지속적인 시장 분석과 카테고리 전략 비중이 커지면 시장전략·포지셔닝 중심 상품마케팅으로 이동한다",
        "세일즈 자료와 현장 enablement 운영 비중이 커지면 세일즈 이네이블먼트 중심 상품마케팅으로 이동한다",
        "사용자 획득 채널 운영과 퍼포먼스 집행 비중이 커지면 디지털마케팅 또는 퍼포먼스마케팅 경계로 이동한다",
        "제품 요구사항 정의와 기능 우선순위 결정 비중이 커지면 서비스기획 또는 프로덕트 매니지먼트 경계가 강해진다"
      ],
      adjacentFamilies: [
        "MARKET_STRATEGY_PRODUCT_MARKETING",
        "SALES_ENABLEMENT_PRODUCT_MARKETING",
        "LIFECYCLE_ADOPTION_PRODUCT_MARKETING"
      ],
      boundaryNote: "출시 타이밍에 맞춰 메시지와 실행 체계를 정렬하는 역할이 핵심이면 이 family로 읽힙니다. 반면 시장 인사이트 축적, 세일즈 enablement, 출시 후 adoption 운영 비중이 더 커지면 다른 family로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 제품이나 기능을 시장에 내보내는 GTM·출시 중심 상품마케팅 성격이 강합니다. 반면 지속적인 시장전략 수립이나 세일즈 enablement, 출시 후 adoption 운영 비중이 커지면 다른 상품마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "MARKET_STRATEGY_PRODUCT_MARKETING",
      label: "시장전략·포지셔닝 중심 상품마케팅",
      aliases: [
        "시장전략 PMM",
        "포지셔닝 중심 PMM",
        "시장 분석형 상품마케팅",
        "market strategy product marketing",
        "positioning product marketing"
      ],
      strongSignals: [
        "시장 세분화, 타깃 고객 정의, 경쟁사 비교를 바탕으로 제품 포지셔닝을 설계한다",
        "제품의 차별점, 구매 이유, 카테고리 내 위치를 언어로 정리한다",
        "ICP, 페르소나, 구매자 니즈, 경쟁 대안 분석을 반복적으로 업데이트한다",
        "메시지 하우스, value proposition, positioning statement를 만든다",
        "시장 변화나 경쟁 구도에 따라 제품 내러티브를 재정비한다",
        "제품 기능 설명보다 왜 이 제품이 선택되어야 하는지에 집중한다"
      ],
      mediumSignals: [
        "고객 인터뷰, 시장 리서치, 경쟁사 모니터링 결과를 메시지에 반영한다",
        "브랜드마케팅과 협업하지만 핵심은 브랜드 일반론보다 제품 단위 차별화에 있다",
        "세일즈나 제품팀이 동일한 언어로 제품을 설명할 수 있도록 기준을 정리한다",
        "출시 캠페인보다 시장 맥락 속 제품 해석 구조를 잡는 비중이 크다"
      ],
      boundarySignals: [
        "출시 실행과 런칭 coordination 비중이 커지면 GTM·출시 중심 상품마케팅으로 이동한다",
        "세일즈 자료 제작과 딜 지원 비중이 커지면 세일즈 이네이블먼트 중심 상품마케팅으로 이동한다",
        "브랜드 전체 메시지 체계와 캠페인 자산 운영 비중이 커지면 브랜드마케팅 경계로 이동한다",
        "시장 조사 자체가 주업무가 되면 시장조사 / 마케팅리서치 경계가 강해진다"
      ],
      adjacentFamilies: [
        "GTM_PRODUCT_MARKETING",
        "SALES_ENABLEMENT_PRODUCT_MARKETING",
        "LIFECYCLE_ADOPTION_PRODUCT_MARKETING"
      ],
      boundaryNote: "시장 안에서 제품을 어떻게 규정하고 어떤 고객에게 어떤 이유로 선택되게 할지 설계하면 이 family로 읽힙니다. 반면 실제 출시 운영이나 현장 세일즈 지원이 더 중요해지면 다른 family 쪽으로 이동합니다.",
      summaryTemplate: "이 직무는 시장과 경쟁 맥락 속에서 제품의 포지션과 메시지를 설계하는 시장전략·포지셔닝 중심 상품마케팅 성격이 강합니다. 반면 출시 실행이나 세일즈 지원 비중이 커지면 다른 상품마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "SALES_ENABLEMENT_PRODUCT_MARKETING",
      label: "세일즈 이네이블먼트 중심 상품마케팅",
      aliases: [
        "세일즈 이네이블먼트 PMM",
        "영업지원형 PMM",
        "세일즈 연계 상품마케팅",
        "sales enablement product marketing",
        "field product marketing"
      ],
      strongSignals: [
        "세일즈 덱, 배틀카드, one-pager, 제안용 메시지 자료를 만든다",
        "영업 조직이 제품을 일관되게 설명할 수 있도록 교육하고 FAQ를 관리한다",
        "딜 현장에서 자주 나오는 objection, 경쟁 비교, 고객 질문을 메시지로 정리한다",
        "세일즈 콜 피드백을 받아 제품 메시지와 자료를 업데이트한다",
        "세일즈 현장 활용도와 제안 전환 기여를 중요하게 본다",
        "제품 설명이 실제 영업 대화에서 먹히는지 검증하고 다듬는다"
      ],
      mediumSignals: [
        "세일즈 킥오프, 내부 enablement 세션, 제품 교육 자료를 운영한다",
        "출시 이후에도 반복적으로 세일즈 자산을 개선한다",
        "B2B 환경에서 영업 조직과 매우 가깝게 움직인다",
        "캠페인 성과보다 영업 활용성과 현장 설득력을 더 중시한다"
      ],
      boundarySignals: [
        "시장 세분화와 포지셔닝 설계 비중이 커지면 시장전략·포지셔닝 중심 상품마케팅으로 이동한다",
        "제품 출시 전체 coordination 비중이 커지면 GTM·출시 중심 상품마케팅으로 이동한다",
        "제안서 커스터마이징과 수주 활동 자체 비중이 커지면 제안영업 또는 솔루션영업 경계로 이동한다",
        "고객 도입 후 교육, 온보딩, 활용 촉진 비중이 커지면 고객성공 또는 lifecycle/adoption 경계가 강해진다"
      ],
      adjacentFamilies: [
        "GTM_PRODUCT_MARKETING",
        "MARKET_STRATEGY_PRODUCT_MARKETING",
        "LIFECYCLE_ADOPTION_PRODUCT_MARKETING"
      ],
      boundaryNote: "제품 메시지가 실제 세일즈 현장에서 쓰이도록 자료와 교육 체계를 만드는 역할이 핵심이면 이 family로 읽힙니다. 반면 시장전략 설계나 출시 coordination이 더 중요하면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 제품의 강점을 세일즈 현장에서 설득력 있게 전달하도록 돕는 세일즈 이네이블먼트 중심 상품마케팅 성격이 강합니다. 반면 시장 포지셔닝 설계나 출시 운영 비중이 커지면 다른 상품마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "LIFECYCLE_ADOPTION_PRODUCT_MARKETING",
      label: "도입확산·채택 중심 상품마케팅",
      aliases: [
        "adoption 중심 PMM",
        "라이프사이클 상품마케팅",
        "고객 채택 중심 PMM",
        "lifecycle product marketing",
        "adoption product marketing"
      ],
      strongSignals: [
        "출시 이후 고객의 초기 이해, 도입, 활용 확산을 높이기 위한 메시지와 콘텐츠를 설계한다",
        "온보딩, 사용 촉진, 기능 adoption, 업셀 연계 커뮤니케이션을 관리한다",
        "기존 고객 대상 기능 공지, 활용 가이드, use case 메시지를 운영한다",
        "제품 기능이 실제로 쓰이도록 사용 장벽과 메시지 문제를 점검한다",
        "활성 사용자, 기능 사용률, adoption rate, expansion 기여를 중요하게 본다",
        "CRM, CS, 제품팀과 협업해 고객 여정 안에서 제품 메시지를 조정한다"
      ],
      mediumSignals: [
        "신규 고객 획득보다 기존 고객의 이해와 활용 확산에 더 집중한다",
        "이메일, 인앱 메시지, 헬프콘텐츠, 웨비나 등 채택 촉진 자산을 운영한다",
        "제품 가치 재인식과 재활성화 메시지를 설계한다",
        "기능 출시 이후 adoption 격차를 분석해 후속 커뮤니케이션을 만든다"
      ],
      boundarySignals: [
        "신규 고객 대상 시장 포지셔닝과 런칭 설계 비중이 커지면 GTM·출시 중심 상품마케팅으로 이동한다",
        "고객 리텐션 프로그램과 자동화 캠페인 운영 비중이 커지면 CRM 마케팅 경계로 이동한다",
        "고객 문제 해결과 계정 운영 비중이 커지면 고객성공(CSM) 경계가 강해진다",
        "제품 사용성 개선 요구를 직접 정의하는 비중이 커지면 서비스기획 또는 프로덕트 매니지먼트 경계로 이동한다"
      ],
      adjacentFamilies: [
        "GTM_PRODUCT_MARKETING",
        "SALES_ENABLEMENT_PRODUCT_MARKETING",
        "MARKET_STRATEGY_PRODUCT_MARKETING"
      ],
      boundaryNote: "제품을 시장에 알리는 것보다 출시 후 고객이 실제로 이해하고 쓰게 만드는 책임이 크면 이 family로 읽힙니다. 반면 신규 획득 중심 GTM, CRM 자동화 운영, 고객 문제 해결 운영이 더 커지면 인접 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 제품 출시 이후 고객의 도입과 채택을 높이는 도입확산·채택 중심 상품마케팅 성격이 강합니다. 반면 신규 획득 GTM이나 CRM 운영, 고객성공 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PRODUCT_MARKETING_MANAGER",
      label: "프로덕트 마케팅 매니저",
      aliases: [
        "프로덕트 마케팅 매니저",
        "상품마케팅 매니저",
        "PMM",
        "product marketing manager"
      ],
      family: "GTM_PRODUCT_MARKETING",
      responsibilityHints: [
        "제품·기능 출시 계획 수립 및 GTM 실행 정렬",
        "포지셔닝과 핵심 메시지 정리",
        "출시 자료와 내부 readiness 관리",
        "출시 후 초기 반응 점검 및 메시지 조정"
      ],
      levelHints: [
        "주니어는 출시 운영과 자료 정리, cross-functional coordination 지원 비중이 크다",
        "시니어는 GTM 방향 설정과 우선순위 조정, 부서 간 alignment 주도 비중이 크다"
      ]
    },
    {
      id: "PRODUCT_POSITIONING_MANAGER",
      label: "제품 포지셔닝 담당",
      aliases: [
        "포지셔닝 담당",
        "시장전략 PMM",
        "product positioning manager"
      ],
      family: "MARKET_STRATEGY_PRODUCT_MARKETING",
      responsibilityHints: [
        "시장 세분화와 타깃 고객 정의",
        "경쟁사 비교와 차별점 정리",
        "value proposition 및 메시지 구조 설계",
        "제품 내러티브 정렬"
      ],
      levelHints: [
        "주니어는 리서치 정리와 메시지 문안 작성 비중이 크다",
        "시니어는 카테고리 관점 설계와 제품 포지셔닝 의사결정 비중이 크다"
      ]
    },
    {
      id: "GTM_MANAGER",
      label: "GTM 매니저",
      aliases: [
        "GTM 매니저",
        "go-to-market manager",
        "launch manager"
      ],
      family: "GTM_PRODUCT_MARKETING",
      responsibilityHints: [
        "출시 시나리오 및 rollout 계획 수립",
        "부서 간 launch readiness 관리",
        "채널별 메시지 전달 구조 설계",
        "출시 일정과 실행 산출물 관리"
      ],
      levelHints: [
        "주니어는 체크리스트 운영과 산출물 coordination 비중이 크다",
        "시니어는 GTM 구조 설계와 우선순위 결정, 리스크 조율 비중이 크다"
      ]
    },
    {
      id: "SALES_ENABLEMENT_MANAGER",
      label: "세일즈 이네이블먼트 매니저",
      aliases: [
        "세일즈 이네이블먼트 매니저",
        "영업지원형 PMM",
        "sales enablement manager"
      ],
      family: "SALES_ENABLEMENT_PRODUCT_MARKETING",
      responsibilityHints: [
        "세일즈 덱과 배틀카드, FAQ 제작",
        "영업 조직 제품 교육 운영",
        "현장 objection 수집 및 메시지 업데이트",
        "세일즈 활용도 기준 자료 개선"
      ],
      levelHints: [
        "주니어는 자료 제작과 교육 운영 지원 비중이 크다",
        "시니어는 영업 메시지 체계 설계와 현장 피드백 반영 구조 주도 비중이 크다"
      ]
    },
    {
      id: "PRODUCT_ADOPTION_MANAGER",
      label: "제품 채택 마케팅 담당",
      aliases: [
        "adoption manager",
        "제품 채택 마케팅",
        "lifecycle PMM"
      ],
      family: "LIFECYCLE_ADOPTION_PRODUCT_MARKETING",
      responsibilityHints: [
        "기존 고객 대상 기능 adoption 메시지 설계",
        "온보딩·활용 촉진 커뮤니케이션 운영",
        "기능 사용률 분석과 후속 액션 기획",
        "CRM·CS·제품팀 협업 통한 고객 여정 정렬"
      ],
      levelHints: [
        "주니어는 고객 커뮤니케이션 운영과 성과 모니터링 비중이 크다",
        "시니어는 adoption 전략 설계와 여정별 메시지 구조화 비중이 크다"
      ]
    },
    {
      id: "FIELD_PRODUCT_MARKETER",
      label: "필드 프로덕트 마케터",
      aliases: [
        "field product marketer",
        "필드 PMM",
        "현장 연계 상품마케터"
      ],
      family: "SALES_ENABLEMENT_PRODUCT_MARKETING",
      responsibilityHints: [
        "영업 현장과 가까운 제품 메시지 지원",
        "딜 상황별 경쟁 메시지 정리",
        "세일즈 피드백 기반 자산 개선",
        "세일즈와 마케팅 간 메시지 translation"
      ],
      levelHints: [
        "주니어는 자산 업데이트와 현장 요청 대응 비중이 크다",
        "시니어는 세일즈 활용 전략과 메시지 정합성 설계 비중이 크다"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "주요 초점",
      values: [
        "제품 출시와 GTM 실행",
        "시장 세분화와 포지셔닝 설계",
        "세일즈 현장 설득 지원",
        "도입 이후 채택과 활용 확산"
      ]
    },
    {
      axisId: "CORE_PARTNER",
      label: "가장 자주 맞물리는 협업축",
      values: [
        "제품팀·마케팅·운영 조직",
        "리서치·전략·브랜드 조직",
        "세일즈·프리세일즈 조직",
        "CRM·CS·고객성공 조직"
      ]
    },
    {
      axisId: "MAIN_OUTPUT",
      label: "대표 산출물",
      values: [
        "launch plan·출시 메시지·readiness 자료",
        "positioning statement·경쟁 비교·세그먼트 정의",
        "sales deck·battlecard·enablement 자료",
        "adoption messaging·온보딩 가이드·기능 활용 커뮤니케이션"
      ]
    },
    {
      axisId: "SUCCESS_SIGNAL",
      label: "주요 성과 신호",
      values: [
        "출시 정합성과 초기 시장 반응",
        "메시지 선명도와 시장 내 차별화",
        "영업 활용도와 설득력 향상",
        "기능 adoption과 고객 활용 확산"
      ]
    }
  ],
  adjacentFamilies: [
    "브랜드마케팅",
    "콘텐츠마케팅",
    "디지털마케팅",
    "CRM 마케팅",
    "시장조사 / 마케팅리서치",
    "서비스기획",
    "신사업/사업개발(BD)",
    "영업",
    "고객성공(CSM)"
  ],
  boundaryHints: [
    "출시 일정 관리와 cross-functional alignment 비중이 커지면 GTM·출시 중심 상품마케팅으로 읽힙니다.",
    "시장 세분화, 경쟁사 분석, value proposition 설계 비중이 커지면 시장전략·포지셔닝 중심 상품마케팅으로 이동합니다.",
    "세일즈 덱, 배틀카드, objection 대응, 영업 교육 비중이 커지면 세일즈 이네이블먼트 중심 상품마케팅으로 이동합니다.",
    "출시 이후 온보딩, 기능 adoption, 기존 고객 활용 확산 비중이 커지면 도입확산·채택 중심 상품마케팅으로 이동합니다.",
    "브랜드 전체 캠페인 메시지와 대외 인지도 관리 비중이 커지면 브랜드마케팅 경계가 강해집니다.",
    "마케팅 자동화, 세그먼트별 메시지 발송, 리텐션 운영 비중이 커지면 CRM 마케팅 경계로 읽힙니다.",
    "제품 요구사항 정의, 기능 우선순위 결정, 사용자 문제 해결 설계 비중이 커지면 서비스기획 또는 프로덕트 매니지먼트 경계로 이동합니다.",
    "제안서 맞춤 작성과 수주 활동 자체 비중이 커지면 제안영업·솔루션영업 쪽 해석이 강해집니다."
  ],
  summaryTemplate: "이 직무는 제품을 시장에 어떻게 설명하고 누구에게 어떤 이유로 선택되게 할지 설계하는 상품마케팅 성격이 강합니다. 같은 상품마케팅이라도 출시 실행을 다루는지, 시장 포지셔닝을 잡는지, 세일즈 설득을 돕는지, 출시 후 고객 채택을 높이는지에 따라 실제 역할이 달라집니다. 반면 브랜드 캠페인 운영, CRM 자동화, 제품 기능 정의 비중이 커지면 인접 직무 경계로 읽힐 수 있습니다."
};
