export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "SECURITY",
  aliases: [
    "보안 엔지니어",
    "정보보안",
    "보안 담당자",
    "Security Engineer",
    "Information Security",
    "Cyber Security",
    "Security Specialist",
    "보안 전문가"
  ],
  families: [
    {
      id: "SECURITY_ENGINEERING",
      label: "보안 엔지니어링",
      aliases: [
        "보안 개발",
        "애플리케이션 보안",
        "AppSec",
        "Security Engineering",
        "제품 보안"
      ],
      strongSignals: [
        "코드 레벨 취약점 분석 및 수정",
        "SAST, DAST 도구 사용 경험",
        "보안 라이브러리 및 인증/암호화 구현",
        "Secure Coding 가이드 적용",
        "애플리케이션 보안 테스트 수행"
      ],
      mediumSignals: [
        "보안 코드 리뷰 참여",
        "OWASP Top 10 대응 경험",
        "CI/CD 파이프라인 내 보안 검사 적용",
        "API 보안 설계 경험"
      ],
      boundarySignals: [
        "운영 환경 모니터링/대응 비중이 커지면 보안 운영으로 이동",
        "침투 테스트 중심이면 레드팀으로 이동",
        "정책/컴플라이언스 중심이면 GRC로 이동"
      ],
      adjacentFamilies: ["SECURITY_OPERATIONS", "OFFENSIVE_SECURITY"],
      boundaryNote: "코드와 시스템 설계 단계에서 보안을 구현하는 역할입니다. 운영 대응 비중이 커지면 보안 운영으로, 공격 시뮬레이션 중심이면 레드팀으로 해석됩니다.",
      summaryTemplate: "이 직무는 시스템과 애플리케이션에 보안을 내재화하는 엔지니어링 성격이 강합니다. 반면 운영 대응이나 공격 시뮬레이션 비중이 커지면 다른 보안 영역으로 읽힐 수 있습니다."
    },
    {
      id: "SECURITY_OPERATIONS",
      label: "보안 운영",
      aliases: [
        "SOC",
        "보안 관제",
        "Security Operations",
        "보안 운영 엔지니어",
        "침해 대응"
      ],
      strongSignals: [
        "보안 이벤트 모니터링 및 대응",
        "SIEM 사용 경험",
        "침해사고 분석 및 대응",
        "로그 기반 이상 탐지",
        "24/7 관제 또는 대응 체계 경험"
      ],
      mediumSignals: [
        "EDR, IDS/IPS 운영 경험",
        "보안 경보 튜닝",
        "사고 대응 프로세스 운영",
        "위협 인텔리전스 활용"
      ],
      boundarySignals: [
        "코드/개발 단계 보안 비중 증가 시 보안 엔지니어링으로 이동",
        "공격 시나리오 실행 및 테스트 중심이면 레드팀으로 이동",
        "정책/감사 대응 비중 증가 시 GRC로 이동"
      ],
      adjacentFamilies: ["SECURITY_ENGINEERING", "GRC_SECURITY"],
      boundaryNote: "실시간 모니터링과 대응이 핵심입니다. 시스템 설계나 코드 보안으로 이동하면 엔지니어링, 정책 중심이면 GRC로 해석됩니다.",
      summaryTemplate: "이 직무는 보안 이벤트를 탐지하고 대응하는 운영 성격이 강합니다. 반면 설계나 정책 중심으로 이동하면 다른 보안 영역으로 해석될 수 있습니다."
    },
    {
      id: "OFFENSIVE_SECURITY",
      label: "공격/진단 보안",
      aliases: [
        "모의해킹",
        "침투 테스트",
        "Pentest",
        "레드팀",
        "취약점 진단"
      ],
      strongSignals: [
        "침투 테스트 수행 경험",
        "취약점 스캐닝 및 익스플로잇",
        "모의해킹 보고서 작성",
        "공격 시나리오 설계 및 실행",
        "버그바운티 참여 경험"
      ],
      mediumSignals: [
        "웹/모바일 취약점 분석",
        "네트워크 공격 시나리오 수행",
        "보안 도구(Nmap, Burp Suite 등) 활용",
        "사회공학 테스트 경험"
      ],
      boundarySignals: [
        "탐지/대응 중심이면 보안 운영으로 이동",
        "보안 코드 구현 비중 증가 시 보안 엔지니어링으로 이동",
        "정책/감사 대응 중심이면 GRC로 이동"
      ],
      adjacentFamilies: ["SECURITY_OPERATIONS", "SECURITY_ENGINEERING"],
      boundaryNote: "공격자의 관점에서 취약점을 찾는 것이 핵심입니다. 방어 및 대응 중심이면 보안 운영으로, 구현 중심이면 엔지니어링으로 이동합니다.",
      summaryTemplate: "이 직무는 공격자 관점에서 시스템의 취약점을 찾아내는 성격이 강합니다. 반면 방어 운영이나 구현 비중이 커지면 다른 보안 영역으로 해석될 수 있습니다."
    },
    {
      id: "GRC_SECURITY",
      label: "보안 정책/컴플라이언스",
      aliases: [
        "정보보호 정책",
        "보안 거버넌스",
        "GRC",
        "컴플라이언스 보안",
        "ISMS 담당"
      ],
      strongSignals: [
        "보안 정책 수립 및 관리",
        "ISMS, ISO27001 대응 경험",
        "보안 감사 및 인증 대응",
        "리스크 평가 및 관리",
        "내부 보안 규정 운영"
      ],
      mediumSignals: [
        "보안 교육 및 인식 제고 활동",
        "외부 감사 대응",
        "보안 문서 및 프로세스 관리",
        "데이터 보호 정책 수립"
      ],
      boundarySignals: [
        "기술 구현 비중 증가 시 보안 엔지니어링으로 이동",
        "실시간 대응/관제 비중 증가 시 보안 운영으로 이동",
        "취약점 공격/테스트 중심이면 공격 보안으로 이동"
      ],
      adjacentFamilies: ["SECURITY_OPERATIONS", "SECURITY_ENGINEERING"],
      boundaryNote: "정책과 관리 중심 역할입니다. 기술 구현이나 운영 대응이 중심이 되면 다른 보안 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 조직의 보안 정책과 규정을 설계하고 관리하는 성격이 강합니다. 반면 기술 구현이나 운영 대응 비중이 커지면 다른 보안 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "APPSEC_ENGINEER",
      label: "애플리케이션 보안 엔지니어",
      aliases: ["AppSec Engineer", "제품 보안 엔지니어"],
      family: "SECURITY_ENGINEERING",
      responsibilityHints: [
        "코드 취약점 분석 및 수정",
        "보안 테스트 자동화",
        "개발 단계 보안 가이드 적용"
      ],
      levelHints: [
        "주니어: 취약점 분석 및 수정 지원",
        "미드: 보안 설계 및 리뷰 수행",
        "시니어: 보안 아키텍처 및 정책 수립"
      ]
    },
    {
      id: "SOC_ANALYST",
      label: "보안 관제 분석가",
      aliases: ["SOC Analyst", "보안 운영 분석가"],
      family: "SECURITY_OPERATIONS",
      responsibilityHints: [
        "보안 이벤트 모니터링",
        "이상 징후 분석 및 대응",
        "사고 대응 프로세스 수행"
      ],
      levelHints: [
        "주니어: 이벤트 분석 및 대응",
        "미드: 위협 분석 및 대응 전략 수립",
        "시니어: 대응 체계 설계 및 개선"
      ]
    },
    {
      id: "PENTESTER",
      label: "침투 테스트 엔지니어",
      aliases: ["Pentester", "모의해킹 전문가"],
      family: "OFFENSIVE_SECURITY",
      responsibilityHints: [
        "취약점 탐지 및 공격 시나리오 실행",
        "보안 테스트 수행",
        "취약점 리포트 작성"
      ],
      levelHints: [
        "주니어: 도구 기반 테스트 수행",
        "미드: 공격 시나리오 설계",
        "시니어: 고급 공격 및 전략 수립"
      ]
    },
    {
      id: "SECURITY_COMPLIANCE_MANAGER",
      label: "보안 컴플라이언스 담당",
      aliases: ["정보보호 담당", "GRC Manager"],
      family: "GRC_SECURITY",
      responsibilityHints: [
        "보안 정책 수립 및 관리",
        "감사 및 인증 대응",
        "리스크 관리"
      ],
      levelHints: [
        "주니어: 문서 및 정책 운영 지원",
        "미드: 인증 대응 및 정책 관리",
        "시니어: 조직 보안 전략 및 거버넌스 수립"
      ]
    }
  ],
  axes: [
    {
      axisId: "SECURITY_APPROACH",
      label: "보안 접근 방식",
      values: [
        "구현/개발 중심",
        "운영/대응 중심",
        "공격/진단 중심",
        "정책/관리 중심"
      ]
    },
    {
      axisId: "TECHNICAL_DEPTH",
      label: "기술 구현 깊이",
      values: [
        "코드/시스템 구현",
        "도구 기반 운영",
        "분석 및 테스트",
        "정책 및 문서 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "BACKEND_DEVELOPMENT",
    "DEVOPS",
    "IT_INFRASTRUCTURE"
  ],
  boundaryHints: [
    "코드 구현과 보안 기능 개발 비중이 커지면 보안 엔지니어링으로 이동합니다",
    "로그 모니터링과 사고 대응 비중이 커지면 보안 운영으로 해석됩니다",
    "취약점 공격과 테스트 수행이 중심이면 공격 보안으로 이동합니다",
    "정책 수립과 감사 대응 비중이 커지면 GRC 영역으로 이동합니다"
  ],
  summaryTemplate: "이 직무는 시스템과 조직을 보호하기 위한 다양한 보안 역할로 구성되며, 구현, 운영, 공격, 정책 중심으로 나뉩니다. 실제 수행하는 책임의 비중에 따라 세부 영역이 달라질 수 있습니다."
};