export const JOB_ONTOLOGY_ITEM = {
  vertical: "PUBLIC_ADMINISTRATION_SUPPORT",
  subVertical: "POLICY_SUPPORT",
  aliases: [
    "정책지원",
    "정책 행정 지원",
    "policy support",
    "policy administration support",
    "공공 정책 지원",
    "정책사업 지원",
    "정책 실행 지원"
  ],
  families: [
    {
      id: "policy_research_support",
      label: "정책 조사·연구 지원",
      aliases: [
        "정책 조사",
        "정책 리서치",
        "정책 자료 분석",
        "policy research support",
        "policy analysis assistant"
      ],
      strongSignals: [
        "정책 관련 데이터 수집 및 정리",
        "보고서 작성 지원 및 리서치 자료 구성",
        "정책 동향 조사 및 사례 분석",
        "통계자료 기반 정책 참고자료 생성"
      ],
      mediumSignals: [
        "엑셀/통계툴 활용 데이터 정리",
        "문헌 조사 및 참고자료 관리",
        "정책 관련 발표자료 작성 보조"
      ],
      boundarySignals: [
        "대외 협의나 이해관계자 대응 비중이 커지면 정책운영 지원으로 이동",
        "문서 관리 및 행정 처리 비중이 커지면 행정·문서 지원으로 이동"
      ],
      adjacentFamilies: ["policy_operation_support", "administrative_document_support"],
      boundaryNote: "조사와 분석 중심 업무가 줄고 실제 사업 운영 대응이나 외부 커뮤니케이션이 늘어나면 정책운영 지원으로 해석됩니다.",
      summaryTemplate: "이 직무는 정책 의사결정을 위한 자료 조사와 분석 지원 성격이 강합니다. 반면 외부 협의나 사업 운영 대응 비중이 커지면 정책운영 지원 영역으로 읽힐 수 있습니다."
    },
    {
      id: "policy_operation_support",
      label: "정책 운영·사업 지원",
      aliases: [
        "정책 운영 지원",
        "정책사업 관리 지원",
        "사업 운영 지원",
        "policy operation support",
        "program support"
      ],
      strongSignals: [
        "정책 사업 일정 관리 및 운영 지원",
        "이해관계자 커뮤니케이션 및 협의 지원",
        "사업 진행 현황 관리 및 보고",
        "정책 프로그램 실행 단계 지원"
      ],
      mediumSignals: [
        "회의 준비 및 운영 지원",
        "사업 관련 자료 취합 및 정리",
        "외부 기관 대응 보조"
      ],
      boundarySignals: [
        "데이터 분석 및 리서치 비중이 커지면 정책 조사·연구 지원으로 이동",
        "단순 행정 처리와 문서 관리 중심으로 축소되면 행정·문서 지원으로 이동"
      ],
      adjacentFamilies: ["policy_research_support", "administrative_document_support"],
      boundaryNote: "실제 사업 운영과 이해관계자 대응이 핵심이면 운영 지원으로 해석되며, 분석 중심으로 이동하면 연구 지원으로 구분됩니다.",
      summaryTemplate: "이 직무는 정책 또는 사업의 실행과 운영을 뒷받침하는 역할이 중심입니다. 반면 분석 중심 업무가 늘어나면 정책 조사 지원 영역으로 구분될 수 있습니다."
    },
    {
      id: "administrative_document_support",
      label: "행정·문서 지원",
      aliases: [
        "행정 지원",
        "문서 관리",
        "행정 업무",
        "administrative support",
        "document management"
      ],
      strongSignals: [
        "공문 작성 및 문서 관리",
        "행정 절차 처리 및 기록 관리",
        "내부 결재 문서 준비 및 정리",
        "정책 관련 행정 서류 관리"
      ],
      mediumSignals: [
        "회의록 작성 및 기록 보관",
        "문서 양식 관리 및 업데이트",
        "행정 시스템 입력 및 관리"
      ],
      boundarySignals: [
        "정책 내용 분석이나 리서치 비중이 커지면 정책 조사·연구 지원으로 이동",
        "사업 운영 및 외부 협의 비중이 커지면 정책운영 지원으로 이동"
      ],
      adjacentFamilies: ["policy_research_support", "policy_operation_support"],
      boundaryNote: "문서와 행정 절차 중심에서 벗어나 정책 내용 분석이나 사업 운영 관여가 증가하면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 정책 관련 행정 처리와 문서 관리 중심의 지원 역할을 수행합니다. 반면 정책 내용 분석이나 사업 운영 관여가 늘어나면 다른 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "policy_research_assistant",
      label: "정책 리서치 어시스턴트",
      aliases: [
        "정책 조사원",
        "policy research assistant"
      ],
      family: "policy_research_support",
      responsibilityHints: [
        "정책 관련 자료 조사 및 정리",
        "보고서 작성 지원"
      ],
      levelHints: [
        "주로 주니어 레벨에서 시작",
        "분석 도구 활용 능력에 따라 역할 확장"
      ]
    },
    {
      id: "policy_program_coordinator",
      label: "정책 프로그램 코디네이터",
      aliases: [
        "정책사업 코디네이터",
        "program coordinator"
      ],
      family: "policy_operation_support",
      responsibilityHints: [
        "사업 일정 관리",
        "이해관계자 커뮤니케이션 지원"
      ],
      levelHints: [
        "운영 경험에 따라 책임 범위 확대",
        "중급 이상에서 독립적 운영 가능"
      ]
    },
    {
      id: "administrative_officer",
      label: "행정 담당자",
      aliases: [
        "행정 직원",
        "administrative officer"
      ],
      family: "administrative_document_support",
      responsibilityHints: [
        "문서 작성 및 관리",
        "행정 절차 처리"
      ],
      levelHints: [
        "초기에는 반복 업무 비중 높음",
        "경력에 따라 관리 범위 확대"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 중심",
      values: [
        "자료 조사 및 분석 중심",
        "사업 운영 및 조율 중심",
        "행정 처리 및 문서 관리 중심"
      ]
    },
    {
      axisId: "external_interaction",
      label: "외부 상호작용 수준",
      values: [
        "거의 없음",
        "간헐적 커뮤니케이션",
        "지속적 이해관계자 대응"
      ]
    }
  ],
  adjacentFamilies: [
    "policy_planning",
    "public_relations",
    "project_management"
  ],
  boundaryHints: [
    "자료 조사와 분석 결과 생성 비중이 커지면 정책 조사·연구 지원으로 해석됩니다.",
    "외부 기관과의 협의 및 사업 운영 책임이 증가하면 정책운영 지원으로 이동합니다.",
    "문서 작성과 행정 절차 처리 비중이 대부분이면 행정·문서 지원으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 정책의 실행과 분석을 뒷받침하는 지원 역할로, 업무 중심이 조사·분석인지, 운영 조율인지, 행정 처리인지에 따라 세부 성격이 나뉩니다. 특정 업무 비중이 커지면 인접 영역으로 해석될 수 있습니다."
};
