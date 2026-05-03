// @MX:NOTE: Round 1 Major Bridge Registry - 전공별 직무 연결 문장과 어필 과목
// Purpose: centralize bridge text for Axis1 output to maintain consistency and prevent pollution

export const NEWGRAD_MAJOR_BRIDGE_REGISTRY = Object.freeze({
  ECONOMICS: Object.freeze({
    label: "경제학",
    generalBridge: "경제학 전공은 수요, 가격, 경쟁, 소비자 선택을 숫자와 구조로 읽는 훈련에 가깝습니다.",
    jobBridgeMap: {
      PRODUCT_MARKETING_PMM: Object.freeze({
        majorDefinition: "경제학은 시장을 숫자와 구조로 읽는 전공입니다.",
        jobConnection: "수요, 가격, 경쟁, 소비자 선택을 분석하는 훈련은 PMM에서 시장 기회와 고객 세그먼트, 가격/포지션 판단을 이해하는 데 일부 연결됩니다.",
        jobDefinition: "PMM은 제품을 시장·고객·경쟁 상황에 맞게 포지셔닝하고, 어떤 고객에게 어떤 메시지와 가격/포지션으로 전달할지 판단하는 직무입니다.",
        careerBridge: "따라서 경제학 전공을 통해 수요, 가격, 경쟁, 소비자 선택을 구조적으로 분석하는 훈련을 해왔고, 이를 바탕으로 제품이 어떤 고객에게, 어떤 메시지와 가격/포지션으로 전달되어야 하는지 판단하는 PMM 직무에 관심을 갖게 되었다고 연결할 수 있습니다.",
        appealingCourses: [
          "미시경제학",
          "산업조직론",
          "계량경제학/통계학",
          "행동경제학",
          "국제경제학"
        ],
        evidencePrompts: [
          "시장 규모 및 고객 수요 조사",
          "경쟁 제품 분석 및 차별화 포인트 도출",
          "고객 세그먼트별 메시지 작성 및 검증",
          "가격 책정 및 출시 캠페인 기획"
        ]
      }),
      DATA_ANALYSIS: Object.freeze({
        majorDefinition: "경제학은 시장과 데이터를 구조적으로 분석하는 기초를 제공합니다.",
        jobConnection: "경제통계학, 계량경제학 등 정량적 분석 훈련은 데이터를 통해 의사결정 근거를 만드는 데 도움이 됩니다.",
        appealingCourses: [
          "경제통계학",
          "계량경제학",
          "시계열분석"
        ]
      }),
      BUSINESS_STRATEGY: Object.freeze({
        majorDefinition: "경제학은 시장 구조와 경쟁 메커니즘을 이해하는 전공입니다.",
        jobConnection: "산업조직론, 게임이론 등을 통해 경쟁자 전략과 시장 변화를 예측하는 기초 사고를 기를 수 있습니다.",
        appealingCourses: [
          "산업조직론",
          "게임이론",
          "거시경제학"
        ]
      })
    }
  }),

  BUSINESS_ADMIN: Object.freeze({
    label: "경영학",
    generalBridge: "경영학 전공은 고객, 시장, 제품, 조직, 수익 구조를 함께 이해하는 전공입니다.",
    jobBridgeMap: {
      PRODUCT_MARKETING_PMM: Object.freeze({
        majorDefinition: "경영학은 제품, 고객, 시장, 브랜드를 종합적으로 다루는 전공입니다.",
        jobConnection: "마케팅원론, 제품관리, 소비자행동론 등은 PMM이 시장과 고객을 이해하고 제품을 포지셔닝하는 기초와 직접 연결됩니다.",
        careerBridge: "따라서 경영학을 통해 배운 고객 니즈, 경쟁 상황, 제품 가치 전달 방식을 바탕으로 PMM 직무에 접근할 수 있습니다.",
        appealingCourses: [
          "마케팅원론",
          "마케팅관리",
          "소비자행동론",
          "시장조사론",
          "제품관리",
          "브랜드관리",
          "가격전략"
        ],
        evidencePrompts: [
          "시장 세그먼트별 고객 분석",
          "제품 포지셔닝 및 메시지 개발",
          "경쟁사 분석 및 차별화 전략"
        ]
      }),
      BUSINESS_STRATEGY: Object.freeze({
        majorDefinition: "경영학은 비즈니스 전략과 조직 운영을 다루는 전공입니다.",
        jobConnection: "경영전략, 재무관리, 사업모델 설계 등은 사업 성장 전략을 수립하는 기초와 연결됩니다.",
        appealingCourses: [
          "경영전략",
          "비즈니스모델설계",
          "창업론",
          "재무관리"
        ]
      }),
      HR_ORGANIZATION: Object.freeze({
        majorDefinition: "경영학의 인적자원관리 영역은 조직 운영과 사람 관리를 다룹니다.",
        jobConnection: "조직행동론, 인적자원관리, 리더십 등은 HR 직무의 기초 이론과 직접 연결됩니다.",
        appealingCourses: [
          "조직행동론",
          "인적자원관리",
          "리더십",
          "조직설계"
        ]
      })
    }
  }),

  COMPUTER_SCIENCE: Object.freeze({
    label: "컴퓨터공학",
    generalBridge: "컴퓨터공학 전공은 소프트웨어가 어떤 구조로 설계되고, 데이터가 어떻게 저장·처리되며, 시스템이 어떤 방식으로 동작하는지를 이해하는 전공입니다.",
    jobBridgeMap: {
      BACKEND_DEVELOPMENT: Object.freeze({
        majorDefinition: "컴퓨터공학은 서버, 데이터베이스, 네트워크의 설계와 구현을 다루는 전공입니다.",
        jobConnection: "자료구조, 알고리즘, 데이터베이스, 네트워크 등의 핵심 과목은 백엔드 개발의 기초와 직접 일치합니다.",
        appealingCourses: [
          "자료구조",
          "알고리즘",
          "운영체제",
          "데이터베이스",
          "컴퓨터네트워크",
          "서버프로그래밍"
        ]
      }),
      DATA_ANALYSIS: Object.freeze({
        majorDefinition: "컴퓨터공학은 대규모 데이터를 처리하고 분석하는 기술 기초를 제공합니다.",
        jobConnection: "데이터베이스, Python프로그래밍, 알고리즘 이해는 데이터 파이프라인 구축과 분석 자동화의 기초입니다.",
        appealingCourses: [
          "데이터베이스",
          "Python프로그래밍",
          "알고리즘",
          "빅데이터처리"
        ]
      }),
      PM_SERVICE_PLANNING: Object.freeze({
        majorDefinition: "컴퓨터공학은 기술의 제약과 가능성을 이해하는 기초를 제공합니다.",
        jobConnection: "소프트웨어공학, 시스템 아키텍처 이해는 PM이 개발자와 협업하고 기술 요구사항을 이해하는 데 도움이 됩니다.",
        careerBridge: "직접 개발 경험 없이도 기술의 복잡도, 구현 기간, 성능 트레이드오프를 이해하는 기반이 됩니다.",
        appealingCourses: [
          "소프트웨어공학",
          "데이터베이스",
          "웹프로그래밍",
          "시스템설계"
        ]
      })
    }
  }),

  INDUSTRIAL_ENGINEERING: Object.freeze({
    label: "산업공학",
    generalBridge: "산업공학 전공은 사람, 설비, 데이터, 프로세스가 함께 움직이는 시스템을 더 효율적으로 설계하고 개선하는 전공입니다.",
    jobBridgeMap: {
      PRODUCTION_MANAGEMENT: Object.freeze({
        majorDefinition: "산업공학은 생산 프로세스의 최적화와 품질 관리를 다룹니다.",
        jobConnection: "생산관리, 품질경영, 공정관리 등은 생산 직무의 핵심 이론과 직접 연결됩니다.",
        appealingCourses: [
          "생산관리",
          "생산시스템설계",
          "공정관리",
          "품질경영",
          "통계적품질관리"
        ]
      }),
      SCM_LOGISTICS: Object.freeze({
        majorDefinition: "산업공학은 공급망 전체의 효율성을 다루는 전공입니다.",
        jobConnection: "공급망관리, 물류관리, 수요예측은 SCM 직무의 기초 이론입니다.",
        appealingCourses: [
          "공급망관리",
          "물류관리",
          "재고관리",
          "수요예측",
          "최적화"
        ]
      }),
      DATA_ANALYSIS: Object.freeze({
        majorDefinition: "산업공학은 데이터 기반의 운영 개선을 추구하는 전공입니다.",
        jobConnection: "확률통계, 시뮬레이션, 최적화 기법은 데이터 분석을 통한 의사결정 기초를 제공합니다.",
        appealingCourses: [
          "확률통계",
          "데이터분석",
          "시뮬레이션",
          "최적화",
          "경영과학"
        ]
      }),
      PM_SERVICE_PLANNING: Object.freeze({
        majorDefinition: "산업공학은 사람, 설비, 데이터, 프로세스가 함께 움직이는 시스템을 분석하고, 병목을 찾아 더 효율적으로 설계하고 개선하는 기초를 제공합니다.",
        jobConnection: "PM과 서비스기획은 사용자 문제를 제품 구조, 기능 우선순위, 운영 흐름, 이해관계자 조율로 바꾸는 직무입니다. 산업공학의 운영관리, 프로세스 최적화, 병목 분석, 데이터 기반 의사결정, 인간공학, 시뮬레이션은 사용자의 행동과 업무 흐름을 구조적으로 파악하고, 개선 가능 지점을 찾고, 여러 대안 중 최적의 기능과 운영 방식을 우선순위로 판단하는 데 연결될 수 있습니다.",
        careerBridge: "산업공학 전공에서 배운 시스템 설계, 프로세스 개선, 데이터 기반 최적화, 이해관계자 간 이해충돌 해소의 사고는 서비스 전체의 효율성과 사용자 만족도를 함께 높이려는 PM의 사고방식과 만날 수 있습니다. 다만 산업공학 자체가 제품 전략, 사용자 리서치, UI/UX 설계를 직접 훈련하는 전공은 아니므로, 실제 서비스나 제품 프로젝트 경험 속에서 사용자 문제를 정의하고 개선안을 제시해본 경험이 함께 제시될 때 연결력이 더 강해집니다.",
        appealingCourses: [
          "생산운영관리",
          "경영과학/OR",
          "품질관리",
          "데이터분석",
          "인간공학",
          "시뮬레이션",
          "프로세스 개선"
        ],
        evidencePrompts: [
          "서비스나 제품의 사용자 흐름, 업무 프로세스 분석 경험",
          "사용자 문제 정의 및 개선 아이디어 도출 경험",
          "데이터로 기능 우선순위를 판단하거나 성과를 측정한 경험",
          "운영 병목을 찾아 개선안을 제시한 경험"
        ]
      })
    }
  }),

  FINANCE: Object.freeze({
    label: "금융",
    generalBridge: "금융 전공은 돈의 흐름, 위험과 수익, 기업가치, 금융상품의 구조를 이해하는 전공입니다.",
    jobBridgeMap: {
      FINANCE_ANALYSIS: Object.freeze({
        majorDefinition: "금융은 기업의 재무 상황과 투자 기회를 분석하는 전공입니다.",
        jobConnection: "투자론, 기업가치평가, 재무제표분석은 금융분석 직무의 핵심 이론입니다.",
        appealingCourses: [
          "투자론",
          "기업재무",
          "기업가치평가",
          "재무제표분석",
          "금융시장론"
        ]
      }),
      FINANCIAL_PLANNING: Object.freeze({
        majorDefinition: "금융은 기업의 자본 구조와 수익성을 관리하는 방법을 다룹니다.",
        jobConnection: "재무관리, 기업재무, 금융통계는 재무기획 및 FP&A 직무의 기초입니다.",
        appealingCourses: [
          "재무관리",
          "기업재무",
          "재무제표분석",
          "금융통계"
        ]
      }),
      RISK_MANAGEMENT: Object.freeze({
        majorDefinition: "금융은 위험을 정량화하고 관리하는 방법을 이해하는 전공입니다.",
        jobConnection: "리스크관리, 파생상품론, 포트폴리오이론은 위험 분석과 헤징 전략의 기초입니다.",
        appealingCourses: [
          "리스크관리",
          "파생상품론",
          "포트폴리오이론",
          "금융통계"
        ]
      })
    }
  }),

  MATH_STATISTICS: Object.freeze({
    label: "수학·통계",
    generalBridge: "수학·통계 전공은 불확실한 데이터를 수치적으로 해석하고, 패턴과 관계를 검증하는 전공입니다.",
    jobBridgeMap: {
      DATA_ANALYSIS: Object.freeze({
        majorDefinition: "수학·통계는 데이터를 정확히 해석하고 의사결정 근거를 만드는 기초를 제공합니다.",
        jobConnection: "통계학개론, 회귀분석, 데이터마이닝은 데이터분석 직무의 핵심 이론입니다.",
        careerBridge: "다만 전공 지식만으로 실무 데이터 처리 경험이 확인되는 것은 아니므로, 실제 분석 도구나 프로젝트 경험이 함께 제시될 때 연결력이 더 강해집니다.",
        appealingCourses: [
          "통계학개론",
          "수리통계학",
          "회귀분석",
          "데이터마이닝",
          "Python데이터분석"
        ],
        evidencePrompts: [
          "실제 데이터셋으로 통계 분석 수행",
          "Python/R을 이용한 데이터 처리 경험",
          "결과를 비즈니스 의사결정과 연결한 경험"
        ]
      }),
      MARKETING_ANALYSIS: Object.freeze({
        majorDefinition: "수학·통계는 마케팅 효과를 측정하고 최적화하는 기초를 제공합니다.",
        jobConnection: "표본조사론, 실험계획법, 회귀분석은 A/B 테스트, 고객분석, 캠페인 효과 측정의 기초입니다.",
        appealingCourses: [
          "표본조사론",
          "실험계획법",
          "회귀분석",
          "데이터마이닝"
        ]
      }),
      FINANCE_ANALYSIS: Object.freeze({
        majorDefinition: "수학·통계는 금융 리스크와 수익을 정량화하는 기초를 제공합니다.",
        jobConnection: "확률론, 시계열분석, 수리통계학은 시장 변동성 분석과 투자 판단의 기초입니다.",
        appealingCourses: [
          "확률론",
          "시계열분석",
          "베이지안통계"
        ]
      })
    }
  }),

  LAW: Object.freeze({
    label: "법학",
    generalBridge: "법학 전공은 조직과 거래가 어떤 규칙, 권리, 의무, 책임 구조 안에서 움직이는지를 해석하는 전공입니다.",
    jobBridgeMap: {
      LEGAL_COMPLIANCE: Object.freeze({
        majorDefinition: "법학은 조직의 법적 의무와 리스크를 이해하는 전공입니다.",
        jobConnection: "민법, 상법, 회사법, 개인정보보호법은 법무 및 컴플라이언스 직무의 핵심 이론입니다.",
        appealingCourses: [
          "민법",
          "상법",
          "회사법",
          "개인정보보호법",
          "공정거래법"
        ]
      }),
      HR_ORGANIZATION: Object.freeze({
        majorDefinition: "법학의 노동법은 조직 내 인사 이슈를 법적으로 해석합니다.",
        jobConnection: "노동법, 개인정보보호법 이해는 HR 직무에서 법적 리스크를 관리하는 기초입니다.",
        careerBridge: "다만 법적 지식과 실제 인사 운영 경험은 구분되어야 합니다.",
        appealingCourses: [
          "노동법",
          "개인정보보호법",
          "민법"
        ]
      }),
      BUSINESS_STRATEGY: Object.freeze({
        majorDefinition: "법학은 사업의 계약, 거래, 규제 맥락을 이해합니다.",
        jobConnection: "상법, 회사법, 공정거래법은 사업 계획의 법적 제약과 기회를 이해하는 기초입니다.",
        appealingCourses: [
          "상법",
          "회사법",
          "공정거래법",
          "경제법"
        ]
      })
    }
  }),

  PSYCHOLOGY_COUNSELING: Object.freeze({
    label: "심리·상담",
    generalBridge: "심리·상담 전공은 사람의 동기, 감정, 인지, 행동을 이해하는 전공입니다.",
    jobBridgeMap: {
      HR_RECRUITMENT: Object.freeze({
        majorDefinition: "심리학은 사람의 특성, 강점, 적응력을 이해하는 기초를 제공합니다.",
        jobConnection: "산업및조직심리학, 심리측정, 성격심리학은 채용, 평가, 개발의 기초 이론입니다.",
        careerBridge: "다만 심리 이론만으로 채용 실무 경험이 확인되는 것은 아니므로, 실제 인터뷰, 평가, 피드백 경험이 함께 제시될 때 연결력이 더 강해집니다.",
        appealingCourses: [
          "산업및조직심리학",
          "심리측정",
          "심리검사",
          "성격심리학"
        ],
        evidencePrompts: [
          "면접 또는 심리검사 실시",
          "개인 성격 프로필 작성",
          "조직 적응 코칭 경험"
        ]
      }),
      MARKETING_BRAND: Object.freeze({
        majorDefinition: "심리학은 고객의 구매 동기와 브랜드 인식을 이해하는 기초를 제공합니다.",
        jobConnection: "소비자심리학, 사회심리학, 의사결정심리학은 고객 행동 분석과 메시지 개발의 기초입니다.",
        appealingCourses: [
          "소비자심리학",
          "사회심리학",
          "의사결정심리학"
        ]
      }),
      UX_RESEARCH: Object.freeze({
        majorDefinition: "심리학은 사용자의 인지, 선택, 행동 패턴을 이해하는 기초를 제공합니다.",
        jobConnection: "인지심리학, 연구방법론은 사용자 리서치와 인터뷰 설계의 기초입니다.",
        appealingCourses: [
          "인지심리학",
          "연구방법론",
          "의사결정심리학"
        ]
      })
    }
  }),

  SOFTWARE: Object.freeze({
    label: "소프트웨어",
    generalBridge: "소프트웨어는 데이터를 받아 처리하고, 그 결과를 저장하며, 사용자와 상호작용하는 논리 구조를 설계하고 구현하는 전공입니다.",
    jobBridgeMap: {
      BACKEND_DEVELOPMENT: Object.freeze({
        majorDefinition: "소프트웨어는 데이터의 입력 → 처리 → 저장 → 출력의 논리 구조를 설계하고 구현하는 전공입니다.",
        jobConnection: "프로그래밍, 자료구조, 알고리즘은 처리 로직의 기초이고, 데이터베이스와 네트워크는 데이터 보관과 전달의 기초이며, 운영체제는 시스템 성능과 안정성의 기초입니다. 백엔드 개발은 이 모든 요소를 함께 이해하고 안정적이고 빠르게 구현하는 것이 본질입니다.",
        careerBridge: "따라서 소프트웨어 전공에서 배운 논리 설계, 데이터 구조 최적화, 에러 처리, 성능 개선의 사고방식이 직접 API 설계, 데이터 처리, 서버 구조 개선, 확장성 판단으로 연결됩니다.",
        appealingCourses: [
          "프로그래밍 (Java, Python, Go)",
          "자료구조와 알고리즘",
          "데이터베이스 (SQL, 정규화)",
          "운영체제",
          "컴퓨터 네트워크 (TCP/IP, HTTP)",
          "소프트웨어 공학",
          "웹 프로그래밍"
        ],
        evidencePrompts: [
          "실제 구현한 API, 데이터 처리 로직, 최적화 경험",
          "GitHub 리포지토리, 코드 리뷰, PR 이력",
          "버그 분석, 성능 개선 사례",
          "배포, 모니터링, 장애 대응 경험"
        ]
      })
    }
  }),

  ELECTRICAL_ELECTRONIC: Object.freeze({
    label: "전기전자",
    generalBridge: "전기전자는 전자기 신호와 반도체를 이용해 물리 세계의 데이터를 감지하고, 처리하고, 제어하는 장치를 설계·구현하는 전공입니다.",
    jobBridgeMap: {
      PRODUCTION_MANAGEMENT: Object.freeze({
        majorDefinition: "전기전자는 회로, 신호, 반도체, 제어 시스템을 통해 물리 세계와 상호작용하는 하드웨어/임베디드 시스템을 다룹니다.",
        jobConnection: "회로 설계, 신호 처리, 디지털 논리, 제어 공학은 반도체, 임베디드, 하드웨어의 검증과 신뢰성 판단의 기초입니다. 센서 입력 → 신호 처리 → 제어 로직 → 액추에이터 출력의 피드백 루프를 물리 레벨에서 구현하고 검증하는 것이 핵심입니다.",
        careerBridge: "따라서 전기전자에서 배운 회로 분석, 신호 해석, 제어 이론, 에러 조건 처리는 반도체 칩/시스템의 검증, 임베디드 펌웨어의 신뢰성 판단, 장애 원인 분석으로 직접 연결됩니다. 다만 제조 공정, 신뢰성 테스트, 양산 최적화 등 산업 경험이 함께 필요합니다.",
        appealingCourses: [
          "회로 이론 (직류/교류)",
          "디지털 논리 회로 및 설계",
          "신호 및 시스템",
          "반도체 및 VLSI",
          "마이크로컨트롤러 및 임베디드 시스템",
          "제어 공학",
          "통신 공학"
        ],
        evidencePrompts: [
          "회로 설계 프로젝트, 시뮬레이션 경험",
          "임베디드 펌웨어 개발 (Arduino, STM32)",
          "신호 처리 구현, 필터 설계 검증",
          "하드웨어 검증, 테스트 보고서",
          "공정/회로 문제 분석, 개선 사례"
        ]
      })
    }
  }),

  CHEMISTRY: Object.freeze({
    label: "화학",
    generalBridge: "화학은 물질의 구조와 반응을 이해하고, 원하는 성질의 물질을 만들기 위해 조건을 제어하는 것을 다루는 전공입니다.",
    jobBridgeMap: {
      PRODUCTION_MANAGEMENT: Object.freeze({
        majorDefinition: "화학은 물질의 구조, 성질, 반응을 과학적으로 이해하고, 공정 조건을 제어하여 원하는 산물을 만드는 전공입니다.",
        jobConnection: "제조업의 품질관리와 생산기술은 '원료 특성 파악 → 공정 조건 설정 → 산물 특성 검증 → 불량 원인 분석'의 사이클을 반복합니다. 화학의 원리 이해와 실험 데이터 해석이 이 사이클의 기초입니다. 분석화학, 물리화학, 화학공학은 공정 조건, 품질 기준, 이상 진단에 직접 연결됩니다.",
        careerBridge: "따라서 화학에서 배운 분석 방법, 실험 설계, 데이터 해석은 품질 기준 검증, 공정 조건 이상 진단, 부작용/부산물 원인 규명으로 연결될 수 있습니다. 다만 특정 산업(반도체, 화학, 제약, 식음료, 바이오)의 제품 특성, 공정 장비, 규제 기준을 함께 이해해야 합니다.",
        appealingCourses: [
          "일반화학 및 화학실험",
          "유기화학",
          "물리화학 (열역학, 반응 속도)",
          "분석화학 (정량, 기기 분석)",
          "화학공학 기초",
          "고분자 화학",
          "화학 안전"
        ],
        evidencePrompts: [
          "실험 설계, 데이터 분석 (오차 분석)",
          "분석 기기 활용 (HPLC, GC-MS, NMR 등)",
          "부작용/이상 현상의 원인 추적",
          "공정 조건과 산물 특성의 관계 파악",
          "선행 사례 분석, 문제 해결 경험"
        ]
      })
    }
  }),

  ACCOUNTING_TAX: Object.freeze({
    label: "회계·세무",
    generalBridge: "회계는 조직의 거래를 일관된 규칙으로 기록하고, 그 결과를 재무제표로 요약하여 재무 상황과 경영 성과를 해석 가능하게 만드는 전공입니다.",
    jobBridgeMap: {
      FINANCIAL_PLANNING: Object.freeze({
        majorDefinition: "회계·세무는 조직의 거래를 정확하게 기록하고, 재무제표로 요약하여 재무 의사결정의 근거를 제공하는 전공입니다.",
        jobConnection: "재무 직무의 핵심은 '거래 발생 → 기록 → 분류 → 보고 → 의사결정'의 정보 사이클입니다. 거래를 정확히 기록하고, 재무제표를 읽고, 비용/수익의 흐름을 추적하는 것은 회계 전공의 핵심이며 재무 직무의 필수입니다. 재무관리, 관리회계, 세법은 재무기획과 FP&A의 기초입니다.",
        careerBridge: "따라서 회계·세무에서 배운 거래 기록, 계정 체계, 재무제표 작성, 세법 규정은 회계 처리, 예산 대비 실적 분석, 부문별 원가 관리, 재무 의사결정 지원으로 직접 연결됩니다.",
        appealingCourses: [
          "회계학 원론",
          "재무회계 (GAAP, IFRS)",
          "관리회계 (원가, 예산, 성과 분석)",
          "세법 (소득세, 법인세)",
          "재무제표분석",
          "감사학",
          "국제회계기준"
        ],
        evidencePrompts: [
          "실제 거래 기록 및 재무제표 작성 경험",
          "Excel을 활용한 예산 대비 실적 분석",
          "비용 구조 분석, 손익 추적 경험",
          "세무 신고, 세무 이슈 분석",
          "재무 데이터 기반 경영진 보고서 작성"
        ]
      })
    }
  }),

  BIO_LIFE_SCIENCE: Object.freeze({
    label: "바이오·생명과학",
    generalBridge: "바이오·생명과학은 세포, 유전자, 단백질, 생리 시스템을 이해하고, 그 원리를 이용해 질병을 진단하고 치료하는 기초를 다루는 전공입니다.",
    jobBridgeMap: {
      PRODUCTION_MANAGEMENT: Object.freeze({
        majorDefinition: "바이오·생명과학은 생명 현상과 질병 메커니즘을 과학적으로 이해하고, 그 원리를 제품과 임상에 적용하는 기초를 제공합니다.",
        jobConnection: "제약·바이오 산업의 품질관리와 영업기획은 '과학 근거 수집 → 안전성/효과성 판단 → 규제 기관 설득 → 현장 적용'의 과정입니다. 바이오 배경이 있으면 약물 작용 원리, 질병 메커니즘, 임상 데이터를 신속하게 이해할 수 있습니다.",
        careerBridge: "따라서 바이오·생명과학에서 배운 약물 작용 원리, 질병 메커니즘, 임상 데이터 해석은 의약품 효능/부작용 이해, 규제 자료 작성, 고객 설명 자료 작성으로 연결될 수 있습니다. 다만 규제 환경, 임상 프로세스, 시장 관점은 별도 경험으로 보강이 필요합니다.",
        appealingCourses: [
          "세포생물학",
          "유전학 (DNA, 유전자 발현)",
          "생화학 (대사, 신호전달)",
          "약리학 (약물 작용, 부작용)",
          "병리학 (질병 메커니즘)",
          "미생물학",
          "분자생물학"
        ],
        evidencePrompts: [
          "문헌 조사, 선행 연구 분석",
          "실험 데이터 해석 (세포, 동물 모델)",
          "약물 작용 메커니즘 설명 및 근거",
          "임상 데이터 해석",
          "의료진/환자 대상 설명 경험"
        ]
      })
    }
  }),

  PHARMACY: Object.freeze({
    label: "약학",
    generalBridge: "약학은 약물의 구조, 제형, 안전성, 유효성을 과학적으로 이해하고, 환자에게 올바르게 전달되도록 보장하는 전공입니다.",
    jobBridgeMap: {
      PM_SERVICE_PLANNING: Object.freeze({
        majorDefinition: "약학은 의약품의 약학적 성질(제형, 안정성, 생체이용률), 임상적 근거(효능, 안전성), 사용 조건(용법용량, 부작용)을 동시에 이해하는 전공입니다.",
        jobConnection: "제약 산업의 기획과 전략은 '의약품의 과학적 근거를 규제 기관과 의료진, 환자에게 전달하는' 것입니다. 약학은 약물의 약학적 성질, 임상적 근거, 사용 조건을 모두 이해하므로, 의약품 허가 자료 해석, 의료진/환자 설명, 임상 이상반응 평가, 품질 기준 설정이 가능합니다.",
        careerBridge: "따라서 약학에서 배운 약제학, 약물학, 약동학, 규제 과학은 의약품 허가 자료 작성, 의료진/환자 설명 자료 개발, 임상 이상반응 평가, 품질 기준 해석으로 직접 연결됩니다. 다만 사업 기획, 마케팅, 의료경제학 등은 별도 경험으로 보강이 필요합니다.",
        appealingCourses: [
          "약학개론",
          "약물학 (작용 기전, 부작용)",
          "약제학 (제형, 제조, 안정성)",
          "약동학/약력학",
          "약사법 및 규제",
          "임상약학",
          "의약품 정보학"
        ],
        evidencePrompts: [
          "의약품 허가 신청 자료 작성/검토",
          "임상 시험 데이터 분석",
          "의료진 대상 학술 활동, 강의",
          "약물 상호작용, 부작용 관리 경험",
          "품질 기준 설정, 검증"
        ]
      })
    }
  }),

  PUBLIC_POLICY: Object.freeze({
    label: "행정·정책",
    generalBridge: "행정·정책은 사회의 문제를 제도와 예산, 조직과 과정을 통해 해결하는 방법을 설계하고, 그 효과를 측정하는 것을 다루는 전공입니다.",
    jobBridgeMap: {
      PM_SERVICE_PLANNING: Object.freeze({
        majorDefinition: "행정·정책은 사회 문제를 제도, 예산, 조직을 통해 해결하는 구조를 설계하고 성과를 측정하는 전공입니다.",
        jobConnection: "공공기관과 사업기획의 핵심은 '사회 문제 정의 → 사업 설계 → 예산 편성 → 이해관계자 조율 → 성과 측정'입니다. 행정·정책 전공은 이 전체 사이클을 이론적으로 이해하고, 문제 분석, 이해관계자 조율, 성과 지표 설계에 강점입니다.",
        careerBridge: "따라서 행정·정책에서 배운 정책 분석, 예산 편성, 이해관계자 분석, 성과 지표 설계는 공공 사업 기획, 정책 영향 평가, 행정 프로세스 개선으로 직접 연결될 수 있습니다. 다만 민간 사업 기획으로 옮기는 경우 시장 수요, 고객 관점, 수익성 판단을 새로 학습해야 합니다.",
        appealingCourses: [
          "정책학개론",
          "행정학개론",
          "예산론 및 재정학",
          "정책분석방법론",
          "조사방법론",
          "행정법",
          "지역개발론"
        ],
        evidencePrompts: [
          "정책 분석 논문, 사업계획서 작성",
          "예산 편성, 성과 지표 설계 경험",
          "이해관계자 인터뷰, 설문 조사",
          "정책 평가 보고서 작성",
          "프로젝트의 문제점 분석, 개선안"
        ]
      })
    }
  }),

  SOCIOLOGY: Object.freeze({
    label: "사회학",
    generalBridge: "사회학은 인간이 집단 속에서 어떻게 행동하고, 어떤 문화와 제도에 영향받으며, 어떻게 변화하는지를 과학적으로 분석하는 전공입니다.",
    jobBridgeMap: {
      HR_ORGANIZATION: Object.freeze({
        majorDefinition: "사회학은 인간이 집단 속에서 어떻게 행동하고, 어떤 문화와 제도에 영향받는지를 분석하는 전공입니다.",
        jobConnection: "HR과 조직문화의 핵심은 '개인의 행동과 태도가 집단 맥락과 제도에 어떻게 영향받는가'를 이해하는 것입니다. 사회학은 집단 행동, 문화, 제도, 불평등을 분석하는 렌즈를 제공하고, 조사방법론과 통계를 함께 사용하면 직원 설문, 조직 진단을 과학적으로 설계할 수 있습니다.",
        careerBridge: "따라서 사회학에서 배운 문화 분석, 집단 행동 해석, 조사 설계, 데이터 분석은 직원 태도 조사, 조직 문제 진단, 조직 개선안 도출로 연결될 수 있습니다. 다만 비즈니스 맥락(수익, 조직 목표, 정치)과 실무 HR 프로세스(채용, 평가, 개발)를 함께 이해해야 합니다.",
        appealingCourses: [
          "사회학 개론",
          "사회통계학",
          "조사방법론 (표본, 설문, 인터뷰)",
          "조직사회학",
          "산업사회학",
          "문화사회학",
          "사회계층론"
        ],
        evidencePrompts: [
          "설문 조사 설계 및 분석",
          "인터뷰 기획 및 분석",
          "조직/직원 데이터 해석 및 보고서",
          "문화 차이 분석, 문제 진단",
          "개선안 제시, 실행 경험"
        ]
      })
    }
  }),

  OTHER_HUMANITIES: Object.freeze({
    label: "기타 인문",
    generalBridge: "인문학은 인간의 사상, 문화, 언어, 역사를 깊이 있게 분석하고, 그 맥락 속에서 의미를 찾는 학문입니다.",
    jobBridgeMap: {
      CONTENT_MARKETING: Object.freeze({
        majorDefinition: "기타 인문 전공은 문학, 어문, 역사, 철학, 문화연구 등 세부 분야에 따라 강점이 달라지는 넓은 범주의 전공입니다. 공통적으로는 텍스트와 사람, 사회·문화적 맥락을 해석하는 훈련을 제공하지만, 콘텐츠마케팅과의 연결 강도는 실제 제작 경험과 포트폴리오에 따라 크게 달라집니다.",
        jobConnection: "기타 인문 전공은 텍스트 해석, 문화적 맥락 이해, 서사 구조 분석을 통해 메시지가 어떤 의미로 받아들여지는지 생각하는 훈련을 제공합니다. 다만 콘텐츠마케팅과의 연결은 전공명만으로 강하게 주장하기보다는, 글쓰기·콘텐츠 제작·브랜드 메시지 구성·성과 분석 경험이 함께 제시될 때 설득력이 높아집니다.",
        careerBridge: "텍스트 분석, 메시지 구성, 맥락 해석은 콘텐츠 기획의 기초가 될 수 있습니다. 다만 실제 콘텐츠마케팅에서는 글쓰기, 영상/이미지 기획, 채널 운영, 반응 데이터 분석, 성과 개선 경험이 핵심이므로, 인문학적 해석 역량을 구체적인 콘텐츠 제작물과 성과 지표로 연결해 보여주는 것이 중요합니다.",
        appealingCourses: [
          "문학개론/문예창작",
          "글쓰기/크리에이티브 라이팅",
          "한국사/세계사",
          "철학 (인식론, 윤리)",
          "언어학/문법론",
          "문화연구",
          "수사학/설득 이론",
          "기호학"
        ],
        evidencePrompts: [
          "직접 작성한 콘텐츠 (블로그, 뉴스레터, 영상 스크립트, SNS 운영)",
          "브랜드 스토리, 캠페인 메시지 작성",
          "특정 타깃 독자·고객을 위한 메시지 톤, 소재 조정 경험",
          "콘텐츠 조회수, 클릭률, 저장, 공유, 댓글 등 반응 데이터 확인 및 개선",
          "전공 과제나 리서치를 콘텐츠/브랜드 메시지로 재구성한 경험"
        ]
      })
    }
  }),

  USER_EXPERIENCE: Object.freeze({
    label: "UX/HCI",
    generalBridge: "UX/HCI는 사용자가 제품이나 서비스를 어떻게 이해하고, 상호작용하고, 만족하는지를 과학적으로 연구하고, 그 이해를 바탕으로 더 나은 경험을 설계하는 전공입니다.",
    jobBridgeMap: {
      UX_RESEARCH: Object.freeze({
        majorDefinition: "UX/HCI는 사용자 행동, 니즈, 문제를 과학적으로 파악하고, 그 이해를 제품 설계에 반영하는 전공입니다.",
        jobConnection: "UX 리서치와 서비스 기획의 핵심은 '사용자 문제 파악 → 원인 분석 → 해결안 설계 → 검증'입니다. UX/HCI는 이 전체 사이클을 과학적으로 수행하는 방법을 직접 훈련합니다. 사용자 조사, 사용성 테스트, 정보구조 설계, 프로토타입은 UX/HCI의 표준 과정입니다.",
        careerBridge: "따라서 UX/HCI에서 배운 사용자 조사 방법(인터뷰, 관찰, 태스크 분석), 사용성 테스트, 정보구조 설계, 프로토타입 평가는 사용자 문제 정의, 제품 흐름 설계, 개선 우선순위 판단, 설계 검증으로 직접 연결됩니다.",
        appealingCourses: [
          "HCI 기초",
          "사용자 조사 및 방법론",
          "사용성 평가 및 테스트",
          "정보 구조 설계 (IA)",
          "인터랙션 디자인",
          "프로토타이핑 및 설계 도구",
          "접근성 및 포용적 설계"
        ],
        evidencePrompts: [
          "사용자 인터뷰, 관찰, 태스크 분석",
          "페르소나, 사용자 여정 맵 작성",
          "와이어프레임, 프로토타입 제작",
          "사용성 테스트 진행, 개선안 도출",
          "포트폴리오 (프로젝트 사례, 근거, 결과)"
        ]
      })
    }
  }),

  MEDIA: Object.freeze({
    label: "언론·미디어",
    generalBridge: "신문방송·미디어커뮤니케이션 전공은 메시지가 어떤 수용자에게, 어떤 채널을 통해, 어떤 방식으로 전달되고 반응을 만드는지 이해하는 전공입니다.",
    jobBridgeMap: {
      CONTENT_MARKETING: Object.freeze({
        majorDefinition: "미디어 전공은 콘텐츠가 수용자에게 전달되는 메커니즘을 이해합니다.",
        jobConnection: "콘텐츠기획, 스토리텔링, 뉴미디어론은 콘텐츠마케팅 전략 수립의 기초입니다.",
        careerBridge: "다만 콘텐츠 성과는 전공만으로 확인되지 않으므로, 실제 콘텐츠 제작·배포·성과 경험이 함께 제시될 때 연결력이 더 강해집니다.",
        appealingCourses: [
          "콘텐츠기획",
          "스토리텔링",
          "뉴미디어론",
          "디지털미디어전략"
        ],
        evidencePrompts: [
          "콘텐츠 기획 및 제작",
          "채널별 콘텐츠 배포",
          "성과 분석 (조회수, 참여도 등)"
        ]
      }),
      BRAND_PR: Object.freeze({
        majorDefinition: "미디어 전공은 브랜드 메시지와 여론 관리를 이해합니다.",
        jobConnection: "PR론, 브랜드커뮤니케이션은 PR 전략과 위기 소통의 기초입니다.",
        appealingCourses: [
          "PR론",
          "브랜드커뮤니케이션",
          "통합마케팅커뮤니케이션"
        ]
      }),
      ADVERTISING_PLANNING: Object.freeze({
        majorDefinition: "미디어 전공은 광고 메시지의 효과와 채널 최적화를 이해합니다.",
        jobConnection: "광고학, 광고기획, 미디어플래닝은 캠페인 전략의 기초입니다.",
        appealingCourses: [
          "광고학",
          "광고기획",
          "미디어플래닝"
        ]
      })
    }
  }),

  VISUAL_DESIGN: Object.freeze({
    label: "시각디자인",
    generalBridge: "시각디자인 전공은 메시지와 정보를 사용자가 이해하기 쉬운 시각 구조로 바꾸는 전공입니다.",
    jobBridgeMap: {
      UI_UX_DESIGN: Object.freeze({
        majorDefinition: "시각디자인은 사용자 인터페이스의 시각 설계를 다룹니다.",
        jobConnection: "UI디자인, UX디자인, 인터랙션디자인은 UI/UX 직무의 핵심 이론입니다.",
        appealingCourses: [
          "UI디자인",
          "UX디자인",
          "인터랙션디자인",
          "정보디자인",
          "웹디자인"
        ]
      }),
      BRAND_DESIGN: Object.freeze({
        majorDefinition: "시각디자인은 브랜드의 시각적 정체성을 만듭니다.",
        jobConnection: "브랜드디자인, 아이덴티티디자인, 색채학은 브랜드 시각화의 기초입니다.",
        appealingCourses: [
          "브랜드디자인",
          "아이덴티티디자인",
          "색채학",
          "타이포그래피",
          "광고디자인"
        ]
      }),
      CONTENT_MARKETING: Object.freeze({
        majorDefinition: "시각디자인은 콘텐츠의 시각적 매력을 만듭니다.",
        jobConnection: "그래픽디자인, 모션그래픽은 마케팅 콘텐츠 제작의 기초입니다.",
        appealingCourses: [
          "그래픽디자인",
          "모션그래픽",
          "편집디자인"
        ]
      }),
      PM_SERVICE_PLANNING: Object.freeze({
        majorDefinition: "시각디자인은 서비스의 사용자 경험을 시각적으로 해석합니다.",
        jobConnection: "UX디자인, 정보디자인은 서비스기획에서 사용자 흐름을 이해하는 기초입니다.",
        careerBridge: "다만 디자인 결과물 자체보다 사용자 흐름, 정보 구조, 문제 해결 관점으로 해석하는 것이 적절합니다.",
        appealingCourses: [
          "UX디자인",
          "정보디자인",
          "인터랙션디자인"
        ]
      })
    }
  }),

  ARCHITECTURE_CIVIL: Object.freeze({
    label: "건축·토목",
    generalBridge: "건축·토목은 현실의 제약(예산, 법규, 환경, 시공성, 안전)을 이해하면서 구조물을 설계하고, 현장의 공정·이해관계자·위험을 조율하여 완성하는 실용적 설계 전공입니다.",
    jobBridgeMap: {
      PM_SERVICE_PLANNING: Object.freeze({
        majorDefinition: "건축·토목은 공간과 구조를 설계하고, 시공 공정, 법규, 안전을 함께 다루는 전공입니다.",
        jobConnection: "프로젝트 관리의 핵심은 설계 → 공정 계획 → 현장 시공 → 품질/안전 점검 → 준공의 선형 프로세스를 시간, 예산, 품질 제약 안에서 관리하는 것입니다. 건축·토목 전공에서 배우는 도면 해석, 공정 계획, 위험 예측, 이해관계자 조율은 이 프로세스의 기초입니다.",
        careerBridge: "따라서 건축·토목 전공의 설계 기준, 공정 관리, 안전 법규, 비용 효율성, 현장 문제 해결 능력은 건설 프로젝트의 계획, 실행, 검수, 인수 단계에서 직접 활용됩니다. 다만 실제 건설 현장 경험(인턴, 설계사무소, 시공사 경험) 또는 BIM, CAD 활용 능력이 함께 있으면 설득력이 높아집니다.",
        appealingCourses: [
          "건축설계",
          "건축구조 및 구조역학",
          "건설시공 및 공정관리",
          "건설법규 및 안전관리",
          "도시계획 및 공간설계",
          "BIM(Building Information Modeling)"
        ],
        evidencePrompts: [
          "설계 프로젝트에서 도면 작성, 구조 계산, 법규 준수 확인 경험",
          "건설 현장 인턴/경험 (공정표, 안전, 품질 점검)",
          "복합 프로젝트에서 예산, 공정, 안전을 동시에 고려한 경험"
        ]
      })
    }
  }),

  ENVIRONMENT_SAFETY: Object.freeze({
    label: "환경·안전",
    generalBridge: "환경·안전은 사고가 터진 뒤의 대응이 아니라, 사전에 위험을 식별하고, 법규 기준을 정하고, 현장에서 지키도록 체계를 설계하는 예방 중심의 전공입니다.",
    jobBridgeMap: {
      RISK_MANAGEMENT: Object.freeze({
        majorDefinition: "환경·안전은 위험요인 식별, 법규 준수, 현장 점검, 개선 조치의 체계적 관리를 다루는 전공입니다.",
        jobConnection: "EHS와 환경 컴플라이언스의 핵심은 법규 기준 설정 → 위험요인 식별 → 노출 경로 차단 → 모니터링 → 개선의 체계적 사이클입니다. 환경·안전 전공에서 배우는 유해물질, 위험요인 분류, 노출 평가, 응급 대응, 환경 영향 평가는 이 사이클의 각 단계에 필수적입니다.",
        careerBridge: "따라서 환경·안전 전공에서 배운 위험 분석, 법규 해석, 현장 점검, 개선 조치 설계는 제조업/플랜트의 EHS 관리, 환경 컴플라이언스, 안전 교육 체계 구축으로 직접 연결됩니다. 다만 현장 경험(안전점검, 환경감시)과 관련 자격(산업안전기사, 환경기사)이 있으면 실무 역량이 확실해집니다.",
        appealingCourses: [
          "산업안전관리론",
          "산업보건학",
          "안전공학",
          "환경법규 및 정책",
          "환경영향평가",
          "화학물질 안전관리"
        ],
        evidencePrompts: [
          "현장 안전/환경 점검 경험",
          "위험요인 분석, 개선안 제안 경험",
          "산업 규제(산안법, 환경법) 학습 및 적용"
        ]
      })
    }
  }),

  MATERIALS_SCIENCE: Object.freeze({
    label: "재료공학",
    generalBridge: "재료공학은 물질의 원자·분자 구조와 물성 사이의 관계를 이해하고, 성능 요구사항을 만족시키는 재료를 선택·공정·검증하는 전공입니다.",
    jobBridgeMap: {
      PRODUCTION_MANAGEMENT: Object.freeze({
        majorDefinition: "재료공학은 물성, 공정, 신뢰성을 통합적으로 다루어 제품 성능을 구현하는 전공입니다.",
        jobConnection: "제조업의 재료 선택 → 공정 설계 → 신뢰성 검증 → 불량 분석의 사이클은 재료공학의 핵심입니다. 물성 측정, 공정 최적화, 신뢰성 시험, 불량 원인 분석은 재료공학 교과의 직접 내용입니다.",
        careerBridge: "따라서 재료공학 전공에서 배운 물성 해석, 공정 기술, 신뢰성 평가, 불량 분석 방법은 제조업의 품질 관리, 공정 개선, 신뢰성 검증으로 직접 연결됩니다. 다만 현장 인턴/프로젝트와 구체적 산업 경험(반도체, 배터리, 소재 등)이 있으면 신뢰도가 높아집니다.",
        appealingCourses: [
          "결정구조 및 물질의 구조",
          "재료역학 및 강도학",
          "금속 및 합금공학",
          "세라믹 및 복합재료",
          "재료 시험 및 분석",
          "공정기술 및 열처리"
        ],
        evidencePrompts: [
          "재료 실험 프로젝트 (인장, 경도, 미세구조 분석)",
          "신재료 도입 또는 공정 변수 영향 평가 경험",
          "불량품 분석, 원인 규명, 개선안 제안"
        ]
      })
    }
  }),

  OTHER_ENGINEERING: Object.freeze({
    label: "기타 공학",
    generalBridge: "기타 공학(기계, 화학, 신소재, 에너지 등)은 공통적으로 정의된 문제에 대해 물리·화학 원리를 적용해 설계하고, 실험으로 검증하며, 수치 기반으로 의사결정을 내리는 분석적 사고를 훈련시킵니다.",
    jobBridgeMap: {
      PRODUCTION_MANAGEMENT: Object.freeze({
        majorDefinition: "기타 공학은 공학적 문제 정의, 원인 분석, 설계/실험/검증, 수치 기반 개선을 다루는 전공입니다.",
        jobConnection: "공학적 문제 해결은 산업 전반에서 필요하지만, 직무 연결은 세부 전공에 따라 달라집니다. 공통적으로 생산 현장의 문제 정의 → 원인 분석 → 실험/설계 → 검증 → 개선의 논리는 공학 전공 전체에 공통입니다.",
        careerBridge: "따라서 기타 공학 전공에서 배운 문제 정의, 원리 기반 분석, 설계 검증, 데이터 기반 개선은 제조업의 생산 기술, 공정 최적화, 품질 문제 해결로 연결됩니다. 다만 직무와의 연결 강도는 구체적 세부 전공, 실험 프로젝트, 산업 경험에 따라 달라집니다. 세부 전공명, 수강 과목, 실제 다룬 도구, 산업 인턴 경험이 명확할 때만 공학적 역량이 구체화됩니다.",
        appealingCourses: [
          "공학설계 및 CAD",
          "재료 및 공정 기술",
          "실험 및 측정",
          "통계 및 데이터 분석",
          "시뮬레이션 소프트웨어"
        ],
        evidencePrompts: [
          "공학 설계 프로젝트 (구체적 주제, 도구, 결과)",
          "공정/생산 현장 인턴 경험",
          "문제 분석 및 개선안 도출 경험"
        ]
      })
    }
  }),

  OTHER_BUSINESS: Object.freeze({
    label: "기타 경영",
    generalBridge: "기타 경영(특정 산업 경영, 정량 경영 등)은 폭넓지만, 구체적 세부 전공과 경험에 의존하여 직무 연결이 달라지는 범주의 전공입니다.",
    jobBridgeMap: {
      BUSINESS_STRATEGY: Object.freeze({
        majorDefinition: "기타 경영은 조직, 시장, 고객, 운영, 전략을 이해하는 폭넓은 기초를 제공합니다.",
        jobConnection: "사업전략의 핵심은 시장과 고객을 이해하고, 조직의 강점을 바탕으로 경쟁 전략을 수립하는 것입니다. 기타 경영 전공은 이 전체 과정의 폭넓은 이해를 제공하지만, 경영학(BUSINESS_ADMIN)과 달리 체계적이지는 않습니다.",
        careerBridge: "따라서 기타 경영 전공의 경우, 구체적 세부 전공(금융, 공급망, 산업별)과 대상 산업/직무를 명시할 때만 설득력이 생깁니다. 구체적 과목, 인턴/프로젝트, 성과 경험이 함께 제시되어야 합니다.",
        appealingCourses: [
          "경영전략",
          "시장분석",
          "재무관리",
          "데이터 분석",
          "산업별 경영론"
        ],
        evidencePrompts: [
          "구체적 세부 전공 명시",
          "산업/기업 인턴 경험",
          "특정 산업의 시장 분석 경험"
        ]
      })
    }
  }),

  VIDEO_CONTENT: Object.freeze({
    label: "영상·콘텐츠",
    generalBridge: "영상·콘텐츠는 이야기를 영상/텍스트/이미지 형식으로 기획하고 제작하며, 수용자 반응을 관찰하고 개선하는 예술과 전략의 결합입니다.",
    jobBridgeMap: {
      CONTENT_MARKETING: Object.freeze({
        majorDefinition: "영상·콘텐츠는 스토리보드, 촬영, 편집, 톤&매너, 플랫폼 특성, 성과 분석을 통합적으로 다루는 실무 중심 전공입니다.",
        jobConnection: "콘텐츠 기획과 제작의 핵심은 메시지 → 스토리보드 → 제작 → 배포 → 반응 분석 → 개선의 반복입니다. 영상·콘텐츠 전공에서 배우는 스토리텔링, 시각 문법, 편집 기술, 플랫폼별 특성, 시청자 분석은 이 사이클의 각 단계에 직접 적용됩니다.",
        careerBridge: "따라서 영상·콘텐츠 전공에서 배운 스토리보드, 촬영, 편집, 톤 설정, 플랫폼 최적화는 콘텐츠 기획, 영상 제작, 브랜드 콘텐츠 운영으로 직접 연결됩니다. 마케팅 연결은 성과 데이터(조회, 공유, 전환)를 해석한 경험이 함께 있을 때 강해집니다. 포트폴리오(실제 제작물, 채널 운영, 성과 지표)가 핵심입니다.",
        appealingCourses: [
          "영상제작 및 편집",
          "스토리보드 및 시나리오",
          "촬영 기술",
          "디지털 콘텐츠 전략",
          "SNS 마케팅 및 성과 분석",
          "영상 기획"
        ],
        evidencePrompts: [
          "실제 제작한 영상 포트폴리오",
          "SNS 채널 운영 경험 (팔로어, 조회, 공유 데이터)",
          "영상 성과 분석, 개선 경험"
        ]
      })
    }
  }),

  PR_AD: Object.freeze({
    label: "광고·PR",
    generalBridge: "광고·PR은 누구에게 어떤 메시지를 어떤 채널로 전달할지 설계하고, 브랜드 인식·평판·판매가 어떻게 변하는지 측정하는 전략적 커뮤니케이션 전공입니다.",
    jobBridgeMap: {
      BRAND_PR: Object.freeze({
        majorDefinition: "광고·PR은 브랜드 목표, 타깃 심리, 메시지 전략, 매체 선택, 캠페인 실행, 성과 분석을 다루는 전공입니다.",
        jobConnection: "PR과 광고의 핵심은 서로 다릅니다. PR은 평판, 관계, 이슈 관리를 통해 브랜드 신뢰를 구축하고, 광고는 유료 메시지를 통해 인식을 확산합니다. 광고·PR 전공에서 배우는 타깃 심리, 메시지 톤 설정, 캠페인 기획, 평판 관리, 이슈 대응은 이 두 전략을 통합적으로 운영하는 데 필수적입니다.",
        careerBridge: "따라서 광고·PR 전공에서 배운 타깃 분석, 메시지 개발, 매체 선택, 효과 측정은 브랜드마케팅, 광고 기획, PR 캠페인으로 직접 연결됩니다. 정량 분석(도달, 노출, 전환)과 정성 분석(매체 평판, 여론)을 함께 해석할 수 있으면 경쟁력이 높아집니다. 실제 캠페인 경험(인턴, 프로젝트, 채널 운영)과 성과 지표 분석이 있으면 설득력이 크게 높아집니다.",
        appealingCourses: [
          "광고학 및 광고기획",
          "브랜드 관리",
          "PR론 및 이슈 관리",
          "소비자 심리학",
          "디지털 마케팅",
          "캠페인 전략"
        ],
        evidencePrompts: [
          "실제 캠페인 기획/실행 경험",
          "SNS/디지털 채널 운영 경험",
          "캠페인 성과 분석 경험"
        ]
      })
    }
  })
});

