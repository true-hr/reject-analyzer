// Role Ontology v1 — Canonical Role Map
// SSOT: 10개 canonical family, distance matrix, domain override

// Evidence level → 숫자 rank (문자열 비교 방지)
export const EVIDENCE_LEVEL_RANK = { none: 0, weak: 1, mixed: 2, good: 3, strong: 4 };

// --- Canonical Family 키워드 맵 ---
// primary: 2점 / secondary: 1점 — score 합산 후 최고점 family 선택
export const ROLE_FAMILY_MAP = {
  DEV: {
    primary: [
      "backend", "frontend", "fullstack", "풀스택", "백엔드", "프론트엔드",
      "software engineer", "소프트웨어 엔지니어", "개발자", "웹 개발",
      "react", "node.js", "spring", "java developer", "kotlin", "swift",
      "devops", "sre", "site reliability", "firmware", "embedded", "펌웨어",
    ],
    secondary: [
      "개발", "engineer", "api", "서버", "git", "typescript", "javascript",
      "python developer", "클라우드", "aws", "docker", "kubernetes",
    ],
  },
  DATA: {
    primary: [
      "데이터 분석", "데이터분석", "data analyst", "data scientist",
      "data engineer", "데이터 엔지니어", "bi", "머신러닝", "딥러닝",
      "machine learning", "ml engineer", "ai engineer", "분석가",
    ],
    secondary: [
      "통계", "sql", "analytics", "데이터", "리포팅", "tableau",
      "power bi", "python", "r언어", "시각화", "지표",
    ],
  },
  PM: {
    primary: [
      "프로덕트 매니저", "product manager", "프로덕트매니저",
      "product owner", "po", "서비스기획", "서비스 기획",
      "기획자", "프로덕트 오너",
      "프로젝트 매니저", "project manager", // ✅ PATCH ROUND 20-A: fa-03 resume family UNKNOWN 수정
    ],
    secondary: [
      "기획", "로드맵", "요구사항", "sprint", "agile", "ux", "사용자 조사",
      "기능 정의", "백로그", "스프린트",
    ],
  },
  BIZ: {
    primary: [
      "전략기획", "사업기획", "경영기획", "business strategy",
      "전략 컨설팅", "컨설턴트", "consultant", "신사업", "사업 개발",
      "corporate strategy", "전략팀",
    ],
    secondary: [
      "전략", "kpi", "okr", "시장분석", "go-to-market", "gtm",
      "사업계획", "중장기", "경영전략", "비즈니스",
    ],
  },
  SALES: {
    primary: [
      "영업", "sales", "business development", "bd", "account manager",
      "b2b 영업", "b2c 영업", "영업관리", "세일즈", "법인영업", "채널영업",
    ],
    secondary: [
      "고객", "계약", "수주", "매출", "crm", "파이프라인", "리드",
      "키 어카운트", "파트너", "대리점",
    ],
  },
  MARKETING: {
    primary: [
      "마케팅", "marketing", "브랜드", "brand", "퍼포먼스 마케팅",
      "performance marketing", "growth", "그로스", "콘텐츠 마케팅",
      "digital marketing", "디지털 마케팅",
    ],
    secondary: [
      "캠페인", "seo", "sns", "광고", "브랜딩", "리텐션", "유입",
      "콘텐츠", "인플루언서", "그로스 해킹",
    ],
  },
  OPS: {
    primary: [
      "운영", "scm", "supply chain", "구매", "소싱", "sourcing",
      "물류", "logistics", "생산관리", "공정관리", "품질관리", "qc", "qa",
      "pmo", // ✅ PATCH ROUND 20-A: rc-05 regression 방지 — PMO 포함 이력은 OPS 우세 유지
    ],
    secondary: [
      "ops", "operation", "납기", "재고", "조달", "제조", "cpo",
      "공급망", "벤더", "입출고",
    ],
  },
  HR: {
    primary: [
      "인사", "hr", "채용", "hrbp", "hrd", "조직문화",
      "인재개발", "인사기획", "hr manager", "talent acquisition",
      "인사담당", "people",
    ],
    secondary: [
      "리크루팅", "교육", "평가", "보상", "인사관리", "조직",
      "온보딩", "노무", "복리후생",
    ],
  },
  FINANCE: {
    primary: [
      "재무", "회계", "fp&a", "세무", "ir", "finance", "accounting",
      "재무기획", "cfo", "재무관리", "원가관리",
    ],
    secondary: [
      "예산", "결산", "감사", "공시", "내부통제", "투자",
      "손익", "재무제표", "세금", "경리",
    ],
  },
  RND: {
    primary: [
      "연구개발", "r&d", "rnd", "연구원", "하드웨어", "hw",
      "회로설계", "공정", "소자", "반도체", "실험", "researcher",
    ],
    secondary: [
      "설계", "검증", "시험", "특허", "논문", "모델링", "알고리즘",
      "기구", "pcb", "fpga",
    ],
  },
};

