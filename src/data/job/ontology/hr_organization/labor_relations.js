export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "LABOR_RELATIONS",
  aliases: [
    "노무",
    "노무관리",
    "labor relations",
    "employee relations",
    "ER",
    "인사 노무",
    "노사관리",
    "노사 관계",
    "노무 담당",
    "노무사 업무",
    "근로기준법 대응",
    "노무 리스크 관리"
  ],
  families: [
    {
      id: "LABOR_COMPLIANCE",
      label: "노무 컴플라이언스형",
      aliases: [
        "labor compliance",
        "hr compliance",
        "legal labor"
      ],
      strongSignals: [
        "근로기준법 및 노동관계법 준수 관리",
        "취업규칙 및 사규 작성/개정",
        "노무 관련 법률 검토",
        "근로계약서 작성 및 검토",
        "노동청 대응 및 자료 제출",
        "법적 리스크 사전 점검",
        "내부 규정 준수 관리"
      ],
      mediumSignals: [
        "법률 자문 협업",
        "노무 이슈 문서화",
        "내부 교육 자료 제작",
        "컴플라이언스 체크리스트 운영",
        "노무 감사 대응"
      ],
      boundarySignals: [
        "노사 협상 및 갈등 대응 비중이 커지면 노사관계 대응형으로 이동",
        "급여/근태 운영 비중이 커지면 인사 운영 경계로 이동",
        "전사 정책 설계 비중이 커지면 HR 전략 경계로 이동"
      ],
      adjacentFamilies: [
        "LABOR_RELATIONS_MANAGEMENT",
        "LABOR_RISK_RESPONSE",
        "HR_POLICY_DESIGN"
      ],
      boundaryNote: "법과 규정을 기반으로 노무 리스크를 예방하고 관리하는 역할이 중심이면 노무 컴플라이언스형으로 읽힙니다. 반면 갈등 대응이나 협상 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 노동 관련 법과 규정을 기반으로 리스크를 예방하고 관리하는 성격이 강합니다. 반면 노사 갈등 대응이나 협상 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "LABOR_RELATIONS_MANAGEMENT",
      label: "노사관계 대응형",
      aliases: [
        "labor relations management",
        "union relations",
        "employee relations management"
      ],
      strongSignals: [
        "노조 및 근로자 대표 대응",
        "단체교섭 및 협상 참여",
        "노사 갈등 조정",
        "쟁의/분쟁 대응",
        "노사 커뮤니케이션 관리",
        "협약 체결 및 관리",
        "현장 이슈 대응"
      ],
      mediumSignals: [
        "노사 회의 운영",
        "협상 전략 수립 지원",
        "이슈 리포트 작성",
        "조직 커뮤니케이션 조율",
        "노사관계 데이터 관리"
      ],
      boundarySignals: [
        "법적 검토 중심이면 노무 컴플라이언스형으로 이동",
        "개별 분쟁 사건 처리 비중이 커지면 노무 리스크 대응형으로 이동",
        "정책 설계 비중이 커지면 HR 정책 설계형으로 이동"
      ],
      adjacentFamilies: [
        "LABOR_COMPLIANCE",
        "LABOR_RISK_RESPONSE",
        "HR_POLICY_DESIGN"
      ],
      boundaryNote: "노조 및 근로자와의 관계를 관리하고 협상/갈등을 조율하는 역할이 중심이면 노사관계 대응형으로 읽힙니다. 반면 법적 검토나 사건 대응 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 노사 간 관계를 관리하고 협상 및 갈등을 조율하는 성격이 강합니다. 반면 법적 검토나 사건 대응 중심으로 이동하면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "LABOR_RISK_RESPONSE",
      label: "노무 리스크 대응형",
      aliases: [
        "labor dispute handling",
        "employee dispute",
        "labor case management"
      ],
      strongSignals: [
        "부당해고/징계 등 분쟁 대응",
        "노동청 진정/소송 대응",
        "징계위원회 운영",
        "사내 분쟁 조사",
        "노무 사건 관리",
        "법적 대응 전략 수립",
        "외부 노무사/변호사 협업"
      ],
      mediumSignals: [
        "사건 기록 관리",
        "증거 자료 수집",
        "이슈 보고",
        "내부 인터뷰 진행",
        "리스크 분석"
      ],
      boundarySignals: [
        "예방적 규정 관리 비중이 커지면 노무 컴플라이언스형으로 이동",
        "노사 협상 중심이면 노사관계 대응형으로 이동",
        "조직 정책 설계 비중이 커지면 HR 정책 설계형으로 이동"
      ],
      adjacentFamilies: [
        "LABOR_COMPLIANCE",
        "LABOR_RELATIONS_MANAGEMENT",
        "HR_POLICY_DESIGN"
      ],
      boundaryNote: "개별 노무 분쟁과 사건을 직접 대응하는 비중이 크면 노무 리스크 대응형으로 읽힙니다. 반면 예방적 관리나 관계 조정 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 노무 분쟁과 리스크 사건을 직접 대응하는 성격이 강합니다. 반면 예방적 관리나 노사 관계 조정 비중이 커지면 다른 역할로 해석될 수 있습니다."
    },
    {
      id: "HR_POLICY_DESIGN",
      label: "노무 정책/제도 설계형",
      aliases: [
        "hr policy design",
        "labor policy",
        "hr governance"
      ],
      strongSignals: [
        "인사/노무 제도 설계",
        "취업규칙 및 인사 정책 기획",
        "근로시간/보상 체계 설계",
        "조직 운영 기준 정의",
        "노무 정책 개선 프로젝트",
        "전사 규정 체계 정비",
        "노무 기준 수립"
      ],
      mediumSignals: [
        "정책 문서 작성",
        "내부 이해관계자 협의",
        "정책 효과 분석",
        "운영 가이드 제작",
        "제도 개선 리포트"
      ],
      boundarySignals: [
        "법적 리스크 관리 중심이면 노무 컴플라이언스형으로 이동",
        "현장 노사 대응 비중이 커지면 노사관계 대응형으로 이동",
        "운영 실행 비중이 커지면 인사 운영 경계로 이동"
      ],
      adjacentFamilies: [
        "LABOR_COMPLIANCE",
        "LABOR_RELATIONS_MANAGEMENT",
        "LABOR_RISK_RESPONSE"
      ],
      boundaryNote: "전사 노무 정책과 제도를 설계하고 기준을 만드는 역할이 중심이면 노무 정책/제도 설계형으로 읽힙니다. 반면 실행이나 대응 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 조직의 노무 정책과 제도를 설계하는 성격이 강합니다. 반면 법적 대응이나 현장 이슈 해결 비중이 커지면 다른 역할로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "LABOR_SPECIALIST",
      label: "노무 담당자",
      aliases: [
        "labor specialist",
        "er specialist"
      ],
      family: "LABOR_COMPLIANCE",
      responsibilityHints: [
        "법규 준수 관리",
        "규정 검토",
        "계약서 관리",
        "노무 리스크 예방"
      ],
      levelHints: [
        "주니어는 규정 검토 및 운영 지원 중심이고",
        "시니어는 리스크 관리와 정책 자문 비중이 커집니다"
      ]
    },
    {
      id: "LABOR_RELATIONS_MANAGER",
      label: "노사관계 매니저",
      aliases: [
        "labor relations manager"
      ],
      family: "LABOR_RELATIONS_MANAGEMENT",
      responsibilityHints: [
        "노조 대응",
        "협상 참여",
        "갈등 조정",
        "노사 커뮤니케이션"
      ],
      levelHints: [
        "초기에는 지원 역할 중심이고",
        "상위 레벨에서는 협상 주도 비중이 커집니다"
      ]
    },
    {
      id: "LABOR_CASE_MANAGER",
      label: "노무 사건 담당자",
      aliases: [
        "labor case manager"
      ],
      family: "LABOR_RISK_RESPONSE",
      responsibilityHints: [
        "분쟁 대응",
        "징계 처리",
        "소송 대응",
        "사건 조사"
      ],
      levelHints: [
        "주니어는 사건 지원 중심이고",
        "시니어는 대응 전략 수립 비중이 커집니다"
      ]
    },
    {
      id: "HR_POLICY_MANAGER",
      label: "HR 정책 매니저",
      aliases: [
        "hr policy manager"
      ],
      family: "HR_POLICY_DESIGN",
      responsibilityHints: [
        "정책 설계",
        "제도 개선",
        "규정 정비",
        "조직 기준 정의"
      ],
      levelHints: [
        "초기에는 일부 제도 개선 중심이고",
        "상위 레벨에서는 전사 정책 설계 비중이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "LABOR_FOCUS",
      label: "노무 활동 중심",
      values: [
        "법규 준수",
        "노사 관계",
        "분쟁 대응",
        "정책 설계"
      ]
    },
    {
      axisId: "CORE_OUTPUT",
      label: "핵심 산출물",
      values: [
        "법적 리스크 최소화",
        "안정적인 노사 관계",
        "분쟁 해결 결과",
        "정책 및 제도"
      ]
    },
    {
      axisId: "INTERVENTION_TIMING",
      label: "개입 시점",
      values: [
        "사전 예방",
        "관계 관리",
        "사후 대응",
        "구조 설계"
      ]
    },
    {
      axisId: "SCOPE",
      label: "영향 범위",
      values: [
        "개별 사례",
        "조직 단위",
        "노사 집단",
        "전사 정책"
      ]
    }
  ],
  adjacentFamilies: [
    "인사운영",
    "HR전략",
    "법무",
    "조직문화"
  ],
  boundaryHints: [
    "법적 기준과 규정 준수 관리 비중이 커지면 노무 컴플라이언스형으로 읽힙니다.",
    "노조 대응과 협상 비중이 커지면 노사관계 대응형으로 이동합니다.",
    "개별 분쟁과 사건 대응 비중이 커지면 노무 리스크 대응형으로 이동합니다.",
    "정책 설계와 제도 기획 비중이 커지면 노무 정책/제도 설계형으로 이동합니다.",
    "급여/근태 운영 중심이면 인사 운영 직무로 해석될 수 있습니다."
  ],
  summaryTemplate: "이 직무는 노동 관련 법과 조직 내 노사 관계를 관리하는 성격이 강합니다. 법규 준수, 노사 관계, 분쟁 대응, 정책 설계 중 어디에 집중하느냐에 따라 역할이 나뉩니다. 반면 단순 인사 운영이나 전략 중심 역할이 커지면 인접 직무로 해석될 수 있습니다."
};
