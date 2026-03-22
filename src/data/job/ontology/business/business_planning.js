export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "BUSINESS_PLANNING",
  aliases: [
    "사업기획",
    "사업 기획",
    "비즈니스 기획",
    "사업 운영 기획",
    "사업 전략 실행",
    "사업관리",
    "biz planning",
    "business planning",
    "business operations planning",
    "biz ops planning"
  ],
  families: [
    {
      id: "BUSINESS_OPERATION_PLANNING",
      label: "사업운영 기획",
      aliases: [
        "사업운영 기획",
        "운영기획",
        "사업관리",
        "biz ops",
        "operations planning"
      ],
      strongSignals: [
        "월간/분기 사업계획 수립 및 운영",
        "매출, 비용, KPI 실적 트래킹",
        "사업부 실적 리뷰 및 보고",
        "운영 프로세스 개선 과제 도출",
        "실적 대비 계획 차이 분석",
        "주간/월간 운영 리듬 관리",
        "운영 이슈 대응 및 조율"
      ],
      mediumSignals: [
        "지표 기반 의사결정 지원",
        "사업부 KPI 관리 지원",
        "조직 간 협업 조율",
        "리포트 작성 및 공유",
        "운영 데이터 정리"
      ],
      boundarySignals: [
        "전사 방향이나 투자 우선순위 설계 비중이 커지면 전략기획으로 이동",
        "성과 지표 정의와 체계 설계 비중이 커지면 사업성과 관리로 이동",
        "프로젝트 일정/범위 관리 비중이 커지면 PM/프로젝트 기획으로 이동"
      ],
      adjacentFamilies: [
        "BUSINESS_PERFORMANCE_MANAGEMENT",
        "PROJECT_BASED_PLANNING",
        "GROWTH_PLANNING"
      ],
      boundaryNote: "사업의 일상 운영과 실적 관리, 개선 실행에 직접 관여하면 사업운영 기획으로 읽힙니다. 반면 방향 설계나 프로젝트 단위 관리가 중심이 되면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 사업의 실적을 관리하고 운영 효율을 개선하는 역할이 중심입니다. 반면 전략 설계나 프로젝트 중심 실행 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    },
    {
      id: "BUSINESS_PERFORMANCE_MANAGEMENT",
      label: "사업성과 관리",
      aliases: [
        "성과관리",
        "KPI 관리",
        "performance management",
        "business performance"
      ],
      strongSignals: [
        "사업 KPI 정의 및 관리 체계 구축",
        "목표 대비 실적 분석",
        "매출/비용/수익성 분석",
        "성과 리포트 설계 및 작성",
        "지표 이상 원인 분석",
        "성과 관리 기준 수립",
        "지표 정의 및 정합성 관리"
      ],
      mediumSignals: [
        "리포팅 자동화 또는 체계화",
        "사업부별 성과 비교",
        "데이터 기반 의사결정 지원",
        "성과 개선 과제 제안",
        "지표 설계 지원"
      ],
      boundarySignals: [
        "운영 개선 실행까지 깊게 관여하면 사업운영 기획으로 이동",
        "중장기 방향 설계가 많아지면 전략기획으로 이동",
        "데이터 모델링/분석 기술 비중이 커지면 데이터 분석으로 이동"
      ],
      adjacentFamilies: [
        "BUSINESS_OPERATION_PLANNING",
        "GROWTH_PLANNING",
        "PROJECT_BASED_PLANNING"
      ],
      boundaryNote: "성과를 측정하고 구조화하는 역할이 중심이면 사업성과 관리로 읽힙니다. 실행 개선까지 직접 주도하면 운영 기획 성격이 강해집니다.",
      summaryTemplate: "이 직무는 사업의 성과를 정의하고 측정하는 체계를 만드는 역할이 중심입니다. 반면 실행 개선까지 직접 관여하면 사업운영 기획으로 경계가 이동할 수 있습니다."
    },
    {
      id: "GROWTH_PLANNING",
      label: "성장·사업확장 기획",
      aliases: [
        "성장기획",
        "사업 확장 기획",
        "growth planning",
        "growth ops",
        "expansion planning"
      ],
      strongSignals: [
        "신규 시장/채널 확장 기획",
        "사업 성장 과제 정의",
        "고객 획득 또는 매출 확대 전략 수립",
        "성장 실험 설계 및 실행",
        "신규 사업 초기 구조 설계",
        "사업 확장 로드맵 수립",
        "초기 KPI 설정 및 검증"
      ],
      mediumSignals: [
        "마케팅/영업과 협업한 성장 실행",
        "파일럿 프로젝트 운영",
        "시장 반응 기반 전략 수정",
        "신규 기능/상품 기획 참여",
        "데이터 기반 성장 분석"
      ],
      boundarySignals: [
        "외부 제휴 발굴 및 계약 체결이 많아지면 사업개발(BD)로 이동",
        "제품 기능 정의나 UX 설계 비중이 커지면 서비스기획으로 이동",
        "전사 방향 설계 비중이 커지면 전략기획으로 이동"
      ],
      adjacentFamilies: [
        "BUSINESS_OPERATION_PLANNING",
        "PROJECT_BASED_PLANNING",
        "BUSINESS_PERFORMANCE_MANAGEMENT"
      ],
      boundaryNote: "사업 확장과 성장 기회 탐색, 실험 중심이면 성장 기획으로 읽힙니다. 제휴 실행이나 제품 설계가 중심이 되면 다른 직무로 이동합니다.",
      summaryTemplate: "이 직무는 사업을 성장시키기 위한 확장 전략과 실행 과제를 설계하는 역할이 중심입니다. 반면 제휴 체결이나 제품 설계 비중이 커지면 다른 직무로 해석될 수 있습니다."
    },
    {
      id: "PROJECT_BASED_PLANNING",
      label: "프로젝트 기반 사업기획",
      aliases: [
        "사업 PM",
        "프로젝트 기획",
        "project planning",
        "business project manager"
      ],
      strongSignals: [
        "사업 관련 프로젝트 기획 및 실행 관리",
        "일정, 범위, 리스크 관리",
        "프로젝트 목표 설정 및 관리",
        "조직 간 협업 조율",
        "프로젝트 산출물 정의",
        "단기 과제 중심 실행",
        "프로젝트 종료 기준 관리"
      ],
      mediumSignals: [
        "프로젝트 상태 보고",
        "이슈 관리 및 해결",
        "실행 중심 커뮤니케이션",
        "프로젝트 성과 리뷰",
        "프로젝트 KPI 관리"
      ],
      boundarySignals: [
        "지속적인 운영 관리 비중이 커지면 사업운영 기획으로 이동",
        "전사 방향 설계가 많아지면 전략기획으로 이동",
        "순수 일정 관리만 수행하면 PM/PMO로 이동"
      ],
      adjacentFamilies: [
        "BUSINESS_OPERATION_PLANNING",
        "GROWTH_PLANNING",
        "BUSINESS_PERFORMANCE_MANAGEMENT"
      ],
      boundaryNote: "프로젝트 단위로 사업을 추진하고 실행을 관리하면 이 영역으로 읽힙니다. 장기 운영이나 전략 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 프로젝트 단위로 사업 과제를 기획하고 실행을 관리하는 역할이 중심입니다. 반면 장기 운영이나 전략 설계 비중이 커지면 다른 기획 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "BUSINESS_PLANNING_MANAGER",
      label: "사업기획 매니저",
      aliases: [
        "사업기획",
        "biz planning manager",
        "business planning manager"
      ],
      family: "BUSINESS_OPERATION_PLANNING",
      responsibilityHints: [
        "사업 운영 계획 수립",
        "실적 관리 및 개선",
        "운영 지표 관리",
        "사업부 협업 조율"
      ],
      levelHints: [
        "주니어는 리포팅과 데이터 정리 비중이 큼",
        "시니어는 운영 개선과 의사결정 지원 비중이 큼"
      ]
    },
    {
      id: "PERFORMANCE_MANAGER",
      label: "사업성과 매니저",
      aliases: [
        "성과관리",
        "KPI 매니저",
        "performance manager"
      ],
      family: "BUSINESS_PERFORMANCE_MANAGEMENT",
      responsibilityHints: [
        "KPI 정의 및 관리",
        "성과 분석",
        "지표 체계 설계",
        "성과 리포트 작성"
      ],
      levelHints: [
        "주니어는 분석 중심",
        "시니어는 성과 체계 설계 중심"
      ]
    },
    {
      id: "GROWTH_MANAGER",
      label: "성장기획 매니저",
      aliases: [
        "growth manager",
        "성장기획",
        "growth planning manager"
      ],
      family: "GROWTH_PLANNING",
      responsibilityHints: [
        "성장 전략 수립",
        "신규 시장/채널 기획",
        "성장 실험 설계",
        "성과 검증"
      ],
      levelHints: [
        "주니어는 실행 및 분석 비중이 큼",
        "시니어는 전략 설계와 우선순위 설정 비중이 큼"
      ]
    },
    {
      id: "BUSINESS_PROJECT_MANAGER",
      label: "사업 프로젝트 매니저",
      aliases: [
        "사업 PM",
        "project manager",
        "business project manager"
      ],
      family: "PROJECT_BASED_PLANNING",
      responsibilityHints: [
        "프로젝트 기획 및 실행",
        "일정/리스크 관리",
        "협업 조율",
        "성과 관리"
      ],
      levelHints: [
        "주니어는 실행 관리 중심",
        "시니어는 프로젝트 설계 및 리딩 중심"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS",
      label: "주요 초점",
      values: [
        "운영과 실적 관리",
        "성과 측정과 지표 설계",
        "성장과 확장",
        "프로젝트 실행"
      ]
    },
    {
      axisId: "TIME_HORIZON",
      label: "시간 범위",
      values: [
        "단기 운영",
        "지속적 성과 관리",
        "중기 성장",
        "프로젝트 단위 단기"
      ]
    },
    {
      axisId: "EXECUTION_INVOLVEMENT",
      label: "실행 관여도",
      values: [
        "운영 직접 관리",
        "측정 및 분석 중심",
        "실험 설계 및 실행",
        "프로젝트 실행 관리"
      ]
    }
  ],
  adjacentFamilies: [
    "전략기획",
    "서비스기획",
    "프로젝트관리(PM)",
    "신사업/사업개발(BD)",
    "경영분석",
    "데이터 분석",
    "운영관리"
  ],
  boundaryHints: [
    "운영 실적 관리와 개선 실행이 많아지면 사업운영 기획으로 읽힙니다.",
    "KPI 정의와 성과 측정이 중심이면 사업성과 관리로 이동합니다.",
    "신규 시장이나 성장 과제 비중이 커지면 성장 기획으로 이동합니다.",
    "프로젝트 단위 일정과 실행 관리가 중심이면 프로젝트 기반 기획으로 읽힙니다.",
    "전사 방향이나 투자 우선순위 설계가 많아지면 전략기획으로 이동합니다.",
    "외부 제휴 발굴과 계약이 많아지면 사업개발(BD)로 이동합니다.",
    "제품 기능이나 서비스 흐름 설계가 많아지면 서비스기획으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 사업의 실행과 운영을 기반으로 성과를 만들고 관리하는 역할이 중심입니다. 다만 운영 관리, 성과 관리, 성장 기획, 프로젝트 실행 등으로 세분화되며 작동 방식이 달라집니다. 반면 전략 설계나 제휴 실행, 제품 설계 비중이 커지면 인접 직무로 경계가 이동할 수 있습니다."
};
