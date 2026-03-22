export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "HR_OPS",
  aliases: [
    "HR 운영",
    "인사 운영",
    "HR Ops",
    "HROps",
    "HR Operation",
    "HR Operations",
    "인사 오퍼레이션",
    "인사관리 운영",
    "인사관리",
    "인사 administration",
    "HR administration",
    "인사행정",
    "인사 지원",
    "인사 기획 운영",
    "인사 운영 관리",
    "인사제도 운영",
    "입퇴사 운영",
    "재직자 운영",
    "근태 운영",
    "급여 운영",
    "인사 데이터 운영",
    "HR shared service",
    "HR 서비스 운영",
    "People Operations",
    "People Ops",
    "피플 오퍼레이션"
  ],
  families: [
    {
      id: "core_employee_lifecycle_ops",
      label: "재직자·입퇴사 운영",
      aliases: [
        "입퇴사 운영",
        "재직자 운영",
        "employee lifecycle operations",
        "onboarding/offboarding",
        "HR administration",
        "인사행정 운영",
        "인사 기본 운영"
      ],
      strongSignals: [
        "입사 서류 수집, 계약 체결, 입사 등록을 직접 운영한다",
        "퇴사 처리, 인수인계 체크, 퇴직 서류, 시스템 종료 절차를 관리한다",
        "휴직, 복직, 전배, 승진, 조직 이동 같은 인사 변동을 반영한다",
        "재직증명서, 경력증명서, 인사 제증명 발급 프로세스를 운영한다",
        "인사 시스템의 사번, 소속, 직급, 고용형태 등 기준정보를 관리한다",
        "인사 변경 요청의 접수, 검토, 승인 라우팅, 최종 반영을 담당한다"
      ],
      mediumSignals: [
        "인사 문서와 증빙의 정합성을 점검한다",
        "입사일, 퇴사일, 휴직기간 등 기준일자 관리가 업무의 핵심이다",
        "현업이나 리더의 인사 변경 요청을 받아 운영 기준에 맞게 처리한다",
        "반복적이고 누락이 치명적인 운영 업무가 많다",
        "다수의 케이스를 SLA나 마감 기준으로 처리한다"
      ],
      boundarySignals: [
        "급여 마감, 4대보험, 원천세 대응 비중이 커지면 payroll 중심 family로 읽힌다",
        "규정 설계, 제도 개편, 평가/보상 정책 기획 비중이 커지면 HR 제도·기획 경계로 이동한다",
        "HRIS 설정 변경, 워크플로 자동화, 데이터 구조 설계 비중이 커지면 HRIS/프로세스 family로 이동한다",
        "노무 이슈, 징계, 분쟁, 법적 해석 대응이 잦아지면 ER·노무 경계로 읽힌다"
      ],
      adjacentFamilies: [
        "payroll_benefits_admin",
        "hris_process_governance",
        "hr_policy_compliance_ops"
      ],
      boundaryNote: "재직자·입퇴사 운영은 인사 이벤트를 정확하고 빠르게 반영하는 성격이 강합니다. 반면 급여 정산 책임이 커지면 급여 운영에, 시스템 설계와 자동화 비중이 커지면 HRIS 운영에 더 가깝게 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 입사, 재직, 이동, 퇴사 같은 인사 이벤트를 기준에 맞게 반영하고 관리하는 운영 성격이 강합니다. 반면 급여 정산이나 제도 설계 책임 비중이 커지면 다른 HR 운영 경계로 읽힐 수 있습니다."
    },
    {
      id: "payroll_benefits_admin",
      label: "급여·복리후생 운영",
      aliases: [
        "급여 운영",
        "payroll",
        "payroll operations",
        "보상 운영",
        "복리후생 운영",
        "급상여 운영",
        "4대보험 운영",
        "연말정산 운영",
        "원천세 운영",
        "benefits administration"
      ],
      strongSignals: [
        "급여, 상여, 수당, 공제 항목을 산정하고 마감한다",
        "근태, 휴가, 연장근로 데이터와 급여 데이터를 연결해 정산한다",
        "4대보험 취득상실, 보수총액, 각종 신고를 운영한다",
        "연말정산, 원천세, 퇴직금, 퇴직정산 프로세스를 관리한다",
        "복리후생 비용, 지급 기준, 대상자 적용을 운영한다",
        "급여 오류, 소급 반영, 정산 차이를 검증하고 수정한다"
      ],
      mediumSignals: [
        "월별 마감 캘린더와 정산 정확도가 매우 중요하다",
        "노무, 재무, 회계와 데이터 정합성을 맞추는 일이 많다",
        "민감한 개인 보상정보를 다루며 보안과 정확성 요구가 높다",
        "복잡한 예외 케이스를 규정에 맞게 처리한다"
      ],
      boundarySignals: [
        "입퇴사, 증명서, 재직 정보 반영 중심이면 core employee lifecycle family로 읽힌다",
        "보상 철학, salary band, incentive 설계 비중이 커지면 C&B 기획 경계로 이동한다",
        "법 해석, 노동청 대응, 징계/분쟁 대응 비중이 커지면 ER·노무 경계로 이동한다",
        "시스템 인터페이스, 급여 엔진 설정, 자동화 구축 비중이 커지면 HRIS/프로세스 family로 이동한다"
      ],
      adjacentFamilies: [
        "core_employee_lifecycle_ops",
        "hris_process_governance",
        "hr_policy_compliance_ops"
      ],
      boundaryNote: "급여·복리후생 운영은 금액 산정과 마감 정확도가 핵심입니다. 반면 제도 설계보다 정산과 신고 실행이 중심인지, 혹은 시스템 설계와 자동화가 더 큰 책임인지에 따라 경계가 갈립니다.",
      summaryTemplate: "이 직무는 급여, 공제, 복리후생, 4대보험 등 보상 관련 운영을 정확하게 정산하고 반영하는 성격이 강합니다. 반면 제도 설계보다 데이터 마감과 신고 실행 비중이 큰 경우에 특히 이 family로 읽힙니다."
    },
    {
      id: "hris_process_governance",
      label: "HRIS·프로세스 운영",
      aliases: [
        "HRIS 운영",
        "인사시스템 운영",
        "people systems",
        "HR systems",
        "인사 프로세스 운영",
        "워크플로 운영",
        "HR automation",
        "HR process governance",
        "시스템 기반 인사 운영"
      ],
      strongSignals: [
        "HRIS, 전자결재, 근태, 급여, 조직도 시스템의 운영 설정을 관리한다",
        "인사 업무 프로세스를 표준화하고 워크플로를 설계·개선한다",
        "시스템 권한, 마스터 데이터, 코드체계, 필드 기준을 관리한다",
        "반복 업무를 자동화하거나 운영 효율 개선 과제를 수행한다",
        "인사 데이터 흐름과 시스템 간 인터페이스 정합성을 점검한다",
        "운영 이슈를 티켓 기반으로 접수하고 원인 파악과 재발 방지를 관리한다"
      ],
      mediumSignals: [
        "운영 정책을 시스템 룰로 구현하거나 예외 처리 기준을 정리한다",
        "대규모 조직개편, 인사제도 변경 시 시스템 반영 리드를 맡는다",
        "운영 매뉴얼, 프로세스 맵, 기준서 문서화를 수행한다",
        "현업 요청을 단순 처리하기보다 프로세스 구조 자체를 다듬는다"
      ],
      boundarySignals: [
        "실제 인사변동 케이스 처리 비중이 커지면 core employee lifecycle family로 읽힌다",
        "급여 마감과 금액 정산 책임이 핵심이면 payroll 중심 family로 이동한다",
        "전사 제도 설계, 규정 개정, 조직문화 정책 기획 비중이 커지면 HR 제도·기획 경계로 이동한다",
        "단순 IT 운영이 아니라 인사 기준과 프로세스 책임을 함께 지는지 여부가 경계를 가른다"
      ],
      adjacentFamilies: [
        "core_employee_lifecycle_ops",
        "payroll_benefits_admin",
        "hr_policy_compliance_ops"
      ],
      boundaryNote: "HRIS·프로세스 운영은 시스템 그 자체보다 인사 운영 기준을 어떻게 구조화하고 일관되게 실행시키는지가 핵심입니다. 반면 케이스 처리 실행이 중심이면 재직자 운영에, 급여 정산이 중심이면 급여 운영에 더 가깝습니다.",
      summaryTemplate: "이 직무는 인사 운영을 시스템과 프로세스로 안정화하는 성격이 강합니다. 반면 실제 인사변동 처리나 급여 정산 실행 비중이 더 크면 다른 HR 운영 경계로 읽힐 수 있습니다."
    },
    {
      id: "hr_policy_compliance_ops",
      label: "인사 기준·규정 운영",
      aliases: [
        "인사 규정 운영",
        "HR policy operations",
        "취업규칙 운영",
        "인사 기준 운영",
        "규정 관리",
        "컴플라이언스 운영",
        "노무 연계 운영",
        "인사 감사 대응",
        "인사 governance"
      ],
      strongSignals: [
        "취업규칙, 인사규정, 근태 기준, 승인 기준을 운영하고 해석한다",
        "인사 운영 케이스가 규정에 맞는지 검토하고 예외 적용 여부를 판단한다",
        "노무 리스크가 있는 운영 이슈를 기준에 따라 정리하고 대응한다",
        "감사, 점검, 내부통제 관점에서 인사 운영 증빙과 절차를 관리한다",
        "징계, 휴직, 복무, 근태 예외 등 민감 케이스의 운영 기준을 다룬다",
        "현업과 HRBP의 예외 요청에 대해 기준 해석과 운영 가능 범위를 제시한다"
      ],
      mediumSignals: [
        "규정 문구보다 실제 운영 적용 기준과 사례 축적이 중요하다",
        "노무 또는 법무와 협업해 운영 판단을 정리한다",
        "예외 승인, 케이스 검토, 재발 방지 기준 수립이 자주 등장한다",
        "운영의 일관성과 법적 방어 가능성을 동시에 본다"
      ],
      boundarySignals: [
        "분쟁 대응, 노동사건, 집단 이슈 대응이 중심이면 ER·노무 family로 더 강하게 읽힌다",
        "실제 입퇴사·변동 처리 실행 비중이 크면 core employee lifecycle family로 이동한다",
        "제도 신설과 정책 기획이 중심이면 HR 기획 또는 C&B 제도 설계 경계로 이동한다",
        "시스템 권한, 워크플로 설계, 데이터 구조화 비중이 커지면 HRIS/프로세스 family로 이동한다"
      ],
      adjacentFamilies: [
        "core_employee_lifecycle_ops",
        "hris_process_governance",
        "payroll_benefits_admin"
      ],
      boundaryNote: "인사 기준·규정 운영은 단순 문서 관리보다 실제 운영 케이스를 어떤 기준으로 해석하고 통제하는지가 핵심입니다. 반면 분쟁 대응이나 노동사건 비중이 커지면 노무 영역으로, 제도 설계 비중이 커지면 HR 기획 영역으로 경계가 이동합니다.",
      summaryTemplate: "이 직무는 인사 운영이 규정과 기준에 맞게 집행되도록 해석하고 통제하는 성격이 강합니다. 반면 실행 처리보다 제도 설계나 노무 분쟁 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "hr_operations_coordinator",
      label: "HR Operations Coordinator",
      aliases: [
        "HR Operations Coordinator",
        "HR 운영 담당자",
        "인사 운영 담당",
        "인사관리 담당",
        "HR Admin",
        "인사행정 담당"
      ],
      family: "core_employee_lifecycle_ops",
      responsibilityHints: [
        "입사·퇴사·휴직·복직 등 인사 이벤트를 처리한다",
        "기본 인사정보와 서류를 관리한다",
        "현업 요청을 기준에 맞게 접수·반영한다"
      ],
      levelHints: [
        "정해진 프로세스를 정확하게 수행하는 역할 비중이 크다",
        "예외 케이스 판단보다 누락 없는 처리와 일정 준수가 중요하다"
      ]
    },
    {
      id: "employee_lifecycle_specialist",
      label: "Employee Lifecycle Specialist",
      aliases: [
        "Employee Lifecycle Specialist",
        "재직자 운영 담당",
        "온보딩 오프보딩 담당",
        "입퇴사 운영 담당"
      ],
      family: "core_employee_lifecycle_ops",
      responsibilityHints: [
        "재직자 라이프사이클 전반의 케이스를 관리한다",
        "조직 이동, 승진, 계약변경 같은 인사 변동을 반영한다",
        "운영 기준과 문서 정합성을 유지한다"
      ],
      levelHints: [
        "복수 유형의 인사 변동을 스스로 판단해 처리한다",
        "복잡한 케이스와 일정 충돌을 조정하는 역할이 늘어난다"
      ]
    },
    {
      id: "payroll_benefits_specialist",
      label: "Payroll & Benefits Specialist",
      aliases: [
        "Payroll Specialist",
        "급여 담당",
        "급여 운영 담당",
        "복리후생 담당",
        "4대보험 담당",
        "연말정산 담당"
      ],
      family: "payroll_benefits_admin",
      responsibilityHints: [
        "급여와 공제, 복리후생 지급을 운영한다",
        "마감 일정에 맞춰 정산 데이터를 검증한다",
        "4대보험과 세무 관련 운영을 처리한다"
      ],
      levelHints: [
        "반복 정산을 정확히 수행하는 역할에서 시작한다",
        "복잡한 예외 정산, 소급 반영, 오류 원인 분석 비중이 커질수록 숙련도가 높다"
      ]
    },
    {
      id: "hris_operations_specialist",
      label: "HRIS Operations Specialist",
      aliases: [
        "HRIS Specialist",
        "HRIS 운영 담당",
        "인사시스템 운영 담당",
        "People Systems Specialist",
        "HR Process Specialist"
      ],
      family: "hris_process_governance",
      responsibilityHints: [
        "인사 시스템 설정과 운영 기준을 관리한다",
        "워크플로와 기준정보를 정리하고 개선한다",
        "운영 이슈를 분석해 프로세스 개선으로 연결한다"
      ],
      levelHints: [
        "단순 입력보다 구조와 흐름을 보는 역할 비중이 크다",
        "여러 시스템과 프로세스를 연결해 표준화할수록 상위 수준으로 읽힌다"
      ]
    },
    {
      id: "hr_policy_operations_specialist",
      label: "HR Policy Operations Specialist",
      aliases: [
        "HR Policy Specialist",
        "인사규정 운영 담당",
        "인사 기준 운영 담당",
        "HR Governance Specialist",
        "인사 컴플라이언스 담당"
      ],
      family: "hr_policy_compliance_ops",
      responsibilityHints: [
        "운영 케이스를 규정과 기준에 따라 검토한다",
        "예외 적용 가능 여부와 운영 리스크를 판단한다",
        "감사 대응이나 기준 문서 정비를 수행한다"
      ],
      levelHints: [
        "규정을 단순 전달하는 수준보다 실제 케이스 판단이 가능해야 한다",
        "민감 사례를 일관된 기준으로 처리할수록 상위 역할로 읽힌다"
      ]
    },
    {
      id: "hr_operations_manager",
      label: "HR Operations Manager",
      aliases: [
        "HR Operations Manager",
        "인사 운영 매니저",
        "인사관리 매니저",
        "HR Ops Manager",
        "People Operations Manager"
      ],
      family: "core_employee_lifecycle_ops",
      responsibilityHints: [
        "운영 팀의 SLA, 품질, 마감 체계를 관리한다",
        "입퇴사·재직자 운영의 기준과 프로세스를 정비한다",
        "여러 HR 운영 기능 간 연계를 조정한다"
      ],
      levelHints: [
        "개별 케이스 처리보다 운영 체계와 우선순위 관리 비중이 커진다",
        "팀 리딩, 운영 개선, 기준 일관성 확보 책임이 동반된다"
      ]
    }
  ],
  axes: [
    {
      axisId: "execution_focus",
      label: "운영 실행의 중심",
      values: [
        "재직자·입퇴사 이벤트 처리 중심",
        "급여·공제·복리후생 정산 중심",
        "시스템·워크플로·기준정보 운영 중심",
        "규정 해석·예외 검토·통제 중심"
      ]
    },
    {
      axisId: "judgment_complexity",
      label: "판단 복잡도",
      values: [
        "정형화된 요청을 기준에 맞게 처리",
        "예외 케이스를 운영 기준에 따라 판단",
        "복수 이해관계자와 시스템 영향을 함께 고려",
        "법적·통제 리스크까지 감안해 운영 기준을 적용"
      ]
    },
    {
      axisId: "system_dependency",
      label: "시스템 의존도",
      values: [
        "문서·체크리스트 기반 운영 비중이 높음",
        "HRIS 입력 및 기준정보 관리 비중이 높음",
        "워크플로·권한·자동화 설계 비중이 높음",
        "시스템보다 규정 해석과 케이스 통제가 더 중요함"
      ]
    },
    {
      axisId: "time_rhythm",
      label: "업무 리듬",
      values: [
        "수시 발생 케이스를 안정적으로 처리",
        "월 마감·정산 캘린더에 맞춰 운영",
        "프로젝트성 개선과 상시 운영을 병행",
        "예외 이슈와 감사 대응에 따라 집중도가 달라짐"
      ]
    }
  ],
  adjacentFamilies: [
    "hr_planning",
    "compensation_benefits",
    "employee_relations_labor",
    "talent_acquisition_operations",
    "general_affairs_corporate_support"
  ],
  boundaryHints: [
    "입사, 재직, 퇴사, 조직 이동 같은 인사 이벤트를 기준에 맞게 반영하는 책임이 가장 크면 HR 운영으로 읽힙니다.",
    "급여 정산, 공제, 4대보험, 연말정산 같은 금액·신고 마감 책임 비중이 커지면 보상 운영 또는 급여 운영 쪽 경계가 강해집니다.",
    "운영 케이스 처리보다 시스템 설정, 워크플로 설계, 마스터 데이터 구조화 비중이 커지면 HRIS 또는 프로세스 운영 경계로 이동합니다.",
    "규정 해석, 예외 승인, 감사 대응, 복무 기준 적용 같은 통제 책임이 커지면 인사 기준·노무 연계 운영 쪽으로 읽힐 수 있습니다.",
    "제도 설계, 평가 체계, 보상 철학, 조직 정책 수립 비중이 커지면 HR 운영보다 HR 기획 또는 C&B 기획 경계로 넘어갑니다.",
    "채용 프로세스 운영이라도 오퍼레이터 관리, 인터뷰 코디네이션, 채용 단계 운영에 집중하면 채용 운영 family로 분리해 읽는 것이 더 적절합니다."
  ],
  summaryTemplate: "HR 운영은 사람 관련 이벤트를 기준에 맞게 정확히 반영하고, 인사 데이터와 프로세스를 안정적으로 유지하는 성격이 강합니다. 같은 HR 안에서도 입퇴사·재직자 처리 중심인지, 급여·복리후생 정산 중심인지, 시스템·프로세스 운영 중심인지에 따라 실제 역할 해석이 달라집니다. 반면 제도 설계나 노무 분쟁 대응 비중이 커지면 다른 인사 family 경계로 읽힐 수 있습니다."
};
