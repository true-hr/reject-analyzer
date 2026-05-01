/**
 * run-taxonomy-context-pack-smoke.mjs
 *
 * Phase 3A Shared Taxonomy Context Pack 검증 smoke runner.
 * production 코드 수정 없이 read-only 실행만 수행.
 *
 * 검증 목표:
 *   1. buildTaxonomyContextPack이 정상 item에서 완전한 pack을 반환하는지 확인
 *   2. raw label fallback 케이스가 안전하게 처리되는지 확인
 *   3. unknown id에서 throw 없이 graceful fallback이 동작하는지 확인
 *   4. missing context(null input)에서 throw 없이 기본값을 반환하는지 확인
 *   5. 금지 출력 필드(score, risk, gate, band 등)가 없는지 확인
 *   6. 기존 buildJobContext / buildIndustryContext 결과와 충돌 없는지 확인
 *
 * 실행 방법:
 *   node scripts/regression/run-taxonomy-context-pack-smoke.mjs
 *   node scripts/regression/run-taxonomy-context-pack-smoke.mjs --json
 */

import { buildTaxonomyContextPack } from "../../src/lib/shared/taxonomy/buildTaxonomyContextPack.js";
import { buildJobContext } from "../../src/lib/adapters/buildJobContext.js";
import { buildIndustryContext } from "../../src/lib/adapters/buildIndustryContext.js";
import { getJobOntologyItemById } from "../../src/data/job/jobOntology.index.js";
import { getIndustryRegistryItemById } from "../../src/data/industry/industryRegistry.index.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const saveJson = args.includes("--json");

// ─── 금지 출력 필드 목록 ────────────────────────────────────────────────────────

const FORBIDDEN_OUTPUT_KEYS = [
  "score", "rawScore", "risk", "riskLevel", "gate", "band",
  "recommendation", "cta", "pass", "fail",
  "suitability", "transitionDifficulty", "compositeBand",
  "rejectionReason",
];

function checkForbiddenFields(obj, prefix = "") {
  const violations = [];
  if (!obj || typeof obj !== "object") return violations;
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_OUTPUT_KEYS.some((f) => lowerKey === f.toLowerCase())) {
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

// ─── Case 1: 유효한 job + industry exact match ───────────────────────────────

console.log("\n── Case 1: exact match — 브랜드마케팅 / FMCG ──\n");

const JOB_ID_BRAND = "JOB_MARKETING_BRAND_MARKETING";
const IND_ID_FMCG = "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_BRAND_FMCG";

const jobItem = getJobOntologyItemById(JOB_ID_BRAND);
const industryItem = getIndustryRegistryItemById(IND_ID_FMCG);

test("브랜드마케팅 jobItem 조회 성공", () => {
  assert(jobItem !== null && jobItem !== undefined, `jobItem not found for ${JOB_ID_BRAND}`);
});

test("FMCG industryItem 조회 성공", () => {
  assert(industryItem !== null && industryItem !== undefined, `industryItem not found for ${IND_ID_FMCG}`);
});

test("buildTaxonomyContextPack 정상 반환 — throw 없음", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assert(pack !== null && typeof pack === "object", "pack should be object");
  assert(typeof pack.jobContext === "object", "pack.jobContext should exist");
  assert(typeof pack.industryContext === "object", "pack.industryContext should exist");
  assert(typeof pack.meta === "object", "pack.meta should exist");
});

test("jobContext.id — 기존 adapter와 일치", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  const directCtx = buildJobContext(jobItem);
  assertEqual(pack.jobContext.id, directCtx.id, "jobContext.id");
});

test("jobContext.displayLabel — 기존 adapter와 일치", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  const directCtx = buildJobContext(jobItem);
  assertEqual(pack.jobContext.displayLabel, directCtx.displayLabel, "jobContext.displayLabel");
});

test("jobContext.roleSummary — families[0].summaryTemplate 반영", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assert(
    pack.jobContext.roleSummary === null ||
    (typeof pack.jobContext.roleSummary === "string" && pack.jobContext.roleSummary.length > 0),
    "roleSummary should be null or non-empty string"
  );
});

test("industryContext.id — 기존 adapter와 일치", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  const directCtx = buildIndustryContext(industryItem);
  assertEqual(pack.industryContext.id, directCtx.id, "industryContext.id");
});

test("industryContext.displayLabel — 기존 adapter와 일치", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  const directCtx = buildIndustryContext(industryItem);
  assertEqual(pack.industryContext.displayLabel, directCtx.displayLabel, "industryContext.displayLabel");
});

test("industryContext.valueChain — 배열 반환", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assert(Array.isArray(pack.industryContext.valueChain), "valueChain should be array");
});

test("industryContext.customerContext — null이 아닌 경우 string", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assert(
    pack.industryContext.customerContext === null ||
    typeof pack.industryContext.customerContext === "string",
    "customerContext should be null or string"
  );
});

test("industryContext.purchaseContext — 배열 반환", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assert(Array.isArray(pack.industryContext.purchaseContext), "purchaseContext should be array");
});

test("meta.confidence.job — found", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assertEqual(pack.meta.confidence.job, "found", "meta.confidence.job");
});

test("meta.confidence.industry — found", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assertEqual(pack.meta.confidence.industry, "found", "meta.confidence.industry");
});

test("금지 출력 필드 없음 — exact match", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  const violations = checkForbiddenFields(pack, "pack");
  assert(violations.length === 0, `금지 필드 발견: ${violations.join(", ")}`);
});

// ─── Case 2: raw label fallback (no item) ────────────────────────────────────

console.log("\n── Case 2: raw label fallback ──\n");

