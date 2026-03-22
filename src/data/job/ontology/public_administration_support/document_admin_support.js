export const JOB_ONTOLOGY_ITEM = {
  vertical: "PUBLIC_ADMINISTRATION_SUPPORT",
  subVertical: "DOCUMENT_ADMIN_SUPPORT",
  aliases: [
    "문서관리",
    "사무지원",
    "행정지원",
    "사무보조",
    "오피스 어드민",
    "office admin",
    "administrative assistant",
    "document control",
    "문서 담당",
    "총무 사무",
    "백오피스 지원"
  ],
  families: [
    {
      id: "document_control",
      label: "문서관리 중심",
      aliases: [
        "문서관리",
        "문서통제",
        "document control",
        "records management",
        "문서 아카이빙"
      ],
      strongSignals: [
        "문서 버전관리",
        "문서 등록/폐기 프로세스 운영",
        "결재 문서 체계 관리",
        "문서 보관 기준 수립",
        "전자문서 시스템 운영"
      ],
      mediumSignals: [
        "문서 분류 체계 유지",
        "기록물 관리",
        "파일 네이밍 규칙 관리",
        "문서 접근 권한 관리"
      ],
      boundarySignals: [
        "일정 조율이나 회의 지원 비중 증가",
        "구매/총무 업무 병행 비중 증가",
        "단순 입력/데이터 정리 업무 비중 증가"
      ],
      adjacentFamilies: [
        "admin_support_general",
        "data_entry_support"
      ],
      boundaryNote: "문서 체계 설계와 통제 역할이 약해지고 단순 정리나 입력 비중이 커지면 데이터 입력/사무보조 성격으로 이동합니다. 반대로 조직 운영 지원 업무가 많아지면 일반 사무지원으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 문서의 생성·보관·버전 관리 체계를 유지하는 성격이 강합니다. 반면 단순 입력이나 일정·운영 지원 비중이 커지면 사무지원 영역으로 경계가 이동할 수 있습니다."
    },
    {
      id: "admin_support_general",
      label: "일반 사무지원",
      aliases: [
        "사무지원",
        "행정지원",
        "오피스 지원",
        "administrative support",
        "office assistant"
      ],
      strongSignals: [
        "회의 일정 조율",
        "출장/방문 일정 관리",
        "내부 커뮤니케이션 지원",
        "결재 서류 준비 및 전달",
        "부서 운영 지원"
      ],
      mediumSignals: [
        "회의록 작성",
        "간단한 문서 작성",
        "비품 요청 처리",
        "기초 데이터 정리"
      ],
      boundarySignals: [
        "문서 체계 관리 책임 증가",
        "구매/자산/시설 관리 비중 증가",
        "단순 반복 입력 업무 비중 증가"
      ],
      adjacentFamilies: [
        "document_control",
        "general_affairs_support",
        "data_entry_support"
      ],
      boundaryNote: "조직 운영 보조가 아닌 문서 통제 역할이 강화되면 문서관리로 이동합니다. 반대로 구매·시설 관리 비중이 커지면 총무 영역으로, 반복 입력 비중이 높아지면 데이터 입력 지원으로 해석됩니다.",
      summaryTemplate: "이 직무는 조직 운영을 보조하며 일정, 커뮤니케이션, 기본 행정 처리를 지원하는 성격이 강합니다. 특정 영역 책임이 커지면 문서관리나 총무 영역으로 경계가 이동할 수 있습니다."
    },
    {
      id: "general_affairs_support",
      label: "총무·운영 지원",
      aliases: [
        "총무",
        "general affairs",
        "운영지원",
        "오피스 운영",
        "시설/비품 관리"
      ],
      strongSignals: [
        "비품 구매 및 관리",
        "사무실 시설 관리",
        "외주/용역 계약 관리",
        "자산 관리",
        "행사/내부 이벤트 운영"
      ],
      mediumSignals: [
        "견적 비교 및 발주 지원",
        "비용 처리 보조",
        "외부 업체 커뮤니케이션",
        "운영 정책 보조"
      ],
      boundarySignals: [
        "문서 체계 관리 비중 증가",
        "일정/회의 지원 비중 증가",
        "단순 입력 업무 비중 증가"
      ],
      adjacentFamilies: [
        "admin_support_general",
        "document_control"
      ],
      boundaryNote: "운영 자산과 환경 관리보다 문서 체계 관리가 중심이 되면 문서관리로 이동합니다. 일정/행정 보조 비중이 높아지면 일반 사무지원으로 읽힐 수 있습니다.",
      summaryTemplate: "이 직무는 사무환경과 운영 자산을 관리하며 조직 운영을 지원하는 성격이 강합니다. 문서 관리나 일정 지원 비중이 커지면 다른 사무지원 영역으로 경계가 이동할 수 있습니다."
    },
    {
      id: "data_entry_support",
      label: "데이터 입력·정리 지원",
      aliases: [
        "데이터 입력",
        "자료 입력",
        "data entry",
        "문서 입력",
        "자료 정리"
      ],
      strongSignals: [
        "엑셀 데이터 입력",
        "반복적인 자료 등록",
        "시스템 데이터 업로드",
        "문서 내용 전산화",
        "단순 정리 및 포맷팅"
      ],
      mediumSignals: [
        "기초 검수",
        "데이터 정합성 확인",
        "파일 정리",
        "리스트 관리"
      ],
      boundarySignals: [
        "문서 체계 설계/관리 책임 증가",
        "일정/운영 지원 역할 증가",
        "구매/시설 관리 비중 증가"
      ],
      adjacentFamilies: [
        "admin_support_general",
        "document_control"
      ],
      boundaryNote: "단순 입력을 넘어 문서 체계 관리나 정책 정의 역할이 추가되면 문서관리로 이동합니다. 일정·운영 지원이 늘어나면 일반 사무지원으로 해석됩니다.",
      summaryTemplate: "이 직무는 데이터를 정해진 형식으로 입력하고 정리하는 반복 업무 성격이 강합니다. 관리 책임이 추가되면 문서관리나 사무지원 영역으로 경계가 이동할 수 있습니다."
    }
  ],
  roles: [
    {
      id: "document_controller",
      label: "문서관리 담당",
      aliases: [
        "문서관리자",
        "document controller",
        "records manager"
      ],
      family: "document_control",
      responsibilityHints: [
        "문서 등록 및 버전 관리",
        "문서 체계 유지",
        "문서 접근 권한 관리"
      ],
      levelHints: [
        "주니어: 문서 등록/정리 중심",
        "시니어: 체계 설계 및 기준 수립"
      ]
    },
    {
      id: "admin_assistant",
      label: "사무지원 담당",
      aliases: [
        "행정지원",
        "administrative assistant",
        "office assistant"
      ],
      family: "admin_support_general",
      responsibilityHints: [
        "일정 조율",
        "회의 지원",
        "부서 운영 보조"
      ],
      levelHints: [
        "주니어: 일정/문서 보조",
        "시니어: 부서 운영 전반 지원"
      ]
    },
    {
      id: "general_affairs_staff",
      label: "총무 담당",
      aliases: [
        "총무",
        "general affairs staff"
      ],
      family: "general_affairs_support",
      responsibilityHints: [
        "비품 및 자산 관리",
        "시설 운영",
        "외주 관리"
      ],
      levelHints: [
        "주니어: 요청 처리 중심",
        "시니어: 운영 정책 및 비용 관리"
      ]
    },
    {
      id: "data_entry_operator",
      label: "데이터 입력 담당",
      aliases: [
        "자료입력",
        "data entry operator"
      ],
      family: "data_entry_support",
      responsibilityHints: [
        "데이터 입력",
        "자료 정리",
        "기초 검수"
      ],
      levelHints: [
        "주니어: 반복 입력 작업",
        "시니어: 검수 및 기준 관리 일부 포함"
      ]
    }
  ],
  axes: [
    {
      axisId: "structure_vs_execution",
      label: "체계 관리 vs 실행 보조",
      values: [
        "문서 체계 설계/관리 중심",
        "일정/운영 실행 보조 중심",
        "단순 입력/정리 중심"
      ]
    },
    {
      axisId: "asset_operation_involvement",
      label: "운영 자산 관여도",
      values: [
        "시설/비품/계약 관리 포함",
        "운영 자산 관여 낮음"
      ]
    }
  ],
  adjacentFamilies: [
    "hr_ops_support",
    "finance_admin_support"
  ],
  boundaryHints: [
    "문서 체계 설계와 통제 책임이 커지면 문서관리 중심으로 이동합니다.",
    "일정 조율과 조직 운영 보조 비중이 높아지면 일반 사무지원으로 읽힙니다.",
    "비품, 시설, 계약 관리 비중이 커지면 총무 영역으로 해석됩니다.",
    "반복적인 입력과 정리 업무 비중이 높아지면 데이터 입력 지원으로 이동합니다."
  ],
  summaryTemplate: "이 직무는 문서 관리, 행정 지원, 데이터 정리 등 조직 운영을 보조하는 역할로 구성됩니다. 어떤 업무 비중이 중심이 되는지에 따라 문서관리, 사무지원, 총무, 데이터 입력 영역으로 경계가 나뉘어 해석될 수 있습니다."
};
