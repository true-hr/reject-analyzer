export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "BRAND_MARKETING",
  aliases: [
    "브랜드마케팅",
    "브랜드 마케팅",
    "브랜드 마케터",
    "브랜드 담당",
    "브랜드 담당자",
    "브랜드 매니저",
    "브랜드 기획",
    "브랜드 캠페인",
    "브랜드 커뮤니케이션",
    "브랜드 전략",
    "brand marketing",
    "brand marketer",
    "brand manager",
    "brand communications",
    "brand strategy",
    "brand campaign"
  ],
  families: [
    {
      id: "BRAND_STRATEGY_PLANNING",
      label: "브랜드 전략·기획",
      aliases: [
        "브랜드 전략",
        "브랜드 기획",
        "브랜드 포지셔닝",
        "브랜드 아키텍처",
        "브랜드 전략기획",
        "brand strategy",
        "brand planning",
        "brand positioning"
      ],
      strongSignals: [
        "브랜드 포지셔닝 정의 및 리프레시",
        "타깃 세그먼트와 핵심 메시지 설계",
        "브랜드 미션·가치·톤앤매너 정리",
        "브랜드 캠페인 이전 단계의 전략 방향 수립",
        "브랜드 트래킹 지표와 인식 조사 결과를 바탕으로 전략 수정",
        "경쟁 브랜드 대비 차별점과 카테고리 내 브랜드 역할 정의",
        "신규 브랜드 런칭 또는 리브랜딩 방향 기획"
      ],
      mediumSignals: [
        "브랜드 가이드 문서 운영",
        "브랜드 연간 로드맵 수립",
        "브랜드 핵심 자산 관리",
        "브랜드 메시지 일관성 점검",
        "소비자 인사이트 기반 메시지 우선순위 조정"
      ],
      boundarySignals: [
        "광고 성과지표와 매체 효율 최적화 비중이 커지면 퍼포먼스마케팅으로 이동",
        "제품 기능·세일즈 포인트 정의 비중이 커지면 상품마케팅(PMM)으로 이동",
        "시각 아이덴티티 제작과 크리에이티브 산출물 디렉션이 중심이면 BX·브랜드디자인 경계가 강해짐"
      ],
      adjacentFamilies: [
        "BRAND_CAMPAIGN_COMMUNICATIONS",
        "BRAND_EXPERIENCE_ACTIVATION",
        "BRAND_INSIGHT_MANAGEMENT"
      ],
      boundaryNote: "브랜드가 시장에서 어떤 의미로 인식되어야 하는지 정의하고 방향을 정하는 책임이 크면 이 family로 읽힙니다. 반면 집행 효율, 제품 메시지, 시각 디자인 제작 비중이 더 커지면 다른 family나 인접 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 브랜드의 포지셔닝과 메시지 방향을 설계하는 성격이 강합니다. 반면 매체 효율 최적화가 중심이면 퍼포먼스마케팅으로, 제품 가치 제안 정리가 더 커지면 상품마케팅(PMM) 경계로 읽힐 수 있습니다."
    },
    {
      id: "BRAND_CAMPAIGN_COMMUNICATIONS",
      label: "브랜드 캠페인·커뮤니케이션",
      aliases: [
        "브랜드 캠페인",
        "브랜드 커뮤니케이션",
        "브랜드 광고",
        "통합 캠페인",
        "IMC",
        "브랜드 커뮤니케이션 기획",
        "brand campaign",
        "brand communications",
        "integrated campaign",
        "IMC"
      ],
      strongSignals: [
        "브랜드 캠페인 컨셉 기획 및 실행",
        "연간 또는 시즌별 브랜드 커뮤니케이션 플랜 수립",
        "광고대행사·제작사와 협업해 메시지와 크리에이티브 방향 관리",
        "캠페인별 브랜드 메시지 일관성 관리",
        "온오프라인 채널을 묶은 통합 커뮤니케이션 운영",
        "런칭 캠페인, 인지도 캠페인, 이미지 제고 캠페인 주도",
        "캠페인 종료 후 도달·반응·브랜드 인식 변화 리뷰"
      ],
      mediumSignals: [
        "촬영, 제작, 매체 협업 일정 관리",
        "슬로건·카피 방향 정리",
        "브랜드 영상·비주얼 산출물 피드백",
        "행사·프로모션과 연계한 메시지 확장",
        "내부 유관부서와 캠페인 일정 조율"
      ],
      boundarySignals: [
        "언론 대응과 대외 메시지 관리 비중이 커지면 PR / 커뮤니케이션으로 이동",
        "채널별 CAC·ROAS·전환율 최적화가 주목적이면 퍼포먼스마케팅으로 이동",
        "상시 콘텐츠 제작 캘린더와 운영 비중이 커지면 콘텐츠마케팅으로 이동"
      ],
      adjacentFamilies: [
        "BRAND_STRATEGY_PLANNING",
        "BRAND_EXPERIENCE_ACTIVATION",
        "BRAND_INSIGHT_MANAGEMENT"
      ],
      boundaryNote: "브랜드 전략을 실제 대중 커뮤니케이션으로 풀어내고 캠페인 단위로 실행하는 책임이 크면 이 family로 읽힙니다. 반면 언론관계, 퍼포먼스 효율, 상시 콘텐츠 운영이 중심이면 다른 직무 경계가 더 강해집니다.",
      summaryTemplate: "이 직무는 브랜드 전략을 캠페인과 커뮤니케이션으로 구현하는 성격이 강합니다. 반면 언론 대응 비중이 커지면 PR로, 전환 효율 최적화가 중심이면 퍼포먼스마케팅으로 읽힐 수 있습니다."
    },
    {
      id: "BRAND_EXPERIENCE_ACTIVATION",
      label: "브랜드 경험·활성화",
      aliases: [
        "브랜드 활성화",
        "브랜드 액티베이션",
        "브랜드 경험",
        "브랜드 익스피리언스",
        "오프라인 브랜드 마케팅",
        "consumer activation",
        "brand activation",
        "brand experience"
      ],
      strongSignals: [
        "오프라인 행사, 팝업, 체험형 캠페인 기획 및 운영",
        "소비자 접점에서 브랜드 경험 설계",
        "프로모션과 이벤트를 통해 브랜드 인지도와 선호도 제고",
        "현장 운영 파트너, 공간, 제작물 관리",
        "브랜드 접점별 경험 요소와 고객 반응 관리",
        "캠퍼스, 리테일, 전시, 체험존 등 현장 중심 activation 운영",
        "브랜드 경험 이후 반응 수집과 후속 확산 기획"
      ],
      mediumSignals: [
        "체험단, 샘플링, 현장 프로모션 운영",
        "브랜드 굿즈와 현장 메시지 기획",
        "협업 브랜드와 공동 이벤트 운영",
        "현장 동선과 체험 포인트 설계",
        "행사 운영사 및 유통 현장 협업"
      ],
      boundarySignals: [
        "상시 SNS·아티클·영상 발행 운영이 더 크면 콘텐츠마케팅으로 이동",
        "유통 현장 판촉과 매출 견인 비중이 커지면 영업 프로모션 또는 유통마케팅 경계가 강해짐",
        "대외 평판과 언론 노출 관리가 중심이면 PR / 커뮤니케이션으로 이동"
      ],
      adjacentFamilies: [
        "BRAND_CAMPAIGN_COMMUNICATIONS",
        "BRAND_STRATEGY_PLANNING",
        "BRAND_INSIGHT_MANAGEMENT"
      ],
      boundaryNote: "광고 메시지 자체보다 소비자가 브랜드를 직접 경험하는 접점을 설계하고 활성화하는 책임이 크면 이 family로 읽힙니다. 반면 콘텐츠 운영, 유통 판촉, 언론 노출 관리가 중심이면 다른 경계가 더 강합니다.",
      summaryTemplate: "이 직무는 브랜드를 소비자 접점에서 체험하게 만들고 반응을 끌어내는 성격이 강합니다. 반면 상시 콘텐츠 운영이 중심이면 콘텐츠마케팅으로, 유통 현장 매출 견인이 커지면 영업성 프로모션 경계로 읽힐 수 있습니다."
    },
    {
      id: "BRAND_INSIGHT_MANAGEMENT",
      label: "브랜드 인사이트·관리",
      aliases: [
        "브랜드 관리",
        "브랜드 인사이트",
        "브랜드 트래킹",
        "브랜드 성과관리",
        "브랜드 자산 관리",
        "brand management",
        "brand insights",
        "brand tracking"
      ],
      strongSignals: [
        "브랜드 인지도·선호도·연상 조사 운영",
        "브랜드 트래킹 지표 설계와 모니터링",
        "브랜드 자산 일관성 점검과 관리",
        "캠페인 이후 브랜드 인식 변화 분석",
        "소비자 조사와 VOC를 바탕으로 브랜드 개선 포인트 도출",
        "브랜드 사용 가이드와 표현 기준 관리",
        "브랜드 관련 내부 요청 검토와 승인"
      ],
      mediumSignals: [
        "시장조사 결과 정리 및 해석",
        "브랜드 KPI 리포트 작성",
        "메시지·표현물 적합성 검토",
        "브랜드 리스크 사전 점검",
        "브랜드 관련 내부 교육"
      ],
      boundarySignals: [
        "조사 설계와 리서치 프로젝트 자체가 핵심이면 시장조사 / 마케팅리서치로 이동",
        "전략 방향 수립 비중이 커지면 브랜드 전략·기획으로 이동",
        "대외 이슈 대응과 평판 관리가 더 중요하면 PR / 커뮤니케이션으로 이동"
      ],
      adjacentFamilies: [
        "BRAND_STRATEGY_PLANNING",
        "BRAND_CAMPAIGN_COMMUNICATIONS",
        "BRAND_EXPERIENCE_ACTIVATION"
      ],
      boundaryNote: "브랜드를 새로 만들어내는 것보다 현재 브랜드가 어떻게 인식되고 일관되게 운영되는지 관리하는 책임이 크면 이 family로 읽힙니다. 반면 조사 자체 전문성, 전략 수립, 대외 이슈 대응 비중이 커지면 다른 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 브랜드 인식과 자산을 지속적으로 점검하고 관리하는 성격이 강합니다. 반면 조사 방법론 자체가 중심이면 마케팅리서치로, 방향 설정 비중이 더 크면 브랜드 전략·기획으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "BRAND_MANAGER",
      label: "브랜드 매니저",
      aliases: [
        "브랜드 매니저",
        "브랜드 담당",
        "brand manager"
      ],
      family: "BRAND_STRATEGY_PLANNING",
      responsibilityHints: [
        "브랜드 포지셔닝과 핵심 메시지 정리",
        "브랜드 연간 방향성과 우선순위 설정",
        "브랜드 자산과 가이드 관리",
        "캠페인과 유관부서 메시지 정합성 점검"
      ],
      levelHints: [
        "주니어는 운영 정리와 메시지 정합성 점검 비중이 큼",
        "시니어는 포지셔닝 정의와 리브랜딩 방향 설정 비중이 큼"
      ]
    },
    {
      id: "BRAND_COMMUNICATIONS_MANAGER",
      label: "브랜드 커뮤니케이션 매니저",
      aliases: [
        "브랜드 커뮤니케이션 매니저",
        "캠페인 매니저",
        "IMC 매니저",
        "brand communications manager",
        "campaign manager"
      ],
      family: "BRAND_CAMPAIGN_COMMUNICATIONS",
      responsibilityHints: [
        "브랜드 캠페인 기획과 실행",
        "광고대행사·제작사 협업",
        "메시지와 크리에이티브 방향 관리",
        "캠페인 결과 리뷰와 다음 액션 도출"
      ],
      levelHints: [
        "주니어는 실행 운영과 일정 관리 비중이 큼",
        "시니어는 캠페인 컨셉과 통합 커뮤니케이션 설계 비중이 큼"
      ]
    },
    {
      id: "BRAND_ACTIVATION_MANAGER",
      label: "브랜드 액티베이션 매니저",
      aliases: [
        "브랜드 액티베이션 매니저",
        "브랜드 경험 매니저",
        "이벤트 마케팅 매니저",
        "brand activation manager",
        "brand experience manager"
      ],
      family: "BRAND_EXPERIENCE_ACTIVATION",
      responsibilityHints: [
        "팝업·행사·체험형 캠페인 기획 운영",
        "현장 접점에서 브랜드 경험 설계",
        "운영 파트너와 예산·일정 관리",
        "현장 반응 수집과 후속 확산 기획"
      ],
      levelHints: [
        "주니어는 현장 운영과 실행 조율 비중이 큼",
        "시니어는 접점 전략과 대형 activation 설계 비중이 큼"
      ]
    },
    {
      id: "BRAND_INSIGHTS_MANAGER",
      label: "브랜드 인사이트 매니저",
      aliases: [
        "브랜드 인사이트 매니저",
        "브랜드 관리 매니저",
        "brand insights manager",
        "brand management manager"
      ],
      family: "BRAND_INSIGHT_MANAGEMENT",
      responsibilityHints: [
        "브랜드 트래킹과 인식 지표 관리",
        "소비자 조사 결과 해석",
        "브랜드 자산 일관성 점검",
        "내부 브랜드 표현 검토와 승인"
      ],
      levelHints: [
        "주니어는 리포팅과 모니터링 운영 비중이 큼",
        "시니어는 인사이트 해석과 브랜드 개선 아젠다 도출 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_OBJECTIVE",
      label: "주요 목적",
      values: [
        "브랜드 포지셔닝과 방향 설정",
        "브랜드 메시지의 대중 커뮤니케이션 실행",
        "소비자 접점에서의 브랜드 경험 강화",
        "브랜드 인식과 자산의 지속 관리"
      ]
    },
    {
      axisId: "WORK_OUTPUT",
      label: "주요 산출물",
      values: [
        "브랜드 전략서·메시지 구조·가이드",
        "캠페인 플랜·광고물 방향·커뮤니케이션 캘린더",
        "이벤트·팝업·체험 설계안과 운영안",
        "브랜드 트래킹 리포트·관리 기준·검토 의견"
      ]
    },
    {
      axisId: "CHANNEL_CENTER",
      label: "활동 중심 채널",
      values: [
        "시장·소비자 인식과 내부 전략 문서",
        "광고·디지털·오프라인 통합 커뮤니케이션 채널",
        "현장·공간·체험 접점",
        "조사·모니터링·내부 검토 프로세스"
      ]
    },
    {
      axisId: "BOUNDARY_PULL",
      label: "인접 직무로 기우는 방향",
      values: [
        "매체 효율과 전환이 중요해지면 퍼포먼스마케팅",
        "상시 발행과 콘텐츠 제작이 중심이면 콘텐츠마케팅",
        "언론 대응과 평판 관리가 커지면 PR / 커뮤니케이션",
        "제품 가치 제안과 출시 메시지가 중심이면 상품마케팅(PMM)"
      ]
    }
  ],
  adjacentFamilies: [
    "퍼포먼스마케팅",
    "콘텐츠마케팅",
    "디지털마케팅",
    "상품마케팅(PMM)",
    "PR / 커뮤니케이션",
    "시장조사 / 마케팅리서치",
    "BX / 브랜드디자인"
  ],
  boundaryHints: [
    "브랜드 인지도나 선호도보다 CAC, ROAS, 전환율 개선 책임이 커지면 브랜드마케팅보다 퍼포먼스마케팅으로 읽힙니다.",
    "캠페인 단위 기획보다 상시 발행 콘텐츠, 채널 운영, 에디토리얼 캘린더 관리가 많아지면 콘텐츠마케팅 경계가 강해집니다.",
    "브랜드 메시지 전달보다 언론 대응, 이슈 관리, 대외 평판 통제가 중요해지면 PR / 커뮤니케이션으로 이동합니다.",
    "브랜드 서사보다 제품 기능, 세일즈 포인트, 출시 메시지 정의 비중이 커지면 상품마케팅(PMM)으로 읽힙니다.",
    "전략 수립보다 시각 아이덴티티 제작과 크리에이티브 산출물 완성 책임이 커지면 BX / 브랜드디자인 경계가 강해집니다.",
    "오프라인 체험과 이벤트 운영이 많아도 핵심 목적이 브랜드 경험 설계라면 브랜드마케팅 안에 남을 수 있지만, 현장 판촉과 매출 견인이 더 크면 영업성 프로모션 경계로 이동할 수 있습니다."
  ],
  summaryTemplate: "이 직무는 브랜드가 시장과 소비자에게 어떤 의미로 인식되도록 만들지 설계하고 실행하는 성격이 강합니다. 실제 역할은 전략 수립, 캠페인 커뮤니케이션, 브랜드 경험 활성화, 인사이트 관리 중 어디에 무게가 실리느냐에 따라 다르게 읽힙니다. 반면 전환 효율 최적화, 상시 콘텐츠 운영, 언론 대응, 제품 메시지 정의 비중이 커지면 각각 퍼포먼스마케팅, 콘텐츠마케팅, PR, 상품마케팅(PMM) 경계로 읽힐 수 있습니다."
};
