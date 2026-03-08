import fs from "node:fs";
import path from "node:path";
import { analyze } from "./src/lib/analyzer.js";

const dataset = JSON.parse(fs.readFileSync("test_dataset.passmap.v1.json", "utf8").replace(/^\uFEFF/,""));
const cases = Array.isArray(dataset?.cases) ? dataset.cases : [];

const targetIds = [
  "TC_008_domain_mismatch_strong_gate_low_pp",
  "TC_013_domain_mismatch_marketing_vs_civil_low_pp",
  "TC_014_finance_jd_vs_marketing_resume_domain_risk",
  "TC_015_strong_match_high_pp",
  "TC_ANALYZE_BASELINE_STRONG_STRATEGY",
  "TC_ANALYZE_BASELINE_STRONG_DATA",
  "TC_ANALYZE_DOMAIN_MISMATCH_FINANCE_VS_MARKETING",
  "TC_ANALYZE_DOMAIN_MISMATCH_HR_VS_SALES",
  "TC_ANALYZE_YEARS_MISMATCH_5Y_VS_2Y",
  "TC_ANALYZE_YEARS_MISMATCH_3Y_VS_1Y6M",
  "TC_ANALYZE_EVIDENCE_WEAK_SQL_POWERBI_MISSING",
  "TC_ANALYZE_SEMANTIC_WEAK_B2B_SALES_VS_STORE_CS",
  "TC_ANALYZE_BOUNDARY_3Y_MINUS_1M",
  "TC_ANALYZE_BOUNDARY_SIMILAR_DOMAIN_NOT_EXACT",
  "TC_ANALYZE_COMPANYSIZE_JUMP_STARTUP_TO_LARGE_STRATEGY",
  "TC_ANALYZE_COMPANYSIZE_JUMP_SMALLMID_TO_PUBLIC_PM",
];

const selected = targetIds.map((id) => cases.find((c) => c.id === id)).filter(Boolean);

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const rows = selected.map((tc) => {
  const out = analyze(tc.state || {}, null) || {};
  const dp = out.decisionPack || {};
  const rr = Array.isArray(dp.riskResults) ? dp.riskResults : [];
  const m = dp.structural?.metrics || {};

  const requiredSkills = Array.isArray(m.requiredSkills) ? m.requiredSkills : [];
  const requiredCovered = Array.isArray(m.requiredCovered) ? m.requiredCovered : [];
  const requiredMissing = Array.isArray(m.requiredMissing) ? m.requiredMissing : [];
  const requiredCoverage = num(m.requiredCoverage);

  const roleMust = rr.some((r) => String(r?.id || "") === "ROLE_SKILL__MUST_HAVE_MISSING");
  const pseudoMustGate = rr.some((r) => String(r?.id || "") === "PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING");

  return {
    id: tc.id,
    requiredSkillsLength: requiredSkills.length,
    requiredSkillsSample: requiredSkills.slice(0, 20),
    requiredCovered: requiredCovered.length,
    requiredCoveredSample: requiredCovered.slice(0, 20),
    requiredMissingSample: requiredMissing.slice(0, 20),
    requiredCoverage,
    hasRoleSkillMustHaveMissing: roleMust,
    hasPseudoGateRoleSkillMustHaveMissing: pseudoMustGate,
    maxGateP: num(dp?.decisionScore?.meta?.maxGateP),
    maxGateId: dp?.decisionScore?.meta?.maxGateId ?? null,
    cap: num(dp?.decisionScore?.cap),
    capReason: dp?.decisionScore?.capReason ?? "",
  };
});

const outPath = process.argv[2] || ".tmp_measure_after.json";
fs.writeFileSync(outPath, JSON.stringify({ targetIds, rows }, null, 2), "utf8");
console.log(`WROTE ${outPath} rows=${rows.length}`);
