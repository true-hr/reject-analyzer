export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "EXPERT_REVIEW_EVALUATION",
  aliases: [
    "전문심사",
    "평가위원",
    "심사역",
    "평가 담당",
    "evaluation specialist",
    "review analyst",
    "심사 평가",
    "전문 평가",
    "assessment reviewer"
  ],
  families: [
    {
      id: "screening_review",
      label: "서류·요건 심사",
      aliases: [
        "서류 심사",
        "자격 요건 검토",
        "1차 평가",
        "eligibility review"
      ],
      strongSignals: [
        "지원서 또는 신청서 요건 충족 여부 검토",
        "정해진 기준표 기반 점검",
        "형식 요건 및 필수 조건 체크",
        "탈락/통과 기준에 따른 선별",
        "대량 케이스 반복 심사"
      ],
      mediumSignals: [
        "체크리스트 기반 평가 수행",
        "정량 점수 부여보다는 기준 충족 여부 판단",
        "기초 검토 후 다음 단계 전달",
        "표준화된 심사 프로세스 수행"
      ],
      boundarySignals: [
        "정성 평가보다 기준 충족 여부 중심",
        "심층 분석보다 빠른 선별 비중 높음",
        "판단 기준이 명확히 정의되어 있음"
      ],
      adjacentFamilies: [
        "quantitative_scoring",
        "expert_judgement"
      ],
      boundaryNote: "정해진 요건 충족 여부를 빠르게 판별하는 비중이 커질수록 이 영역으로 읽힙니다. 반면 점수화나 비교 평가 비중이 커지면 정량 평가로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 정해진 기준에 따라 요건 충족 여부를 판별하고 선별하는 성격이 강합니다. 반면 점수화나 상대 비교 평가 비중이 커지면 정량 평가 영역으로 읽힐 수 있습니다."
    },
    {
      id: "quantitative_scoring",
      label: "정량 기반 평가",
      aliases: [
        "점수 평가",
        "scoring evaluation",
        "지표 기반 평가",
        "정량 심사"
      ],
      strongSignals: [
        "평가 항목별 점수 산정",
        "지표 기반 가중치 적용 평가",
        "평가표/루브릭 활용 점수화",
        "복수 대상 간 점수 비교",
        "평가 결과 수치화 및 랭킹 도출"
      ],
      mediumSignals: [
        "평가 기준표 설계 또는 개선 참여",
        "데이터 기반 평가 결과 분석",
        "평가 점수 검증 및 조정",
        "여러 평가자 점수 통합"
      ],
      boundarySignals: [
        "정성 의견보다 수치 결과 중심",
        "판단 기준이 구조화된 평가표로 존재",
        "비교 및 순위화 목적이 명확"
      ],
      adjacentFamilies: [
        "screening_review",
        "expert_judgement"
      ],
      boundaryNote: "평가 결과를 점수와 지표로 구조화하여 비교하는 비중이 커질수록 이 영역으로 분류됩니다. 반면 전문가의 주관적 판단 비중이 커지면 전문 판단 평가로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 평가 기준에 따라 점수를 산정하고 대상 간 비교를 수행하는 성격이 강합니다. 반면 전문가 판단이나 정성적 의견 비중이 커지면 전문 판단 평가 영역으로 읽힐 수 있습니다."
    },
    {
      id: "expert_judgement",
      label: "전문가 판단 평가",
      aliases: [
        "전문 심사",
        "expert review",
        "정성 평가",
        "심층 평가"
      ],
      strongSignals: [
        "전문 지식 기반 심층 평가 의견 작성",
        "정성적 판단에 따른 평가 결과 도출",
        "복합 요소 종합 판단",
        "평가 코멘트 및 피드백 상세 작성",
        "위원회 형태의 합의 기반 평가"
      ],
      mediumSignals: [
        "평가 기준은 있으나 해석 여지 존재",
        "유사 사례 비교 기반 판단",
        "전문성 기반 의견 제시",
        "평가 결과에 대한 논리적 근거 서술"
      ],
      boundarySignals: [
        "점수보다 의견과 판단 근거 중심",
        "평가자 간 편차 존재 가능",
        "정성적 요소 비중 높음"
      ],
      adjacentFamilies: [
        "quantitative_scoring",
        "audit_compliance"
      ],
      boundaryNote: "전문 지식과 경험을 기반으로 종합 판단하는 비중이 커질수록 이 영역으로 읽힙니다. 반면 점수화와 지표 중심 평가가 강화되면 정량 평가로 이동합니다.",
      summaryTemplate: "이 직무는 전문가의 지식과 경험을 바탕으로 대상의 가치를 종합적으로 판단하는 성격이 강합니다. 반면 점수화와 지표 기반 평가 비중이 커지면 정량 평가 영역으로 읽힐 수 있습니다."
    },
    {
      id: "audit_compliance",
      label: "규정·적합성 평가",
      aliases: [
        "컴플라이언스 평가",
        "규정 심사",
        "적합성 검토",
        "compliance review"
      ],
      strongSignals: [
        "법규 또는 규정 준수 여부 검토",
        "내부 기준 및 정책 적합성 판단",
        "감사 대응 또는 리스크 점검",
        "위반 사항 식별 및 보고",
        "프로세스 준수 여부 확인"
      ],
      mediumSignals: [
        "체크리스트 기반 규정 검토",
        "문서 및 증빙 검증",
        "리스크 포인트 식별",
        "개선 권고 사항 제시"
      ],
      boundarySignals: [
        "성과 평가보다 규정 준수 여부 중심",
        "판단 기준이 외부/내부 규정에 의존",
        "위험 회피 및 통제 목적 강조"
      ],
      adjacentFamilies: [
        "screening_review",
        "expert_judgement"
      ],
      boundaryNote: "법규나 내부 규정 준수 여부를 판단하는 비중이 커질수록 이 영역으로 분류됩니다. 반면 성과나 가치 평가 중심으로 이동하면 다른 평가 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 규정과 기준에 따라 대상의 적합성과 준수 여부를 판단하는 성격이 강합니다. 반면 성과나 가치 중심 평가 비중이 커지면 다른 평가 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "review_officer",
      label: "심사 담당자",
      aliases: [
        "심사역",
        "review officer"
      ],
      family: "screening_review",
      responsibilityHints: [
        "요건 충족 여부 검토",
        "서류 기반 1차 선별",
        "기준표 기반 판단"
      ],
      levelHints: [
        "주니어는 기준 적용 중심",
        "시니어는 기준 해석 및 예외 판단 수행"
      ]
    },
    {
      id: "evaluation_analyst",
      label: "평가 분석가",
      aliases: [
        "evaluation analyst",
        "평가 담당자"
      ],
      family: "quantitative_scoring",
      responsibilityHints: [
        "평가 점수 산정",
        "지표 기반 비교 분석",
        "평가 결과 정리"
      ],
      levelHints: [
        "주니어는 점수 산정 및 데이터 처리",
        "시니어는 평가 체계 설계 및 검증"
      ]
    },
    {
      id: "expert_reviewer",
      label: "전문 심사위원",
      aliases: [
        "expert reviewer",
        "평가 위원"
      ],
      family: "expert_judgement",
      responsibilityHints: [
        "정성 평가 의견 작성",
        "전문성 기반 판단",
        "종합 평가 수행"
      ],
      levelHints: [
        "주니어는 보조 평가 및 의견 정리",
        "시니어는 핵심 판단 및 평가 방향 결정"
      ]
    },
    {
      id: "compliance_auditor",
      label: "컴플라이언스 평가자",
      aliases: [
        "compliance auditor",
        "적합성 심사자"
      ],
      family: "audit_compliance",
      responsibilityHints: [
        "규정 준수 여부 검토",
        "리스크 점검",
        "위반 사항 보고"
      ],
      levelHints: [
        "주니어는 체크리스트 기반 검토",
        "시니어는 리스크 판단 및 개선 권고"
      ]
    }
  ],
  axes: [
    {
      axisId: "evaluation_basis",
      label: "평가 기준 성격",
      values: [
        "명확한 요건 충족 여부",
        "지표 및 점수 기반",
        "전문가 판단 기반",
        "규정 및 법적 기준 기반"
      ]
    },
    {
      axisId: "judgement_type",
      label: "판단 방식",
      values: [
        "기계적 체크",
        "구조화된 점수화",
        "정성적 종합 판단"
      ]
    },
    {
      axisId: "evaluation_goal",
      label: "평가 목적",
      values: [
        "선별 및 필터링",
        "비교 및 순위화",
        "가치 판단",
        "리스크 및 준수 확인"
      ]
    }
  ],
  adjacentFamilies: [
    "data_analysis",
    "legal_review",
    "consulting"
  ],
  boundaryHints: [
    "요건 충족 여부를 빠르게 판단하는 비중이 높아지면 서류 심사로 이동합니다.",
    "평가를 점수와 지표로 구조화하고 비교하는 비중이 커지면 정량 평가로 읽힙니다.",
    "전문 지식 기반 종합 판단과 의견 작성 비중이 커지면 전문가 판단 평가로 이동합니다.",
    "법규와 규정 준수 여부 검토 비중이 커지면 컴플라이언스 평가 영역으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 대상의 적합성, 성과, 또는 가치를 기준에 따라 판단하고 평가하는 역할로, 판단 방식과 기준에 따라 성격이 달라집니다. 요건 검토 중심이면 심사, 점수화 중심이면 정량 평가, 전문 판단 중심이면 정성 평가로 구분되며 규정 준수 비중이 커지면 컴플라이언스 영역으로 읽힐 수 있습니다."
};
