// src/lib/roleDictionary.js
// "강한 신호" 위주로만, 적게(8~15개) 유지하는 걸 권장합니다.

export const ROLE_RULES = [
  {
    role: "hr",
    strong: ["hrbp", "c&b", "compensation", "er", "labor", "노무", "평가보상", "채용"],
    weak: ["인사", "조직문화", "온보딩", "교육", "hr"],
    negative: ["sql", "tableau", "python", "react", "backend"], // 오분류 줄이기
  },
  {
    role: "pm",
    strong: ["prd", "roadmap", "user story", "product manager", "po", "pmo"],
    weak: ["서비스기획", "기획", "요구사항", "프로덕트", "pm"],
    negative: ["회계", "fp&a", "노무", "c&b"],
  },
  {
    role: "data",
    strong: ["sql", "tableau", "looker", "power bi", "ab test", "a/b", "pandas"],
    weak: ["데이터", "지표", "분석", "analytics", "bi"],
    negative: ["노무", "c&b", "prd", "roadmap"],
  },
  {
    role: "engineering",
    strong: ["react", "node", "spring", "django", "api", "backend", "frontend"],
    weak: ["개발", "engineer", "typescript", "java", "python"],
    negative: ["노무", "c&b", "fp&a"],
  },
  {
    role: "sales",
    strong: ["account executive", "ae", "pipeline", "quota", "b2b sales", "deal"],
    weak: ["영업", "sales", "고객관리", "제안", "계약"],
    negative: ["sql", "react", "fp&a"],
  },
  {
    role: "marketing",
    strong: ["google ads", "meta ads", "ua", "performance marketing", "conversion"],
    weak: ["마케팅", "growth", "캠페인", "퍼포먼스"],
    negative: ["노무", "c&b", "backend"],
  },
  {
    role: "strategy",
    strong: ["m&a", "investment", "due diligence", "시장분석", "경쟁분석", "사업타당성"],
    weak: ["전략", "경영기획", "사업기획", "신사업", "bizdev"],
    negative: ["react", "tableau", "노무"],
  },
];