test("jobItem=null + rawJobLabel → displayLabel fallback", () => {
  const pack = buildTaxonomyContextPack({
    jobItem: null,
    industryItem: null,
    rawJobLabel: "데이터분석가",
    rawIndustryLabel: "IT/소프트웨어",
  });
  assert(typeof pack === "object", "pack should be object");
  assert(pack.meta.confidence.job === "not_found", "confidence.job should be not_found");
  assert(pack.meta.confidence.industry === "not_found", "confidence.industry should be not_found");
  assert(
    pack.jobContext.displayLabel === "데이터분석가" ||
    pack.jobContext.displayLabel === "미확인",
    `unexpected displayLabel: ${pack.jobContext.displayLabel}`
  );
});

test("raw label fallback — throw 없음", () => {
  let threw = false;
  try {
    buildTaxonomyContextPack({
      jobItem: null,
      industryItem: null,
      rawJobLabel: "알 수 없는 직무",
      rawIndustryLabel: "알 수 없는 산업",
    });
  } catch {
    threw = true;
  }
  assert(!threw, "raw label fallback should not throw");
});

test("raw label fallback — 금지 출력 필드 없음", () => {
  const pack = buildTaxonomyContextPack({
    jobItem: null,
    industryItem: null,
    rawJobLabel: "데이터분석가",
    rawIndustryLabel: "IT",
  });
  const violations = checkForbiddenFields(pack, "pack");
  assert(violations.length === 0, `금지 필드 발견: ${violations.join(", ")}`);
});

// ─── Case 3: unknown id fallback (graceful) ──────────────────────────────────

console.log("\n── Case 3: unknown id fallback ──\n");

test("unknown jobId → getJobOntologyItemById returns null — graceful", () => {
  const unknownItem = getJobOntologyItemById("JOB_NONEXISTENT_ID_9999");
  const pack = buildTaxonomyContextPack({ jobItem: unknownItem });
  assert(typeof pack === "object", "pack should be object");
  assert(pack.meta.confidence.job === "not_found", "confidence.job should be not_found for unknown");
});

test("unknown industryId → graceful fallback", () => {
  const unknownItem = getIndustryRegistryItemById("IND_NONEXISTENT_ID_9999");
  const pack = buildTaxonomyContextPack({ industryItem: unknownItem });
  assert(typeof pack === "object", "pack should be object");
  assert(pack.meta.confidence.industry === "not_found", "confidence.industry should be not_found");
});

test("unknown ids — 금지 출력 필드 없음", () => {
  const pack = buildTaxonomyContextPack({
    jobItem: getJobOntologyItemById("JOB_UNKNOWN_9999"),
    industryItem: getIndustryRegistryItemById("IND_UNKNOWN_9999"),
  });
  const violations = checkForbiddenFields(pack, "pack");
  assert(violations.length === 0, `금지 필드 발견: ${violations.join(", ")}`);
});

// ─── Case 4: missing context (null input) ────────────────────────────────────

console.log("\n── Case 4: missing context (null inputs) ──\n");

test("null inputs → throw 없이 기본값 반환", () => {
  let threw = false;
  let pack = null;
  try {
    pack = buildTaxonomyContextPack({ jobItem: null, industryItem: null });
  } catch {
    threw = true;
  }
  assert(!threw, "null inputs should not throw");
  assert(typeof pack === "object", "pack should be object");
});

test("null inputs → jobContext.displayLabel = '미확인'", () => {
  const pack = buildTaxonomyContextPack({ jobItem: null, industryItem: null });
  assertEqual(pack.jobContext.displayLabel, "미확인", "null job displayLabel");
});

test("null inputs → industryContext.displayLabel = '미확인'", () => {
  const pack = buildTaxonomyContextPack({ jobItem: null, industryItem: null });
  assertEqual(pack.industryContext.displayLabel, "미확인", "null industry displayLabel");
});

test("null inputs — warnings 포함", () => {
  const pack = buildTaxonomyContextPack({ jobItem: null, industryItem: null });
  assert(pack.meta.warnings.length > 0, "meta.warnings should be non-empty for null inputs");
});

test("no-arg call → throw 없음", () => {
  let threw = false;
  try {
    buildTaxonomyContextPack();
  } catch {
    threw = true;
  }
  assert(!threw, "no-arg call should not throw");
});

// ─── Case 5: source metadata 전달 ────────────────────────────────────────────

console.log("\n── Case 5: source metadata ──\n");

test("source 파라미터 → meta.source에 반영", () => {
  const pack = buildTaxonomyContextPack({
    jobItem,
    industryItem,
    source: "newgrad_flow",
  });
  assertEqual(pack.meta.source, "newgrad_flow", "meta.source");
});

test("source 생략 → meta.source = null", () => {
  const pack = buildTaxonomyContextPack({ jobItem, industryItem });
  assertEqual(pack.meta.source, null, "meta.source default");
});

// ─── 결과 요약 ────────────────────────────────────────────────────────────────

console.log("\n────────────────────────────────────────────────────────────");
console.log(`결과: ${passed} PASS / ${failed} FAIL / ${passed + failed} 총`);
console.log("────────────────────────────────────────────────────────────");

if (saveJson) {
  try {
    mkdirSync(path.join(__dirname, "output"), { recursive: true });
    const outPath = path.join(__dirname, "output", "taxonomy-context-pack-smoke.json");
    writeFileSync(outPath, JSON.stringify({ passed, failed, results }, null, 2), "utf8");
    console.log(`\nJSON 저장: ${outPath}`);
  } catch (e) {
    console.warn(`JSON 저장 실패: ${e.message}`);
  }
}

if (failed > 0) {
  console.error("\n❌ 일부 케이스 FAIL — Phase 3A context pack 계약 위반 의심");
  process.exit(1);
} else {
  console.log("\n✅ 모든 케이스 PASS — Phase 3A taxonomy context pack 안전 확인.");
  process.exit(0);
}
