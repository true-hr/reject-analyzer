export const JOB_ONTOLOGY_ITEM = {
  vertical: "MARKETING",
  subVertical: "PERFORMANCE_MARKETING",
  aliases: [
    "퍼포먼스마케팅",
    "퍼포먼스 마케터",
    "성과형 마케팅",
    "디지털 퍼포먼스 마케팅",
    "performance marketing",
    "paid marketing",
    "paid media",
    "growth marketing",
    "UA marketing",
    "user acquisition"
  ],
  families: [
    {
      id: "PAID_MEDIA_EXECUTION",
      label: "광고 집행·최적화형 퍼포먼스마케팅",
      aliases: [
        "광고 운영",
        "매체 운영",
        "paid media execution",
        "ad operation"
      ],
      strongSignals: [
        "구글, 메타, 네이버, 카카오 등 광고 매체 직접 집행",
        "캠페인 구조 설계와 예산 배분 운영",
        "CTR, CPC, CPA 등 지표 기반 실시간 최적화",
        "광고 소재 테스트와 성과 비교 반복",
        "캠페인 세팅, 타겟팅, 입찰 전략 조정",
        "매체별 성과 분석 후 즉각적인 액션 수행",
        "광고 관리자 계정 직접 운영"
      ],
      mediumSignals: [
        "A/B 테스트 반복",
        "소재별 성과 리포트 작성",
        "광고 세그먼트 조정",
        "일/주간 성과 모니터링",
        "매체 정책 대응"
      ],
      boundarySignals: [
        "성과 분석과 전략 설계 비중이 커지면 데이터·분석형 퍼포먼스마케팅으로 이동",
        "퍼널 설계와 전환 구조 개선 비중이 커지면 그로스·전환 최적화형으로 이동",
        "브랜드 메시지와 콘텐츠 기획 비중이 커지면 브랜드 마케팅으로 이동"
      ],
      adjacentFamilies: [
        "DATA_ANALYTICS_PERFORMANCE_MARKETING",
        "FUNNEL_OPTIMIZATION_GROWTH",
        "CREATIVE_DRIVEN_PERFORMANCE"
      ],
      boundaryNote: "광고 매체를 직접 운영하고 성과 지표를 기반으로 실시간 최적화하는 역할이 중심이면 광고 집행·최적화형으로 읽힙니다. 반면 분석이나 퍼널 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 광고 매체를 직접 운영하며 성과 지표를 기반으로 캠페인을 최적화하는 성격이 강합니다. 반면 데이터 분석이나 퍼널 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "DATA_ANALYTICS_PERFORMANCE_MARKETING",
      label: "데이터·분석형 퍼포먼스마케팅",
      aliases: [
        "마케팅 데이터 분석",
        "퍼포먼스 분석",
        "marketing analytics",
        "performance analytics"
      ],
      strongSignals: [
        "광고 및 유입 데이터를 분석해 인사이트 도출",
        "ROAS, LTV, CAC 등 핵심 지표 설계 및 관리",
        "데이터 기반 캠페인 전략 수립",
        "SQL, GA, Firebase 등 분석 도구 활용",
        "유입-전환-매출 흐름 데이터 연결 분석",
        "성과 리포트 작성과 의사결정 지원",
        "데이터 기반 예산 배분 및 전략 조정"
      ],
      mediumSignals: [
        "대시보드 구축",
        "코호트 분석",
        "유저 행동 분석",
        "리포트 자동화",
        "데이터 정합성 검증"
      ],
      boundarySignals: [
        "직접 광고 집행과 운영 비중이 커지면 광고 집행형으로 이동",
        "전환율 개선과 UX 실험 비중이 커지면 그로스·전환 최적화형으로 이동",
        "데이터 인프라 구축과 엔지니어링 비중이 커지면 데이터 직무로 이동"
      ],
      adjacentFamilies: [
        "PAID_MEDIA_EXECUTION",
        "FUNNEL_OPTIMIZATION_GROWTH",
        "CREATIVE_DRIVEN_PERFORMANCE"
      ],
      boundaryNote: "데이터를 분석해 마케팅 의사결정을 지원하고 전략을 도출하는 역할이면 데이터·분석형 퍼포먼스마케팅으로 읽힙니다. 반면 실행이나 UX 개선 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 데이터를 기반으로 마케팅 성과를 분석하고 전략을 도출하는 성격이 강합니다. 반면 직접 집행이나 전환 최적화 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "FUNNEL_OPTIMIZATION_GROWTH",
      label: "퍼널·전환 최적화형 퍼포먼스마케팅",
      aliases: [
        "그로스 마케팅",
        "전환 최적화",
        "growth marketing",
        "conversion optimization",
        "CRO"
      ],
      strongSignals: [
        "유입부터 전환까지 전체 퍼널 구조 설계",
        "랜딩페이지, 회원가입, 결제 흐름 개선",
        "전환율(CVR) 개선을 위한 실험 설계 및 실행",
        "A/B 테스트를 통한 UX 및 메시지 개선",
        "유저 행동 데이터를 기반으로 전환 병목 분석",
        "마케팅과 프로덕트 간 협업을 통한 개선",
        "퍼널 단계별 KPI 관리"
      ],
      mediumSignals: [
        "랜딩페이지 기획",
        "이탈률 분석",
        "실험 결과 리포트",
        "유저 여정 설계",
        "전환 이벤트 정의"
      ],
      boundarySignals: [
        "광고 매체 운영 비중이 커지면 광고 집행형으로 이동",
        "데이터 분석과 리포트 중심이면 데이터·분석형으로 이동",
        "제품 기능 개선과 개발 중심이면 프로덕트 직무로 이동"
      ],
      adjacentFamilies: [
        "PAID_MEDIA_EXECUTION",
        "DATA_ANALYTICS_PERFORMANCE_MARKETING",
        "CREATIVE_DRIVEN_PERFORMANCE"
      ],
      boundaryNote: "유입 이후 전환 흐름을 개선하고 퍼널 전체를 최적화하는 역할이면 퍼널·전환 최적화형으로 읽힙니다. 반면 광고 집행이나 데이터 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 유입부터 전환까지 퍼널을 설계하고 전환율을 개선하는 성격이 강합니다. 반면 광고 운영이나 데이터 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "CREATIVE_DRIVEN_PERFORMANCE",
      label: "크리에이티브 중심 퍼포먼스마케팅",
      aliases: [
        "광고 크리에이티브 마케팅",
        "creative performance marketing",
        "ad creative strategist"
      ],
      strongSignals: [
        "광고 소재 기획과 메시지 테스트 중심 운영",
        "이미지, 영상, 카피 등 크리에이티브 성과 분석",
        "소재별 CTR, 전환율 비교를 통한 개선",
        "콘텐츠 방향성과 광고 메시지 설계",
        "타겟별 맞춤 크리에이티브 전략 수립",
        "소재 제작팀과 협업해 반복 테스트",
        "크리에이티브 성과가 캠페인 성패에 직접 영향"
      ],
      mediumSignals: [
        "카피 테스트",
        "영상/이미지 기획",
        "소재별 리포트",
        "트렌드 분석",
        "광고 메시지 실험"
      ],
      boundarySignals: [
        "브랜드 메시지와 장기 콘텐츠 전략 비중이 커지면 브랜드 마케팅으로 이동",
        "매체 운영과 입찰 전략 비중이 커지면 광고 집행형으로 이동",
        "퍼널 개선과 UX 실험 비중이 커지면 그로스형으로 이동"
      ],
      adjacentFamilies: [
        "PAID_MEDIA_EXECUTION",
        "FUNNEL_OPTIMIZATION_GROWTH",
        "DATA_ANALYTICS_PERFORMANCE_MARKETING"
      ],
      boundaryNote: "광고 성과를 크리에이티브와 메시지 개선으로 끌어올리는 역할이면 크리에이티브 중심 퍼포먼스마케팅으로 읽힙니다. 반면 브랜드 전략이나 매체 운영 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 광고 소재와 메시지를 중심으로 성과를 개선하는 성격이 강합니다. 반면 브랜드 전략이나 매체 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "PERFORMANCE_MARKETER",
      label: "퍼포먼스 마케터",
      aliases: [
        "performance marketer",
        "paid media marketer"
      ],
      family: "PAID_MEDIA_EXECUTION",
      responsibilityHints: [
        "광고 집행",
        "캠페인 최적화",
        "성과 모니터링",
        "예산 관리"
      ],
      levelHints: [
        "주니어는 매체 운영과 리포트 비중이 큼",
        "시니어는 전략 수립과 예산 배분 비중이 큼"
      ]
    },
    {
      id: "MARKETING_ANALYST",
      label: "마케팅 분석 담당",
      aliases: [
        "marketing analyst",
        "performance analyst"
      ],
      family: "DATA_ANALYTICS_PERFORMANCE_MARKETING",
      responsibilityHints: [
        "데이터 분석",
        "지표 설계",
        "리포트 작성",
        "인사이트 도출"
      ],
      levelHints: [
        "주니어는 데이터 정리와 리포트 비중이 큼",
        "시니어는 전략 인사이트 도출 비중이 큼"
      ]
    },
    {
      id: "GROWTH_MARKETER",
      label: "그로스 마케터",
      aliases: [
        "growth marketer",
        "conversion optimizer"
      ],
      family: "FUNNEL_OPTIMIZATION_GROWTH",
      responsibilityHints: [
        "퍼널 설계",
        "전환율 개선",
        "실험 설계",
        "유저 행동 분석"
      ],
      levelHints: [
        "주니어는 실험 실행과 데이터 분석 비중이 큼",
        "시니어는 퍼널 전략과 구조 설계 비중이 큼"
      ]
    },
    {
      id: "CREATIVE_STRATEGIST",
      label: "크리에이티브 전략 담당",
      aliases: [
        "creative strategist",
        "ad creative manager"
      ],
      family: "CREATIVE_DRIVEN_PERFORMANCE",
      responsibilityHints: [
        "광고 소재 기획",
        "메시지 설계",
        "소재 테스트",
        "콘텐츠 방향 설정"
      ],
      levelHints: [
        "주니어는 소재 제작과 테스트 비중이 큼",
        "시니어는 메시지 전략과 방향 설정 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "OPTIMIZATION_TARGET",
      label: "최적화 대상",
      values: [
        "광고 매체 성과",
        "데이터 기반 의사결정",
        "퍼널과 전환 구조",
        "크리에이티브와 메시지"
      ]
    },
    {
      axisId: "CORE_ACTIVITY",
      label: "핵심 활동",
      values: [
        "광고 집행과 운영",
        "데이터 분석과 리포트",
        "실험과 전환 개선",
        "소재 기획과 테스트"
      ]
    },
    {
      axisId: "VALUE_CREATION",
      label: "성과 창출 방식",
      values: [
        "매체 효율 개선",
        "인사이트 도출",
        "전환율 상승",
        "메시지 최적화"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "캠페인 운영",
        "데이터 분석",
        "퍼널 개선",
        "크리에이티브 기획"
      ]
    }
  ],
  adjacentFamilies: [
    "브랜드마케팅",
    "콘텐츠마케팅",
    "그로스마케팅",
    "데이터분석",
    "CRM 마케팅",
    "프로덕트 마케팅"
  ],
  boundaryHints: [
    "광고 매체 운영과 캠페인 최적화 비중이 많아지면 광고 집행형 퍼포먼스마케팅으로 읽힙니다.",
    "데이터 분석과 인사이트 도출 비중이 커지면 데이터·분석형으로 이동합니다.",
    "퍼널 설계와 전환율 개선 비중이 커지면 그로스·전환 최적화형으로 이동합니다.",
    "광고 소재와 메시지 기획 비중이 커지면 크리에이티브 중심형으로 이동합니다.",
    "브랜드 메시지와 장기 콘텐츠 전략 비중이 커지면 브랜드마케팅으로 이동합니다.",
    "고객 유지와 리텐션 중심이면 CRM 마케팅으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 광고와 데이터 기반으로 성과를 측정하고 개선하는 퍼포먼스마케팅 성격이 강합니다. 다만 역할은 광고 집행, 데이터 분석, 퍼널 최적화, 크리에이티브 중심으로 나뉘며 작동 방식이 달라집니다. 반면 브랜드 전략이나 고객 유지 중심으로 이동하면 다른 경계로 읽힐 수 있습니다."
};
