export const JOB_ONTOLOGY_ITEM = {
  vertical: "RESEARCH_PROFESSIONAL",
  subVertical: "LEGAL",
  aliases: [
    "법무",
    "사내변호사",
    "in-house counsel",
    "legal counsel",
    "corporate legal",
    "법률 자문",
    "legal affairs",
    "compliance legal",
    "계약 검토",
    "contract review"
  ],
  families: [
    {
      id: "contract_legal",
      label: "계약 법무",
      aliases: [
        "계약 법무",
        "contract legal",
        "계약 검토",
        "계약서 작성",
        "contract management"
      ],
      strongSignals: [
        "계약서 작성 및 검토",
        "조항 수정 및 협상 대응",
        "표준 계약서 템플릿 관리",
        "계약 리스크 검토",
        "거래 구조 기반 계약 설계"
      ],
      mediumSignals: [
        "사업부 요청 기반 계약 대응",
        "계약 협상 참여",
        "외부 법률 자문과 협업"
      ],
      boundarySignals: [
        "규제 해석보다 계약 문구 조정이 핵심일 때",
        "분쟁 대응보다 사전 계약 리스크 관리가 중심일 때",
        "정책 설정보다 개별 계약 단위 업무가 많을 때"
      ],
      adjacentFamilies: ["compliance_legal", "dispute_resolution"],
      boundaryNote: "계약서 작성과 조항 협상이 핵심일 때 해당 영역으로 읽히며, 규제 해석이나 내부 정책 수립 비중이 커지면 컴플라이언스로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 계약서 작성과 검토를 통해 거래 리스크를 관리하는 역할입니다. 반면 규제 해석이나 정책 수립 비중이 커지면 다른 법무 영역으로 해석될 수 있습니다."
    },
    {
      id: "compliance_legal",
      label: "컴플라이언스 법무",
      aliases: [
        "컴플라이언스",
        "compliance",
        "규제 대응",
        "내부통제",
        "compliance legal"
      ],
      strongSignals: [
        "법령 및 규제 해석",
        "내부 정책 및 가이드라인 수립",
        "컴플라이언스 교육 운영",
        "감사 대응 및 리스크 점검",
        "규제 변화 모니터링"
      ],
      mediumSignals: [
        "내부 부서 자문",
        "정책 문서 작성",
        "리스크 평가 보고"
      ],
      boundarySignals: [
        "계약 단위 업무보다 조직 단위 정책 관리가 중심일 때",
        "분쟁 대응보다 사전 예방 활동이 많은 경우",
        "법률 자문보다 운영 통제 성격이 강할 때"
      ],
      adjacentFamilies: ["contract_legal", "dispute_resolution"],
      boundaryNote: "규제 해석과 내부 통제 설계가 핵심일 때 해당 영역으로 읽히며, 계약 중심 업무가 많아지면 계약 법무로 이동합니다.",
      summaryTemplate: "이 직무는 법령 준수를 위한 정책과 통제를 설계하고 운영하는 역할입니다. 반면 개별 계약 검토 비중이 커지면 계약 법무로 해석될 수 있습니다."
    },
    {
      id: "dispute_resolution",
      label: "분쟁 및 소송 대응",
      aliases: [
        "소송 대응",
        "분쟁 대응",
        "litigation",
        "dispute resolution",
        "legal dispute"
      ],
      strongSignals: [
        "소송 전략 수립",
        "외부 로펌 관리",
        "분쟁 대응 및 협상",
        "법적 리스크 대응",
        "사건별 대응 전략 실행"
      ],
      mediumSignals: [
        "증거 자료 정리",
        "법원 제출 문서 검토",
        "분쟁 관련 내부 커뮤니케이션"
      ],
      boundarySignals: [
        "사전 예방보다 사후 대응 비중이 클 때",
        "계약 설계보다 분쟁 해결 중심일 때",
        "정책 수립보다 사건 대응 중심일 때"
      ],
      adjacentFamilies: ["contract_legal", "compliance_legal"],
      boundaryNote: "소송과 분쟁 대응이 주요 책임일 때 해당 영역으로 읽히며, 사전 리스크 관리 중심이면 다른 법무 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 소송과 분쟁 상황에서 법적 대응 전략을 수립하고 실행하는 역할입니다. 반면 사전 예방 중심 업무가 많아지면 다른 법무 영역으로 해석될 수 있습니다."
    },
    {
      id: "business_legal_advisory",
      label: "사업 법무 자문",
      aliases: [
        "사업 법무",
        "legal advisory",
        "business legal",
        "법률 자문",
        "사업부 법무"
      ],
      strongSignals: [
        "사업 구조에 대한 법률 자문",
        "신규 서비스/제품 법적 검토",
        "사업 의사결정 지원",
        "리스크 기반 의사결정 참여",
        "다양한 법률 이슈 종합 검토"
      ],
      mediumSignals: [
        "다부서 협업",
        "비정형 이슈 대응",
        "경영진 보고"
      ],
      boundarySignals: [
        "계약 단일 업무보다 다양한 이슈 대응이 많을 때",
        "정책 수립보다 사업 지원 비중이 클 때",
        "분쟁 대응보다 사전 자문 중심일 때"
      ],
      adjacentFamilies: ["contract_legal", "compliance_legal"],
      boundaryNote: "사업 의사결정 지원과 자문이 중심일 때 해당 영역으로 읽히며, 계약 중심으로 좁아지면 계약 법무로 이동합니다.",
      summaryTemplate: "이 직무는 사업 전반에 걸쳐 법률 자문을 제공하며 의사결정을 지원하는 역할입니다. 반면 특정 업무 영역 비중이 커지면 다른 법무 전문 영역으로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "legal_counsel",
      label: "사내변호사",
      aliases: [
        "in-house counsel",
        "legal counsel"
      ],
      family: "business_legal_advisory",
      responsibilityHints: [
        "사업 법률 자문",
        "리스크 검토",
        "경영진 의사결정 지원"
      ],
      levelHints: [
        "주니어: 자문 지원 및 리서치",
        "시니어: 주요 의사결정 자문 리딩"
      ]
    },
    {
      id: "contract_lawyer",
      label: "계약 법무 담당",
      aliases: [
        "contract lawyer",
        "계약 담당 변호사"
      ],
      family: "contract_legal",
      responsibilityHints: [
        "계약서 작성 및 검토",
        "협상 지원",
        "표준 계약 관리"
      ],
      levelHints: [
        "주니어: 계약 검토 지원",
        "시니어: 협상 리딩 및 구조 설계"
      ]
    },
    {
      id: "compliance_officer",
      label: "컴플라이언스 담당",
      aliases: [
        "compliance officer",
        "준법감시인"
      ],
      family: "compliance_legal",
      responsibilityHints: [
        "규제 해석",
        "내부 정책 수립",
        "감사 대응"
      ],
      levelHints: [
        "주니어: 정책 운영 지원",
        "시니어: 컴플라이언스 체계 설계"
      ]
    },
    {
      id: "litigation_counsel",
      label: "소송 담당 변호사",
      aliases: [
        "litigation counsel",
        "분쟁 담당 변호사"
      ],
      family: "dispute_resolution",
      responsibilityHints: [
        "소송 대응",
        "외부 로펌 관리",
        "분쟁 전략 수립"
      ],
      levelHints: [
        "주니어: 사건 지원",
        "시니어: 전략 리딩 및 주요 사건 담당"
      ]
    }
  ],
  axes: [
    {
      axisId: "time_focus",
      label: "사전 예방 vs 사후 대응",
      values: ["사전 예방 중심", "혼합", "사후 대응 중심"]
    },
    {
      axisId: "scope",
      label: "업무 범위",
      values: ["계약 단위", "사업 단위", "조직/정책 단위"]
    }
  ],
  adjacentFamilies: ["risk_management", "policy_strategy"],
  boundaryHints: [
    "계약서 작성 비중이 많아지면 계약 법무로 이동합니다.",
    "규제 해석과 내부 통제 비중이 커지면 컴플라이언스로 이동합니다.",
    "소송 및 분쟁 대응 비중이 커지면 분쟁 대응 영역으로 이동합니다.",
    "사업 의사결정 지원이 중심이 되면 사업 법무 자문으로 해석됩니다."
  ],
  summaryTemplate: "이 직무는 법률 리스크를 관리하고 사업과 조직을 법적으로 지원하는 역할입니다. 반면 특정 업무 영역 비중에 따라 계약, 컴플라이언스, 분쟁 대응 등으로 세분화될 수 있습니다."
};
