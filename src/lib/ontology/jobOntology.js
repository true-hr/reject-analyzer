// src/lib/ontology/jobOntology.js
// Role ontology v1: lightweight keyword families + bounded distance matrix.

export const ROLE_KEYWORDS = {
  PM: [
    "pm", "po", "product manager", "product owner", "product lead", "program manager",
    "서비스기획", "프로덕트", "로드맵", "prd",
    "전략기획", "사업기획", "경영기획", "신사업", "사업전략", "서비스전략",
    "new business"
  ],
  DEV: [
    "developer", "engineer", "engineering", "software engineer", "sw engineer",
    "frontend", "backend", "fullstack", "platform", "infrastructure", "infra", "sre", "devops",
    "개발", "엔지니어", "백엔드", "프론트엔드", "서버", "플랫폼", "인프라"
  ],
  DATA: [
    "data", "analyst", "analytics", "data analyst", "product analyst",
    "business intelligence", "bi", "ml", "ai", "sql", "ab test", "a/b test",
    "데이터", "분석", "데이터분석", "사업분석", "통계", "머신러닝"
  ],
  DESIGN: ["designer", "ux", "ui", "product design", "디자인", "uxui"],
  MARKETING: [
    "marketing", "brand", "campaign", "performance", "growth", "digital marketing",
    "content marketing", "crm marketing", "media buying", "seo", "sem",
    "마케팅", "브랜딩", "퍼포먼스", "퍼포먼스마케팅", "콘텐츠마케팅"
  ],
  SALES: [
    "sales", "account executive", "account manager", "enterprise sales", "inside sales",
    "channel sales", "bd", "business development", "b2b sales", "영업", "세일즈", "수주", "영업관리"
  ],
  HR: ["hr", "recruit", "talent", "people ops", "인사", "채용", "노무"],
  FINANCE: [
    "finance", "fp&a", "fp&a manager", "planning & analysis", "financial planning",
    "accounting", "audit", "budget", "forecast", "forecasting", "management accounting", "p&l",
    "재무", "재무기획", "회계", "결산", "예산", "손익", "관리회계"
  ],
  PROCUREMENT: ["procurement", "purchasing", "sourcing", "구매", "조달", "소싱", "원가"],
  OPERATIONS: [
    "operations", "ops", "operation manager", "operations manager", "operations planning",
    "operation planning", "operations strategy", "operations excellence", "process improvement",
    "logistics", "supply chain", "supply planning", "demand planning", "fulfillment", "warehouse",
    "운영", "운영관리", "운영기획", "서비스운영", "물류운영", "물류", "공급망"
  ],
  CUSTOMER: ["customer success", "cs", "support", "care", "고객지원", "고객성공"],
  QA: ["qa", "quality assurance", "test", "tester", "품질", "테스트"],
  LEGAL: ["legal", "compliance", "privacy", "법무", "준법", "컴플라이언스"],
};

