/**
 * domainMismatchSmoke.test.mjs
 *
 * 목적: domain shift + negative-context mismatch에서 PASSMAP false accept 방지 검증
 *
 * 케이스:
 *   1. seniority mismatch — JD 5년+ 팀 리드 / resume 1.5년 운영 지원
 *   2. must-have missing (SQL) — JD SQL 필수 / resume 엑셀+협업 기반 (SQL 미언급)
 *   3. role mismatch — JD 경영전략 기획 / resume 전략소싱(구매)
 *   4. domain shift — JD B2B SaaS 마케팅 / resume 오프라인 리테일 프로모션
 *
 * 원칙: 정확한 점수 하드코딩 금지 — 방향성 검증 우선
 *
 * 실행:
 *   node ./tests/integration/domainMismatchSmoke.test.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractTextFromFile } from "../../src/lib/extract/extractTextFromFile.node.js";
import { analyze } from "../../src/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../fixtures/mismatch");

// ─── 러너 ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

async function itest(label, fn) {
  try {
    await fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`       ${e.message}`);
    failures.push({ label, reason: e.message });
    failed++;
  }
}

function assertTrue(val, msg) {
  if (!val) throw new Error(msg ?? "조건 실패");
}

async function extractPair(jdFile, resumeFile) {
  const jdResult = await extractTextFromFile(path.join(FIXTURE_DIR, jdFile), "jd");
  assertTrue(jdResult.ok, `JD extraction 실패: ${jdResult.error}`);
  const resumeResult = await extractTextFromFile(path.join(FIXTURE_DIR, resumeFile), "resume");
  assertTrue(resumeResult.ok, `Resume extraction 실패: ${resumeResult.error}`);
  return { jdText: jdResult.text, resumeText: resumeResult.text };
}

// ─── Test 1: seniority mismatch ───────────────────────────────────────────────

console.log("\n── Test 1: seniority mismatch ──────────────────────────────\n");

await itest("[seniority] experienceGap < 0 — JD 5년 vs resume 1.5년", async () => {
  const { jdText, resumeText } = await extractPair("jd_seniority_lead.txt", "resume_seniority_support.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 1.5, gapMonths: 0, jobChanges: 0, lastTenureMonths: 18, leadershipLevel: "ic" },
  });
  const cs = result.careerSignals;
  assertTrue(typeof cs.experienceGap === "number" && cs.experienceGap < 0,
    `experienceGap이 음수여야 합니다: ${cs.experienceGap}`);
});

await itest("[seniority] experienceLevelScore < 0.5 — 경력 미충족", async () => {
  const { jdText, resumeText } = await extractPair("jd_seniority_lead.txt", "resume_seniority_support.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 1.5, gapMonths: 0, jobChanges: 0, lastTenureMonths: 18, leadershipLevel: "ic" },
  });
  const score = result.careerSignals.experienceLevelScore;
  assertTrue(typeof score === "number" && score < 0.5,
    `experienceLevelScore가 0.5 미만이어야 합니다: ${score}`);
});

await itest("[seniority] riskResults 존재 — false accept 아님", async () => {
  const { jdText, resumeText } = await extractPair("jd_seniority_lead.txt", "resume_seniority_support.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 1.5, gapMonths: 0, jobChanges: 0, lastTenureMonths: 18, leadershipLevel: "ic" },
  });
  const rr = result.decisionPack?.riskResults || [];
  assertTrue(rr.length > 0, `riskResults가 비어 있습니다 — false accept 의심`);
});

// ─── Test 2: SQL must-have missing ────────────────────────────────────────────
// resume는 SQL을 언급하지 않고 "내부 데이터팀과 협업" 완곡 표현 사용
// → keyword false positive 없이 SQL이 missingKeywords에 잡혀야 함

console.log("\n── Test 2: SQL must-have missing ───────────────────────────\n");

await itest("[sql] jdCritical에 sql 포함 — JD 필수 항목 인식", async () => {
  const { jdText, resumeText } = await extractPair("jd_sql_required.txt", "resume_data_reporting.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });
  const criticals = (result.keywordSignals.jdCritical || []).map((k) => String(k).toLowerCase());
  assertTrue(criticals.some((k) => k.includes("sql")),
    `jdCritical에 sql이 없습니다: ${JSON.stringify(criticals)}`);
});

await itest("[sql] missingKeywords에 sql 포함 — keyword layer false positive 없음", async () => {
  const { jdText, resumeText } = await extractPair("jd_sql_required.txt", "resume_data_reporting.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });
  const missing = (result.keywordSignals.missingKeywords || []).map((k) => String(k).toLowerCase());
  assertTrue(missing.some((k) => k.includes("sql")),
    `missingKeywords에 sql이 없습니다 — keyword layer false positive 의심 (실제: ${JSON.stringify(missing)})`);
});

await itest("[sql] hireabilityScore < 60 — 스킬 미매칭 패널티", async () => {
  const { jdText, resumeText } = await extractPair("jd_sql_required.txt", "resume_data_reporting.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });
  const score = result.hireability?.final?.hireabilityScore;
  assertTrue(typeof score === "number" && score < 60,
    `hireabilityScore가 60 미만이어야 합니다: ${score}`);
});

await itest("[sql] riskResults에 MUST_HAVE_MISSING 계열 또는 CORE_COVERAGE 존재", async () => {
  const { jdText, resumeText } = await extractPair("jd_sql_required.txt", "resume_data_reporting.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });
  const rr = result.decisionPack?.riskResults || [];
  const hasRelevant = rr.some(
    (r) => r.id.includes("MUST_HAVE") || r.id.includes("CORE_COVERAGE") || r.id.includes("KEYWORD_ABSENCE")
  );
  assertTrue(hasRelevant,
    `MUST_HAVE/CORE_COVERAGE/KEYWORD_ABSENCE 계열 signal이 없습니다 (실제: ${rr.map((r) => r.id).join(", ")})`);
});

// ─── Test 3: role mismatch ────────────────────────────────────────────────────

console.log("\n── Test 3: role mismatch (전략기획 vs 전략소싱) ────────────\n");

await itest("[role] matchScore < 0.6 — 직무 비매칭", async () => {
  const { jdText, resumeText } = await extractPair("jd_strategy_planning.txt", "resume_strategy_sourcing.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 4, gapMonths: 0, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  });
  const ms = result.keywordSignals.matchScore;
  assertTrue(typeof ms === "number" && ms < 0.6,
    `matchScore가 0.6 미만이어야 합니다: ${ms}`);
});

await itest("[role] riskResults 존재 — false accept 아님", async () => {
  const { jdText, resumeText } = await extractPair("jd_strategy_planning.txt", "resume_strategy_sourcing.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 4, gapMonths: 0, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  });
  const rr = result.decisionPack?.riskResults || [];
  assertTrue(rr.length > 0, `riskResults가 비어 있습니다 — false accept 의심`);
});

// ─── Test 4: domain shift ─────────────────────────────────────────────────────

console.log("\n── Test 4: domain shift (B2B SaaS vs 오프라인 리테일) ──────\n");

await itest("[domain] matchScore < 0.7 — 도메인 비매칭", async () => {
  const { jdText, resumeText } = await extractPair("jd_b2b_saas_marketing.txt", "resume_retail_promotion.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });
  const ms = result.keywordSignals.matchScore;
  assertTrue(typeof ms === "number" && ms < 0.7,
    `matchScore가 0.7 미만이어야 합니다: ${ms}`);
});

await itest("[domain] riskResults 존재 — false accept 아님", async () => {
  const { jdText, resumeText } = await extractPair("jd_b2b_saas_marketing.txt", "resume_retail_promotion.txt");
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });
  const rr = result.decisionPack?.riskResults || [];
  assertTrue(rr.length > 0, `riskResults가 비어 있습니다 — false accept 의심`);
});

// ─── 결과 ─────────────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed} passed / ${failed} failed\n`);

if (failures.length > 0) {
  console.error("실패 목록:");
  for (const f of failures) {
    console.error(`  ✗ ${f.label}`);
    console.error(`    이유: ${f.reason}`);
  }
  console.log();
}

if (failed > 0) {
  console.error("[FAIL] domainMismatch smoke 테스트 실패\n");
  process.exit(1);
} else {
  console.log("[PASS] 모든 domainMismatch smoke 테스트 통과\n");
}
