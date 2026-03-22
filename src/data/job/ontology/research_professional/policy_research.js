export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "POLICY_RESEARCH",
  aliases: [
    "정책연구",
    "정책연구원",
    "정책 분석",
    "정책 개발",
    "policy research",
    "policy analyst",
    "public policy researcher",
    "정책 평가",
    "공공정책 연구"
  ],
  families: [
    {
      id: "policy_analysis",
      label: "정책 분석",
      aliases: [
        "정책 분석",
        "policy analysis",
        "정책 영향 분석",
        "정책 데이터 분석"
      ],
      strongSignals: [
        "정책 효과 분석 보고서 작성",
        "통계 데이터 기반 정책 영향 평가",
        "정책 시뮬레이션 또는 계량 분석 수행",
        "회귀분석, 패널데이터 등 활용 경험",
        "정책 대안 비교 분석 수행"
      ],
      mediumSignals: [
        "공공 데이터셋 활용 분석 경험",
        "리서치 방법론 기반 분석 설계",
        "정책 보고서 내 수치 근거 제시",
        "데이터 시각화 및 결과 해석"
      ],
      boundarySignals: [
        "정책 제안보다 분석 결과 해석 중심",
        "정성적 논의보다 계량적 근거 비중 높음",
        "의사결정 지원 자료 생산에 집중"
      ],
      adjacentFamilies: [
        "policy_planning",
        "policy_evaluation"
      ],
      boundaryNote: "데이터 기반 분석과 정책 효과 해석 비중이 높아질수록 이 영역으로 읽힙니다. 반면 정책 방향을 설계하거나 실행 전략을 수립하는 비중이 커지면 정책 기획으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 정책의 효과와 영향을 데이터 기반으로 분석하고 해석하는 성격이 강합니다. 반면 정책 방향 설정이나 전략 설계 비중이 커지면 정책 기획 영역으로 읽힐 수 있습니다."
    },
    {
      id: "policy_planning",
      label: "정책 기획",
      aliases: [
        "정책 기획",
        "policy planning",
        "정책 설계",
        "정책 개발"
      ],
      strongSignals: [
        "정책 방향 및 전략 수립",
        "신규 정책안 기획 및 제안",
        "이해관계자 의견 반영 정책 설계",
        "중장기 정책 로드맵 작성",
        "정책 실행 계획 수립"
      ],
      mediumSignals: [
        "정책 보고서 작성 경험",
        "정책 이슈 정의 및 구조화",
        "유사 정책 사례 조사",
        "부처 또는 기관 협업 기획"
      ],
      boundarySignals: [
        "데이터 분석보다 방향성 설정 비중 높음",
        "정책 실행을 위한 설계 중심 역할",
        "정성적 판단과 논리 구조 중심"
      ],
      adjacentFamilies: [
        "policy_analysis",
        "policy_research_academic"
      ],
      boundaryNote: "정책 방향 설정과 실행 전략 수립 비중이 커질수록 이 영역으로 분류됩니다. 반면 데이터 기반 효과 분석이 중심이 되면 정책 분석으로, 이론적 연구 비중이 커지면 학술 정책 연구로 이동합니다.",
      summaryTemplate: "이 직무는 정책 방향과 실행 전략을 설계하는 기획 중심 성격이 강합니다. 반면 데이터 기반 효과 분석 비중이 커지면 정책 분석 영역으로 읽힐 수 있습니다."
    },
    {
      id: "policy_evaluation",
      label: "정책 평가",
      aliases: [
        "정책 평가",
        "policy evaluation",
        "성과 평가",
        "정책 성과 분석"
      ],
      strongSignals: [
        "정책 성과 평가 보고서 작성",
        "성과 지표 설계 및 측정",
        "사업/정책 효과 사후 평가",
        "평가 프레임워크 구축",
        "외부 평가 또는 감사 대응 경험"
      ],
      mediumSignals: [
        "정량/정성 혼합 평가 수행",
        "성과 데이터 수집 및 분석",
        "평가 기준 설계 참여",
        "프로그램 리뷰 및 개선 제안"
      ],
      boundarySignals: [
        "사후 평가 중심 역할",
        "정책 설계보다 결과 검증 비중 높음",
        "성과 지표 중심 사고"
      ],
      adjacentFamilies: [
        "policy_analysis"
      ],
      boundaryNote: "정책 시행 이후 성과를 측정하고 평가하는 비중이 커질수록 이 영역으로 읽힙니다. 반면 사전 분석이나 대안 비교 중심이면 정책 분석으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 정책 시행 이후 성과를 측정하고 평가하는 역할에 집중된 성격이 강합니다. 반면 사전 영향 분석이나 대안 비교 비중이 커지면 정책 분석 영역으로 읽힐 수 있습니다."
    },
    {
      id: "policy_research_academic",
      label: "학술 정책 연구",
      aliases: [
        "정책 연구",
        "policy research academic",
        "공공정책 연구",
        "학술 정책 연구"
      ],
      strongSignals: [
        "학술 논문 기반 정책 연구 수행",
        "이론 모델 기반 정책 분석",
        "연구과제 수행 및 논문 게재",
        "학회 발표 및 연구 보고서 작성",
        "장기적 정책 이슈 연구"
      ],
      mediumSignals: [
        "문헌 리뷰 및 선행 연구 분석",
        "연구 설계 및 방법론 구축",
        "연구기관 또는 대학 소속 경험",
        "연구비 과제 수행"
      ],
      boundarySignals: [
        "실무 적용보다 이론적 기여 중심",
        "정책 실행보다는 연구 축적 목적",
        "시간 범위가 장기적"
      ],
      adjacentFamilies: [
        "policy_planning",
        "policy_analysis"
      ],
      boundaryNote: "이론 기반 연구와 학술적 기여 비중이 커질수록 이 영역으로 분류됩니다. 반면 정책 실행과 직접 연결된 기획이나 분석 비중이 커지면 실무 정책 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 정책 이슈를 이론과 연구 방법론 기반으로 탐구하는 학술적 성격이 강합니다. 반면 정책 실행과 직접 연결된 기획이나 분석 비중이 커지면 실무 정책 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "policy_analyst",
      label: "정책 분석가",
      aliases: [
        "policy analyst",
        "정책 분석가"
      ],
      family: "policy_analysis",
      responsibilityHints: [
        "정책 데이터 분석 및 해석",
        "정책 영향 평가",
        "대안 비교 분석"
      ],
      levelHints: [
        "주니어는 데이터 처리 및 분석 수행 중심",
        "시니어는 분석 설계 및 정책 해석 주도"
      ]
    },
    {
      id: "policy_planner",
      label: "정책 기획자",
      aliases: [
        "policy planner",
        "정책 기획자"
      ],
      family: "policy_planning",
      responsibilityHints: [
        "정책 방향 설정",
        "정책안 기획 및 제안",
        "실행 전략 수립"
      ],
      levelHints: [
        "주니어는 자료 조사 및 초안 작성 중심",
        "시니어는 정책 구조 설계 및 의사결정 영향"
      ]
    },
    {
      id: "policy_evaluator",
      label: "정책 평가자",
      aliases: [
        "policy evaluator",
        "정책 평가 담당"
      ],
      family: "policy_evaluation",
      responsibilityHints: [
        "정책 성과 평가",
        "지표 설계 및 측정",
        "평가 보고서 작성"
      ],
      levelHints: [
        "주니어는 데이터 수집 및 정리 중심",
        "시니어는 평가 프레임워크 설계 및 총괄"
      ]
    },
    {
      id: "policy_researcher",
      label: "정책 연구원",
      aliases: [
        "policy researcher",
        "공공정책 연구원"
      ],
      family: "policy_research_academic",
      responsibilityHints: [
        "정책 관련 연구 수행",
        "논문 및 연구 보고서 작성",
        "이론 기반 정책 분석"
      ],
      levelHints: [
        "주니어는 연구 지원 및 데이터 분석",
        "시니어는 연구 설계 및 프로젝트 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_phase",
      label: "정책 관여 단계",
      values: [
        "사전 분석 및 대안 검토",
        "정책 설계 및 기획",
        "사후 평가 및 성과 검증"
      ]
    },
    {
      axisId: "methodology",
      label: "연구 접근 방식",
      values: [
        "계량 분석 중심",
        "정성 분석 및 논리 설계",
        "이론 및 학술 연구 중심"
      ]
    },
    {
      axisId: "application_level",
      label: "실무 적용 수준",
      values: [
        "실행 정책 직접 연계",
        "의사결정 지원",
        "학술적 연구 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "data_analysis",
    "consulting_strategy",
    "public_administration"
  ],
  boundaryHints: [
    "데이터 기반 분석과 수치 해석 비중이 높아지면 정책 분석으로 이동합니다.",
    "정책 방향 설정과 실행 전략 설계 비중이 커지면 정책 기획으로 읽힙니다.",
    "정책 시행 이후 성과 측정과 평가 비중이 커지면 정책 평가로 이동합니다.",
    "학술 논문과 이론 기반 연구 비중이 커지면 학술 정책 연구 영역으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 정책을 분석, 설계, 평가 또는 연구하는 역할로 구성되며 관여 단계와 방법론에 따라 성격이 달라집니다. 데이터 기반 분석이면 정책 분석, 방향 설계 중심이면 정책 기획으로 구분되며, 학술 연구 비중이 커지면 연구 중심 영역으로 읽힐 수 있습니다."
};
