export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "TALENT_DEVELOPMENT",
  aliases: [
    "인재개발",
    "인재육성",
    "교육기획",
    "교육운영",
    "HRD",
    "Learning & Development",
    "L&D",
    "조직개발 교육",
    "사내교육",
    "교육훈련",
    "리더십개발",
    "역량개발",
    "인재육성 프로그램",
    "learning program",
    "talent development",
    "employee development"
  ],
  families: [
    {
      id: "td_learning_program_design",
      label: "교육/육성 프로그램 기획",
      aliases: [
        "교육기획",
        "HRD 기획",
        "교육프로그램 설계",
        "learning design",
        "program design",
        "curriculum design",
        "교육체계 수립",
        "육성체계 설계"
      ],
      strongSignals: [
        "교육체계, 직급별·직무별 curriculum, 육성 roadmap을 설계한다",
        "리더십 프로그램, 신입/경력 onboarding 프로그램을 기획한다",
        "핵심역량 모델을 기반으로 교육 프로그램 구조를 만든다",
        "교육과정 구조, 모듈, 트랙을 정의하고 설계 문서를 작성한다",
        "교육 목표와 성과지표를 정의하고 프로그램 설계안으로 구체화한다"
      ],
      mediumSignals: [
        "내부 교육 니즈 조사 결과를 바탕으로 프로그램 방향을 설정한다",
        "외부 교육 트렌드, 벤치마킹을 반영해 프로그램을 개선한다",
        "교육과정별 운영 가이드와 콘텐츠 구조를 정리한다",
        "교육 로드맵과 연간 계획을 수립한다"
      ],
      boundarySignals: [
        "강의 일정 운영, 출결 관리, 교육 진행 지원 비중이 커지면 교육운영으로 이동한다",
        "조직문화 변화, 리더 행동 변화 설계 비중이 커지면 조직개발(OD) 경계로 이동한다",
        "콘텐츠 제작 자체(영상, e-learning 제작)가 중심이면 콘텐츠 개발 쪽으로 이동한다"
      ],
      adjacentFamilies: [
        "td_learning_operations",
        "td_organizational_development",
        "td_learning_content_development"
      ],
      boundaryNote: "이 family는 교육 프로그램의 구조와 체계를 설계하는 성격이 강합니다. 실제 교육 운영이나 진행 지원이 중심이면 운영 쪽으로, 조직 변화와 행동 설계가 핵심이면 조직개발 쪽으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 교육 프로그램과 육성 체계를 설계하는 성격이 강합니다. 직급별·직무별 커리큘럼과 교육 로드맵을 기획한다면 이 family에 가깝습니다. 반면 교육 운영이나 조직 변화 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "td_learning_operations",
      label: "교육 운영",
      aliases: [
        "교육운영",
        "HRD 운영",
        "교육관리",
        "learning operations",
        "training operations",
        "교육진행",
        "교육관리자",
        "LMS 운영"
      ],
      strongSignals: [
        "교육 일정 관리, 강사 섭외, 교육 진행을 직접 운영한다",
        "출결 관리, 만족도 조사, 교육 결과 데이터 수집을 담당한다",
        "LMS 시스템 등록, 수강관리, 이수관리 업무를 수행한다",
        "교육 현장 운영, 장비 준비, 교육 진행 지원을 맡는다",
        "교육 문의 대응과 운영 이슈 해결을 담당한다"
      ],
      mediumSignals: [
        "교육 리포트 작성, 이수율·참여율 데이터 관리",
        "외부 교육업체, 강사, 교육 vendor 관리",
        "교육 예산 집행과 정산 업무",
        "운영 프로세스 개선과 매뉴얼 정리"
      ],
      boundarySignals: [
        "교육체계 설계, 프로그램 구조 기획 비중이 커지면 교육기획으로 이동한다",
        "조직문화 개선, 리더십 변화 설계 비중이 커지면 조직개발로 이동한다",
        "콘텐츠 제작(영상, 교안 개발)이 핵심이면 콘텐츠 개발로 이동한다"
      ],
      adjacentFamilies: [
        "td_learning_program_design",
        "td_learning_content_development",
        "td_organizational_development"
      ],
      boundaryNote: "이 family는 교육을 실제로 실행하고 안정적으로 운영하는 역할입니다. 프로그램을 설계하기보다는 일정, 강사, 수강, 시스템을 관리하는 비중이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 교육을 실제로 운영하고 실행하는 성격이 강합니다. 일정 관리, 강사 섭외, LMS 운영, 교육 진행이 핵심이라면 이 family에 가깝습니다. 반면 프로그램 설계나 조직 변화 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "td_learning_content_development",
      label: "교육 콘텐츠 개발",
      aliases: [
        "교육콘텐츠 개발",
        "e-learning 개발",
        "콘텐츠 제작",
        "instructional design",
        "learning content",
        "교육교안 개발",
        "온라인 교육 제작",
        "교육자료 개발"
      ],
      strongSignals: [
        "교육 교안, 콘텐츠, e-learning 과정을 직접 설계하고 제작한다",
        "영상, 콘텐츠 스토리보드, 학습 자료를 제작한다",
        "instructional design 기반으로 학습 경험을 설계한다",
        "교육 콘텐츠 품질 개선과 학습 효과를 고려한 설계를 한다",
        "콘텐츠 개발 툴이나 제작 프로세스를 직접 다룬다"
      ],
      mediumSignals: [
        "외부 콘텐츠 제작 업체와 협업해 콘텐츠를 만든다",
        "기존 교육자료를 개선하고 업데이트한다",
        "학습자 피드백을 반영해 콘텐츠를 개선한다",
        "콘텐츠 구조와 학습 흐름을 설계한다"
      ],
      boundarySignals: [
        "교육체계 전체 설계와 프로그램 구조 기획이 중심이면 교육기획으로 이동한다",
        "교육 진행과 운영 지원 비중이 커지면 교육운영으로 이동한다",
        "조직 변화와 행동 변화 설계가 중심이면 조직개발로 이동한다"
      ],
      adjacentFamilies: [
        "td_learning_program_design",
        "td_learning_operations",
        "td_organizational_development"
      ],
      boundaryNote: "이 family는 교육 콘텐츠 자체를 만드는 역할입니다. 프로그램 구조를 설계하는 것과는 구분되며, 실제 콘텐츠 제작과 학습 경험 설계 비중이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 교육 콘텐츠를 직접 설계하고 제작하는 성격이 강합니다. 교안, e-learning, 학습자료 제작이 핵심이라면 이 family에 가깝습니다. 반면 프로그램 구조 설계나 교육 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "td_organizational_development",
      label: "조직개발(OD)/리더십 개발",
      aliases: [
        "조직개발",
        "OD",
        "organizational development",
        "리더십 개발",
        "조직문화 교육",
        "변화관리 교육",
        "leadership development",
        "culture program"
      ],
      strongSignals: [
        "조직문화 변화, 리더 행동 변화, 조직 효과성을 높이기 위한 프로그램을 설계한다",
        "리더십 개발 프로그램, 변화관리 프로그램을 기획한다",
        "조직 진단 결과를 기반으로 개입 프로그램을 설계한다",
        "워크숍, 코칭, 액션러닝 등 개입 방식으로 조직 변화를 유도한다",
        "리더 및 조직 단위의 행동 변화를 목표로 프로그램을 운영한다"
      ],
      mediumSignals: [
        "조직문화 설문, 진단 결과를 해석하고 개선안을 만든다",
        "리더십 역량 모델과 교육 프로그램을 연결한다",
        "조직 단위 워크숍, 세션을 기획하고 진행한다",
        "변화관리 커뮤니케이션과 프로그램을 설계한다"
      ],
      boundarySignals: [
        "교육 커리큘럼 구조 설계와 체계 구축이 중심이면 교육기획으로 이동한다",
        "교육 일정 운영과 실행 지원 비중이 커지면 교육운영으로 이동한다",
        "콘텐츠 제작 자체가 중심이면 콘텐츠 개발로 이동한다"
      ],
      adjacentFamilies: [
        "td_learning_program_design",
        "td_learning_operations",
        "td_learning_content_development"
      ],
      boundaryNote: "이 family는 단순 교육이 아니라 조직과 리더의 행동 변화를 만드는 데 초점이 있습니다. 교육 프로그램 형태를 띠더라도 변화와 개입이 핵심이면 조직개발로 읽힙니다.",
      summaryTemplate: "이 직무는 조직과 리더의 행동 변화를 만드는 성격이 강합니다. 리더십 개발, 조직문화 개선, 변화관리 프로그램이 핵심이라면 이 family에 가깝습니다. 반면 일반 교육 프로그램 설계나 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "learning_program_manager",
      label: "교육기획 담당자",
      aliases: [
        "교육기획자",
        "HRD 기획자",
        "Learning Program Manager",
        "HRD Manager",
        "교육체계 담당"
      ],
      family: "td_learning_program_design",
      responsibilityHints: [
        "교육 프로그램 구조와 체계를 설계한다",
        "직급·직무별 커리큘럼과 교육 로드맵을 만든다",
        "교육 방향성과 목표를 정의하고 프로그램으로 구체화한다"
      ],
      levelHints: [
        "주니어는 프로그램 설계 보조와 자료 정리를 수행한다",
        "미들 레벨은 프로그램 설계와 이해관계자 조율을 주도한다",
        "시니어는 교육체계와 전략 방향을 정의한다"
      ]
    },
    {
      id: "training_operations_manager",
      label: "교육운영 담당자",
      aliases: [
        "교육운영자",
        "HRD 운영",
        "Training Manager",
        "Learning Operations Manager",
        "교육관리자"
      ],
      family: "td_learning_operations",
      responsibilityHints: [
        "교육 일정과 진행을 관리한다",
        "LMS 운영과 수강 데이터를 관리한다",
        "교육 운영 이슈를 해결하고 안정적인 실행을 유지한다"
      ],
      levelHints: [
        "주니어는 운영 보조와 데이터 관리 중심이다",
        "미들 레벨은 전체 교육 운영을 책임진다",
        "시니어는 운영 체계 개선과 프로세스 표준화를 주도한다"
      ]
    },
    {
      id: "instructional_designer",
      label: "교육콘텐츠 개발자",
      aliases: [
        "Instructional Designer",
        "콘텐츠 개발자",
        "e-learning 개발자",
        "교육자료 개발자",
        "learning designer"
      ],
      family: "td_learning_content_development",
      responsibilityHints: [
        "교육 콘텐츠와 교안을 설계하고 제작한다",
        "학습 경험과 콘텐츠 구조를 설계한다",
        "온라인·오프라인 학습자료를 개발한다"
      ],
      levelHints: [
        "주니어는 콘텐츠 제작과 수정 중심이다",
        "미들 레벨은 콘텐츠 구조와 학습 설계를 담당한다",
        "시니어는 콘텐츠 전략과 품질 기준을 정의한다"
      ]
    },
    {
      id: "od_lead",
      label: "조직개발/리더십 개발 담당자",
      aliases: [
        "OD 담당",
        "조직개발 담당",
        "Leadership Development Manager",
        "OD Manager",
        "조직문화 교육 담당"
      ],
      family: "td_organizational_development",
      responsibilityHints: [
        "조직과 리더의 행동 변화를 위한 프로그램을 설계한다",
        "조직 진단 기반으로 개입 프로그램을 기획한다",
        "워크숍, 코칭 등으로 조직 변화를 유도한다"
      ],
      levelHints: [
        "주니어는 프로그램 운영과 지원 중심이다",
        "미들 레벨은 프로그램 설계와 실행을 함께 담당한다",
        "시니어는 조직 변화 전략과 개입 방향을 리드한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: [
        "교육 프로그램 구조와 체계 설계 중심",
        "교육 실행과 운영 안정성 중심",
        "교육 콘텐츠 제작과 학습 경험 설계 중심",
        "조직과 리더 행동 변화 개입 중심"
      ]
    },
    {
      axisId: "output_type",
      label: "주요 산출물",
      values: [
        "교육체계, 커리큘럼, 프로그램 설계안",
        "교육 일정, 운영 결과, LMS 데이터",
        "교안, e-learning 콘텐츠, 학습자료",
        "워크숍 설계안, 변화 프로그램, 조직개입 계획"
      ]
    },
    {
      axisId: "intervention_level",
      label: "개입 수준",
      values: [
        "교육 구조와 설계 수준 개입",
        "운영과 실행 수준 개입",
        "콘텐츠와 학습 경험 수준 개입",
        "조직과 리더 행동 변화 수준 개입"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "performance_management_interface",
      label: "평가/성과관리 인접 경계",
      whyAdjacent: [
        "역량 모델과 평가 결과를 기반으로 교육을 설계하는 경우가 많다",
        "그러나 평가제도 설계와 운영이 중심이면 평가관리 쪽에 가깝다"
      ]
    },
    {
      id: "hrbp_interface",
      label: "HRBP 인접 경계",
      whyAdjacent: [
        "조직 이슈 해결과 리더 지원에서 HRBP와 역할이 겹친다",
        "그러나 조직 운영 전반 책임이 크면 HRBP로 읽힌다"
      ]
    },
    {
      id: "recruiting_interface",
      label: "채용/온보딩 인접 경계",
      whyAdjacent: [
        "신입 온보딩 프로그램에서 채용과 연결된다",
        "그러나 채용 프로세스 운영이 중심이면 채용 직무로 분리된다"
      ]
    }
  ],
  boundaryHints: [
    "교육체계 설계, 커리큘럼 구성, 프로그램 구조 정의 비중이 커지면 교육기획으로 읽힙니다.",
    "교육 일정 관리, LMS 운영, 교육 진행 지원 비중이 커지면 교육운영으로 읽힙니다.",
    "교안 제작, e-learning 개발, 콘텐츠 제작 비중이 커지면 콘텐츠 개발로 읽힙니다.",
    "조직문화 변화, 리더 행동 변화, 워크숍·코칭 개입 비중이 커지면 조직개발로 읽힙니다.",
    "교육을 하더라도 조직 문제 해결과 리더 지원이 중심이면 HRBP 성격으로 이동할 수 있습니다."
  ],
  summaryTemplate: "인재개발/육성 직무는 구성원의 역량을 높이기 위한 교육과 프로그램을 설계하고 운영하는 성격이 강합니다. 다만 프로그램을 설계하는지, 실제 운영을 담당하는지, 콘텐츠를 만드는지, 조직 변화 개입을 하는지에 따라 역할이 명확히 갈립니다. 특히 교육 구조 설계와 운영 실행, 조직 변화 개입 중 어디에 책임이 실리는지가 이 직무의 핵심 경계를 만듭니다."
};
