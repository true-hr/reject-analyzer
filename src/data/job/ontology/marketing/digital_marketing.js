export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "DIGITAL_MARKETING",
  aliases: [
    "디지털마케팅",
    "디지털 마케팅",
    "디지털 마케터",
    "온라인마케팅",
    "온라인 마케팅",
    "디지털 광고",
    "디지털 캠페인",
    "디지털 채널 마케팅",
    "퍼포먼스 외 디지털 마케팅",
    "digital marketing",
    "digital marketer",
    "online marketing",
    "digital campaign",
    "digital campaign manager",
    "digital media marketing"
  ],
  families: [
    {
      id: "DIGITAL_CAMPAIGN_PLANNING",
      label: "디지털 캠페인 기획·운영",
      aliases: [
        "디지털 캠페인 기획",
        "디지털 캠페인 운영",
        "온라인 캠페인 기획",
        "디지털 프로모션 운영",
        "digital campaign planning",
        "digital campaign operations"
      ],
      strongSignals: [
        "디지털 채널 중심 캠페인 목표와 운영안 수립",
        "광고, 랜딩페이지, 메시지, 일정이 연결된 캠페인 구조 설계",
        "신제품 출시, 프로모션, 시즌 캠페인의 디지털 운영 총괄",
        "매체사·대행사·디자인·콘텐츠 팀과 실행 일정 조율",
        "캠페인별 채널 믹스와 예산 배분안 작성",
        "캠페인 종료 후 도달, 유입, 참여, 전환 흐름을 통합 리뷰",
        "운영 이슈 대응과 캠페인 일정 리커버리"
      ],
      mediumSignals: [
        "UTM 설계와 채널별 유입 구분",
        "소재 교체 일정과 집행 캘린더 관리",
        "프로모션 페이지 오픈 일정 조율",
        "채널별 메시지 변형안 관리",
        "캠페인 운영 리포트 작성"
      ],
      boundarySignals: [
        "ROAS, CPA, 입찰 최적화 비중이 커지면 퍼포먼스마케팅으로 이동",
        "상시 콘텐츠 편성·발행 운영 비중이 커지면 콘텐츠마케팅으로 이동",
        "브랜드 인지도와 메시지 일관성 관리가 더 중심이면 브랜드마케팅으로 이동"
      ],
      adjacentFamilies: [
        "DIGITAL_CHANNEL_OPERATIONS",
        "DIGITAL_ANALYTICS_OPTIMIZATION",
        "DIGITAL_CRM_JOURNEY"
      ],
      boundaryNote: "디지털 채널을 묶어 캠페인을 설계하고 실행 흐름을 운영하는 책임이 크면 이 family로 읽힙니다. 반면 매체 효율 최적화, 상시 콘텐츠 운영, 브랜드 메시지 관리가 더 커지면 다른 family나 인접 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 디지털 채널을 활용해 캠페인을 기획하고 실행 흐름을 운영하는 성격이 강합니다. 반면 광고 효율 최적화 비중이 커지면 퍼포먼스마케팅으로, 상시 발행 운영이 중심이면 콘텐츠마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "DIGITAL_CHANNEL_OPERATIONS",
      label: "디지털 채널 운영",
      aliases: [
        "디지털 채널 운영",
        "온라인 채널 운영",
        "웹사이트 운영 마케팅",
        "앱 채널 운영",
        "owned media 운영",
        "digital channel operations",
        "online channel operations",
        "owned channel marketing"
      ],
      strongSignals: [
        "웹사이트, 앱, 블로그, 소셜 등 자사 디지털 채널 운영",
        "채널별 방문·참여 흐름을 고려한 운영 캘린더 관리",
        "메인 배너, 이벤트 영역, 페이지 구조 등 채널 노출 운영",
        "채널별 콘텐츠 업로드와 운영 품질 관리",
        "유입 이후 페이지 이동과 이탈 구간 점검",
        "캠페인과 상시 운영을 연결하는 채널 단위 실행 관리",
        "내부 개발·디자인·콘텐츠 팀과 채널 개선 요청 조율"
      ],
      mediumSignals: [
        "웹/앱 화면 내 프로모션 노출 위치 조정",
        "운영 공지·이벤트 페이지 업데이트",
        "채널별 운영 KPI 모니터링",
        "SEO 기본 운영과 페이지 메타 정보 점검",
        "배너, CTA, 메뉴 구조 수정 요청"
      ],
      boundarySignals: [
        "콘텐츠 기획과 제작 자체가 중심이면 콘텐츠마케팅으로 이동",
        "광고 매체 집행과 효율 관리가 중심이면 퍼포먼스마케팅으로 이동",
        "회원 세그먼트별 리텐션 시나리오 운영이 강해지면 CRM 마케팅으로 이동"
      ],
      adjacentFamilies: [
        "DIGITAL_CAMPAIGN_PLANNING",
        "DIGITAL_ANALYTICS_OPTIMIZATION",
        "DIGITAL_CRM_JOURNEY"
      ],
      boundaryNote: "광고를 사서 유입시키는 것보다 자사 디지털 채널을 실제로 운영하고 개선하는 책임이 크면 이 family로 읽힙니다. 반면 제작 중심, 매체 효율 중심, 고객 세그먼트 운영 중심으로 무게가 이동하면 다른 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 웹·앱·소셜 같은 디지털 채널을 실제로 운영하고 유입 이후 경험을 관리하는 성격이 강합니다. 반면 콘텐츠 제작 중심이면 콘텐츠마케팅으로, 광고 효율 중심이면 퍼포먼스마케팅으로 읽힐 수 있습니다."
    },
    {
      id: "DIGITAL_ANALYTICS_OPTIMIZATION",
      label: "디지털 분석·최적화",
      aliases: [
        "디지털 분석",
        "디지털 최적화",
        "마케팅 분석 운영",
        "채널 최적화",
        "전환 최적화",
        "digital analytics",
        "digital optimization",
        "conversion optimization",
        "CRO"
      ],
      strongSignals: [
        "채널별 유입, 행동, 전환 데이터를 연결해 개선 포인트 도출",
        "GA, 앱 분석 도구, 대시보드 기반 마케팅 성과 해석",
        "랜딩페이지, 배너, CTA, 퍼널 단계별 이탈 구간 분석",
        "A/B 테스트 가설 수립과 결과 해석",
        "캠페인·채널 운영 개선안 제안",
        "전환 이벤트 정의와 측정 구조 점검",
        "분석 결과를 바탕으로 운영·디자인·콘텐츠 수정 요청"
      ],
      mediumSignals: [
        "주간·월간 디지털 성과 리포트 작성",
        "대시보드 운영과 지표 정의 정리",
        "UTM 및 이벤트 트래킹 품질 점검",
        "유입 경로별 성과 비교",
        "실험 결과 공유와 후속 과제 정리"
      ],
      boundarySignals: [
        "입찰, 예산, 광고세트 운영 중심이면 퍼포먼스마케팅으로 이동",
        "분석보다 전체 캠페인 기획과 운영 조율이 중심이면 디지털 캠페인 기획·운영으로 이동",
        "회원 세그먼트 기반 리텐션 시나리오 개선이 중심이면 CRM 마케팅으로 이동"
      ],
      adjacentFamilies: [
        "DIGITAL_CAMPAIGN_PLANNING",
        "DIGITAL_CHANNEL_OPERATIONS",
        "DIGITAL_CRM_JOURNEY"
      ],
      boundaryNote: "채널을 직접 운영하는 것보다 데이터를 해석하고 전환 흐름을 개선하는 책임이 크면 이 family로 읽힙니다. 반면 매체 운용 실무나 전체 캠페인 총괄, CRM 시나리오 설계 비중이 더 크면 다른 경계가 강해집니다.",
      summaryTemplate: "이 직무는 디지털 채널의 성과를 분석하고 전환 흐름을 최적화하는 성격이 강합니다. 반면 광고 집행 운영이 중심이면 퍼포먼스마케팅으로, 회원 리텐션 시나리오가 중심이면 CRM 마케팅으로 읽힐 수 있습니다."
    },
    {
      id: "DIGITAL_CRM_JOURNEY",
      label: "디지털 고객여정·리텐션 연계",
      aliases: [
        "디지털 CRM 연계",
        "고객여정 마케팅",
        "리텐션 중심 디지털 마케팅",
        "라이프사이클 디지털 마케팅",
        "digital customer journey",
        "digital retention marketing",
        "lifecycle digital marketing"
      ],
      strongSignals: [
        "회원가입 이후 활성화, 재방문, 재구매 흐름을 디지털 채널과 연결해 운영",
        "푸시, 이메일, 앱메시지, 웹 배너 등 접점을 연계한 고객여정 설계",
        "세그먼트별 메시지와 접점 우선순위 설정",
        "휴면 방지, 재활성화, 첫 구매 유도 등 리텐션 목적 캠페인 운영",
        "CRM 채널과 웹·앱 운영을 연결한 전환 흐름 관리",
        "고객행동 데이터 기반 후속 액션 시나리오 운영",
        "여정 단계별 이탈과 반응 차이 분석"
      ],
      mediumSignals: [
        "세그먼트별 오퍼 테스트",
        "리텐션 지표 모니터링",
        "메시지 발송 일정과 랜딩 연결 관리",
        "앱 푸시와 온사이트 배너 연계 운영",
        "반응 고객군 후속 캠페인 설계"
      ],
      boundarySignals: [
        "채널 운영보다 발송 자동화, 세그먼트 규칙, CRM 시스템 운영이 중심이면 CRM 마케팅으로 이동",
        "회원 기반보다 불특정 신규 유입 캠페인이 중심이면 디지털 캠페인 기획·운영으로 이동",
        "분석과 실험 자체가 핵심이면 디지털 분석·최적화로 이동"
      ],
      adjacentFamilies: [
        "DIGITAL_ANALYTICS_OPTIMIZATION",
        "DIGITAL_CHANNEL_OPERATIONS",
        "DIGITAL_CAMPAIGN_PLANNING"
      ],
      boundaryNote: "불특정 다수 유입보다 가입 이후 고객여정을 디지털 접점으로 이어가며 활성화·재방문을 만드는 책임이 크면 이 family로 읽힙니다. 반면 CRM 시스템 운영 전문성이 더 강하거나 신규 유입 중심 캠페인이 많아지면 다른 경계가 강해집니다.",
      summaryTemplate: "이 직무는 디지털 접점을 활용해 고객여정을 이어가고 리텐션을 높이는 성격이 강합니다. 반면 자동화 발송과 세그먼트 운영이 핵심이면 CRM 마케팅으로, 신규 유입 캠페인이 중심이면 디지털 캠페인 기획 쪽으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "DIGITAL_MARKETING_MANAGER",
      label: "디지털 마케팅 매니저",
      aliases: [
        "디지털 마케팅 매니저",
        "디지털 마케터",
        "online marketing manager",
        "digital marketing manager"
      ],
      family: "DIGITAL_CAMPAIGN_PLANNING",
      responsibilityHints: [
        "디지털 캠페인 목표와 실행안 수립",
        "채널별 운영 일정과 협업 조율",
        "캠페인 성과 리뷰와 개선안 도출",
        "프로모션, 랜딩, 메시지 흐름 연결"
      ],
      levelHints: [
        "주니어는 실행 운영과 일정 관리 비중이 큼",
        "시니어는 채널 믹스 설계와 캠페인 구조 총괄 비중이 큼"
      ]
    },
    {
      id: "DIGITAL_CHANNEL_MANAGER",
      label: "디지털 채널 매니저",
      aliases: [
        "디지털 채널 매니저",
        "온라인 채널 운영 매니저",
        "웹마케팅 운영",
        "digital channel manager"
      ],
      family: "DIGITAL_CHANNEL_OPERATIONS",
      responsibilityHints: [
        "웹·앱·자사 채널 운영",
        "운영 캘린더와 노출 구조 관리",
        "이벤트 페이지 및 배너 운영",
        "채널 품질과 유입 이후 흐름 점검"
      ],
      levelHints: [
        "주니어는 채널 업데이트와 운영 실행 비중이 큼",
        "시니어는 채널 개선 우선순위와 운영 구조 설계 비중이 큼"
      ]
    },
    {
      id: "DIGITAL_ANALYST_MARKETER",
      label: "디지털 분석 마케터",
      aliases: [
        "디지털 분석 마케터",
        "마케팅 데이터 분석",
        "전환 최적화 마케터",
        "digital analyst marketer",
        "conversion optimization marketer"
      ],
      family: "DIGITAL_ANALYTICS_OPTIMIZATION",
      responsibilityHints: [
        "유입·행동·전환 데이터 분석",
        "퍼널 개선 포인트 도출",
        "A/B 테스트 가설과 결과 해석",
        "채널 및 페이지 최적화 제안"
      ],
      levelHints: [
        "주니어는 데이터 정리와 리포트 운영 비중이 큼",
        "시니어는 실험 설계와 구조적 개선안 도출 비중이 큼"
      ]
    },
    {
      id: "DIGITAL_RETENTION_MARKETER",
      label: "디지털 리텐션 마케터",
      aliases: [
        "디지털 리텐션 마케터",
        "고객여정 마케터",
        "라이프사이클 마케터",
        "digital retention marketer",
        "lifecycle marketer"
      ],
      family: "DIGITAL_CRM_JOURNEY",
      responsibilityHints: [
        "가입 이후 고객여정 설계",
        "리텐션·재방문 캠페인 운영",
        "접점 간 메시지 연결",
        "세그먼트별 반응 기반 후속 액션 운영"
      ],
      levelHints: [
        "주니어는 메시지 운영과 일정 실행 비중이 큼",
        "시니어는 고객여정 설계와 세그먼트 전략 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_GOAL",
      label: "주요 목적",
      values: [
        "디지털 캠페인 실행과 운영 안정화",
        "자사 채널의 상시 운영과 경험 개선",
        "데이터 기반 전환 최적화",
        "고객여정 연계와 리텐션 강화"
      ]
    },
    {
      axisId: "MAIN_CONTROL_POINT",
      label: "주요 통제 지점",
      values: [
        "캠페인 일정·채널 믹스·운영 흐름",
        "웹·앱·소셜 등 자사 채널 노출과 운영 품질",
        "유입·행동·전환 데이터와 실험 결과",
        "세그먼트별 접점 설계와 후속 액션"
      ]
    },
    {
      axisId: "WORKING_SCOPE",
      label: "업무 범위",
      values: [
        "단기·시즌성 캠페인 중심",
        "상시 채널 운영 중심",
        "분석·실험·개선 중심",
        "회원 이후 여정 운영 중심"
      ]
    },
    {
      axisId: "BOUNDARY_DIRECTION",
      label: "인접 직무로 기우는 방향",
      values: [
        "광고 예산·입찰·매체 효율이 핵심이면 퍼포먼스마케팅",
        "콘텐츠 기획·제작과 발행이 핵심이면 콘텐츠마케팅",
        "브랜드 메시지와 인지도 관리가 핵심이면 브랜드마케팅",
        "자동화 발송과 세그먼트 규칙 운영이 핵심이면 CRM 마케팅"
      ]
    }
  ],
  adjacentFamilies: [
    "퍼포먼스마케팅",
    "콘텐츠마케팅",
    "브랜드마케팅",
    "CRM 마케팅",
    "상품마케팅(PMM)",
    "시장조사 / 마케팅리서치",
    "IT 기획",
    "서비스기획"
  ],
  boundaryHints: [
    "광고 매체 집행, 예산 운용, 입찰 조정, ROAS·CPA 개선 책임이 커지면 디지털마케팅보다 퍼포먼스마케팅으로 읽힙니다.",
    "캠페인 운영보다 콘텐츠 기획·제작·발행 캘린더 비중이 커지면 콘텐츠마케팅 경계가 강해집니다.",
    "디지털 채널을 쓰더라도 핵심 목적이 브랜드 인지도와 메시지 일관성 관리라면 브랜드마케팅으로 이동할 수 있습니다.",
    "회원 세그먼트, 자동화 시나리오, 발송 체계 운영 비중이 커지면 CRM 마케팅으로 읽히는 힘이 강해집니다.",
    "데이터를 보더라도 최종 책임이 채널 운영과 개선 제안에 있으면 디지털마케팅 안에 남을 수 있지만, 분석 체계 설계와 실험 방법론 자체가 중심이면 분석 직무 경계가 강해질 수 있습니다.",
    "웹·앱 개선 업무가 많아도 마케팅 목적의 채널 운영과 전환 개선이 중심이면 디지털마케팅에 가깝지만, 요구사항 정의와 제품 개선 로드맵 관리가 중심이면 서비스기획이나 IT 기획 경계로 이동할 수 있습니다."
  ],
  summaryTemplate: "이 직무는 디지털 채널을 활용해 유입, 참여, 전환, 재방문 흐름을 설계하고 운영하는 성격이 강합니다. 실제 역할은 캠페인 기획·운영, 자사 채널 운영, 데이터 기반 최적화, 고객여정·리텐션 연계 중 어디에 무게가 실리느냐에 따라 다르게 읽힙니다. 반면 광고 효율 최적화, 콘텐츠 발행, 브랜드 메시지 관리, CRM 자동화 운영 비중이 커지면 각각 퍼포먼스마케팅, 콘텐츠마케팅, 브랜드마케팅, CRM 마케팅 경계로 읽힐 수 있습니다."
};