// --- Distance Matrix (4단계: same / adjacent / transferable / distant) ---
// hard_mismatch는 matrix에 없음 — distant + evidenceRank <= 1일 때 동적 승격
export const DISTANCE_MATRIX = {
  DEV:       { DEV: "same",         DATA: "adjacent",     PM: "transferable",  BIZ: "transferable", SALES: "distant",      MARKETING: "distant",      OPS: "transferable", HR: "distant",      FINANCE: "distant",      RND: "adjacent"     },
  DATA:      { DEV: "adjacent",     DATA: "same",         PM: "adjacent",      BIZ: "adjacent",     SALES: "transferable", MARKETING: "transferable", OPS: "transferable", HR: "distant",      FINANCE: "transferable", RND: "adjacent"     },
  PM:        { DEV: "transferable", DATA: "adjacent",     PM: "same",          BIZ: "adjacent",     SALES: "transferable", MARKETING: "transferable", OPS: "transferable", HR: "distant",      FINANCE: "distant",      RND: "transferable" },
  BIZ:       { DEV: "transferable", DATA: "adjacent",     PM: "adjacent",      BIZ: "same",         SALES: "transferable", MARKETING: "transferable", OPS: "transferable", HR: "transferable", FINANCE: "adjacent",     RND: "distant"      },
  SALES:     { DEV: "distant",      DATA: "transferable", PM: "transferable",  BIZ: "transferable", SALES: "same",         MARKETING: "adjacent",     OPS: "transferable", HR: "distant",      FINANCE: "transferable", RND: "distant"      },
  MARKETING: { DEV: "distant",      DATA: "transferable", PM: "transferable",  BIZ: "transferable", SALES: "adjacent",     MARKETING: "same",         OPS: "transferable", HR: "distant",      FINANCE: "distant",      RND: "distant"      },
  OPS:       { DEV: "transferable", DATA: "transferable", PM: "transferable",  BIZ: "transferable", SALES: "transferable", MARKETING: "transferable", OPS: "same",         HR: "transferable", FINANCE: "transferable", RND: "adjacent"     },
  HR:        { DEV: "distant",      DATA: "distant",      PM: "distant",       BIZ: "transferable", SALES: "distant",      MARKETING: "distant",      OPS: "transferable", HR: "same",         FINANCE: "transferable", RND: "distant"      },
  FINANCE:   { DEV: "distant",      DATA: "transferable", PM: "distant",       BIZ: "adjacent",     SALES: "transferable", MARKETING: "distant",      OPS: "transferable", HR: "transferable", FINANCE: "same",         RND: "distant"      },
  RND:       { DEV: "adjacent",     DATA: "adjacent",     PM: "transferable",  BIZ: "distant",      SALES: "distant",      MARKETING: "distant",      OPS: "adjacent",     HR: "distant",      FINANCE: "distant",      RND: "same"         },
};

// --- MARKETING Sub-family Map (append-only) ---
// MARKETING 대분류 유지 + 내부 sub-family 구분 보조용
// 용도: computeRoleDistance.js inferMarketingSubFamily() → analyzer [B2] 보조 mismatch
// primary: 3점 (확실한 특정어) / secondary: 1점 (보조 신호)
// 판정: primary hit 1개 이상 있을 때만 known 처리 (secondary 단독 UNKNOWN)
export const MARKETING_SUBFAMILY_MAP = {
  MKT_PERFORMANCE: {
    primary: [
      "퍼포먼스 마케팅", "performance marketing", "그로스 마케팅",
      "paid marketing", "퍼포먼스마케팅", "paid 광고", "growth marketing",
    ],
    secondary: [
      "광고 운영", "매체 운영", "cpa", "roas", "cpc", "그로스",
      "paid media", "ua", "검색광고",
    ],
  },
  MKT_BRAND: {
    primary: [
      "브랜드 마케팅", "brand marketing", "브랜드 전략",
      "브랜드 커뮤니케이션", "브랜드 아이덴티티", "브랜드매니저",
    ],
    secondary: [
      "브랜딩", "브랜드 인지도", "brand awareness", "brand identity",
      "브랜드 가이드", "브랜드 관리",
    ],
  },
  MKT_CONTENT: {
    primary: [
      "콘텐츠 마케팅", "content marketing", "콘텐츠 기획",
      "에디토리얼", "sns 콘텐츠", "sns 기획",
    ],
    secondary: [
      "콘텐츠 제작", "콘텐츠 운영", "블로그", "유튜브 운영",
      "소셜 미디어", "에디터", "인스타그램 운영",
    ],
  },
};