/**
 * Resolve major bridge profile by majorKey and optional jobKey
 * @param {string} majorKey - English key or Korean normalized key
 * @param {string} jobKey - Optional job key for specific bridge
 * @returns {object|null} Bridge profile or null if not found
 */
export function resolveNewgradMajorBridgeProfile(majorKey, jobKey = null) {
  if (!majorKey) return null;

  const normalizedKey = String(majorKey || "").trim();
  let bridgeProfile = null;

  // Direct match with English key
  if (NEWGRAD_MAJOR_BRIDGE_REGISTRY[normalizedKey]) {
    bridgeProfile = NEWGRAD_MAJOR_BRIDGE_REGISTRY[normalizedKey];
  } else {
    // Search by label or aliases
    for (const [key, profile] of Object.entries(NEWGRAD_MAJOR_BRIDGE_REGISTRY)) {
      if (profile.label === normalizedKey) {
        bridgeProfile = profile;
        break;
      }
    }
  }

  if (!bridgeProfile) return null;

  // If jobKey specified, return job-specific bridge
  if (jobKey && bridgeProfile.jobBridgeMap && bridgeProfile.jobBridgeMap[jobKey]) {
    return bridgeProfile.jobBridgeMap[jobKey];
  }

  // Return general bridge if no job match
  return {
    label: bridgeProfile.label,
    generalBridge: bridgeProfile.generalBridge,
    jobBridgeMap: bridgeProfile.jobBridgeMap
  };
}

/**
 * Get appealing courses for a major-job combination
 * @param {string} majorKey - Major key
 * @param {string} jobKey - Job key
 * @returns {array} Appealing courses or empty array
 */
export function getNewgradAppealingCourses(majorKey, jobKey) {
  const bridge = resolveNewgradMajorBridgeProfile(majorKey, jobKey);
  if (!bridge) return [];

  return bridge.appealingCourses || [];
}

export default NEWGRAD_MAJOR_BRIDGE_REGISTRY;
