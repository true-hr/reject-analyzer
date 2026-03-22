export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "BX_BRAND_DESIGN",
  aliases: [
    "브랜드 디자이너",
    "BX 디자이너",
    "Brand Designer",
    "Brand Experience Designer",
    "브랜딩 디자인",
    "비주얼 브랜딩",
    "아이덴티티 디자인",
    "BI 디자인"
  ],
  families: [
    {
      id: "brand_identity_design",
      label: "브랜드 아이덴티티 디자인",
      aliases: [
        "BI Designer",
        "Brand Identity Designer",
        "로고 디자인",
        "아이덴티티 디자인"
      ],
      strongSignals: [
        "로고 및 심볼 디자인",
        "브랜드 아이덴티티 구축",
        "컬러 및 타이포그래피 정의",
        "브랜드 가이드라인 제작",
        "브랜드 컨셉 시각화"
      ],
      mediumSignals: [
        "키 비주얼 제작",
        "그래픽 모티프 정의",
        "브랜드 리뉴얼 작업",
        "스타일 가이드 문서화"
      ],
      boundarySignals: [
        "마케팅 캠페인 디자인 비중 증가",
        "디지털 UI 디자인 참여 증가",
        "공간 및 오프라인 경험 설계 비중 증가"
      ],
      adjacentFamilies: ["brand_marketing_design", "brand_experience_design"],
      boundaryNote: "아이덴티티 구축보다 캠페인이나 콘텐츠 제작 비중이 커지면 마케팅 디자인으로 이동하며, 공간이나 오프라인 경험 설계 비중이 커지면 브랜드 경험 디자인으로 이동합니다.",
      summaryTemplate: "이 직무는 브랜드의 시각적 정체성을 정의하고 일관된 표현 체계를 만드는 성격이 강합니다. 반면 캠페인 실행이나 경험 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "brand_marketing_design",
      label: "브랜드 마케팅 디자인",
      aliases: [
        "Brand Marketing Designer",
        "Campaign Designer",
        "콘텐츠 디자이너",
        "광고 디자인"
      ],
      strongSignals: [
        "마케팅 캠페인 디자인",
        "광고 배너 및 콘텐츠 제작",
        "SNS 콘텐츠 디자인",
        "프로모션 비주얼 제작",
        "브랜드 메시지 시각화"
      ],
      mediumSignals: [
        "영상 썸네일 및 그래픽 제작",
        "랜딩 페이지 디자인",
        "이벤트 페이지 디자인",
        "마케팅 협업"
      ],
      boundarySignals: [
        "브랜드 시스템 정의 비중 증가",
        "UI/UX 제품 디자인 참여 증가",
        "오프라인 공간 경험 설계 증가"
      ],
      adjacentFamilies: ["brand_identity_design", "brand_experience_design"],
      boundaryNote: "캠페인 중심 작업에서 벗어나 브랜드의 구조와 규칙 정의 비중이 커지면 아이덴티티 디자인으로 이동하며, 사용자 경험이나 제품 UI 설계가 많아지면 프로덕트 디자인으로 이동합니다.",
      summaryTemplate: "이 직무는 브랜드 메시지를 다양한 채널의 콘텐츠로 구현하는 성격이 강합니다. 반면 브랜드 구조 정의나 제품 경험 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "brand_experience_design",
      label: "브랜드 경험 디자인",
      aliases: [
        "Brand Experience Designer",
        "BX Designer",
        "공간 브랜딩",
        "오프라인 경험 디자인"
      ],
      strongSignals: [
        "오프라인 공간 브랜딩",
        "전시 및 팝업스토어 디자인",
        "고객 접점 경험 설계",
        "환경 그래픽 디자인",
        "브랜드 경험 흐름 설계"
      ],
      mediumSignals: [
        "사인 시스템 디자인",
        "패키지 경험 설계",
        "브랜드 터치포인트 정의",
        "공간 연출 기획"
      ],
      boundarySignals: [
        "순수 비주얼 그래픽 작업 비중 증가",
        "디지털 UI/UX 설계 비중 증가",
        "마케팅 콘텐츠 제작 비중 증가"
      ],
      adjacentFamilies: ["brand_identity_design", "brand_marketing_design"],
      boundaryNote: "경험 설계에서 벗어나 그래픽 중심 작업이 많아지면 아이덴티티 디자인으로 이동하며, 디지털 UI 설계가 많아지면 프로덕트 디자인으로 이동합니다.",
      summaryTemplate: "이 직무는 브랜드를 공간과 다양한 접점에서 경험으로 구현하는 성격이 강합니다. 반면 그래픽 중심 작업이나 디지털 제품 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "brand_system_design",
      label: "브랜드 시스템/거버넌스",
      aliases: [
        "Brand System Designer",
        "Brand Governance",
        "브랜드 가이드 관리"
      ],
      strongSignals: [
        "브랜드 가이드라인 체계 구축",
        "브랜드 사용 규칙 정의",
        "브랜드 자산 관리",
        "브랜드 일관성 관리",
        "디자인 템플릿 시스템 구축"
      ],
      mediumSignals: [
        "브랜드 에셋 라이브러리 관리",
        "내부 교육 및 가이드 배포",
        "브랜드 QA 수행",
        "협업 부서 디자인 검수"
      ],
      boundarySignals: [
        "직접 디자인 제작 비중 증가",
        "캠페인 콘텐츠 제작 비중 증가",
        "공간 및 경험 설계 참여 증가"
      ],
      adjacentFamilies: ["brand_identity_design", "brand_marketing_design"],
      boundaryNote: "시스템 관리에서 벗어나 직접 시각 디자인 제작이 많아지면 아이덴티티 디자인으로 이동하며, 캠페인 콘텐츠 제작 비중이 커지면 마케팅 디자인으로 이동합니다.",
      summaryTemplate: "이 직무는 브랜드가 일관되게 사용되도록 시스템과 규칙을 설계하고 관리하는 성격이 강합니다. 반면 직접 디자인 제작이나 캠페인 실행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "brand_designer",
      label: "브랜드 디자이너",
      aliases: ["Brand Designer", "BX Designer"],
      family: "brand_identity_design",
      responsibilityHints: [
        "브랜드 아이덴티티 설계",
        "로고 및 시각 요소 디자인",
        "브랜드 가이드 제작"
      ],
      levelHints: [
        "주니어는 시각 요소 제작 중심",
        "시니어는 브랜드 컨셉 및 방향 정의"
      ]
    },
    {
      id: "campaign_designer",
      label: "캠페인 디자이너",
      aliases: ["Campaign Designer", "Marketing Designer"],
      family: "brand_marketing_design",
      responsibilityHints: [
        "마케팅 콘텐츠 제작",
        "캠페인 비주얼 설계",
        "프로모션 디자인"
      ],
      levelHints: [
        "주니어는 콘텐츠 제작 중심",
        "시니어는 캠페인 비주얼 전략 기여"
      ]
    },
    {
      id: "bx_designer",
      label: "BX 디자이너",
      aliases: ["Brand Experience Designer"],
      family: "brand_experience_design",
      responsibilityHints: [
        "공간 및 접점 경험 설계",
        "브랜드 경험 흐름 기획",
        "오프라인 브랜딩"
      ],
      levelHints: [
        "주니어는 실행 및 제작 중심",
        "시니어는 경험 설계 및 컨셉 정의"
      ]
    },
    {
      id: "brand_system_manager",
      label: "브랜드 시스템 디자이너",
      aliases: ["Brand System Designer"],
      family: "brand_system_design",
      responsibilityHints: [
        "브랜드 가이드라인 구축",
        "브랜드 자산 관리",
        "일관성 유지 및 검수"
      ],
      levelHints: [
        "주니어는 에셋 관리 및 정리",
        "시니어는 브랜드 구조 및 정책 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "identity_vs_execution",
      label: "정의 vs 실행",
      values: ["아이덴티티 정의", "캠페인/콘텐츠 실행"]
    },
    {
      axisId: "graphic_vs_experience",
      label: "그래픽 vs 경험",
      values: ["시각 요소 중심", "공간/접점 경험 중심"]
    },
    {
      axisId: "creation_vs_governance",
      label: "제작 vs 관리",
      values: ["디자인 제작 중심", "브랜드 시스템/관리 중심"]
    }
  ],
  adjacentFamilies: ["product_design", "marketing_content"],
  boundaryHints: [
    "디지털 제품 UI/UX 설계 비중이 커지면 프로덕트 디자인으로 이동합니다.",
    "브랜드보다는 퍼포먼스 중심 콘텐츠 제작 비중이 커지면 마케팅 콘텐츠 직무로 이동합니다.",
    "브랜드 정의보다 캠페인 실행 비중이 커지면 마케팅 디자인으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 브랜드의 시각적 정체성과 경험을 설계하고 다양한 접점에서 일관되게 표현하는 역할입니다. 아이덴티티 정의, 콘텐츠 실행, 경험 설계, 시스템 관리 중 어떤 비중이 큰지에 따라 성격이 달라지며, 특정 영역의 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
