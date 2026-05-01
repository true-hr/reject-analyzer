/**
 * run-taxonomy-read-layer-smoke.mjs
 *
 * Phase 1 Shared Taxonomy Read Layer 검증 smoke runner.
 * production 코드 수정 없이 read-only 실행만 수행.
 *
 * 검증 목표:
 *   1. readTaxonomyTarget helper가 기존 resolver와 동일한 item을 반환하는지 확인
 *   2. unknown id / raw label / alias / compound fallback 케이스가 안전하게 처리되는지 확인
 *   3. 금지 출력 필드(score, risk, gate, band 등)가 없는지 확인
 *
 * 실행 방법:
 *   node scripts/regression/run-taxonomy-read-layer-smoke.mjs
 *   node scripts/regression/run-taxonomy-read-layer-smoke.mjs --json
 */

import {
  readTaxonomyTarget,
  readJobTaxonomyTarget,
  readIndustryTaxonomyTarget,
} from "../../src/lib/shared/taxonomy/readTaxonomyTarget.js";
import { getJobOntologyItemById } from "../../src/data/job/jobOntology.index.js";
import { getIndustryRegistryItemById } from "../../src/data/industry/industryRegistry.index.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const saveJson = args.includes("--json");

// ─── 금지 출력 필드 목록 ────────────────────────────────────────────────────────

const FORBIDDEN_OUTPUT_FIELDS = [
  "score", "risk", "riskLevel", "gate", "band",
  "recommendation", "cta", "pass", "fail",
  "suitability", "transitionDifficulty", "compositeBand",
];

function checkForbiddenFields(obj, prefix = "") {
  const violations = [];
  if (!obj || typeof obj !== "object") return violations;
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_OUTPUT_FIELDS.some((f) => lowerKey.includes(f.toLowerCase()))) {
      violations.push(`${prefix}.${key}`);
    }
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      violations.push(...checkForbiddenFields(obj[key], `${prefix}.${key}`));
    }
  }
  return violations;
}