// --- BIZ Sub-family Map (append-only) ---
// BIZ 대분류 유지 + 내부 sub-family 구분 보조용
// 용도: computeRoleDistance.js inferBizSubFamily() → analyzer [B3] 보조 mismatch
// primary: 3점 (확실한 특정어) / secondary: 1점 (보조 신호)
// 판정: primary hit 1개 이상 있을 때만 known 처리 (secondary 단독 UNKNOWN)
export const BIZ_SUBFAMILY_MAP = {
  BIZ_STRATEGY: {
    primary: [
      "전략기획", "corporate strategy", "경영전략", "전략 컨설팅",
      "전략팀", "사업 전략", "strategic planning", "전략 수립",
    ],
    secondary: [
      "전략 방향", "중장기 전략", "gtm", "go-to-market",
      "신사업 전략", "전략 과제", "성장 전략",
    ],
  },
  BIZ_OPERATION: {
    primary: [
      "운영기획", "영업기획", "사업 운영", "비즈니스 운영",
      "biz ops", "business operations", "운영 전략",
    ],
    secondary: [
      "프로세스 개선", "운영 효율", "실행 계획", "실무 기획",
      "운영 관리", "ops 기획",
    ],
  },
  BIZ_PLANNING: {
    primary: [
      "사업기획", "경영기획", "business planning", "사업계획",
      "경영 계획", "중장기 계획", "사업 계획 수립",
    ],
    secondary: [
      "예산 기획", "계획 수립", "기획 업무", "사업 계획",
      "연간 계획", "중장기",
    ],
  },
};

// --- DEV Sub-family Map (append-only) ---
// DEV 대분류 유지 + 내부 sub-family 구분 보조용
// 용도: computeRoleDistance.js inferDevSubFamily() → analyzer [B4] 보조 mismatch
// primary: 3점 / secondary: 1점 — primary hit 1개 이상 있을 때만 known 처리
export const DEV_SUBFAMILY_MAP = {
  DEV_MOBILE: {
    primary: [
      "ios", "android", "swift", "kotlin", "flutter", "react native",
      "모바일 앱", "ios 앱", "android 앱", "앱 개발자",
    ],
    secondary: [
      "objective-c", "xcode", "앱스토어", "구글 플레이", "mobile", "네이티브 앱",
    ],
  },
  DEV_FRONTEND: {
    primary: [
      "프론트엔드", "frontend", "react", "vue.js", "vue", "angular",
      "웹 프론트", "웹 UI", "웹 개발자", "프론트엔드 개발",
    ],
    secondary: [
      "javascript", "typescript", "html", "css", "scss", "pwa",
      "웹 서비스 개발", "ui 개발", "웹 접근성",
    ],
  },
  DEV_BACKEND: {
    primary: [
      "백엔드", "backend", "spring", "spring boot", "django", "fastapi",
      "node.js", "서버 개발", "api 서버", "백엔드 개발",
    ],
    secondary: [
      "rest api", "db 설계", "마이크로서비스", "서버리스", "java",
      "mysql", "postgresql", "서버 운영",
    ],
  },
  DEV_INFRA: {
    primary: [
      "인프라", "devops", "sre", "infrastructure", "terraform",
      "kubernetes", "ci/cd", "클라우드 인프라", "인프라 엔지니어",
    ],
    secondary: [
      "docker", "배포 자동화", "서버 운영", "네트워크 관리",
      "aws 인프라", "장애 대응", "보안 점검",
    ],
  },
};

// --- FINANCE Sub-family Map (append-only) ---
// FINANCE 대분류 유지 + 내부 sub-family 구분 보조용
// 용도: computeRoleDistance.js inferFinanceSubFamily() → analyzer [B5] 보조 mismatch
// primary: 3점 / secondary: 1점 — primary hit 1개 이상 있을 때만 known 처리
export const FINANCE_SUBFAMILY_MAP = {
  FIN_PLANNING: {
    primary: [
      "fp&a", "재무기획", "재무 기획", "재무 모델링", "재무계획",
      "예산 계획", "재무 전략", "재무 분석", "투자 타당성",
    ],
    secondary: [
      "예산 편성", "실적 분석", "예산 관리", "비용 분석",
      "budget planning", "financial planning",
    ],
  },
  FIN_ACCOUNTING: {
    primary: [
      "회계", "accounting", "결산", "전표", "재무제표",
      "ifrs", "gaap", "감사", "원가관리", "원가회계",
    ],
    secondary: [
      "장부", "경리", "분개", "계정", "외감", "내부통제",
      "erp 회계", "재무 보고", "공시",
    ],
  },
  FIN_TAX: {
    primary: [
      "세무", "법인세", "부가세", "세무조정", "세무 조정",
      "이전가격", "세무조사", "세금신고",
    ],
    secondary: [
      "세금", "세무 리스크", "tax", "조세", "세무사",
      "세무 대응", "세무 신고",
    ],
  },
};

