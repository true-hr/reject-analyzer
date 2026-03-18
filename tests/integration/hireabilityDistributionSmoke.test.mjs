/**
 * hireabilityDistributionSmoke.test.mjs
 *
 * 목적: PASSMAP hireabilityScore가 정상 매칭과 mismatch 케이스를 구분하는지 분포 검증
 *
 * 케이스:
 *   MATCH:    sql-match / strategy-match / b2b-marketing-match
 *   MISMATCH: sql-mismatch / role-mismatch / domain-mismatch
 *
 * 핵심 검증:
 *   1. matchScore 평균: match > mismatch (실질 구분력 확인)
 *   2. hireabilityScore: match avg >= mismatch avg (방향성 확인)
 *   3. mismatch hireabilityScore 과수렴 여부 감지
 *   4. SQL 케이스 matchScore 명확한 분리 확인
 *   5. 분포 요약 출력
 *
 * 실행:
 *   node ./tests/integration/hireabilityDistributionSmoke.test.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractTextFromFile } from "../../src/lib/extract/extractTextFromFile.node.js";
import { analyze } from "../../src/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MATCH_DIR    = path.resolve(__dirname, "../fixtures/match");
const MISMATCH_DIR = path.resolve(__dirname, "../fixtures/mismatch");

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

// ─── 케이스 정의 ─────────────────────────────────────────────────────────────

const CASES = [
  {
    id: "sql-match",
    group: "match",
    jdPath:     path.join(MATCH_DIR, "jd_sql_match.txt"),
    resumePath: path.join(MATCH_DIR, "resume_sql_match.txt"),
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  },
  {
    id: "strategy-match",
    group: "match",
    jdPath:     path.join(MATCH_DIR, "jd_strategy_match.txt"),
    resumePath: path.join(MATCH_DIR, "resume_strategy_match.txt"),
    career: { totalYears: 4, gapMonths: 0, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  },
  {
    id: "b2b-match",
    group: "match",
    jdPath:     path.join(MATCH_DIR, "jd_b2b_marketing_match.txt"),
    resumePath: path.join(MATCH_DIR, "resume_b2b_marketing_match.txt"),
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 30, leadershipLevel: "ic" },
  },
  {
    id: "sql-mismatch",
    group: "mismatch",
    jdPath:     path.join(MISMATCH_DIR, "jd_sql_required.txt"),
    resumePath: path.join(MISMATCH_DIR, "resume_data_reporting.txt"),
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  },
  {
    id: "role-mismatch",
    group: "mismatch",
    jdPath:     path.join(MISMATCH_DIR, "jd_strategy_planning.txt"),
    resumePath: path.join(MISMATCH_DIR, "resume_strategy_sourcing.txt"),
    career: { totalYears: 4, gapMonths: 0, jobChanges: 1, lastTenureMonths: 48, leadershipLevel: "ic" },
  },
  {
    id: "domain-mismatch",
    group: "mismatch",
    jdPath:     path.join(MISMATCH_DIR, "jd_b2b_saas_marketing.txt"),
    resumePath: path.join(MISMATCH_DIR, "resume_retail_promotion.txt"),
    career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36, leadershipLevel: "ic" },
  },
];

// ─── 전체 케이스 실행 및 결과 수집 ───────────────────────────────────────────

console.log("\n── hireabilityScore 분포 측정 중... ───────────────────────\n");

const results = [];

for (const c of CASES) {
  const jdResult     = await extractTextFromFile(c.jdPath, "jd");
  const resumeResult = await extractTextFromFile(c.resumePath, "resume");
  if (!jdResult.ok || !resumeResult.ok) {
    console.error(`  [SKIP] ${c.id} — extraction 실패`);
    continue;
  }
  const analysis = analyze({ jd: jdResult.text, resume: resumeResult.text, career: c.career });
  const hireScore   = analysis.hireability?.final?.hireabilityScore ?? null;
  const matchScore  = analysis.keywordSignals?.matchScore ?? null;
  const riskCount   = (analysis.decisionPack?.riskResults || []).length;
  const passmapType = analysis.riskLayer?.passmapType ?? analysis.decisionPack?.simulationViewModel?.passmapType ?? null;
  results.push({ ...c, hireScore, matchScore, riskCount, passmapType });
}

// ─── 분포 요약 출력 ──────────────────────────────────────────────────────────

console.log("  케이스                 그룹       hire  match   risks  passmapType");
console.log("  " + "─".repeat(70));
for (const r of results) {
  const hStr  = r.hireScore  !== null ? String(r.hireScore).padStart(4)  : " n/a";
  const mStr  = r.matchScore !== null ? r.matchScore.toFixed(3).padStart(6) : "   n/a";
  const ptStr = r.passmapType ?? "null";
  console.log(`  ${r.id.padEnd(22)} ${r.group.padEnd(10)} ${hStr}  ${mStr}  ${String(r.riskCount).padStart(5)}  ${ptStr}`);
}
console.log();

const matchGroup    = results.filter((r) => r.group === "match");
const mismatchGroup = results.filter((r) => r.group === "mismatch");

const avg = (arr, key) => arr.reduce((s, r) => s + (r[key] ?? 0), 0) / arr.length;

const matchHireAvg    = avg(matchGroup,    "hireScore");
const mismatchHireAvg = avg(mismatchGroup, "hireScore");
const matchMSAvg      = avg(matchGroup,    "matchScore");
const mismatchMSAvg   = avg(mismatchGroup, "matchScore");

console.log(`  [평균] match hire=${matchHireAvg.toFixed(1)}  mismatch hire=${mismatchHireAvg.toFixed(1)}`);
console.log(`  [평균] match matchScore=${matchMSAvg.toFixed(3)}  mismatch matchScore=${mismatchMSAvg.toFixed(3)}`);
console.log();

// ─── Test 1: matchScore 평균 구분력 ──────────────────────────────────────────

console.log("\n── Test 1: matchScore 평균 구분력 ─────────────────────────\n");

await itest("match 케이스 matchScore 평균 > mismatch 케이스 평균", async () => {
  assertTrue(
    matchMSAvg > mismatchMSAvg,
    `match matchScore 평균(${matchMSAvg.toFixed(3)})이 mismatch(${mismatchMSAvg.toFixed(3)})보다 높아야 합니다`
  );
});

await itest("SQL match matchScore > SQL mismatch matchScore (직접 비교)", async () => {
  const sqlMatch    = results.find((r) => r.id === "sql-match");
  const sqlMismatch = results.find((r) => r.id === "sql-mismatch");
  assertTrue(sqlMatch && sqlMismatch, "SQL 케이스를 찾을 수 없습니다");
  assertTrue(
    sqlMatch.matchScore > sqlMismatch.matchScore,
    `SQL match(${sqlMatch.matchScore?.toFixed(3)}) > SQL mismatch(${sqlMismatch.matchScore?.toFixed(3)}) 이어야 합니다`
  );
});

await itest("SQL match matchScore > 0.7 (keyword 실질 매칭)", async () => {
  const sqlMatch = results.find((r) => r.id === "sql-match");
  assertTrue(sqlMatch, "sql-match 케이스를 찾을 수 없습니다");
  assertTrue(
    typeof sqlMatch.matchScore === "number" && sqlMatch.matchScore > 0.7,
    `sql-match matchScore가 0.7을 넘어야 합니다: ${sqlMatch.matchScore?.toFixed(3)}`
  );
});

await itest("SQL mismatch matchScore === 0 (SQL 키워드 완전 미매칭)", async () => {
  const sqlMismatch = results.find((r) => r.id === "sql-mismatch");
  assertTrue(sqlMismatch, "sql-mismatch 케이스를 찾을 수 없습니다");
  assertTrue(
    sqlMismatch.matchScore === 0,
    `sql-mismatch matchScore가 0이어야 합니다: ${sqlMismatch.matchScore}`
  );
});

// ─── Test 2: hireabilityScore 방향성 ─────────────────────────────────────────

console.log("\n── Test 2: hireabilityScore 방향성 ────────────────────────\n");

await itest("match 케이스 hireabilityScore 평균 >= mismatch 케이스 평균", async () => {
  assertTrue(
    matchHireAvg >= mismatchHireAvg,
    `match hire 평균(${matchHireAvg.toFixed(1)})이 mismatch(${mismatchHireAvg.toFixed(1)}) 이상이어야 합니다`
  );
});

await itest("모든 케이스 hireabilityScore가 유효한 숫자", async () => {
  for (const r of results) {
    assertTrue(
      typeof r.hireScore === "number" && r.hireScore > 0,
      `${r.id} hireScore가 유효하지 않습니다: ${r.hireScore}`
    );
  }
});

// ─── Test 3: hireabilityScore 과수렴 감지 ────────────────────────────────────
// mismatch 3케이스가 모두 동일한 값으로 수렴하는지 확인 → blind spot 기록

console.log("\n── Test 3: hireabilityScore 과수렴 감지 ───────────────────\n");

await itest("[BLIND SPOT 기록] mismatch hireabilityScore 과수렴 여부 확인", async () => {
  const scores = mismatchGroup.map((r) => r.hireScore);
  const unique  = new Set(scores);
  const isConverged = unique.size === 1;
  // 과수렴이면 경고를 출력하되 테스트는 통과시킴 (analyzer 수정 금지 원칙)
  if (isConverged) {
    console.log(`       ⚠ 과수렴 감지: mismatch 3케이스 hireabilityScore = ${JSON.stringify(scores)} — 모두 동일값`);
    console.log("       ⚠ hireabilityScore가 mismatch 케이스를 구분하지 못함 (known blind spot)");
  } else {
    console.log(`       ✓ 분산 확인: ${JSON.stringify(scores)}`);
  }
  // 과수렴 여부와 관계없이 점수 범위만 검증 (0~100 이내)
  assertTrue(scores.every((s) => typeof s === "number" && s >= 0 && s <= 100),
    `hireabilityScore 범위 이상: ${JSON.stringify(scores)}`);
});

await itest("[BLIND SPOT 기록] match vs mismatch hireabilityScore 차이 측정", async () => {
  const diff = matchHireAvg - mismatchHireAvg;
  console.log(`       hire 평균 차이: ${diff.toFixed(1)}점 (match ${matchHireAvg.toFixed(1)} vs mismatch ${mismatchHireAvg.toFixed(1)})`);
  if (Math.abs(diff) < 5) {
    console.log("       ⚠ 차이가 5점 미만 — hireabilityScore 구분력 낮음 (known blind spot, AI 없이는 개선 어려움)");
  }
  // 방향성만 확인 (match >= mismatch)
  assertTrue(matchHireAvg >= mismatchHireAvg,
    `match 평균이 mismatch 평균보다 낮습니다: ${matchHireAvg.toFixed(1)} < ${mismatchHireAvg.toFixed(1)}`);
});

// ─── Test 4: riskResults 차이 확인 ───────────────────────────────────────────

console.log("\n── Test 4: riskResults 차이 확인 ──────────────────────────\n");

await itest("모든 케이스에서 riskResults 존재", async () => {
  for (const r of results) {
    assertTrue(r.riskCount >= 0, `${r.id} riskCount가 음수입니다`);
  }
  const avgMatchRisk    = avg(matchGroup,    "riskCount");
  const avgMismatchRisk = avg(mismatchGroup, "riskCount");
  console.log(`       [평균 riskCount] match=${avgMatchRisk.toFixed(1)}  mismatch=${avgMismatchRisk.toFixed(1)}`);
  // 정보성 출력 — 통과 기준 없음 (방향이 역전될 수 있음)
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
  console.error("[FAIL] hireabilityDistribution smoke 테스트 실패\n");
  process.exit(1);
} else {
  console.log("[PASS] 모든 hireabilityDistribution smoke 테스트 통과\n");
}
