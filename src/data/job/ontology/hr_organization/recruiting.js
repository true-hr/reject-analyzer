export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "RECRUITING",
  aliases: [
    "채용",
    "채용담당",
    "채용 담당",
    "채용 매니저",
    "채용 운영",
    "채용기획",
    "인재채용",
    "인재 확보",
    "리크루터",
    "리쿠르터",
    "사내 리크루터",
    "corporate recruiter",
    "recruiter",
    "talent acquisition",
    "TA",
    "talent acquisition partner",
    "talent partner",
    "hiring",
    "staffing"
  ],
  families: [
    {
      id: "FULL_CYCLE_RECRUITING",
      label: "전주기 채용",
      aliases: [
        "전주기 채용",
        "채용 전반 운영",
        "end-to-end recruiting",
        "full cycle recruiting",
        "full lifecycle recruiting"
      ],
      strongSignals: [
        "채용 오픈부터 입사 확정까지 전체 프로세스를 직접 관리",
        "현업과 채용 요건을 조율하고 JD를 구체화",
        "서류 검토, 면접 조율, 후보자 커뮤니케이션을 직접 수행",
        "오퍼 협의와 입사 일정 조율까지 책임",
        "채용 진행 현황을 hiring manager와 수시로 리뷰",
        "포지션별 파이프라인 상태를 보고하고 채용 완료까지 드라이브"
      ],
      mediumSignals: [
        "채용 채널 운영과 후보자 소싱을 병행",
        "면접관 일정 조율과 평가 회수 관리",
        "채용 단계별 전환율을 점검",
        "후보자 경험 관련 이슈를 직접 해결",
        "여러 포지션을 동시 관리하며 우선순위를 조정"
      ],
      boundarySignals: [
        "직접 소싱 비중이 크게 높아지고 outbound 발굴 역량이 핵심이면 소싱 중심 채용으로 이동",
        "프로세스 설계, ATS 운영, 데이터 리포팅 비중이 커지면 채용 운영·프로세스 기획으로 이동",
        "브랜딩 캠페인, 콘텐츠, 행사 운영 비중이 커지면 채용 브랜딩으로 이동"
      ],
      adjacentFamilies: [
        "SOURCING_FOCUSED_RECRUITING",
        "RECRUITING_OPERATIONS",
        "EMPLOYER_BRANDING_RECRUITING"
      ],
      boundaryNote: "포지션을 실제로 닫기 위해 현업과 후보자 사이를 끝까지 조율하는 책임이 크면 전주기 채용으로 읽힙니다. 반면 후보자 발굴, 운영 설계, 브랜딩 활동 중 어느 한쪽 비중이 커지면 다른 family 경계가 강해집니다.",
      summaryTemplate: "이 직무는 채용 오픈부터 오퍼·입사 조율까지 전체 과정을 직접 관리하는 전주기 채용 성격이 강합니다. 반면 직접 소싱, 채용 운영 설계, 브랜딩 활동 비중이 더 커지면 다른 채용 family로 읽힐 수 있습니다."
    },
    {
      id: "SOURCING_FOCUSED_RECRUITING",
      label: "소싱 중심 채용",
      aliases: [
        "소싱 리크루터",
        "채용 소싱",
        "인재 발굴",
        "researcher",
        "talent sourcer",
        "sourcing recruiter",
        "candidate sourcing"
      ],
      strongSignals: [
        "링크드인, 원티드, 네트워크 등에서 후보자를 직접 발굴",
        "잠재 후보자 롱리스트와 숏리스트를 구성",
        "아웃바운드 메시지 작성과 1차 접촉을 지속 수행",
        "시장 맵핑과 타깃 회사 리스트업을 통해 후보군을 설계",
        "희소 직무나 경력직 포지션 중심으로 후보자 풀을 확장",
        "응답률, 인터뷰 전환율 등 소싱 퍼널을 관리"
      ],
      mediumSignals: [
        "후보자 DB 정리와 태깅",
        "인재풀 구축과 재접촉 운영",
        "포지션별 타깃 인재 정의",
        "초기 콜 또는 사전 스크리닝 수행",
        "채용 담당자에게 후보자 시장 정보를 제공"
      ],
      boundarySignals: [
        "후보자 평가 조율, 오퍼 협상, 현업 조율까지 직접 맡으면 전주기 채용으로 이동",
        "채용 채널 운영, ATS 관리, 프로세스 정비 비중이 커지면 채용 운영·프로세스 기획으로 이동",
        "대외 커뮤니티, 콘텐츠, 이벤트를 통한 유입 확대 비중이 커지면 채용 브랜딩으로 이동"
      ],
      adjacentFamilies: [
        "FULL_CYCLE_RECRUITING",
        "RECRUITING_OPERATIONS",
        "EMPLOYER_BRANDING_RECRUITING"
      ],
      boundaryNote: "희소 인재를 직접 찾아내고 접촉해 파이프라인을 여는 역할이 중심이면 소싱 중심 채용으로 읽힙니다. 반면 포지션 전체 마감 책임이나 운영 체계 설계 책임이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 필요한 인재를 시장에서 직접 찾아내고 접촉해 채용 파이프라인을 여는 성격이 강합니다. 반면 채용 마감까지 전주기를 책임지거나 운영 체계 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "RECRUITING_OPERATIONS",
      label: "채용 운영·프로세스 기획",
      aliases: [
        "채용 운영",
        "채용 오퍼레이션",
        "채용 프로세스 기획",
        "채용 coordinator",
        "recruiting operations",
        "recruiting coordinator",
        "TA operations"
      ],
      strongSignals: [
        "ATS 운영, 공고 게시, 전형 단계 세팅 등 채용 시스템을 관리",
        "면접 일정 조율, 평가 회수, 안내 메일 등 운영 흐름을 정교하게 관리",
        "채용 프로세스 표준화와 병목 구간 개선을 주도",
        "채용 지표 리포트, 전환율, 리드타임 등을 관리",
        "면접관 운영 기준, 오퍼 승인 흐름, 문서 관리 체계를 정비",
        "대량 채용이나 동시다발 포지션의 운영 품질을 안정화"
      ],
      mediumSignals: [
        "후보자 문의 대응과 운영 CS 처리",
        "채용 관련 계약·서류·입사 전 안내 관리",
        "채용 대시보드 정리",
        "프로세스 가이드 문서화",
        "협업 부서와 전형 운영 캘린더 정렬"
      ],
      boundarySignals: [
        "후보자 발굴과 설득, 포지션 마감 책임이 커지면 전주기 채용으로 이동",
        "시장 맵핑과 outbound 발굴 비중이 커지면 소싱 중심 채용으로 이동",
        "브랜드 메시지, 콘텐츠, 채용 행사 기획 비중이 커지면 채용 브랜딩으로 이동"
      ],
      adjacentFamilies: [
        "FULL_CYCLE_RECRUITING",
        "SOURCING_FOCUSED_RECRUITING",
        "EMPLOYER_BRANDING_RECRUITING"
      ],
      boundaryNote: "채용의 성패를 후보자 설득보다 프로세스 품질, 운영 정합성, 리드타임 관리로 개선하는 역할이면 채용 운영·프로세스 기획으로 읽힙니다. 반면 직접 채용 마감이나 시장 발굴 책임이 커지면 다른 family와 경계가 갈립니다.",
      summaryTemplate: "이 직무는 채용이 원활하게 돌아가도록 프로세스, 시스템, 일정, 지표를 관리하는 성격이 강합니다. 반면 직접 후보자를 찾아 설득하거나 브랜드 유입을 만드는 비중이 커지면 다른 채용 family로 해석될 수 있습니다."
    },
    {
      id: "EMPLOYER_BRANDING_RECRUITING",
      label: "채용 브랜딩",
      aliases: [
        "채용 브랜딩",
        "채용 마케팅",
        "채용 홍보",
        "employer branding",
        "recruitment marketing",
        "talent brand"
      ],
      strongSignals: [
        "채용 브랜드 메시지와 콘텐츠를 기획·운영",
        "채용 페이지, SNS, 블로그, 영상 등으로 지원자 유입을 확대",
        "채용 설명회, 밋업, 커뮤니티 행사 등 대외 접점을 기획",
        "후보자 경험과 지원자 인식 개선을 위한 브랜드 과제를 추진",
        "지원자 유입 경로와 콘텐츠 성과를 분석",
        "회사 매력도와 포지션 인지도를 높이기 위한 캠페인을 운영"
      ],
      mediumSignals: [
        "채용 콘텐츠 캘린더 운영",
        "브랜드 톤앤매너 정리",
        "현업 인터뷰 콘텐츠 제작",
        "채용 채널별 유입 분석",
        "후보자 커뮤니케이션 메시지 개선"
      ],
      boundarySignals: [
        "실제 포지션 마감, 면접 조율, 오퍼 협의 책임이 커지면 전주기 채용으로 이동",
        "시스템 운영, 리드타임 관리, 전형 프로세스 정비 비중이 커지면 채용 운영·프로세스 기획으로 이동",
        "희소 인재를 직접 발굴하고 접촉하는 비중이 커지면 소싱 중심 채용으로 이동"
      ],
      adjacentFamilies: [
        "FULL_CYCLE_RECRUITING",
        "RECRUITING_OPERATIONS",
        "SOURCING_FOCUSED_RECRUITING"
      ],
      boundaryNote: "지원자를 직접 평가·마감하기보다 회사와 포지션의 매력을 시장에 전달하고 유입을 키우는 책임이 크면 채용 브랜딩으로 읽힙니다. 반면 실제 채용 프로세스 운영이나 후보자 발굴 책임이 커지면 다른 family 경계가 강해집니다.",
      summaryTemplate: "이 직무는 채용 브랜드를 만들고 지원자 유입과 인식을 개선하는 성격이 강합니다. 반면 실제 채용 마감, 프로세스 운영, 직접 소싱 비중이 커지면 다른 채용 family로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CORPORATE_RECRUITER",
      label: "사내 리크루터",
      aliases: [
        "사내 리크루터",
        "채용담당자",
        "채용 매니저",
        "corporate recruiter",
        "recruiter"
      ],
      family: "FULL_CYCLE_RECRUITING",
      responsibilityHints: [
        "채용 오픈부터 오퍼까지 전체 프로세스 관리",
        "현업과 채용 요건 정렬",
        "후보자 커뮤니케이션 및 전형 진행",
        "채용 마감 책임과 파이프라인 관리"
      ],
      levelHints: [
        "주니어는 일정 조율과 후보자 커뮤니케이션 비중이 큼",
        "시니어는 현업 설득, 우선순위 조정, 어려운 포지션 마감 책임 비중이 큼"
      ]
    },
    {
      id: "TALENT_SOURCER",
      label: "소싱 리크루터",
      aliases: [
        "소싱 리크루터",
        "인재 소서",
        "talent sourcer",
        "sourcing recruiter",
        "researcher"
      ],
      family: "SOURCING_FOCUSED_RECRUITING",
      responsibilityHints: [
        "후보자 발굴과 시장 맵핑",
        "아웃바운드 접촉과 초기 파이프라인 형성",
        "희소 인재 타깃팅",
        "소싱 퍼널 성과 관리"
      ],
      levelHints: [
        "주니어는 후보자 리서치와 리스트업 비중이 큼",
        "시니어는 타깃 시장 정의와 희소 인재 접근 전략 비중이 큼"
      ]
    },
    {
      id: "RECRUITING_COORDINATOR",
      label: "채용 코디네이터",
      aliases: [
        "채용 코디네이터",
        "채용 운영 담당",
        "recruiting coordinator",
        "TA coordinator"
      ],
      family: "RECRUITING_OPERATIONS",
      responsibilityHints: [
        "면접 일정 조율과 전형 운영",
        "후보자 안내와 운영 품질 관리",
        "ATS 및 채용 데이터 관리",
        "프로세스 병목 최소화"
      ],
      levelHints: [
        "주니어는 일정·문서·안내 운영 비중이 큼",
        "시니어는 프로세스 개선, 운영 기준 정비, 지표 관리 비중이 큼"
      ]
    },
    {
      id: "RECRUITING_OPERATIONS_MANAGER",
      label: "채용 운영 매니저",
      aliases: [
        "채용 운영 매니저",
        "recruiting operations manager",
        "TA operations manager"
      ],
      family: "RECRUITING_OPERATIONS",
      responsibilityHints: [
        "채용 프로세스 표준화",
        "ATS와 운영 체계 설계",
        "채용 지표 분석과 리드타임 개선",
        "대량 채용 운영 안정화"
      ],
      levelHints: [
        "중급 이상에서 시스템 정비와 프로세스 설계 책임이 커짐",
        "시니어는 조직 전체 채용 운영 모델을 설계하고 개선 과제를 주도"
      ]
    },
    {
      id: "EMPLOYER_BRANDING_MANAGER",
      label: "채용 브랜딩 매니저",
      aliases: [
        "채용 브랜딩 매니저",
        "채용 마케팅 담당",
        "employer branding manager",
        "recruitment marketing manager"
      ],
      family: "EMPLOYER_BRANDING_RECRUITING",
      responsibilityHints: [
        "채용 브랜드 메시지와 콘텐츠 기획",
        "지원자 유입 채널 운영",
        "채용 행사 및 대외 커뮤니티 운영",
        "브랜드 성과 측정과 개선"
      ],
      levelHints: [
        "주니어는 콘텐츠 운영과 채널 실행 비중이 큼",
        "시니어는 EVP 정리, 캠페인 방향 설정, 브랜드 전략 책임 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "HIRING_CLOSURE_OWNERSHIP",
      label: "채용 마감 책임 범위",
      values: [
        "포지션 오픈부터 오퍼까지 직접 책임",
        "초기 후보자 발굴 중심",
        "운영 품질과 리드타임 중심",
        "유입과 브랜드 인지도 중심"
      ]
    },
    {
      axisId: "CANDIDATE_PIPELINE_CREATION",
      label: "후보자 파이프라인 형성 방식",
      values: [
        "현업과 협업해 전주기 파이프라인 운영",
        "아웃바운드 소싱으로 후보자 풀 형성",
        "프로세스 관리로 전형 전환 안정화",
        "콘텐츠와 캠페인으로 유입 확대"
      ]
    },
    {
      axisId: "PRIMARY_WORK_OBJECT",
      label: "주요 작업 대상",
      values: [
        "포지션별 후보자와 hiring manager",
        "타깃 인재 시장과 후보자 풀",
        "전형 프로세스와 시스템",
        "지원자 인식과 채용 브랜드 접점"
      ]
    },
    {
      axisId: "SUCCESS_EVIDENCE",
      label: "성과를 판단하는 주된 근거",
      values: [
        "채용 완료 수와 마감 난이도",
        "응답률·인터뷰 전환율·후보자 품질",
        "리드타임·운영 정확도·전환율 개선",
        "지원자 유입·브랜드 도달·콘텐츠 반응"
      ]
    }
  ],
  adjacentFamilies: [
    "HRBP",
    "교육 / 조직개발(OD)",
    "HR 운영(HR Ops)",
    "인사기획",
    "마케팅",
    "고객·운영"
  ],
  boundaryHints: [
    "채용 마감 책임이 끝까지 붙어 있으면 전주기 채용으로 읽힙니다.",
    "희소 인재를 직접 찾아내고 접촉하는 활동이 많아지면 소싱 중심 채용으로 이동합니다.",
    "ATS, 일정 조율, 리드타임, 운영 품질 관리 비중이 커지면 채용 운영·프로세스 기획으로 이동합니다.",
    "콘텐츠, 채용 행사, 대외 메시지, 지원자 유입 확대 비중이 커지면 채용 브랜딩으로 읽힙니다.",
    "입사 이후 온보딩, 인사 데이터, 계약·문서 운영 비중이 넓어지면 HR 운영(HR Ops) 경계가 강해집니다.",
    "채용보다 조직 설계, 인력 계획, 평가·보상 연결 비중이 커지면 인사기획 또는 HRBP로 이동합니다."
  ],
  summaryTemplate: "이 직무는 필요한 인재를 정의하고 확보하는 채용 성격이 강합니다. 다만 실제 역할은 포지션 마감 책임을 지는 전주기 채용, 후보자 발굴 중심의 소싱, 프로세스와 시스템을 다루는 채용 운영, 유입과 인식을 만드는 채용 브랜딩으로 나뉘어 작동 방식이 달라집니다. 반면 입사 이후 HR 운영이나 조직 설계 책임 비중이 커지면 인접 HR 직무 경계로 읽힐 수 있습니다."
};
