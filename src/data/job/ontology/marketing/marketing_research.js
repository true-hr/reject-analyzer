export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "MARKETING_RESEARCH",
  aliases: [
    "시장조사",
    "마케팅 리서치",
    "마케팅 조사",
    "consumer research",
    "market research",
    "insight research",
    "user research",
    "CX research",
    "리서치 담당",
    "리서처"
  ],
  families: [
    {
      id: "QUANT_RESEARCH",
      label: "정량 조사 중심 리서치",
      aliases: [
        "정량조사",
        "설문조사",
        "quant research",
        "survey research"
      ],
      strongSignals: [
        "설문 설계 및 문항 구조화",
        "표본 설계 및 샘플링 방식 정의",
        "온라인/오프라인 설문 데이터 수집",
        "통계 분석을 통한 인사이트 도출",
        "SPSS, R, Python 등 활용 분석",
        "N수 확보 및 신뢰도 검증",
        "정량 리포트 작성 및 결과 해석"
      ],
      mediumSignals: [
        "기초 통계 분석",
        "데이터 클렌징",
        "설문 응답 관리",
        "크로스탭 분석",
        "리포트 시각화"
      ],
      boundarySignals: [
        "인터뷰, FGI 등 정성적 접근이 많아지면 정성 리서치로 이동",
        "데이터 파이프라인 및 로그 데이터 분석 중심이면 데이터 직무로 이동",
        "리서치 결과를 기반으로 전략 실행까지 담당하면 마케팅 전략으로 이동"
      ],
      adjacentFamilies: [
        "QUAL_RESEARCH",
        "UX_CX_RESEARCH",
        "INSIGHT_STRATEGY_RESEARCH"
      ],
      boundaryNote: "설문과 통계 기반으로 시장과 고객을 분석하는 비중이 크면 정량 조사 중심 리서치로 읽힙니다. 반면 인터뷰나 맥락 탐색 비중이 커지면 정성 리서치로 이동합니다.",
      summaryTemplate: "이 직무는 설문과 데이터 분석을 기반으로 시장과 고객을 수치로 해석하는 성격이 강합니다. 반면 정성적 탐색이나 전략 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "QUAL_RESEARCH",
      label: "정성 조사 중심 리서치",
      aliases: [
        "정성조사",
        "FGI",
        "in-depth interview",
        "qualitative research"
      ],
      strongSignals: [
        "심층 인터뷰(IDI) 설계 및 진행",
        "FGI(포커스 그룹 인터뷰) 운영",
        "사용자 발화 및 행동 관찰 기반 인사이트 도출",
        "리서치 가이드 작성 및 질문 설계",
        "녹취 분석 및 테마 도출",
        "맥락 중심 인사이트 정리",
        "스토리 기반 리포트 작성"
      ],
      mediumSignals: [
        "인터뷰 리크루팅",
        "리서치 노트 정리",
        "발화 코딩",
        "인사이트 클러스터링",
        "리포트 스토리라인 구성"
      ],
      boundarySignals: [
        "수치 기반 검증과 통계 분석이 많아지면 정량 리서치로 이동",
        "제품 UX 개선 중심이면 UX/CX 리서치로 이동",
        "전략 도출과 의사결정 지원 비중이 커지면 인사이트 전략 리서치로 이동"
      ],
      adjacentFamilies: [
        "QUANT_RESEARCH",
        "UX_CX_RESEARCH",
        "INSIGHT_STRATEGY_RESEARCH"
      ],
      boundaryNote: "인터뷰와 관찰을 통해 고객의 맥락과 인식을 깊이 이해하는 역할이면 정성 조사 중심 리서치로 읽힙니다. 반면 수치 검증이나 UX 개선 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 인터뷰와 관찰을 통해 고객의 생각과 행동 맥락을 해석하는 성격이 강합니다. 반면 데이터 분석이나 제품 개선 중심으로 이동하면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "UX_CX_RESEARCH",
      label: "UX/CX 리서치",
      aliases: [
        "UX 리서치",
        "CX 리서치",
        "user research",
        "customer experience research"
      ],
      strongSignals: [
        "제품/서비스 사용성 테스트 설계 및 수행",
        "유저 행동 기반 UX 개선 인사이트 도출",
        "고객 여정 맵(Customer Journey Map) 작성",
        "터치포인트별 경험 분석",
        "프로덕트 팀과 협업하여 개선안 도출",
        "사용자 테스트 결과 기반 기능 개선 제안",
        "서비스 경험 리포트 작성"
      ],
      mediumSignals: [
        "프로토타입 테스트",
        "유저 인터뷰",
        "행동 로그 참고 분석",
        "UX 리포트 작성",
        "서비스 플로우 이해"
      ],
      boundarySignals: [
        "제품 개선 실행까지 직접 담당하면 프로덕트 직무로 이동",
        "마케팅 캠페인이나 브랜드 인식 중심이면 정성/정량 리서치로 이동",
        "데이터 분석 중심이면 데이터 직무로 이동"
      ],
      adjacentFamilies: [
        "QUAL_RESEARCH",
        "QUANT_RESEARCH",
        "INSIGHT_STRATEGY_RESEARCH"
      ],
      boundaryNote: "사용자의 실제 서비스 경험과 행동을 분석해 UX/CX 개선에 기여하면 UX/CX 리서치로 읽힙니다. 반면 시장 인식 조사나 데이터 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 사용자 경험을 분석하고 서비스 개선 인사이트를 도출하는 성격이 강합니다. 반면 마케팅 조사나 데이터 분석 중심으로 이동하면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "INSIGHT_STRATEGY_RESEARCH",
      label: "인사이트·전략 리서치",
      aliases: [
        "insight research",
        "market insight",
        "strategy research"
      ],
      strongSignals: [
        "시장 및 경쟁사 분석 기반 전략 인사이트 도출",
        "리서치 결과를 바탕으로 의사결정 지원",
        "브랜드 포지셔닝 및 타겟 정의 지원",
        "경영진 보고용 인사이트 리포트 작성",
        "다양한 리서치 결과 통합 및 해석",
        "시장 트렌드 분석 및 전망 도출",
        "사업/마케팅 전략 연결 인사이트 제공"
      ],
      mediumSignals: [
        "리서치 결과 요약",
        "시장 데이터 정리",
        "경쟁사 벤치마킹",
        "트렌드 리포트 작성",
        "프레젠테이션 작성"
      ],
      boundarySignals: [
        "리서치 수행보다 실행 전략 비중이 커지면 사업기획/마케팅 전략으로 이동",
        "데이터 분석 깊이가 커지면 데이터 기반 CRM/분석 직무로 이동",
        "조사 수행 비중이 높아지면 정량/정성 리서치로 이동"
      ],
      adjacentFamilies: [
        "QUANT_RESEARCH",
        "QUAL_RESEARCH",
        "UX_CX_RESEARCH"
      ],
      boundaryNote: "리서치 결과를 종합해 전략적 인사이트를 도출하고 의사결정을 지원하는 역할이면 인사이트·전략 리서치로 읽힙니다. 반면 조사 수행 자체 비중이 크면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 다양한 리서치 결과를 통합해 전략적 인사이트를 도출하는 성격이 강합니다. 반면 조사 수행이나 실행 전략 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "MARKET_RESEARCHER",
      label: "시장조사 담당",
      aliases: [
        "market researcher",
        "consumer researcher"
      ],
      family: "QUANT_RESEARCH",
      responsibilityHints: [
        "설문 설계",
        "데이터 분석",
        "시장 조사",
        "리포트 작성"
      ],
      levelHints: [
        "주니어는 조사 실행과 데이터 정리에 집중",
        "시니어는 설계와 인사이트 도출 비중이 큼"
      ]
    },
    {
      id: "QUAL_RESEARCHER",
      label: "정성 리서처",
      aliases: [
        "qual researcher",
        "interview researcher"
      ],
      family: "QUAL_RESEARCH",
      responsibilityHints: [
        "인터뷰 설계",
        "FGI 진행",
        "인사이트 도출",
        "리포트 작성"
      ],
      levelHints: [
        "주니어는 인터뷰 운영 중심",
        "시니어는 질문 설계와 해석 비중이 큼"
      ]
    },
    {
      id: "UX_RESEARCHER",
      label: "UX 리서처",
      aliases: [
        "ux researcher",
        "cx researcher"
      ],
      family: "UX_CX_RESEARCH",
      responsibilityHints: [
        "사용성 테스트",
        "유저 행동 분석",
        "경험 개선 제안",
        "프로덕트 협업"
      ],
      levelHints: [
        "주니어는 테스트 실행 중심",
        "시니어는 리서치 설계와 전략 연결 비중이 큼"
      ]
    },
    {
      id: "INSIGHT_ANALYST",
      label: "인사이트 분석 담당",
      aliases: [
        "insight analyst",
        "strategy researcher"
      ],
      family: "INSIGHT_STRATEGY_RESEARCH",
      responsibilityHints: [
        "시장 분석",
        "경쟁사 분석",
        "전략 인사이트 도출",
        "경영 보고"
      ],
      levelHints: [
        "주니어는 데이터 정리와 리포트 보조",
        "시니어는 전략 인사이트와 의사결정 지원 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "RESEARCH_METHOD",
      label: "조사 방식",
      values: [
        "정량 설문 기반",
        "정성 인터뷰 기반",
        "UX 행동 기반",
        "혼합 및 통합 분석"
      ]
    },
    {
      axisId: "OUTPUT_TYPE",
      label: "산출물 성격",
      values: [
        "수치 데이터와 통계",
        "맥락 인사이트",
        "사용자 경험 개선안",
        "전략적 인사이트"
      ]
    },
    {
      axisId: "BUSINESS_IMPACT",
      label: "비즈니스 연결 방식",
      values: [
        "시장 이해",
        "고객 이해",
        "제품 개선",
        "전략 의사결정"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "조사 수행",
        "분석 해석",
        "경험 분석",
        "전략 연결"
      ]
    }
  ],
  adjacentFamilies: [
    "퍼포먼스마케팅",
    "브랜드마케팅",
    "CRM마케팅",
    "데이터분석",
    "프로덕트매니지먼트",
    "사업기획"
  ],
  boundaryHints: [
    "설문과 통계 분석 비중이 커지면 정량 조사 중심으로 읽힙니다.",
    "인터뷰와 맥락 탐색 비중이 커지면 정성 조사 중심으로 이동합니다.",
    "제품 사용성과 UX 개선 중심이면 UX/CX 리서치로 이동합니다.",
    "전략 인사이트와 의사결정 지원 비중이 커지면 인사이트·전략 리서치로 이동합니다.",
    "리서치 결과를 실행까지 직접 연결하면 마케팅 전략이나 사업기획으로 이동합니다.",
    "데이터 처리와 분석 기술 비중이 커지면 데이터 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 시장과 고객을 조사하고 인사이트를 도출하는 리서치 성격이 강합니다. 다만 정량, 정성, UX, 전략 중심으로 나뉘며 역할에 따라 작동 방식이 달라집니다. 반면 실행 전략이나 데이터 엔지니어링 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
