export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "UI_DESIGN",
  aliases: [
    "UI 디자이너",
    "User Interface Designer",
    "인터페이스 디자이너",
    "비주얼 디자이너",
    "앱 UI 디자이너",
    "웹 UI 디자이너",
    "UI/UX 디자이너"
  ],
  families: [
    {
      id: "VISUAL_UI",
      label: "비주얼 중심 UI",
      aliases: [
        "Visual UI Designer",
        "그래픽 UI 디자이너",
        "비주얼 UI 디자이너"
      ],
      strongSignals: [
        "컬러, 타이포그래피, 레이아웃 등 시각 요소 설계 중심 작업",
        "고해상도 UI 시안 제작 (Figma, Sketch 등)",
        "브랜드 가이드에 맞춘 UI 스타일 적용",
        "아이콘, 이미지, 그래픽 요소 직접 제작",
        "디자인 QA에서 픽셀 단위 수정 및 시각 완성도 개선"
      ],
      mediumSignals: [
        "디자인 시스템을 활용한 화면 디자인",
        "모바일/웹 UI 시각 디자인 경험",
        "디자이너 중심 결과물 (시안, 스타일 가이드)",
        "간단한 인터랙션 정의"
      ],
      boundarySignals: [
        "사용자 흐름 및 정보 구조 설계 비중이 커지면 UX/UI 통합으로 이동",
        "컴포넌트 구조 및 토큰 설계 비중이 커지면 디자인 시스템으로 이동"
      ],
      adjacentFamilies: [
        "UX_UI_INTEGRATED",
        "DESIGN_SYSTEM_UI"
      ],
      boundaryNote: "시각적 표현과 브랜드 일관성이 핵심입니다. 사용자 흐름 설계나 구조 정의 비중이 커질수록 UX/UI 통합 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 인터페이스의 시각적 완성도와 표현을 중심으로 설계하는 성격이 강합니다. 반면 사용자 흐름이나 구조 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "UX_UI_INTEGRATED",
      label: "UX/UI 통합 설계",
      aliases: [
        "UX/UI 디자이너",
        "프로덕트 디자이너",
        "Product Designer"
      ],
      strongSignals: [
        "사용자 플로우(Flow) 및 정보 구조(IA) 설계",
        "와이어프레임부터 UI까지 end-to-end 설계",
        "사용자 시나리오 기반 인터페이스 정의",
        "프로토타입 제작 및 사용성 테스트 수행",
        "기획/PM과 협업하여 기능 구조 정의"
      ],
      mediumSignals: [
        "Figma 기반 인터랙션 프로토타입 제작",
        "사용자 피드백 기반 UI 개선",
        "데이터 기반 UX 개선 경험",
        "서비스 단위 기능 설계 참여"
      ],
      boundarySignals: [
        "시각 표현 완성도 작업 비중이 커지면 비주얼 UI로 이동",
        "컴포넌트 재사용성과 시스템 설계 비중이 커지면 디자인 시스템으로 이동"
      ],
      adjacentFamilies: [
        "VISUAL_UI",
        "DESIGN_SYSTEM_UI"
      ],
      boundaryNote: "사용자 흐름과 인터페이스 구조를 함께 설계하는 것이 핵심입니다. 시각 표현 중심으로 치우치면 비주얼 UI로, 시스템 설계 중심으로 이동하면 디자인 시스템으로 해석됩니다.",
      summaryTemplate: "이 직무는 사용자 흐름과 인터페이스를 함께 설계하는 통합적인 성격이 강합니다. 반면 시각 표현이나 시스템 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "DESIGN_SYSTEM_UI",
      label: "디자인 시스템 중심",
      aliases: [
        "디자인 시스템 디자이너",
        "UI 시스템 디자이너",
        "Design System Designer"
      ],
      strongSignals: [
        "디자인 시스템 구축 및 유지 관리",
        "UI 컴포넌트 라이브러리 설계 (버튼, 입력창 등)",
        "컬러/타이포 토큰 정의 및 관리",
        "디자인-개발 간 공통 규칙 정의",
        "재사용 가능한 UI 패턴 설계"
      ],
      mediumSignals: [
        "Figma 컴포넌트 및 Variants 구조 설계",
        "디자인 가이드 문서화",
        "개발자와 협업하여 UI 규칙 정리",
        "대규모 서비스 UI 일관성 관리 경험"
      ],
      boundarySignals: [
        "실제 화면 설계 및 UX 흐름 비중이 커지면 UX/UI 통합으로 이동",
        "시각 스타일링 작업 비중이 커지면 비주얼 UI로 이동"
      ],
      adjacentFamilies: [
        "UX_UI_INTEGRATED",
        "VISUAL_UI"
      ],
      boundaryNote: "재사용성과 일관성을 위한 시스템 설계가 핵심입니다. 실제 화면 설계나 사용자 흐름 비중이 커지면 UX/UI 통합 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 UI 컴포넌트와 디자인 시스템을 설계하여 일관성과 생산성을 높이는 성격이 강합니다. 반면 실제 화면 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "UI_DESIGNER",
      label: "UI 디자이너",
      aliases: [
        "UI Designer",
        "인터페이스 디자이너"
      ],
      family: "VISUAL_UI",
      responsibilityHints: [
        "UI 시안 제작 및 시각 디자인",
        "브랜드 가이드 기반 인터페이스 설계",
        "디자인 QA 및 시각 품질 관리"
      ],
      levelHints: [
        "주니어: 시안 제작 및 수정 중심",
        "미드: 화면 단위 UI 설계 주도",
        "시니어: 전체 UI 스타일 방향성 정의"
      ]
    },
    {
      id: "PRODUCT_DESIGNER",
      label: "프로덕트 디자이너",
      aliases: [
        "Product Designer",
        "UX/UI 디자이너"
      ],
      family: "UX_UI_INTEGRATED",
      responsibilityHints: [
        "사용자 흐름 및 기능 구조 설계",
        "와이어프레임부터 UI까지 통합 설계",
        "사용성 개선 및 실험 설계"
      ],
      levelHints: [
        "주니어: 화면 단위 UX/UI 설계",
        "미드: 기능 단위 UX 설계 및 개선",
        "시니어: 서비스 단위 UX 전략 및 구조 설계"
      ]
    },
    {
      id: "DESIGN_SYSTEM_DESIGNER",
      label: "디자인 시스템 디자이너",
      aliases: [
        "Design System Designer",
        "UI 시스템 디자이너"
      ],
      family: "DESIGN_SYSTEM_UI",
      responsibilityHints: [
        "디자인 시스템 및 컴포넌트 설계",
        "디자인 토큰 및 규칙 정의",
        "디자인-개발 협업 구조 구축"
      ],
      levelHints: [
        "미드: 컴포넌트 설계 및 유지 관리",
        "시니어: 조직 단위 디자인 시스템 전략 수립"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_FOCUS",
      label: "주요 설계 초점",
      values: [
        "시각 표현 중심",
        "사용자 흐름 중심",
        "시스템/재사용성 중심"
      ]
    },
    {
      axisId: "OUTPUT_FORM",
      label: "주요 산출물 형태",
      values: [
        "UI 시안 및 그래픽",
        "와이어프레임/프로토타입",
        "컴포넌트/디자인 시스템"
      ]
    },
    {
      axisId: "RESPONSIBILITY_SCOPE",
      label: "책임 범위",
      values: [
        "화면 단위",
        "기능/플로우 단위",
        "플랫폼/시스템 단위"
      ]
    }
  ],
  adjacentFamilies: [
    "UX_DESIGN",
    "PRODUCT_MANAGEMENT",
    "FRONTEND_DEVELOPMENT"
  ],
  boundaryHints: [
    "사용자 흐름 설계와 리서치 비중이 커지면 UX 디자인으로 이동합니다",
    "기능 정의 및 요구사항 설계 비중이 커지면 프로덕트 기획으로 읽힐 수 있습니다",
    "UI 구현 코드 작성 비중이 커지면 프론트엔드 개발로 이동합니다",
    "컴포넌트 재사용성과 시스템 설계 비중이 커지면 디자인 시스템 영역으로 이동합니다"
  ],
  summaryTemplate: "이 직무는 사용자 인터페이스의 시각적 구성과 구조를 설계하는 역할을 수행하는 성격이 강합니다. 다만 시각 표현, 사용자 흐름, 시스템 설계 중 어떤 요소의 비중이 크냐에 따라 세부 직무 경계가 달라질 수 있습니다."
};
