export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "SYSTEMS_ENGINEERING",
  aliases: [
    "시스템엔지니어",
    "시스템 엔지니어",
    "SE",
    "System Engineer",
    "Systems Engineer",
    "시스템설계",
    "시스템 아키텍트",
    "technical system engineer",
    "solution engineer",
    "platform system engineer",
    "integration engineer",
    "요구사항 엔지니어",
    "시스템 통합 엔지니어",
    "system design engineer",
    "system integration engineer"
  ],
  families: [
    {
      id: "se_requirements_architecture",
      label: "요구사항/시스템설계",
      aliases: [
        "시스템설계",
        "시스템 아키텍처",
        "요구사항 정의",
        "requirements engineering",
        "system architecture",
        "solution architecture",
        "상위설계",
        "기술요구사항"
      ],
      strongSignals: [
        "고객 요구사항, 시스템 요구사항, 기능 요구사항을 구조화하고 명세로 정리한다",
        "하위 모듈 간 인터페이스, 데이터 흐름, 시스템 구성도를 정의한다",
        "시스템 레벨 아키텍처와 설계 기준을 수립한다",
        "요구사항 추적성, 변경 영향도, 설계 baseline을 관리한다",
        "성능, 안정성, 확장성, 가용성 같은 시스템 수준 제약조건을 설계에 반영한다"
      ],
      mediumSignals: [
        "상위 요구사항을 하위 기능이나 서브시스템 요구사항으로 분해한다",
        "설계 리뷰, 기술 검토, 아키텍처 적합성 검토를 주관한다",
        "유관 개발팀과 설계 기준, 인터페이스 조건을 조율한다",
        "시스템 관점의 기술 문서, specification, ICD를 작성한다"
      ],
      boundarySignals: [
        "실제 배포 환경 구축, 서버 운영, 장애 대응 비중이 커지면 인프라/플랫폼 운영 경계로 이동한다",
        "테스트 케이스 설계, 검증 절차, 시험 수행 비중이 커지면 검증/테스트 엔지니어링 경계로 이동한다",
        "모듈 단위 구현과 코드 작성 비중이 커지면 소프트웨어 개발 경계로 이동한다"
      ],
      adjacentFamilies: [
        "se_integration_validation",
        "se_platform_operations",
        "software_architecture_interface"
      ],
      boundaryNote: "이 family는 시스템이 무엇을 만족해야 하고 어떻게 구성되어야 하는지를 정의하는 성격이 강합니다. 구현이나 운영보다 요구사항 구조화와 상위 설계 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 시스템이 충족해야 할 요구사항과 전체 구조를 정의하는 성격이 강합니다. 요구사항 명세, 아키텍처 설계, 인터페이스 정의가 핵심이라면 이 family에 가깝습니다. 반면 운영 구축이나 시험 수행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "se_integration_validation",
      label: "시스템통합/검증",
      aliases: [
        "시스템통합",
        "통합엔지니어",
        "검증엔지니어",
        "system integration",
        "integration engineering",
        "system validation",
        "system verification",
        "시스템 시험",
        "통합시험"
      ],
      strongSignals: [
        "서브시스템, 모듈, 장비를 연결해 시스템 단위 통합을 수행한다",
        "통합 시 발생하는 인터페이스 이슈와 연동 문제를 해결한다",
        "시스템 레벨 시험 항목, 검증 절차, test scenario를 수립하고 수행한다",
        "요구사항 충족 여부를 시험 결과와 연결해 검증한다",
        "현장 설치, 셋업, FAT/SAT, 통합 시운전 성격의 업무를 수행한다"
      ],
      mediumSignals: [
        "통합 일정과 결함 이슈를 관리한다",
        "시험 결과 보고서, defect list, 조치 이력 등을 관리한다",
        "개발팀, 품질팀, 현장팀과 함께 이슈 재현과 해결을 조율한다",
        "환경별 설정값, 인터페이스 조건, 버전 정합성을 점검한다"
      ],
      boundarySignals: [
        "요구사항 구조화와 상위설계 책임이 커지면 요구사항/시스템설계로 이동한다",
        "상시 운영환경 모니터링, 배포, 장애복구 비중이 커지면 플랫폼/운영 경계로 이동한다",
        "품질 기준 관리와 테스트 프로세스 자체 운영이 중심이면 QA/테스트 관리 경계로 이동한다"
      ],
      adjacentFamilies: [
        "se_requirements_architecture",
        "se_platform_operations",
        "qa_test_management_interface"
      ],
      boundaryNote: "이 family는 시스템 요소를 실제로 붙여서 동작하게 만들고, 요구사항 충족 여부를 검증하는 성격이 강합니다. 설계 자체보다 통합 과정의 이슈 해결과 시험 수행 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 여러 구성요소를 연결해 시스템을 실제로 동작시키고 검증하는 성격이 강합니다. 통합시험, 인터페이스 이슈 해결, 요구사항 검증이 핵심이라면 이 family에 가깝습니다. 반면 상위 설계나 상시 운영 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "se_platform_operations",
      label: "플랫폼구축/운영기술",
      aliases: [
        "시스템 운영",
        "플랫폼 엔지니어",
        "운영기술",
        "platform engineer",
        "system operations engineer",
        "infra system engineer",
        "서비스 운영 엔지니어",
        "구축 엔지니어"
      ],
      strongSignals: [
        "서버, 미들웨어, 네트워크, 시스템 환경을 구축하고 설정한다",
        "배포, 운영 이관, 장애 대응, 성능 점검을 수행한다",
        "운영 환경의 가용성, 안정성, 모니터링 체계를 관리한다",
        "로그 분석, 장애 원인 분석, 복구 절차 운영을 담당한다",
        "운영 표준, 구성관리, 배포 절차, 운영 매뉴얼을 관리한다"
      ],
      mediumSignals: [
        "테스트 환경과 운영 환경의 설정 정합성을 맞춘다",
        "시스템 자원 사용량, 성능 병목, 운영 리스크를 점검한다",
        "인프라팀, 개발팀, 보안팀과 운영 이슈를 조율한다",
        "패치, 버전업, 구성 변경을 관리한다"
      ],
      boundarySignals: [
        "상위 요구사항 정의, 시스템 구조 설계 비중이 커지면 요구사항/시스템설계로 이동한다",
        "현장 통합, 시험 수행, 검증 리포트 비중이 커지면 시스템통합/검증으로 이동한다",
        "클라우드 자동화, IaC, SRE 성격이 강해지면 인프라/플랫폼 엔지니어링 경계로 이동한다"
      ],
      adjacentFamilies: [
        "se_integration_validation",
        "se_requirements_architecture",
        "infrastructure_platform_interface"
      ],
      boundaryNote: "이 family는 시스템이 실제 환경에서 안정적으로 돌아가도록 구축하고 운영하는 성격이 강합니다. 설계나 검증보다 운영 환경과 장애 대응 책임이 크면 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 시스템이 실제 환경에서 안정적으로 동작하도록 구축하고 운영하는 성격이 강합니다. 환경 구축, 배포, 모니터링, 장애 대응이 핵심이라면 이 family에 가깝습니다. 반면 상위 설계나 통합시험 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "se_solution_prepost",
      label: "기술제안/고객기술지원",
      aliases: [
        "프리세일즈 엔지니어",
        "기술지원 엔지니어",
        "솔루션 엔지니어",
        "solution engineer",
        "pre-sales engineer",
        "technical support engineer",
        "고객기술지원",
        "제안 엔지니어"
      ],
      strongSignals: [
        "고객 요구를 기술적으로 해석해 제안 아키텍처나 구성안을 만든다",
        "PoC, 데모, 기술 제안서, 제안 설명을 수행한다",
        "도입 이후 고객 환경 이슈를 기술적으로 지원한다",
        "영업과 함께 고객 요구사항을 정리하고 기술 범위를 조율한다",
        "제품 기능과 시스템 구성을 고객 시나리오에 맞춰 설명하고 설계한다"
      ],
      mediumSignals: [
        "기술 미팅, 제안 발표, RFP 대응자료를 작성한다",
        "고객 문의, 장애, 변경 요청을 내부 개발·운영팀과 연결한다",
        "도입 전후의 기술 검토와 적합성 판단을 지원한다",
        "현장 기술 이슈를 수집해 제품팀이나 개발팀에 전달한다"
      ],
      boundarySignals: [
        "내부 시스템 요구사항과 아키텍처 설계 책임이 커지면 요구사항/시스템설계로 이동한다",
        "실제 통합시험, 셋업, 현장 검증 수행이 중심이면 시스템통합/검증으로 이동한다",
        "상시 고객지원과 티켓 처리 비중이 커지면 고객지원/기술지원 운영 경계로 이동한다"
      ],
      adjacentFamilies: [
        "se_requirements_architecture",
        "se_integration_validation",
        "customer_support_interface"
      ],
      boundaryNote: "이 family는 고객 요구와 내부 기술 구조를 연결하는 성격이 강합니다. 내부 설계 전담이라기보다 고객 접점에서 기술 해석과 제안 책임이 클 때 이 family로 읽힙니다.",
      summaryTemplate: "이 직무는 고객 요구를 기술적으로 해석하고 제안·도입을 지원하는 성격이 강합니다. 기술 제안, PoC, 고객 기술 이슈 조율이 핵심이라면 이 family에 가깝습니다. 반면 내부 설계 전담이나 통합시험 수행 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "systems_architect_engineer",
      label: "시스템설계 엔지니어",
      aliases: [
        "System Architect",
        "Systems Architect",
        "시스템 아키텍트",
        "요구사항 엔지니어",
        "시스템 설계 담당"
      ],
      family: "se_requirements_architecture",
      responsibilityHints: [
        "요구사항을 구조화하고 시스템 아키텍처를 설계한다",
        "서브시스템 인터페이스와 기술 기준을 정의한다",
        "설계 변경 영향과 요구사항 추적성을 관리한다"
      ],
      levelHints: [
        "주니어는 명세 정리와 인터페이스 문서화 비중이 높다",
        "미들 레벨은 설계 리뷰와 요구사항 분해를 주도한다",
        "시니어는 시스템 아키텍처와 기술 기준을 총괄한다"
      ]
    },
    {
      id: "system_integration_engineer",
      label: "시스템통합 엔지니어",
      aliases: [
        "System Integration Engineer",
        "통합 엔지니어",
        "검증 엔지니어",
        "시스템 시험 담당"
      ],
      family: "se_integration_validation",
      responsibilityHints: [
        "서브시스템을 통합하고 시스템 레벨 시험을 수행한다",
        "인터페이스 이슈와 연동 문제를 해결한다",
        "요구사항 충족 여부를 시험 결과로 검증한다"
      ],
      levelHints: [
        "주니어는 시험 수행과 결과 정리 비중이 높다",
        "미들 레벨은 통합 이슈 해결과 시험 시나리오를 주도한다",
        "시니어는 통합 전략과 검증 체계를 설계한다"
      ]
    },
    {
      id: "system_operations_engineer",
      label: "시스템운영 엔지니어",
      aliases: [
        "System Operations Engineer",
        "플랫폼 엔지니어",
        "구축 엔지니어",
        "운영기술 엔지니어"
      ],
      family: "se_platform_operations",
      responsibilityHints: [
        "운영 환경을 구축하고 배포 및 장애 대응을 수행한다",
        "시스템 가용성과 성능을 관리한다",
        "운영 절차와 구성변경을 관리한다"
      ],
      levelHints: [
        "주니어는 환경 설정과 운영 지원 비중이 높다",
        "미들 레벨은 장애 분석과 운영 안정화 책임을 진다",
        "시니어는 운영 구조와 표준 체계를 설계한다"
      ]
    },
    {
      id: "solution_system_engineer",
      label: "솔루션 엔지니어",
      aliases: [
        "Solution Engineer",
        "Pre-sales Engineer",
        "기술제안 엔지니어",
        "고객기술지원 엔지니어"
      ],
      family: "se_solution_prepost",
      responsibilityHints: [
        "고객 요구를 기술 구조와 연결해 제안안을 만든다",
        "PoC, 데모, 제안 설명을 수행한다",
        "도입 전후 기술 이슈를 내부팀과 조율한다"
      ],
      levelHints: [
        "주니어는 제안자료 작성과 기술 질의 대응 지원 비중이 높다",
        "미들 레벨은 고객 기술 미팅과 제안 설계를 주도한다",
        "시니어는 고객별 솔루션 구조와 기술 방향을 설계한다"
      ]
    }
  ],
  axes: [
    {
      axisId: "lifecycle_focus",
      label: "시스템 생애주기 초점",
      values: [
        "요구사항 정의와 상위 설계 중심",
        "통합과 시험·검증 중심",
        "구축·배포·운영 안정화 중심",
        "제안·도입·고객 기술지원 중심"
      ]
    },
    {
      axisId: "primary_problem_type",
      label: "주요 문제 유형",
      values: [
        "무엇을 만족해야 하는지와 어떻게 구성할지 정의하는 문제",
        "붙였을 때 왜 안 맞는지와 어떻게 검증할지 해결하는 문제",
        "실환경에서 왜 불안정한지와 어떻게 운영할지 해결하는 문제",
        "고객 요구를 어떤 기술 구성으로 설명하고 맞출지 해결하는 문제"
      ]
    },
    {
      axisId: "core_outputs",
      label: "주요 산출물",
      values: [
        "요구사항 명세, 아키텍처 문서, 인터페이스 정의서",
        "시험 시나리오, 통합 결과, 결함 리스트, 검증 보고서",
        "구성도, 운영절차서, 배포 이력, 장애 분석 보고서",
        "기술 제안서, PoC 결과, 고객 질의 대응자료, 구성 제안안"
      ]
    },
    {
      axisId: "stakeholder_center",
      label: "주요 협업 중심",
      values: [
        "개발팀, 아키텍트, 제품기획",
        "개발팀, QA, 현장/설치팀",
        "개발팀, 인프라팀, 운영팀, 보안팀",
        "영업, 고객, 제품팀, 구축/운영팀"
      ]
    }
  ],
  adjacentFamilies: [
    {
      id: "software_architecture_interface",
      label: "소프트웨어 아키텍처 인접 경계",
      whyAdjacent: [
        "시스템설계와 소프트웨어 구조 설계가 함께 보일 수 있다",
        "그러나 코드 구조, 프레임워크, 애플리케이션 설계가 중심이면 소프트웨어 아키텍처로 읽힌다"
      ]
    },
    {
      id: "infrastructure_platform_interface",
      label: "인프라/플랫폼 인접 경계",
      whyAdjacent: [
        "운영환경 구축과 시스템 운영이 겹치기 쉽다",
        "그러나 클라우드 자동화, 플랫폼 표준화, SRE 성격이 중심이면 인프라/플랫폼 엔지니어링으로 읽힌다"
      ]
    },
    {
      id: "qa_test_management_interface",
      label: "QA/테스트 인접 경계",
      whyAdjacent: [
        "검증과 시험 업무가 QA와 유사하게 보일 수 있다",
        "그러나 품질 프로세스와 테스트 체계 관리가 중심이면 QA/테스트 관리로 읽힌다"
      ]
    },
    {
      id: "customer_support_interface",
      label: "고객지원/기술지원 인접 경계",
      whyAdjacent: [
        "고객 기술 대응 업무가 시스템엔지니어와 섞여 보일 수 있다",
        "그러나 티켓 처리와 운영성 문의 대응이 중심이면 고객지원 성격이 더 강하다"
      ]
    }
  ],
  boundaryHints: [
    "요구사항 명세, 시스템 구성도, 인터페이스 정의, 상위설계 문서 비중이 커지면 요구사항/시스템설계로 읽힙니다.",
    "모듈 연동, 통합시험, FAT/SAT, 검증 결과 정리 비중이 커지면 시스템통합/검증으로 읽힙니다.",
    "운영환경 구축, 배포, 모니터링, 장애분석과 복구 비중이 커지면 플랫폼구축/운영기술로 읽힙니다.",
    "고객 요구 해석, 기술 제안, PoC, 영업 동행 기술지원 비중이 커지면 기술제안/고객기술지원으로 읽힙니다.",
    "직무명은 시스템엔지니어라도 코드 구현 책임이 커질수록 개발 직무 경계로, 운영 자동화와 플랫폼 표준화 책임이 커질수록 인프라/플랫폼 직무 경계로 이동합니다."
  ],
  summaryTemplate: "시스템엔지니어 직무는 여러 구성요소를 시스템 단위로 정의하고 연결하며 안정적으로 동작하게 만드는 성격이 강합니다. 다만 실제 역할은 요구사항과 구조를 설계하는지, 통합과 검증을 담당하는지, 운영 환경을 구축하고 안정화하는지, 혹은 고객 요구를 기술적으로 해석해 제안하는지에 따라 분명히 갈립니다. 특히 상위 설계 중심인지, 통합·운영 중심인지가 이 직무의 핵심 경계를 만듭니다."
};
