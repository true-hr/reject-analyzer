/**
 * mismatchSmoke.test.mjs
 *
 * 목적: PASSMAP false accept 방지 — mismatch 케이스 방향성 검증
 *
 * 케이스:
 *   1. seniority 부족: JD 5년+, resume 1.5년 주니어
 *   2. must-have missing: JD SQL/Excel 필수, resume 프론트엔드 개발자
 *   3. role mismatch: JD 전략기획, resume 전략소싱
 *
 * 검증 원칙:
 *   - 정확한 점수 하드코딩 금지 — 방향성 검증 우선
 *   - risk signal / experienceGap / matchScore 방향 확인
 *   - false accept 탐지: 분석이 "아무 문제 없음"으로 내보내면 실패
 *
 * 실행 방법:
 *   node ./tests/integration/mismatchSmoke.test.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractTextFromFile } from "../../src/lib/extract/extractTextFromFile.node.js";
import { analyze } from "../../src/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../fixtures/extract");

// ─── 테스트 러너 ──────────────────────────────────────────────────────────────

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

function assertExists(val, name) {
  if (val === undefined || val === null) throw new Error(`${name}이(가) null/undefined`);
}

function assertRiskIdPresent(riskResults, targetId, context) {
  const found = (riskResults || []).some((r) => r.id === targetId);
  assertTrue(found, `riskResults에 ${targetId}가 없습니다 [${context}] (실제: ${JSON.stringify((riskResults || []).map((r) => r.id).slice(0, 5))})`);
}

function assertAnyRiskIdPresent(riskResults, ids, context) {
  const found = (riskResults || []).some((r) => ids.includes(r.id));
  assertTrue(found, `riskResults에 ${JSON.stringify(ids)} 중 하나도 없습니다 [${context}]`);
}

async function extractPair(jdFile, resumeFile) {
  const jdResult = await extractTextFromFile(path.join(FIXTURE_DIR, jdFile), "jd");
  assertTrue(jdResult.ok, `JD extraction 실패: ${jdResult.error}`);
  const resumeResult = await extractTextFromFile(path.join(FIXTURE_DIR, resumeFile), "resume");
  assertTrue(resumeResult.ok, `Resume extraction 실패: ${resumeResult.error}`);
  return { jdText: jdResult.text, resumeText: resumeResult.text };
}

// ─── 케이스 1: seniority 부족 ─────────────────────────────────────────────────
// JD: 5년+ 시니어 필수 / Resume: 1.5년 주니어

console.log("\n── 케이스 1: seniority 부족 ────────────────────────────────\n");

await itest("[seniority] extraction ok", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_seniority.txt",
    "resume_mismatch_seniority.txt"
  );
  assertTrue(jdText.length > 50, "JD 텍스트가 너무 짧습니다");
  assertTrue(resumeText.length > 50, "Resume 텍스트가 너무 짧습니다");
});

await itest("[seniority] careerSignals.experienceGap 음수 — 경력 부족 감지", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_seniority.txt",
    "resume_mismatch_seniority.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 1.5, gapMonths: 0, jobChanges: 0, lastTenureMonths: 18, leadershipLevel: "ic" },
  });

  const cs = result.careerSignals;
  assertExists(cs, "careerSignals");
  assertTrue(
    typeof cs.experienceGap === "number",
    `experienceGap이 숫자가 아닙니다: ${JSON.stringify(cs)}`
  );
  assertTrue(
    cs.experienceGap < 0,
    `경력 1.5년 vs JD 5년 기준 experienceGap이 음수여야 합니다: ${cs.experienceGap}`
  );
});

await itest("[seniority] experienceLevelScore 낮음 (< 0.5) — 시니어 요건 미충족", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_seniority.txt",
    "resume_mismatch_seniority.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 1.5, gapMonths: 0, jobChanges: 0, lastTenureMonths: 18, leadershipLevel: "ic" },
  });

  const cs = result.careerSignals;
  assertTrue(
    typeof cs.experienceLevelScore === "number" && cs.experienceLevelScore < 0.5,
    `experienceLevelScore가 0.5 미만이어야 합니다: ${cs.experienceLevelScore}`
  );
});

await itest("[seniority] risk signal 존재 — analyze가 문제 없음으로 내보내지 않음", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_seniority.txt",
    "resume_mismatch_seniority.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 1.5, gapMonths: 0, jobChanges: 0, lastTenureMonths: 18, leadershipLevel: "ic" },
  });

  const riskResults = result.decisionPack?.riskResults || [];
  assertTrue(riskResults.length > 0, "riskResults가 비어 있습니다 — false accept 의심");
  // 경력/스킬 관련 risk signal이 적어도 하나는 존재해야 함
  const hasRelevantRisk = riskResults.some(
    (r) => r.id.startsWith("ROLE_SKILL__") || r.id.startsWith("EXP__") || r.id.startsWith("CAREER__")
  );
  assertTrue(hasRelevantRisk, `경력/스킬 관련 risk signal이 없습니다 (실제 ids: ${riskResults.map((r) => r.id).join(", ")})`);
});

// ─── 케이스 2: must-have missing (SQL 미보유) ─────────────────────────────────
// JD: SQL 필수 (명시) / Resume: SQL 사용 경험 없음 (프론트엔드)

console.log("\n── 케이스 2: must-have missing (SQL 미보유) ────────────────\n");

await itest("[must-have] extraction ok", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_musthave.txt",
    "resume_mismatch_musthave.txt"
  );
  assertTrue(jdText.includes("SQL"), "JD 텍스트에 SQL이 없습니다");
  assertTrue(resumeText.length > 50, "Resume 텍스트가 너무 짧습니다");
});

await itest("[must-have] jdCritical에 SQL 포함 — JD 필수 항목 인식", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_musthave.txt",
    "resume_mismatch_musthave.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });

  const ks = result.keywordSignals;
  assertExists(ks, "keywordSignals");
  const criticals = (ks.jdCritical || []).map((k) => String(k).toLowerCase());
  assertTrue(
    criticals.some((k) => k.includes("sql")),
    `jdCritical에 SQL이 없습니다: ${JSON.stringify(criticals)}`
  );
});

await itest("[must-have] ROLE_SKILL__MUST_HAVE_MISSING risk signal 존재", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_musthave.txt",
    "resume_mismatch_musthave.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });

  const riskResults = result.decisionPack?.riskResults || [];
  assertRiskIdPresent(riskResults, "ROLE_SKILL__MUST_HAVE_MISSING", "must-have missing");
});

await itest("[must-have] hireabilityScore 낮음 (< 60) — 스킬 미매칭 패널티", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_musthave.txt",
    "resume_mismatch_musthave.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });

  const score = result.hireability?.final?.hireabilityScore;
  assertTrue(
    typeof score === "number" && score < 60,
    `hireabilityScore가 60 미만이어야 합니다: ${score}`
  );
});

// NOTE: keyword matchScore는 resume 텍스트에 "SQL 경험 없음" 형태로 SQL이 등장해
// 표면적 keyword match가 높게 나올 수 있음 (known false positive at keyword layer).
// risk layer(ROLE_SKILL__MUST_HAVE_MISSING)가 이를 보완함. 이 gap을 아래에 기록.
await itest("[must-have] false accept 탐지 — keyword layer false positive 주석 확인", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_musthave.txt",
    "resume_mismatch_musthave.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  });

  const ks = result.keywordSignals;
  // keyword matchScore는 부정 문맥 포함으로 misleadingly 높을 수 있음
  // → risk layer가 ROLE_SKILL__MUST_HAVE_MISSING으로 보완하는지 확인
  const riskResults = result.decisionPack?.riskResults || [];
  const hasMustHaveRisk = riskResults.some((r) => r.id === "ROLE_SKILL__MUST_HAVE_MISSING");
  // matchScore가 높아도(false positive) risk signal이 존재해야 함
  assertTrue(
    hasMustHaveRisk,
    `keyword matchScore=${ks.matchScore?.toFixed(2)} 이지만 ROLE_SKILL__MUST_HAVE_MISSING risk가 없습니다 — false accept`
  );
});

// ─── 케이스 3: role mismatch (전략기획 vs 전략소싱) ──────────────────────────
// JD: 경영전략/기획 / Resume: 전략소싱(구매)

console.log("\n── 케이스 3: role mismatch (전략기획 vs 전략소싱) ──────────\n");

await itest("[role mismatch] extraction ok", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_role.txt",
    "resume_mismatch_role.txt"
  );
  assertTrue(jdText.includes("전략기획") || jdText.includes("경영전략"), "JD 텍스트에 전략기획 키워드 없음");
  assertTrue(resumeText.includes("소싱") || resumeText.includes("구매"), "Resume 텍스트에 소싱/구매 키워드 없음");
});

await itest("[role mismatch] keywordSignals.matchScore 낮음 (< 0.6) — 직무 비매칭", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_role.txt",
    "resume_mismatch_role.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 5, gapMonths: 1, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  });

  const ks = result.keywordSignals;
  assertExists(ks, "keywordSignals");
  assertTrue(
    typeof ks.matchScore === "number" && ks.matchScore < 0.6,
    `전략기획 vs 전략소싱 matchScore가 0.6 미만이어야 합니다: ${ks.matchScore}`
  );
});

await itest("[role mismatch] ROLE_SKILL__ 계열 risk signal 존재", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_role.txt",
    "resume_mismatch_role.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 5, gapMonths: 1, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  });

  const riskResults = result.decisionPack?.riskResults || [];
  assertTrue(riskResults.length > 0, "riskResults가 비어 있습니다 — false accept 의심");

  const hasRoleSkillRisk = riskResults.some((r) => r.id.startsWith("ROLE_SKILL__"));
  assertTrue(
    hasRoleSkillRisk,
    `ROLE_SKILL__ 계열 signal이 없습니다 (실제 ids: ${riskResults.map((r) => r.id).join(", ")})`
  );
});

await itest("[role mismatch] false accept 방지 — risk signal 합산 존재", async () => {
  const { jdText, resumeText } = await extractPair(
    "jd_mismatch_role.txt",
    "resume_mismatch_role.txt"
  );
  const result = analyze({
    jd: jdText,
    resume: resumeText,
    career: { totalYears: 5, gapMonths: 1, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  });

  const riskResults = result.decisionPack?.riskResults || [];
  // 방향성: mismatch 케이스에서 risk signal이 최소 2개 이상 존재해야 "아무 문제 없음" 판정이 아님
  assertTrue(
    riskResults.length >= 2,
    `risk signal이 2개 미만입니다: ${riskResults.length} — false accept 의심`
  );
});

// ─── 결과 출력 ─────────────────────────────────────────────────────────────────

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
  console.error("[FAIL] mismatch smoke 테스트 실패\n");
  process.exit(1);
} else {
  console.log("[PASS] 모든 mismatch smoke 테스트 통과\n");
}