// ─── 러너 ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓  ${label}`);
    passed++;
    results.push({ label, status: "PASS" });
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`       ${e.message}`);
    failed++;
    results.push({ label, status: "FAIL", reason: e.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? "조건 실패");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message ?? "값 불일치"}: expected "${expected}", got "${actual}"`);
  }
}

// ─── Case 1: 유효한 jobId — 기존 resolver와 동일한 item 확인 ──────────────────

console.log("\n── Case 1: 유효한 jobId exact match ──\n");

test("DevOps jobId exact match — canonicalId 일치", () => {
  const jobId = "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA";
  const existing = getJobOntologyItemById(jobId);
  const result = readJobTaxonomyTarget({ jobId });

  assert(existing !== null, "기존 resolver가 null 반환 — fixture 오류");
  assertEqual(result.canonicalId, existing.id, "canonicalId");
  assertEqual(result.label, existing.label, "label");
  assertEqual(result.source, "id_exact", "source");
  assertEqual(result.confidence, "found", "confidence");
  assert(result.warnings.length === 0, `warnings should be empty: ${result.warnings}`);
});

test("DevOps jobId — displayLabel이 빈 문자열 또는 undefined가 아님", () => {
  const result = readJobTaxonomyTarget({ jobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA" });
  assert(
    typeof result.displayLabel === "string" && result.displayLabel.length > 0,
    `displayLabel이 비어있음: "${result.displayLabel}"`
  );
  assert(result.displayLabel !== "undefined", "displayLabel이 'undefined' 문자열");
  assert(result.displayLabel !== "[object Object]", "displayLabel mojibake");
});

test("DevOps jobId — aliases가 배열", () => {
  const result = readJobTaxonomyTarget({ jobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA" });
  assert(Array.isArray(result.aliases), "aliases가 배열이 아님");
  assert(result.aliases.length > 0, "aliases가 비어있음");
});

test("DevOps jobId — 금지 출력 필드 없음", () => {
  const result = readJobTaxonomyTarget({ jobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA" });
  const violations = checkForbiddenFields(result, "job");
  assert(violations.length === 0, `금지 출력 필드 발견: ${violations.join(", ")}`);
});

// ─── Case 2: 유효한 industryId — 기존 resolver와 동일한 item 확인 ──────────────

console.log("\n── Case 2: 유효한 industryId exact match ──\n");

test("B2B SaaS industryId exact match — canonicalId 일치", () => {
  const industryId = "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS";
  const existing = getIndustryRegistryItemById(industryId);
  const result = readIndustryTaxonomyTarget({ industryId });

  assert(existing !== null, "기존 resolver가 null 반환 — fixture 오류");
  assertEqual(result.canonicalId, existing.id, "canonicalId");
  assertEqual(result.label, existing.label, "label");
  assertEqual(result.source, "id_exact", "source");
  assertEqual(result.confidence, "high", "confidence");
  assert(result.warnings.length === 0, `warnings should be empty: ${result.warnings}`);
});

test("B2B SaaS industryId — sector/subsector 필드 보존", () => {
  const result = readIndustryTaxonomyTarget({ industryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS" });
  assertEqual(result.sector, "IT_SOFTWARE_PLATFORM", "sector");
  assertEqual(result.subsector, "B2B_SAAS", "subsector");
});

test("B2B SaaS industryId — 금지 출력 필드 없음", () => {
  const result = readIndustryTaxonomyTarget({ industryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS" });
  const violations = checkForbiddenFields(result, "industry");
  assert(violations.length === 0, `금지 출력 필드 발견: ${violations.join(", ")}`);
});

// ─── Case 3: 미등록 id — not_found 안전 처리 ─────────────────────────────────

console.log("\n── Case 3: 미등록 id — not_found 안전 처리 ──\n");

test("미등록 jobId — confidence=not_found, warning 포함", () => {
  const result = readJobTaxonomyTarget({ jobId: "JOB_NONEXISTENT_ALIAS_XYZ" });
  assertEqual(result.confidence, "not_found", "confidence");
  assert(result.canonicalId === null, "canonicalId가 null이 아님");
  assert(result.warnings.length > 0, "warnings가 비어있음 — unknown id 경고 없음");
});

test("미등록 jobId — displayLabel이 id 또는 미확인 fallback", () => {
  const result = readJobTaxonomyTarget({ jobId: "JOB_NONEXISTENT_ALIAS_XYZ" });
  assert(
    result.displayLabel === "JOB_NONEXISTENT_ALIAS_XYZ" || result.displayLabel === "미확인",
    `예상 외 displayLabel: "${result.displayLabel}"`
  );
});

test("미등록 industryId — confidence=not_found, warning 포함", () => {
  const result = readIndustryTaxonomyTarget({ industryId: "IND_FAKE_SECTOR_ABC" });
  assertEqual(result.confidence, "not_found", "confidence");
  assert(result.canonicalId === null, "canonicalId가 null이 아님");
  assert(result.warnings.length > 0, "warnings가 비어있음 — unknown id 경고 없음");
});

test("미등록 industryId — PASS 판정 또는 score 반환 금지", () => {
  const result = readIndustryTaxonomyTarget({ industryId: "IND_FAKE_SECTOR_ABC" });
  const violations = checkForbiddenFields(result, "industry");
  assert(violations.length === 0, `금지 출력 필드 발견: ${violations.join(", ")}`);
});

// ─── Case 4: raw label만으로 조회 ─────────────────────────────────────────────

console.log("\n── Case 4: raw label fallback ──\n");

test("raw jobLabel만 있을 때 — displayLabel은 rawLabel 값", () => {
  const result = readJobTaxonomyTarget({ rawJobLabel: "마케터" });
  assertEqual(result.displayLabel, "마케터", "displayLabel should be rawLabel");
  assertEqual(result.confidence, "not_found", "confidence");
});

test("raw industryLabel만 있을 때 — displayLabel fallback 정상", () => {
  const result = readIndustryTaxonomyTarget({ rawIndustryLabel: "정보통신업" });
  assert(
    typeof result.displayLabel === "string" && result.displayLabel.length > 0,
    "displayLabel이 비어있음"
  );
  assert(result.displayLabel !== "undefined" && result.displayLabel !== "[object Object]",
    `mojibake 의심 displayLabel: "${result.displayLabel}"`
  );
});

// ─── Case 5: combined readTaxonomyTarget ────────────────────────────────────

console.log("\n── Case 5: combined readTaxonomyTarget ──\n");

test("combined — job/industry 두 결과 모두 반환", () => {
  const result = readTaxonomyTarget({
    jobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    industryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
  });
  assert(result.job && typeof result.job === "object", "job 결과 없음");
  assert(result.industry && typeof result.industry === "object", "industry 결과 없음");
  assertEqual(result.job.confidence, "found", "job.confidence");
  assertEqual(result.industry.confidence, "high", "industry.confidence");
});

test("combined — 금지 출력 필드 없음 (전체)", () => {
  const result = readTaxonomyTarget({
    jobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    industryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
  });
  const violations = [
    ...checkForbiddenFields(result.job, "job"),
    ...checkForbiddenFields(result.industry, "industry"),
  ];
  assert(violations.length === 0, `금지 출력 필드 발견: ${violations.join(", ")}`);
});

test("combined both unknown — 시스템 오류 없음", () => {
  const result = readTaxonomyTarget({
    jobId: "JOB_NONEXISTENT",
    industryId: "IND_NONEXISTENT",
  });
  assert(result.job.confidence === "not_found", "job.confidence 불일치");
  assert(result.industry.confidence === "not_found", "industry.confidence 불일치");
});

// ─── Case 6: uiSelection fallback ───────────────────────────────────────────

console.log("\n── Case 6: uiSelection fallback ──\n");

test("uiSelection으로 job 조회 — canonicalId 반환", () => {
  const result = readJobTaxonomyTarget({
    uiSelection: { majorCategory: "IT데이터디지털", subcategory: "DEVOPS_INFRA" },
  });
  assert(result.confidence === "found" || result.confidence === "not_found",
    "confidence 값이 유효하지 않음");
  if (result.confidence === "found") {
    assert(result.canonicalId !== null, "canonicalId가 null");
  }
});

// ─── 최종 요약 ──────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
console.log(`결과: ${passed} PASS / ${failed} FAIL / ${passed + failed} 총`);

if (failed > 0) {
  console.log("\n⚠  FAIL 케이스가 있습니다. Phase 1 공통화 안전성을 확인하세요.");
} else {
  console.log("\n✅ 모든 케이스 PASS — shared taxonomy read layer 안전 확인.");
}

// ─── JSON 저장 (--json 옵션) ──────────────────────────────────────────────────

if (saveJson) {
  const outputDir = path.resolve(__dirname, "output");
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outputDir, `${timestamp}-taxonomy-smoke.json`);
  writeFileSync(outPath, JSON.stringify({
    runAt: new Date().toISOString(),
    runner: "run-taxonomy-read-layer-smoke.mjs",
    cases: results,
    stats: { passed, failed, total: passed + failed },
  }, null, 2), "utf-8");
  console.log(`\nJSON 저장됨: ${outPath}`);
}

if (failed > 0) process.exit(1);
