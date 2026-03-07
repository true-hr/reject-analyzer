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
