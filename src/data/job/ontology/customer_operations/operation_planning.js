export const JOB_ONTOLOGY_ITEM = {
  vertical: "CUSTOMER_OPERATIONS",
  subVertical: "OPERATION_PLANNING",
  aliases: [
    "운영기획",
    "서비스 운영기획",
    "비즈니스 운영기획",
    "operation planning",
    "operations planning",
    "ops planning",
    "business operations planning",
    "운영 전략",
    "운영 개선",
    "운영 정책 기획"
  ],
  families: [
    {
      id: "PROCESS_POLICY_PLANNING",
      label: "프로세스·정책 기획형",
      aliases: [
        "운영 정책 기획",
        "운영 프로세스 설계",
        "ops policy planning"
      ],
      strongSignals: [
        "운영 정책 수립 및 가이드라인 정의",
        "업무 프로세스 설계 및 표준화",
        "운영 매뉴얼 및 SOP 작성",
        "CS, 물류, 서비스 운영 흐름 구조 설계",
        "이슈 대응 프로세스 정의",
        "내부 운영 규칙 및 정책 문서화",
        "운영 기준 정립 및 변경 관리"
      ],
      mediumSignals: [
        "운영 매뉴얼 업데이트",
        "정책 변경 공지",
        "프로세스 흐름도 작성",
        "운영 기준 점검",
        "내부 커뮤니케이션"
      ],
      boundarySignals: [
        "데이터 기반 성과 분석 비중이 커지면 데이터 기반 운영기획으로 이동",
        "실제 운영 실행 및 현장 대응 비중이 커지면 운영관리로 이동",
        "프로덕트 기능 개선과 연결되면 프로덕트 기획으로 이동"
      ],
      adjacentFamilies: [
        "DATA_DRIVEN_OPERATION_PLANNING",
        "EXECUTION_COORDINATION_OPERATION",
        "SERVICE_IMPROVEMENT_PLANNING"
      ],
      boundaryNote: "운영 정책과 프로세스를 정의하고 표준화하는 역할이 중심이면 프로세스·정책 기획형으로 읽힙니다. 반면 데이터 분석이나 실행 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 정책과 프로세스를 설계하고 기준을 정립하는 성격이 강합니다. 반면 데이터 분석이나 실행 관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "DATA_DRIVEN_OPERATION_PLANNING",
      label: "데이터 기반 운영기획",
      aliases: [
        "운영 데이터 분석",
        "ops analytics",
        "operation data planning"
      ],
      strongSignals: [
        "운영 KPI 정의 및 성과 지표 관리",
        "운영 데이터 분석을 통한 개선 인사이트 도출",
        "대시보드 구축 및 모니터링 체계 설계",
        "운영 효율성 지표(CSAT, 처리시간 등) 분석",
        "데이터 기반 운영 전략 수립",
        "SQL, BI 툴 등을 활용한 데이터 추출 및 분석",
        "이상 징후 탐지 및 개선 방향 제시"
      ],
      mediumSignals: [
        "리포트 작성",
        "데이터 정리",
        "지표 트래킹",
        "운영 성과 리뷰",
        "분석 결과 공유"
      ],
      boundarySignals: [
        "정책 설계와 프로세스 정의 비중이 커지면 프로세스·정책 기획형으로 이동",
        "현장 실행과 운영 관리 비중이 커지면 운영관리로 이동",
        "데이터 파이프라인 구축 중심이면 데이터 직무로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_POLICY_PLANNING",
        "EXECUTION_COORDINATION_OPERATION",
        "SERVICE_IMPROVEMENT_PLANNING"
      ],
      boundaryNote: "운영 데이터를 기반으로 성과를 분석하고 개선 방향을 도출하는 역할이면 데이터 기반 운영기획으로 읽힙니다. 반면 정책 설계나 실행 관리 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 데이터를 분석해 효율과 성과를 개선하는 성격이 강합니다. 반면 정책 설계나 실행 관리 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "SERVICE_IMPROVEMENT_PLANNING",
      label: "서비스 개선 중심 운영기획",
      aliases: [
        "운영 개선",
        "서비스 개선 기획",
        "ops improvement"
      ],
      strongSignals: [
        "고객 불편 및 VOC 기반 개선 과제 도출",
        "운영 이슈 분석 후 개선안 기획",
        "서비스 흐름 개선 프로젝트 리딩",
        "CS, 물류, 서비스 품질 개선 기획",
        "운영 병목 구간 정의 및 개선 실행 설계",
        "개선 효과 측정 및 후속 조치 설계",
        "타 부서 협업을 통한 개선 과제 추진"
      ],
      mediumSignals: [
        "VOC 분석",
        "개선 과제 정리",
        "프로젝트 일정 관리",
        "개선 리포트 작성",
        "내부 협업 조율"
      ],
      boundarySignals: [
        "프로세스 표준화와 정책 정의 중심이면 프로세스·정책 기획형으로 이동",
        "데이터 분석 중심이면 데이터 기반 운영기획으로 이동",
        "제품 기능 개선 중심이면 프로덕트 기획으로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_POLICY_PLANNING",
        "DATA_DRIVEN_OPERATION_PLANNING",
        "EXECUTION_COORDINATION_OPERATION"
      ],
      boundaryNote: "고객 경험과 운영 품질을 개선하기 위한 과제를 발굴하고 실행 구조를 설계하면 서비스 개선 중심 운영기획으로 읽힙니다. 반면 정책 설계나 데이터 분석 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 과정에서 발생하는 문제를 개선하고 서비스 품질을 높이는 성격이 강합니다. 반면 정책 설계나 데이터 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "EXECUTION_COORDINATION_OPERATION",
      label: "운영 실행 관리·조율형",
      aliases: [
        "운영 관리",
        "ops coordination",
        "operation management support"
      ],
      strongSignals: [
        "운영 조직과 실행팀 간 업무 조율",
        "일정 관리 및 운영 실행 상황 모니터링",
        "이슈 발생 시 즉각 대응 및 조정",
        "외주/파트너 운영 관리",
        "운영 리소스 배분 및 관리",
        "현장 운영 이슈 핸들링",
        "운영 실행 프로세스 점검 및 피드백"
      ],
      mediumSignals: [
        "운영 일정 관리",
        "이슈 트래킹",
        "협업 커뮤니케이션",
        "운영 보고",
        "리소스 체크"
      ],
      boundarySignals: [
        "정책 설계와 구조 정의 비중이 커지면 프로세스·정책 기획형으로 이동",
        "데이터 분석과 성과 관리 비중이 커지면 데이터 기반 운영기획으로 이동",
        "단순 실행 중심이면 운영(오퍼레이션) 직무로 이동"
      ],
      adjacentFamilies: [
        "PROCESS_POLICY_PLANNING",
        "DATA_DRIVEN_OPERATION_PLANNING",
        "SERVICE_IMPROVEMENT_PLANNING"
      ],
      boundaryNote: "운영 실행을 관리하고 조직 간 조율 역할이 중심이면 운영 실행 관리·조율형으로 읽힙니다. 반면 기획과 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영 실행을 관리하고 조직 간 조율을 담당하는 성격이 강합니다. 반면 정책 설계나 데이터 분석 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "OPERATION_PLANNER",
      label: "운영기획 담당",
      aliases: [
        "operation planner",
        "ops planner"
      ],
      family: "PROCESS_POLICY_PLANNING",
      responsibilityHints: [
        "운영 정책 수립",
        "프로세스 설계",
        "매뉴얼 작성",
        "운영 기준 정의"
      ],
      levelHints: [
        "주니어는 문서화와 운영 지원 비중이 큼",
        "시니어는 정책 설계와 구조 정의 비중이 큼"
      ]
    },
    {
      id: "OPS_ANALYST",
      label: "운영 데이터 분석 담당",
      aliases: [
        "ops analyst",
        "operation analyst"
      ],
      family: "DATA_DRIVEN_OPERATION_PLANNING",
      responsibilityHints: [
        "데이터 분석",
        "지표 관리",
        "리포트 작성",
        "성과 개선 제안"
      ],
      levelHints: [
        "주니어는 데이터 정리와 리포트 중심",
        "시니어는 전략 인사이트 도출 비중이 큼"
      ]
    },
    {
      id: "OPS_IMPROVEMENT_MANAGER",
      label: "운영 개선 담당",
      aliases: [
        "ops improvement manager",
        "service improvement planner"
      ],
      family: "SERVICE_IMPROVEMENT_PLANNING",
      responsibilityHints: [
        "VOC 분석",
        "개선 과제 도출",
        "프로젝트 기획",
        "품질 개선"
      ],
      levelHints: [
        "주니어는 과제 실행 지원 중심",
        "시니어는 개선 전략과 프로젝트 리딩 비중이 큼"
      ]
    },
    {
      id: "OPS_COORDINATOR",
      label: "운영 조율 담당",
      aliases: [
        "ops coordinator",
        "operation coordinator"
      ],
      family: "EXECUTION_COORDINATION_OPERATION",
      responsibilityHints: [
        "운영 일정 관리",
        "이슈 대응",
        "조직 간 협업",
        "리소스 관리"
      ],
      levelHints: [
        "주니어는 실행 지원과 커뮤니케이션 중심",
        "시니어는 운영 구조 조율과 의사결정 지원 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "FOCUS_AREA",
      label: "핵심 초점",
      values: [
        "프로세스와 정책",
        "데이터와 성과",
        "서비스 개선",
        "운영 실행 관리"
      ]
    },
    {
      axisId: "CORE_ACTIVITY",
      label: "핵심 활동",
      values: [
        "설계와 정의",
        "분석과 인사이트",
        "개선 과제 추진",
        "실행 관리와 조율"
      ]
    },
    {
      axisId: "VALUE_CREATION",
      label: "성과 창출 방식",
      values: [
        "운영 표준화",
        "데이터 기반 최적화",
        "서비스 품질 개선",
        "운영 안정화"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "기획과 설계",
        "데이터 분석",
        "프로젝트 개선",
        "운영 실행 관리"
      ]
    }
  ],
  adjacentFamilies: [
    "프로덕트기획",
    "사업기획",
    "데이터분석",
    "CS 운영",
    "물류 운영",
    "서비스 운영"
  ],
  boundaryHints: [
    "운영 정책과 프로세스 설계 비중이 많아지면 프로세스·정책 기획형으로 읽힙니다.",
    "데이터 분석과 KPI 관리 비중이 커지면 데이터 기반 운영기획으로 이동합니다.",
    "고객 불편 개선과 서비스 품질 개선 비중이 커지면 서비스 개선 중심으로 이동합니다.",
    "운영 실행 관리와 현장 대응 비중이 커지면 운영 관리·조율형으로 이동합니다.",
    "제품 기능 개선과 연결되면 프로덕트 기획으로 이동합니다.",
    "단순 실행 중심이면 운영(오퍼레이션) 직무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 운영 구조를 설계하고 개선하며 조직의 실행 효율을 높이는 운영기획 성격이 강합니다. 다만 정책 설계, 데이터 분석, 서비스 개선, 실행 관리로 역할이 나뉘며 작동 방식이 달라집니다. 반면 제품 기획이나 단순 운영 실행 중심으로 이동하면 다른 경계로 읽힐 수 있습니다."
};
