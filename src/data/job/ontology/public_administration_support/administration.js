export const JOB_ONTOLOGY_ITEM = {
  vertical: "PUBLIC_ADMINISTRATION_SUPPORT",
  subVertical: "ADMINISTRATION",
  aliases: [
    "행정",
    "행정직",
    "행정 업무",
    "사무 행정",
    "administration",
    "administrative staff",
    "admin officer",
    "general administration",
    "back office administration",
    "행정 담당자"
  ],
  families: [
    {
      id: "general_administration",
      label: "일반 행정 운영",
      aliases: [
        "일반 행정",
        "사무 행정",
        "총무 행정",
        "general administration",
        "office administration"
      ],
      strongSignals: [
        "문서 작성 및 관리",
        "공문/내부 문서 처리",
        "행정 절차에 따른 업무 수행",
        "일정 및 회의 관리",
        "내부 요청 접수 및 처리",
        "행정 시스템 입력 및 관리"
      ],
      mediumSignals: [
        "비품/자산 관리",
        "출장/비용 처리",
        "업무 지원 요청 대응",
        "기초 데이터 정리",
        "사내 커뮤니케이션 지원"
      ],
      boundarySignals: [
        "조직 운영 정책 설계 비중 증가",
        "대외 민원 대응 비중 증가",
        "재무/인사 기능 수행 비중 증가"
      ],
      adjacentFamilies: [
        "organizational_admin_planning",
        "public_service_admin",
        "specialized_admin"
      ],
      boundaryNote: "조직 운영 정책 설계나 제도 개선 비중이 커지면 기획 행정으로 이동하고, 외부 민원 대응이 많아지면 민원 행정으로 읽힙니다. 특정 기능(인사/재무 등)이 강화되면 전문 행정으로 이동합니다.",
      summaryTemplate: "이 직무는 조직 내 행정 절차를 기반으로 문서, 일정, 요청을 처리하는 운영 성격이 강합니다. 반면 정책 설계나 대외 대응 비중이 커지면 다른 행정 영역으로 해석될 수 있습니다."
    },
    {
      id: "organizational_admin_planning",
      label: "행정 기획 및 운영 관리",
      aliases: [
        "행정 기획",
        "운영 기획",
        "행정 운영 관리",
        "administrative planning",
        "operations planning"
      ],
      strongSignals: [
        "행정 프로세스 설계 및 개선",
        "운영 정책/지침 수립",
        "업무 흐름 구조화 및 표준화",
        "성과 지표 설정 및 관리",
        "운영 효율화 프로젝트 수행",
        "조직 운영 체계 설계"
      ],
      mediumSignals: [
        "업무 매뉴얼 작성",
        "데이터 기반 운영 개선",
        "부서 간 협업 구조 설계",
        "운영 리포트 작성",
        "업무 프로세스 점검"
      ],
      boundarySignals: [
        "단순 문서 처리 업무 비중 증가",
        "대외 민원 응대 비중 증가",
        "특정 기능(재무/인사) 실무 비중 증가"
      ],
      adjacentFamilies: [
        "general_administration",
        "public_service_admin",
        "specialized_admin"
      ],
      boundaryNote: "단순 행정 처리 비중이 커지면 일반 행정으로 이동하고, 외부 민원 대응이 많아지면 민원 행정으로 읽힙니다. 특정 기능 실무가 중심이 되면 전문 행정으로 이동합니다.",
      summaryTemplate: "이 직무는 행정 업무의 구조와 프로세스를 설계하고 개선하는 기획 성격이 강합니다. 반면 단순 처리나 특정 기능 실무 비중이 커지면 다른 행정 영역으로 해석될 수 있습니다."
    },
    {
      id: "public_service_admin",
      label: "민원 및 대외 행정",
      aliases: [
        "민원 행정",
        "대민 업무",
        "공공 서비스 행정",
        "public administration service",
        "customer-facing administration"
      ],
      strongSignals: [
        "민원 접수 및 처리",
        "대외 문의 대응",
        "행정 서비스 안내",
        "민원 해결 절차 수행",
        "외부 이해관계자 커뮤니케이션",
        "민원 처리 결과 관리"
      ],
      mediumSignals: [
        "고객 응대 매뉴얼 활용",
        "서비스 만족도 관리",
        "민원 데이터 기록 및 분석",
        "현장 행정 지원",
        "콜/창구 응대"
      ],
      boundarySignals: [
        "내부 행정 처리 비중 증가",
        "정책/제도 설계 비중 증가",
        "전문 기능 업무 수행 비중 증가"
      ],
      adjacentFamilies: [
        "general_administration",
        "organizational_admin_planning",
        "specialized_admin"
      ],
      boundaryNote: "내부 행정 처리 중심으로 이동하면 일반 행정으로 읽히고, 정책 설계 비중이 커지면 기획 행정으로 이동합니다. 특정 기능 업무가 강화되면 전문 행정으로 해석됩니다.",
      summaryTemplate: "이 직무는 외부 민원과 요청을 접수하고 해결하는 대외 대응 성격이 강합니다. 반면 내부 운영이나 정책 설계 비중이 커지면 다른 행정 영역으로 해석될 수 있습니다."
    },
    {
      id: "specialized_admin",
      label: "전문 기능 행정",
      aliases: [
        "인사 행정",
        "재무 행정",
        "구매 행정",
        "HR administration",
        "finance administration",
        "procurement administration"
      ],
      strongSignals: [
        "인사/급여/채용 관련 행정 처리",
        "예산 집행 및 비용 관리",
        "계약 및 구매 절차 관리",
        "관련 법규 및 규정 준수",
        "전문 시스템 사용 (ERP 등)",
        "정산 및 보고서 작성"
      ],
      mediumSignals: [
        "데이터 기반 업무 처리",
        "내부 감사 대응",
        "정책 준수 여부 점검",
        "전문 영역 리포트 작성",
        "외부 기관 대응"
      ],
      boundarySignals: [
        "일반 문서/일정 관리 비중 증가",
        "정책 설계 및 프로세스 개선 비중 증가",
        "대외 민원 대응 비중 증가"
      ],
      adjacentFamilies: [
        "general_administration",
        "organizational_admin_planning",
        "public_service_admin"
      ],
      boundaryNote: "일반적인 문서/일정 관리로 이동하면 일반 행정으로 읽히고, 정책 설계가 중심이 되면 기획 행정으로 이동합니다. 대외 민원 대응이 많아지면 민원 행정으로 해석됩니다.",
      summaryTemplate: "이 직무는 특정 기능 영역에서 규정과 절차에 따라 행정 업무를 수행하는 성격이 강합니다. 반면 범용 행정이나 정책 설계 비중이 커지면 다른 행정 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "admin_staff",
      label: "행정 담당자",
      aliases: ["administrative staff", "사무직"],
      family: "general_administration",
      responsibilityHints: [
        "문서 및 일정 관리",
        "내부 요청 처리",
        "행정 시스템 입력"
      ],
      levelHints: [
        "단순 행정 지원 수행",
        "복합 업무 조율 및 관리"
      ]
    },
    {
      id: "admin_planner",
      label: "행정 기획 담당",
      aliases: ["operations planner", "행정 기획자"],
      family: "organizational_admin_planning",
      responsibilityHints: [
        "행정 프로세스 설계",
        "운영 정책 수립",
        "효율화 프로젝트 수행"
      ],
      levelHints: [
        "기초 프로세스 개선",
        "조직 단위 운영 체계 설계"
      ]
    },
    {
      id: "public_service_officer",
      label: "민원 담당자",
      aliases: ["public service officer", "민원 처리 담당"],
      family: "public_service_admin",
      responsibilityHints: [
        "민원 접수 및 처리",
        "대외 문의 대응",
        "서비스 안내"
      ],
      levelHints: [
        "단순 민원 응대",
        "복잡 민원 해결 및 조정"
      ]
    },
    {
      id: "functional_admin_officer",
      label: "전문 행정 담당",
      aliases: ["HR admin", "finance admin", "procurement admin"],
      family: "specialized_admin",
      responsibilityHints: [
        "전문 영역 행정 처리",
        "규정 준수 관리",
        "정산 및 보고"
      ],
      levelHints: [
        "기초 업무 처리",
        "전문 영역 책임 운영"
      ]
    }
  ],
  axes: [
    {
      axisId: "work_focus",
      label: "업무 초점",
      values: ["내부 운영", "프로세스 설계", "대외 대응", "전문 기능"]
    },
    {
      axisId: "responsibility_scope",
      label: "책임 범위",
      values: ["단순 처리", "운영 관리", "구조 설계", "전문 책임"]
    },
    {
      axisId: "interaction_target",
      label: "상호작용 대상",
      values: ["내부 구성원", "조직 전체", "외부 민원", "전문 이해관계자"]
    }
  ],
  adjacentFamilies: [
    "총무",
    "인사",
    "재무",
    "고객지원"
  ],
  boundaryHints: [
    "정책 설계와 운영 구조 개선 비중이 커지면 기획/운영 영역으로 이동",
    "외부 민원 및 고객 대응 비중이 커지면 서비스/민원 영역으로 이동",
    "특정 기능(인사/재무 등) 전문성이 강화되면 해당 기능 직무로 이동",
    "단순 문서 및 지원 업무가 중심이면 일반 행정으로 유지"
  ],
  summaryTemplate: "이 직무는 조직의 운영을 유지하기 위해 문서, 절차, 요청을 관리하는 행정 역할입니다. 업무 초점이 내부 운영, 대외 대응, 또는 전문 기능으로 이동함에 따라 세부 행정 영역이 달라질 수 있습니다."
};
