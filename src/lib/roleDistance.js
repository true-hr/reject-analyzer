// ─────────────────────────────────────────────────────────────
// roleDistance.js
// PASSMAP 직무 온톨로지 기반 역할 거리 계산 유틸리티
//
// - alias normalization → canonical role
// - BFS shortest path (무방향 그래프)
// - 반환: { canonicalA, canonicalB, distance }
// ─────────────────────────────────────────────────────────────

// ── DATASET 1: Canonical Role Master List ───────────────────
const CANONICAL_ROLES = [
  "전략기획", "사업기획", "경영 컨설팅",
  "서비스 기획", "UX 기획", "프로덕트 매니저",
  "퍼포먼스 마케팅", "브랜드 마케팅", "그로스 마케팅", "콘텐츠 마케팅", "CRM 마케팅",
  "B2B 영업", "B2C 영업", "BD", "해외영업",
  "HR 채용", "HRD", "HRBP", "조직문화",
  "데이터 분석", "BI 분석", "데이터 엔지니어", "데이터 사이언티스트", "그로스 애널리스트",
  "FP&A", "회계", "세무", "재무 기획",
  "Customer Success", "고객 지원", "운영 관리", "구매", "SCM",
  "UX 디자인", "UI 디자인", "프로덕트 디자인",
];

// ── DATASET 3: Role Alias Dictionary ────────────────────────
// canonical role → alias 목록 (소문자 비교용)
const ALIAS_DICT = {
  "전략기획": ["전략기획", "경영기획", "strategic planning", "business planning", "corporate planning", "전략/기획"],
  "사업기획": ["사업기획", "신사업기획", "사업개발기획", "business planning", "business development planning"],
  "경영 컨설팅": ["경영 컨설팅", "컨설팅", "management consulting", "전략컨설팅", "consultant", "컨설턴트"],
  "서비스 기획": ["서비스 기획", "서비스기획", "서비스 플래너", "service planner", "서비스 pm", "product planning"],
  "UX 기획": ["ux 기획", "ux기획", "ux planner", "ux strategist", "인터랙션 기획", "사용자경험 기획"],
  "프로덕트 매니저": ["프로덕트 매니저", "pm", "po", "프로덕트 오너", "product manager", "product owner"],
  "퍼포먼스 마케팅": ["퍼포먼스 마케팅", "performance marketing", "디지털 마케팅", "digital marketing", "검색광고", "sns 광고", "da 마케팅"],
  "브랜드 마케팅": ["브랜드 마케팅", "brand marketing", "브랜드 매니저", "brand manager", "btl 마케팅"],
  "그로스 마케팅": ["그로스 마케팅", "growth marketing", "그로스 해킹", "growth hacking", "그로스"],
  "콘텐츠 마케팅": ["콘텐츠 마케팅", "content marketing", "콘텐츠 기획", "sns 마케팅", "소셜 마케팅"],
  "CRM 마케팅": ["crm 마케팅", "crm", "lifecycle marketing", "retention marketing", "이메일 마케팅"],
  "B2B 영업": ["b2b 영업", "b2b sales", "법인영업", "기업영업", "솔루션영업", "saas 영업", "엔터프라이즈 영업", "account executive", "enterprise sales"],
  "B2C 영업": ["b2c 영업", "b2c sales", "리테일 영업", "소비자영업", "채널영업", "대리점 영업"],
  "BD": ["bd", "사업개발", "business development", "파트너십", "partnership", "제휴", "alliance", "bd 매니저"],
  "해외영업": ["해외영업", "글로벌 영업", "global sales", "수출영업", "international sales"],
  "HR 채용": ["hr 채용", "채용", "recruiter", "talent acquisition", "ta", "인재채용", "recruiting", "ta specialist"],
  "HRD": ["hrd", "교육", "인재개발", "learning & development", "l&d", "training", "조직개발"],
  "HRBP": ["hrbp", "hr bp", "hr business partner", "피플파트너"],
  "조직문화": ["조직문화", "culture", "people culture", "employee experience", "ex"],
  "데이터 분석": ["데이터 분석", "data analyst", "da", "비즈니스 데이터 분석", "서비스 데이터 분석", "sql 분석"],
  "BI 분석": ["bi 분석", "bi analyst", "business intelligence", "bi", "대시보드", "리포팅"],
  "데이터 엔지니어": ["데이터 엔지니어", "data engineer", "de", "파이프라인", "etl", "데이터 플랫폼"],
  "데이터 사이언티스트": ["데이터 사이언티스트", "data scientist", "ds", "머신러닝", "machine learning", "ml 모델링"],
  "그로스 애널리스트": ["그로스 애널리스트", "growth analyst", "프로덕트 애널리스트", "product analyst", "pa"],
  "FP&A": ["fp&a", "financial planning and analysis", "재무기획", "예실관리", "경영분석"],
  "회계": ["회계", "accounting", "재무회계", "일반회계", "결산", "accountant"],
  "세무": ["세무", "tax", "세무담당", "tax accounting", "법인세", "부가세"],
  "재무 기획": ["재무기획", "재무 기획", "treasury", "자금관리", "재무관리", "corporate finance"],
  "Customer Success": ["customer success", "고객성공", "csm", "customer success manager", "어카운트 매니저"],
  "고객 지원": ["고객 지원", "고객서비스", "customer service", "고객센터", "콜센터", "고객응대"],
  "운영 관리": ["운영 관리", "운영", "operations", "biz ops", "business operations", "서비스 운영", "플랫폼 운영"],
  "구매": ["구매", "purchasing", "소싱", "sourcing", "조달", "procurement"],
  "SCM": ["scm", "supply chain", "supply chain management", "공급망관리", "물류기획", "재고관리"],
  "UX 디자인": ["ux 디자인", "ux design", "ux designer", "사용자경험 디자인", "interaction design"],
  "UI 디자인": ["ui 디자인", "ui design", "ui designer", "visual design", "gui 디자인"],
  "프로덕트 디자인": ["프로덕트 디자인", "product design", "product designer", "ux/ui 디자인"],
};

