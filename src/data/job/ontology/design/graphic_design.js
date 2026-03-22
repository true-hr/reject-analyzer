export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "GRAPHIC_DESIGN",
  aliases: [
    "그래픽디자이너",
    "그래픽 디자인",
    "Graphic Designer",
    "Visual Designer",
    "비주얼 디자이너",
    "브랜딩 디자이너",
    "편집 디자이너",
    "마케팅 디자이너"
  ],
  families: [
    {
      id: "branding_visual",
      label: "브랜딩/비주얼 디자인",
      aliases: [
        "브랜드 디자이너",
        "브랜딩 디자이너",
        "BI 디자인",
        "CI 디자인",
        "Brand Identity Designer",
        "Visual Identity"
      ],
      strongSignals: [
        "로고 디자인",
        "브랜드 가이드라인 제작",
        "컬러 시스템 정의",
        "타이포그래피 시스템 설계",
        "비주얼 아이덴티티 구축"
      ],
      mediumSignals: [
        "키비주얼 디자인",
        "캠페인 비주얼 컨셉 정의",
        "브랜드 리뉴얼 프로젝트 참여",
        "아트 디렉션 일부 수행"
      ],
      boundarySignals: [
        "마케팅 배너 제작 비중 증가",
        "운영성 콘텐츠 디자인 비중 증가",
        "UI 시안 제작 비중 증가"
      ],
      adjacentFamilies: [
        "marketing_content",
        "ui_visual"
      ],
      boundaryNote: "브랜드 시스템 정의보다 단발성 캠페인이나 배너 제작 비중이 커지면 마케팅 디자인으로 이동하며, 인터페이스 구조나 UX 고려가 포함되면 UI/비주얼 디자인으로 해석됩니다.",
      summaryTemplate: "이 직무는 브랜드의 시각적 정체성을 정의하고 일관된 비주얼 시스템을 구축하는 성격이 강합니다. 반면 단기 캠페인 제작이나 운영 디자인 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "marketing_content",
      label: "마케팅/콘텐츠 디자인",
      aliases: [
        "마케팅 디자이너",
        "콘텐츠 디자이너",
        "퍼포먼스 디자인",
        "배너 디자이너",
        "SNS 콘텐츠 디자이너"
      ],
      strongSignals: [
        "광고 배너 제작",
        "SNS 콘텐츠 디자인",
        "프로모션 이미지 제작",
        "캠페인 크리에이티브 제작",
        "A/B 테스트용 소재 제작"
      ],
      mediumSignals: [
        "썸네일 디자인",
        "이벤트 페이지 비주얼 제작",
        "간단한 영상 썸네일/커버 제작",
        "마케팅 카피와 협업"
      ],
      boundarySignals: [
        "브랜드 가이드라인 정의 참여 증가",
        "UI 화면 설계 참여 증가",
        "출판/편집물 제작 비중 증가"
      ],
      adjacentFamilies: [
        "branding_visual",
        "ui_visual",
        "editorial_print"
      ],
      boundaryNote: "브랜드 규칙을 새로 정의하는 역할이 커지면 브랜딩으로 이동하며, 인터페이스 구조 설계가 포함되면 UI 디자인으로 읽힙니다.",
      summaryTemplate: "이 직무는 마케팅 목적의 시각 콘텐츠를 빠르게 제작하고 성과에 맞춰 반복 개선하는 성격이 강합니다. 반면 브랜드 체계 정의나 제품 인터페이스 설계 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "editorial_print",
      label: "편집/출판 디자인",
      aliases: [
        "편집 디자이너",
        "출판 디자이너",
        "Editorial Designer",
        "북 디자이너",
        "지면 디자이너"
      ],
      strongSignals: [
        "인쇄물 레이아웃 디자인",
        "책/잡지 편집 디자인",
        "그리드 시스템 기반 레이아웃 설계",
        "타이포그래피 중심 구성",
        "인쇄 사양 관리"
      ],
      mediumSignals: [
        "브로셔/리플렛 제작",
        "PDF 리포트 디자인",
        "지면 광고 디자인"
      ],
      boundarySignals: [
        "디지털 배너 제작 비중 증가",
        "브랜드 아이덴티티 정의 참여 증가",
        "인터페이스 시안 제작 참여 증가"
      ],
      adjacentFamilies: [
        "marketing_content",
        "branding_visual"
      ],
      boundaryNote: "디지털 광고 소재 제작 비중이 커지면 마케팅 디자인으로 이동하며, 브랜드 시스템 정의까지 확장되면 브랜딩 영역으로 읽힙니다.",
      summaryTemplate: "이 직무는 텍스트와 이미지의 구조를 설계하여 가독성과 전달력을 높이는 편집 중심 성격이 강합니다. 반면 디지털 광고나 브랜드 정의 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "ui_visual",
      label: "UI/비주얼 디자인",
      aliases: [
        "UI 디자이너",
        "비주얼 디자이너",
        "Product Visual Designer",
        "App UI Designer"
      ],
      strongSignals: [
        "앱/웹 UI 시각 디자인",
        "컴포넌트 스타일 정의",
        "디자인 시스템 시각 요소 구축",
        "아이콘 디자인",
        "인터랙션을 고려한 화면 디자인"
      ],
      mediumSignals: [
        "간단한 UX 흐름 이해 기반 디자인",
        "프로토타입 시각화",
        "개발 협업을 통한 UI 수정"
      ],
      boundarySignals: [
        "브랜드 아이덴티티 정의 참여 증가",
        "마케팅 배너 제작 비중 증가",
        "UX 설계/리서치 비중 증가"
      ],
      adjacentFamilies: [
        "branding_visual",
        "marketing_content"
      ],
      boundaryNote: "사용자 흐름 설계나 리서치 비중이 커지면 UX 영역으로 이동하며, 브랜드 규칙 정의 중심으로 이동하면 브랜딩으로 해석됩니다.",
      summaryTemplate: "이 직무는 디지털 제품의 화면을 시각적으로 설계하고 일관된 UI 스타일을 구축하는 성격이 강합니다. 반면 UX 설계나 브랜드 정의 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "brand_designer",
      label: "브랜드 디자이너",
      aliases: ["Brand Designer", "BI Designer"],
      family: "branding_visual",
      responsibilityHints: [
        "브랜드 아이덴티티 설계",
        "가이드라인 제작",
        "비주얼 시스템 정의"
      ],
      levelHints: [
        "주니어는 실행 중심, 시니어는 컨셉 정의와 시스템 설계 비중 증가"
      ]
    },
    {
      id: "marketing_designer",
      label: "마케팅 디자이너",
      aliases: ["Content Designer", "Performance Designer"],
      family: "marketing_content",
      responsibilityHints: [
        "광고 소재 제작",
        "캠페인 크리에이티브 제작",
        "성과 기반 반복 개선"
      ],
      levelHints: [
        "주니어는 제작 중심, 시니어는 크리에이티브 방향성과 실험 설계 참여"
      ]
    },
    {
      id: "editorial_designer",
      label: "편집 디자이너",
      aliases: ["Editorial Designer"],
      family: "editorial_print",
      responsibilityHints: [
        "지면 레이아웃 설계",
        "타이포그래피 구성",
        "인쇄물 디자인"
      ],
      levelHints: [
        "주니어는 편집 실행, 시니어는 전체 레이아웃 구조 설계"
      ]
    },
    {
      id: "ui_visual_designer",
      label: "UI 디자이너",
      aliases: ["Visual UI Designer"],
      family: "ui_visual",
      responsibilityHints: [
        "앱/웹 UI 디자인",
        "컴포넌트 스타일 정의",
        "디자인 시스템 시각 요소 구축"
      ],
      levelHints: [
        "주니어는 화면 단위 작업, 시니어는 시스템 단위 일관성 관리"
      ]
    }
  ],
  axes: [
    {
      axisId: "output_medium",
      label: "산출물 매체",
      values: [
        "디지털 인터페이스 중심",
        "디지털 마케팅 콘텐츠 중심",
        "인쇄/출판 중심"
      ]
    },
    {
      axisId: "system_vs_execution",
      label: "시스템 정의 vs 실행 제작",
      values: [
        "시각 시스템 정의 중심",
        "혼합형",
        "단기 제작/운영 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "ux_design",
    "product_design",
    "motion_graphics"
  ],
  boundaryHints: [
    "브랜드 규칙 정의 비중이 커지면 브랜딩/비주얼 디자인으로 이동합니다.",
    "성과 기반 배너/콘텐츠 제작 비중이 높아지면 마케팅/콘텐츠 디자인으로 해석됩니다.",
    "사용자 흐름 설계와 인터페이스 구조까지 다루면 UI/UX 영역으로 확장됩니다.",
    "인쇄물과 레이아웃 중심 작업이 지속되면 편집/출판 디자인으로 읽힙니다."
  ],
  summaryTemplate: "이 직무는 시각 요소를 통해 정보를 전달하고 브랜드나 메시지를 표현하는 그래픽 중심 역할입니다. 다만 브랜드 시스템 정의, 마케팅 콘텐츠 제작, UI 설계 등 어느 비중이 더 큰지에 따라 세부 영역이 달라질 수 있습니다."
};
