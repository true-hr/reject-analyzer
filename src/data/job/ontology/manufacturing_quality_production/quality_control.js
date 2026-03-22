export const JOB_ONTOLOGY_ITEM = {
  vertical: "MANUFACTURING_QUALITY_PRODUCTION",
  subVertical: "QUALITY_CONTROL",
  aliases: [
    "품질관리",
    "QC",
    "Quality Control",
    "제품 품질관리",
    "공정 품질관리",
    "검사",
    "품질 검사",
    "Inspection",
    "수입검사",
    "출하검사",
    "공정검사",
    "IPQC",
    "IQC",
    "OQC",
    "Final Inspection",
    "품질 검사원",
    "품질 운영",
    "Quality Inspection",
    "현장 품질관리",
    "라인 품질관리"
  ],
  families: [
    {
      id: "incoming_quality_control",
      label: "수입검사(IQC)",
      aliases: [
        "IQC",
        "수입검사",
        "Incoming Inspection",
        "자재 검사",
        "부품 검사"
      ],
      strongSignals: [
        "입고된 자재나 부품을 검사 기준에 따라 검수한다",
        "샘플링 기준(AQL 등)에 따라 검사 계획을 수행한다",
        "불량 자재를 식별하고 격리 및 반품 처리를 진행한다",
        "공급사 품질 문제를 기록하고 피드백을 전달한다",
        "검사 성적서, 검사 기록을 관리한다"
      ],
      mediumSignals: [
        "입고 LOT 단위로 검사 여부를 결정한다",
        "검사 장비를 활용해 규격 적합 여부를 확인한다",
        "품질 기준서와 검사 기준을 참조한다",
        "공급사별 품질 이력을 관리한다"
      ],
      boundarySignals: [
        "공정 중 품질 이상 대응 비중이 커지면 process QC family로 이동한다",
        "출하 전 최종 품질 확인 비중이 커지면 final QC family로 이동한다",
        "공급사 평가와 개선 활동 비중이 커지면 QA 또는 SQE 영역으로 이동한다",
        "단순 검사 수행이 아닌 기준 설계가 중심이면 품질기획 영역으로 이동한다"
      ],
      adjacentFamilies: [
        "process_quality_control",
        "final_quality_control",
        "supplier_quality_management"
      ],
      boundaryNote: "수입검사는 입고 시점의 품질 적합 여부를 판단하는 역할입니다. 반면 공정 내 대응이나 공급사 개선 비중이 커지면 다른 품질 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 입고 자재와 부품의 품질을 검사해 불량 유입을 차단하는 성격이 강합니다. 반면 공정 대응이나 공급사 개선 비중이 커지면 다른 품질관리 경계로 읽힐 수 있습니다."
    },
    {
      id: "process_quality_control",
      label: "공정 품질관리(IPQC)",
      aliases: [
        "IPQC",
        "공정검사",
        "공정 품질관리",
        "In-process QC",
        "라인 품질관리",
        "현장 QC"
      ],
      strongSignals: [
        "생산 공정 중 품질 이상을 모니터링하고 대응한다",
        "공정 조건, 작업 방식에 따른 품질 변화를 관리한다",
        "불량 발생 시 즉시 원인 파악과 조치를 수행한다",
        "작업자 및 공정별 품질 상태를 점검한다",
        "공정 품질 기록과 데이터를 관리한다"
      ],
      mediumSignals: [
        "공정별 검사 포인트를 설정하고 점검한다",
        "불량률, defect trend를 분석한다",
        "현장 작업자와 협업해 품질 이슈를 해결한다",
        "품질 기준 준수 여부를 지속적으로 확인한다"
      ],
      boundarySignals: [
        "최종 제품 출하 전 검사 비중이 커지면 final QC family로 이동한다",
        "검사보다 공정 개선 설계 비중이 커지면 품질개선/QA 영역으로 이동한다",
        "데이터 분석과 시스템 개선 중심이면 품질기획/품질엔지니어링으로 이동한다",
        "단순 검사 수행 중심이면 inspection operator 성격으로 읽힌다"
      ],
      adjacentFamilies: [
        "final_quality_control",
        "incoming_quality_control",
        "quality_assurance"
      ],
      boundaryNote: "공정 품질관리는 생산 중 발생하는 품질 이슈를 즉시 통제하는 역할입니다. 반면 개선 설계나 시스템 구축 비중이 커지면 QA 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 생산 공정 중 품질 상태를 모니터링하고 이상을 즉시 대응하는 성격이 강합니다. 반면 개선 설계나 데이터 기반 품질 전략 비중이 커지면 다른 품질 경계로 읽힐 수 있습니다."
    },
    {
      id: "final_quality_control",
      label: "출하검사(OQC)",
      aliases: [
        "OQC",
        "출하검사",
        "Final Inspection",
        "출고 검사",
        "완제품 검사"
      ],
      strongSignals: [
        "출하 전 완제품의 품질을 최종 확인한다",
        "출하 기준에 따라 합격/불합격 판정을 내린다",
        "고객 요구사항과 스펙 충족 여부를 검증한다",
        "출하 불량 발생 시 출하 중지 및 재작업을 지시한다",
        "출하 검사 기록과 품질 데이터를 관리한다"
      ],
      mediumSignals: [
        "검사 체크리스트 기반으로 제품을 검증한다",
        "고객 클레임 예방을 위한 최종 품질 확인 역할을 수행한다",
        "불량 유형을 분류하고 기록한다",
        "출하 승인 프로세스를 운영한다"
      ],
      boundarySignals: [
        "공정 중 품질 대응 비중이 커지면 process QC family로 이동한다",
        "입고 자재 검사 비중이 커지면 incoming QC family로 이동한다",
        "고객 클레임 분석과 품질 개선 비중이 커지면 QA 영역으로 이동한다",
        "단순 검사 수행보다 기준 설계 비중이 커지면 품질기획으로 이동한다"
      ],
      adjacentFamilies: [
        "process_quality_control",
        "incoming_quality_control",
        "quality_assurance"
      ],
      boundaryNote: "출하검사는 고객에게 전달되기 전 마지막 품질 게이트 역할입니다. 반면 공정 대응이나 개선 활동 비중이 커지면 다른 품질 영역으로 이동합니다.",
      summaryTemplate: "이 직무는 출하 전 최종 품질을 확인해 고객 불량을 방지하는 성격이 강합니다. 반면 공정 대응이나 품질 개선 비중이 커지면 다른 품질관리 경계로 읽힐 수 있습니다."
    },
    {
      id: "quality_inspection_execution",
      label: "검사 실행·오퍼레이션",
      aliases: [
        "품질 검사원",
        "Inspection Operator",
        "QC Inspector",
        "검사 담당",
        "품질 검사 실행"
      ],
      strongSignals: [
        "정해진 검사 기준에 따라 제품 또는 자재를 검사한다",
        "검사 장비를 사용해 측정값을 기록한다",
        "불량 여부를 판단하고 분류한다",
        "검사 결과를 시스템 또는 문서에 입력한다",
        "검사 프로세스를 반복적으로 수행한다"
      ],
      mediumSignals: [
        "작업 지시서와 검사 기준서를 기반으로 업무를 수행한다",
        "검사 속도와 정확도가 중요한 역할이다",
        "표준화된 절차를 준수한다",
        "현장 중심의 반복 업무 비중이 높다"
      ],
      boundarySignals: [
        "검사 기준 설계와 품질 정책 수립 비중이 커지면 품질기획/QA 영역으로 이동한다",
        "공정 중 문제 해결과 대응 비중이 커지면 process QC family로 이동한다",
        "데이터 분석과 개선 활동 비중이 커지면 품질엔지니어링으로 이동한다",
        "단순 작업 비중이 높고 판단이 제한되면 생산 오퍼레이션으로 읽힌다"
      ],
      adjacentFamilies: [
        "process_quality_control",
        "incoming_quality_control",
        "final_quality_control"
      ],
      boundaryNote: "검사 실행은 정해진 기준을 정확히 수행하는 역할입니다. 반면 기준 설계나 문제 해결 비중이 커지면 다른 품질 역할로 이동합니다.",
      summaryTemplate: "이 직무는 정해진 검사 기준에 따라 품질을 확인하고 기록하는 실행 성격이 강합니다. 반면 문제 해결이나 기준 설계 비중이 커지면 다른 품질관리 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "qc_inspector",
      label: "QC Inspector",
      aliases: [
        "품질 검사원",
        "QC Inspector",
        "검사 담당"
      ],
      family: "quality_inspection_execution",
      responsibilityHints: [
        "제품 및 자재를 검사 기준에 따라 검수한다",
        "검사 결과를 기록하고 불량을 분류한다",
        "검사 장비를 활용해 측정을 수행한다"
      ],
      levelHints: [
        "정형화된 검사 절차 수행 중심",
        "경험이 쌓일수록 불량 판단 정확도와 속도 향상"
      ]
    },
    {
      id: "iqc_specialist",
      label: "IQC Specialist",
      aliases: [
        "수입검사 담당",
        "IQC",
        "Incoming QC"
      ],
      family: "incoming_quality_control",
      responsibilityHints: [
        "입고 자재의 품질을 검사한다",
        "불량 자재를 식별하고 처리한다",
        "공급사 품질 데이터를 관리한다"
      ],
      levelHints: [
        "검사 수행에서 시작",
        "공급사 품질 이력 관리 및 개선 대응으로 확장"
      ]
    },
    {
      id: "ipqc_specialist",
      label: "IPQC Specialist",
      aliases: [
        "공정 품질 담당",
        "IPQC",
        "라인 QC"
      ],
      family: "process_quality_control",
      responsibilityHints: [
        "공정 중 품질 상태를 점검한다",
        "불량 발생 시 즉시 대응한다",
        "공정 품질 데이터를 관리한다"
      ],
      levelHints: [
        "현장 대응 중심 역할",
        "복잡한 공정 문제 해결 능력으로 확장"
      ]
    },
    {
      id: "oqc_specialist",
      label: "OQC Specialist",
      aliases: [
        "출하검사 담당",
        "OQC",
        "Final QC"
      ],
      family: "final_quality_control",
      responsibilityHints: [
        "출하 전 제품을 최종 검사한다",
        "합격/불합격 판정을 내린다",
        "출하 품질 데이터를 관리한다"
      ],
      levelHints: [
        "검사 수행 중심",
        "고객 요구 기준 이해 및 판단력 중요"
      ]
    },
    {
      id: "qc_manager",
      label: "QC Manager",
      aliases: [
        "품질관리 매니저",
        "QC Manager",
        "품질관리 책임자"
      ],
      family: "process_quality_control",
      responsibilityHints: [
        "품질 검사 및 공정 품질 관리를 총괄한다",
        "품질 KPI를 관리하고 개선한다",
        "현장 품질 이슈 대응을 리드한다"
      ],
      levelHints: [
        "개별 검사보다 전체 품질 운영 관리 중심",
        "조직 간 협업과 의사결정 영향력 증가"
      ]
    }
  ],
  axes: [
    {
      axisId: "inspection_stage",
      label: "검사 단계",
      values: [
        "입고 단계 검사",
        "공정 중 검사",
        "출하 전 검사"
      ]
    },
    {
      axisId: "execution_vs_control",
      label: "실행 vs 통제",
      values: [
        "정해진 검사 수행 중심",
        "공정 품질 통제 및 대응 중심",
        "품질 판단 및 승인 중심"
      ]
    },
    {
      axisId: "problem_response",
      label: "문제 대응 방식",
      values: [
        "불량 식별 및 분류",
        "현장 즉시 대응 및 조치",
        "출하 차단 및 승인 관리"
      ]
    },
    {
      axisId: "data_usage",
      label: "데이터 활용 수준",
      values: [
        "검사 결과 기록 중심",
        "불량 데이터 분석",
        "품질 트렌드 관리 및 개선 연결"
      ]
    }
  ],
  adjacentFamilies: [
    "quality_assurance",
    "supplier_quality_management",
    "manufacturing_engineering",
    "production_operations"
  ],
  boundaryHints: [
    "품질 기준 설계와 시스템 구축 비중이 커지면 QA 영역으로 이동합니다.",
    "공급사 품질 개선과 평가 비중이 커지면 SQE 영역으로 읽힙니다.",
    "생산 공정 개선과 기술 설계 비중이 커지면 제조/공정 엔지니어링으로 이동합니다.",
    "단순 검사 수행 비중이 높아지고 판단이 제한되면 생산 오퍼레이션으로 읽힙니다.",
    "현장 대응보다 데이터 분석과 개선 활동 비중이 커지면 품질 엔지니어링으로 이동합니다."
  ],
  summaryTemplate: "품질관리(QC)는 제품과 공정의 품질을 검사하고 이상을 통제하는 성격이 강합니다. 같은 QC 내에서도 입고, 공정, 출하 단계 중 어디에 집중하느냐에 따라 역할이 달라집니다. 반면 품질 기준 설계나 개선 활동 비중이 커지면 QA 또는 엔지니어링 영역으로 읽힐 수 있습니다."
};
