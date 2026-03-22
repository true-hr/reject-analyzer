export const JOB_ONTOLOGY_ITEM = {
  vertical: "FINANCE_ACCOUNTING",
  subVertical: "INTERNAL_CONTROL",
  aliases: [
    "내부회계",
    "내부통제",
    "내부회계관리제도",
    "ICFR",
    "Internal Control",
    "Internal Accounting Control",
    "SOX",
    "SOX Compliance",
    "통제 설계",
    "통제 운영",
    "재무통제",
    "내부통제 점검",
    "내부회계관리",
    "통제 테스트"
  ],
  families: [
    {
      id: "icfr_design_policy",
      label: "내부회계 제도 설계·정책",
      aliases: [
        "내부회계 설계",
        "통제 설계",
        "ICFR Design",
        "통제 정책",
        "SOX 설계",
        "내부통제 정책 수립"
      ],
      strongSignals: [
        "내부회계관리제도 구조 설계",
        "업무 프로세스별 통제 포인트 정의",
        "통제 활동(Control Activity) 설계",
        "통제 문서화(Flowchart, RCM) 작성",
        "신규 사업/시스템에 대한 통제 설계",
        "통제 기준 및 정책 수립"
      ],
      mediumSignals: [
        "프로세스 인터뷰 기반 통제 도출",
        "리스크 식별 및 통제 매핑",
        "통제 변경 영향 분석",
        "정책 가이드 문서 작성",
        "유관 부서 협의 통한 통제 구조 정리"
      ],
      boundarySignals: [
        "운영 점검보다 통제 구조 설계 비중이 크면 이 family에 가깝다",
        "테스트 수행보다 통제 정의와 문서화 비중이 크면 이 family에 가깝다",
        "이슈 대응보다 사전 설계 책임이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "icfr_operation_testing",
        "audit_coordination_compliance",
        "risk_control_framework"
      ],
      boundaryNote: "통제의 적정성을 점검하기보다 어떤 통제를 둘 것인지 설계하는 책임이 커질수록 내부회계 제도 설계·정책으로 읽힙니다. 반면 설계보다 실제 운영 점검이나 테스트 비중이 커지면 운영·테스트 쪽으로 이동합니다.",
      summaryTemplate: "이 직무는 내부회계 통제 구조를 설계하고 정책을 정의하는 성격이 강합니다. 어떤 통제를 어떻게 둘지 결정하는 역할이 핵심입니다. 반면 실제 점검이나 테스트 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "icfr_operation_testing",
      label: "내부회계 운영·테스트",
      aliases: [
        "내부통제 운영",
        "통제 점검",
        "ICFR Testing",
        "통제 테스트",
        "SOX 운영",
        "통제 수행 점검"
      ],
      strongSignals: [
        "통제 수행 여부 점검 및 증빙 확인",
        "통제 테스트(Test of Control) 수행",
        "샘플링 기반 통제 검증",
        "운영 미비점(Deficiency) 식별",
        "통제 이행 여부 모니터링",
        "테스트 결과 리포트 작성"
      ],
      mediumSignals: [
        "통제 수행자 인터뷰",
        "테스트 절차서 작성",
        "테스트 일정 관리",
        "통제 개선 요청 사항 정리",
        "재테스트 수행"
      ],
      boundarySignals: [
        "설계보다 실제 통제 수행 검증 비중이 크면 이 family에 가깝다",
        "외부 감사 대응보다 내부 테스트 수행 비중이 크면 이 family에 가깝다",
        "정책 수립보다 운영 점검 반복 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "icfr_design_policy",
        "audit_coordination_compliance",
        "accounting"
      ],
      boundaryNote: "통제 구조를 설계하기보다 실제로 통제가 제대로 수행되고 있는지 점검하는 책임이 커질수록 내부회계 운영·테스트로 읽힙니다. 반면 테스트보다 외부 감사 대응이나 정책 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 내부회계 통제가 실제로 제대로 수행되는지 점검하고 검증하는 성격이 강합니다. 테스트와 증빙 확인이 핵심입니다. 반면 설계나 대외 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "audit_coordination_compliance",
      label: "감사 대응·컴플라이언스",
      aliases: [
        "외부감사 대응",
        "감사 대응",
        "Compliance",
        "SOX Compliance",
        "내부통제 컴플라이언스",
        "감사 자료 대응"
      ],
      strongSignals: [
        "외부 감사인 요청 자료 대응",
        "감사 이슈 커뮤니케이션 및 조정",
        "감사 지적사항 대응 및 개선 관리",
        "내부회계 인증 대응",
        "감사 일정 및 대응 프로세스 관리",
        "규제 준수 여부 점검"
      ],
      mediumSignals: [
        "감사 질의 대응 자료 작성",
        "부서별 자료 취합 및 검토",
        "이슈 트래킹 및 후속 조치 관리",
        "컴플라이언스 교육 지원",
        "규정 변경 모니터링"
      ],
      boundarySignals: [
        "내부 테스트보다 외부 감사 대응 비중이 크면 이 family에 가깝다",
        "통제 설계보다 감사 커뮤니케이션 비중이 크면 이 family에 가깝다",
        "운영 점검보다 규제 대응과 이슈 관리 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "icfr_operation_testing",
        "icfr_design_policy",
        "risk_control_framework"
      ],
      boundaryNote: "내부 통제 점검 자체보다 외부 감사 대응과 커뮤니케이션 책임이 커질수록 감사 대응·컴플라이언스로 읽힙니다. 반면 감사 대응보다 내부 테스트나 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 외부 감사와 규제 요구에 대응하고 내부회계 준수 상태를 관리하는 성격이 강합니다. 감사 커뮤니케이션과 이슈 대응이 핵심입니다. 반면 내부 점검이나 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "risk_control_framework",
      label: "리스크·통제 체계 관리",
      aliases: [
        "리스크 관리",
        "통제 체계 관리",
        "Internal Control Framework",
        "리스크 통제",
        "ERM 연계 통제",
        "통제 체계 고도화"
      ],
      strongSignals: [
        "전사 통제 프레임워크 설계 및 고도화",
        "리스크 식별 및 평가 체계 수립",
        "통제 성숙도 평가 및 개선 로드맵 수립",
        "프로세스 전반 통제 체계 재정비",
        "내부통제 기준 통합 관리",
        "통제 리스크 매트릭스 관리"
      ],
      mediumSignals: [
        "리스크 워크숍 운영",
        "통제 현황 진단 리포트 작성",
        "전사 통제 정책 정합성 점검",
        "통제 관련 프로젝트 수행",
        "부서별 통제 수준 비교 분석"
      ],
      boundarySignals: [
        "개별 통제 테스트보다 전사 체계 설계 비중이 크면 이 family에 가깝다",
        "감사 대응보다 리스크 기반 구조 설계 비중이 크면 이 family에 가깝다",
        "운영 점검보다 프레임워크 개선 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "icfr_design_policy",
        "audit_coordination_compliance",
        "strategy"
      ],
      boundaryNote: "개별 통제의 적정성보다 전사 관점에서 통제 구조와 리스크 관리 체계를 설계하는 책임이 커질수록 리스크·통제 체계 관리로 읽힙니다. 반면 실무 통제 점검이나 감사 대응 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 전사 리스크와 내부통제 체계를 구조적으로 설계하고 고도화하는 성격이 강합니다. 개별 통제보다 전체 구조 설계가 핵심입니다. 반면 운영 점검이나 감사 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "icfr_planner",
      label: "내부회계 설계 담당자",
      aliases: [
        "ICFR 설계 담당",
        "통제 설계 담당",
        "내부통제 기획자",
        "SOX 설계 담당"
      ],
      family: "icfr_design_policy",
      responsibilityHints: [
        "통제 구조 설계",
        "RCM 및 프로세스 문서화",
        "통제 정책 수립",
        "신규 프로세스 통제 정의"
      ],
      levelHints: [
        "업무 흐름을 이해하고 통제 포인트를 정의할 수 있다",
        "리스크와 통제를 연결해 설명할 수 있다"
      ]
    },
    {
      id: "icfr_tester",
      label: "내부회계 테스트 담당자",
      aliases: [
        "ICFR Tester",
        "통제 점검 담당",
        "내부통제 운영 담당",
        "SOX Tester"
      ],
      family: "icfr_operation_testing",
      responsibilityHints: [
        "통제 테스트 수행",
        "증빙 검토",
        "미비점 식별",
        "테스트 리포트 작성"
      ],
      levelHints: [
        "통제 수행 여부를 객관적으로 판단할 수 있다",
        "테스트 결과를 명확히 문서화할 수 있다"
      ]
    },
    {
      id: "compliance_manager",
      label: "컴플라이언스·감사 대응 담당자",
      aliases: [
        "Compliance Manager",
        "감사 대응 담당",
        "SOX Compliance 담당",
        "내부회계 인증 담당"
      ],
      family: "audit_coordination_compliance",
      responsibilityHints: [
        "외부 감사 대응",
        "감사 이슈 관리",
        "자료 취합 및 대응",
        "규제 준수 관리"
      ],
      levelHints: [
        "감사 요구사항을 이해하고 대응 전략을 수립할 수 있다",
        "이슈를 조정하고 커뮤니케이션할 수 있다"
      ]
    },
    {
      id: "risk_control_manager",
      label: "리스크·통제 체계 담당자",
      aliases: [
        "Internal Control Manager",
        "리스크 관리 담당",
        "통제 체계 담당",
        "ERM 연계 담당"
      ],
      family: "risk_control_framework",
      responsibilityHints: [
        "통제 프레임워크 설계",
        "리스크 평가 체계 수립",
        "통제 고도화 프로젝트",
        "전사 통제 정책 관리"
      ],
      levelHints: [
        "전사 관점에서 통제 구조를 설계할 수 있다",
        "리스크 기반 접근으로 통제를 설명할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "control_focus",
      label: "통제 초점",
      values: [
        "통제 설계 및 정책",
        "통제 운영 및 테스트",
        "감사 대응 및 규제 준수",
        "전사 리스크·통제 체계"
      ]
    },
    {
      axisId: "work_nature",
      label: "업무 성격",
      values: [
        "사전 설계 중심",
        "사후 점검 중심",
        "대외 대응 중심",
        "구조 개선 중심"
      ]
    },
    {
      axisId: "scope_level",
      label: "적용 범위",
      values: [
        "개별 프로세스 통제",
        "통제 수행 단위",
        "감사 및 규제 대응 범위",
        "전사 통제 프레임워크"
      ]
    }
  ],
  adjacentFamilies: [
    "회계",
    "재무기획",
    "리스크관리",
    "내부감사",
    "법무"
  ],
  boundaryHints: [
    "통제 설계와 정책 수립 비중이 커지면 설계·정책 쪽으로 읽힙니다.",
    "통제 테스트와 증빙 검토 비중이 커지면 운영·테스트로 이동합니다.",
    "외부 감사 대응과 커뮤니케이션 비중이 커지면 컴플라이언스로 읽힙니다.",
    "전사 리스크와 통제 체계 설계 비중이 커지면 리스크·통제 체계 관리로 이동합니다.",
    "재무 기록 처리나 회계 기준 적용 비중이 커지면 회계 직무와 경계가 가까워집니다."
  ],
  summaryTemplate: "내부회계·내부통제 직무는 재무 정보의 신뢰성을 확보하기 위한 통제 구조를 설계하고 점검하는 역할입니다. 설계, 운영 점검, 감사 대응, 체계 고도화 중 어디에 중심이 있는지에 따라 역할이 달라집니다. 반면 회계 처리나 리스크 전략 수립 비중이 커지면 인접 직무로 읽힐 수 있습니다."
};
