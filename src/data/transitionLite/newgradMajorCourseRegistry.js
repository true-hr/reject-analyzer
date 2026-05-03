// @MX:NOTE: Round 1 Major Course Registry - 10개 전공의 핵심 과목, 개념, 직무 연결
// Purpose: centralize major course information to prevent pollution and enable reuse

export const NEWGRAD_MAJOR_COURSE_REGISTRY = Object.freeze({
  ECONOMICS: Object.freeze({
    label: "경제학",
    aliases: ["경제학"],
    coreCourses: [
      "경제학원론",
      "미시경제학",
      "거시경제학",
      "경제수학",
      "경제통계학",
      "계량경제학",
      "산업조직론",
      "게임이론",
      "행동경제학",
      "소비자경제학",
      "금융경제학",
      "화폐금융론",
      "국제경제학"
    ],
    coreConcepts: [
      "수요와 공급",
      "가격 결정",
      "경쟁 구조",
      "소비자 선택",
      "시장 구조",
      "인센티브",
      "효용",
      "비용과 편익"
    ],
    jobCourseMap: {
      PRODUCT_MARKETING_PMM: [
        "미시경제학",
        "산업조직론",
        "행동경제학",
        "소비자경제학"
      ],
      DATA_ANALYSIS: [
        "경제통계학",
        "계량경제학",
        "시계열분석"
      ],
      BUSINESS_STRATEGY: [
        "산업조직론",
        "게임이론",
        "거시경제학"
      ]
    },
    strongFitJobGroups: [
      "상품/프로덕트마케팅",
      "사업기획",
      "전략기획",
      "금융분석",
      "데이터분석"
    ],
    cautionPhrases: [
      "전공만으로 제품 출시 경험 단정 금지",
      "전공만으로 마케팅 캠페인 운영 경험 단정 금지",
      "전공을 모든 비즈니스 직무에 직접 적합하다고 과장 금지"
    ]
  }),

  BUSINESS_ADMIN: Object.freeze({
    label: "경영학",
    aliases: ["경영학"],
    coreCourses: [
      "경영학원론",
      "경영전략",
      "조직행동론",
      "인적자원관리",
      "마케팅원론",
      "마케팅관리",
      "소비자행동론",
      "시장조사론",
      "브랜드관리",
      "제품관리",
      "신제품개발론",
      "서비스마케팅",
      "재무관리",
      "관리회계"
    ],
    coreConcepts: [
      "고객",
      "시장",
      "제품",
      "브랜드",
      "전략",
      "수익모델",
      "비용 구조",
      "조직 운영"
    ],
    jobCourseMap: {
      PRODUCT_MARKETING_PMM: [
        "마케팅원론",
        "마케팅관리",
        "소비자행동론",
        "시장조사론",
        "제품관리",
        "신제품개발론",
        "브랜드관리",
        "가격전략"
      ],
      BUSINESS_STRATEGY: [
        "경영전략",
        "재무관리",
        "비즈니스모델설계",
        "창업론"
      ],
      HR_ORGANIZATION: [
        "조직행동론",
        "인적자원관리",
        "조직설계",
        "리더십"
      ]
    },
    strongFitJobGroups: [
      "PMM",
      "사업기획",
      "전략기획",
      "영업/BD",
      "마케팅",
      "HR"
    ],
    cautionPhrases: [
      "전공만으로 특정 산업 전문성 확인 단정 금지",
      "마케팅 과목만으로 캠페인 운영 경험 단정 금지",
      "제품관리 과목만으로 PM 실무 경험 단정 금지",
      "실제 경험 근거 없으면 문구가 추상적으로 흐를 수 있음 명시"
    ]
  }),

  COMPUTER_SCIENCE: Object.freeze({
    label: "컴퓨터공학",
    aliases: ["컴퓨터공학"],
    coreCourses: [
      "컴퓨터공학개론",
      "프로그래밍기초",
      "자료구조",
      "알고리즘",
      "컴퓨터구조",
      "운영체제",
      "데이터베이스",
      "컴퓨터네트워크",
      "소프트웨어공학",
      "웹프로그래밍",
      "서버프로그래밍",
      "Python프로그래밍",
      "정보보호",
      "인공지능",
      "기계학습"
    ],
    coreConcepts: [
      "프로그래밍",
      "자료구조",
      "알고리즘",
      "시스템 구조",
      "서버",
      "데이터베이스",
      "네트워크",
      "보안"
    ],
    jobCourseMap: {
      BACKEND_DEVELOPMENT: [
        "자료구조",
        "알고리즘",
        "운영체제",
        "데이터베이스",
        "컴퓨터네트워크",
        "서버프로그래밍"
      ],
      DATA_ANALYSIS: [
        "데이터베이스",
        "Python프로그래밍",
        "알고리즘"
      ],
      PM_SERVICE_PLANNING: [
        "소프트웨어공학",
        "데이터베이스",
        "웹프로그래밍"
      ]
    },
    strongFitJobGroups: [
      "백엔드개발",
      "프론트엔드개발",
      "데이터엔지니어링",
      "데이터분석",
      "정보보안",
      "PM"
    ],
    cautionPhrases: [
      "전공만으로 실무 서비스 운영 경험이 있다고 말하지 않기",
      "수업 프로젝트만으로 대규모 트래픽 처리 경험 단정 금지",
      "AI 과목만으로 모델링 실무 경험 단정 금지",
      "PM 연결 시 '개발 구조 이해'이지 '기획 경험'으로 과장 금지"
    ]
  }),

  INDUSTRIAL_ENGINEERING: Object.freeze({
    label: "산업공학",
    aliases: ["산업공학"],
    coreCourses: [
      "산업공학개론",
      "확률통계",
      "경영과학",
      "최적화",
      "생산관리",
      "생산시스템설계",
      "품질경영",
      "통계적품질관리",
      "공정관리",
      "공급망관리",
      "물류관리",
      "재고관리",
      "수요예측",
      "시뮬레이션",
      "데이터분석"
    ],
    coreConcepts: [
      "프로세스",
      "최적화",
      "생산성",
      "품질",
      "비용",
      "병목",
      "수요예측",
      "재고"
    ],
    jobCourseMap: {
      PRODUCTION_MANAGEMENT: [
        "생산관리",
        "생산시스템설계",
        "공정관리",
        "품질경영",
        "통계적품질관리"
      ],
      SCM_LOGISTICS: [
        "공급망관리",
        "물류관리",
        "재고관리",
        "수요예측",
        "최적화"
      ],
      DATA_ANALYSIS: [
        "확률통계",
        "데이터분석",
        "시뮬레이션",
        "최적화"
      ],
      PM_SERVICE_PLANNING: [
        "프로세스혁신",
        "시뮬레이션",
        "시스템분석설계"
      ]
    },
    strongFitJobGroups: [
      "생산관리",
      "SCM",
      "물류",
      "품질관리",
      "데이터분석",
      "운영기획",
      "PM"
    ],
    cautionPhrases: [
      "전공만으로 특정 제조공정 경험이 있다고 단정 금지",
      "SCM 과목만으로 실제 물류 운영 경험 단정 금지",
      "데이터분석 과목만으로 실무 데이터 파이프라인 경험 단정 금지",
      "서비스기획 연결 시 '사용자 경험 설계'가 아니라 '프로세스와 시스템 관점' 강조"
    ]
  }),

  FINANCE: Object.freeze({
    label: "금융",
    aliases: ["금융"],
    coreCourses: [
      "금융학개론",
      "재무관리",
      "기업재무",
      "투자론",
      "금융시장론",
      "금융기관론",
      "파생상품론",
      "포트폴리오이론",
      "리스크관리",
      "국제금융론",
      "보험론",
      "자산운용론",
      "재무제표분석",
      "기업가치평가",
      "금융통계"
    ],
    coreConcepts: [
      "자본",
      "수익률",
      "위험",
      "할인율",
      "현금흐름",
      "기업가치",
      "포트폴리오",
      "자산배분"
    ],
    jobCourseMap: {
      FINANCE_ANALYSIS: [
        "투자론",
        "기업재무",
        "기업가치평가",
        "재무제표분석",
        "금융시장론"
      ],
      FINANCIAL_PLANNING: [
        "재무관리",
        "기업재무",
        "재무제표분석",
        "기업가치평가",
        "금융통계"
      ],
      RISK_MANAGEMENT: [
        "리스크관리",
        "파생상품론",
        "금융통계",
        "포트폴리오이론"
      ]
    },
    strongFitJobGroups: [
      "금융분석",
      "투자리서치",
      "자산운용",
      "재무기획",
      "리스크관리"
    ],
    cautionPhrases: [
      "전공만으로 실제 투자 수익이나 운용 경험이 있다고 말하지 않기",
      "투자론 과목만으로 리서치 실무가 가능하다고 단정 금지",
      "금융공학 과목 미수강 시 파생상품 모델링 역량 단정 금지"
    ]
  }),

  MATH_STATISTICS: Object.freeze({
    label: "수학·통계",
    aliases: ["수학·통계", "수학", "통계"],
    coreCourses: [
      "미적분학",
      "선형대수",
      "확률론",
      "수리통계학",
      "통계학개론",
      "회귀분석",
      "분산분석",
      "실험계획법",
      "표본조사론",
      "다변량통계분석",
      "시계열분석",
      "데이터마이닝",
      "기계학습",
      "통계프로그래밍",
      "Python데이터분석"
    ],
    coreConcepts: [
      "확률",
      "추정",
      "검정",
      "분포",
      "상관관계",
      "회귀",
      "예측",
      "모델링"
    ],
    jobCourseMap: {
      DATA_ANALYSIS: [
        "통계학개론",
        "수리통계학",
        "회귀분석",
        "데이터마이닝",
        "통계프로그래밍",
        "Python데이터분석"
      ],
      MARKETING_ANALYSIS: [
        "표본조사론",
        "회귀분석",
        "실험계획법",
        "데이터마이닝"
      ],
      FINANCE_ANALYSIS: [
        "확률론",
        "시계열분석",
        "수리통계학"
      ],
      AI_ML: [
        "선형대수",
        "확률론",
        "기계학습",
        "데이터마이닝"
      ]
    },
    strongFitJobGroups: [
      "데이터분석",
      "데이터사이언스",
      "마케팅분석",
      "금융분석",
      "리서치"
    ],
    cautionPhrases: [
      "전공만으로 실제 비즈니스 데이터 분석 경험이 있다고 말하지 않기",
      "수학 전공만으로 Python/R 활용 경험이 있다고 단정 금지",
      "기계학습 과목이 없는데 AI 모델링 역량을 강하게 말하지 않기",
      "도메인 이해와 실무 데이터 경험이 별도 보완 포인트임을 명시"
    ]
  }),

  LAW: Object.freeze({
    label: "법학",
    aliases: ["법학"],
    coreCourses: [
      "법학개론",
      "헌법",
      "민법",
      "형법",
      "상법",
      "행정법",
      "민사소송법",
      "노동법",
      "경제법",
      "공정거래법",
      "회사법",
      "지식재산권법",
      "개인정보보호법",
      "정보통신법",
      "금융법"
    ],
    coreConcepts: [
      "규정",
      "계약",
      "권리와 의무",
      "책임",
      "리스크",
      "규제",
      "준법",
      "분쟁"
    ],
    jobCourseMap: {
      LEGAL_COMPLIANCE: [
        "민법",
        "상법",
        "회사법",
        "노동법",
        "경제법",
        "개인정보보호법",
        "공정거래법"
      ],
      HR_ORGANIZATION: [
        "노동법",
        "개인정보보호법",
        "민법"
      ],
      BUSINESS_STRATEGY: [
        "상법",
        "회사법",
        "공정거래법",
        "경제법"
      ],
      FINTECH_POLICY: [
        "금융법",
        "개인정보보호법",
        "정보통신법"
      ]
    },
    strongFitJobGroups: [
      "법무",
      "컴플라이언스",
      "HR",
      "사업기획",
      "플랫폼정책"
    ],
    cautionPhrases: [
      "전공만으로 변호사 수준의 법률 검토가 가능하다고 말하지 않기",
      "법률 과목 수강만으로 계약서 실무 작성 경험 단정 금지",
      "HR 연결 시 노동법 이해와 인사 실무 경험을 구분할 것"
    ]
  }),

  PSYCHOLOGY_COUNSELING: Object.freeze({
    label: "심리·상담",
    aliases: ["심리·상담", "심리학", "상담"],
    coreCourses: [
      "심리학개론",
      "발달심리학",
      "성격심리학",
      "사회심리학",
      "인지심리학",
      "학습심리학",
      "상담심리학",
      "산업및조직심리학",
      "소비자심리학",
      "심리통계",
      "심리측정",
      "심리검사",
      "연구방법론",
      "의사결정심리학"
    ],
    coreConcepts: [
      "동기",
      "정서",
      "인지",
      "행동",
      "성격",
      "태도",
      "의사결정",
      "설득"
    ],
    jobCourseMap: {
      HR_RECRUITMENT: [
        "산업및조직심리학",
        "심리측정",
        "심리검사",
        "성격심리학",
        "연구방법론"
      ],
      MARKETING_BRAND: [
        "소비자심리학",
        "사회심리학",
        "의사결정심리학"
      ],
      UX_RESEARCH: [
        "인지심리학",
        "연구방법론",
        "의사결정심리학"
      ],
      CUSTOMER_EXPERIENCE: [
        "사회심리학",
        "상담심리학",
        "소비자심리학"
      ]
    },
    strongFitJobGroups: [
      "HR",
      "채용",
      "HRD",
      "마케팅",
      "UX리서치",
      "고객경험"
    ],
    cautionPhrases: [
      "전공만으로 임상 상담 전문가 수준이라고 말하지 않기",
      "심리검사 과목만으로 채용평가 실무 경험 단정 금지",
      "소비자심리학만으로 마케팅 캠페인 운영 경험 단정 금지",
      "상담 경험이 입력되지 않았는데 상담 실무 역량 단정 금지"
    ]
  }),

  MEDIA: Object.freeze({
    label: "언론·미디어",
    aliases: ["언론·미디어", "신문방송", "미디어"],
    coreCourses: [
      "커뮤니케이션이론",
      "매스커뮤니케이션",
      "미디어사회학",
      "미디어산업론",
      "뉴미디어론",
      "저널리즘이론",
      "방송제작",
      "영상제작",
      "콘텐츠기획",
      "스토리텔링",
      "광고학",
      "PR론",
      "광고기획",
      "브랜드커뮤니케이션",
      "통합마케팅커뮤니케이션"
    ],
    coreConcepts: [
      "메시지",
      "콘텐츠",
      "수용자",
      "미디어채널",
      "여론",
      "설득",
      "캠페인",
      "스토리텔링"
    ],
    jobCourseMap: {
      CONTENT_MARKETING: [
        "콘텐츠기획",
        "스토리텔링",
        "뉴미디어론",
        "소셜미디어분석"
      ],
      BRAND_PR: [
        "PR론",
        "브랜드커뮤니케이션",
        "통합마케팅커뮤니케이션"
      ],
      ADVERTISING_PLANNING: [
        "광고학",
        "광고기획",
        "소비자심리"
      ],
      PLATFORM_PLANNING: [
        "뉴미디어론",
        "미디어산업론",
        "디지털미디어전략"
      ]
    },
    strongFitJobGroups: [
      "콘텐츠마케팅",
      "브랜드마케팅",
      "PR",
      "광고기획",
      "소셜미디어",
      "플랫폼기획"
    ],
    cautionPhrases: [
      "전공만으로 실제 콘텐츠 성과를 냈다고 말하지 않기",
      "영상제작 과목만으로 브랜드 전략 역량 단정 금지",
      "광고학 과목만으로 캠페인 운영 경험 단정 금지",
      "조회수, 전환율 등 성과는 실제 입력이 있을 때만 언급"
    ]
  }),

  VISUAL_DESIGN: Object.freeze({
    label: "시각디자인",
    aliases: ["시각디자인", "디자인"],
    coreCourses: [
      "디자인개론",
      "기초디자인",
      "조형원리",
      "색채학",
      "타이포그래피",
      "그래픽디자인",
      "시각디자인",
      "편집디자인",
      "브랜드디자인",
      "아이덴티티디자인",
      "패키지디자인",
      "광고디자인",
      "웹디자인",
      "UI디자인",
      "UX디자인"
    ],
    coreConcepts: [
      "시각전달",
      "사용자인지",
      "브랜드이미지",
      "정보구조",
      "레이아웃",
      "색채",
      "타이포그래피",
      "아이덴티티"
    ],
    jobCourseMap: {
      UI_UX_DESIGN: [
        "UI디자인",
        "UX디자인",
        "인터랙션디자인",
        "정보디자인",
        "웹디자인"
      ],
      BRAND_DESIGN: [
        "브랜드디자인",
        "아이덴티티디자인",
        "색채학",
        "타이포그래피",
        "광고디자인",
        "패키지디자인"
      ],
      CONTENT_MARKETING: [
        "그래픽디자인",
        "모션그래픽",
        "광고디자인",
        "편집디자인"
      ],
      PM_SERVICE_PLANNING: [
        "UX디자인",
        "인터랙션디자인",
        "정보디자인"
      ]
    },
    strongFitJobGroups: [
      "UI/UX디자인",
      "브랜드디자인",
      "콘텐츠디자인",
      "콘텐츠마케팅",
      "광고디자인",
      "PM"
    ],
    cautionPhrases: [
      "시각디자인 전공만으로 서비스기획 실무 경험이 있다고 말하지 않기",
      "UI 과목만으로 개발 협업이나 제품 운영 경험 단정 금지",
      "브랜드디자인 과목만으로 브랜드 전략 전체 수행했다고 말하지 않기",
      "포트폴리오나 프로젝트 입력이 없으면 결과물 품질 단정 금지"
    ]
  })
});