export const ROLE_DISTANCE = {
  PM: { PM: 0, DEV: 1, DATA: 1, DESIGN: 1, MARKETING: 2, SALES: 2, HR: 3, FINANCE: 2, PROCUREMENT: 2, OPERATIONS: 2, CUSTOMER: 2, QA: 2, LEGAL: 3 },
  DEV: { PM: 1, DEV: 0, DATA: 1, DESIGN: 2, MARKETING: 3, SALES: 3, HR: 3, FINANCE: 3, PROCUREMENT: 3, OPERATIONS: 2, CUSTOMER: 2, QA: 1, LEGAL: 3 },
  DATA: { PM: 1, DEV: 1, DATA: 0, DESIGN: 2, MARKETING: 2, SALES: 2, HR: 3, FINANCE: 1, PROCUREMENT: 2, OPERATIONS: 1, CUSTOMER: 2, QA: 2, LEGAL: 2 },
  DESIGN: { PM: 1, DEV: 2, DATA: 2, DESIGN: 0, MARKETING: 1, SALES: 2, HR: 3, FINANCE: 3, PROCUREMENT: 3, OPERATIONS: 2, CUSTOMER: 1, QA: 2, LEGAL: 3 },
  MARKETING: { PM: 2, DEV: 3, DATA: 2, DESIGN: 1, MARKETING: 0, SALES: 1, HR: 2, FINANCE: 2, PROCUREMENT: 2, OPERATIONS: 2, CUSTOMER: 1, QA: 2, LEGAL: 2 },
  SALES: { PM: 2, DEV: 3, DATA: 2, DESIGN: 2, MARKETING: 1, SALES: 0, HR: 2, FINANCE: 2, PROCUREMENT: 2, OPERATIONS: 2, CUSTOMER: 1, QA: 3, LEGAL: 2 },
  HR: { PM: 3, DEV: 3, DATA: 3, DESIGN: 3, MARKETING: 2, SALES: 2, HR: 0, FINANCE: 2, PROCUREMENT: 2, OPERATIONS: 2, CUSTOMER: 2, QA: 3, LEGAL: 1 },
  FINANCE: { PM: 2, DEV: 3, DATA: 1, DESIGN: 3, MARKETING: 2, SALES: 2, HR: 2, FINANCE: 0, PROCUREMENT: 1, OPERATIONS: 1, CUSTOMER: 2, QA: 2, LEGAL: 1 },
  PROCUREMENT: { PM: 2, DEV: 3, DATA: 2, DESIGN: 3, MARKETING: 2, SALES: 2, HR: 2, FINANCE: 1, PROCUREMENT: 0, OPERATIONS: 1, CUSTOMER: 2, QA: 2, LEGAL: 2 },
  OPERATIONS: { PM: 2, DEV: 2, DATA: 1, DESIGN: 2, MARKETING: 2, SALES: 2, HR: 2, FINANCE: 1, PROCUREMENT: 1, OPERATIONS: 0, CUSTOMER: 1, QA: 1, LEGAL: 2 },
  CUSTOMER: { PM: 2, DEV: 2, DATA: 2, DESIGN: 1, MARKETING: 1, SALES: 1, HR: 2, FINANCE: 2, PROCUREMENT: 2, OPERATIONS: 1, CUSTOMER: 0, QA: 2, LEGAL: 2 },
  QA: { PM: 2, DEV: 1, DATA: 2, DESIGN: 2, MARKETING: 2, SALES: 3, HR: 3, FINANCE: 2, PROCUREMENT: 2, OPERATIONS: 1, CUSTOMER: 2, QA: 0, LEGAL: 2 },
  LEGAL: { PM: 3, DEV: 3, DATA: 2, DESIGN: 3, MARKETING: 2, SALES: 2, HR: 1, FINANCE: 1, PROCUREMENT: 2, OPERATIONS: 2, CUSTOMER: 2, QA: 2, LEGAL: 0 },
  UNKNOWN: {},
};

export function inferRoleFamily(roleText) {
  const text = String(roleText || "").toLowerCase();
  if (!text.trim()) return "UNKNOWN";

  let bestFamily = "UNKNOWN";
  let bestScore = 0;
  for (const [family, keywords] of Object.entries(ROLE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const q = String(keyword || "").toLowerCase().trim();
      if (!q) continue;
      if (text.includes(q)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestFamily = family;
    }
  }
  return bestFamily;
}

export function getRoleDistance(a, b) {
  const from = String(a || "UNKNOWN").toUpperCase();
  const to = String(b || "UNKNOWN").toUpperCase();
  if (!from || !to || from === "UNKNOWN" || to === "UNKNOWN") return 0;
  const row = ROLE_DISTANCE[from];
  if (!row || typeof row !== "object") return 3;
  const d = row[to];
  if (Number.isFinite(d)) return Math.max(0, Math.min(3, Number(d)));
  return 3;
}
