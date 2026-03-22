export const JOB_ONTOLOGY_ITEM = {
  vertical: "ENGINEERING_DEVELOPMENT",
  subVertical: "EMBEDDED_DEVELOPMENT",
  aliases: [
    "임베디드 개발",
    "임베디드 소프트웨어",
    "Embedded",
    "Embedded Software",
    "펌웨어 개발",
    "Firmware",
    "Firmware Engineer",
    "MCU 개발",
    "RTOS 개발",
    "하드웨어 연동 개발",
    "Device Driver",
    "임베디드 시스템",
    "저수준 개발",
    "마이크로컨트롤러 개발"
  ],
  families: [
    {
      id: "firmware_mcu_development",
      label: "펌웨어·MCU 개발",
      aliases: [
        "펌웨어",
        "MCU 개발",
        "Firmware Development",
        "Bare-metal 개발",
        "Low-level 개발"
      ],
      strongSignals: [
        "MCU 기반 펌웨어 작성 (C/C++)",
        "레지스터 단위 하드웨어 제어 코드 작성",
        "GPIO, UART, SPI, I2C 등 인터페이스 제어",
        "부트로더 또는 펌웨어 업데이트 로직 구현",
        "메모리 제약 환경에서 코드 최적화",
        "인터럽트 기반 로직 설계"
      ],
      mediumSignals: [
        "디바이스 동작 테스트 및 디버깅",
        "펌웨어 버전 관리",
        "하드웨어 회로 이해 기반 개발",
        "전력 소비 최적화",
        "펌웨어 릴리즈 관리"
      ],
      boundarySignals: [
        "OS 기반 로직보다 MCU 직접 제어 비중이 크면 이 family에 가깝다",
        "애플리케이션 로직보다 하드웨어 제어 비중이 크면 이 family에 가깝다",
        "드라이버 레벨보다 상위 서비스 로직이 많아지면 다른 family로 이동한다"
      ],
      adjacentFamilies: [
        "embedded_os_rtos",
        "device_driver_bsp",
        "embedded_application"
      ],
      boundaryNote: "운영체제나 애플리케이션 로직보다 MCU 레벨에서 하드웨어를 직접 제어하는 코드 비중이 커질수록 펌웨어·MCU 개발로 읽힙니다. 반면 OS 기반 구조나 상위 로직 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 MCU 기반에서 하드웨어를 직접 제어하는 펌웨어를 개발하는 성격이 강합니다. 저수준 제어와 자원 제약 환경 대응이 핵심입니다. 반면 OS나 애플리케이션 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "device_driver_bsp",
      label: "디바이스 드라이버·BSP",
      aliases: [
        "디바이스 드라이버",
        "Device Driver",
        "BSP",
        "Board Support Package",
        "하드웨어 인터페이스 개발"
      ],
      strongSignals: [
        "디바이스 드라이버 개발 (Linux/RTOS)",
        "커널 모듈 또는 드라이버 레벨 코드 작성",
        "하드웨어와 OS 간 인터페이스 구현",
        "BSP 포팅 및 초기화 코드 작성",
        "디바이스 트리(Device Tree) 설정",
        "하드웨어 리소스 매핑 및 제어"
      ],
      mediumSignals: [
        "커널 로그 분석 및 디버깅",
        "드라이버 성능 최적화",
        "하드웨어 스펙 기반 코드 작성",
        "보드 Bring-up 작업",
        "인터럽트 및 DMA 처리"
      ],
      boundarySignals: [
        "MCU 직접 제어보다 OS와 하드웨어 연결 비중이 크면 이 family에 가깝다",
        "애플리케이션보다 커널/드라이버 레벨 코드 비중이 크면 이 family에 가깝다",
        "하드웨어 초기화보다 서비스 로직이 많아지면 다른 family로 이동한다"
      ],
      adjacentFamilies: [
        "firmware_mcu_development",
        "embedded_os_rtos",
        "embedded_application"
      ],
      boundaryNote: "펌웨어처럼 직접 제어하기보다 OS와 하드웨어를 연결하는 계층에서 개발하는 비중이 커질수록 디바이스 드라이버·BSP로 읽힙니다. 반면 상위 애플리케이션 로직이 많아지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 운영체제와 하드웨어 사이를 연결하는 드라이버와 BSP를 개발하는 성격이 강합니다. 커널 레벨 제어가 핵심입니다. 반면 펌웨어나 애플리케이션 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "embedded_os_rtos",
      label: "임베디드 OS·RTOS",
      aliases: [
        "RTOS",
        "Embedded OS",
        "임베디드 OS",
        "실시간 OS",
        "RTOS 개발"
      ],
      strongSignals: [
        "RTOS 기반 태스크 스케줄링 설계",
        "멀티스레딩 및 동기화 처리",
        "실시간성 요구사항 대응 설계",
        "RTOS 포팅 및 커스터마이징",
        "시스템 자원 관리 (메모리, CPU)",
        "타이머 및 이벤트 기반 처리 설계"
      ],
      mediumSignals: [
        "RTOS API 활용 개발",
        "시스템 성능 튜닝",
        "동시성 문제 디버깅",
        "스케줄링 정책 조정",
        "시스템 안정성 테스트"
      ],
      boundarySignals: [
        "하드웨어 직접 제어보다 OS 레벨 제어 비중이 크면 이 family에 가깝다",
        "애플리케이션보다 시스템 구조 설계 비중이 크면 이 family에 가깝다",
        "드라이버보다 태스크 관리 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "device_driver_bsp",
        "firmware_mcu_development",
        "embedded_application"
      ],
      boundaryNote: "단순 펌웨어 제어보다 OS 기반 태스크 관리와 시스템 구조 설계 비중이 커질수록 임베디드 OS·RTOS로 읽힙니다. 반면 하드웨어 직접 제어나 애플리케이션 로직이 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 RTOS 기반으로 시스템의 동작 구조를 설계하는 성격이 강합니다. 태스크 관리와 실시간 처리 구조가 핵심입니다. 반면 하드웨어 제어나 애플리케이션 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    },
    {
      id: "embedded_application",
      label: "임베디드 애플리케이션",
      aliases: [
        "임베디드 앱",
        "Embedded Application",
        "디바이스 애플리케이션",
        "상위 로직 개발"
      ],
      strongSignals: [
        "디바이스 기능 로직 구현",
        "센서 데이터 처리 및 응용 로직 개발",
        "UI 또는 사용자 인터페이스 로직 구현",
        "네트워크 통신 기능 개발 (WiFi, BLE 등)",
        "상위 서비스 로직 설계",
        "디바이스 기능 통합 및 제어"
      ],
      mediumSignals: [
        "프로토콜 처리",
        "데이터 가공 및 처리",
        "애플리케이션 레벨 디버깅",
        "기능 테스트 및 검증",
        "외부 시스템 연동"
      ],
      boundarySignals: [
        "드라이버보다 기능 로직 비중이 크면 이 family에 가깝다",
        "OS 구조보다 서비스 구현 비중이 크면 이 family에 가깝다",
        "하드웨어 제어보다 사용자 기능 구현 비중이 크면 이 family에 가깝다"
      ],
      adjacentFamilies: [
        "embedded_os_rtos",
        "device_driver_bsp",
        "backend"
      ],
      boundaryNote: "하드웨어 제어나 OS 구조보다 디바이스의 기능과 사용자 로직 구현 비중이 커질수록 임베디드 애플리케이션으로 읽힙니다. 반면 저수준 제어나 시스템 설계 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 디바이스의 기능과 동작을 구현하는 애플리케이션을 개발하는 성격이 강합니다. 사용자 기능과 서비스 로직이 핵심입니다. 반면 저수준 제어나 OS 설계 비중이 커지면 다른 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "firmware_engineer",
      label: "펌웨어 엔지니어",
      aliases: [
        "Firmware Engineer",
        "MCU 개발자",
        "임베디드 C 개발자"
      ],
      family: "firmware_mcu_development",
      responsibilityHints: [
        "MCU 제어 코드 작성",
        "하드웨어 인터페이스 구현",
        "펌웨어 최적화",
        "인터럽트 기반 로직 개발"
      ],
      levelHints: [
        "레지스터 레벨에서 하드웨어를 이해할 수 있다",
        "자원 제약 환경에서 안정적으로 동작시키는 능력이 있다"
      ]
    },
    {
      id: "driver_engineer",
      label: "드라이버 엔지니어",
      aliases: [
        "Device Driver Engineer",
        "BSP 엔지니어",
        "커널 개발자"
      ],
      family: "device_driver_bsp",
      responsibilityHints: [
        "디바이스 드라이버 개발",
        "BSP 포팅",
        "커널 인터페이스 구현",
        "하드웨어 초기화"
      ],
      levelHints: [
        "OS와 하드웨어 구조를 동시에 이해할 수 있다",
        "커널 레벨 디버깅이 가능하다"
      ]
    },
    {
      id: "rtos_engineer",
      label: "RTOS 엔지니어",
      aliases: [
        "RTOS 개발자",
        "Embedded OS Engineer",
        "실시간 시스템 개발자"
      ],
      family: "embedded_os_rtos",
      responsibilityHints: [
        "태스크 스케줄링 설계",
        "동시성 처리",
        "RTOS 포팅",
        "시스템 성능 최적화"
      ],
      levelHints: [
        "실시간 시스템 요구사항을 이해할 수 있다",
        "멀티스레드 환경에서 안정성을 확보할 수 있다"
      ]
    },
    {
      id: "embedded_app_engineer",
      label: "임베디드 애플리케이션 엔지니어",
      aliases: [
        "Embedded Application Engineer",
        "디바이스 앱 개발자",
        "임베디드 소프트웨어 개발자"
      ],
      family: "embedded_application",
      responsibilityHints: [
        "디바이스 기능 구현",
        "센서 및 데이터 처리",
        "통신 기능 개발",
        "상위 로직 설계"
      ],
      levelHints: [
        "기능 요구사항을 코드로 구현할 수 있다",
        "디바이스 동작을 전체적으로 이해할 수 있다"
      ]
    }
  ],
  axes: [
    {
      axisId: "abstraction_level",
      label: "추상화 수준",
      values: [
        "하드웨어 직접 제어",
        "OS/커널 인터페이스",
        "시스템 구조 설계",
        "애플리케이션 로직"
      ]
    },
    {
      axisId: "control_focus",
      label: "제어 대상",
      values: [
        "레지스터 및 MCU",
        "디바이스 인터페이스",
        "태스크 및 자원",
        "디바이스 기능"
      ]
    },
    {
      axisId: "work_focus",
      label: "업무 중심",
      values: [
        "저수준 제어",
        "하드웨어 연동",
        "시스템 구조",
        "서비스 구현"
      ]
    }
  ],
  adjacentFamilies: [
    "시스템소프트웨어",
    "백엔드",
    "하드웨어",
    "모바일",
    "IoT"
  ],
  boundaryHints: [
    "MCU와 레지스터 직접 제어 비중이 커지면 펌웨어로 읽힙니다.",
    "OS와 하드웨어 연결 비중이 커지면 드라이버로 이동합니다.",
    "태스크 관리와 시스템 구조 설계 비중이 커지면 RTOS로 해석됩니다.",
    "디바이스 기능 구현 비중이 커지면 임베디드 애플리케이션으로 읽힙니다.",
    "서버나 클라우드 연동 중심이면 백엔드 직무와 경계가 가까워집니다."
  ],
  summaryTemplate: "임베디드개발 직무는 하드웨어와 소프트웨어를 연결하는 시스템을 구현하는 역할입니다. 펌웨어, 드라이버, OS, 애플리케이션 중 어느 계층을 중심으로 작업하는지에 따라 역할이 달라집니다. 반면 상위 서비스나 하드웨어 설계 비중이 커지면 인접 직무로 읽힐 수 있습니다."
};
