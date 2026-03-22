export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "PR_COMMUNICATIONS",
  aliases: [
    "PR",
    "홍보",
    "커뮤니케이션",
    "기업 커뮤니케이션",
    "대외 커뮤니케이션",
    "언론홍보",
    "미디어 커뮤니케이션",
    "홍보 커뮤니케이션",
    "홍보PR",
    "PR 커뮤니케이션",
    "사내외 커뮤니케이션",
    "corporate communications",
    "public relations",
    "PR communications",
    "media relations",
    "communications manager",
    "corporate PR",
    "external communications"
  ],
  families: [
    {
      id: "MEDIA_RELATIONS_PR",
      label: "언론홍보·미디어릴레이션",
      aliases: [
        "언론홍보",
        "미디어 릴레이션",
        "미디어 관계",
        "언론 대응",
        "보도홍보",
        "media relations",
        "press relations",
        "press office",
        "media PR"
      ],
      strongSignals: [
        "기자 대상 보도자료 작성 및 배포",
        "언론 문의 대응과 인터뷰 조율",
        "매체별 기사화 포인트 설계",
        "기자 간담회, 미디어 브리핑, 인터뷰 세팅",
        "언론 리스트 관리와 관계 구축",
        "보도 시점과 엠바고 운영",
        "기사 모니터링과 오보·사실관계 대응"
      ],
      mediumSignals: [
        "보도자료용 메시지 다듬기",
        "기자별 관심사와 매체 성향 파악",
        "기사 노출 결과 정리와 리포팅",
        "언론행사 운영 지원",
        "보도 키트, Q&A, 팩트시트 준비"
      ],
      boundarySignals: [
        "위기 이슈 대응과 대관 조율 비중이 커지면 이슈·위기 커뮤니케이션으로 이동",
        "브랜드 캠페인 메시지 확산과 인지도 제고가 중심이면 브랜드마케팅 또는 브랜드 커뮤니케이션으로 이동",
        "임직원 대상 메시지 정렬과 조직 내 전달이 더 크면 내부 커뮤니케이션으로 이동"
      ],
      adjacentFamilies: [
        "ISSUE_CRISIS_COMMUNICATIONS",
        "CORPORATE_BRAND_COMMUNICATIONS",
        "INTERNAL_COMMUNICATIONS"
      ],
      boundaryNote: "주된 일이 기자와 매체를 상대로 기사 노출을 만들고 언론 관계를 운영하는 것이라면 이 family로 읽힙니다. 반면 이슈 통제, 브랜드 캠페인 확산, 내부 조직 메시지 정렬이 더 중요해지면 다른 family 경계가 강해집니다.",
      summaryTemplate: "이 직무는 언론과의 관계를 바탕으로 기사 노출과 보도 흐름을 설계하는 성격이 강합니다. 반면 위기 대응 비중이 커지면 이슈·위기 커뮤니케이션으로, 브랜드 캠페인 확산이 중심이면 브랜드 커뮤니케이션 경계로 읽힐 수 있습니다."
    },
    {
      id: "CORPORATE_BRAND_COMMUNICATIONS",
      label: "기업·브랜드 커뮤니케이션",
      aliases: [
        "기업 커뮤니케이션",
        "브랜드 커뮤니케이션",
        "대외 커뮤니케이션",
        "기업 홍보",
        "브랜드 PR",
        "corporate communications",
        "brand communications",
        "external communications",
        "corporate PR"
      ],
      strongSignals: [
        "기업 또는 브랜드의 대외 메시지 체계 정리",
        "보도자료 외에도 기업 소개, 공식 메시지, 스토리라인 설계",
        "브랜드 캠페인과 PR 메시지 연결",
        "대외 발표자료, 인터뷰 메시지, 공식 코멘트 작성",
        "기업의 미션, 성과, 기술력, 사회적 메시지 등을 외부 이해관계자 관점에서 정리",
        "여러 채널에서 일관된 대외 메시지 유지",
        "브랜드 인지도나 기업 이미지 제고를 위한 커뮤니케이션 기획"
      ],
      mediumSignals: [
        "홈페이지 뉴스룸, 공식 블로그, 기업 소개자료 운영",
        "행사, 어워드, 대외 발표 연계 메시지 정리",
        "브랜드·사업부와 PR 포인트 조율",
        "경영진 메시지 초안 작성",
        "대외 스토리 발굴과 사례화"
      ],
      boundarySignals: [
        "기사 노출 자체와 기자 네트워킹이 핵심이면 언론홍보·미디어릴레이션으로 이동",
        "브랜드 인지도 캠페인과 광고성 메시지 운영 비중이 커지면 브랜드마케팅으로 이동",
        "채용 브랜딩과 후보자 커뮤니케이션이 중심이면 HR 브랜딩 또는 채용마케팅 경계가 강해짐"
      ],
      adjacentFamilies: [
        "MEDIA_RELATIONS_PR",
        "ISSUE_CRISIS_COMMUNICATIONS",
        "INTERNAL_COMMUNICATIONS"
      ],
      boundaryNote: "언론 대응만이 아니라 기업이나 브랜드가 외부에 어떻게 말할지 전체 메시지 구조를 설계하는 책임이 크면 이 family로 읽힙니다. 반면 기사화 실행, 광고 캠페인 운영, 채용 브랜딩이 더 중심이면 다른 직무 경계가 강해집니다.",
      summaryTemplate: "이 직무는 기업이나 브랜드의 대외 메시지를 일관되게 설계하고 관리하는 성격이 강합니다. 반면 기자 관계와 기사화 실행이 핵심이면 언론홍보로, 광고성 브랜드 인지도 활동이 중심이면 브랜드마케팅 경계로 읽힐 수 있습니다."
    },
    {
      id: "ISSUE_CRISIS_COMMUNICATIONS",
      label: "이슈·위기 커뮤니케이션",
      aliases: [
        "이슈 커뮤니케이션",
        "위기 커뮤니케이션",
        "리스크 커뮤니케이션",
        "이슈 대응 PR",
        "위기 대응 홍보",
        "crisis communications",
        "issue management",
        "risk communications"
      ],
      strongSignals: [
        "부정 이슈 발생 시 대외 메시지 정리와 대응 시나리오 수립",
        "사실관계 확인 후 공식 입장문 작성",
        "민감 사안에 대한 언론 질의 대응",
        "법무, 경영진, 유관부서와 메시지 조율",
        "이슈 확산 경로 모니터링과 대응 우선순위 설정",
        "Q&A, 브리핑 포인트, 예상 질문 대응안 준비",
        "사건·사고·논란 상황에서 대외 커뮤니케이션 통제"
      ],
      mediumSignals: [
        "실시간 기사·커뮤니티·SNS 모니터링",
        "경영진 보고용 이슈 브리프 작성",
        "이슈 종료 후 회고와 재발 방지 커뮤니케이션 정리",
        "민감 표현 검토와 승인 프로세스 운영",
        "대응 타이밍과 채널 선택 조정"
      ],
      boundarySignals: [
        "평시 언론관계와 기사화 비중이 더 크면 언론홍보·미디어릴레이션으로 이동",
        "사내 공지와 조직 안정화 메시지 비중이 더 크면 내부 커뮤니케이션으로 이동",
        "정책기관·협회·규제 대응 비중이 커지면 대관·정책 커뮤니케이션 경계가 강해짐"
      ],
      adjacentFamilies: [
        "MEDIA_RELATIONS_PR",
        "CORPORATE_BRAND_COMMUNICATIONS",
        "INTERNAL_COMMUNICATIONS"
      ],
      boundaryNote: "평시 홍보보다 민감 이슈가 발생했을 때 어떤 메시지로 대응하고 확산을 통제할지에 책임이 크면 이 family로 읽힙니다. 반면 평시 기사화, 브랜드 메시지 설계, 내부 조직 정렬이 더 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 이슈 발생 시 대외 메시지를 정리하고 확산을 통제하는 성격이 강합니다. 반면 평시 기사화와 기자 관계 비중이 크면 언론홍보로, 사내 안정화 메시지가 더 중요하면 내부 커뮤니케이션으로 읽힐 수 있습니다."
    },
    {
      id: "INTERNAL_COMMUNICATIONS",
      label: "내부 커뮤니케이션",
      aliases: [
        "내부 커뮤니케이션",
        "사내 커뮤니케이션",
        "임직원 커뮤니케이션",
        "조직 커뮤니케이션",
        "internal communications",
        "employee communications",
        "internal comms"
      ],
      strongSignals: [
        "임직원 대상 공지, 메시지, 변화 커뮤니케이션 기획",
        "경영진 메시지의 사내 전달 방식 설계",
        "타운홀, 사내 이벤트, 조직문화 메시지 운영",
        "조직 변화, 제도 변경, 주요 발표의 내부 커뮤니케이션 실행",
        "사내 채널 운영과 구성원 메시지 도달 관리",
        "사내 FAQ, 발표문, 공지문 작성",
        "내부 구성원 관점에서 메시지 수용성 점검"
      ],
      mediumSignals: [
        "사내 뉴스레터, 인트라넷, 타운홀 콘텐츠 운영",
        "조직문화 캠페인 메시지 기획",
        "리더십 커뮤니케이션 자료 작성",
        "사내 피드백 수집과 메시지 보완",
        "중요 발표 전 사내 메시지 사전 정렬"
      ],
      boundarySignals: [
        "외부 기자 대응과 기사화 비중이 커지면 언론홍보·미디어릴레이션으로 이동",
        "채용 후보자 대상 브랜딩과 홍보 비중이 커지면 HR 브랜딩 또는 채용마케팅으로 이동",
        "이슈 대응 중 사내 안정화보다 대외 입장 통제가 더 중요하면 이슈·위기 커뮤니케이션으로 이동"
      ],
      adjacentFamilies: [
        "CORPORATE_BRAND_COMMUNICATIONS",
        "ISSUE_CRISIS_COMMUNICATIONS",
        "MEDIA_RELATIONS_PR"
      ],
      boundaryNote: "핵심 이해관계자가 기자나 대중보다 임직원이고, 조직 내 메시지 정렬과 수용성 관리가 중요하다면 이 family로 읽힙니다. 반면 대외 노출, 언론 대응, 위기 통제가 더 중심이면 다른 family 경계가 강해집니다.",
      summaryTemplate: "이 직무는 임직원에게 중요한 메시지를 이해 가능하게 전달하고 조직 내 정렬을 만드는 성격이 강합니다. 반면 외부 기사화와 기자 대응이 중심이면 언론홍보로, 위기 상황 대외 통제가 중심이면 이슈·위기 커뮤니케이션으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PR_MANAGER",
      label: "PR 매니저",
      aliases: [
        "PR 매니저",
        "홍보 매니저",
        "PR 담당",
        "public relations manager",
        "PR manager"
      ],
      family: "MEDIA_RELATIONS_PR",
      responsibilityHints: [
        "보도자료 작성과 배포",
        "기자 문의 대응과 인터뷰 조율",
        "기사화 포인트 발굴",
        "언론 관계 관리와 노출 성과 리뷰"
      ],
      levelHints: [
        "주니어는 자료 작성과 언론 응대 실행 비중이 큼",
        "시니어는 핵심 매체 관계 구축과 보도 전략 설계 비중이 큼"
      ]
    },
    {
      id: "CORPORATE_COMMUNICATIONS_MANAGER",
      label: "기업 커뮤니케이션 매니저",
      aliases: [
        "기업 커뮤니케이션 매니저",
        "대외 커뮤니케이션 매니저",
        "corporate communications manager",
        "external communications manager"
      ],
      family: "CORPORATE_BRAND_COMMUNICATIONS",
      responsibilityHints: [
        "기업·브랜드 대외 메시지 설계",
        "공식 코멘트와 발표자료 작성",
        "브랜드와 PR 메시지 정합성 조율",
        "대외 스토리 발굴과 메시지 구조화"
      ],
      levelHints: [
        "주니어는 자료 정리와 메시지 운영 지원 비중이 큼",
        "시니어는 대외 메시지 구조 설계와 경영진 커뮤니케이션 비중이 큼"
      ]
    },
    {
      id: "CRISIS_COMMUNICATIONS_MANAGER",
      label: "위기 커뮤니케이션 매니저",
      aliases: [
        "위기 커뮤니케이션 매니저",
        "이슈 대응 매니저",
        "crisis communications manager",
        "issue communications manager"
      ],
      family: "ISSUE_CRISIS_COMMUNICATIONS",
      responsibilityHints: [
        "이슈 발생 시 공식 입장과 대응안 정리",
        "법무·경영진·유관부서 메시지 조율",
        "언론 질의 대응과 확산 통제",
        "이슈 모니터링과 대응 시나리오 관리"
      ],
      levelHints: [
        "주니어는 모니터링과 자료 준비 비중이 큼",
        "시니어는 메시지 판단, 대응 우선순위 설정, 대외 통제 비중이 큼"
      ]
    },
    {
      id: "INTERNAL_COMMUNICATIONS_MANAGER",
      label: "내부 커뮤니케이션 매니저",
      aliases: [
        "내부 커뮤니케이션 매니저",
        "사내 커뮤니케이션 매니저",
        "internal communications manager",
        "employee communications manager"
      ],
      family: "INTERNAL_COMMUNICATIONS",
      responsibilityHints: [
        "임직원 대상 메시지 기획과 전달",
        "사내 공지·뉴스레터·타운홀 운영",
        "경영진 메시지 사내 확산",
        "조직 변화 커뮤니케이션 정렬"
      ],
      levelHints: [
        "주니어는 사내 채널 운영과 공지 실행 비중이 큼",
        "시니어는 변화관리 커뮤니케이션과 리더십 메시지 설계 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_AUDIENCE",
      label: "주요 대상",
      values: [
        "기자와 외부 매체",
        "외부 이해관계자와 대중",
        "민감 이슈 관련 외부 이해관계자",
        "임직원과 내부 조직"
      ]
    },
    {
      axisId: "CORE_OBJECTIVE",
      label: "핵심 목적",
      values: [
        "기사 노출과 언론 관계 구축",
        "기업·브랜드의 대외 메시지 일관성 확보",
        "이슈 확산 통제와 공식 입장 정리",
        "조직 내 메시지 정렬과 수용성 제고"
      ]
    },
    {
      axisId: "MAIN_OUTPUT",
      label: "주요 산출물",
      values: [
        "보도자료, 인터뷰 Q&A, 미디어 브리프",
        "공식 메시지, 기업 소개자료, 대외 발표문",
        "입장문, 대응 시나리오, 이슈 브리프",
        "공지문, 사내 뉴스레터, 타운홀 메시지"
      ]
    },
    {
      axisId: "BOUNDARY_PULL",
      label: "인접 직무로 기우는 방향",
      values: [
        "브랜드 인지도 캠페인과 광고 메시지가 강해지면 브랜드마케팅",
        "정책기관·협회 대응이 커지면 대관·정책 커뮤니케이션",
        "채용 후보자 커뮤니케이션이 커지면 HR 브랜딩·채용마케팅",
        "콘텐츠 발행과 채널 운영이 더 크면 콘텐츠마케팅"
      ]
    }
  ],
  adjacentFamilies: [
    "브랜드마케팅",
    "콘텐츠마케팅",
    "대관 / 정책 커뮤니케이션",
    "HR 브랜딩 / 채용마케팅",
    "CSR / ESG 커뮤니케이션",
    "경영기획",
    "법무",
    "고객경험 / VOC"
  ],
  boundaryHints: [
    "기자 네트워킹과 기사화 실행이 많아지면 PR / 커뮤니케이션 안에서도 언론홍보·미디어릴레이션으로 강하게 읽힙니다.",
    "보도자료보다 기업이나 브랜드의 공식 메시지 구조를 설계하는 비중이 커지면 기업·브랜드 커뮤니케이션 쪽으로 이동합니다.",
    "민감 이슈 발생 시 입장 정리, 질의 대응, 확산 통제 책임이 커지면 이슈·위기 커뮤니케이션으로 읽힙니다.",
    "핵심 청중이 외부가 아니라 임직원이고, 조직 변화나 주요 발표를 내부에 이해시키는 비중이 커지면 내부 커뮤니케이션으로 이동합니다.",
    "브랜드 인지도 제고를 위한 광고성 캠페인, 슬로건, 크리에이티브 운영 비중이 커지면 PR보다 브랜드마케팅 경계가 강해집니다.",
    "규제기관, 협회, 정책 이해관계자 대응 비중이 커지면 일반 PR보다 대관·정책 커뮤니케이션으로 읽히는 힘이 강해집니다.",
    "후보자 경험, 채용 메시지, 채용 브랜딩 콘텐츠 비중이 커지면 HR 브랜딩 또는 채용마케팅으로 이동할 수 있습니다."
  ],
  summaryTemplate: "이 직무는 조직이나 브랜드가 외부와 내부 이해관계자에게 어떻게 말할지를 설계하고 조율하는 성격이 강합니다. 실제 역할은 언론홍보, 기업·브랜드 메시지 관리, 이슈·위기 대응, 내부 커뮤니케이션 중 어디에 무게가 실리느냐에 따라 다르게 읽힙니다. 반면 광고성 브랜드 캠페인, 정책 대응, 채용 메시지, 상시 콘텐츠 운영 비중이 커지면 각각 브랜드마케팅, 대관, HR 브랜딩, 콘텐츠마케팅 경계로 읽힐 수 있습니다."
};
