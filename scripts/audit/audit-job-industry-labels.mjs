/**
 * audit-job-industry-labels.mjs
 *
 * Read-only audit script.
 * Enumerates all job ontology items and industry registry items,
 * and reports label field coverage vs. input UI labels.
 *
 * Usage:
 *   node ./scripts/audit/audit-job-industry-labels.mjs
 *   node ./scripts/audit/audit-job-industry-labels.mjs --json
 */

import { getJobOntologyItemById } from "../../src/data/job/jobOntology.index.js";
import { INDUSTRY_REGISTRY_ITEMS } from "../../src/data/industry/industryRegistry.index.js";
import { JOB_CATEGORY_OPTIONS, INDUSTRY_CATEGORY_OPTIONS } from "../../src/components/input/categoryOptions.js";

// ─── Input label map (from categoryOptions.js) ────────────────────────────────
// Build flat list of {major, sub} for jobs

const INPUT_JOB_SUBS = [];
for (const major of JOB_CATEGORY_OPTIONS) {
  for (const sub of (major.subs || [])) {
    INPUT_JOB_SUBS.push({ major: major.t, sub: sub.t, v: sub.v });
  }
}

const INPUT_IND_SUBS = [];
for (const major of INDUSTRY_CATEGORY_OPTIONS) {
  for (const sub of (major.subs || [])) {
    INPUT_IND_SUBS.push({ major: major.t, sub: sub.t, v: sub.v });
  }
}

// ─── titleizeToken (copy from jobOntology.index.js for reference) ──────────────
function titleizeToken(value) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

// ─── Enumerate all job ontology items ─────────────────────────────────────────
let JOB_ONTOLOGY_ITEMS_ALL;
try {
  // getJobOntologyItems may or may not be exported; try dynamic import
  const mod = await import("../../src/data/job/jobOntology.index.js");
  JOB_ONTOLOGY_ITEMS_ALL = mod.JOB_ONTOLOGY_ITEMS || mod.getJobOntologyItems?.() || null;
} catch {
  JOB_ONTOLOGY_ITEMS_ALL = null;
}

