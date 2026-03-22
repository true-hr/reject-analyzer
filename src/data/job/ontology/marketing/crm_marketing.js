export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "CRM_MARKETING",
  aliases: [
    "CRM 마케팅",
    "CRM마케터",
    "고객관계마케팅",
    "리텐션 마케팅",
    "고객 유지 마케팅",
    "lifecycle marketing",
    "retention marketing",
    "CRM marketer",
    "customer engagement marketing",
    "email marketing",
    "push marketing"
  ],
  families: [
    {
      id: "LIFECYCLE_CAMPAIGN_EXECUTION",
      label: "라이프사이클 캠페인 운영형 CRM",
      aliases: [
        "라이프사이클 마케팅",
        "CRM 캠페인 운영",
        "lifecycle campaign",
        "retention campaign execution"
      ],
      strongSignals: [
        "회원가입, 활성화, 휴면, 이탈 단계별 캠페인 설계 및 운영",
        "이메일, 푸시, 문자 등 채널별 CRM 메시지 발송",
        "자동화 시나리오(웰컴, 리마인드, 리텐션 플로우) 구축",
        "캠페인 일정 관리 및 발송 타이밍 최적화",
        "세그먼트별 맞춤 메시지 운영",
        "캠페인 성과(open rate, CTR, conversion) 기반 반복 개선",
        "CRM 툴(Braze, Salesforce, Iterable 등) 직접 활용"
      ],
      mediumSignals: [
        "캠페인 캘린더 관리",
        "템플릿 작성 및 수정",
        "메시지 발송 테스트",
        "기본 리포트 작성",
        "세그먼트 조건 설정"
      ],
      boundarySignals: [
        "데이터 분석과 세그먼트 전략 설계 비중이 커지면 데이터 기반 CRM으로 이동",
        "전환율 개선과 퍼널 설계 비중이 커지면 그로스 마케팅으로 이동",
        "콘텐츠 기획과 메시지 전략 비중이 커지면 콘텐츠/브랜드 마케팅으로 이동"
      ],
      adjacentFamilies: [
        "DATA_DRIVEN_CRM",
        "PERSONALIZATION_STRATEGY_CRM",
        "LOYALTY_RETENTION_PROGRAM"
      ],
      boundaryNote: "고객 라이프사이클에 맞춰 메시지를 설계하고 발송 캠페인을 운영하는 역할이 중심이면 라이프사이클 캠페인 운영형 CRM으로 읽힙니다. 반면 데이터 전략이나 개인화 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객 생애주기에 맞춰 CRM 캠페인을 설계하고 실행하는 성격이 강합니다. 반면 데이터 분석이나 개인화 전략 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "DATA_DRIVEN_CRM",
      label: "데이터 기반 CRM 마케팅",
      aliases: [
        "CRM 데이터 분석",
        "retention analytics",
        "CRM analytics"
      ],
      strongSignals: [
        "고객 행동 데이터 기반 세그먼트 정의",
        "리텐션, 재구매율, LTV 등 CRM 핵심 지표 분석",
        "유저 코호트 분석 및 이탈 패턴 도출",
        "캠페인 성과 데이터 기반 개선 전략 수립",
        "SQL, GA, CDP 등을 활용한 데이터 추출 및 분석",
        "데이터 기반 타겟팅 전략 설계",
        "성과 리포트 및 인사이트 도출"
      ],
      mediumSignals: [
        "대시보드 구축",
        "세그먼트 조건 테스트",
        "데이터 정합성 검증",
        "리포트 자동화",
        "캠페인 결과 분석"
      ],
      boundarySignals: [
        "실제 캠페인 실행과 메시지 운영 비중이 커지면 라이프사이클 운영형으로 이동",
        "전환 퍼널 개선과 실험 설계 비중이 커지면 그로스 마케팅으로 이동",
        "데이터 파이프라인 구축 중심이면 데이터 직무로 이동"
      ],
      adjacentFamilies: [
        "LIFECYCLE_CAMPAIGN_EXECUTION",
        "PERSONALIZATION_STRATEGY_CRM",
        "LOYALTY_RETENTION_PROGRAM"
      ],
      boundaryNote: "고객 데이터를 기반으로 세그먼트와 전략을 설계하고 인사이트를 도출하는 역할이면 데이터 기반 CRM으로 읽힙니다. 반면 실행이나 메시지 운영 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객 데이터를 분석해 리텐션 전략과 CRM 방향을 설계하는 성격이 강합니다. 반면 캠페인 실행이나 퍼널 개선 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PERSONALIZATION_STRATEGY_CRM",
      label: "개인화 전략 중심 CRM",
      aliases: [
        "개인화 마케팅",
        "personalization CRM",
        "customer personalization"
      ],
      strongSignals: [
        "고객 행동 및 속성 기반 개인화 메시지 설계",
        "추천, 맞춤 콘텐츠, 개인화 오퍼 전략 수립",
        "세그먼트가 아닌 개별 사용자 단위 메시지 설계",
        "CDP 기반 개인화 시나리오 구축",
        "고객 경험 개선을 위한 메시지 흐름 설계",
        "개인화 알고리즘 또는 룰 기반 추천 활용",
        "개인화 효과 측정 및 지속 개선"
      ],
      mediumSignals: [
        "개인화 캠페인 테스트",
        "추천 로직 협업",
        "유저 프로필 정의",
        "콘텐츠 매핑",
        "개인화 성과 리포트"
      ],
      boundarySignals: [
        "단순 세그먼트 기반 발송 중심이면 라이프사이클 운영형으로 이동",
        "데이터 분석과 리포트 중심이면 데이터 기반 CRM으로 이동",
        "제품 기능 개선과 추천 시스템 개발 중심이면 프로덕트/데이터 직무로 이동"
      ],
      adjacentFamilies: [
        "LIFECYCLE_CAMPAIGN_EXECUTION",
        "DATA_DRIVEN_CRM",
        "LOYALTY_RETENTION_PROGRAM"
      ],
      boundaryNote: "고객별 맞춤 경험과 메시지를 설계하는 역할이 중심이면 개인화 전략 중심 CRM으로 읽힙니다. 반면 단순 캠페인 운영이나 데이터 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객별 맞춤 메시지와 경험을 설계해 반응과 전환을 높이는 성격이 강합니다. 반면 단순 캠페인 운영이나 데이터 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "LOYALTY_RETENTION_PROGRAM",
      label: "로열티·리텐션 프로그램 중심 CRM",
      aliases: [
        "로열티 마케팅",
        "멤버십 마케팅",
        "loyalty program",
        "retention program"
      ],
      strongSignals: [
        "포인트, 멤버십, 등급제 등 고객 유지 프로그램 설계",
        "재구매 유도 프로모션 및 혜택 구조 기획",
        "장기 고객 유지 전략 및 정책 수립",
        "이탈 고객 리텐션 캠페인 설계",
        "고객 가치 기반 차별화 혜택 설계",
        "로열티 프로그램 성과 분석 및 개선",
        "고객 충성도 지표 관리"
      ],
      mediumSignals: [
        "프로모션 기획",
        "혜택 구조 설계",
        "재구매 캠페인 운영",
        "고객 등급 관리",
        "리텐션 리포트 작성"
      ],
      boundarySignals: [
        "단기 캠페인 운영 중심이면 라이프사이클 운영형으로 이동",
        "데이터 분석 중심이면 데이터 기반 CRM으로 이동",
        "브랜드 경험과 감성 중심이면 브랜드 마케팅으로 이동"
      ],
      adjacentFamilies: [
        "LIFECYCLE_CAMPAIGN_EXECUTION",
        "DATA_DRIVEN_CRM",
        "PERSONALIZATION_STRATEGY_CRM"
      ],
      boundaryNote: "고객 유지와 충성도를 높이기 위한 프로그램과 정책 설계가 중심이면 로열티·리텐션 프로그램 중심 CRM으로 읽힙니다. 반면 단기 캠페인이나 데이터 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 고객의 재구매와 장기 유지를 위한 로열티 전략을 설계하는 성격이 강합니다. 반면 단기 캠페인 운영이나 데이터 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CRM_MARKETER",
      label: "CRM 마케터",
      aliases: [
        "CRM marketer",
        "retention marketer"
      ],
      family: "LIFECYCLE_CAMPAIGN_EXECUTION",
      responsibilityHints: [
        "캠페인 운영",
        "메시지 발송",
        "세그먼트 관리",
        "성과 모니터링"
      ],
      levelHints: [
        "주니어는 캠페인 실행과 리포트 비중이 큼",
        "시니어는 시나리오 설계와 전략 비중이 큼"
      ]
    },
    {
      id: "CRM_ANALYST",
      label: "CRM 데이터 분석 담당",
      aliases: [
        "CRM analyst",
        "retention analyst"
      ],
      family: "DATA_DRIVEN_CRM",
      responsibilityHints: [
        "데이터 분석",
        "세그먼트 정의",
        "지표 설계",
        "인사이트 도출"
      ],
      levelHints: [
        "주니어는 데이터 정리와 분석 비중이 큼",
        "시니어는 전략 인사이트와 구조 설계 비중이 큼"
      ]
    },
    {
      id: "PERSONALIZATION_MANAGER",
      label: "개인화 마케팅 담당",
      aliases: [
        "personalization manager",
        "customer personalization lead"
      ],
      family: "PERSONALIZATION_STRATEGY_CRM",
      responsibilityHints: [
        "개인화 전략 설계",
        "추천 및 메시지 최적화",
        "유저 경험 개선",
        "성과 분석"
      ],
      levelHints: [
        "주니어는 캠페인 테스트 비중이 큼",
        "시니어는 개인화 전략과 구조 설계 비중이 큼"
      ]
    },
    {
      id: "LOYALTY_PROGRAM_MANAGER",
      label: "로열티 프로그램 담당",
      aliases: [
        "loyalty manager",
        "retention program manager"
      ],
      family: "LOYALTY_RETENTION_PROGRAM",
      responsibilityHints: [
        "멤버십 기획",
        "재구매 전략",
        "프로모션 설계",
        "고객 유지 정책"
      ],
      levelHints: [
        "주니어는 운영과 실행 비중이 큼",
        "시니어는 전략 설계와 구조 설계 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "TARGET_STAGE",
      label: "고객 단계",
      values: [
        "신규 유입 이후 초기 활성화",
        "활성 사용자 유지",
        "이탈 방지 및 재유입",
        "충성 고객 강화"
      ]
    },
    {
      axisId: "CORE_ACTIVITY",
      label: "핵심 활동",
      values: [
        "캠페인 운영",
        "데이터 분석",
        "개인화 설계",
        "로열티 프로그램 기획"
      ]
    },
    {
      axisId: "VALUE_CREATION",
      label: "성과 창출 방식",
      values: [
        "메시지 발송과 반응 유도",
        "데이터 기반 인사이트",
        "개인화 경험 제공",
        "고객 충성도 강화"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "캠페인 실행",
        "분석과 전략",
        "경험 설계",
        "프로그램 기획"
      ]
    }
  ],
  adjacentFamilies: [
    "퍼포먼스마케팅",
    "그로스마케팅",
    "브랜드마케팅",
    "데이터분석",
    "프로덕트 마케팅",
    "고객성공(CSM)"
  ],
  boundaryHints: [
    "캠페인 운영과 메시지 발송 비중이 많아지면 라이프사이클 캠페인 운영형으로 읽힙니다.",
    "데이터 분석과 세그먼트 전략 비중이 커지면 데이터 기반 CRM으로 이동합니다.",
    "개인화 경험 설계와 맞춤 메시지 비중이 커지면 개인화 전략 중심 CRM으로 이동합니다.",
    "고객 유지 프로그램과 충성도 전략 비중이 커지면 로열티·리텐션 프로그램 중심으로 이동합니다.",
    "유입과 광고 성과 중심이면 퍼포먼스마케팅으로 이동합니다.",
    "제품 사용성과 UX 개선 중심이면 그로스마케팅 또는 프로덕트 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 고객 데이터를 기반으로 유지와 재구매를 유도하는 CRM 마케팅 성격이 강합니다. 다만 역할은 캠페인 운영, 데이터 분석, 개인화 설계, 로열티 전략으로 나뉘며 작동 방식이 달라집니다. 반면 유입 중심이나 제품 개선 중심으로 이동하면 다른 경계로 읽힐 수 있습니다."
};
