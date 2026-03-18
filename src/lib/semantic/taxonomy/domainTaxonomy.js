// src/lib/semantic/taxonomy/domainTaxonomy.js
// PASSMAP Procurement/SCM Domain Taxonomy v2
// 12 canonical domains — phrase + alias + conceptBundle + exclusion based
// 한국어/영어 혼용 JD/Resume 대응

// ─────────────────────────────────────────────────────────────
// Field contract per domain entry:
//   domain        — canonical domain id (string)
//   family        — parent family (always "procurement_scm")
//   aliasesKo     — Korean alias tokens
//   aliasesEn     — English alias tokens
//   strongPhrases — high-confidence multi-token phrases (direct match = +10)
//   conceptBundles— token bundles where ALL tokens must co-occur (+7 per bundle)
//   weakPhrases   — low-confidence single tokens (anchor required, +1)
//   exclusions    — guard notes (informational only — logic enforced by PROCUREMENT_ANCHOR_RE)
// ─────────────────────────────────────────────────────────────
// PASSMAP DOMAIN ONTOLOGY SSOT CONTRACT
// - This file is the official SSOT for PASSMAP procurement fine-domain taxonomy.
// - Semantic family id owned by this file: "procurement_scm"
// - Canonical family mirror used by upper-layer family systems: "PROCUREMENT_SCM"
// - The current 12 entries in PROCUREMENT_SCM_DOMAINS are the official fine-domain set.
//
// Scope rules
// - Includes sourcing, procurement, supplier/commercial, cost-spend analytics,
//   scm planning, supply risk, and manufacturing-material procurement context.
// - "inventory_logistics" is a boundary domain:
//   include planning/coordination, inventory planning, logistics optimization,
//   supply coordination, and delivery/lead-time management context.
// - Excludes pure warehouse execution, standalone inbound/outbound execution,
//   generic field operations, and general-affairs ordering support.
//
// Consumer rules
// - Consumers must not redefine procurement aliases/keywords outside this file.
// - semantic/match.js may read and score this taxonomy, but must not fork ids.
// - analyzer/evidence/simulation layers must consume emitted family/domain results
//   and must not create a parallel taxonomy as a steady-state design.
//
// Out of scope for this file
// - mismatch threshold policy
// - explanation copy / narrative text
// - simulation candidate-type policy
// - role-distance logic
export const PROCUREMENT_SCM_DOMAINS = [
  // ── 1. strategic_sourcing ───────────────────────────────────
  {
    domain: "strategic_sourcing",
    family: "procurement_scm",
    aliasesKo: ["전략소싱", "전략적 소싱", "소싱 전략", "글로벌 소싱"],
    aliasesEn: ["strategic sourcing", "global sourcing"],
    strongPhrases: [
      "전략적 소싱 전략 수립", "전략적 소싱 전략", "소싱 전략 수립",
      "전략소싱 매니저", "글로벌 공급업체 발굴", "공급업체 발굴 및 평가",
      "공급업체 평가", "글로벌 소싱 전략", "소싱 전략 수립 및 실행",
    ],
    conceptBundles: [
      ["공급업체", "발굴"],
      ["소싱", "전략"],
      ["전략적", "소싱"],
      ["글로벌", "소싱"],
      ["공급업체", "평가"],
    ],
    weakPhrases: ["전략소싱", "전략적 소싱"],
    exclusions: [],
  },

  // ── 2. category_management ──────────────────────────────────
  {
    domain: "category_management",
    family: "procurement_scm",
    aliasesKo: ["카테고리 관리", "품목 관리", "카테고리 전략"],
    aliasesEn: ["category management", "category strategy"],
    strongPhrases: [
      "카테고리 관리", "카테고리 전략 수립", "카테고리별 구매 전략",
      "category management", "category strategy",
    ],
    conceptBundles: [
      ["카테고리", "관리"],
      ["카테고리", "전략"],
      ["category", "management"],
    ],
    weakPhrases: ["카테고리"],
    exclusions: [],
  },

  // ── 3. direct_procurement ───────────────────────────────────
  {
    domain: "direct_procurement",
    family: "procurement_scm",
    aliasesKo: ["원부자재", "직접 자재", "자재 구매", "원자재 구매", "생산 자재"],
    aliasesEn: ["direct material", "direct procurement", "raw material"],
    strongPhrases: [
      "원부자재 구매 운영", "원자재 구매 운영", "직접 자재 구매",
      "생산 자재 조달", "원부자재 조달", "direct material procurement",
      "전자부품 제조사에서 원부자재 구매",
    ],
    conceptBundles: [
      ["원부자재", "구매"],
      ["원자재", "조달"],
      ["직접", "자재"],
      ["생산", "자재", "구매"],
      ["원부자재", "제조"],
    ],
    weakPhrases: ["원부자재", "원자재 구매"],
    exclusions: [],
  },

  // ── 4. indirect_procurement ─────────────────────────────────
  {
    domain: "indirect_procurement",
    family: "procurement_scm",
    aliasesKo: ["간접 구매", "간접 조달", "간접재"],
    aliasesEn: ["indirect procurement", "indirect material", "indirect spend"],
    strongPhrases: [
      "간접 구매 관리", "간접 조달", "indirect procurement", "indirect spend",
      "간접재 구매",
    ],
    conceptBundles: [
      ["간접", "구매"],
      ["간접", "조달"],
      ["indirect", "procurement"],
    ],
    weakPhrases: ["간접 구매", "간접 조달"],
    exclusions: [],
  },

  // ── 5. vendor_management ────────────────────────────────────
  {
    domain: "vendor_management",
    family: "procurement_scm",
    aliasesKo: ["벤더", "협력사", "공급업체", "공급사"],
    aliasesEn: ["vendor", "supplier"],
    strongPhrases: [
      "주요 벤더 계약 협상", "벤더 계약", "벤더 관리", "공급업체 관리",
      "협력사 관리", "vendor management", "supplier management",
      "공급업체 발굴 및 관리", "협력사 평가",
    ],
    conceptBundles: [
      ["벤더", "관리"],
      ["협력사", "관리"],
      ["공급업체", "관리"],
      ["vendor", "management"],
      ["supplier", "management"],
    ],
    weakPhrases: ["벤더", "협력사", "공급업체"],
    exclusions: ["파트너 관리만으로 금지 — 벤더/협력사/공급업체 anchor 필요"],
  },

  // ── 6. contract_commercial ──────────────────────────────────
  {
    domain: "contract_commercial",
    family: "procurement_scm",
    aliasesKo: ["계약 협상", "단가 협상", "협상 리드"],
    aliasesEn: ["contract negotiation", "commercial terms"],
    strongPhrases: [
      "계약 협상 리드", "단가 협상", "벤더 계약 협상", "협상 리드",
      "계약 조건 협상", "commercial terms", "contract negotiation",
      "계약 협상 및 관리", "원가 절감 전략 수립 및 협상",
    ],
    conceptBundles: [
      ["벤더", "계약", "협상"],
      ["단가", "협상"],
      ["계약", "협상"],
      ["contract", "negotiation"],
      ["공급", "협상"],
    ],
    weakPhrases: ["계약 협상", "단가 협상", "협상 리드"],
    exclusions: ["협상만으로 금지 — 계약/단가/벤더 anchor 필요"],
  },

  // ── 7. cost_management ──────────────────────────────────────
  {
    domain: "cost_management",
    family: "procurement_scm",
    aliasesKo: ["원가 절감", "비용 절감", "단가 절감"],
    aliasesEn: ["cost reduction", "cost saving"],
    strongPhrases: [
      "원가 절감 전략", "원가 절감 프로젝트", "원가 절감 수행",
      "비용 절감 프로젝트", "cost reduction", "cost saving", "단가 절감",
      "원가 분석", "원가 관리", "원가 절감 전략 수립",
    ],
    conceptBundles: [
      ["원가", "절감"],
      ["비용", "절감"],
      ["cost", "reduction"],
      ["단가", "절감"],
    ],
    weakPhrases: ["원가 절감", "비용 절감"],
    exclusions: [],
  },

  // ── 8. purchasing_analytics ─────────────────────────────────
  {
    domain: "purchasing_analytics",
    family: "procurement_scm",
    aliasesKo: ["구매 데이터", "구매 분석", "구매 kpi"],
    aliasesEn: ["spend analysis", "purchasing analytics"],
    strongPhrases: [
      "sap 기반 구매 데이터 분석", "구매 데이터 분석", "spend analysis",
      "구매 kpi 관리", "구매 현황 분석", "구매 성과 분석",
    ],
    conceptBundles: [
      ["구매", "데이터", "분석"],
      ["구매", "kpi"],
      ["sap", "구매", "분석"],
      ["spend", "analysis"],
      ["구매", "분석"],
    ],
    weakPhrases: ["구매 데이터", "구매 kpi"],
    exclusions: ["데이터 분석만으로 금지 — 구매/sap/spend anchor 필요"],
  },

  // ── 9. scm_planning ─────────────────────────────────────────
  {
    domain: "scm_planning",
    family: "procurement_scm",
    aliasesKo: ["수급 관리", "납기 관리", "공급 계획", "재고 계획"],
    aliasesEn: ["supply planning", "demand planning", "scm planning"],
    strongPhrases: [
      "수급 관리", "납기 관리", "공급 계획 수립", "공급망 계획",
      "supply planning", "demand planning", "scm 운영",
    ],
    conceptBundles: [
      ["수급", "관리"],
      ["납기", "관리"],
      ["공급", "계획"],
      ["supply", "planning"],
      ["demand", "planning"],
    ],
    weakPhrases: ["수급", "납기 관리"],
    exclusions: [],
  },

  // ── 10. supply_risk ─────────────────────────────────────────
  {
    domain: "supply_risk",
    family: "procurement_scm",
    aliasesKo: ["공급 리스크", "공급망 리스크", "대체 공급처", "공급 차질"],
    aliasesEn: ["supply risk", "supply chain risk"],
    strongPhrases: [
      "공급망 리스크 관리", "공급망 리스크", "공급 리스크", "대체 공급처 발굴",
      "공급 차질 대응", "supply risk management", "supply chain risk",
      "공급망 리스크 대응",
    ],
    conceptBundles: [
      ["공급망", "리스크"],
      ["공급", "리스크"],
      ["대체", "공급처"],
      ["공급", "차질"],
      ["supply", "risk"],
    ],
    weakPhrases: ["공급 리스크", "공급망 리스크"],
    exclusions: ["리스크 관리만으로 금지 — 공급/공급망 anchor 필요"],
  },

  // ── 11. inventory_logistics ─────────────────────────────────
  {
    domain: "inventory_logistics",
    family: "procurement_scm",
    aliasesKo: ["재고 관리", "물류 관리", "창고 관리"],
    aliasesEn: ["inventory management", "logistics management"],
    strongPhrases: [
      "재고 관리", "물류 관리", "재고 최적화", "물류 최적화",
      "inventory management", "logistics management", "창고 관리",
    ],
    conceptBundles: [
      ["재고", "관리"],
      ["물류", "관리"],
      ["inventory", "management"],
      ["logistics", "management"],
    ],
    weakPhrases: ["재고 관리", "물류"],
    exclusions: [],
  },

  // ── 12. manufacturing_materials ─────────────────────────────
  {
    domain: "manufacturing_materials",
    family: "procurement_scm",
    aliasesKo: ["전자부품", "제조사", "부품 조달", "제조업 구매"],
    aliasesEn: ["manufacturing procurement", "bill of materials", "bom"],
    strongPhrases: [
      "전자부품 제조사", "제조사 구매", "부품 조달", "제조업 공급망",
      "제조업 또는 글로벌 공급망", "원부자재 구매 운영",
    ],
    conceptBundles: [
      ["전자부품", "제조"],
      ["부품", "조달"],
      ["제조업", "구매"],
      ["제조사", "구매"],
    ],
    weakPhrases: ["전자부품", "부품 조달"],
    exclusions: [],
  },
];

// ─────────────────────────────────────────────────────────────
// Procurement anchor token check (v2)
// At least one anchor required to confirm procurement/SCM domain
// when only weak phrases/aliases match
// ─────────────────────────────────────────────────────────────
export const PROCUREMENT_ANCHOR_RE =
  /구매|조달|scm|공급망|벤더|협력사|공급업체|원가\s*절감|발주|전략소싱|전략적\s*소싱|소싱\s*전략|글로벌\s*소싱|계약\s*협상|단가\s*협상|협상\s*리드|supply\s*chain|sap|erp|ariba|coupa|jaggaer|srm|spend\s*analysis|수급|납기\s*관리|공급\s*리스크|대체\s*공급처|원부자재|직접\s*자재|간접\s*구매|카테고리\s*관리|bom|mes|plm/i;