// fallback: derive from registry by building all canonical IDs manually
// We'll walk through known IDs by looking at exports
const KNOWN_JOB_IDS = [
  // BUSINESS
  "JOB_BUSINESS_STRATEGY","JOB_BUSINESS_BUSINESS_PLANNING","JOB_BUSINESS_SERVICE_PLANNING",
  "JOB_BUSINESS_OPERATIONS_MANAGEMENT","JOB_BUSINESS_PROJECT_MANAGEMENT",
  "JOB_BUSINESS_BUSINESS_DEVELOPMENT","JOB_BUSINESS_BUSINESS_SUPPORT",
  // SALES
  "JOB_SALES_GENERAL_SALES","JOB_SALES_B2B_SALES","JOB_SALES_B2C_SALES",
  "JOB_SALES_TECHNICAL_SALES","JOB_SALES_SOLUTION_SALES","JOB_SALES_OVERSEAS_SALES",
  "JOB_SALES_PROPOSAL_SALES","JOB_SALES_PARTNER_CHANNEL_SALES","JOB_SALES_KEY_ACCOUNT_MANAGEMENT",
  // MARKETING
  "JOB_MARKETING_BRAND_MARKETING","JOB_MARKETING_PERFORMANCE_MARKETING",
  "JOB_MARKETING_CONTENT_MARKETING","JOB_MARKETING_DIGITAL_MARKETING",
  "JOB_MARKETING_CRM_MARKETING","JOB_MARKETING_PRODUCT_MARKETING_PMM",
  "JOB_MARKETING_PR_COMMUNICATIONS","JOB_MARKETING_MARKETING_RESEARCH",
  // CUSTOMER_OPERATIONS
  "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS","JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS",
  "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING","JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
  "JOB_CUSTOMER_OPERATIONS_COMMUNITY_OPERATIONS","JOB_CUSTOMER_OPERATIONS_QUALITY_OPERATIONS",
  "JOB_CUSTOMER_OPERATIONS_BACKOFFICE_OPERATIONS",
  // HR_ORGANIZATION
  "JOB_HR_ORGANIZATION_RECRUITING","JOB_HR_ORGANIZATION_HR_PLANNING",
  "JOB_HR_ORGANIZATION_COMPENSATION_BENEFITS","JOB_HR_ORGANIZATION_LABOR_RELATIONS",
  "JOB_HR_ORGANIZATION_HRBP","JOB_HR_ORGANIZATION_LEARNING_OD",
  "JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT","JOB_HR_ORGANIZATION_HR_OPS",
  // FINANCE_ACCOUNTING
  "JOB_FINANCE_ACCOUNTING_ACCOUNTING","JOB_FINANCE_ACCOUNTING_TAX",
  "JOB_FINANCE_ACCOUNTING_FINANCE","JOB_FINANCE_ACCOUNTING_TREASURY",
  "JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING","JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE",
  "JOB_FINANCE_ACCOUNTING_FP_AND_A","JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL",
  // PROCUREMENT_SCM
  "JOB_PROCUREMENT_SCM_PURCHASING","JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING",
  "JOB_PROCUREMENT_SCM_PROCUREMENT","JOB_PROCUREMENT_SCM_SCM",
  "JOB_PROCUREMENT_SCM_LOGISTICS","JOB_PROCUREMENT_SCM_DEMAND_SUPPLY_PLANNING",
  "JOB_PROCUREMENT_SCM_INVENTORY_MANAGEMENT","JOB_PROCUREMENT_SCM_SUPPLIER_VENDOR_MANAGEMENT",
  // MANUFACTURING_QUALITY_PRODUCTION
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY",
  // ENGINEERING_DEVELOPMENT
  "JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN","JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN",
  "JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT","JOB_ENGINEERING_DEVELOPMENT_EMBEDDED_DEVELOPMENT",
  "JOB_ENGINEERING_DEVELOPMENT_SYSTEMS_ENGINEERING","JOB_ENGINEERING_DEVELOPMENT_TESTING_VALIDATION",
  "JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT",
  "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
  // IT_DATA_DIGITAL
  "JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT","JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
  "JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT","JOB_IT_DATA_DIGITAL_MOBILE_DEVELOPMENT",
  "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS","JOB_IT_DATA_DIGITAL_DATA_ENGINEERING",
  "JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING","JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
  "JOB_IT_DATA_DIGITAL_SECURITY","JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION",
  "JOB_IT_DATA_DIGITAL_IT_PLANNING","JOB_IT_DATA_DIGITAL_IT_OPERATIONS_SYSTEMS_MANAGEMENT",
  "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT",
  // DESIGN
  "JOB_DESIGN_UI_DESIGN","JOB_DESIGN_UX_DESIGN","JOB_DESIGN_PRODUCT_DESIGN",
  "JOB_DESIGN_BX_BRAND_DESIGN","JOB_DESIGN_GRAPHIC_DESIGN","JOB_DESIGN_MOTION_DESIGN",
  "JOB_DESIGN_CONTENT_DESIGN","JOB_DESIGN_INDUSTRIAL_DESIGN",
  // RESEARCH_PROFESSIONAL
  "JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH","JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH",
  "JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH","JOB_RESEARCH_PROFESSIONAL_CONSULTING",
  "JOB_RESEARCH_PROFESSIONAL_LEGAL","JOB_RESEARCH_PROFESSIONAL_PATENT_INTELLECTUAL_PROPERTY",
  "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS","JOB_RESEARCH_PROFESSIONAL_EXPERT_REVIEW_EVALUATION",
  // EDUCATION_COUNSELING_COACHING
  "JOB_EDUCATION_COUNSELING_COACHING_CORPORATE_TRAINING",
  "JOB_EDUCATION_COUNSELING_COACHING_JOB_TRAINING",
  "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COUNSELING",
  "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COACHING",
  "JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN",
  "JOB_EDUCATION_COUNSELING_COACHING_EDUCATION_OPERATIONS",
  "JOB_EDUCATION_COUNSELING_COACHING_FACILITATION",
  // PUBLIC_ADMINISTRATION_SUPPORT
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION",
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS",
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_POLICY_SUPPORT",
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_DOCUMENT_ADMIN_SUPPORT",
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
];

