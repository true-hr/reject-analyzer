// src/lib/semantic/taxonomy/toolTaxonomy.js
// PASSMAP Tool Taxonomy v2
// Tools as evidence boost + disambiguation — not primary domain determinants
//
// aliases: use the form that appears in raw lowercase text (pre-normalization)
//   EXCEPT for tools normalized by __normalizeSemanticLexicalText:
//   erp → 전사적자원관리, power bi → 파워비아이
// disambiguationDomain: when this tool co-occurs with procurement anchor,
//   it boosts this specific domain (for future scoring use)

export const TOOL_TAXONOMY = [
  // ── SAP family ───────────────────────────────────────────────
  {
    tool: "sap_mm",
    // SAP MM = 자재 관리 모듈 → direct_procurement boost
    aliases: ["sap mm"],
    family: "procurement_scm",
    disambiguationDomain: "direct_procurement",
    boostWeight: 0.05,
  },
  {
    tool: "sap_s4",
    aliases: ["sap s4", "sap s/4", "s4hana", "s/4hana"],
    family: "procurement_scm",
    disambiguationDomain: null,
    boostWeight: 0.04,
  },
  {
    tool: "sap",
    // generic SAP — matched last (after sap_mm/sap_s4 specific aliases)
    aliases: ["sap ariba", "sap"],
    family: "procurement_scm",
    disambiguationDomain: "purchasing_analytics",
    boostWeight: 0.04,
  },
  // ── Procurement platforms ────────────────────────────────────
  {
    tool: "ariba",
    aliases: ["ariba"],
    family: "procurement_scm",
    disambiguationDomain: "purchasing_analytics",
    boostWeight: 0.05,
  },
  {
    tool: "coupa",
    aliases: ["coupa"],
    family: "procurement_scm",
    disambiguationDomain: "purchasing_analytics",
    boostWeight: 0.05,
  },
  {
    tool: "jaggaer",
    aliases: ["jaggaer"],
    family: "procurement_scm",
    disambiguationDomain: "purchasing_analytics",
    boostWeight: 0.05,
  },
  {
    tool: "srm",
    // SRM = Supplier Relationship Management → vendor_management boost
    aliases: ["srm"],
    family: "procurement_scm",
    disambiguationDomain: "vendor_management",
    boostWeight: 0.04,
  },
  // ── ERP family ───────────────────────────────────────────────
  {
    tool: "erp",
    // erp normalized to 전사적자원관리 by __normalizeSemanticLexicalText
    aliases: ["전사적자원관리", "oracle erp", "oracle"],
    family: "procurement_scm",
    disambiguationDomain: null,
    boostWeight: 0.03,
  },
  // ── Manufacturing systems ────────────────────────────────────
  {
    tool: "mes",
    // MES = Manufacturing Execution System → manufacturing_materials boost
    aliases: ["mes"],
    family: "procurement_scm",
    disambiguationDomain: "manufacturing_materials",
    boostWeight: 0.04,
  },
  {
    tool: "plm",
    // PLM = Product Lifecycle Management → manufacturing_materials/direct_procurement boost
    aliases: ["plm"],
    family: "procurement_scm",
    disambiguationDomain: "direct_procurement",
    boostWeight: 0.04,
  },
  // ── Analytics / BI ───────────────────────────────────────────
  {
    tool: "excel",
    // not normalized — stays as "excel"/"엑셀"
    aliases: ["excel", "엑셀"],
    family: null,
    disambiguationDomain: null,
    boostWeight: 0.02,
  },
  {
    tool: "power_bi",
    // power bi normalized to 파워비아이 by __normalizeSemanticLexicalText
    aliases: ["파워비아이"],
    family: null,
    disambiguationDomain: null,
    boostWeight: 0.02,
  },
  {
    tool: "tableau",
    // tableau not normalized — stays as "tableau"
    aliases: ["tableau"],
    family: null,
    disambiguationDomain: null,
    boostWeight: 0.02,
  },
];
