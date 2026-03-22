export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "MOTION_DESIGN",
  aliases: [
    "영상디자인",
    "모션디자인",
    "모션그래픽",
    "motion design",
    "motion graphic designer",
    "video designer",
    "영상 그래픽",
    "브랜드 영상 디자인",
    "영상 콘텐츠 디자인"
  ],
  families: [
    {
      id: "brand_motion",
      label: "브랜드 모션 디자인",
      aliases: [
        "브랜드 영상",
        "광고 영상 디자인",
        "마케팅 영상",
        "브랜드 콘텐츠 영상",
        "브랜디드 모션"
      ],
      strongSignals: [
        "브랜드 가이드라인 기반 영상 제작",
        "제품/서비스 홍보 영상 제작 경험",
        "SNS 광고 영상 반복 제작",
        "캠페인 영상 디자인 참여",
        "스토리보드 기반 브랜드 메시지 전달"
      ],
      mediumSignals: [
        "짧은 길이의 콘텐츠 영상 다수 제작",
        "마케팅팀과 협업 경험",
        "썸네일/인트로/아웃트로 디자인 포함",
        "트렌디한 모션 스타일 적용"
      ],
      boundarySignals: [
        "UX 흐름보다 메시지 전달이 중심",
        "영상 KPI가 조회수/전환 중심으로 설정됨",
        "인터랙션 없이 일방향 콘텐츠 비중이 높음"
      ],
      adjacentFamilies: [
        "product_motion",
        "editing_motion"
      ],
      boundaryNote: "브랜드 메시지 전달과 마케팅 목적의 영상 비중이 커질수록 이 영역으로 읽힙니다. 반면 제품 인터랙션 설명이나 UX 흐름 중심으로 작업이 이동하면 프로덕트 모션으로 해석될 수 있습니다.",
      summaryTemplate: "이 직무는 브랜드 메시지와 마케팅 목적을 중심으로 영상과 모션을 설계하는 성격이 강합니다. 반면 사용자 흐름이나 제품 인터랙션 설명 비중이 커지면 프로덕트 모션 영역으로 읽힐 수 있습니다."
    },
    {
      id: "product_motion",
      label: "프로덕트 모션 디자인",
      aliases: [
        "UX 모션",
        "UI 모션",
        "프로덕트 애니메이션",
        "앱 모션 디자인",
        "인터랙션 모션"
      ],
      strongSignals: [
        "앱/웹 인터랙션 애니메이션 설계",
        "로딩, 전환, 상태 변화 모션 정의",
        "프로토타입 기반 모션 테스트",
        "디자인 시스템 내 모션 가이드 정의",
        "사용성 개선을 위한 모션 적용"
      ],
      mediumSignals: [
        "Lottie 또는 인터랙션 기반 모션 제작",
        "개발자와 협업하여 모션 구현",
        "UX 플로우 기반 애니메이션 설계",
        "마이크로 인터랙션 제작 경험"
      ],
      boundarySignals: [
        "브랜드 메시지보다 기능 설명이 중심",
        "영상 완결물보다 제품 내 삽입 목적",
        "인터랙션 여부가 핵심 판단 기준"
      ],
      adjacentFamilies: [
        "brand_motion",
        "3d_motion"
      ],
      boundaryNote: "사용자 인터랙션과 제품 흐름 설명이 주요 목적이 될수록 이 영역으로 분류됩니다. 반면 캠페인이나 마케팅 메시지 전달 중심으로 작업이 이동하면 브랜드 모션으로 해석될 수 있습니다.",
      summaryTemplate: "이 직무는 제품 내 사용자 경험을 강화하기 위한 인터랙션 중심 모션 설계 성격이 강합니다. 반면 브랜드 메시지 전달이나 광고 목적이 강조되면 브랜드 모션 영역으로 읽힐 수 있습니다."
    },
    {
      id: "editing_motion",
      label: "영상 편집 기반 모션",
      aliases: [
        "영상 편집",
        "video editor",
        "영상 제작",
        "편집 디자이너",
        "콘텐츠 편집"
      ],
      strongSignals: [
        "컷 편집 중심 영상 제작",
        "프리미어 프로 기반 작업 비중 높음",
        "촬영 영상 편집 및 후반 작업",
        "자막, 효과, BGM 삽입 중심 작업",
        "촬영 소스 기반 결과물 제작"
      ],
      mediumSignals: [
        "간단한 모션그래픽 요소 삽입",
        "인터뷰/브이로그/콘텐츠 영상 편집",
        "촬영 디렉션 일부 참여",
        "템플릿 기반 영상 제작"
      ],
      boundarySignals: [
        "모션 설계보다 편집 비중이 높음",
        "그래픽 요소보다 영상 소스 의존",
        "스토리 구조 편집 중심 역할"
      ],
      adjacentFamilies: [
        "brand_motion"
      ],
      boundaryNote: "촬영된 영상 소스를 기반으로 컷 편집과 후반 작업 비중이 높아질수록 이 영역으로 읽힙니다. 반면 그래픽 중심 모션 설계와 브랜드 메시지 기획 비중이 커지면 브랜드 모션으로 이동합니다.",
      summaryTemplate: "이 직무는 촬영된 영상 소스를 기반으로 편집과 후반 작업을 중심으로 결과물을 만드는 성격이 강합니다. 반면 그래픽 기반 모션 설계 비중이 커지면 브랜드 모션 영역으로 읽힐 수 있습니다."
    },
    {
      id: "3d_motion",
      label: "3D 모션 디자인",
      aliases: [
        "3D 애니메이션",
        "3D 모션그래픽",
        "3D 영상 디자인",
        "cinema 4d 모션",
        "블렌더 모션"
      ],
      strongSignals: [
        "3D 툴 기반 애니메이션 제작",
        "제품 또는 공간 3D 렌더링 영상 제작",
        "라이팅, 텍스처링, 렌더링 설정 경험",
        "3D 기반 브랜드 영상 제작",
        "물리 기반 애니메이션 활용"
      ],
      mediumSignals: [
        "2D 모션과 3D 혼합 작업",
        "제품 시각화 영상 제작",
        "렌더 결과물 기반 후반 편집",
        "모델링 리소스 활용"
      ],
      boundarySignals: [
        "3D 리소스 의존도가 높음",
        "렌더링 품질과 연출이 핵심 평가 기준",
        "인터랙션보다는 시각 표현 중심"
      ],
      adjacentFamilies: [
        "brand_motion",
        "product_motion"
      ],
      boundaryNote: "3D 툴과 렌더링 기반 표현 비중이 커질수록 이 영역으로 분류됩니다. 반면 인터랙션 설계 중심으로 이동하면 프로덕트 모션, 메시지 전달 중심이면 브랜드 모션으로 해석될 수 있습니다.",
      summaryTemplate: "이 직무는 3D 툴을 활용한 시각 표현과 애니메이션 제작에 초점을 둔 성격이 강합니다. 반면 인터랙션 설계나 브랜드 메시지 전달 비중이 커지면 각각 다른 모션 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "motion_graphic_designer",
      label: "모션 그래픽 디자이너",
      aliases: [
        "motion graphic designer",
        "모션디자이너"
      ],
      family: "brand_motion",
      responsibilityHints: [
        "브랜드 및 마케팅 영상 제작",
        "스토리보드 기반 모션 설계",
        "그래픽 요소 애니메이션화"
      ],
      levelHints: [
        "주니어는 템플릿 기반 제작 비중 높음",
        "시니어는 캠페인 콘셉트 및 연출 주도"
      ]
    },
    {
      id: "product_motion_designer",
      label: "프로덕트 모션 디자이너",
      aliases: [
        "ux motion designer",
        "ui motion designer"
      ],
      family: "product_motion",
      responsibilityHints: [
        "인터랙션 애니메이션 설계",
        "디자인 시스템 내 모션 정의",
        "개발 협업 통한 구현"
      ],
      levelHints: [
        "주니어는 단일 인터랙션 구현 중심",
        "시니어는 전체 UX 흐름 내 모션 전략 설계"
      ]
    },
    {
      id: "video_editor",
      label: "영상 편집자",
      aliases: [
        "video editor",
        "영상 편집 디자이너"
      ],
      family: "editing_motion",
      responsibilityHints: [
        "촬영 영상 컷 편집",
        "자막 및 효과 삽입",
        "콘텐츠 영상 완성"
      ],
      levelHints: [
        "주니어는 편집 기술 중심",
        "시니어는 스토리 구조 및 연출 기여"
      ]
    },
    {
      id: "3d_motion_designer",
      label: "3D 모션 디자이너",
      aliases: [
        "3d animator",
        "3d motion designer"
      ],
      family: "3d_motion",
      responsibilityHints: [
        "3D 애니메이션 제작",
        "렌더링 및 시각 표현 설계",
        "제품/브랜드 3D 영상 제작"
      ],
      levelHints: [
        "주니어는 툴 활용 및 기본 애니메이션 중심",
        "시니어는 연출 및 시각 스타일 결정"
      ]
    }
  ],
  axes: [
    {
      axisId: "purpose_focus",
      label: "영상 목적 중심축",
      values: [
        "브랜드/마케팅 메시지 전달",
        "제품 기능/UX 설명",
        "콘텐츠 편집/스토리 전달"
      ]
    },
    {
      axisId: "interaction_level",
      label: "인터랙션 개입 수준",
      values: [
        "비인터랙티브 영상",
        "부분 인터랙션 포함",
        "인터랙션 중심 모션"
      ]
    },
    {
      axisId: "production_basis",
      label: "제작 기반",
      values: [
        "촬영 영상 기반",
        "2D 그래픽 기반",
        "3D 렌더링 기반"
      ]
    }
  ],
  adjacentFamilies: [
    "graphic_design",
    "ux_design",
    "content_production"
  ],
  boundaryHints: [
    "브랜드 메시지 전달과 캠페인 목적 영상 비중이 커질수록 브랜드 모션으로 이동합니다.",
    "제품 기능 설명과 인터랙션 설계 비중이 커질수록 프로덕트 모션으로 읽힙니다.",
    "촬영 소스 기반 편집과 후반 작업 비중이 높아지면 영상 편집 영역으로 해석됩니다.",
    "3D 툴과 렌더링 중심 작업 비중이 커지면 3D 모션 영역으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 영상과 모션을 통해 메시지나 경험을 전달하는 역할로, 목적과 제작 방식에 따라 성격이 달라집니다. 브랜드 전달 중심이면 마케팅 영상, 사용자 흐름 중심이면 프로덕트 모션으로 구분되며, 촬영 편집 중심일 경우 영상 편집 영역으로도 읽힐 수 있습니다."
};