// ─── Lookup input label for a canonical job ID ────────────────────────────────
// Build a best-effort map from canonical job ID → input Korean label
// by resolving through the ontology item and matching aliases to input options

function normalizeForMatch(s) {
  return String(s || "").normalize("NFKC").toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_\-·•]+/g, "");
}

const inputJobNormMap = new Map();
for (const entry of INPUT_JOB_SUBS) {
  inputJobNormMap.set(normalizeForMatch(entry.v), entry.sub);
  inputJobNormMap.set(normalizeForMatch(entry.sub), entry.sub);
}

function findInputLabelForJob(item) {
  if (!item) return null;
  // Check aliases
  const candidates = [item.label, ...(item.aliases || [])];
  for (const c of candidates) {
    const norm = normalizeForMatch(c);
    if (inputJobNormMap.has(norm)) return inputJobNormMap.get(norm);
  }
  return null;
}

// ─── Collect job audit rows ────────────────────────────────────────────────────

const jobRows = [];
for (const id of KNOWN_JOB_IDS) {
  const item = getJobOntologyItemById(id);
  if (!item) {
    jobRows.push({ id, found: false, hasLabel: false, ontologyLabel: null, resolvedLabel: null, inputLabel: null, status: "NOT_FOUND", note: "getJobOntologyItemById returned null" });
    continue;
  }

  // Does the raw ontology source have a label field?
  // item.label is set by toOntologyItem() either from value.label or fallback
  // We can detect fallback by checking if label matches titleizeToken of subcategory
  const subcategory = item.subcategory || item.subVertical || "";
  const titleized = titleizeToken(subcategory);
  const exportKeyCandidate = subcategory.toLowerCase(); // won't exactly match but gives a hint
  const isFallback = item.label === titleized || item.label === exportKeyCandidate || item.label === subcategory;

  const hasOntologyLabel = !isFallback;
  const inputLabel = findInputLabelForJob(item);

  let status;
  if (!hasOntologyLabel) {
    status = "MISSING_LABEL";
  } else if (inputLabel && normalizeForMatch(item.label) !== normalizeForMatch(inputLabel)) {
    status = "LABEL_MISMATCH";
  } else if (inputLabel) {
    status = "OK_MATCH";
  } else {
    status = "FALLBACK_RISK"; // has label but can't confirm input match
  }

  jobRows.push({
    id,
    found: true,
    hasOntologyLabel,
    ontologyLabel: hasOntologyLabel ? item.label : null,
    resolvedLabel: item.label, // what targetReadAdapter would actually use
    inputLabel,
    status,
  });
}

// ─── Industry audit ────────────────────────────────────────────────────────────

function findInputLabelForIndustry(item) {
  if (!item) return null;
  const candidates = [item.label, ...(item.aliases || [])];
  for (const c of candidates) {
    const norm = normalizeForMatch(c);
    for (const entry of INPUT_IND_SUBS) {
      if (normalizeForMatch(entry.v) === norm || normalizeForMatch(entry.sub) === norm) {
        return entry.sub;
      }
    }
  }
  return null;
}

const indRows = [];
for (const item of INDUSTRY_REGISTRY_ITEMS) {
  const hasLabel = Boolean(item.label);
  const inputLabel = findInputLabelForIndustry(item);
  let status;
  if (!hasLabel) {
    status = "MISSING_LABEL";
  } else if (!inputLabel) {
    status = "FALLBACK_RISK";
  } else if (normalizeForMatch(item.label) !== normalizeForMatch(inputLabel)) {
    status = "LABEL_MISMATCH";
  } else {
    status = "OK_MATCH";
  }
  indRows.push({
    id: item.id,
    hasLabel,
    ontologyLabel: item.label || null,
    inputLabel,
    status,
  });
}

// ─── Print report ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const saveJson = args.includes("--json");