// ── DATASET 4: Role Similarity Graph (무방향) ────────────────
const EDGES = [
  ["전략기획", "사업기획"],
  ["전략기획", "경영 컨설팅"],
  ["전략기획", "FP&A"],
  ["사업기획", "BD"],
  ["사업기획", "프로덕트 매니저"],
  ["프로덕트 매니저", "서비스 기획"],
  ["프로덕트 매니저", "UX 기획"],
  ["서비스 기획", "UX 기획"],
  ["서비스 기획", "그로스 마케팅"],
  ["퍼포먼스 마케팅", "그로스 마케팅"],
  ["퍼포먼스 마케팅", "CRM 마케팅"],
  ["브랜드 마케팅", "콘텐츠 마케팅"],
  ["그로스 마케팅", "그로스 애널리스트"],
  ["그로스 애널리스트", "데이터 분석"],
  ["데이터 분석", "BI 분석"],
  ["데이터 분석", "데이터 사이언티스트"],
  ["데이터 엔지니어", "데이터 사이언티스트"],
  ["B2B 영업", "BD"],
  ["B2B 영업", "Customer Success"],
  ["B2B 영업", "해외영업"],
  ["B2C 영업", "B2B 영업"],
  ["Customer Success", "운영 관리"],
  ["Customer Success", "고객 지원"],
  ["구매", "SCM"],
  ["HR 채용", "HRBP"],
  ["HRD", "HRBP"],
  ["HRBP", "조직문화"],
  ["FP&A", "재무 기획"],
  ["FP&A", "회계"],
  ["회계", "세무"],
  ["UX 기획", "UX 디자인"],
  ["UX 디자인", "프로덕트 디자인"],
  ["UI 디자인", "UX 디자인"],
];

// ── 내부: alias → canonical 역방향 맵 빌드 (소문자 키) ───────
const _aliasToCanonical = new Map();
for (const [canonical, aliases] of Object.entries(ALIAS_DICT)) {
  for (const alias of aliases) {
    _aliasToCanonical.set(alias.toLowerCase().trim(), canonical);
  }
}
// canonical role 자체도 소문자로 등록 (직접 입력 대응)
for (const role of CANONICAL_ROLES) {
  _aliasToCanonical.set(role.toLowerCase().trim(), role);
}

// ── 내부: 인접 리스트 빌드 ────────────────────────────────────
const _adjacency = new Map();
for (const role of CANONICAL_ROLES) {
  _adjacency.set(role, []);
}
for (const [a, b] of EDGES) {
  if (_adjacency.has(a)) _adjacency.get(a).push(b);
  if (_adjacency.has(b)) _adjacency.get(b).push(a);
}

// ── alias normalization ───────────────────────────────────────
function normalizeRole(input) {
  if (typeof input !== "string") return null;
  const key = input.toLowerCase().trim();
  return _aliasToCanonical.get(key) ?? null;
}

// ── BFS shortest path ─────────────────────────────────────────
function _bfs(start, end) {
  if (start === end) return 0;
  if (!_adjacency.has(start) || !_adjacency.has(end)) return Infinity;

  const visited = new Set([start]);
  const queue = [[start, 0]]; // [현재 노드, 현재 거리]

  while (queue.length > 0) {
    const [node, dist] = queue.shift();
    for (const neighbor of (_adjacency.get(node) || [])) {
      if (neighbor === end) return dist + 1;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return Infinity;
}

// ── 공개 API ──────────────────────────────────────────────────
/**
 * 두 직무 역할 사이의 거리를 계산한다.
 *
 * @param {string} roleA - 직무명 또는 alias (한글/영문)
 * @param {string} roleB - 직무명 또는 alias (한글/영문)
 * @returns {{ canonicalA: string|null, canonicalB: string|null, distance: number }}
 *   - canonicalA/B: alias 정규화 결과 (인식 불가 시 null)
 *   - distance: BFS 최단 거리 (동일=0, 연결 없음=Infinity)
 */
export function roleDistance(roleA, roleB) {
  const canonicalA = normalizeRole(roleA);
  const canonicalB = normalizeRole(roleB);

  if (canonicalA === null || canonicalB === null) {
    return { canonicalA, canonicalB, distance: Infinity };
  }

  const distance = _bfs(canonicalA, canonicalB);
  return { canonicalA, canonicalB, distance };
}

export { normalizeRole, CANONICAL_ROLES, ALIAS_DICT, EDGES };
