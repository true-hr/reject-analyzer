export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "LEARNING_OD",
  aliases: [
    "교육",
    "인재개발",
    "HRD",
    "Learning & Development",
    "L&D",
    "조직개발",
    "OD",
    "Organization Development",
    "조직문화 개발",
    "리더십 개발",
    "사내 교육",
    "교육기획",
    "역량개발",
    "인재육성",
    "People Development"
  ],
  families: [
    {
      id: "learning_program_design",
      label: "교육 프로그램 기획",
      aliases: [
        "교육기획",
        "HRD 기획",
        "교육 프로그램 설계",
        "사내 교육 기획",
        "Learning Program Design"
      ],
      strongSignals: [
        "교육 과정 기획 및 커리큘럼 설계",
        "직무별 또는 직급별 교육 프로그램 설계",
        "교육 니즈 분석 후 과정 설계",
        "내부 강사 또는 외부 교육과정 선정",
        "교육 로드맵 및 연간 교육 계획 수립",
        "교육 콘텐츠 구조 설계"
      ],
      mediumSignals: [
        "교육 운영 일정 관리",
        "교육 만족도 조사 및 개선안 도출",
        "교육 자료 제작 또는 정리",
        "외부 교육 벤더 커뮤니케이션",
        "교육 참여자 관리"
      ],
      boundarySignals: [
        "문화 캠페인보다 교육 커리큘럼 설계 비중이 크면 이 family에 가깝다",
        "조직 진단보다 교육 과정 설계와 실행 비중이 크면 이 family에 가깝다",
        "단순 운영보다 교육 구조 설계 책임이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "leadership_talent_development",
        "culture_engagement_od",
        "learning_operations"
      ],
      boundaryNote: "교육 과정 자체를 설계하고 어떤 교육을 제공할지 결정하는 책임이 커질수록 교육 프로그램 기획으로 읽힙니다. 반면 특정 리더나 핵심 인재 육성에 집중되면 리더십·인재개발로, 단순 운영과 일정 관리 비중이 커지면 교육운영 쪽으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 교육 프로그램과 커리큘럼을 설계하는 성격이 강합니다. 어떤 교육을 누구에게 어떻게 제공할지 구조화하는 역할이 핵심입니다. 반면 운영이나 특정 인재 육성 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "leadership_talent_development",
      label: "리더십·핵심인재 개발",
      aliases: [
        "리더십 개발",
        "핵심인재 육성",
        "Talent Development",
        "Leadership Development",
        "승계 계획",
        "Succession Planning",
        "하이포텐셜 개발"
      ],
      strongSignals: [
        "리더십 교육 프로그램 설계 및 운영",
        "핵심인재 선발 기준 및 육성 프로그램 설계",
        "승계 계획(Succession Planning) 수립",
        "코칭, 멘토링 프로그램 기획",
        "리더 평가 및 피드백 프로그램 설계",
        "경력개발(CDP) 체계 설계"
      ],
      mediumSignals: [
        "리더 대상 워크숍 운영",
        "인재 풀 관리",
        "교육 효과 측정 및 개선",
        "리더십 진단 도구 활용",
        "경영진 보고용 인재 리포트 작성"
      ],
      boundarySignals: [
        "전사 공통 교육보다 특정 리더·핵심인재 대상 프로그램 비중이 크면 이 family에 가깝다",
        "문화 캠페인보다 개인 역량 개발 설계 비중이 크면 이 family에 가깝다",
        "단순 교육 운영보다 육성 체계 설계 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "learning_program_design",
        "culture_engagement_od",
        "people_analytics_governance"
      ],
      boundaryNote: "전체 직원 대상 교육보다 특정 리더나 핵심 인재를 선별해 육성하는 책임이 커질수록 리더십·핵심인재 개발로 읽힙니다. 반면 개인 단위 육성보다 조직 전체 문화 변화나 교육 체계 설계 비중이 커지면 다른 family로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 리더와 핵심 인재를 선별하고 체계적으로 육성하는 성격이 강합니다. 개인 단위 성장 경로와 리더십 역량 개발이 중심입니다. 반면 전사 교육이나 문화 개선 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "culture_engagement_od",
      label: "조직문화·OD",
      aliases: [
        "조직개발",
        "OD",
        "조직문화",
        "조직문화 개선",
        "Culture & Engagement",
        "Employee Engagement",
        "조직문화 프로그램",
        "Change Management"
      ],
      strongSignals: [
        "조직문화 진단 및 개선 프로그램 설계",
        "임직원 참여 캠페인 기획",
        "조직 변화관리(Change Management) 프로젝트 수행",
        "핵심 가치 내재화 프로그램 설계",
        "조직 진단 서베이 설계 및 결과 해석",
        "워크숍 기반 조직 이슈 해결 프로그램 운영"
      ],
      mediumSignals: [
        "사내 이벤트 및 캠페인 운영",
        "임직원 피드백 수집 및 분석",
        "문화 관련 콘텐츠 제작",
        "조직장 인터뷰 및 이슈 파악",
        "조직 활성화 프로그램 기획"
      ],
      boundarySignals: [
        "교육 커리큘럼보다 조직 진단과 문화 변화 프로그램 비중이 크면 이 family에 가깝다",
        "개인 역량 개발보다 조직 단위 변화 개입 비중이 크면 이 family에 가깝다",
        "정형 교육보다 워크숍·캠페인 형태가 많으면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "learning_program_design",
        "leadership_talent_development",
        "hrbp"
      ],
      boundaryNote: "개인 교육보다 조직 전체의 분위기, 문화, 협업 방식 등을 변화시키는 개입 비중이 커질수록 조직문화·OD로 읽힙니다. 반면 문화보다 특정 역량 교육이나 리더 육성 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 조직문화와 구성원 경험을 개선하고 조직 변화를 설계하는 성격이 강합니다. 교육보다는 조직 단위 개입과 변화 유도가 핵심입니다. 반면 개인 역량 개발 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "learning_operations",
      label: "교육운영·플랫폼 관리",
      aliases: [
        "교육운영",
        "HRD 운영",
        "교육 플랫폼 관리",
        "LMS 운영",
        "Learning Operations",
        "교육 행정"
      ],
      strongSignals: [
        "교육 일정 운영 및 참가자 관리",
        "LMS(학습관리시스템) 운영",
        "교육 신청, 출결, 이수 관리",
        "교육 운영 프로세스 정비",
        "교육 실행 지원 및 현장 운영",
        "교육 데이터 관리"
      ],
      mediumSignals: [
        "교육 만족도 조사 실행",
        "교육 자료 배포 및 관리",
        "강사 일정 조율",
        "교육 관련 문의 대응",
        "교육 결과 리포트 작성"
      ],
      boundarySignals: [
        "교육 설계보다 운영·관리 비중이 크면 이 family에 가깝다",
        "조직문화 프로그램보다 교육 실행 지원 비중이 크면 이 family에 가깝다",
        "데이터 분석보다 운영 안정성 확보 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "learning_program_design",
        "people_analytics_governance",
        "hr_operation_process"
      ],
      boundaryNote: "교육 내용을 설계하기보다 교육이 문제없이 실행되도록 운영하고 관리하는 책임이 커질수록 교육운영·플랫폼 관리로 읽힙니다. 반면 운영보다 프로그램 설계나 조직 변화 개입 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 교육 프로그램이 안정적으로 실행되도록 운영과 관리를 담당하는 성격이 강합니다. 시스템과 프로세스를 통해 교육 경험을 유지하는 역할입니다. 반면 설계나 조직 변화 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "hrd_planner",
      label: "교육기획 담당자",
      aliases: [
        "HRD 기획자",
        "교육 담당",
        "L&D Planner",
        "교육 프로그램 기획자"
      ],
      family: "learning_program_design",
      responsibilityHints: [
        "교육 커리큘럼 설계",
        "교육 니즈 분석",
        "교육 과정 개발",
        "연간 교육 계획 수립"
      ],
      levelHints: [
        "단순 운영이 아니라 교육 구조를 설계할 수 있다",
        "직무별 필요한 교육을 정의할 수 있다"
      ]
    },
    {
      id: "leadership_dev_manager",
      label: "리더십개발 담당자",
      aliases: [
        "Leadership Development Manager",
        "리더십 교육 담당",
        "핵심인재 육성 담당",
        "Talent Development Manager"
      ],
      family: "leadership_talent_development",
      responsibilityHints: [
        "리더십 프로그램 설계",
        "핵심인재 선발 및 관리",
        "코칭 및 멘토링 프로그램 운영",
        "승계 계획 수립"
      ],
      levelHints: [
        "개인 단위 육성 전략을 설계할 수 있다",
        "리더 역량 정의와 평가 기준을 설명할 수 있다"
      ]
    },
    {
      id: "od_specialist",
      label: "조직개발 담당자",
      aliases: [
        "OD Specialist",
        "조직문화 담당",
        "Culture Manager",
        "Engagement Manager"
      ],
      family: "culture_engagement_od",
      responsibilityHints: [
        "조직문화 진단 및 개선안 도출",
        "조직 변화 프로그램 기획",
        "임직원 참여 캠페인 운영",
        "워크숍 설계 및 실행"
      ],
      levelHints: [
        "조직 단위 이슈를 프로그램으로 해결할 수 있다",
        "문화와 성과의 연결을 설명할 수 있다"
      ]
    },
    {
      id: "learning_operations_manager",
      label: "교육운영 담당자",
      aliases: [
        "HRD 운영 담당",
        "교육 운영 매니저",
        "LMS 관리자",
        "교육 행정 담당"
      ],
      family: "learning_operations",
      responsibilityHints: [
        "교육 일정 및 참가자 관리",
        "LMS 운영",
        "교육 실행 지원",
        "교육 데이터 관리"
      ],
      levelHints: [
        "운영 이슈를 안정적으로 관리할 수 있다",
        "교육 프로세스를 표준화할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "intervention_level",
      label: "개입 수준",
      values: [
        "개인 역량 개발 중심",
        "리더·핵심인재 집중",
        "조직 단위 변화 개입",
        "운영 및 실행 지원"
      ]
    },
    {
      axisId: "design_vs_execution",
      label: "설계 vs 실행",
      values: [
        "프로그램 설계 중심",
        "육성 체계 설계 중심",
        "문화 개입 설계 중심",
        "운영 및 실행 중심"
      ]
    },
    {
      axisId: "primary_output",
      label: "주요 산출물",
      values: [
        "교육 커리큘럼 및 과정",
        "인재 육성 체계 및 프로그램",
        "문화 진단 및 변화 프로그램",
        "운영 프로세스 및 시스템 관리"
      ]
    }
  ],
  adjacentFamilies: [
    "인사기획",
    "HRBP",
    "채용",
    "조직문화",
    "경영지원"
  ],
  boundaryHints: [
    "교육 과정 설계보다 리더나 핵심 인재 육성 비중이 커지면 리더십·인재개발로 이동합니다.",
    "교육보다 조직문화 개선이나 변화 프로그램 비중이 커지면 조직문화·OD로 읽힙니다.",
    "설계보다 운영과 실행 관리 비중이 커지면 교육운영으로 이동합니다.",
    "특정 조직 지원과 현업 밀착도가 높아지면 HRBP와 경계가 흐려질 수 있습니다.",
    "문화 이벤트 중심이면 조직문화 쪽으로, 구조화된 교육 설계 중심이면 교육기획 쪽으로 해석됩니다."
  ],
  summaryTemplate: "교육/조직개발 직무는 구성원의 역량과 조직의 변화를 설계하는 성격이 강합니다. 교육 프로그램 설계, 리더십 육성, 조직문화 변화, 운영 관리 중 어디에 중심이 있는지에 따라 실제 역할이 달라집니다. 반면 운영이나 특정 조직 지원 비중이 커지면 인접 직무로 읽힐 수 있습니다."
};
