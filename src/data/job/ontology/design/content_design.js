export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "CONTENT_DESIGN",
  aliases: [
    "콘텐츠 디자이너",
    "콘텐츠 디자인",
    "Content Designer",
    "콘텐츠 제작 디자이너",
    "콘텐츠 비주얼 디자이너",
    "SNS 콘텐츠 디자이너",
    "마케팅 콘텐츠 디자이너",
    "디지털 콘텐츠 디자인"
  ],
  families: [
    {
      id: "marketing_content",
      label: "마케팅 콘텐츠 디자인",
      aliases: [
        "마케팅 콘텐츠 디자이너",
        "광고 콘텐츠 디자이너",
        "퍼포먼스 콘텐츠 디자이너",
        "SNS 광고 디자인",
        "배너 디자인"
      ],
      strongSignals: [
        "광고 배너 제작",
        "SNS 콘텐츠 제작",
        "캠페인 크리에이티브 제작",
        "CTR, CVR 개선 언급",
        "A/B 테스트 기반 디자인 개선",
        "퍼포먼스 마케팅 협업",
        "프로모션 비주얼 제작"
      ],
      mediumSignals: [
        "브랜드 가이드 기반 디자인",
        "카피와 함께 콘텐츠 제작",
        "디지털 채널별 사이즈 대응",
        "콘텐츠 성과 리포트 참고"
      ],
      boundarySignals: [
        "브랜드 일관성보다 성과 지표 최적화 강조",
        "UI/UX 흐름 설계보다는 단일 이미지/영상 중심 작업",
        "콘텐츠 수량 생산 비중 증가"
      ],
      adjacentFamilies: ["brand_content", "editorial_content"],
      boundaryNote: "성과 지표 기반 반복 제작 비중이 커지면 마케팅 콘텐츠로 읽히며, 브랜드 메시지 일관성 설계가 중심이 되면 브랜드 콘텐츠로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 광고 및 마케팅 성과를 높이기 위한 콘텐츠 제작 성격이 강합니다. 반면 브랜드 일관성 설계나 장기적인 메시지 관리 비중이 커지면 브랜드 콘텐츠 영역으로 읽힐 수 있습니다."
    },
    {
      id: "brand_content",
      label: "브랜드 콘텐츠 디자인",
      aliases: [
        "브랜드 콘텐츠 디자이너",
        "브랜드 비주얼 콘텐츠",
        "브랜딩 콘텐츠 디자인",
        "브랜드 캠페인 디자인"
      ],
      strongSignals: [
        "브랜드 톤앤매너 정의 및 유지",
        "브랜드 캠페인 콘텐츠 제작",
        "비주얼 아이덴티티 기반 콘텐츠 제작",
        "브랜드 스토리텔링 콘텐츠",
        "룩앤필 가이드 관리"
      ],
      mediumSignals: [
        "마케팅 팀 협업",
        "콘텐츠 스타일 가이드 제작",
        "온/오프라인 콘텐츠 통합 관리"
      ],
      boundarySignals: [
        "성과 지표보다 브랜드 일관성 강조",
        "광고 성과 최적화보다 메시지 전달 중심",
        "UI/UX 흐름 설계 언급 없음"
      ],
      adjacentFamilies: ["marketing_content", "editorial_content"],
      boundaryNote: "브랜드 일관성 유지와 메시지 전달이 중심이면 브랜드 콘텐츠로 읽히며, 성과 지표 기반 반복 제작 비중이 커지면 마케팅 콘텐츠로 이동합니다.",
      summaryTemplate: "이 직무는 브랜드 메시지와 비주얼 아이덴티티를 일관되게 전달하는 콘텐츠 제작 성격이 강합니다. 반면 성과 지표 중심의 반복 제작이 늘어나면 마케팅 콘텐츠 영역으로 읽힐 수 있습니다."
    },
    {
      id: "editorial_content",
      label: "에디토리얼 콘텐츠 디자인",
      aliases: [
        "에디토리얼 디자이너",
        "매거진 콘텐츠 디자인",
        "콘텐츠 편집 디자인",
        "Editorial Designer",
        "콘텐츠 레이아웃 디자인"
      ],
      strongSignals: [
        "매거진/아티클 레이아웃 디자인",
        "타이포그래피 중심 콘텐츠 설계",
        "스토리 흐름 기반 콘텐츠 구성",
        "출판/디지털 에디토리얼 작업",
        "그리드 시스템 활용"
      ],
      mediumSignals: [
        "이미지와 텍스트 조합 콘텐츠",
        "콘텐츠 가독성 최적화",
        "브랜드 톤 일부 반영"
      ],
      boundarySignals: [
        "성과 지표 언급 없음",
        "UI 인터랙션 설계 없음",
        "정적 콘텐츠 비중 높음"
      ],
      adjacentFamilies: ["brand_content", "ux_writing_content"],
      boundaryNote: "콘텐츠의 읽기 경험과 구조 설계가 중심이면 에디토리얼로 읽히며, 브랜드 메시지 일관성 관리가 강조되면 브랜드 콘텐츠로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 텍스트와 비주얼을 결합해 읽기 경험을 설계하는 콘텐츠 제작 성격이 강합니다. 반면 브랜드 메시지 관리 비중이 커지면 브랜드 콘텐츠 영역으로 읽힐 수 있습니다."
    },
    {
      id: "ux_writing_content",
      label: "UX 콘텐츠 디자인",
      aliases: [
        "UX 콘텐츠 디자이너",
        "UX Writer",
        "콘텐츠 UX 디자이너",
        "마이크로카피 디자이너"
      ],
      strongSignals: [
        "마이크로카피 작성",
        "사용자 플로우 기반 콘텐츠 설계",
        "UI 텍스트 작성",
        "사용성 개선을 위한 콘텐츠 수정",
        "에러 메시지/가이드 문구 설계"
      ],
      mediumSignals: [
        "디자인 시스템 내 콘텐츠 가이드 작성",
        "프로덕트 팀 협업",
        "사용자 행동 기반 콘텐츠 개선"
      ],
      boundarySignals: [
        "비주얼 디자인보다 텍스트 중심",
        "마케팅 성과 지표보다 사용성 강조",
        "콘텐츠 단위가 UI 흐름에 종속"
      ],
      adjacentFamilies: ["editorial_content", "marketing_content"],
      boundaryNote: "사용자 흐름과 인터페이스 내 텍스트 설계가 중심이면 UX 콘텐츠로 읽히며, 독립 콘텐츠 제작 비중이 커지면 에디토리얼이나 마케팅 콘텐츠로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 사용자 경험을 개선하기 위한 텍스트 기반 콘텐츠 설계 성격이 강합니다. 반면 독립적인 콘텐츠 제작이나 마케팅 목적이 커지면 다른 콘텐츠 디자인 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "sns_content_designer",
      label: "SNS 콘텐츠 디자이너",
      aliases: ["SNS 디자이너", "소셜 콘텐츠 디자이너"],
      family: "marketing_content",
      responsibilityHints: [
        "SNS 채널 콘텐츠 제작",
        "광고 및 프로모션 이미지 제작",
        "콘텐츠 성과 기반 개선"
      ],
      levelHints: [
        "주니어는 제작 중심",
        "시니어는 캠페인 단위 기획 및 성과 개선 주도"
      ]
    },
    {
      id: "brand_content_designer",
      label: "브랜드 콘텐츠 디자이너",
      aliases: ["브랜드 디자이너", "브랜딩 콘텐츠 디자이너"],
      family: "brand_content",
      responsibilityHints: [
        "브랜드 캠페인 콘텐츠 제작",
        "비주얼 아이덴티티 유지",
        "브랜드 메시지 시각화"
      ],
      levelHints: [
        "주니어는 가이드 기반 제작",
        "시니어는 브랜드 방향성 정의 참여"
      ]
    },
    {
      id: "editorial_designer",
      label: "에디토리얼 디자이너",
      aliases: ["편집 디자이너", "콘텐츠 레이아웃 디자이너"],
      family: "editorial_content",
      responsibilityHints: [
        "콘텐츠 레이아웃 설계",
        "타이포그래피 구성",
        "읽기 흐름 최적화"
      ],
      levelHints: [
        "주니어는 레이아웃 작업 중심",
        "시니어는 콘텐츠 구조 설계 주도"
      ]
    },
    {
      id: "ux_content_designer",
      label: "UX 콘텐츠 디자이너",
      aliases: ["UX Writer", "콘텐츠 UX 디자이너"],
      family: "ux_writing_content",
      responsibilityHints: [
        "UI 텍스트 작성",
        "사용자 흐름 기반 콘텐츠 설계",
        "사용성 개선"
      ],
      levelHints: [
        "주니어는 문구 작성 중심",
        "시니어는 콘텐츠 전략 및 가이드 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "goal_focus",
      label: "목적 중심",
      values: ["성과 최적화", "브랜드 일관성", "읽기 경험", "사용자 경험"]
    },
    {
      axisId: "content_unit",
      label: "콘텐츠 단위",
      values: ["단일 크리에이티브", "캠페인 묶음", "문서/아티클", "UI 흐름 내 텍스트"]
    }
  ],
  adjacentFamilies: ["graphic_design", "ui_design"],
  boundaryHints: [
    "성과 지표 개선과 반복 제작 비중이 커지면 마케팅 콘텐츠로 이동",
    "브랜드 메시지와 톤앤매너 관리 비중이 커지면 브랜드 콘텐츠로 이동",
    "텍스트 기반 읽기 경험 설계가 강조되면 에디토리얼로 이동",
    "UI 흐름 내 텍스트와 사용자 행동 개선이 중심이면 UX 콘텐츠로 이동"
  ],
  summaryTemplate: "이 직무는 다양한 목적의 콘텐츠를 설계하고 제작하는 역할로, 성과 중심인지 브랜드 중심인지에 따라 세부 방향이 달라집니다. 또한 사용자 경험이나 읽기 흐름 설계 비중이 커지면 각각 UX 콘텐츠나 에디토리얼 영역으로 경계가 이동할 수 있습니다."
};