// --- Management Support Canonical Subdomain Map (append-only) ---
// SSOT for management-support taxonomy v0.
// Notes:
// - planning_budget_control is intentionally modeled as a bridge between
//   BIZ_PLANNING and FIN_PLANNING to avoid naming drift.
// - biz_ops_management_support is intentionally separated from
//   planning_budget_control: the former is support/coordination cadence,
//   the latter is plan/budget/performance control.
// - Generic support words such as "지원/운영/관리/문서/보고" are not
//   treated as standalone positive signals; they are only useful when
//   paired with domain anchors listed below.
export const MANAGEMENT_SUPPORT_SUBDOMAIN_MAP = {
  finance_accounting: {
    parentFamilies: ["FINANCE"],
    bridgeSubFamilies: ["FIN_ACCOUNTING"],
    titleAnchors: ["회계", "재무", "재경", "재무회계", "관리회계", "accounting", "finance"],
    taskAnchors: ["결산", "정산", "전표", "자금", "재무제표", "채권채무", "출납"],
    guardedPairs: ["회계 결산", "재무 보고", "자금 관리"],
  },
  planning_budget_control: {
    parentFamilies: ["BIZ", "FINANCE"],
    bridgeSubFamilies: ["BIZ_PLANNING", "FIN_PLANNING"],
    titleAnchors: ["경영기획", "사업기획", "fp&a", "예산", "예실관리", "실적관리"],
    taskAnchors: ["예산편성", "예산 관리", "사업계획", "손익분석", "실적 분석", "kpi 관리", "variance"],
    guardedPairs: ["예산 보고", "실적 보고", "보고자료 작성", "경영실적 보고"],
  },
  hr_people_ops: {
    parentFamilies: ["HR"],
    bridgeSubFamilies: [],
    titleAnchors: ["인사운영", "인사행정", "people ops", "hr operations", "인사총무"],
    taskAnchors: ["입퇴사", "근태", "급여", "4대보험", "평가보상", "payroll", "hris"],
    guardedPairs: ["급여 정산", "근태 관리", "4대보험 신고"],
  },
  general_affairs_admin: {
    parentFamilies: ["BIZ", "OPS"],
    bridgeSubFamilies: [],
    titleAnchors: ["총무", "총무관리", "사무행정", "행정지원", "general affairs", "office administration"],
    taskAnchors: ["자산관리", "비품관리", "시설관리", "문서수발", "법인차량", "복리후생 운영"],
    guardedPairs: ["자산 관리", "비품 관리", "시설 관리"],
  },
  legal_compliance: {
    parentFamilies: ["FINANCE", "HR", "BIZ"],
    bridgeSubFamilies: [],
    titleAnchors: ["법무", "준법", "컴플라이언스", "legal", "compliance"],
    taskAnchors: ["계약검토", "계약 검토", "규정관리", "감사 대응", "내부통제", "개인정보"],
    guardedPairs: ["규정 관리", "감사 대응", "계약 검토"],
  },
  biz_ops_management_support: {
    parentFamilies: ["BIZ", "OPS"],
    bridgeSubFamilies: ["BIZ_OPERATION"],
    titleAnchors: ["경영지원", "운영지원", "management support", "business support"],
    taskAnchors: ["경영진 지원", "이사회 지원", "회의체 운영", "정부지원사업", "일정 조율"],
    guardedPairs: ["경영진 보고", "회의 자료", "보고 체계 운영"],
  },
};

// --- Domain-Sensitive Override ---
// 특정 산업에서 base tier 완화 규칙 (key: "FROM→TO")
export const DOMAIN_OVERRIDES = {
  // 금융/핀테크: SALES↔FINANCE, DATA↔FINANCE 인접
  "금융": {
    "SALES→FINANCE": "adjacent", "FINANCE→SALES": "adjacent",
    "DATA→FINANCE":  "adjacent", "FINANCE→DATA":  "adjacent",
  },
  "핀테크": {
    "SALES→FINANCE": "adjacent", "FINANCE→SALES": "adjacent",
    "DATA→FINANCE":  "adjacent", "FINANCE→DATA":  "adjacent",
  },
  // IT 스타트업: DEV↔PM 더 인접
  "스타트업": {
    "DEV→PM": "adjacent", "PM→DEV": "adjacent",
  },
  "it": {
    "DEV→PM": "adjacent", "PM→DEV": "adjacent",
  },
  // 제조/중공업: OPS↔BIZ 완화
  "제조": {
    "OPS→BIZ": "adjacent", "BIZ→OPS": "adjacent",
  },
  "중공업": {
    "OPS→BIZ": "adjacent", "BIZ→OPS": "adjacent",
  },
};
