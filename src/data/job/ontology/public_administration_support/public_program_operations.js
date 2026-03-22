export const JOB_ONTOLOGY_ITEM = {
  vertical: "PUBLIC_ADMINISTRATION_SUPPORT",
  subVertical: "PUBLIC_PROGRAM_OPERATIONS",
  aliases: [
    "공공사업 운영",
    "공공사업 관리",
    "공공 프로젝트 운영",
    "정부사업 운영",
    "공공 프로그램 운영",
    "public program operations",
    "government program management",
    "public project operations"
  ],
  families: [
    {
      id: "program_execution",
      label: "사업 실행 운영",
      aliases: [
        "사업 운영",
        "프로그램 운영",
        "사업 실행",
        "project execution",
        "program operations"
      ],
      strongSignals: [
        "사업 일정 관리 및 운영 계획 수립",
        "참여자 모집 및 관리",
        "사업 수행 과정 모니터링",
        "사업 운영 매뉴얼 기반 실행",
        "현장 운영 또는 운영 이슈 대응"
      ],
      mediumSignals: [
        "사업 관련 커뮤니케이션 조율",
        "운영 결과 정리 및 보고",
        "운영 프로세스 개선 시도"
      ],
      boundarySignals: [
        "성과지표 설계 비중이 커지면 성과관리로 이동",
        "외부 기관 조율 비중이 커지면 협력조정으로 이동"
      ],
      adjacentFamilies: ["performance_management", "stakeholder_coordination"],
      boundaryNote: "단순 실행을 넘어서 성과지표 설계나 평가 비중이 커지면 성과관리로, 외부 이해관계자 조율이 핵심이 되면 협력조정으로 읽힐 수 있습니다.",
      summaryTemplate: "이 역할은 공공사업을 실제로 실행하고 운영하는 성격이 강합니다. 반면 성과 측정이나 외부 조율 비중이 커지면 다른 영역으로 해석될 수 있습니다."
    },
    {
      id: "performance_management",
      label: "성과 관리 및 평가",
      aliases: [
        "성과관리",
        "사업 평가",
        "성과 분석",
        "performance management",
        "program evaluation"
      ],
      strongSignals: [
        "성과지표(KPI) 설계 및 관리",
        "사업 결과 데이터 분석",
        "성과보고서 작성",
        "정량/정성 평가 수행",
        "성과 개선안 도출"
      ],
      mediumSignals: [
        "데이터 기반 의사결정 지원",
        "성과 모니터링 체계 구축"
      ],
      boundarySignals: [
        "현장 운영 개입이 많아지면 사업 실행 운영으로 이동",
        "정책 설계 비중이 커지면 정책 기획으로 이동"
      ],
      adjacentFamilies: ["program_execution", "policy_planning"],
      boundaryNote: "성과를 측정하고 해석하는 역할에서 벗어나 실제 운영을 직접 담당하게 되면 사업 실행으로, 정책 방향을 설계하는 수준으로 올라가면 정책 기획으로 구분됩니다.",
      summaryTemplate: "이 역할은 공공사업의 성과를 측정하고 분석하는 성격이 강합니다. 반면 실행 개입이나 정책 설계 비중이 커지면 다른 영역으로 이동할 수 있습니다."
    },
    {
      id: "stakeholder_coordination",
      label: "이해관계자 협력 및 조정",
      aliases: [
        "협력 관리",
        "유관기관 조율",
        "파트너십 운영",
        "stakeholder coordination",
        "partnership management"
      ],
      strongSignals: [
        "유관기관 및 외부 파트너 협의",
        "사업 참여 기관 간 역할 조정",
        "회의 주관 및 의사결정 조율",
        "협약 체결 및 관계 유지"
      ],
      mediumSignals: [
        "커뮤니케이션 채널 운영",
        "갈등 조정 및 이슈 중재"
      ],
      boundarySignals: [
        "내부 실행 비중이 커지면 사업 실행 운영으로 이동",
        "성과지표 관리 중심이면 성과관리로 이동"
      ],
      adjacentFamilies: ["program_execution", "performance_management"],
      boundaryNote: "외부 조율보다는 내부 실행 비중이 높아지면 사업 실행으로, 협력 결과를 성과지표 중심으로 관리하면 성과관리로 해석됩니다.",
      summaryTemplate: "이 역할은 다양한 이해관계자 간 협력과 조정을 중심으로 합니다. 반면 실행 또는 성과 관리 비중이 커지면 다른 영역으로 읽힐 수 있습니다."
    },
    {
      id: "policy_planning",
      label: "사업 기획 및 정책 연계",
      aliases: [
        "사업 기획",
        "정책 연계",
        "프로그램 설계",
        "program planning",
        "policy linkage"
      ],
      strongSignals: [
        "사업 구조 및 운영 모델 설계",
        "정책 방향과 사업 정렬",
        "신규 사업 기획 및 제안서 작성",
        "예산 구조 설계 및 계획 수립"
      ],
      mediumSignals: [
        "시장/수요 분석 기반 기획",
        "사업 개선안 도출"
      ],
      boundarySignals: [
        "실행 비중이 커지면 사업 실행 운영으로 이동",
        "성과 분석 중심이면 성과관리로 이동"
      ],
      adjacentFamilies: ["program_execution", "performance_management"],
      boundaryNote: "기획 중심에서 실제 운영을 직접 담당하게 되면 사업 실행으로, 성과 분석과 평가에 집중하면 성과관리로 이동합니다.",
      summaryTemplate: "이 역할은 공공사업의 구조와 방향을 설계하는 성격이 강합니다. 반면 실행이나 성과 분석 비중이 커지면 다른 영역으로 구분될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "program_operator",
      label: "공공사업 운영 담당자",
      aliases: ["사업 운영자", "프로그램 운영 담당"],
      family: "program_execution",
      responsibilityHints: [
        "사업 일정 및 참여자 관리",
        "운영 프로세스 실행 및 이슈 대응"
      ],
      levelHints: [
        "주니어는 실행 중심, 시니어는 운영 구조 개선 포함"
      ]
    },
    {
      id: "performance_analyst",
      label: "성과관리 담당자",
      aliases: ["성과 분석가", "사업 평가 담당"],
      family: "performance_management",
      responsibilityHints: [
        "성과지표 설계 및 데이터 분석",
        "성과보고 및 개선안 도출"
      ],
      levelHints: [
        "시니어일수록 평가 체계 설계 비중 증가"
      ]
    },
    {
      id: "stakeholder_manager",
      label: "협력 및 조정 담당자",
      aliases: ["유관기관 담당", "파트너십 매니저"],
      family: "stakeholder_coordination",
      responsibilityHints: [
        "외부 기관 협의 및 관계 관리",
        "이슈 조정 및 협력 구조 설계"
      ],
      levelHints: [
        "상위 레벨일수록 전략적 파트너십 비중 증가"
      ]
    },
    {
      id: "program_planner",
      label: "사업 기획 담당자",
      aliases: ["정책 연계 기획자", "프로그램 설계자"],
      family: "policy_planning",
      responsibilityHints: [
        "사업 구조 설계 및 기획안 작성",
        "정책 방향과 사업 정렬"
      ],
      levelHints: [
        "시니어일수록 정책 연계 및 예산 설계 포함"
      ]
    }
  ],
  axes: [
    {
      axisId: "execution_vs_planning",
      label: "실행 vs 기획",
      values: ["execution_heavy", "balanced", "planning_heavy"]
    },
    {
      axisId: "internal_vs_external_focus",
      label: "내부 운영 vs 외부 조율",
      values: ["internal_focus", "balanced", "external_focus"]
    },
    {
      axisId: "operation_vs_evaluation",
      label: "운영 vs 성과평가",
      values: ["operation_heavy", "balanced", "evaluation_heavy"]
    }
  ],
  adjacentFamilies: [
    "policy_planning",
    "public_relations",
    "grant_management"
  ],
  boundaryHints: [
    "사업 실행보다 정책 방향 설계 비중이 커지면 정책 기획 영역으로 이동합니다.",
    "외부 홍보나 대외 메시지 관리가 중심이 되면 PR/대외협력으로 해석됩니다.",
    "보조금 집행 및 정산 중심이면 grant 관리 영역으로 이동합니다.",
    "성과지표 설계와 평가 비중이 커질수록 성과관리로 읽히는 경향이 강해집니다."
  ],
  summaryTemplate: "이 직무는 공공사업을 기획, 운영, 조정, 평가하는 역할을 포함하며 실제 실행과 성과 관리 사이에서 균형이 갈립니다. 특히 어떤 기능에 더 많은 책임을 두는지에 따라 실행, 성과관리, 협력조정, 기획 영역으로 경계가 나뉘게 됩니다."
};