console.log("\n" + "═".repeat(72));
console.log("  LABEL AUDIT REPORT: Job Ontology + Industry Registry");
console.log("═".repeat(72) + "\n");

// Job summary
const jobMissing = jobRows.filter(r => r.status === "MISSING_LABEL");
const jobMismatch = jobRows.filter(r => r.status === "LABEL_MISMATCH");
const jobOk = jobRows.filter(r => r.status === "OK_MATCH");
const jobFallbackRisk = jobRows.filter(r => r.status === "FALLBACK_RISK");
const jobNotFound = jobRows.filter(r => r.status === "NOT_FOUND");

console.log(`[직무] 총 ${jobRows.length}개`);
console.log(`  OK_MATCH       : ${jobOk.length}`);
console.log(`  MISSING_LABEL  : ${jobMissing.length}`);
console.log(`  LABEL_MISMATCH : ${jobMismatch.length}`);
console.log(`  FALLBACK_RISK  : ${jobFallbackRisk.length}`);
console.log(`  NOT_FOUND      : ${jobNotFound.length}`);
console.log();

// Industry summary
const indMissing = indRows.filter(r => r.status === "MISSING_LABEL");
const indMismatch = indRows.filter(r => r.status === "LABEL_MISMATCH");
const indOk = indRows.filter(r => r.status === "OK_MATCH");
const indFallbackRisk = indRows.filter(r => r.status === "FALLBACK_RISK");

console.log(`[산업] 총 ${indRows.length}개`);
console.log(`  OK_MATCH       : ${indOk.length}`);
console.log(`  MISSING_LABEL  : ${indMissing.length}`);
console.log(`  LABEL_MISMATCH : ${indMismatch.length}`);
console.log(`  FALLBACK_RISK  : ${indFallbackRisk.length}`);
console.log();

// MISSING_LABEL jobs — most critical
if (jobMissing.length > 0) {
  console.log("─".repeat(72));
  console.log("[직무 MISSING_LABEL] — ontology label 없어 영문 fallback 위험");
  console.log("─".repeat(72));
  for (const r of jobMissing) {
    console.log(`  ${r.id}`);
    console.log(`    resolved (fallback): "${r.resolvedLabel}"   input: "${r.inputLabel ?? "(매핑 없음)"}"`);
  }
  console.log();
}

// LABEL_MISMATCH jobs
if (jobMismatch.length > 0) {
  console.log("─".repeat(72));
  console.log("[직무 LABEL_MISMATCH] — ontology label과 input label 불일치");
  console.log("─".repeat(72));
  for (const r of jobMismatch) {
    console.log(`  ${r.id}`);
    console.log(`    ontology: "${r.ontologyLabel}"   input: "${r.inputLabel}"`);
  }
  console.log();
}

// Industry LABEL_MISMATCH
if (indMismatch.length > 0) {
  console.log("─".repeat(72));
  console.log("[산업 LABEL_MISMATCH]");
  console.log("─".repeat(72));
  for (const r of indMismatch) {
    console.log(`  ${r.id}`);
    console.log(`    registry: "${r.ontologyLabel}"   input: "${r.inputLabel}"`);
  }
  console.log();
}

// Industry FALLBACK_RISK
if (indFallbackRisk.length > 0) {
  console.log("─".repeat(72));
  console.log("[산업 FALLBACK_RISK] — input 매핑 불가 (label은 있으나 input에 대응 없음)");
  console.log("─".repeat(72));
  for (const r of indFallbackRisk) {
    console.log(`  ${r.id}  →  "${r.ontologyLabel}"`);
  }
  console.log();
}

// JSON output
if (saveJson) {
  const { writeFileSync, mkdirSync } = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const __dirname = path.default.dirname(fileURLToPath(import.meta.url));
  mkdirSync(path.default.join(__dirname, "output"), { recursive: true });
  const outFile = path.default.join(__dirname, "output", "label-audit.json");
  writeFileSync(outFile, JSON.stringify({ jobRows, indRows }, null, 2), "utf-8");
  console.log(`\nJSON 저장: ${outFile}`);
}
