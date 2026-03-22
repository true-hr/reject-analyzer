export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "CONTENT_MARKETING",
  aliases: [
    "콘텐츠마케팅",
    "콘텐츠 마케팅",
    "콘텐츠 기획 마케팅",
    "콘텐츠 운영 마케팅",
    "브랜드 콘텐츠 마케팅",
    "에디토리얼 마케팅",
    "editorial marketing",
    "content marketing",
    "content marketer",
    "content strategist",
    "content planning",
    "branded content marketing"
  ],
  families: [
    {
      id: "EDITORIAL_CONTENT_MARKETING",
      label: "에디토리얼·브랜드 콘텐츠 마케팅",
      aliases: [
        "에디토리얼 콘텐츠 마케팅",
        "브랜드 콘텐츠 마케팅",
        "브랜디드 콘텐츠",
        "콘텐츠 에디터 마케팅",
        "editorial content marketing",
        "brand content marketing",
        "branded content"
      ],
      strongSignals: [
        "콘텐츠 캘린더를 운영하며 아티클, 인터뷰, 인사이트형 콘텐츠를 기획한다",
        "브랜드 톤앤매너와 메시지 일관성을 기준으로 콘텐츠를 관리한다",
        "블로그, 뉴스룸, 오운드미디어 중심의 발행 체계를 운영한다",
        "브랜드 스토리, 문제의식, 전문성 전달을 목표로 주제를 선정한다",
        "콘텐츠 성과를 조회수만이 아니라 체류시간, 완독률, 브랜드 반응으로 본다",
        "사내 전문가, 제품팀, 리더 인터뷰를 바탕으로 콘텐츠를 제작한다"
      ],
      mediumSignals: [
        "시리즈형 아티클이나 캠페인 연계 콘텐츠를 반복 발행한다",
        "카피, 헤드라인, 썸네일보다 메시지 구조와 서사 설계 비중이 크다",
        "SNS는 배포 채널로 활용하지만 핵심 업무는 오운드 콘텐츠 기획에 있다",
        "브랜드 인지도나 신뢰 형성을 위한 장기 콘텐츠 자산을 만든다"
      ],
      boundarySignals: [
        "리드 수집용 다운로드 자료, 전환 퍼널, 세일즈 연동 비중이 커지면 리드제너레이션 콘텐츠 마케팅으로 이동한다",
        "검색 키워드 구조화와 검색 유입 최적화 비중이 커지면 SEO 콘텐츠 마케팅으로 이동한다",
        "채널 반응 운영과 게시물 제작 반복 비중이 커지면 디지털마케팅 또는 소셜 운영 경계로 이동한다",
        "비주얼 결과물 제작 자체가 핵심이면 콘텐츠디자인 또는 영상디자인 경계가 강해진다"
      ],
      adjacentFamilies: [
        "SEO_CONTENT_MARKETING",
        "LEAD_GEN_CONTENT_MARKETING",
        "CAMPAIGN_SOCIAL_CONTENT_MARKETING"
      ],
      boundaryNote: "브랜드 메시지와 전문성 전달을 위해 에디토리얼 관점으로 콘텐츠를 설계하면 이 family로 읽힙니다. 반면 검색 유입, 리드 확보, 채널 반응 운영이 더 중요해지면 다른 family로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 브랜드의 메시지와 관점을 콘텐츠로 축적하는 에디토리얼·브랜드 콘텐츠 마케팅 성격이 강합니다. 반면 검색 최적화나 리드 확보 비중이 커지면 다른 콘텐츠마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "SEO_CONTENT_MARKETING",
      label: "SEO·검색유입 중심 콘텐츠 마케팅",
      aliases: [
        "SEO 콘텐츠 마케팅",
        "검색엔진 최적화 콘텐츠",
        "검색유입 콘텐츠 마케팅",
        "SEO content marketing",
        "organic content marketing",
        "search content"
      ],
      strongSignals: [
        "키워드 리서치 기반으로 콘텐츠 주제를 선정한다",
        "검색 의도에 맞춰 아티클 구조, 제목, 메타 요소를 설계한다",
        "오가닉 트래픽, 검색순위, 유입 키워드 확장을 주요 성과로 본다",
        "콘텐츠를 허브-클러스터 구조나 시리즈 구조로 운영한다",
        "기존 게시물 리라이트, 내부링크 개선, 검색 성과 리프레시를 반복한다",
        "검색 유입 이후 랜딩 흐름까지 고려해 콘텐츠를 배치한다"
      ],
      mediumSignals: [
        "GA, 서치콘솔, 키워드 툴 데이터를 바탕으로 주제 우선순위를 정한다",
        "블로그, 가이드, FAQ, 문제해결형 콘텐츠 비중이 높다",
        "검색어별 페이지 성과를 보고 발행/수정 우선순위를 조정한다",
        "브랜드 메시지보다 사용자 질의 해결 구조가 더 중요하게 다뤄진다"
      ],
      boundarySignals: [
        "브랜드 스토리텔링과 메시지 자산화 비중이 커지면 에디토리얼·브랜드 콘텐츠 마케팅으로 이동한다",
        "다운로드 자료나 세일즈 전환용 자산 비중이 커지면 리드제너레이션 콘텐츠 마케팅으로 이동한다",
        "광고 소재 테스트와 퍼포먼스 집행 연동 비중이 커지면 퍼포먼스마케팅 경계로 이동한다",
        "웹사이트 구조, 기술 SEO, 개발 이슈 조율이 핵심이면 디지털마케팅 또는 웹기획 경계가 강해진다"
      ],
      adjacentFamilies: [
        "EDITORIAL_CONTENT_MARKETING",
        "LEAD_GEN_CONTENT_MARKETING",
        "CAMPAIGN_SOCIAL_CONTENT_MARKETING"
      ],
      boundaryNote: "검색 유입과 검색 의도 대응이 콘텐츠 기획의 출발점이면 이 family로 읽힙니다. 반면 브랜드 서사 구축이나 세일즈 전환 자산 제작이 더 중요해지면 다른 family 쪽 성격이 강해집니다.",
      summaryTemplate: "이 직무는 검색 수요를 읽고 유입을 만드는 SEO·검색유입 중심 콘텐츠 마케팅 성격이 강합니다. 반면 브랜드 메시지 축적이나 리드 전환 자산 운영 비중이 커지면 다른 콘텐츠마케팅 경계로 해석될 수 있습니다."
    },
    {
      id: "LEAD_GEN_CONTENT_MARKETING",
      label: "리드제너레이션·전환형 콘텐츠 마케팅",
      aliases: [
        "리드젠 콘텐츠 마케팅",
        "리드 제너레이션 콘텐츠",
        "전환형 콘텐츠 마케팅",
        "세일즈 연계 콘텐츠 마케팅",
        "lead generation content marketing",
        "demand generation content",
        "conversion content marketing"
      ],
      strongSignals: [
        "백서, 웨비나, 사례집, eBook, 가이드북 등 리드 수집형 자산을 기획한다",
        "다운로드 전환율, MQL, SQL, 파이프라인 기여를 주요 성과로 본다",
        "세일즈와 협업해 고객 페인포인트 기반 콘텐츠를 설계한다",
        "랜딩페이지, CTA, 폼 전환 흐름까지 함께 본다",
        "퍼널 단계별로 도입 검토용 콘텐츠를 나눠 운영한다",
        "캠페인별 리드 품질과 후속 nurtuing 연결까지 고려한다"
      ],
      mediumSignals: [
        "제품 도입 사례, 비교 자료, 구매 검토형 콘텐츠 비중이 높다",
        "콘텐츠 하나의 조회수보다 리드 확보와 세일즈 활용도를 더 중시한다",
        "마케팅 자동화, 이메일 nurtuing, CRM 연계가 자주 붙는다",
        "행사, 웨비나, 세미나 후속 콘텐츠를 재가공한다"
      ],
      boundarySignals: [
        "검색 트래픽 확대와 키워드 운영 비중이 커지면 SEO 콘텐츠 마케팅으로 이동한다",
        "브랜드 관점과 오운드미디어 서사 구축 비중이 커지면 에디토리얼·브랜드 콘텐츠 마케팅으로 이동한다",
        "광고 집행 최적화와 매체 효율이 핵심이면 퍼포먼스마케팅 경계로 이동한다",
        "영업 제안서, 제안 PT, 입찰 문서 비중이 커지면 제안영업 또는 사업개발 경계가 강해진다"
      ],
      adjacentFamilies: [
        "SEO_CONTENT_MARKETING",
        "EDITORIAL_CONTENT_MARKETING",
        "CAMPAIGN_SOCIAL_CONTENT_MARKETING"
      ],
      boundaryNote: "콘텐츠가 관심 유발보다 리드 확보와 세일즈 전환 지원에 더 직접적으로 연결되면 이 family로 읽힙니다. 반면 검색 유입 확대나 브랜드 자산화 목적이 더 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 콘텐츠를 통해 잠재고객을 확보하고 전환을 돕는 리드제너레이션·전환형 성격이 강합니다. 반면 검색 유입 확대나 브랜드 메시지 축적 비중이 커지면 다른 콘텐츠마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "CAMPAIGN_SOCIAL_CONTENT_MARKETING",
      label: "캠페인·채널운영형 콘텐츠 마케팅",
      aliases: [
        "캠페인 콘텐츠 마케팅",
        "채널운영형 콘텐츠 마케팅",
        "소셜 콘텐츠 마케팅",
        "SNS 콘텐츠 마케팅",
        "campaign content marketing",
        "social content marketing",
        "channel content marketing"
      ],
      strongSignals: [
        "캠페인 목적에 맞춰 채널별 게시물, 시리즈물, 숏폼 콘텐츠를 기획한다",
        "인스타그램, 유튜브, 링크드인, 블로그 등 채널 반응을 보며 운영한다",
        "도달, 참여율, 저장, 공유, 채널 성장 등 반응 지표를 주요 성과로 본다",
        "시즌성 캠페인, 런칭 캠페인, 프로모션 메시지에 맞춰 콘텐츠를 묶어 운영한다",
        "콘텐츠 소재를 반복 테스트하며 채널별 포맷을 조정한다",
        "제작자, 디자이너, 영상팀, 외부 파트너와 협업해 발행 속도를 맞춘다"
      ],
      mediumSignals: [
        "카피, 썸네일, 훅, 업로드 타이밍 등 채널 실행 요소를 자주 조정한다",
        "실시간 반응이나 커뮤니티 이슈를 반영해 콘텐츠를 수정한다",
        "단일 대형 자산보다 다수의 발행물 운영 경험이 강조된다",
        "브랜드 캠페인과 디지털 채널 운영이 섞여 있다"
      ],
      boundarySignals: [
        "채널 운영보다 브랜드 메시지와 장기 서사 설계 비중이 커지면 에디토리얼·브랜드 콘텐츠 마케팅으로 이동한다",
        "유료 매체 효율과 광고 예산 최적화 비중이 커지면 퍼포먼스마케팅 또는 디지털마케팅으로 이동한다",
        "검색 의도 대응과 검색 유입 확보 비중이 커지면 SEO 콘텐츠 마케팅으로 이동한다",
        "커뮤니티 응대와 운영 정책 비중이 커지면 커뮤니티운영 경계가 강해진다"
      ],
      adjacentFamilies: [
        "EDITORIAL_CONTENT_MARKETING",
        "SEO_CONTENT_MARKETING",
        "LEAD_GEN_CONTENT_MARKETING"
      ],
      boundaryNote: "콘텐츠가 채널 운영과 캠페인 실행의 재료로 빠르게 기획·배포되면 이 family로 읽힙니다. 반면 장기 브랜드 자산 축적, 검색 유입 설계, 리드 전환 자산 운영이 중심이 되면 다른 family 쪽으로 이동합니다.",
      summaryTemplate: "이 직무는 채널과 캠페인 맥락에서 콘텐츠를 빠르게 기획하고 운영하는 성격이 강합니다. 반면 장기 브랜드 자산화나 검색·전환 설계 비중이 커지면 다른 콘텐츠마케팅 경계로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CONTENT_MARKETER",
      label: "콘텐츠 마케터",
      aliases: [
        "콘텐츠 마케터",
        "content marketer"
      ],
      family: "EDITORIAL_CONTENT_MARKETING",
      responsibilityHints: [
        "콘텐츠 주제 발굴 및 캘린더 운영",
        "브랜드 메시지에 맞는 발행물 기획",
        "오운드미디어 콘텐츠 제작 및 관리",
        "콘텐츠 성과 리뷰와 다음 발행 주제 조정"
      ],
      levelHints: [
        "주니어는 발행 운영과 자료조사, 초안 작성 비중이 크다",
        "시니어는 메시지 구조 설계와 콘텐츠 포트폴리오 운영 비중이 크다"
      ]
    },
    {
      id: "CONTENT_STRATEGIST",
      label: "콘텐츠 전략 담당",
      aliases: [
        "콘텐츠 전략",
        "콘텐츠 전략 담당",
        "content strategist"
      ],
      family: "EDITORIAL_CONTENT_MARKETING",
      responsibilityHints: [
        "콘텐츠 방향성과 시리즈 구조 설계",
        "브랜드·고객 관점 연결",
        "채널별 역할 정의",
        "장기 콘텐츠 자산 설계"
      ],
      levelHints: [
        "주니어는 실행 지원과 리서치 중심이다",
        "시니어는 메시지 체계와 운영 원칙 설계 비중이 크다"
      ]
    },
    {
      id: "SEO_CONTENT_MARKETER",
      label: "SEO 콘텐츠 마케터",
      aliases: [
        "SEO 콘텐츠 마케터",
        "오가닉 콘텐츠 마케터",
        "seo content marketer"
      ],
      family: "SEO_CONTENT_MARKETING",
      responsibilityHints: [
        "키워드 리서치와 검색 의도 분석",
        "검색형 콘텐츠 기획 및 리라이트",
        "오가닉 유입 성과 분석",
        "내부링크와 콘텐츠 구조 개선"
      ],
      levelHints: [
        "주니어는 키워드 맵핑과 콘텐츠 운영 비중이 크다",
        "시니어는 정보 구조 설계와 검색 성장 전략 비중이 크다"
      ]
    },
    {
      id: "LEAD_CONTENT_MARKETER",
      label: "리드제너레이션 콘텐츠 마케터",
      aliases: [
        "리드젠 콘텐츠 마케터",
        "전환형 콘텐츠 마케터",
        "lead gen content marketer"
      ],
      family: "LEAD_GEN_CONTENT_MARKETING",
      responsibilityHints: [
        "다운로드 자산과 랜딩페이지 기획",
        "퍼널 단계별 콘텐츠 설계",
        "세일즈 협업형 사례집·웨비나 운영",
        "리드 품질과 전환 흐름 분석"
      ],
      levelHints: [
        "주니어는 자산 제작 운영과 캠페인 실행 비중이 크다",
        "시니어는 퍼널 구조 설계와 세일즈 연계 비중이 크다"
      ]
    },
    {
      id: "SOCIAL_CONTENT_MARKETER",
      label: "소셜 콘텐츠 마케터",
      aliases: [
        "소셜 콘텐츠 마케터",
        "SNS 콘텐츠 마케터",
        "social content marketer"
      ],
      family: "CAMPAIGN_SOCIAL_CONTENT_MARKETING",
      responsibilityHints: [
        "채널별 게시물 기획과 발행 운영",
        "캠페인 메시지에 맞는 소재 기획",
        "채널 반응 분석과 포맷 조정",
        "디자인·영상 협업 통한 제작 관리"
      ],
      levelHints: [
        "주니어는 제작 운영과 게시물 관리 비중이 크다",
        "시니어는 채널 전략과 캠페인 메시지 구조화 비중이 크다"
      ]
    },
    {
      id: "EDITORIAL_MANAGER",
      label: "콘텐츠 에디토리얼 매니저",
      aliases: [
        "콘텐츠 에디터",
        "에디토리얼 매니저",
        "editorial manager"
      ],
      family: "EDITORIAL_CONTENT_MARKETING",
      responsibilityHints: [
        "발행 품질 기준과 톤앤매너 관리",
        "인터뷰형·인사이트형 콘텐츠 기획",
        "필진·내부 이해관계자 조율",
        "시리즈 콘텐츠 운영"
      ],
      levelHints: [
        "주니어는 초안 편집과 발행 운영 비중이 크다",
        "시니어는 편집 방향성과 브랜드 내러티브 설계 비중이 크다"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_OUTCOME",
      label: "주요 성과 목표",
      values: [
        "브랜드 메시지 축적",
        "검색 유입 확대",
        "리드 확보와 전환 지원",
        "채널 반응과 캠페인 실행"
      ]
    },
    {
      axisId: "CONTENT_ASSET_TYPE",
      label: "주력 콘텐츠 자산 유형",
      values: [
        "아티클·인사이트형 오운드 콘텐츠",
        "검색형 가이드·FAQ·블로그",
        "백서·웨비나·사례집·랜딩 자산",
        "소셜 게시물·숏폼·캠페인 소재"
      ]
    },
    {
      axisId: "CHANNEL_DEPENDENCY",
      label: "채널 의존도",
      values: [
        "오운드미디어 중심",
        "검색 플랫폼 중심",
        "세일즈·CRM 연동 중심",
        "소셜·캠페인 채널 중심"
      ]
    },
    {
      axisId: "MEASUREMENT_STYLE",
      label: "성과 측정 방식",
      values: [
        "체류·완독·브랜드 반응 중심",
        "오가닉 유입·검색순위 중심",
        "리드·전환·파이프라인 기여 중심",
        "도달·참여·채널 성장 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "브랜드마케팅",
    "퍼포먼스마케팅",
    "디지털마케팅",
    "CRM 마케팅",
    "PR / 커뮤니케이션",
    "서비스기획",
    "콘텐츠디자인",
    "커뮤니티운영"
  ],
  boundaryHints: [
    "브랜드 관점과 에디토리얼 품질이 중심이면 에디토리얼·브랜드 콘텐츠 마케팅으로 읽힙니다.",
    "검색 키워드와 오가닉 유입 확대 비중이 커지면 SEO·검색유입 중심으로 이동합니다.",
    "다운로드 자산, 랜딩페이지, MQL·SQL 같은 전환 지표 비중이 커지면 리드제너레이션·전환형으로 이동합니다.",
    "채널 반응, 게시물 운영, 캠페인 소재 테스트 비중이 커지면 캠페인·채널운영형으로 이동합니다.",
    "광고 예산 집행과 매체 효율 최적화가 핵심이 되면 퍼포먼스마케팅 또는 디지털마케팅 경계가 강해집니다.",
    "언론 대응, 대외 메시지 관리, 보도자료 중심이면 PR / 커뮤니케이션 경계로 읽힙니다.",
    "콘텐츠 제작물의 시각 결과물 구현 자체가 핵심이면 콘텐츠디자인 또는 영상디자인 쪽으로 경계가 이동합니다."
  ],
  summaryTemplate: "이 직무는 콘텐츠를 통해 고객의 관심과 이해를 만들고, 브랜드·유입·전환 중 어느 목표에 더 가깝게 기여하는지에 따라 성격이 갈립니다. 같은 콘텐츠마케팅이라도 에디토리얼 자산을 쌓는 역할인지, 검색 유입을 키우는 역할인지, 리드를 만드는 역할인지, 채널 반응을 운영하는 역할인지에 따라 실제 작동 방식이 달라집니다. 반면 광고 효율 최적화나 PR, 디자인 제작 자체의 비중이 커지면 인접 직무 경계로 읽힐 수 있습니다."
};
