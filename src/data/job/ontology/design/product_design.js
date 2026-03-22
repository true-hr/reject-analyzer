export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "PRODUCT_DESIGN",
  aliases: [
    "프로덕트 디자이너",
    "Product Designer",
    "UX/UI 디자이너",
    "UX Designer",
    "UI Designer",
    "서비스 디자이너",
    "디지털 제품 디자인"
  ],
  families: [
    {
      id: "ux_driven_product_design",
      label: "UX 중심 프로덕트 디자인",
      aliases: [
        "UX Designer",
        "사용자 경험 디자이너",
        "UX 중심 디자인"
      ],
      strongSignals: [
        "사용자 리서치 수행",
        "유저 저니맵 작성",
        "와이어프레임 설계",
        "사용성 테스트 진행",
        "문제 정의 및 UX 개선 제안"
      ],
      mediumSignals: [
        "Figma, Sketch 사용",
        "프로토타입 제작",
        "유저 인터뷰 정리",
        "페르소나 정의"
      ],
      boundarySignals: [
        "비주얼 스타일링 비중 증가",
        "디자인 시스템 구축 참여 증가",
        "제품 KPI 기반 개선보다 브랜딩 요소 강화"
      ],
      adjacentFamilies: ["ui_visual_product_design", "product_system_design"],
      boundaryNote: "사용자 문제 정의와 리서치보다 시각적 완성도나 브랜딩 요소 비중이 커지면 UI 중심으로 이동하며, 컴포넌트와 시스템 설계 비중이 커지면 디자인 시스템 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 문제를 정의하고 경험 흐름을 설계하는 성격이 강합니다. 반면 시각 디자인이나 시스템 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "ui_visual_product_design",
      label: "UI/비주얼 중심 프로덕트 디자인",
      aliases: [
        "UI Designer",
        "Visual Designer",
        "인터페이스 디자인"
      ],
      strongSignals: [
        "UI 레이아웃 설계",
        "컬러 및 타이포그래피 정의",
        "디자인 시안 제작",
        "픽셀 단위 디테일 작업",
        "브랜드 가이드 반영 디자인"
      ],
      mediumSignals: [
        "Figma 디자인 시스템 활용",
        "아이콘 및 그래픽 제작",
        "컴포넌트 스타일 정의",
        "디자인 QA 수행"
      ],
      boundarySignals: [
        "사용자 리서치 및 UX 설계 비중 증가",
        "디자인 시스템 구조 설계 참여 증가",
        "데이터 기반 개선 및 실험 참여 증가"
      ],
      adjacentFamilies: ["ux_driven_product_design", "product_system_design"],
      boundaryNote: "비주얼 작업에서 벗어나 사용자 흐름 설계와 문제 정의 비중이 커지면 UX 중심으로 이동하며, 컴포넌트 구조와 재사용성 설계 비중이 커지면 디자인 시스템 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 제품 인터페이스의 시각적 완성도와 일관성을 설계하는 성격이 강합니다. 반면 사용자 경험 설계나 시스템 구조 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "product_system_design",
      label: "디자인 시스템/구조 중심",
      aliases: [
        "Design System Designer",
        "UI System Designer",
        "디자인 시스템"
      ],
      strongSignals: [
        "디자인 시스템 구축",
        "컴포넌트 라이브러리 설계",
        "토큰 및 스타일 가이드 정의",
        "디자인-개발 협업 구조 설계",
        "재사용 가능한 UI 구조 정의"
      ],
      mediumSignals: [
        "Figma 컴포넌트 관리",
        "스토리북 연동 협업",
        "디자인 규칙 문서화",
        "UI 일관성 관리"
      ],
      boundarySignals: [
        "개별 화면 디자인 및 시안 제작 비중 증가",
        "사용자 리서치 및 UX 설계 참여 증가",
        "프론트엔드 구현 참여 증가"
      ],
      adjacentFamilies: ["ui_visual_product_design", "ux_driven_product_design"],
      boundaryNote: "시스템 설계에서 벗어나 개별 화면 디자인 비중이 커지면 UI 중심으로 이동하며, 사용자 문제 정의와 경험 설계 비중이 커지면 UX 중심으로 이동합니다.",
      summaryTemplate: "이 직무는 제품 전반의 UI 구조와 디자인 시스템을 설계하는 성격이 강합니다. 반면 개별 화면 디자인이나 UX 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "data_driven_product_design",
      label: "데이터 기반 프로덕트 디자인",
      aliases: [
        "Product Designer (Data-driven)",
        "Growth Designer",
        "Experiment Designer"
      ],
      strongSignals: [
        "A/B 테스트 기반 디자인 개선",
        "전환율 개선 디자인",
        "데이터 기반 의사결정",
        "실험 설계 및 결과 반영",
        "KPI 중심 UI/UX 개선"
      ],
      mediumSignals: [
        "Amplitude, GA 협업",
        "실험 결과 해석",
        "지표 기반 디자인 반복",
        "퍼널 개선 작업"
      ],
      boundarySignals: [
        "데이터 없이 감각 기반 디자인 증가",
        "브랜딩 및 비주얼 작업 비중 증가",
        "디자인 시스템 구축 비중 증가"
      ],
      adjacentFamilies: ["ux_driven_product_design", "ui_visual_product_design"],
      boundaryNote: "데이터 기반 개선에서 벗어나 감각적 디자인이나 브랜딩 비중이 커지면 UI/비주얼 중심으로 이동하며, 사용자 문제 정의 중심으로 이동하면 UX 중심으로 해석됩니다.",
      summaryTemplate: "이 직무는 데이터와 실험을 기반으로 제품 경험을 개선하는 성격이 강합니다. 반면 감각적 디자인이나 시스템 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "product_designer",
      label: "프로덕트 디자이너",
      aliases: ["Product Designer", "UX/UI Designer"],
      family: "ux_driven_product_design",
      responsibilityHints: [
        "사용자 경험 설계",
        "와이어프레임 및 프로토타입 제작",
        "제품 개선 인사이트 도출"
      ],
      levelHints: [
        "주니어는 화면 설계 및 지원",
        "시니어는 문제 정의 및 제품 방향 기여"
      ]
    },
    {
      id: "ui_designer",
      label: "UI 디자이너",
      aliases: ["UI Designer", "Visual Designer"],
      family: "ui_visual_product_design",
      responsibilityHints: [
        "인터페이스 디자인",
        "비주얼 스타일 정의",
        "디자인 시안 제작"
      ],
      levelHints: [
        "주니어는 시안 제작 중심",
        "시니어는 브랜드 및 디자인 방향 정의"
      ]
    },
    {
      id: "design_system_designer",
      label: "디자인 시스템 디자이너",
      aliases: ["Design System Designer"],
      family: "product_system_design",
      responsibilityHints: [
        "디자인 시스템 구축",
        "컴포넌트 정의",
        "디자인 규칙 관리"
      ],
      levelHints: [
        "주니어는 컴포넌트 관리",
        "시니어는 시스템 구조 설계 및 표준화"
      ]
    },
    {
      id: "growth_designer",
      label: "그로스 디자이너",
      aliases: ["Growth Designer", "Experiment Designer"],
      family: "data_driven_product_design",
      responsibilityHints: [
        "A/B 테스트 설계",
        "전환율 개선",
        "데이터 기반 UI/UX 개선"
      ],
      levelHints: [
        "주니어는 실험 실행 및 분석 지원",
        "시니어는 실험 전략 및 KPI 개선 주도"
      ]
    }
  ],
  axes: [
    {
      axisId: "ux_vs_visual",
      label: "UX vs 비주얼",
      values: ["사용자 경험 중심", "시각/스타일 중심"]
    },
    {
      axisId: "screen_vs_system",
      label: "화면 vs 시스템",
      values: ["개별 화면 설계", "디자인 시스템 설계"]
    },
    {
      axisId: "intuition_vs_data",
      label: "감각 vs 데이터",
      values: ["디자인 감각 기반", "데이터/실험 기반"]
    }
  ],
  adjacentFamilies: ["frontend_engineering", "branding_design"],
  boundaryHints: [
    "디자인 결과물을 코드로 구현하는 비중이 커지면 프론트엔드 엔지니어링으로 이동합니다.",
    "제품 맥락보다 브랜드 표현과 비주얼 아이덴티티 비중이 커지면 브랜딩 디자인으로 이동합니다.",
    "사용자 경험 설계보다 데이터 실험과 KPI 개선 비중이 커지면 그로스 디자인으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 디지털 제품의 사용자 경험과 인터페이스를 설계하는 역할입니다. UX, 비주얼, 시스템, 데이터 기반 개선 중 어떤 비중이 큰지에 따라 성격이 달라지며, 특정 영역의 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
