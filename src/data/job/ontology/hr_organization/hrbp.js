export const JOB_ONTOLOGY_ITEM = {
  vertical: "HR_ORGANIZATION",
  subVertical: "HRBP",
  aliases: [
    "HRBP",
    "HR Business Partner",
    "인사 비즈니스 파트너",
    "HR 파트너",
    "조직 파트너",
    "사업부 인사",
    "BU HR",
    "People Partner",
    "HR Partner",
    "사업부 HR"
  ],
  families: [
    {
      id: "STRATEGIC_HRBP",
      label: "전략형 HRBP",
      aliases: [
        "전략 HRBP",
        "strategic HRBP",
        "senior HRBP",
        "people strategy partner"
      ],
      strongSignals: [
        "사업부 전략 수립 과정에 직접 참여하여 인력 전략을 함께 설계",
        "조직 구조 개편, 인력 재배치, 핵심 인재 유지 전략을 주도",
        "리더십과 정기적으로 조직 이슈를 리뷰하고 의사결정에 영향",
        "사업 목표와 연계된 인력 계획 및 조직 설계를 수행",
        "경영진 또는 BU 리더와 파트너십을 형성하여 조직 방향을 조율"
      ],
      mediumSignals: [
        "성과관리 방향 설정과 제도 개선 제안",
        "조직 진단 결과를 기반으로 개선 과제 도출",
        "핵심 인재 육성 및 승계 계획 논의",
        "조직 내 갈등이나 리더십 이슈에 개입하여 방향 제시"
      ],
      boundarySignals: [
        "제도 운영, 평가/보상 실행, HR 프로세스 집행 비중이 커지면 운영형 HRBP로 이동",
        "조직 개발 프로그램 설계, 교육 개입 비중이 커지면 조직개발(OD)로 이동",
        "채용, 리크루팅 활동 비중이 커지면 채용으로 이동"
      ],
      adjacentFamilies: [
        "OPERATIONAL_HRBP",
        "HR_PLANNING_POLICY",
        "ORGANIZATION_DEVELOPMENT"
      ],
      boundaryNote: "사업 방향과 연결된 조직·인력 의사결정에 직접 관여하면 전략형 HRBP로 읽힙니다. 반면 제도 운영이나 실행 중심 역할이 커지면 운영형 HRBP 또는 다른 HR 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 사업 전략과 연계된 조직·인력 방향을 설계하는 전략형 HRBP 성격이 강합니다. 반면 제도 운영이나 실행 중심 비중이 커지면 다른 HRBP 경계로 읽힐 수 있습니다."
    },
    {
      id: "OPERATIONAL_HRBP",
      label: "운영형 HRBP",
      aliases: [
        "운영 HRBP",
        "execution HRBP",
        "generalist HRBP",
        "HR generalist"
      ],
      strongSignals: [
        "평가, 보상, 승진 등 HR 제도를 사업부 단위에서 실제로 운영",
        "구성원 문의 대응, HR 이슈 해결, 인사 프로세스 실행을 담당",
        "입퇴사, 인사 발령, 조직 변경 등 실무 운영을 직접 수행",
        "리더 및 구성원과의 커뮤니케이션을 통해 HR 정책을 적용",
        "조직 내 이슈를 수집하고 HR 정책에 맞게 해결"
      ],
      mediumSignals: [
        "HR 데이터 정리 및 리포트 작성",
        "HR 정책 안내 및 가이드 제공",
        "간단한 조직 진단 및 피드백 수집",
        "타 HR 기능과 협업하여 실행 지원"
      ],
      boundarySignals: [
        "사업 전략과 연결된 조직 설계, 인력 전략 수립 비중이 커지면 전략형 HRBP로 이동",
        "프로세스 개선, 제도 설계, 정책 기획 비중이 커지면 인사기획으로 이동",
        "교육, 조직문화 프로그램 설계 비중이 커지면 조직개발(OD)로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_HRBP",
        "HR_PLANNING_POLICY",
        "HR_OPERATIONS"
      ],
      boundaryNote: "사업부 내 HR 제도를 실제로 운영하고 구성원 이슈를 해결하는 역할이 중심이면 운영형 HRBP로 읽힙니다. 반면 전략 설계나 제도 기획 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 사업부 내 HR 제도를 실행하고 구성원 이슈를 해결하는 운영형 HRBP 성격이 강합니다. 반면 전략 설계나 제도 기획 비중이 커지면 다른 경계로 해석될 수 있습니다."
    },
    {
      id: "TRANSFORMATION_HRBP",
      label: "변화·조직전환 HRBP",
      aliases: [
        "조직 변화 HRBP",
        "transformation HRBP",
        "change partner",
        "people transformation"
      ],
      strongSignals: [
        "조직 변화 프로젝트(조직 개편, PMI, 구조조정 등)에 HR 관점에서 참여",
        "변화 관리 계획 수립 및 실행을 리딩",
        "조직 내 변화 저항 관리와 커뮤니케이션 전략 설계",
        "대규모 조직 전환 과정에서 리더와 함께 실행 전략 수립",
        "문화 변화, 일하는 방식 변화 프로젝트를 주도"
      ],
      mediumSignals: [
        "조직 진단을 통해 변화 과제 도출",
        "리더십 워크숍, 커뮤니케이션 세션 운영",
        "변화 영향 분석 및 리스크 관리",
        "프로젝트 단위 HR 지원"
      ],
      boundarySignals: [
        "상시 조직 운영과 제도 실행 비중이 커지면 운영형 HRBP로 이동",
        "교육 프로그램 설계, 조직문화 구축 중심이면 조직개발(OD)로 이동",
        "전사 정책 설계와 제도 기획 비중이 커지면 인사기획으로 이동"
      ],
      adjacentFamilies: [
        "STRATEGIC_HRBP",
        "ORGANIZATION_DEVELOPMENT",
        "HR_PLANNING_POLICY"
      ],
      boundaryNote: "조직 변화나 전환 프로젝트를 중심으로 HR 개입을 설계하고 실행하면 변화·조직전환 HRBP로 읽힙니다. 반면 상시 운영이나 제도 설계 비중이 커지면 다른 HR 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 조직 변화와 전환 상황에서 HR 관점의 개입을 설계하고 실행하는 성격이 강합니다. 반면 상시 운영이나 제도 설계 비중이 커지면 다른 HRBP 또는 HR 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "HRBP_MANAGER",
      label: "HRBP 매니저",
      aliases: [
        "HRBP 매니저",
        "HR business partner manager",
        "people partner manager"
      ],
      family: "STRATEGIC_HRBP",
      responsibilityHints: [
        "사업부 리더와 조직 전략 논의",
        "인력 계획 및 조직 구조 설계",
        "핵심 인재 관리 및 리더십 자문",
        "조직 이슈 해결과 방향 제시"
      ],
      levelHints: [
        "중급 이상에서 사업 이해와 조직 설계 역량 요구",
        "시니어는 경영진 파트너로서 의사결정 영향력 확대"
      ]
    },
    {
      id: "HRBP_GENERALIST",
      label: "HRBP 담당자",
      aliases: [
        "HRBP 담당",
        "HR generalist",
        "HR partner"
      ],
      family: "OPERATIONAL_HRBP",
      responsibilityHints: [
        "평가, 보상, 인사 프로세스 운영",
        "구성원 문의 대응 및 HR 이슈 해결",
        "HR 정책 적용 및 커뮤니케이션",
        "데이터 관리 및 리포트"
      ],
      levelHints: [
        "주니어는 운영 실행과 커뮤니케이션 비중이 큼",
        "시니어는 복잡한 조직 이슈 해결과 리더 지원 비중 증가"
      ]
    },
    {
      id: "TRANSFORMATION_PARTNER",
      label: "조직 변화 파트너",
      aliases: [
        "조직 변화 HR",
        "change partner",
        "transformation HRBP"
      ],
      family: "TRANSFORMATION_HRBP",
      responsibilityHints: [
        "조직 변화 프로젝트 기획 및 실행",
        "변화 관리 및 커뮤니케이션 설계",
        "리더십과 협업하여 전환 전략 수립",
        "변화 영향 분석 및 리스크 대응"
      ],
      levelHints: [
        "프로젝트 단위 경험이 중요",
        "시니어는 대규모 조직 전환을 리딩"
      ]
    }
  ],
  axes: [
    {
      axisId: "STRATEGY_INVOLVEMENT",
      label: "사업 전략 관여 수준",
      values: [
        "사업 전략 수립에 직접 참여",
        "전략을 기반으로 실행 중심 지원",
        "프로젝트 단위 변화 대응 중심"
      ]
    },
    {
      axisId: "PRIMARY_WORK_SCOPE",
      label: "주요 업무 범위",
      values: [
        "조직 설계 및 인력 전략",
        "HR 제도 운영 및 구성원 지원",
        "조직 변화 및 전환 프로젝트"
      ]
    },
    {
      axisId: "DECISION_INFLUENCE",
      label: "의사결정 영향력",
      values: [
        "경영진/리더 의사결정에 직접 영향",
        "정해진 정책 내 실행과 조율",
        "프로젝트 내 변화 방향 제안"
      ]
    }
  ],
  adjacentFamilies: [
    "HR_PLANNING_POLICY",
    "HR_OPERATIONS",
    "ORGANIZATION_DEVELOPMENT",
    "RECRUITING"
  ],
  boundaryHints: [
    "사업 전략과 조직 설계에 직접 관여하는 비중이 커지면 전략형 HRBP로 읽힙니다.",
    "평가, 보상, 인사 운영 실행 비중이 많아지면 운영형 HRBP로 이동합니다.",
    "조직 변화 프로젝트나 전환 과제 중심으로 일하면 변화·조직전환 HRBP로 해석됩니다.",
    "전사 정책 설계나 제도 기획 비중이 커지면 인사기획으로 이동합니다.",
    "교육, 조직문화 프로그램 설계 비중이 커지면 조직개발(OD)로 이동합니다."
  ],
  summaryTemplate: "이 직무는 사업부와 밀접하게 협업하며 조직과 인력 이슈를 다루는 HRBP 성격이 강합니다. 다만 전략 설계 중심인지, 운영 실행 중심인지, 변화 프로젝트 중심인지에 따라 실제 역할이 다르게 해석됩니다. 반면 제도 기획이나 조직개발 비중이 커지면 인접 HR 영역으로 읽힐 수 있습니다."
};
