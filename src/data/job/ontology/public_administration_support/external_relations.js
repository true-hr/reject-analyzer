export const JOB_ONTOLOGY_ITEM = {
  vertical: "PUBLIC_ADMINISTRATION_SUPPORT",
  subVertical: "EXTERNAL_RELATIONS",
  aliases: [
    "대외협력",
    "대외협력팀",
    "External Relations",
    "Government Relations",
    "GR",
    "대관",
    "Public Affairs",
    "Stakeholder Relations",
    "유관기관 협력",
    "파트너십 관리"
  ],
  families: [
    {
      id: "government_relations",
      label: "정부·기관 대관",
      aliases: [
        "대관",
        "Government Relations",
        "GR",
        "정책협력",
        "공공기관 협력"
      ],
      strongSignals: [
        "정부부처 또는 지자체와의 공식 커뮤니케이션 수행",
        "정책 대응 또는 규제 해석 관련 업무",
        "공공기관과의 협약 체결 및 관리",
        "입법·규제 동향 모니터링 및 대응 자료 작성"
      ],
      mediumSignals: [
        "공공사업 참여를 위한 관계 구축",
        "정책 설명자료 또는 브리핑 자료 작성",
        "기관 담당자 네트워크 유지"
      ],
      boundarySignals: [
        "언론 대응 비중이 커지면 홍보·PR로 이동",
        "사업 제휴 및 수익 연결 활동이 많아지면 파트너십 관리로 이동"
      ],
      adjacentFamilies: [
        "public_relations",
        "partnership_management"
      ],
      boundaryNote: "정부 및 공공기관과의 공식 관계와 정책 대응이 핵심입니다. 반면 언론 노출 관리나 브랜드 메시지 중심으로 이동하면 PR로, 사업적 성과 중심 협업이 늘어나면 파트너십 영역으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 정부 및 공공기관과의 관계를 구축하고 정책·규제 환경에 대응하는 성격이 강합니다. 반면 사업적 제휴나 언론 대응 비중이 커지면 다른 대외협력 영역으로 해석될 수 있습니다."
    },
    {
      id: "public_relations",
      label: "홍보·PR",
      aliases: [
        "PR",
        "홍보",
        "Public Relations",
        "언론홍보",
        "미디어 대응"
      ],
      strongSignals: [
        "언론사 및 기자 대상 커뮤니케이션 수행",
        "보도자료 작성 및 배포",
        "미디어 인터뷰 및 노출 관리",
        "이슈 대응 및 평판 관리"
      ],
      mediumSignals: [
        "콘텐츠 기획 및 메시지 설계",
        "홍보 캠페인 기획",
        "SNS 및 외부 채널 활용 홍보"
      ],
      boundarySignals: [
        "정부기관 대응 비중이 커지면 대관으로 이동",
        "이벤트 운영 중심으로 이동하면 행사·프로그램 운영으로 이동"
      ],
      adjacentFamilies: [
        "government_relations",
        "event_program_management"
      ],
      boundaryNote: "언론 및 대외 메시지 관리가 중심입니다. 반면 정책 대응이나 공공기관 협력이 핵심이 되면 대관으로, 행사 실행 비중이 커지면 이벤트 운영 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 언론 및 외부 커뮤니케이션을 통해 조직의 메시지와 평판을 관리하는 성격이 강합니다. 반면 정책 대응이나 행사 운영 비중이 커지면 다른 대외협력 영역으로 읽힐 수 있습니다."
    },
    {
      id: "partnership_management",
      label: "파트너십·협약 관리",
      aliases: [
        "파트너십",
        "제휴",
        "협약 관리",
        "MOU",
        "Alliance",
        "Partnership"
      ],
      strongSignals: [
        "외부 기관과의 협약(MOU) 체결 및 관리",
        "협력 사업 기획 및 실행",
        "파트너 발굴 및 관계 유지",
        "공동 프로젝트 운영"
      ],
      mediumSignals: [
        "파트너 성과 관리 및 리포팅",
        "협력 조건 협상",
        "외부 이해관계자 조율"
      ],
      boundarySignals: [
        "정책 대응 및 공공기관 중심이면 대관으로 이동",
        "행사 실행 중심이면 이벤트 운영으로 이동"
      ],
      adjacentFamilies: [
        "government_relations",
        "event_program_management"
      ],
      boundaryNote: "협력 관계를 통해 실질적 사업이나 프로젝트를 추진하는 것이 핵심입니다. 반면 정책 대응 비중이 커지면 대관으로, 단발성 행사 실행이 중심이면 이벤트 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 외부 기관과의 협력 관계를 기반으로 공동 사업이나 프로젝트를 추진하는 성격이 강합니다. 반면 정책 대응이나 행사 실행 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "event_program_management",
      label: "행사·프로그램 운영",
      aliases: [
        "행사 운영",
        "이벤트",
        "컨퍼런스 운영",
        "포럼",
        "프로그램 기획"
      ],
      strongSignals: [
        "외부 대상 행사 또는 프로그램 기획 및 운영",
        "컨퍼런스·세미나 실행 총괄",
        "참여자 및 이해관계자 운영 관리",
        "현장 운영 및 일정 관리"
      ],
      mediumSignals: [
        "행사 콘텐츠 기획",
        "외부 협력사 및 연사 관리",
        "운영 매뉴얼 및 실행 계획 수립"
      ],
      boundarySignals: [
        "언론 노출 및 메시지 관리 중심이면 PR로 이동",
        "지속적 협력 관계 구축이 중심이면 파트너십 관리로 이동"
      ],
      adjacentFamilies: [
        "public_relations",
        "partnership_management"
      ],
      boundaryNote: "행사의 기획과 실행이 핵심입니다. 반면 메시지 관리나 언론 대응이 중심이면 PR로, 지속적 협력 관계 구축이 핵심이면 파트너십 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 외부 대상 행사와 프로그램을 기획하고 실행하는 성격이 강합니다. 반면 메시지 관리나 협력 관계 중심으로 이동하면 다른 대외협력 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "gr_manager",
      label: "대관 담당",
      aliases: [
        "GR Manager",
        "대관 매니저",
        "Government Relations Manager"
      ],
      family: "government_relations",
      responsibilityHints: [
        "정부기관 커뮤니케이션",
        "정책 대응",
        "규제 모니터링"
      ],
      levelHints: [
        "기관 네트워크 보유",
        "정책 이해도 요구"
      ]
    },
    {
      id: "pr_manager",
      label: "홍보 담당",
      aliases: [
        "PR Manager",
        "홍보 매니저",
        "Public Relations Manager"
      ],
      family: "public_relations",
      responsibilityHints: [
        "보도자료 작성",
        "언론 대응",
        "이슈 관리"
      ],
      levelHints: [
        "언론 네트워크",
        "메시지 설계 능력"
      ]
    },
    {
      id: "partnership_manager",
      label: "파트너십 매니저",
      aliases: [
        "Alliance Manager",
        "제휴 담당",
        "Partnership Manager"
      ],
      family: "partnership_management",
      responsibilityHints: [
        "협력 기관 발굴",
        "협약 체결",
        "공동 프로젝트 운영"
      ],
      levelHints: [
        "협상 경험",
        "관계 관리 능력"
      ]
    },
    {
      id: "event_manager",
      label: "행사 운영 담당",
      aliases: [
        "Event Manager",
        "프로그램 매니저",
        "행사 기획자"
      ],
      family: "event_program_management",
      responsibilityHints: [
        "행사 기획",
        "현장 운영",
        "참여자 관리"
      ],
      levelHints: [
        "운영 경험",
        "다중 이해관계자 조율 능력"
      ]
    }
  ],
  axes: [
    {
      axisId: "primary_counterpart",
      label: "주요 상대",
      values: [
        "정부·공공기관",
        "언론·대중",
        "외부 파트너 기관",
        "행사 참여자"
      ]
    },
    {
      axisId: "core_output",
      label: "핵심 산출물",
      values: [
        "정책 대응 및 관계 유지",
        "메시지 및 콘텐츠",
        "협약 및 공동사업",
        "행사 및 프로그램"
      ]
    }
  ],
  adjacentFamilies: [
    "marketing",
    "business_development",
    "policy_planning"
  ],
  boundaryHints: [
    "정부기관 대응과 정책 해석 비중이 높아지면 대관으로 수렴",
    "언론 및 메시지 관리 비중이 높아지면 PR로 이동",
    "협력 사업 및 성과 창출 비중이 커지면 파트너십으로 이동",
    "행사 실행 및 운영 비중이 커지면 이벤트 운영으로 이동"
  ],
  summaryTemplate: "이 직무는 외부 이해관계자와의 관계를 기반으로 조직의 목표를 지원하는 대외협력 성격이 강합니다. 반면 어떤 상대와 어떤 결과물을 중심으로 일하는지에 따라 대관, PR, 파트너십, 행사 운영 등으로 구분되어 해석될 수 있습니다."
};
