export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "HR_PLANNING",
  aliases: [
    "인사기획",
    "HR기획",
    "HR Planning",
    "People Planning",
    "인사 전략",
    "HR Strategy",
    "인사제도 기획",
    "HR 제도 기획",
    "조직 인사 기획",
    "인사정책",
    "HR Policy",
    "인사 운영기획",
    "조직제도 기획",
    "인사관리 기획"
  ],
  families: [
    {
      id: "hr_policy_comp_design",
      label: "인사제도·보상 기획",
      aliases: [
        "인사제도 기획",
        "HR 제도 기획",
        "보상 기획",
        "평가보상 기획",
        "직급체계 기획",
        "급여체계 기획",
        "성과평가 제도 기획",
        "HR Policy & Compensation"
      ],
      strongSignals: [
        "직급·직책·승진 체계 개편",
        "평가 제도 설계 또는 개편",
        "보상 철학, 연봉밴드, 인센티브 구조 설계",
        "인사규정·취업규칙·제도 운영 기준 정비",
        "성과관리 제도와 보상 연결 구조 설계",
        "제도 도입안, 개편안, 시행 기준안 작성"
      ],
      mediumSignals: [
        "인사 제도 FAQ, 가이드, 운영 원칙 문서화",
        "시장 보상 벤치마크 참고",
        "제도 시행 후 적용 이슈 정리",
        "보상 데이터 검토 및 제도 영향 분석",
        "임직원 커뮤니케이션 자료 작성"
      ],
      boundarySignals: [
        "채용 규모 계획보다 평가·보상 구조 설계 비중이 크면 이 family에 가깝다",
        "조직 개편안보다 직급·평가·연봉 기준 설계 비중이 크면 이 family에 가깝다",
        "데이터 리포팅보다 제도 원칙과 적용 기준 수립 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "workforce_org_planning",
        "hr_operation_process",
        "people_analytics_governance"
      ],
      boundaryNote: "인력 수요 계획이나 조직 구조 설계보다 평가·보상·직급체계 같은 제도 설계 책임이 커질수록 인사제도·보상 기획으로 읽힙니다. 반면 제도 자체보다 운영 프로세스 안정화나 시스템 정합성 관리 비중이 커지면 인사운영 기획 경계로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 인사제도와 보상 체계를 설계하고 정비하는 성격이 강합니다. 특히 평가, 승진, 직급, 보상 원칙을 구조화하는 책임이 두드러집니다. 반면 인력 계획이나 조직 설계 비중이 더 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "workforce_org_planning",
      label: "인력·조직 기획",
      aliases: [
        "인력기획",
        "조직기획",
        "정원관리",
        "헤드카운트 기획",
        "Workforce Planning",
        "Organization Planning",
        "HC Planning",
        "조직운영 기획"
      ],
      strongSignals: [
        "중장기 인력 운영 계획 수립",
        "정원 산정, TO 관리, 헤드카운트 계획",
        "조직 개편안 검토 또는 조직 구조 설계",
        "부서 신설·통합·분리 기준 검토",
        "인건비 관점의 인력 구조 검토",
        "사업계획과 연동한 인력 수요 예측"
      ],
      mediumSignals: [
        "채용 요청 타당성 검토",
        "부서별 인력 현황 모니터링",
        "조직도 관리와 조직 변경 이력 정리",
        "인력 운영 기준 문서화",
        "조직장 인터뷰를 통한 인력 이슈 수집"
      ],
      boundarySignals: [
        "평가·보상 제도 설계보다 정원·조직 구조 판단 비중이 크면 이 family에 가깝다",
        "채용 실행보다 채용 수요 산정과 승인 기준 설계 비중이 크면 이 family에 가깝다",
        "리포트 생산보다 인력 배분 의사결정 지원 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "hr_policy_comp_design",
        "people_analytics_governance",
        "hr_operation_process"
      ],
      boundaryNote: "채용 자체를 실행하기보다 몇 명을 어떤 구조로 둘지 결정하는 책임이 커질수록 인력·조직 기획으로 읽힙니다. 반면 조직 설계보다 평가·보상 제도 설계가 중심이면 인사제도·보상 기획에, 정기 운영과 승인 프로세스 관리가 중심이면 인사운영 기획에 더 가깝습니다.",
      summaryTemplate: "이 직무는 사업과 조직 운영에 맞춰 인력 규모와 조직 구조를 설계하는 성격이 강합니다. 정원, 조직 개편, 인력 배분 판단이 핵심입니다. 반면 제도 설계나 운영 안정화 비중이 더 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "people_analytics_governance",
      label: "인사데이터·거버넌스 기획",
      aliases: [
        "인사데이터 기획",
        "HR 데이터 기획",
        "People Analytics",
        "HR Analytics",
        "인사 거버넌스",
        "HR Governance",
        "인사 지표 관리",
        "조직 데이터 분석"
      ],
      strongSignals: [
        "인사 핵심 지표 정의 및 관리 체계 수립",
        "이직률, 충원율, 정원 대비 현원 등 지표 설계",
        "경영진용 인사 대시보드 또는 정기 리포트 설계",
        "인사 데이터 기준 정의, 코드 체계, 데이터 정합성 기준 수립",
        "인력 의사결정을 위한 분석 프레임 설계",
        "HRIS 데이터 활용 기준과 관리 체계 정비"
      ],
      mediumSignals: [
        "조직별 인력 현황 분석",
        "인사 데이터 추출 및 리포팅 자동화 요구사항 정리",
        "지표 해석 가이드 작성",
        "데이터 이슈 원인 점검",
        "인사 관련 회의체용 분석 자료 작성"
      ],
      boundarySignals: [
        "제도 개편보다 지표 정의와 분석 체계 수립 비중이 크면 이 family에 가깝다",
        "운영 처리보다 데이터 기준 정합성과 리포트 설계 비중이 크면 이 family에 가깝다",
        "조직 설계 자체보다 의사결정용 인사이트 제공 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "workforce_org_planning",
        "hr_operation_process",
        "hr_policy_comp_design"
      ],
      boundaryNote: "제도나 조직안을 직접 설계하기보다 인사 의사결정을 위한 지표 체계와 데이터 기준을 설계하는 책임이 커질수록 인사데이터·거버넌스 기획으로 읽힙니다. 반면 데이터 해석보다 실제 정원 조정이나 제도 설계 책임이 커지면 다른 family 경계로 이동합니다.",
      summaryTemplate: "이 직무는 인사 데이터를 구조화하고 의사결정에 쓰일 지표 체계를 설계하는 성격이 강합니다. 단순 집계보다 기준 정의와 해석 프레임 수립이 핵심입니다. 반면 제도 개편이나 조직 설계 책임이 더 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "hr_operation_process",
      label: "인사운영·프로세스 기획",
      aliases: [
        "인사운영 기획",
        "HR Operations Planning",
        "인사 프로세스 기획",
        "HR Process Design",
        "인사운영 정책",
        "인사관리 운영기획",
        "HR 운영 고도화"
      ],
      strongSignals: [
        "입퇴사, 발령, 평가 운영, 보상 반영 등 인사 프로세스 설계",
        "인사 운영 SOP, 승인 체계, 예외 처리 기준 정비",
        "HRIS 요구사항 정의 및 운영 프로세스 정합성 검토",
        "인사 행정 흐름 개선과 운영 리드타임 단축",
        "프로세스 표준화, 운영 통제, 감사 대응 기준 수립",
        "현업과 공유되는 인사 운영 정책 정비"
      ],
      mediumSignals: [
        "운영 이슈 티켓 패턴 정리",
        "프로세스 개선안 작성",
        "운영 담당자 교육 자료 제작",
        "시스템 변경에 따른 운영 절차 수정",
        "인사 이벤트 캘린더 설계"
      ],
      boundarySignals: [
        "제도 철학보다 실제 운영 흐름과 승인 체계 정비 비중이 크면 이 family에 가깝다",
        "조직 구조 설계보다 인사 운영 효율화 비중이 크면 이 family에 가깝다",
        "분석 인사이트보다 운영 일관성과 예외 통제 책임이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "hr_policy_comp_design",
        "people_analytics_governance",
        "workforce_org_planning"
      ],
      boundaryNote: "제도 내용을 새로 설계하기보다 현재 인사 운영이 안정적으로 돌아가도록 프로세스와 기준을 정비하는 책임이 커질수록 인사운영·프로세스 기획으로 읽힙니다. 반면 운영 효율화보다 보상·평가 원칙 설계 비중이 커지면 인사제도·보상 기획 경계로 이동합니다.",
      summaryTemplate: "이 직무는 인사 운영 프로세스를 설계하고 표준화하는 성격이 강합니다. 실제 업무가 일관되게 실행되도록 승인 체계와 운영 기준을 다듬는 역할이 핵심입니다. 반면 제도 설계나 데이터 분석 비중이 더 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "hr_planning_manager",
      label: "인사기획 담당자",
      aliases: [
        "인사기획 담당",
        "HR Planner",
        "HR Planning Specialist",
        "인사기획 매니저"
      ],
      family: "hr_policy_comp_design",
      responsibilityHints: [
        "인사 제도 검토안 작성",
        "평가·보상 운영 기준 정리",
        "정기 인사 이벤트 기획 지원",
        "제도 커뮤니케이션 자료 작성"
      ],
      levelHints: [
        "실무 운영 이슈를 제도 문서로 구조화할 수 있다",
        "기존 제도를 기준에 맞게 정리하고 개선 포인트를 도출한다"
      ]
    },
    {
      id: "compensation_benefits_planner",
      label: "보상기획 담당자",
      aliases: [
        "보상기획",
        "C&B Planner",
        "Compensation Planner",
        "평가보상 담당"
      ],
      family: "hr_policy_comp_design",
      responsibilityHints: [
        "연봉·인센티브 구조 검토",
        "평가 결과와 보상 반영 기준 설계",
        "보상 벤치마크 자료 정리",
        "직급·승진 기준 개편 지원"
      ],
      levelHints: [
        "단순 급여 운영보다 보상 원칙 설계 참여 경험이 있다",
        "제도 변경이 조직에 미치는 영향을 설명할 수 있다"
      ]
    },
    {
      id: "workforce_planner",
      label: "인력기획 담당자",
      aliases: [
        "인력기획",
        "Workforce Planner",
        "HC Planner",
        "정원관리 담당"
      ],
      family: "workforce_org_planning",
      responsibilityHints: [
        "부서별 정원 계획 수립",
        "인력 수요 검토 및 승인 기준 정리",
        "헤드카운트 변동 분석",
        "사업계획 연동 인력 운영안 작성"
      ],
      levelHints: [
        "채용 실행과 구분되는 인력 규모 판단 경험이 있다",
        "조직장과 협의해 인력 배치 원칙을 정리할 수 있다"
      ]
    },
    {
      id: "organization_planning_manager",
      label: "조직기획 담당자",
      aliases: [
        "조직기획",
        "Organization Planning Manager",
        "조직설계 담당",
        "조직운영 기획자"
      ],
      family: "workforce_org_planning",
      responsibilityHints: [
        "조직 개편안 검토",
        "조직 구조와 역할 분장 정리",
        "부서 신설·통합 기준 정비",
        "조직도 및 변경 이력 관리"
      ],
      levelHints: [
        "단순 조직도 관리보다 구조 변경 논리를 제시할 수 있다",
        "조직 개편이 인력 운영에 미치는 영향을 설명할 수 있다"
      ]
    },
    {
      id: "people_analytics_specialist",
      label: "인사데이터 분석 담당자",
      aliases: [
        "People Analytics Specialist",
        "HR Analytics Specialist",
        "인사데이터 담당",
        "HR 지표 담당"
      ],
      family: "people_analytics_governance",
      responsibilityHints: [
        "인사 KPI 정의",
        "대시보드 설계",
        "이직·충원·구성비 분석",
        "경영진용 인사 리포트 작성"
      ],
      levelHints: [
        "단순 수치 취합보다 지표 정의와 해석 기준을 설계할 수 있다",
        "인사 데이터의 의미를 조직 의사결정과 연결해 설명할 수 있다"
      ]
    },
    {
      id: "hr_governance_manager",
      label: "인사거버넌스 담당자",
      aliases: [
        "HR Governance Manager",
        "인사 거버넌스 담당",
        "인사기준 관리 담당",
        "HR 데이터 거버넌스 담당"
      ],
      family: "people_analytics_governance",
      responsibilityHints: [
        "인사 데이터 기준 정의",
        "코드 체계·마스터 데이터 관리 원칙 수립",
        "리포트 기준 통일",
        "데이터 정합성 이슈 조정"
      ],
      levelHints: [
        "운영자가 다르게 해석하던 기준을 통일할 수 있다",
        "시스템과 리포트 사이의 기준 불일치를 줄이는 역할을 한다"
      ]
    },
    {
      id: "hr_operations_planner",
      label: "인사운영 기획 담당자",
      aliases: [
        "HR Operations Planner",
        "인사운영 기획",
        "HR 프로세스 기획",
        "인사 프로세스 담당"
      ],
      family: "hr_operation_process",
      responsibilityHints: [
        "인사 운영 절차 표준화",
        "승인 프로세스 설계",
        "예외 처리 기준 정비",
        "운영 고도화 과제 수행"
      ],
      levelHints: [
        "반복 운영 이슈를 프로세스 개선 과제로 전환할 수 있다",
        "제도와 시스템 사이의 운영 흐름을 정리할 수 있다"
      ]
    },
    {
      id: "hris_process_pm",
      label: "HRIS 프로세스 기획 담당자",
      aliases: [
        "HRIS PM",
        "HR 시스템 기획",
        "인사시스템 기획",
        "HR Process PM"
      ],
      family: "hr_operation_process",
      responsibilityHints: [
        "인사 시스템 요구사항 정의",
        "운영 프로세스와 시스템 로직 정합성 검토",
        "프로세스 변경 반영",
        "테스트 시나리오 및 운영 기준 수립"
      ],
      levelHints: [
        "개발 자체보다 HR 운영 관점의 요구사항 정리가 중심이다",
        "시스템 도입·개선 시 실제 운영 영향을 설명할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "planning_focus",
      label: "기획 중심축",
      values: [
        "제도·보상 설계 중심",
        "인력·조직 구조 설계 중심",
        "데이터·지표·거버넌스 중심",
        "운영 프로세스 표준화 중심"
      ]
    },
    {
      axisId: "decision_object",
      label: "주로 다루는 의사결정 대상",
      values: [
        "직급·평가·보상 기준",
        "정원·조직 구조·배치",
        "인사 지표·데이터 기준",
        "운영 절차·승인 흐름·시스템 정합성"
      ]
    },
    {
      axisId: "output_form",
      label: "산출물 형태",
      values: [
        "제도안·규정·운영 원칙",
        "인력계획안·조직개편안",
        "지표 체계·대시보드·분석 리포트",
        "SOP·프로세스 맵·요구사항 정의서"
      ]
    }
  ],
  adjacentFamilies: [
    "채용기획",
    "조직문화",
    "HRBP",
    "노무",
    "총무·경영지원",
    "교육·인재개발"
  ],
  boundaryHints: [
    "평가, 보상, 직급, 승진 기준을 설계하는 책임이 커질수록 인사제도·보상 기획 쪽으로 읽힙니다.",
    "몇 명을 어떤 구조로 둘지 판단하고 정원과 조직 개편을 다루는 비중이 커질수록 인력·조직 기획 쪽으로 이동합니다.",
    "제도를 직접 설계하기보다 인사 지표 정의, 리포트 체계, 데이터 기준 수립 비중이 커질수록 인사데이터·거버넌스 기획으로 읽힙니다.",
    "새 제도 설계보다 운영 절차 안정화, 승인 흐름 정비, 시스템 요구사항 정리가 중심이면 인사운영·프로세스 기획 경계가 강해집니다.",
    "현업 조직장과의 인력 조정 협의가 중심이면 HRBP와 일부 겹칠 수 있지만, 특정 조직의 파트너 역할보다 전사 기준과 구조 설계 책임이 크면 인사기획으로 보는 편이 더 자연스럽습니다.",
    "문화 프로그램, 리더십, 몰입도 캠페인보다 제도·구조·운영 기준 설계 비중이 커야 인사기획으로 안정적으로 읽힙니다."
  ],
  summaryTemplate: "인사기획은 사람 관련 제도와 구조를 설계하고 운영 기준을 정리하는 성격이 강한 직무입니다. 같은 인사기획 안에서도 평가·보상 제도 설계에 가까운지, 인력·조직 구조 설계에 가까운지, 데이터 거버넌스에 가까운지, 운영 프로세스 기획에 가까운지에 따라 실제 역할 해석이 달라집니다. 반면 특정 조직의 현업 지원이나 문화 프로그램 운영 비중이 더 커지면 인접 직무 경계로 읽힐 수 있습니다."
};
