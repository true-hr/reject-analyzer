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
