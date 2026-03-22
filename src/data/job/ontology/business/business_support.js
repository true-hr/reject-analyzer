export const JOB_ONTOLOGY_ITEM = {
  vertical: "BUSINESS",
  subVertical: "BUSINESS_SUPPORT",
  aliases: [
    "경영지원",
    "경영 지원",
    "사업지원",
    "사업 지원",
    "경영관리",
    "관리지원",
    "corporate support",
    "business support",
    "management support",
    "corporate operations"
  ],
  families: [
    {
      id: "MANAGEMENT_COORDINATION_SUPPORT",
      label: "경영기획 연계 지원",
      aliases: [
        "경영기획 지원",
        "경영관리 지원",
        "management coordination",
        "planning support"
      ],
      strongSignals: [
        "경영회의 자료 취합 및 보고자료 작성",
        "전사 일정, 회의체, 보고 리듬 운영",
        "부서별 요청사항 정리 및 경영진 보고 대응",
        "실적 자료 취합 및 보고 포맷 관리",
        "전사 공지, 지시사항, 후속 액션 정리",
        "경영진 수명업무 일정 및 진행상황 관리",
        "부서 간 커뮤니케이션 허브 역할 수행"
      ],
      mediumSignals: [
        "간단한 실적 현황 정리",
        "회의 안건 수집 및 회의록 작성",
        "보고 문서 템플릿 관리",
        "임원 요청사항 트래킹",
        "조직 간 일정 조율"
      ],
      boundarySignals: [
        "직접 목표를 설계하고 성과를 해석하는 비중이 커지면 전략기획 또는 사업기획으로 이동",
        "단순 비서·스케줄 관리 비중이 커지면 임원비서 또는 사무지원으로 이동",
        "규정·자산·총무 운영 비중이 커지면 총무 성격으로 이동"
      ],
      adjacentFamilies: [
        "GENERAL_AFFAIRS_ADMIN_SUPPORT",
        "CORPORATE_COMPLIANCE_SUPPORT",
        "INTERNAL_OPERATION_SUPPORT"
      ],
      boundaryNote: "경영진과 조직 사이에서 보고, 회의체, 후속 액션을 정리하고 굴리는 역할이면 경영기획 연계 지원으로 읽힙니다. 반면 직접 기획 의사결정을 하거나 반대로 단순 사무보조로 내려가면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 경영진 의사결정이 조직 안에서 실행되도록 자료, 회의체, 커뮤니케이션을 정리하는 성격이 강합니다. 반면 직접 전략을 설계하거나 단순 비서·사무지원 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "GENERAL_AFFAIRS_ADMIN_SUPPORT",
      label: "총무·관리지원",
      aliases: [
        "총무",
        "관리지원",
        "사무관리",
        "general affairs",
        "administration support",
        "office administration"
      ],
      strongSignals: [
        "사무환경, 자산, 비품, 시설 운영 관리",
        "계약, 구매, 비용정산 등 운영성 행정 처리",
        "사내 행사, 복리후생, 공용 인프라 운영",
        "문서 수발신, 직인, 증명서, 보관 문서 관리",
        "외주사, 건물, 렌탈, 유지보수 업체 대응",
        "고정비 및 운영비 집행 지원",
        "입퇴사 행정 및 공용 계정·공간 준비 지원"
      ],
      mediumSignals: [
        "사내 공지 운영",
        "자산 현황 관리",
        "비용 처리 및 증빙 관리",
        "방문객 응대 및 공간 예약 관리",
        "행정 서류 작성"
      ],
      boundarySignals: [
        "인사제도, 채용, 평가보상 비중이 커지면 인사 직무로 이동",
        "법인 문서, 규정, 통제 대응 비중이 커지면 컴플라이언스/법무 지원으로 이동",
        "전사 회의체·경영보고 지원 비중이 커지면 경영기획 연계 지원으로 이동"
      ],
      adjacentFamilies: [
        "MANAGEMENT_COORDINATION_SUPPORT",
        "CORPORATE_COMPLIANCE_SUPPORT",
        "INTERNAL_OPERATION_SUPPORT"
      ],
      boundaryNote: "회사 운영을 위한 자산, 시설, 비용, 행정 처리가 중심이면 총무·관리지원으로 읽힙니다. 반면 사람 제도나 경영보고, 내부통제 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 회사가 문제없이 돌아가도록 자산, 시설, 비용, 행정 업무를 관리하는 성격이 강합니다. 반면 경영보고, 인사제도, 내부통제 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "CORPORATE_COMPLIANCE_SUPPORT",
      label: "사규·법인운영 지원",
      aliases: [
        "법인운영 지원",
        "사규 관리",
        "내부통제 지원",
        "corporate governance support",
        "compliance support",
        "corporate administration"
      ],
      strongSignals: [
        "사규, 규정, 내부결재 기준 관리",
        "법인 문서, 이사회·주총 관련 행정 지원",
        "계약서, 위임장, 증명 서류 등 법인 문서 관리",
        "감사, 점검, 인증 대응용 자료 취합",
        "내부통제 절차 운영 지원",
        "권한·승인 체계 문서화 및 관리",
        "규정 개정 이력 및 배포 관리"
      ],
      mediumSignals: [
        "유관부서 자료 요청 및 취합",
        "정책 준수 여부 체크리스트 운영",
        "법무 또는 재무 부서 협업",
        "결재선 및 권한 체계 관리",
        "감사 대응 일정 관리"
      ],
      boundarySignals: [
        "법률 검토와 해석 책임이 커지면 법무로 이동",
        "재무·회계 통제와 수치 검증이 중심이면 내부회계/재무통제로 이동",
        "일반 행정과 총무성 운영 비중이 커지면 총무·관리지원으로 이동"
      ],
      adjacentFamilies: [
        "GENERAL_AFFAIRS_ADMIN_SUPPORT",
        "MANAGEMENT_COORDINATION_SUPPORT",
        "INTERNAL_OPERATION_SUPPORT"
      ],
      boundaryNote: "규정, 결재, 법인 문서, 내부통제 운영을 행정적으로 지탱하면 이 family로 읽힙니다. 반면 법률 판단이나 회계 통제 책임이 커지면 전문 직무 경계로 이동합니다.",
      summaryTemplate: "이 직무는 회사의 규정과 법인 운영 절차가 흐트러지지 않도록 문서와 통제 프로세스를 관리하는 성격이 강합니다. 반면 법률 해석이나 회계 통제 책임이 커지면 다른 직무로 읽힐 수 있습니다."
    },
    {
      id: "INTERNAL_OPERATION_SUPPORT",
      label: "내부운영 지원",
      aliases: [
        "내부운영 지원",
        "운영지원",
        "back office support",
        "internal operations support",
        "business operations support"
      ],
      strongSignals: [
        "부서 운영 요청 접수 및 처리",
        "내부 운영 프로세스 안내 및 실행 지원",
        "정산, 발주, 문서 처리 등 반복 운영 업무 관리",
        "내부 시스템 사용 지원 및 문의 대응",
        "업무 흐름상 누락·지연 사항 체크 및 후속 조치",
        "부서 간 실무 요청 연결 및 처리 현황 관리",
        "운영 매뉴얼 기반 지원 업무 수행"
      ],
      mediumSignals: [
        "반복 업무 표준화",
        "운영 현황 체크리스트 관리",
        "지원 요청 티켓/메일 응대",
        "실무 자료 정리",
        "운영 이슈 공유"
      ],
      boundarySignals: [
        "고객 응대가 중심이면 CS 또는 고객운영으로 이동",
        "프로세스 설계와 개선 책임이 커지면 운영기획 또는 운영관리로 이동",
        "단순 사무 처리만 남으면 사무지원으로 이동"
      ],
      adjacentFamilies: [
        "GENERAL_AFFAIRS_ADMIN_SUPPORT",
        "MANAGEMENT_COORDINATION_SUPPORT",
        "CORPORATE_COMPLIANCE_SUPPORT"
      ],
      boundaryNote: "내부 부서가 업무를 이어갈 수 있도록 반복 운영과 요청 처리를 안정적으로 수행하면 내부운영 지원으로 읽힙니다. 반면 개선 설계나 외부 고객 대응 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 내부 부서의 업무가 끊기지 않도록 반복 운영과 요청 처리를 안정적으로 수행하는 성격이 강합니다. 반면 프로세스 개선 설계나 외부 고객 대응 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "CORPORATE_SUPPORT_MANAGER",
      label: "경영지원 담당",
      aliases: [
        "경영지원 담당",
        "corporate support manager",
        "business support manager"
      ],
      family: "MANAGEMENT_COORDINATION_SUPPORT",
      responsibilityHints: [
        "경영회의 자료 취합",
        "보고 체계 운영",
        "부서 간 요청사항 조율",
        "경영진 후속 액션 관리"
      ],
      levelHints: [
        "주니어는 자료 취합과 일정 조율 비중이 큼",
        "시니어는 경영진 커뮤니케이션과 전사 운영 리듬 관리 비중이 큼"
      ]
    },
    {
      id: "GENERAL_AFFAIRS_MANAGER",
      label: "총무 담당",
      aliases: [
        "총무 담당",
        "general affairs manager",
        "administration manager"
      ],
      family: "GENERAL_AFFAIRS_ADMIN_SUPPORT",
      responsibilityHints: [
        "자산·시설 운영",
        "운영비 및 행정 처리",
        "사내 행사 및 복리후생 운영",
        "외주사 및 공용 인프라 관리"
      ],
      levelHints: [
        "주니어는 운영 실행과 비용 처리 비중이 큼",
        "시니어는 운영 정책 정리와 협력사 관리 비중이 큼"
      ]
    },
    {
      id: "CORPORATE_ADMIN_MANAGER",
      label: "법인운영 지원 담당",
      aliases: [
        "법인운영 담당",
        "corporate administration manager",
        "compliance support manager"
      ],
      family: "CORPORATE_COMPLIANCE_SUPPORT",
      responsibilityHints: [
        "사규 및 결재 기준 관리",
        "법인 문서 운영",
        "감사 대응 자료 취합",
        "내부통제 절차 지원"
      ],
      levelHints: [
        "주니어는 문서 관리와 자료 취합 비중이 큼",
        "시니어는 규정 운영과 통제 프로세스 조율 비중이 큼"
      ]
    },
    {
      id: "INTERNAL_OPERATIONS_COORDINATOR",
      label: "내부운영 지원 담당",
      aliases: [
        "운영지원 담당",
        "internal operations coordinator",
        "back office coordinator"
      ],
      family: "INTERNAL_OPERATION_SUPPORT",
      responsibilityHints: [
        "내부 요청 처리",
        "반복 운영 업무 관리",
        "운영 프로세스 안내",
        "누락 및 지연 이슈 후속 조치"
      ],
      levelHints: [
        "주니어는 요청 처리와 문서 관리 비중이 큼",
        "시니어는 운영 표준화와 실무 허브 역할 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "PRIMARY_SUPPORT_TARGET",
      label: "주요 지원 대상",
      values: [
        "경영진·전사 회의체",
        "사내 자산·시설·행정",
        "법인 절차·규정·통제",
        "내부 부서 실무 운영"
      ]
    },
    {
      axisId: "WORK_NATURE",
      label: "업무 성격",
      values: [
        "보고·조율 중심",
        "행정·운영 집행 중심",
        "규정·문서·통제 중심",
        "반복 지원·요청 처리 중심"
      ]
    },
    {
      axisId: "DECISION_PROXIMITY",
      label: "의사결정과의 거리",
      values: [
        "경영 의사결정 바로 옆에서 지원",
        "회사 운영 기반을 유지하는 실무",
        "통제와 절차를 지탱하는 지원",
        "현업 실행을 이어주는 운영 지원"
      ]
    },
    {
      axisId: "STANDARDIZATION_LEVEL",
      label: "표준화 정도",
      values: [
        "회의체와 보고 리듬 관리",
        "행정 처리와 운영 기준 관리",
        "규정과 승인 체계 관리",
        "반복 요청 처리와 업무 표준화"
      ]
    }
  ],
  adjacentFamilies: [
    "전략기획",
    "사업기획",
    "운영관리",
    "인사·조직",
    "재무·회계",
    "법무",
    "공공·행정·지원"
  ],
  boundaryHints: [
    "경영회의 자료 정리와 경영진 커뮤니케이션 비중이 많아지면 경영기획 연계 지원으로 읽힙니다.",
    "자산, 시설, 비용, 복리후생 등 회사 운영 기반을 관리하는 비중이 커지면 총무·관리지원으로 이동합니다.",
    "사규, 결재, 법인 문서, 감사 대응 비중이 커지면 사규·법인운영 지원으로 이동합니다.",
    "내부 부서 요청 처리와 반복 운영 업무 비중이 커지면 내부운영 지원으로 읽힙니다.",
    "직접 목표를 설계하고 실적을 해석하는 책임이 커지면 전략기획 또는 사업기획으로 이동합니다.",
    "채용, 평가보상, 조직제도 비중이 커지면 인사·조직으로 이동합니다.",
    "법률 해석이나 계약 리스크 판단 비중이 커지면 법무로 이동합니다."
  ],
  summaryTemplate: "이 직무는 회사가 안정적으로 돌아가도록 경영진 보고, 행정 운영, 법인 절차, 내부 요청 처리를 지원하는 성격이 강합니다. 다만 실제 역할은 경영 의사결정 지원형, 총무·행정형, 규정·통제형, 내부운영 지원형으로 나뉘며 작동 방식이 달라집니다. 반면 직접 전략을 설계하거나 전문 기능 책임이 커지면 다른 경계로 읽힐 수 있습니다."
};
