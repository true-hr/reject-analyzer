export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "CIRCUIT_DESIGN",
  aliases: [
    "회로설계",
    "회로 설계",
    "circuit design",
    "hardware design",
    "HW 설계",
    "전자회로설계",
    "아날로그 회로설계",
    "디지털 회로설계",
    "보드 설계",
    "PCB 회로설계",
    "전장 회로설계",
    "회로 엔지니어",
    "하드웨어 엔지니어"
  ],
  families: [
    {
      id: "ANALOG_POWER_CIRCUIT",
      label: "아날로그/전원 회로설계형",
      aliases: [
        "analog circuit design",
        "power circuit design",
        "PMIC 설계",
        "전원회로 설계"
      ],
      strongSignals: [
        "아날로그 신호 경로 설계",
        "전원부 설계 및 안정성 검토",
        "OP AMP, ADC, DAC, LDO, DC-DC 회로 설계",
        "노이즈, 리플, 발열, EMI 대응 검토",
        "센서 인터페이스 회로 설계",
        "전압/전류 특성 측정 및 튜닝",
        "회로 시뮬레이션으로 파라미터 최적화"
      ],
      mediumSignals: [
        "SPICE 기반 시뮬레이션 수행",
        "부품 선정 및 대체 검토",
        "실측 기반 튜닝",
        "보드 bring-up 지원",
        "회로 안정성 검증"
      ],
      boundarySignals: [
        "MCU, FPGA, 인터페이스 로직 중심 비중이 커지면 디지털/로직 회로설계형으로 이동",
        "PCB 적층, 배선, EMI layout 제약 중심 비중이 커지면 보드/PCB 회로설계형으로 이동",
        "시험 규격 검증과 불량 재현 중심 비중이 커지면 하드웨어 검증/테스트 경계로 이동"
      ],
      adjacentFamilies: [
        "DIGITAL_LOGIC_CIRCUIT",
        "BOARD_PCB_CIRCUIT",
        "HARDWARE_VALIDATION_TEST"
      ],
      boundaryNote: "아날로그 신호 품질과 전원 안정성을 설계로 해결하는 비중이 크면 아날로그/전원 회로설계형으로 읽힙니다. 반면 디지털 제어 구조나 PCB 구현 제약이 더 핵심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 아날로그 신호 품질과 전원 안정성을 회로 수준에서 설계하는 성격이 강합니다. 반면 디지털 제어나 PCB 구현 제약 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "DIGITAL_LOGIC_CIRCUIT",
      label: "디지털/로직 회로설계형",
      aliases: [
        "digital circuit design",
        "logic design",
        "MCU 회로설계",
        "FPGA 주변회로 설계"
      ],
      strongSignals: [
        "MCU, MPU, FPGA 주변회로 설계",
        "고속 디지털 인터페이스 회로 설계",
        "GPIO, clock, reset, memory interface 설계",
        "통신 인터페이스(UART, SPI, I2C, CAN, Ethernet 등) 회로 설계",
        "전원 시퀀싱과 로직 연동 설계",
        "디지털 신호 무결성 고려한 회로 구성",
        "펌웨어 팀과 HW/SW 인터페이스 정의"
      ],
      mediumSignals: [
        "핀맵/인터페이스 정의",
        "시퀀스 검토",
        "bring-up 중 부팅/통신 이슈 분석",
        "부품 선정 및 호환성 검토",
        "회로도 기반 디버깅"
      ],
      boundarySignals: [
        "전원, 센서, 증폭 등 아날로그 특성 최적화 비중이 커지면 아날로그/전원 회로설계형으로 이동",
        "배선 길이, impedance, stack-up, EMI layout 제약 비중이 커지면 보드/PCB 회로설계형으로 이동",
        "검증 시나리오와 인증 시험 대응 비중이 커지면 하드웨어 검증/테스트 경계로 이동"
      ],
      adjacentFamilies: [
        "ANALOG_POWER_CIRCUIT",
        "BOARD_PCB_CIRCUIT",
        "HARDWARE_VALIDATION_TEST"
      ],
      boundaryNote: "디지털 제어 구조와 인터페이스 연결을 설계하는 비중이 크면 디지털/로직 회로설계형으로 읽힙니다. 반면 신호 품질 튜닝이나 PCB 구현 제약이 더 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 디지털 제어 구조와 인터페이스 연결을 회로로 구현하는 성격이 강합니다. 반면 아날로그 특성 최적화나 PCB 구현 제약 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "BOARD_PCB_CIRCUIT",
      label: "보드/PCB 구현 중심형",
      aliases: [
        "board design",
        "PCB circuit design",
        "hardware board design",
        "PCB 회로설계"
      ],
      strongSignals: [
        "회로도와 PCB layout 연계 설계",
        "부품 배치와 배선 제약 검토",
        "stack-up, impedance, EMI/EMC 고려",
        "고속 신호 routing 제약 관리",
        "PCB 제작 이슈 반영한 회로 수정",
        "BOM 확정과 생산성 고려 설계",
        "layout 엔지니어 또는 외주 PCB 협업"
      ],
      mediumSignals: [
        "Gerber 전 검토",
        "DFM/DFT 검토",
        "부품 footprint 검토",
        "양산 이슈 반영 ECO",
        "보드 수정 이력 관리"
      ],
      boundarySignals: [
        "핵심이 아날로그 성능 튜닝이면 아날로그/전원 회로설계형으로 이동",
        "핵심이 MCU/FPGA 인터페이스 구조 설계면 디지털/로직 회로설계형으로 이동",
        "양산 불량 분석과 시험 재현 비중이 커지면 하드웨어 검증/테스트 또는 생산기술 경계로 이동"
      ],
      adjacentFamilies: [
        "ANALOG_POWER_CIRCUIT",
        "DIGITAL_LOGIC_CIRCUIT",
        "HARDWARE_VALIDATION_TEST",
        "PRODUCTION_ENGINEERING"
      ],
      boundaryNote: "회로 원리보다 실제 보드 구현과 배선 제약 대응 비중이 크면 보드/PCB 구현 중심형으로 읽힙니다. 반면 회로 원리 설계나 검증 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 회로를 실제 보드와 PCB로 안정적으로 구현하는 성격이 강합니다. 반면 회로 원리 설계나 시험 검증 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "PRODUCT_INTEGRATION_CIRCUIT",
      label: "제품 통합/양산 연계형",
      aliases: [
        "product hardware design",
        "integration circuit design",
        "양산 연계 HW 설계",
        "제품화 회로설계"
      ],
      strongSignals: [
        "제품 사양에 맞춘 회로 아키텍처 구성",
        "기구, 펌웨어, 생산 부서와 제품 통합 설계",
        "원가/부품수급/양산성 반영 회로 수정",
        "ECO 반영 및 양산 전 회로 변경 관리",
        "인증/신뢰성 요구사항 반영",
        "샘플-시제품-양산 이행 단계 설계 관리",
        "제품 출시 일정에 맞춘 회로 의사결정"
      ],
      mediumSignals: [
        "대체 부품 검토",
        "양산 이슈 피드백 반영",
        "인증 대응용 회로 보완",
        "개발 일정 관리",
        "유관부서 인터페이스 정리"
      ],
      boundarySignals: [
        "핵심이 특정 아날로그 성능 최적화면 아날로그/전원 회로설계형으로 이동",
        "핵심이 디지털 인터페이스 구조 설계면 디지털/로직 회로설계형으로 이동",
        "양산 공정 조건과 제조성 개선 비중이 더 크면 생산기술 경계로 이동"
      ],
      adjacentFamilies: [
        "ANALOG_POWER_CIRCUIT",
        "DIGITAL_LOGIC_CIRCUIT",
        "PRODUCTION_ENGINEERING",
        "HARDWARE_PM"
      ],
      boundaryNote: "회로 성능 자체보다 제품 사양, 일정, 양산성을 함께 맞추는 책임이 크면 제품 통합/양산 연계형으로 읽힙니다. 반면 특정 회로 원리 설계 깊이가 더 핵심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 회로를 제품 사양과 양산 조건에 맞게 통합하는 성격이 강합니다. 반면 특정 회로 원리 최적화나 제조 공정 개선 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "ANALOG_HARDWARE_ENGINEER",
      label: "아날로그 하드웨어 엔지니어",
      aliases: [
        "analog hardware engineer",
        "전원회로 엔지니어"
      ],
      family: "ANALOG_POWER_CIRCUIT",
      responsibilityHints: [
        "전원부 설계",
        "아날로그 신호 경로 설계",
        "노이즈/발열/안정성 튜닝",
        "실측 기반 회로 최적화"
      ],
      levelHints: [
        "주니어는 회로도 수정과 측정 지원 비중이 크고",
        "시니어는 구조 결정과 성능 trade-off 판단 비중이 커집니다"
      ]
    },
    {
      id: "DIGITAL_HARDWARE_ENGINEER",
      label: "디지털 하드웨어 엔지니어",
      aliases: [
        "digital hardware engineer",
        "로직 회로 엔지니어"
      ],
      family: "DIGITAL_LOGIC_CIRCUIT",
      responsibilityHints: [
        "MCU/FPGA 주변회로 설계",
        "인터페이스 정의",
        "부팅/통신 이슈 분석",
        "HW/SW 연동 검토"
      ],
      levelHints: [
        "주니어는 인터페이스 구현과 디버깅 비중이 크고",
        "시니어는 시스템 구조와 인터페이스 아키텍처 책임이 커집니다"
      ]
    },
    {
      id: "PCB_HARDWARE_ENGINEER",
      label: "보드 하드웨어 엔지니어",
      aliases: [
        "PCB hardware engineer",
        "board design engineer"
      ],
      family: "BOARD_PCB_CIRCUIT",
      responsibilityHints: [
        "PCB 구현 제약 검토",
        "배선/배치 협업",
        "EMI/EMC 대응",
        "양산 반영 ECO 관리"
      ],
      levelHints: [
        "주니어는 layout 협업과 수정 반영 비중이 크고",
        "시니어는 구현 전략과 양산성 판단 책임이 커집니다"
      ]
    },
    {
      id: "PRODUCT_HARDWARE_ENGINEER",
      label: "제품 하드웨어 엔지니어",
      aliases: [
        "product hardware engineer",
        "HW 개발 엔지니어"
      ],
      family: "PRODUCT_INTEGRATION_CIRCUIT",
      responsibilityHints: [
        "제품 사양 기반 회로 구성",
        "유관부서 통합 조율",
        "원가/수급/인증 반영",
        "시제품-양산 이행 관리"
      ],
      levelHints: [
        "주니어는 변경 반영과 협업 지원 비중이 크고",
        "시니어는 제품 단위 의사결정과 통합 책임이 커집니다"
      ]
    }
  ],
  axes: [
    {
      axisId: "signal_domain",
      label: "주로 다루는 신호/전기 특성",
      values: [
        "아날로그/전원 특성 중심",
        "디지털 로직/인터페이스 중심",
        "PCB 구현/배선 특성 중심",
        "제품 통합과 양산 조건 중심"
      ]
    },
    {
      axisId: "design_constraint",
      label: "설계를 가장 많이 가르는 제약",
      values: [
        "노이즈/안정성/발열",
        "부팅/통신/로직 연결",
        "stack-up/EMI/배치배선",
        "원가/일정/양산성/인증"
      ]
    },
    {
      axisId: "collaboration_pattern",
      label: "가장 많이 붙는 협업 대상",
      values: [
        "측정/시험 및 부품 엔지니어",
        "펌웨어/임베디드 개발",
        "PCB layout/제조 파트너",
        "기구/생산/PM/품질"
      ]
    },
    {
      axisId: "problem_solving_stage",
      label: "문제를 주로 해결하는 시점",
      values: [
        "회로 원리와 시뮬레이션 단계",
        "인터페이스 구조 정의 단계",
        "보드 구현과 수정 단계",
        "시제품/양산 전환 단계"
      ]
    }
  ],
  adjacentFamilies: [
    "임베디드개발",
    "하드웨어 검증/테스트",
    "생산기술",
    "기구설계",
    "제품개발 PM"
  ],
  boundaryHints: [
    "노이즈, 전원 안정성, 센서 신호 품질 같은 아날로그 특성 최적화 비중이 커지면 아날로그/전원 회로설계형으로 읽힙니다.",
    "MCU, FPGA, 통신 인터페이스, boot/reset 구조 정의 비중이 커지면 디지털/로직 회로설계형으로 이동합니다.",
    "배선 제약, stack-up, EMI/EMC, DFM 같은 실제 PCB 구현 이슈 비중이 커지면 보드/PCB 구현 중심형으로 이동합니다.",
    "원가, 부품 수급, 인증, 양산 이행처럼 제품 통합 책임 비중이 커지면 제품 통합/양산 연계형으로 이동합니다.",
    "회로를 직접 설계하기보다 시험 시나리오 작성과 불량 재현, 규격 검증 비중이 커지면 하드웨어 검증/테스트 경계로 읽힐 수 있습니다."
  ],
  summaryTemplate: "이 직무는 전자 제품의 기능을 회로 수준에서 정의하고 구현하는 성격이 강합니다. 다만 아날로그 특성 최적화, 디지털 인터페이스 구성, PCB 구현, 제품 통합 중 어디에 책임이 큰지에 따라 해석이 달라집니다. 반면 시험 검증이나 생산 이행 비중이 더 커지면 인접 직무 경계로 읽힐 수 있습니다."
};