/**
 * Resolve major course profile by majorKey
 * Handles both English keys (ECONOMICS) and Korean normalized keys (경제학)
 * @param {string} majorKey - English key or Korean normalized key
 * @returns {object|null} Major course profile or null if not found
 */
export function resolveNewgradMajorCourseProfile(majorKey) {
  if (!majorKey) return null;

  const normalizedKey = String(majorKey || "").trim();

  // Direct match with English key
  if (NEWGRAD_MAJOR_COURSE_REGISTRY[normalizedKey]) {
    return NEWGRAD_MAJOR_COURSE_REGISTRY[normalizedKey];
  }

  // Search by Korean alias
  for (const [key, profile] of Object.entries(NEWGRAD_MAJOR_COURSE_REGISTRY)) {
    if (profile.aliases && profile.aliases.includes(normalizedKey)) {
      return profile;
    }
  }

  return null;
}

/**
 * Get job courses for a specific major and job
 * @param {string} majorKey - Major key
 * @param {string} jobKey - Job key
 * @returns {array} Job-specific course list or empty array
 */
export function getNewgradJobCourses(majorKey, jobKey) {
  const profile = resolveNewgradMajorCourseProfile(majorKey);
  if (!profile || !jobKey) return [];

  const jobCourses = profile.jobCourseMap?.[jobKey];
  return jobCourses || [];
}

/**
 * Check if major fits job group
 * @param {string} majorKey - Major key
 * @param {string} jobGroup - Job group name
 * @returns {boolean} Whether major strongly fits job group
 */
export function isNewgradMajorFitJobGroup(majorKey, jobGroup) {
  const profile = resolveNewgradMajorCourseProfile(majorKey);
  if (!profile) return false;

  return profile.strongFitJobGroups?.includes(jobGroup) || false;
}

export default NEWGRAD_MAJOR_COURSE_REGISTRY;
