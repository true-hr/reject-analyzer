export const JOB_ONTOLOGY_ITEM = {
  vertical: "PUBLIC_ADMINISTRATION_SUPPORT",
  subVertical: "CIVIL_SERVICE_FIELD_SUPPORT",
  aliases: [
    "민원응대",
    "민원처리",
    "고객응대 행정",
    "현장지원",
    "현장 행정지원",
    "front desk",
    "customer service desk",
    "민원 창구",
    "현장 운영 지원",
    "현장 스태프"
  ],
  families: [
    {
      id: "civil_service_frontdesk",
      label: "민원 창구 응대",
      aliases: [
        "민원 창구",
        "front desk",
        "고객 응대 창구",
        "접수 창구",
        "민원 상담"
      ],
      strongSignals: [
        "민원 접수 및 응대",
        "방문 고객 안내",
        "대면 상담 및 안내",
        "민원 서류 접수 처리",
        "즉시 응대 및 해결"
      ],
      mediumSignals: [
        "전화 응대",
        "기초 문의 대응",
        "민원 분류 및 전달",
        "간단한 서류 작성 안내"
      ],
      boundarySignals: [
        "현장 운영 관리 비중 증가",
        "사후 처리 및 백오피스 처리 비중 증가",
        "단순 안내보다 문제 해결 책임 증가"
      ],
      adjacentFamilies: [
        "civil_service_processing",
        "field_operation_support"
      ],
      boundaryNote: "단순 접수·안내를 넘어 처리 결과까지 책임지는 비중이 커지면 민원 처리 중심으로 이동합니다. 반대로 현장 운영이나 인력/동선 관리가 늘어나면 현장 운영 지원으로 해석됩니다.",
      summaryTemplate: "이 직무는 민원 창구에서 방문자 응대와 접수를 수행하는 성격이 강합니다. 처리 책임이나 운영 관리 비중이 커지면 다른 지원 영역으로 경계가 이동할 수 있습니다."
    },
    {
      id: "civil_service_processing",
      label: "민원 처리·백오피스",
      aliases: [
        "민원 처리",
        "민원 행정",
        "case handling",
        "back office processing",
        "민원 서류 처리"
      ],
      strongSignals: [
        "민원 내용 검토 및 처리",
        "서류 심사 및 승인 절차 진행",
        "처리 결과 통보",
        "민원 이력 관리",
        "관련 부서 협업 처리"
      ],
      mediumSignals: [
        "민원 분류 및 우선순위 설정",
        "처리 지연 대응",
        "기초 데이터 입력",
        "처리 기준 참고"
      ],
      boundarySignals: [
        "대면 응대 비중 증가",
        "현장 운영 관리 역할 증가",
        "단순 입력 업무 비중 증가"
      ],
      adjacentFamilies: [
        "civil_service_frontdesk",
        "data_entry_support"
      ],
      boundaryNote: "처리보다 대면 응대 비중이 커지면 창구 응대로 이동합니다. 처리 기준 없이 단순 입력 위주가 되면 데이터 입력 지원으로 해석될 수 있습니다.",
      summaryTemplate: "이 직무는 접수된 민원을 검토하고 처리 결과를 만들어내는 행정 처리 성격이 강합니다. 응대 중심이나 단순 입력 중심으로 바뀌면 다른 경계로 이동할 수 있습니다."
    },
    {
      id: "field_operation_support",
      label: "현장 운영 지원",
      aliases: [
        "현장 운영",
        "현장 지원",
        "site support",
        "운영 스태프",
        "현장 관리"
      ],
      strongSignals: [
        "현장 동선 관리",
        "대기열 및 혼잡도 관리",
        "현장 인력 배치 보조",
        "행사/시설 운영 지원",
        "현장 문제 즉시 대응"
      ],
      mediumSignals: [
        "기초 안내",
        "운영 체크리스트 수행",
        "현장 상황 보고",
        "간단한 민원 응대"
      ],
      boundarySignals: [
        "민원 접수 및 상담 비중 증가",
        "서류 처리 및 행정 처리 비중 증가",
        "단순 반복 안내 업무 비중 증가"
      ],
      adjacentFamilies: [
        "civil_service_frontdesk",
        "civil_service_processing"
      ],
      boundaryNote: "현장 운영보다 민원 접수·상담 비중이 커지면 창구 응대로 이동합니다. 반대로 행정 처리 비중이 커지면 민원 처리 영역으로 해석됩니다.",
      summaryTemplate: "이 직무는 현장의 흐름과 운영을 안정적으로 유지하는 지원 역할이 중심입니다. 민원 응대나 행정 처리 비중이 커지면 다른 영역으로 경계가 이동할 수 있습니다."
    }
  ],
  roles: [
    {
      id: "frontdesk_officer",
      label: "민원 창구 담당",
      aliases: [
        "민원 상담원",
        "front desk officer",
        "접수 담당"
      ],
      family: "civil_service_frontdesk",
      responsibilityHints: [
        "민원 접수 및 안내",
        "방문자 응대",
        "기초 상담"
      ],
      levelHints: [
        "주니어: 안내 및 접수 중심",
        "시니어: 복잡 민원 1차 대응 포함"
      ]
    },
    {
      id: "civil_service_processor",
      label: "민원 처리 담당",
      aliases: [
        "민원 처리자",
        "case handler"
      ],
      family: "civil_service_processing",
      responsibilityHints: [
        "민원 검토 및 처리",
        "서류 심사",
        "결과 통보"
      ],
      levelHints: [
        "주니어: 단순 처리 중심",
        "시니어: 복잡 케이스 및 협업 처리"
      ]
    },
    {
      id: "field_support_staff",
      label: "현장 운영 스태프",
      aliases: [
        "현장 지원",
        "site staff"
      ],
      family: "field_operation_support",
      responsibilityHints: [
        "현장 동선 및 인력 지원",
        "혼잡 관리",
        "현장 이슈 대응"
      ],
      levelHints: [
        "주니어: 현장 안내 및 보조",
        "시니어: 운영 안정성 관리 및 조율"
      ]
    }
  ],
  axes: [
    {
      axisId: "interaction_vs_processing",
      label: "대면 응대 vs 처리 중심",
      values: [
        "대면 응대 및 접수 중심",
        "행정 처리 및 결과 도출 중심"
      ]
    },
    {
      axisId: "operation_involvement",
      label: "현장 운영 관여도",
      values: [
        "현장 흐름 및 운영 관리 포함",
        "운영 관여 낮고 응대/처리 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "customer_service_non_public",
    "security_or_facility_support"
  ],
  boundaryHints: [
    "대면 응대와 접수 비중이 높아지면 창구 응대로 읽힙니다.",
    "처리 결과 책임과 서류 검토 비중이 커지면 민원 처리로 이동합니다.",
    "현장 동선 관리와 운영 안정성 책임이 커지면 현장 운영 지원으로 해석됩니다.",
    "단순 반복 안내나 입력 비중이 높아지면 다른 지원 직무로 경계가 이동할 수 있습니다."
  ],
  summaryTemplate: "이 직무는 민원 응대, 처리, 현장 운영 지원으로 구성되며 대면 응대와 처리, 운영 관여도의 균형에 따라 역할이 나뉩니다. 특정 책임 비중이 커지면 각 세부 영역으로 경계가 구분됩니다."
};
