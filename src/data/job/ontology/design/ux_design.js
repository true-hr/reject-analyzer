export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "UX_DESIGN",
  aliases: [
    "UX 디자이너",
    "사용자 경험 디자이너",
    "UX Designer",
    "User Experience Designer",
    "서비스 기획자",
    "UX 기획",
    "프로덕트 디자이너",
    "Product Designer"
  ],
  families: [
    {
      id: "PRODUCT_UX_DESIGN",
      label: "프로덕트 UX 디자인",
      aliases: [
        "프로덕트 디자이너",
        "Product UX",
        "서비스 UX 설계",
        "디지털 제품 UX"
      ],
      strongSignals: [
        "사용자 흐름(User Flow) 설계 경험",
        "와이어프레임 및 인터랙션 설계",
        "기능 단위 UX 설계 및 개선",
        "개발자와 협업하여 실제 제품 반영",
        "Figma 등으로 UI/UX 설계 산출물 제작"
      ],
      mediumSignals: [
        "유저 저니맵 작성 경험",
        "UX 개선 A/B 테스트 참여",
        "기능 정의 및 요구사항 정리",
        "사용성 개선 반복 작업 경험"
      ],
      boundarySignals: [
        "비주얼 UI 디테일 작업 비중이 커지면 UI 디자인으로 이동",
        "사용자 리서치 및 데이터 분석 비중이 커지면 UX 리서치로 이동",
        "브랜드/마케팅 중심 화면 설계가 많아지면 마케팅 디자인으로 이동"
      ],
      adjacentFamilies: ["UX_RESEARCH", "UI_VISUAL_DESIGN"],
      boundaryNote: "제품 기능 흐름과 사용성을 설계하는 역할입니다. 화면 스타일링 중심이면 UI 디자인으로, 사용자 조사 중심이면 UX 리서치로 해석됩니다.",
      summaryTemplate: "이 직무는 디지털 제품의 사용자 흐름과 사용성을 설계하는 프로덕트 UX 성격이 강합니다. 반면 시각 표현이나 리서치 비중이 커지면 다른 UX 영역으로 읽힐 수 있습니다."
    },
    {
      id: "UX_RESEARCH",
      label: "UX 리서치",
      aliases: [
        "UX 리서처",
        "User Researcher",
        "사용자 조사",
        "UX Research"
      ],
      strongSignals: [
        "사용자 인터뷰 및 사용성 테스트 수행",
        "정성/정량 사용자 데이터 분석",
        "리서치 설계 및 리포트 작성",
        "사용자 행동 기반 인사이트 도출",
        "페르소나 및 사용자 세그먼트 정의"
      ],
      mediumSignals: [
        "설문조사 설계 및 분석",
        "리서치 결과를 제품 개선에 연결",
        "데이터 기반 UX 인사이트 도출",
        "리서치 결과 공유 및 워크숍 진행"
      ],
      boundarySignals: [
        "화면 설계 및 인터랙션 정의 비중 증가 시 프로덕트 UX로 이동",
        "비주얼/UI 작업 비중 증가 시 UI 디자인으로 이동",
        "데이터 분석 모델링 중심이면 데이터 분석 직무로 이동"
      ],
      adjacentFamilies: ["PRODUCT_UX_DESIGN"],
      boundaryNote: "사용자 이해와 인사이트 도출이 핵심입니다. 실제 화면 설계 비중이 커지면 프로덕트 UX로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 행동과 니즈를 분석해 UX 인사이트를 도출하는 리서치 성격이 강합니다. 반면 설계 비중이 커지면 프로덕트 UX로 해석될 수 있습니다."
    },
    {
      id: "UI_VISUAL_DESIGN",
      label: "UI/비주얼 UX 디자인",
      aliases: [
        "UI 디자이너",
        "비주얼 디자이너",
        "UI Designer",
        "Visual Designer"
      ],
      strongSignals: [
        "UI 컴포넌트 디자인",
        "컬러, 타이포그래피, 스타일 가이드 정의",
        "디자인 시스템 구축 및 관리",
        "픽셀 단위 화면 디테일 작업",
        "Figma, Sketch 등으로 UI 디자인 산출물 제작"
      ],
      mediumSignals: [
        "디자인 시스템 컴포넌트 관리",
        "브랜드 가이드 기반 UI 적용",
        "디자인 QA 및 구현 검수",
        "아이콘 및 그래픽 요소 제작"
      ],
      boundarySignals: [
        "사용자 흐름 및 기능 설계 비중 증가 시 프로덕트 UX로 이동",
        "브랜드/마케팅 중심 시각 작업이 많아지면 그래픽/브랜딩 디자인으로 이동",
        "사용자 조사 비중 증가 시 UX 리서치로 이동"
      ],
      adjacentFamilies: ["PRODUCT_UX_DESIGN"],
      boundaryNote: "시각적 완성도와 UI 표현이 핵심입니다. 기능 흐름 설계 비중이 커지면 프로덕트 UX로 해석됩니다.",
      summaryTemplate: "이 직무는 인터페이스의 시각적 완성도와 일관성을 만드는 UI/비주얼 디자인 성격이 강합니다. 반면 기능 흐름 설계 비중이 커지면 UX 설계 영역으로 이동할 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PRODUCT_DESIGNER",
      label: "프로덕트 디자이너",
      aliases: ["Product Designer", "UX/UI 디자이너"],
      family: "PRODUCT_UX_DESIGN",
      responsibilityHints: [
        "사용자 흐름 및 기능 UX 설계",
        "와이어프레임 및 프로토타입 제작",
        "개발자와 협업하여 기능 구현"
      ],
      levelHints: [
        "주니어: 화면 및 기능 단위 설계",
        "미드: 사용자 흐름 및 구조 설계",
        "시니어: 제품 UX 전략 및 구조 설계 주도"
      ]
    },
    {
      id: "UX_RESEARCHER",
      label: "UX 리서처",
      aliases: ["User Researcher", "UX Analyst"],
      family: "UX_RESEARCH",
      responsibilityHints: [
        "사용자 인터뷰 및 테스트 설계",
        "리서치 데이터 분석",
        "UX 인사이트 도출 및 공유"
      ],
      levelHints: [
        "주니어: 리서치 실행 및 정리",
        "미드: 리서치 설계 및 분석",
        "시니어: 리서치 전략 및 조직 내 확산"
      ]
    },
    {
      id: "UI_DESIGNER",
      label: "UI 디자이너",
      aliases: ["UI Designer", "Visual Designer"],
      family: "UI_VISUAL_DESIGN",
      responsibilityHints: [
        "UI 컴포넌트 및 화면 디자인",
        "디자인 시스템 구축",
        "디자인 QA 및 구현 검수"
      ],
      levelHints: [
        "주니어: UI 구성 및 스타일 적용",
        "미드: 디자인 시스템 관리",
        "시니어: 디자인 기준 및 체계 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "DESIGN_FOCUS",
      label: "디자인 초점",
      values: [
        "사용자 흐름/기능 설계 중심",
        "사용자 이해/리서치 중심",
        "시각/UI 표현 중심"
      ]
    },
    {
      axisId: "OUTPUT_TYPE",
      label: "주요 산출물 유형",
      values: [
        "와이어프레임/프로토타입",
        "리서치 리포트/인사이트",
        "UI 디자인/컴포넌트"
      ]
    }
  ],
  adjacentFamilies: [
    "GRAPHIC_DESIGN",
    "PRODUCT_MANAGEMENT",
    "FRONTEND_DEVELOPMENT"
  ],
  boundaryHints: [
    "사용자 흐름 설계와 기능 정의 비중이 커지면 프로덕트 UX로 이동합니다",
    "사용자 조사 및 데이터 분석 비중이 커지면 UX 리서치로 해석됩니다",
    "비주얼 스타일과 UI 디테일 작업이 많아지면 UI 디자인으로 이동합니다",
    "기획 및 요구사항 정의 중심이면 프로덕트 매니지먼트로 이동할 수 있습니다"
  ],
  summaryTemplate: "이 직무는 사용자 경험을 설계하는 역할로, 기능 흐름 설계, 사용자 리서치, UI 표현 중심으로 나뉩니다. 실제 수행하는 작업의 비중에 따라 세부 영역이 달라질 수 있습니다."
};
