export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "COMPENSATION_BENEFITS",
  aliases: [
    "평가보상",
    "보상",
    "C&B",
    "Compensation & Benefits",
    "Compensation and Benefits",
    "Rewards",
    "Total Rewards",
    "급여보상",
    "인사보상",
    "보상기획",
    "보상운영",
    "성과보상",
    "연봉보상",
    "급여복리후생",
    "payroll and benefits",
    "compensation planning",
    "reward management"
  ],
  families: [
    {
      id: "cb_strategy_design",
      label: "보상제도 기획/설계",
      aliases: [
        "보상기획",
        "보상정책",
        "보상제도 설계",
        "인센티브 설계",
        "급여체계 설계",
        "직급별 보상체계",
        "연봉체계 기획",
        "보상전략",
        "salary structure design",
        "compensation design",
        "reward strategy"
      ],
      strongSignals: [
        "연봉테이블, salary band, pay range, grade별 보상구조를 설계한다",
        "인센티브 제도, 성과급 기준, bonus scheme를 기획한다",
        "직무급, 직급급, 시장보상 기준 등 보상 철학과 원칙을 문서화한다",
        "보상정책 개편안, 임금체계 개편안, 승급·승진 연계 보상안을 만든다",
        "시장 보상 수준 벤치마킹 결과를 바탕으로 제도안을 제안한다"
      ],
      mediumSignals: [
        "연봉인상률 가이드, merit increase matrix, 예산 배분 기준을 검토한다",
        "보상 관련 규정, 운영 가이드, 의사결정 기준을 정리한다",
        "평가결과와 보상연계를 위한 기준표를 만든다",
        "직무가치, 직급체계, career level과 보상 연결 구조를 다룬다"
      ],
      boundarySignals: [
        "실제 급여 계산, 4대보험, 원천세, 지급오류 대응 비중이 커지면 payroll/benefits 운영 경계로 이동한다",
        "평가제도 문항, 등급운영, calibration meeting 운영 비중이 커지면 performance management 경계로 이동한다",
        "조직개편, 인력운영, headcount planning 중심이면 HRBP나 조직기획 경계로 이동한다"
      ],
      adjacentFamilies: [
        "cb_payroll_benefits_operations",
        "cb_compensation_review_analytics",
        "performance_management_interface"
      ],
      boundaryNote: "이 family는 보상 제도의 원칙과 구조를 만드는 성격이 강합니다. 반면 지급 정확도, 복리후생 운영, 정산 이슈 대응이 핵심이면 운영 경계로 읽히고, 평가등급 설계와 평가 프로세스 운영이 중심이면 평가제도 쪽으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 보상 제도의 원칙과 구조를 설계하는 성격이 강합니다. 연봉체계, 인센티브, salary band, 보상정책 개편처럼 제도 설계 책임이 크다면 이 family에 가깝습니다. 반면 실제 급여 정산이나 평가제도 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "cb_payroll_benefits_operations",
      label: "급여/복리후생 운영",
      aliases: [
        "급여운영",
        "급여관리",
        "페이롤",
        "payroll",
        "급여정산",
        "복리후생 운영",
        "benefits administration",
        "4대보험",
        "원천세",
        "퇴직금 정산",
        "급여실무",
        "보상운영"
      ],
      strongSignals: [
        "월 급여 계산, 지급, 정산, 급여 마감 업무를 수행한다",
        "4대보험, 원천세, 퇴직금, 연말정산 등 법정 정산 실무를 담당한다",
        "복리후생 제도 신청, 지급, 정산, vendor 운영을 관리한다",
        "급여오류, 지급누락, 근태 반영, 수당 반영 등 운영 이슈를 해결한다",
        "payroll system, HRIS, 급여 데이터 인터페이스를 운영한다"
      ],
      mediumSignals: [
        "근태, 휴가, 수당, 인사발령 정보를 급여에 반영한다",
        "복리후생 예산 집행, 사용 현황, 정산 프로세스를 관리한다",
        "외주 급여업체, 복지몰, 보험사 등 운영 파트너를 관리한다",
        "급여 및 복리후생 관련 문의 대응과 운영 가이드를 제공한다"
      ],
      boundarySignals: [
        "제도 구조 개편, pay band 설계, 인센티브 모델 설계 비중이 커지면 보상제도 기획/설계 경계로 이동한다",
        "연봉인상안 시뮬레이션, 보상 예산 배분, 인건비 분석 비중이 커지면 보상분석/연봉검토 경계로 이동한다",
        "노무 이슈, 취업규칙 해석, 법적 분쟁 대응이 중심이면 ER/노무 경계로 이동한다"
      ],
      adjacentFamilies: [
        "cb_strategy_design",
        "cb_compensation_review_analytics",
        "labor_relations_interface"
      ],
      boundaryNote: "이 family는 급여와 복리후생을 정확하게 운영하는 실무 성격이 강합니다. 제도 방향을 설계하기보다 지급과 정산의 정확성, 법정 처리, 운영 안정성이 핵심일 때 이 family로 읽힙니다. 반면 설계안 수립이나 인건비 분석 비중이 커지면 다른 family로 넘어갈 수 있습니다.",
      summaryTemplate: "이 직무는 급여와 복리후생을 정확하게 운영하는 성격이 강합니다. 월별 급여 마감, 4대보험·원천세 처리, 복리후생 정산과 운영 이슈 대응이 핵심이라면 이 family에 가깝습니다. 반면 제도 설계나 보상정책 개편 비중이 커지면 기획 경계로 읽힐 수 있습니다."
    },
    {
      id: "cb_compensation_review_analytics",
      label: "연봉검토/보상분석",
      aliases: [
        "연봉검토",
        "보상분석",
        "compensation review",
        "reward analytics",
        "인건비 분석",
        "보상데이터 분석",
        "연봉인상 검토",
        "merit review",
        "salary review",
        "compensation analyst"
      ],
      strongSignals: [
        "연봉인상 사이클, merit review, salary review 데이터를 설계·운영한다",
        "인건비 예산, 보상비용, 인상 재원, bonus pool을 분석한다",
        "시장연봉 벤치마킹, pay positioning, compa-ratio 등 보상 지표를 다룬다",
        "조직별·직급별·성과등급별 보상 분포를 분석하고 의사결정을 지원한다",
        "시뮬레이션, 예산안 비교, 인상안 영향 분석 자료를 만든다"
      ],
      mediumSignals: [
        "보상 관련 대시보드, 분석 리포트, 경영진 보고자료를 만든다",
        "연봉인상 가이드 적용 결과를 점검하고 예외 케이스를 검토한다",
        "평가결과와 보상결과 간 정합성, 분포, 편차를 확인한다",
        "market pricing, survey data, internal equity 검토를 수행한다"
      ],
      boundarySignals: [
        "정책 원칙과 제도 구조를 직접 설계하면 보상제도 기획/설계 경계로 이동한다",
        "지급정산, 세무·보험 처리, 복리후생 운영 비중이 커지면 payroll/benefits 운영 경계로 이동한다",
        "평가등급 산정 로직, 평가 프로세스 운영 주도 비중이 커지면 performance management 경계로 이동한다"
      ],
      adjacentFamilies: [
        "cb_strategy_design",
        "cb_payroll_benefits_operations",
        "performance_management_interface"
      ],
      boundaryNote: "이 family는 보상 의사결정을 데이터와 예산 관점에서 검토하는 성격이 강합니다. 제도를 새로 만드는 역할과는 구분되며, 지급 실무를 직접 안정적으로 처리하는 운영 역할과도 결이 다릅니다. 분석·시뮬레이션·검토 책임이 핵심일 때 가장 가깝습니다.",
      summaryTemplate: "이 직무는 연봉과 보상 의사결정을 데이터로 검토하는 성격이 강합니다. 인건비 예산, 연봉인상안, 보상 분포, 시장 벤치마킹 분석이 핵심이라면 이 family에 가깝습니다. 반면 제도 설계 주도나 급여정산 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "compensation_planning_manager",
      label: "보상기획 담당자",
      aliases: [
        "보상기획 담당",
        "보상정책 담당",
        "Compensation Manager",
        "Reward Manager",
        "C&B Manager",
        "보상제도 담당"
      ],
      family: "cb_strategy_design",
      responsibilityHints: [
        "연봉체계와 인센티브 제도를 설계하거나 개편한다",
        "보상정책과 운영 원칙을 문서화하고 조직에 적용한다",
        "시장 보상 수준과 내부 형평성을 반영해 제도안을 만든다"
      ],
      levelHints: [
        "주니어는 데이터 정리와 제도안 보조를 많이 수행한다",
        "미들 레벨은 제도 설계안 작성과 유관부서 조율을 주도한다",
        "시니어는 보상 철학, pay structure, 전사 기준 의사결정을 리드한다"
      ]
    },
    {
      id: "payroll_benefits_manager",
      label: "급여복리후생 담당자",
      aliases: [
        "급여 담당",
        "페이롤 담당",
        "Payroll Manager",
        "Benefits Manager",
        "급여복리후생 담당",
        "보상운영 담당"
      ],
      family: "cb_payroll_benefits_operations",
      responsibilityHints: [
        "월 급여 정산과 지급 정확성을 관리한다",
        "4대보험, 세무, 퇴직금, 복리후생 운영을 처리한다",
        "지급 오류와 운영 문의를 해결하고 시스템 데이터를 점검한다"
      ],
      levelHints: [
        "주니어는 마감 보조, 데이터 입력, 기초 정산 업무 비중이 높다",
        "미들 레벨은 급여 전체 마감과 외부 파트너 관리까지 맡는다",
        "시니어는 운영 체계 개선, 리스크 관리, 운영 표준화를 주도한다"
      ]
    },
    {
      id: "compensation_analyst",
      label: "보상분석 담당자",
      aliases: [
        "Compensation Analyst",
        "Reward Analyst",
        "보상분석가",
        "연봉검토 담당",
        "인건비 분석 담당",
        "C&B Analyst"
      ],
      family: "cb_compensation_review_analytics",
      responsibilityHints: [
        "연봉인상안, 보상분포, 예산 사용 현황을 분석한다",
        "시장 벤치마킹과 내부 pay equity 관점에서 데이터를 검토한다",
        "의사결정에 필요한 시뮬레이션과 리포트를 만든다"
      ],
      levelHints: [
        "주니어는 지표 산출과 데이터 정합성 점검 비중이 높다",
        "미들 레벨은 분석 프레임과 시뮬레이션 구조를 설계한다",
        "시니어는 보상 의사결정 지원과 경영진 보고 관점을 함께 다룬다"
      ]
    },
    {
      id: "total_rewards_manager",
      label: "Total Rewards 담당자",
      aliases: [
        "Total Rewards Manager",
        "Total Rewards Lead",
        "리워드 담당",
        "총보상 담당",
        "통합보상 담당"
      ],
      family: "cb_strategy_design",
      responsibilityHints: [
        "보상과 복리후생을 통합된 총보상 관점에서 설계한다",
        "시장경쟁력, 내부형평성, employee value proposition을 함께 본다",
        "제도 원칙과 운영 기준을 전사 관점에서 정리한다"
      ],
      levelHints: [
        "보통 미들 이상에서 나타나는 역할명이다",
        "시니어일수록 보상정책, benefits 방향, 예산 논리를 함께 다룬다",
        "운영보다 구조 설계와 의사결정 프레임 책임이 큰 편이다"
      ]
    },
    {
      id: "salary_review_specialist",
      label: "연봉검토 운영 담당자",
      aliases: [
        "연봉검토 담당",
        "salary review specialist",
        "merit review specialist",
        "연봉조정 담당",
        "보상검토 담당"
      ],
      family: "cb_compensation_review_analytics",
      responsibilityHints: [
        "연봉 인상 사이클을 운영하고 검토 데이터를 관리한다",
        "예산 범위 내 인상안 검토와 예외 케이스 조정을 지원한다",
        "성과 결과와 보상 결과의 연결 상태를 점검한다"
      ],
      levelHints: [
        "주니어는 검토 운영과 자료 취합 비중이 높다",
        "미들 레벨은 가이드 적용과 예외 판단을 주도한다",
        "시니어는 리뷰 체계와 보상 의사결정 기준 개선까지 맡는다"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: [
        "제도 구조와 원칙 설계 중심",
        "급여·복리후생 지급과 정산 운영 중심",
        "연봉·인건비·시장보상 분석 및 검토 중심"
      ]
    },
    {
      axisId: "decision_horizon",
      label: "의사결정 시계",
      values: [
        "중장기 제도 개편과 기준 수립",
        "월별·주기별 운영 안정성 확보",
        "사이클성 검토와 예산·분포 의사결정 지원"
      ]
    },
    {
      axisId: "core_artifacts",
      label: "주요 산출물",
      values: [
        "보상정책, pay band, 인센티브 설계안",
        "급여마감 결과, 정산자료, 운영 가이드",
        "연봉검토 리포트, 시뮬레이션, 보상분석 대시보드"
      ]
    },
    {
      axisId: "primary_counterpart",
      label: "주요 협업 상대",
      values: [
        "HR 리더, 경영진, 조직책임자",
        "재무, 노무, 외주 급여업체, 복지 vendor",
        "경영진, 재무, HRBP, 평가운영 담당"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "performance_management_interface",
      label: "평가제도/성과관리 인접 경계",
      whyAdjacent: [
        "평가결과를 보상에 연결하기 때문에 평가제도와 자주 혼재된다",
        "그러나 평가문항, 등급운영, calibration 자체가 핵심이면 평가제도 쪽에 더 가깝다"
      ]
    },
    {
      id: "labor_relations_interface",
      label: "노무/ER 인접 경계",
      whyAdjacent: [
        "임금, 수당, 취업규칙, 법적 이슈 때문에 노무와 접점이 크다",
        "그러나 분쟁 대응, 법률 해석, 노사관계 관리가 중심이면 노무 경계로 읽힌다"
      ]
    },
    {
      id: "hrbp_interface",
      label: "HRBP 인접 경계",
      whyAdjacent: [
        "조직별 인건비와 보상 의사결정에서 HRBP와 협업이 잦다",
        "그러나 조직 운영 전반, 리더 자문, 인력계획이 중심이면 HRBP 경계가 더 강하다"
      ]
    }
  ],
  boundaryHints: [
    "연봉체계 개편안, 인센티브 구조, pay band 설계 같은 산출물이 많아지면 보상제도 기획/설계로 읽힙니다.",
    "월 급여 마감, 세무·보험 정산, 지급오류 수정, 복리후생 신청·정산 비중이 커지면 급여/복리후생 운영으로 읽힙니다.",
    "연봉인상 시뮬레이션, 보상분포 분석, 예산 검토, 시장연봉 벤치마킹 비중이 커지면 연봉검토/보상분석으로 읽힙니다.",
    "평가등급 설계, 평가 프로세스 운영, calibration 주관 책임이 커지면 평가보상 안에서도 평가제도 쪽 경계가 강해집니다.",
    "보상 관련 업무를 하더라도 조직장 자문, 인력운영, 조직 이슈 해결 비중이 더 크면 C&B보다 HRBP 성격으로 이동합니다."
  ],
  summaryTemplate: "평가보상(C&B) 직무는 평가 결과와 보상 체계를 연결해 제도, 운영, 분석을 다루는 성격이 강합니다. 다만 실제 역할은 보상제도를 설계하는지, 급여·복리후생을 안정적으로 운영하는지, 혹은 연봉과 인건비를 분석·검토하는지에 따라 결이 분명히 갈립니다. 특히 평가 운영 자체보다 보상 구조와 지급, 예산 검토 책임이 어디에 실리는지가 이 직무의 핵심 경계를 가릅니다."
};
