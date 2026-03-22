export const JOB_ONTOLOGY_ITEM = {
  majorCategory: "BUSINESS",
  subcategory: "STRATEGY",
  id: "JOB_BUSINESS_STRATEGY",
  label: "전략기획",
  aliases: [
    "전략기획",
    "전략 기획",
    "기업 전략",
    "경영 전략",
    "전략 수립",
    "경영기획",
    "경영 기획",
    "corporate strategy",
    "business strategy",
    "strategy planning",
    "strategic planning",
    "전략팀",
    "경영기획팀",
    "전략기획팀"
  ],
  families: [
    {
      id: "CORPORATE_STRATEGY_ANALYSIS",
      label: "경영전략 분석·수립",
      aliases: [
        "경영전략",
        "기업전략",
        "corporate strategy",
        "strategic analysis",
        "전략 수립"
      ],
      strongSignals: [
        "사업 포트폴리오와 경쟁 구도를 분석해 중장기 방향을 수립",
        "시장·산업 분석을 바탕으로 신사업 진출 또는 철수 판단 근거 작성",
        "C-level 또는 이사회 보고용 전략 의제와 방향 자료를 직접 작성",
        "사업 목표(OKR, KPI)와 전략 방향을 연결한 로드맵 설계",
        "M&A, 전략적 투자, 파트너십에 대한 분석과 검토 참여",
        "사업 성과 모니터링과 전략 수정 제안을 반복 수행",
        "사업부 또는 그룹 차원의 전략 방향을 조율하고 정렬"
      ],
      mediumSignals: [
        "산업 리서치 및 벤치마크 분석",
        "경쟁사 포지셔닝 분석",
        "전략 보고서 초안 작성",
        "경영진 미팅 자료 준비",
        "전략 프레임워크 적용"
      ],
      boundarySignals: [
        "전략 분석보다 사업 기획과 연간 계획 수립 비중이 커지면 연간 사업계획·실행관리로 이동",
        "전략 방향보다 운영 체계와 실행 프로세스 설계 비중이 커지면 운영기획으로 이동",
        "신사업 발굴보다 파트너십 체결과 거래 구조 설계 비중이 커지면 BD로 이동"
      ],
      adjacentFamilies: [
        "ANNUAL_BUSINESS_PLANNING",
        "NEW_BUSINESS_INCUBATION",
        "STRATEGIC_BD"
      ],
      boundaryNote: "중장기 방향 설정과 C-level 의사결정 지원이 중심이면 경영전략으로 읽힙니다. 반면 연간 계획, 실행 관리, 파트너십 체결이 중심이 되면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 시장과 경쟁 구도를 분석해 기업의 중장기 방향을 설정하고 경영진 의사결정을 지원하는 성격이 강합니다."
    },
    {
      id: "ANNUAL_BUSINESS_PLANNING",
      label: "연간 사업계획·실행관리",
      aliases: [
        "사업계획",
        "연간 계획",
        "경영계획",
        "business planning",
        "annual planning",
        "경영기획"
      ],
      strongSignals: [
        "연간 사업 목표와 부문별 실행 계획을 수립하고 조율",
        "예산 계획, 인력 계획, 투자 계획을 사업 방향과 연동해 통합",
        "반기·분기별 성과 점검과 계획 수정을 반복 수행",
        "사업부별 목표 설정과 달성 현황 모니터링 체계 운영",
        "전사 보고 체계와 경영진 리뷰 일정 관리",
        "전략 방향을 연간 실행 계획으로 구체화하는 가교 역할 수행"
      ],
      mediumSignals: [
        "부서별 계획 취합과 통합 정리",
        "성과 지표 설정과 추적",
        "보고 양식 표준화",
        "임원 보고 자료 작성"
      ],
      boundarySignals: [
        "연간 계획보다 중장기 방향 설정과 C-level 의사결정 지원 비중이 커지면 경영전략으로 이동",
        "계획 수립보다 특정 서비스·사업 단위 모델 설계 비중이 커지면 서비스기획 또는 BD로 이동"
      ],
      adjacentFamilies: [
        "CORPORATE_STRATEGY_ANALYSIS",
        "OPERATIONS_PLANNING_EXCELLENCE"
      ],
      boundaryNote: "연간 계획과 실행 모니터링이 중심이면 연간 사업계획·실행관리로 읽힙니다. 반면 3-5년 방향 설정이나 신사업 모델 설계 비중이 커지면 다른 경계로 이동합니다.",
      summaryTemplate: "이 직무는 전사 사업 목표를 연간 실행 계획으로 구체화하고 성과를 모니터링하는 성격이 강합니다."
    }
  ],
  roles: [
    {
      id: "CORPORATE_STRATEGY_MANAGER",
      label: "전략기획 담당",
      aliases: ["전략기획 담당", "corporate strategy manager", "strategic planner"],
      family: "CORPORATE_STRATEGY_ANALYSIS",
      responsibilityHints: [
        "중장기 전략 방향 분석 및 수립",
        "경영진 의사결정 지원",
        "신사업·M&A 검토 참여"
      ],
      levelHints: [
        "주니어는 데이터 수집·분석과 자료 작성 비중이 큼",
        "시니어는 프레임 설계와 C-level 직접 커뮤니케이션 비중이 큼"
      ]
    },
    {
      id: "BUSINESS_PLANNING_MANAGER",
      label: "경영기획 담당",
      aliases: ["경영기획 담당", "business planning manager", "경영계획 담당"],
      family: "ANNUAL_BUSINESS_PLANNING",
      responsibilityHints: [
        "연간 사업계획 수립 및 조율",
        "사업 성과 모니터링",
        "임원 보고 체계 운영"
      ],
      levelHints: [
        "주니어는 계획 취합과 보고 자료 작성 비중이 큼",
        "시니어는 전사 계획 조율과 임원 보고 직접 수행 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PLANNING_HORIZON",
      label: "기획 시계",
      values: ["중장기 전략(3-5년)", "연간 계획(1년)", "분기 실행 점검"]
    },
    {
      axisId: "AUDIENCE",
      label: "보고 대상",
      values: ["C-level / 이사회", "사업부장 / 임원진", "전사 통합 관리"]
    }
  ],
  adjacentFamilies: [
    "사업기획(service_planning)",
    "사업개발(BD)",
    "운영기획(operations_management)",
    "재무기획(finance_accounting)"
  ],
  boundaryHints: [
    "중장기 방향 설정과 C-level 의사결정 지원이 중심이면 경영전략으로 읽힙니다.",
    "연간 계획 수립과 실행 모니터링이 중심이면 경영기획으로 읽힙니다.",
    "전략보다 특정 서비스나 제품 단위의 기획이 중심이면 서비스기획(service_planning)으로 이동합니다.",
    "전략 방향을 파트너십이나 신사업 계약으로 연결하는 비중이 커지면 BD 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 기업의 방향 설정과 성과 달성 체계를 만드는 역할로, 실제 역할은 중장기 전략 수립 중심(경영전략)과 연간 계획·실행 관리 중심(경영기획)으로 나뉩니다."
};
