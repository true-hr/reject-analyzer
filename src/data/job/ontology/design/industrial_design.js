export const JOB_ONTOLOGY_ITEM = {
  vertical: "DESIGN",
  subVertical: "INDUSTRIAL_DESIGN",
  aliases: [
    "산업디자인",
    "제품디자인",
    "industrial design",
    "product design (hardware)",
    "제품 설계 디자인",
    "hardware design",
    "CMF 디자인",
    "제품 외형 디자인"
  ],
  families: [
    {
      id: "product_form_design",
      label: "제품 형태 디자인",
      aliases: [
        "제품 외형 디자인",
        "폼 디자인",
        "form design",
        "product form",
        "shape design"
      ],
      strongSignals: [
        "스케치 기반 아이데이션",
        "제품 외형 컨셉 도출",
        "3D 모델링으로 형태 검증",
        "인체공학 고려한 형태 설계",
        "디자인 컨셉 보드 제작"
      ],
      mediumSignals: [
        "렌더링 이미지 제작",
        "디자인 리뷰 참여",
        "제품 프로포션 조정",
        "디자인 시안 다수 제작"
      ],
      boundarySignals: [
        "CMF 요소보다 형태 자체 결정이 핵심일 때",
        "기구 설계보다 시각적/조형적 완성도가 강조될 때",
        "브랜드보다는 물리적 제품 경험이 중심일 때"
      ],
      adjacentFamilies: ["cmf_design", "mechanical_integration_design"],
      boundaryNote: "형태 탐색과 조형 완성도가 주요 책임일 때 해당 영역으로 읽히며, 소재·색상 정의 비중이 커지면 CMF로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 제품의 형태와 조형적 완성도를 중심으로 설계하는 역할입니다. 반면 소재나 컬러 정의 비중이 커지면 CMF 영역으로 해석될 수 있습니다."
    },
    {
      id: "cmf_design",
      label: "CMF 디자인",
      aliases: [
        "CMF",
        "color material finish",
        "컬러 소재 마감 디자인",
        "재질 디자인",
        "표면 디자인"
      ],
      strongSignals: [
        "컬러·소재·마감 전략 수립",
        "재질 샘플 테스트 및 선정",
        "표면 처리 방식 정의",
        "브랜드 컬러 시스템 반영",
        "양산 가능한 소재 스펙 정의"
      ],
      mediumSignals: [
        "공급업체와 소재 협의",
        "컬러 트렌드 리서치",
        "제품 라인업 간 CMF 일관성 유지"
      ],
      boundarySignals: [
        "형태보다는 표면과 감성 품질 정의가 핵심일 때",
        "브랜드 경험과 연결된 시각/촉각 요소가 강조될 때",
        "기구 구조보다 외관 마감 디테일이 중심일 때"
      ],
      adjacentFamilies: ["product_form_design", "design_strategy"],
      boundaryNote: "표면과 감성 품질 정의가 중심일 때 해당 영역으로 읽히며, 형태 설계 비중이 커지면 제품 형태 디자인으로 이동합니다.",
      summaryTemplate: "이 직무는 제품의 색상, 소재, 마감 등 감성 품질을 설계하는 역할입니다. 반면 형태 설계 비중이 커지면 제품 형태 디자인으로 해석될 수 있습니다."
    },
    {
      id: "mechanical_integration_design",
      label: "기구 연계 디자인",
      aliases: [
        "기구 연계 디자인",
        "design engineering",
        "제품 설계 연계",
        "기구 협업 디자인"
      ],
      strongSignals: [
        "기구 설계와 협업하여 디자인 구현",
        "양산 가능성 고려한 디자인 수정",
        "부품 구조 이해 기반 디자인 결정",
        "CAD 데이터 기반 설계 조율",
        "설계 제약 조건 반영"
      ],
      mediumSignals: [
        "엔지니어와 반복 피드백",
        "구조적 문제 해결 참여",
        "조립 방식 고려 디자인"
      ],
      boundarySignals: [
        "디자인보다 구조적 제약 해결이 중심일 때",
        "외형보다는 내부 구조와 조립성이 중요한 경우",
        "렌더링보다 CAD 협업 비중이 클 때"
      ],
      adjacentFamilies: ["product_form_design"],
      boundaryNote: "구조적 제약과 양산 가능성 반영이 핵심일 때 해당 영역으로 읽히며, 조형 탐색 중심이면 제품 형태 디자인으로 이동합니다.",
      summaryTemplate: "이 직무는 기구 설계와 협업하여 실제 생산 가능한 디자인으로 구현하는 역할입니다. 반면 조형 탐색 비중이 커지면 제품 형태 디자인으로 해석될 수 있습니다."
    },
    {
      id: "design_strategy",
      label: "제품 디자인 전략",
      aliases: [
        "디자인 전략",
        "product design strategy",
        "컨셉 기획 디자인",
        "디자인 방향성 정의"
      ],
      strongSignals: [
        "제품 컨셉 방향성 정의",
        "시장/사용자 기반 디자인 전략 수립",
        "디자인 가이드라인 구축",
        "제품 포트폴리오 수준 디자인 기획",
        "브랜드와 제품 디자인 연결"
      ],
      mediumSignals: [
        "트렌드 분석",
        "컨셉 제안서 작성",
        "상위 방향성 리뷰 리딩"
      ],
      boundarySignals: [
        "실제 설계보다 방향성 정의가 중심일 때",
        "개별 제품보다 라인업/브랜드 차원 고민이 많을 때",
        "디자인 산출물보다 의사결정 영향력이 클 때"
      ],
      adjacentFamilies: ["cmf_design", "product_form_design"],
      boundaryNote: "전략과 방향성 정의가 중심일 때 해당 영역으로 읽히며, 실제 설계 수행 비중이 커지면 형태 디자인이나 CMF로 이동합니다.",
      summaryTemplate: "이 직무는 제품 디자인의 방향성과 전략을 정의하는 역할입니다. 반면 실제 설계 수행 비중이 커지면 다른 디자인 실행 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "industrial_designer",
      label: "산업디자이너",
      aliases: [
        "industrial designer",
        "제품디자이너",
        "product designer (hardware)"
      ],
      family: "product_form_design",
      responsibilityHints: [
        "제품 외형 컨셉 설계",
        "스케치 및 3D 모델링",
        "디자인 시안 제작"
      ],
      levelHints: [
        "주니어: 스케치 및 모델링 중심",
        "시니어: 컨셉 리딩 및 방향성 제안"
      ]
    },
    {
      id: "cmf_designer",
      label: "CMF 디자이너",
      aliases: [
        "CMF designer",
        "컬러 소재 디자이너"
      ],
      family: "cmf_design",
      responsibilityHints: [
        "컬러 및 소재 선정",
        "마감 방식 정의",
        "샘플 테스트"
      ],
      levelHints: [
        "주니어: 샘플 테스트 및 지원",
        "시니어: CMF 전략 수립"
      ]
    },
    {
      id: "design_engineer",
      label: "디자인 엔지니어",
      aliases: [
        "design engineer",
        "제품 설계 디자이너"
      ],
      family: "mechanical_integration_design",
      responsibilityHints: [
        "기구 설계 협업",
        "양산 가능성 반영",
        "CAD 기반 조율"
      ],
      levelHints: [
        "주니어: 설계 지원",
        "시니어: 설계 통합 및 문제 해결"
      ]
    },
    {
      id: "design_strategist",
      label: "디자인 전략가",
      aliases: [
        "design strategist",
        "제품 컨셉 기획"
      ],
      family: "design_strategy",
      responsibilityHints: [
        "디자인 방향성 정의",
        "시장/사용자 분석",
        "컨셉 제안"
      ],
      levelHints: [
        "주니어: 리서치 지원",
        "시니어: 전략 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "focus",
      label: "설계 중심",
      values: ["형태 중심", "표면/감성 중심", "구조/양산 중심", "전략/방향 중심"]
    },
    {
      axisId: "execution_level",
      label: "실행 vs 전략",
      values: ["실행 중심", "혼합", "전략 중심"]
    }
  ],
  adjacentFamilies: ["ux_ui_design", "mechanical_engineering"],
  boundaryHints: [
    "디지털 인터페이스 설계 비중이 커지면 UX/UI 디자인으로 이동합니다.",
    "구조 설계 자체 책임이 커지면 기계공학 영역으로 이동합니다.",
    "브랜드 경험 설계 비중이 커지면 디자인 전략 또는 브랜딩 영역으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 물리적 제품의 형태, 소재, 구조를 설계하는 역할입니다. 반면 디지털 경험이나 엔지니어링 중심 책임이 커지면 인접 영역으로 해석될 수 있습니다."
};
